-- ============================================================================
-- LUMINA OS - FIX MIGRATION (para banco com dados existentes)
-- Data: 21 de Março de 2026
-- Status: Safe para rodar em banco com dados
-- Nota: Essa migração PULA o que já existe
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 1: ADD MISSING COLUMNS (SAFE - IF NOT EXISTS)
-- ============================================================================

-- Clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS technical_notes TEXT;
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS no_show_count INTEGER DEFAULT 0;
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS preferred_staff_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL;
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Appointments table
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(20);
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS recurrence_count INTEGER;
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS parent_appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE;

-- Units table
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS about TEXT;
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS min_booking_notice_hours INTEGER DEFAULT 0;
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS max_advance_booking_days INTEGER DEFAULT 60;
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER DEFAULT 0;
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS allow_any_staff BOOLEAN DEFAULT true;

-- Services table
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- unit_gallery table - CREATE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.unit_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add service_id column IF it doesn't exist (for backward compatibility)
ALTER TABLE public.unit_gallery
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE CASCADE;

-- deliveries table - CREATE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_address TEXT NOT NULL,
  customer_lat NUMERIC NOT NULL,
  customer_lon NUMERIC NOT NULL,
  driver_lat NUMERIC,
  driver_lon NUMERIC,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'en_route', 'arrived', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PARTE 2: CREATE INDEXES SAFELY
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_clients_preferred_staff 
  ON public.clients(preferred_staff_id);

CREATE INDEX IF NOT EXISTS idx_clients_tags 
  ON public.clients USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_appointments_parent_id 
  ON public.appointments(parent_appointment_id);

CREATE INDEX IF NOT EXISTS idx_appointments_recurrence
  ON public.appointments(unit_id, recurrence_type);

CREATE INDEX IF NOT EXISTS idx_unit_gallery_service_id 
  ON public.unit_gallery(service_id);

CREATE INDEX IF NOT EXISTS idx_unit_gallery_order 
  ON public.unit_gallery(unit_id, display_order);

-- Deliveries indexes
CREATE INDEX IF NOT EXISTS idx_deliveries_appointment_id 
  ON public.deliveries(appointment_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_unit_id 
  ON public.deliveries(unit_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_status 
  ON public.deliveries(status);

CREATE INDEX IF NOT EXISTS idx_deliveries_created_at 
  ON public.deliveries(created_at DESC);

-- ============================================================================
-- PARTE 3: CREATE FUNCTIONS AND TRIGGERS (if not exist)
-- ============================================================================

-- Create update_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create or replace trigger for unit_gallery updated_at
DROP TRIGGER IF EXISTS update_unit_gallery_updated_at ON public.unit_gallery;
CREATE TRIGGER update_unit_gallery_updated_at 
  BEFORE UPDATE ON public.unit_gallery 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Create or replace trigger for deliveries updated_at
DROP TRIGGER IF EXISTS update_deliveries_updated_at ON public.deliveries;
CREATE TRIGGER update_deliveries_updated_at 
  BEFORE UPDATE ON public.deliveries 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- PARTE 4: ENABLE RLS (safe if already enabled)
-- ============================================================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DONE! Migration segura para banco com dados
-- ============================================================================

COMMIT;

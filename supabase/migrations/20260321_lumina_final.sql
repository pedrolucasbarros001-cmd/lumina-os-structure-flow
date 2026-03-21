-- LUMINA OS - MIGRATION (Tested)
-- Data: 21 de Março de 2026

BEGIN;

-- Add clients columns
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS technical_notes TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS no_show_count INTEGER DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS preferred_staff_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add appointments columns  
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(20);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS recurrence_count INTEGER;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS parent_appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE;

-- Add units columns
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS about TEXT;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS min_booking_notice_hours INTEGER DEFAULT 0;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS max_advance_booking_days INTEGER DEFAULT 60;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER DEFAULT 0;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS allow_any_staff BOOLEAN DEFAULT true;

-- Add services columns
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create unit_gallery if not exists
CREATE TABLE IF NOT EXISTS public.unit_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create deliveries if not exists
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
  status VARCHAR(50) DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unit_gallery service_id column
ALTER TABLE public.unit_gallery ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_preferred_staff ON public.clients(preferred_staff_id);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON public.clients USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_appointments_parent_id ON public.appointments(parent_appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_recurrence ON public.appointments(unit_id, recurrence_type);
CREATE INDEX IF NOT EXISTS idx_unit_gallery_unit_id ON public.unit_gallery(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_gallery_service_id ON public.unit_gallery(service_id);
CREATE INDEX IF NOT EXISTS idx_unit_gallery_order ON public.unit_gallery(unit_id, display_order);
CREATE INDEX IF NOT EXISTS idx_deliveries_appointment_id ON public.deliveries(appointment_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_unit_id ON public.deliveries(unit_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

COMMIT;

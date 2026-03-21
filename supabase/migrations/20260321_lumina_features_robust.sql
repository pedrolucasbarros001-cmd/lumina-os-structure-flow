-- ============================================================================
-- LUMINA OS - ROBUST MIGRATION (with error handling)
-- Status: Production-ready with DO blocks for safety
-- Date: 2026-03-21
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Add columns to clients table safely
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'birthday'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN birthday DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN notes TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'technical_notes'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN technical_notes TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'no_show_count'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN no_show_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'preferred_staff_id'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN preferred_staff_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Add columns to appointments table safely
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'internal_notes'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN internal_notes TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'recurrence_type'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN recurrence_type VARCHAR(20);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'recurrence_count'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN recurrence_count INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'parent_appointment_id'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN parent_appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Add columns to units table safely
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'units' AND column_name = 'about'
  ) THEN
    ALTER TABLE public.units ADD COLUMN about TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'units' AND column_name = 'instagram_url'
  ) THEN
    ALTER TABLE public.units ADD COLUMN instagram_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'units' AND column_name = 'cancellation_policy'
  ) THEN
    ALTER TABLE public.units ADD COLUMN cancellation_policy TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'units' AND column_name = 'min_booking_notice_hours'
  ) THEN
    ALTER TABLE public.units ADD COLUMN min_booking_notice_hours INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'units' AND column_name = 'max_advance_booking_days'
  ) THEN
    ALTER TABLE public.units ADD COLUMN max_advance_booking_days INTEGER DEFAULT 60;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'units' AND column_name = 'buffer_minutes'
  ) THEN
    ALTER TABLE public.units ADD COLUMN buffer_minutes INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'units' AND column_name = 'allow_any_staff'
  ) THEN
    ALTER TABLE public.units ADD COLUMN allow_any_staff BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Add columns to services table safely
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'category'
  ) THEN
    ALTER TABLE public.services ADD COLUMN category TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.services ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Create indexes safely
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_appointments_parent_id 
  ON public.appointments(parent_appointment_id);

CREATE INDEX IF NOT EXISTS idx_appointments_recurrence
  ON public.appointments(unit_id, recurrence_type);

CREATE INDEX IF NOT EXISTS idx_clients_preferred_staff
  ON public.clients(preferred_staff_id);

CREATE INDEX IF NOT EXISTS idx_clients_tags
  ON public.clients USING GIN(tags);

-- ============================================================================
-- STEP 6: Handle unit_gallery table safely
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'unit_gallery' AND column_name = 'service_id'
  ) THEN
    ALTER TABLE public.unit_gallery ADD COLUMN service_id UUID REFERENCES public.services(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_unit_gallery_unit_id 
  ON public.unit_gallery(unit_id);

CREATE INDEX IF NOT EXISTS idx_unit_gallery_service_id 
  ON public.unit_gallery(service_id);

CREATE INDEX IF NOT EXISTS idx_unit_gallery_order 
  ON public.unit_gallery(unit_id, display_order);

-- ============================================================================
-- STEP 7: Ensure deliveries table indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_deliveries_appointment_id 
  ON public.deliveries(appointment_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_unit_id 
  ON public.deliveries(unit_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_status 
  ON public.deliveries(status);

CREATE INDEX IF NOT EXISTS idx_deliveries_created_at 
  ON public.deliveries(created_at DESC);

COMMIT;

-- ============================================================================
-- DONE! Migration is production-ready
-- ============================================================================

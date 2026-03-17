-- Create deliveries table
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_address TEXT NOT NULL,
  customer_lat NUMERIC NOT NULL,
  customer_lon NUMERIC NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'en_route', 'arrived', 'completed', 'cancelled')),
  driver_lat NUMERIC,
  driver_lon NUMERIC,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deliveries_unit_id ON public.deliveries(unit_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_appointment_id ON public.deliveries(appointment_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON public.deliveries(created_at DESC);

-- Enable RLS
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Owner can see all deliveries for their unit
CREATE POLICY "owner_view_unit_deliveries" ON public.deliveries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.units
      WHERE id = unit_id AND owner_id = auth.uid()
    )
  );

-- RLS Policy: Service role can insert (for API)
CREATE POLICY "service_role_manage_deliveries" ON public.deliveries
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Public can view delivery by ID (for tracking link - no auth needed)
-- This is done in the app layer by checking the delivery ID matches the appointment

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_deliveries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_deliveries_updated_at_trigger ON public.deliveries;
CREATE TRIGGER update_deliveries_updated_at_trigger
BEFORE UPDATE ON public.deliveries
FOR EACH ROW
EXECUTE FUNCTION public.update_deliveries_updated_at();

-- Create function to create delivery from appointment
CREATE OR REPLACE FUNCTION public.create_delivery_from_appointment(
  p_appointment_id UUID,
  p_customer_name VARCHAR,
  p_customer_phone VARCHAR,
  p_customer_address TEXT,
  p_customer_lat NUMERIC,
  p_customer_lon NUMERIC
)
RETURNS UUID AS $$
DECLARE
  v_delivery_id UUID;
  v_unit_id UUID;
BEGIN
  -- Get unit_id from appointment
  SELECT unit_id INTO v_unit_id
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF v_unit_id IS NULL THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  -- Create delivery
  INSERT INTO public.deliveries (
    appointment_id,
    unit_id,
    customer_name,
    customer_phone,
    customer_address,
    customer_lat,
    customer_lon
  ) VALUES (
    p_appointment_id,
    v_unit_id,
    p_customer_name,
    p_customer_phone,
    p_customer_address,
    p_customer_lat,
    p_customer_lon
  )
  RETURNING id INTO v_delivery_id;

  RETURN v_delivery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "anyone_can_create_deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "anyone_can_view_deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "owner_update_deliveries" ON public.deliveries;

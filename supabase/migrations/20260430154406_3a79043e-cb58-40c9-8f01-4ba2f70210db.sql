-- Add missing columns to deliveries
ALTER TABLE public.deliveries 
  ADD COLUMN IF NOT EXISTS customer_address text,
  ADD COLUMN IF NOT EXISTS unit_id uuid,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Enable RLS (already enabled but ensure)
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to recreate properly
DROP POLICY IF EXISTS "Public can view delivery by id" ON public.deliveries;
DROP POLICY IF EXISTS "Company members can manage deliveries" ON public.deliveries;

-- Public can view any delivery (for tracking page)
CREATE POLICY "Public can view delivery by id"
  ON public.deliveries FOR SELECT
  TO anon, authenticated
  USING (true);

-- Company members can manage deliveries for their unit
CREATE POLICY "Company members can manage deliveries"
  ON public.deliveries FOR ALL
  TO authenticated
  USING (unit_id IS NULL OR is_company_member(unit_id))
  WITH CHECK (unit_id IS NULL OR is_company_member(unit_id));
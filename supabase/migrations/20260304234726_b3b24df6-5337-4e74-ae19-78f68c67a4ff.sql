
-- Fix 1: Set search_path on update_updated_at function
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

-- Fix 2: Replace permissive anon INSERT policy on appointments with validated one
DROP POLICY IF EXISTS "Anyone can create appointments (public booking)" ON public.appointments;
CREATE POLICY "Public can create appointments for published units"
  ON public.appointments FOR INSERT
  TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND is_published = true));

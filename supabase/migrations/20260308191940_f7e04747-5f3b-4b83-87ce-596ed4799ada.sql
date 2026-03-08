-- Fix: Change public appointment insert policy from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Public can create appointments for published units" ON public.appointments;

CREATE POLICY "Public can create appointments for published units"
ON public.appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.units
    WHERE units.id = appointments.unit_id
    AND units.is_published = true
  )
);
-- Allow a unit owner to insert membership rows for their own unit
-- (needed for onboarding bootstrap and owner member management).
CREATE POLICY "Unit owners can create company members by ownership"
ON public.company_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.units u
    WHERE u.id = company_members.company_id
      AND u.owner_id = auth.uid()
  )
);
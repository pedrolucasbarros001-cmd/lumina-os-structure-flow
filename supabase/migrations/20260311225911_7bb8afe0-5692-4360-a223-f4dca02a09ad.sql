-- Allow authenticated company members (staff/reception) to work inside their assigned unit
-- while preserving owner permissions.

-- Units: members can view the unit they belong to
CREATE POLICY "Company members can view their units"
ON public.units
FOR SELECT
TO authenticated
USING (
  auth.uid() = owner_id
  OR public.is_company_member(id)
);

-- Services: members can read active catalog internally
CREATE POLICY "Company members can view services"
ON public.services
FOR SELECT
TO authenticated
USING (public.is_company_member(unit_id));

-- Team members: members can view team roster
CREATE POLICY "Company members can view team members"
ON public.team_members
FOR SELECT
TO authenticated
USING (public.is_company_member(unit_id));

-- Team member services: members can view skills mapping
CREATE POLICY "Company members can view team member services"
ON public.team_member_services
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.id = team_member_services.team_member_id
      AND public.is_company_member(tm.unit_id)
  )
);

-- Clients: members can read/create/update clients in their unit
CREATE POLICY "Company members can view clients"
ON public.clients
FOR SELECT
TO authenticated
USING (public.is_company_member(unit_id));

CREATE POLICY "Company members can create clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (public.is_company_member(unit_id));

CREATE POLICY "Company members can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (public.is_company_member(unit_id))
WITH CHECK (public.is_company_member(unit_id));

-- Appointments: members can read/create/update appointments in their unit
CREATE POLICY "Company members can view appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (public.is_company_member(unit_id));

CREATE POLICY "Company members can create appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (public.is_company_member(unit_id));

CREATE POLICY "Company members can update appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (public.is_company_member(unit_id))
WITH CHECK (public.is_company_member(unit_id));

-- Mobility settings: members can read logistics rules internally
CREATE POLICY "Company members can view mobility settings"
ON public.mobility_settings
FOR SELECT
TO authenticated
USING (public.is_company_member(unit_id));

-- Company members table: allow unit owners to read member rows even if owner row is not present
CREATE POLICY "Unit owners can view company members by ownership"
ON public.company_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.units u
    WHERE u.id = company_members.company_id
      AND u.owner_id = auth.uid()
  )
);
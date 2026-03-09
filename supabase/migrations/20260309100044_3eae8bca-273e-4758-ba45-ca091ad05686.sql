
-- Function to accept a staff invitation (runs as SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.accept_staff_invitation(
  _token text,
  _user_id uuid,
  _user_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _inv record;
  _result jsonb;
BEGIN
  -- 1. Find and validate invitation
  SELECT * INTO _inv FROM public.staff_invitations
  WHERE token = _token AND status = 'pending'
  LIMIT 1;

  IF _inv IS NULL THEN
    RETURN jsonb_build_object('error', 'Convite inválido ou já utilizado');
  END IF;

  IF _inv.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'Convite expirado');
  END IF;

  -- 2. Update profile to staff type
  UPDATE public.profiles SET
    user_type = 'staff',
    invited_via = _token,
    linked_unit_id = _inv.unit_id,
    onboarding_completed = true,
    setup_completed = true
  WHERE id = _user_id;

  -- 3. Change user_role from owner to team_member
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'owner';
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'team_member')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 4. Create team_member entry
  INSERT INTO public.team_members (unit_id, user_id, name, role, is_active)
  VALUES (_inv.unit_id, _user_id, COALESCE(_user_name, _inv.name, ''), _inv.role, true)
  ON CONFLICT DO NOTHING;

  -- 5. Create company_members entry
  INSERT INTO public.company_members (company_id, user_id, role, commission_rate)
  VALUES (_inv.unit_id, _user_id, 'staff', COALESCE(_inv.commission_rate, 0))
  ON CONFLICT DO NOTHING;

  -- 6. Mark invitation as accepted
  UPDATE public.staff_invitations SET status = 'accepted' WHERE id = _inv.id;

  -- 7. Delete auto-created trial subscription (staff don't need one)
  DELETE FROM public.subscriptions WHERE owner_id = _user_id;

  RETURN jsonb_build_object(
    'success', true,
    'unit_id', _inv.unit_id,
    'unit_name', (SELECT name FROM public.units WHERE id = _inv.unit_id),
    'role', _inv.role,
    'commission_rate', _inv.commission_rate
  );
END;
$$;

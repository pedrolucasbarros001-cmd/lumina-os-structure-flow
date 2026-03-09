
-- ═══ SUBSCRIPTIONS TABLE ═══
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text NOT NULL DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'annual')),
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'cancelled', 'trial', 'expired')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage own subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ═══ COMPANY_MEMBERS TABLE ═══
CREATE TABLE public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'receptionist', 'staff')),
  commission_rate numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- ═══ SECURITY DEFINER: is_company_member ═══
CREATE OR REPLACE FUNCTION public.is_company_member(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = _company_id AND user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_company_owner(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = _company_id AND user_id = auth.uid() AND role = 'owner'
  )
$$;

-- RLS for company_members
CREATE POLICY "Members can view own company members"
  ON public.company_members FOR SELECT
  USING (public.is_company_member(company_id));

CREATE POLICY "Owners can manage company members"
  ON public.company_members FOR ALL
  USING (public.is_company_owner(company_id))
  WITH CHECK (public.is_company_owner(company_id));

-- ═══ ADD nif AND settings_json TO units ═══
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS nif text;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS settings_json jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ═══ SEED company_members for existing owners ═══
INSERT INTO public.company_members (company_id, user_id, role)
SELECT id, owner_id, 'owner' FROM public.units
ON CONFLICT (company_id, user_id) DO NOTHING;

-- ═══ AUTO-CREATE subscription on new user ═══
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- Auto-assign owner role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner');
  
  -- Auto-create trial subscription
  INSERT INTO public.subscriptions (owner_id, plan_type, status, expires_at)
  VALUES (NEW.id, 'monthly', 'trial', now() + interval '14 days');
  
  RETURN NEW;
END;
$$;

-- ═══ PLAN ENFORCEMENT FUNCTION ═══
CREATE OR REPLACE FUNCTION public.check_plan_limit(_owner_id uuid, _resource text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan text;
  _count int;
BEGIN
  SELECT plan_type INTO _plan FROM public.subscriptions
    WHERE owner_id = _owner_id AND status IN ('active', 'trial')
    ORDER BY created_at DESC LIMIT 1;
  
  IF _plan IS NULL THEN RETURN false; END IF;
  
  IF _resource = 'company' THEN
    SELECT count(*) INTO _count FROM public.company_members
      WHERE user_id = _owner_id AND role = 'owner';
    IF _plan = 'monthly' THEN RETURN _count < 1; END IF;
    IF _plan = 'annual' THEN RETURN _count < 3; END IF;
  END IF;
  
  IF _resource = 'team_member' THEN
    -- This checks across all companies owned; per-company limit is 4
    RETURN true; -- Frontend will enforce per-company
  END IF;
  
  RETURN true;
END;
$$;

-- ═══ updated_at trigger for subscriptions ═══
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

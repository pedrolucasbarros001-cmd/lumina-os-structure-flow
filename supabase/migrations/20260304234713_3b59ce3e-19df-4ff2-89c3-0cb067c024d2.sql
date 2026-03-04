
-- Enum for appointment status
CREATE TYPE public.appointment_status AS ENUM (
  'pending_approval', 'confirmed', 'completed', 'cancelled', 'no_show'
);

-- Enum for appointment type
CREATE TYPE public.appointment_type AS ENUM ('unit', 'home');

-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'team_member');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  language TEXT NOT NULL DEFAULT 'pt',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Units table
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  cover_url TEXT,
  address TEXT,
  phone TEXT,
  business_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  accepts_home_visits BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own units"
  ON public.units FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Published units are publicly readable"
  ON public.units FOR SELECT
  TO anon
  USING (is_published = true);

-- Services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Unit owners can manage services"
  ON public.services FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND owner_id = auth.uid()));

CREATE POLICY "Active services of published units are publicly readable"
  ON public.services FOR SELECT
  TO anon
  USING (is_active = true AND EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND is_published = true));

-- Team members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'professional',
  bio TEXT,
  accepts_home_visits BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Unit owners can manage team members"
  ON public.team_members FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND owner_id = auth.uid()));

CREATE POLICY "Active team members of published units are publicly readable"
  ON public.team_members FOR SELECT
  TO anon
  USING (is_active = true AND EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND is_published = true));

-- Team member services (junction table)
CREATE TABLE public.team_member_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  UNIQUE (team_member_id, service_id)
);

ALTER TABLE public.team_member_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Unit owners can manage team member services"
  ON public.team_member_services FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.units u ON u.id = tm.unit_id
    WHERE tm.id = team_member_id AND u.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.units u ON u.id = tm.unit_id
    WHERE tm.id = team_member_id AND u.owner_id = auth.uid()
  ));

CREATE POLICY "Public can read team member services of published units"
  ON public.team_member_services FOR SELECT
  TO anon
  USING (EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.units u ON u.id = tm.unit_id
    WHERE tm.id = team_member_id AND u.is_published = true AND tm.is_active = true
  ));

-- Clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Unit owners can manage clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND owner_id = auth.uid()));

-- Appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  service_ids UUID[] NOT NULL DEFAULT '{}',
  datetime TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  type appointment_type NOT NULL DEFAULT 'unit',
  status appointment_status NOT NULL DEFAULT 'pending_approval',
  value NUMERIC(10,2) NOT NULL DEFAULT 0,
  address TEXT,
  notes TEXT,
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Unit owners can manage appointments"
  ON public.appointments FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND owner_id = auth.uid()));

CREATE POLICY "Anyone can create appointments (public booking)"
  ON public.appointments FOR INSERT
  TO anon
  WITH CHECK (true);

-- Mobility settings table
CREATE TABLE public.mobility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL UNIQUE REFERENCES public.units(id) ON DELETE CASCADE,
  base_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_per_km NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mobility_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Unit owners can manage mobility settings"
  ON public.mobility_settings FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND owner_id = auth.uid()));

CREATE POLICY "Public can read mobility settings of published units"
  ON public.mobility_settings FOR SELECT
  TO anon
  USING (EXISTS (SELECT 1 FROM public.units WHERE id = unit_id AND is_published = true));

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- Auto-assign owner role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_mobility_settings_updated_at BEFORE UPDATE ON public.mobility_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

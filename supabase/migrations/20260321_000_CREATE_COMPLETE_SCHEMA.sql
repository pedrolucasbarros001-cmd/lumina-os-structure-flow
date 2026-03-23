-- ============================================================================
-- LUMINA OS - SCHEMA COMPLETO DO ZERO (21 de Março de 2026)
-- ============================================================================
-- Este arquivo cria TODAS as tabelas, tipos, funções e políticas necessárias
-- para o Lumina OS funcionar. Executar este arquivo UMA VEZ em BD novo.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TIPOS E ENUMS
-- ============================================================================

CREATE TYPE IF NOT EXISTS public.appointment_status AS ENUM (
  'pending_approval',
  'confirmed',
  'in_transit',
  'en_route',
  'arrived',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE IF NOT EXISTS public.appointment_type AS ENUM (
  'unit',
  'home'
);

CREATE TYPE IF NOT EXISTS public.delivery_status AS ENUM (
  'pending',
  'on_the_way',
  'arrived',
  'completed',
  'cancelled'
);

CREATE TYPE IF NOT EXISTS public.app_role AS ENUM (
  'owner',
  'team_member'
);

-- ============================================================================
-- 3. TABELAS BASES (Sem referências circulares)
-- ============================================================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  language TEXT NOT NULL DEFAULT 'pt',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_step INTEGER DEFAULT 1,
  user_type TEXT DEFAULT 'owner',
  invited_via TEXT,
  linked_unit_id UUID,
  is_active_as_staff BOOLEAN DEFAULT false,
  active_staff_in_unit_id UUID,
  currency TEXT DEFAULT 'EUR',
  notifications_enabled BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  deletion_period_days INTEGER DEFAULT 30,
  recovery_token UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'annual')),
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'cancelled', 'trial', 'trialing', 'past_due', 'expired', 'incomplete')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  will_delete_at TIMESTAMPTZ,
  max_units INTEGER DEFAULT 1,
  max_team_per_unit INTEGER DEFAULT 4,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_id)
);

-- USER_ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- UNITS (depois linkamos para profiles)
CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  cover_url TEXT,
  address TEXT,
  phone TEXT,
  bio TEXT,
  about TEXT,
  business_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  accepts_home_visits BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  setup_completed BOOLEAN NOT NULL DEFAULT false,
  slug TEXT UNIQUE,
  public_booking_slug TEXT UNIQUE,
  is_public_visible BOOLEAN DEFAULT false,
  lat NUMERIC(10, 8),
  lng NUMERIC(11, 8),
  business_type TEXT DEFAULT 'independent' CHECK (business_type IN ('solo', 'team', 'independent')),
  logistics_type TEXT DEFAULT 'local' CHECK (logistics_type IN ('unit', 'home', 'hybrid', 'local')),
  nif TEXT,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  categories TEXT[] DEFAULT '{}',
  instagram_url TEXT,
  cancellation_policy TEXT,
  min_booking_notice_hours INTEGER DEFAULT 0,
  max_advance_booking_days INTEGER DEFAULT 60,
  buffer_minutes INTEGER DEFAULT 0,
  allow_any_staff BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  deletion_type VARCHAR(20) DEFAULT 'soft' CHECK (deletion_type IN ('soft', 'hard')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COMPANY_MEMBERS
CREATE TABLE IF NOT EXISTS public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'receptionist', 'staff')),
  commission_rate NUMERIC NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Agora adiciona FKs em profiles depois que units existe
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_linked_unit 
  FOREIGN KEY (linked_unit_id) REFERENCES public.units(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_active_staff_unit 
  FOREIGN KEY (active_staff_in_unit_id) REFERENCES public.units(id) ON DELETE SET NULL;

-- ============================================================================
-- 4. SERVIÇOS E EQUIPA
-- ============================================================================

-- SERVICES
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  image_url TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TEAM_MEMBERS
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'professional',
  bio TEXT,
  accepts_home_visits BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TEAM_MEMBER_SERVICES
CREATE TABLE IF NOT EXISTS public.team_member_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  UNIQUE (team_member_id, service_id)
);

-- TEAM_SHIFTS
CREATE TABLE IF NOT EXISTS public.team_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  day_of_week VARCHAR(3) NOT NULL CHECK (day_of_week IN ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')),
  is_working BOOLEAN NOT NULL DEFAULT true,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. CLIENTES E AGENDAMENTOS
-- ============================================================================

-- CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  postal_code TEXT,
  avatar_url TEXT,
  birthday DATE,
  notes TEXT,
  technical_notes TEXT,
  no_show_count INTEGER DEFAULT 0,
  preferred_staff_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  is_blocked BOOLEAN DEFAULT false,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_ids UUID[] NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  appointment_type public.appointment_type NOT NULL DEFAULT 'unit',
  status public.appointment_status NOT NULL DEFAULT 'pending_approval',
  notes TEXT,
  internal_notes TEXT,
  address TEXT,
  lat NUMERIC(10, 8),
  lng NUMERIC(11, 8),
  total_price NUMERIC(10,2),
  discount_percent NUMERIC(5,2),
  final_price NUMERIC(10,2),
  payment_method TEXT,
  paid_amount NUMERIC(10,2),
  payment_status TEXT DEFAULT 'pending',
  recurrence_type VARCHAR(20),
  recurrence_count INTEGER,
  parent_appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  has_delivery BOOLEAN DEFAULT false,
  delivery_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 6. ENTREGAS E LOGÍSTICA
-- ============================================================================

-- DELIVERIES
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_address TEXT NOT NULL,
  customer_lat NUMERIC NOT NULL,
  customer_lon NUMERIC NOT NULL,
  driver_lat NUMERIC,
  driver_lon NUMERIC,
  status public.delivery_status DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. GALERIA E MÍDIA
-- ============================================================================

-- UNIT_GALLERY
CREATE TABLE IF NOT EXISTS public.unit_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 8. CONVITES DE STAFF
-- ============================================================================

-- STAFF_INVITATIONS
CREATE TABLE IF NOT EXISTS public.staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'professional',
  commission_rate NUMERIC DEFAULT 0,
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 9. CONFIRMAÇÕES DE AGENDAMENTO
-- ============================================================================

-- APPOINTMENT_CONFIRMATION_TOKENS
CREATE TABLE IF NOT EXISTS public.appointment_confirmation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  expires_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 10. BLOQUEIOS DE TEMPO (Staff)
-- ============================================================================

-- STAFF_BLOCKED_TIME
CREATE TABLE IF NOT EXISTS public.staff_blocked_time (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason_id UUID,
  notes TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- STAFF_BLOCK_REASONS
CREATE TABLE IF NOT EXISTS public.staff_block_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  color_hex VARCHAR(7) DEFAULT '#fca5a5',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 11. INDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_linked_unit_id ON public.profiles(linked_unit_id);
CREATE INDEX IF NOT EXISTS idx_profiles_active_staff_in_unit_id ON public.profiles(active_staff_in_unit_id);

CREATE INDEX IF NOT EXISTS idx_units_owner_id ON public.units(owner_id);
CREATE INDEX IF NOT EXISTS idx_units_slug ON public.units(slug);
CREATE INDEX IF NOT EXISTS idx_units_is_published ON public.units(is_published);
CREATE INDEX IF NOT EXISTS idx_units_deleted_at ON public.units(deleted_at);

CREATE INDEX IF NOT EXISTS idx_services_unit_id ON public.services(unit_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);

CREATE INDEX IF NOT EXISTS idx_team_members_unit_id ON public.team_members(unit_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_deleted_at ON public.team_members(deleted_at);

CREATE INDEX IF NOT EXISTS idx_clients_unit_id ON public.clients(unit_id);
CREATE INDEX IF NOT EXISTS idx_clients_preferred_staff ON public.clients(preferred_staff_id);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON public.clients USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_appointments_unit_id ON public.appointments(unit_id);
CREATE INDEX IF NOT EXISTS idx_appointments_team_member_id ON public.appointments(team_member_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_parent_id ON public.appointments(parent_appointment_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_appointment_id ON public.deliveries(appointment_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_unit_id ON public.deliveries(unit_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);

CREATE INDEX IF NOT EXISTS idx_unit_gallery_unit_id ON public.unit_gallery(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_gallery_service_id ON public.unit_gallery(service_id);

CREATE INDEX IF NOT EXISTS idx_staff_invitations_unit_id ON public.staff_invitations(unit_id);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_token ON public.staff_invitations(token);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_status ON public.staff_invitations(status);

CREATE INDEX IF NOT EXISTS idx_staff_blocked_time_team_member_id ON public.staff_blocked_time(team_member_id);
CREATE INDEX IF NOT EXISTS idx_staff_blocked_time_reason_id ON public.staff_blocked_time(reason_id);

-- ============================================================================
-- 12. FUNÇÕES
-- ============================================================================

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, language)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'pt');
  
  INSERT INTO public.subscriptions (owner_id, plan_type, status)
  VALUES (new.id, 'monthly', 'trial');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 13. TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_units_updated_at ON public.units;
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_deliveries_updated_at ON public.deliveries;
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_unit_gallery_updated_at ON public.unit_gallery;
CREATE TRIGGER update_unit_gallery_updated_at BEFORE UPDATE ON public.unit_gallery 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_staff_blocked_time_updated_at ON public.staff_blocked_time;
CREATE TRIGGER update_staff_blocked_time_updated_at BEFORE UPDATE ON public.staff_blocked_time 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_appointment_confirmation_tokens_updated_at ON public.appointment_confirmation_tokens;
CREATE TRIGGER update_appointment_confirmation_tokens_updated_at BEFORE UPDATE ON public.appointment_confirmation_tokens 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 14. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_confirmation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_blocked_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_block_reasons ENABLE ROW LEVEL SECURITY;

-- Policies básicas para começar
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Owners can manage own units"
  ON public.units FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Published units are publicly readable"
  ON public.units FOR SELECT
  TO anon
  USING (is_published = true);

-- ============================================================================
-- 15. FINAL
-- ============================================================================

COMMIT;

-- Mensagem de sucesso
SELECT 'LUMINA OS Schema criado com sucesso!' as status;

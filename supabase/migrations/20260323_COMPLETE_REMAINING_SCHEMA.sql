-- ============================================================================
-- LUMINA OS - COMPLETAR SCHEMA (Tabelas que faltam)
-- Data: 23 de Março de 2026
-- Descrição: Este arquivo cria APENAS as tabelas que faltam
-- ============================================================================

BEGIN;

-- ============================================================================
-- FALTANDO: subscriptions, user_roles, company_members (após units existir)
-- ============================================================================

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

-- USER_ROLES (se não existir)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  UNIQUE (user_id, role)
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

-- ============================================================================
-- FALTANDO: team_member_services, team_shifts (após team_members e services)
-- ============================================================================

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
-- FALTANDO: appointments (depende de units, team_members, clients)
-- ============================================================================

-- APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_ids UUID[] NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  appointment_type TEXT NOT NULL DEFAULT 'unit',
  status TEXT NOT NULL DEFAULT 'pending_approval',
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
-- FALTANDO: deliveries (depende de appointments e units)
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
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FALTANDO: unit_gallery (depende de units e services)
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
-- FALTANDO: staff_invitations (depende de units)
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
-- FALTANDO: appointment_confirmation_tokens (depende de appointments e clients)
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
-- FALTANDO: staff_blocked_time e staff_block_reasons (depende de team_members)
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

-- Adiciona colunas que podem estar faltando em staff_blocked_time
ALTER TABLE public.staff_blocked_time ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE public.staff_blocked_time ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE public.staff_blocked_time ADD COLUMN IF NOT EXISTS reason_id UUID;
ALTER TABLE public.staff_blocked_time ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.staff_blocked_time ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE public.staff_blocked_time ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(50);
ALTER TABLE public.staff_blocked_time ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.staff_blocked_time ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- STAFF_BLOCK_REASONS
CREATE TABLE IF NOT EXISTS public.staff_block_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  color_hex VARCHAR(7) DEFAULT '#fca5a5',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDICES PARA TABELAS CRIADAS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_owner_id ON public.subscriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON public.company_members(user_id);

CREATE INDEX IF NOT EXISTS idx_team_member_services_team_member_id ON public.team_member_services(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_member_services_service_id ON public.team_member_services(service_id);

CREATE INDEX IF NOT EXISTS idx_team_shifts_team_member_id ON public.team_shifts(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_shifts_day_of_week ON public.team_shifts(day_of_week);

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

CREATE INDEX IF NOT EXISTS idx_appointment_confirmation_tokens_appointment_id ON public.appointment_confirmation_tokens(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_confirmation_tokens_client_id ON public.appointment_confirmation_tokens(client_id);

CREATE INDEX IF NOT EXISTS idx_staff_blocked_time_team_member_id ON public.staff_blocked_time(team_member_id);
CREATE INDEX IF NOT EXISTS idx_staff_blocked_time_reason_id ON public.staff_blocked_time(reason_id);
CREATE INDEX IF NOT EXISTS idx_staff_block_reasons_unit_id ON public.staff_block_reasons(unit_id);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_member_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_confirmation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_blocked_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_block_reasons ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TRIGGERS (para updated_at)
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER IF NOT EXISTS update_team_member_services_updated_at BEFORE UPDATE ON public.team_member_services 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER IF NOT EXISTS update_team_shifts_updated_at BEFORE UPDATE ON public.team_shifts 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER IF NOT EXISTS update_appointments_updated_at BEFORE UPDATE ON public.appointments 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER IF NOT EXISTS update_deliveries_updated_at BEFORE UPDATE ON public.deliveries 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER IF NOT EXISTS update_unit_gallery_updated_at BEFORE UPDATE ON public.unit_gallery 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER IF NOT EXISTS update_staff_invitations_updated_at BEFORE UPDATE ON public.staff_invitations 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER IF NOT EXISTS update_appointment_confirmation_tokens_updated_at BEFORE UPDATE ON public.appointment_confirmation_tokens 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER IF NOT EXISTS update_staff_blocked_time_updated_at BEFORE UPDATE ON public.staff_blocked_time 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER IF NOT EXISTS update_staff_block_reasons_updated_at BEFORE UPDATE ON public.staff_block_reasons 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMIT;

-- Mensagem de sucesso
SELECT 'LUMINA OS - Tabelas faltando criadas com sucesso!' as status;

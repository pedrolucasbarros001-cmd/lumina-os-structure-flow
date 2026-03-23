-- ============================================================================
-- LUMINA OS - SCHEMA SIMPLES E FUNCIONAL
-- Data: 23 de Março de 2026
-- Descrição: Apenas CREATE TABLE com colunas bem definidas
-- SEM triggers, policies, ou indexes complexos
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. SUBSCRIPTIONS - Planos de assinatura dos proprietários
-- ============================================================================
-- Faz rastreamento: qual plano o proprietário tem, status, datas de validade
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao proprietário (user autenticado)
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de plano: 'monthly' = Pro, 'annual' = Enterprise
  plan_type TEXT NOT NULL DEFAULT 'monthly',
  
  -- Status atual: 'trial', 'active', 'past_due', 'cancelled'
  status TEXT NOT NULL DEFAULT 'trial',
  
  -- Datas importantes
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  
  -- Limites do plano
  max_units INTEGER DEFAULT 1,
  max_team_per_unit INTEGER DEFAULT 4,
  
  -- Stripe integration (opcional)
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. USER_ROLES - Roles/Permissões de usuários
-- ============================================================================
-- Indica que tipo de usuário é: 'owner' ou 'team_member'
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao usuário
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role: 'owner' = proprietário, 'team_member' = profissional/staff
  role TEXT NOT NULL,
  
  UNIQUE (user_id, role)
);

-- ============================================================================
-- 3. COMPANY_MEMBERS - Relação entre usuários e empresas (units)
-- ============================================================================
-- Controla quem trabalha em qual empresa e com que função
CREATE TABLE IF NOT EXISTS public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência à empresa (unit)
  company_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  
  -- Referência ao usuário
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Função na empresa: 'owner', 'receptionist', 'staff'
  role TEXT NOT NULL DEFAULT 'staff',
  
  -- Percentual de comissão (0-100)
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(company_id, user_id)
);

-- ============================================================================
-- 4. TEAM_MEMBER_SERVICES - Quais serviços cada profissional oferece
-- ============================================================================
-- Relaciona profissional com os serviços que ele oferece
CREATE TABLE IF NOT EXISTS public.team_member_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao profissional
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  
  -- Referência ao serviço
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  
  UNIQUE (team_member_id, service_id)
);

-- ============================================================================
-- 5. TEAM_SHIFTS - Horário de trabalho de cada profissional
-- ============================================================================
-- Define os dias e horários que cada profissional está disponível
CREATE TABLE IF NOT EXISTS public.team_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao profissional
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  
  -- Dia da semana: 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'
  day_of_week VARCHAR(3) NOT NULL,
  
  -- Se trabalha neste dia
  is_working BOOLEAN NOT NULL DEFAULT true,
  
  -- Horários (se trabalha)
  start_time TIME,
  end_time TIME,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 6. APPOINTMENTS - Agendamentos/Consultas
-- ============================================================================
-- Registro de cada agendamento feito por clientes
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência à empresa (unit)
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  
  -- Profissional designado (pode ser NULL se não atribuído)
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  
  -- Cliente marcando consulta
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Serviços inclusos (array de UUIDs)
  service_ids UUID[] NOT NULL,
  
  -- Data/hora do agendamento
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Tipo: 'unit' = no local, 'home' = em casa do cliente
  appointment_type TEXT NOT NULL DEFAULT 'unit',
  
  -- Status do agendamento
  status TEXT NOT NULL DEFAULT 'pending_approval',
  
  -- Observações
  notes TEXT,
  internal_notes TEXT,
  
  -- Localização (se em casa)
  address TEXT,
  lat NUMERIC(10, 8),
  lng NUMERIC(11, 8),
  
  -- Preços
  total_price NUMERIC(10,2),
  discount_percent NUMERIC(5,2),
  final_price NUMERIC(10,2),
  
  -- Pagamento
  payment_method TEXT,
  paid_amount NUMERIC(10,2),
  payment_status TEXT DEFAULT 'pending',
  
  -- Agendamentos recorrentes
  recurrence_type VARCHAR(20),
  recurrence_count INTEGER,
  parent_appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  
  -- Delivery
  has_delivery BOOLEAN DEFAULT false,
  delivery_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 7. DELIVERIES - Entregas em domicílio
-- ============================================================================
-- Rastreamento de entregas de produtos/serviços
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao agendamento
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  
  -- Referência à empresa
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  
  -- Dados do cliente recebedor
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_address TEXT NOT NULL,
  
  -- Coordenadas do cliente
  customer_lat NUMERIC(10,8) NOT NULL,
  customer_lon NUMERIC(11,8) NOT NULL,
  
  -- Localização atual do motorista
  driver_lat NUMERIC(10,8),
  driver_lon NUMERIC(11,8),
  
  -- Status da entrega: 'pending', 'on_the_way', 'arrived', 'completed'
  status TEXT DEFAULT 'pending',
  
  -- Datas
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. UNIT_GALLERY - Galeria de fotos da empresa
-- ============================================================================
-- Fotos do local, serviços, equipa, etc.
CREATE TABLE IF NOT EXISTS public.unit_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência à empresa
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  
  -- Referência ao serviço (opcional)
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  
  -- URL da imagem
  url TEXT NOT NULL,
  
  -- Ordem de exibição
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 9. STAFF_INVITATIONS - Convites para profissionais se juntarem
-- ============================================================================
-- Genera link VIP para profissionais serem convidados
CREATE TABLE IF NOT EXISTS public.staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência à empresa que está convidando
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  
  -- Email do convidado
  email TEXT NOT NULL,
  
  -- Nome do profissional
  name TEXT,
  
  -- Profissão/Função: 'professional', 'receptionist', etc.
  role TEXT DEFAULT 'professional',
  
  -- Comissão oferecida (%)
  commission_rate NUMERIC(5,2) DEFAULT 0,
  
  -- Token único para link de convite
  token TEXT NOT NULL UNIQUE,
  
  -- Status: 'pending', 'accepted', 'rejected', 'expired'
  status TEXT DEFAULT 'pending',
  
  -- Quando expira este convite
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Quando foi aceito
  accepted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 10. APPOINTMENT_CONFIRMATION_TOKENS - Confirmação de agendamento
-- ============================================================================
-- Cliente recebe link para confirmar/rejeitar agendamento
CREATE TABLE IF NOT EXISTS public.appointment_confirmation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao agendamento
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  
  -- Referência ao cliente
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Token único para link de confirmação
  token TEXT NOT NULL UNIQUE,
  
  -- Status: 'pending', 'confirmed', 'rejected'
  status TEXT DEFAULT 'pending',
  
  -- Quando expira
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Quando foi confirmado
  confirmed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 11. STAFF_BLOCKED_TIME - Blocos de tempo indisponível
-- ============================================================================
-- Profissional marca quando NÃO está disponível (pausa, almoço, etc.)
CREATE TABLE IF NOT EXISTS public.staff_blocked_time (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao profissional
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  
  -- Início do bloqueio
  start_time TIMESTAMPTZ NOT NULL,
  
  -- Fim do bloqueio
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Referência ao motivo (pausa, almoço, etc.)
  reason_id UUID,
  
  -- Notas adicionais
  notes TEXT,
  
  -- Se é recorrente (todo dia, toda semana, etc.)
  is_recurring BOOLEAN DEFAULT false,
  
  -- Padrão de recorrência
  recurrence_pattern VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 12. STAFF_BLOCK_REASONS - Razões predefinidas para bloqueios
-- ============================================================================
-- Tipos de bloqueios: Pausa, Almoço, Formação, Férias, etc.
CREATE TABLE IF NOT EXISTS public.staff_block_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência à empresa
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  
  -- Nome do motivo: "Pausa", "Almoço", "Formação", etc.
  reason TEXT NOT NULL,
  
  -- Cor para exibição (hex): "#fca5a5"
  color_hex VARCHAR(7) DEFAULT '#fca5a5',
  
  -- Timestamp de criação
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;

-- ============================================================================
-- ✅ SCHEMA CRIADO COM SUCESSO!
-- ============================================================================
-- Todas as 12 tabelas foram criadas:
-- 1. subscriptions        - Planos de assinatura
-- 2. user_roles           - Roles de usuários
-- 3. company_members      - Relação usuário-empresa
-- 4. team_member_services - Serviços por profissional
-- 5. team_shifts          - Horários de trabalho
-- 6. appointments         - Agendamentos
-- 7. deliveries           - Entregas em domicílio
-- 8. unit_gallery         - Galeria de fotos
-- 9. staff_invitations    - Convites para profissionais
-- 10. appointment_confirmation_tokens - Confirmação de agendamentos
-- 11. staff_blocked_time  - Blocos de indisponibilidade
-- 12. staff_block_reasons - Tipos de bloqueios
--
-- PRÓXIMA AÇÃO:
-- Execute: npx supabase gen types typescript --local > src/integrations/supabase/types.ts
-- ============================================================================

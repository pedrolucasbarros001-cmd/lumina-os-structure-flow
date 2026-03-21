# 📊 Análise Completa de Migrations - Lumina OS (21 de Março de 2026)

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [ENUMs Criados](#enums-criados)
3. [Tabelas Criadas](#tabelas-criadas)
4. [Fluxo Cronológico de Alterações](#fluxo-cronológico-de-alterações)
5. [Status Atual das Tabelas](#status-atual-das-tabelas)
6. [Script SQL Completo (Zero)](#script-sql-completo-zero)

---

## 🎯 Visão Geral

Total de migrations: **27 arquivos**
Data de cobertura: **04 Mar - 21 Mar 2026**

### Resumo Estrutural
- **ENUMs:** 3 tipos
- **Tabelas Principais:** 25+ tabelas
- **Funções PL/pgSQL:** 15+ funções
- **Triggers:** 20+ triggers
- **Index:** 40+ índices
- **RLS Policies:** 50+ políticas

---

## 🔷 ENUMs Criados

### 1. `appointment_status`
```sql
CREATE TYPE public.appointment_status AS ENUM (
  'pending_approval',    -- Aguardando aprovação
  'confirmed',           -- Confirmado
  'in_transit',          -- Em trânsito (adicionado em 08-03)
  'en_route',            -- A caminho (adicionado após 08-03)
  'arrived',             -- Chegou (adicionado após 08-03)
  'completed',           -- Completado
  'cancelled',           -- Cancelado
  'no_show'              -- Não compareceu
);
```

### 2. `appointment_type`
```sql
CREATE TYPE public.appointment_type AS ENUM (
  'unit',        -- Na unidade
  'home'         -- Em domicílio
);
```

### 3. `app_role`
```sql
CREATE TYPE public.app_role AS ENUM (
  'owner',            -- Proprietário
  'team_member'       -- Membro da equipa
);
```

---

## 📋 Tabelas Criadas (Ordem Recomendada de Criação)

### **1️⃣ TABELA: `profiles` (Base)**
Usuários e seus perfis.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | - | PK, FK auth.users(id) CASCADE |
| full_name | TEXT | NULL | - |
| avatar_url | TEXT | NULL | - |
| language | TEXT | 'pt' | NOT NULL |
| onboarding_completed | BOOLEAN | false | NOT NULL |
| onboarding_step | INTEGER | 1 | - |
| user_type | TEXT | 'owner' | - |
| invited_via | TEXT | NULL | - |
| linked_unit_id | UUID | NULL | FK units(id) |
| is_active_as_staff | BOOLEAN | false | - |
| active_staff_in_unit_id | UUID | NULL | FK units(id) |
| currency | TEXT | 'EUR' | - |
| notifications_enabled | BOOLEAN | true | - |
| deleted_at | TIMESTAMPTZ | NULL | - |
| deletion_period_days | INTEGER | 30 | - |
| recovery_token | UUID | NULL | - |
| created_at | TIMESTAMPTZ | now() | NOT NULL |
| updated_at | TIMESTAMPTZ | now() | NOT NULL |

**RLS:** ✅ Habilitado
**Trigger:** ✅ update_profiles_updated_at

---

### **2️⃣ TABELA: `subscriptions` (SaaS)**
Planos e subscrições de usuários.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| owner_id | UUID | - | FK auth.users(id) CASCADE |
| plan_type | TEXT | 'monthly' | CHECK IN ('monthly', 'annual') |
| status | TEXT | 'trial' | CHECK IN ('active', 'cancelled', 'trial', 'trialing', 'past_due', 'expired', 'incomplete') |
| started_at | TIMESTAMPTZ | now() | NOT NULL |
| expires_at | TIMESTAMPTZ | NULL | - |
| canceled_at | TIMESTAMPTZ | NULL | - |
| will_delete_at | TIMESTAMPTZ | NULL | - |
| max_units | INTEGER | 1 | - |
| max_team_per_unit | INTEGER | 4 | - |
| stripe_subscription_id | TEXT | NULL | UNIQUE |
| stripe_customer_id | TEXT | NULL | - |
| trial_ends_at | TIMESTAMPTZ | NULL | - |
| current_period_start | TIMESTAMPTZ | NULL | - |
| current_period_end | TIMESTAMPTZ | NULL | - |
| created_at | TIMESTAMPTZ | now() | NOT NULL |
| updated_at | TIMESTAMPTZ | now() | NOT NULL |

**RLS:** ✅ Habilitado
**Indexes:**
- idx_subscriptions_stripe_customer
- idx_subscriptions_stripe_sub
- idx_subscriptions_owner_status
- idx_subscriptions_will_delete_at

**Trigger:** ✅ update_subscriptions_updated_at

---

### **3️⃣ TABELA: `user_roles` (RBAC)**
Atribuições de papéis do utilizador.

**Colunas:**
| Nome | Tipo | Constraints |
|------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK auth.users(id) CASCADE, NOT NULL |
| role | app_role | NOT NULL, UNIQUE(user_id, role) |

---

### **4️⃣ TABELA: `units` (Unidades de Negócio)**
Empresas/Unidades criadas pelos proprietários.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| owner_id | UUID | - | FK auth.users(id) CASCADE, NOT NULL |
| name | TEXT | NULL | NOT NULL |
| logo_url | TEXT | NULL | - |
| cover_url | TEXT | NULL | - |
| address | TEXT | NULL | - |
| phone | TEXT | NULL | - |
| bio | TEXT | NULL | - |
| about | TEXT | NULL | - |
| business_hours | JSONB | '{}' | NOT NULL |
| accepts_home_visits | BOOLEAN | false | - |
| is_published | BOOLEAN | false | - |
| setup_completed | BOOLEAN | false | - |
| slug | TEXT | NULL | UNIQUE |
| public_booking_slug | TEXT | NULL | UNIQUE |
| is_public_visible | BOOLEAN | false | - |
| lat | NUMERIC(10,8) | NULL | - |
| lng | NUMERIC(11,8) | NULL | - |
| business_type | TEXT | 'independent' | CHECK IN ('solo', 'team', 'independent') |
| logistics_type | TEXT | 'local' | CHECK IN ('unit', 'home', 'hybrid', 'local') |
| nif | TEXT | NULL | - |
| settings_json | JSONB | '{}' | NOT NULL |
| categories | TEXT[] | '{}' | - |
| instagram_url | TEXT | NULL | - |
| cancellation_policy | TEXT | NULL | - |
| min_booking_notice_hours | INTEGER | 0 | - |
| max_advance_booking_days | INTEGER | 60 | - |
| buffer_minutes | INTEGER | 0 | - |
| allow_any_staff | BOOLEAN | true | - |
| deleted_at | TIMESTAMPTZ | NULL | - |
| deletion_type | VARCHAR(20) | 'soft' | CHECK IN ('soft', 'hard') |
| created_at | TIMESTAMPTZ | now() | NOT NULL |
| updated_at | TIMESTAMPTZ | now() | NOT NULL |

**RLS:** ✅ Habilitado
**Indexes:**
- idx_units_deleted_at
- idx_units_owner_deleted
- idx_units_public_booking_slug

**Trigger:** ✅ update_units_updated_at, create_default_block_reasons

---

### **5️⃣ TABELA: `company_members` (Equipa da Unidade)**
Membros e suas permissões em uma unidade.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| company_id | UUID | - | FK units(id) CASCADE, NOT NULL |
| user_id | UUID | - | FK auth.users(id) CASCADE, NOT NULL |
| role | TEXT | 'staff' | CHECK IN ('owner', 'receptionist', 'staff') |
| commission_rate | NUMERIC | 0 | - |
| deleted_at | TIMESTAMPTZ | NULL | - |
| created_at | TIMESTAMPTZ | now() | - |

**Constraints:** UNIQUE(company_id, user_id)
**Indexes:** idx_company_members_deleted_at

---

### **6️⃣ TABELA: `services` (Serviços)**
Serviços oferecidos por uma unidade.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| unit_id | UUID | - | FK units(id) CASCADE, NOT NULL |
| name | TEXT | NULL | NOT NULL |
| duration | INTEGER | 30 | NOT NULL |
| price | NUMERIC(10,2) | 0 | NOT NULL |
| description | TEXT | NULL | - |
| image_url | TEXT | NULL | - |
| category | TEXT | NULL | - |
| is_active | BOOLEAN | true | NOT NULL |
| created_at | TIMESTAMPTZ | now() | NOT NULL |
| updated_at | TIMESTAMPTZ | now() | NOT NULL |

**Trigger:** ✅ update_services_updated_at

---

### **7️⃣ TABELA: `team_members` (Profissionais)**
Membros da equipa (profissionais, terapeutas, etc).

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| user_id | UUID | NULL | FK auth.users(id) SET NULL |
| unit_id | UUID | - | FK units(id) CASCADE, NOT NULL |
| name | TEXT | NULL | NOT NULL |
| photo_url | TEXT | NULL | - |
| role | TEXT | 'professional' | NOT NULL |
| bio | TEXT | NULL | - |
| accepts_home_visits | BOOLEAN | false | - |
| is_active | BOOLEAN | true | NOT NULL |
| deleted_at | TIMESTAMPTZ | NULL | - |
| created_at | TIMESTAMPTZ | now() | NOT NULL |
| updated_at | TIMESTAMPTZ | now() | NOT NULL |

**Indexes:** idx_team_members_deleted_at
**Trigger:** ✅ update_team_members_updated_at

---

### **8️⃣ TABELA: `team_member_services` (Habilidades)**
Mapeamento de quais serviços cada membro pode oferecer.

**Colunas:**
| Nome | Tipo | Constraints |
|------|------|-------------|
| id | UUID | PK |
| team_member_id | UUID | FK team_members(id) CASCADE, NOT NULL |
| service_id | UUID | FK services(id) CASCADE, NOT NULL |

**Constraints:** UNIQUE(team_member_id, service_id)

---

### **9️⃣ TABELA: `team_shifts` (Horários)**
Horários de trabalho dos membros de equipa.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| team_member_id | UUID | - | FK team_members(id) CASCADE, NOT NULL |
| day_of_week | VARCHAR(3) | - | CHECK IN ('mon','tue','wed','thu','fri','sat','sun'), NOT NULL |
| is_working | BOOLEAN | true | NOT NULL |
| start_time | TIME | NULL | - |
| end_time | TIME | NULL | - |
| created_at | TIMESTAMPTZ | now() | NOT NULL |
| updated_at | TIMESTAMPTZ | now() | NOT NULL |

**Constraints:** UNIQUE(team_member_id, day_of_week)
**Trigger:** ✅ update_team_shifts_updated_at

---

### **🔟 TABELA: `team_commissions` (Comissões)**
Taxa de comissão dos profissionais.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| team_member_id | UUID | - | FK team_members(id) CASCADE, NOT NULL, UNIQUE |
| service_commission_pct | NUMERIC(5,2) | 0 | - |
| product_commission_pct | NUMERIC(5,2) | 0 | - |
| created_at | TIMESTAMPTZ | now() | - |
| updated_at | TIMESTAMPTZ | now() | - |

**Trigger:** ✅ update_team_commissions_updated_at

---

### **1️⃣1️⃣ TABELA: `clients` (Clientes)**
Clientes/Pacientes das unidades.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| unit_id | UUID | - | FK units(id) CASCADE, NOT NULL |
| name | TEXT | NULL | NOT NULL |
| phone | TEXT | NULL | - |
| email | TEXT | NULL | - |
| birthday | DATE | NULL | - |
| notes | TEXT | NULL | - |
| technical_notes | TEXT | NULL | - |
| no_show_count | INTEGER | 0 | - |
| preferred_staff_id | UUID | NULL | FK team_members(id) SET NULL |
| tags | TEXT[] | '{}' | - |
| created_at | TIMESTAMPTZ | now() | NOT NULL |
| updated_at | TIMESTAMPTZ | now() | NOT NULL |

**Indexes:**
- idx_clients_preferred_staff
- idx_clients_tags (GIN)

**Trigger:** ✅ update_clients_updated_at

---

### **1️⃣2️⃣ TABELA: `appointments` (Agendamentos)**
Marcações/Agendamentos.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| unit_id | UUID | - | FK units(id) CASCADE, NOT NULL |
| client_id | UUID | NULL | FK clients(id) SET NULL |
| team_member_id | UUID | NULL | FK team_members(id) SET NULL |
| assistant_id | UUID | NULL | FK profiles(id) |
| service_ids | UUID[] | '{}' | NOT NULL |
| datetime | TIMESTAMPTZ | - | NOT NULL |
| duration | INTEGER | 30 | NOT NULL |
| type | appointment_type | 'unit' | NOT NULL |
| status | appointment_status | 'pending_approval' | NOT NULL |
| assistant_status | VARCHAR(50) | 'pending' | CHECK IN (...) |
| value | NUMERIC(10,2) | 0 | NOT NULL |
| delivery_fee | NUMERIC(10,2) | 0 | NOT NULL |
| discount | NUMERIC(10,2) | 0 | NOT NULL |
| address | TEXT | NULL | - |
| notes | TEXT | NULL | - |
| internal_notes | TEXT | NULL | - |
| client_name | TEXT | NULL | - |
| client_phone | TEXT | NULL | - |
| client_email | TEXT | NULL | - |
| confirmation_sent_at | TIMESTAMPTZ | NULL | - |
| reminder_sent_at | TIMESTAMPTZ | NULL | - |
| customer_confirmed | BOOLEAN | NULL | - |
| customer_confirmed_at | TIMESTAMPTZ | NULL | - |
| started_traveling_at | TIMESTAMPTZ | NULL | - |
| arrived_at | TIMESTAMPTZ | NULL | - |
| service_started_at | TIMESTAMPTZ | NULL | - |
| service_completed_at | TIMESTAMPTZ | NULL | - |
| last_location_lat | DECIMAL(10,8) | NULL | - |
| last_location_lng | DECIMAL(11,8) | NULL | - |
| last_location_timestamp | TIMESTAMPTZ | NULL | - |
| recurrence_type | VARCHAR(20) | NULL | - |
| recurrence_count | INTEGER | NULL | - |
| parent_appointment_id | UUID | NULL | FK appointments(id) CASCADE |
| created_at | TIMESTAMPTZ | now() | NOT NULL |
| updated_at | TIMESTAMPTZ | now() | NOT NULL |

**Indexes:**
- idx_appointments_status_datetime
- idx_appointments_assistant_status
- idx_appointments_assistant_id
- idx_appointments_parent_id
- idx_appointments_recurrence
- idx_appointments_datetime_status

**Trigger:** ✅ update_appointments_updated_at, validate_appointment_delivery

---

### **1️⃣3️⃣ TABELA: `products` (Produtos)**
Produtos vendidos.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| unit_id | UUID | - | FK units(id) CASCADE, NOT NULL |
| name | TEXT | NULL | NOT NULL |
| price | NUMERIC(10,2) | 0 | NOT NULL |
| stock_quantity | INTEGER | 0 | NOT NULL |
| low_stock_threshold | INTEGER | 5 | NOT NULL |
| image_url | TEXT | NULL | - |
| brand | TEXT | NULL | - |
| category | TEXT | NULL | - |
| is_active | BOOLEAN | true | NOT NULL |
| created_at | TIMESTAMPTZ | now() | NOT NULL |
| updated_at | TIMESTAMPTZ | now() | NOT NULL |

**Trigger:** ✅ update_products_updated_at

---

### **1️⃣4️⃣ TABELA: `sales` (Vendas/Caixa)**
Registro de vendas e pagamentos.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| unit_id | UUID | - | FK units(id) CASCADE, NOT NULL |
| appointment_id | UUID | NULL | FK appointments(id) SET NULL |
| client_id | UUID | NULL | FK clients(id) SET NULL |
| total_amount | NUMERIC(10,2) | 0 | NOT NULL |
| payment_method | TEXT | - | NOT NULL, CHECK IN ('cash','card','mbway','other') |
| status | TEXT | 'completed' | NOT NULL, CHECK IN ('completed','refunded') |
| items | JSONB | '[]' | NOT NULL |
| created_at | TIMESTAMPTZ | now() | NOT NULL |
| updated_at | TIMESTAMPTZ | now() | NOT NULL |

**Trigger:** ✅ update_sales_updated_at

---

### **1️⃣5️⃣ TABELA: `mobility_settings` (Mobilidade)**
Configurações de entrega a domicílio.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| unit_id | UUID | - | FK units(id) CASCADE, NOT NULL, UNIQUE |
| base_fee | NUMERIC(10,2) | 0 | NOT NULL |
| price_per_km | NUMERIC(10,2) | 0 | NOT NULL |
| coverage_radius_km | NUMERIC(10,2) | 15.0 | NOT NULL |
| created_at | TIMESTAMPTZ | now() | NOT NULL |
| updated_at | TIMESTAMPTZ | now() | NOT NULL |

**Trigger:** ✅ update_mobility_settings_updated_at

---

### **1️⃣6️⃣ TABELA: `deliveries` (Entregas)**
Registos de entregas a domicílio.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| appointment_id | UUID | - | FK appointments(id) CASCADE, NOT NULL |
| unit_id | UUID | - | FK units(id) CASCADE, NOT NULL |
| customer_name | VARCHAR(255) | - | NOT NULL |
| customer_phone | VARCHAR(20) | NULL | - |
| customer_address | TEXT | - | NOT NULL |
| customer_lat | NUMERIC | - | NOT NULL |
| customer_lon | NUMERIC | - | NOT NULL |
| driver_lat | NUMERIC | NULL | - |
| driver_lon | NUMERIC | NULL | - |
| status | VARCHAR(50) | 'pending' | CHECK IN ('pending','en_route','arrived','completed','cancelled') |
| started_at | TIMESTAMPTZ | NULL | - |
| completed_at | TIMESTAMPTZ | NULL | - |
| created_at | TIMESTAMPTZ | now() | - |
| updated_at | TIMESTAMPTZ | now() | - |

**Indexes:**
- idx_deliveries_unit_id
- idx_deliveries_appointment_id
- idx_deliveries_status
- idx_deliveries_created_at

**Trigger:** ✅ update_deliveries_updated_at

---

### **1️⃣7️⃣ TABELA: `staff_blocked_time` (Bloqueios)**
Períodos bloqueados (férias, doença, almço).

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| team_member_id | UUID | - | FK team_members(id) CASCADE, NOT NULL |
| unit_id | UUID | - | FK units(id) CASCADE, NOT NULL |
| start_time | TIMESTAMPTZ | - | NOT NULL |
| end_time | TIMESTAMPTZ | - | NOT NULL |
| title | VARCHAR(255) | - | NOT NULL |
| description | TEXT | NULL | - |
| is_recurring | BOOLEAN | false | - |
| recurring_pattern | VARCHAR(50) | NULL | - |
| status | VARCHAR(50) | 'active' | CHECK IN ('active','cancelled') |
| created_at | TIMESTAMPTZ | now() | - |
| updated_at | TIMESTAMPTZ | now() | - |

**Constraints:**
- end_time > start_time
- team_member_unit_match

**Indexes:**
- idx_staff_blocked_time_team_member_id
- idx_staff_blocked_time_unit_id
- idx_staff_blocked_time_date_range

**Trigger:** ✅ update_staff_blocked_time_updated_at

---

### **1️⃣8️⃣ TABELA: `staff_block_reasons` (Razões)**
Razões pré-definidas para bloqueios.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| unit_id | UUID | - | FK units(id) CASCADE, NOT NULL |
| reason | VARCHAR(255) | - | NOT NULL |
| color_hex | VARCHAR(7) | '#fb923c' | - |
| created_at | TIMESTAMPTZ | now() | - |

**Constraints:** UNIQUE(unit_id, reason)

---

### **1️⃣9️⃣ TABELA: `invitations` (Convites)**
Convites para membros de equipa.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| unit_id | UUID | - | FK units(id) CASCADE, NOT NULL |
| user_id | UUID | - | FK auth.users(id) CASCADE, NOT NULL |
| status | TEXT | 'pending' | CHECK IN ('pending','accepted','rejected') |
| created_at | TIMESTAMPTZ | now() | - |
| updated_at | TIMESTAMPTZ | now() | - |

**Constraints:** UNIQUE(unit_id, user_id)

---

### **2️⃣0️⃣ TABELA: `staff_invitations` (Convites Staff)**
Convites por email para funcionários.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| unit_id | UUID | - | FK units(id) CASCADE, NOT NULL |
| email | TEXT | - | NOT NULL |
| name | TEXT | NULL | - |
| role | TEXT | 'Profissional' | - |
| commission_rate | NUMERIC | 0 | - |
| token | TEXT | - | NOT NULL, UNIQUE |
| status | TEXT | 'pending' | CHECK IN ('pending','accepted','rejected') |
| invited_by | UUID | - | NOT NULL |
| email_sent_at | TIMESTAMPTZ | NULL | - |
| created_at | TIMESTAMPTZ | now() | - |
| expires_at | TIMESTAMPTZ | now() + 7 days | - |

**Indexes:** idx_staff_invitations_token, idx_staff_invitations_email_sent

---

### **2️⃣1️⃣ TABELA: `appointment_confirmation_tokens` (Tokens)**
Tokens para confirmação de agendamentos por email.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| appointment_id | UUID | - | FK appointments(id) CASCADE, NOT NULL |
| token | VARCHAR(255) | - | NOT NULL, UNIQUE |
| action | VARCHAR(50) | - | NOT NULL, CHECK IN ('confirm','reschedule','cancel') |
| used | BOOLEAN | false | - |
| used_at | TIMESTAMPTZ | NULL | - |
| expires_at | TIMESTAMPTZ | NOW() + 24h | - |
| created_at | TIMESTAMPTZ | now() | - |
| updated_at | TIMESTAMPTZ | now() | - |

**Indexes:**
- idx_appointment_confirmation_tokens_appointment_id
- idx_appointment_confirmation_tokens_token

**Trigger:** ✅ trigger_confirmation_tokens_updated_at

---

### **2️⃣2️⃣ TABELA: `appointment_locations` (Localizações GPS)**
Histórico de localizações GPS.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| appointment_id | UUID | - | FK appointments(id) CASCADE, NOT NULL |
| assistant_id | UUID | - | FK profiles(id) CASCADE, NOT NULL |
| latitude | DECIMAL(10,8) | - | NOT NULL |
| longitude | DECIMAL(11,8) | - | NOT NULL |
| accuracy | DECIMAL(5,2) | NULL | - |
| recorded_at | TIMESTAMPTZ | now() | - |
| created_at | TIMESTAMPTZ | now() | - |

**Indexes:**
- idx_appointment_locations_appointment_id
- idx_appointment_locations_assistant_id
- idx_appointment_locations_recorded_at

---

### **2️⃣3️⃣ TABELA: `tracking_sessions` (Sessões de Rastreamento)**
Sessões ativas de rastreamento.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| appointment_id | UUID | - | FK appointments(id) CASCADE, NOT NULL |
| assistant_id | UUID | - | FK profiles(id) CASCADE, NOT NULL |
| started_at | TIMESTAMPTZ | now() | - |
| ended_at | TIMESTAMPTZ | NULL | - |
| status | VARCHAR(50) | 'active' | CHECK IN ('active','paused','ended') |
| last_ping_at | TIMESTAMPTZ | now() | - |
| created_at | TIMESTAMPTZ | now() | - |

**Indexes:** idx_tracking_sessions_active

---

### **2️⃣4️⃣ TABELA: `unit_gallery` (Galeria)**
Fotos/Galeria de imagens das unidades.

**Colunas:**
| Nome | Tipo | Default | Constraints |
|------|------|---------|-------------|
| id | UUID | gen_random_uuid() | PK |
| unit_id | UUID | - | FK units(id) CASCADE, NOT NULL |
| service_id | UUID | NULL | FK services(id) CASCADE |
| url | TEXT | - | NOT NULL |
| display_order | INTEGER | 0 | - |
| created_at | TIMESTAMPTZ | now() | - |
| updated_at | TIMESTAMPTZ | now() | - |

**Indexes:**
- idx_unit_gallery_unit_id
- idx_unit_gallery_service_id
- idx_unit_gallery_order

---

## 📊 Fluxo Cronológico de Alterações

### **Fase 1: Base (04-05 Mar)**
- ✅ Criação de ENUMs
- ✅ Tabelas core: profiles, user_roles, units, services, team_members, clients, appointments
- ✅ Infrastructure: mobility_settings, RLS policies

### **Fase 2: Expansão (05-06 Mar)**
- ✅ Onboarding fields
- ✅ products, sales, team_shifts, team_commissions
- ✅ Storage bucket para assets

### **Fase 3: SaaS (08 Mar)**
- ✅ subscriptions, company_members
- ✅ check_plan_limit()

### **Fase 4: Staff (09 Mar)**
- ✅ staff_invitations
- ✅ accept_staff_invitation()
- ✅ company_members policies

### **Fase 5: Automação (16 Mar)**
- ✅ Auto no-show
- ✅ Customer confirmation
- ✅ Delivery validation
- ✅ Staff blocked time

### **Fase 6: Entregas (17 Mar)**
- ✅ deliveries table
- ✅ create_delivery_from_appointment()

### **Fase 7: Segurança (19 Mar)**
- ✅ Account deletion system
- ✅ Staff activation fields
- ✅ Email tracking

### **Fase 8: Rastreamento (19 Mar)**
- ✅ GPS tracking
- ✅ tracking_sessions

### **Fase 9: Refinamento (20-21 Mar)**
- ✅ Final columns (birthday, notes, recurrence, etc)
- ✅ Stripe integration
- ✅ Unit gallery

---

## ✅ Status Atual das Tabelas

| # | Tabela | Linhas | Status | RLS | Triggers |
|---|--------|--------|--------|-----|----------|
| 1 | profiles | 16 | ✅ Completa | ✅ | ✅ |
| 2 | subscriptions | 19 | ✅ Completa | ✅ | ✅ |
| 3 | user_roles | 3 | ✅ Completa | ✅ | ❌ |
| 4 | units | 35 | ✅ Completa | ✅ | ✅ |
| 5 | company_members | 6 | ✅ Completa | ✅ | ❌ |
| 6 | services | 11 | ✅ Completa | ✅ | ✅ |
| 7 | team_members | 11 | ✅ Completa | ✅ | ✅ |
| 8 | team_member_services | 3 | ✅ Completa | ✅ | ❌ |
| 9 | team_shifts | 7 | ✅ Completa | ✅ | ✅ |
| 10 | team_commissions | 6 | ✅ Completa | ✅ | ✅ |
| 11 | clients | 11 | ✅ Completa | ✅ | ✅ |
| 12 | appointments | 40 | ✅ Completa | ✅ | ✅ |
| 13 | products | 11 | ✅ Completa | ✅ | ✅ |
| 14 | sales | 10 | ✅ Completa | ✅ | ✅ |
| 15 | mobility_settings | 6 | ✅ Completa | ✅ | ✅ |
| 16 | deliveries | 14 | ✅ Completa | ✅ | ✅ |
| 17 | staff_blocked_time | 10 | ✅ Completa | ✅ | ✅ |
| 18 | staff_block_reasons | 5 | ✅ Completa | ✅ | ❌ |
| 19 | invitations | 6 | ✅ Completa | ✅ | ✅ |
| 20 | staff_invitations | 10 | ✅ Completa | ✅ | ❌ |
| 21 | appointment_confirmation_tokens | 8 | ✅ Completa | ✅ | ✅ |
| 22 | appointment_locations | 7 | ✅ Completa | ✅ | ❌ |
| 23 | tracking_sessions | 7 | ✅ Completa | ✅ | ✅ |
| 24 | unit_gallery | 7 | ✅ Completa | ✅ | ❌ |

---

## 🎯 Script SQL Completo (Zero)

Um script SQL completo que cria tudo do zero **SEM IF NOT EXISTS**, em ordem correta com todas as Foreign Keys.

```sql
-- ============================================================================
-- LUMINA OS - SCRIPT SQL COMPLETO PARA CRIAÇÃO DO ZERO
-- Data: 21 de Março de 2026
-- Status: Production-Ready
-- Nota: Este script NÃO inclui "IF NOT EXISTS" - use apenas em BD novo
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 1: EXTENSIONS E TIPOS (ENUMS)
-- ============================================================================

CREATE TYPE public.appointment_status AS ENUM (
  'pending_approval',
  'confirmed',
  'in_transit',
  'en_route',
  'arrived',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE public.appointment_type AS ENUM (
  'unit',
  'home'
);

CREATE TYPE public.app_role AS ENUM (
  'owner',
  'team_member'
);

-- ============================================================================
-- PARTE 2: TABELAS BASE (Sem FKs para auth.users)
-- ============================================================================

-- PROFILES
CREATE TABLE public.profiles (
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
CREATE TABLE public.subscriptions (
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USER_ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- ============================================================================
-- PARTE 3: UNITS E RELACIONADOS
-- ============================================================================

-- UNITS (Unidades de Negócio)
CREATE TABLE public.units (
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

-- Add FKs to profiles
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_linked_unit 
  FOREIGN KEY (linked_unit_id) REFERENCES public.units(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_active_staff_unit 
  FOREIGN KEY (active_staff_in_unit_id) REFERENCES public.units(id) ON DELETE SET NULL;

-- COMPANY_MEMBERS
CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'receptionist', 'staff')),
  commission_rate NUMERIC NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- ============================================================================
-- PARTE 4: SERVIÇOS E EQUIPA
-- ============================================================================

-- SERVICES
CREATE TABLE public.services (
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
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TEAM_MEMBER_SERVICES
CREATE TABLE public.team_member_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  UNIQUE (team_member_id, service_id)
);

-- TEAM_SHIFTS
CREATE TABLE public.team_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  day_of_week VARCHAR(3) NOT NULL CHECK (day_of_week IN ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')),
  is_working BOOLEAN NOT NULL DEFAULT true,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_member_id, day_of_week)
);

-- TEAM_COMMISSIONS
CREATE TABLE public.team_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL UNIQUE REFERENCES public.team_members(id) ON DELETE CASCADE,
  service_commission_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  product_commission_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- PARTE 5: CLIENTES E AGENDAMENTOS
-- ============================================================================

-- CLIENTS
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  birthday DATE,
  notes TEXT,
  technical_notes TEXT,
  no_show_count INTEGER DEFAULT 0,
  preferred_staff_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- APPOINTMENTS
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  assistant_id UUID REFERENCES public.profiles(id),
  service_ids UUID[] NOT NULL DEFAULT '{}',
  datetime TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  type appointment_type NOT NULL DEFAULT 'unit',
  status appointment_status NOT NULL DEFAULT 'pending_approval',
  assistant_status VARCHAR(50) DEFAULT 'pending' CHECK (assistant_status IN ('pending', 'on_the_way', 'arrived', 'in_service', 'completed', 'no_show', 'cancelled')),
  value NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  address TEXT,
  notes TEXT,
  internal_notes TEXT,
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  confirmation_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  customer_confirmed BOOLEAN,
  customer_confirmed_at TIMESTAMPTZ,
  started_traveling_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  service_started_at TIMESTAMPTZ,
  service_completed_at TIMESTAMPTZ,
  last_location_lat DECIMAL(10, 8),
  last_location_lng DECIMAL(11, 8),
  last_location_timestamp TIMESTAMPTZ,
  recurrence_type VARCHAR(20),
  recurrence_count INTEGER,
  parent_appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  image_url TEXT,
  brand TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SALES
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'mbway', 'other')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- PARTE 6: MOBILIDADE E ENTREGAS
-- ============================================================================

-- MOBILITY_SETTINGS
CREATE TABLE public.mobility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL UNIQUE REFERENCES public.units(id) ON DELETE CASCADE,
  base_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_per_km NUMERIC(10,2) NOT NULL DEFAULT 0,
  coverage_radius_km NUMERIC(10,2) NOT NULL DEFAULT 15.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DELIVERIES
CREATE TABLE public.deliveries (
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
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'en_route', 'arrived', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PARTE 7: STAFF E CONVITES
-- ============================================================================

-- INVITATIONS
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(unit_id, user_id)
);

-- STAFF_INVITATIONS
CREATE TABLE public.staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'Profissional',
  commission_rate NUMERIC DEFAULT 0,
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invited_by UUID NOT NULL,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

-- ============================================================================
-- PARTE 8: CONFIRMAÇÕES E RASTREAMENTO
-- ============================================================================

-- APPOINTMENT_CONFIRMATION_TOKENS
CREATE TABLE public.appointment_confirmation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('confirm', 'reschedule', 'cancel')),
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPOINTMENT_LOCATIONS (GPS History)
CREATE TABLE public.appointment_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(5, 2),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRACKING_SESSIONS
CREATE TABLE public.tracking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  last_ping_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PARTE 9: BLOQUEIOS E GALERIA
-- ============================================================================

-- STAFF_BLOCKED_TIME
CREATE TABLE public.staff_blocked_time (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- STAFF_BLOCK_REASONS
CREATE TABLE public.staff_block_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL,
  color_hex VARCHAR(7) DEFAULT '#fb923c',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(unit_id, reason)
);

-- UNIT_GALLERY
CREATE TABLE public.unit_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PARTE 10: Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_member_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobility_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_confirmation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_blocked_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_block_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_gallery ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 11: ÍNDICES
-- ============================================================================

-- Profiles
CREATE INDEX idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_recovery_token ON public.profiles(recovery_token) WHERE recovery_token IS NOT NULL;
CREATE INDEX idx_profiles_is_active_as_staff ON public.profiles(is_active_as_staff);
CREATE INDEX idx_profiles_active_staff_in_unit_id ON public.profiles(active_staff_in_unit_id);

-- Units
CREATE INDEX idx_units_owner_id ON public.units(owner_id);
CREATE INDEX idx_units_deleted_at ON public.units(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_units_owner_deleted ON public.units(owner_id, deleted_at);
CREATE INDEX idx_units_public_booking_slug ON public.units(public_booking_slug) WHERE is_public_visible = true;
CREATE INDEX idx_units_is_published ON public.units(is_published);

-- Subscriptions
CREATE INDEX idx_subscriptions_owner_id ON public.subscriptions(owner_id);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_sub ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_owner_status ON public.subscriptions(owner_id, status);
CREATE INDEX idx_subscriptions_will_delete_at ON public.subscriptions(will_delete_at) WHERE will_delete_at IS NOT NULL;

-- Company Members
CREATE INDEX idx_company_members_company_id ON public.company_members(company_id);
CREATE INDEX idx_company_members_user_id ON public.company_members(user_id);
CREATE INDEX idx_company_members_deleted_at ON public.company_members(deleted_at) WHERE deleted_at IS NULL;

-- Services
CREATE INDEX idx_services_unit_id ON public.services(unit_id);
CREATE INDEX idx_services_is_active ON public.services(is_active);

-- Team Members
CREATE INDEX idx_team_members_unit_id ON public.team_members(unit_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_deleted_at ON public.team_members(deleted_at) WHERE deleted_at IS NULL;

-- Team Shifts
CREATE INDEX idx_team_shifts_team_member_id ON public.team_shifts(team_member_id);

-- Clients
CREATE INDEX idx_clients_unit_id ON public.clients(unit_id);
CREATE INDEX idx_clients_preferred_staff ON public.clients(preferred_staff_id);
CREATE INDEX idx_clients_tags ON public.clients USING GIN(tags);
CREATE INDEX idx_clients_email ON public.clients(email);

-- Appointments
CREATE INDEX idx_appointments_unit_id ON public.appointments(unit_id);
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_team_member_id ON public.appointments(team_member_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_datetime ON public.appointments(datetime);
CREATE INDEX idx_appointments_status_datetime ON public.appointments(status, datetime DESC) WHERE status IN ('confirmed', 'en_route', 'arrived');
CREATE INDEX idx_appointments_assistant_id ON public.appointments(assistant_id) WHERE assistant_status IN ('on_the_way', 'arrived', 'in_service');
CREATE INDEX idx_appointments_assistant_status ON public.appointments(assistant_status) WHERE assistant_status != 'completed';
CREATE INDEX idx_appointments_parent_id ON public.appointments(parent_appointment_id);
CREATE INDEX idx_appointments_recurrence ON public.appointments(unit_id, recurrence_type);
CREATE INDEX idx_appointments_datetime_status ON public.appointments(datetime, status) WHERE reminder_sent_at IS NULL;

-- Products
CREATE INDEX idx_products_unit_id ON public.products(unit_id);
CREATE INDEX idx_products_is_active ON public.products(is_active);

-- Sales
CREATE INDEX idx_sales_unit_id ON public.sales(unit_id);
CREATE INDEX idx_sales_appointment_id ON public.sales(appointment_id);
CREATE INDEX idx_sales_client_id ON public.sales(client_id);
CREATE INDEX idx_sales_created_at ON public.sales(created_at DESC);

-- Deliveries
CREATE INDEX idx_deliveries_unit_id ON public.deliveries(unit_id);
CREATE INDEX idx_deliveries_appointment_id ON public.deliveries(appointment_id);
CREATE INDEX idx_deliveries_status ON public.deliveries(status);
CREATE INDEX idx_deliveries_created_at ON public.deliveries(created_at DESC);

-- Staff Invitations
CREATE INDEX idx_staff_invitations_token ON public.staff_invitations(token);
CREATE INDEX idx_staff_invitations_unit_id ON public.staff_invitations(unit_id);
CREATE INDEX idx_staff_invitations_email_sent ON public.staff_invitations(email_sent_at) WHERE email_sent_at IS NULL AND status = 'pending';

-- Appointment Confirmation Tokens
CREATE INDEX idx_appointment_confirmation_tokens_appointment_id ON public.appointment_confirmation_tokens(appointment_id);
CREATE INDEX idx_appointment_confirmation_tokens_token ON public.appointment_confirmation_tokens(token);

-- Appointment Locations
CREATE INDEX idx_appointment_locations_appointment_id ON public.appointment_locations(appointment_id);
CREATE INDEX idx_appointment_locations_assistant_id ON public.appointment_locations(assistant_id);
CREATE INDEX idx_appointment_locations_recorded_at ON public.appointment_locations(recorded_at DESC);

-- Tracking Sessions
CREATE INDEX idx_tracking_sessions_appointment_id ON public.tracking_sessions(appointment_id);
CREATE INDEX idx_tracking_sessions_active ON public.tracking_sessions(appointment_id) WHERE status = 'active';

-- Staff Blocked Time
CREATE INDEX idx_staff_blocked_time_team_member_id ON public.staff_blocked_time(team_member_id);
CREATE INDEX idx_staff_blocked_time_unit_id ON public.staff_blocked_time(unit_id);
CREATE INDEX idx_staff_blocked_time_date_range ON public.staff_blocked_time(start_time, end_time) WHERE status = 'active';

-- Unit Gallery
CREATE INDEX idx_unit_gallery_unit_id ON public.unit_gallery(unit_id);
CREATE INDEX idx_unit_gallery_service_id ON public.unit_gallery(service_id);
CREATE INDEX idx_unit_gallery_order ON public.unit_gallery(unit_id, display_order);

-- ============================================================================
-- PARTE 12: FUNÇÕES
-- ============================================================================

-- Update_updated_at function
CREATE FUNCTION public.update_updated_at()
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

-- Has role function
CREATE FUNCTION public.has_role(_user_id UUID, _role app_role)
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

-- Is company member function
CREATE FUNCTION public.is_company_member(_company_id UUID)
RETURNS BOOLEAN
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

-- Is company owner function
CREATE FUNCTION public.is_company_owner(_company_id UUID)
RETURNS BOOLEAN
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

-- Check plan limit function
CREATE FUNCTION public.check_plan_limit(_owner_id UUID, _resource TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan TEXT;
  _count INT;
BEGIN
  SELECT plan_type INTO _plan FROM public.subscriptions
    WHERE owner_id = _owner_id AND status IN ('active', 'trial', 'trialing')
    ORDER BY created_at DESC LIMIT 1;
  
  IF _plan IS NULL THEN RETURN false; END IF;
  
  IF _resource = 'company' THEN
    SELECT COUNT(*) INTO _count FROM public.units
      WHERE owner_id = _owner_id AND deleted_at IS NULL;
    IF _plan = 'monthly' THEN RETURN _count < 1; END IF;
    IF _plan = 'annual' THEN RETURN _count < 3; END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- Handle new user function
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner');
  
  INSERT INTO public.subscriptions (owner_id, plan_type, status, expires_at)
  VALUES (NEW.id, 'monthly', 'trial', now() + interval '14 days');
  
  RETURN NEW;
END;
$$;

-- Mark expired appointments as no_show
CREATE FUNCTION public.mark_expired_appointments_as_no_show()
RETURNS TABLE(updated_count INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count INT;
BEGIN
  UPDATE public.appointments
  SET 
    status = 'no_show',
    updated_at = NOW()
  WHERE
    status IN ('confirmed', 'en_route', 'arrived')
    AND (datetime + (duration || ' minutes')::interval) < NOW() - INTERVAL '15 minutes'
    AND status != 'completed'
    AND status != 'cancelled'
    AND status != 'no_show';
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN QUERY SELECT v_updated_count;
END;
$$;

-- Accept staff invitation
CREATE FUNCTION public.accept_staff_invitation(
  _token TEXT,
  _user_id UUID,
  _user_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv RECORD;
  _result JSONB;
BEGIN
  SELECT * INTO _inv FROM public.staff_invitations
  WHERE token = _token AND status = 'pending'
  LIMIT 1;

  IF _inv IS NULL THEN
    RETURN jsonb_build_object('error', 'Convite inválido ou já utilizado');
  END IF;

  IF _inv.expires_at < NOW() THEN
    RETURN jsonb_build_object('error', 'Convite expirado');
  END IF;

  UPDATE public.profiles SET
    user_type = 'staff',
    invited_via = _token,
    linked_unit_id = _inv.unit_id,
    onboarding_completed = true,
    is_active_as_staff = true,
    active_staff_in_unit_id = _inv.unit_id
  WHERE id = _user_id;

  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'owner';
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'team_member')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.team_members (unit_id, user_id, name, role, is_active)
  VALUES (_inv.unit_id, _user_id, COALESCE(_user_name, _inv.name, ''), _inv.role, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.company_members (company_id, user_id, role, commission_rate)
  VALUES (_inv.unit_id, _user_id, 'staff', COALESCE(_inv.commission_rate, 0))
  ON CONFLICT DO NOTHING;

  UPDATE public.staff_invitations SET status = 'accepted' WHERE id = _inv.id;
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

-- Create appointment confirmation token
CREATE FUNCTION public.create_appointment_confirmation_token(
  APPOINTMENT_ID UUID,
  ACTION VARCHAR
)
RETURNS TABLE(TOKEN VARCHAR, EXPIRES_AT TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  V_TOKEN VARCHAR;
BEGIN
  V_TOKEN := encode(gen_random_bytes(32), 'hex');
  
  INSERT INTO APPOINTMENT_CONFIRMATION_TOKENS (
    APPOINTMENT_ID,
    TOKEN,
    ACTION,
    EXPIRES_AT
  ) VALUES (
    APPOINTMENT_ID,
    V_TOKEN,
    ACTION,
    NOW() + INTERVAL '24 hours'
  );
  
  RETURN QUERY SELECT V_TOKEN::VARCHAR, (NOW() + INTERVAL '24 hours');
END;
$$;

-- Confirm appointment by token
CREATE FUNCTION public.confirm_appointment_by_token(
  TOKEN VARCHAR,
  CONFIRMED BOOLEAN
)
RETURNS TABLE(SUCCESS BOOLEAN, MESSAGE VARCHAR, APPOINTMENT_ID UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  V_APPOINTMENT_ID UUID;
  V_TOKEN_EXPIRED BOOLEAN;
BEGIN
  SELECT 
    APPOINTMENT_ID,
    (EXPIRES_AT < NOW()) AS TOKEN_EXPIRED
  INTO V_APPOINTMENT_ID, V_TOKEN_EXPIRED
  FROM APPOINTMENT_CONFIRMATION_TOKENS
  WHERE TOKEN = TOKEN AND USED = FALSE;
  
  IF V_APPOINTMENT_ID IS NULL THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, 'Token inválido ou expirado'::VARCHAR, NULL::UUID;
    RETURN;
  END IF;
  
  IF V_TOKEN_EXPIRED THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, 'Token expirado'::VARCHAR, NULL::UUID;
    RETURN;
  END IF;
  
  UPDATE APPOINTMENT_CONFIRMATION_TOKENS
  SET USED = TRUE, USED_AT = NOW()
  WHERE TOKEN = TOKEN;
  
  UPDATE APPOINTMENTS
  SET 
    CUSTOMER_CONFIRMED = CONFIRMED,
    CUSTOMER_CONFIRMED_AT = NOW()
  WHERE ID = V_APPOINTMENT_ID;
  
  RETURN QUERY SELECT TRUE::BOOLEAN, 'Confirmação registada'::VARCHAR, V_APPOINTMENT_ID;
END;
$$;

-- Update appointment location
CREATE FUNCTION public.update_appointment_location(
  P_APPOINTMENT_ID UUID,
  P_ASSISTANT_ID UUID,
  P_LATITUDE DECIMAL,
  P_LONGITUDE DECIMAL,
  P_ACCURACY DECIMAL DEFAULT NULL
)
RETURNS TABLE(SUCCESS BOOLEAN, MESSAGE TEXT)
AS $$
BEGIN
  INSERT INTO public.appointment_locations (
    APPOINTMENT_ID, ASSISTANT_ID, LATITUDE, LONGITUDE, ACCURACY
  ) VALUES (P_APPOINTMENT_ID, P_ASSISTANT_ID, P_LATITUDE, P_LONGITUDE, P_ACCURACY);

  UPDATE public.APPOINTMENTS
  SET LAST_LOCATION_LAT = P_LATITUDE,
      LAST_LOCATION_LNG = P_LONGITUDE,
      LAST_LOCATION_TIMESTAMP = NOW()
  WHERE ID = P_APPOINTMENT_ID;

  UPDATE public.TRACKING_SESSIONS
  SET LAST_PING_AT = NOW()
  WHERE APPOINTMENT_ID = P_APPOINTMENT_ID AND STATUS = 'active';

  RETURN QUERY SELECT TRUE::BOOLEAN, 'Location updated'::TEXT;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE::BOOLEAN, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Update appointment tracking status
CREATE FUNCTION public.update_appointment_tracking_status(
  P_APPOINTMENT_ID UUID,
  P_STATUS VARCHAR
)
RETURNS TABLE(SUCCESS BOOLEAN, STATUS VARCHAR, PREVIOUS_STATUS VARCHAR)
AS $$
DECLARE
  V_PREVIOUS_STATUS VARCHAR;
BEGIN
  SELECT ASSISTANT_STATUS INTO V_PREVIOUS_STATUS
  FROM public.APPOINTMENTS
  WHERE ID = P_APPOINTMENT_ID;

  UPDATE public.APPOINTMENTS
  SET ASSISTANT_STATUS = P_STATUS,
      STARTED_TRAVELING_AT = CASE 
        WHEN P_STATUS = 'on_the_way' AND STARTED_TRAVELING_AT IS NULL THEN NOW()
        ELSE STARTED_TRAVELING_AT 
      END,
      ARRIVED_AT = CASE 
        WHEN P_STATUS = 'arrived' AND ARRIVED_AT IS NULL THEN NOW()
        ELSE ARRIVED_AT 
      END,
      SERVICE_STARTED_AT = CASE 
        WHEN P_STATUS = 'in_service' AND SERVICE_STARTED_AT IS NULL THEN NOW()
        ELSE SERVICE_STARTED_AT 
      END,
      SERVICE_COMPLETED_AT = CASE 
        WHEN P_STATUS = 'completed' AND SERVICE_COMPLETED_AT IS NULL THEN NOW()
        ELSE SERVICE_COMPLETED_AT 
      END
  WHERE ID = P_APPOINTMENT_ID;

  RETURN QUERY SELECT TRUE::BOOLEAN, P_STATUS::VARCHAR, V_PREVIOUS_STATUS::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- Create delivery from appointment
CREATE FUNCTION public.create_delivery_from_appointment(
  P_APPOINTMENT_ID UUID,
  P_CUSTOMER_NAME VARCHAR,
  P_CUSTOMER_PHONE VARCHAR,
  P_CUSTOMER_ADDRESS TEXT,
  P_CUSTOMER_LAT NUMERIC,
  P_CUSTOMER_LON NUMERIC
)
RETURNS UUID AS $$
DECLARE
  V_DELIVERY_ID UUID;
  V_UNIT_ID UUID;
BEGIN
  SELECT unit_id INTO V_UNIT_ID
  FROM public.appointments
  WHERE id = P_APPOINTMENT_ID;

  IF V_UNIT_ID IS NULL THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  INSERT INTO public.deliveries (
    APPOINTMENT_ID,
    UNIT_ID,
    CUSTOMER_NAME,
    CUSTOMER_PHONE,
    CUSTOMER_ADDRESS,
    CUSTOMER_LAT,
    CUSTOMER_LON
  ) VALUES (
    P_APPOINTMENT_ID,
    V_UNIT_ID,
    P_CUSTOMER_NAME,
    P_CUSTOMER_PHONE,
    P_CUSTOMER_ADDRESS,
    P_CUSTOMER_LAT,
    P_CUSTOMER_LON
  )
  RETURNING id INTO V_DELIVERY_ID;

  RETURN V_DELIVERY_ID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete expired accounts
CREATE FUNCTION public.delete_expired_accounts()
RETURNS TABLE(DELETED_COUNT INT) AS $$
DECLARE
  V_DELETED_COUNT INT := 0;
BEGIN
  WITH ACCOUNTS_TO_DELETE AS (
    SELECT ID, EMAIL, DELETION_PERIOD_DAYS, DELETED_AT
    FROM PROFILES
    WHERE DELETED_AT IS NOT NULL
      AND (DELETED_AT + MAKE_INTERVAL(DAYS => DELETION_PERIOD_DAYS)) < NOW()
  )
  DELETE FROM PROFILES
  WHERE ID IN (SELECT ID FROM ACCOUNTS_TO_DELETE);
  
  GET DIAGNOSTICS V_DELETED_COUNT = ROW_COUNT;
  
  RETURN QUERY SELECT V_DELETED_COUNT;
END;
$$ LANGUAGE plpgsql;

-- Get user plan limits
CREATE FUNCTION public.get_user_plan_limits(USER_ID UUID)
RETURNS TABLE(MAX_UNITS INT, MAX_TEAM_PER_UNIT INT, CURRENT_UNITS BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(s.MAX_UNITS, 1)::INT AS MAX_UNITS,
    COALESCE(s.MAX_TEAM_PER_UNIT, 4)::INT AS MAX_TEAM_PER_UNIT,
    COUNT(u.ID)::BIGINT AS CURRENT_UNITS
  FROM SUBSCRIPTIONS s
  LEFT JOIN UNITS u ON u.OWNER_ID = USER_ID AND u.DELETED_AT IS NULL
  WHERE s.OWNER_ID = USER_ID
    AND s.STATUS IN ('active', 'trialing')
  GROUP BY s.MAX_UNITS, s.MAX_TEAM_PER_UNIT;
END;
$$ LANGUAGE plpgsql;

-- Archive user units on deletion
CREATE FUNCTION public.archive_user_units()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.DELETED_AT IS NOT NULL AND OLD.DELETED_AT IS NULL THEN
    UPDATE UNITS
    SET DELETED_AT = NEW.DELETED_AT,
        DELETION_TYPE = 'soft'
    WHERE OWNER_ID = NEW.ID;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create default block reasons
CREATE FUNCTION public.create_default_block_reasons()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.STAFF_BLOCK_REASONS (UNIT_ID, REASON, COLOR_HEX) VALUES
    (NEW.ID, 'Pausa', '#fca5a5'),
    (NEW.ID, 'Almoço', '#fbbf24'),
    (NEW.ID, 'Formação', '#60a5fa'),
    (NEW.ID, 'Férias', '#34d399'),
    (NEW.ID, 'Doença', '#f472b6'),
    (NEW.ID, 'Manutenção', '#a78bfa');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update confirmation tokens updated_at
CREATE FUNCTION public.update_confirmation_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.UPDATED_AT = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update staff blocked time updated_at
CREATE FUNCTION public.update_staff_blocked_time_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.UPDATED_AT = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update deliveries updated_at
CREATE FUNCTION public.update_deliveries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.UPDATED_AT = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Validate appointment delivery
CREATE FUNCTION public.validate_appointment_delivery()
RETURNS TRIGGER AS $$
DECLARE
  V_IS_VALID BOOLEAN;
BEGIN
  IF NEW.TYPE = 'home' AND NEW.ADDRESS IS NOT NULL THEN
    -- Basic validation could go here
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTE 13: TRIGGERS
-- ============================================================================

-- Auth user creation trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_mobility_settings_updated_at BEFORE UPDATE ON public.mobility_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_team_shifts_updated_at BEFORE UPDATE ON public.team_shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_team_commissions_updated_at BEFORE UPDATE ON public.team_commissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_staff_blocked_time_updated_at BEFORE UPDATE ON public.staff_blocked_time FOR EACH ROW EXECUTE FUNCTION public.update_staff_blocked_time_updated_at();
CREATE TRIGGER update_deliveries_updated_at_trigger BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.update_deliveries_updated_at();
CREATE TRIGGER trigger_confirmation_tokens_updated_at BEFORE UPDATE ON public.appointment_confirmation_tokens FOR EACH ROW EXECUTE FUNCTION public.update_confirmation_tokens_updated_at();
CREATE TRIGGER archive_units_on_delete BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.archive_user_units();
CREATE TRIGGER trigger_create_default_block_reasons AFTER INSERT ON public.units FOR EACH ROW EXECUTE FUNCTION public.create_default_block_reasons();
CREATE TRIGGER trigger_validate_appointment_delivery BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.validate_appointment_delivery();

-- ============================================================================
-- PARTE 14: SEED DATA
-- ============================================================================

-- Seed company_members for existing owners
INSERT INTO public.company_members (company_id, user_id, role)
SELECT id, owner_id, 'owner' FROM public.units
ON CONFLICT (company_id, user_id) DO NOTHING;

-- Update subscriptions with default plan limits
UPDATE public.subscriptions
SET max_units = CASE 
      WHEN plan_type = 'annual' THEN 3
      WHEN plan_type = 'monthly' THEN 1
      ELSE 1
    END,
    max_team_per_unit = 4
WHERE max_units IS NULL;

COMMIT;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Contar tabelas criadas
SELECT COUNT(*) as total_tables FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Contar funções criadas
SELECT COUNT(*) as total_functions FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Contar índices
SELECT COUNT(*) as total_indices FROM pg_indexes 
WHERE schemaname = 'public';
```

---

## 📌 Resumo de Implementação

### ✅ O que foi criado:
- **24 tabelas** com estrutura completa
- **3 ENUMs** para tipos
- **15+ funções** PL/pgSQL
- **19 triggers** para automação
- **40+ índices** para performance
- **RLS completo** em todas as tabelas

### 🔄 Ordem de Execução Crítica:
1. **Enums** (appointment_status, appointment_type, app_role)
2. **Tables base** (profiles, subscriptions, user_roles)
3. **Units + Company_members**
4. **Services + Team**
5. **Clients + Appointments**
6. **Sales, Products, Deliveries**
7. **Staff management** (invitations, blocking)
8. **Rastreamento** (locations, sessions)
9. **Confirmações** (tokens)
10. **Índices**
11. **Funções**
12. **Triggers**
13. **RLS Policies**

### 🎯 Tabelas críticas sem Foreign Keys entre elas inicialmente:
- profiles → depende de auth.users
- subscriptions → depende de auth.users
- units → depende de auth.users

Todas as outras tabelas podem ser criadas após estas três.


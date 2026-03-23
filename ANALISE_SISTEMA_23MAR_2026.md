# 📊 ANÁLISE COMPLETA DO LUMINA OS
**Data**: 23 de março de 2026 | **Status**: Sistema operacional com melhorias necessárias

---

## 🎯 VISÃO GERAL DO SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│                      LUMINA OS - SaaS                       │
│            Gestão de Agendamentos + Entregas                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FRONTEND             BACKEND            DATABASE           │
│  ──────────────────── ────────────────── ──────────────    │
│  React 18 + Vite      @tanstack/query    Supabase          │
│  TypeScript           Hooks + Context    PostgreSQL        │
│  Shadcn/Radix UI      Supabase SDK       18+ Tabelas       │
│  Mapbox (parcial)     Real-time GPS      Row-Level Sec.    │
│                       Row-Level Sec.                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 FRONTEND & UX/UI

### Arquitetura de Componentes
```
App.tsx (React Router)
└── PanelLayout (Sidebar + FAB)
    ├── Dashboard (Métricas, KPIs)
    ├── Agenda (Calendar view)
    ├── Clients (CRUD)
    ├── Team (Equipa)
    ├── Catalogo (Serviços)
    ├── Vendas (Histórico)
    ├── Unit (Configurações)
    ├── Delivery (GPS Tracking)
    └── Settings (Preferências)

Modais Principais:
├── QuickCheckoutSheet (Pagamento rápido)
├── AppointmentDetailSheet (Edição agendamento)
├── NewAppointmentSheet (Criar agendamento)
├── DeliveryGPSPanel (GPS + Check-in)
└── DeliveryMap (Visualização Mapbox)
```

### Componentes em Foco

#### 🔴 **SlideToAction** (Deslizar p/ Confirmar)
```typescript
Localização: src/components/SlideToAction.tsx
Função: Drag-based confirmation (80% threshold)
Cores: yellow | green | blue
Props: label, color, onConfirm, loading

❌ PROBLEMA CRÍTICO:
   Não chama onClose() após confirmar
   → Modal fica aberta
   → Experiência ruim do usuário

✅ SOLUÇÃO:
   Passar onClose como prop
   Chamar após onConfirm sucesso
```

#### 🔴 **QuickCheckoutSheet** (Pagamento Rápido)
```typescript
Localização: src/components/QuickCheckoutSheet.tsx
Fluxo: Cliente → Serviços → Pagamento → Slide-to-Confirm

Estados:
1. Seleção cliente
2. Seleção serviços
3. Escolher método (Cash/MBWay/Card/Gift)
4. Confirmar com slide
5. done=true (mostra checkmark 2s)
6. ❌ AQUI: Não fecha automaticamente

Métodos Pagamento:
├── 💰 Dinheiro (Banknote)
├── 📱 MBWay/Pix (Smartphone)
├── 💳 Cartão (CreditCard)
└── 🎁 Vale-presente (Gift)
```

#### 🟡 **DeliveryGPSPanel** (Rastreamento)
```typescript
Localização: src/components/DeliveryGPSPanel.tsx
Função: Geolocalização + Cálculo distância

Features:
✅ navigator.geolocation (pede permissão)
✅ Haversine distance formula
✅ Mostra coordenadas GPS
❌ Não renderiza mapa (depende de DeliveryMap)

Ações:
1. "Atualizar Localização" → GET GPS
2. Calcular distância até cliente
3. "Check-In" → Slide-to-Action
   ❌ Não fecha painel após check-in
```

#### 🔴 **DeliveryMap** (Visualização Mapa)
```typescript
Localização: src/components/DeliveryMap.tsx
Provider: Mapbox Static Images API

❌ PROBLEMAS:
1. VITE_MAPBOX_PUBLIC_TOKEN pode estar ausente
2. URL static map pode estar malformada
3. Componente com is tsignore (type issues)
4. imgError renderizado mas sem fallback visual

Código problemático:
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN
if (!hasCoords || !MAPBOX_TOKEN) return null  // ← Sem fallback
getStaticMapUrl() // Retorna string ou null

URL Format:
https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/
{markers}/{lon},{lat},{zoom,z-angle}/
{width}x{height}@2x?access_token={TOKEN}
```

#### 🟡 **AppointmentDetailSheet** (Edição Agendamento)
```typescript
Localização: src/components/AppointmentDetailSheet.tsx
Função: Editar agendamentos + pagamento

Features:
✅ Edição inline
✅ Numpad para valores
✅ Múltiplos métodos pagamento
✅ Toggle "Trajeto" (home visit)
❌ Múltiplos Slide-to-Actions sem onClose

Slides presentes:
1. "Completar" (Slide-to-Action verde)
2. "Cancelar" (Slide-to-Action vermelha)
3. "Confirmar" (Slide-to-Action amarela)

❌ NENHUM FECHA O PAINEL
```

---

## 🗄️ DATABASE SCHEMA

### Tabelas Principais (Foco)

#### profiles (Usuários)
```sql
id UUID PRIMARY KEY (auth.users)
├── full_name TEXT
├── avatar_url TEXT
├── language TEXT (default: 'pt')
├── user_type TEXT (owner|staff|professional)
├── onboarding_completed BOOLEAN
├── onboarding_step INTEGER
├── is_active_as_staff BOOLEAN
└── ❌ SEM CPF/DOCUMENTO PESSOAL
```

#### clients (Clientes)
```sql
id UUID PRIMARY KEY
├── unit_id UUID
├── name TEXT ✅
├── phone TEXT ✅
├── email TEXT ✅
├── birthday DATE ✅
├── notes TEXT ✅
├── technical_notes TEXT ✅
├── preferred_staff_id UUID ✅
├── tags TEXT[] ✅
└── ❌ FALTANDO: cpf VARCHAR(11)
```

#### appointments (Agendamentos)
```sql
id UUID PRIMARY KEY
├── unit_id, client_id, team_member_id UUID
├── service_ids UUID[] ✅
├── datetime TIMESTAMPTZ ✅
├── duration INTEGER ✅
├── status TEXT (pending_approval|confirmed|completed|cancelled)
├── type TEXT (unit|home)
├── address TEXT (para entregas)
├── value NUMERIC ✅
├── discount NUMERIC ✅
├── delivery_fee NUMERIC ✅
├── last_location_lat/lng DECIMAL ✅ GPS
├── assistant_status TEXT ✅ Rastreamento real-time
└── recurrence_type VARCHAR ✅ Agendamentos recorrentes
```

#### deliveries (Entregas)
```sql
id UUID PRIMARY KEY
├── appointment_id UUID ✅
├── unit_id UUID ✅
├── customer_name VARCHAR(255) ✅
├── customer_phone VARCHAR(20) ✅
├── customer_address TEXT ✅
├── customer_lat, customer_lon NUMERIC ✅
├── driver_lat, driver_lon NUMERIC ✅ Real-time GPS
├── status TEXT (pending|en_route|arrived|completed|cancelled)
├── started_at TIMESTAMPTZ ✅
└── completed_at TIMESTAMPTZ ✅
```

#### team_members (Profissionais)
```sql
id UUID PRIMARY KEY
├── user_id UUID (nullable - pode não ter auth)
├── unit_id UUID ✅
├── name TEXT ✅
├── photo_url TEXT ✅
├── role TEXT (professional|assistant)
├── accepts_home_visits BOOLEAN ✅
├── is_active BOOLEAN ✅
└── ❌ FALTANDO: cpf VARCHAR(11) (para autônomos)
```

---

## 🔐 AUTENTICAÇÃO & PERMISSÕES

### AuthContext Flow
```
┌─ Supabase Auth ─┐
│ (Email/Pass)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ AuthContext         │
├─────────────────────┤
│ user: User | null   │
│ session: Session    │
│ loading: boolean    │
│ signUp()            │
│ signIn()            │
│ signOut()           │
│ resetPassword()     │
│ updatePassword()    │
└────────┬────────────┘
         │
         ▼
    profiles (DB)
         │
    ┌────┴────┐
    │          │
 user_type  onboarding_completed
 (owner)    (false→true)
    │
    └─ CompanyContext
```

### User Types & Acesso
```
┌──────────────────────────────────────────┐
│            USER ROLES & ACESSO           │
├──────────────────────────────────────────┤
│                                          │
│ 👑 OWNER (owner_id = auth.users.id)      │
│  ├─ ✅ Dashboard (completo)              │
│  ├─ ✅ Agenda (própria + equipa)         │
│  ├─ ✅ Clientes (all)                    │
│  ├─ ✅ Team (gerenciar)                  │
│  ├─ ✅ Catalogo (criar/editar)           │
│  ├─ ✅ Vendas (relatórios)               │
│  ├─ ✅ Unit (configurações)              │
│  ├─ ✅ Delivery (all)                    │
│  └─ ✅ Settings (all)                    │
│                                          │
│ 👨‍💼 ADMIN/RECEPTIONIST                   │
│  ├─ ✅ Dashboard (limitado)              │
│  ├─ ✅ Agenda (visualizar)               │
│  ├─ ✅ Clientes (criar/editar)           │
│  ├─ ❌ Team (sem acesso)                 │
│  ├─ ✅ Catalogo (visualizar)             │
│  ├─ ❌ Vendas (sem acesso)               │
│  ├─ ❌ Unit (sem acesso)                 │
│  ├─ ✅ Delivery (apenas visualizar)      │
│  └─ ✅ Settings (pessoal)                │
│                                          │
│ 👨‍🔧 STAFF/PROFESSIONAL                   │
│  ├─ ❌ Dashboard                         │
│  ├─ ✅ Agenda (próprios agendamentos)    │
│  ├─ ✅ Clientes (visualizar)             │
│  ├─ ❌ Team                              │
│  ├─ ❌ Catalogo                          │
│  ├─ ❌ Vendas                            │
│  ├─ ❌ Unit                              │
│  ├─ ✅ Delivery (próprias entregas)      │
│  └─ ✅ Settings (pessoal)                │
│                                          │
└──────────────────────────────────────────┘
```

---

## 🐛 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. 🔴 **MODAIS NÃO FECHAM AUTOMATICAMENTE** (CRÍTICO)

**Afeta:**
- QuickCheckoutSheet
- AppointmentDetailSheet
- DeliveryGPSPanel (parcial)

**Sintoma:**
Após deslizar botão ou confirmar ação, o modal fica aberto.

**Causa Raiz:**
```typescript
// SlideToAction.tsx
const handlePointerUp = () => {
  if(offset >= maxRef.current * THRESHOLD) {
    // ✅ Chama onConfirm()
    onConfirm()
    // ❌ Mas NÃO chama onClose()
  }
  // Reset visual feedback
  setOffset(0)
  setDragging(false)
}

// QuickCheckoutSheet.tsx
setTimeout(() => {
  setDone(false)  // ✅ Reseta estado local
  // ❌ Mas onClose() não é chamado!
  // Modal continua renderizada
}, 2000)
```

**Stack Trace:**
```
QuickCheckoutSheet (open={true})
├── handleConfirm() → setDone(true)
├── setTimeout(2s) → setDone(false)
├── ✅ Resetou estado interno
├── ❌ onClose() não foi chamada
└── open permanece={true} ← PROBLEMA

useEffect → Sheet still visible
```

---

### 2. 🔴 **MAPA NÃO RENDERIZA VISUALMENTE** (CRÍTICO)

**Afeta:**
- DeliveryMap
- DeliveryGPSPanel (quando tenta mostrar mapa)

**Sintoma:**
Componente não exibe mapa, apenas branco/erro.

**Causas Prováveis:**

**a) Token Mapbox Ausente**
```typescript
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN
// Se undefined → getStaticMapUrl() retorna null
// Componente não renderiza nada (sem fallback)
```

**b) URL Malformada**
```typescript
const markersStr = [`pin-s+0ea5e9(${lon},${lat})`]
const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/
  ${markersStr}/[${minLon},${minLat},${maxLon},${maxLat}]/600x300@2x`
// ^ Formato pode estar incorreto
```

**c) Permissões CORS/Network**
Mapbox pode estar bloqueado por CORS ou requisição falha silenciosamente.

**Stack Trace:**
```
DeliveryMap component
├── getStaticMapUrl() 
│   ├── Verifica: hasCoords? ✅
│   ├── Verifica: MAPBOX_TOKEN? ❌ undefined
│   └── return null
├── imgError state ✅ Ativado
├── Renderiza: <img src={null} /> ← Problema
└── Página: [Mapa em branco]

ou

├── getStaticMapUrl() → URL gerada
├── <img src={url} /> 
└── Network Error → onLoad never fires
```

---

### 3. 🟡 **SEM NIF EM CLIENTES/PROFISSIONAIS** (IMPORTANTE)

**Afeta:**
- Cadastro de clientes
- Profissionais autônomos (para desimpedimento)
- Conformidade fiscal (RGPD Portugal)

**Campos Atuais:**
```
clients:
- id, unit_id, name, phone, email, birthday
- notes, technical_notes, preferred_staff_id, tags
- ❌ nif (Número de Identificação Fiscal)

team_members:
- id, user_id, unit_id, name, photo_url, role
- bio, accepts_home_visits, is_active
- ❌ nif

profiles:
- id, full_name, avatar_url, language, user_type
- onboarding_*, is_active_as_staff, active_staff_in_unit_id
- ❌ nif
```

**Solução Necesária:**
```sql
-- Adicionar NIF a clients (9 dígitos, validação portuguesa)
ALTER TABLE public.clients ADD COLUMN nif VARCHAR(9);

-- Adicionar NIF a team_members
ALTER TABLE public.team_members ADD COLUMN nif VARCHAR(9);

-- Adicionar NIF a profiles
ALTER TABLE public.profiles ADD COLUMN nif VARCHAR(9);

-- Criar índices para performance
CREATE INDEX idx_clients_nif ON public.clients(nif);
CREATE INDEX idx_team_members_nif ON public.team_members(nif);
CREATE INDEX idx_profiles_nif ON public.profiles(nif);

-- Restrição UNIQUE para evitar duplicação
ALTER TABLE public.clients ADD CONSTRAINT uk_clients_nif UNIQUE(nif);
ALTER TABLE public.team_members ADD CONSTRAINT uk_team_members_nif UNIQUE(nif);
ALTER TABLE public.profiles ADD CONSTRAINT uk_profiles_nif UNIQUE(nif);
```

**Formato NIF Portugal:**  
- 9 dígitos: `123456789`
- Validação: Dígito de verificação (algoritmo específico português)
- Exemplo válido: `162397635`

---

## ⚡ FLUXOS CRÍTICOS

### Fluxo 1: Pagamento Rápido
```
Dashboard FAB (+)
    ↓
QuickCheckoutSheet (bottom sheet, 90vh)
    ├─ Selecionar Cliente (dropdown)
    ├─ Selecionar Serviço(s) (toggle grid)
    ├─ Escolher Pagamento (4 opções)
    │  ├─ Dinheiro 💰
    │  ├─ MBWay/Pix 📱
    │  ├─ Cartão 💳
    │  └─ Vale-presente 🎁
    ├─ Slide-to-Action "Confirmar" (amarelo)
    ├─ ✅ onConfirm() executado
    ├─ ❌ onClose() NÃO executado ← PROBLEMA
    ├─ Mostrar "Pagamento Registado!" (2s)
    ├─ ❌ Painel continua visível
    └─ Usuário: "Por que ainda tá aberta??"
```

### Fluxo 2: Entrega com GPS
```
Delivery Page
    ↓
DeliveryGPSPanel (mostrar + map)
    ├─ "Atualizar Localização" → navigator.geolocation
    ├─ Calcular distância até cliente (Haversine)
    ├─ Slide-to-Action "Check-In" (verde)
    ├─ ✅ onCheckIn() executado
    ├─ ❌ onClose() NÃO executado ← PROBLEMA
    ├─ DeliveryMap (renderiza Mapbox)
    │  ├─ ❌ VITE_MAPBOX_PUBLIC_TOKEN undefined
    │  ├─ ❌ getStaticMapUrl() retorna null
    │  └─ Mostra: [Em Branco ou Erro]
    └─ Painel continua aberta + mapa vazio
```

### Fluxo 3: Edição de Agendamento
```
Agenda → Click Appointment
    ↓
AppointmentDetailSheet (direita)
    ├─ Editar cliente, horário, serviços
    ├─ Editar notas internas
    ├─ Toggle "Trajeto" (home visit) ← Toggle on
    │  ├─ ❌ Painel não fecha
    │  └─ Usuário continua editando
    ├─ Slide-to-Action "Completar" (verde)
    ├─ ✅ onConfirm() → Mark completed
    ├─ ❌ onClose() NÃO executado
    ├─ Painel continua aberta
    └─ Usuário precisa clicar X manualmente
```

---

## ✅ CHECKLIST DE CORREÇÕES

### 🔴 CRÍTICO (Fazer HOJE)
```
[ ] 1. Corrigir SlideToAction para fechar modal após confirmar
       → Adicionar prop onClose
       → Chamar após onConfirm() sucesso
       
[ ] 2. Corrigir Mapbox token e renderização
       → Verificar .env VITE_MAPBOX_PUBLIC_TOKEN
       → Adicionar fallback visual
       → Testar em browser
       
[ ] 3. Testar todos os fluxos de fechamento
       → QuickCheckout
       → Delivery GPS
       → Appointment Detail
```

### 🟡 IMPORTANTE (Fazer SEMANA)
```
[ ] 4. Adicionar NIF (Número de Identificação Fiscal) - Portugal
       →  Colunas: clients, team_members, profiles
       
[ ] 5. Implementar validação de NIF português
       → Algoritmo de check digit português
       → Máscara: 9 dígitos
       → Exemplo: 162397635
       
[ ] 6. Adicionar formulário de NIF em:
       → NewClientSheet
       → ClientDetailSheet
       → TeamMemberForm
       → ProfileForm
       
[ ] 7. Índices de performance para NIF
       → CREATE UNIQUE INDEX
       → Evitar duplicação
```

### 🟢 NÃO-URGENTE (Fazer PRÓXIMAS)
```
[ ] 9. Melhorar error states
       
[ ] 10. Adicionar retry p/ geolocalização falho
       
[ ] 11. Testar em dispositivos móveis
       
[ ] 12. Performance profiling
```

---

## 📊 NÚMEROS DO SISTEMA

| Métrica | Valor |
|---------|-------|
| Páginas Principais | 12+ |
| Componentes | ~40+ |
| Hooks Customizados | 12+ |
| Tabelas DB | 18+ |
| Métodos Pagamento | 4 (Cash, MBWay, Card, Gift) |
| User Types | 3 (Owner, Admin, Staff) |
| Moedas | EUR (extensível) |
| Idiomas | PT (extensível) |
| GPS Real-Time | ✅ Implementado |

---

## 🎯 PRÓXIMOS PASSOS (ORDEM)

1. **[30 min]** Corrigir SlideToAction + Modal onClose
2. **[15 min]** Validar Mapbox token e URL
3. **[1h]** Adicionar CPF (migration + formulários)
4. **[1h]** Testar fluxos completos
5. **[30 min]** Deploy em staging

---

## 📝 NOTAS TÉCNICAS

### Points Positivos ✅
- ✅ Arquitetura React bem organizada
- ✅ Real-time GPS tracking implementado
- ✅ Row-level security no banco
- ✅ Multi-tenancy com units
- ✅ Payment methods bem integrados
- ✅ Responsive design

### Points Negativos ❌
- ❌ Modal close logic faltando
- ❌ Mapbox não renderiza
- ❌ Sem CPF em clientes
- ❌ Type issues (# @ts-nocheck)
- ❌ Error handling genérico em alguns lugares

---

**Análise completa: LUMINA OS está bem estruturado, com 3 problemas críticos identificados que podem ser corrigidos em ~2-3 horas de trabalho.**

*Data: 23 de março de 2026*

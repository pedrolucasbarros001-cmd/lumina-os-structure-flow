# PLANO DE TESTES COMPLETO — LUMINA OS

## ✅ FLUXOS PRINCIPAIS A TESTAR

### 1️⃣ CADASTRO E ONBOARDING (Fluxo Owner)
**Objetivo:** Validar que um novo dono pode criar uma conta e configurar seu negócio

- [ ] **Signup**: Registar com email/password
- [ ] **Onboarding Passo 1**: Escolher "Trabajo Sozinho" vs "Tenho Equipa"
- [ ] **Onboarding Passo 2**: Selecionar 14 categorias (mínimo 1)
- [ ] **Onboarding Passo 3**: Inserir nome do negócio + escolher logística
- [ ] **Logística Unit**: Não pedir dados de delivery
- [ ] **Logística Home/Hybrid**: Pedir raio, taxa base, preço/km
- [ ] **Slug Gerado**: Verificar se `/company/{slug}` foi criado
- [ ] **Redirect**: Deve ir para `/dashboard` após conclusão

**Dados iniciais criados:**
- ✓ `profiles` — onboarding_completed=true
- ✓ `units` — slug, categories, is_published=false
- ✓ `company_members` — owner membership
- ✓ `team_members` — owner como profissional
- ✓ `mobility_settings` — se home/hybrid

---

### 2️⃣ DASHBOARD (Visão Geral)
**Objetivo:** Validar que o dashboard mostra dados corretos

- [ ] **Stats Cards**: Totais corretos (appointments, revenue, clients, team)
- [ ] **Commission Calculation**: Staff vê sua comissão (não hardcoded, vem da BD)
- [ ] **Apple Rings Chart**: Local vs Delivery ratio correto
- [ ] **Revenue Chart**: Trending por dia/semana/mês
- [ ] **Privacy Mode**: Toggle funciona e esconde valores
- [ ] **Staff View**: Staff vê apenas seus dados (não todo negócio)

---

### 3️⃣ AGENDA (Calendário)
**Objetivo:** Validar agendamentos e funcionalidades de agenda

**Owner View:**
- [ ] **Multi-Coluna**: Mostra coluna por cada staff member
- [ ] **Timeline 24h**: Marcas horárias correctas (00:00 - 23:59)
- [ ] **Current Time Line**: Indica hora atual em vermelho
- [ ] **Appointment Block**: Exibe tempo, nome cliente, status (cor correcta)
- [ ] **Home Icon**: Mostra 📍 para agendamentos delivery

**Staff View:**
- [ ] **Single Column**: Staff vê APENAS sua coluna (não outras)
- [ ] **Appointments Próprios**: Mostra apenas seus agendamentos

**Status & Cores:**
- [ ] `pending_approval` — amarelo
- [ ] `confirmed` — azul
- [ ] `en_route` — amarelo
- [ ] `arrived` — verde
- [ ] `completed` — cinzento
- [ ] `cancelled` — vermelho
- [ ] `no_show` — **laranja** ✓ (novo)

**Interações:**
- [ ] **Click Appointment**: Abre detail sheet
- [ ] **Long Press**: Inicia drag (visual feedback)
- [ ] **Drag-Drop**: Reschedule appointment + notificação
- [ ] **Create Appointment**: Click no tempo vazio (se implementado)

---

### 4️⃣ APPOINTMENT DETAIL & DELIVERY
**Objetivo:** Validar fluxo completo de atendimento

- [ ] **Open Detail**: Mostra todas as info (cliente, serviço, status, etc)
- [ ] **Status Transitions**:
  - `confirmed` → `en_route` (com localização)
  - `en_route` → `arrived` (mostra chegada)
  - `arrived` → `completed` (mostra "Pago")
- [ ] **Payment Status**: Indica se foi pago ou pendente
- [ ] **Delivery Icon**: Mostra 📍 se tipo="home"
- [ ] **Mapbox Integration**: Localização do cliente exibida correctamente
- [ ] **SlideToAction**: Botões de transição funcionam
- [ ] **Edit/Cancel**: Pode editar ou cancelar appointment

---

### 5️⃣ CLIENTES
**Objetivo:** Validar gestão de clientes

- [ ] **List View**: Mostra todos clientes com info básica
- [ ] **Create Client**: Pode adicionar novo cliente manualmente
- [ ] **Edit Client**: Atualiza dados correctamente
- [ ] **History**: Mostra appointmentOs passados do cliente
- [ ] **Auto-Create**: Agendamento público cria cliente automaticamente ✓ (novo)
- [ ] **Validation**: Email/telef validados (se houver)

---

### 6️⃣ SERVIÇOS
**Objetivo:** Validar catálogo de serviços

- [ ] **List View**: Mostra todos os serviços activos
- [ ] **Create Service**: Adiciona novo serviço (nome, duração, preço)
- [ ] **Edit Service**: Atualiza dados correctamente
- [ ] **Delete Service**: Remove (muda is_active=false)
- [ ] **Categories**: Associadas correctamente com serviços
- [ ] **Staff-Service Binding** ✓ (novo):
  - [ ] Editar staff e atribuir serviços
  - [ ] Mostrar count de serviços associados
  - [ ] Restrição: staff só vê seus serviços em agendamentos?

---

### 7️⃣ EQUIPA (Staff Management)
**Objetivo:** Validar gestão de staff

**Adicionar Membro — Fluxo Unificado** ✓ (novo):
1. **Opção A — Com Acesso:**
   - [ ] Inserir email
   - [ ] Gera token & envia convite
   - [ ] Link expira em 7 dias
   - [ ] Email usa novo template ✓

2. **Opção B — Sem Acesso:**
   - [ ] Adiciona sem login
   - [ ] Aparece na agenda
   - [ ] Role, comissão, home visits configuráveis

**Member Card** ✓ (novo):
- [ ] Exibe nome, role, foto
- [ ] Mostra count de atendimentos & revenue
- [ ] **Edit Button**: Abre sheet de serviços
- [ ] **Delete Button**: Remove staff

**Pending Invitations** ✓ (novo):
- [ ] Secção separada mostra convites
- [ ] Avatar + nome + dias até expiração
- [ ] Botão "Copiar Link"
- [ ] Botão "Cancelar Convite"

**Member Services** ✓ (novo):
- [ ] Click no botão ✏️ abre sheet
- [ ] Checkboxes para cada serviço
- [ ] Salvar atualiza `team_member_services`
- [ ] Count mostra serviços associados

**Commission Rate:**
- [ ] Slider de 0-100% durante adição
- [ ] Gravado na BD corretamente
- [ ] Dashboard mostra taxa do staff (não hardcoded) ✓

---

### 8️⃣ AUTENTICAÇÃO & CONVITES
**Objetivo:** Validar fluxo de convites e onboarding de staff

**Staff Invite Flow:**
- [ ] Owner envia convite via email
- [ ] Email recebido com link correcto (`/invite/{token}`)
- [ ] Link não expirado (< 7 dias)
- [ ] Click no link → AcceptInvitePage aberto
- [ ] Criar password e account
- [ ] Redirect → Agenda (vista staff)
- [ ] Status do convite muda para "accepted" na BD

**Redirect Protecciones:**
- [ ] Staff NÃO pode aceder `/team`, `/unit`, `/settings`
- [ ] Redireciona automaticamente para `/agenda`
- [ ] Owner pode aceder tudo normalmente

---

### 9️⃣ PUBLIC BOOKING
**Objetivo:** Validar agendamento público

- [ ] **Acesso**: Pode aceder sem login
- [ ] **Unit Selection**: Escolhe filial/unidade corretamente
- [ ] **Service Selection**: Lista serviços activos
- [ ] **Date/Time**: Picker funciona
- [ ] **Staff Selection**: Se equipa, mostra disponibilidade (?implementado?)
- [ ] **Auto-Create Client** ✓:
  - [ ] Se cliente não existe, cria automaticamente
  - [ ] Email + telef preenchidos
  - [ ] Status = `pending_approval` (manual confirmation)
- [ ] **Confirmation**: Email confirmação enviado
- [ ] **Status**: Appointment criado com status correcto

---

### 🔟 MOBILE RESPONSIVENESS
**Objetivo:** Validar interface em mobile

- [ ] **Sidebar**: Fecha automaticamente após navegar ✓ (novo)
- [ ] **Agenda**: Timeline legível em mobile
- [ ] **Buttons**: Acessíveis e tappable (min 44px)
- [ ] **Forms**: Inputs grandes o suficiente
- [ ] **Sheets**: Drawer from bottom funciona bem
- [ ] **Header**: Não quebra em telas pequenas

---

## 🔍 VERIFICAÇÕES DE DADOS

### Base de Dados — Tabelas Críticas

Verifique se as queries abaixo retornam dados correctos:

```sql
-- 1. Verificar owner & profile
SELECT id, email, user_type, onboarding_completed FROM profiles WHERE id = '{user_id}';

-- 2. Verificar unit/filial criada
SELECT id, name, slug, is_published, categories FROM units WHERE owner_id = '{user_id}';

-- 3. Verificar owner como team member
SELECT id, user_id, unit_id, name, role FROM team_members WHERE user_id = '{user_id}';

-- 4. Verificar appointments
SELECT id, client_id, team_member_id, status, datetime, value FROM appointments WHERE datetime::date = TODAY();

-- 5. Verificar staff-service binding
SELECT team_member_id, service_id FROM team_member_services WHERE team_member_id = '{staff_id}';

-- 6. Verificar convites pendentes
SELECT id, email, status, expires_at FROM staff_invitations WHERE unit_id = '{unit_id}' AND status = 'pending';

-- 7. Verificar comissão do staff
SELECT user_id, commission_rate FROM company_members WHERE company_id = '{unit_id}' AND role = 'staff';
```

---

## ❌ PROBLEMAS CONHECIDOS (A Verificar)

| # | Problema | Status | Prioridade |
|---|----------|--------|-----------|
| 1 | Drag-and-drop no Agenda talvez tenha bugs | ? | ALTA |
| 2 | Auto no-show (quando passa hora) | ? | MÉDIA |
| 3 | Email template URL template no Supabase | ⚠️ Manual | ALTA |
| 4 | Staff não vê seus serviços em agendamentos? | ? | MÉDIA |
| 5 | Validação de dados em forms | ? | MÉDIA |

---

## 📋 CHECKLIST FINAL (Pronto para Usar?)

Marque como ✓ conforme testa:

### Fluxos Básicos
- [ ] Owner pode registar-se
- [ ] Owner pode fazer onboarding
- [ ] Owner consegue aceder ao dashboard
- [ ] Staff pode ser convidado via email
- [ ] Staff consegue aceitar convite
- [ ] Staff consegue fazer login

### Features Principais
- [ ] Agenda funciona (multi-coluna owner, single staff)
- [ ] Appointments podem ser criados
- [ ] Appointments podem ser editados/cancelados
- [ ] Status transitions funcionam (confirmed → en_route → arrived → completed)
- [ ] Staff-serviços associados (novo) ✓
- [ ] Sidebar fecha em mobile ✓
- [ ] No-show tem cor laranja ✓
- [ ] Public booking cria clientes automaticamente ✓

### Segurança
- [ ] Staff não consegue aceder `/team`, `/unit`, `/settings`
- [ ] Owner consegue aceder tudo
- [ ] RLS policies funcionam

### Performance
- [ ] Dashboard carrega rápido (< 2s)
- [ ] Agenda lista rápida
- [ ] Sem memory leaks (abrir/fechar vários vezes)

---

## 🧪 Instruções Para Testar

### Ambiente Local
```bash
cd lumina-os-structure-flow
npm install  # Se necessário
npm run dev
# Aceda a http://localhost:5173
```

### Contas de Teste Sugeridas
1. **Owner Account**
   - Email: `owner@test.com`
   - Password: `Test123!`
   - Negócio: "Barbearia Teste"

2. **Staff Account**
   - Email: `staff@test.com`
   - Via convite (não faz onboarding)
   - Recebe email com link

### Dados de Teste (Populares)
```sql
-- Inserir alguns serviços de teste
INSERT INTO services (unit_id, name, duration, price, is_active) VALUES
  ('unit-id', 'Corte Cabelo', 30, 15.00, true),
  ('unit-id', 'Barba', 20, 10.00, true),
  ('unit-id', 'Massagem', 60, 50.00, true);

-- Inserir appointments de teste
INSERT INTO appointments (...) VALUES (...);
```

---

## 📝 Resultado Final

Depois de testar tudo, preencha:

**Data:** _______  
**Tester:** _______  
**Achados:**
- Bugs encontrados: 
- Features faltantes:
- Sugestões de melhoria:

**Status Geral:** [ ] Pronto para Usar [ ] Precisa Mais Trabalho


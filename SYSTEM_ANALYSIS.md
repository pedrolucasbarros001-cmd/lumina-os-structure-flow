# ANÁLISE: O QUE FALTA PARA O LUMINA OS SER COMPLETAMENTE USÁVEL

## 📊 STATUS GERAL DO SISTEMA

🟢 **Pronto para Uso:** ~75%  
🟡 **Em Desenvolvimento:** ~20%  
🔴 **Não Iniciado:** ~5%

---

## ✅ JÁ IMPLEMENTADO (Funcionalidades Básicas)

### Autenticação & Onboarding
- ✅ Signup com email/password
- ✅ Onboarding completo (4 passos): tipo → categorias → identidade → logística
- ✅ Slug gerado automaticamente
- ✅ Perfil de owner criado corretamente

### Dashboard
- ✅ Overview de stats (appointments, clientes, revenue, equipa)
- ✅ Revenue chart (tendências)
- ✅ Apple Rings (local vs delivery)
- ✅ Commission calculation (vem da BD, não hardcoded)
- ✅ Privacy mode toggle

### Agenda/Calendário
- ✅ Multi-coluna para owner (um staff por coluna)
- ✅ Single-coluna para staff (vê apenas a si)
- ✅ Timeline 24h com marcas horárias
- ✅ Current time indicator (linha vermelha)
- ✅ Appointment blocks com cores por status
- ✅ Status: pending_approval, confirmed, en_route, arrived, completed, cancelled, **no_show (laranja)**
- ✅ Home icon (📍) para delivery
- ✅ Drag-and-drop reschedule (com confirmação)

### Appointments
- ✅ Create new appointment
- ✅ Edit appointment (data/hora/staff)
- ✅ Cancel appointment
- ✅ Mark as completed/cancelled
- ✅ Status transitions (confirmed → en_route → arrived → completed)
- ✅ Payment tracking (completed = paid)
- ✅ Delivery tracking com Mapbox

### Clientes
- ✅ List all clients
- ✅ Create new client
- ✅ Edit client
- ✅ View appointment history
- ✅ **Auto-create on public booking** (novo)

### Serviços
- ✅ List active services
- ✅ Create service (nome, duração, preço)
- ✅ Edit service
- ✅ Soft-delete (is_active=false)

### Equipa (Staff Management) ✅ Completo
- ✅ **Unified flow** (um único fluxo para adicionar)
- ✅ Option A: Convite por email com token
- ✅ Option B: Adicionar sem acesso (aparece na agenda)
- ✅ **Staff-Service Binding** (novo) — associar staff aos serviços que faz
- ✅ **Pending Invitations view** (novo) — mostra convites activos
- ✅ Commission rate (slider 0-100%)
- ✅ Home visits toggle (aceita visitas ao domicílio)
- ✅ Delete staff member

### Mobile UX
- ✅ **Sidebar auto-close** (novo) — fecha ao navegar em mobile
- ✅ Responsive design (buttons 44px+)
- ✅ Bottom sheets (drawer from bottom)
- ✅ Touch-friendly interface

### Segurança & Access Control
- ✅ ProtectedRoute com checks de onboarding
- ✅ Staff bloqueado de `/team`, `/unit`, `/settings`
- ✅ RLS policies (isolamento de dados por unit)
- ✅ User type validation (owner vs staff)

### Public Booking
- ✅ Anonymous access
- ✅ Unit selection (dropdown de filiais)
- ✅ Service selection
- ✅ Date/Time picker
- ✅ **Auto-create client** (novo)
- ✅ Confirmation step

### Email & Notifications
- ✅ Convites de staff enviados
- ✅ Appointment confirmations
- ✨ **Email template customizable** (novo) — guia criado

---

## 🟡 PARCIALMENTE IMPLEMENTADO

### Delivery/Logistics
- ✅ Mapbox integration (geocoding de endereços)
- ✅ Delivery type toggle (home/unit/hybrid)
- ✅ Coverage radius (raio de cobertura em km)
- ✅ Base fee + price per km configuration
- ⚠️ **Falta:** Cálculo automático de distância + fee (não visto em agendamentos)
- ⚠️ **Falta:** Mapa de entrega em real-time (só coordenadas armazenadas)
- ⚠️ **Falta:** Validação de endereço dentro do raio

### Relatórios & Analytics
- ✅ Revenue por dia/semana/mês (chart)
- ✅ Personal dashboard para staff
- ⚠️ **Falta:** Exportar relatórios (PDF/CSV)
- ⚠️ **Falta:** Commission statements detalhas
- ⚠️ **Falta:** Analytics avançadas (cliente lifetime value, serviço mais popular, etc)

### Agendamento Avançado
- ✅ Drag-and-drop reschedule
- ✅ Manual appointment creation
- ⚠️ **Falta:** Create appointment ao clicar no time slot vazio (se implementado, pode ter bugs)
- ⚠️ **Falta:** Recurring appointments
- ⚠️ **Falta:** Blocked time (indisponibilidade manual do staff)
- ⚠️ **Falta:** Waitlist/Queue management

### Notificações
- ✅ Email confirmação appointment
- ✅ Email convite staff
- ⚠️ **Falta:** SMS notificações
- ⚠️ **Falta:** In-app notifications
- ⚠️ **Falta:** Push notifications (se PWA)

---

## ❌ NÃO IMPLEMENTADO (Mas Não Crítico para MVP)

### Pagamentos & Comissões
- ❌ Integração com Stripe/PayPal
- ❌ Online payment processing
- ❌ Automatic commission calculation & payout
- ❌ Invoice generation
- **Status:** Planeado para Fase 2

### Planos & Subscriptions
- ❌ Ciclo de pagamento mensal/anual
- ❌ Paywall de features (ex: max 4 staff no plano monthly)
- **Status:** Planeado para Fase 2

### Recursos Avançados
- ❌ Múltiplas filiais com conta centralizada
- ❌ Team collaboration features (notes, chat)
- ❌ Advanced scheduling (agendamento inteligente)
- ❌ Customer feedback/reviews
- ❌ Loyalty program management
- ❌ Inventory management

---

## 🔧 BUGS & ISSUES A RESOLVER ANTES DE USAR

| # | Issue | Severidade | Descrição | Solução |
|---|-------|-----------|-----------|---------|
| 1 | Email template URL | 🔴 CRÍTICA | Convites redirecionam errado | Atualizar template no Supabase (guia enviado) |
| 2 | Delivery distance calc | 🟠 ALTA | Distância não é calculada automaticamente | Calcular ao confirmar endereço (Google Distance Matrix API) |
| 3 | Auto no-show | 🟠 ALTA | Não marca automaticamente no-show após hora | Agendada cron job no Supabase (RPC) |
| 4 | Drag-drop resize | 🟡 MÉDIA | Pode ter visual glitches em timeline | Validar e testar thoroughly |
| 5 | Staff service restriction | 🟡 MÉDIA | Staff não vê restrição de seus serviços | Filtrar services em public booking baseado em staff |
| 6 | Mobile agenda | 🟡 MÉDIA | Agenda pode ser difícil de usar em mobile | Versão touch-friendly da timeline |
| 7 | Form validation | 🟡 MÉDIA | Alguns forms faltam validações | Adicionar validation messages |
| 8 | Error handling | 🟡 MÉDIA | Alguns fluxos não tratam erros bem | Adicionar try-catch & toast messages |

---

## ⚡ FEATURES ESSENCIAIS FALTANTES (Para MVP Responsável)

### 🔴 CRÍTICAS (Implementar Antes de Go-Live)

1. **Notificação de Staff Sobre Agendamento**
   - [ ] Quando novo appointment é criado para staff, enviar email
   - [ ] Quando appointment é cancelado, notificar staff
   - [ ] **Impacto:** Staff fica cego sem saber que tem clientes

2. **Auto-Decline no-show Após Hora**
   - [ ] Se appointment passou 15min sem marcar como completed/cancelled → no_show
   - [ ] **Impacto:** Manager fica constantemente marcando no-show manualmente

3. **Staff Indisponibilidade (Blocked Time)**
   - [ ] Staff poder marcar períodos como "não disponível"
   - [ ] Esses períodos não aparecem em agendamentos públicos
   - [ ] **Impacto:** Staff tem folgas, férias, pausas — sistema não pode ignorar

4. **Validação de Endereço em Delivery**
   - [ ] Verificar se endereço está dentro do raio
   - [ ] Rejeitar agendamento se estiver fora
   - [ ] **Impacto:** Aceitar delivery fora do raio causa prejuízo

5. **Confirmação de Appointment Automática**
   - [ ] Agora está sempre "pending_approval" ou confirmado
   - [ ] Owner deve poder auto-confirmar certos tipos (ex: pagamento upfront)
   - [ ] **Impacto:** Cliente fica incerto se foi agendado

### 🟠 ALTAS (Implementar na Primeira Semana)

1. **Sistema de Confirmação Cliente**
   - [ ] Cliente recebe link para confirmar sua presença 24h antes
   - [ ] Não confirmação → alerta ao owner

2. **Reschedule Iniciado pelo Cliente**
   - [ ] Cliente pode pedir reschedule (não só owner)
   - [ ] Owner aprova/rejeita

3. **Relatório de No-Shows**
   - [ ] Filtro por período
   - [ ] Count de no-shows por serviço/staff
   - [ ] **Impacto:** Entender padrões

4. **Configuração de Horário de Funcionamento**
   - [ ] Owner define horas de funcionamento (ex: 9am-6pm)
   - [ ] Agendamentos fora dessas horas bloqueados
   - [ ] **Impacto:** Evitar agendamentos a meia-noite

5. **Waitlist para Horários Cheios**
   - [ ] Cliente pode pedir para ser notificado se horário ficar disponível
   - [ ] **Impacto:** Conversão de cancelamentos

### 🟡 MÉDIAS (Nice-to-Have Fase 1)

1. **Integração SMS** — alertas via SMS
2. **Feedback/Reviews** — clientes comentam serviço
3. **Recurring Appointments** — agendamentos semanais/mensais
4. **Advanced Analytics** — top services, customer lifetime value
5. **Bulk Operations** — ex: cancelar múltiplos appointments

---

## 📋 DEPENDENCIES & INTEGRAÇÕES

### Já Implementadas ✅
- Supabase (Auth + DB)
- Mapbox (Geocoding)
- React Query (State management)
- shadcn/ui (Components)

### Faltam ❌
- **Google Distance Matrix API** (para cálculo de distância delivery)
- **Google Maps Directions API** (para rota de delivery em tempo real)
- **Stripe/PayPal** (para pagamentos — Fase 2)
- **Twilio/Firebase** (para SMS/push — Fase 2)

---

## 🚀 ROADMAP RECOMENDADO

### **HOJE** (Sprint 0 — Go-Live MVP)
✅ Completadas:
- Onboarding owner
- Dashboard básico
- Agenda multi-user
- Staff management
- Public booking

🔧 **Implementar agora:**
1. Email template no Supabase (manual)
2. Auto no-show cron job
3. Staff indisponibilidade (blocked time)
4. Confirmação cliente 24h antes
5. Hora funcionamento (config)

⏱️ **Tempo estimado:** 2-3 dias

---

### **SEMANA 1** (Bug Fixes + Polish)
- Fix drag-drop bugs
- Mejorar validações em forms
- Melhorar mensagens de erro
- Testar em mobile thoroughly
- Documentação para staff

⏱️ **Tempo estimado:** 2-3 dias

---

### **SEMANA 2** (Features Altas)
- System de confirmação cliente
- Reschedule iniciado por cliente
- Relatório de no-shows
- Waitlist management
- SMS notificações

⏱️ **Tempo estimado:** 5 dias

---

### **FASE 2** (Pagamentos + Planos)
- Integração Stripe
- Commission payout automation
- Planos & subscriptions paywall
- Invoice generation
- Advanced analytics

⏱️ **Tempo estimado:** 2-3 semanas

---

## ✨ QUICK WIN IMPROVEMENTS

Implementar em < 1 hora cada:

1. **Confirmação de Acção com Toast**
   - "Appointment criado!" após create
   - "Membro convidado!" após invite send
   
2. **Empty States Personalizadas**
   - "Sem serviços? Crie um em Serviços → +"
   - "Sem equipa? Convide alguém em Equipa → +"

3. **Loading States**
   - Skeleton screens enquanto carregam dados

4. **Search/Filter na Agenda**
   - Filtrar appointments por status/cliente

5. **Export Appointment List**
   - CSV rápido para backup/analytics

---

## 📱 CHECKLIST FINAL: SISTEMA PRONTO?

Marque para cada ponto:

### MVP Essencial (Deve Ter)
- [x] Signup + Onboarding owner
- [x] Dashboard com stats
- [x] Agenda funcional
- [x] Appointments create/edit/cancel
- [x] Clientes auto-create (public booking)
- [x] Staff management
- [x] Security (staff blocked de owner routes)

### Qual Falta?
- [ ] **Email template fix** (manual no Supabase)
- [ ] **Auto no-show** (cron job)
- [ ] **Staff blocked time** (feature)
- [ ] **Delivery validation** (distance check)
- [ ] **Customer confirmation** (email 24h)

### Se Todos Estes ✅ — SISTEMA PRONTO PARA BETA!

---

## 🎯 CONCLUSÃO

**Status:** Sistema está ~75% funcional  
**Go-Live:** Possível em 2-3 dias se implementar 5 items críticos  
**Time-to-Market:** Semana 1 eu recomendo MVP com bug fixes  

**Recomendação:** Começar com 1-2 filiais piloto, depois expand.


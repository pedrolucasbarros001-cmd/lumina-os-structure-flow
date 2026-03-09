

# LUMINA OS — Full Implementation Plan

## Overview
LUMINA OS is an operational system for service units (clinics, studios, barbershops). It manages structure, smart scheduling, team-service compatibility, manual approval, analytics, and mobility (home visits). The UI will be dark-first, multi-language (PT/EN), and follow an 8px grid with smooth transitions.

---

## Phase 1: Foundation & Database

### Database Schema (Supabase)
- **units** — name, logo, cover, address, phone, hours, accepts_home_visits
- **services** — name, duration, price, description, image, unit_id
- **team_members** — user_id, unit_id, name, photo, role, bio, accepts_home_visits
- **team_member_services** — links team members to services they perform
- **clients** — name, phone, email, unit_id (created only on confirmed appointment)
- **appointments** — client_id, unit_id, service(s), team_member_id, datetime, type (unit/home), status (pending_approval, confirmed, completed, cancelled, no_show), value, address
- **mobility_settings** — unit_id, base_fee, price_per_km
- **user_roles** — user_id, role (owner, team_member) with RLS

### Auth
- Email + password authentication via Supabase Auth
- Profile table linked to auth.users
- Role-based access: owner vs team member

### Multi-language
- i18n system with PT and EN, language switcher in settings

---

## Phase 2: Onboarding Flow (5 Steps)

A guided wizard that blocks access to the panel until complete:

1. **Create Unit** — name, logo, cover, address, phone, hours, home visits toggle
2. **Service Catalog** — add services (min 1 required), each with name, duration, price, description
3. **Team** — invite members, assign roles, link services, set home visit capability (min 1 member with 1 service)
4. **Mobility** — if home visits enabled: base fee + price/km
5. **Publish** — validation check (1 active service, 1 active member, hours configured), then publish public booking page

---

## Phase 3: Internal Panel

### Layout
- Dark-themed sidebar with exactly 8 items: Dashboard, Agenda, Atendimentos, Clientes, Equipa, Serviços, Unidade, Configurações
- Collapsible sidebar with icons
- Active route highlighting

### Agenda (Daily Operations)
- Vertical time grid with columns per team member
- Minimalist appointment cards showing client name + colored status bar
- Drag & drop to reschedule, resize to adjust duration
- Click opens a detailed side drawer with full appointment info and action buttons
- No metrics or revenue on this view — pure operations

### Atendimentos (Appointments Management)
- Table with advanced filters: client, service, team member, date, type, status, value
- Click opens drawer: client data, address (if home), services, status history, action buttons

### Clientes
- Clients appear only after a CONFIRMED appointment
- Table: name, phone, email, total appointments, accumulated revenue, last visit
- Click opens drawer with full history

### Equipa
- List: photo, name, role, home visits, linked services
- Click opens drawer: bio, services, revenue, avg occupancy, cancellation %, home/unit split

### Serviços
- List: name, duration, price, # of team members, total sold, revenue
- Click opens drawer with service analytics

### Unidade
- Edit unit details (same fields as onboarding step 1)

### Configurações
- Mobility settings, language, public page settings

---

## Phase 4: Dashboard (Analytics)

### Overview Cards
- Total revenue, appointments count, occupancy rate, avg ticket, cancellation %, home visit %

### Team Performance
- Table with per-member metrics + detailed drawer

### Service Performance
- Table with per-service metrics + detailed drawer

### Schedule Structure
- Occupancy heatmap
- Most profitable time slot
- Most profitable day

### Global Filters
- Date range, team member, service type

---

## Phase 5: Public Booking Page

### Sequential Flow
1. Select services from catalog
2. Select compatible team member (must perform ALL selected services; must accept home visits if applicable)
3. Select valid time slot (no conflicts, within business hours)
4. Choose type: Unit or Home visit
5. Enter client details (name, phone, email, address if home)
6. Confirmation screen

### Rules
- Never show invalid slots
- Never allow incompatible member selection
- Appointment created with status `PENDING_APPROVAL`
- Owner approves/rejects from the panel

---

## UX Principles Applied Throughout
- Dark-first theme with carefully chosen accent colors
- 8px spacing grid, consistent border-radius
- Smooth transitions (120–280ms), no bounce effects
- Minimal visual noise — one insight at a time
- System prevents errors rather than explaining them
- Drawers for detail views instead of page navigation


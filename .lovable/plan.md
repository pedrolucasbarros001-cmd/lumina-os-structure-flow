

# LUMINA OS — Visual & Architectural Evolution Plan

## What You're Asking For

A major visual and structural upgrade across two dimensions:

1. **Design System overhaul** — Pure black (#000000) background with aurora light effects, true glassmorphism (5% white + backdrop-blur), squircle corners everywhere, staggered cascade animations, rolling numbers (already partially done), and haptic-style feedback on key actions.

2. **Multi-tenant architecture** — One user can own multiple companies (like Meta Business Suite), with a subscriptions/plans system that enforces limits (Monthly: 1 company, 4 staff; Annual: 3 companies, 4 staff/each).

This is a **massive architectural change** that touches every file in the project. Here's a phased breakdown.

---

## Phase A: Design System Overhaul (Visual Layer)

### A1. `src/index.css` — Pure Black + Aurora Background
- Change dark mode `--background` from `228 18% 8%` to `0 0% 0%` (pure #000000)
- Change `--card` to `0 0% 100%` at 5% opacity (true glass)
- Change `--sidebar-background` to pure black
- Add aurora orbs as fixed pseudo-elements on `body::before` and `body::after`:
  - Cobalt Blue sphere (`hsla(220, 90%, 55%, 0.3)`) + Amethyst Purple (`hsla(270, 80%, 55%, 0.3)`)
  - `filter: blur(150px)`, positioned top-left and bottom-right, `pointer-events: none`

### A2. `src/index.css` — Glassmorphism Utility Update
- Update `.frosted-glass` dark variant: `background: rgba(255,255,255,0.05)`, `border: 1px solid rgba(255,255,255,0.08)`, `backdrop-filter: blur(24px)`
- Add `.glass-card` utility for cards: same glass treatment with `border-radius: 20px` (squircle feel)

### A3. Squircle Corners
- Update `tailwind.config.ts`: increase `--radius` to `1rem`, add `xl: 1.25rem`, `2xl: 1.5rem`
- Update `card.tsx`, `sheet.tsx`, `dialog.tsx` to use `rounded-2xl` by default

### A4. Stagger Animation Enhancement
- Already have `stagger-in` keyframe — enhance with per-child delay via CSS `nth-child` selectors (50ms increments)
- Add `.stagger-container > *:nth-child(n)` rules for up to 20 children

### A5. Haptic Feedback Simulation
- Add a `.haptic-press` utility class: `active:scale-[0.97]` + short 30ms transition
- Apply to all interactive buttons, cards, and nav items

### A6. Apply Glass to All Surfaces
- `AppSidebar.tsx`: Glass background instead of solid
- `PanelLayout.tsx` header: Glass treatment
- `AppointmentDetailSheet.tsx`, `QuickActionSheet.tsx`, `NewAppointmentSheet.tsx`: Glass modals
- Dashboard cards: Replace `frosted-glass` with new `glass-card`

---

## Phase B: Multi-Tenant Architecture (Database + Auth)

This is the structural shift from "1 user = 1 unit" to "1 user = N companies".

### B1. New Tables (Migration)

```text
subscriptions
├── id (uuid PK)
├── owner_id (FK profiles.id)
├── plan_type ('monthly' | 'annual')
├── status ('active' | 'cancelled' | 'trial')
├── started_at, expires_at
└── created_at, updated_at

companies (evolves from 'units')
├── Add: nif (text), settings_json (jsonb)
├── Rename conceptually but keep 'units' table name to avoid massive migration
└── No structural change needed — units already has all fields

company_members (evolves from implicit owner_id)
├── id (uuid PK)
├── company_id (FK units.id)
├── user_id (FK profiles.id)  
├── role ('owner' | 'receptionist' | 'staff')
├── commission_rate (numeric, default 0)
└── created_at
```

### B2. RLS Policy Overhaul
- Create `is_company_member(company_id uuid)` security definer function
- Replace all `units.owner_id = auth.uid()` checks with `is_company_member` lookups
- This allows staff/receptionists to access data too (not just owners)

### B3. Plan Enforcement
- Create `check_plan_limit(owner_id uuid, resource text)` DB function
- Returns boolean: checks subscription plan vs count of companies/members
- Frontend calls this before INSERT to show friendly error
- DB trigger as safety net to reject inserts exceeding limits

### B4. Company Switcher
- New component: `CompanySwitcher.tsx` in the sidebar header
- Dropdown showing all companies the user belongs to (via `company_members`)
- Selected company stored in React context (`CompanyContext`)
- All hooks (`useAppointments`, `useServices`, etc.) read from this context instead of `useUnit()`

### B5. Context & Hook Refactor
- New `src/contexts/CompanyContext.tsx`: stores `activeCompanyId`, `userRole`, `subscription`
- `useUnit()` → `useCompany()` (reads from context)
- All data hooks filter by `activeCompanyId` instead of `owner_id`

---

## Files Changed Summary

| File | Action |
|------|--------|
| `src/index.css` | Pure black BG, aurora orbs, glass utilities, stagger enhancement |
| `tailwind.config.ts` | Larger radius, squircle defaults |
| `src/components/ui/card.tsx` | Squircle + glass defaults |
| `src/components/ui/sheet.tsx` | Glass background |
| `src/components/ui/dialog.tsx` | Glass background |
| `src/components/AppSidebar.tsx` | Glass sidebar, company switcher slot |
| `src/layouts/PanelLayout.tsx` | Glass header |
| `src/pages/Dashboard.tsx` | Glass cards |
| DB migration | Create `subscriptions`, `company_members` tables + RLS functions |
| `src/contexts/CompanyContext.tsx` | **Create** — active company state |
| `src/components/CompanySwitcher.tsx` | **Create** — sidebar company dropdown |
| All hooks | Refactor to use `CompanyContext` |

---

## Recommendation

This is ~2-3 full implementation sessions worth of work. I recommend splitting into two approvals:

1. **First: Design System** (Phase A) — Pure visual, no DB changes, immediate impact
2. **Second: Multi-Tenant** (Phase B) — Structural, requires careful migration

Which phase should I implement first?




# Plan: Add "Vendas" Page + Rename "Unidade" to "Empresa" + Rebuild Public Booking

Three changes in one pass.

---

## 1. Add "Vendas" (Sales) Page to Sidebar

**New file: `src/pages/Vendas.tsx`**
- Transaction history page showing all appointments with `payment_status` data
- Frosted glass cards matching the Dashboard aesthetic
- Filters: timeframe pills (Hoje | 7 Dias | Mês | Ano) + payment method filter (Todos | Numerário | TPA | Online)
- Transaction list: each row shows date/time, client name, services, amount, payment method badge, payment status badge
- Summary card at top: total revenue, transaction count, breakdown by payment method
- Uses `useAppointments()` without date filter to get all, then filters client-side
- Shimmer loading skeleton

**Sidebar & routing changes:**
- `src/components/AppSidebar.tsx`: Add `{ key: 'vendas', label: 'Vendas', path: '/vendas', icon: Receipt }` after Catálogo
- `src/layouts/PanelLayout.tsx`: Add `'/vendas': 'Vendas'` to PAGE_TITLES
- `src/App.tsx`: Add `<Route path="vendas" element={<Vendas />} />` inside PanelLayout routes, import the page

## 2. Rename "Unidade" → "A Minha Empresa"

- `src/components/AppSidebar.tsx`: Change label from `'A Minha Unidade'` to `'A Minha Empresa'`
- `src/layouts/PanelLayout.tsx`: Change `'/unit': 'Unidade'` to `'/unit': 'A Minha Empresa'`
- `src/pages/Unit.tsx`: Add a Google My Business-style preview card at the top (cover image placeholder, logo circle overlay, business name, address, phone, rating placeholder, hours summary). Add a bio/description textarea field. Keep all existing form sections below.

**Database:** Add `bio` column to `units` table (text, nullable). Migration needed.

## 3. Rebuild Public Booking — 5-Step "Magic Container"

**Full rewrite of `src/pages/PublicBooking.tsx`** (~400 lines):

**Static Shell:**
- Top 35%: Cover image from `units.cover_url` with gradient-to-black, unit name/address/rating overlay
- Sticky footer: frosted glass (`backdrop-blur-[30px] bg-black/60`), left = subtotal (rolling numbers), right = "Próximo" / "Confirmar" button

**5 Steps inside Magic Container:**
1. **Logística**: Two squircle cards (Local vs Domicílio). Skipped if unit doesn't accept home visits → auto step 2
2. **Serviços**: Multi-select service cards with green glow + checkmark on selection, bounce animation. Filtered by `is_home_service` if domicílio chosen
3. **Profissional**: Avatar cards filtered by `team_member_services`. "Qualquer" option included
4. **Data & Hora**: Horizontal day ribbon + time pill grid. Available slots from `business_hours`. Selected pill turns green
5. **Checkout**: Summary, name/email/phone fields, confirm button. Success = animated checkmark

**Staggered animation:** Children enter with incremental `animation-delay` (50ms each), using CSS keyframe `stagger-in` (translateX(-20px) + opacity 0 → normal).

**New hook: `src/hooks/usePublicUnit.ts`**
- Fetches unit by slug (public RLS already allows reading published units)
- Fetches active services for that unit
- Fetches active team members + team_member_services

**CSS additions in `src/index.css`:**
- `.stagger-child` animation utility with nth-child delays
- `@keyframes stagger-in` for the left-to-right entry

## Files Changed

| File | Action |
|------|--------|
| `src/pages/Vendas.tsx` | **Create** — sales/transaction history page |
| `src/pages/PublicBooking.tsx` | **Rewrite** — 5-step wizard with magic container |
| `src/pages/Unit.tsx` | **Edit** — Google My Business preview + bio field |
| `src/hooks/usePublicUnit.ts` | **Create** — public data fetching by slug |
| `src/components/AppSidebar.tsx` | **Edit** — add Vendas, rename Unidade→Empresa |
| `src/layouts/PanelLayout.tsx` | **Edit** — add Vendas title, rename Unidade |
| `src/App.tsx` | **Edit** — add vendas route |
| `src/index.css` | **Edit** — stagger animation utilities |
| **DB migration** | Add `bio text` column to `units` table |


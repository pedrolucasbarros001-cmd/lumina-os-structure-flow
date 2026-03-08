

# Fix Agenda Navigation, FAB Visibility, Static Content & Missing Upload Features

## Issues Identified

1. **Agenda has no sidebar trigger** — The `PanelLayout` explicitly hides the header (including `SidebarTrigger`) when `isAgenda === true` (line 32). Users get stuck with no way to navigate away.

2. **FAB (+) button shows on every page** — The floating action button is always visible in `PanelLayout`. It should only appear on pages where quick creation makes sense (Agenda, Dashboard), not on Settings, Catálogo, Unit, etc.

3. **No profile/cover photo upload** — `Unit.tsx` shows placeholder gradients but has no upload functionality for logo or cover images. Need Supabase Storage integration.

4. **Catálogo has static mock products** — `MOCK_PRODUCTS` array with hardcoded data and non-functional "Adicionar Produto" button.

5. **Settings page has non-functional buttons** — "Perfil", "Segurança", "Idioma", "Aparência" rows are static with no actions.

## Changes

### 1. `src/pages/Agenda.tsx` — Add sidebar trigger to Agenda header
- Import `SidebarTrigger` from sidebar component
- Add a `SidebarTrigger` button at the top-left of the Agenda's sticky header (next to the date title), styled as a compact hamburger icon

### 2. `src/layouts/PanelLayout.tsx` — Conditionally show FAB
- Only render the FAB on specific routes: `/dashboard`, `/agenda`, `/clients`
- Hide it on `/settings`, `/catalogo`, `/unit`, `/vendas`, `/team`

### 3. `src/pages/Unit.tsx` — Add image upload for logo and cover
- Create a Supabase Storage bucket `unit-assets` (migration)
- Add click-to-upload on the cover image area (file input, upload to `unit-assets/{unit_id}/cover`)
- Add click-to-upload on the logo circle (file input, upload to `unit-assets/{unit_id}/logo`)
- Save URLs to `units.cover_url` and `units.logo_url` on upload
- Show upload progress indicator

### 4. `src/pages/Catalogo.tsx` — Remove mock products tab
- Remove `MOCK_PRODUCTS` array and `ProductsTab` component entirely
- Remove the "Produtos" tab button — keep only "Serviços" as the sole content
- Remove the tab switching state and UI, simplify to just the services list

### 5. `src/pages/SettingsPage.tsx` — Make rows functional or remove non-functional ones
- Remove "Idioma" and "Aparência" rows (not yet implemented)
- Make "Perfil" open an inline edit form for `full_name` (update `profiles` table)
- Make "Segurança" link to password reset flow via `supabase.auth.resetPasswordForEmail`
- Keep "Notificações" toggle as-is

### Files
| File | Action |
|------|--------|
| `src/pages/Agenda.tsx` | Add SidebarTrigger to header |
| `src/layouts/PanelLayout.tsx` | Conditionally show FAB |
| `src/pages/Unit.tsx` | Add image upload for logo/cover |
| `src/pages/Catalogo.tsx` | Remove mock products, keep services only |
| `src/pages/SettingsPage.tsx` | Remove static rows, add functional profile edit |
| DB migration | Create `unit-assets` storage bucket |


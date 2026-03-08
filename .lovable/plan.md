

# Fix Agenda Interactions, Double-X Bug, and Match Fresha UI

## Issues Identified

1. **Double X buttons**: `SheetContent` (sheet.tsx line 60-63) renders a built-in X close button, AND both `NewAppointmentSheet` and `AppointmentDetailSheet` render their own manual X. Result: two X buttons visible.

2. **NewAppointmentSheet** is a simple form — Fresha uses a multi-step flow: Client Select (full-screen list) → Service Select (full-screen list) → Appointment Detail with sticky footer.

3. **AppointmentDetailSheet** doesn't match Fresha — should have: blue header bar with date + chevron + X, client card with avatar/badge, date/time info card, services list with blue left border, "Adicionar serviço", sticky footer with Total + "Pagar agora" + "Checkout"/"Salvar".

4. **Reschedule confirmation** is a centered Dialog — Fresha uses a bottom sheet with "Atualizar agendamento" title, checkbox with client name + description text, and full-width "Atualizar" button.

5. **Drag mode**: Missing purple reschedule banner ("Remarcar para qui 5 mar, 2026" with X) and bottom sticky bar with "Cancelar" / "Salvar".

6. **Appointment blocks**: Should be cyan/sky-blue fill (like Fresha), not `bg-primary/10`.

---

## Changes

### 1. Fix `sheet.tsx` — Remove built-in X
Remove the auto-rendered `SheetPrimitive.Close` with X icon from `SheetContent`. The sheets will handle their own close buttons.

### 2. Rebuild `NewAppointmentSheet.tsx` — Multi-step Fresha flow
Three sequential full-screen steps inside one bottom Sheet:

- **Step 1 "Selecionar cliente"**: Search input with placeholder "Pesquisar cliente ou deixar em branco para clier", "Cadastrar cliente" option with purple + circle, "Sem reserva" option with walking icon, then client list with avatar initials + name + email. Selecting moves to step 2.

- **Step 2 "Selecionar serviço"**: Search input "Buscar serviço por nome", "Reservado recentemente" section showing last booked service card, then service categories with blue left-border items showing name, duration, and price (right-aligned). Selecting moves to step 3.

- **Step 3 Appointment detail**: Blue/primary header bar with date + chevron + X. Client card (name, email, "Novo" badge, "Ações" dropdown + envelope icon). Date/time info card (calendar icon + date, clock icon + time, repeat icon + "Não se repete"). Services section with blue left-border items (service name, time + duration + team member name). "Adicionar serviço" button. Sticky footer: Total + "Checkout" + "Salvar" buttons.

### 3. Rebuild `AppointmentDetailSheet.tsx` — Match Fresha detail view
Same layout as Step 3 of new appointment but for existing appointments:
- Blue header bar with date + chevron + X
- Client card with avatar, name, email, status badge, "Ações" dropdown
- Date/time card
- Services list with blue left-border
- "Adicionar serviço" button
- Sticky footer: Total amount, three-dot menu, "Pagar agora"/"Checkout" buttons
- Keep existing checkout/payment flow but trigger from footer buttons

### 4. Rebuild `RescheduleDialog` in `Agenda.tsx` — Bottom sheet style
Replace the centered Dialog with a bottom Sheet matching IMG_8854-2:
- Title "Atualizar agendamento" with X close
- Purple checkbox: "Notificar [client_name] sobre a remarcação"
- Description text below: "Enviar uma mensagem informando [client_name] que o agendamento foi remarcado"
- Full-width white "Atualizar" button

### 5. Add drag mode UI to `Agenda.tsx`
- Purple banner below header: "Remarcar para [date]" with X button to cancel
- Original appointment block gets faded/muted styling during drag
- Ghost copy at new position with cyan fill
- Sticky bottom bar with "Cancelar" (outline) and "Salvar" (white/filled) buttons

### 6. Update appointment block colors
Change from `bg-primary/10 border-l-primary` to `bg-sky-400/30 border-l-sky-400` (cyan/sky blue matching Fresha). Completed appointments stay grey/muted.

---

## Files Changed

- `src/components/ui/sheet.tsx` — Remove auto X button
- `src/components/NewAppointmentSheet.tsx` — Full rewrite (3-step Fresha flow)
- `src/components/AppointmentDetailSheet.tsx` — Full rewrite (Fresha detail view)
- `src/pages/Agenda.tsx` — Update RescheduleDialog, drag UI, appointment block colors


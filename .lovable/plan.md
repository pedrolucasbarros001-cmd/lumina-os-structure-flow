

# Fix Public Booking + Complete End-to-End Appointment & Payment Flows

## Root Cause: Public Booking Broken

The `appointments` table has **two RESTRICTIVE RLS policies** for INSERT:
1. "Public can create appointments for published units" (RESTRICTIVE)
2. "Unit owners can manage appointments" (RESTRICTIVE — requires `auth.uid() = owner_id`)

Since both RESTRICTIVE policies must pass, anonymous users can **never** insert. The insert silently fails (caught by try/catch), and `setSuccess(true)` never fires → blank page.

**Fix:** Change "Public can create" to **PERMISSIVE** so anonymous inserts work independently of the owner policy.

---

## Changes

### 1. DB Migration — Fix RLS for public appointment creation
- DROP the restrictive "Public can create appointments for published units" policy
- Re-create it as **PERMISSIVE** so anon users can insert without needing to pass the owner check

### 2. `src/pages/PublicBooking.tsx` — Fix submission + error handling
- Add proper error handling with user-visible toast on failure
- Show error state instead of blank page when insert fails
- Add `payment_status: 'unpaid'` explicitly to the insert payload

### 3. `src/pages/Agenda.tsx` — Complete reschedule logic
- `handleRescheduleConfirm` currently is a no-op (line 297-300). Implement actual DB update:
  - Update `datetime` and `team_member_id` on the appointment
  - Invalidate queries after update
  - Show toast confirmation

### 4. `src/components/AppointmentDetailSheet.tsx` — Add "Ações rápidas" menu + enrich detail view
Based on the Fresha reference images, add:
- **Quick Actions bottom sheet** (triggered by the `MoreHorizontal` button): "Adicionar nota", "Definir como recorrente", "Remarcar", "Ausência" (amber), "Cancelar" (red)
- **"Checkout" button** alongside "Pagar agora" in the footer (like Fresha: three-dot menu + "Pagar agora" + "Checkout")
- Update payment flow to save `payment_method`, `payment_status: 'paid'`, `paid_at`, and `amount_received` on the appointment when confirming payment
- Add "Adicionar ao carrinho" step (from reference) showing client card + services with "Continuar para o pagamento" button before the payment method selection

### 5. `src/components/AppointmentDetailSheet.tsx` — Payment method grid (Fresha-style)
Based on reference images, expand payment methods to a 2x2 grid:
- Dinheiro (cash icon, green)
- Vale-presente (gift icon)
- Dividir pagamento (split icon)
- Outros (dollar icon)
Plus the existing MBWay/Card options

### 6. `src/hooks/useAppointments.ts` — Add update mutation for reschedule
- Add `useUpdateAppointment` mutation that can update `datetime`, `team_member_id`, and other fields
- Used by both reschedule flow and payment confirmation

## Files

| File | Action |
|------|--------|
| DB migration | Fix RLS: make public insert PERMISSIVE |
| `src/pages/PublicBooking.tsx` | Fix error handling, show toast on failure |
| `src/pages/Agenda.tsx` | Implement reschedule DB update |
| `src/components/AppointmentDetailSheet.tsx` | Add quick actions menu, enrich checkout flow, save payment data |
| `src/hooks/useAppointments.ts` | Add `useUpdateAppointment` mutation |


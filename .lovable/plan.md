

# Fix Public Booking Home-Service Flow + Delivery Logistics + Enhanced Checkout

## 1. DB Migration — Add `en_route` and `arrived` to appointment_status enum

```sql
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'en_route' AFTER 'confirmed';
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'arrived' AFTER 'en_route';
```

This enables the Glovo-style status progression for home appointments.

---

## 2. New Component: `src/components/AddressAutocomplete.tsx`

- Dynamically loads Google Maps JS API via `<script>` if `VITE_GOOGLE_MAPS_KEY` is set
- Renders an `<Input>` with Google Places Autocomplete attached
- On place select: calls `onSelect({ address, lat, lng })`
- **Fallback**: if no API key, renders a plain text input for manual address entry
- Props: `onSelect`, `placeholder`, `defaultValue`

---

## 3. Update `src/hooks/usePublicUnit.ts` — Fetch mobility_settings

Add a `mobilityQuery` that fetches `mobility_settings` where `unit_id = unitId`. Return `mobility` (base_fee, price_per_km) alongside existing `unit`, `services`, `team`.

---

## 4. Update `src/pages/PublicBooking.tsx` — Address Step for Home Service

**New state**: `clientAddress`, `clientLat`, `clientLng`, `travelFee`, `distanceKm`

**Step logic change**: When `logistics === 'home'`, total steps = 6 (insert Step 5: Morada between Date/Hora and Confirmation). For `logistics === 'unit'`, steps remain 5.

**Step 5 (Morada)**: Shows `<AddressAutocomplete>`. On address select:
- Calculate `distance_km` via Haversine (unit lat/lng vs client lat/lng)
- If distance > `coverage_radius_km` → show "Fora da zona de cobertura" error, block advance
- Compute `travelFee = base_fee + (distance_km * price_per_km)`
- Show static Google Maps image preview if API key available

**Footer subtotal**: Include `travelFee` when `logistics === 'home'`.

**Submit payload**: Add `address`, `displacement_fee`, `distance_km` to the insert.

---

## 5. New Component: `src/components/SlideToAction.tsx`

A swipe-to-confirm button to prevent accidental taps during fieldwork:
- Container with a draggable circle/thumb
- User drags left→right; if released past 80% threshold → fires `onConfirm`
- Below threshold → spring-back animation
- Props: `label`, `color` (yellow/green/blue), `onConfirm`, `loading`

---

## 6. Update `src/components/AppointmentDetailSheet.tsx`

### 6a. Delivery Status Flow (for `type === 'home'`)

Add `en_route` and `arrived` to `STATUS_LABELS`. Update the footer logic:

| Current Status | Action | Next Status |
|---|---|---|
| `confirmed` (home) | SlideToAction "Iniciar Trajeto" (yellow) | `en_route` + open Google Maps directions |
| `en_route` | SlideToAction "Check-in" (green) | `arrived` |
| `arrived` | Button "Checkout" | → cart flow |

Show mini-map (static Google Maps image) in detail view when appointment has `address`.

### 6b. Enhanced Checkout Flow (Fresha-style)

Add views to the state machine: `'tip'` and `'processing'`.

**Flow**: Cart → **Tip** → Checkout (payment) → **Processing** → Done

- **`tip` view**: 2x2 grid (Sem gorjeta, 10%, 18%, 25%) + custom tip input. Footer: "A pagar €X" + "Continuar para o pagamento"
- **`processing` view**: Animated purple gradient circle + "Processando pagamento" text, 1.5s timer then auto-transition to `done`
- **`done` view**: Replace green circle with purple gradient orb + check icon + "Venda concluída" text (matching Fresha reference)

### 6c. Header color changes for home appointments

- `en_route` → yellow/amber header
- `arrived` → green header
- Default → sky blue (existing)

---

## 7. Environment Variable

User needs to add `VITE_GOOGLE_MAPS_KEY` to env. The `AddressAutocomplete` component degrades gracefully to a plain text input without it.

---

## Files Summary

| File | Action |
|---|---|
| DB migration | Add `en_route`, `arrived` to enum |
| `src/components/AddressAutocomplete.tsx` | Create — Google Maps autocomplete |
| `src/components/SlideToAction.tsx` | Create — swipe-to-confirm |
| `src/hooks/usePublicUnit.ts` | Add mobility_settings query |
| `src/pages/PublicBooking.tsx` | Address step, distance calc, travel fee |
| `src/components/AppointmentDetailSheet.tsx` | Delivery flow + tip + processing + done redesign |


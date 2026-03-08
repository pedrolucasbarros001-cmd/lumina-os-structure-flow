

# Fix Multi-Service Bug + Long Press Timing + Agenda UX Polish

## Changes

### 1. `src/components/NewAppointmentSheet.tsx` — Multi-service accumulation

- `selectedService` (single) → `selectedServices: Array<{id, name, duration, price}>` (array)
- Step 2: clicking a service **pushes** to the array (skip duplicates), then goes to `detail`
- Step 3: render **all** services in the list, each with a remove (X) button
- "Adicionar serviço" goes back to step 2 **without clearing** the array
- Footer total = `selectedServices.reduce(sum prices)`, duration = sum of durations
- On reset (sheet open): clear array to `[]`
- `handleSubmit`: `service_ids = selectedServices.map(s => s.id)`, `duration = sum`, `value = sum`

### 2. `src/pages/Agenda.tsx` — Long press timing & touch fixes

- Reduce both `setTimeout` calls from **500ms → 300ms** (lines 215 and 276)
- Add `touch-action-manipulation select-none` classes to the grid container (line 400)
- Add `e.preventDefault()` inside `handleGridPointerDown` to suppress selection handles
- Add `e.preventDefault()` inside `handleApptLongPressStart`

### 3. `src/pages/Agenda.tsx` — Appointment block status colors

Update `AppointmentBlock` to reflect the full color spectrum from the spec:
- `confirmed` → `bg-sky-400/20 border-l-sky-400` (already done)
- `home/delivery` → `bg-orange-500/15 border-l-orange-500` (already done)
- `arrived/in_progress` → `bg-emerald-500/15 border-l-emerald-500` (green neon)
- `completed` → `bg-muted/60 border-l-muted-foreground/40` (grey, already done)
- `cancelled` → `bg-destructive/10 border-l-destructive/40` (already done)

### Files
- `src/components/NewAppointmentSheet.tsx`
- `src/pages/Agenda.tsx`


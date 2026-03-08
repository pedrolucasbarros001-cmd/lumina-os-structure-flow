

# Rebuild Agenda as Fresha-style Vertical Time Grid

## What We're Building

A complete rewrite of `src/pages/Agenda.tsx` and `src/components/AgendaTutorialOverlay.tsx` to match the Fresha reference screenshots exactly:

### Agenda Layout (Fresha-identical)
- **Header**: Date with dropdown chevron, filter/notification/avatar icons on right
- **Team member avatars**: Horizontal row below header, each member gets a column
- **Vertical time grid**: Hours on the left (00:00 to 23:00), columns per team member, with thin gridlines
- **Appointment blocks**: Absolutely positioned within their team member column, spanning correct height based on duration (1hr = ~80px). Light blue/orange fill with left border accent. Shows "9:00am - 10:00am", client name bold, service name below
- **Current time indicator**: Red line spanning full width with red time badge on left edge
- **Long press on empty slot**: Shows a `+` icon in a light blue highlight zone, opens NewAppointmentSheet pre-filled with that team member and time
- **Drag & drop**: Hold an appointment block to drag it to another time/column. Shows ghost copy. On drop, opens a confirmation modal with "Atualizar agendamento" title + checkbox "Notificar cliente sobre a remarcação" + Cancel/Salvar buttons
- **Reschedule banner**: Purple banner at top saying "Remarcar para [date]" with X to cancel

### Tutorial Overlay (Fresha-identical)
Instead of the current card-based overlay, match the Fresha style:
- The actual agenda grid is visible behind a dark gradient overlay (bottom fade)
- **Step 1 (Swipe)**: Shows swipe arrows icon on the grid area + hand pointer. Bottom text: "**Percorrer calendário**" / "Deslize para a esquerda e para a direita para alternar datas e colaboradores". White "Próximo" button
- **Step 2 (Long Press)**: Shows `+` icon in a highlighted blue cell with hand pointer. Bottom text: "**Fazer agendamento**" / "Mantenha pressionado um horário no calendário para agendar". White "Próximo" button
- **Step 3 (Drag & Drop)**: Shows an appointment being dragged with ghost. Bottom text: "**Arraste e solte**" / "Mantenha pressionado um agendamento para arrastar e soltar". White "Concluído" button

## Files to Change

### Full Rewrite:
- **`src/pages/Agenda.tsx`** — Complete rebuild with:
  - Vertical time grid (24hr, 80px per hour)
  - Team member columns (fetched from `useTeamMembers`)
  - Absolutely positioned appointment blocks
  - Current time red indicator line
  - Long press handler (500ms timeout) to create appointment
  - Drag & drop with confirmation modal (checkbox for SMS notification)
  - Swipe navigation for days
  - Header matching Fresha style (date + chevron, icons)

- **`src/components/AgendaTutorialOverlay.tsx`** — Rebuild to show the actual grid behind a gradient overlay with mock appointment blocks and gesture indicators matching the Fresha screenshots exactly

### Minor Updates:
- **`src/components/NewAppointmentSheet.tsx`** — Accept `prefillTime` and `prefillTeamMemberId` props for long-press creation
- **`src/layouts/PanelLayout.tsx`** — Hide the top header bar when on `/agenda` (Fresha has its own header built into the page)

## Technical Approach

- Time grid: CSS Grid with `grid-template-rows` for hours, `grid-template-columns` for time label + team members
- Appointment positioning: Absolute positioning within each column cell, calculating `top` from start time and `height` from duration
- Drag: `onPointerDown` + `onPointerMove` + `onPointerUp` with state tracking (no library needed)
- Long press: `setTimeout` on `onPointerDown`, cleared on `onPointerUp`/`onPointerMove`
- Current time line: `useEffect` interval updating every minute
- Reschedule modal: Simple Dialog with checkbox + Cancelar/Salvar buttons


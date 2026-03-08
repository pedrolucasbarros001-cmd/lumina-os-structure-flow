

# Premium Dashboard Rebuild — Apple Spatial UI

Complete rewrite of `src/pages/Dashboard.tsx` with frosted glass cards, rolling number animations, swipeable sales container, Apple-style ring charts, privacy mode, timeframe filters, shimmer loading, and expandable team member cards.

## Architecture

### 1. Timeframe Filter (Global)
- Pill menu at the top: `Hoje | 7 Dias | Mês | Ano`
- State shared across all containers — changes trigger simultaneous re-fetch and animation
- Stored as `timeframe` state, used to compute date range for all queries

### 2. Privacy Mode (Eye Toggle)
- Icon button in the header next to the unit name
- `useState<boolean>` — when true, all `€` values render as `€ •••,••` with CSS `blur(8px)` filter
- Charts/graphs remain visible, only monetary values are obscured

### 3. Sales Container (Contentor de Vendas)
- **Rolling Numbers**: Custom `<RollingNumber>` component — digits animate vertically (translateY) from random positions to final value over ~800ms with staggered delays per digit
- **Swipe Navigation**: Use touch events (`onTouchStart`/`onTouchEnd`) to detect horizontal swipe — left swipe = go back one day, right swipe = go forward (max: today)
- **Payment method breakdown**: Show subtotals for Cash, TPA, Online below main value
- **Mini bar chart**: Recharts `<BarChart>` showing hourly revenue peaks (thin bars, no axes, just the bars)
- **Health indicator**: Compare today's revenue vs same weekday last week — show green `+12%` or red `-5%` badge

### 4. Modality Container (Apple Rings)
- Replace progress bars with **concentric ring arcs** using SVG `<circle>` with `stroke-dasharray`/`stroke-dashoffset`
- Outer ring = Local (blue), Inner ring = Delivery (purple)
- Animated fill on mount (CSS transition on `stroke-dashoffset`, 1.2s ease-out)
- Show displacement fee revenue total below rings
- Ring thickness: ~12px, rounded linecaps

### 5. Team Ranking Container (Gamification)
- Hidden when `profile.business_type === 'independent'`
- Top 3 with avatar, name, revenue, occupation rate
- **Expandable card**: Clicking a team member triggers `max-height` + `opacity` transition revealing individual mini-report (services count, avg ticket, occupation %)
- No page navigation — inline expansion with smooth morphing

### 6. Services Ranking Container (Shimmer Loading)
- **Shimmer skeleton**: On `isLoading`, render 5 skeleton rows with a CSS shimmer animation (linear-gradient moving left-to-right)
- Top 5 services with horizontal pill-style progress bars
- Show execution count + revenue weight percentage

### Files Changed

- **`src/pages/Dashboard.tsx`** — Full rewrite (~400 lines) with all 4 containers, rolling numbers, privacy mode, timeframe filter, ring chart SVG, shimmer skeletons, expandable team cards
- **`tailwind.config.ts`** — Add keyframes for `shimmer`, `roll-up`, `ring-fill` animations
- **`src/index.css`** — Add `.frosted-glass` utility class (`backdrop-blur-xl bg-white/5 border border-white/10`)

### Frosted Glass Card Style
All containers use: `backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl` — the "vidro fosco" effect. Works on dark backgrounds naturally with the existing dark theme.

### Data Queries
- Reuse existing `useAppointments(date)` hook but call it with computed date ranges based on timeframe
- For "7 Dias" / "Mês" / "Ano", fetch without date filter and filter client-side (appointments table already returns all unit appointments when no date passed)
- For last-week comparison, make a second query for the same weekday 7 days ago


# CLAUDE.md — Taplog project context

> Claude Code reads this file at the start of every session.
> Keep it up to date as the project evolves.

---

## What this project is

**Taplog** is a tap-first, tile-based time tracker that runs entirely in the browser.
No backend. No auth. No server. Pure static frontend deployed to Cloudflare Pages.

One screen. Activities as tiles. Tap to start, tap to pause. Daily auto-reset. localStorage persistence.

Full PRD and architecture rationale: `taplog-prd-devplan.md` (project root).

---

## Commands you will use

```bash
pnpm dev          # Vite dev server on :5173
pnpm test:watch   # Vitest in watch mode
pnpm test         # Vitest single run + coverage (must stay ≥ 80%)
pnpm typecheck    # tsc --noEmit, no build
pnpm lint         # ESLint + Prettier check
pnpm lint:fix     # Auto-fix
pnpm build        # Production build → dist/
pnpm e2e          # Playwright (runs build + preview internally)
pnpm e2e:ui       # Playwright interactive UI
```

**Before every commit, run:**
```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

---

## Tech stack

| Concern | Choice |
|---|---|
| Bundler | Vite 5 |
| Framework | React 18 + TypeScript strict |
| State | Zustand |
| Styling | Tailwind CSS v3 |
| Animation | CSS transitions + `@keyframes` only (no JS animation libs) |
| IDs | nanoid |
| Unit tests | Vitest + React Testing Library |
| E2E tests | Playwright (Chromium + Pixel 5 mobile viewport) |
| PWA | vite-plugin-pwa (Workbox, cache-first) |
| Linting | ESLint flat config + Prettier |
| Hosting | Cloudflare Pages (static, no functions) |

---

## Project structure

```
src/
  components/
    ActivityTile/       ActivityTile.tsx, ActivityTile.test.tsx, index.ts
    TileGrid/           TileGrid.tsx, TileGrid.test.tsx, index.ts
    Sidebar/            Sidebar.tsx, Sidebar.test.tsx, index.ts
    AddActivityModal/   AddActivityModal.tsx, index.ts
  store/
    taplogStore.ts      Zustand store — all state and actions
    taplogStore.test.ts Full unit tests for store logic
    persistence.ts      localStorage read/write/recover helpers
  hooks/
    useTick.ts          rAF-based 1-second tick for display updates only
  utils/
    time.ts             formatMs(ms: number): string  →  "HH:MM:SS"
    time.test.ts
  types.ts              Shared TypeScript interfaces
  test-setup.ts         @testing-library/jest-dom import
  App.tsx
  main.tsx
  index.css             Tailwind directives only
e2e/
  app.spec.ts
  undo.spec.ts
```

---

## Data model

```typescript
// localStorage key: "taplog_state"
interface TaplogState {
  date: string            // "YYYY-MM-DD" — checked on load for daily reset
  activities: Activity[]
}

interface Activity {
  id: string              // nanoid()
  name: string
  code?: string           // optional ≤5-char label shown on narrow tiles, e.g. "WORK"
  color: string           // hex from TILE_COLORS palette, assigned on creation
  isPause?: boolean       // Pause tile — stops running timer, no time tracking
  accumulatedMs: number   // total ms recorded before current run (always 0 for Pause tile)
  isRunning: boolean
  startedAt: number | null // Date.now() when last started; null when paused
}

// localStorage key: "taplog_undo_snapshot"
interface UndoSnapshot {
  timestamp: number
  activities: Pick<Activity, 'id' | 'accumulatedMs'>[]
}
```

---

## Store — shape and invariants

```typescript
// src/store/taplogStore.ts

interface TaplogStore {
  activities: Activity[]
  undoSnapshot: UndoSnapshot | null

  // Derived
  totalMs: () => number

  // Actions
  addActivity: (name: string, code?: string) => void  // assigns next palette color
  addPauseTile: () => void                             // adds isPause:true tile (amber color)
  renameActivity: (id: string, name: string, code?: string) => void
  deleteActivity: (id: string) => void
  toggleTimer: (id: string) => void
  resetActivity: (id: string) => void
  resetAll: () => void
  undo: () => void

  // Internal
  _persist: () => void
  _checkDayChange: () => void
}
```

**Invariants — never violate these:**
1. At most one activity has `isRunning: true` at any time
2. `toggleTimer` pauses any currently running activity before starting the new one
3. On pause: `accumulatedMs += Date.now() - startedAt`, then `startedAt = null`, `isRunning = false`
4. `_persist()` is called after every mutating action — never inside the tick/render loop
5. `_checkDayChange()` runs once on store hydration (app start); if stored date ≠ today, reset all `accumulatedMs` to 0 and `isRunning` to false, update date, clear snapshot
6. Before `resetActivity` or `resetAll`, save an `UndoSnapshot` to both store state and localStorage
7. `undo()` is a no-op when `undoSnapshot` is null

---

## Timer display — critical pattern

**Never store live elapsed ms in state or localStorage.**

```typescript
// Correct way to compute display value anywhere in the UI:
const displayMs = activity.accumulatedMs +
  (activity.isRunning && activity.startedAt
    ? Date.now() - activity.startedAt
    : 0)
```

`useTick` fires a state update every ~1 second to trigger re-renders.
It uses `requestAnimationFrame` internally, not `setInterval`, to avoid drift.

---

## Component architecture

```
App
├── TileGrid                     fills ALL available space (full height + width)
│   ├── ActivityTile × N         layout computed to keep tiles square-ish
│   │   ├── name / code          dominant label at top (name if wide, code if narrow)
│   │   ├── large central button  start/pause — primary tap target; "● Tracking" when active
│   │   ├── HH:MM:SS timer       bottom, smaller, secondary (hidden on Pause tile)
│   │   └── context menu (⋯)    → rename+code / reset tile / delete
│   ├── PauseTile                glows amber when nothing is tracking
│   └── AddTileButton            always the last card in the grid
└── Sidebar                      fixed right panel; bottom bar on mobile (≤640px)
    ├── date display
    ├── total time (sum of all tiles)
    ├── per-tile breakdown list
    ├── undo button (hidden when no snapshot)
    └── reset-all button
```

### TileGrid layout algorithm

The grid must fill **both dimensions** of the main area. Column and row count are computed from the total tile count (activities + Add button):

```typescript
function gridLayout(count: number): { cols: number; rows: number } {
  // Aim for square-ish cells given the viewport aspect ratio.
  // Simple heuristic: pick cols = ceil(sqrt(count)), rows = ceil(count / cols).
  const cols = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / cols)
  return { cols, rows }
}
// Grid style: grid-template-columns: repeat(cols, 1fr)
//             grid-template-rows:    repeat(rows, 1fr)
//             height: 100%
```

Tiles with `isBreak: true` render with a coffee-cup icon instead of a play/pause arrow, and a distinct muted style (lower saturation accent).

### Tile visual hierarchy (top → bottom)

Regular activity tile:
```
┌─────────────────────┐
│ NAME or CODE   [⋯] │  ← large, dominant; shows code when tile width < threshold
│                     │
│      [ ▶ / ⏸ ]     │  ← 80×80 min circular button, tile's accent color
│   ● Tracking        │  ← visible only when tracking (not "Running")
│     00:00:00        │  ← DM Mono, bottom, secondary
└─────────────────────┘
```

Pause tile (when nothing is tracking — glows amber):
```
┌─────────────────────┐  ← amber border + glow + pulse
│      Pause     [⋯] │
│                     │
│       [ ⏸ ]        │  ← amber, pulsing
│                     │
│  (no timer shown)   │
└─────────────────────┘
```

---

## Design system

**Theme:** dark, warm-tinted background (slightly warmer than pure charcoal to reduce harshness).

```css
/* CSS variables — define in index.css */
--bg-base:       #0e1016;   /* page background — very slightly warm tint */
--bg-tile:       #181b26;   /* idle tile */
--bg-tile-hover: #1e2133;
--bg-sidebar:    #12141e;
--text-primary:  #ddd8f0;   /* warm off-white, replaces cold #e2e8f0 */
--text-muted:    #6b6d85;
--danger:        #ef4444;
--success:       #22c55e;
/* --accent is per-tile; no global --accent for tile coloring */
```

**Neon palette — auto-assigned in order, cycling:**
```typescript
export const TILE_COLORS = [
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#22c55e', // green
  '#f43f5e', // rose
  '#6366f1', // indigo
] as const
// Activity created at index N gets TILE_COLORS[activities.length % TILE_COLORS.length]
// Pause tile always gets amber (#f59e0b)
```

**Idle tile:** `border: 1px solid {color}` at 25% opacity.  
**Hover tile:** `border: 1px solid {color}` at 50% opacity.  
**Tracking tile:** `border: 2px solid {color}` + `box-shadow: 0 0 24px {color}59` + `@keyframes tile-pulse`.  
**Pause tile (nothing tracking):** amber glow + pulse, ⏸ icon centered, no timer counter.  
**Pause tile (something tracking):** dim amber border, ⏸ icon, acts as stop button.

**Button borders:** use `border: 1px solid` (NOT Tailwind `ring-*`) everywhere — `ring-*` clips on macOS Safari.

**Language:** use **"Tracking"** not "Running" throughout — aria-labels, text indicators, comments.

**Sidebar total timer color:**
- Total < 8 h → orange `#fb923c`
- Total ≥ 8 h → green `#4ade80`

**Typography:**
- Timer digits: `DM Mono` (Google Fonts)
- Names, labels: `Inter` (Google Fonts)

**Tap button:** min 80×80 px, circular. Background: tile color at 15% opacity (idle) / 25% (tracking). Icon in tile color. Press: `transform: scale(0.94)` on `:active`.

**Transitions:** `transition: all 200ms ease` on all state changes.

**No JS animation libraries.** CSS only.

---

## Accessibility requirements (non-negotiable)

- All interactive elements have `aria-label` or visible text
- Tap targets ≥ 48 × 48 px (verified in Playwright with `boundingBox()`)
- Keyboard navigable: Tab to each tile, Enter/Space to toggle timer
- Running state communicated via `aria-pressed` on the toggle button
- Color is never the only signal — running tiles also have a text indicator

---

## Testing requirements

**Unit tests (Vitest + RTL):**
- Every store action has a test
- Day-change logic tested with mocked `Date.now`
- Undo snapshot lifecycle: save → undo → cleared on new day
- `formatMs` edge cases: 0, 999, 59999, 3599999, 86399999 (23h 59m 59s)
- `ActivityTile`: renders name, time, correct `aria-pressed` state
- `Sidebar`: correct total, undo button visibility

**E2E tests (Playwright, Chromium + Pixel 5):**
- Start timer → pause → reload → time persists
- Add 5 tiles → grid reflows, no overflow
- Reset tile → undo → time restored
- Reset all → undo → all times restored
- Day-change simulation (mock `Date` in page context) → times reset, names kept

**Coverage gate:** ≥ 80% lines/functions/branches. CI fails if below.

---

## What NOT to do

- **No `any` in TypeScript.** ESLint will error on it.
- **No external API calls.** The app must work fully offline.
- **No `setInterval` for the display tick.** Use `requestAnimationFrame` via `useTick`.
- **No writing live elapsed ms to localStorage on every tick.** Only persist on pause/action.
- **No inline styles** except for dynamic values that Tailwind can't express (e.g. computed widths). Use CSS variables + Tailwind classes.
- **No animation libraries** (Framer Motion, GSAP, etc.). CSS transitions only — keeps bundle tiny for old devices.
- **No React Context for global state.** Zustand is the single source of truth.
- **Do not remove the 80% coverage threshold** in `vitest.config.ts`.
- **Do not commit directly to `main`.** Branch protection requires CI to pass.

---

## LocalStorage schema validation

`persistence.ts` must handle corrupt or missing data gracefully:

```typescript
// On load: if parse fails or schema is invalid → return defaultState, do not crash
// Validate: date is a string, activities is an array, each activity has required fields
// Migration hook: if schema version changes in future, transform old data here
```

---

## Current status

Update this section as phases complete.

- [x] Phase 0 — Scaffold (Vite + config files + directory structure)
- [x] Phase 1 — Store & logic (`taplogStore`, `persistence`, unit tests)
- [x] Phase 2 — Components (full UI, RTL tests)
- [x] Phase 3 — PWA & polish (manifest, service worker, a11y audit)
- [x] Phase 4 — CI/CD (GitHub Actions, E2E tests, Cloudflare deploy)
- [ ] Phase 5 — v1.1 redesign (tile fill, square layout, neon colors, name/code, break tile, palette softening, button fix)

---

## Definition of done (senior reviewer checklist)

- [ ] TypeScript strict — zero `any`, zero suppressed errors
- [ ] ESLint passes — zero warnings
- [ ] Unit coverage ≥ 80%
- [ ] All E2E tests pass on Chromium + Pixel 5 viewport
- [ ] Lighthouse: Performance ≥ 90, Accessibility ≥ 90, PWA ≥ 90
- [ ] No external network calls in DevTools network tab
- [ ] localStorage corrupt data → graceful recovery, not crash
- [ ] All tap targets ≥ 48 × 48 px
- [ ] CI green before every merge to main
- [ ] README.md covers local setup, test commands, deploy setup

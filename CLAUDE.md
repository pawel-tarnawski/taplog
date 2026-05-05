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
  accumulatedMs: number   // total ms recorded before current run
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
  addActivity: (name: string) => void
  renameActivity: (id: string, name: string) => void
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
├── TileGrid                     fills 80-85% viewport width
│   ├── ActivityTile × N
│   │   ├── tile name (editable on double-tap/click)
│   │   ├── timer display (HH:MM:SS, updates every second)
│   │   ├── large central tap button (start / pause)
│   │   └── context menu (⋯) → rename / reset tile / delete
│   └── AddTileButton            always the last card in the grid
└── Sidebar                      fixed right panel; bottom bar on mobile (≤640px)
    ├── date display
    ├── total time (sum of all tiles)
    ├── per-tile breakdown list
    ├── undo button (hidden when no snapshot)
    └── reset-all button
```

---

## Design system

**Theme:** dark, deep charcoal background.

```css
/* CSS variables — define in index.css */
--bg-base:       #0f1117;   /* page background */
--bg-tile:       #1a1d27;   /* idle tile */
--bg-tile-hover: #1f2335;
--bg-sidebar:    #13151f;
--accent:        #3b82f6;   /* electric blue — running state */
--accent-glow:   rgba(59, 130, 246, 0.35);
--text-primary:  #e2e8f0;
--text-muted:    #64748b;
--danger:        #ef4444;
--success:       #22c55e;
```

**Typography:**
- Timer digits: `DM Mono` (Google Fonts)
- UI labels and names: `Inter` (Google Fonts)

**Running tile:** vivid `--accent` border + `box-shadow: 0 0 24px var(--accent-glow)` + subtle pulse `@keyframes` on the border glow.

**Tap button:** large (min 80px × 80px), circular, press animation via `transform: scale(0.94)` on `:active`.

**Tile grid:** CSS Grid with `grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))`. Tiles resize automatically as more are added.

**Transitions:** all state changes use `transition: all 200ms ease`.

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

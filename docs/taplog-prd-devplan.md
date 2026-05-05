# Taplog — Product Requirements Document & Development Plan

> **Version:** 1.1 — Design iteration  
> **Author:** Pawel (owner) / Claude (scribe)  
> **Date:** May 2026  
> **Status:** In development — v1.1 changes pending answers to open questions (marked ❓)

---

## Part 1 — Product Requirements Document (PRD)

### 1. Overview

**Taplog** is a minimal, tile-based, tap-first time tracker for the browser. You define activities, and each becomes a large tile with a single tap-to-start / tap-to-pause button. No projects, no invoicing, no login — just fast, honest time tracking for one person's daily work session.

**Tagline:** *Tap it. Track it. Done.*

---

### 2. Problem Statement

Existing time trackers (Kimai, Clockify, solidtime, TimeTagger) are optimised for teams, invoicing, and long-term reporting. They require navigation, context-switching, and setup before you can start a timer. On a phone or old tablet they are slow and cumbersome.

There is no purpose-built, tap-first, single-screen time tracker that:
- Lives entirely in the browser with no server needed
- Fills the screen with one big tap target per activity
- Resets automatically each day while surviving page refreshes
- Works fast on a 5-year-old Android tablet

**Taplog fills this gap.**

---

### 3. Competitive Landscape

| Tool | Style | Hosted | Gap vs Taplog |
|---|---|---|---|
| Kimai | List / table | Self-hosted or SaaS | Complex, multi-user, not tap-first |
| Clockify | List + projects | Cloud SaaS | Overkill, navigation-heavy |
| ActivityWatch | Automated | Desktop app | Passive tracking, not manual |
| solidtime | Timeline | Self-hosted / SaaS | Beautiful but not tap-centric |
| TimeTagger | Timeline + tags | Self-hosted | Tag-centric, not tile-focused |
| Super Productivity | Kanban + tasks | Desktop / PWA | Tasks first, time is secondary |

**Taplog's unique position:** single-screen, tile-based, mobile-first, zero-server, zero-login.

---

### 4. Target User (v1)

**Primary:** Solo knowledge worker, freelancer, or developer who tracks time across 2–8 daily activities and wants instant start/stop from any device — especially a phone or tablet kept on the desk.

**Key behaviours:**
- Works in daily sprints; does not need cross-day history
- Starts / stops activities many times per day
- Occasionally makes mistakes (accidental reset) and needs a simple undo

---

### 5. Feature Requirements

#### 5.1 Activity Tiles (Core)

| ID | Requirement |
|---|---|
| F-01 | User can add a named activity; it appears as a tile |
| F-02 | User can rename or delete any tile |
| F-03 | Tiles fill all available space in the main area (CSS grid, auto-resize) |
| F-04 | Each tile shows: activity name, accumulated time (HH:MM:SS), and a large start/pause button |
| F-05 | Tapping the button starts the timer; tapping again pauses it |
| F-06 | Only one timer can run at a time — starting a new tile auto-pauses the previously running one |
| F-07 | Running tile is visually distinct (colour, animation, border) |
| F-08 | Time updates every second while running |

#### 5.2 Summary Sidebar

| ID | Requirement |
|---|---|
| F-09 | Fixed right sidebar shows total time across all tiles for the day |
| F-10 | Sidebar shows per-tile breakdown (name + time) as a compact list |
| F-11 | Sidebar shows current date |
| F-12 | On narrow screens (≤ 640 px) sidebar collapses to a bottom bar |

#### 5.3 Persistence & Reset

| ID | Requirement |
|---|---|
| F-13 | All tile definitions and accumulated times persist in `localStorage` |
| F-14 | On each page load the app checks if the stored date differs from today; if so, times are auto-reset to 0 but tile names are kept |
| F-15 | "Reset tile" button on each tile resets that tile's time to 0 |
| F-16 | "Reset all" button in sidebar resets all tiles' times to 0 |
| F-17 | Before any reset (tile or all), app saves a **single undo snapshot** to `localStorage` |
| F-18 | An "Undo last reset" action is available in the sidebar while a snapshot exists |
| F-19 | Snapshot is cleared when a new day starts or a new reset overwrites it |

#### 5.4 Undo / Revert

| ID | Requirement |
|---|---|
| F-20 | Undo restores times to the state just before the last reset action |
| F-21 | Only one level of undo is supported (last reset only) |
| F-22 | Undo button is hidden when no snapshot is available |

#### 5.5 UI / UX

| ID | Requirement |
|---|---|
| F-23 | App fills the full viewport with no scroll on desktop |
| F-24 | Tiles occupy 80–85% of viewport width; sidebar takes the remainder |
| F-25 | Minimum tile size: 120 × 120 px; tile grid reflows as tiles are added/removed |
| F-26 | All tap targets are ≥ 48 × 48 px (WCAG 2.5.5) |
| F-27 | Smooth CSS transitions on state changes (start, pause, reset) |
| F-28 | App works offline (no network dependency) |
| F-29 | Installable as a PWA (manifest + service worker) |

---

### 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Initial load < 200 KB gzip; no render-blocking resources |
| **Compatibility** | Chrome/Firefox/Safari on Android ≥ 8, iOS ≥ 13, desktop |
| **Accessibility** | WCAG 2.1 AA — keyboard navigable, ARIA labels on buttons |
| **Security** | No external API calls; no tracking; no cookies |
| **Reliability** | State written to localStorage after every meaningful change (not on every tick) |
| **Maintainability** | TypeScript strict mode; ESLint + Prettier enforced in CI |

---

### 7. Data Model (localStorage)

```typescript
// Key: "taplog_state"
interface TaplogState {
  date: string;             // ISO date "YYYY-MM-DD" — used for daily reset detection
  activities: Activity[];
}

interface Activity {
  id: string;               // nanoid
  name: string;
  accumulatedMs: number;    // total ms recorded before current session
  isRunning: boolean;
  startedAt: number | null; // Date.now() when last started, null if paused
}

// Key: "taplog_undo_snapshot"
interface UndoSnapshot {
  timestamp: number;
  activities: Pick<Activity, 'id' | 'accumulatedMs'>[];
}
```

**Timer logic:** `displayMs = accumulatedMs + (isRunning ? Date.now() - startedAt : 0)`  
Time is computed at render time — only `accumulatedMs` is persisted (not live ms), preventing drift across tab suspensions.

---

### 8. Design Changes — v1.1

These changes supersede the corresponding v1.0 requirements above.

#### 8.1 Tile Layout & Sizing

| ID | Change |
|---|---|
| F-03 **revised** | Tiles fill **all available space** — both horizontally and vertically. The grid computes column count dynamically from the tile count so that the entire main area is occupied (no blank rows at the bottom). |
| F-25 **revised** | Tiles are **square or nearly square** at all times. The grid algorithm picks column and row counts that produce the closest-to-square cell given the available area. Rectangles are only allowed when a single tile must span the full width (e.g. only 1 tile on a very wide screen). Minimum cell size: 140 × 140 px. |
| F-04 **revised** | Tile visual hierarchy (top to bottom): **(1) activity name or short code** (large, dominant, centered), **(2) central start/pause button** (the primary tap target), **(3) elapsed timer HH:MM:SS** (bottom, smaller). The counter is secondary to identity and action. |
| F-30 **new** | Each activity has an optional **short code** of up to **5 characters** (e.g. "WORK", "DEV", "BRK"). Entered as an optional field in the Add/Edit modal. The tile shows the full name when wide enough, and falls back to the code when narrower. If no code is set, no fallback is shown (name is always used). |

#### 8.2 Colour System

| ID | Change |
|---|---|
| F-31 **new** | Each activity tile has a **unique neon accent colour** drawn from a rotating palette: blue `#3b82f6`, purple `#a855f7`, pink `#ec4899`, amber `#f59e0b`, cyan `#06b6d4`, green `#22c55e`, rose `#f43f5e`, indigo `#6366f1`. Colour is **auto-assigned** when the activity is created (index mod 8) and persists. User colour-picking is a future feature. |
| F-32 **new** | **Idle tile**: border `1px solid {color}` at 25% opacity (dim neon outline). |
| F-33 **new** | **Tracking tile**: full-brightness border `2px solid {color}` + `box-shadow` glow + `@keyframes` pulse, all using the tile's own accent colour. Text indicator reads **"● Tracking"** (not "Running"). |
| F-34 **new** | **Softened text palette**: `--text-primary: #c8c4d4` (warm light purple-grey, easier on the eye than cold white). Backgrounds get a very slight warm-violet tint: `--bg-base: #0e1016`, `--bg-tile: #181b26`. |
| F-37 **new** | **Sidebar total timer colour**: the HH:MM:SS total in the sidebar is **orange** (`#fb923c`) when total < 8 hours, and **green** (`#4ade80`) when ≥ 8 hours. This gives a daily goal indication without any additional UI. |
| F-38 **new** | Language: use **"Tracking"** everywhere in the UI instead of "Running". `aria-label` on the toggle button reads "Stop tracking {name}" / "Start tracking {name}". The text indicator on a tile reads "● Tracking". |

#### 8.3 Pause Tile

| ID | Change |
|---|---|
| F-35 **new** | A **Pause tile** is a special tile whose only function is to **stop the currently running timer**. It does not track time itself and has no HH:MM:SS counter. Visual states: (a) when a timer is active — shows ⏸ icon, dim; (b) when **nothing is being tracked** — glows amber (`#f59e0b` + pulse glow) to draw the user's eye and confirm idle state. The Pause tile is added via a dedicated "Add pause tile" option (or appears automatically as the second tile when the user has no pause tile yet — TBD). Data model: `isPause: true` on the `Activity` record; `accumulatedMs` is always 0 and ignored. Future: Pomodoro auto-pause after a focus interval. |

#### 8.4 Button Style Fix

| ID | Change |
|---|---|
| F-36 **new** | Undo, Reset All, Cancel, and Add buttons replace Tailwind `ring-*` with an explicit `border: 1px solid` declaration. The `ring-*` utility uses `outline` or `box-shadow` depending on browser and can be clipped on macOS Safari when combined with `border-radius`, causing part of the border to disappear. Switching to a true CSS `border` fixes this across all platforms. |

---

### 9. Out of Scope — v1

- User authentication / accounts
- Cross-device sync
- Export (CSV, JSON)
- History log across multiple days
- Multiple concurrent timers
- Tags, projects, clients
- Invoicing / billing
- Notifications / reminders

---

### 10. Future Roadmap (post-v1 ideas)

- Optional export to CSV/JSON
- Daily history log (last 30 days, stored in `IndexedDB`)
- PWA share-target for quick add
- Multi-user mode with optional cloud sync
- Per-tile colour picker (v1.1 auto-assigns; v1.2+ lets user choose)
- Pomodoro mode built on the Break tile concept (F-35)

---

## Part 2 — Development Plan

### 10. Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| **Bundler** | Vite 5 | Sub-second HMR, tiny output, first-class TS |
| **Framework** | React 18 + TypeScript (strict) | Component model fits tiles well; wide hiring pool for future contributors |
| **State** | Zustand | Minimal boilerplate, localStorage middleware in 5 lines, no context hell |
| **Styling** | Tailwind CSS v3 | Utility-first, purged CSS → tiny bundle; responsive breakpoints built-in |
| **Animation** | CSS transitions + `@keyframes` | Zero JS overhead; works on old Android WebViews |
| **IDs** | nanoid | 130-byte, crypto-random, no UUID dependency bloat |
| **Unit tests** | Vitest + React Testing Library | Same config as Vite; fast; RTL enforces accessible queries |
| **E2E tests** | Playwright | Cross-browser; mobile viewport simulation |
| **Linting** | ESLint (flat config) + Prettier | Enforced in CI before build |
| **CI/CD** | GitHub Actions | Free for public repos; tight Vite/Playwright integration |
| **Hosting** | Cloudflare Pages | Free tier; EU CDN edge; automatic preview deployments per PR; custom domain |
| **PWA** | `vite-plugin-pwa` (Workbox) | Service worker generation with cache-first strategy; auto manifest |

**No backend.** The app is 100% static. Cloudflare Pages serves it from the edge.

---

### 11. Repository Structure

```
taplog/
├── .github/
│   └── workflows/
│       ├── ci.yml          # lint → test → build on push/PR
│       └── deploy.yml      # deploy to Cloudflare Pages on main merge
├── public/
│   ├── favicon.svg
│   └── icons/              # PWA icons (192, 512)
├── src/
│   ├── components/
│   │   ├── ActivityTile/
│   │   │   ├── ActivityTile.tsx
│   │   │   ├── ActivityTile.test.tsx
│   │   │   └── index.ts
│   │   ├── TileGrid/
│   │   │   ├── TileGrid.tsx
│   │   │   ├── TileGrid.test.tsx
│   │   │   └── index.ts
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Sidebar.test.tsx
│   │   │   └── index.ts
│   │   └── AddActivityModal/
│   │       ├── AddActivityModal.tsx
│   │       └── index.ts
│   ├── store/
│   │   ├── taplogStore.ts       # Zustand store — pure logic, no React
│   │   ├── taplogStore.test.ts  # Unit tests for store logic
│   │   └── persistence.ts       # localStorage read/write helpers
│   ├── hooks/
│   │   └── useTick.ts           # requestAnimationFrame tick for display updates
│   ├── utils/
│   │   ├── time.ts              # formatMs(ms): "HH:MM:SS"
│   │   └── time.test.ts
│   ├── types.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css               # Tailwind directives + CSS variables
├── e2e/
│   ├── app.spec.ts             # Happy path E2E flows
│   └── undo.spec.ts
├── index.html
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
└── package.json
```

---

### 12. Component Architecture

```
App
├── TileGrid                  # CSS grid, fills 80-85% width
│   ├── ActivityTile × N      # One per activity
│   │   ├── TileName          # Editable on double-tap
│   │   ├── TileTimer         # Reads from store, re-renders on tick
│   │   ├── TileButton        # Large tap target, start/pause
│   │   └── TileMenu          # … button → rename / reset / delete
│   └── AddTileButton         # "+" card, always last in grid
└── Sidebar                   # Fixed right panel (bottom bar on mobile)
    ├── DateDisplay
    ├── TotalTime
    ├── ActivityBreakdown      # Compact list: name + time
    ├── UndoButton             # Visible only when snapshot exists
    └── ResetAllButton
```

---

### 13. Store Design (Zustand)

```typescript
// src/store/taplogStore.ts — shape only, for context in Claude Code

interface TaplogStore {
  // State
  activities: Activity[];
  undoSnapshot: UndoSnapshot | null;

  // Derived (computed, not stored)
  totalMs: () => number;

  // Actions
  addActivity: (name: string) => void;
  renameActivity: (id: string, name: string) => void;
  deleteActivity: (id: string) => void;
  toggleTimer: (id: string) => void;   // start if paused, pause if running
  resetActivity: (id: string) => void;
  resetAll: () => void;
  undo: () => void;

  // Internal
  _persistToStorage: () => void;
  _checkAndHandleDayChange: () => void;
}
```

**Key invariants:**
- `isRunning` can be `true` for at most one activity at any time
- `_checkAndHandleDayChange()` is called on store hydration (app start)
- `_persistToStorage()` is called after every mutating action **except** during `useTick` renders (display only)
- `accumulatedMs` is snapshotted on pause: `accumulatedMs += Date.now() - startedAt`

---

### 14. Timer Display Strategy

**Do not store live elapsed ms in state.** Instead:

```typescript
// src/hooks/useTick.ts
// Fires a re-render every second using requestAnimationFrame
// Components compute display value: accumulatedMs + (isRunning ? now - startedAt : 0)
```

This avoids 1-second `setInterval` drift, prevents unnecessary localStorage writes on every tick, and degrades gracefully when the tab is backgrounded.

---

### 15. Testing Strategy

#### Unit Tests (Vitest)
- `time.ts` — `formatMs` edge cases (0, 59s, 3600s, overflow)
- `taplogStore` — all actions, day-change logic, undo snapshot lifecycle
- `persistence.ts` — serialize / deserialize / corrupt-data recovery

#### Component Tests (RTL)
- `ActivityTile` — renders name, time, correct button label; handles tap
- `Sidebar` — shows correct total; undo button visibility
- `TileGrid` — correct number of tiles; add tile flow

#### E2E Tests (Playwright, Chromium + Mobile Chrome viewport)
- Start a timer → pause → verify time accumulates correctly
- Add 4 tiles → verify grid reflows
- Reset a tile → undo → verify time restored
- Reset all → undo → verify all times restored
- Simulate day change by mocking `Date` → verify times reset, names kept
- Reload page → verify state persists

**Coverage gate:** 80% line coverage enforced in CI (Vitest `--coverage`).

---

### 16. CI/CD Pipeline

#### `.github/workflows/ci.yml` — triggers on every push and PR

```
1. Checkout
2. Setup Node 20 (pnpm cache)
3. pnpm install --frozen-lockfile
4. pnpm lint          (ESLint + Prettier --check)
5. pnpm typecheck     (tsc --noEmit)
6. pnpm test          (Vitest --coverage, fail if < 80%)
7. pnpm build         (Vite production build)
8. pnpm e2e           (Playwright, headless Chromium)
```

#### `.github/workflows/deploy.yml` — triggers on merge to `main`

```
1. Run full CI pipeline (re-run, not reuse artifact — keeps deploy gated)
2. Deploy dist/ to Cloudflare Pages via wrangler action
   (CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in repo secrets)
3. Post deployment URL to PR comment (Cloudflare Pages preview URL)
```

**Preview deployments** on every PR are free via Cloudflare Pages — each PR gets a unique URL.

---

### 17. Hosting — Cloudflare Pages

**Why Cloudflare Pages:**
- Free tier: unlimited requests, 500 builds/month
- Edge CDN in Europe (low latency from Poland)
- Automatic HTTPS, custom domain support
- GitHub integration: preview per PR, auto-deploy on `main`
- No vendor lock-in (output is just static files)

**Setup steps:**
1. Push repo to GitHub
2. Cloudflare Dashboard → Pages → Connect to GitHub → select repo
3. Build command: `pnpm build` | Output directory: `dist`
4. Add `CLOUDFLARE_API_TOKEN` secret to GitHub repo for CI deploy step
5. Optional: add custom domain (e.g. `taplog.yourdomain.com`) in Pages settings

**Alternative (even simpler):** Netlify — identical free tier, slightly easier initial setup, no Wrangler needed.

---

### 18. Development Phases for Claude Code

Copy the section below into your Claude Code session as the starting context.

---

#### Phase 0 — Scaffold (1 session)

> **Prompt for Claude Code:**
> 
> "Scaffold a Vite 5 + React 18 + TypeScript strict project called `taplog`. Install and configure: Zustand, Tailwind CSS v3, nanoid, vite-plugin-pwa. Set up ESLint (flat config, react, typescript, a11y rules), Prettier, Vitest with coverage, Playwright. Create the directory structure from the PRD. Add placeholder exports for every module. Commit as `chore: initial scaffold`."

---

#### Phase 1 — Store & Logic (1 session)

> **Prompt for Claude Code:**
> 
> "Implement `src/store/taplogStore.ts` and `src/store/persistence.ts` according to the data model in the PRD. Implement all store actions. Write full unit tests in `taplogStore.test.ts` covering: add/rename/delete activity, toggleTimer (mutual exclusion), resetActivity, resetAll, undo lifecycle, and day-change detection (mock `Date.now`). All tests must pass."

---

#### Phase 2 — Components (1–2 sessions)

> **Prompt for Claude Code:**
> 
> "Build the full UI. Design aesthetic: dark theme, deep charcoal background (#0f1117), tiles as rounded cards with subtle glass morphism. Running tile: vivid electric blue glow (`#3b82f6` + box-shadow pulse animation). Typography: `DM Mono` for timers, `Inter` for labels. The big tap button in the centre of each tile should feel physical — press animation on active. Implement all components per the architecture in the PRD. Add RTL tests for ActivityTile and Sidebar. The layout must fill the full viewport with no scroll."

---

#### Phase 3 — PWA & Polish (1 session)

> **Prompt for Claude Code:**
> 
> "Configure vite-plugin-pwa: app name `Taplog`, short name `Taplog`, theme colour `#0f1117`, background colour `#0f1117`, display standalone, icons 192 and 512 (generate SVG-based icons). Add a service worker with cache-first strategy for all static assets. Verify Lighthouse PWA score ≥ 90. Fix any a11y issues flagged by axe-core in tests."

---

#### Phase 4 — CI/CD (1 session)

> **Prompt for Claude Code:**
> 
> "Write GitHub Actions workflows: `ci.yml` (lint → typecheck → test with 80% coverage gate → build → Playwright e2e) and `deploy.yml` (runs after CI on main → deploys to Cloudflare Pages using wrangler-action with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets). Write the full E2E specs in `e2e/app.spec.ts` and `e2e/undo.spec.ts` per the test strategy in the PRD."

---

### 19. Definition of Done (Senior Reviewer Checklist)

- [ ] TypeScript strict mode — zero `any`, zero suppressed errors
- [ ] ESLint passes — zero warnings
- [ ] Unit test coverage ≥ 80%
- [ ] All E2E tests pass on Chromium + mobile Chrome viewport (375 px)
- [ ] Lighthouse scores: Performance ≥ 90, Accessibility ≥ 90, PWA ≥ 90
- [ ] No external API calls in network tab
- [ ] `localStorage` schema validated on load (corrupt data → graceful recovery, not crash)
- [ ] All tap targets ≥ 48 × 48 px (verified via Playwright `boundingBox`)
- [ ] CI passes before every merge to `main`
- [ ] `README.md` covers: local dev setup, test commands, deploy setup
- [ ] `CHANGELOG.md` initialised with v0.1.0 entry

---

*End of document.*

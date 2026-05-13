# Taplog

A tap-first, tile-based time tracker that runs entirely in the browser. No backend, no auth, no server — pure static frontend deployed to Cloudflare Pages.

One screen. Activities as tiles. Tap to start, tap again to pause. Daily auto-reset at midnight. Fully offline-capable PWA.

---

## Local development

**Prerequisites:** Node ≥ 22, pnpm ≥ 10

```bash
pnpm install
pnpm dev        # Vite dev server → http://localhost:5173
```

---

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server on `:5173` |
| `pnpm build` | Production build → `dist/` |
| `pnpm preview` | Preview the production build locally |
| `pnpm typecheck` | TypeScript type-check (no emit) |
| `pnpm lint` | ESLint + Prettier check |
| `pnpm lint:fix` | Auto-fix lint/format issues |
| `pnpm test` | Vitest single run + coverage (≥ 80% required) |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm e2e` | Playwright E2E tests (builds + previews internally) |
| `pnpm e2e:ui` | Playwright interactive UI |

**Before every commit:**
```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

---

## Tech stack

- **React 19** + TypeScript strict
- **Zustand** — global state
- **Vite 5** — bundler
- **Tailwind CSS v3** — styling
- **Vitest** + React Testing Library — unit tests
- **Playwright** — E2E tests (Chromium + Pixel 5 viewport)
- **vite-plugin-pwa** — PWA / service worker
- **Cloudflare Pages** — hosting

---

## Deploy

The app is deployed automatically via GitHub Actions on every merge to `main`.

**Required GitHub secrets:**
- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` — API token with "Cloudflare Pages: Edit" permission

CI runs lint → typecheck → unit tests → build → E2E tests → deploy. Deploy is skipped if any step fails.

---

## Architecture notes

- All state lives in a single Zustand store (`src/store/taplogStore.ts`), persisted to `localStorage`.
- Timer display is computed on every render from `accumulatedMs + (Date.now() - startedAt)` — elapsed time is never written to storage mid-session.
- A `ResizeObserver` on the tile grid container drives the layout algorithm, which finds the column count that produces the most square-ish cells for the current container dimensions.
- The sidebar switches from a fixed right panel to a bottom bar when viewport width < 300 px (detected via `window.innerWidth`, not CSS media queries, for compatibility with lightweight mobile browsers).
- The `--app-height` CSS variable is set from `window.innerHeight` on load, resize, and orientation change, preventing the tile grid from hiding behind mobile browser chrome.

See `CLAUDE.md` for full architecture, data model, and design-system reference.

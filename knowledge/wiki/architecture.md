# Architecture

Status: **confirmed**

Source: [README.md: Implementation notes](../../README.md), [package.json](../../package.json), [vite.config.js](../../vite.config.js), [playwright.config.js](../../playwright.config.js)

## TL;DR

Adam Island Workshop is a static single-page site built with **Vite** as a multi-page app (MPA), enhanced with **vanilla JavaScript**, validated by **Playwright** browser tests, and packaged for **Cloudflare Workers static assets**.

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Build tool | Vite 7 | MPA config with a single entry at `index.html`. [vite.config.js](../../vite.config.js) |
| Runtime markup | Static HTML | Essential copy and links live in `index.html`. |
| Styling | Vanilla CSS | `src/styles.css`; no CSS-in-JS or utility framework. |
| Scripting | Vanilla ES modules | `src/main.js` + `src/about-typesetter.js`. |
| Graphics | Inline SVG, CSS, local WebP | Lightweight studies, not screenshots or live data. [README.md: Implementation notes](../../README.md) |
| Testing | Playwright | Browser tests with and without JavaScript across multiple viewports. |
| Deployment target | Cloudflare Workers static assets | `wrangler.jsonc` packages `dist/`; dry-run only in this repo. [README.md: Cloudflare static assets](../../README.md) |

## File layout

```
index.html              # Page structure and essential copy
src/
  main.js               # Scroll scheduler, chapter progress, nav behavior
  about-typesetter.js   # About-section Pretext enhancement
  styles.css            # All styles
tests/                  # Playwright specs and helpers
docs/review/            # Captured screenshots and review manifests
design/                 # Creative memory and decisions (local-only)
```

## Key boundaries

- **No backend.** The Worker is named `adamjones-lab` but has no routes, custom hostnames, or backend code. [README.md: Cloudflare static assets](../../README.md)
- **No runtime service.** Fonts are not loaded remotely; everything is self-contained.
- **No direct deployment command.** Adam merges manually; approved Cloudflare Git builds may deploy merged `main`. DNS and production configuration remain outside repository tasks. [AGENTS.md](../../AGENTS.md)

## Validation commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Vite production build |
| `npm run test:browser` | Playwright browser suite |
| `npm run cloudflare:dry-run` | Wrangler dry-run packaging |
| `npm run validate` | All three in sequence |

## What each test file covers (selected)

- `hero.spec.js` — hero composition, header clearance, focus ring, tab zoom.
- `story.spec.js` — native scrolling and chapter semantics.
- `chapter-index.spec.js` + `chapter-progress.spec.js` + `chapter-progress-layout.spec.js` — chapter navigation and progress meters.
- `project-flow.spec.js` — project selector keyboard and scroll behavior.
- `about-mobile.spec.js` + `about.spec.js` — About lockup, Pretext behavior, and failure fallbacks.
- `mobile-chapters.spec.js` — horizontal mobile chapter navigation, native anchors, and no-JS behavior.

## Hypotheses

- **Likely:** Future factory tasks will continue adding focused test specs and review captures under `docs/review/f-NNN/` rather than expanding a single monolithic spec.
- **Likely:** The MPA config remains overkill for a one-page site until a second page is added, but it is harmless and consistent.

# Testing Strategy

Status: **confirmed**

Source: [playwright.config.js](../../playwright.config.js), [scripts/run-browser-tests.js](../../scripts/run-browser-tests.js), [README.md: Validation](../../README.md)

## TL;DR

Browser tests run with Playwright against Chromium. The suite exercises the site **with JavaScript on and off**, at multiple viewports, and measures layout/focus/scroll behavior rather than just rendering.

## Playwright configuration

| Setting | Value |
|---------|-------|
| Browser | Chromium only (Desktop Chrome device) |
| Base URL | `http://127.0.0.1:4173` |
| Server | `npm run dev -- --host 127.0.0.1 --port 4173 --strictPort` |
| Parallel | Yes (`fullyParallel: true`) |
| Retries | 0 locally, 2 in CI |
| Trace | On first retry |

## Viewport matrix

Common sizes across specs:

- 390 × 844 (mobile)
- 768 × 1024 (tablet)
- 1440 × 900 (desktop)
- 844 × 390 (narrow landscape)
- 961 × 641 (short/narrow)

## JavaScript-off coverage

Many specs loop over `[true, false]` for `javaScriptEnabled` to verify that essential layout and links still work without JS.

## What gets validated

- Hero composition and header clearance
- Visible focus rings and keyboard access
- Native scrolling and chapter semantics
- Chapter-index persistence and current-chapter state
- Project selector keyboard and scroll behavior
- Narrow and short-viewport fallbacks
- Responsive overflow and enlarged-text flow
- 404 responses

## Review captures

Many factory tasks include a `docs/review/f-NNN/capture.mjs` script that produces desktop/mobile/no-JS screenshots and a `manifest.json` with hashes. These are used by Greta/Rook design review.

## Hypotheses

- **Likely:** The 200% root-text enlargement tests exist because the design must remain readable at browser-level zoom, not just CSS zoom.
- **Confirmed:** The test suite checks that the site does not introduce horizontal overflow or clipped focus rings when text is enlarged. [README.md: Validation](../../README.md)

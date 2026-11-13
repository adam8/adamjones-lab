# Testing Strategy

Status: **confirmed**

Source: [playwright.config.js](../../playwright.config.js), [scripts/run-browser-tests.js](../../scripts/run-browser-tests.js), [README.md: Validation](../../README.md)

## TL;DR

Browser tests run with Playwright against Chromium. The suite exercises the site **with JavaScript on and off**, at multiple viewports, and measures layout/focus/scroll behavior rather than just rendering.

## Playwright configuration

| Setting | Value |
|---------|-------|
| Browser | Chromium only (Desktop Chrome device) |
| Base URL | A free loopback port reserved by `scripts/run-browser-tests.js` |
| Server | Vite on that reserved `127.0.0.1` port with `--strictPort` |
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

Representative specs run with JavaScript disabled or the entry module blocked to verify that essential layout and links still work without enhancement.

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

Historical task captures live under `docs/review/`. Current Greta/Rook evidence is produced by the separate factory design-review pipeline and retained in local `design/` memory.

## Hypotheses

- **Likely:** The 200% root-text enlargement tests exist because the design must remain readable at browser-level zoom, not just CSS zoom.
- **Confirmed:** The test suite checks that the site does not introduce horizontal overflow or clipped focus rings when text is enlarged. [README.md: Validation](../../README.md)

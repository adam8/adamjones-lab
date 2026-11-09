# ADR-1: Static Site with Vite, Playwright, and Wrangler

Status: **confirmed**

## Context

The project needs a fast, low-maintenance portfolio site with strong browser-test coverage and a clear path to static hosting.

## Decision

Use **Vite** as the build tool, **vanilla JavaScript/CSS/HTML** for implementation, **Playwright** for browser validation, and **Wrangler static assets** for the Cloudflare deployment target.

## Consequences

- **Simple dependency graph.** Only Vite, Wrangler, Playwright, and `@chenglou/pretext` are runtime/production dependencies. [package.json](../../package.json)
- **Fast local dev.** `npm run dev` starts Vite directly.
- **Strong validation.** `npm run validate` runs build → browser tests → Cloudflare dry-run.
- **No backend needed.** Cloudflare Workers static assets serve `dist/` directly.
- **MPA config with one page.** `vite.config.js` uses `appType: 'mpa'` with a single `index.html` entry. [vite.config.js](../../vite.config.js)

## Alternatives considered

- **Next.js / React:** Rejected to keep the site lightweight and avoid framework overhead.
- **A custom static generator:** Rejected; Vite provides enough flexibility with less maintenance.
- **Cypress instead of Playwright:** Not recorded as a considered alternative; Playwright was chosen for headless Chromium and cross-viewport testing.

## Evidence

- [package.json](../../package.json)
- [vite.config.js](../../vite.config.js)
- [playwright.config.js](../../playwright.config.js)
- [README.md: Local setup](../../README.md)

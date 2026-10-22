# Adam Jones Lab

A lightweight personal homepage for Adam Jones, a JavaScript developer and designer, and a home for projects and experiments.

## Local setup

Requirements: Node.js 22 or newer and npm.

```bash
npm ci
npx playwright install chromium
npm run dev
```

Vite prints the local development URL. No external service is required at runtime.

## Validation

```bash
npm run validate
```

This builds the static site, runs the focused Chromium suite, and asks Wrangler to package the static assets as a dry run. The individual commands are:

```bash
npm run build
npm run test:browser
npm run cloudflare:dry-run
```

Generated production files are written to `dist/`. Browser tests cover supplied content, catalogue semantics, keyboard interaction, reduced motion, responsive stacking, and horizontal overflow at desktop and mobile sizes.

## Cloudflare static assets

`wrangler.jsonc` points Cloudflare Workers static assets at `./dist`. It contains no Worker backend, hostname, or route. The repository intentionally exposes only a dry-run command:

```bash
npm run cloudflare:dry-run
```

Publishing, custom-domain setup, and DNS changes require Adam's explicit approval and are not part of this repository workflow.

## Review images

Desktop and mobile captures of the current implementation are kept in `docs/review/` when local Chromium is available.

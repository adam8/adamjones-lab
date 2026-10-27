# Adam Island Workshop

A lightweight one-page site for Adam Jones, a JavaScript developer and designer. It is a home for projects and experiments, presented as a native-scroll editorial story.

## Local setup

Requirements: Node.js 22 or newer and npm.

```bash
npm ci
npx playwright install chromium
npm run dev
```

Vite prints the local URL. The site uses static HTML, CSS, inline SVG, and a small vanilla JavaScript enhancement; it has no runtime service or remote font dependency.

## Validation

Run the complete local validation sequence:

```bash
npm run validate
```

Or run its parts separately:

```bash
npm run build
npm run test:browser
npm run cloudflare:dry-run
```

The browser suite checks the core story with and without JavaScript, project-selector keyboard and scroll behavior, narrow- and short-viewport fallbacks, enhancement boundaries, external destinations, focus visibility, idle animation scheduling, responsive overflow, and 404 responses.

## Implementation notes

- Essential copy and links live in `index.html` and remain available without JavaScript.
- Sticky hero and project storytelling is enabled only on viewports above 960px wide and above 640px tall.
- `src/main.js` uses one passive-scroll/requestAnimationFrame scheduler for reading progress, hero transforms, and project selection. It requests no frames while idle.
- Narrow and short layouts show projects sequentially in normal document flow.
- Project graphics and the Vancouver Island illustration are lightweight inline SVG studies, not product screenshots or live data.

## Cloudflare static assets

`wrangler.jsonc` packages `dist/` as Workers static assets with `404-page` handling. The Worker remains named `adamjones-lab`, top-level branch previews remain configured, and there are no routes, custom hostnames, Worker backend, or deployment commands in this workflow.

The repository supports dry-run packaging only:

```bash
npm run cloudflare:dry-run
```

Publishing, DNS, custom-domain setup, Access policy changes, and production deployment are outside this task and require Adam’s explicit approval.

## Review images

Desktop and mobile captures of the current homepage are stored in `docs/review/` when local Chromium is available.

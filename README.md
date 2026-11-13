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

The browser suite checks the core story with and without JavaScript, chapter-index semantics and persistence, current chapter and native anchors, project-selector keyboard and scroll behavior, narrow- and short-viewport fallbacks, enhancement boundaries, external destinations, focus visibility, idle animation scheduling, responsive overflow, and 404 responses.

## Implementation notes

- Essential copy and links live in `index.html` and remain available without JavaScript.
- Sticky hero storytelling is enabled only on viewports above 960px wide and above 640px tall. Work passages always remain in normal document flow; enhanced project controls navigate to them and track the passage nearest the viewport centre.
- At ≤800px, a horizontally scrollable chapter strip contains `aj.`, Intro, Work, Outside, About, and Elsewhere. The links are native anchors with proximity snap and inline progress tracks. JavaScript keeps the active item visible and makes the compact header sticky when it fits; without JavaScript the complete strip and all destinations remain available in normal flow.
- Mobile Work controls are progressively enhanced and stick below the measured chapter header. Without JavaScript the controls are hidden and all three project passages remain visible.
- Progress indicates local chapter position, not reading completion: the hero is empty/no current chapter, prior chapters fill completely, and document end fills all five. Collapsed intervals complete at their shared arrival (latest starting chapter wins); terminal completion takes precedence even for zero-scroll documents. Native destinations round fractional CSS positions to pixels, so current-link comparisons allow half a pixel. Tracks remain hidden until the first valid initialized paint, including on script failure.
- Above 800px, the chapter index stays in normal flow by default and becomes persistent at the wide/tall enhancement boundary after the hero clears. All five chapters retain native anchors and history.
- `src/main.js` uses one passive-scroll/requestAnimationFrame scheduler for chapter progress, hero transforms, and active-project state. Chapter progress and current links share cached native-anchor arrivals. Scroll-only updates do not remeasure chapter boundaries; viewport, font, and observed content-size changes invalidate geometry. No frames are requested while idle.
- Narrow and short layouts keep the hero and projects in normal document flow. Fragments, selectors, and history do not relocate focus automatically.
- Visuals use inline SVG, a CSS-composed interface study, and one local WebP illustration; there are no product screenshots or live data.

## Cloudflare static assets

`wrangler.jsonc` packages `dist/` as Workers static assets with `404-page` handling. The Worker remains named `adamjones-lab`, top-level branch previews remain configured, and there are no routes, custom hostnames, Worker backend, or deployment commands in this workflow.

The repository supports dry-run packaging only:

```bash
npm run cloudflare:dry-run
```

Publishing, DNS, custom-domain setup, Access policy changes, and production deployment are outside this task and require Adam’s explicit approval.

## Review images

Desktop and mobile captures of the current homepage are stored in `docs/review/` when local Chromium is available.

F-023 supplementary candidate captures and the bounded check record are in [`docs/review/f-023-review.md`](docs/review/f-023-review.md). Independent review and Adam’s candidate decision remain pending; these files do not authorize publication.

F-026 navigation supplement: `npm run build && node docs/review/f-026/capture.mjs`. See `docs/review/f-026/review.md` for bounded checks and remaining gates.

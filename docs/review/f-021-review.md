# F-021 developer handoff — amended candidate

## Scope and provenance

Continued the dirty interrupted implementation at accepted HEAD `990864060157cea6af641e2536ad8f0e6651768e`; did not reset or re-port it. Read the pinned patch and prior tests and viewed all seven historical F-020 PNGs. Those references remain **unaccepted prior-candidate context**.

The worktree retains only the pinned About integration (semantic heading/facts, Pretext 1.0.0 and full license, independent startup/geometry hooks), localized title spacing, the authorized heading-wrap correction, test-selector preservation, and review tooling/evidence. Worker configuration is unchanged: `adamjones-lab`, top-level `previews`, static `dist`, no hostname/routes. No commit or publication.

## Amendment

- Keep the original `specifi|cation` opportunity; add optional syllable breaks after `spec` and `ca`: `spec|ifi|ca|tion`. Readable wording, font sizes, family, weight, tracking and leading remain unchanged. No arbitrary character breaking.
- Above 1100px, tighten only actual enhanced `reading` layouts; without enhancement, use the strictly-below-75rem forme threshold. A grid at exactly 75rem retains its pause.
- Preserve the forced short-screen rule at height ≤640px, and ordinary mobile spacing.
- The title now fits its frame/viewport at 1101px with 200% root text. Probes at 1100, 1102, 1120, 1200 and 1280px also pass with and without JavaScript.

## Evidence map

- `f-021-accepted/`: preserved accepted-source before evidence; not regenerated in this continuation.
- `f-021-transferred/`: preserved pinned-component before-spacing evidence; not regenerated.
- `f-021-after/`: **superseded intermediate candidate**, before this amendment. Do not use as final-source evidence.
- `f-021-boundary-risk.json`: **historical pre-amendment diagnosis**, not a current failure.
- `f-021-after-amended/`: fresh candidate evidence, including desktop/mobile, all eight matched cases, plus 1101px enlarged and 1280px normal-grid captures.

Each phase has source SHA-256 hashes, browser version, DPR, typography, glyph ranges/Canvas ink metrics, entry scroll, first-fact document coordinates and scroll distances in `measurements.json`. All phases report Chromium 156.0.8078.4, Linux, DPR 1. Root scaling is injected in document responses before layout; it is not shipped. Entry metrics/screenshots precede locator-induced crop scrolling. Section crops can contain the persistent chapter overlay; they do not establish entry positions.

Reproduction (only against the corresponding source state; helper refuses overwrites):

```sh
node docs/review/f-021-capture.mjs accepted
node docs/review/f-021-capture.mjs transferred
node docs/review/f-021-capture.mjs after
# Current amended candidate:
node docs/review/f-021-capture.mjs after-amended
```

### Spacing isolation: transferred → amended (CSS px)

| Case | Masthead before → after | About height before → after | Location label/value earlier by |
|---|---:|---:|---:|
| 1440×900, 200%, JS | 1154.59 → 1078.59 | 2977.23 → 2901.23 | 76 |
| 844×390, 100%, no JS | 291 → 243 | 1482.73 → 1434.73 | 48 |
| 844×390, 200%, no JS | 737 → 679 | 3034.17 → 2976.17 | 58 |
| 1440×640, 100%, JS | 400.80 → 343.80 | 1554.14 → 1497.14 | 57 |

At enlarged desktop entry scroll 11376, label/value document Y changes from 12850.05/12902.84 to 12774.05/12826.84; additional scroll drops from 574.05/626.84 to 498.05/550.84. Short no-JS entry scroll remains 5574; label/value Y changes from 6084.95/6122.34 to 6036.95/6074.34; additional scroll drops from 120.95/158.34 to 72.95/110.34.

Ordinary 1440×900, 390×844, narrow enlarged no-JS and 1440×641 retain transferred masthead/section geometry. Same-browser spacing comparisons assert identical font metrics and glyph shapes. Separate raster comparisons against the original pinned heading pass for all eight matrix cases, including existing enlarged wraps; only unrelated chapter/progress overlays are excluded from those title-only comparisons. Normal 1280px enhanced grid retains the 400.80px masthead.

### Primary review: accepted → amended

Use the accepted and amended entry/section image pairs for the production comparison. This port is **not** a claim that Location arrives earlier than accepted production: accepted About has a different side-by-side hierarchy. At enlarged desktop, accepted label/value Y is 11763.86 versus amended 12774.05/12826.84. At short no-JS, accepted is 5787.98 versus amended 6036.95/6074.34. The spacing hypothesis improves the transferred component, not the original accepted hierarchy; a fresh candidate decision remains required.

All ten fresh capture cases report reachable last facts, no measured text overflow, no fact-bay overlap, and no missing HTTP resources. JavaScript-enabled dev captures record three Vite HMR WebSocket errors (local-network/unsafe port-0 connection diagnostics), also present in preserved before captures. They are not product exceptions, but these captures must not be described as console-clean. No-JS captures have no console errors. Canvas ink metrics are not raster ink segmentation; leading was not changed.

## Checks actually run in this continuation

- `git status --short`, `git rev-parse HEAD`, repeated `git diff --check`: pass.
- `cmp tests/about.spec.js /opt/factory-reference/prior-about.spec.js`: identical, retaining all 95 checks.
- Final `npm run test:browser -- tests/about-spacing.spec.js --workers=2 --retries=0`: **37 passed**. Earlier diagnostic runs exposed a same-fragment test-navigation mistake and chapter-overlay screenshot contamination; test navigation now uses distinct query URLs, and title raster checks exclude only unrelated overlays.
- Targeted prior About command from the plan (enlarged desktop, ordinary mobile, narrow enlarged no-JS, short screens, controller/library failures, live invalidation/idle/navigation, observer hotpath): **8 passed**.
- `node docs/review/f-021-capture.mjs after-amended`: completed; new desktop, mobile and boundary section screenshots viewed.
- Plain `npm ci`: timed out after 60 seconds without output. Recovery `npm ci --offline --ignore-scripts --no-audit --no-fund`: **49 packages installed**. Build passed both before and after reinstall.
- `npm run build`: passed (Vite 7.3.7).

## Remaining mandatory gates

Full bounded browser inventory, exact-candidate build and Cloudflare dry-run belong to the downstream machine phase and were not duplicated here. No physical iPhone/Safari or broad frame-pacing profiling was performed. Independent Greta/Rook reviews and a new explicit Adam candidate decision are still required before any PR/publication. Access policy and deployment behavior were not exercised or changed.

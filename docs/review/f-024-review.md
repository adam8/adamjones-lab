# F-024 — Agent paper-loop integration

Candidate implementation complete; not publication or exact-candidate approval.

## Scope and provenance

- Started at `0c526f4732414f7c3abcd06eb29ac38b9ac4ba0a`, with clean `git status --short`.
- Actually viewed all five required pinned PNGs in `/opt/factory-reference`: mockup desktop/mobile/detail and accepted desktop/mobile projects. Used the mockups for artwork direction only.
- `index.html`: replaced only the Agent illustration with the supplied inline `paper-loop.svg`, retaining every painted element/attribute in order. Added Agent-prefixed accessible title/description references, nonfocusable informative semantics, an intrinsic figure and the exact HTML caption **Conceptual workflow sketch**.
- `src/styles.css`: five Agent-scoped rules/comment lines give the figure safe intrinsic sizing, reset the inherited icon drawing defaults, and set the caption to dark-green monospace, `.875rem/1.6`.
- `tests/agent-paper-loop.spec.js`: 23 discoverable integration cases; no inherited tests modified.
- Controller, other illustrations/content, packages/lockfile, library code and Worker configuration unchanged. `adamjones-lab`, top-level `previews: {}`, static `dist` assets and no routes/custom hostname preserved.

## Framing proof

Only the root viewBox changes, from `0 0 760 650` to `95 165 650 435`. Artwork geometry/transforms/colours remain untouched. A SHA256 assertion covers the ordered painted/group tags and all their sorted attributes from the supplied original, excluding only root/accessibility metadata:

`0b2ad8514dd25f491e683239751a8cedfd4280bd131cc94086d6303a50d22e69`

Chromium SVG `getBBox()` measurements, transformed to root SVG coordinates and expanded for strokes (miter-limit times half-width for miter joins; half-width for round joins/caps), give a conservative envelope:

- Left: 114.820; top: 186.815; right: 731.100; bottom: 574.000.
- This includes the transformed schematic, ribbon, shadow ellipse, ground line and loose tail.
- ViewBox edges are 95 / 165 / 745 / 600; minimum clearance exceeds 13.8 SVG units. Conservative bounding rectangles can overestimate actual painted extents.
- Every matrix case verifies clearance, proportional intrinsic sizing, panel/caption containment and no horizontal/nested scroll. The ellipse computes to `stroke: none`; it gains no inherited green outline.
- At 1440×900 normal text, existing staging remains active; SVG width measured 435.92 CSS px. Mobile normal SVG width exceeds 300px. No stage/controller/scroll-distance changes were needed.

## Checks actually run

- `npm ci --ignore-scripts` — passed; npm reported **3 vulnerabilities (2 moderate, 1 high)**. No dependency changes or audit fixes made.
- `npm run build` — passed, Vite 7.3.7.
- `npm run test:browser -- tests/agent-paper-loop.spec.js tests/project-flow.spec.js tests/story.spec.js --workers=2 --retries=0` — **85 passed**, 1.6 minutes, no retries/skips.
- `npm run test:browser -- --list` — **404 tests in 13 files**: 381 inherited + 23 additions.
- `git diff --check` — passed.
- `node docs/review/f-024/capture.mjs` — generated 16 fresh candidate images and manifest using cached Playwright Chromium, with no browser download/executable override.

Coverage executed includes all 20 required viewport/root-text/JS combinations, original SVG fidelity/drawing defaults/accessible references, caption typography and containment, script-request abortion, native wheel reachability through the final caption, live enlargement/resize/restoration, idle frames, and inherited project heading, focus, direct-entry, same-hash, keyboard, Back/Forward and fit-release checks. Existing tests were not weakened or altered.

## Supplementary review evidence

`docs/review/f-024/manifest.json` records Chromium version, viewport/root scale/JS state, direct-entry method, focus/selection/history, relevant geometry, source and build hashes, and image hashes. `capture.mjs` is reproducible against a local Vite server; its command is documented at its top. Root percentage is injected before load for evidence only, never shipped.

Eight candidate conditions each have a direct-entry viewport and complete-panel image: desktop normal/enlarged, desktop enlarged no-JS, 961×641 normal, mobile normal/enlarged, 320px enlarged no-JS and short landscape normal. Captures are candidate-only supplementary evidence, not a matched accepted/candidate canonical set. Manually viewed the fresh desktop viewport and mobile complete-panel captures in this implementation turn. Historical mockups were not overwritten.

## Pending / unverified

Host owns full independent install/build/Cloudflare dry-run, all complete browser spec shards (including remaining mobile-nav/About/spacing/1101px coverage), canonical matched accepted/candidate full-page/section/focus/wheel/motion-frame/idle/enlarged Agent/About captures, independent Tester/technical Reviewer, independent Greta/Rook reviews, and synthesis. None is claimed complete here. This builder did not run the full 404-test suite or Cloudflare dry-run.

Physical Safari/iPhone/iPad, screen readers, actual browser zoom and real-device performance remain unverified. Injected 200% root font is not browser zoom. Screenshots and idle-frame assertions do not establish real-device animation smoothness.

Stop after downstream synthesis for Adam's exact-candidate A–E decision. No commit, push, PR, deployment, DNS, hostname or route changes were made.

# F-016 implementation review

## Scope and starting point

HEAD is the accepted `cbf6cda37f1a05d9a3252e816c3a6d608fd2e93c`. On entry, the task's HTML/CSS implementation, focused tests, and evidence files were already present from an interrupted run. These were inspected and retained, tests were strengthened with exact label/heading checks and geometry attachments, and validation and captures were rerun.

- `index.html`: original static floating diorama, with cream backdrop, silhouette-breaking mountains, coral sun, projecting blue water, earthy underside, and connected roots. Preserves the paragraph and heading; changes caption and accessible image name as approved.
- `src/styles.css`: Outside-scoped intrinsic wrapping layout, constrained-screen stacking, complete SVG containment, and short-screen anchor clearance. Removes frame, tilt, shadow, and obsolete illustration selectors. No shared chapter rules or JavaScript changes.
- `tests/outside.spec.js`: 28 geometry cases (seven viewports, two root text sizes, JavaScript on/off) and six native-navigation cases. Includes text ranges, painted SVG bounds plus stroke allowance, copy/figure separation, chapter containment, caption order, focus, history, current state, and nested-scroller checks. Geometry is attached to Playwright test results.
- `docs/review/f-016-*`: matched evidence helper, screenshots, scroll measurements, compressed Chromium trace, and this handoff.

No dependency, Worker configuration, other section, or publishing changes. No added motion or reduced-motion mode.

## Checks actually run

- `git rev-parse HEAD` and `git status --short`: confirmed accepted baseline and inspected partial work.
- `npm ci`: succeeded; npm reported three dependency vulnerabilities (two moderate, one high). No dependency changes attempted in this bounded task.
- `npx playwright install chromium`: attempted, but the combined command timed out before completion. Existing Chromium was usable for every subsequent browser check.
- `npm run test:browser -- tests/outside.spec.js tests/chapter-index.spec.js`: **54 passed** before the final additional assertions.
- `npm run validate`: **passed**, including Vite production build, **149 Chromium browser tests** (including the strengthened tests), and Wrangler **4.152.0** dry-run.
- `git diff --check`: passed.
- `git diff -- wrangler.jsonc`: empty. Worker `adamjones-lab`, top-level `previews`, and static `dist` assets remain unchanged; no routes or hostnames added.
- `node docs/review/f-016-capture.mjs baseline` then `node docs/review/f-016-capture.mjs after`: succeeded. Baseline files are served directly from the exact accepted Git object without switching/resetting the worktree.

## Matched visual evidence

Pairs named `f-016-{baseline,after}-{desktop,mobile,narrow,short,enlarged}.png` contain the complete Outside chapter and the beginning of About. Corresponding `-viewport.png` files show direct-fragment initial viewports. Dimensions: desktop 1440×900, mobile 390×844, narrow 320×800, short 844×390, enlarged 1440×900 with 200% root font size. The enlarged case is **text enlargement, not actual browser zoom**.

Local inspection of desktop, narrow, short, and enlarged chapter captures shows a freestanding silhouette, readable roots, clear copy/art separation, and breathing room above About. The same full artwork is used at every size. This is implementer inspection, not independent visual approval.

## Scroll evidence and limitations

`f-016-scroll-evidence.json` records direct Chromium wheel inputs (three slow 40px steps, a fast 650px step, reversal, and smaller corrections) and PageDown/PageUp/ArrowDown/ArrowUp inputs through Outside. Positions moved in the requested directions. `f-016-scroll-trace.json.gz` records the corresponding DevTools timeline. This run recorded 39 animation-frame callbacks, maximum callback duration 3.938ms, and **zero callbacks over a settled 600ms sample**. Callback duration is not an end-to-end frame-pacing measurement or proof of device-level 60fps.

Safari, physical mobile devices, actual browser zoom, touch scrolling, and Access-protected hosted previews were not tested. No independent technical reviewer or Greta/Rook visual judgments were available in this run. Those reviews and Adam's A–E decision remain pending. No commit, PR, deployment, DNS, or Access changes were made.

## Reproduction

Use Node.js 22+ and the setup commands in README (`npm ci`, `npx playwright install chromium`, `npm run dev`). Run `npm run validate` for build/browser/dry-run checks. Generate the local matched evidence with the two capture commands above; the helper starts and closes its own loopback server and never publishes.

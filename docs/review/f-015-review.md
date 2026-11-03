# F-015 implementation and review handoff

## State

Implemented locally; not approved for publication. HEAD is the accepted `9ec3411872ade8cffb0fc88726ae6482c9868700`. An interrupted implementation, tests, and captures were present on arrival; these were inspected and finished rather than discarded. No commit, deployment, or publishing configuration change was made.

Changes: project staging now has an independent intrinsic-fit probe at fixed staged constraints. Overflow releases all three original panels into document flow, clears hidden/inert state, and retains wide/tall selectors. Navigation uses mode-specific geometry. Content-size observation is guarded and event-driven. Agent gets enough desktop copy width for complete words and artwork reflows below in flow. The short-screen hero grid was restored to the accepted behavior during completion. HTML/copy/IDs are unchanged.

## Checks actually run

- `git rev-parse HEAD`, `git status --short` before coding.
- `npm ci`: successful; npm reported three dependency vulnerabilities (two moderate, one high). No dependency upgrades attempted in this bounded layout task.
- `npm run test:browser -- tests/story.spec.js tests/project-flow.spec.js`: 48 passed initially and again after the final project-only boundary assertion.
- `npm run validate`: build, all 101 Chromium tests, and local Wrangler dry-run packaging passed. This complete run preceded the final test-only boundary assertion and README update; the affected 48 tests were rerun afterwards.
- Real Chromium extension-controlled tab zoom: factor 2, effective viewport 720×450; Agent containment, flow, width, fragment, and keyboard focus assertions passed. This is separate from the 100%/200% root-font matrix.
- `node docs/review/f-015-capture.mjs`: regenerated matched accepted-baseline/after captures and local scroll trace. The script serves baseline files directly from the accepted Git object without switching or altering another worktree. It asserts baseline copy overflow and after containment; see `f-015-fit-evidence.json` (baseline panel 702px versus copy 974.47px; after panel 1517.67px with copy contained).
- `git diff --check`: clean. `git diff -- wrangler.jsonc`: empty. Worker identity, top-level previews, and route/hostname-free configuration are unchanged; Access settings were not inspected or changed.

The focused matrix covers five supplied viewports at 100%/200% root text, with and without JavaScript, paragraph/art containment and horizontal width, word ranges, native pointer wheels through the paragraph's final line, selector history/same hash, direct fragments, focused live-size transitions, 7px focus extent, and idle frame shutdown. The boundary test separately verifies that enlarged project flow does not disable the sticky hero.

## Visual and motion evidence

`f-015-{baseline,after}-*.png` are paired at the same viewport/font scale and semantic destinations: ordinary Agent, enlarged beginning/focused permalink/paragraph/artwork end, 961×641 boundary, tablet, mobile, short landscape. The changed scroll coordinates are intentional: flow now gives the entire passage real height. Ordinary composition retains selectors/copy/artwork, dusty blue, and spacing character; title no longer breaks the last letter of “experiments” onto another line. Enlarged art appears below the complete description rather than being removed.

The refreshed trace uses actual wheel deltas 80, 80, 700, -450, -150, 100 over Agent (slow, fast, reversed). Document scrollY moved 4787→5147; six animation frame callbacks, maximum measured callback 2.106ms. This small desktop trace is not proof of 60fps or device smoothness. Idle behavior is tested separately. Screenshots alone do not establish scrolling quality.

## Operator completion: preserve the approved complete-word gain

The Developer originally blocked on the 390px/200% word-fragmentation exception. That exception contradicted Adam's A hypothesis to preserve complete words. The operator removed it rather than asking for permission to weaken the outcome. The prior blocked report is retained in private task records.

A small Agent-local carry-forward of the previously reviewed responsive heading-fit approach lets the permalink wrap below the title when necessary, and uses a copy-container query for cramped enlarged narrow allocations. Ordinary mobile and desktop type sizes remain unchanged. No nested scroller, global font compression, paragraph reduction, copy change, or artwork removal was introduced. The handoff was clarified to distinguish this preserved typography gain from shrinking the whole passage to fit a fixed stage.

The strengthened matrix adds 320/360/375px at 100%/200%, with JavaScript enabled/disabled, unconditionally checks whole-word ranges, and checks the permalink's 44px target and full 7px ancestor/horizontal focus clearance. The two original 390px/200% cases failed before the CSS correction. Afterward, all **113 Chromium tests**, build, and Wrangler dry-run passed. Matched captures were regenerated, including 320px/200% and 390px/200%. Independent Tester, technical Reviewer, and later visual reviews still need to judge this exact finished candidate; this operator result is not a substitute for their gates.

Independent Greta/Rook review tools or reviewers were not available in this environment. Those reviews and Adam's A–E decision remain pending; no approval is implied. Mobile Safari/iPhone hardware and other browser engines were not tested. External Access protection and production behavior were not verified. Stop here for independent review and Adam's decision; no PR or publishing action is authorized.

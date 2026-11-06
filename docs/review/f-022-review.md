# F-022 developer handoff

## Scope

Base HEAD: `725f3221194346581151b0688f2306b464d98bb2` (accepted merged tree). No commit or publication performed.

- `src/styles.css`: ≤800px upright editorial fact sheet, 40/60 upper split and 48/52 lower split; cream Explorations spans Tools/Background. Shared frame, masthead and existing colors retained. New rem-based mobile typography is identical in grid and reading modes. CSS alone defaults to the complete column.
- `src/about-typesetter.js`: independent mobile candidate measures uppercase terms and definitions, padding/shared rules, whole-word widths and documented line budgets. Selects layout only, never font sizes. Preserves desktop path, caching, invalidation, cleanup and idle shutdown.
- `tests/about-mobile.spec.js`: 28 focused geometry, enlargement, short-height, failure, lifecycle and native navigation checks.
- `tests/about.spec.js`: new mobile baseline; whole-word/cell checks include terms.
- `tests/about-spacing.spec.js`: both comparison fixtures remove only the bounded F-021 spacing block and assert its presence.
- `docs/review/f-022-capture.mjs` and `f-022-captures/`: supplementary local entry/full-section evidence and source-hashed measurements. Not canonical acceptance evidence.

No HTML/content, other chapters, packages, notices, Pretext version or Cloudflare configuration changed. Worker remains `adamjones-lab`, with top-level `previews: {}`, dist static assets/404 behavior and no route/custom hostname.

## Checks actually completed

The interrupted portion of this same Developer run completed the following on the final product source (results supplied by the supervisor checkpoint):

- New mobile suite: **28 passed**, 48.6s, after uppercase term-measurement correction.
- About spacing suite: **37 passed**, about 1.2m.
- Focused prior About tests (`390px|short|failures|live changes|unrelated motion`): **15 passed**, 34.3s.
- `npm run build`: passed, 4.25s.
- Supplementary Chromium capture generation completed.

On resumption, without repeating those suites/captures:

- Ran `git status --short`, `git rev-parse HEAD`, and `git diff --check` (clean whitespace).
- Read the source/test/helper diffs and actually viewed all five pinned `/opt/factory-reference/` PNGs, plus fresh 375/390/414px full-section and enlarged/no-JS captures.
- Independently verified all three recorded SHA-256 source hashes against current files (CSS, controller, HTML).
- Parsed all ten captured cases: no recorded page errors, overflow or fact overlap.
- Byte-compared entry/full captures for 1440px desktop and 1101px/200% heading safety with matched accepted CSS/controller captures: all four pairs identical.

## Visual observations

At 375/390/414px the offset divisions, dark Tools and spanning cream Explorations read as one upright fact sheet. All five facts remain present in the original DOM order. At 320px, short height and enlarged/no-JS states the composition releases to a framed reading column. Some slash-separated values wrap at their supplied slash break opportunities; no alphabetical word fragmentation was observed in the viewed captures.

## Remaining validation / decision boundary

Full exact-candidate machine inventory (95 prior About, 37 spacing, 28 mobile and 199 regression tests), build and Cloudflare dry-run remain assigned to the downstream machine phase; not claimed here. Independent Tester/technical review, canonical captures and independent visual reviews are still pending. Physical Safari/iPad, screen-reader usability, real-device performance and actual browser zoom are unverified; injected root-font enlargement is not browser zoom. No human candidate approval or publishing authorization is implied.

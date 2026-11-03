# F-017 — Drawing-to-object Introduction

## Implementation and scope

Completed the interrupted implementation against accepted baseline `1557222859810c42000da0986ab7dc3c82e082f8` (confirmed with `git rev-parse HEAD`).

- `index.html`: Introduction-only structural separation of headline, paragraph, and one decorative folded-sheet SVG. Exact copy, emphasis, IDs, and destinations preserved. Flat ruled lines meet the lifted cream plane; coral marks the upper fold, with a single returning cut-in at the lower right.
- `src/styles.css`: Introduction-only layout replacement. Art has reserved flow space, not negative offsets. Wide/tall lower composition places art left and paragraph right; rem-based sizing and a container query release cramped columns. Narrow/short layouts retain label → headline → paragraph → art. Existing heading scale and paragraph size/leading/38rem cap remain.
- `tests/introduction.spec.js`: 28 viewport/text/JavaScript combinations plus live enlargement and enlarged keyboard/history navigation. Includes text-range geometry and per-path SVG bounds with round-stroke allowance, not just clipped element boxes.
- `docs/review/f-017-capture.mjs` and `f-017-*` evidence: matched baseline/candidate captures, dimensions, and scroll/idle sample.

No product JavaScript, dependencies, global tokens, shared illustration rules, or other chapters changed. No motion modes or animations added. `git diff -- wrangler.jsonc src/main.js` is empty: Worker `adamjones-lab`, top-level `previews`, assets-only configuration, and absence of routes/custom hostnames are preserved. No publishing or repository operations beyond local inspection/editing/checks.

## Checks actually run

Environment: Node v24.13.1; Chromium via existing Playwright installation.

```sh
npm run test:browser -- tests/introduction.spec.js tests/chapter-index.spec.js
# 49 passed
npm run validate
# production build passed; 178 Chromium tests passed; Wrangler 4.152.0 dry-run passed
node docs/review/f-017-capture.mjs baseline
node docs/review/f-017-capture.mjs after
git diff --check
# clean
git diff -- wrangler.jsonc src/main.js
# empty
```

Existing full-suite checks cover downstream fragments, chapter state, native history, visible focus, project fallbacks, live text enlargement, and scheduler shutdown. The suite also ran its existing true 200% Chromium tab-zoom regression; that is separate from this task's root-font matrix and does not constitute an Introduction-specific browser-zoom capture set.

## Matched visual evidence

Reproduce from repository root using the two capture commands above. The helper serves baseline files directly from Git objects, never switches or resets the worktree, and serves candidate files from the worktree. No bundling differences are introduced between the two capture sets.

Each set contains direct `#introduction` viewport and complete-section PNGs for:

| Filename label | CSS viewport |
| --- | --- |
| desktop | 1440×900 |
| mobile | 390×844 |
| short | 844×390 |
| narrow | 320×800 |

Every viewport crosses root text 100%/200% and JavaScript true/false: 32 PNGs per set. `text200` means CSS root-font enlargement, **not browser zoom**. Section screenshots scroll the target into view after the direct-entry viewport screenshot; use the viewport files to judge initial anchor clearance. Measurements are in `f-017-{baseline,after}-measurements.json`.

Developer visual review inspected desktop and mobile normal-text section comparisons, candidate short-landscape normal-text section, candidate 320px/200%/JS-off complete section, and desktop 200% direct-entry viewport. Observations:

- Desktop statement remains dominant. The complete object occupies the left lower area, separated from the readable paragraph on the right.
- The ruled flat surface visibly meets the rising ruled face, then the coral top and cream return; it reads as one connected abstract construction rather than floating panels. This is a developer judgment, not independent design approval.
- Mobile baseline ornament approached the paragraph and crossed the section edge. Candidate art sits fully below copy with clear separation. Short landscape also fully stacks despite its available width.
- At 320px with 200% root text, natural height grows and the heading breaks within a long word, but all copy remains present and the complete fold is contained. Stroke detail becomes fine at this extreme; no content was shrunk to make it fit.
- At enlarged desktop direct entry, the heading clears the persistent index. Full content continues below the viewport naturally, without a new pinned track.

## Scroll sample and limits

The candidate helper exercised small wheel increments, a larger jump, direction reversals, PageDown/PageUp, arrow keys, and Tab. `f-017-scroll-evidence.json` records resulting native scroll positions and **zero requested animation callbacks over a 600ms settled sample**, after a 1200ms wait. This establishes shutdown in that sample, not frame-pacing quality or freedom from perceptual jank on devices.

Not verified here: Safari/iPhone hardware, device performance/60fps profiling, exhaustive human inspection of every generated PNG, trusted independent visual review, or independent Greta/Rook judgments. No such reviews are claimed. Technical validation is complete; those later reviews and Adam's A–E decision remain pending. Stop before any PR or deployment; production stays manual-merge gated.

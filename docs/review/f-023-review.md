# F-023 supplementary implementation handoff

Candidate only. Independent reviews and Adam’s candidate decision are downstream;
no publication approval or reviewer verdict is claimed. No commit, push, PR,
deployment, Access or DNS changes were made.

## Evidence repair (attempt 2)

The eight PNGs in `f-023/` have been **replaced**, not reused from the initial
implementation. They now show the built product sources at commit
`dc46dcca201748883ec8903301368a589c3d05a2`. No product or test sources changed
in this repair. All eight PNGs were freshly regenerated; their bytes happen to
match the tracked PNGs (the repaired behavior does not change these static
states). The new manifest, actual capture execution and corrected source hashes
replace the stale provenance, rather than claiming a visual change.

`f-023/capture-manifest.json` records capture time, browser version, source
commit, SHA-256 hashes for product sources, built assets and all eight PNGs,
and per-state viewport, JavaScript setting, root font size, disclosure state,
header geometry/position, scroll position and focus. `source-sha256.txt` now
matches these product sources. Reproduce from repository root:

```sh
npm run build
node docs/review/f-023/capture.mjs
```

The capture script serves `dist` via local Vite preview. It uses the actual
summary and native About anchor, then Tab to the first link at mid-page. It
asserts visible About arrival/closed-row clearance, sticky mid-page keyboard
focus, fallback flow release and visible final links. Navigation remains visible;
no hiding, scroll interception or forced disclosure flags are injected.
Root enlargement is test input, **not browser zoom**.

| State | Image in `f-023/` |
| --- | --- |
| 390×844 closed/open top | `390-closed.png`, `390-open.png` |
| Native About arrival from disclosure | `390-about-arrival.png` |
| Sticky open, keyboard link focus at About | `390-midpage-keyboard.png` |
| 320×800, 200% root, no JS closed/open | `320-enlarged-nojs-closed.png`, `320-enlarged-nojs-open.png` |
| 640×390, no JS closed/open | `640-short-nojs-closed.png`, `640-short-nojs-open.png` |

All five pinned accepted references and all eight replacement PNGs were actually
viewed during this repair. Baseline disclosure states are **unavailable**: the
accepted baseline has no disclosure. These are supplementary local source
captures, not independently produced host captures or visual-review verdicts.

## Checks actually run in attempt 2

- `npm run build`: passed.
- `node docs/review/f-023/capture.mjs`: eight states captured; built-product
  assertions passed, Chromium 156.0.8078.4.
- `npm run test:browser -- tests/mobile-chapters.spec.js --workers=2 --retries=0`:
  **12 passed** (31.5s), including five native arrivals/history, idle shutdown,
  roomy mid-page focus, native mobile/desktop #top, and fallback release.
- `git diff --check`: passed after evidence/documentation updates.
- Manifest/source/image hash consistency checked after updates.

The supplied machine validation reports all 379 tests in 12 shards, installation,
build and packaging dry-run passed at this source commit. That complete inventory
was **not personally rerun** in attempt 2.

## Preserved implementation

Native `details#mobile-chapters` has a direct summary and five ordinary anchors.
Mobile uses one pale-green row and warm-paper in-flow contents, explicit summary
focus, generous targets and closed-row fragment clearance. Desktop navigation
is unchanged except the requested `Chapter /` prefix removal. Native selection
closes before default anchor handling; Escape dismisses without scroll repair.
The public #top target is nonsticky. Unsafe short/enlarged/no-JS/startup-failure
headers release wholly into flow in both states; roomy enhanced headers remain
sticky. Geometry observation is local/bounded. Protected chapter content, About,
dependencies and Wrangler configuration were not changed by this repair.

## Remaining boundaries

Independent technical/visual reviews, trusted matched host captures, synthesis
and Adam’s A–E decision remain downstream. Physical Safari/iPhone/iPad,
assistive technology and real-device performance remain unverified. Screenshots
do not establish motion smoothness. No automatic polish or publication.

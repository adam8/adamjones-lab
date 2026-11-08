# F-031 Review

## Change
Add a subtle chapter-level scroll snap so the page settles on chapter boundaries when the user stops scrolling nearby.

- Set `html { scroll-snap-type: y proximity; }`.
- Set `scroll-snap-align: start` on the main chapter regions (`#introduction`, `#work`, `#outside`, `#about`, `#elsewhere`).
- Existing `scroll-margin-block-start` values mean the snap also respects the sticky chapter index so section headings remain visible.

## Verification
- `chapter-index.spec.js`, `chapter-progress.spec.js`, `chapter-progress-layout.spec.js`, `project-flow.spec.js`, `home.spec.js`, `mobile-chapters.spec.js`, `interface-study.spec.js`, and `agent-paper-loop.spec.js` pass.
- Two tests that depend on pixel-precise manual scrolls disable `scroll-snap-type` while measuring so the snap behavior itself is not under test, only real user navigation.

## Decision
Ready.

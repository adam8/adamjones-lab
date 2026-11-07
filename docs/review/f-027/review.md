# F-027 Review

## Change
Remove the left border current-chapter indicators on desktop and mobile chapter navigation. The per-chapter progress meters introduced in F-026 now communicate the active chapter, making the separate left-border markers redundant and allowing a tighter nav.

## Evidence
- `desktop-index-current.png` — desktop chapter index shows `aria-current="location"` with bold weight and progress fill; no left green bar.
- `mobile-current.png` — mobile chapter list shows active chapter with bold weight and progress fill; no left green border.

## Bounded checks
- Chapter current-state logic and progress meters remain unchanged.
- `chapter-index.spec.js`, `chapter-progress.spec.js`, `chapter-progress-layout.spec.js`, and `mobile-chapters.spec.js` all pass.

## Decision
Ready. No design-review required beyond confirming the nav is visually cleaner.

# F-030 Review

## Change
Make the Work chapter sub-nav sticky at all desktop viewport widths, including the 961–1099px range where it was previously a non-sticky horizontal row.

- Added `position: sticky; top: 0` to `.project-controls` in the `(min-width: 961px) and (max-width: 1099px) and (min-height: 641px)` media query.
- The horizontal row layout is preserved for that width band, but it now stays pinned while the project panels scroll.
- Wide desktop (≥1100px) continues to use the sticky left column.

## Verification
- `project-flow.spec.js` and `home.spec.js` pass.
- Manual review: refreshing at ~1000px wide no longer shows the sub-menu scrolling away.

## Decision
Ready.

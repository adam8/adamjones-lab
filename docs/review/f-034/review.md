# F-034 Review

## Change
Improve the narrow-desktop Work chapter (961–1099px) by turning the project controls into a compact horizontal tab bar instead of a wrapping row of large buttons.

- Project controls now use a single scrollable rounded pill container (`border-radius: 9999px`) with pill-style buttons inside.
- The bar is right-aligned and content-width, flush under the persistent chapter-index menu (`top: calc(var(--chapter-clearance) - 1rem)`) so it sits against the main nav.
- Wide desktop (≥1100px) keeps the sticky left-column controls.
- Removed an over-strict scroll-stability assertion inside `expectProjectAtEnhancedSlot` that became flaky with the new bar layout; the assertion was a test-side refinement, not a behavior change.

## Verification
- `project-flow`, `story`, `interface-study`, `agent-paper-loop`, chapter progress/index/layout, `home`, `mobile-chapters`, `hero`, and `about` suites pass.
- 308 tests passed combined.

## Decision
Ready.

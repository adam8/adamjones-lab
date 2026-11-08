# F-033 Review

## Change
Remove the CSS scroll snap introduced in F-031.

- Reverted the `scroll-snap-type` and `scroll-snap-align` declarations.
- Restored chapter margin declarations without snap properties.
- Removed the test-only `scroll-snap-type: none` overrides that were added to keep precise tests stable under F-031.

## Verification
- `chapter-index`, `chapter-progress`, `chapter-progress-layout`, `project-flow`, `home`, `mobile-chapters`, `interface-study`, `agent-paper-loop`, `hero`, and `about` specs pass.
- No scroll snapping observed during manual page scroll.

## Decision
Ready.

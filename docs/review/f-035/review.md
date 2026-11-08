# F-035 Review

## Change
Update `story.spec.js` to match the natural document scrolling behavior introduced in F-029.

- Removed `aria-hidden`/`inert` assertions from `expectProjectAtEnhancedSlot`; panels are now reachable through normal scroll.
- Replaced staged slider scroll-position checks with `is-active`, in-viewport, and scroll-stability checks.
- Updated enhancement boundary tests to assert sticky project controls instead of a sticky project stage.
- Disabled smooth scrolling in tests that click project buttons/permalinks so the assertions run after scroll settles.

## Verification
- `story.spec.js`: 25 passed.
- Combined run with `project-flow`, `interface-study`, `agent-paper-loop`, chapter, `home`, `hero`, and `about`: 269 passed.

## Decision
Ready.

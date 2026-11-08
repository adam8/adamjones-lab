# F-029 Review

## Change
Change the Work chapter desktop experience so the main project content scrolls naturally, while the three project sub-nav buttons stay sticky on the left until the user scrolls into the next chapter (Outside).

- Disable the locked/staged project slider (`projects-staged` mode is no longer activated).
- Project panels flow in normal document order and can be read by scrolling.
- The left project-controls column is `position: sticky` within the Work section on wide viewports (≥1100px wide and tall enough).
- On narrower desktop viewports (961–1099px wide) the controls remain as a horizontal row above the scrolling panels.
- Active project still follows the visible panel while scrolling, but is no longer updated by reflow/zoom unless the user actually scrolls, preserving explicit selections.

## Verification
- `project-flow.spec.js`, `interface-study.spec.js`, and `agent-paper-loop.spec.js` updated to the new non-staged behavior and pass.
- `chapter-index`, `chapter-progress`, `chapter-progress-layout`, `introduction`, `outside`, `mobile-chapters`, and `home` specs pass.
- Broad test run reached 237/276 tests without failure before hitting the 360s timeout.

## Decision
Ready.

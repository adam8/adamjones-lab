# RAW-1: F-026 Development Handoff Excerpt

Status: **confirmed**

Source: `~/.local/share/adamjones-site-factory/tasks/F-026/development-interrupted.md`

Captured: 2026-11-07

## Context

This is the preserved developer handoff written when F-026 was paused. It describes the actual state of the implementation, test results, and constraints at the time of interruption.

## Key excerpts

> Designer 108.1s and Planner 127.9s completed with five required reference image reads each. Initial Developer made uncommitted navigation/progress implementation in index.html, main.js, styles.css; README; targeted inherited tests; two new files chapter-progress.spec.js and chapter-progress-layout.spec.js; eight supplementary screenshots/capture helper/manifest.

> Every product file remains in the approved worktree on accepted 9a48d1c; no implementation commit/tested/reviewed candidate or PR exists.

> Latest COMPLETED four-file command reported **54 passed, 1 failed**. Failure was measured boundaries forward/reverse 1440x900: expected 0, rendered fill 0.5001013787510138. Do not dismiss this as harmless rounding. Investigate stale sampling versus a real progression/layout/scheduler bug with actual scrollY/expected boundaries/rendered fill/timing evidence.

> The LAST command started but has NO tool_execution_end: it changed the per-sample 120ms wait to expect(...).toPass(timeout=1500, intervals 50/100), updated README, and launched the two new test files. Edits are present, but the fresh test result is UNKNOWN.

> Increasing a wait/poll is not a justified fix by itself: distinguish ordinary async browser paint readiness from production lag or incorrect cached geometry. Do not raise whole-test retries, hide initial failure or widen numerical tolerances. Bounded polling of a real readiness predicate can be legitimate if explained and independently checked, not simply waiting long enough for a defect to disappear.

## Constraints preserved

- Preserve current-link/fill boundary agreement.
- No native-scroll interference.
- No stale cache after nav width/wrap/persistence or Work staging changes.
- No slow paint/infinite observers.
- Maintain no-JS/failed-script hidden meters and usable controls.
- Do not run the private host runner, commit/push/PR/deploy, alter TASTE, or increase role limits.

## Link

Full file: `~/.local/share/adamjones-site-factory/tasks/F-026/development-interrupted.md`

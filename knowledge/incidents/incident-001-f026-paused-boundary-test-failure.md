# INC-1: F-026 Paused on Boundary Test Failure

Status: **confirmed**

Date: 2026-11-07

## Summary

The F-026 factory task (combine chapter navigation with per-chapter progress) was paused after the latest completed test run reported **54 passed, 1 failed**. The failure was a measured-boundary test at 1440×900: expected progress fill `0`, rendered `0.5001013787510138`.

## Observed behavior

- Failure: `measured boundaries forward/reverse 1440x900`
- Expected fill: `0`
- Rendered fill: `0.5001013787510138`
- Last known completed command: four-file run with 54 passed / 1 failed.
- Subsequent command (changed per-sample 120 ms wait to `expect(...).toPass(timeout=1500, intervals=50/100)`) started but produced no tool_execution_end, so its result is unknown.

## Investigation notes

The handoff notes warn against dismissing the failure as harmless rounding. Possible causes:

1. **Stale sampling** — geometry cached before a layout settle.
2. **Real progression/layout/scheduler bug** — incorrect scrollY, expected boundaries, or rendered fill calculation.
3. **Timing issue** — asynchronous browser paint readiness vs. cached geometry.

The recommended fix is bounded polling of a real readiness predicate, not simply increasing waits.

## Resolution

Unconfirmed. The task was eventually completed and merged in commit [ee17c56](https://github.com/adam8/adamjones-lab/commit/ee17c56bf87eb8b4b0ae53b66d172eb8ecf8fa37b6025c14db6635105651067ae065), PR [#22](https://github.com/adam8/adamjones-lab/pull/22), but the exact fix for the boundary test is not recorded here. The pause state was later cleared manually after the merge was verified.

## Lessons

- Do not treat near-miss numeric failures as rounding noise without evidence.
- Distinguish ordinary async paint readiness from production lag or incorrect cached geometry.
- Bound polling of a real readiness predicate is preferable to widening waits or tolerances.

## Evidence

- `~/.local/share/adamjones-site-factory/tasks/F-026/development-interrupted.md`
- `~/.local/share/adamjones-site-factory/tasks/F-026/approval.json`
- [README.md: Implementation notes — Progress indicates local chapter position](../../README.md)

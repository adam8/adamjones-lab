# ADR-4: Combine Chapter Progress with Navigation

Status: **confirmed**

## Context

The site originally had a top-of-page reading progress bar and a separate chapter navigation. Adam asked: "Could we combine them? I'd like to see the horizontal bar below the chapter links, accurately showing the progress through each chapter." Source: [F-026 approval.json](file:///home/adam/.local/share/adamjones-site-factory/tasks/F-026/approval.json)

## Decision

Replace the single document-level progress bar with **per-chapter progress tracks** positioned below each chapter link in both the desktop chapter index and the horizontal mobile chapter strip.

## Consequences

- Progress is local to each chapter, not a global reading completion metric.
- Tracks are hidden during initial paint and when JavaScript fails.
- Geometry is cached and invalidated only by viewport/font/observed-size changes.

## Related

- [Chapter Progress](../wiki/chapter-progress.md)
- [Scroll Scheduler](../wiki/scroll-scheduler.md)
- [INC-1: F-026 paused on boundary test failure](../incidents/incident-001-f026-paused-boundary-test-failure.md)

## Evidence

- [README.md: Implementation notes — Progress indicates local chapter position](../../README.md)
- [src/main.js](../../src/main.js)
- [docs/review/f-026/review.md](../../docs/review/f-026/review.md)
- [tasks/F-026/approval.json](file:///home/adam/.local/share/adamjones-site-factory/tasks/F-026/approval.json)

# Chapter Progress

Status: **confirmed**

Source: [src/main.js](../../src/main.js), [README.md: Implementation notes](../../README.md), [F-026 review](../../docs/review/f-026/review.md)

## TL;DR

Chapter navigation and progress were combined in F-026. A horizontal track now sits below each chapter link and shows per-chapter progress, replacing the earlier document-level reading bar.

## What changed in F-026

- Removed the single top-of-page reading progress bar.
- Added a small horizontal progress track under each desktop chapter link and inside the mobile disclosure.
- Tracks are hidden until the first valid initialized paint and remain hidden if JavaScript fails.

## Behavior rules

| Situation | Rule |
|-----------|------|
| Hero area | No current chapter; all tracks empty |
| Inside a chapter | Track fills proportionally |
| Past a chapter | Track is full |
| Document end | All five tracks full |
| Collapsed chapter boundary | Completion uses the latest-starting chapter |
| Native-anchor rounding | Current-link comparisons allow half a pixel because browsers round fractional CSS positions to pixels. [README.md: Implementation notes](../../README.md) |

## Caching

Native-anchor arrivals are cached so scroll-only updates never remeasure chapter geometry. Cache is invalidated by resize, font zoom, and narrowly observed nav/content size changes. [README.md: Implementation notes](../../README.md)

## Accessibility

- Tracks use `aria-hidden="true"` so they are decorative.
- Chapter links remain native anchors with real `href` targets.
- No-JS and script-failure fallbacks hide the tracks cleanly while keeping the links usable. [README.md: Implementation notes](../../README.md)

## See also

- [Scroll Scheduler](scroll-scheduler.md)
- [INC-1: F-026 paused on boundary test failure](../incidents/incident-001-f026-paused-boundary-test-failure.md)
- [ADR-4: Combine chapter progress with navigation](../decisions/adr-004-chapter-progress-combined-with-navigation.md)

## Hypotheses

- **Confirmed:** The implementation deliberately distinguishes "local chapter position" from "reading completion." [README.md: Implementation notes](../../README.md)
- **Likely:** The half-pixel tolerance exists because native anchors resolve to integer pixel offsets in practice.

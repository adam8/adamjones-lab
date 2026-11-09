# Scroll Scheduler

Status: **confirmed**

Source: [src/main.js](../../src/main.js), [README.md: Implementation notes](../../README.md)

## TL;DR

A single passive-scroll `requestAnimationFrame` scheduler handles three things at once: hero specimen transforms, per-chapter progress, and desktop project selection. It avoids measuring on every frame.

## What the scheduler drives

1. **Hero transforms** — motion of the inline SVG specimen on wide/tall viewports.
2. **Chapter progress** — width of each chapter's progress track.
3. **Current chapter / project selection** — active chapter index entry and project highlighting.

## How it stays cheap

- Listener is passive: `{ passive: true }`.
- Scroll handler only signals dirty; work happens inside `requestAnimationFrame`.
- No frames are requested while idle; the scheduler starts on the first scroll event and stops after the next paint when nothing is dirty.

## Geometry caching

- Chapter geometry is cached from **native-anchor arrivals** (rendered tops minus resolved destination clearance).
- Scroll-only updates do **not** remeasure chapter geometry or document height.
- Invalidation happens for viewport changes, font changes, and narrowly observed content/navigation size changes. [README.md: Implementation notes](../../README.md)

## Monotonic clamping

Cached values are clamped monotonically to the real document range so scroll position can never refer to a geometry state outside the current document.

## Hypotheses

- **Likely:** This unified scheduler is why no separate Intersection Observer setup is needed for chapter progress; the same cached geometry serves both purposes.
- **Confirmed:** The scheduler is explicitly designed to avoid perpetual idle animation. [design/TASTE.md](../../design/TASTE.md)

# ADR-2: Native Scroll Only

Status: **confirmed**

## Context

Editorial/portfolio sites often hijack scroll for storytelling, which harms accessibility, keyboard navigation, and performance on low-end devices.

## Decision

The document always follows **native scrolling**. Optional sticky hero storytelling is layered on only when the viewport is wide and tall enough, and it never intercepts scroll events.

## Consequences

- Users retain expected scroll behavior, back/forward gestures, and URL fragment navigation.
- The scroll scheduler reads `scrollY` but does not call `preventDefault` or animate `scrollTop`.
- All chapter links are real anchors with `href` targets.

## Related

- [Responsive Enhancement](../wiki/responsive-enhancement.md)
- [Scroll Scheduler](../wiki/scroll-scheduler.md)
- [ADR-11: Typography and readability over motion](adr-011-typography-over-motion.md)

## Evidence

- [README.md: Implementation notes](../../README.md)
- [design/TASTE.md](../../design/TASTE.md)

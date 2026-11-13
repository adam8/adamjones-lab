# ADR-5: No Site-Wide Reduced-Motion Mode

Status: **confirmed**

## Context

The site uses bounded hero motion and smooth native anchor scrolling. The question is whether reduced-motion preference should disable the whole enhancement system.

## Decision

Do not maintain a separate reduced-motion layout or disable the bounded hero enhancement solely because of `prefers-reduced-motion`.

Document anchor scrolling is a narrow exception: it is smooth by default and instant when `prefers-reduced-motion: reduce` is active or the viewport is short. This preserves the current navigation behavior introduced in commit `862d42c` without creating a second visual mode.

## Consequences

- Hero motion remains bounded, reversible, and idle when the page is not scrolling.
- Layout, content, keyboard access, and focus treatment do not branch on motion preference.
- Native chapter and utility anchors avoid smooth scrolling for users who request reduced motion.
- Short viewports also use instant anchor scrolling to protect their normal-flow fallback.

## Related

- [Scroll Scheduler](../wiki/scroll-scheduler.md)
- [ADR-11: Typography and readability over motion](adr-011-typography-over-motion.md)

## Evidence

- [src/styles.css](../../src/styles.css)
- Commit `862d42c` (`feat: smooth scroll for anchor navigation`)
- [design/TASTE.md](../../design/TASTE.md)

# ADR-11: Typography and Readability Over Motion

Status: **confirmed**

## Context

Motion can enhance storytelling but must not compromise readability or accessibility.

## Decision

Protect excellent typography, legible hierarchy, deliberate space, and coherent visual language. Motion must be bounded, reversible, and not perpetual. Visible focus and readable fallbacks are mandatory.

## Consequences

- No perpetual idle animations.
- No scroll hijacking.
- Focus rings and keyboard access are preserved in all enhanced modes.
- Text remains readable at 200% browser zoom and narrow viewports.

## Related

- [Responsive Enhancement](../wiki/responsive-enhancement.md)
- [Scroll Scheduler](../wiki/scroll-scheduler.md)
- [Testing Strategy](../wiki/testing-strategy.md)

## Evidence

- [design/TASTE.md](../../design/TASTE.md)
- [README.md: Implementation notes — Bounded, reversible motion](../../README.md)

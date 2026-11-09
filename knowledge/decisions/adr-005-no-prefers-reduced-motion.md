# ADR-5: No prefers-reduced-motion Mode

Status: **confirmed**

## Context

The site uses bounded motion. The question arose whether to add a `prefers-reduced-motion` media-query fallback.

## Decision

Adam explicitly removed dedicated `prefers-reduced-motion` behavior. Other motion safeguards remain in place: bounded/reversible motion, keyboard access, visible focus, and readable fallbacks.

## Consequences

- Code does not maintain a reduced-motion variant.
- Motion stays bounded and never idle, satisfying accessibility without a separate mode.

## Related

- [Scroll Scheduler](../wiki/scroll-scheduler.md)
- [ADR-11: Typography and readability over motion](adr-011-typography-over-motion.md)

## Evidence

- [design/TASTE.md](../../design/TASTE.md)

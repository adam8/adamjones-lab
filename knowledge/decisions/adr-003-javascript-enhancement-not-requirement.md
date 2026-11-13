# ADR-3: JavaScript Is Enhancement, Not Requirement

Status: **confirmed**

## Context

A portfolio should remain usable if JavaScript fails, is disabled, or is blocked.

## Decision

All essential copy, links, and navigation live in `index.html`. JavaScript adds sticky storytelling, progress, active-state synchronization, and compact project controls, but the site is fully navigable and readable without it.

## Consequences

- No-JS tests are a first-class citizen in the Playwright suite.
- CSS handles layout fallbacks (e.g., normal-flow hero and project passages).
- The horizontal mobile chapter strip and its native anchors remain available when JavaScript is absent.
- Project controls are hidden without JavaScript while every project passage remains visible.

## Related

- [Responsive Enhancement](../wiki/responsive-enhancement.md)

## Evidence

- [README.md: Implementation notes — Essential copy and links live in `index.html`](../../README.md)
- Representative JavaScript-off coverage in [tests/hero.spec.js](../../tests/hero.spec.js), [tests/story.spec.js](../../tests/story.spec.js), and [tests/mobile-chapters.spec.js](../../tests/mobile-chapters.spec.js)

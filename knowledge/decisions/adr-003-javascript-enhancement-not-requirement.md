# ADR-3: JavaScript Is Enhancement, Not Requirement

Status: **confirmed**

## Context

A portfolio should remain usable if JavaScript fails, is disabled, or is blocked.

## Decision

All essential copy, links, and navigation live in `index.html`. JavaScript adds enhanced sticky storytelling, chapter progress, and mobile disclosure behavior, but the site is fully navigable and readable without it.

## Consequences

- No-JS tests are a first-class citizen in the Playwright suite.
- CSS handles layout fallbacks (e.g., normal-flow hero and project passages).
- The mobile disclosure navigation closes gracefully when JS is absent by relying on native `details/summary` behavior.

## Related

- [Responsive Enhancement](../wiki/responsive-enhancement.md)

## Evidence

- [README.md: Implementation notes — Essential copy and links live in `index.html`](../../README.md)
- Test files that loop `javaScriptEnabled` over `[true, false]`, e.g. [tests/hero.spec.js](../../tests/hero.spec.js)

# ADR-12: Pretext for the About Section

Status: **confirmed**

## Context

F-019 explored a typesetter lockup for About but was discarded due to enlarged-narrow readability regression. F-020 proposed using `@chenglou/pretext` for a fresh About treatment.

## Decision

Use `@chenglou/pretext@1.0.0` for the merged About-section typesetter lockup.

## Consequences

- A single library dependency is added to `package.json`.
- The About lockup enhances the section typography without redesigning the rest of the site.

## Related

- [Visual Direction](../wiki/visual-direction.md)
- [F-019 discard decision in design/DECISIONS.md](../../design/DECISIONS.md)

## Evidence

- [package.json](../../package.json)
- [src/about-typesetter.js](../../src/about-typesetter.js)
- [F-020 decision in design/DECISIONS.md](../../design/DECISIONS.md)
- [docs/review/f-021/](../../docs/review/f-021-accepted/)

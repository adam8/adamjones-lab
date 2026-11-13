# Cleanup status

Status: **draft** — F-049 candidate, awaiting Adam's review and merge.

## Baseline

- Cleanup started from merged `main` at `dd4e2bcbb98c64c34de6157f48f392479b8439ec` (PR #40).
- The local untracked `images/` folder remains untouched.
- Visual behavior, native scrolling, native links, and no-JS content are intended to remain unchanged.

## F-049 cleanup

Branch: `factory/f-049-code-cleanup`

- Removed the disabled staged-project implementation, its unused geometry/state, a dead chapter sentinel, and stale CSS selectors.
- Rewrote obsolete disclosure-era navigation tests for the horizontal mobile chapter strip.
- Removed the historical F-021 spacing-comparison spec and exact image-byte assertions that duplicated current layout and visual-review coverage.
- Reduced repetitive viewport/state matrices to representative breakpoint, enlargement, no-JS, and failure cases.
- Reduced the Playwright suite from 467 tests in 17 files to 199 tests in 16 files.
- Updated README, wiki pages, and ADR language to match current navigation, Work controls, project flow, and the reduced-motion anchor-scroll exception.

## Validation

`npm run validate` passes on the candidate:

- Vite production build
- 199 Playwright tests
- Cloudflare dry-run packaging

## Separate follow-up

The local Greta/Rook review `20261111T225648-0700-de455320` remains blocked by the factory capture helper querying an SVG inside the Agent project even though the accepted and current versions use an image. Repair and retry must follow the factory evidence-recovery procedure; F-049 does not bypass or modify that state.

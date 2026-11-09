# ADR-7: Explicit Human Creative Approval

Status: **confirmed**

## Context

The factory automates implementation but not aesthetic judgment.

## Decision

Only Adam's explicit decision authorizes a creative change. Design review reports, test passes, and reviewer approvals are advisory.

## Consequences

- Every loop ends with an A/B/C/D/E decision recorded in `design/DECISIONS.md`.
- The factory opens a PR but never merges or deploys without Adam's manual action.
- "Keep" (choice E) is required before a candidate becomes a PR candidate.

## Related

- [Factory Workflow](../wiki/factory-workflow.md)

## Evidence

- [design/DECISIONS.md](../../design/DECISIONS.md)
- `~/.local/share/adamjones-site-factory/README.md`

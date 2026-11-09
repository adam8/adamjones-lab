# ADR-6: Mandatory Greta × Rook Design Review

Status: **confirmed**

## Context

Creative changes need independent critique before Adam decides.

## Decision

Use two critics, **Greta** (modernist) and **Rook** (experimentalist), to independently inspect the same actual screenshots and scroll evidence. Their reports are synthesized, and then the factory **stops for Adam's A–E decision**.

## Consequences

- Critic recommendations alone never start development or publishing.
- Each builder loop tests exactly one explicitly approved creative hypothesis.
- Rejected candidates are preserved in Git and review captures rather than deleted.

## Related

- [Factory Workflow](../wiki/factory-workflow.md)
- [Visual Direction](../wiki/visual-direction.md)

## Evidence

- `~/.local/share/adamjones-site-factory/README.md`
- [design/README.md](../../design/README.md)
- [design/DECISIONS.md](../../design/DECISIONS.md)

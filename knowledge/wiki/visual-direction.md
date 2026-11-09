# Visual Direction

Status: **confirmed**

Source: [design/DECISIONS.md](../../design/DECISIONS.md), [docs/review/f-016/](../../docs/review/f-016/), [docs/review/f-017/](../../docs/review/f-017/), [docs/review/f-018/](../../docs/review/f-018/)

## TL;DR

The visual language evolved through a sequence of approved experiments: a floating-island diorama for the Outside section, drawing-to-object transitions for the Introduction, a typographic Elsewhere footer, and a Pretext-driven About lockup.

## Experiments and outcomes

| Task | Hypothesis | Decision | Result |
|------|------------|----------|--------|
| F-016 | Floating-island diorama for Outside | Choice **E** (Keep) at 2026-11-02 | Merged in [1557222859...](https://github.com/adam8/adamjones-lab/commit/1557222859810c42000da0986ab7dc3c82e082f8). [F-016 decision](../../design/DECISIONS.md) |
| F-017 | Drawing-to-object transition for Introduction | Choice **E** (Keep) at 2026-11-03 | Merged in [dbdbb7221...](https://github.com/adam8/adamjones-lab/commit/dbdbb722169b6850be07082928d724fc17c39050), with accepted inherited overlap during scrolling. [F-017 decision](../../design/DECISIONS.md) |
| F-018 | Typographic Elsewhere footer | Choice **E** (Keep) at 2026-11-04 | Merged in [990864060...](https://github.com/adam8/adamjones-lab/commit/990864060157cea6af641e2536ad8f0e6651768e), with taller desktop finale tradeoff. [F-018 decision](../../design/DECISIONS.md) |
| F-019 | Typesetter lockup for About | Choice **D** (Discard) at 2024-11-04 | Rejected due to enlarged-narrow readability regression. [F-019 decision](../../design/DECISIONS.md) |
| F-020 | Pretext About lockup | Choice **B** (Rook spacing) at 2026-11-05, then accepted | Merged in [725f32211...](https://github.com/adam8/adamjones-lab/commit/725f3221194346581151b0688f2306b464d98bb2). [F-020 decision](../../design/DECISIONS.md) |

## Rejected experiments are preserved

Discarded candidates (e.g., F-019) remain in Git and review captures so the baseline comparison evidence is not lost. The site is reverted to the last accepted baseline rather than compensating with more changes.

## Hypotheses

- **Confirmed:** The visual direction favors "memorable, concept-driven visual moments" over incremental polish. [design/TASTE.md](../../design/TASTE.md)
- **Likely:** Future loops will continue to test one bold visual hypothesis at a time, preserving or reverting rather than layering fixes.

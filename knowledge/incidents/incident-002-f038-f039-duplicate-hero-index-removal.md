# INC-2: F-038 and F-039 Duplicate Hero-Index Removal

Status: **confirmed**

Date: 2026-11-09

## Summary

Two factory branches targeted the same hero annotation ("Personal index / VI / BC"):

- `factory/f-038-remove-hero-index-line` — created earlier, remained at `052ba0c` with no commits.
- `factory/f-039-remove-hero-index-annotation` — created later, contained the actual removal.

Adam merged PR #32 (F-039). F-038 was stale and was cleaned up.

## Timeline

1. F-038 worktree existed at `~/.local/share/adamjones-site-factory/runtime/worktrees/f-038`.
2. F-038 branch pointed to `052ba0c` with no unique commits.
3. On 2026-11-09, I created F-039 from `main`, removed the annotation in `index.html`, `src/styles.css`, and `tests/hero.spec.js`, pushed, and opened PR #32.
4. Adam merged PR #32.
5. I deleted the F-038 worktree and branch.

## Root cause

The factory did not clean up the F-038 worktree/branch, and F-038 never progressed to a PR. When Adam requested the same change directly, a new F-039 branch was created instead of reusing F-038.

## Resolution

- Merged F-039 via PR #32 ([36e0614](https://github.com/adam8/adamjones-lab/commit/36e0614)).
- Removed the stale F-038 worktree and deleted the local branch.
- Added automatic post-merge worktree cleanup to the factory (`cleanup_task_worktree`). See [INC-3: Stale worktree accumulation](incident-003-stale-worktree-accumulation.md).

## Lessons

- Before creating a new factory branch for a requested change, check for existing related branches/worktrees.
- Stale worktrees accumulate if cleanup is not automated.

## Evidence

- [PR #32](https://github.com/adam8/adamjones-lab/pull/32)
- `~/.local/share/adamjones-site-factory/state.json` (showed F-026 blocked; F-038 worktree existed)
- `git worktree list` output (showed f-038 at old main)

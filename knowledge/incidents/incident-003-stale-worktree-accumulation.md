# INC-3: Stale Worktree Accumulation

Status: **confirmed**

Date: 2026-11-09

## Summary

The factory observed merged PRs and reset `state.json` to idle, but it never removed the task worktree or deleted the merged feature branch. This left directories like `~/.local/share/adamjones-site-factory/runtime/worktrees/f-038` behind indefinitely.

## Discovery

While cleaning up after F-039, I found a stale F-038 worktree at `~/.local/share/adamjones-site-factory/runtime/worktrees/f-038`. The worktree had no uncommitted changes and was at an old main commit (`052ba0c`), but the branch and directory remained registered.

## Fix

Added a `cleanup_task_worktree` helper to `scripts/factory.py` and called it after a PR is observed as merged. The helper:

1. Removes the registered worktree via `git worktree remove --force`.
2. Falls back to `shutil.rmtree` if the directory is orphaned.
3. Deletes the local feature branch.
4. Deletes the remote feature branch (`git push origin --delete`).

All cleanup calls use `check=False` so a cleanup failure does not block merge bookkeeping.

## Verification

- `python3 -m py_compile scripts/factory.py` → OK
- `python3 -m unittest discover -s tests -v` → 55 passed

## Resolution

Committed to the factory records repo:

```
61339fd feat: clean up task worktree and branch after merge
```

## Lessons

- State resets are not enough; physical worktrees and branches must also be cleaned up.
- Post-merge cleanup should be best-effort so transient git failures do not stall the workflow.

## Evidence

- `~/.local/share/adamjones-site-factory/scripts/factory.py`
- `~/.local/share/adamjones-site-factory/state.json` (before cleanup showed blocked F-026 and f-038 worktree)
- `git worktree list` (before cleanup showed f-038; after cleanup showed only main)

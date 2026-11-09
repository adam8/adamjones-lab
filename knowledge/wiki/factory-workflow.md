# Factory Workflow

Status: **confirmed**

Source: `~/.local/share/adamjones-site-factory/README.md`, [design/DECISIONS.md](../../design/DECISIONS.md)

## TL;DR

The site is evolved through a small sequential factory. Each loop proposes exactly one creative experiment, goes through design review, gets Adam's explicit approval, is implemented in an isolated Git worktree, and ends with a single GitHub PR for manual merge.

## Branch convention

Format: `factory/f-NNN-short-description`

Examples from the repo:

- `factory/f-026-combine-chapter-navigation-with-accurate-per`
- `factory/f-034-compact-narrow-desktop-work-tabs`
- `factory/f-039-remove-hero-index-annotation`

## Lifecycle

1. **Inspiration / idea** — proposed read-only; no product changes.
2. **Adam approves** — one hypothesis enters the backlog.
3. **Designer + Planner** — produce `design.md` and `plan.md` in `~/.local/share/adamjones-site-factory/tasks/F-NNN/`.
4. **Developer** — implements in an isolated Git worktree.
5. **Tester + Reviewer** — run browser tests and technical review.
6. **Bounded repair** — at most two repair attempts.
7. **Greta + Rook design review** — independent critics inspect actual screenshots.
8. **Adam decides** — A/B/C/D/E choice; only A/B/C/D/E with explicit direction authorize changes.
9. **PR opened** — single open `factory/*` PR at a time.
10. **Manual merge** — Adam merges on GitHub; the factory never auto-merges or deploys.

## Design-review gate

When design reviews are enabled, the factory **stops for Adam's A–E decision** after critic synthesis. Critic recommendations alone never start development or publishing. `~/.local/share/adamjones-site-factory/README.md`

## Worktree cleanup

After a PR is observed as merged, the factory now removes the task worktree and deletes the local and remote feature branch. See [INC-3: Stale worktree accumulation](../incidents/incident-003-stale-worktree-accumulation.md).

## Hypotheses

- **Confirmed:** The rule is "at most one open `factory/*` pull request." `~/.local/share/adamjones-site-factory/README.md`
- **Confirmed:** Publishing, DNS, custom-domain setup, Access policy changes, and production deployment are outside the factory's authority. [AGENTS.md](../../AGENTS.md)

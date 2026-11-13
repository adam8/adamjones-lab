# Cleanup handoff

Status: **draft** — snapshot for a fresh session; verify current Git and factory state before acting.

## Starting point

- At this handoff, `main` includes [PR #39](https://github.com/adam8/adamjones-lab/pull/39), merge commit `de455320fca6608576eb57a5dbe7539bafbe3db6`. Read [project knowledge skill](../../.pi/skills/project-knowledge/SKILL.md) and [index](../INDEX.md) first, then inspect the current tree and any subsequent merges.
- Adam wants a **code cleanup**, starting with inspection and a bounded proposal. Preserve current visual behavior, native scrolling, accessible links, and no-JS content unless he approves a change. Use a `factory/f-NNN-*` branch and PR; Adam merges manually. Do not directly deploy, change DNS, or touch the local untracked `images/` folder.
- Some older wiki pages and README descriptions predate the latest navigation; source code and current tests take precedence. In particular, `responsive-enhancement.md`, `chapter-progress.md`, and parts of `testing-strategy.md` and `architecture.md` still mention the removed mobile disclosure. Audit before treating them as current.

## Current navigation

- Mobile chapter navigation is a horizontally scrollable list containing `aj.`, Intro, Work, Outside, About and Elsewhere. It uses native anchors, inline progress indicators, horizontal proximity snap, and JS-assisted active-item visibility. Desktop uses the chapter index. See [index.html](../../index.html), [styles](../../src/styles.css), and [main.js](../../src/main.js).
- Work has compact sticky project controls on mobile, positioned below the measured chapter header; project content remains accessible without JavaScript. See [mobile Work tests](../../tests/mobile-work-nav.spec.js) and [PR #39](https://github.com/adam8/adamjones-lab/pull/39).
- Smooth document anchor scrolling was added with instant behavior for reduced motion and short viewports. This differs from the historical [ADR-5](../decisions/adr-005-no-prefers-reduced-motion.md); examine current CSS and discuss any policy reconciliation rather than silently changing behavior.

## Known follow-up and process

- **Tests:** [mobile-chapters.spec.js](../../tests/mobile-chapters.spec.js) and [navigation.js](../../tests/navigation.js) still assume the removed `<details>/<summary>` menu. The separate `mobile-work-nav.spec.js` was added for PR #39. Rewrite the obsolete tests and helpers in a focused loop; don't assert the full suite is green without running it.
- **Cloudflare:** Adam confirmed a production build deployed after [PR #38](https://github.com/adam8/adamjones-lab/pull/38) merged. Cloudflare Git previews also built. An unpushed local branch `factory/f-046-restore-main-deploy-workflow` contains a proposed GitHub Actions workflow; it was not merged. Don't introduce a second deploy mechanism without investigating and obtaining approval.
- **Merge lesson:** [PR #37](https://github.com/adam8/adamjones-lab/pull/37) was merged before later commits were pushed to its branch; those later changes reached `main` through PR #38. Before pushing follow-up changes or deleting a branch, check PR status and confirm the exact tip is incorporated in `main`.
- **Design review:** the requested Greta/Rook review of `de455320` did not complete. Retry `20261111T225648-0700-de455320` failed capturing the older accepted baseline (`b9b3444475bc0c82e5a50268de1013387fbba3e6`), with `getBoundingClientRect` on null in four enlarged Agent captures. See local factory design-review state and `design/CAPTURES/20261111T225648-0700-de455320/before/capture.log`. No new critic recommendations were produced. Investigate without bypassing the evidence gate; current pending state may require the documented retry/recovery procedure.
- Factory-local backlog/state and design memory are separate from this wiki. Consult `~/.local/share/adamjones-site-factory/README.md` and current status rather than assuming task IDs or state are current.

# adamjones-lab Knowledge Index

A lightweight, filesystem-based wiki for verified project knowledge. Read this index before answering project-history questions.

## Legend

- **Status**
  - `confirmed` — reviewed, sourced, generally safe to rely on
  - `draft` — partially complete or awaiting review
  - `hypothesis` — informed guess, needs validation
- **ID prefix**
  - `ADR` — decision record
  - `INC` — incident
  - `RAW` — raw evidence/excerpt
  - `WIKI` — curated article

---

## Wiki pages

| ID | Page | Status | Tags | Summary |
|----|------|--------|------|---------|
| WIKI-1 | [architecture](wiki/architecture.md) | confirmed | build, vite, testing, cloudflare | Tech stack, file layout, build/test/deploy boundaries. |
| WIKI-2 | [scroll-scheduler](wiki/scroll-scheduler.md) | confirmed | javascript, performance, main.js | Single passive-scroll / `requestAnimationFrame` scheduler for hero transforms, chapter progress, and project selection. |
| WIKI-3 | [chapter-progress](wiki/chapter-progress.md) | confirmed | navigation, f-026, accessibility | Per-chapter progress tracks, cached native-anchor arrivals, current-link sync, no-JS fallback. |
| WIKI-4 | [responsive-enhancement](wiki/responsive-enhancement.md) | confirmed | css, layout, accessibility | Viewport thresholds, disclosure navigation, content-fit observation, graceful degradation. |
| WIKI-5 | [factory-workflow](wiki/factory-workflow.md) | confirmed | process, git, design-review | `factory/f-NNN-*` branch lifecycle, human merge gate, Greta/Rook design review. |
| WIKI-6 | [testing-strategy](wiki/testing-strategy.md) | confirmed | testing, playwright, ci | Playwright config, JS-on/JS-off matrix, viewport sizes, review capture workflow. |
| WIKI-7 | [design-principles](wiki/design-principles.md) | confirmed | design, taste, aesthetics | Distilled creative principles from `design/TASTE.md` and approved decisions. |
| WIKI-8 | [visual-direction](wiki/visual-direction.md) | confirmed | design, illustration | Diorama, floating island, drawing-to-object, typographic Elsewhere, typesetter experiments. |
| WIKI-9 | [local-preview](wiki/local-preview.md) | confirmed | tooling, ipad | How to preview the Markdown wiki on an iPad via a Pi-hosted server. |

---

## Decisions (ADRs)

| ID | Decision | Status | Tags | Summary |
|----|----------|--------|------|---------|
| ADR-1 | [Static site with Vite, Playwright, Wrangler](decisions/adr-001-static-site-vite-playwright.md) | confirmed | build, vite, testing | Why the site is a Vite-built static MPA with vanilla JS. |
| ADR-2 | [Native scroll only](decisions/adr-002-native-scroll-only.md) | confirmed | interaction, accessibility | Document follows native scrolling; no scroll hijacking. |
| ADR-3 | [JavaScript is enhancement, not requirement](decisions/adr-003-javascript-enhancement-not-requirement.md) | confirmed | progressive-enhancement, accessibility | Essential copy lives in `index.html`; JS adds sticky storytelling and progress. |
| ADR-4 | [Combine chapter progress with navigation](decisions/adr-004-chapter-progress-combined-with-navigation.md) | confirmed | navigation, f-026 | Replace document-level reading bar with per-chapter tracks under chapter links. |
| ADR-5 | [No prefers-reduced-motion mode](decisions/adr-005-no-prefers-reduced-motion.md) | confirmed | accessibility, motion | Adam explicitly removed reduced-motion support; other safeguards remain. |
| ADR-6 | [Mandatory Greta × Rook design review](decisions/adr-006-design-review-gating.md) | confirmed | process, design-review | Independent critics inspect screenshots before Adam decides. |
| ADR-7 | [Explicit human creative approval](decisions/adr-007-explicit-human-creative-approval.md) | confirmed | process, governance | Only Adam approves creative changes; reviews are advisory. |
| ADR-8 | [Surreal visuals, plainspoken writing](decisions/adr-008-surreal-visuals-plainspoken-writing.md) | confirmed | design, copy, aesthetics | Core creative voice: imaginative visuals with factual, plain text. |
| ADR-9 | [One-page native-scroll editorial story](decisions/adr-009-one-page-editorial-story.md) | confirmed | design, structure | Site is a single scrolling story with named chapters. |
| ADR-10 | [Reject generic portfolio cards and gradients](decisions/adr-010-no-generic-portfolio-cards.md) | confirmed | design, aesthetics | Avoid cards, gradients, corporate polish; concept-driven moments. |
| ADR-11 | [Typography and readability over motion](decisions/adr-011-typography-over-motion.md) | confirmed | design, typography, accessibility | Protect excellent type, bounded reversible motion, visible focus, readable fallbacks. |
| ADR-12 | [Pretext for the About section](decisions/adr-012-pretext-for-about.md) | confirmed | design, f-020, typography | Use `@chenglou/pretext` for the merged About typesetter lockup. |

---

## Incidents

| ID | Incident | Status | Tags | Summary |
|----|----------|--------|------|---------|
| INC-1 | [F-026 paused on boundary test failure](incidents/incident-001-f026-paused-boundary-test-failure.md) | confirmed | f-026, testing, flaky-test | Desktop progress fill test failed; investigation paused the factory run. |
| INC-2 | [F-038 and F-039 duplicate hero-index removal](incidents/incident-002-f038-f039-duplicate-hero-index-removal.md) | confirmed | f-038, f-039, git | Two branches targeted the same annotation; only F-039 was merged. |
| INC-3 | [Stale worktree accumulation](incidents/incident-003-stale-worktree-accumulation.md) | confirmed | factory, devops | Factory left merged-task worktrees behind; fixed in `scripts/factory.py`. |

---

## Raw evidence

| ID | Page | Status | Tags | Summary |
|----|------|--------|------|---------|
| RAW-1 | [F-026 development handoff excerpt](raw/f026-development-handoff.md) | confirmed | f-026, evidence | Preserved developer handoff describing the paused test state and constraints. |

---

## How to update this index

When adding a page:
1. Pick the next numeric ID in the correct section.
2. Add a row with status and tags.
3. Keep summary to one concise line.
4. Do not create duplicate rows for existing topics.

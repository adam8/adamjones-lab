# F-018 — implementation review

## Scope and disposition

Implemented the approved continuous typographic bands; ready for independent review, not approved for publication. Resumed the existing interrupted implementation rather than replacing it.

Product changes are limited to footer-scoped rules in `src/styles.css`. Markup, exact labels/URLs/attributes, shared heading rules, other chapters, product JavaScript, tokens, dependencies, and Cloudflare configuration are unchanged. No motion feature was added. Worker `adamjones-lab`, top-level `previews: {}`, and route-free static-assets configuration remain intact.

The heading now precedes full-width cream GitHub and green domain bands. Both use the same enlarged Georgia scale, inset whole-band focus outlines, flexible label/arrow wrapping, and normal-flow spacing. The domain is staggered on roomy screens; Back to top follows in normal flow. Footer viewport minimum heights, clipping, absolute positioning, and mobile list-size overrides are removed.

## Checks executed in this run

- `git status --short`, `git rev-parse HEAD`, and accepted-object verification: HEAD is `dbdbb722169b6850be07082928d724fc17c39050`.
- `npm run test:browser -- tests/elsewhere.spec.js tests/chapter-index.spec.js`: **41 passed**.
- `npm run validate`: Vite build, **199 browser tests passed**, Wrangler **4.152.0** dry-run passed. No deployment performed.
- `node docs/review/f-018-capture.mjs baseline` and `after`: refreshed matched evidence for all **16 cases per version**, serving baseline Git objects without changing the worktree. An intermediate document-crop attempt failed because `fullPage` was missing; corrected and both complete capture runs succeeded.
- `git diff --check`: passed.
- `git diff -- wrangler.jsonc src/main.js`: empty.

Tests cross 1440×900, 390×844, 320×800, and 844×390 with root-font 100%/200% and JavaScript on/off. They check full-width geometry, text ranges, arrow bounds, overlap, document/local overflow (also with body horizontal clipping disabled), live root enlargement, forward/reverse Tab traversal, focus clearance, Back to top activation/history, chapter navigation/current state, exact attributes, hover underline, and intercepted external Enter activation.

Root-font enlargement is **not browser zoom**. A separate Chromium extension-based test uses actual `chrome.tabs.setZoom(..., 2)`, confirms zoom 2 and a 720px layout viewport from the 1440px viewport, then checks geometry and keyboard access. It produces the separate `browserzoom200` captures.

## Evidence and observations

- `f-018-{baseline,after}-*-viewport.png`: direct-fragment actual viewport, including persistent UI where applicable.
- `f-018-{baseline,after}-*-section.png`: complete document-coordinate footer crop. Capture from document top avoids relocating fixed UI into a tall footer during locator screenshot scrolling. Consult viewport/focus evidence for actual fixed-menu placement.
- `f-018-after-*-focus-{github,domain,top}.png`: actual keyboard-focused viewport views, with no UI hidden.
- `f-018-{baseline,after}-measurements.json`: band, label, text-range and arrow geometry, widths and natural footer height.
- `f-018-scroll-evidence.json`: wheel/keyboard direction samples and settled scheduler count.

Candidate document and footer widths equal viewport width in all 16 measured cases. At 100% root font, footer heights are approximately 1183px desktop, 663px mobile, 714px narrow, and 798px short. At 200%, they expand to 1478px, 1763px, 2080px, and 1309px respectively. The baseline itself has local overflow in several enlarged cases; this has not been concealed in the measurements.

Developer visual inspection included matched desktop normal-size before/after, mobile normal-size, narrow normal-size without JavaScript, narrow 200%, short 200% domain focus, and desktop 200% focus for all three links. Inspected glyphs/descenders/arrows and inset focus paint remain complete. Narrow enlarged text intentionally wraps labels and moves arrows to trailing lines; normal-size mobile retains the domain intact. This is self-review, not independent visual approval or exhaustive manual inspection of every image.

Wheel sampling initially reaches the document end (positive deltas correctly clamp), then reverses upward and downward; PageDown/PageUp and arrow-key samples also change native scroll position. The settled 600ms sample records **zero scheduler callbacks** after a 1200ms settling delay. This demonstrates idle shutdown, not frame-pacing performance or physical-device smoothness.

## Pending review / limitations

Independent technical review, trusted matched visual review, and independent Greta/Rook judgments were not available through this execution's tools and remain pending. Do not treat this developer self-review as those approvals. Stop for Adam's A–E decision before any PR.

No physical iPhone/Mobile Safari, Firefox/WebKit, on-device touch scrolling, or frame-pacing profiling was performed. Headless Chromium emulation and scroll samples are not device-performance evidence. Actual browser zoom was checked at desktop 200% only; the full 16-case matrix uses root-font enlargement. External activation was intercepted locally; no private sessions or live external-site checks were used. No Access, branch-preview build, or production publishing verification was attempted. No commit, push, PR, deployment, DNS, or other repository change was made.

## Repair attempt 1 — actual-zoom evidence

Resolved the tester's blank `browserzoom200` evidence finding without product or configuration changes. The tab really was zoomed to 200%, but the screenshot path used layout CSS coordinates where Chromium screenshot clips require device-independent document coordinates. The test now derives the conversion from CDP layout metrics and captures explicit document clips. The focus capture covers the current viewport with the keyboard-focused GitHub band centered; the separate section capture shows the complete unfocused footer. Neither hides or alters page content. Added decoded-image color-coverage assertions to reject blank captures rather than trusting DOM geometry alone.

Checks run during repair:
- Actual Chromium zoom test run in isolation: passed after correction (also reproduced the prior passing-but-invalid capture behavior before correction).
- `npm run test:browser -- tests/elsewhere.spec.js tests/chapter-index.spec.js`: **41 passed**, including regenerated zoom evidence.
- `git diff --check`: passed.
- Product/configuration diff (`src/styles.css`, `src/main.js`, `index.html`, `wrangler.jsonc`, `TASTE.md`): empty.
- Opened and visually inspected both corrected PNGs: the complete-footer image contains the heading, both complete destination labels/arrows, and Back to top; the viewport image contains the complete GitHub band with its full inset focus outline and legible text/arrow. This is developer self-inspection only, not an independent visual verdict.

Build/full-suite/Wrangler results above belong to the earlier implementation run and supplied validation; they were not rerun for this evidence-only repair. No commit or publishing action was taken.

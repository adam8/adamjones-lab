# F-012 review

## Supervised correction — enlarged-header clearance (current result)

Adam approved one narrowly scoped supervised correction after the automated repair limit; the factory repair count remains 2.

- Reproduced the independent Reviewer's overlap at 390×844 with 200% root text: header bottom 467.17px, hero index top 272px. The new clearance assertion failed before the CSS fix.
- Navigation now participates in normal flow on narrow and short viewports. Its content-dependent height reserves actual space above the hero instead of relying on absolute positioning and a fixed padding allowance. Existing desktop sticky behavior is unchanged.
- After correction, the enlarged mobile header ends at 467.17px and the hero index begins at 515.17px; short landscape ends at 280px with the index beginning at 328px. Both retain 48px clearance and no horizontal overflow.
- Added six enlarged-text tests across 390, 768, and 1440px with JavaScript enabled and disabled. Header/index and header-link hit-target clearance are also asserted in existing enlargement, first-viewport, boundary, and true 200% Chromium zoom tests.
- `npm run validate` passed: build, **71 Chromium tests**, and Wrangler dry-run. All 22 focused hero tests pass. `git diff --check` passed.
- Refreshed desktop/mobile hero images and all three focus captures. Added `f-012-enlarged-header-mobile.png` and `f-012-enlarged-header-short.png` for the repaired states.
- Operator directly inspected desktop/mobile hero and enlarged mobile captures using the working image reader: no header/annotation collision, missing identity, or illustration overlap was found in those states. Fresh independent Tester and Reviewer gates are still required on the committed correction.
- No reduced-motion feature was restored. Native scrolling, keyboard access, narrow/short fallbacks, and idle scheduling remain covered. Cloudflare configuration, content, and links are unchanged by this correction.
- Earlier entries below are historical, including image-reader failures and acceptance gaps that subsequent repairs resolved. No on-device Safari/iPhone or animation-smoothness certification is claimed.

## Repair attempt 1 — prior result

- Fixed the 200% root-font overflow rather than skipping its assertion. The chapter index can wrap its title/list; fallback and constrained grids no longer force min-content/rem minimum widths beyond their available space. No text, destinations, project behavior, or clipping rules changed.
- Restored unconditional document-overflow checking and added direct bounds checks for chapter links, project copy/permalinks, About, and Elsewhere so existing clipping cannot conceal these regressions. At 390px with 200% root font, document width is now 390px (formerly about 447px). All five enlarged-text sizes pass.
- Added keyboard-driven focus-ring clearance checks at 390×844, 768×1024, 1440×900, 844×390, and 961×641. These check the full 7px outline/shadow extent against viewport and clipping ancestors. A small clamped hero-gap adjustment fixes a 0.44px focus-shadow overrun at 961×641, keeping the 1440px gap unchanged.
- Added **real 200% Chromium tab zoom** using a temporary local validation extension and `chrome.tabs.setZoom`, not CSS/pinch/device emulation. Confirmed zoom factor 2, layout viewport 720px and devicePixelRatio 2 on the 1440×900 surface; normal flow, no document overflow, keyboard focus and Enter → Work pass. Extension/profile are deleted afterward; no shipped extension/dependency was added.
- Final `npm run build` and `npm run test:browser`: **65 passed**, no retries needed. Existing native-navigation, JavaScript-disabled, boundary, and idle-scheduler tests remain passing. `git diff --check` passed. Wrangler configuration inspected and unchanged; no deployment or credential access.
- Focus captures: `f-012-focus-desktop.png`, `f-012-focus-mobile.png`, `f-012-focus-boundary.png`. Capture succeeded, but the image reader rejected both PNG and reduced JPEG attempts. **Direct visual composition/focus-stroke review remains unavailable**; geometric focus clearance is verified, not a visual sign-off. iPhone/Safari and device performance remain unverified. The historical motion measurements below were not rerun.

## Original implementation review (historical; repair results above supersede its overflow/zoom limits)

## Implementation

Completed the partial implementation found in the supplied worktree. Hero copy now states the approved role and location. One decorative inline SVG connects the command key, wrapping ellipse, stem, and two leaves. Grid space reserves room for the object; narrow layouts place it in flow. The enhanced track is 145svh with intrinsic growth. Only the specimen lowers (0–4vh) and turns (0–4deg); identity copy no longer transforms. Worker configuration is unchanged.

## Executed checks

- Node v24.13.1; `npm ci` succeeded (reported 2 moderate and 1 high dependency vulnerabilities; no dependency upgrades attempted).
- `npx playwright install chromium` timed out; an available Chromium installation successfully ran all subsequent tests and captures.
- Initial focused browser run: 60 passed, 1 failed on document overflow at 200% root-font enlargement, outside the hero. The final tests explicitly scope enlarged-text bounds to the hero rather than concealing this failure.
- Final `npm run validate`: build, all 63 Chromium tests, and Wrangler 4.152.0 dry-run packaging passed. Nothing deployed.
- `git diff --check` passed.
- Opening bounds at 390×844, 768×1024, 1440×900 tested with and without JavaScript; introduction intersection after one viewport; specimen separation, stable heading, start/midpoint/endpoint/reversal, short/boundary layouts, 200% root-font enlargement, keyboard activation, focus, downstream navigation, assets, 404s, and idle shutdown covered by tests.
- Desktop/mobile opening PNGs captured beside this report. The tool's image viewer could not display either image; captures are for human review, not a claim of visual inspection.

## Local motion sampling

Headless Chromium at 1440×900, native scroll driven once per test-owned animation frame, across the hero and back. CDP Performance metrics sampled before/after each run. Test instrumentation kept its own frame requests separate from application scheduler counts.

| Run | Frame intervals | Median | p95 | Maximum | Layout count delta |
| --- | ---: | ---: | ---: | ---: | ---: |
| Slow, 4px steps | 203 | 33.3ms | 33.4ms | 33.5ms | 0 |
| Fast, 65px steps | 13 | 33.334ms | 66.7ms | 66.7ms | 0 |

Layout duration delta was zero for both samples. Application scheduler counts stayed at 218 across a subsequent 400ms idle window. This environment did not demonstrate 60fps; these are headless measurements, not on-device smoothness certification.

## Limits / follow-up

At 390px with `html { font-size: 200% }`, the existing chapter index extends the document to about 447px; later project/about/link content also exceeds viewport bounds. Hero individual bounds and work-action reachability pass. Those downstream layouts were not changed because this task explicitly excludes them. Whole-page enlarged-text overflow acceptance therefore remains unmet.

True 200% browser zoom, direct visual/focus-stroke review, and iPhone/Safari/device performance remain unverified. Root-font enlargement is an automated text-size proxy, not proof of browser zoom behavior. No Access, production, DNS, hostname, or route changes were made.

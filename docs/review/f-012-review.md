# F-012 review

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

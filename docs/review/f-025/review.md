# F-025 supplementary source handoff

Status: implementation complete for independent review, not candidate acceptance or publication.
Base verified: `42ad8ea583bca9f6cd0cd25792002a4c8b20bb11`. Work remains uncommitted.

## Scope and fidelity

Only Interface's original SVG was replaced with the supplied semantic figure. Figure source matches the reference ignoring indentation; the appended scoped CSS is byte-identical to the supplied stylesheet. No product JavaScript, typography, controller, dependencies, inherited tests, publishing configuration or neighboring artwork changed. Agent WebP SHA256 was checked as `794c5db0764cbca63539b059ebae5dbd93784a0a97b67e53e2b71fb102b5bf38`; build reports 628.32 kB.

Added discoverable `tests/interface-study.spec.js` and its browser geometry helper. The helper now records independently projected unexpanded corners alongside real browser rectangles, with a 1.5px comparison tolerance for rounded offset coordinates under perspective. This is a diagnostic addition, not a product safety correction.

## Checks actually run in this resumed source turn

- `git rev-parse HEAD`, `git status --short`, source/configuration inspection.
- `npm run build`: passed (Vite 7.3.7).
- `npm run test:browser -- tests/interface-study.spec.js --workers=2 --retries=0`: **32 passed**, no retries (1.2 minutes).
- Source figure/CSS fidelity assertions: passed.
- `git diff --check`: passed; `git diff --stat` inspected.
- Regenerated capture helper; all 22 recorded local source/build/helper/image hashes verified after capture.
- No local Node server/test process remained at final process check.

The 30 layout cases cover five required viewport sizes, both root sizes, and scripts on/off/entry-script aborted. Two interaction cases cover static transforms through hover/pointer/wheel, live enlargement/restoration, viewport changes, caption reachability by native wheel, idle request-frame counts, keyboard selectors, same-hash entry, focus and history. No inherited tests were modified. The earlier interrupted run's partial multi-file results are historical and are not represented as a passing suite here. The complete inherited suite and independent gates remain downstream.

## Reproduction

Use existing installed dependencies and cached Playwright Chromium; no download or executable override was used. The manifest records Node/platform/cache path and Chromium **156.0.8078.4**.

```sh
npm run build
npm run test:browser -- tests/interface-study.spec.js --workers=2 --retries=0
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
# In another terminal, from the repository root:
node docs/review/f-025/capture.mjs http://127.0.0.1:5173
```

An optional third argument supplies a reference directory for verifying the two pinned historical source hashes, e.g. `/opt/factory-reference`. The helper no longer requires that private mount. It does not copy reference material. Root enlargement is response-injected test CSS, not browser zoom or shipped styling.

## Fresh visual evidence

`manifest.json` records source, build, helper and eight image SHA256 hashes, actual three-plane projected rectangles, calculated paint envelopes, tethers, scene/caption/panel geometry and computed transforms/shadows/animation/transition values. Captures use the development server, not the built output. Build hashes identify the separately built artifacts. Direct native `/#project-interface` screenshots precede any helper scrolling; panel screenshots then capture the complete article, including below-fold content.

All five historical reference PNGs and all eight freshly regenerated screenshots were actually viewed in this turn. Desktop/mobile panel captures reproduce the approved composition, with all three planes, trace, tethers, caption and written key visible. The short no-JS direct shot truthfully shows only the first viewport; the full panel includes the illustration and key below. The 320px/200%-root/no-JS direct shot truthfully includes preceding Agent content and part of the very tall Interface heading. Its full panel contains every word, illustration and key, but exposes severe **inherited Interface title word-breaking**. No typography fix or whole-word waiver is claimed or introduced.

### Paint-envelope method and limits

The world matrix is applied about its actual center, then projected through the scene perspective origin. Each plane's real layout offsets and Z translation determine four unexpanded corners; those agree with browser bounds in all 30 matrix conditions. Expanded corners bound border/corner strokes and shadows in the plane's local coordinates before projection. Trace SVG strokes and endpoint circles are interior to its plane; the 1px expanded border also covers its registration corners. Tether browser bounds include the dashed 1px border.

The frame's 3cqw blur has sigma approximately 1.5cqw. At a distance of one blur radius (two sigma), a straight-edge Gaussian tail from a 12%-alpha shadow contributes about 0.00273 alpha, below one 8-bit alpha step. The helper expands 3cqw on top/sides and 5.4cqw below (2.4cqw offset plus 3cqw blur). This conservatively covers the hard 1.1cqw extrusion too. Information expands 1px around its border and .8cqw + 1px below for its hard shadow. Soft blurs have no finite mathematical boundary: this is an explicit visible-opacity envelope, not proof of zero paint infinitely far away.

All plane/tether boxes remain inside the scene. Soft-shadow envelopes can extend into the existing scene-to-caption gap, never copy/focus halo/panel boundary/caption. Measured frame-envelope clearance above the caption is approximately 4.08px desktop, 6.37px mobile, 18.77px enlarged narrow, and 3.99px short. The eight images show separation from the caption rule; no clipping or artwork/copy collision was observed. DOM math alone is not treated as visual proof.

## Unverified / next gate

No fresh full inherited suite, install, Cloudflare dry-run, canonical matched baseline/candidate captures, independent Tester/Reviewer or visual-critic verdict was run in this source turn. These remain host-owned gates, followed by Adam's exact-candidate decision. No PR, commit, push or deployment occurred. Physical Safari/iPhone/iPad, screen readers, browser zoom and real-device performance remain unverified. Idle frame-count stability is not a smoothness/device-performance claim.

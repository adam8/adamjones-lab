# F-023 supplementary implementation handoff

Candidate only; stop for independent reviews and Adam’s decision. No commit,
push, PR, deployment, Access or DNS changes were made.

## Changes

- `index.html`: native `details#mobile-chapters`, direct summary, five anchors;
  separate desktop branch; removed only the desktop index’s `Chapter /` prefix.
- `src/styles.css`: ≤800px sticky pale-green row, warm-paper in-flow list,
  visible summary focus, generous targets, hidden inactive navigation/slot,
  closed-row fragment clearance including Outside/Elsewhere overrides.
- `src/main.js`: synchronous close before native anchor default, Escape dismissal,
  bounded scheduler invalidation and local header fit observation. No root or
  About ancestor sizing writes, scripted scrolling, or anchor focus repair.
- Tests use `tests/navigation.js` to open the real visible disclosure. Existing
  About, chapter, hero, home and Outside intent is retained.
- `README.md`: behavior/setup notes. No dependency, About typesetter, protected
  chapter-content or Wrangler configuration changes.

## Correctness repair of `a140476` (current uncommitted work)

- Moved the public `#top` target from the sticky header to the nonsticky body.
  Wordmark and footer anchors remain ordinary native links, with no scroll or
  focus repair. Mobile and desktop tests verify actual scrollY=0 and visible hero
  after both links, with JavaScript enabled and disabled.
- Fallback headers now stay in flow in **both** closed and open states. This
  covers disabled/failed startup, ≤640px heights, and enlarged layouts that fail
  a conservative fit budget. There is no mid-page sticky control that disappears
  above the viewport when opened.
- Roomy enhanced headers remain sticky in both states. Fit uses seven closed-row
  heights plus safe-area space against 80% of viewport height, independently of
  disclosure state. Only the stable summary is size-observed; class toggling is
  idempotent and no frame loop or root/About sizing writes were added.
- Added native-top regressions and no-JS/startup-failure/short/enlarged fallback
  regressions. Existing roomy mid-page keyboard/context and idle tests still pass.

Checks actually run for this repair:

- `npm run test:browser -- tests/mobile-chapters.spec.js --workers=2 --retries=0`:
  **12 passed** (31.9s).
- `npm run test:browser -- tests/chapter-index.spec.js tests/hero.spec.js --workers=2 --retries=0`:
  **42 passed** (1.3m).
- `npm run build`: passed (4.39s).
- `git diff --check`: passed; rechecked after documentation.

All five pinned accepted images were read. No new captures, full-suite run,
independent review verdicts, install or dry-run are claimed for this repair.
Earlier screenshots below predate these fixes and are not exact-candidate evidence.

Repair source SHA-256:

```text
76634ac28974bb0dc2cfecb4f05306c821dccc9dfbf47aa9cfefe18b92876678  index.html
66b572e7e8aec9eb3a8516fa8895584b1541b701907ddee6fc9098d00a584539  src/main.js
74014a58d0fa745828c2adfe4f4e7f6a6a465c7bac2fd660caa7c01d82b651f7  src/styles.css
ad7ce37469ba4480d421f52fe0ceb80c10a7c76a3c84b2010975a7cf0757df8c  tests/mobile-chapters.spec.js
```

## Historical initial-candidate checks (not rerun unless listed above)

Pinned Playwright Chromium **156.0.8078.4**, without executable overrides:

- `npm run test:browser -- tests/mobile-chapters.spec.js --workers=2 --retries=0`:
  **4 passed** (19.9s).
- `npm run test:browser -- tests/chapter-index.spec.js tests/hero.spec.js --workers=2 --retries=0`:
  **42 passed** (1.3m), including existing Chromium tab-zoom coverage.
- `npm run test:browser -- tests/home.spec.js tests/about-mobile.spec.js --grep 'live enlargement|native About|keyboard|touch|tap|focus' --workers=2 --retries=0`:
  **12 passed** (30.0s).
- `npm run build`: passed (4.31s).
- `npm run test:browser -- --list`: **371 tests in 12 files** discovered.
- `npm run cloudflare:dry-run`: passed, Wrangler 4.152.0. Packaging only.
- `git diff --check`: passed before documentation changes; rechecked at handoff.

Earlier interrupted subset runs are not counted as completed suites. `npm ci`
and browser installation were not rerun; existing dependencies and the supplied
pinned browser cache were used. This is not a new scaffold; no library upgrade
or registry-version check was needed/performed.

## Historical supplementary captures (initial candidate only)

Built `dist` served through Vite preview on a dedicated local port. Actual
navigation is visible; no injected hiding or scrolling overrides. Root enlargement
is test input, not shipped styling and not browser zoom.

| State | Image in `f-023/` |
| --- | --- |
| 390×844 closed/open top | `390-closed.png`, `390-open.png` |
| Native About arrival | `390-about-arrival.png` |
| Sticky open, keyboard link focus at About | `390-midpage-keyboard.png` |
| 320×800, 200% root, no JS closed/open | `320-enlarged-nojs-closed.png`, `320-enlarged-nojs-open.png` |
| 640×390, no JS closed/open | `640-short-nojs-closed.png`, `640-short-nojs-open.png` |

All five supplied accepted PNGs were viewed. Baseline disclosure states are
**unavailable**: the accepted baseline has no disclosure. The fresh images are
supplementary source captures, not independent trusted-review evidence.

## Remaining validation / review

Full exact-candidate file-sharded suite, full width/height/enlargement/live-change
matrix, navigation/About observer isolation diagnostics, and independent technical
and visual reviews remain downstream. Physical Safari/iPhone/iPad, assistive
technology and real-device performance remain unverified. Screenshots do not
establish motion smoothness. Await Adam’s candidate decision; no automatic polish
or publication is authorized.

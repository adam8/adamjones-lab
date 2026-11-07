# F-024 — selected WebP amendment

Builder complete; candidate review only, not publication approval.

## Bounded change

Started from clean `74b97d3a58ea013ba1a73cf2c5aa61299dd04697` (reviewed SVG candidate). Actually viewed the five pinned raster desktop/mobile/detail and accepted desktop/mobile PNGs. Read the supplied asset-selection, optimization-evidence and browser-differences JSON. The separately supplied latest human amendment controls implementation permission.

- `src/assets/agent-paper-loop.webp`: only the exact selected local asset, 628,320 bytes, 1536×1024. SHA256 `794c5db0764cbca63539b059ebae5dbd93784a0a97b67e53e2b71fb102b5bf38`.
- `index.html`: replace Agent SVG with a native informative img, intrinsic width/height, eager/async loading and concise alt. Existing figure, caption, hooks, title, description, permalink and selectors retained.
- `src/styles.css`: Agent-only block display, automatic height and explicit 3:2 aspect ratio. The latter preserves reserved geometry even on load failure. Figure/caption dimensions and typography unchanged; no crop, filters, retouching or controller changes.
- `tests/agent-paper-loop.spec.js`: retain all 23 inherited cases' useful intent; replace obsolete SVG checks with exact source/served bytes, decoded size/alpha bounds/corners, intrinsic framing and accessibility. Eight additional delayed/failed-image cases cover normal/enlarged desktop, narrow enlarged no-JS and short no-JS, geometry stability, real content and native-wheel caption reachability. Other test files unchanged.
- Historical `docs/review/f-024/` helper/images/manifest remain unchanged. Its report is now explicitly labeled historical.

No application JavaScript, dependencies, locks, libraries, TASTE or Worker changes. Worker remains `adamjones-lab`, top-level `previews: {}`, dist assets, no routes/custom hostname. No publication actions taken.

## Quality/provenance

Supplied historical codec evidence reports identical visible decoded RGBA and all alpha values versus the PNG master, with only invisible RGB discarded. Historical isolated Chromium PNG/WebP captures differed by at most 1/255; this is **not** a new product screenshot comparison or screenshot bit-equality claim. The PNG master and alternate encodings are not shipped.

New local Pillow inspection confirmed RGBA dimensions and nonzero-alpha bounding box `(0,9,1490,1006)` (exclusive right/bottom). Trace alpha reaches the left edge; testing the real full-image framing replaces the obsolete SVG clearance contract. Browser canvas tests independently confirm these extents and transparent corners. Exact build bytes match the selected source hash.

## Checks actually run

- `npm run build` — passed with Vite 7.3.7.
- `npm run test:browser -- tests/agent-paper-loop.spec.js tests/project-flow.spec.js tests/story.spec.js --workers=2 --retries=0` — final run **93 passed**, 1.9 minutes, no retries/skips (31 Agent cases plus 62 inherited flow/story cases).
- `npm run test:browser -- --list` — **412 tests in 13 files** (381 non-Agent inherited + 23 adapted Agent + 8 additions).
- SHA256 of source and emitted `dist/assets/agent-paper-loop-DK9OH_-Z.webp` matched the approved hash; source/build sizes 628,320 bytes.
- `git diff --check` — passed.
- `node docs/review/f-024-webp/capture.mjs` — eight fresh candidate screenshots, four direct/full-panel pairs: desktop 1440×900, mobile 390×844, narrow 320×800 at 200% root/no-JS and short 844×390/no-JS. Cached Playwright Chromium; no download or executable override.

Earlier local runs exposed failure-state geometry expansion from long alt text and the incorrect assumption that every alpha extent had clear margins. Fixed by explicit aspect ratio, concise meaningful alt and tests for actual supplied alpha extents, without modifying the asset or weakening failure-state geometry assertions. Final targeted run passes.

## Fresh supplementary evidence

`capture.mjs` runs against the local Vite server (default http://127.0.0.1:5173); launch with `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`. No package changes required. Manifest records browser version, viewport/root/JS, direct-entry selection/history/focus, native image geometry/source, source/build/helper/image hashes. Root scaling is injected into the HTML response solely in the capture helper/tests, not product code.

Direct screenshots are captured before any helper scrolling. For complete-panel captures, the helper explicitly decodes the image and scrolls it into view to warm Chromium's offscreen raster paint before capturing the real panel. This fixed an observed screenshot-only blank offscreen image at narrow enlarged no-JS. No product or test-only layout override was introduced. Manifest geometry describes initial direct entry, not the later panel capture scroll.

Viewed fresh desktop direct, mobile panel, short no-JS panel and corrected narrow enlarged no-JS panel. Complete copy, art and caption remain legible in the viewed panels; desktop/mobile composition follows the supplied raster study. These are candidate-only supplementary captures, **not** the independent matched canonical before/after gate.

## Pending / not claimed

No fresh npm install, Cloudflare dry-run or complete 412-case suite executed by this builder. Host owns complete file-sharded inventory, independent Tester/Reviewer, trusted matched canonical evidence, independent Greta/Rook reviews and synthesis. All remain pending. Physical Safari/iPhone/iPad, screen readers, actual browser zoom and device performance remain unverified; 200% root text is not browser zoom, and screenshots do not establish motion smoothness.

Stop for Adam's exact-candidate decision after downstream synthesis. No commit, push, PR, merge, deployment, DNS or Access changes.

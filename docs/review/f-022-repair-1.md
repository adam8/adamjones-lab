# F-022 repair 1 — native chapter navigation

Starting HEAD: `5586bd4cad41ae5c5559d4935e591c6934305178`. Initial worktree clean. Viewed all five pinned `/opt/factory-reference/` PNGs.

## Finding and repair

Reproduced fresh `/#elsewhere` → focus About chapter link → Enter at 390×844 in Chromium: settled scrollY 549, About top 4934.3125, despite hash `#about`. The same diagnostic with native immediate scrolling landed at scrollY 5387, About top 96.3125.

Removed global CSS smooth scrolling: focus-induced scrolling could race with native anchor scrolling. No anchor interception, focus relocation, compensation, or new controls. Explicit project-button scrolling is unchanged. Layout, typography, About fit policy, and deployment configuration are unchanged.

Immediate scrolling exposed a persistence edge case: a one-pixel sentinel may jump from below to above the viewport without an intersection-state change. The existing scheduled scroll paint now resolves chapter-index persistence as well; no added event loop or idle scheduling.

Added fresh-entry About keyboard arrival checks at 375/390/414/1440, JS on/off, including visible focus, delayed arrival verification and Back/Forward. Existing mobile reachability now asserts heading arrival before wheel scrolling. Introduction navigation tests no longer override shipped scroll behavior.

## Checks actually run

- Inline Chromium diagnostic: reproduced failure and isolated CSS scroll behavior (earlier diagnostic attempts hit an unrelated pre-existing local server; corrected to this worktree's Vite port).
- First combined browser run: 55 passed, one persistence failure; fixed as described above.
- Final `tests/about-mobile.spec.js tests/chapter-index.spec.js --workers=2 --retries=0`: **56 passed**.
- `tests/chapter-index.spec.js --grep 'Introduction navigation|wide chapter index' --repeat-each=4 --workers=2 --retries=0`: **28 passed**.
- `tests/story.spec.js --grep 'requestAnimationFrame|back and forward|project buttons|narrow uses native|short uses native' --workers=2 --retries=0`: **9 passed**.
- `npm run build`: passed.
- `git diff --check`: passed.

No commits, deployments, dependency/configuration changes or new captures. Full machine inventory and downstream independent reviews remain for orchestration. Physical Safari/iPhone and assistive-technology checks were not performed.

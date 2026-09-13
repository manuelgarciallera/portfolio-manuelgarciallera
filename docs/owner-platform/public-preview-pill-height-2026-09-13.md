# Public preview pill height correction

User request: equal-height preview labels; screenshot shows Mobile / dot / Nodos
on three lines while adjacent labels occupy two.

Source cause: preview buttons permit flex shrinking and normal wrapping; mobile
row centers each independently sized button. Shared button rule now uses
`flex: 0 0 auto`, `white-space: nowrap` and explicit line-height. Existing mobile
horizontal overflow, touch targets, active colors and selection logic stay intact.
No CMS changes and no deployment.

Verification: static CSS contract test fails before the fix (`03f06e`) and root
unit suite passes afterward, 239 tests / 39 files (`d48f3b`). Focused ESLint and
diff check pass (`016325`). This source-level guard is not a browser geometry
test. Rendered mobile/desktop and zoom verification remain pending; no claim of
live-site correction. Browser authorization for local verification remains open.

Reservation sent to Claude: `54b56eb3-e5ed-4d04-b16c-49a4567a04e5`.
Only shared CSS, its regression guard and this receipt are in scope.

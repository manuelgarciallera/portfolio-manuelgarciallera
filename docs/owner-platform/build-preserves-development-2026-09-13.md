# Non-destructive owner build — 13 September 2026

Base `0851531`; reservation `7d1cf989-d454-4d5a-acdc-214fc480f5b3`.

## Defect and correction

The owner build wrapper recursively removed `.next/dev` before calling Next,
including any development lock and cache. This cleanup was introduced in
`7c87fc9`. The installed Next 16.3.4 CLI guide explicitly describes separate
development and production output directories. Earlier direct builds also
succeeded without this removal, as recorded in the 10 September build receipt.

Removed only the wrapper's recursive deletion and unused import. Asset
preparation, build-phase isolation, compiler arguments and propagation of its
exit status are unchanged. The wrapper does not remove or repair dev output.

## Regression method

The test copies the real wrapper into a newly allocated synthetic project with
dev lock/cache markers. Asset preparation and the external compiler are fixture
modules, not the real application. It checks preparation ordering, build args,
build-phase environment, both compiler exit codes (0 and 7), and unchanged dev
files. The synthetic fixture root is the only cleanup target.

RED `2b3219`: both cases failed because the dev lock had been deleted (ENOENT).
GREEN `e17594`: both passed after removing the deletion. The test is included
in the standard `npm test` command alongside the editor-assets test. No package
or dependency version changed. Focused ESLint and whitespace checks passed.

The controlled test verifies wrapper behavior, not a physical browser session
or every side effect of Next and asset preparation. No claim of uninterrupted
live editing is inferred from these markers. The real build verification uses
the existing isolated container, not the user's development session or public
portfolio. No push or deployment is part of this change.

## Final evidence

- Standard owner `npm test`: three Node script tests and 1,303 Vitest tests in
  170 files passed, exit 0, 70.77 seconds for Vitest (`a728da`).
- Actual `node scripts/build.mjs` in the existing isolated container completed
  with exit 0, Next 16.3.4, TypeScript and 23 generated pages (`e4e250`). Its
  checkout is `/work/verification-fac73fa/owner-platform` with prior verified
  runtime overlays and this build script copied in; not a fresh current-HEAD
  checkout. No browser or dev server was launched by this verification.
- Checkpoint remains `0f0adf686b2752e23c25d224f8c60815b10fd451` (`7af630`).

This closes the destructive wrapper finding in `unit-recheck-2026-09-13.md`.
It does not close the CMS production-readiness or browser acceptance gates.

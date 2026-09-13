# Candidate dependency review: passing tests did not prove a valid peer tree

The complete lockfile comparison includes transitive version changes AND hoist
moves. Examples: Payload's AJV 8 is moved below payload while AJV 6 becomes the
root lint dependency; this is not a Payload validator downgrade. Likewise semver,
resolve, json-schema-traverse, fsevents and convert-source-map move between
consumers. Actual update groups include Payload 3.89, Smithy core 3.34.1,
Lexical's react-error-boundary patch, happy-dom 20.14.5, Vite 8.3.0/Rolldown 1.2.8,
TypeScript ESLint 8.70 and Vitest 4.1.11. This inventory is not a line-by-line
upstream security or license audit.

## Concrete finding

`npm ls --all` in Linux and `npm ls yaml --all --json` in Windows both report
ELSPROBLEMS: Vite 8.3.0 resolves yaml 1.10.3 but its optional peer requires
`^2.4.2`. The existing yaml was hoisted for cosmiconfig 7.1.0. Prior successful
install, tests and audit-zero do not prove peer-tree validity. Linux lint did
pass separately; a chained shell exit must not hide the preceding npm ls failure.

## Isolated correction and evidence

Preserved Windows candidate lock as `package-lock.pre-yaml-peer.json`. Added
exact `yaml@2.9.1` as a development dependency only in the isolated candidate,
using npm install with `--strict-peer-deps --ignore-scripts`. Version was checked
against npm registry metadata, not guessed. Install and audit pass.

New dependency placement: Vite uses yaml 2.9.1, cosmiconfig retains nested yaml
1.10.3 (`efa892`). Other package versions remain unchanged in this correction.
Complete npm ls JSON reports status 0 and no problems (`b30a86`); that diagnostic
used only literal command arguments and emitted a Node shell deprecation warning.
Full npm test: three Node script tests and 1,303 units / 170 files pass,
exit 0, 58.05 seconds (`a02556`).

New Windows candidate lock SHA-256:
`8382EFB6B4E0CD2411403CF30765BEA476758EA4C28EA25F7160FE4EDA55BF9A`.
Active owner manifests remain untouched. Linux candidate ead7e79 and its recovery
result still identify the previous lock: do not claim the new peer correction
has Linux integration or physical recovery verification yet. Next: transfer
the single new public tarball and candidate manifests, install offline, check
the complete peer tree and rerun the relevant candidate gates. No deployment.

## Linux correction and physical recovery recheck

Transferred the one new public YAML tarball through the candidate cache, then
installed the corrected lock with `npm ci --offline --strict-peer-deps
--ignore-scripts --no-audit --no-fund`: exit 0, 731 Linux packages (`9255b8`).
Complete npm ls JSON reports status 0 and no problems (`95fcaf`). Normalized the
four copied file modes back to 100644. Exact isolated candidate commit:
`3be89ecdc5b6a7da570a4829ef4d0389b8946496`.

47 recovery helpers pass and full-owner object-backed PostgreSQL physical
recovery passes (`aba73e`, exit 0) with this SHA: 18 backup files, 12 media files,
three revisions, 12 rejected damage cases, page/article history and editing,
login, migration reconciliation, restore plan, source state preservation and
verified shutdown/cleanup. Preserved and verified a complete local Git bundle
`.audit/payload389-candidate-3be89ec.bundle`; not an external production backup.

The clean npm installation removed the old, already-stopped synthetic fixture
PyuCTY from node_modules/.cache. Its raw files are no longer retained; the
observed shutdown timing and diagnosis remain in the committed receipts. No
real data was involved. Earlier wording about that fixture being retained is
historical, not its current state.

Full PostgreSQL integration of this corrected candidate also passes:
92 tests / 12 files, 109.71 seconds (`8742e8`), followed by verified session
closure, cluster shutdown and cleanup, terminal exit 0 (`294ed9`). This is fresh
evidence for the corrected lock, not the previous-lock result. Active integration
and authorized browser verification remain separate outstanding gates.

## Final candidate Linux compile/unit check

On unchanged candidate 3be89ec, Linux `npm run build` passes without the Windows
NODE_OPTIONS workaround: compile, TypeScript and 23-page generation, exit 0
(`efa44c`). Linux npm test: three Node script checks and 1,301 unit tests pass,
two Windows-only inventory tests skipped, 170 files, exit 0 (`c3d4a3`). These two
cases are explicitly `runIf(win32)` at legacy-media-inventory.test.ts:667/677;
the corrected Windows candidate's full 1,303 test run is recorded above.
Tracked candidate diff remains empty and the container is idle after completion.

Do not run `scripts/test-production-http.mjs` to evade the pending browser gate:
its default path calls verifyProductionBrowserLogin even without --browser-editor.
It was inspected, not executed. The current user denial of local browser access
therefore still blocks that visual/login/runtime acceptance workflow. No active
dependency cutover is approved merely by this isolated non-browser evidence.

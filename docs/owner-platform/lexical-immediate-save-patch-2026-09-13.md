# Immediate rich-text save: local patch contract

Status: browser regression, clean installation, units, types and lint passed
locally. No deployment or general production-readiness claim. Uses Payload3.89.0.

## Defect and scope

Native Lexical updated its visible document immediately but deferred Payload's
field value until browser idle. Saving in that interval persisted an older
format: bold only instead of bold/italic. Real browser REDf79565 and original
handler characterization RED00d74e/5017ad establish the mismatch.

The owner-only patch makes the native callback update its own prevValueRef and
form value together immediately. It changes neither fields, permissions,
read-only guards, focus/history filters, schemas nor UI. It removes the deferred
write instead of adding a second writer. A second-listener candidate was
discarded after independent review identified a possible history remount.

## Distribution and lifecycle

`owner-platform/scripts/lexical-field-patch.mjs` validates version and complete
SHA256 for BOTH unbundled `dist/field/Field.js` and precompiled browser
`dist/exports/client/Field-J6MIUIWP.js` before writing either. Unknown inputs stop
the operation; already-patched inputs are accepted. Postinstall, npm test,
build/dev and the production-browser harness invoke the same preparer.

Neither a lockfile nor npm audit describes the patched bytes alone. Preserve
this script with the lockfile in every code backup and clean-install workflow.
Do not copy patched node_modules as the only recoverable source. Original
non-runtime fixtures, asserted hashes and the MIT license are in
`owner-platform/tests/fixtures/lexical-3.89/`.

On an interrupted write, restore dependencies from the lockfile with npm ci;
do not bypass the hash guard. Validation is before all writes, but writing two
files is not a filesystem-wide atomic transaction. Do not run installation and
build concurrently in the same checkout. Existing upstream source maps remain
unmodified and may show the pre-patch scheduling code during debugging.

## Evidence and remaining work

- Script tests6/6 (8fd50e): original and bundled handlers, native bookkeeping,
  no deferred replay, installer/repeat/drift, build preserves development output.
- Chromium390/1280, controlled idle timeout, full editing/media/recovery flow
  and restart pass b3aacd. This is emulation, not a physical-phone test.
- Replacement review: no Critical/Important findings; fixture issue corrected.
- Full native-patch npm test passes1313/171 (920f8a), plus8 script checks77e838.
  Both installed host hashes match the patched distributions c31525.
- Clean npm ci --strict-peer-deps passes ee76a4:729 packages, postinstall runs,
  audit reports zero vulnerabilities. Both patched hashes independently match
  448d1b. This audit count is not a security guarantee. Types/lint pass aa5875.
  Large-document responsiveness remains unmeasured.
- Separate intermittent Windows native SQLite crash is NOT fixed by this patch.

## Additional native history check (2026-09-13)

The browser test now edits an existing saved page, saves the appended text,
uses native Undo, saves again and reloads. It asserts the preceding text and
bold/italic formatting survive. Run92331 completed with exit0 (a13b08) at
390/1280, including the existing media, draft privacy and process-restart
checks. This history step uses normal idle scheduling; the controlled-idle
immediate-creation check remains separate. No runtime changes were needed.
This is additional behavior coverage, not a newly reproduced Undo defect or
proof of large-document performance. The Linux harness still uses a documented
source overlay, not a clean checkout of the eventual test commit.

## Upgrade and removal

For a Payload update, expect the version/hash guard to fail. Inspect the new
source AND browser export. Run the immediate-save browser regression against
the unpatched new version. Remove the patch and lifecycle hooks only when that
version preserves latest content and native history without the workaround.
Never merely replace expected hashes to make installation green.

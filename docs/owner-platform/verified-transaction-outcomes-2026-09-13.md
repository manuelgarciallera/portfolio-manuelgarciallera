# Verified transaction outcomes — local regression verified

Base52642c1, owner only. Reservation3c942045 and proposal5e6a14fa sent through
the Hub; independent acceptance is not inferred. No deployment/schema/public edit.

## Reproduced failure

The installed Drizzle adapter catches the transaction's final rejection while
attempting to notify its already-resolved opening promise. Its commit helper
also absorbs completion errors. Our service therefore cannot infer commit
success merely because Payload's commit utility resolved.

The new PostgreSQL integration case installs a deferred constraint trigger only
in its disposable database. Inserts and application hooks finish, but COMMIT is
rejected by PostgreSQL. RED4a9e33 confirms no release or audit was persisted,
yet createOwnerRelease returned an apparent successful record (id5). This is
not an assertion about production data loss or the separate Windows native crash.

## Change

`src/database/verified-transactions.ts` wraps only our trusted adapter factories.
It preserves Payload's transaction ID/session structure, waits for initialization
and transaction opening, and retains the original database completion promise.
Opening errors reject the opening wait. Commit errors reach callers. Intentional
rollback is distinguished by a private sentinel from a database rollback failure.
Sessions are removed before finalization, preserving the existing no-double-end
contract. PostgreSQL's explicitly disabled transaction option stays disabled.

Both owner SQLite and recovery PostgreSQL factories use this wrapper. The
editorial integration fixture now uses that actual PostgreSQL factory rather
than the bare upstream adapter. No node_modules patch, retry, provider, database
schema migration or authorization relaxation is involved. Unknown commit outcomes
remain errors, never a claim that a rollback definitely happened.

## Evidence so far

- Five deterministic boundary tests cover commit success/failure, opening failure,
  rollback success/failure. Missing-module RED5c5df1;5/5 pass29d10b.
- The actual PostgreSQL editorial suite including deferred-COMMIT rejection
  passes38/38 (74afce),17.68s; runner verifies session/cluster cleanup.
- Full owner units1310/171 pass (d3b109),75.65s, plus3 script tests (3b8dba).
- Typecheck passes756c65. Initial focused lint had two unused fixture arguments;
  they were corrected explicitly, not disabled. Full lint/integrations pending.

Full integration subsequently passes93/93 PostgreSQL cases (4ace63),162.61s;
runner cleanup/session closure passes173885. Windows SQLite passes69 with24
PostgreSQL-only cases skipped (8ccb69),162.40s. This does not prove the separate
intermittent native crash has been fixed.

Independent read-only review by review_verified_transactions found no Critical
or Important issues. Suggested additional initialization/options/concurrent-session
coverage is recorded as a minor follow-up, not an independent test execution.

The full lint gate exposed a separate build-order defect (2fbbab): after preparing
local Monaco assets, ESLint scanned its copied/minified vendor distribution.
Added a functional ESLint regression (RED3914e4, GREEN6211a4) proving that ONLY
the copied `public/vendor/monaco` subtree is ignored and malformed authored
source/public/scripts still produce parser errors. No rule was disabled globally.
Full `npm run lint` then passes (b58efb). Existing loader/worker/license byte
verification remains in place.

Current Windows build passes23/23 pages (d008a2), using the documented process-only
NODE_USE_SYSTEM_CA invocation; no TLS verification or machine setting changed.
Full native PostgreSQL recovery with object media passes (84822e),47 helpers,
18 backup files/12 media/3 revisions,12 damaged inputs rejected before allocation;
login/history/frozen-preview/restored page and article editing verified. Cleanup
confirmed. Container Git still identifies the earlier base0b0c308; source overlays,
not that SHA alone, identify this tested implementation. Public protections pass
22/22 and21 entries (61dd12). No root runtime/public source changed.

These gates verify this local correction, not production readiness of the CMS.
Native Windows intermittency, dependency cutover, real infrastructure and operator
recovery are separate open gates; this fix does not close those by implication.

## Subsequent browser and lifecycle verification

Three additional lifecycle tests cover delayed initialization, rejected
initialization and independent concurrently open sessions. The focused suite
passes8/8, with ESLint and browser-test syntax checks passing (6274b7).
These extend coverage of the existing implementation, not a new runtime fix.

The native browser run43679 failed at1280px after saving and reloading rich text:
the rendered strong element had normal, not italic, font style (648c1e).
Its390px workflow had passed. Added diagnostic output of rendered HTML and
the saved richText JSON; no delay, retry or weaker assertion was introduced.
The diagnostic run8479 completed successfully (a77782, exit0), including390/1280
native page/article editing, media, restoration, review without publication,
anonymous denials and preservation across application restart. Owned app and
database processes closed and the isolated root was cleaned.

The later pass does NOT close the earlier intermittent formatting failure.
Installed Lexical Field defers setValue through useRunDeprioritized; installed
Payload Form captures field values during submission. A pending update racing
with save is a hypothesis requiring controlled reproduction, not an established
cause. Next action: distinguish saved-state loss from rendering/hydration timing
using those diagnostics. Do not conceal it with arbitrary sleeps.

This execution used the candidate dependency worktree and Linux source overlays,
not a clean checkout of83c899c. Dependency cutover remains pending. Hub result
df554fc1 records both runs and replaces the earlier in-progress report.

### Controlled reproduction of stale rich-text submission

Opt-in `OWNER_DIAGNOSE_IDLE_SAVE=1` exercises the500ms timeout path of idle
callbacks only in the synthetic desktop browser page, just before italic is
applied. It does not patch installed dependencies or runtime source. Run40200
fails reproducibly at the post-save/reload assertion (f79565, exit1): before
save, bold/italic are visible; the API response contains text `format:1` (bold
only), and the reloaded DOM has only `LexicalEditorTheme__textBold`.
This establishes saved-state loss under the deferred-update condition, not just
an italic CSS loading issue. The390px flow passes; owned app/cluster close and
the isolated root is cleaned. Syntax and focused lint pass (c063bf).

Next implementation must synchronize pending editor state with form submission
without arbitrary waits, weakening assertions, changing visuals or disabling
editing. The diagnostic is a failing reproduction, NOT a fixed regression.

### Candidate implementation, not accepted yet

An owner-only ImmediateFieldSync feature was added through Payload's public
feature API, retaining native OnChange selection/history guards and read-only
checks. First browser attempt27506 still failed (4e5973): the checked-in import
map lacked its client registration. Added that mapping; attempt84181 is running
with the same controlled idle condition. Do not infer success from compilation.
Type/lint101447 and configuration19/19 (965a2f) passed; focused lint including
the map passes e2d574. Full unit run32394 is also in progress.

Independent review raised an important candidate risk: the immediate writer
does not update the native Field's private prevValueRef. A save before idle may
therefore remount the editor and lose selection/undo history. Native Safari
fallback scheduling also merits checking for older writes. These are open
review findings, not resolved by the existing content-only save assertion.
Do not commit this candidate as a completed fix until investigated.

The second-listener candidate completed the controlled390/1280 browser run
(966979; final cleanup705853 exit0), and1313/171 units passed a5dbeb. Nevertheless
the review's native bookkeeping/undo risk remains valid. Removed only the two
new candidate files and their config/import-map registrations, returning runtime
to the prior implementation. No unrelated edits or user files were reverted.

A version/hash-scoped native-field transformation is now characterized: execute
the installed handler with a deferred scheduler, then inspect the immediately
submitted value AND native prevValueRef. RED00d74e shows undefined immediate
value; GREEN82fd7f confirms both advance together with no queued stale writer.
This is a pure transformation only: no installed dependency has been patched yet.
Next: idempotence/drift protections, build/install integration, then the same
browser regression without the discarded client feature. Proposal cd375556.

The native patch now accepts exactly original SHA256
085b5a2cb46cd3f9a525560e54c018b5c03cfa941945f857d51e27825d4b851d
or patched7a98335fc974881f12f99e73ea03a593fe5085c9b14cbd601a59e55c7c0e180e,
only for3.89.0. Idempotence/drift RED7b455e then GREEN889bc6. Build/dev and
synthetic production runner call the preparer before compilation; install/test
entrypoint integration and broader review remain pending. No postinstall hook
yet. Four script tests including actual build wrapper pass d874ee.

Linux browser run93520 started with this patch and original config/import map
(no additional listener), OWNER_DIAGNOSE_IDLE_SAVE=1. It is still in progress.
Installed Linux Field.js is deliberately patched by the preparer; source license
is retained. Host dependency is still original. Do not identify a patched
node_modules tree solely by its lockfile; include this transformation in recovery
and clean-install verification. Not committed as a completed fix yet.

Run93520 failed after save/reload1280 (0ff5ce), despite source Field.js having
the patched hash. Package export inspection2755a2 and source maps c44727 show
that the browser loads precompiled `dist/exports/client/Field-J6MIUIWP.js`,
not the unbundled Field.js. That artifact still had its deferred callback.
This is an integration omission, not evidence that immediate native sync fails.
Added an executable characterization of that distributed handler: RED5017ad
immediate value undefined, GREENaae93a after transforming that exact artifact.
Original browser artifact SHA24f1a5c28b76ed50343c3a5e83ae7a597099944ec3e584bcde6694de25e3bd5d.
Pending: installer must process BOTH artifacts, validate both before writes,
recognize the patched browser hash, then repeat browser. It still only writes
the unbundled file at this point; do not claim browser integration complete.

CLI installer test RED566de4/GREEN0ea6ae verifies real isolated file write,
repeat invocation and rejection without overwriting a changed file. Postinstall
and test commands are wired in candidate package.json; lockfile install-script
metadata and clean-install verification remain pending. No host patch applied.

Both distributions are now validated before either is written. Bundled patched
SHA56af80bad8f158c3502510d8d3c2dd30dfe172be0fc2fefc47f506a55a096f7a
is recognized for repeat runs. Installer RED9c1593 proves earlier implementation
would write the source even with an invalid browser artifact; GREENa2d423 proves
it refuses without changing the source. Six script tests pass, focused lint and
diff check675c13 pass. Lock root hasInstallScript metadata now matches postinstall.

New controlled browser run31924 is live with both artifacts;390 page creation
and unsaved navigation passed99b80b. Independent reviewer has been asked to
review the replacement, not the discarded client feature. Clean-install and
remaining runtime gates are still required before dependency cutover/commit.

Controlled native browser run31924 completed (b3aacd exit0):390/1280 flows,
immediate formatting save/reload, page/article/media operations, historical
restoration and preservation after restart pass. Owned processes and isolated
root cleaned. This uses the native two-file patch, not the discarded listener.
Independent review reports no Critical/Important findings in the replacement.
Its minor fixture issue is addressed: original installed artifacts copied with
license into non-runtime fixtures and original hashes asserted;6 tests pass
8fd50e even if node_modules is subsequently patched. This ensures original to
patched behavior remains exercised after postinstall.

Fresh npm ci --strict-peer-deps is running in the new isolated
`.audit/owner-lexical-clean-install-20260913` with candidate manifest, lock and
patch script only (session82666). No application data or secrets copied. Full
host npm test is also being repeated with the native patch, not listener.

Final local follow-up: clean lifecycle-enabled npm ci passes ee76a4,729 packages;
both resulting hashes match448d1b. Full units1313/171 plus8 script checks pass
920f8a/77e838; types/lintaa5875. Preparing recoverable integration commit with
candidate dependencies and patch together, not a stable-release certification.
Separate native Windows intermittency and remaining CMS requirements stay open.

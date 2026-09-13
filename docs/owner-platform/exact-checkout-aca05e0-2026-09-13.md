# Exact checkout aca05e0 — browser, integration and recovery verified

Goal: verify the recoverable owner media correction independently of the previous source overlay. No public source edit or deployment.

- Full bundle `.audit/owner-exact-aca05e0.bundle` verified with complete history, HEAD aca05e05a49f7fb062c33b6b1927b20a987d7bc6 (d52200). This is a local code backup, not external database/media backup.
- Cloned detached in existing synthetic container owner-editor-6dc5c51-0911 at `/tmp/owner-exact-aca05e0-ZMLOjt`; no source overlays.
- Lockfile comparison differs only by root hasInstallScript:true (ade6ef); dependency resolutions unchanged. Reused Linux node_modules, not a clean installation. Copy reported permission denial only for the old retained synthetic cache owner-postgres-recovery-lxmVJD; permissions and contents were not changed or disclosed. The runner executes its own lexical patch preparer before building.
- npm ls --depth=0 --omit=optional succeeds with expected direct versions; tracked Git status clean (8a70a7).
- Run **76259** is active: `node scripts/test-production-http.mjs --browser-editor`, pwuser, OWNER_POSTGRES_BIN=/usr/lib/postgresql/16/bin. Build has completed and mobile login passed b5e946. PID33019, owned Next/Postgres processes observed live 10ea3c.
- Do not restart on observation timeout. Poll the same handle until terminal; then inspect cleanup and clean tracked Git before any success claim.
- Pending: full 390/1280 editor, restart and history/privacy result; exact-checkout integration and recovery gates. Earlier intermittent restore-dialog timeout remains open even if this run passes.

Previous goal turn: progress (aca05e0 committed with verified browser and unit results). Current turn: exact-source verification preparation plus observed live execution. Overall goal incomplete.

## Browser terminal result

Run 76259 completed exit 0, dcc88a: owned app and cluster closed and synthetic root cleaned. Full editor passed 390/1280 with original media preserved, soft-delete/draft restoration, immutable releases, review/preflight, historical restoration and native article/project editing. Anonymous history/detail privacy and process-restart preservation passed e0ae31. No publication was performed. Intermittent prior trash timeout remains a separate open issue, not claimed fixed.

Integration run 97691 started in the same exact checkout with PostgreSQL16 tools; result pending. Next Codex must poll this handle before launching physical recovery.

## Integration and recovery terminal results

- Integration 97691: 93 tests / 12 files passed, 127.75s (4f61e3). Exit 0, no database sessions left, exact cluster stopped and synthetic root removed (451173). Negative authentication and validation logs are expected test cases. PostgreSQL16.15 runner; some fixtures explicitly use SQLite, not 93 PostgreSQL-only assertions.
- Recovery 13648: 47 helper tests pass (6b0db5), native pg_dump/pg_restore complete with applicationCommit exactly aca05e05a49f7fb062c33b6b1927b20a987d7bc6. Full-owner-object-media recovery passes exit0 (459561): 18 backup files, 12 media files, 3 revisions, 12 corrupt/missing cases rejected before allocation. Login, history, frozen preview and independent page/article editing survive recovery. Original logical state and backup receipts unchanged; exact cluster and run root cleaned.
- No external backup or real provider delivery claimed. The bundle remains a local code backup; recovery is a synthetic drill with isolated storage.
- Remaining work: intermittent trash-dialog readiness and native Windows process issues; operational account recovery without usable mail; staging/provider verification and controlled public bridge require their separate gates. These successful tests do not make the CMS production-ready.

# PostgreSQL initial installation rehearsal

Date: 2026-09-10. Author: Codex. Base: `5d026e4197e94b34eb66dae4a17f8c59c72b12b5`. Scope: local candidate, not deployment.

## Delivered

- One-time offline generator using the installed Payload 3.88 adapter and the active owner configuration, with database connection and telemetry disabled. It refuses a non-empty output directory; this refusal was exercised.
- Native initial migration, JSON schema snapshot and index in `owner-platform/database/baseline`, outside automatic runtime discovery. Unused TypeScript parameters were removed and generated whitespace normalized; SQL statements remain native. The final staged diff caught whitespace missed by the earlier unstaged check; normalization was checked to preserve every non-whitespace character.
- PostgreSQL-only integration test: fresh isolated database, `push:false`, native migration transaction/ledger, actual table and column names compared with snapshot, and native snapshot-to-active-schema comparison requiring no missing migration.
- Owner, image, draft page, edit and version records survive a second migration invocation unchanged. Original uploaded PNG bytes remain identical.
- Earlier unregistered historical-media delta candidate now uses the same FK/index names as the native generator. This is not a rewrite of a migration applied to real data, nor a second migration to execute after this baseline.

## Evidence

- Missing baseline RED: `b3cf72`, `public.pages` absent. An earlier timeout was a test cleanup issue, not the intended RED; cleanup now follows the existing isolated controller.
- Native offline generation: `2bdfca`, exit 0, no adapter database pool before or after. Repeat invocation: `f0a271`, expected refusal without replacing history.
- Initial installed-schema test exposed inconsistent test read depths; aligned both reads to depth 0. First GREEN: `d8737c`, 1/1.
- Final paired baseline/delta tests: `d2dcf5`, 2/2, 24.89 seconds, PostgreSQL 17.11. Active schema comparison produced no migration statements. Test process and database sessions closed; synthetic cluster stopped and only its run directory removed.
- Typecheck and lint: `1684e8`, exit 0. Public dependency boundary: `07a66f`, 21 entries; `git diff --check` clean.
- Full integration run: `2992d6`, 58/58 in 10 files, 120.55 seconds under the PostgreSQL 17.11 controller (auth-unlock explicitly uses SQLite). Terminal `46e307`, exit 0, verified closed sessions/process and isolated cluster cleanup. Expected authentication/failure-injection logs are exercised assertions, not failing tests.
- Independent review: Rawls reported no blocking findings, with the coverage limits below. No new application build/browser verification claimed: runtime application code is unchanged.

## Limits and next gates

This baseline describes the currently active local-file Media collection, not a production object-storage binding. It is not registered for startup/deployment. Never apply it over an existing database or blindly mark it as executed. Inventory and reconcile a restored clone first.

The test compares actual database table/column names and separately compares native schema snapshots. It is not an exhaustive comparison of all live constraints, indexes and column types. The generated destructive `down` was not run and is not a backup recovery procedure.

Next owner: Codex. Close persistent-media runtime, compatible database/media backup and restore, authorized staging acceptance and deployment gates. Claude receives evidence through the Hub for review, not a claim of production readiness. No provider credentials, production data, spending, push or deployment used here.

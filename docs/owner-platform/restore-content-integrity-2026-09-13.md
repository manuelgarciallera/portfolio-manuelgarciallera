# Restored editorial content integrity — 13 September 2026

Base `fb4698d`. Codex sole writer; Hub reservation `98afd211-9045-45fd-ae6a-9643fc00acff`. No public code, credentials, schema, dependency or deployment changes.

## Reproduced defect

`executeOwnerRestorePlan` checked the historical media binding and media references, but not the resulting editorial state. A fixture-only hook changed the title during the actual database write; the real executor still returned an executed plan. SQLite RED session29849 exited1 (`011dfd`), 35 passed / one failed / three PostgreSQL-only skipped. The failure was an unexpected successful restoration, not an invalid fixture.

## Correction

Compare the resulting draft capsule's canonical editorial state to the target before recording success or committing. Preserve the target provenance only for comparison, since restoration necessarily changes the saved timestamp. Ignore only top-level layout row `id` values: Payload regenerates IDs for removed block rows. Keep nested IDs, relationships, text, order, branding, SEO and other state in the comparison. A mismatch raises409 and rolls back result snapshots and draft changes.

The first strict candidate rejected two otherwise valid restores. Temporary fixture diagnostics showed identical editorial fields but regenerated block IDs; those diagnostics were removed. Windows run20045 also reported an unexpected native worker exit; do not call that environment stable. PostgreSQL reproduced the two strict-comparison failures without the native Windows crash (`d49f3e`).

## Verification

- PostgreSQL16.15 isolated integration: session59391,39/39 passed (`9dab48`), terminal0 and exact synthetic-cluster cleanup (`02c4a8`). Fault injection proves draft, published document, version contents, snapshot/audit counts and confirmed plan remain unchanged; the same plan succeeds after removing the injected fault.
- TypeScript and focused ESLint exit0 (`b7c9a9`). Diffcheck passed; protected checkpoint still `0f0adf686b2752e23c25d224f8c60815b10fd451` (`5020db`).
- Unit fixture snapshots now contain actual editorial state rather than source-only partial doubles.
- Full owner `npm test`: eight script checks plus1331 tests /171 files passed, session12178 terminal0 (`d5462d`). Two fixture email-adapter warnings; no real delivery. Public dependency boundary reports21 entries passed (`15cfca`).
- Eight owner-isolation negative/positive tests passed, session81577 terminal0 (`6da254`); fake-checkpoint fatal text is an intentional rejected negative case.

The PostgreSQL run used the existing Linux QA checkout with the two changed files overlaid, not a fresh checkout of a new commit. No new browser/build/physical disaster-recovery claim. Next Codex: full regression, additional state-mutation coverage, exact-checkout verification and remaining operational gates. The Windows build failure remains separate and open.

## Additional state coverage

Ten cases exercise the real executor against controlled persistence responses: changed title, slug, lost block, changed block text, image relation, nested content ID, brand relation, brand color and SEO directive must reject409 before preview/success/commit. A regenerated top-level block row ID alone must still succeed. Focused suite21/21 passed (`d6f373`). These are unit boundary tests, not ten new database/browser scenarios; the real PostgreSQL rollback test above remains the persistence evidence.

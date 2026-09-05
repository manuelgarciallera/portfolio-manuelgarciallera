# Real database restore verification

## Scope and corrected failures

This round exercises the existing owner services against Payload and a real,
temporary SQLite database. It does not deploy the portfolio, connect a public
content bridge, migrate PostgreSQL, or certify production readiness.

The restoration path had not worked under the actual collection lifecycle:

1. Field traversal inserts absent optional fields as `undefined`, and merges
   stored fields into partial updates. The restore hook expected only a command
   payload and rejected valid creation/confirmation. It now separates metadata,
   validates the transition's changed fields, and returns the complete update
   for Payload's required-field validation. Supplied forbidden values, including
   null replacements, remain rejected. Direct API writes remain denied.
2. Preview manifests serialize document IDs as strings. SQL relationships need
   the actual database ID type. Plan preparation now resolves the target page
   through an owner-authorized read and uses that returned ID, checking identity.
3. Confirming an unchanged page requested the same immutable preview hash twice,
   violating its unique constraint. Capture now recomputes the current manifest
   and reuses the matching existing capture. It still reloads page, brand and
   media; this is not a timestamp-only cache. Concurrent first-time captures
   are not claimed to coalesce: the unique constraint remains the final guard.
4. SQLite's adapter disables transactions by default. Execution correctly failed
   closed rather than writing without rollback. The local adapter now enables
   `transactionOptions: {}` as specified in the
   [Payload transaction documentation](https://payloadcms.com/docs/database/transactions).
   Production still requires PostgreSQL, whose adapter is unchanged.

## Observed regressions and evidence

The real restore test first failed at plan creation, then exposed relationship
validation, duplicate-capture and confirmation-lifecycle failures as those
boundaries became reachable. It subsequently exposed the disabled transaction
configuration. All were reproduced before the corresponding corrections.

The suite now exercises these outcomes without replacing persistence or the
transaction implementation:

- Register a synthetic release from matching visual and restorable snapshots.
- Prepare, recapture, confirm and execute a restore; the unchanged recapture
  returns the existing snapshot identity.
- Restore the release's title and hero block as a draft; preserve the separately
  published title and hero, and retain its version history.
- Reject a second execution and direct owner mutation of a restore plan.
- Reject execution after a newer draft edit, retaining that edit and leaving
  result references unset.
- Inject a failure only at the final `restore.executed` audit write. The real
  transaction rolls back the page, result snapshots, their audit records and
  the plan transition. The pre-existing draft, page version IDs and confirmed
  plan remain intact.

## Isolated test database lifecycle

Run `npm run test:integration` in `owner-platform`. Optional Vitest filters can
be passed after `--`. The runner creates a uniquely named OS temporary folder,
passes it to the test process, and removes only that validated folder after the
process exits. It never uses the owner's configured database or credentials.

The shared local adapter is used by both application configuration and the
integration fixture. A file-backed database is necessary because libSQL
transactions use separate connections; an in-memory database loses the shared
schema across them. Native transaction handles can remain open until worker
exit on Windows, so cleanup runs in the parent process, not in `afterAll`.
Uploads still disable local storage. QA owners and release metrics are synthetic.

This is service/database integration evidence, not a new claim that the entire
restore interaction has been verified in a browser or on production PostgreSQL.
Existing public and security release gates continue to apply.

## Final checks for this round

- `npm run check`: 612 unit tests across 138 files, nine real SQLite integration
  tests, lint, TypeScript and the owner production build passed.
- Public guards: 11 tests and all 20 public import entry points passed.
- Fresh `release-proof` build and owner-isolation verification passed from
  `d69183454cf4b63040f9c8933c9a506730369573` with these owner-only changes.
  Public inputs retain hash
  `d1a37d1c6371728546ff096740c3837802c528deefdd901b130453a14dc44348`;
  nine routes have no bundle regression under the unchanged fixed budget.
- No dependency was added, no public file changed and no deployment occurred.
- Independent read-only review found no Critical or Important regression. Its
  nonblocking suggestion to compare version history on rollback was incorporated.

Two early failing Windows cleanup attempts left synthetic QA folders
`owner-editorial-qa-KDXoo8` and `owner-editorial-qa-eMLxqf` in the OS temporary
directory. A manual removal was policy-blocked and was not retried through a
different mechanism. Subsequent runs use the parent cleanup runner successfully.

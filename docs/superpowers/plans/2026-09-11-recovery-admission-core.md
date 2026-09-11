# Recovery admission core implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove shared, bounded PostgreSQL admission without changing live recovery.

**Architecture:** A standalone store uses an independent transaction, database
time, one non-waiting advisory lock and HMAC recipient keys. Installation is
explicit; this milestone never wires the store into the REST handler.

**Tech Stack:** TypeScript, installed Payload PostgreSQL adapter types, Node crypto,
Vitest, existing isolated PostgreSQL 16 runner.

**Spec:** `docs/owner-platform/recovery-admission-design-2026-09-11.md`.

## Global constraints

- No new dependency, provider, public JavaScript, real data or deployment.
- 30 attempts per fixed 60-second global window; three per recipient per fixed
  900-second window, with a 60-second recipient cooldown.
- Expired recipient rows are removed after 3,600 seconds on an admitted global attempt.
- The request path never creates tables or substitutes an in-memory store.
- Do not wire this candidate to the REST handler in this milestone.

## Task 1: Independently testable admission store

Files:
- Create `owner-platform/src/auth/recovery-admission.ts`: validated schema/table
  DDL and store implementation. No import from the existing recovery handler.
- Create `owner-platform/src/auth/recovery-admission.test.ts`: defensive unit tests.
- Create `owner-platform/tests/recovery-admission.integration.test.ts`: real
  PostgreSQL fixture, independently acquired clients and persisted counter tests.

Interface:
```ts
createRecoveryAdmissionStore(options: {
  pool: PostgresAdapter['pool']; secret: string; schemaName: string
}): { admit(email: string): Promise<boolean> }
recoveryAdmissionDDL(schemaName: string): string
```

- [x] Write failing tests. Concurrent same-recipient calls must admit exactly one;
  recreated stores must observe existing cooldown; 30 different recipients can
  consume the global window, but a 31st must not allocate another recipient key.
  Use these concrete assertions:
  ```ts
  expect((await Promise.all(Array.from({ length: 20 }, () => store.admit(email)))).filter(Boolean)).toHaveLength(1)
  expect(await createRecoveryAdmissionStore(options).admit(email)).toBe(false)
  expect((await pool.query(`SELECT count(*)::int AS count FROM ${table}`)).rows[0].count).toBe(31)
  ```
- [x] Run the new integration file with `node scripts/test-integration-postgres.mjs
  tests/recovery-admission.integration.test.ts` in the existing isolated container.
  Expect failure for the missing implementation, not an unavailable dependency.
- [x] Implement the interface. Validate schema identifiers before interpolating
  them; parameterize all email-derived keys. Begin transaction, set local SQL and
  lock timeouts, try the advisory lock, read the database time, update the global
  window, then the recipient window/cooldown, delete expired recipients and commit.
  Roll back and release on any exception; never convert exceptions into `true`.
  ```ts
  const key = 'r:' + createHmac('sha256', secret)
    .update('owner-recovery-admission-v1\0').update(email.trim().toLowerCase()).digest('hex')
  ```
- [x] Run new unit tests, integration tests and the existing native recovery
  integration file. Test window expiration by aging only synthetic persisted
  timestamps, not by sleeping or replacing the database clock. Test a separate
  pool observing the same state, missing table failure, and connection release.
- [x] Run owner typecheck, lint and `git diff --check`. Obtain read-only review
  of the implementation and tests; address material findings and rerun checks.
- [x] Record actual commands/results and the not-activated limitation in the
  design document and Hub. Commit only the five new files using explicit paths:
  ```powershell
  git add -- owner-platform/src/auth/recovery-admission.ts owner-platform/src/auth/recovery-admission.test.ts owner-platform/tests/recovery-admission.integration.test.ts docs/owner-platform/recovery-admission-design-2026-09-11.md docs/superpowers/plans/2026-09-11-recovery-admission-core.md
  git commit -m "feat(cms): prove shared recovery admission in PostgreSQL"
  ```

Self-review: scope intentionally excludes migration/runtime activation, which has
its own gate in the spec. No UI/public changes or other agents' dirty files belong
in this commit.

Execution: inline with a single repository writer, and a read-only independent
review. Test receipts and exact remaining activation boundary are in the spec.
Core committed as `14a1eb6`. The next schema gate is recorded separately in
`docs/owner-platform/recovery-schema-verification-2026-09-11.md`; it does not
silently mark HTTP activation complete.

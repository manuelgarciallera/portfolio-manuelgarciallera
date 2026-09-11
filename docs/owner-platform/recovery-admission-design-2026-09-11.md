# Shared recovery admission: isolated first milestone

Historical milestone: the candidate described below was connected to the REST
endpoint in `8bd695e`. See [HTTP verification](recovery-http-verification-2026-09-11.md)
for current local behavior and remaining deployment gates. The original evidence
below is retained; it is not a claim that integration is still pending.

Original status: candidate, not connected to the password-recovery endpoint. Proposal sent
to Claude as `1b6f1cbf-3733-4c12-8031-4cb9cb7fad85`; no acceptance assumed.

## Scope and decisions

Build and test an independent PostgreSQL admission mechanism before changing the
working recovery flow. Reuse the installed PostgreSQL driver through the Payload
adapter. No new dependency, provider, public JavaScript, real data or deployment.

Use one short, independent transaction per admission. A transaction-scoped,
non-waiting advisory lock serializes decisions in the same schema across pools.
Contention denies admission, rather than queueing mail work. Do not hold this
lock while calling an email provider. Commit the budget before issuing a token;
a later provider failure must not refund unlimited submissions.

Initial server policy: 30 attempts per fixed 60-second global window; three per
recipient per fixed 900-second window, with a 60-second recipient cooldown.
The global budget counts recipient-denied attempts too. A global rejection must
not allocate a recipient row. Database time is authoritative. Expired recipient
rows are removed after 3,600 seconds on an admitted global attempt. Fixed-window
boundaries allow bursts; these are mail-volume safeguards, not an edge DDoS
defence or a guarantee that legitimate requests remain available under attack.

Store only the global key and a domain-separated HMAC of a normalized email with
the server secret, plus counters/times. Never persist raw addresses, reset tokens
or caller-controlled IP headers. This is pseudonymization, not anonymization.
Rotating the secret changes recipient buckets; the global budget still applies.

Use an explicitly installed table in the application's PostgreSQL schema. The
request path never creates tables or silently substitutes an in-memory store.
Missing tables, invalid database results and connection/transaction failures are
errors, never admission. Sessions are always released, including failures.

## Acceptance for this milestone

Real PostgreSQL tests: concurrent requests, independent pools, recreated store,
recipient limits/cooldown, global cardinality bound, expiration/retention and
missing-table failure. Unit tests cover input/identifier validation and failure
cleanup. Tests create only synthetic, private fixture tables. Existing native
recovery tests must continue passing because this milestone is not activated.

## Explicit next gate

Before activation: register the table in the installed adapter's schema, generate
an additive migration without rewriting either existing migration, rehearse
restore and schema reconciliation, connect the REST handler before token/mail
generation, and verify neutral known/unknown/limited responses with real HTTP.
Bound pool acquisition at the integration boundary and test provider failures do
not refund admission. SQLite is local-only and cannot claim this distributed
guarantee. Trusted edge limits and timing enumeration remain separate findings.

Reference: [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

## Verified isolated result, 11 September 2026

Base commit `63feca3`. Added only the standalone admission module, its unit and
integration tests, this design and the implementation plan. No existing runtime
handler, adapter configuration or migration catalog was modified.

- RED: new unit and PostgreSQL suites failed because the module did not exist
  (`16322c`, `3d0a1a`). No dependency or database setup failure was substituted.
- GREEN: 12 focused unit tests; complete owner unit suite **1,272 tests / 168
  files**, exit 0 (`fdde7d`).
- PostgreSQL 16.15 / Node 24.18: first seven admission tests plus ten existing
  native recovery tests passed together (`f31483`). Final admission suite expanded
  to **nine** tests, all passed (`735cc5`), including a post-global-write SQL failure
  and a separately held cross-pool lock. Both isolated runs verified session
  shutdown and removal of only their synthetic run roots.
- Strict typecheck (`3fe0cb`), focused lint (`0e2e5d`) and diff whitespace check
  (`4e5bee`) passed. An initial TypeScript overload error was corrected by selecting
  the promise overload of pool.connect; no runtime cast was used to silence it.
- Independent read-only reviewer found no important reproducible defect; their
  suggested post-write rollback test was added and passed. This is an internal
  review, not an acceptance from Claude or evidence of production operation.

The container used the existing `a98b80d` recovery checkout with the previously
verified reset-lock runtime and current test/module overlays. It was not falsely
reported as a fresh checkout of a later commit. No real provider was contacted.
The endpoint remains unchanged and **not rate-limited by this candidate yet**.
Next responsible: Codex, the explicit migration and HTTP activation gate above.

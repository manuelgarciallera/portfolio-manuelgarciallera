# Recovery rollback after password/session persistence

Base `8ed66ca`. Reservation `e16bbcd4-633c-4398-b3b4-298326f566a7`.

Added a narrow real HTTP/SQLite characterization of our Users recovery hooks composed with Payload transactions. A test-only beforeLogin failure occurs after the new hash and session are written. A read using the same transaction explicitly verifies both changed before throwing. After HTTP 500, hash, salt, reset token/expiration, sessions and lockout fields equal the pre-request state. The original JWT and password still work; the same recovery token succeeds on retry and the replacement password works.

No runtime fix was needed: existing behavior passes. This is not a TDD runtime change or a claim that all downstream failures roll back. Initial test typecheck failed because the key array widened to string; corrected with a const tuple. Initial probe passed seven HTTP cases; final strengthened probe also passed seven cases. Typecheck, lint and diff check passed on the final version. No full unit suite/build rerun for this test-only change; those passed at base 8ed66ca.

## Limits and follow-up

The injected failure is before commit. Installed Payload invokes afterOperation after committing; this test must not be cited as coverage of post-commit hooks, lost HTTP responses, concurrent resets, or PostgreSQL behavior. No production post-commit hook was added. Next work remains recovery abuse/timing controls, browser QA and staging mail delivery, plus full CMS acceptance gates. No real email, credentials, deployment, public UI or dependencies changed. Codex owns follow-up.

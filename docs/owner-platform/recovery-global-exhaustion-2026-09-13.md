# Recovery under global exhaustion — 13 September 2026

Base `acfa2ca`. Reservation `fedf0dba-cb42-450c-ac01-f61736f58daa`.
Test-only characterization, no policy or runtime change.

## Findings

The REST global budget can deny a legitimate new recovery email. The existing
recipient limit can also be exhausted against a known address. Removing the
global limit alone would not establish availability and would remove the
current bound on allocated recipient rows and email attempts.

A new PostgreSQL HTTP test saturates only the synthetic fixture's global row:

- Known and unknown addresses receive the same neutral 200, without delivery.
- The existing password still permits login.
- A previously issued token still resets the password successfully.
- The trusted Payload server API can issue another working emailed link without
  changing or refunding the exhausted global counter. Reset and subsequent login
  both succeed. The email provider is intercepted; no real email is sent.

This last capability is **not a ready operator recovery tool**. There is no new
HTTP endpoint, token disclosure or administrative permission granted by this
test. A person with no password, live token or server operator path still has an
availability problem. Do not mark that operational gate closed.

## Fresh verification

- PostgreSQL 16.15, isolated loopback SCRAM cluster: full auth HTTP suite 15/15,
  17.09 seconds, exit 0 (`e1fb92`). Runner verified child/session shutdown and
  removed only its synthetic run root.
- Typecheck and focused ESLint exit 0 (`08b898`); whitespace check passed.
- Complete integration runner: 92 tests / 12 files, 117.39 seconds (`6e75d2`);
  final exit 0 and session/cluster cleanup verified (`82bae6`). This runner
  includes fixtures explicitly using SQLite; not every test is PostgreSQL.
- Container checkout is `/work/verification-fac73fa/owner-platform` with overlays,
  not a clean checkout of the current HEAD. Normalized SHA-256 equality for
  `forgot-password.ts`, `recovery-admission.ts`, `recovery-lock.ts`, `Users.ts`
  and the new integration test was checked host/container (`4dc02c`, `c5fc98`).
- Test digest: `f6dc177fc41ed39e89e1b4b98de1fdaf508f3bafc0391dd1624e48b63b7bb1ad`.

## Proposed next operational gate

L2 proposal `329a8440-d172-46e0-81e8-3223c38a598d` sent to Claude; acceptance
not inferred. Preserve limits and evaluate an explicit server-side operator
command, never an alternate anonymous endpoint: validate configured environment,
existing owner target, confirmation and mail adapter; audit without emitting
tokens, passwords or provider credentials; document actual hosting access for
the account holder. Test provider failures, unknown targets and audit failure.
Trusted edge controls and privacy-preserving alerts remain separate work.

No deployment, public source edit, production account change or antivirus change.
Next responsible: Codex, operational design after review and remaining CMS gates.

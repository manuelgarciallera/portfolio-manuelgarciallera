# Explicit object storage in owner runtime

Date: 2026-09-10. Base `16f1b30`. Reservation Hub `b3f1cdf1`. No production activation.

## Implemented

The default Payload configuration now awaits `configureMediaStorage` before sanitization. With no mode/configuration it retains legacy Media unchanged. `OWNER_MEDIA_MODE=objects` requires explicit endpoint, region, private bucket namespace/prefix, access key, secret, pre-existing absolute scratch directory and canonical owner origin. Unknown modes and partial object configuration reject startup rather than silently storing files locally.

The assembler dynamically loads the existing official S3 SDK and revision binding. Credentials are supplied explicitly, never through the ambient AWS chain. It creates neither a bucket nor a directory, performs no intended provider operation during configuration, and preserves existing collection access controls, fields, hooks and admin grouping. Credential values are captured by server functions, not added as serializable config data. Production requires HTTPS; a ported 127.0.0.1 HTTP origin is available only outside production.

The full-config integration now uses this assembler for objects instead of replacing Media directly with a test-created transport. It therefore exercises the same application composition as startup, retaining the existing REST authorization, historical-media and restore checks.

## Red/green and verification

- Initial missing module `37be24`; executable legacy-only stub RED `ca81f5`: 20 failures, one legacy case passing. Implementation focused GREEN `77b823`: 21/21.
- Full owner PostgreSQL filesystem/object paths through the assembler: 2/2, 56.98s, `8ca862`; process/session closure and synthetic-cluster cleanup verified.
- Independent review found unconditional `server-only` import incompatible with native Payload CLI; full-unit run `d8e280` reproduced it. Removed that marker from the server configuration assembler (not from application route modules). Plain Node/tsx default-config import smokes passed legacy (`7bed36`, 26 sanitized collections) and objects (`4b9dd9`), without generation, DB connection or react-server condition.
- A full-unit run subsequently hit the five-second default on cold dynamic SDK imports (all other 1131 cases passed). The single cold-import assembly test has a 15-second budget; no network timeout or production contract changed.
- Added direct test of exported default application configuration selecting object storage (not just helper invocation), 22 focused cases pass (`6a78ce`). Final full unit run passes 1133/1133 in 159 files (`bf7364`).
- First complete PostgreSQL run timed out (`18bdb4`) with verified cleanup, while other verification processes had also run. This is not counted as a pass; an isolated repeat is required. No timeout increase or test removal applied.
- Isolated complete repeat: 59/59 in 10 files, 139.23s (`d92213`), PostgreSQL 17.11 controller (auth-unlock remains explicitly SQLite). Final typecheck/lint exit 0 (`9cd0a2`), public boundary 21 entries (`97ad01`). Independent review closed the CLI blocker with no further blocking findings; lifecycle/provider/migration limits remain explicit below.
- Owner Next build passed in legacy mode (`342000`) and object mode (`0efa7c`), 23 pages each. Object build used synthetic HTTPS endpoints and a pre-provisioned scratch directory, not real credentials. No TLS verification disabled; only the known incompatible `--use-system-ca` inherited Node option was removed for the build child.

## Activation gates and limits

No actual environment file changed; `.env.example` documents the opt-in. Existing data must not simply switch modes: legacy media has no storage revision and will need the reviewed schema/data migration. The baseline currently describes legacy storage; an object-mode delta and matching snapshot are still required. Do not run schema push or reset against existing production data.

Object mode requires its full configuration and provisioned scratch directory during build as well as runtime. Validate private bucket policy and OS/mount permissions; a path check does not certify those. The configured S3 client lives with the process; repeated hot-reload configurations can retain pools until process exit, since Payload exposes no corresponding disposal hook here.

Still unproven: real provider persistence/permissions, remote backup/restore, legacy migration, browser testing with actual provider and staging acceptance. No hosting contracted, bucket created, database migrated, public page changed, push or deployment performed. Codex owns the next migration/recovery/staging gate; Claude receives findings through the Hub.

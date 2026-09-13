# Recovery lock rejection diagnostics

Scope: active Payload 3.88 owner source, not the isolated dependency candidate.
Addresses Claude's conceptual review 95924f65 about ambiguous hash64 contention.

The SHA-256-derived 64-bit key is unchanged. Domain separation does not eliminate
collisions mathematically; switching keys during a mixed-version rollout could
allow two processes to reset the same token independently. Comments now make
both limitations explicit rather than promising collision-free namespaces.

A rejected acquisition emits a fixed debug event with reason
`contention_or_collision` for false, or `unexpected_result` for a missing or
non-boolean affirmative result. No token, key/hash, email, request object, SQL
result or database error is attached. Public rejection remains the existing 403.
Debug visibility depends on logger configuration; this is not an alerting system
or proof that a particular rejection was a hash collision. No new public endpoint,
rate-limit exemption or recovery operator authority was added.

## Evidence

- RED `0f7478`: two new diagnostic contract cases fail because no event exists.
- GREEN: eight focused tests (`174487`), lint passed. Initial typecheck command
  used an incorrect tsc package path; corrected command exits 0 (`de839e`).
- Full active npm test: three Node script checks plus 1,305 tests / 170 files,
  exit 0 (`7c4ab6`), 59.74 seconds.
- Synthetic PostgreSQL 16.15 on existing QA checkout with Payload 3.88.0 and
  this one-file overlay: 16 auth recovery/unlock integration tests pass,
  exit 0 with sessions/cluster/root cleanup verified (`a7d252`). This is an
  overlay validation, not a clean checkout of the final commit.

No changes to the public web, runtime secrets, dependencies, browser permissions
or deployment. The isolated 3.89 candidate does not yet contain this later source
change; any eventual integration must verify the combined source, not reuse
the old candidate's counts as if they covered this patch.

## Later combined candidate verification

The preceding candidate exclusion describes the initial delivery. The Linux
candidate now includes this source and its two tests in isolated commit
`0b0c308f71ae3e387e4f7a67617e51f3b898e5d4`; active dependencies remain unchanged.

The earlier process handle 34448 was missing on resumption. A process inventory
confirmed only container init/sleep, so no result is inferred from that lost
output. A fresh run of both auth integration suites on this exact candidate
passed 16 tests / two files in 22.81 seconds (`707e00`, exit 0), including verified
session closure, PostgreSQL 16.15 shutdown and synthetic-root cleanup.
`npm run build` on the same candidate passed compilation, TypeScript and
23-page generation (`220f28`, exit 0). These checks do not exercise browser UI.

The full 92-test PostgreSQL and physical recovery runs recorded in the peer
review remain evidence for parent `3be89ec`, not fresh full-suite runs on this
diagnostic patch. No dependency cutover or independent implementation approval
is implied.

Complete local Git bundle `.audit/payload389-candidate-0b0c308.bundle` verified
successfully (`1162a4`). SHA-256:
`00F88F4B3B228ADF1F30D883DD5121709A5E0F1E4ADF786D7B976518E5E93230`.
This is a local code recovery copy, not an external backup of real database/media.
Browser authorization and independent candidate review remain outstanding.

## Full integration and physical recovery on the combined SHA

Subsequent fresh verification closes the parent-only limitation above for these
two gates, without changing the candidate SHA:

- `node scripts/test-integration-postgres.mjs`: 92 tests / 12 files pass in
  109.97 seconds, exit 0 (`299a9d`). Runner confirms closed processes/sessions,
  stopped PostgreSQL 16.15 and removal of only the synthetic run root.
- `node scripts/test-recovery-postgres.mjs --object-media --full-owner`:
  47 helper tests pass, then native dump/restore into a fresh database succeeds,
  exit 0 (`ee78f5`). Report binds applicationCommit to full `0b0c308` SHA above.
  Verified 18 backup files, 12 media files, three revisions, 12 rejected damage
  cases, login, history, frozen preview, editing after recovery, page/article
  versions and migration reconciliation. Original logical state and backup
  receipts remain unchanged; exact cluster shutdown and cleanup are verified.

These are synthetic backend fixtures, not browser acceptance, live provider
delivery, production backup recovery or client multi-tenant certification.
No runtime edit, active dependency upgrade, deployment or public change here.

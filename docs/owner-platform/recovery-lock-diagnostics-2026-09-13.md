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

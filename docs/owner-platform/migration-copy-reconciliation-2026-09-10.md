# Read-only reconciliation of revision copy attempts

Date: 2026-09-10. Base `2d788a9`. Hub reservation `53de7469`.

`reconcileMigrationCopy` compares every planned destination revision with the
independently pinned migration candidate, including those marked pending or
verified by the journal. It checks plan/inventory binding, expected logical
destination, journal metadata and exact revision membership before reading the
provider. It rereads the journal afterwards and rejects changed observations.

Results distinguish `matched`, `mismatch` and `unreadable`. An unreadable object
may be missing, partial, corrupt, inaccessible or temporarily unavailable; no
absence or retry permission is inferred. Both a result and all entries retain
their observational nature: the aggregate has `canApply:false`. No database,
snapshot, source, destination or journal mutation occurs.

## Verification

- RED `f97577`: three executable failures against the stub. Initial GREEN
  `28eac6`: all 16 copy/reconciliation cases pass.
- Expanded focused run `960391`: 27 cases across copy/reconciliation and journal.
  Actual S3 SDK fixture tests coherent target+manifest tampering against the
  independent candidate, pending-but-present objects, unreadable attempts,
  unexpected destination context, unchanged files/objects, and journal changes
  during provider reads.
- Added the previous journal review's missing sync-failure test: inject failure
  only at the real FileHandle sync boundary after initialization. The persisted
  attempt remains visible, the writer is poisoned, and later attempts or verified
  events cannot append. This is fault injection, not power-loss certification.
- Read-only independent review reports no blockers for the candidate.
- Final unit suite `ca4d80`: 1160/1160 in 161 files, 60.76s. Types/lint exit 0
  (`98e031`), public boundary 21 entries (`527271`), diff check clean. No new
  application build, browser or PostgreSQL run claimed for this internal module.

## Limits and next integration gate

Observations are sequential, not an atomic provider snapshot. External writers
must be frozen; a successful read does not guarantee future availability. Journal
authenticity and logical-destination-to-provider binding remain responsibilities
of the trusted operator/orchestrator. A damaged journal needs separate recovery,
not bypassing its checks or blindly replaying attempts.

Next: integrate inventory, independently authenticated historical mapping,
staging, journal and reconciliation in a controlled clone workflow; preserve
immutable snapshots and run joint database/media backup recovery before cutover.
No production provider, activation, database change, deployment or public visual
change was performed here.

# Preparatory transfer of staged revisions to objects

Date: 2026-09-10. Base `ed9ba5d`. Hub reservation `2b515f76`.

## Implemented boundary

`copyMigrationRevisions` is an internal operation over a caller-owned, frozen
staging root, a migration plan, a pinned inventory artifact and a trusted private
object revision transport. It does not accept browser requests, resolve provider
credentials, activate configuration or write database/snapshot references.

It validates the serialized plan, exact inventory coverage and externally supplied
inventory hash, then physically checks **all** staged revisions before allocating
a destination. Each revision is reread and compared with the candidate immediately
before transfer. The existing transport restores the same UUID using conditional
writes; an additional reread compares names and exact bytes. Existing destinations
are rejected, including a repeat of a successful copy. No destructive cleanup or
blind retries are performed.

Success returns counts, inventory/plan identifiers and copied revision UUIDs with
`canApply:false`. Failure reports attempted revision UUIDs, including potentially
ambiguous writes, without raw provider errors or paths. Already written data is
retained for reconciliation. The caller must persist the result in its journal.

## Important limitations

- This transfers **already staged immutable revisions**; it does not turn a flat
  legacy filename into authenticated historical evidence or generate the original
  legacy-to-revision mapping. Hash agreement proves consistency, not provenance.
- Metadata backfill, immutable snapshot resolution and actual cutover remain open.
- The receipt/error is in memory, not a crash-durable execution journal. A process
  crash still requires destination inventory and reconciliation; this component
  alone is not an unattended production migration orchestrator.
- The source must remain quiescent. Revalidation catches changes observed during
  the operation; it does not implement an operating-system freeze or writer lock.
- Processing is sequential per revision, not a whole-library buffer. However,
  transport snapshot copies and verification reads mean peak memory exceeds one
  64 MiB revision buffer. No new peak-memory benchmark is claimed.
- The SDK is tested against loopback protocol fixtures, not a real provider's
  authentication, persistence, quota or backup guarantees.

## Verification

- RED `c99400`: five executable failures against the unimplemented service.
- Initial GREEN `b05a83`: five cases with real filesystem revision storage and the
  existing S3 SDK fixture. Expanded to damaged origin, inventory mismatch, failed
  provider writes, duplicate destinations, wrong returned identity, wrong reread,
  later corrupt revision caught before the first write, and partial batch failure.
- Additional case changes a later revision and its manifest after preflight;
  it must fail against the original candidate before attempting that destination.
- Independent read-only review found no blockers for the preparatory boundary;
  noted journal and peak-memory limits above. No reviewer tests were run.
- Final full unit run `83bfff`: 1143/1143 in 160 files, 62.55s, including all ten
  copy cases. Final types/lint `75e557` exit 0; public boundary `074391` passes 21
  entries. No new application build, browser or PostgreSQL run claimed here:
  existing application imports/configuration and database paths are unchanged.

No production files copied, no real provider provisioned, no environment changed,
no public bundle addition, push or deployment. Next: durable migration journal,
authenticated staging/mapping and joint database/media restoration rehearsal.

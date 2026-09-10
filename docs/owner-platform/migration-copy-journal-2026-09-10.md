# Write-ahead journal for preparatory revision copy

Date: 2026-09-10. Base `475989c`. Reservation Hub `47ed9b72`.

## Implemented

Private, exclusive per-run JSONL file with plan digest, inventory hash, logical
destination ID and revision allowlist. Creation uses `wx` and requested mode 0600;
each header/event write is followed by file sync before acknowledgement. There is
one writer per returned handle, no concurrent append, no duplicate attempt, no
verification without an attempt, and no further append after an I/O failure.

The copy operation now requires a matching journal. It awaits the attempt record
before calling the destination and awaits a verification record only after the
destination byte comparison. Journal failure prevents the next provider write.
The returned receipt includes the journal ID. Journal ownership/lifetime remains
with the operator; the copy does not close a caller-owned journal implicitly.

The bounded reader validates root/file identity, regular non-linked files, UTF-8,
complete lines, metadata, sequential event numbers, revision membership and state
transitions. It reports attempted-but-unverified revisions for reconciliation.
It never authorizes retries, metadata backfill or cutover (`canApply:false`).

## Evidence and limitations

- RED journal stub: 3 failures (`26721e`), initial GREEN 3 (`0fe5f7`).
- Write-ahead integration RED `6def76`: provider boundary saw no persisted intent.
  Integrated journal; combined focused 14/14 (`8ea13c`).
- Child process writes and syncs intent then exits without calling close; parent
  reopens file and observes uncertain revision. This is a process-exit test, not
  proof against power loss or a real provider outage.
- Sparse revision input RED `fd5ed2` fixed; focused 18/18 (`91904b`). Review found
  JSON destination coercion; RED `1c1a47` confirms numeric ID accepted. Explicit
  string validation added for destination and both hashes. Concurrent-append
  characterization and cleanup nesting included.
- Independent review found no blockers for this internal candidate. Follow-up
  [reconciliation work](migration-copy-reconciliation-2026-09-10.md) adds direct
  sync-failure injection and verifies poisoning; not every filesystem failure or
  power-loss scenario has been exercised.
- Final unit suite `e11582`: 1153/1153 in 161 files, 65.95s. Types/lint `024b5b`
  exit 0; public boundary 21 entries (`4a09e6`), diff check clean. No new build,
  browser or PostgreSQL verification claimed for this internal file-copy change.

File sync does not certify directory-entry persistence on power loss, effective
Windows ACLs, remote filesystem semantics or backup durability. Storage must be
private and persistent. Journal content is not authenticated: external tampering
or truncation at valid record boundaries can remove history, so even `pending`
does not authorize a blind retry after an incident. Reconcile provider contents
and independently trusted plan/inventory first.

The destination ID is a trusted operator registry label, not a verified binding to
the injected provider credentials/endpoint. Full orchestration must establish
that binding, quiesce writers, retain journal plus database/media backups and
provide explicit reconciliation. No automatic resume, real legacy mapping or
production activation was introduced.

No deployment, public design change, provider provisioning or real data migration.

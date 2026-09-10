# Optional object-backed Media schema (candidate)

This catalog reuses the immutable legacy baseline, then applies the native Payload
delta `20260910_133129_object_storage`. The delta adds nullable revision identifiers
to `media` and `_media_v`. It does not copy files or populate existing records.

Generated offline with installed Payload 3.88.0 from the baseline snapshot and the
actual `configureMediaStorage` configuration. No database pool was acquired.
The generator refuses an existing catalog; do not rewrite applied history.

## Operational boundary

- The catalog is **not wired to startup, deployment or automatic migrations**.
- The isolated acceptance test installs baseline plus delta in an empty database
  with `push:false`, checks the native schema diff, uploads synthetic bytes through
  the S3 SDK fixture, and repeats migration without changing data or its ledger.
- An existing database needs a restored-clone rehearsal and reconciliation of its
  schema and native migration ledger. Do not run initial CREATE statements over it
  or mark them applied without evidence.
- Existing local media, variants, versions and snapshot references still need a
  verified inventory and physical migration. These nullable columns do not make
  old content compatible with object mode. Do not enable that mode yet.
- The generated `down` drops revision columns and is not an operational rollback.
  Recovery requires compatible database and media backups, tested together.

No production provider, credentials, database, public bundle or runtime setting was
changed by generating this catalog.

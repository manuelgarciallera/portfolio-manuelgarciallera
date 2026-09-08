# Legacy Media Inventory Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement
> task-by-task with TDD and independent review. Manuel requested autonomous
> continuation without repeated implementation questions; do not migrate real data.

**Goal:** Produce a truthful read-only inventory required before legacy media can
be reconciled and migrated on a clone without assigning today's bytes to history.

**Architecture:** A bounded filesystem inventory consumes normalized references;
a separate owner-only Payload collector supplies current, draft, version and
snapshot references. Neither layer performs migration or changes active config.

**Tech Stack:** Existing Node fs/crypto streams, TypeScript, Payload, Vitest,
SQLite and portable PostgreSQL. No new dependencies.

**Spec:** [Design](legacy-media-inventory-design-2026-09-08.md).

## Global Constraints

- No writes, deletion, URL downloads, row/version/snapshot mutations, new endpoint,
  active configuration, dependencies or real data. Test fixture creation/cleanup
  is separate from production code and uses only owned synthetic paths.
- Explicit existing absolute local root, not a volume root; reject linked or
  redirected roots. Do not traverse nested directories or linked/special files.
- Limits: 10000 references, 16 variants per reference, 10000 physical entries,
  64 MiB per file, 1 GiB total observed regular-file bytes. Exceeding limits throws,
  never returns a partial success. Hash streams sequentially. No recursive cleanup
  in new code; existing fenced integration parent runners remain unchanged.
- Historical references remain unverified without captured revision identity;
  matching filename/size/current hash does not establish historical identity.
- Report schemaVersion 1, deterministic order/content hash, no absolute roots,
  URLs, auth data, emails or editorial text; migrationReady is always false.
- Caller must quiesce the clone; this observational inventory is not a transaction
  snapshot, migration approval, effective ACL check or production-readiness proof.
- Existing immutable core/binding, active Media/config, public code, checkpoint and
  all older integration tests remain unchanged. No providers, cost, CV or fonts.

## Task 1 — Bounded physical inventory and loss-aware classification

**Files:** create `owner-platform/src/media/legacy-media-inventory.ts` and
`owner-platform/src/media/legacy-media-inventory.test.ts`. The module may export
the following types; no additional runtime helper file is required initially.

**Produces exact interface consumed by Task 2:**

```ts
export type LegacyMediaReference = {
  kind: 'document' | 'draft' | 'version' | 'snapshot'
  documentId: string
  referenceId: string
  state: 'published' | 'draft' | 'trashed' | 'unknown'
  storageRevision?: string
  files: { variant: string; filename?: string; expectedBytes?: number }[]
}
export type LegacyFileObservation = {
  filename: string
  status: 'present' | 'unsafe-entry'
  bytes?: number
  sha256?: string
}
export type LegacyReferenceObservation = LegacyMediaReference & {
  status: 'current-observed' | 'historical-unverified' | 'versioned-not-inspected' | 'incomplete'
  issues: string[]
  observedFiles: LegacyFileObservation[]
}
export type LegacyMediaInventory = {
  schemaVersion: 1
  migrationReady: false
  references: LegacyReferenceObservation[]
  physicalFiles: LegacyFileObservation[]
  unreferencedFiles: string[]
  issues: string[]
  totalObservedBytes: number
  hash: string
}
export async function inspectLegacyMediaInventory(input: {
  root: string; references: readonly LegacyMediaReference[]
}): Promise<LegacyMediaInventory>
```

- [ ] Write an initial real-file test with bytes `abc`. RED must expose a missing
  digest/classification rather than a typo; a minimal stub may return incomplete
  observations only to establish the behavioral failure, then replace it via TDD.

```ts
const refs = [{ kind: 'version' as const, documentId: '1', referenceId: 'old-1',
  state: 'published' as const, files: [{ variant: 'original', filename: 'same.png', expectedBytes: 3 }] }]
const report = await inspectLegacyMediaInventory({ root, references: refs })
expect(report.references[0].status).toBe('historical-unverified')
expect(report.references[0].observedFiles[0].sha256)
  .toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
expect(report.migrationReady).toBe(false)
```

- [ ] Run `npm test -- src/media/legacy-media-inventory.test.ts`, record expected
  failing output. Implement validation before IO: finite bounded arrays, valid
  enums, nonempty IDs/variant names up to 256 chars without controls; unique
  kind/documentId/referenceId and unique variant per reference. Missing filename
  is an `incomplete-metadata` issue, not an exception. Invalid expectedBytes
  (not positive safe integer) and malformed storageRevision are explicit issues.
- [ ] Validate physical root and immediate entries using lstat/realpath; do not
  follow symlinks/hardlinks or read special files/subdirectories. Reject unsafe
  reference names (traversal/separators/ADS/control/device names/trailing dot or
  space/ill-formed UTF-16/manifest.json). Never decode filenames as URLs. Guard
  stream reads with regular-file identity/size/mtime checks before and after;
  unexpected IO errors or observed mutation throw, not `missing`.
- [ ] Preflight observed regular-file count/bytes before streaming. Hash each
  safe regular file once; identical references do not inflate physical totals.
  Record zero-length files and flag `empty-file` when referenced. Use SHA-256 hex.
  No readdir recursion, unlink/rm/write/mkdir/fetch in production module.
- [ ] Classify current document/draft with all files present and matching supplied
  metadata as `current-observed`; historical version/snapshot as
  `historical-unverified`, even if every filename/size/hash matches current.
  Missing/unsafe/empty/mismatching files yield `incomplete` and stable issue codes
  with variant context. Valid revision-bearing refs are `versioned-not-inspected`
  and are not resolved against the legacy root. Do not hide invalid metadata.
- [ ] Include unreferenced regular/unsafe physical entries without authorizing
  deletion. Shared canonical filename across different document IDs and physical
  NFC/case collisions are issues; exact same-document aliases are allowed. Use
  conservative normalization for matching, but do not silently pick one of two
  colliding disk entries. Preserve normalized evidence, never editorial extras.
- [ ] Sort references by kind/documentId/referenceId, variants by variant/name,
  physical/unreferenced entries and issue lists deterministically. Hash canonical
  JSON of the report excluding hash; do not include time/root or mutate input.
  Bound serialized report to 8 MiB before returning to avoid an unbounded artifact.
- [ ] Add focused actual-file tests for missing file, metadata mismatch, empty,
  same-name history, unreferenced files, unsafe names, Unicode, links/hardlinks,
  duplicate identity/variants, malformed inputs, size/count budgets and unchanged
  byte inventory/mtime after inspection. Use sparse oversized fixtures where
  useful; cleanup only known synthetic files and empty directories.
- [ ] Run focused tests, then full owner unit suite once, lint and typecheck.
  Record commands and every failure. Commit exactly the two new files and write
  report into the task workspace, not force-add ignored scratch.

## Task 2 — Owner-authorized Payload reference collection and real DB evidence

**Files:** create `owner-platform/src/media/legacy-media-inventory-service.ts`,
its `.test.ts`, `owner-platform/tests/legacy-media-inventory.integration.test.ts`
and `docs/owner-platform/legacy-media-inventory-verification-2026-09-08.md`.
May modify Task 1 files only for a reproduced interface defect, with focused TDD.

**Consumes:** `inspectLegacyMediaInventory({root,references})` and exported
`LegacyMediaReference`/`LegacyMediaInventory` from Task 1; existing
`isOwner`, `hashPreviewManifest`, `Media`, `Users`, `PreviewSnapshots`, and
`editorialDatabaseConfig` helpers. Reuse existing integration runners unchanged.

**Produces:**

```ts
export async function inspectPayloadLegacyMedia(input: {
  payload: Payload; req: PayloadRequest; root: string
}): Promise<LegacyMediaInventory>
```

- [ ] Write RED for rejection before any DB/disk access when req.user is not
  owner. Use a narrow throwing boundary stub only here; the authoritative output
  tests below use actual Payload/DB/files. No bypassing ACL because this is admin.

```ts
await expect(inspectPayloadLegacyMedia({ payload, req: anonymousReq, root: missingRoot }))
  .rejects.toMatchObject({ status: 403 })
```

- [ ] Inspect installed Payload find/findVersions/trash/draft option semantics.
  Reject a request with non-null/undefined transactionID (including a Promise)
  with status409 before any DB/filesystem call; do not mutate/remove that ID.
  Installed findVersions failure calls killTransaction(req), which could roll
  back a caller's edit. Test rejection preserves that same ID and never invokes
  DB rollback. Use a separate read request for successful inventory.
  Read with `overrideAccess:false`, req, depth 0, explicit limit 100/page/sort id.
  Enumerate media (including trash) at draft:false and latest draft:true,
  all retained media versions and preview snapshots. Normalize each stored row
  independently; filename/sizes/filesize never backfilled from another row.
  Stable ref IDs: document/draft use document ID; version uses version row ID;
  snapshot uses snapshot ID with each referenced media's own ID. Parent relation
  may be numeric/string or populated ID; reject unsupported identity shapes.
- [ ] Bounded pagination must fail on malformed totals, duplicate IDs, stalled
  pages or declared truncation; apply the global 10000 normalized-reference cap
  across collections, not once per document. Never swallow denied version access,
  snapshot corruption, unexpected DB errors or inconsistent results as empty.
- [ ] Validate each snapshot with existing hashPreviewManifest and stored hash.
  Capture only its original filename when that is all it recorded; do not invent
  derivative metadata. Duplicated media ID within one snapshot is rejected.
  Current/draft state uses stored _status/deletedAt; historical state uses the
  stored version, and snapshot state is unknown. Do not output unrelated fields.
- [ ] Seed an isolated legacy fixture with real Media+Users+PreviewSnapshots and
  minimal persisted page/brand/AuditEvents inputs for the existing snapshot
  service. Use physical synthetic PNGs, no network provider, unique DB/root/schema.
  Create red A, capture snapshot, replace with blue B and retain A version; include
  draft and trash records. Assert literal expected reference identities/counts,
  present B bytes, A missing or historical-unverified according to actual native
  filenames, and untouched snapshot hash. Never call native rename behavior proof
  of historical identity. Read active/bound media integration tests, do not edit.
- [ ] Independently snapshot relevant rows/versions/snapshots and physical bytes
  before and after inventory; prove zero mutations. Verify real owner access,
  anonymous/non-owner rejection and a collection readVersions denial. Exercise
  multiple collector pages with synthetic actual data or a narrow validated
  pagination boundary unit case; include malformed-page failure tests.
- [ ] Run focused TDD, final full owner unit suite, complete SQLite and PostgreSQL
  integration suites, lint/typecheck and public boundary/bundle checks. Do not run
  full resource benchmark/recovery or claim production migration. Keep initial
  failures in report and preserve private data/checkpoint. Existing runners own
  validated parent roots; new cleanup is nonrecursive and waits for actual close.
- [ ] Document results/limits and example usage only with explicit synthetic clone
  root and an existing authenticated server request. No CLI, HTTP endpoint, UI,
  active-schema mutation or migration executor. Update the result as a prerequisite
  to clone migration, not a replacement for it. Explicit-file commit then review.

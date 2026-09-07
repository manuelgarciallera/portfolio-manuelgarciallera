# Versioned Media Storage Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans task-by-task with TDD
> and independent review. Manuel has explicitly requested autonomous continuation
> without repeated implementation questions. Do not deploy or migrate real data.

**Goal:** Preserve actual historical image bytes when the owner replaces or
restores media, without losing current editing capabilities or access control.

**Architecture:** First create a revision writer/reader with checksum manifests
and exclusive files. Then connect it to versioned Payload media and prove real
editorial plus HTTP behavior before enabling it on the existing library.

**Tech Stack:** Existing Node filesystem/crypto APIs, TypeScript, Vitest, Payload
3.88, SQLite and PostgreSQL. No new dependency for the storage core.

**Spec:** [Design](versioned-media-storage-design-2026-09-07.md).

## Global constraints

- Public UI, checkpoint and existing media remain unchanged.
- No provider, spend, credentials, real-data migration or CV publication.
- Local root explicitly provisioned; no filesystem-root targets or recursive deletion.
- 16 files maximum; 64 MiB maximum total; immutable exclusive writes; schema 1 manifest.
- No claim of a finished storage integration from core unit tests alone.

## Task 1 — Immutable physical revision core

Files: create `owner-platform/src/media/revision-store.ts` and
`owner-platform/src/media/revision-store.test.ts`.

Interfaces: `writeMediaRevision(root: string, files: { name: string; bytes: Buffer }[]): Promise<string>`;
`readMediaRevision(root: string, revision: string): Promise<{ name: string; bytes: Buffer }[]>`.

- [ ] Add real-filesystem tests. Required behavior example:

```ts
const first = await writeMediaRevision(root, [{ name: 'hero.png', bytes: Buffer.from('old') }])
const second = await writeMediaRevision(root, [{ name: 'hero.png', bytes: Buffer.from('new') }])
expect(first).not.toBe(second)
expect(await readMediaRevision(root, first)).toEqual([{ name: 'hero.png', bytes: Buffer.from('old') }])
```

- [ ] Run `npm test -- src/media/revision-store.test.ts`; establish RED before implementation.
- [ ] Implement exclusive UUID directories and `open(path, 'wx', 0o600)`, followed by
  `handle.writeFile(bytes)`, `handle.sync()` and `handle.close()` in finally.
  Write the validated manifest after all binary files, using the same exclusive
  writer. Never call unlink/rm in this production module.
- [ ] Validate root with absolute/non-root checks, lstat and realpath; reject
  linked revision/file paths before reads. Hash and compare every manifest entry,
  also rejecting unexpected directory entries. Bound manifest length and declared
  file count/size before reading buffers.
- [ ] Test duplicate/case-colliding names, traversal/ADS, empty and oversized
  input, missing/extra/corrupt binary, corrupt/missing manifest, invalid ID,
  linked root/revision/file and concurrent same-name writes in separate revisions.
- [ ] Run focused tests, lint, types; independent review then explicit-file commit.

## Task 2 — Payload binding and editorial round trip

Files: `src/collections/Media.ts`, `src/payload.config.ts`, new
`src/media/revision-storage-binding.ts`, its tests, and
`tests/editorial.integration.test.ts`, `src/preview/service.ts` and its tests.
Inspect supported Payload plugin contracts
and compare owner-only dependency cost before adopting a plugin.

- [ ] Keep the existing RED regression as the acceptance case: replacing a file
  must leave a readable original plus derivatives and restore their exact bytes.
- [ ] Bind the returned revision ID into versioned media metadata on successful
  upload, preserving it on metadata-only edits and restoring it with the version.
- [ ] Capture that exact revision in frozen preview media references. Same-name
  replacement must change the new snapshot hash but leave the old capture intact;
  existing manifests lacking a revision remain explicitly legacy/unverified.
- [ ] Add real integration tests for same-name replacement, failed update,
  draft-over-published, trash/restore, duplication and native crop regeneration.
- [ ] Adapt Figma compensation for immutable revisions without deleting uncertain
  or historical data. Avoid mixing legacy local and revision cleanup contracts.
- [ ] Execute complete SQLite and PostgreSQL editorial gates and compare public
  isolation/bundle. An intermittent worker crash is a failed gate, never a pass.

## Task 3 — Protected delivery and rollout evidence

- [ ] Test actual HTTP download of originals/derivatives: owner access; anonymous
  published revision only; draft, trashed and foreign revision denied; malformed
  paths/ranges and private caching behavior checked.
- [ ] Prove physical backup/restore includes all retained revisions plus the DB.
- [ ] Document storage root permissions, orphan reconciliation, growth/retention,
  migration and rollback. Do not activate on the current library before these
  gates and applicable authorization. Update operational-gap status with exact
  evidence, not assumptions from the core helper.

Task 1 can land independently as a tested internal capability. Tasks 2 and 3 are
required before claiming the original media-loss defect fixed in the CMS.

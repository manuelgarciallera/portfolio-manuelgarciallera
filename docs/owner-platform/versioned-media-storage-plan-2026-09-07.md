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
- Local root explicitly provisioned; no filesystem-root targets or recursive deletion
  in new storage/test code. Existing integration runners may retain their fenced
  parent-process cleanup of the synthetic root they allocated; no broadening of it.
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

Files (inside owner-platform): new `src/media/revision-storage-binding.ts`,
its tests and `tests/versioned-media.integration.test.ts`; `src/preview/service.ts`
and its tests; `owner-platform/.gitignore` (from repo root). Read `src/collections/Media.ts` and `src/payload.config.ts`, but do
not enable the new storage on the running app. Provide a configuration factory
consuming the raw collection and explicit provisioned roots, exercised only in
isolated fixtures. Use supported collection hooks and upload handlers, without a
new plugin dependency. Installed Payload behavior is recorded in the binding notes.

- [ ] Keep the existing legacy characterization unchanged; add the positive
  regression as the acceptance case for the opt-in fixture: replacing a file
  must leave a readable original plus derivatives and restore their exact bytes.
- [ ] Anchor the owner ignore rule `media/` to `/media/`: uploaded assets stay
  ignored while new code under `src/media` is visible to Git. Verify both with
  `git check-ignore`; do not add actual uploaded files.
- [ ] Bind the returned revision ID into versioned media metadata on successful
  upload, preserving it on metadata-only edits and restoring it with the version.
- [ ] Capture that exact revision in frozen preview media references. Same-name
  replacement must change the new snapshot hash but leave the old capture intact;
  existing manifests lacking a revision remain explicitly legacy/unverified.
- [ ] Add real integration tests for same-name replacement, metadata-only edits,
  failed update, draft-over-published and trash/restore. Reject forged revision
  metadata; restore must derive authority from the real restore operation and
  stored version, not a caller-supplied context flag. No legacy path fallback.
- [ ] Generate exact revision URLs and implement a guarded handler whose every
  result is a Response (including failures); require an exact media/revision/file
  association and deny private files to anonymous callers. Never bypass collection
  access. Native crop/duplication through HTTP is the dependent Task 3 gate.
- [ ] Adapt Figma compensation for immutable revisions without deleting uncertain
  or historical data. Avoid mixing legacy local and revision cleanup contracts.
- [ ] Execute complete SQLite and PostgreSQL editorial gates and compare public
  isolation/bundle. An intermittent worker crash is a failed gate, never a pass.

## Task 3 — Protected HTTP delivery and native editing

Files: add `owner-platform/tests/versioned-media-http.integration.test.ts` and
`owner-platform/tests/media/http-fixture.ts`. Fix only demonstrated native-flow
defects in `owner-platform/src/media/revision-storage-binding.ts` and its unit
tests. Do not edit active config, raw Media, prior integration tests, public code,
dependencies or existing runners. Test discovery already includes the new suite.

- [ ] Use a listening Node HTTP server on an ephemeral `127.0.0.1` port, with
  bounded requests and guaranteed fixture-specific shutdown. Connect real
  `handleEndpoints`, real cookie authentication, actual Payload/native uploads,
  isolated SQLite and a separate PostgreSQL schema. No real credentials or data.

- [ ] Exercise native image crop and duplication using the authenticated HTTP
  flow with isolated data. Do not weaken safeFetch globally to make tests pass;
  any loopback fixture transport exception must be narrowly scoped to that fixture.
  Match the fixture's exact protocol, host, port and media-revision path; prove
  the exception does not admit another port, host or unrelated path. Do not use
  caller Origin/Host to broaden production storage trust or leak cookies.
- [ ] Native crop produces the expected dimensions and a new immutable revision;
  old originals/derivatives stay byte-identical and can be restored. Native
  duplication produces an independently editable record/revision without changing
  the source. Use the actual REST endpoints, not a manually emulated copy/upload.
- [ ] Test actual HTTP download of originals/derivatives: owner access; anonymous
  published revision only; draft, trashed and foreign revision denied; malformed
  paths/ranges and private caching behavior checked.
  A handler may ignore Range and return the complete 200 response (no advertised
  partial support), but it must never fabricate a partial response or let Range
  bypass authorization. Verify failed unauthenticated mutations preserve state.
- [ ] Establish a failing regression before any binding fix; run focused cycles,
  then full owner unit, complete SQLite and PostgreSQL editorial suites, lint and
  types once on final code. Compare public boundary/bundle without changing
  baseline. Report any failure as a failed gate, not a passed retry.

## Task 4 — Physical recovery and rollout evidence

Consumes the reviewed Task 3 binding and HTTP fixture. Refine the exact fixture
files before dispatch without changing real data or the active configuration.

- [ ] Prove physical backup/restore includes all retained revisions plus the DB.
- [ ] Measure realistic image sets and simultaneous requests; record latency and
  memory with method/limits. Address a demonstrated resource failure without
  weakening full revision integrity or access checks.
- [ ] Document storage root permissions, orphan reconciliation, growth/retention,
  migration and rollback. Do not activate on the current library before these
  gates and applicable authorization. Update operational-gap status with exact
  evidence, not assumptions from the core helper.

Task 1 can land independently as a tested internal capability. Tasks 2 through 4 are
required before claiming the original media-loss defect fixed in the CMS.

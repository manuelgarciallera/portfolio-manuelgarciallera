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
- [ ] Native refetch requires an explicit optional `nativeFetchOrigin` setting
  and exact request Origin, never Host fallback. Validate canonical HTTPS origin
  (no credentials/path/query/hash); isolated fixture HTTP permits only literal
  127.0.0.1 with a port. Without the setting, native editing fails closed. Select
  the owner-authorized stored source before fetch, including body focalX/focalY
  triggers; reject create-without-upload remote fetching. Test rejected inputs
  against a controlled local receiver, with no leaked request or cookie. No
  pasteURL/provider/active-config change. The revision endpoint does not redirect;
  upstream redirect cookie reuse remains a documented deployment risk.
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

## Task 4 — Physical recovery of all retained revisions

Consumes reviewed Task 3 (`339fb8d` + `cf28533`). Files within owner-platform:
new `tests/recovery/versioned-media-worker.mjs`,
`tests/recovery/versioned-media-manifest.mjs` and its `.test.mjs`;
extend `tests/media/http-fixture.ts` only for explicit synthetic reopen settings;
extend `scripts/test-recovery.mjs` and `scripts/test-recovery-postgres.mjs` with
an explicit `--versioned-media` mode. Keep the legacy worker and default workflow
unchanged. No active config, source binding, dependencies or public edits.

- [ ] Read `versioned-media-recovery-contract-2026-09-08.md` completely. Use the
  existing native backup/worker/PostgreSQL machinery; no duplicated process runner.
  The new worker reuses the reviewed HTTP fixture with explicit roots, synthetic
  credentials/secret and database settings, no ambient application credentials.
- [ ] Add a versioned-recovery verification wrapper around the existing physical
  manifest. Keep that archive format and legacy helper unchanged. A fixture-side
  inventory receipt at `media/revision-inventory.json`, itself covered by the
  physical file manifest, records exact revision directories/states. Verify the
  actual directory inventory too, including empty incomplete attempts, before
  allocating a restore destination. No inference from only current DB references.
  Establish RED: remove a recorded empty attempt from a synthetic valid backup;
  the ordinary file-only verifier accepts it, the new strict contract must reject.
  Also test added/unrecorded, missing, corrupt and malformed inventory inputs.
- [ ] Seed older revision A, different published B and latest draft C through real
  owner auth/binding. Assert distinct revision IDs, literal expected dimensions
  and independently known original image content. Persist real media versions and
  a frozen preview referring to an exact revision using the real snapshot service.
  A narrowly scoped page/brand fixture is allowed, as in the existing binding test;
  do not claim full application-schema recovery from it.
- [ ] Include a complete unreferenced revision from an injected post-write failure
  and an incomplete empty attempt. Record media/version/snapshot IDs, inventory,
  original/derivative names, lengths and hashes, and verify their expected states.
- [ ] Quiesce all writers. Parent waits for actual worker close and, in PostgreSQL,
  no Payload sessions before native pg_dump/media copy. Back up the entire media
  tree plus database, restore into a fresh root/database/process using the same
  synthetic secret, and compare all recorded receipts and frozen references.
- [ ] Corrupt and missing historical original/derivative bytes, a missing empty
  attempt, and corrupt/missing DB artifacts reject restore BEFORE creating media
  destination or PostgreSQL target DB. Never overwrite any existing destination.
- [ ] After restore, use actual authenticated HTTP to restore A and download its
  original and derivatives, proving exact old bytes. Recheck published/draft,
  foreign-revision and orphan authorization. Edit the recovered instance and
  prove source logical state/files and backup receipts remain unchanged.
- [ ] New code removes only explicitly owned synthetic files/empty directories,
  without recursive deletion. Existing fenced parent runner cleanup stays intact;
  do not widen roots, remove locks, kill unrelated processes or alter real data.
- [ ] Verify focused TDD cases, complete recovery helper suite, both legacy recovery
  commands and both versioned modes. Because the shared HTTP fixture is extended,
  repeat its HTTP integration cases on SQLite/PostgreSQL plus lint/types. No
  public build or 783-unit rerun unless a changed runtime scope justifies it.
  Record initial failures and process/session cleanup explicitly. Independent
  review and own-file commit precede the next task.

## Task 5 — Resource measurements and rollout evidence

Consumes reviewed recovery and HTTP fixtures. This is the remaining part of former
Task 4, not a reduced release gate. Execute only after Task 4's review is closed.
Read `versioned-media-resource-method-2026-09-08.md` before implementation.

Files within owner-platform: new `scripts/test-media-resources.mjs` (orchestration),
`tests/media/resource-seed-worker.mjs` (synthetic data only),
`tests/media/resource-client.mjs` (bounded independent HTTP client),
`tests/media/resource-measurements.mjs` and `.test.mjs` (validated result summary).
Add `docs/owner-platform/media-resource-verification-2026-09-08.md` and
`docs/owner-platform/media-storage-rollout-2026-09-08.md` from repository root;
update `media-operational-gaps-2026-09-07.md` with exact measured scope. Do not edit
source binding/core, shared fixtures/runners, dependencies or active config merely
to improve a number; a demonstrated runtime failure requires a recorded focused
correction and its own TDD/review gate.

Interfaces consumed: `startMediaHTTPFixture(settings)` with Task 4's explicit
synthetic reopen settings, and existing `runWorker(workerPath, input, cwd)` /
`workersClosed()` from `tests/recovery/worker-runner.mjs`. Reuse esbuild already
installed to bundle the TypeScript fixture into a fresh, ignored, owned runtime.
The seed worker uses real Payload creation and the real revision binding, closes
before measurement, and returns document/revision identifiers, relative delivery
paths, file lengths and independent SHA-256 receipts. It does not return cookies
or secrets. The measurement process reopens SQLite through the reviewed fixture;
the HTTP client is a separate child through `runWorker`, with no cookie needed
for these deliberately published synthetic records. Authentication/security
coverage remains Task 3/4 evidence, not inferred from the benchmark.

- [ ] First define and test a pure `summarizeMeasurements({ samples, responses })`
  result validator. Samples contain finite nonnegative `rss`, `heapUsed`,
  `external`, and `arrayBuffers`; responses contain finite nonnegative `elapsedMs`,
  positive `bytes`, integer `status`, and lowercase SHA-256 `sha256`/`expectedSha256`.
  Reject empty inputs, malformed/nonfinite values, non-200 responses, differing
  hashes, and unsafe sizes before emitting a success summary. Return sample count,
  baseline/peak/final memory, response count/bytes and min/median/max full-response
  latency. Do not invent percentiles from a tiny sample. Example literal test:

```js
assert.throws(() => summarizeMeasurements({ samples: [], responses: [] }))
const sample = { rss: 100, heapUsed: 20, external: 30, arrayBuffers: 10 }
const response = { elapsedMs: 5, bytes: 7, status: 200,
  sha256: 'a'.repeat(64), expectedSha256: 'b'.repeat(64) }
assert.throws(() => summarizeMeasurements({ samples: [sample], responses: [response] }))
```

- [ ] Run `node --test tests/media/resource-measurements.test.mjs`; record RED
  from an initially insufficient implementation, then the minimum validated
  implementation and GREEN. Tests must also use fixed literal expected summaries,
  not rebuild the production calculation in assertions.
- [ ] Seed two real image sets in a separate process: an ordinary 2400×1350 JPEG
  and a high-entropy 6000×3200 PNG intended to approach the aggregate revision
  limit. Generate synthetic bytes with Node/Sharp, no network or real assets.
  Record actual original/derivative sizes and assert the near-limit set lies
  between 90% and 100% of the existing 64 MiB aggregate cap. If this recipe does
  not meet that range, report the measured discrepancy before a documented bounded
  fixture adjustment; do not change the storage cap. Large seeding uses real
  authenticated Local API access, not a higher HTTP fixture body limit.
- [ ] Close the seed worker before starting a fresh measurement instance so its
  image-generation buffers cannot be counted as HTTP server memory. For each
  ordinary original, near-limit original and near-limit smallest derivative,
  perform one explicitly labelled warm-up, eight serial requests, then eight
  requests with a maximum of four in flight. Stream/hash every client response
  to EOF with an explicit 15-second abort deadline and exact loopback URL check.
  Verify byte count, status and hash; no discarded or silently retried failures.
- [ ] Sample server-process memory every 25 ms plus the start/end of each group.
  Keep client RSS out of the server figures. Record that OS file cache and fixture
  response buffering are not controlled and that sampling may miss short peaks.
  Record Node/OS/architecture, total/available memory, SQLite, commit, dataset,
  request counts and elapsed times. Do not label these data production capacity,
  browser/Core Web Vitals or a comparison against the public checkpoint.
- [ ] Use a predeclared 2 GiB absolute server RSS diagnostic stop budget and
  require at least 4 GiB reported available memory before starting. These protect
  this local experiment, not a selected hosting tier or customer SLA. Stop
  scheduling more groups if the budget is observed exceeded, preserve the failed
  result, and close owned clients/server before cleanup. Never increase the budget
  after seeing results just to call the gate green. Client deadlines and existing
  process timeout remain effective. No parallel build/heavy test during sampling.
- [ ] Run the focused node tests, then `node scripts/test-media-resources.mjs` once
  on final code. Record every command/exit and all scenarios. If a scenario fails,
  identify whether the cause belongs to the harness, bound input or actual delivery
  before proposing a runtime correction. Record source/backup/library unchanged;
  remove only known synthetic files and empty directories, nonrecursively, after
  the client's actual close and fixture shutdown. Run lint and types for the delta;
  do not repeat unrelated full suites for measurement-only code.
- [ ] Write the operational rollout document: private root/OS permissions separate
  from public mounts, database plus all revision directories as one backup unit,
  orphan inventory without deletion, byte growth accounting, and retention that
  checks current documents, stored versions and frozen snapshots. Specify migration
  first on a disposable clone, exact old/new mappings, no reconstruction of already
  lost historical bytes, validation before cutover, and rollback of matching app,
  DB and media together. No real migration or provider selection is authorized.
- [ ] Report measured facts separately from prerequisites still open: persistent
  hosting, off-site backup, cost/quotas, migrations, full isolation provenance,
  source activation and public content bridge. PDFs/fonts/CV remain subsequent
  work. A passing local benchmark is not a finished CMS or deployment approval.
  Independent review and explicit-file commit close this task's measured scope.

Task 1 can land independently as a tested internal capability. Tasks 2 through 5 are
required before claiming the original media-loss defect fixed in the CMS.

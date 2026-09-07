# Immutable media revision core — local verification

Status: implemented and independently reviewed. **Not activated in the owner
application.** This is one storage building block, not a completed CMS media
integration, production backup or commercial-readiness claim.

## Problem and result

The synthetic legacy integration proves that replacing an image removes its old
original and derivatives; restoring Payload's document version leaves those files
missing. The characterization is committed in `66c61b8`. Its passing assertion
documents that defect; it does not claim the defect is fixed.

The new internal store writes each upload as a separate immutable revision. A
schema-1 manifest records filenames, sizes and SHA-256 hashes, and is written last.
The reader verifies the complete set before returning bytes. Replacements using
the same filename cannot overwrite prior revisions. No production deletion or
automatic garbage collection is provided.

Limits: 1–16 nonempty Buffer files; at most 64 MiB total. Explicit private,
provisioned local root only. Unsafe paths, linked/special files, duplicate names,
invalid Unicode and incomplete/corrupt revisions are rejected. Caller buffers are
copied before the first asynchronous operation. Files are exclusively created and
flushed; this is not filesystem/database atomicity or universally guaranteed
power-loss durability. Hashes detect corruption, not a hostile administrator
rewriting both content and manifest.

## Commits and review

- `8b044a7`: revision store and real-filesystem tests, two source files only.
- `0c19fee`: reject malformed UTF-16 names after independent review reproduced
  write-success/read-failure from filesystem encoding.
- `5a9619c`: close the remaining trailing-high-surrogate boundary; regressions
  cover writes before allocation and untrusted manifest validation.

Independent full task review and two scoped correction reviews are complete; the
last review reports all findings addressed and no new Critical/Important breakage.
Payload binding and HTTP behavior are explicitly outside that core verdict.

## Evidence and limits of the test results

- TDD: initial missing implementation, input validation and corrupt-read cases
  failed before their corresponding implementation. Each Unicode defect was
  reproduced before its fix. Tests use owned temporary directories, not user media.
- Initial complete owner unit run: **751/751, 143 files, exit 0, 69.26 s** on the
  initial core. This predates the five additional Unicode tests, so it is not a
  full-suite run of the final correction.
- Final focused core: **39/39, exit 0** on `5a9619c`, repeated independently by
  the controller. Focused ESLint passed; owner typecheck passed after the first
  Unicode correction. The final correction adds a numeric bounds check and tests.
- Public dependency boundary: **21 entries passed**; public guard suite:
  **13/13 passed**. No public source, public package/lockfile or Next configuration
  changes versus `f14e052`. This is not a fresh visual audit or Core Web Vitals run.
- The exact 64 MiB successful-write boundary was not part of the initial unit
  suite; oversized rejection and the maximum file count are covered. The
  controller additionally ran an isolated boundary smoke check against the final
  core: four 16 MiB buffers, 67,108,864 bytes written/read and compared exactly,
  exit 0. Known synthetic files and empty fixture directories were then removed
  individually. This is a capacity-boundary check, not a load/performance benchmark.

## Remaining gates

1. Opt-in Payload factory and positive real-file replacement/restoration tests.
2. Exact revision references in frozen previews; no silent resolution to new bytes.
3. Owner/publication authorization for real HTTP originals and derivatives,
   including draft-over-published, history, trash, native crop and duplication.
4. Both SQLite/PostgreSQL editorial gates, complete retained-media backup/restore,
   operational resource limits, migration and rollback evidence.
5. Explicit activation only after those gates. No existing library migration,
   deployment, provider purchase or CV publication occurred in this work.

Checkpoint `checkpoint/pre-editor-2026-09-04` still targets
`0f0adf686b2752e23c25d224f8c60815b10fd451`. A Git checkpoint alone does not back up
the live database or uploaded assets. Coordination and next owner: Codex continues
the isolated Payload binding; Claude's public/email/domain work remains separate.

# Payload media binding: evidence and unresolved integration decisions

Read-only follow-up to the immutable-store design; no plugin installed or cloud
connected. Installed code is Payload 3.88.0. Core filesystem implementation is
Task 1, not the binding or a remedy for existing media on its own.

## Reproduction evidence (local synthetic fixture)

The positive historical-byte assertion on `f14e052` failed with ENOENT after
replacement: the original and generated derivatives no longer existed. The
explicit legacy characterization subsequently passed (1 passed, 22 skipped,
exit 0, 14.02 seconds): it also restores the stored document version and verifies
that its former binary files are still missing. Command:
`node scripts/test-integration.mjs -t 'characterizes missing historical bytes'`.
The test asserts a known legacy limitation, not a passing retention guarantee.
No existing library was used. Task 2 requires a separate positive round trip.

## Existing extension points

- `uploads/generateFileData.js` produces original bytes in `req.file` and image
  derivatives in `req.payloadUploadSizes`. It runs before collection
  `beforeChange`, including native crop transformations. A binding can gather the
  entire revision at that point, not publish individual derivatives independently.
- `upload.disableLocalStorage` prevents the native writer, but does **not** stop
  `deleteAssociatedFiles`. A revision store must be physically separate from the
  legacy flat `staticDir`; toggling this flag over the real library is unsafe.
- `uploads/checkFileAccess.js` evaluates collection read access before custom
  handlers. It queries both current rows and latest drafts when constraints
  exist. A supplied `prefix` adds an exact prefix condition. If owner access
  returns boolean true without a prefix, no document lookup is guaranteed.
  The binding must therefore require a valid revision selector and independently
  verify its relationship to the requested document/filename, including history.
- `collections/operations/restoreVersion.js` invokes beforeOperation, resolves
  the stored version, calls beforeValidate/beforeChange, persists the result and
  invokes afterChange. It sets `req.context.isRestoringVersion`; context may be
  reused by Local API callers. Do not treat arbitrary client data/context flags
  as authority to select another binary revision.

## Official plugin comparison

The supported plugin is a useful adapter boundary, but is not itself retention:
its 3.88 afterChange uses one `handleUpload` per file in Promise.all, then invokes
`handleDelete` for former names. The core's all-files manifest must be assembled
once, not independently committed by each callback. Same-name reuploads and
native crops can overwrite a filename unless the revision namespace changes.

Sources: [official documentation](https://payloadcms.com/docs/upload/storage-adapters),
[plugin](https://github.com/payloadcms/payload/blob/v3.88.0/packages/plugin-cloud-storage/src/plugin.ts),
[upload hook](https://github.com/payloadcms/payload/blob/v3.88.0/packages/plugin-cloud-storage/src/hooks/afterChange.ts),
[incoming files](https://github.com/payloadcms/payload/blob/v3.88.0/packages/plugin-cloud-storage/src/utilities/getIncomingFiles.ts).

## Task 2 acceptance refinements

1. Bind all original/derivative buffers in a single revision write before returning
   metadata. If a subsequent DB operation fails, retain that unreferenced revision
   for reconciliation; do not delete on an uncertain transaction outcome.
2. Metadata-only edits preserve their revision. Arbitrary prefix/revision and
   filename changes must not redirect a record to another private file. Server
   restoration must load its stored version, not trust caller-provided values.
3. Native image editing and duplication can fetch existing files before hooks;
   prove that flow with the authenticated HTTP route, not only upload Buffers.
4. Draft-over-published retains two independently readable revisions. Anonymous
   users may receive only the published revision. The owner may review history
   without making it public. Use private/no-store responses for owner-only files.
5. Trash is metadata; permanent deletion removes record/version access but cannot
   erase files still required by frozen publication manifests. Retention and
   eventual garbage collection must account for those additional references.
6. Guard legacy versus versioned storage explicitly. Existing Figma compensation
   intentionally returns unsupported-storage when native local writing is disabled;
  keep uncertain revisions and report reconciliation, never reuse flat-path cleanup.
7. `src/preview/service.ts` currently captures media id, filename, dimensions and
   descriptive fields, but no immutable binary revision. A frozen preview must
   capture the exact storage revision too; otherwise a same-name replacement can
   silently change its media without changing the manifest. Add a positive test
   for that case, preserving old manifests as legacy/unverified rather than
   silently resolving them to the newest bytes. Carry the captured revision into
   publication and backup reference checks.

These are implementation constraints, not proof the HTTP/download/migration gates
pass. No root or selector is inferred from user-provided URLs. The original CV,
existing media and public site remain untouched.

## HTTP fixture boundary and native image editing

Installed Payload exports `handleEndpoints` publicly. It accepts Fetch
Request/Response and a `payloadInstanceCacheKey`, allowing a disposable fixture to
exercise real REST authentication/routing without starting the developer's Next
app. Request/Response tests alone are REST-handler coverage, not a socket or
browser test. Task 3 needs a bounded loopback HTTP fixture for native refetches.

`generateFileData` refetches originals for native crop and duplication when local
storage is disabled. `getExternalFile` sends Payload cookies for relative URLs,
then uses safeFetch by default (which may reject loopback). Do not set
`skipSafeFetch: true` globally or accept an arbitrary Origin as trusted storage.
Test any explicit fixture-only transport allowance separately from production.

The native file route checks `prefix` against current/latest-draft rows before
custom handlers; that is not a historical-version authorization mechanism. Any
revision selector must be independently bound to the requested media record,
filename and publication state. Every custom handler outcome must return a
Response; falling through would invoke the legacy static-file handler.

## Resource budget before activation

The core reader verifies and returns the complete revision, not just the requested
derivative. Its per-revision byte cap is not an aggregate concurrency cap. Task 3
must measure realistic image sets and simultaneous requests; a production handler
must not assume the utility alone is a scalable CDN or a DoS/resource budget.
Any optimized single-file delivery must preserve the manifest/integrity and
authorization guarantees. No public delivery is enabled by the current core.

## Frozen publication dependency closure (still open)

`publication/bundle.ts` currently stores a `previewHash` plus the draft capsule;
the bundle entry does not embed the preview's media reference list. The current
preflight checks content shape/SEO, not physical asset availability. Capturing
`storageRevision` in previews is necessary but not sufficient to certify an
exported site as self-contained. Before a public publication bridge is enabled,
resolve exact captured dependencies into its versioned export contract and verify
their bytes/access policy. Never substitute current media merely because an old
export carries only an asset ID. This is not authorization to alter publication
schemas during the isolated Task 2 binding.

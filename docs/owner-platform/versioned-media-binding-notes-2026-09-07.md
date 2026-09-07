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

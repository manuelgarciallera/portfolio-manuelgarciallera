# Durable files and CV: operational gap, not a completed CMS feature

Audit base `239f9b7`. Scope: source/fixtures/public CV component; no external accounts or files moved.

## Current evidence

1. Active payload.config.ts imports Media directly. Media.upload.staticDir resolves to owner-platform/media and mimeTypes is image/* only. It does not invoke createTransportRevisionStorageCollection or createObjectRevisionStore.
2. ObjectRevisionStore and the versioned binding exist and have isolated recovery evidence, but their existence does not make active uploads durable. ObjectRevisionStore accepts a trusted S3 client/bucket/prefix; it neither provisions the bucket nor selects production credentials. .env.example has no object-storage activation settings.
3. Versioned binary endpoints already send nosniff and restrictive sandbox CSP. Payload's native SVG endpoint has script-src none. No new SVG vulnerability is asserted from MIME acceptance alone.
4. Public CvDownloads.tsx still uses two static PDF URLs and a hardcoded update date. Its two existing unit tests pass on this audit. Both named PDFs exist locally. This is not a live deployment/download check and does not establish a CMS editing path.
5. The existing cutover trust protocol explicitly defers PDF activation until durable storage is operational. Do not bypass this by merely adding application/pdf to Media.

## Next deliverables in order

### A. Isolated full-app storage activation

Integrate the existing versioned transport into an explicitly selected, fresh isolated CMS runtime. Keep legacy/default runtime untouched. Exercise the actual Next admin upload, image preview, replacement, history and restart; avoid another standalone validator without a runtime consumer. No migration of real existing media is part of this step.

### B. Staging storage and restoration

Use the agreed Vercel/Neon/private R2 direction only with applicable account/cost authority and private credentials. Validate provider permissions and compatibility rather than assuming the synthetic S3 service proves R2 behavior. Bind deployment, database, namespace, backups and recovery receipt. Apply the existing cutover trust protocol before any real migration; metadata changes alone do not migrate files.

### C. Editable CV capability

Use a private document model distinct from image-only assumptions: language, label, file revision, update date and publication state. Enforce PDF type/size, safe filename and attachment delivery, preserve previous revisions, and prevent scripts or arbitrary URLs from being introduced through metadata. Avoid copying personal PDF contents into tests or logs; fixtures remain synthetic.

### D. Reviewed public delivery

Publish a validated immutable file and its metadata through the controlled public-content bridge. Preserve the current native language chooser and download behavior, no embedded PDF viewer or added public JS. Test both languages, replace/rollback, deleted/unpublished files, stale metadata, mobile/keyboard interaction and download headers. Date/size must derive from approved content, not editor typing or stale constants.

## Coordination / boundaries

Claude's older hosting agreement confirms architectural direction, not current provisioning, a billable purchase or completed migration. Codex remains implementation owner. No need to ask Manuel to choose the stack again; consult only when specific missing account access, spend or publication authority is needed. No push, deployment, public edit, PDF publication or paid action performed in this audit.

This closes the investigation of why CV editing is not available, not implementation of it. Next Codex: deliverable A. Authentication abuse/staging gates remain open alongside full editorial acceptance.

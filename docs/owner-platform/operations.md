# Owner platform operations runbook

## Current status

The owner platform is an isolated, local editorial slice. It is not deployed,
does not change the public renderer, and has no production publish path. Its
current purpose is to validate authenticated editing, drafts, versions,
ordering, modular pages, and media handling without putting Payload or its UI in
the visitor bundle.

Do not expose the owner app to the Internet until every item in **Production
prerequisites** is satisfied. A successful build is not production approval.

## Local setup

Requirements: the Node version accepted by the checked-in lockfiles and npm.
No global Payload installation is required.

From the repository root:

```powershell
npm run owner:install
Copy-Item -LiteralPath owner-platform/.env.example -Destination owner-platform/.env
npm --prefix owner-platform run dev -- --hostname 127.0.0.1 --port 3001
```

Open `http://localhost:3001/admin`. Local development uses the ignored
`owner-platform/.data/owner-platform.db` SQLite database unless `DATABASE_URL`
is explicitly set. The development command binds to localhost and uses port
3001 by default so it does not replace the public site.

Generated databases, uploads, `.env` files, build directories, and dependencies
are ignored. Never commit them.

## Secure first-owner bootstrap

1. Generate two independent random values of at least 32 characters: one for
   `PAYLOAD_SECRET`, another short-lived value for `OWNER_BOOTSTRAP_SECRET`.
2. Put them in `owner-platform/.env`; never put secrets in a URL, screenshot,
   issue, commit, client-side variable, prompt, or log.
3. Start the local owner app.
4. Submit the first registration directly to the gated endpoint. Example in
   PowerShell, with values supplied in the current process rather than history:

```powershell
$headers = @{ 'x-owner-bootstrap-secret' = $env:OWNER_BOOTSTRAP_SECRET }
$body = @{ email = $env:OWNER_EMAIL; password = $env:OWNER_INITIAL_PASSWORD } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/api/users/first-register' -Headers $headers -ContentType 'application/json' -Body $body
```

5. Confirm login and owner-only access, then remove
   `OWNER_BOOTSTRAP_SECRET` from `.env` and restart the app.
6. Store recovery material in a password manager. Do not create shared owner
   accounts.

The route denies missing or mismatched bootstrap secrets and Payload permits
first registration only while the Users collection is empty. The normal admin
form cannot bypass the server-side header gate.

## Editorial behavior

- Projects, articles, pages, and media are versioned and use drafts/trash.
- Anonymous reads are constrained to published content; draft and version
  access plus every mutation are owner-only.
- Project/page ordering uses explicit order fields. Reordering is content data,
  not a public CSS/layout mutation.
- Page composition is limited to the explicit block catalog. Arbitrary scripts,
  HTML, CSS, or owner-side components are not accepted as content.
- GraphQL is disabled until a reviewed consumer needs it.

## PostgreSQL migration boundary

SQLite is for local evaluation only. Production runtime deliberately refuses to
start without `DATABASE_URL`; when it is present, PostgreSQL is selected.

Before any deployment:

1. Provision a private PostgreSQL database with TLS, least-privilege
   credentials, automated backups, and a tested restore target.
2. Set `DATABASE_URL` only in the server environment. Never expose it to the
   browser or prefix it with `NEXT_PUBLIC_`.
3. Create and review Payload migration files from the finalized schema using
   Payload's migration CLI. Commit migrations; never rely on development-mode
   schema pushing in production.
4. Test the complete migration sequence on a disposable clone of production
   data, then run owner tests, typecheck, build, access checks, and a restore
   drill.
5. Run migrations as a separate, one-at-a-time release step before starting new
   application instances. Take a backup immediately before migration.
6. Treat rollback as restore plus application rollback unless a reviewed down
   migration is proven safe. Never improvise destructive schema rollback on the
   live database.

Migration generation/execution is intentionally outside this slice because no
production database or release process has been authorized.

## Backups and restore drills

### Local SQLite

Stop the owner app before copying the SQLite file. Copy
`owner-platform/.data/owner-platform.db` and the matching local media directory
to a timestamped, access-controlled location. A valid restore drill uses a new
working directory, restores both items together, starts the same commit, and
verifies login plus representative drafts, versions, and media.

### PostgreSQL and object storage

Use the provider's point-in-time recovery plus an encrypted logical backup such
as `pg_dump` in custom format. Restore into a new database with `pg_restore`;
do not test by overwriting the source. Record the application commit, migration
revision, database backup identifier, media bucket/version identifier, and
restore result as one release record.

Database rows and media objects form one recoverable unit. Enable object
versioning and retention on the future media store and test restoration of both
metadata and original files. A backup that has not passed a restore drill is
not considered proven.

## Secret rotation

- Rotate `PAYLOAD_SECRET` through the hosting secret store, deploy/restart all
  owner instances together, and expect existing sessions/tokens to be invalid.
- Rotate database credentials by creating a new least-privilege credential,
  updating the server secret, verifying connectivity, then revoking the old
  credential.
- Rotate `OWNER_BOOTSTRAP_SECRET` by removing it. It must not remain configured
  after the first owner exists.
- If a secret may have leaked, rotate first, invalidate sessions, inspect access
  logs, and document the incident. Never print secret values during diagnosis.

## Uploads and storage

Local uploads use ignored disk storage. MIME/type and size handling are bounded,
and generated image sizes preserve the original asset. Destructive replacement
is not automated.

Production object storage is **not configured**. Before deployment, add a
reviewed Payload storage adapter for an S3-compatible private bucket (for
example R2/S3), server-only credentials, object versioning, lifecycle rules,
backup/restore coverage, explicit CORS, and delivery URLs. Validate upload,
focal point, derivatives, deletion/trash, restore, and authorization in a
preview environment. Do not use an instance's ephemeral filesystem.

## Production prerequisites

- A unique `PAYLOAD_SECRET` of at least 32 characters in server-only secrets.
- A TLS PostgreSQL `DATABASE_URL`; SQLite is forbidden at production runtime.
- Reviewed, committed migrations and a successful disposable restore test.
- Durable, versioned object storage and restore coverage for media.
- HTTPS, restricted owner-domain/network access where practical, rate limiting,
  secure headers, monitoring, audit retention, and alerting.
- Transactional email and a reviewed recovery process before relying on account
  recovery.
- A staging deployment with anonymous/public access tests, owner authorization
  tests, upload limits, accessibility, and operational smoke tests.
- Explicit approval for the content-read/publish bridge into the public site.
- Root public boundary and bundle comparison passing against the checkpoint.
- A clean owner production-dependency audit. The current verification reports
  11 upstream/transitive advisories (1 low, 7 moderate, 3 high, 0 critical), so
  deployment remains blocked pending compatible fixes and a new full review.

## Check, evidence, and rollback

Run from the repository root:

```powershell
npm run check:all
npm run test:owner-isolation
npm run check:owner:clean
npm run build:public-proof
$env:PUBLIC_BUILD_DIR = (Resolve-Path 'owner-platform/.data/verification-artifacts/release-proof').Path
node ./scripts/prove-owner-isolation.mjs --write=docs/owner-platform/isolation-evidence-2026-09-04.json
```

`check:owner-isolation` combines three fail-closed checks: no owner runtime
dependency in the root manifest, no forbidden/private import reachable from a
public entry, and no public route outside the fixed 1%/2048-byte bundle budget.
The build directory is accepted only as a single dedicated child of
`owner-platform/.data/verification-artifacts`; arbitrary, linked, missing, or
stale build paths fail closed. The generated evidence binds the checkpoint and
current Git HEAD to deterministic hashes of public inputs, the exact root
runtime manifest, the complete root lockfile, and route bundle outputs. Use
`--verify=docs/owner-platform/isolation-evidence-2026-09-04.json` to compare a
committed record byte-for-byte against a newly verified build.

The pre-editor recovery point is Git commit
`0f0adf686b2752e23c25d224f8c60815b10fd451`, tagged
`checkpoint/pre-editor-2026-09-04`. Restoring it is a deliberate Git operation,
not an admin-panel feature in this slice. Do not delete current work or rewrite
history. Create a new branch/worktree from the checkpoint, verify it, and route
traffic only through an explicitly approved deployment rollback.

The latest committed verification record is
[`isolation-evidence-2026-09-04.json`](./isolation-evidence-2026-09-04.json).
It is evidence for this commit, not a substitute for rerunning checks after a
change.

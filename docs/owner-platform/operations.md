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

## What is visible in the owner app

After signing in, Payload's admin navigation exposes the implemented editorial
surface without changing the public portfolio:

- **Brand Profiles** is the current Brand Studio. It stores semantic colors,
  usage weights, typography, approved imagery/icons, voice notes, and bounded
  motion settings. Publication validation requires unique roles, usage weights
  totalling 100, supported contrast, and safe motion values.
- **Pages** assigns one brand profile and permits only controlled page-level
  overrides. Background and text roles continue to inherit from the profile.
- **Media Placements** stores reusable, versioned crop recipes: original asset,
  focal point, zoom, fit, frame ratio, and bounded mobile/tablet overrides. It
  never rewrites or resizes the uploaded original. Projects and page media
  blocks may adopt a recipe without invalidating existing entries.
- **Projects**, **Articles**, **Pages**, and **Media** remain the editorial
  collections described below. **Preview Snapshots** is a read-only owner list
  of immutable manifests created through the dedicated endpoint.
- **Technologies** is the reusable, manually ordered stack catalog. Each entry
  stores a required accessible name and Media icon plus optional `#RRGGBB`
  corporate color and HTTPS official URL. Projects may select an ordered
  `technologyStack`; the earlier inline `technologies` field remains available
  for migration compatibility.
- **Projects** includes an optional reorderable `caseStudyLayout` composed from
  registered section, media, gallery, quote, metric, and product-feature
  blocks. Existing required rich text remains intact for migration. Media and
  gallery items require alternative text and may use reversible placements;
  no arbitrary HTML, CSS, JavaScript, embed, or code block is available.
- **Projects**, **Articles**, and **Pages** share an optional SEO group with a
  70-character title, 180-character description, credential-free HTTPS
  canonical URL without fragments, Media social image, and `noIndex` switch.
  Page recovery capsules include this data, so restore and release evidence do
  not silently omit SEO. It is not consumed by the public renderer yet.
- **Articles** includes an optional reorderable `articleLayout` for rich text,
  accessible media, galleries, quotes, bounded callouts, and related projects.
  The existing required `content` field remains unchanged for migration, and
  the registered block catalog excludes arbitrary code and remote embeds.
- **Analytics Snapshots** stores immutable provider-neutral aggregate exports:
  period, total views/visitors, optional engagement, optional LCP/INP/CLS, and
  up to 250 route summaries. It contains no visitor identifier and adds no
  tracker, cookie, SDK, or public dependency.
- **Releases** is the append-only version ledger. Each record binds a complete
  Git commit to a preview snapshot, a concise change summary, and bounded
  performance, usability, and accessibility measurements for desktop or
  mobile. It is owner-only and cannot be updated or deleted.
- **Assistant Settings** contains five independently versioned proposal
  switches. All default to disabled. Enabling one permits only schema-validated
  suggestions; it never authorizes applying a patch, publishing content,
  deploying code, or writing to production.
- **Audit Events** is an immutable owner-only ledger. Direct client creation,
  updates, and deletion are denied; trusted server workflows append normalized
  actor, action, subject, outcome, and bounded credential-free metadata. Preview
  snapshot creation is the first workflow connected to this ledger.
- **Assistance Proposals** stores a provider-neutral, schema-validated patch
  bound to a verified preview snapshot and target page. Creation derives the
  active capability switches server-side. A proposal can move once from
  pending to accepted or rejected and both creation and decision are audited;
  acceptance does not apply, publish, deploy, or mutate the public portfolio.
- **Restore Plans** stores a two-confirmation, conflict-aware restoration plan.
  It binds an immutable release target to a verified current baseline, and a
  second fresh snapshot must still match that baseline. Plans are owner-readable
  and immutable after execution. The execution path is draft-only, transactional,
  conflict-aware, and cannot publish or deploy.
- **Draft Snapshots** contains a canonical, hashed recovery capsule for the
  page's title, slug, brand assignment/overrides, and block layout. It never
  stores published state or arbitrary document fields, and is immutable.
- **Publication Bundles** stores an ordered, immutable and hashed package made
  only from releases whose visual and restorable snapshots match exactly. It is
  review evidence, not a public deployment or content bridge.

This phase is a functional data/control foundation, not a bespoke drag-and-drop
canvas. The public renderer still reads its checked-in content, so edits in the
owner app are intentionally invisible to visitors until a separately reviewed
content bridge exists.

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
- A release record is evidence and a recovery coordinate, not an executable
  rollback control. Restoration remains a deliberate, separately verified Git
  and deployment operation.

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

## Read-only Figma discovery

The owner endpoint accepts only Figma `design` or `file` URLs and uses a
server-side **personal access token** through `X-Figma-Token`. Configure
`FIGMA_PERSONAL_ACCESS_TOKEN` and set `FIGMA_PLAN` to `starter`,
`professional`, `organization`, or `enterprise`. This adapter is deliberately
not described as OAuth: replacing PAT authentication with OAuth requires a
separate reviewed credential lifecycle.

Discovery requests use `file_content:read` operations only. A selected
`node-id` uses the file-nodes endpoint; otherwise the bounded file endpoint is
used. Candidate previews are requested once in a capped batch. There are no
write methods, background refreshes, retries, or image imports. A Figma `429`
is returned with its `Retry-After` value so the owner can decide when to retry,
which is important for low-quota seats and plans.

Create a scoped personal access token in Figma with file-content read access,
store it only in `owner-platform/.env`, and restart the local owner app:

```dotenv
FIGMA_PERSONAL_ACCESS_TOKEN=replace-with-a-server-only-token
FIGMA_PLAN=professional
```

Do not prefix either variable with `NEXT_PUBLIC_`. The discovery endpoint is
`POST /api/owner/figma/discover`; it requires an authenticated owner session and
a JSON body containing `source`, for example a Figma design/file URL. Without a
token it fails closed. It performs no automatic retry: if Figma responds `429`,
the endpoint preserves `Retry-After` and the operator should wait that interval
before making another explicit request.

Preview render URLs are metadata, not durable media: Figma documents that they
expire after 30 days. They must be refreshed deliberately or imported through
a future reviewed media workflow. Tokens, upstream bodies, and exception
details never enter browser output, generated Payload types, or application
logs.

## Immutable local preview snapshots

The endpoint `POST /api/owner/preview-snapshots` creates a canonical snapshot
from the current draft of a page. It accepts only an authenticated owner session
and this bounded body:

```json
{ "pageId": 7, "version": "current-draft" }
```

The server resolves the page's brand inheritance, projects only the registered
block types and safe relationships, creates a deterministic SHA-256 manifest,
and appends it to **Preview Snapshots**. Clients cannot submit their own
manifest, hash, source revision, or executable content. Snapshots cannot be
updated or deleted through Payload.

This is currently the local preview artifact and audit boundary; it is not yet
a public preview renderer. Inspect the returned snapshot or its owner-only
collection record while the local app runs. Regenerate a snapshot after changing
a page—an existing snapshot never mutates.

## Reviewed assistance proposal API

The private proposal workflow has two authenticated owner-only endpoints. To
record a provider-neutral patch against a verified snapshot:

```http
POST /api/owner/assist/proposals
Content-Type: application/json

{
  "sourceSnapshot": 12,
  "provider": "codex",
  "patch": {
    "schemaVersion": 1,
    "capability": "suggestCopy",
    "operations": [
      { "op": "replace", "path": "/page/title", "value": "Nuevo título" }
    ]
  }
}
```

The server re-verifies the snapshot hash, resolves the current draft and active
Assistant Settings itself, validates the patch allowlist, stores a pending
proposal, and appends an audit event. The body is limited to 64 KiB and unknown
fields, credential-shaped fields, or disabled capabilities fail closed.

After reviewing the stored proposal, record exactly one decision:

```http
PATCH /api/owner/assist/proposals/31
Content-Type: application/json

{ "decision": "accepted", "note": "Preview revisado" }
```

`decision` accepts only `accepted` or `rejected`; `note` is optional and limited
to 1,000 characters. A decision is immutable and audited. Acceptance is review
state only: it does not apply the patch, mutate the page, publish content, or
deploy either application.

## Verified release registration

Register a version only after creating its immutable preview snapshot and
collecting its bounded quality evidence:

```http
POST /api/owner/releases
Content-Type: application/json

{
  "name": "Checkpoint API owner",
  "changeSummary": "Endpoints owner revisados.",
  "draftSnapshot": 13,
  "gitCommit": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "previewSnapshot": 12,
  "quality": [
    {
      "viewport": "desktop",
      "performance": 96,
      "usability": 97,
      "accessibility": 98,
      "source": "lighthouse",
      "measuredAt": "2026-09-04T22:00:00.000Z"
    }
  ]
}
```

The authenticated endpoint is limited to 16 KiB, accepts only the documented
evidence fields, re-computes the snapshot manifest hash, creates the immutable
release record, and audits the registration. It records a restorable reference;
it does not execute a restore by itself. Restoration is available only through
the separate plan, confirmation, conflict, execution, and rollback controls.

Before registering a restorable release, create both snapshots from the same
unchanged page draft:

```http
POST /api/owner/draft-snapshots
Content-Type: application/json

{ "pageId": 7, "version": "current-draft" }
```

The draft endpoint uses the same authenticated, 4 KiB request boundary as the
visual preview endpoint. Its capsule contains only the registered editorial
state and has its own deterministic SHA-256 hash. Add the returned relationship
as `draftSnapshot` when registering the release; the server rejects visual and
restorable snapshots whose page or source revision differs.

## Non-destructive restore planning

Create a fresh preview snapshot of the page, then prepare a restore plan:

```http
POST /api/owner/restore-plans
Content-Type: application/json

{
  "releaseId": 44,
  "baselineSnapshot": 12,
  "confirmation": "PREPARAR RESTAURACIÓN"
}
```

The server verifies the release's target snapshot and the baseline snapshot,
including both manifest hashes and source page identity. It stores a `ready`
plan but changes no page. Before the second step, generate another fresh preview
snapshot and submit:

```http
PATCH /api/owner/restore-plans/50/confirm
Content-Type: application/json

{
  "currentSnapshot": 13,
  "confirmation": "CONFIRMAR RESTAURACIÓN"
}
```

If the new snapshot hash equals the recorded baseline, the plan becomes
`confirmed`. If anything changed, it becomes `conflict` and cannot be reused.
Both outcomes are audited. Neither endpoint contains an execute, apply, publish,
deploy, or page-mutation operation. Execution remains a separate boundary.

### Transactional draft execution

Only a `confirmed` plan can be executed, using a third exact phrase:

```http
POST /api/owner/restore-plans/50/execute
Content-Type: application/json

{ "confirmation": "EJECUTAR RESTAURACIÓN" }
```

The server opens a database transaction and reloads the current draft inside
it. The page is updated through a conditional `id + updatedAt` write, so an edit
that races the restore updates zero documents and rolls the transaction back.
The recovery capsule never carries `_status`; Payload receives `draft: true`,
therefore this endpoint cannot publish.

Before committing, the service creates a new visual snapshot and a new draft
snapshot of the restored result, marks the plan `executed`, and appends an audit
event. Failure in the page update, either snapshot, plan update, or audit event
rolls back every write. The endpoint does not deploy the public application;
the existing reviewed publication bridge remains a separate future decision.

## Immutable publication bundles

Prepare an inspectable publication candidate from one release per page:

```http
POST /api/owner/publication-bundles
Content-Type: application/json

{
  "name": "Publicación septiembre",
  "releaseIds": [44, 45, 46],
  "confirmation": "PREPARAR PUBLICACIÓN"
}
```

The order of `releaseIds` becomes the explicit page order in the bundle. The
server reloads every release and independently verifies both associated hashes,
page identity, and source revision. Duplicate releases, duplicate pages,
mismatched snapshots, more than 100 pages, and packages larger than 5 MiB fail
closed. The request body itself is limited to 16 KiB.

The resulting **Publication Bundle** contains canonical page capsules plus their
visual and editorial hashes and is immutable and audited. It has no publish,
apply, filesystem-write, or deployment action; merely creating or reading this
record has no effect on the portfolio.

### Immutable owner review

After inspecting the package, record one final owner decision:

```http
POST /api/owner/publication-bundles/80/review
Content-Type: application/json

{
  "decision": "approved",
  "confirmation": "APROBAR PAQUETE",
  "note": "Contenido, orden y evidencias revisados."
}
```

Use `RECHAZAR PAQUETE` with `decision: "rejected"` to reject it. The service
authenticates before parsing its body, rejects extra fields, limits the request
to 8 KiB, reloads the immutable bundle, and verifies both its canonical hash
and stored hash. A unique constraint and server-side lookup allow exactly one
decision per bundle. The resulting **Publication Review** is itself canonical,
hashed, immutable, attributed to the owner, and represented in the audit ledger.

An approved review is evidence, not execution. There remains intentionally no
public bridge, publish, apply, filesystem-write, or deployment endpoint. A
future bridge must consume a specifically approved bundle through a separate,
benchmark-gated process and must not weaken this boundary.

### Isolated publication artifact

Generate a canonical handoff manifest from an approved review:

```http
POST /api/owner/publication-reviews/90/artifacts
Content-Type: application/json

{
  "confirmation": "GENERAR ARTEFACTO"
}
```

The service authenticates before parsing its body, rejects extra fields, and
limits the request to 4 KiB. It reloads and verifies the immutable review,
requires its decision to be `approved`, reloads and verifies the associated
bundle, and checks that both hashes still match. Only one **Publication
Artifact** can be generated per review.

The artifact is a compact canonical manifest joining review hash, bundle hash,
identifiers, schema version, and page count. It is immutable, owner-readable,
and audited. It deliberately does not duplicate media, write JSON to the public
repository, update public content, trigger builds, or contact a deployment
provider. It provides a stable input contract for a future separately tested
export adapter.

## Provider-neutral analytics imports

Import an aggregate export without connecting a provider account:

```http
POST /api/owner/analytics/snapshots
Content-Type: application/json

{
  "confirmation": "IMPORTAR ANALÍTICA",
  "data": {
    "source": "manual-export",
    "period": {
      "from": "2026-08-01T00:00:00.000Z",
      "to": "2026-09-01T00:00:00.000Z"
    },
    "totals": {
      "pageViews": 1300,
      "visitors": 800,
      "bounceRatePercent": 37.4,
      "averageDurationSeconds": 94.2
    },
    "vitals": {
      "lcpMilliseconds": 1850,
      "inpMilliseconds": 120,
      "cls": 0.04
    },
    "routes": [
      { "path": "/", "pageViews": 900, "visitors": 500 }
    ]
  }
}
```

The server authenticates before reading the body, limits it to 256 KiB,
rejects unknown fields, validates every range and period, prevents duplicate
routes, creates a canonical hash, and appends an audit event. Snapshots are
owner-readable and immutable. They contain aggregates only: no IP, user ID,
cookie, session, URL query, or URL fragment is accepted.

This establishes the dashboard data contract without choosing a paid provider.
A later read-only adapter for Vercel, Plausible, or another source can map into
the same schema after separate credential, privacy, rate-limit, and cost review.

The authenticated dashboard can consume `GET /api/owner/analytics/summary`.
The service reloads at most the two most recent snapshots, verifies each stored
hash, and returns current traffic, percentage change from the prior period,
engagement, the ten most-viewed routes, and LCP/INP/CLS ratings. A zero or
missing comparison denominator produces `null`, never a misleading infinity.
No raw provider response, credential, or visitor identifier is returned.

The dashboard can also consume `GET /api/owner/content/health`. This owner-only
read endpoint counts drafts and published records for Projects, Articles, and
Pages, then reports missing SEO descriptions, Pages without a brand profile,
and Projects not yet migrated to the reusable technology catalog. It requests
database counts rather than document bodies, validates that totals are
internally consistent, and performs no write or automatic correction.

The versions panel can consume `GET /api/owner/releases/summary`. It returns at
most the 20 latest owner-visible release records in reverse chronological
order, including their date, change summary, full Git commit, visual preview
snapshot, restorable draft snapshot, and normalized quality scores. Desktop
and mobile measurements remain separate, while rounded averages make releases
quickly comparable. Invalid commits, missing quality evidence, malformed
relationships, or invalid measurements fail the complete response rather than
showing a version that appears safer than its evidence. This endpoint is
read-only: it does not prepare, confirm, or execute a restore plan.

The future owner home can consume `GET /api/owner/dashboard` instead of
coordinating the three read models in the browser. The server authenticates
once and loads content health, release history, verified analytics, and recent
audit activity in parallel. A new installation with no analytics snapshot receives
`analytics.available: false`; malformed or hash-mismatched analytics still
fails closed. This distinction permits a useful first-run dashboard without
turning missing data into false zeroes or concealing integrity failures.

`GET /api/owner/audit/activity` exposes the same bounded recent-activity feed
independently. It loads no more than 20 owner-visible events without expanding
relationships. The response deliberately excludes actor data and event
metadata, returning only event ID, normalized action, outcome, subject, and
timestamp. Invalid stored events fail the response rather than presenting a
misleading audit trail; the endpoint never modifies the append-only ledger.

`GET /api/owner/workflow/summary` supplies the dashboard attention queue using
owner-scoped database counts only. It reports pending, accepted, and rejected
assistance proposals; ready, confirmed, conflicting, and executed restore
plans; and the publication chain from bundles through reviews to artifacts.
The server derives bundles awaiting review and approved reviews awaiting an
artifact, then rejects impossible totals instead of emitting misleading
negative values. Conflicts and every state awaiting an owner decision are
included in `attentionCount`. No workflow document body is returned and no
decision, restore, publication, or deployment is executed.

`GET /api/owner/integrations/status` supplies a credential-free status model
for the integrations panel and is also included in `GET /api/owner/dashboard`.
It reports whether the server has a non-empty Figma personal access token, its
normalized plan, and the connector's read-only boundary without returning the
token. Linocube remains explicitly disabled. Assistant Settings are loaded
through owner access and each switch is reported separately from operational
support: copy, palette, and motion proposals are supported, while layout and
crop remain non-operational even if their switches are enabled. Apply,
publish, deploy, and model-provider configuration are all reported as false;
the status route cannot activate any of them.

`GET /api/owner/media/health` is included in the dashboard overview and can be
consumed independently by the future media workspace. It uses owner-scoped
database counts for draft/published Media and Media Placements, then reports
missing alternative text, dimensions, MIME type, placement assets, and source
files over 5 MiB. Counts are checked against their inventory totals so corrupt
or impossible results fail closed. The endpoint does not load binary data,
generate derivatives, change crop recipes, or optimize originals; the 5 MiB
threshold is a review signal rather than an automatic transformation.

## Disabled integrations

- AI assistance is a provider-neutral validation contract only. There is no
  model SDK, API key, chat UI, autonomous mutation, or publish action in this
  phase. Capability switches default to denied and accepted patches are limited
  to the documented Brand Studio allowlist.
- Linocube is a validated manifest-consumer interface with a deliberately
  disabled implementation. It makes no network request and cannot publish.

Enabling either integration requires a separate threat model, credentials,
cost controls, audit trail, preview/approval flow, and explicit deployment
review. Do not represent these contracts as live integrations.

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
- The public package audit currently reports 1 transitive moderate advisory
  (`fflate`). It is also a release blocker until a compatible, benchmarked fix
  passes the checkpoint comparison. Do not use `npm audit fix --force`.

These counts were produced from the committed lockfiles with
`npm audit --omit=dev` during the 2026-09-04 verification. Registry advisories
can change; rerun both audits before any release rather than treating these
numbers as permanently current.

## Check, evidence, and rollback

Run from the repository root:

```powershell
npx vitest run --config vitest.unit.config.ts
npm run lint
npm run typecheck
npm run test:public-guards
npm run check:public-boundary
npm run test:owner-isolation
npm run check:owner:clean
npm run build:public-proof
$env:PUBLIC_BUILD_DIR = (Resolve-Path 'owner-platform/.data/verification-artifacts/release-proof').Path
node ./scripts/prove-owner-isolation.mjs --write=docs/owner-platform/isolation-evidence-2026-09-04.json
node ./scripts/prove-owner-studio-phase2.mjs --write=docs/owner-platform/owner-studio-phase-2-evidence.json
npm audit --omit=dev
npm --prefix owner-platform audit --omit=dev
```

Run each command and retain its exit code. `check:all` is not a substitute for
this sequence: it omits the root unit suite and currently returns non-zero at
the final audit because the documented advisory remains open. The two audit
commands are expected to remain release blockers while their totals are
non-zero; do not reinterpret that exit status as a successful security check.

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

The companion
[`owner-studio-phase-2-evidence.json`](./owner-studio-phase-2-evidence.json)
binds the tracked owner operational surface and owner lockfile to that passing
public-isolation record. Its explicit exclusion list contains only generated or
runtime artifacts such as generated Payload types, `.next`, local databases,
uploads, and secret environment files. The executable Payload admin import map
is included, as are owner build/dev scripts and configuration. This companion
is an integrity binding only: it does not claim
that tests, lint, typecheck, build, or audits passed. Those outcomes require the
commands and exit codes above. Verify the binding with
`node ./scripts/prove-owner-studio-phase2.mjs --verify=docs/owner-platform/owner-studio-phase-2-evidence.json`.

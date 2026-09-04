# Owner platform — isolated editorial slice

This directory is an independent Next.js/Payload application. It does not import
from, add routes to, or add runtime dependencies to the public portfolio. It is
an authenticated local editorial slice, not a deployed production service; the
public portfolio still reads its existing checked-in content.

The complete operational runbook is in
[`../docs/owner-platform/operations.md`](../docs/owner-platform/operations.md).

## Current owner surface

The authenticated admin includes Brand Profiles (the first Brand Studio data
surface), controlled brand assignment/overrides on Pages, the editorial
collections, Media, and immutable Preview Snapshots. Open
`http://localhost:3001/admin/collections/brand-profiles` after local sign-in to
work with brand tokens; this is Payload's generated owner UI, not yet a custom
visual canvas.

`POST /api/owner/preview-snapshots` creates an immutable manifest from a page's
current draft. `POST /api/owner/figma/discover` performs bounded, read-only
discovery when `FIGMA_PERSONAL_ACCESS_TOKEN` and `FIGMA_PLAN` are configured
server-side. Figma rate limits are returned without automatic retries.

AI and Linocube are disabled contracts only: they have no credentials, SDKs,
network implementation, autonomous writes, or public publishing path. See the
runbook for request examples, token handling, preview behavior, verification,
and rollback.

## Local development

From the repository root, run `npm run owner:install` and then
`npm --prefix owner-platform run dev`. The development
command creates the ignored `.data/` directory and Payload uses
`.data/owner-platform.db` unless `DATABASE_URL` is explicitly provided. The
fallback Payload secret is deliberately named and limited to development; it
must never be used outside local development.

The first owner is provisioned privately. Set an unpredictable
`OWNER_BOOTSTRAP_SECRET` of at least 32 characters, then submit Payload's
`POST /api/users/first-register` request with the same value in the
`x-owner-bootstrap-secret` header. Requests without an exact match receive
`403`; the browser-facing first-user form cannot bypass this gate. Payload only
permits this operation while the Users collection is empty, so the mechanism is
one-time. Remove `OWNER_BOOTSTRAP_SECRET` after provisioning. Never put it in a
public URL, browser bundle, committed file, log, or client-side environment
variable.

The only configured role is `owner`, it is persisted in the JWT, and all Users
collection access is owner-only. The unauthenticated Users REST endpoint
therefore also responds with `403`. Normal login remains available after the
owner exists and does not use the bootstrap secret.

## Production build safety gate

`npm run build` launches `next build` with `OWNER_PLATFORM_BUILD_PHASE=1` only
inside the build child process. This permits Next.js to compile the dynamic
Payload routes without real credentials by always selecting an in-memory SQLite
adapter and a conspicuously build-only secret. Generated runtime handlers do
not trust that flag: every admin, REST, and Payload server-function
entry point independently calls the production runtime guard.

Consequently, `npm start` under `NODE_ENV=production` fails closed unless both
conditions are met:

- `PAYLOAD_SECRET` is present, is at least 32 characters, and is not one of the
  known development/build placeholders.
- `DATABASE_URL` is present, causing the PostgreSQL adapter to be selected.

The build-only values do not constitute a deployable configuration. This slice
is not deployed or production-ready; migrations, backups, email and deployment
operations are deliberately deferred.

GraphQL is disabled and no GraphQL route is exposed until a concrete consumer
requires it. The dependency remains because it is a Payload peer dependency.

## Environment variables

Copy `.env.example` to `.env` and provide values only when needed. The example
contains names, never credentials. `.env*`, `.data/`, `.next/`, `media/`, and
`uploads/` are ignored locally.

## Checks

```text
npm test
npm run typecheck
npm run build
```

From the repository root, `npm run check:owner:clean` performs a lockfile-clean
install and all owner checks. After a fresh public build,
`npm run check:owner-isolation` verifies the root runtime dependency boundary,
public import graph, and public bundle budget against the immutable baseline.

`npm run generate:importmap` and `npm run generate:types` refresh Payload's
generated shims after schema or admin-component changes.

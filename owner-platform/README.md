# Owner platform — isolated foundation

This directory is an independent Next.js/Payload application. It does not import
from, add routes to, or add runtime dependencies to the public portfolio.

## Local development

Run `npm install` and then `npm run dev` from this directory. The development
command creates the ignored `.data/` directory and Payload uses
`.data/owner-platform.db` unless `DATABASE_URL` is explicitly provided. The
fallback Payload secret is deliberately named and limited to development; it
must never be used outside local development.

Payload's `/admin/create-first-user` flow creates the initial authenticated
owner. The only configured role is `owner`, it is persisted in the JWT, and all
Users collection access is owner-only. The unauthenticated Users REST endpoint
therefore responds with `403`.

## Production build safety gate

`npm run build` launches `next build` with `OWNER_PLATFORM_BUILD_PHASE=1` only
inside the build child process. This permits Next.js to compile the dynamic
Payload routes without real credentials by selecting an in-memory SQLite
adapter and a conspicuously build-only secret. Generated runtime handlers do
not trust that flag: every admin, REST, GraphQL, and Payload server-function
entry point independently calls the production runtime guard.

Consequently, `npm start` under `NODE_ENV=production` fails closed unless both
conditions are met:

- `PAYLOAD_SECRET` is present, is at least 32 characters, and is not one of the
  known development/build placeholders.
- `DATABASE_URL` is present, causing the PostgreSQL adapter to be selected.

The build-only values do not constitute a deployable configuration. This slice
is not deployed or production-ready; migrations, backups, email and deployment
operations are deliberately deferred.

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

`npm run generate:importmap` and `npm run generate:types` refresh Payload's
generated shims after schema or admin-component changes.

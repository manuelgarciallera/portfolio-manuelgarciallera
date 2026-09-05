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
collections, Media, reusable Media Placements, immutable Preview Snapshots, and
an append-only Releases registry. Projects, Pages, Articles, and the reusable
Technology catalog are manually orderable. Open
`http://localhost:3001/admin/collections/brand-profiles` after local sign-in to
work with brand tokens; this is Payload's generated owner UI, not yet a custom
visual canvas.

The native Payload sidebar is grouped by responsibility: `Contenido`, `Diseño
y medios`, `Workflow`, and `Sistema`. This changes navigation order only;
collection slugs, access rules, APIs, and stored documents remain unchanged.

Semantic brand colors retain their normalized HEX storage and publication
validation, while the admin field now pairs the text value with a synchronized
native visual picker. Usage percentages, contrast checks, page overrides, and
snapshot behavior are unchanged. The same input is reused for page-level
accent/surface variations and optional technology corporate colors, so every
editable HEX value behaves consistently without adding a public dependency.
Brand Profiles also shows a read-only proportional palette bar derived from
the current form draft. It reports the authored total and only renders segments
whose role, color, and percentage are valid; it never changes field values.
An adjacent WCAG preview calculates the three contrast pairs already required
for publication and marks each as correct, needing review, or incomplete.
Motion settings have a replayable private preview that reflects bounded
duration, stagger, travel, and easing values. Invalid drafts use a clearly
non-authoritative safe demonstration, and `prefers-reduced-motion` disables the
preview animation without changing the stored policy.

`POST /api/owner/preview-snapshots` creates an immutable manifest from a page's
current draft. `POST /api/owner/figma/discover` performs bounded, read-only
discovery when `FIGMA_PERSONAL_ACCESS_TOKEN` and `FIGMA_PLAN` are configured
server-side. Figma rate limits are returned without automatic retries.
The owner dashboard exposes this through a collapsed explorer: an authenticated
owner can paste a Figma file, prototype, or node URL and inspect bounded frame,
section, and component candidates with temporary previews. It cannot import,
replace, crop, save, or publish a candidate.

AI and Linocube are disabled contracts only: they have no credentials, SDKs,
network implementation, autonomous writes, or public publishing path. See the
runbook for request examples, token handling, preview behavior, verification,
and rollback.

Releases records a full Git commit, its source preview snapshot, a concise
change summary, and bounded desktop/mobile quality measurements. Records are
immutable evidence; selecting a record does not execute a rollback or mutate
the public site. `POST /api/owner/releases` is the audited registration path:
it re-verifies the referenced snapshot before creating the immutable record and
does not expose restore, apply, publish, or deploy controls.

Media Placements stores focal point, zoom, fit, frame ratio, and optional mobile
or tablet overrides while preserving the uploaded original. Projects and page
media blocks can reference these recipes without changing existing content.
Its private editor now previews the selected uploaded image and exposes
reversible Desktop, Tablet, and Mobile controls for focal position, zoom, fit,
and frame ratio. The preview writes only the existing placement fields, never
the original pixels, and introduces no dependency into the public portfolio.

Technologies centralizes each stack item's accessible name, official icon,
optional corporate color, and HTTPS reference URL. Projects can adopt the
ordered catalog through `technologyStack`; their previous inline `technologies`
data remains available during migration, so this addition does not discard or
rewrite existing drafts.

Projects also expose an optional reorderable `caseStudyLayout` for structured
sections, media, galleries, quotes, metrics, and registered product features.
The existing rich-text `body` remains required and untouched during migration.
Media blocks require alternative text and can reference reversible Media
Placements; arbitrary HTML, CSS, JavaScript, embeds, and code are not accepted.

Projects, Articles, and Pages share optional bounded SEO metadata: title,
description, credential-free HTTPS canonical URL without fragments, social
image, and `noIndex`. Page draft snapshots include this group, so release and
restore workflows preserve SEO changes. These fields remain invisible to the
public site until the separately reviewed content bridge exists.

Articles include an optional reorderable `articleLayout` with rich text,
accessible media, galleries, quotes, bounded callouts, and related projects.
The existing required `content` field is preserved for a gradual migration;
the modular canvas offers no arbitrary HTML, CSS, JavaScript, embeds, or code.

Analytics Snapshots accepts bounded provider-neutral aggregate exports through
`POST /api/owner/analytics/snapshots`. It stores period totals, route-level
traffic, engagement, and LCP/INP/CLS as immutable hashed evidence. The endpoint
does not add visitor tracking, cookies, provider SDKs, or JavaScript to the
public portfolio.

`GET /api/owner/analytics/summary` supplies a dashboard-ready owner-only view
from the two latest verified snapshots: traffic changes, engagement, ten top
routes, and Core Web Vitals ratings. It fails closed on hash mismatch and does
not expose raw provider credentials or visitor data.
The generated owner dashboard now renders that verified summary directly:
traffic and period comparison, engagement, five leading routes, and LCP/INP/CLS
status. With no snapshot it reports analytics as unavailable rather than
presenting false zeroes.

`GET /api/owner/content/health` provides an owner-only editorial overview:
draft/published totals plus bounded issue counts for missing SEO, brand
assignment, and catalog-based technology stacks. It uses database counts only,
does not return document bodies, and never mutates content.

`GET /api/owner/releases/summary` provides the future versions dashboard with
the latest 20 immutable releases, their date, concise change summary, full Git
commit, visual/restorable snapshot references, and normalized desktop/mobile
performance, usability, and accessibility scores. It is owner-only, read-only,
and fails closed when a stored release cannot be compared reliably.

`GET /api/owner/dashboard` is the bounded read model for the future owner home.
It authenticates once and combines content health, release history, and the
verified analytics summary plus recent audit activity. An empty analytics
history is represented as an explicit unavailable state; integrity or
authorization failures are never silently downgraded. The endpoint performs no
editorial mutation.

The generated admin home now presents a restrained operational projection of
that model: issue totals for content and media, workflow attention, registered
versions, runtime readiness, and the five latest editable records. Links lead
back to Payload's native editors; malformed data fails closed and the original
collection dashboard remains available below the extension.
It also presents the three latest verified versions with their date, concise
change summary, and average performance, usability, and accessibility scores.
These are read-only shortcuts to immutable Release records; they cannot
restore, publish, or deploy a version.
The same area provides direct native create links for Projects, Pages,
Articles, Media, Brand Profiles, and Media Placements; it does not duplicate
forms or bypass collection access, validation, drafts, or upload limits.

The same overview includes the workflow attention summary exposed independently
at `GET /api/owner/workflow/summary`: pending assistance proposals, restore
states, publication bundles awaiting review, and approvals awaiting an
artifact. It uses owner-scoped database counts and returns no document bodies.
The dashboard converts those counts into four collection shortcuts and verifies
that the advertised attention total equals the underlying pending states. The
shortcuts navigate only; they never decide or execute a workflow operation.

`GET /api/owner/integrations/status` adds a credential-free control-plane view:
Figma read-only readiness and plan, Linocube's disabled state, and every
assistant capability switch with its effective operational support. Tokens are
never returned, and apply, publish, deploy, and model-provider readiness remain
explicitly false until separately implemented and reviewed.
The owner dashboard presents this status beside a direct link to Assistant
Settings. It distinguishes an enabled switch from an operational capability
and keeps the apply/publish/deploy prohibition visible.

`GET /api/owner/media/health` supplies an owner-only media inventory: draft and
published originals and placement recipes, plus bounded counts for missing
accessibility/technical metadata, missing placement assets, and originals over
5 MiB. It reads counts only and never downloads, rewrites, or optimizes media.

`GET /api/owner/content/recent` provides lightweight shortcuts to the five most
recently updated Projects, Pages, and Articles. It returns only navigation
metadata—ID, title, slug, status, and timestamp—and is included in the owner
dashboard without loading rich text, blocks, relationships, or media.

`GET /api/owner/search?q=...` searches Projects, Pages, Articles, and Media for
an authenticated owner. Queries are trimmed and limited to 2–80 characters;
only one `q` parameter is accepted. Each collection returns at most ten
lightweight admin destinations, with explicit field selection and no document
bodies, blocks, relationships, media sizes, credentials, or binary assets.
The generated Payload dashboard exposes this contract through a compact search
surface with keyboard focus, live status feedback, and direct edit links. It
does not replace or fork Payload's collection dashboard.

`GET /api/owner/system/readiness` reports the credential-free operational
boundary: runtime mode, SQLite/PostgreSQL durability, secure-secret readiness,
local media storage, disabled public bridge, and blocked deployment. It remains
conservative even when some production credentials are present.

`GET /api/owner/audit/activity` returns at most the latest 20 owner-visible
audit events. Its dashboard projection includes only action, outcome, subject,
and timestamp: actor records and workflow metadata are deliberately omitted.
The generated dashboard displays the five latest events with a direct shortcut
to each immutable record and to the complete ledger.

Assistant Settings exposes independent owner-only switches for copy, palette,
layout, crop, and motion proposals. Every switch defaults to off. These settings
grant proposal permission only: no assistant receives apply, publish, deploy, or
production-write authority.

Audit Events is an owner-readable, append-only ledger created only by trusted
server services. Preview creation already records its actor, page, snapshot
hash, and outcome; credentials and executable metadata are rejected.

Assistance Proposals is the review queue for schema-validated patches. A
proposal is generated only from a verified preview snapshot and the current
Assistant Settings. It starts pending and can be accepted or rejected once;
neither decision applies the patch or publishes content.

Authenticated owners can create a proposal with
`POST /api/owner/assist/proposals` and record one decision with
`PATCH /api/owner/assist/proposals/:id`. Both endpoints authenticate before
reading their bounded request body, reject unknown fields, and expose no apply,
publish, or deploy control. They are workflow boundaries, not a live model
integration.

Restore Plans provides the safety boundary for future version restoration. An
owner first prepares a plan from a release and a verified current snapshot,
then confirms it against a newly generated snapshot. A changed page produces a
conflict record instead of confirmation. This phase intentionally records only
the plan and its two confirmations. A separately authenticated execution endpoint
can restore the verified capsule only as a draft and only inside an atomic
transaction; it cannot publish or deploy.

Draft Snapshots is the restorable companion to visual Preview Snapshots.
`POST /api/owner/draft-snapshots` captures a canonical, immutable, hashed copy
of the page's whitelisted draft fields. It deliberately excludes publication
state, credentials, server metadata, and unregistered fields. New release
records bind both snapshot types from the exact same page revision.

Publication Bundles packages an ordered set of verified releases into one
immutable, hashed artifact. `POST /api/owner/publication-bundles` prepares the
artifact for inspection only. It does not write files into the public app,
publish CMS records, call a deployment provider, or add runtime dependencies to
the portfolio.

Publication Reviews records a single immutable owner decision for a verified
bundle. `POST /api/owner/publication-bundles/:id/review` requires the exact
approval or rejection phrase, re-verifies the bundle hash, and writes an audit
event. Approval is evidence only: it still cannot publish, deploy, apply, or
write into the public portfolio.

Publication Artifacts creates a canonical handoff manifest only from an
approved, hash-verified review. `POST
/api/owner/publication-reviews/:id/artifacts` records the exact bundle/review
pair and page count for later export tooling. The manifest is immutable,
audited, and isolated; generating it performs no filesystem or public-site
write.

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

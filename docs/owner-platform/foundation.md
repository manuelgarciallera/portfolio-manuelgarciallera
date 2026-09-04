# Owner platform foundation

This document describes the private owner-platform foundation that is currently
implemented. It is a set of provider-independent TypeScript contracts under
`src/platform`; it does not add a CMS, authentication system, database, OAuth
client, object-storage client, AI SDK, queue, or owner/admin route. The public
portfolio renderer remains independent from these modules.

## Implemented domain modules

The three modules are pure, server-safe TypeScript. They use no browser APIs,
network calls, vendor SDKs, credentials, or persistence.

### Content and media: `src/platform/content/model.ts`

Public exports:

- `PORTFOLIO_SCHEMA_VERSION` (`1`)
- JSON types: `JsonPrimitive`, `JsonObject`, and `JsonValue`
- content types: `PortfolioBlockKind`, `PortfolioBlock`, and `PortfolioDocument`
- media types: `MediaFit`, `MediaFrame`, `MediaAsset`, `MediaPlacement`,
  `MediaPlacementInput`, and `MediaPlacementOverride`
- `normalizeMediaPlacement(input)`
- `assertPortfolioDocument(input)`

`normalizeMediaPlacement` returns a new placement and applies safe defaults:
`focalX` and `focalY` default to `0.5` and are clamped to `0..1`; `zoom`
defaults to `1` and is clamped to `1..4`; and an unsupported fit defaults to
`cover`, including nested breakpoint overrides. Frame and breakpoint settings
are copied as placement data; breakpoint keys named `__proto__`, `constructor`,
or `prototype` are rejected. The source asset is never modified.

`assertPortfolioDocument` validates untrusted data against schema version 1,
the supported block kinds, non-negative integer block order, unique asset and
block IDs, JSON-safe block data, and valid media placement values. For media
blocks, it also validates that direct and placement asset references point to
assets present in the document.

### Figma connector contracts: `src/platform/connectors/figma.ts`

Public exports:

- `ParsedFigmaUrl`, `FigmaSourceMetadata`, `FigmaNodeCandidate`,
  `FigmaNodeCandidateInput`, `FigmaImportProposalInput`, and
  `FigmaImportProposal`
- `parseFigmaUrl(input)`
- `createFigmaImportProposal(input)`

`parseFigmaUrl` only parses and canonicalizes an input string. It accepts HTTPS
URLs on `figma.com` or `www.figma.com` for `design`, `file`, or `proto` paths,
normalizes `node-id=12-34` to `12:34`, and rejects credentials, unexpected
hosts, non-HTTPS URLs, malformed file keys, and malformed node IDs. It performs
no HTTP request.

`createFigmaImportProposal` validates candidate source metadata against the
parsed proposal source, accepts only credential-free standard HTTPS thumbnail
URLs, and routes any nested placement through `normalizeMediaPlacement` before
returning a cloned candidate. It ranks candidates deterministically using the
supplied name and aspect-ratio signals, clamps confidence to `0..1`, records
canonical provenance, and always returns `requiresConfirmation: true`. It is a
proposal boundary, not an import or publishing operation.

The future integration is a server-side Figma OAuth adapter with the minimum
required read scope (planned `file_content:read`). It will fetch only the
approved data, cache and batch reads within provider limits, copy selected
exports into owned storage, and retain source URL/file/node/version/hash
provenance. OAuth and network access are not implemented in this phase.

### Capability policy and audit contracts: `src/platform/security/capabilities.ts`

Public exports:

- `ConnectorId`, `Capability`, `ReasonCode`, `TimestampInput`, and `AuditResult`
- `ConnectorGrant`, `ApprovalEvidence`, `IsolationEvidence`, `PolicyContext`,
  `AuthorizationDecision`, `AuditEventInput`, and `AuditEvent`
- `authorizeCapability(context)`
- `createAuditEvent(input)`

The capability set is `read`, `import`, `propose`, `editDraft`, `publish`,
`delete`, `changeCode`, `deploy`, and `replacePublishedAsset`. Authorization is
default-deny: a connector must be both connected and enabled, and an explicit
grant must contain the requested capability. Connector state alone never grants
access.

AI actors are categorically denied `publish`, `delete`, `deploy`, and
`replacePublishedAsset`. Each of those four owner operations requires a valid,
unused, unexpired approval whose operation digest matches the exact requested
operation. A `changeCode` decision additionally requires an isolated execution
context and the same approval semantics. The pure policy function does not
consume approvals or persist state.

`createAuditEvent` creates a credential-free, immutable event containing the
actor, connector, capability, resource, result, reason, normalized timestamp,
and correlation ID. Its input requires one `AuthorizationDecision`; the event
derives both its boolean result and reason from that decision and rejects
separate result/reason fields. Metadata is limited to JSON-safe scalar values
and rejects secret-like and hazardous record field names. An append-only ledger
and durable one-time approval consumption belong to a future persistence
adapter; this module only provides the validated event and decision contracts.

## Data and integration boundaries (next phase)

The following are proposed boundaries, not implemented services. They should be
introduced behind typed adapters after this foundation is accepted.

| Boundary | Proposed next-phase responsibility |
| --- | --- |
| Payload collections | `projects`, `articles`, `pages`, `technologies`, `mediaAssets`, `mediaPlacements`, `releases`, and `auditEvents`; drafts, versions, access rules, and block data remain owned by the server-side CMS layer. |
| PostgreSQL | Payload content, revisions, release metadata, connector metadata, approval ledger, audit events, and job state. Domain functions remain usable without a database. |
| OAuth token storage | Encrypt Figma (and later provider) refresh/access tokens at rest in a server-only adapter; store scopes, expiry, owner identity, and revocation metadata separately from public content. Tokens never reach the browser, public bundle, prompts, or logs. |
| Object storage | Store immutable imported originals and versioned responsive derivatives (for example AVIF/WebP), with hashes and provenance. Temporary provider URLs are not published as durable asset URLs. |
| Server-only API routes | Add authenticated owner routes under a future private API boundary for connector status, proposal review, draft edits, approvals, imports, previews, and releases. Every mutation must re-check authorization and emit an audit event. No public route should import `src/platform`. |

The proposed Payload/PostgreSQL layer is an adapter boundary, not a reason to
move persistence concerns into the pure modules. The same contracts must also
support a fallback to the current TypeScript content during migration.

## Media ownership and reversibility

`MediaAsset` currently models the source identity plus optional source URL,
alternate text, MIME type, and dimensions. During document validation, the
current pure contract validates input and reconstructs copied asset values; it
does not provide an interface-level or persistence-level immutability
guarantee. `MediaPlacement` owns how that asset is presented in a block: focal
point, zoom, fit, frame, and optional breakpoint overrides. A single asset can
therefore have multiple placements, and restoring a placement never requires
rewriting the original pixels.

In the next phase, the MediaAsset persistence/storage adapter will add and
enforce the responsibilities for provenance, content hashes, strong
immutability of originals, and versioned responsive derivatives. Those
responsibilities are not implemented by the current in-memory TypeScript
interface.

The future editor will store a placement recipe (crop/ratio, focal X/Y, zoom,
fit, frame preset, and only necessary breakpoint exceptions). It will generate
derived delivery variants once while preserving the original and will keep all
administrative editing code out of the public bundle.

## Security and threat model

Treat CMS fields, Figma URLs, uploaded files, API payloads, prompts, and
repository files as untrusted input. The minimum controls are:

- **SSRF avoidance:** parse and allow-list provider URLs before any future
  server fetch; permit only HTTPS Figma hosts and never let arbitrary URLs or
  redirects become a fetch primitive.
- **Token non-exposure:** encrypt tokens in server storage, keep them out of
  client code, public responses, model context, audit metadata, and logs.
- **No public imports:** public pages import only public feature code; the
  owner platform remains a server-side boundary and receives no public route.
- **Explicit sensitive-operation approval:** AI cannot publish, delete,
  deploy, or replace a published asset; each corresponding owner operation
  requires a separate, recorded approval bound to its exact digest.
- **Immutable originals (future storage boundary):** preserve imported
  originals and use reversible placement/derivative data for presentation
  changes; the current pure contracts do not enforce storage immutability.
- **Operation-digest binding:** approvals are tied to the exact operation
  digest, expire, and are one-time evidence. Durable consumption is deferred to
  the persistence adapter.
- **Rate-limit/caching boundary:** future Figma adapters batch reads, cache
  safe metadata/thumbnails, apply rate limits and backoff, and keep those
  controls outside the pure proposal parser.
- **Auditability:** authorization outcomes and sensitive operations use an
  append-only ledger with correlation IDs; the event factory rejects
  secret-like fields.

Authentication, MFA/passkeys, secure cookies, upload scanning, backups, rate
limiting, and the durable audit/approval ledger remain implementation work for
the next phase. They must be enforced at the server boundary rather than by
the UI or by an AI model.

## Reserved environment-variable names

These names are reserved for later adapters only. `.env.example` exists, but
none of these nine names or any values for them have been added there:

`DATABASE_URL`, `PAYLOAD_SECRET`, `FIGMA_CLIENT_ID`, `FIGMA_CLIENT_SECRET`,
`FIGMA_REDIRECT_URI`, `OPENAI_API_KEY`, `MEDIA_STORAGE_BUCKET`,
`MEDIA_STORAGE_ACCESS_KEY_ID`, `MEDIA_STORAGE_SECRET_ACCESS_KEY`.

## Next phase order

1. Put Payload/Auth/Postgres behind adapters, with media and migration
   boundaries.
2. Add the Figma OAuth connector and a read-only frame explorer.
3. Add a non-destructive crop and placement UI.
4. Add drafts, preview, version history, and restore flows.
5. Add optional AI proposals behind the capability policy and explicit human
   confirmation.
6. Add isolated Codex changes last, with diff, tests, preview, approval, and
   audit evidence before any merge or deployment.

Each step must preserve the public renderer, keep the public bundle free of
administrative dependencies, and remain reversible.

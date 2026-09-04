# Owner Platform Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tested, provider-independent foundation for modular portfolio content, reversible media placement, Figma link ingestion, connector permissions, and audit-safe AI operations without changing the public UI.

**Architecture:** Add pure TypeScript domain modules under `src/platform` with no browser, CMS, database, or vendor SDK dependency. Keep external integration behind typed boundaries so Payload, PostgreSQL, Figma OAuth, and OpenAI can be introduced later without coupling the public renderer to the owner panel.

**Tech Stack:** TypeScript 5, Vitest 4, Next.js 16/React 19 existing runtime; no new runtime dependencies in this phase.

**Spec:** `docs/owner-platform-feasibility-study-2026-09-04.md` sections 8–19.

## Global Constraints

- The public portfolio output and visual behavior must remain unchanged.
- All domain modules must be import-safe on the server and must not expose secrets to client code.
- Original media assets are immutable; crop, zoom, focal point, fit, and frame settings are reversible placement data.
- Authorization is default-deny and connector state alone never grants a capability.
- AI may propose and modify drafts but may not publish, delete, deploy, or replace a published asset without a separate explicit approval.
- Figma URLs must be parsed without network access and only `figma.com`/`www.figma.com` HTTPS URLs are accepted.
- No CMS, auth, database, queue, or AI SDK dependency is added in this phase.

---

### Task 1: Modular content and reversible media contracts

**Files:**
- Create: `src/platform/content/model.ts`
- Create: `src/platform/content/model.unit.test.ts`

**Interfaces:**
- Produces: `PortfolioDocument`, `PortfolioBlock`, `MediaAsset`, `MediaPlacement`, `normalizeMediaPlacement(input)` and `assertPortfolioDocument(input)`.
- `normalizeMediaPlacement` clamps `focalX`, `focalY`, and `zoom`, applies safe defaults, and returns a new value.
- `assertPortfolioDocument` rejects duplicate block IDs, unsupported schema versions, invalid order values, and references to missing assets.

- [ ] **Step 1: Write failing tests** for defaults, clamping, immutability, valid documents, duplicate IDs, invalid versions, invalid order, and missing media references.
- [ ] **Step 2: Run** `npx vitest run --config vitest.unit.config.ts src/platform/content/model.unit.test.ts` and confirm failure because the module is absent.
- [ ] **Step 3: Implement the contracts** with schema version `1`, block kinds `hero | richText | projectGrid | media | customFeature`, fit values `cover | contain`, focal range `0..1`, zoom range `1..4`, and non-negative integer order.
- [ ] **Step 4: Re-run the focused test** and confirm all cases pass.
- [ ] **Step 5: Commit** with `feat: add modular content domain contracts`.

### Task 2: Figma source parsing and import proposal contracts

**Files:**
- Create: `src/platform/connectors/figma.ts`
- Create: `src/platform/connectors/figma.unit.test.ts`

**Interfaces:**
- Consumes: `MediaPlacement` from Task 1.
- Produces: `parseFigmaUrl(input)`, `FigmaNodeCandidate`, `FigmaImportProposal`, `createFigmaImportProposal(input)`.
- Parsed output is `{ fileKey, nodeId?, sourceUrl }`; `node-id=12-34` normalizes to `12:34`.
- Proposal output contains ranked candidates, confidence `0..1`, reasons, provenance, and an explicit `requiresConfirmation: true`.

- [ ] **Step 1: Write failing tests** for design/file/proto URLs, node normalization, allowed hosts, HTTPS enforcement, malformed URLs, stable ranking, confidence clamping, immutable output, and mandatory confirmation.
- [ ] **Step 2: Run** `npx vitest run --config vitest.unit.config.ts src/platform/connectors/figma.unit.test.ts` and confirm failure because the module is absent.
- [ ] **Step 3: Implement parsing and deterministic proposal ranking** without HTTP calls or vendor SDKs. Reject credentials, fragments that cannot identify a file, unexpected hosts, and keys outside `[A-Za-z0-9_-]`.
- [ ] **Step 4: Re-run the focused test** and confirm all cases pass.
- [ ] **Step 5: Commit** with `feat: add safe Figma import contracts`.

### Task 3: Capability policy and append-only audit events

**Files:**
- Create: `src/platform/security/capabilities.ts`
- Create: `src/platform/security/capabilities.unit.test.ts`

**Interfaces:**
- Produces: `ConnectorId`, `Capability`, `ConnectorGrant`, `PolicyContext`, `authorizeCapability(context)`, `createAuditEvent(input)`.
- Capabilities are `read | import | propose | editDraft | publish | delete | changeCode | deploy`.
- `authorizeCapability` returns a structured allow/deny decision with a stable reason code; disabled/disconnected connectors and absent grants deny.
- AI actors are categorically denied `publish`, `delete`, and `deploy`; `changeCode` additionally requires an isolated execution context and one-time approval bound to the operation digest.
- Audit events are immutable, contain no token or secret fields, and require actor, capability, resource, result, timestamp, and correlation ID.

- [ ] **Step 1: Write failing tests** covering default deny, connector/grant enforcement, AI sensitive-action denial, isolated code approval, expired/mismatched approvals, owner publish approval, and secret-field rejection.
- [ ] **Step 2: Run** `npx vitest run --config vitest.unit.config.ts src/platform/security/capabilities.unit.test.ts` and confirm failure because the module is absent.
- [ ] **Step 3: Implement pure authorization and audit factories** with no storage or authentication assumptions.
- [ ] **Step 4: Run** the focused test, then `npm run typecheck`, `npm run lint`, and `npx vitest run --config vitest.unit.config.ts`.
- [ ] **Step 5: Commit** with `feat: add connector capability policy`.

### Task 4: Foundation documentation and boundary verification

**Files:**
- Create: `docs/owner-platform/foundation.md`
- Modify: `README.md`

**Interfaces:**
- Consumes all public types and functions from Tasks 1–3.
- Produces an integration guide for Payload collections, OAuth token storage, API routes, and future adapters without claiming those services are implemented.

- [ ] **Step 1: Document** domain boundaries, data ownership, threat model, environment-variable names, and the next implementation phase.
- [ ] **Step 2: Add a README link** under project documentation without changing runtime code.
- [ ] **Step 3: Run** `git diff --check`, `npm run typecheck`, `npm run lint`, `npx vitest run --config vitest.unit.config.ts`, and `npm run build`.
- [ ] **Step 4: Verify** the production route set in build output has not gained an owner/admin route and the public renderer imports nothing from `src/platform`.
- [ ] **Step 5: Commit** with `docs: describe owner platform foundation`.

# Owner Studio Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure, versioned Brand Studio and read-only integration boundary to the isolated owner application while keeping the public portfolio byte-stable.

**Architecture:** Payload collections store validated brand intent and page assignments inside `owner-platform`. Pure validation and connector modules sit behind server-only interfaces. The public Next.js application does not import or query these modules.

**Tech Stack:** Payload 3.88, Next.js 16.2.11, TypeScript, Vitest, Sharp, native `fetch`, existing public isolation guards.

**Spec:** `docs/superpowers/specs/2026-09-04-owner-studio-design.md`

## Global Constraints

- No root public runtime dependency, route, stylesheet, or content source changes.
- No arbitrary HTML, CSS, JavaScript, model output, or Figma credential may be stored as executable configuration.
- Owner-only mutations and version reads; anonymous reads require published and non-trashed documents.
- Figma is read-only and disabled without server credentials.
- AI and Linocube remain provider interfaces until explicit credentials and deployment infrastructure exist.
- Every task ends with owner tests, lint, typecheck, build, and root isolation checks.

---

### Task 1: Brand profiles and deterministic validation

**Files:**
- Create: `owner-platform/src/brand/model.ts`
- Create: `owner-platform/src/brand/validation.ts`
- Create: `owner-platform/src/brand/validation.test.ts`
- Create: `owner-platform/src/collections/BrandProfiles.ts`
- Create: `owner-platform/src/collections/brand-profiles.test.ts`
- Modify: `owner-platform/src/payload.config.ts`
- Regenerate: `owner-platform/src/payload-types.ts`
- Regenerate: `owner-platform/src/app/(payload)/admin/importMap.js`

**Interfaces:**
- Produces: `normalizeHex(value: string): string`, `validateUsageWeights(entries): string[]`, `contrastRatio(foreground, background): number`, `BrandProfiles: CollectionConfig`.

- [ ] Write failing tests for hex normalization, duplicate roles, exact 100 total, contrast thresholds, motion bounds, access, versions, trash, and required collection fields.
- [ ] Run `npm --prefix owner-platform test -- src/brand/validation.test.ts src/collections/brand-profiles.test.ts` and confirm the missing modules fail.
- [ ] Implement pure validators and the `brand-profiles` collection with semantic color arrays, usage weights, typography, media relationships, voice notes, and bounded motion fields.
- [ ] Add publication validation hooks that reject invalid weights, roles, contrast, and motion without executing user-authored code.
- [ ] Register the collection and regenerate Payload types/import map.
- [ ] Run owner test, lint, typecheck, and build; commit `feat: add validated owner brand profiles`.

### Task 2: Page inheritance and controlled overrides

**Files:**
- Create: `owner-platform/src/brand/inheritance.ts`
- Create: `owner-platform/src/brand/inheritance.test.ts`
- Modify: `owner-platform/src/collections/Pages.ts`
- Modify: `owner-platform/src/collections/editorial.test.ts`
- Regenerate: `owner-platform/src/payload-types.ts`

**Interfaces:**
- Consumes: Brand profile semantic roles and motion settings from Task 1.
- Produces: `resolvePageBrand(base, overrides): ResolvedBrand`, Payload fields `brandProfile` and `brandOverrides`.

- [ ] Write failing tests proving overrides can change only accent, surface, usage weights, and motion preset; background/text roles remain inherited.
- [ ] Implement a pure inheritance resolver that returns a new object and revalidates weights/contrast.
- [ ] Add required brand relationship and optional bounded override group to Pages.
- [ ] Regenerate types and run owner checks; commit `feat: add controlled page brand inheritance`.

### Task 3: Immutable preview manifests

**Files:**
- Create: `owner-platform/src/preview/manifest.ts`
- Create: `owner-platform/src/preview/manifest.test.ts`
- Create: `owner-platform/src/collections/PreviewSnapshots.ts`
- Create: `owner-platform/src/collections/preview-snapshots.test.ts`
- Modify: `owner-platform/src/payload.config.ts`
- Regenerate: `owner-platform/src/payload-types.ts`

**Interfaces:**
- Produces: `createPreviewManifest(input): PreviewManifest`, `hashPreviewManifest(manifest): string`, owner-only `preview-snapshots` collection.

- [ ] Write failing tests for deterministic hashing, secret-key rejection, immutable snapshot fields, owner-only access, and absence of executable content.
- [ ] Implement canonical JSON serialization and SHA-256 hashing using `node:crypto`.
- [ ] Add an append-only snapshot collection with create/read owner access and update/delete denied.
- [ ] Register and regenerate types, run owner checks, and commit `feat: add immutable owner preview snapshots`.

### Task 4: Read-only Figma discovery boundary

**Files:**
- Create: `owner-platform/src/connectors/figma/types.ts`
- Create: `owner-platform/src/connectors/figma/url.ts`
- Create: `owner-platform/src/connectors/figma/url.test.ts`
- Create: `owner-platform/src/connectors/figma/provider.ts`
- Create: `owner-platform/src/connectors/figma/provider.test.ts`
- Create: `owner-platform/src/app/(payload)/api/owner/figma/discover/route.ts`

**Interfaces:**
- Produces: `parseFigmaSource(input): FigmaSource`, `createFigmaReadProvider(config)`, POST owner endpoint returning normalized candidate metadata.

- [ ] Write failing tests for accepted Figma URL forms, rejected hosts/keys, missing-token fail-closed behavior, response normalization, timeout, response-size cap, redacted errors, and absence of write methods.
- [ ] Implement strict URL parsing and a provider using native `fetch`, `AbortSignal.timeout`, bounded JSON reads, and authorization headers created only server-side.
- [ ] Add an owner-authenticated route with existing production runtime guards, upload-style request size limits, and no token persistence.
- [ ] Run route/provider tests, owner build, and browser-bundle secret scan; commit `feat: add read-only figma discovery boundary`.

### Task 5: Provider-neutral AI and Linocube contracts

**Files:**
- Create: `owner-platform/src/assist/contracts.ts`
- Create: `owner-platform/src/assist/contracts.test.ts`
- Create: `owner-platform/src/connectors/linocube.ts`
- Create: `owner-platform/src/connectors/linocube.test.ts`

**Interfaces:**
- Produces: typed `StudioPatch`, `AssistCapability`, `AssistDecision`, and `PublishedManifestConsumer` interfaces with no SDK dependency.

- [ ] Write failing tests that reject executable keys, unknown paths, direct publish actions, secrets, and unbounded patches.
- [ ] Implement schema-level patch validation against the Brand Studio allowlist and explicit capability switches.
- [ ] Implement a disabled-by-default Linocube consumer interface with no network implementation.
- [ ] Run owner checks and commit `feat: define safe studio assistance contracts`.

### Task 6: Cross-application verification and evidence

**Files:**
- Modify: `docs/owner-platform/operations.md`
- Create: `docs/owner-platform/owner-studio-phase-2-evidence.json`

**Interfaces:**
- Consumes: completed Tasks 1–5.
- Produces: reproducible verification record bound to Git head and public isolation evidence.

- [ ] Run `npm run check:owner:clean` and require tests, lint, typecheck, and owner build to pass.
- [ ] Run root unit tests with `npx vitest run --config vitest.unit.config.ts`, lint, typecheck, public guards, boundary, and owner-isolation tests.
- [ ] Run a fresh `npm run build:public-proof`, regenerate isolation evidence, and verify zero public route regressions.
- [ ] Run `npm audit --omit=dev` in both packages and retain deployment blockers rather than applying unsafe forced upgrades.
- [ ] Document visible capabilities, disabled connectors, local preview instructions, and rollback; commit `docs: verify owner studio phase 2`.


# Project Showcase Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a coherent four-case portfolio sequence—Buy&Sell, LaLiga, Coordination Hub, and The UX Union—with project-specific HD visual storytelling and truthful evidence.

**Architecture:** Extend the existing `CaseStudy` content model rather than creating per-project page templates. Reuse the accessible preview carousel for raster-led projects, add a lightweight semantic diagram slide for the Hub, and keep each project identity inside a themed panel while the portfolio shell remains monochrome.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS, Next Image, Vitest, Figma exports, Sharp/WebP.

**Spec:** `docs/superpowers/specs/2026-08-31-project-showcase-expansion-design.md`

## Global Constraints

- Case order: Buy&Sell → LaLiga → Coordination Hub → The UX Union.
- Narrative order inside every case: Problema → Sistema → Producto/IA → Implementación → Evidencia.
- Images remain straight, use SVG or WebP, and only the active carousel image is mounted.
- Desktop primary sources must be at least 1440 px wide; mobile sources are never enlarged as full-bleed desktop images.
- Each raster visual should remain below 250 KB where feasible and never exceed 400 KB without explicit justification.
- LaLiga is labeled “Caso en evolución”, uses synthetic data, exposes no private URL or credentials, and makes no official-adoption claim.
- The UX Union uses local HD resources until the missing Figma URLs are supplied; the content model must allow direct replacement later.
- All controls work by keyboard, respect reduced motion, and preserve AA contrast in light and dark themes.
- The portfolio shell remains black/white; project colors stay inside project panels.

---

### Task 1: Extend the case content contract

**Files:**
- Modify: `src/features/redesign/content/types.ts`
- Modify: `src/features/redesign/components/CaseCard.tsx`
- Modify: `src/features/redesign/case/CasePage.tsx`
- Test: `src/features/redesign/components/CaseCard.unit.test.tsx`

**Interfaces:**
- Produces: `CaseStatus = 'published' | 'experimental' | 'evolving'`
- Produces: `CaseStudy.status`, `CaseStudy.contribution`, `CaseStudy.collaboration`, `CaseStudy.disclosure`
- Consumes: existing `CaseVisual`, `CaseVisualSlide`, and `CaseLink`

- [ ] **Step 1: Write the failing contract test**

Add a card fixture with `status: 'evolving'` and assert the rendered markup contains `Caso en evolución` and the contribution text while retaining `Explorar el caso`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run --config vitest.unit.config.ts src/features/redesign/components/CaseCard.unit.test.tsx`

Expected: FAIL because status and contribution are not rendered.

- [ ] **Step 3: Implement the content contract**

Add exact fields:

```ts
export type CaseStatus = 'published' | 'experimental' | 'evolving'

export interface CaseStudy {
  status?: CaseStatus
  contribution?: string
  collaboration?: string
  disclosure?: string
}
```

Render `Caso en evolución` for `evolving`, `Experimental` for `experimental`, and no badge for ordinary published cases. Show disclosure in the case metadata/evidence area, not over the main visual.

- [ ] **Step 4: Run the test and typecheck**

Run: `npx vitest run --config vitest.unit.config.ts src/features/redesign/components/CaseCard.unit.test.tsx && npm run typecheck`

Expected: PASS.

---

### Task 2: Add project visual variants without duplicating layouts

**Files:**
- Modify: `src/features/redesign/content/types.ts`
- Modify: `src/features/redesign/components/CaseCard.tsx`
- Modify: `src/features/redesign/case/CasePage.tsx`
- Modify: `src/features/redesign/redesign.css`
- Test: `src/features/redesign/components/CaseCard.unit.test.tsx`

**Interfaces:**
- Extends: `CaseVisual.theme` with `'laliga' | 'coordination' | 'theuxunion'`
- Produces: theme modifier classes `rd-case-visual--laliga`, `--coordination`, and `--theuxunion`
- Keeps: one shared `ProjectPreviewCarousel`

- [ ] **Step 1: Write failing render assertions**

Create minimal fixtures for the three themes and assert their theme modifier classes and accessible preview labels are present.

- [ ] **Step 2: Run the focused unit test**

Run: `npx vitest run --config vitest.unit.config.ts src/features/redesign/components/CaseCard.unit.test.tsx`

Expected: FAIL because the theme union rejects the fixtures.

- [ ] **Step 3: Extend themes and extract project copy from hard-coded Buy&Sell text**

Add `visual.kicker` and `visual.statement` to `CaseVisual`. Replace the hard-coded “Marketplace tecnológico” and “Diseño, producto y sistema full stack” in `CaseCard` and `CasePage` with these fields.

- [ ] **Step 4: Add restrained theme tokens**

Use these panel values:

```css
--buy-sell-panel: #003594;
--laliga-panel: #10172f;
--laliga-accent: #ff4b55;
--coordination-panel: #111111;
--coordination-accent: #d9ff43;
--theux-panel: #171024;
--theux-accent: #de4dff;
```

Keep captions and surrounding sections on existing `var(--bg)`/`var(--ink)` tokens.

- [ ] **Step 5: Verify**

Run focused test, `npm run typecheck`, and targeted ESLint for the modified TSX files.

Expected: all pass.

---

### Task 3: Publish the LaLiga case with local HD evidence

**Files:**
- Create: `public/projects/laliga/` optimized assets
- Modify: `src/features/redesign/content/cases.ts`
- Test: `src/features/redesign/content/cases.unit.test.ts`

**Interfaces:**
- Produces: case slug `laliga-club-operations-hub`
- Produces: four visual slides using local verified evidence
- Consumes: extended `CaseStudy` contract from Task 1

- [ ] **Step 1: Write the failing content test**

Assert that `getCaseBySlug('laliga-club-operations-hub')` is published, has `status === 'evolving'`, includes “datos sintéticos” in its disclosure, has at least four slides, and contains no link with `localhost`, `preview`, credentials, or a private repository.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run --config vitest.unit.config.ts src/features/redesign/content/cases.unit.test.ts`

Expected: FAIL because the case does not exist.

- [ ] **Step 3: Prepare assets**

Copy and optimize these sources:

- `implementation-desktop-1440x900-final.png` → `club-home-hd.webp`
- `implementation-infra-home-1440x1106.jpg` → `infrastructure-home-hd.webp`
- `implementation-desktop-dark-1440x900.png` → `club-dark-hd.webp`
- `implementation-mobile-light-390x844-final.png` → `club-mobile-hd.webp`
- `laliga-horizontal-negative.svg` → `logo-negative.svg`

Use Sharp WebP quality 88. Keep mobile intrinsic size.

- [ ] **Step 4: Add truthful case content**

Set:

```ts
status: 'evolving'
context: 'Proyecto conceptual de consultoría tecnológica · datos sintéticos'
contribution: 'Dirección de producto y criterio L3; definición de prioridades, revisión visual y validación del sistema'
collaboration: 'Claude: Figma y sistema visual · Codex: arquitectura, implementación, datos y pruebas'
disclosure: 'Caso en evolución con datos sintéticos. No representa un despliegue oficial ni una adopción pública por LaLiga.'
```

Write five phases around multi-role needs, governed design system, role-derived product, Figma-to-code convergence, and verified evidence. Mention that the source project remains private and local.

- [ ] **Step 5: Pass the content test and inspect asset budgets**

Run the unit test and a Sharp metadata script that prints width, height, format, and bytes for all LaLiga assets.

Expected: test passes; desktop assets are at least 1440 px wide; each WebP is below 400 KB.

---

### Task 4: Give Coordination Hub a visual system

**Files:**
- Create: `src/features/redesign/components/CoordinationDiagram.tsx`
- Modify: `src/features/redesign/components/ProjectPreviewCarousel.tsx`
- Modify: `src/features/redesign/content/types.ts`
- Modify: `src/features/redesign/content/cases.ts`
- Modify: `src/features/redesign/redesign.css`
- Test: `src/features/redesign/components/CoordinationDiagram.unit.test.tsx`

**Interfaces:**
- Extends: `CaseVisualSlide` with optional `kind: 'image' | 'coordination-diagram'`
- Produces: `CoordinationDiagram` with labeled nodes Manuel, Claude, Codex, Evidence, and Consensus
- Consumes: carousel active slide selection

- [ ] **Step 1: Write the failing semantic diagram test**

Render `CoordinationDiagram` and assert it contains a figure named “Flujo de coordinación verificable”, the five node labels, and text describing independent review before consensus.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --config vitest.unit.config.ts src/features/redesign/components/CoordinationDiagram.unit.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the lightweight diagram**

Build semantic HTML/CSS only—no canvas, WebGL, SVG animation, or new dependency. Use ordered flow lines and compact state chips. Make the diagram monochrome with one restrained acid accent to encode verified/approved state.

- [ ] **Step 4: Teach the carousel to render diagram slides**

When `kind === 'coordination-diagram'`, render the component instead of `next/image`. Preserve the same controls, labels, keyboard behavior, and reduced-motion handling.

- [ ] **Step 5: Update Coordination Hub content**

Add a themed visual with slides for coordination flow, L0–L3 autonomy, consensus gate, and verification outcome. Use semantic diagram variants rather than invented screenshots.

- [ ] **Step 6: Verify**

Run both component tests, typecheck, and targeted lint.

Expected: all pass, with no new runtime dependency.

---

### Task 5: Publish The UX Union with replaceable HD sources

**Files:**
- Create: `public/projects/theuxunion/` optimized assets
- Modify: `src/features/redesign/content/cases.ts`
- Test: `src/features/redesign/content/cases.unit.test.ts`

**Interfaces:**
- Produces: case slug `the-ux-union`
- Produces: local visual sequence whose paths can be replaced by Figma exports without component changes
- Consumes: existing Next.js project at `C:/Develop/theuxunion/theuxunion_app`

- [ ] **Step 1: Extend the failing content test**

Assert The UX Union is published, includes desktop/mobile/system/evolution labels, links to its public GitHub Pages demo, and identifies the current implementation as an early-stage MVP.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run --config vitest.unit.config.ts src/features/redesign/content/cases.unit.test.ts`

Expected: FAIL because The UX Union is absent.

- [ ] **Step 3: Prepare initial local HD assets**

Use `hero6b.png` (1670×1670), `portfolios.png` (1200×1763), and selected 1200 px brand images as WebP quality 88. Capture the current local Next.js landing at desktop and mobile only if it builds and runs without altering the source project. Do not upscale 736 px sources.

- [ ] **Step 4: Add the case content**

Describe the evolution from community proposition and exploratory branding through wireframes, Hi‑Fi direction, mobile system, and the Next.js MVP. Label current gaps explicitly: backend/auth and complete product flows are future work.

- [ ] **Step 5: Preserve Figma replacement slots**

Name slides `Marca`, `Wireframes`, `Hi‑Fi`, `Sistema mobile`, and `MVP implementado`. Where a Figma export is unavailable, use the best local evidence and describe it accurately; never label a branding image as a working UI.

- [ ] **Step 6: Pass tests and inspect image budgets**

Run content tests and Sharp metadata inspection.

Expected: pass; no image exceeds 400 KB.

---

### Task 6: Curate home order and remove weak placeholders

**Files:**
- Modify: `src/features/redesign/content/cases.ts`
- Modify: `src/features/redesign/components/CasesSection.tsx`
- Test: `src/features/redesign/content/cases.unit.test.ts`

**Interfaces:**
- Produces: `getPublishedCases()` ordered Buy&Sell, LaLiga, Coordination Hub, The UX Union
- Removes: Fintech and Estadio from selected home output without deleting historical source content unless no longer referenced

- [ ] **Step 1: Add failing order assertion**

Assert the published slug array exactly equals:

```ts
[
  'buy-sell-marketplace',
  'laliga-club-operations-hub',
  'coordination-hub',
  'the-ux-union',
]
```

- [ ] **Step 2: Run and observe failure**

Run the content test.

Expected: FAIL because LaLiga and The UX Union are absent and placeholders remain.

- [ ] **Step 3: Reorder and curate**

Keep only evidence-rich projects in `published` output. Update indices to 01–04. Do not fabricate content for Fintech or Estadio.

- [ ] **Step 4: Pass the content test**

Run content tests and typecheck.

Expected: exact ordered list passes.

---

### Task 7: Browser, accessibility, responsive, and production verification

**Files:**
- Modify if required by findings: `src/features/redesign/redesign.css`
- Update: `docs/portfolio-content-strategy.md`

**Interfaces:**
- Consumes: all four published cases
- Produces: verified local portfolio and durable editorial record

- [ ] **Step 1: Run static quality gates**

Run:

```powershell
npm run lint
npm run typecheck
npx vitest run --config vitest.unit.config.ts
node scripts/check-responsive-typography.mjs
node scripts/check-mobile-navigation.mjs
```

Expected: all pass.

- [ ] **Step 2: Verify the four cards in the in-app browser**

Confirm correct order, project identities, straight HD images, status labels, explicit CTAs, and no broken image requests.

- [ ] **Step 3: Verify each case page**

For every slug, test next/previous/pause, internal links, metadata, light/dark mode, and evidence placement. Confirm LaLiga contains no private links and The UX Union does not overstate MVP maturity.

- [ ] **Step 4: Verify responsive behavior**

Run the existing eight-profile typography script, inspect current in-app browser width, and use the existing mobile navigation structural check. Fix clipping, overflow, or illegible controls if found.

- [ ] **Step 5: Build production output**

Run: `$env:NODE_OPTIONS=''; npm run build`

Expected: successful static generation of all four case routes.

- [ ] **Step 6: Update strategy documentation**

Record the final four-case order, the LaLiga disclosure rule, and the Figma replacement requirement for The UX Union. Keep the existing rule that Articles remains absent from navigation until three pieces are publishable.


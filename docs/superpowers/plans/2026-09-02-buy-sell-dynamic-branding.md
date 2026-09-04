# Buy&Sell Dynamic Branding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight dynamic-branding pilot and visual editorial flow for the Buy&Sell case.

**Architecture:** Add a typed story-block contract to case content and render it through focused case modules. The opening scene uses brand-exact HTML/CSS assets and visibility-aware motion; future video can use the same media block without restructuring the page.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS, IntersectionObserver, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-02-buy-sell-dynamic-branding-design.md`

## Global Constraints

- Buy&Sell is the only case receiving the complete pilot treatment.
- No new runtime dependency and no WebGL/Spline.
- Preserve exact product logo, text and screenshots.
- Motion must have reduced-motion and offscreen behavior.

---

### Task 1: Typed visual story contract

**Files:**
- Modify: `src/features/redesign/content/types.ts`
- Modify: `src/features/redesign/content/cases.ts`
- Test: `src/features/redesign/content/cases.unit.test.ts`

**Interfaces:**
- Produces: `CaseStoryBlock` union and optional `CaseStudy.story`.

- [ ] Write a failing content test asserting Buy&Sell exposes the ordered visual story.
- [ ] Run the focused test and confirm it fails because `story` is absent.
- [ ] Add the minimal types and Buy&Sell story data.
- [ ] Run the focused test and confirm it passes.

### Task 2: Technological-glass opening scene

**Files:**
- Create: `src/features/redesign/case/BuySellBrandScene.tsx`
- Create: `src/features/redesign/case/BuySellBrandScene.unit.test.tsx`
- Modify: `src/features/redesign/redesign.css`

**Interfaces:**
- Produces: `BuySellBrandScene({ reducedMotion?: boolean })`.

- [ ] Write failing tests for semantic branding, layered product-card construction and reduced-motion state.
- [ ] Run the focused tests and confirm the component is missing.
- [ ] Implement the minimal accessible scene.
- [ ] Add responsive material styling and staged motion.
- [ ] Run the focused tests and confirm they pass.

### Task 3: Editorial story renderer

**Files:**
- Create: `src/features/redesign/case/CaseStory.tsx`
- Create: `src/features/redesign/case/CaseStory.unit.test.tsx`
- Modify: `src/features/redesign/case/CasePage.tsx`
- Modify: `src/features/redesign/redesign.css`

**Interfaces:**
- Consumes: `CaseStoryBlock[]` and `BuySellBrandScene`.
- Produces: `CaseStory({ study })`.

- [ ] Write failing tests for ordered sections, real images and the product/Figma CTA hierarchy.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement the story renderer and integrate it only when `study.story` exists.
- [ ] Style alternating full-width media and compact copy for mobile and desktop.
- [ ] Run focused tests and confirm they pass.

### Task 4: Motion, fallback and regression verification

**Files:**
- Modify: `src/features/redesign/case/BuySellBrandScene.tsx`
- Modify: `src/features/redesign/case/CaseStory.tsx`
- Modify: `src/features/redesign/redesign-responsive.unit.test.ts`

**Interfaces:**
- Consumes: existing reduced-motion utilities and native IntersectionObserver.

- [ ] Write failing tests for reduced-motion CSS and narrow viewport containment.
- [ ] Run tests and confirm the new assertions fail.
- [ ] Add visibility-aware playback classes and responsive containment.
- [ ] Run unit tests, lint, typecheck and build.
- [ ] Verify `/casos/buy-sell-marketplace` at 390, 768, 1440 and 1920 px.


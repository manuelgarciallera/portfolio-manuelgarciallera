# Portfolio Editorial Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the portfolio into a visual, editorial product that captures recruiter attention while preserving accurate authorship, SEO depth and performance.

**Architecture:** Keep the existing Next.js redesign as the shell. Add typed editorial content and static article routes, replace compact case cards with brand-specific motion covers, move concise capabilities immediately below the hero, and connect every case to another case. All motion is CSS or frame-based, viewport-aware and reduced-motion safe.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS, Next Image, JSON-LD, Vitest.

**Spec:** `docs/portfolio-content-strategy.md`

## Global Constraints

- Present Manuel as an individual Product Designer and Design Engineer with an HCI research practice.
- Use first person for personal contribution and explicit team attribution.
- Borrow editorial mechanics from Clay, not proprietary assets, copy or identity.
- Every visual scene must have a static fallback and respect reduced motion.
- Article pages remain indexable HTML with unique metadata and Article JSON-LD.
- Preserve LCP, CLS and mobile horizontal containment.

---

### Task 1: Marketing and copy guardrails

**Files:**
- Create: `docs/portfolio-marketing-audit.md`
- Modify: `src/features/redesign/content/about.ts`
- Modify: `src/features/redesign/content/cases.ts`

- [ ] Audit positioning, trust, attribution, recruiter scanability and conversion risks.
- [ ] Define a concise voice contract for headlines, evidence and personal contribution.
- [ ] Rewrite landing and case summaries against that contract.

### Task 2: Immediate capabilities module

**Files:**
- Create: `src/features/redesign/components/CapabilityAccordion.tsx`
- Create: `src/features/redesign/components/CapabilityAccordion.unit.test.tsx`
- Modify: `src/features/redesign/RedesignPage.tsx`
- Modify: `src/features/redesign/redesign.css`

- [ ] Test that five profile-specific capabilities appear directly after the hero.
- [ ] Implement an accessible disclosure system with linked evidence.
- [ ] Add desktop hover/focus and mobile disclosure motion.

### Task 3: Editorial motion covers

**Files:**
- Create: `src/features/redesign/components/CaseMotionCover.tsx`
- Create: `src/features/redesign/components/CaseMotionCover.unit.test.tsx`
- Modify: `src/features/redesign/components/CaseCard.tsx`
- Modify: `src/features/redesign/redesign.css`

- [ ] Test semantic links, project labels and motion-safe state.
- [ ] Build brand-specific layered cover compositions for four cases.
- [ ] Activate on hover/focus and viewport entry without continuous offscreen work.

### Task 4: Four authored articles

**Files:**
- Create: `src/features/redesign/content/articles.ts`
- Create: `src/features/redesign/content/articles.unit.test.ts`
- Create: `src/features/redesign/articles/ArticlesIndex.tsx`
- Create: `src/features/redesign/articles/ArticlePage.tsx`
- Create: `src/app/articulos/page.tsx`
- Create: `src/app/articulos/[slug]/page.tsx`
- Modify: `src/app/sitemap.ts`
- Modify: `src/features/redesign/redesign.css`

- [ ] Test four complete articles, unique slugs, summaries and author data.
- [ ] Add substantive Spanish articles for systems, materiality, human-AI collaboration and complex roles.
- [ ] Implement visual covers, readable prose, author signature and related content.
- [ ] Add metadata, canonical URLs and Article JSON-LD.

### Task 5: Landing editorial module and continuity

**Files:**
- Create: `src/features/redesign/components/ArticlesSection.tsx`
- Create: `src/features/redesign/case/NextCase.tsx`
- Modify: `src/features/redesign/RedesignPage.tsx`
- Modify: `src/features/redesign/case/CasePage.tsx`
- Modify: `src/features/redesign/components/Sections.tsx`
- Modify: `src/features/redesign/redesign.css`

- [ ] Add oversized article covers to the landing.
- [ ] End each case with a visually branded next-case invitation.
- [ ] Replace the administrative footer with an authored generative ribbon.

### Task 6: Verification

- [ ] Run all unit tests, lint, typecheck and production build.
- [ ] Verify landing, one article and two case transitions at 390px and 1440px.
- [ ] Confirm no browser errors, overflow or inaccessible motion.

# Owner CMS Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a locally runnable, authenticated Payload owner application for projects, articles, modular pages, media, drafts and versions while proving the public portfolio bundle is unchanged.

**Architecture:** Place the owner application in `owner-platform/` as an independent Next.js/Payload package. It may consume provider-independent contracts from the repository only through a future package boundary; the first slice duplicates no public renderer and never imports owner code into the root app. SQLite provides zero-cost local development; the configuration must support PostgreSQL through `DATABASE_URL` before deployment.

**Tech Stack:** Payload CMS 3.88.0, Next.js 16.2.11, React 19.2.3, Lexical, Sharp, SQLite local adapter, PostgreSQL production adapter, Vitest and the root public-boundary/bundle guards.

**Spec:** `docs/owner-platform-feasibility-study-2026-09-04.md` and `docs/owner-platform/foundation.md`.

## Global Constraints

- No owner dependency, component, CSS, or route may enter the root public application.
- The root bundle must remain inside the fixed 1%/2048-byte per-route budget and pass a fresh build comparison.
- The owner application is not deployed in this phase and must not claim production readiness.
- Missing production secrets or PostgreSQL configuration must fail closed at runtime; local development may use ignored SQLite storage.
- Public reads expose published content only; all writes and draft/version reads require an authenticated owner.
- Content collections use drafts, version limits, trash where supported, and explicit access control.
- Media preserves originals and exposes focal/crop metadata; destructive replacement is not automated.
- Connector credentials are not stored in Payload in this phase.
- Dependencies are pinned to the verified compatible family; automated updates remain review-gated by tests and bundle checks.

---

### Task 1: Isolated Payload application and authentication

Create an independent `owner-platform/package.json`, Payload/Next config, TypeScript config, generated route shims, root layout, and `Users` auth collection. Add `.env.example` containing names only and ignore local database/uploads/env files. Use SQLite only for local development and support PostgreSQL when `DATABASE_URL` is set. Add config tests for production fail-closed behavior and owner-only access helpers. Install with its own lockfile. Verify owner typecheck, tests, and build, then verify root boundary/build/bundle unchanged.

### Task 2: Editorial collections, versions and ordering

Add `Projects`, `Articles`, `Pages`, and `Media` collections. Projects and pages must be orderable; editorial collections must use drafts and bounded versions. Pages use an explicit block catalog for hero, rich text, project grid, media, and custom feature references. Media uses Sharp-supported image sizing, focal point and responsive derivatives without overwriting originals. Add schema/access tests that assert public-published-only reads, owner-only mutation/version access, required fields, orderability, trash and version settings.

### Task 3: Operational documentation and complete isolation proof

Document local setup, first-owner creation, database migration boundary, production prerequisites, backups, secret handling, and non-deployment status. Add root scripts that run owner checks without making the owner package a root runtime dependency. Execute root unit/type/lint/build/public guards and owner install/test/typecheck/build. Capture before/after public bundle comparison and commit the evidence without generated build/database/upload artifacts.

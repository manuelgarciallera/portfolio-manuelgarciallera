# Exact content-integrity checkout — verification in progress

Source commit `93b5610bad23d6468ac9a8ec829544ec905a20f7` includes runtime fix5d57f34 and21 focused executor tests (d6f373); typecheck/focused lint terminal0 (5a167a). No deployment or public source edits.

- Complete-history bundle `.audit/owner-exact-content.bundle` verified19ed2b.
- Detached checkout `/tmp/owner-exact-content-uuzNqg` in existing synthetic container owner-editor-6dc5c51-0911, no source overlays (4fa427).
- Reused Linux node_modules from previous QA checkout. Package locks SHA256 identical `6d137a173cb560f26029e77fef1a1691c783c34fc567c6836b7c5c729f2d93fc` (99d990); `npm ls --depth=0 --omit=optional` passes and tracked Git is clean (d638b1). Not a fresh dependency installation.
- Full `node scripts/test-integration-postgres.mjs` launched in this exact checkout with PostgreSQL16 binaries, as pwuser: session18661 (df6f20). Must observe this existing session to terminal and verify cleanup before starting another full harness.

Pending: full integration result, browser/restart run and physical recovery for this exact source. Prior successful receipts are not substitutes. Windows build remains a separate open gate. Next responsible: Codex.

## Full integration terminal

Session18661 exited0 (`7c1150`):94 tests /12 files passed in138.27s. PostgreSQL16.15 runner, with some tests using their explicit SQLite fixtures; not94 PostgreSQL-only assertions. Expected negative authentication/media errors and fixture email warnings are not real delivery. The runner verified zero sessions and stopped/removed only the synthetic cluster. Previous turn was progress; this continuation closes the exact-source integration gate, not overall readiness.

## Browser and restart terminal

Session83535 exited0 (`883af2`). Production-config build and native editor flows passed at390/1280: keyboard login, independent second page/brand, unsaved/discard behavior, physical image upload and crop, page/placement relationships, soft-delete/draft restore, release/review/preflight without publication, historical restoration, native article/project creation and editing. Anonymous draft details and version history denied. After real app restart, six page drafts, two brands, two placements, two articles and two projects were preserved. Owned app and cluster closed; isolated root cleaned. This is emulation, not a physical phone or deployed owner service. Intermittent historical trash timeout remains a separate observation, not claimed cured by one passing run.

Next: physical full-owner object-media recovery on the same exact source, followed by Git/process cleanup checks. Do not run another full harness simultaneously.

## Physical recovery terminal

Session12067 passed47 recovery helper tests (`ae7184`), then native pg_dump/pg_restore into a fresh synthetic database. Terminal0 (`d2e171`) verifies exact applicationCommit93b5610,18 backup files,12 media files,3 recovered revisions and12 damaged/missing cases rejected before allocation. Login, history, frozen preview, restore-plan execution and subsequent independent page/article editing pass; original editorial state and backup receipts unchanged. Three retained files are explicitly distinguished from snapshot references. Exact cluster stopped and synthetic root removed. This is a local disaster-recovery drill, not an external backup or real-provider guarantee.

The exact-source integration, browser/restart and physical-recovery gates are now passed for this commit. This does not close the remaining native Windows issue, historical intermittent trash observation, offline-account-recovery approval or staging/provider gates, and does not authorize deployment.

# Exact content-integrity checkout — verification in progress

Source commit `93b5610bad23d6468ac9a8ec829544ec905a20f7` includes runtime fix5d57f34 and21 focused executor tests (d6f373); typecheck/focused lint terminal0 (5a167a). No deployment or public source edits.

- Complete-history bundle `.audit/owner-exact-content.bundle` verified19ed2b.
- Detached checkout `/tmp/owner-exact-content-uuzNqg` in existing synthetic container owner-editor-6dc5c51-0911, no source overlays (4fa427).
- Reused Linux node_modules from previous QA checkout. Package locks SHA256 identical `6d137a173cb560f26029e77fef1a1691c783c34fc567c6836b7c5c729f2d93fc` (99d990); `npm ls --depth=0 --omit=optional` passes and tracked Git is clean (d638b1). Not a fresh dependency installation.
- Full `node scripts/test-integration-postgres.mjs` launched in this exact checkout with PostgreSQL16 binaries, as pwuser: session18661 (df6f20). Must observe this existing session to terminal and verify cleanup before starting another full harness.

Pending: full integration result, browser/restart run and physical recovery for this exact source. Prior successful receipts are not substitutes. Windows build remains a separate open gate. Next responsible: Codex.

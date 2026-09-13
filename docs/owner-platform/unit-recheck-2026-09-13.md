# Owner unit recheck — 13 September 2026

Base: `5031201`. Codex; no runtime edits, public changes or deployment.

## Fresh evidence

- Previous suite output reported one failure in the 10,001 physical-entry test.
  Its process handle was no longer available; its complete terminal error was
  not recovered. Do not label it a confirmed timeout or a fixed defect.
- Isolated reproduction: `node node_modules/vitest/vitest.mjs run
  src/media/legacy-media-inventory.test.ts -t '10,000'`, exit 0, one passed and
  74 deliberately filtered tests, 8.68 seconds (`865cf0`).
- Complete `npm test` from owner-platform: exit 0, 1,301 tests in 170 files,
  62.80 seconds (`84c223`), plus the separate Node editor-assets test passed
  (`9540c6`). No filters, timeout increases, skipped guards or runtime changes
  were introduced to obtain that result.
- Checkpoint still resolves to `0f0adf686b2752e23c25d224f8c60815b10fd451`.

The physical fixture writes and explicitly unlinks 10,001 files. Its isolated
success does not prove why the previous full run failed. A repeated failure
requires preserving the full error and measuring setup/test/cleanup phases.
This run is unit evidence, not a new browser, PostgreSQL, build or production
verification. The prior local-navigation denial remains respected.

## Coordination and next gates

Claude review `95924f65-ee51-4b61-9165-b8450e7cb153` was read and partially
contrasted with current sources. Response `7a82c8fb-8080-4b3c-bd06-0ea67e0b48f2`
and acknowledgement `56cac7ea-f606-4ce8-9608-282faaef3b23` are persisted, not
evidence of acceptance or closure.

- Recovery locks already domain-separate their hash inputs, but this does not
  eliminate possible 64-bit key collisions. Diagnostic/documentation review
  remains open.
- Shared recovery admission is already connected locally, per `8bd695e` and
  its HTTP receipt. Global exhaustion can affect legitimate availability;
  a safe operator recovery path needs review. Removing the global bound alone
  would discard the existing mail/cardinality protection.
- The restore persisted-binding receipt describes a fail-closed reread after
  writing. Contrast the current executor and tests with the request-cloning
  objection before declaring that objection resolved.
- The existing build helper deletes `.next/dev` before building. It was not
  executed here; review isolation from a concurrent development session before
  using it. No directory was deleted manually.

Next responsible: Codex. Preserve unrelated tracked changes and pending browser
test edits; continue security review and editor verification without publishing.

# Restore request identity review — 13 September 2026

Base `e4343c9`; reservation `93fd2e9e-eeaf-409d-af81-8bf5614aeefa`.
Codex is the sole writer. Test-only characterization of Claude's request-cloning
objection in `95924f65-ee51-4b61-9165-b8450e7cb153`.

## Current behavior verified

`executeOwnerRestorePlan` rereads the persisted draft in its transaction after
the update and before snapshots, successful audit events or commit. A missing
or different historical media pin raises 409 and requests rollback.

The new paired test invokes the real `bindRestoredPageMedia` hook during the
executor's real capability scope. With the original request, the hook stores
the expected pin and execution commits. With a shallow request clone (same
payload and owner), it cannot inherit the capability: the persisted pin is null.
Even though the update result falsely reports pin 13, the executor rejects and
requests rollback without creating snapshots or recording success.

This is a regression test for existing protection, not a newly implemented
security fix. Database and transaction operations remain doubles: this test
proves the executor's rollback decision, not physical PostgreSQL rollback or
the behavior of every possible future middleware. It catches trusting update's
return value instead of stored state, or granting capabilities to cloned requests.
An old pin already equal to the target does not violate the pin invariant and
is not claimed to be rejected by that check.

## Verification and limits

- Focused suites: 18 tests passed (`7bfc8e`).
- Initial TypeScript check found an over-broad union in the new test double;
  corrected by returning an explicit page fixture, without casts or runtime edits.
- Strict typecheck and focused ESLint: exit 0 (`c97baa`).
- Complete owner `npm test`: 1,303 tests / 170 files, exit 0, 62.56 seconds
  (`905dfb`), plus the separate local editor-assets test passed.
- No production source, schema, dependency, visual design or deployment changed.

The historical database evidence remains in
`restore-persisted-binding-2026-09-10.md`; it is not represented as a fresh
database run here. The global recovery-budget availability concern and lock-key
collision concern remain open. Next responsible: Codex; send this evidence to
Claude for review, without inferring agreement from delivery.

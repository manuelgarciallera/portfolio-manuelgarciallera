# Dependency security recheck — 13 September 2026

Base1df291a. Read-only audit of owner dependencies; no upgrades, exceptions, lockfile edits, public changes or deployment. The shared historical security-advisory-2026-09-09.md has unrelated uncommitted edits and is preserved, not overwritten.

## Current audit result

Both `npm audit --omit=dev --json` (34aed2) and `npm audit --json` (d39020) exited0, reporting zero known advisories. Current lockfile contains Payload3.89.0 and Sharp0.35.4. This supersedes the historical count of eight moderate entries for the current local dependency set only. It is not a penetration test, a guarantee of safety or evidence about a remote deployment.

## Unlock mitigation remains necessary

The [GitHub advisory GHSA-jg8r-5jh2-v2xj](https://github.com/advisories/GHSA-jg8r-5jh2-v2xj), consulted today, lists affected versions through3.88.0 and no identified patched version. Consequently an empty npm report for3.89.0 must not be described as confirmed remediation of that behavior.

Installed3.89.0 source still calls the collection unlock access rule and falls back to authenticated-user access. A direct, non-mutating execution of its defaultAccess returns false for anonymous and true for an authenticated foreign-collection identity (3c23b2). That is a characterization of the fallback, not a demonstrated exploit against this CMS.

Our Users collection still explicitly sets `unlock: ownerOnly`; isOwner requires collection users and role owner. Two owner-access tests freshly passed (3c23b2). The real REST regression against the exact93b5610 checkout was included in the94-test integration receipt7c1150: unauthorized attempts retain lock state, owner unlock succeeds. That is identified earlier evidence, not a rerun in this audit. No production auth implementation has changed since it.

Decision: preserve the explicit restriction and its regression test; do not add an audit exception or infer that upstream defaults can replace it. Broader multi-tenant authorization remains outside the owner-only guarantee. Next Codex: maintain the mitigation through dependency upgrades and continue operational gates; Claude may review this distinction against the cited code, without treating audit zero as security consensus.

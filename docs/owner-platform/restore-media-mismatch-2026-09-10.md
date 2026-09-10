# Restoration media mismatch — 2026-09-10

Base: 8b5f17a. Full real owner configuration, synthetic SQLite/HTTP fixture.

## Defect reproduced

A page release captures image revision A. Replacing the same Media document
creates revision B. Executing the page restore used the original relationship ID,
which now resolves to B, and nevertheless marked the plan executed.

The initial test expected A after execution and received B. A second regression
required rejection and observed the promise resolving instead. This is not cache
or a lost binary: both immutable files remain available.

## Containment implemented

Before committing restoration, compare the resulting preview's media references
against the verified target snapshot. A mismatch throws HTTP 409 and rolls back
the transaction, leaving the page unchanged and the plan confirmed, not executed.
No historical Media row is rewritten and other pages' shared images are untouched.

This is a safety correction, NOT complete historical image restoration. Next work
must restore page-scoped media identity without silently rolling back a shared
Media document used elsewhere. Also surface this incompatibility in preparation,
not only at execution. Browser validation remains pending.

## Verification

- Full-config integration verifies the mismatch is rejected and page data and
  metadata are unchanged; the plan remains confirmed.
- Editorial plus full-config integration: 24/24, including ordinary restoration.
- Unit tests: 1106/1106 in 157 files.
- Typecheck, lint and diff check successful; public boundary 21 entries.
- No build, browser, PostgreSQL, deployment or production validation this turn.

Codex owns follow-up implementation. Claude receives this finding via the Hub;
message delivery is not independent review acceptance. No public changes or spend.

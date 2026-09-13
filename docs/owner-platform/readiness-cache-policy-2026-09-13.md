# Private readiness response cache policy

Base27fa8d1, reservation43da2686-e456-4753-9d0e-46e63e3ab817. The readiness model conservatively keeps productionReady/deploymentAllowed/publicBridgeEnabled false and distinguishes configuration from real provider verification. This work does not relax those gates.

The private readiness handler lacked an explicit cache policy, unlike the existing assistance-review endpoint. This is defensive HTTP consistency, not proof of an exploitable cached response. Added `Cache-Control: private, no-store` to successful, forbidden and handled error responses through one local response constructor. Authentication order, statuses, error redaction and data remain unchanged. Errors thrown by the outer route before this handler are outside this change's coverage.

RED2f8ff1: five real Request/Response cases failed because cache-control was absent. GREEN65f6de:56 tests /21 dashboard files pass; includes owner success, anonymous denial, client/API server/unexpected errors and no internal detail disclosure. Typecheck and focused ESLint in the same command terminate0. Diffcheckce10ea passed. No browser/build/whole-suite rerun claimed for this small header-only change; the exact93b5610 receipt remains evidence for that earlier source, not this commit.

No public source, schema, dependency, credential, provider or deployment changes. Next Codex: continue remaining operational gates and include this header in the next release HTTP verification.

## Real production HTTP verification

Added production-server assertions for authenticated200 and anonymous403 cache-control, and for deploymentAllowed/publicBridgeEnabled remaining false. RED session2892 on old93b5610 runtime with only the new harness: anonymous response lacked the header (`7a989d`), then owned app/cluster cleanup completed. GREEN session70607 after applying handler1fb3c1c: terminal0 (`b9d3de`), both headers and readiness gates passed, keyboard login at390/1280 and edited draft persisted across a real app restart. Browser editor/trash suites were explicitly not run in this focused harness. Each invocation rebuilt the owner with synthetic configuration; no real provider configuration or deployment.

The container used93b5610 plus the explicitly overlaid harness/handler, not a fresh checkout of the upcoming test commit. Syntax and focused ESLint exit0 (`b3264d`). These HTTP assertions remain part of subsequent full-editor runs too.

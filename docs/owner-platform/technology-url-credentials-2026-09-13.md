# Technology official URL credential validation

Base `0292bbe`, reservation `e2254590-bf30-4917-a117-d4807df9933a`.

`validateOfficialTechnologyUrl` accepted HTTPS URLs containing username/password. The existing canonical URL validator rejects these components. An official technology link should not carry credentials into editorial data and subsequent consumers. No exploitation, real credential leakage or public exposure was observed.

The minimal change rejects nonempty parsed username/password while preserving HTTPS paths, fragments, queries and optional empty values. It does not rewrite stored data, reject every conceivable secret in a query, fetch URLs, or alter database schemas. Existing bad values would require correction when validation runs; no migration or data scan was performed.

TDD: four synthetic credential variants failed first (`788edc`); the corrected validator passes all 36 editorial collection cases (`668068`). Five positive cases preserve optional values and ordinary HTTPS links. Full owner run passes eight script tests plus 1,331 Vitest tests / 171 files (`580bbe`); two fixture email-adapter warnings remain. Typecheck and scoped lint pass (`5e6f49`). Public boundary covers 21 entries and all eight owner isolation tests pass (`725b8c`); the fake-checkpoint error in that output is an intentional negative case. Diffcheck passes.

Windows build failed before compilation (`2363fa`) with ERR_WORKER_INVALID_EXEC_ARGV for inherited NODE_OPTIONS `--use-system-ca`, under Node24.13.0. This is not resolved or silently bypassed. No certificate or antivirus setting changed. Linux build uses the existing isolated Node24.18 checkout with the two changed files overlaid, not a fresh clean checkout.

No browser UI or public runtime changed, no provider or deployment activated. The offline account-recovery design remains a separate decision, not part of this correction.

Linux build session15137 completed exit0 (`82e84c`): compilation, TypeScript, 23/23 static pages and route generation passed. This establishes the package build in that environment, not resolution of the Windows environment failure. Next actionable diagnostic: reproduce the Node worker option rejection without changing machine-wide trust settings.

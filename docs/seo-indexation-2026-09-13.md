# SEO and Search Console handoff · 2026-09-13

Manuel approved the following homepage copy after reviewing production:

- Title: Manuel García-Llera Añón | UX/UI y sistemas de diseño
- Description: Diseñador UX/UI y Design Engineer. Conecto sistemas de diseño, desarrollo e investigación sobre interacción humano-IA para crear productos digitales.

Only these two constants in src/lib/site-config.ts changed in this step.
Root metadata already consumes them for title, description and social metadata.
The earlier sitemap correction (5031201) already omits unverified lastModified;
it was not reimplemented. Production observed in 493387 still served the older
short name and fixed September 2 dates. Source is not evidence of deployment.

Search Console showed automatic DNS verification success for
sc-domain:manuelgarciallera.com in Manuel's Gmail account after his intervention.
The overview reports processing data; Sitemaps sent has zero rows. No sitemap
submission or indexing request was performed by Codex in this step. No IONOS
DNS, mail or security settings were changed.

Verification: 242 unit tests / 39 files passed (cc1392), focused lint and diff
check exit 0 (a634b6). These do not prove rendered production metadata.
Next: verify the public-only build and deployed metadata before submitting the
sitemap and inspecting/requesting crawl of home, about and research. Do not
deploy the owner CMS along with the portfolio. No doctoral credential added.

## Public build attempt

Dedicated output .owner-verification-builds/seo-ae673c7 was absent before launch;
the existing local preview was preserved. Build exited 1 before compilation
(9b8ea5): ERR_WORKER_INVALID_EXEC_ARGV, NODE_OPTIONS --use-system-ca rejected
when initiating a worker. Host node is v24.13.0; its top-level allowed flags
include this option (4af035), so this is a worker/environment compatibility
failure, not a demonstrated source or metadata failure. No certificate bypass,
antivirus change or deployment was attempted. Resolve compatible worker trust
configuration before repeating the build; retain the diagnostic output.

Resolved for this build: Node's documented NODE_USE_SYSTEM_CA=1 enables the
same trust store without placing --use-system-ca in the worker's NODE_OPTIONS.
A bounded child-process probe (bdb55c) started a worker and compared default CA
hashes; both matched the original parent trust hash. No global environment or
certificate changes. An initial probe attempted to sort a frozen certificate
array and failed (b72715); corrected to toSorted, without changing trust.
Reference: https://nodejs.org/api/cli.html#node_use_system_ca1

Build 14039 completed exit 0 (c21d3f), compiled and passed TypeScript, 29 static
pages generated in .owner-verification-builds/seo-ae673c7-system-ca.
Generated HTML checks (cebce9) confirm the approved title/description, Adobe CC
SVG in NudeProject, and sitemap with no unverified lastmod. Next's two temporary
tsconfig include additions were removed with a scoped patch after verification.
No deployment, indexing request, or owner CMS exposure. Public release gates
beyond this build still need verification before publication.

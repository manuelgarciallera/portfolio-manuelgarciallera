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

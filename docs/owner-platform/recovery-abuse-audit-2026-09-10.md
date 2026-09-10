# Recovery abuse audit and admin referrer policy

Base `d47ebf8`, reservation `8fa2170f-3afb-4886-b747-38c017aed0c4`.

## Findings

- No recovery request throttling found in owner runtime. maxLoginAttempts protects login, not requests for reset email. No claim of distributed rate limiting.
- Unknown-account responses bypass the external email request; status/body uniformity does not guarantee timing uniformity.
- Owner Next configuration had no explicit Referrer-Policy for private documents, including reset URLs containing tokens.

Primary reference inspected: [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html). It calls for consistent responses/timing, controls against excessive submissions and referrer leakage protection for reset pages. These are separate controls.

## Implemented

Owner-only Next headers now assign Referrer-Policy: no-referrer to /admin/:path*. Covers admin root, login, reset token URL and content previews. No public portfolio config modified. Uses documented installed Next headers routing, preserving withPayload.

RED four missing headers; GREEN five tests via Next's real custom-route evaluator importing the actual wrapped config, including unrelated-path exclusion. Final 1,106 unit tests / 157 files, typecheck, lint, production build (23 generated pages), public boundary (21 entries) and diff check passed. This is routing/config verification, not a new browser navigation or deployed-header test.

## Remaining implementation requirements

Recovery throttling must be shared across instances and enforce admission atomically before issuing a token or calling the mail provider. Avoid a per-process Map as a claimed distributed control. Separate per-recipient mail protection from per-source/aggregate traffic protection; do not trust arbitrary forwarded IP headers. A persistence failure must not permit unlimited sending. Preserve existing login and issued tokens when requests are throttled. Retention, bounded key cardinality and neutral responses for unknown accounts need tests. Validate concurrency, restart, expiry and provider outages before activation. A delay alone is not protection from resource exhaustion.

No new service, spending, credentials, migrations, push or deployment. Next Codex: select and verify an operational admission mechanism within approved infrastructure; browser/staging checks and CMS acceptance remain open.

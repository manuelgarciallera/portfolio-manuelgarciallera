# Owner authentication mail: bounded transport

Base: `6873f98`. Reservation: `b6716d10-34ba-4772-8f3f-37d9a8fa0f63`.

Replaces the official adapter introduced in `3b71bb4`: installed version had no cancellation hook, read an unbounded JSON response and accepted an ID without checking HTTP success. A Promise.race wrapper would not cancel transport. Removed that private dependency; no public dependency added.

The auth-only REST adapter uses a fixed Resend endpoint and configured sender, forbids redirects, aborts after 10 seconds including body reading, caps receipts at 64 KiB, requires a successful HTTP status and nonempty ID, and redacts provider errors. Unsupported mail fields are rejected, not silently discarded. No production credentials or real delivery used.

Primary contract: https://resend.com/docs/api-reference/emails/send-email

## Evidence

- RED: old adapter failed cancellation and oversized receipt tests; isolated HTTP-error-with-ID test also failed after moving assertions outside the mocked fetch.
- GREEN: 13 transport tests; 1,098 unit tests / 156 files; 5 real local HTTP recovery tests with external delivery intercepted.
- Typecheck, lint, isolated production build (23 generated pages), public boundary (21 entries) and diff check passed.
- Independent read-only review: no blockers. Suggested additional stalled-body test remains useful.

## Boundaries and next work

No push, deployment, public visual change or mail activation. Build success is not proof of real delivery. Remaining: uniform forgot-password response during provider outages (known-user 503 vs unknown-user 200), actual staging delivery, browser recovery QA, production storage/provisioning and full product acceptance. Next responsible: Codex. Provider/account/cost activation requires the applicable user authority; do not infer it from these tests.

# Neutral public recovery receipt during email outages

Base `88fa119`; reservation `eaac4d8b-0a8e-4356-b162-615d7157d1e9`.

## Cause and implementation

Installed Payload forgotPasswordOperation returns silently for an unknown email, but rolls back and throws when delivery fails for a known account. Thus REST exposed 200 vs 503. The auth-only email adapter now throws a nominal OwnerEmailDeliveryError. The Users REST endpoint invokes the native local operation with the request and overrideAccess false, catches only that nominal error after rollback, and returns the same translated success receipt with no-store. The server records a generic delivery-failed event without account or provider details. Local callers still receive the delivery error; malformed requests and unrelated errors are not swallowed.

Payload custom endpoints precede native endpoints. Unlike internal handlers they must parse request data explicitly; initial implementation missed that and produced five HTTP failures, corrected using addDataAndFileToRequest. No node_modules modifications.

## Verification

- RED: real REST test expected neutral 200 but got 503.
- GREEN: six HTTP tests using real Users/SQLite/REST and intercepted external delivery. Covers same response body during outage, no-store, previous token/expiration preserved, old link usable, internal rejection retained, malformed input 400, token lifecycle, session revocation and lockout recovery.
- 1,098 unit tests / 156 files, typecheck, lint, production build with 23 generated pages, public boundary over 21 entries and diff check passed.
- Independent read-only review found no blockers.
- Protected checkpoint still `0f0adf686b2752e23c25d224f8c60815b10fd451`.

## Not claimed / next

This equalizes HTTP status/body for delivery failure, NOT timing. Unknown accounts still avoid the external call. Rate limiting, timing mitigation, operational alerts, actual staging delivery and browser UX remain acceptance work. No production credentials, real mail, publication or public visual changes. No assertion that the CMS is production ready. Codex owns the next verification; shared logs remain unstaged to preserve unrelated edits.

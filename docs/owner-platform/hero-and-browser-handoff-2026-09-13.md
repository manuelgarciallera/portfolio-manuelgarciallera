# Hero correction and authorized CMS browser acceptance

Manuel explicitly renewed local CMS browser permission. Candidate
0b0c308f71ae3e387e4f7a67617e51f3b898e5d4 was tested without source overlays using
`node scripts/test-production-http.mjs --browser-editor --object-media` in Docker
with synthetic PostgreSQL and media, no real provider credentials.

Exit 0 (`eb2bff`): browser login at 390/1280, native second page and distinct brand,
unsaved changes, upload/crop, media blocks, trash/restore, snapshots, publication
review/artifact/preflight without publishing, historical draft restoration and
article editing passed. Six drafts, two brands, two placements and two articles
survive restart. Anonymous draft/history access remains denied. Owned app and
cluster closed and isolated root cleaned. This is automated Chromium acceptance,
not a physical phone test or production deployment. Independent review remains
pending; active dependency versions were not changed.

Separate explicit public request supersedes the old desktop hero direction:
same clear orb and stacked full name as mobile, never split Garcia-Llera at the
hyphen. Shared geometry and material now apply to both sizes; viewport still
controls render sampling. No new dependency or font request.

Hero guard RED `48b4c9`, then 240 root tests / 39 files pass (`a5c619`); focused
ESLint and diffcheck pass (`c9c532`). Local in-app browser screenshot at desktop
shows a white orb and three separate lines Manuel / García-Llera / Añón below,
without overlap. Mobile composition constants remain unchanged; no fresh public
mobile screenshot in this delivery. Public deployment has not occurred.

Hub reservations: b02f0b57-0ce3-4616-a91e-3c3176e30fd8 (CMS browser),
13cb04a1-867e-4911-acbf-d11d273134f5 (hero).

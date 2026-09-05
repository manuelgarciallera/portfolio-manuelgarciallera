# Owner browser verification — 2026-09-05

The real Payload admin was opened through agent-browser on `http://127.0.0.1:3011`. The server was bound to loopback and used a randomly named local QA SQLite database, a random application secret and synthetic credentials. No user content or public portfolio was changed.

## Observed results

- The initial schema was created successfully after the runtime fixes in `0b9cb0e`.
- First-user creation without the bootstrap header returned HTTP 403, as intended by the existing security boundary.
- The documented installation request with the bootstrap header created the synthetic owner.
- Browser login succeeded and displayed the editorial dashboard and its content creation links.
- Following “Nueva página” opened the native modular page editor.
- A title and slug were entered, a Hero block was selected from “Add Layout”, and its heading was filled.
- “Save Draft” succeeded. The editor showed `Status: Draft`, a version count of `1`, and the saved heading.
- At a 390×844 viewport, the document width measured 390px. The screenshot showed the title, version link, save/publish controls and form fields without page-wide horizontal overflow. This is one mobile screen check, not complete responsive certification.
- Browser logs identified duplicate React keys for two workflow counters that intentionally link to the same collection. The row identity now combines destination and label; a regression check verifies those identities are distinct.

## Reproducing the isolated server

In the `owner-platform` directory, use a new `LOCAL_DATABASE_NAME` containing only letters, digits, hyphens or underscores (no path or extension), clear `DATABASE_URL`, and start the development server on a free loopback port. The filename is `.data/<LOCAL_DATABASE_NAME>.db`. Without this setting the existing default remains `.data/owner-platform.db`; production still requires PostgreSQL.

Follow `operations.md` for first-owner installation. Use test-only credentials for QA and remove the bootstrap secret from the environment before running a normal owner session. QA databases remain in ignored `.data/` storage for inspection; they are not committed.

## Remaining usability work

The initial standard first-user form offered “Create” but could not submit the required bootstrap header. The protected endpoint correctly rejected it, yet the form did not leave a persistent explanation visible. This finding led to the guided installation interface described below; the endpoint protection remains unchanged.

The interface mixes Payload's English labels with the custom Spanish dashboard. A consistent localization pass is pending.

This check does not prove visual preview fidelity or publication into the public portfolio. A saved draft and a snapshot manifest are not a rendered page preview. Browser checks for media editing, versions/restoration, longer content and additional viewports remain pending.

## Guided installation follow-up

The `/admin/create-first-user` view now requests email, password confirmation and a masked installation key, with inline guidance and persistent errors. A real browser request with an incorrect key returned 403 and displayed the installation-key error as an alert. At 390×844 the document width was 390px, with all four fields approximately 329px wide.

Correcting the key in that same form successfully created the synthetic owner. The success view displayed “Cuenta creada”, removed the form, and showed the instruction to remove `OWNER_BOOTSTRAP_SECRET` and restart the server. No production credentials were used.

Reopening `/admin/create-first-user` after the account existed returned a 307 redirect to `/admin`, confirming that Payload still prevents repeating the first-user screen. The temporary browser session and development server were closed after verification.

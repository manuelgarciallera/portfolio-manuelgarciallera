# Private visual editorial preview

Save a page, article or project draft, then choose **Ver borrador guardado** above its document controls. The new tab opens `/admin/content-preview/<collection>/<id>`, where the collection is `pages`, `articles` or `projects`. Previous `/admin/page-preview/<id>` bookmarks remain supported. Returning to the editor preserves the original editing tab. Unsaved changes are intentionally not included.

The view is owner-only and read-only. An anonymous request redirects to login before the preview loader queries content. Reads use the authenticated request with access control enabled; opening a preview does not create snapshots, versions, releases or published content.

## Current rendering

- Hero headings, eyebrow text, rich text and images.
- Rich-text blocks, including safe links and inline uploaded images.
- Image blocks with their captions and reversible media placements. Desktop, tablet and mobile frame, fit, focal point and zoom overrides are applied through container queries.
- Project grids in their saved order, with title, summary and thumbnail; links return to the project editor.
- Validated page brand colors, including allowed page overrides. Missing or invalid brand profiles produce a visible warning and a neutral fallback.
- Explicit notices for missing media, unresolved relationships and unsupported custom features.
- Article and project introductions, followed by their native modular blocks in saved order: text, media, grouped galleries, quotations, notes, metrics and related projects.
- Contextual alternative text and captions remain attached to each image occurrence, even when a gallery uses the same original more than once. A placement linked to a different original is rejected with a visible warning.

An article or project's nonempty modular layout takes precedence over its legacy body. If that optional layout is absent or empty, the viewer uses the legacy body instead; it never duplicates both. Malformed layouts are rejected rather than silently displaying stale legacy content. The editor's stored fields are not rewritten by this adaptation.

Articles and projects can now be authored entirely with modular blocks: their
classic `content`/`body` field is required only when the corresponding block
canvas is empty. Lexical still validates any supplied classic content, and
Payload still validates the individual blocks. No dummy text or automatic copy
of the blocks into the classic field is needed. Removing the final block is
rejected if no classic content remains; existing classic text is never deleted
when adding blocks and becomes visible again if the canvas is cleared.

This changes validation and generated optional types, not existing document
values. No production migration has been applied; any future PostgreSQL rollout
must review the generated migration for these nullable JSON fields and their
version tables, following the normal backup/restore gate.

Desktop, Tablet and Móvil controls cap the canvas at 1280, 768 and 390px respectively. Available browser space still constrains the actual width; the panel explains this instead of claiming a narrow physical screen is a full desktop viewport.

## Boundary and limitations

This is an editorial composition viewer, not the production portfolio renderer. It does not reproduce the public project's custom reels, animation choreography, typography or 3D modules. Custom feature blocks remain identifiable placeholders. Brand usage percentages are not interpreted as literal screen-area percentages. The public content bridge is still absent, and this preview makes no publication or production-fidelity claim.

The loader accepts at most 100 stored layout blocks (plus a generated article/project introduction), 12 images per gallery, 8 entries per metrics block and 200 total project references/unique media resources. It reuses repeated document reads within a request and strips non-display metadata. Rich-text projection bounds JSON size/depth, validates link protocols and strips arbitrary inline style; the renderer constrains heading/list tags and uses React escaping. Image URLs are restricted to the owner media endpoint. The route and loader both allowlist the three editorial collections.

## Verification

Final local verification for this extension: `npm run check` in `owner-platform` passed 610 unit tests, 3 SQLite integration tests, lint, TypeScript and the production build. The root `check:public-boundary` passed for 20 app entries; public source/assets and root dependency manifests were unchanged. This does not replace production or PostgreSQL verification.

Unit tests cover owner access, route validation, saved-draft selection, legacy/modular precedence, display-data projection, unsafe-link rejection, missing resources, repeated-read caching, request bounds, block order, responsive crop settings and safe rich-text rendering. SQLite integration tests load the visual preview after restoring a saved page version, distinguish private article edits from its published version, and render a project with real upload metadata, metrics and a quotation. Integration uploads disable local file storage. Initially the database was in memory; the later restore integration uses a temporary file with real transactions and parent-process cleanup, as documented in `restore-integration-verification.md`.

Browser QA used a separate synthetic owner database on loopback port 3011. Anonymous access redirected to `/admin/login?redirect=...`; authenticated access showed the saved page, uploaded image, caption and custom-feature notice. The Móvil canvas measured 390px and its image loaded successfully without horizontal document overflow.

The article/project extension was also checked in that isolated browser session. The article at a physical 390px viewport had a 390px document width, three loaded images with the expected per-occurrence alternative texts, one quotation and one note. The project at 1440px had no horizontal document overflow; its Tablet control selected the 768px canvas. Its preview preserved the heading/metrics/quotation order and exposed the unsupported stack module notice. **Volver al editor** opened the project record, whose preview link targeted `/admin/content-preview/projects/1` in a separate tab. The QA browser and loopback server were closed after verification.

`tests/seed-visual-qa.mjs` can create a synthetic preview page, modular article, modular project and a uniquely named copy of an existing public artwork in a separately started QA database. Supply `OWNER_QA_EMAIL` and `OWNER_QA_PASSWORD` for that database only. It always targets `127.0.0.1:3011`, uploads via the actual API with an explicit image MIME type, and prints only document IDs and preview URLs. QA uploads and databases remain ignored local artifacts; originals are not overwritten.

### Block-only authoring verification

The two new SQLite integration scenarios first failed with `Content` and `Body`
validation errors when creating block-only drafts. After the conditional legacy
body validation, both pass through authenticated creation, partial-update CMS
publication and private preview. They reject clearing the last block with no
fallback, reject both absent and empty-editor fallback content, and verify a
failed update retains the saved blocks. The legacy article scenario additionally
checks that removing its modular layout reveals the unchanged original text.

Owner `npm run check` now passes **610 unit tests and 5 SQLite integration tests**,
lint, TypeScript and production build. `tests/modular-editor.browser.mjs` also
passes against a separately seeded loopback QA database: it creates block-only
article and project drafts, edits their titles in the actual Payload forms,
clicks Save Draft, verifies successful PATCH/persistence, and reloads each
document. It never publishes to the public site or fills the legacy body with
copies of block content. Run it with the same synthetic QA credentials as the
media-editor browser test; it leaves only synthetic drafts in the ignored QA DB
and closes its browser in `finally`. The login request allows 120 seconds for
the cold development API compilation; this is not a production latency budget.

A fresh public proof build at source HEAD
`6d396efbee2025f72d3327df05be1785afac7b90` with these owner changes in the worktree
passed the 20-entry boundary and nine-route bundle comparison against the fixed
checkpoint (1%/2048-byte tolerance unchanged). Public input SHA-256 remained
`d1a37d1c6371728546ff096740c3837802c528deefdd901b130453a14dc44348`;
all 11 public guard tests passed. No root source, assets or dependency manifest
changed. This local result does not remove the documented production blockers.

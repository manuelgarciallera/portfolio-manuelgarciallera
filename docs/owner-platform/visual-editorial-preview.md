# Private visual editorial preview

Save a page draft, then choose **Ver borrador guardado** above its document controls. The new tab opens `/admin/page-preview/<id>`. Returning to the editor preserves the original editing tab. Unsaved changes are intentionally not included.

The view is owner-only and read-only. An anonymous request redirects to login before the preview loader queries content. Reads use the authenticated request with access control enabled; opening a preview does not create snapshots, versions, releases or published content.

## Current rendering

- Hero headings, eyebrow text, rich text and images.
- Rich-text blocks, including safe links and inline uploaded images.
- Image blocks with their captions and reversible media placements. Desktop, tablet and mobile frame, fit, focal point and zoom overrides are applied through container queries.
- Project grids in their saved order, with title, summary and thumbnail; links return to the project editor.
- Validated page brand colors, including allowed page overrides. Missing or invalid brand profiles produce a visible warning and a neutral fallback.
- Explicit notices for missing media, unresolved relationships and unsupported custom features.

Desktop, Tablet and Móvil controls cap the canvas at 1280, 768 and 390px respectively. Available browser space still constrains the actual width; the panel explains this instead of claiming a narrow physical screen is a full desktop viewport.

## Boundary and limitations

This is an editorial composition viewer, not the production portfolio renderer. It does not reproduce the public project's custom reels, animation choreography, typography or 3D modules. Custom feature blocks remain identifiable placeholders. Brand usage percentages are not interpreted as literal screen-area percentages. The public content bridge is still absent, and this preview makes no publication or production-fidelity claim.

The loader accepts at most 100 page blocks and 200 total project references/unique media resources. It reuses repeated document reads within a request and strips non-display metadata. Rich-text projection bounds JSON size/depth, validates link protocols and strips arbitrary inline style; the renderer constrains heading/list tags and uses React escaping. Image URLs are restricted to the owner media endpoint.

## Verification

Unit tests cover owner access, saved-draft selection, display-data projection, unsafe-link rejection, missing resources, repeated-read caching, request bounds, block order, responsive crop settings and safe rich-text rendering. The SQLite integration test also loads the visual preview after restoring a real saved page version.

Browser QA used a separate synthetic owner database on loopback port 3011. Anonymous access redirected to `/admin/login?redirect=...`; authenticated access showed the saved page, uploaded image, caption and custom-feature notice. The Móvil canvas measured 390px and its image loaded successfully without horizontal document overflow.

`tests/seed-visual-qa.mjs` can create a synthetic preview page and a uniquely named copy of an existing public artwork in a separately started QA database. Supply `OWNER_QA_EMAIL` and `OWNER_QA_PASSWORD` for that database only. It always targets `127.0.0.1:3011`, uploads via the actual API with an explicit image MIME type, and prints only the new page ID and preview URL. QA uploads and databases remain ignored local artifacts; originals are not overwritten.

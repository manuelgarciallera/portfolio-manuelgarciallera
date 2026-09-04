# Quality Gates

## Runtime quality
- Core Web Vitals are captured in the browser with `web-vitals`.
- Metrics are sent to `POST /api/web-vitals`.
- Structured data is embedded as JSON-LD (`WebSite`, `Person`, `ProfilePage`).
- Technical metadata routes are enabled:
  - `/robots.txt`
  - `/sitemap.xml`
  - `/manifest.webmanifest`
  - `/humans.txt`
  - `/.well-known/security.txt`

## SEO baseline
- Canonical URL configured in metadata.
- Open Graph and Twitter image routes configured.
- Metadata base URL derived from `NEXT_PUBLIC_SITE_URL`.

## Accessibility baseline
- Semantic landmarks and keyboard visible focus.
- Reduced-motion mode supported across reveal animations.
- Decorative canvases marked as `aria-hidden`.
- External links use safe rel attributes (`noopener`, `noreferrer`) when opening in new tab.

## Performance audit workflow
1. Start app:
   - `npm run dev:restart`
2. Run desktop audit:
   - `npm run audit:lighthouse:desktop`
3. Run mobile audit:
   - `npm run audit:lighthouse:mobile`
4. Review generated reports in `.lighthouse/`.

# Public runtime isolation

The owner platform must remain outside the visitor-facing dependency graph and bundle until a measured change is explicitly accepted.

- `npm run check:public-boundary` uses the TypeScript compiler AST to walk every public `src/app` entry through local imports, aliases, re-exports, import-equals, literal dynamic imports and CSS imports. It rejects Payload, Puck, Lexical, modules below an actual `owner`/`admin` directory, and every external package not explicitly reviewed in `public-dependency-allowlist.json`. Next route groups such as `(admin)` are URL-transparent and remain public unless the resulting URL itself contains `/owner` or `/admin`.
- `npm run check:public-bundle` reads the Next 16 `page_client-reference-manifest.js` files from a completed production build. For every public route it sums each unique client JavaScript chunk once and compares raw and gzip bytes with `scripts/public-bundle-baseline.json`.
- The bundle tolerance is the larger of 1% or 2 KB for both raw and gzip bytes. Missing chunks, malformed manifests or baselines, removed routes, and new public routes without an intentional baseline update fail closed. Only real `/owner` and `/admin` URL segments and internal Next routes are excluded; route-group names are stripped.
- `npm run test:public-guards` exercises known-bad fixtures so changes to the guards cannot silently weaken them.

Run `npm run build && npm run check:public-bundle` when public code changes. The standalone bundle check rejects `.next` when public source, assets, environment, package manifests, lockfile, or build configuration are newer than its production `BUILD_ID`. CI and `check:all` run the boundary before building and the bundle comparison immediately afterward. Update the committed baseline only after reviewing the route-level difference against the protected checkpoint; never use a baseline refresh merely to make the check pass.

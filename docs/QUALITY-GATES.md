# Quality Gates

## Runtime quality
- Core Web Vitals are captured in the browser with `web-vitals`.
- Metrics are sent to `POST /api/web-vitals`.
- Structured data is embedded as JSON-LD (`WebSite` and `Person`).
- Robots and sitemap routes are enabled (`/robots.txt`, `/sitemap.xml`).

## SEO baseline
- Canonical URL configured in metadata.
- Open Graph and Twitter image routes configured.
- Metadata base URL derived from `NEXT_PUBLIC_SITE_URL`.

## Accessibility baseline
- Semantic landmarks and keyboard visible focus.
- Reduced-motion mode supported across reveal animations.
- Decorative canvases marked as `aria-hidden`.

## Performance audit workflow
1. Start app:
   - `npm run dev:restart`
2. Run desktop audit:
   - `npm run audit:lighthouse:desktop`
3. Run mobile audit:
   - `npm run audit:lighthouse:mobile`
4. Review generated reports in `.lighthouse/`.

# Stack Playbook (Professional Baseline)

This document defines the practical stack we apply in this portfolio and how each layer is used.
It turns the "list of good repositories" into concrete engineering decisions.

## Core architecture

- `Next.js` for app routing, metadata, image generation routes and production build pipeline.
- `React` for UI composition and feature isolation.
- `Tailwind CSS` for utility-first styling with consistent tokens.
- `TypeScript` for safer refactors and contract clarity.

## Motion and interaction

- `GSAP` for timeline precision and scroll-driven sequences.
- `framer-motion` for component-level transitions and mount/unmount choreography.
- Rule: use GSAP for long cinematic timelines, framer-motion for local UI transitions.
- Motion tokens and defaults are centralized in `src/lib/motion/tokens.ts`.
- Reduced-motion preference is centralized in `src/lib/motion/useReducedMotionRef.ts`.

## 3D layer

- `three`, `@react-three/fiber`, `@react-three/drei` as the main WebGL stack.
- Keep 3D isolated per feature section to avoid global render overhead.
- Prefer lazy mounting of heavy 3D blocks outside hero-critical path.

## Performance and quality

- `web-vitals` wired to `/api/web-vitals` for runtime metric collection.
- `lighthouse` scripted for desktop/mobile reports.
- CI quality gates:
  - lint
  - typecheck
  - build
  - runtime security audit (`npm audit --omit=dev`)

## Security baseline (OWASP-aligned)

- Security headers in `next.config.ts`:
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Cross-Origin-Opener-Policy`
  - `Cross-Origin-Resource-Policy`
  - `X-DNS-Prefetch-Control`
  - `X-Permitted-Cross-Domain-Policies`
- Production-only:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`

## SEO and discoverability

- Metadata + canonical + OG/Twitter images via App Router routes.
- JSON-LD (`WebSite`, `Person`) generated from centralized site config.
- `robots.txt` and `sitemap.xml` generated programmatically.

## Authentication and integrations

- `next-auth` is available but intentionally not enabled in runtime yet.
- Activation rule: enable only when there is a concrete auth user flow (admin panel, protected route, etc.).

## UI systems

- Current approach: custom UI primitives with accessibility-first behavior.
- Candidate additions (`shadcn/ui`, `headlessui`) should be adopted by feature need, not by trend.

## Decision rule for adding libraries

Before adding any dependency:

1. Does it solve an active product need?
2. Does it reduce total code complexity?
3. Does it keep bundle/runtime impact acceptable?
4. Can we enforce accessibility and responsive behavior with it?

If one answer is "no", do not add yet.

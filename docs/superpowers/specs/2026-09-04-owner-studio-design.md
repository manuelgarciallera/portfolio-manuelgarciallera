# Owner Studio Design

## Objective

Extend the isolated owner platform into a controlled design-and-content studio without coupling Payload, AI SDKs, Figma credentials, or editor code to the public portfolio. The public site continues to render its current checked-in content until a later, separately gated publishing adapter proves parity against the checkpoint.

## Product boundary

Owner Studio is an authoring application, not a free-form page builder. It stores structured intent: brand roles, page composition, media crops, motion presets, and publication state. Public rendering remains a separate consumer of validated, published snapshots.

The initial owner is the only user role. Visitor authentication, arbitrary HTML/CSS/JavaScript, live production mutation, and autonomous AI publishing are excluded.

## Subsystems and delivery order

1. **Brand Studio core** — brand profiles, semantic color roles, bounded color-usage targets, typography references, assets, and motion presets.
2. **Page assignment and validation** — pages inherit a default brand and may apply bounded overrides. Validation rejects incomplete roles, invalid percentages, inaccessible foreground/background pairs, and unbounded motion.
3. **Preview snapshots** — immutable, content-addressed preview manifests generated from drafts. A preview never mutates or imports into the public application.
4. **Read-only Figma connector** — server-only provider interface that accepts a file URL/key, lists candidate frames and returns import metadata. Credentials remain environment variables and the connector cannot write to Figma.
5. **Optional AI assistance** — proposes patches against the same validated schema. Every patch is previewed, diffed, explicitly accepted by the owner, logged, and reversible. No model receives publishing authority.
6. **Future Linocube adapter** — consumes versioned preview/published manifests through a provider-neutral interface. It does not become a dependency of the core editor.

## Brand model

A brand profile contains a name, slug, status, semantic colors, typography, assets, voice notes, and motion defaults. Required semantic roles are `background`, `surface`, `text`, `mutedText`, `accent`, `interaction`, `success`, and `danger`.

Color usage is expressed as guidance weights from 0–100 whose total must equal 100. These weights guide templates and AI proposals; they are not a promise to count rendered pixels. Each entry references a semantic role, never an arbitrary CSS property.

Pages reference one brand profile. Optional page overrides may change only accent, surface, motion preset, and usage weights. Background/text safety roles remain inherited unless a future advanced workflow is separately designed and tested.

Motion presets expose bounded values: reveal duration 150–1600 ms, stagger 0–500 ms, travel 0–80 px, easing from an allowlist, and reduced-motion behavior. They never store executable animation code.

## Validation and access

All Brand Studio collections use drafts, bounded versions, trash, published-and-not-trashed anonymous reads, and owner-only mutations/version reads. Color values are normalized six-digit hex. Duplicate semantic roles and duplicate usage roles are rejected. Usage weights must total exactly 100.

Contrast validation follows WCAG relative luminance. Required pairs are text/background and text/surface at 4.5:1; mutedText/background at 3:1. Validation errors are explicit and block publication, while drafts may be saved with actionable warnings only when Payload supports draft-aware hooks without weakening published validation.

## Preview and publishing boundary

Preview manifests contain schema version, source document/version IDs, deterministic hash, brand tokens, page blocks, media references, and motion settings. They contain no secrets or provider tokens. Generation is owner-only and writes beneath the owner application.

The public application will not read Payload directly in this phase. A later publishing adapter must export a static, validated snapshot and pass visual, accessibility, responsive, performance, and bundle comparisons before replacing checked-in content.

## Figma connector

The connector accepts canonical `figma.com/design` or `figma.com/file` URLs and extracts a validated file key and optional node ID. The provider runs server-side with a read-only token. It returns normalized candidate metadata: stable provider ID, name, node type, dimensions, thumbnail reference, last-modified value, and source URL.

No network call occurs when the connector is disabled or credentials are absent. Tokens are never persisted in Payload, logs, audit payloads, or browser bundles. Imported images become new Media records; existing originals are never destructively replaced.

## AI assistance

AI consumes a redacted snapshot and produces a typed patch, not code. Capabilities are independently switchable: suggest copy, suggest palette, suggest layout, suggest crop, and suggest motion. Apply and publish remain separate owner actions. Cost limits, provider choice, logging redaction, and rate limits are mandatory before enabling a model.

## Dockable workspace

The first release uses Payload's existing navigation and form controls. A custom dockable shell is a later visual increment after Brand Studio is proven. Its position may be left, right, top, or bottom and persisted per owner. Dragging must have keyboard alternatives and a reset action. The shell cannot change the saved public design merely by moving its own UI.

## Quality gates

- No new root public runtime dependency, route, stylesheet, or CMS import.
- Owner unit, schema, access, lint, typecheck, and build checks pass.
- Root unit, lint, typecheck, public boundary, bundle, and isolation checks pass.
- No connector credential appears in generated types, browser bundles, logs, or committed files.
- Public integration remains disabled until a separate parity gate is approved.


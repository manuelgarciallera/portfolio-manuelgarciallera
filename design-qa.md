# Design QA

**Source visual truth**

- Mobile overlap evidence, Coordination Hub: `C:\Develop\portfolio-manuelgarciallera\.codex-remote-attachments\01a03a04-0583-77e3-9be0-e309faa3e5b0\f2e74dfd-ba00-4978-b834-cb42c9641c20\1-Photo-1.jpg`.
- Mobile overlap and repeated-logo evidence, TheUXUnion: `C:\Develop\portfolio-manuelgarciallera\.codex-remote-attachments\01a03a04-0583-77e3-9be0-e309faa3e5b0\f2e74dfd-ba00-4978-b834-cb42c9641c20\2-Photo-2.jpg`.
- Approved behavior: start when the full preview is inside the viewport with a 30 px inset; if more than one qualifies, animate only the one nearest the viewport centre.
- Approved visual direction: retain the project language, keep logos static or nearly static, remove overlap, and replace the repeated round UX mark in the TheUXUnion detail opening with a richer brand image.

**Rendered implementation**

- Coordination Hub: `C:\Develop\portfolio-manuelgarciallera\artifacts\design-qa\implementation-mobile-coordination-feature-v3.png`.
- TheUXUnion: `C:\Develop\portfolio-manuelgarciallera\artifacts\design-qa\implementation-mobile-theuxunion-feature-v2.png`.
- Home cover: `C:\Develop\portfolio-manuelgarciallera\artifacts\design-qa\implementation-mobile-home-preview-fluid-v1.png`.
- Home slide: `C:\Develop\portfolio-manuelgarciallera\artifacts\design-qa\implementation-mobile-home-preview-slide-v1.png`.
- Routes: `/#casos`, `/casos/coordination-hub`, `/casos/the-ux-union`.
- Browser: Codex in-app browser.
- Viewport override: 390 × 844 CSS px; browser content width 375 px because of the visible scrollbar.
- State: dark theme, mobile project preview and detail openings.

**Production evidence**

- Deployment: `dpl_84XnN3JgWa31sM3kNF85iqaQ9qje`, aliased to `https://portfolio-manuelgarciallera.vercel.app`.
- Home project preview: `C:\Develop\portfolio-manuelgarciallera\artifacts\design-qa\production-mobile-home-preview-v1.png`.
- Coordination Hub detail: `C:\Develop\portfolio-manuelgarciallera\artifacts\design-qa\production-mobile-coordination-feature-v1.png`.
- TheUXUnion detail: `C:\Develop\portfolio-manuelgarciallera\artifacts\design-qa\production-mobile-theuxunion-feature-v1.png`.
- Production viewport: 390 × 844 CSS px; document width 375 px; no horizontal overflow.
- Production console: zero error-level entries on the final TheUXUnion route.

**Combined comparison evidence**

- `C:\Develop\portfolio-manuelgarciallera\artifacts\design-qa\mobile-detail-overlap-before-after-v1.jpg`.
- Both source photographs were normalized from 575 × 1280 to 375 × 835. Both implementation captures are 375 × 811. The source includes Android and browser chrome; comparison focuses on the app-owned project region.
- The two before/after pairs were inspected together in one 760 × 1685 comparison image.

**Required fidelity surfaces**

- Fonts and typography: statement weight, line height and hierarchy remain consistent with the portfolio. The new mobile structure lets the statement wrap naturally without touching pills or media.
- Spacing and layout rhythm: brand/copy, actions, pill rail, media viewport and counter/control rail now occupy separate flow zones. The full-bleed detail feature measures left 0, right 375.2 against a 375 px content viewport.
- Colors and visual tokens: Coordination retains black and acid green; TheUXUnion retains navy, cyan, violet and magenta. Active pills continue using each project accent.
- Image quality and asset fidelity: TheUXUnion now uses the existing HD visual-language image and a restrained wordmark; the isolated round UX mark is absent from the detail opening and remains available on the home cover.
- Copy and content: all existing project statements and evidence labels remain unchanged. No generic or invented project claim was added.
- Responsiveness: at 390 × 844, neither detail opening has horizontal document overflow or clipped controls. Long labels remain horizontally scrollable within the pill rail.
- Accessibility: inactive crossfade slides are `aria-hidden`; active imagery retains its descriptive alternative text; controls keep their accessible names and reduced-motion behavior.

**Motion and interaction evidence**

- A Buy&Sell preview placed at 19.7 px from the viewport top remained inactive; at 30.1 px it became the sole active preview.
- Production confirmed the exact threshold again: at 29 px there was no active preview; at 30.9 px Buy&Sell was the sole active preview.
- Centring TheUXUnion produced one and only one `data-viewport-active=true`; Buy&Sell, LALIGA and Coordination remained paused.
- The carousel keeps all slides mounted and crossfades opacity/transform over 900–1200 ms instead of replacing the image with a blank-frame entrance.
- The editorial cover remains visible for 5.2 s, then each project screen for 2.3 s, returning to the cover after the final screen.
- A TheUXUnion ribbon transform sampled 900 ms apart changed from one 3D matrix to another while the logo transform remained `none`.
- Buy&Sell's existing 3D planes, coins and light field now use continuous paused/running loops rather than a single one-way transition.

**Findings and comparison history**

1. P1 — Coordination Hub copy, links, counter and controls overlapped the diagram. Fix: replaced the mobile absolute composition with a vertical feature flow and dedicated preview/control region. Post-fix evidence shows each layer fully separated.
2. P1 — TheUXUnion statement and pills collided, and the round UX mark repeated the home cover. Fix: introduced an HD brand scene and dedicated rows for copy, actions and carousel UI. Post-fix evidence shows no collision and no isolated round mark.
3. P2 — project previews restarted when viewport engagement changed and slides were replaced rather than crossfaded. Fix: preserved the carousel instance, mounted all slides concurrently and selected one active layer.
4. P2 — activation depended on the viewport centre even when a preview was clipped. Fix: eligibility now requires the complete visual inside a 30 px viewport inset, then resolves ties by closest centre.
5. P2 — `100vw` included the desktop scrollbar during mobile emulation and clipped the right control. Fix: the detail feature now bleeds through the section gutter and matches the document content width.

**Focused-region evidence**

- The combined comparison is sufficient for the affected regions: statements, pill rows, diagrams/images, counters and controls are all legible at normalized mobile width.
- Motion was checked separately through live state and transform sampling because a still comparison cannot establish continuity.

**Automated verification**

- Targeted red/green regression suite: 3 files, 12 tests passed after first confirming five expected failures.
- Unit suite: 23 files, 70 tests passed.
- Encoding, hero structure, responsive typography (8 viewport profiles) and mobile-navigation checks passed.
- ESLint and TypeScript checks passed.
- Local Next.js production build passed with all 27 static pages generated.
- Vercel production build passed and deployment reached `READY`.

**Open questions**

None blocking. Any remaining change is P3 tuning after review on the user's physical phone.

## Phase-image surround normalization · 2026-09-04

- Source target: the user-marked TheUXUnion mobile evidence frame, requesting the colored area outside the image border to match the main background.
- Implementation: all `.rd-case-phase__frame--*` variants now inherit `var(--bg)` in both light and dark themes; image content, image border and internal colors remain unchanged.
- Production evidence: `C:\Develop\portfolio-manuelgarciallera\artifacts\design-qa\theuxunion-phase-frame-background-v1.png`.
- Browser measurement: the dark-theme root and all four rendered TheUXUnion phase frames resolve to `rgb(13, 14, 12)`.
- Responsive scope: the shared token applies consistently at every viewport without introducing a desktop/mobile override.
- Automated verification: 106 tests passed; ESLint, TypeScript and the production build passed.
- Final result: passed.

## Cross-project frame audit · 2026-09-04

- Production audit covered every raster phase frame in Buy&Sell, LaLiga and TheUXUnion; Coordination Hub uses diagrams rather than raster phase images.
- All 12 rendered raster frames match their image width and height exactly (`exactFit: true`).
- All 12 surrounds resolve to the same dark background as `.rd-root`: `rgb(13, 14, 12)`.
- The reported lilac gutters are absent from the current production render; they belong to a previously loaded stylesheet state.
- Final result: passed.

## Phase-image edge-to-edge fit · 2026-09-04

- The shared phase frame now has zero internal padding, and landscape evidence uses its natural aspect ratio so the frame cannot extend below the image.
- Portrait evidence retains a bounded `16 / 11` presentation area; its image is absolutely fitted to that exact box with `object-fit: contain`.
- Production browser measurements confirm identical frame/image boxes across the four rendered TheUXUnion examples: `874.5 × 601.22`, `491.91 × 338.17`, `491.91 × 277.8` and `874.5 × 493.17` CSS pixels.
- Every measured surround still matches the main dark background at `rgb(13, 14, 12)`.
- Evidence: `C:\Develop\portfolio-manuelgarciallera\artifacts\design-qa\theuxunion-phase-frame-background-v2.png`.
- Final result: passed.

## Desktop project narrative grid · 2026-09-03

**Source visual truth**

- `C:\Users\manue\AppData\Local\Temp\codex-clipboard-3c6e8405-e487-493e-aba3-1f3513da6ba5.png` (3782 × 1462 px).
- User markup defines a wider display statement followed by two equal descriptive columns before the project carousel.

**Rendered implementation**

- `C:\Develop\portfolio-manuelgarciallera\.codex-case-grid-desktop.png` (1440 × 900 px; 1440 × 900 CSS px, density 1).
- Combined normalized comparison: `C:\Develop\portfolio-manuelgarciallera\.codex-case-grid-comparison.png` (2880 × 900 px). The source was proportionally reduced to 1440 px wide and vertically centred; the implementation remained 1:1.
- State: dark theme, first project fully visible, carousel active on a product slide.
- Focused-region evidence was not needed: the complete statement, both text columns, carousel edge and controls are legible in the full-view comparison.

**Required fidelity surfaces**

- Fonts and typography: the display statement retains the existing portfolio weight and tight leading; both supporting columns use the smaller Enfoque-like reading scale and weight.
- Spacing and layout rhythm: the desktop project visual now allocates approximately 64% to narrative and 36% to imagery. The two supporting columns have equal tracks and a fluid medianil.
- Colors and visual tokens: each project keeps its existing branded surface and current text contrast.
- Image quality and asset fidelity: no image assets or carousel fitting rules were changed.
- Copy and content: every published case uses its own existing project claim and role; no generic filler copy was introduced.
- Responsiveness: at 1440 px the text ends 13.35 px before the carousel and the document has zero horizontal overflow. At 390 × 844 CSS px the added details compute to `display: none` and the document has zero horizontal overflow.

**Findings and comparison history**

1. P1 — the first implementation retained a 42% carousel width, causing the second supporting column to sit beneath the image. Fix: aligned the visual edge with the new grid by reducing the carousel region to 36% and widening the narrative track. Post-fix measurement confirms a positive 13.35 px separation.
2. No remaining P0, P1 or P2 mismatch. The implementation follows the annotated proportions while retaining the portfolio's existing typographic system.

**Interaction evidence**

- Full-visibility activation was exercised: the first preview became the sole active carousel and advanced from its cover to a product slide.
- The desktop carousel controls remain visible and outside the narrative columns.

final result: passed

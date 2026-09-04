# Buy&Sell Dynamic Branding — Design Specification

## Goal

Turn the Buy&Sell case study into the visual pilot for the portfolio: a coherent story in which the corporate palette becomes material, the design system assembles into product UI, and the implemented product remains the evidence.

## Direction

The visual metaphor is **technological glass**. Deep Buy&Sell blue defines space and structure; white expresses information and clarity; orange is reserved for action. Frosted surfaces, subtle grain, refraction, controlled highlights, weight, stacking and snapping create optical and visually haptic depth.

The story is continuous: dispersed matter → organized tokens → component → interface → working product. Motion supports this progression and never becomes an unrelated effect.

## Pilot scope

The first implementation is a code-rendered opening scene and editorial case structure for Buy&Sell. It uses exact brand assets and CSS/GSAP-style transforms so it works before generative video exists. A future Veo clip can replace the motion layer through the same media contract without changing case content.

The case sequence is: opening → context → system → product journey → implementation → learning → next case.

## Motion and media

- Separate desktop and mobile compositions.
- Motion starts when visible and stops outside the viewport.
- Reduced-motion users receive the complete final composition without animation.
- No WebGL or Spline in the pilot.
- Generated media must never contain final logos, interface text, screens or claimed results; exact assets are composited afterwards.
- Future master clips: 1920×1080 desktop and 1080×1920 mobile, 6–8 seconds, 30 fps, silent.
- Web delivery: WebM primary, MP4 fallback, WebP/AVIF poster.

## Performance and accessibility

- The opening scene is CSS/HTML and adds no blocking video request.
- Later video is lazy-loaded and has a static poster.
- Essential narrative remains available without motion.
- Semantic headings, meaningful alternative text and keyboard-operable controls are required.
- Respect `prefers-reduced-motion` and pause media outside the viewport.

## Acceptance

- Buy&Sell reads as a visual product story rather than a text document.
- The opening communicates brand, system and product within eight seconds.
- No overflow at 390, 600, 768, 1440 or 1920 px.
- Existing published case routes and content remain valid.
- Unit tests, lint, typecheck and production build pass.


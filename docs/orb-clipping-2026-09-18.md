# Hero: transparent bounds for emerging bubbles

Manuel's request: extend clipping boundaries only; preserve the approved blue
orb's size, shape, colour, timing and interactions. Base: `c14921b`.

## Cause and bound

The canvas and `.rd-hero-art { overflow: hidden }` clip the procedural surface.
Real-shader regression before correction: 34 of 160 sampled frames touch the
canvas edge, with mobile/desktop zoom and held-touch deformation.

Conservative world-space radius from the unchanged shader:

- Body radius <= .96 + .085 = 1.045.
- Each tip: centre <= 1.18, radius <= .185, total <= 1.365.
- Smooth minimum is monotone. The first body/tip union is bounded by 1.365
  (the .32 bound difference exceeds k=.22). Each remaining union adds at
  most k/4=.055: radius <= 1.475.
- Five small drops have radius bound 1.348, below the existing bound by more
  than their k=.035, so do not expand this conservative envelope.
- Maximum interaction displacement .12, then flotation .055: radius <= 1.65.
- Detached particles fit inside 1.438, also within that envelope.

For camera distance 3.7 and maximum zoom 2.6, its tangent projection is
`2.6 * 1.65 / sqrt(3.7² - 1.65²) = 1.2955` times the original half-height.
A 1.34 frame provides additional raster/coverage margin. On narrow desktop
columns the drawing width is at least its height, without resizing the stage.
This is a conservative bound,
not a claim that the animation reaches all its independent maxima together.

## Implementation

Centred canvas 134% of its unchanged stage; zoom divided by 1.34. Their product
is unchanged, preserving the apparent size, position and pointer coordinates.
Original per-CSS-pixel density retained (maximum raster dimension scales by
1.34); no blur, shape edits, dependencies or animation changes. Transparent
overflow is allowed on the art container; section containment remains intact.

The shader skips rays outside a conservative **time-dependent** envelope:
smooth maximum of the body/tip radius bounds, small-drop bounds, touch maximum,
flotation, detached particles and pixel allowance. Only previously transparent
pixels are skipped. The signed-distance function and all shading remain intact.

## Verification status

- Real shader: 160 phases/zooms/touch states, zero clipped frames, minimum
  20 raster pixels clear at the test resolution. Compared with `c14921b` shader
  at identical extended projection: **zero differing channels**, not a blur.
- Browser layout compared with production at 390/768/1024/1280/1920px:
  stage, name and Hero boxes unchanged (<1px), projection scale unchanged
  (<0.1px), no horizontal page overflow. Screenshots inspected at 390/1280.
- Native Chromium up/down touch scroll and sustained touch: pass. Firefox
  desktop narrow-viewport up/down wheel: pass (not Android-device evidence).
- Build/typecheck: 30 routes pass. Unit tests: 280/280. ESLint component,
  Hero, responsive typography/navigation and public-boundary guards pass.
- Initial naive extended raster cost ~150ms vs ~83ms in software Chromium;
  rejected for cost. Final isolated GPU-completion comparison: 90.3ms original
  vs 100.8ms extended (~12% extra for preserving density and previously clipped
  content). This is SwiftShader, **not phone FPS or a no-regression guarantee**.
  Empty-area early exit reduces the cost without changing a rendered pixel.
- No dependencies added; public bundle budget passes without raising baseline.

Commit/publication pending final smoke checks. Rollback is a scoped revert of
this correction, not a reset of the shared worktree.

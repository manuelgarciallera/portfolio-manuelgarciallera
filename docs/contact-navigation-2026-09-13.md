# Contact navigation regression — 2026-09-13

- Reproduced on desktop 1440 × 1000: the top Contact link reached `/#contacto` but stopped among project sections.
- Cause: offscreen sections used `content-visibility: auto` with a 52rem estimated height. Resolving their actual geometry changed the hash destination during smooth scrolling.
- Fix: remove estimated section containment in `src/features/redesign/responsive.css`; retain native links and smooth scrolling.
- Browser verified locally at port 3015: Contact from home and from Buy&Sell both expose the Contact heading and complete form. No message was submitted.
- Full public unit suite: 39 files, 242 tests passed (output 24987d). This is not a production verification.
- Publication: commit and push this correction after the already-pushed 68d827e; verify the final deployment before claiming it live.
- CMS test edits and other shared dirty files are excluded from this public correction.

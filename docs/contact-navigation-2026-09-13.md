# Contact navigation regression — 2026-09-13

- Reproduced on desktop 1440 × 1000: the top Contact link reached `/#contacto` but stopped among project sections.
- Cause: offscreen sections used `content-visibility: auto` with a 52rem estimated height. Resolving their actual geometry changed the hash destination during smooth scrolling.
- Fix: remove estimated section containment in `src/features/redesign/responsive.css`; retain native links and smooth scrolling.
- Browser verified locally at port 3015: Contact from home and from Buy&Sell both expose the Contact heading and complete form. No message was submitted.
- Full public unit suite: 39 files, 242 tests passed (output 24987d). This is not a production verification.
- Publication: commit and push this correction after the already-pushed 68d827e; verify the final deployment before claiming it live.
- CMS test edits and other shared dirty files are excluded from this public correction.

## Production verification

- Source `45a185591d73d2d8baf014b57ac29c2c9c6dde31` pushed and promoted through Vercel.
- Production deployment `FDNSwy2n5atVLrxhoRan2LCrhWFX`: Ready, domain `manuelgarciallera.com`.
- On the real domain at desktop 1440 × 1000: clear orb above the complete three-line name; Contact reaches the visible form both from home and Buy&Sell.
- On the real Buy&Sell page at 390 × 844: all seven technology icons visible in two rows, no lateral scrollbar.
- Browser viewport override reset after checking. No contact message submitted; this verifies navigation, not email delivery.

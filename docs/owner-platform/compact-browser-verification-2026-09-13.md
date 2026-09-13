# Compact CMS browser verification

Explicit browser permission renewed by Manuel. Candidate 0b0c308 with the six
previously pending test-only overlays was run using:
`node scripts/test-production-http.mjs --browser-editor --object-media --compact-viewports`.
This is not a clean checkout of the main branch. Active dependencies unchanged.

Result: exit 0 (`645cd2`), Chromium at 320 and 768 pixels. Native creation,
brand selection, keyboard reorder, save/reload, images/crops, previews, trash,
historical draft restore, article blocks and publication-review artifacts pass.
No page published. Six drafts, two brands, two placements and two articles persist
after app restart. Anonymous drafts/history denied; private objects checked;
owned application/cluster closed and synthetic root cleaned.

Focused ESLint from owner directory passes (`cae9f1`). The initial root ESLint
command ignored these files and was not valid evidence. Diff check passes.
Existing default-width behavior was verified before these overlays at390/1280;
this run adds compact widths, not a claim to physical-device coverage.

Manuel now explicitly assigns technical direction/integration to Codex and Claude
as complementary reviewer. Lack of reply is neither acceptance nor a blanket
blocker; concrete objections and applicable deployment authority still matter.
Hub notice `3ed51d9a-ab87-4388-b7b9-66653c23b4b0` records this instruction.

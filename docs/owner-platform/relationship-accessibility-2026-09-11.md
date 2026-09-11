# Brand selector: accessible native label

Base `d706c3f`. Scope: the page's existing brand-profile relationship selector,
not a visual editor redesign or a claim that all CMS fields are accessible.
Reservation sent to Claude: `a5ee52d2-9fdf-435e-93e8-ccd6dee2ade1`.

## Defect and implementation

Installed Payload 3.88 renders FieldLabel with a generated `for` target but
RelationshipInput does not pass that target into its deferred react-select input.
The control works with pointer input but lacks its visible accessible name.
Our earlier browser test worked around this by finding the unnamed combobox
inside a wrapper. That did not prove accessibility.

RED `245359` uses the real authenticated production-build editor: finding the
combobox named `Perfil de marca` times out after login and native form mounting.
App/database shutdown was verified; this was not a login or TLS failure.

`RelationshipLabelBinding` uses the supported beforeInput slot to associate the
existing label with the native input's actual ID. The observer is scoped to that
field, handles deferred mount/ID changes and disconnects on unmount. Idempotent
writes avoid a mutation loop. A hidden anchor adds no visual controls. Search,
native values, permissions, read-only behavior and styling remain Payload's.
No node_modules patch, new dependency, schema or public bundle change.

This is an explicit compatibility adapter for the installed native markup.
Remove it after an upstream release passes the same accessible-name and label
focus regression without it; do not retain redundant compatibility code forever.
The documented field-component extension surface is described in
[Payload relationship fields](https://payloadcms.com/docs/fields/relationship).

## Verification record

- Initial corrected production build/browser `d7bf3a`: 390/1280 px named-control
  lookup and label-click focus pass, alongside native second-page creation,
  distinct brand preview, first-document preservation and process restart.
- Read-only internal review found no critical/important defect. Its suggestion
  to repeat association/focus after save and reload was added to the test;
  final extended run `b3e41e` passes at both widths, exit 0, including that
  post-save reload, preview, four drafts/two brands after app restart, private
  object replacement and owned-process cleanup.
- Typecheck `9a535b` and focused lint/syntax `ecef99` pass.
- First all-unit Windows run `7ee5fd` did not pass: 1,284 pass, two timeouts
  (5 s media-copy test and 10 s cleanup of a 10,001-file fixture). A concurrent
  Docker build was active; contention is a hypothesis, not a proven cause.
  No application assertion failed and no timeout was increased. Full sequential
  rerun `359911` passes **1,286 tests / 169 files**, exit 0, 82.20 seconds. This
  resolves this verification gate but does not prove the cause of earlier timing.
- Public guards `de89e5`: 14/14 pass; dependency boundary passes 21 app entries.
- Import-map generation initially refused missing local PAYLOAD_SECRET; rerun
  used a generated ephemeral synthetic secret and succeeded (`948584`). No real
  credentials or database migration were needed for map generation.

No deployment, external provider, human usability study or physical-phone test.
The Docker checkout retained base Git HEAD `8bd695e` with this change's explicit
source/import-map/test overlays; the browser receipt is not a clean-checkout
receipt of a new commit. The previous clean recovery rehearsal remains separate.

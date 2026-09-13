# Stack wrapping without horizontal scrolling

Explicit user request: retain existing icon sizes and wrap into subsequent rows;
no horizontal scrollbar. Shared base now wraps. A final shared rule overrides
historical mobile nowrap/scroll declarations for both compact and metadata stacks.
No icon dimensions, component markup, content, CMS or deployment changed.

Local browser, TheUXUnion: actual metadata stack computed flex-wrap=wrap,
overflow-x=visible, clientWidth=scrollWidth=231. Figma/React/Next.js share one
row; TypeScript/Tailwind CSS share the next. Existing item widths retained
(60.79 px; Tailwind label 63.68 px). This verifies the observed desktop viewport,
not every viewport or physical device. Public deployment remains pending.

Hub reservation: afd8c6bc-02fa-47cf-9c5d-a8c6e4070257.

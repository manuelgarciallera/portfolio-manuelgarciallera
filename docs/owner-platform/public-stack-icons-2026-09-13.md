# Public stack icons — 2026-09-13

User requested the missing Adobe Creative Cloud icon in NudeProject and review
of the stack icons. Codex owns integration; Hub reservation 2cc57b91.

Cause: Adobe CC had no entry in TechStack, so it rendered text only. The same
review found OpenAI/Codex mapped to OpenAI Gym, a different product.

Added two local vector paths from Simple Icons 11.15.0 (CC0), with source noted
in supplementalTechIcons.ts. Brand trademarks remain their owners' property.
No dependency, external runtime request, icon sizing or layout change.
Generic capabilities 3D and Tiempo real remain text, not invented brand logos.

Tests first: 55f9e5 failed for missing Adobe SVG and incorrect Gym mapping.
After correction: 242 public unit tests / 39 files pass (64b1b9); targeted ESLint
also exit0. Browser localhost:3015/casos/nude-project screenshot confirms CC
symbol alongside Figma in the metadata stack. No claim of physical mobile test.
An initial locator evaluation timed out; subsequent screenshot verified render.

This is a local correction, not a deployed-production verification. Owner
dependency changes and unrelated shared documentation remain outside this commit.

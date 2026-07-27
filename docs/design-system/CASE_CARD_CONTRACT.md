# CaseCard contract

Status: pilot  
Scope: editorial component of the portfolio  
Source case: Buy&Sell, preserved without redesign

## Purpose

Present a case in the portfolio index and link to its destination. This
component belongs to the portfolio; it does not alter the UI of the product
being documented.

## Required data

- `slug`
- `index`
- `title`
- `tags`
- `year`
- `published`

Optional data:

- `titleAccent`

## Current variants

- `published`: links to `/casos/{slug}` and displays tags plus year.
- `draft`: links to `/casos`, displays `En preparación`, and uses the existing
  draft visual treatment.

## Interaction states

Implemented by the existing portfolio CSS:

- default;
- hover;
- keyboard focus through the native link;
- draft.

The next Figma pass must document `focus-visible`, `pressed`, reduced motion,
and behavior over the approved portfolio surfaces before any visual change is
implemented.

## Responsive behavior

The existing grid is preserved. At the current narrow breakpoint the tags are
hidden and the remaining columns adapt without changing the source content.

Canonical widths for the Figma comparison:

- 1440 px;
- 1280 px;
- 768 px;
- 375 px.

Stress widths:

- 1920 px;
- 1024 px;
- 430 px;
- 390 px;
- 320 px.

## Verification

- Storybook stories: `Published`, `Draft`.
- Interaction assertions: accessible name, destination, keyboard focus and
  draft label.
- Accessibility addon fails tests on detected violations.
- Application and Storybook must both build before the component advances.

## Explicit non-goals

- Redesigning Buy&Sell.
- Applying `contrast-color()` before the Figma surface contract exists.
- Adding Chromatic or a cloud account.
- Creating a universal design system from this single component.

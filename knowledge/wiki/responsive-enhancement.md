# Responsive Enhancement

Status: **confirmed**

Source: [README.md: Implementation notes](../../README.md), [src/styles.css](../../src/styles.css)

## TL;DR

The site uses ordinary document flow everywhere, then layers on sticky hero storytelling and persistent navigation only when the viewport is wide and tall enough.

## Breakpoints

| Width × Height | Behavior |
|----------------|----------|
| ≤ 800 px width | Disclosure navigation replaces desktop links; one sticky `aj.` / three-line button with native `details/summary`. |
| > 960 px width **and** > 640 px height | Sticky hero storytelling and persistent chapter index can activate. |
| Below enhancement threshold | Hero and projects flow normally; all chapter anchors still work. |
| Short heights | Header stays in ordinary flow; disclosure open/closed states both remain usable. |

## Disclosing navigation (≤ 800 px)

- The button label is `Open navigation` and uses a simple SVG hamburger icon.
- JavaScript closes the disclosure before native navigation and supports Escape dismissal.
- No scripted scrolling, no scripted focus relocation, no destination focus manipulation.
- Header remains in normal flow when JS is disabled, at short heights, or when a conservative expanded-height budget would not fit. [README.md: Implementation notes](../../README.md)

## Project fit guard

- Wide/tall sticky project passages also require an **intrinsic content-fit check** (panel padding + focus clearance).
- If they cannot fit, all three existing passages contribute their full height to the document; there is no nested scroller or artificial project track.
- A guarded content-size observer rechecks fit after live text enlargement, using staged widths independently of the current layout. [README.md: Implementation notes](../../README.md)

## Fragment handling

Fragments, selectors, and history use **mode-specific destinations** without automatic history entries or focus relocation.

## Hypotheses

- **Likely:** The 960×640 threshold was chosen empirically so the hero specimen and project panels can coexist without overlapping controls.
- **Likely:** The disclosure height-budget guard is what prevents the open menu from pushing content into impossible states on very short phones.

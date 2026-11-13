# Responsive Enhancement

Status: **confirmed**

Source: [README.md: Implementation notes](../../README.md), [src/styles.css](../../src/styles.css), [src/main.js](../../src/main.js)

## TL;DR

The site keeps all chapters and projects in ordinary document flow, then adds a sticky hero, chapter navigation, progress, and project controls only where they fit.

## Breakpoints

| Width × Height | Behavior |
|----------------|----------|
| ≤ 800 px width | Horizontal mobile chapter strip replaces the desktop chapter index. |
| > 960 px width **and** > 640 px height | Sticky hero motion and persistent desktop chapter index can activate. |
| 961–1099 px and tall | Work controls form a compact sticky row. |
| ≥ 1100 px and tall | Work controls form a sticky side column. |
| Short heights | Hero and projects remain in normal flow; document anchor scrolling is instant. |

## Mobile chapter strip (≤ 800 px)

- Contains native links for `aj.`, Intro, Work, Outside, About, and Elsewhere.
- Scrolls horizontally with proximity snap and no document-level scroll interception.
- Carries each chapter's progress track inside its link.
- JavaScript marks the current chapter, keeps an off-screen active item visible, and adds an overflow-edge cue.
- The complete strip remains usable if JavaScript is disabled or fails.
- The header becomes sticky only after measurement confirms the compact row fits its height budget.

## Work navigation

- All three project passages always remain in the document.
- Enhanced controls navigate to native project fragments and update `aria-pressed` state.
- On mobile, controls stick below the measured chapter header.
- On tall desktop layouts, controls become either a compact row or side column.
- Without JavaScript, controls are hidden and project content remains readable.

## Fragment handling

Chapter and project fragments use native document destinations and history. JavaScript updates active state and measured clearance without moving destination focus.

## Hypotheses

- **Likely:** The 960×640 enhancement boundary was chosen empirically to protect the hero composition and controls.
- **Confirmed:** Project content no longer has a staged/locked presentation; it scrolls naturally at every viewport. [F-029 review](../../docs/review/f-029/review.md)

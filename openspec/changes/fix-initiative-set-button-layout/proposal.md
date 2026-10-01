## GitHub Issues

- #793

## Why

- Problem statement: In the Set Initiative editor (`lib/components/InitiativeEntry.tsx`), the value input and **Set** button are pushed to the far right of the panel and clip off-screen.
- Why now: Reported in #793; it blocks manual initiative entry (Enter Dice Roll / Enter Total modes) on common viewport widths.
- Business/user impact: DMs cannot submit a manually entered initiative without scrolling or resizing.

## Problem Space

- Current behavior: The content container (`flex justify-between items-start`) lays out three siblings in one row: (1) name + type badge + mode buttons, (2) Advantage / Flat bonus controls, (3) the `flex items-start gap-2` entry div (input + Set, plus the initiative result readout). `justify-between` pins the entry div to the right edge of an `overflow-y-auto` container, so it clips.
- Desired behavior: The entry div sits below the mode buttons, left-aligned with the left edge of the "Roll d20" button.
- Constraints: Keep all existing behavior (modes, validation, advantage, flat bonus, close, Escape, click-outside). Keep mobile stacked layout working. Tailwind utility classes only.
- Assumptions: "Left aligned to Roll d20" means the entry div's left edge matches the left edge of the "Roll d20" button, not the name block's left edge.
- Edge cases considered: Long combatant names; narrow/mobile widths (stacked, full width); `roll` mode (no input shown, only result readout); readout shown after an initiative is set; `max-h-[70vh]` scroll container.

## Scope

### In Scope

- Restructure the content area of `InitiativeEntry` into a two-column CSS grid so row 2 / column 2 (controls column) aligns under "Roll d20".
- Move the Advantage / Flat bonus row and the entry div into the controls column, below the mode buttons.
- Unit tests asserting the new structure.

### Out of Scope

- Changes to initiative logic, validation, or props.
- Restyling of buttons, colors, or the modal chrome (title, close button).
- Other components that render initiative (`CombatantCard`, `ActiveCombatView`).

## What Changes

- `lib/components/InitiativeEntry.tsx`: replace the `flex justify-between` content container with a grid (single column on mobile, `auto` + `1fr` columns on `md+`). Identity block in column 1; mode buttons, Advantage/Flat bonus row, and entry/result div stacked in column 2.
- `tests/unit/components/InitiativeEntry.test.tsx`: add layout-structure tests.
- `openspec/specs/initiative-entry/spec.md`: delta adding a layout requirement.

## Risks

- Risk: Grid regressions at md breakpoint (alignment drift if column widths change).
  - Impact: Cosmetic misalignment.
  - Mitigation: Both mode buttons and entry div share one grid cell wrapper so alignment is structural, not pixel-matched; manual check at mobile and desktop widths.
- Risk: jsdom cannot compute layout.
  - Impact: Tests can only assert DOM structure/classes, not pixels.
  - Mitigation: Assert shared parent/ordering and grid classes; verify visually via browser.

## Open Questions

- No unresolved ambiguity. The alignment interpretation (left edge of "Roll d20") and the CSS grid approach were confirmed by the requester in the explore session.

## Non-Goals

- Redesigning the initiative editor.
- Adding new initiative entry modes or fields.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

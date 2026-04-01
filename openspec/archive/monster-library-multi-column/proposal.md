## Why

The `/monsters` page displays all monster cards in a single-column vertical list, wasting significant horizontal space on tablet and desktop screens. With a large library (e.g., the full SRD monster set), this forces excessive scrolling. A responsive multi-column grid makes better use of screen real estate and allows users to browse monsters more efficiently.

## What Changes

- Monster card lists in both "Your Monster Library" and "Global Monster Library" sections change from a single-column stack (`space-y-4`) to a responsive CSS grid (1 col mobile / 2 col tablet / 3 col desktop)
- `MonsterTemplateEditor` is lifted out of the inline list position and rendered as a fixed modal overlay with a dark backdrop, appearing above the grid when creating or editing a monster
- Modal closes on backdrop click or Escape key press (cancels edit)

## Capabilities

### New Capabilities

- `monster-library-grid-layout`: Responsive multi-column grid display for monster cards on the `/monsters` page, with modal-based editor overlay

### Modified Capabilities

<!-- No existing spec-level requirements are changing — this is a layout/UX improvement only -->

## Impact

- `app/monsters/page.tsx`: Two `div.space-y-4` containers changed to grid layout; `MonsterTemplateEditor` lifted into a modal wrapper component
- No API changes
- No data model changes
- No other components affected

## Problem Space

**In scope:**
- `/monsters` page card list layout
- Editor modal UX (open/close/escape/backdrop)
- Responsive breakpoints for the grid

**Out of scope:**
- Card content changes (no modifications to `MonsterTemplateCard` internals)
- `CreatureStatBlock` changes
- Any other page or route

## Scope

Single file change: `app/monsters/page.tsx`. No new components, no new files beyond the spec artifact.

## Risks

- Low risk — purely presentational change with no API or data model impact
- The editor modal must correctly handle the `isAddingTemplate` / `editingMode` state that is already managed by `MonstersContent`; no state refactor is required

## Open Questions

No unresolved ambiguity. All design decisions were confirmed during exploration:
- Grid max columns: 3
- Card content: unchanged (Option A)
- Editor UX: modal overlay with backdrop click + Escape to cancel
- Breakpoints: md (768px) → 2 col, lg (1024px) → 3 col

## Non-Goals

- Virtualized/windowed list rendering for very large libraries
- Pagination or infinite scroll
- Card content redesign or expanded/collapsed toggle states
- Dark/light theme changes

---

*If scope changes after approval, proposal, design, specs, and tasks must be updated before implementation proceeds.*

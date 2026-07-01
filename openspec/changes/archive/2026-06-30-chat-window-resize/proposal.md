## GitHub Issues

- #444

## Why

- Problem statement: The campaign chat window is fixed at 33vh tall and cannot be resized. When a session has significant message history or dice rolls, users must scroll constantly within a cramped panel to review past events.
- Why now: The campaign chat system (messages + rolls) is now feature-complete. Usability improvements like resize are the natural next step.
- Business/user impact: DMs and players reviewing roll history or re-reading scene messages are blocked by the fixed small height. A larger or user-configured chat view significantly reduces context-switching friction during play.

## Problem Space

- Current behavior: `CampaignChat` renders as a `fixed bottom-0 right-0` overlay, always `w-80` wide and `height: 33vh`. Collapsing/pinning is the only size control. No expand or drag-resize exists.
- Desired behavior: Two new resize mechanisms — (1) a square expand icon in the header that toggles the panel to full-height side-by-side mode, and (2) a drag handle at the top edge of the panel that lets users set a custom height. Both states persist across page reloads.
- Constraints:
  - Width stays `w-80` (320px) in all modes — only height resizes.
  - Large/expanded mode must not overlay content — it should become part of the document flow (side-by-side with campaign content).
  - Compact mode (33vh) continues to overlay content as today, no layout changes to the page.
  - Persistence uses existing `localStorage` pattern already in place for pin state.
- Assumptions:
  - Navbar height is ~60px; `calc(100vh - 60px)` is the large-mode height.
  - Screen dimension check uses a simple threshold (±100px) to distinguish a genuine resolution change from minor zoom variation; on mismatch, saved height is discarded and default 33vh applies.
  - Touch/mobile drag support is out of scope for this change.
  - The `CampaignLayout` (`app/campaigns/[id]/layout.tsx`) owns the flex wrapper that enables side-by-side; `CampaignChat` notifies it via an `onSizeChange` callback prop.
- Edge cases considered:
  - User drags to a custom height, then clicks expand: expand overrides to `calc(100vh - 60px)`; returning from expand restores the drag height.
  - Screen size changes between sessions: persisted height is discarded, default 33vh applies.
  - Pinned + large: pinned state is orthogonal — pin keeps the panel open on page load; large controls the height/layout mode.
  - Dragging below minimum height: enforce a minimum of ~150px so the composer is always visible.

## Scope

### In Scope

- Expand toggle button (square icon) in the chat header: compact ↔ large mode
- Large mode: `calc(100vh - 60px)` height, side-by-side layout (not overlay)
- Drag-to-resize handle at the top edge of the chat panel (height only, compact mode only)
- Minimum drag height: 150px
- Persistence of custom drag height + screen dimensions to `localStorage`
- Discarding persisted height when screen dimensions differ beyond ±100px
- `onSizeChange` callback prop on `CampaignChat` so `CampaignLayout` can switch to flex mode
- `DockState` extended with `isLarge: boolean` and `customHeight: number | null`
- Two new `DockAction` types: `TOGGLE_SIZE` and `SET_HEIGHT`

### Out of Scope

- Width resize (always stays `w-80`)
- Touch/mobile drag
- Keyboard resize shortcuts
- Per-campaign size preferences (single global preference)
- Resize animation/transitions

## What Changes

- `lib/components/CampaignChat.tsx`: extend `DockState`/`DockAction`, add `onSizeChange` prop, add drag handle sub-component, add expand button to header
- `app/campaigns/[id]/layout.tsx`: accept `isLarge` state from `CampaignChat` via callback, apply flex wrapper around content + chat in large mode
- `localStorage`: new key `campaign-chat-size` storing `{ height, screenWidth, screenHeight }`

## Risks

- Risk: Drag handle `mousemove` listener leaks if component unmounts during drag
  - Impact: Memory leak, possible phantom drag behavior
  - Mitigation: Attach listeners to `document` and remove them in `mouseup` handler and in cleanup effect
- Risk: Side-by-side layout pushes campaign content too narrow on small screens
  - Impact: Combat tracker or encounter view becomes cramped
  - Mitigation: Large mode only activates on explicit user action; compact mode (overlay) remains the default
- Risk: `calc(100vh - 60px)` breaks if navbar height changes
  - Impact: Chat clips behind navbar or leaves a gap
  - Mitigation: Define navbar height as a CSS custom property or constant; document the assumption clearly

## Open Questions

No unresolved ambiguity remains. All design decisions were confirmed during exploration:
- Persist height with screen dimensions ✓
- Square expand icon ✓
- Large mode height: `calc(100vh - 60px)` ✓
- Width does not change ✓
- Side-by-side layout in expanded mode ✓
- Callback prop (Option A) for layout coordination ✓

## Non-Goals

- Resizing the chat width
- A modal/overlay large mode (side-by-side only)
- Per-session or per-campaign size memory
- Touch drag support
- Animated size transitions

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

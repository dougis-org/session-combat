## GitHub Issues

- dougis-org/session-combat#313
- dougis-org/session-combat#296 (parent epic)

## Why

- **Problem statement:** Multi-user campaign sessions need a persistent chat surface accessible from anywhere in the app. Phase 4 (4c) establishes the dock shell — the collapsible/pinnable container — so Phases 5 and 6 can wire in real-time messaging and roll-sharing without rethinking the chrome.
- **Why now:** 4a (SSE endpoint) and 4b (`useCampaignStream` hook) have no upstream blockers. 4c also has none — it is pure layout. Doing it now unblocks the visual integration work.
- **Business/user impact:** DMs running live sessions need chat that stays out of the way when not needed but is instantly reachable. The collapsed pill satisfies "doesn't obstruct"; the pin-open control satisfies "stays open when I'm actively using it."

## Problem Space

- **Current behavior:** No chat surface exists anywhere in the app.
- **Desired behavior:** A fixed corner pill (bottom-right) is always present in the browser. Clicking it expands a drawer (`w-80`, `h-[33vh]`). A pin button persists the expanded state across page loads via `LocalStore`. Dismissing collapses it back to the pill. No data or messages — layout and interaction states only.
- **Constraints:**
  - Must sit at `z-40` so `Modal` components (`z-50`) always render above it.
  - `LocalStore` (versioned localStorage abstraction) must be used for pin persistence — no raw `localStorage` calls.
  - No data wiring: no props for campaign ID, no event stream, no message list.
  - Must be keyboard-accessible (focusable buttons, Escape to collapse, `aria-pressed` on pin).
- **Assumptions:**
  - Session-gating ("only show when user has an active campaign session") is deferred to Phase 5.
  - The dock always renders for now, showing placeholder body content.
  - Unpinning while expanded leaves the drawer open for the current session; pin only controls initial state on next load.
- **Edge cases considered:**
  - SSR: `LocalStore` has an `isBrowser()` guard — safe on server render, pin state hydrates client-side.
  - Modal open + dock expanded simultaneously: `z-40` vs `z-50` ensures no conflict.
  - Escape key while pinned: still collapses (pin is about reload, not locking the UI).

## Scope

### In Scope

- `lib/components/CampaignChat.tsx` — new `'use client'` component
- Mount point in `app/layout.tsx` (add `<CampaignChat />` before `</body>`)
- Collapsed pill state: `fixed bottom-4 right-4 z-40`, rounded-full button
- Expanded drawer state: `fixed bottom-0 right-0 w-80 h-[33vh] z-40`, flex-col layout
- Pin toggle with `LocalStore` persistence (key: `campaign-chat-pin`)
- Keyboard accessibility: focusable buttons, Escape to collapse, `role="complementary"`, `aria-label`, `aria-pressed` on pin
- Unit tests for collapse/expand, pin persistence, Escape key, and aria attributes

### Out of Scope

- Real-time data wiring (Phase 5, issue #315)
- Roll-share UI (Phase 6, issue #317)
- Session-gating / active-campaign detection
- Animations or CSS transitions (not required by acceptance criteria)
- Mobile / responsive breakpoints beyond fixed positioning

## What Changes

- **New file:** `lib/components/CampaignChat.tsx` — the dock shell component
- **Modified file:** `app/layout.tsx` — import and render `<CampaignChat />` inside `<body>`
- **New file:** `tests/unit/components/CampaignChat.test.tsx` — unit tests

## Risks

- Risk: `LocalStore` versioning causes pin state to be silently dropped on version bump.
  - Impact: Low — users lose their pin preference, not data. Dock defaults to collapsed.
  - Mitigation: Use a dedicated key (`campaign-chat-pin`) so a version bump only resets this preference, not other stored state.

- Risk: `z-40` dock visible beneath open modals looks odd if the drawer is expanded when a modal opens.
  - Impact: Low — visual layering is correct (`z-50` modal wins); no functional issue.
  - Mitigation: Acceptable for this phase. Future phase may add "collapse on modal open" logic.

## Open Questions

No unresolved ambiguity remains. All design decisions were confirmed during exploration:
- Dock position: bottom-right corner pill (Option A) ✓
- Always renders (no session gating for now) ✓
- `z-40` for dock ✓
- Unpin = don't reopen next time (not collapse immediately) ✓
- Expanded height: `h-[33vh]`, width: `w-80` ✓

## Non-Goals

- This is not a full chat feature — no messages, no users, no real-time data.
- This is not a responsive/mobile layout — the dock is desktop-first.
- This does not implement session presence or "who's online" indicators.
- This does not introduce any new design tokens beyond what Tailwind v4 stock provides.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

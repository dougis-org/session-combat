## Context

- Relevant architecture: `CampaignChat` is a client component rendered in `app/campaigns/[id]/layout.tsx`. It manages its own dock state via `useReducer` (dockReducer). Pin state is persisted to `localStorage` via the existing `LocalStore` helpers (`safeGet`/`safeSet`/`safeRemove`). The component is currently always `fixed bottom-0 right-0`, overlaying campaign content.
- Dependencies: `lib/components/CampaignChat.tsx`, `app/campaigns/[id]/layout.tsx`, `lib/offline/LocalStore.ts` (existing localStorage abstraction)
- Interfaces/contracts touched:
  - `DockState` and `DockAction` types (internal to `CampaignChat.tsx`)
  - `CampaignChat` component props (add `onSizeChange?: (isLarge: boolean) => void`)
  - `localStorage` key `campaign-chat-size` (new)

## Goals / Non-Goals

### Goals

- Users can expand chat to a full-height (calc(100vh - 60px)) side-by-side panel
- Users can drag the top edge of the compact panel to set a custom height
- Both size preferences persist across page loads (with screen-dimension guard)
- Layout coordinator: `CampaignLayout` switches to flex side-by-side when chat is large

### Non-Goals

- Width resize
- Touch/mobile drag
- Animated transitions
- Per-campaign size memory

## Decisions

### Decision 1: Extend DockState rather than new top-level state

- Chosen: Add `isLarge: boolean` and `customHeight: number | null` to `DockState`; add `TOGGLE_SIZE` and `SET_HEIGHT` actions to `DockAction`
- Alternatives considered: Separate `useState` for size; extract a `useChatSize` hook
- Rationale: All dock state is already co-located in `dockReducer`. Keeping size there maintains a single source of truth and makes persistence logic (which runs once on mount) straightforward.
- Trade-offs: `dockReducer` grows slightly; acceptable given it remains focused on dock UI state

### Decision 2: Callback prop for layout coordination (Option A)

- Chosen: Add `onSizeChange?: (isLarge: boolean) => void` prop to `CampaignChat`. `CampaignLayout` owns `isLarge` state, passes setter as the callback. Layout wraps content + chat in `<div className="flex h-screen">` when large, otherwise renders chat as a floating child.
- Alternatives considered: CSS `:has()` selector on a shared ancestor; React context for chat size
- Rationale: The layout already passes `activeSessionId` to `CampaignChat` — adding one more prop is minimal coupling and avoids the browser support caveats of `:has()` and the indirection of context.
- Trade-offs: Layout and chat are more tightly coupled than today; acceptable because they already share a parent–child relationship

### Decision 3: Height resolution order

- Chosen:
  1. `isLarge === true` → `calc(100vh - 60px)` (ignores `customHeight`)
  2. `customHeight !== null` → `${customHeight}px`
  3. Default → `33vh`
  Clicking expand sets `isLarge`, clears nothing (customHeight preserved as the "return" height). Clicking expand again restores to customHeight if set, else 33vh.
- Alternatives considered: Three named sizes (compact / custom / large) as enum
- Rationale: Preserving `customHeight` across expand/collapse cycles matches user expectation ("expand to see more, collapse back to where I was")
- Trade-offs: State has two booleans that interact; covered by the resolution order rule

### Decision 4: Drag handle implementation

- Chosen: A `<div>` with `cursor: ns-resize` sits at the top of the expanded drawer (compact mode only). `onMouseDown` records `startY` and `startHeight`, then attaches `mousemove`/`mouseup` to `document`. `mousemove` dispatches `SET_HEIGHT` with clamped value (min 150px). `mouseup` removes listeners and persists to localStorage.
- Alternatives considered: CSS `resize: vertical` on the container; a library (react-resizable)
- Rationale: CSS `resize` cannot be controlled via React state and doesn't play well with fixed positioning. A minimal event-listener approach has zero new dependencies.
- Trade-offs: Requires careful cleanup on unmount; mitigated by tracking drag state in a ref and cleaning up in a `useEffect` return

### Decision 5: localStorage persistence with screen guard

- Chosen: Key `campaign-chat-size` stores `{ height: number, screenWidth: number, screenHeight: number }`. On mount, read the saved value. If `Math.abs(saved.screenWidth - window.innerWidth) > 100 || Math.abs(saved.screenHeight - window.innerHeight) > 100`, ignore saved height and use 33vh default. `isLarge` is NOT persisted — expanding is an intentional per-session action.
- Alternatives considered: Persisting `isLarge`; using CSS `em`-based storage
- Rationale: Large mode is an active "I want to see more right now" gesture, not a sticky preference. Height in pixels is what the user explicitly set by dragging.
- Trade-offs: After a screen resize, users lose their custom height; this is preferable to a broken layout.

### Decision 6: Minimum drag height

- Chosen: 150px minimum enforced in `SET_HEIGHT` reducer action via `Math.max(150, newHeight)`
- Rationale: Ensures the message composer is always visible and the panel remains usable

## Proposal to Design Mapping

- Proposal element: Expand button (square icon) toggles compact ↔ large
  - Design decision: Decision 1 (`TOGGLE_SIZE` action), Decision 3 (height resolution)
  - Validation approach: Unit test that clicking expand icon dispatches TOGGLE_SIZE and applies calc height; RTL test
- Proposal element: Large mode is side-by-side, not overlay
  - Design decision: Decision 2 (`onSizeChange` prop + layout flex wrapper)
  - Validation approach: RTL test confirms layout has `flex` class when chat is large; E2E smoke test
- Proposal element: Drag-to-resize on top edge
  - Design decision: Decision 4 (drag handle with document listeners)
  - Validation approach: Unit test for SET_HEIGHT reducer; RTL test simulating mousedown/mousemove
- Proposal element: Persist height with screen guard
  - Design decision: Decision 5 (localStorage key with dimensions)
  - Validation approach: Unit test for load logic with matching and mismatched screen sizes
- Proposal element: Expand overrides drag height
  - Design decision: Decision 3 (height resolution order)
  - Validation approach: Unit test that isLarge=true yields calc height regardless of customHeight value
- Proposal element: Minimum 150px drag height
  - Design decision: Decision 6 (reducer clamp)
  - Validation approach: Unit test that SET_HEIGHT with value < 150 clamps to 150

## Functional Requirements Mapping

- Requirement: User can expand chat to full-height side-by-side mode
  - Design element: Decision 1 (TOGGLE_SIZE), Decision 2 (layout prop), Decision 3 (height resolution)
  - Acceptance criteria reference: chat-window-resize spec → expand-toggle capability
  - Testability notes: RTL — render CampaignChat with onSizeChange mock, click expand button, assert mock called with true; assert inline style uses calc value
- Requirement: User can drag top edge to set custom height
  - Design element: Decision 4 (drag handle)
  - Acceptance criteria reference: chat-window-resize spec → drag-resize capability
  - Testability notes: RTL — simulate mousedown on drag handle, mousemove, mouseup; assert customHeight state updated; assert style reflects new height
- Requirement: Custom height persists across reloads (same screen)
  - Design element: Decision 5 (localStorage)
  - Acceptance criteria reference: chat-window-resize spec → persistence capability
  - Testability notes: Unit test — mock localStorage, call load logic with matching screen dims, assert customHeight applied
- Requirement: Height resets on screen change
  - Design element: Decision 5 (screen guard)
  - Acceptance criteria reference: chat-window-resize spec → persistence capability
  - Testability notes: Unit test — mock with differing screen dims, assert customHeight defaults to 33vh
- Requirement: Drag height minimum 150px
  - Design element: Decision 6 (reducer clamp)
  - Acceptance criteria reference: chat-window-resize spec → drag-resize capability
  - Testability notes: Unit test — dispatch SET_HEIGHT(50), assert state.customHeight === 150

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No event listener leaks when component unmounts during drag
  - Design element: Decision 4 (cleanup in mouseup + useEffect return)
  - Acceptance criteria reference: Code review / static analysis
  - Testability notes: Unit test simulating unmount during drag; verify no lingering listeners
- Requirement category: performance
  - Requirement: Drag should not cause excessive re-renders
  - Design element: Decision 4 — throttle or RAF not required at this scale; state is only set on mouseup (not every mousemove pixel)
  - Acceptance criteria reference: Visual inspection during testing
  - Testability notes: Observe no jank in manual testing
- Requirement category: operability
  - Requirement: localStorage errors must not crash the chat
  - Design element: Existing `safeGet`/`safeSet` wrappers absorb errors silently; size logic uses same pattern
  - Acceptance criteria reference: Existing pattern already tested
  - Testability notes: Unit test — mock LocalStore.get to throw, assert component renders without error

## Risks / Trade-offs

- Risk/trade-off: Navbar height assumption (60px) baked into `calc(100vh - 60px)`
  - Impact: Chat clips behind navbar or leaves visible gap if navbar height changes
  - Mitigation: Document the 60px assumption in a code comment; define as a named constant
- Risk/trade-off: Layout flex wrapper changes DOM structure for campaign pages
  - Impact: Any CSS that relies on the current fixed-position layout of campaign content may shift
  - Mitigation: Large mode is opt-in; default layout is unchanged; run visual regression smoke after implementation

## Rollback / Mitigation

- Rollback trigger: Chat panel breaks existing campaign page layout; regression in compact/pin behavior
- Rollback steps: Revert the PR; no database migrations involved
- Data migration considerations: None — only localStorage, which degrades gracefully (ignored on version mismatch or missing key)
- Verification after rollback: Confirm chat pill renders, expand/collapse works, pin state persists

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing tests/build before requesting review.
- If security checks fail: Do not merge. Address all findings; this change touches localStorage and DOM event listeners — verify no XSS vectors.
- If required reviews are blocked/stale: Ping reviewers after 48h; escalate to maintainer after 72h.
- Escalation path and timeout: Maintainer (@dougis) resolves after 72h of no reviewer response.

## Open Questions

No open questions. All design decisions are resolved.

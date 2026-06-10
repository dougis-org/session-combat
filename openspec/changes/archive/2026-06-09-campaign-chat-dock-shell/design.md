## Context

- **Relevant architecture:** Next.js App Router, `app/layout.tsx` is an async server component wrapping `<NavBar />`, a scrollable content area, and a footer. Client components are imported directly into server components in App Router — `CampaignChat` will be one such import.
- **Dependencies:** `lib/offline/LocalStore.ts` (versioned localStorage abstraction), `lib/components/` (existing component patterns), Tailwind v4 (stock tokens only — no custom palette).
- **Interfaces/contracts touched:**
  - `app/layout.tsx` — adds `<CampaignChat />` before `</body>`
  - `lib/offline/LocalStore.ts` — `LocalStore.get` / `LocalStore.set` / `LocalStore.remove` for pin state
  - No API routes, no data fetching, no shared context providers touched.

## Goals / Non-Goals

### Goals

- Deliver a fixed-position dock shell with two visual states (collapsed pill, expanded drawer)
- Persist pin preference across page loads via `LocalStore`
- Mount globally in `app/layout.tsx` so it appears on every route
- Meet keyboard accessibility requirements: focusable controls, Escape to collapse, `aria-pressed` on pin, `role="complementary"`

### Non-Goals

- Data wiring (stream, messages, campaign ID) — Phase 5
- Session-gating logic — Phase 5
- Animations/transitions — not in acceptance criteria
- Mobile layout optimisation

## Decisions

### Decision 1: Component placement — `lib/components/` not `app/`

- **Chosen:** `lib/components/CampaignChat.tsx`
- **Alternatives considered:** `app/_components/CampaignChat.tsx` (co-located with layout)
- **Rationale:** All reusable UI components live in `lib/components/`. Future phases wire the dock to data hooks from `lib/hooks/` — keeping it in `lib/` maintains that locality. The issue spec also explicitly names `lib/components/` as the target.
- **Trade-offs:** None meaningful at this scale.

### Decision 2: Always render (no session-gating prop for now)

- **Chosen:** `CampaignChat` renders unconditionally — no `campaignId` prop, no visibility gate.
- **Alternatives considered:** Accept an optional `campaignId?: string` and render nothing when absent.
- **Rationale:** Session-gating is Phase 5 work. Adding a prop slot now without wiring it risks dead code and test surface that's never exercised. The issue explicitly scopes this to "layout/states/a11y only."
- **Trade-offs:** The pill is visible to all users on all pages until Phase 5 gates it. Acceptable as a dev/testing convenience — confirmed by user.

### Decision 3: `LocalStore` for pin persistence (key `campaign-chat-pin`)

- **Chosen:** `LocalStore.get<boolean>('campaign-chat-pin')` / `LocalStore.set('campaign-chat-pin', true)`
- **Alternatives considered:** Raw `localStorage`, a React context with a reducer.
- **Rationale:** `LocalStore` provides SSR safety (`isBrowser()` guard) and versioned envelopes. Raw `localStorage` is not used anywhere else in components — consistency matters.
- **Trade-offs:** `LocalStore` wraps the value in a version envelope. A storage-version bump drops the pin preference silently (user gets collapsed dock). Acceptable — this is a UI preference, not data.

### Decision 4: `z-40` for dock, `z-50` for Modals

- **Chosen:** `z-40` on all dock elements.
- **Alternatives considered:** `z-50` (same as Modal).
- **Rationale:** Modals must always render above the dock. `z-50` stacking by DOM order is fragile. Explicit separation is safer.
- **Trade-offs:** If the expanded drawer is open when a modal fires, the modal cleanly overlays the dock — no functional issue, minor visual layering that's expected.

### Decision 5: Unpin = "don't reopen next time" not "collapse immediately"

- **Chosen:** Toggling pin off only clears the `LocalStore` entry; current `isExpanded` state is untouched.
- **Alternatives considered:** Collapse immediately on unpin.
- **Rationale:** User opened the drawer intentionally this session. Closing it as a side effect of toggling a persistence preference is surprising. Confirmed by user.
- **Trade-offs:** Slight mental model complexity ("pin is about reload, not current state") — addressed by `aria-pressed` labeling.

### Decision 6: Escape key collapses regardless of pin state

- **Chosen:** Escape always collapses; pin state is not consulted.
- **Alternatives considered:** Escape does nothing while pinned.
- **Rationale:** Keyboard users expect Escape to dismiss overlays. Pin is a persistence preference, not a lock.
- **Trade-offs:** Pin-then-Escape leaves the dock collapsed until next reload (when it reopens). This is the correct mental model: Escape = "I want this gone right now."

## Proposal to Design Mapping

- Proposal element: Corner pill, `fixed bottom-4 right-4 z-40`
  - Design decision: D4 (z-40), D1 (component location)
  - Validation approach: RTL — assert pill button is in the document; CSS class snapshot or computed style check

- Proposal element: Expanded drawer `w-80`, height `33vh` via inline style, anchored `bottom-0 right-0`
  - Design decision: D1, D4
  - Validation approach: RTL — after clicking pill, assert drawer is present with correct role/aria-label

- Proposal element: Pin persisted via `LocalStore`
  - Design decision: D3, D5
  - Validation approach: Unit test mocking `LocalStore` — assert `set` called on pin toggle, `get` read on mount, `isExpanded` defaults to pin value

- Proposal element: Always renders
  - Design decision: D2
  - Validation approach: Render with no props, assert pill present

- Proposal element: Escape collapses
  - Design decision: D6
  - Validation approach: RTL — expand drawer, fire `keydown` Escape, assert drawer gone

## Functional Requirements Mapping

- Requirement: Dock collapses/expands on button click
  - Design element: `isExpanded` state toggled by pill button and close button
  - Acceptance criteria reference: "dock collapses/expands"
  - Testability notes: RTL `userEvent.click` on pill → assert drawer present; click close → assert drawer absent

- Requirement: Pin state survives reload
  - Design element: `LocalStore.get` on mount sets initial `isExpanded`; `LocalStore.set/remove` on pin toggle
  - Acceptance criteria reference: "pin survives reload"
  - Testability notes: Mock `LocalStore.get` returning `true` → assert `isExpanded` defaults to `true`

- Requirement: Doesn't obstruct page when collapsed
  - Design element: Collapsed pill is `rounded-full` small button at corner; no full-width bar
  - Acceptance criteria reference: "doesn't obstruct the page when collapsed"
  - Testability notes: Visual / snapshot; confirm drawer element absent when collapsed

- Requirement: Keyboard accessible
  - Design element: All interactive elements are `<button>`; Escape handler on drawer; `aria-pressed` on pin; `role="complementary"` on drawer; `aria-label="Campaign Chat"` on drawer
  - Acceptance criteria reference: "keyboard-accessible"
  - Testability notes: RTL — assert `getByRole('button', { name: /chat/i })`, `getByRole('complementary')`, `getByRole('button', { name: /pin/i, pressed: false })`

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: SSR-safe — no `localStorage` access during server render
  - Design element: `LocalStore` has `isBrowser()` guard; `useEffect` for mount-time pin read
  - Acceptance criteria reference: No hydration errors
  - Testability notes: Jest runs in jsdom; confirm no `localStorage` calls at module import time

- Requirement category: operability
  - Requirement: No regressions to existing pages — dock is additive, `fixed` positioned
  - Design element: `fixed` positioning takes the dock out of document flow; no layout shifts
  - Acceptance criteria reference: Existing test suite passes
  - Testability notes: Run full unit test suite; no existing test should fail

## Risks / Trade-offs

- Risk/trade-off: `LocalStore` version bump silently drops pin state
  - Impact: Low — user gets collapsed dock on next load; no data loss
  - Mitigation: Isolated key (`campaign-chat-pin`) limits blast radius to this preference only

- Risk/trade-off: Dock visible on all pages including `/login` and 404
  - Impact: Low — shows placeholder pill with no data, harmless
  - Mitigation: Phase 5 introduces session-gating; acceptable for shell phase

## Rollback / Mitigation

- **Rollback trigger:** Hydration errors in production, or visual regression reports from the dock obstructing critical UI
- **Rollback steps:** Revert `app/layout.tsx` to remove `<CampaignChat />` import and usage; delete `lib/components/CampaignChat.tsx` and its test file
- **Data migration considerations:** `LocalStore` key `campaign-chat-pin` remains in users' browsers but is harmless — no reader after rollback
- **Verification after rollback:** Deploy, confirm no pill visible, run smoke tests on `/combat` and `/encounters`

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix failing tests or type errors before requesting review.
- **If security checks fail:** Do not merge. This change introduces no auth, no API surface, no user input beyond button clicks — a security failure would indicate a dependency issue requiring investigation.
- **If required reviews are blocked/stale:** Ping reviewer after 24 hours; escalate to repo owner after 48 hours.
- **Escalation path and timeout:** After 48 hours unreviewed, repo owner (`dougis`) decides whether to merge or defer.

## Open Questions

No open questions remain. All design decisions confirmed during exploration session.

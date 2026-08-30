## Purpose

Provide a persistent lower-left dice fab, visible on every page for authenticated users, that opens a standalone dice-pool modal (including a percentile control) usable with no campaign or session context, and can send a result to session chat when dice-session presence exists.

## Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-08-22-decouple-dice-panel-from-chat/design.md) document, not a replacement.

### Requirement: Persistent dice fab visible on every page for authenticated users

The system SHALL render a fixed-position d20 icon button in the lower-left corner of every page, mounted once from the root layout, visible only to authenticated users.

#### Scenario: Fab renders for an authenticated user on any page

- **Given** a logged-in user (per `useAuth()`) navigates to any route in the app
- **When** the page renders
- **Then** a fixed-position button with an accessible name matching `/roll|dice/i` is present in the lower-left corner of the viewport

#### Scenario: Fab is absent for an unauthenticated user

- **Given** `useAuth()` reports `user: null` (not logged in, or session check still resolving to unauthenticated)
- **When** any page renders
- **Then** the dice fab is not present in the document (not merely disabled)

#### Scenario: Fab persists across client-side navigation

- **Given** a logged-in user is on one page with the fab visible
- **When** the user navigates client-side to a different route
- **Then** the fab remains visible without a full page reload, and its open/closed modal state is not preserved across the navigation (the modal closes, if open, on navigation)

---

### Requirement: Standalone dice pool modal with no session dependency

The system SHALL let an authenticated user open a modal anchored to the bottom-left corner over the trigger button from the fab that provides a dice pool builder (add/remove d4/d6/d8/d10/d12/d20, edit a shared modifier) and roll it using `rollDicePool()`, entirely independent of any campaign or session context, with no network request required to see a result. Each die control SHALL be rendered via the shared `DiePoolButton` component (see `dice-iconography` capability), showing the die's icon, staged count, and a persistent visible `d{sides}` label. The modal SHALL also present a standalone percentile control (shared `PercentileButton`, `d%` glyph) that produces a single percentile result via `buildPercentileRoll()` (see `dice-pool-shared-state` capability), separate from the staged pool.

#### Scenario: Opening the fab shows a modal anchored to the bottom-left

- **Given** the fab is visible and the modal is closed
- **When** the user clicks the fab
- **Then** a modal appears with its bottom-left corner overlaying the trigger button containing die add/remove controls for all six supported sizes and a modifier input
- **And** the background dimming overlay is displayed

#### Scenario: Each die control shows a persistent visible label

- **Given** the modal is open
- **When** the six die controls are inspected
- **Then** each renders the visible text `d{sides}` matching its own die size (as rendered content, not only a tooltip)

#### Scenario: Rolling with no active-session presence produces a local result and no network call

- **Given** the modal is open, no `CampaignChat` presence has been announced (see `dice-session-bridge` capability), and the pool has at least one die staged
- **When** the user rolls
- **Then** the modal displays the individual die results and total computed by `rollDicePool()`, and no HTTP request is made

#### Scenario: Empty pool cannot be rolled

- **Given** the modal is open and every die size has a staged count of 0
- **When** the user looks at the roll control
- **Then** the pool roll control is disabled (the standalone percentile control is unaffected by the staged-pool count)

#### Scenario: Percentile control produces a local d% result

- **Given** the modal is open and no presence has been announced
- **When** the user activates the percentile control
- **Then** the modal displays a result with `formula` `d%` and a total in 1..100 computed by `buildPercentileRoll()`, and no HTTP request is made

#### Scenario: A local percentile result is sendable to session chat on the same terms as a pool roll

- **Given** dice-session presence exists and the user has just produced a percentile result
- **When** the user clicks "send to session chat"
- **Then** the fab calls the shared `submitRoll` with `formula: "d%"`, `rolls: [value]`, `total: value`, and the current visibility, and `sendState` transitions per the shared submission result

---

### Requirement: ADDED Modal closes only on Escape or outside click, never on a timeout

The system SHALL close the standalone dice modal when the user presses Escape or clicks outside the modal, and SHALL NOT close it automatically after any elapsed time.

#### Scenario: Escape closes the modal

- **Given** the modal is open
- **When** the user presses the Escape key
- **Then** the modal is removed from the document

#### Scenario: Outside click closes the modal

- **Given** the modal is open
- **When** the user clicks anywhere outside the modal's boundary (and outside the fab trigger itself)
- **Then** the modal is removed from the document

#### Scenario: Modal remains open indefinitely absent Escape or outside click

- **Given** the modal is open and displaying a rolled result
- **When** an extended period of time elapses with no Escape press or outside click
- **Then** the modal remains open (no timer-driven auto-close exists in the component)

---

### Requirement: MODIFIED "Send to session chat" option appears only while a matching campaign session is present

_(Modified 2026-08-29, `decouple-dice-roll-capability`.)_ The system SHALL show a "send to session chat" control in the modal only while the dice-session bridge (see `dice-session-bridge` capability) reports a non-null presence, and SHALL omit it otherwise. Choosing to send SHALL call the shared roll-submission capability (`lib/dice/useRollSubmission.ts`, see `dice-pool-shared-state` capability) directly with the current presence's `campaignId` and the rolled `{formula, rolls, total, visibility}`, rather than routing the request through `lib/dice/diceSessionBridge.ts`'s `requestRoll`.

#### Scenario: Option hidden with no presence

- **Given** the modal is open and no presence has been announced (the user is not on a campaign page with an active session)
- **When** the user rolls
- **Then** no "send to session chat" control is shown alongside the result

#### Scenario: Option shown once presence is announced

- **Given** the user is on a campaign page whose `CampaignChat` has announced presence for `{campaignId, sessionId}`
- **When** the user opens the fab's modal and rolls
- **Then** a "send to session chat" control is shown alongside the result

#### Scenario: Choosing to send submits the roll directly, using current presence

- **Given** presence is currently `{campaignId: "camp-1", sessionId: "sess-1"}` and the
  user has just rolled
- **When** the user clicks "send to session chat"
- **Then** the fab calls the shared `submitRoll` function with `campaignId: "camp-1"` and
  the rolled `{formula, rolls, total, visibility}`, using the *current* presence value at
  the time of the click, not a value cached from when the modal was opened, and awaits its
  `'success' | 'conflict' | 'error'` result directly (no `onResult` callback indirection)

#### Scenario: Successful send updates sendState from the direct submission result

- **Given** the user has clicked "send to session chat"
- **When** `submitRoll` resolves to `'success'`
- **Then** `sendState` transitions to `'sent'` and the confirmation message is shown

#### Scenario: Conflict or error result updates sendState to failed

- **Given** the user has clicked "send to session chat"
- **When** `submitRoll` resolves to `'conflict'` or `'error'`
- **Then** `sendState` transitions to `'failed'` and the retry affordance is shown

---

### Requirement: ADDED Sending to session chat succeeds whether or not CampaignChat is mounted

_(Added 2026-08-29, `decouple-dice-roll-capability`.)_ The system SHALL cause `GlobalDiceFab`'s "send to session chat" action to succeed based solely on whether dice-session presence exists (see `dice-session-bridge` capability), independent of whether any `CampaignChat` instance is currently mounted anywhere on the page.

#### Scenario: Send succeeds with presence but no mounted CampaignChat

- **Given** dice-session presence is `{campaignId: "c1", sessionId: "s1"}` (announced by a
  `CampaignChat` instance that has since unmounted, or by any future presence-announcing
  surface), and no `CampaignChat` instance is currently mounted
- **When** the user rolls in `GlobalDiceFab`'s modal and clicks "Send to session chat"
- **Then** the roll is submitted to `/api/campaigns/c1/rolls` and the send succeeds
  (`sendState` transitions to `'sent'` on a 201 response), exactly as it would if
  `CampaignChat` were mounted

#### Scenario: Send fails only for genuine submission errors, not for absent chat

- **Given** presence exists and the user clicks "Send to session chat"
- **When** the server responds with a non-201, non-409 status or the request throws
- **Then** `sendState` transitions to `'failed'`, and the failure reason is a real
  submission error — never "no CampaignChat instance available to receive the request"

---

## Traceability

- Proposal element "Persistent d20 icon, lower-left corner, every page, requires login" → Requirements: ADDED Persistent dice fab visible on every page for authenticated users
- Proposal element "Center-screen modal, pool builder + result" → Requirements: ADDED Standalone dice pool modal with no session dependency
- Proposal element "Escape/outside-click close, no timeout" → Requirements: ADDED Modal closes only on Escape or outside click, never on a timeout
- Proposal element "Additional option to send the roll to session chat when applicable" → Requirements: ADDED "Send to session chat" option appears only while a matching campaign session is present
- Proposal element "Repositioning the GlobalDiceFab panel fixed to the bottom-left corner" → Requirements: MODIFIED Global Dice Panel Positioning
- Proposal element "Replacing native title attributes with custom instant tooltips" → Requirements: ADDED Instant tooltips for dice buttons
- Design decision 1 (global fab + modal, root-layout mount) → Requirements: all ADDED requirements in this capability
- Design decision 1 (Panel Positioning strategy) → Requirements: MODIFIED Global Dice Panel Positioning
- (2026-08-29, `decouple-dice-roll-capability`) Proposal "What Changes" (`GlobalDiceFab` updated to submit directly) → Requirements: MODIFIED "Send to session chat" option, ADDED Sending to session chat succeeds whether or not CampaignChat is mounted
- Design decision 2 (Instant Tooltips implementation) → Requirements: ADDED Instant tooltips for dice buttons
- Requirement → Task(s): see `openspec/changes/archive/2026-08-22-decouple-dice-panel-from-chat/tasks.md`, "GlobalDiceFab" task group

## Non-Functional Acceptance Criteria

### Performance

#### Scenario: Modal mounts only while open

- **Given** the fab is rendered on a page but the modal has never been opened
- **When** the page's DOM is inspected
- **Then** no modal DOM subtree exists until the user first opens it (mirrors the existing content-driven, mount-on-open pattern already used for the in-chat dice pop-out)

### Security

See functional scenario: "Fab is absent for an unauthenticated user". No additional access-control surface is introduced: as of `decouple-dice-roll-capability` (2026-08-29), the fab submits directly to `/api/campaigns/[id]/rolls` via the shared `lib/dice/useRollSubmission.ts` capability (see `dice-pool-shared-state`) rather than through `CampaignChat`, but that server route (see `roll-share-ui` capability) remains the sole authorization/validation boundary and is unaffected by this change.

### Reliability

#### Scenario: No `document` access during server render

- **Given** the fab (including its modal) is rendered in a Node.js (non-browser) environment
- **When** the module is imported and the component tree is server-rendered
- **Then** no `document`/portal-root access is attempted, matching the existing SSR-safety pattern already established for the in-chat dice pop-out (`CampaignChat.dicePool.ssr.test.tsx`)

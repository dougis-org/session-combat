## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Persistent dice fab visible on every page for authenticated users

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

### Requirement: ADDED Standalone dice pool modal with no session dependency

The system SHALL let an authenticated user open a center-screen modal from the fab that provides a dice pool builder (add/remove d4/d6/d8/d10/d12/d20, edit a shared modifier) and roll it using `rollDicePool()`, entirely independent of any campaign or session context, with no network request required to see a result.

#### Scenario: Opening the fab shows a center-screen modal

- **Given** the fab is visible and the modal is closed
- **When** the user clicks the fab
- **Then** a modal appears centered in the viewport containing die add/remove controls for all six supported sizes and a modifier input

#### Scenario: Rolling with no active-session presence produces a local result and no network call

- **Given** the modal is open, no `CampaignChat` presence has been announced (see `dice-session-bridge` capability), and the pool has at least one die staged
- **When** the user rolls
- **Then** the modal displays the individual die results and total computed by `rollDicePool()`, and no HTTP request is made

#### Scenario: Empty pool cannot be rolled

- **Given** the modal is open and every die size has a staged count of 0
- **When** the user looks at the roll control
- **Then** the roll control is disabled

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

### Requirement: ADDED "Send to session chat" option appears only while a matching campaign session is present

The system SHALL show a "send to session chat" control in the modal only while the dice-session bridge (see `dice-session-bridge` capability) reports a non-null presence, and SHALL omit it otherwise.

#### Scenario: Option hidden with no presence

- **Given** the modal is open and no presence has been announced (the user is not on a campaign page with an active session)
- **When** the user rolls
- **Then** no "send to session chat" control is shown alongside the result

#### Scenario: Option shown once presence is announced

- **Given** the user is on a campaign page whose `CampaignChat` has announced presence for `{campaignId, sessionId}`
- **When** the user opens the fab's modal and rolls
- **Then** a "send to session chat" control is shown alongside the result

#### Scenario: Choosing to send emits a scoped roll request

- **Given** presence is currently `{campaignId: "camp-1", sessionId: "sess-1"}` and the user has just rolled
- **When** the user clicks "send to session chat"
- **Then** the fab calls the bridge's roll-request function with `{campaignId: "camp-1", sessionId: "sess-1", roll: {formula, rolls, total, visibility}}` using the *current* presence value at the time of the click, not a value cached from when the modal was opened

---

## Traceability

- Proposal element "Persistent d20 icon, lower-left corner, every page, requires login" → Requirements: ADDED Persistent dice fab visible on every page for authenticated users
- Proposal element "Center-screen modal, pool builder + result" → Requirements: ADDED Standalone dice pool modal with no session dependency
- Proposal element "Escape/outside-click close, no timeout" → Requirements: ADDED Modal closes only on Escape or outside click, never on a timeout
- Proposal element "Additional option to send the roll to session chat when applicable" → Requirements: ADDED "Send to session chat" option appears only while a matching campaign session is present
- Design decision 1 (global fab + modal, root-layout mount) → Requirements: all ADDED requirements in this capability
- Requirement → Task(s): see `openspec/changes/decouple-dice-panel-from-chat/tasks.md`, "GlobalDiceFab" task group

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Modal mounts only while open

- **Given** the fab is rendered on a page but the modal has never been opened
- **When** the page's DOM is inspected
- **Then** no modal DOM subtree exists until the user first opens it (mirrors the existing content-driven, mount-on-open pattern already used for the in-chat dice pop-out)

### Requirement: Security

See functional scenario: "Fab is absent for an unauthenticated user". No additional access-control surface is introduced: the fab never calls the rolls API directly except via the existing `CampaignChat`-owned POST path (see `roll-share-ui` capability), which is unaffected by this change.

### Requirement: Reliability

#### Scenario: No `document` access during server render

- **Given** the fab (including its modal) is rendered in a Node.js (non-browser) environment
- **When** the module is imported and the component tree is server-rendered
- **Then** no `document`/portal-root access is attempted, matching the existing SSR-safety pattern already established for the in-chat dice pop-out (`CampaignChat.dicePool.ssr.test.tsx`)

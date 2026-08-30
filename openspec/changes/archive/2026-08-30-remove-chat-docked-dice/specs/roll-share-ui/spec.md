## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Chat dock shows a no-active-session footer instead of a dice bar

The chat dock's drawer SHALL render a footer strip **only when** `activeSessionId` is
`null`, containing exactly the text "No active session" and no interactive controls. When
`activeSessionId` is a non-null string the drawer SHALL render no footer strip at all
(the chat feed and composer fill the drawer). The dice pop-out trigger that previously
shared this strip SHALL NOT be rendered under any condition (see the REMOVED requirements
below).

#### Scenario: Footer message shown when no session is active

- **Given** `CampaignChat` is rendered expanded with `activeSessionId={null}`
- **When** the drawer content renders
- **Then** the visible text "No active session" is present in the drawer
- **And** no button with an accessible name matching `/roll|dice/i` is present in the drawer
- **And** no element with `title="Dice Rolls for main screen pop out"` is present

#### Scenario: No footer strip when a session is active

- **Given** `CampaignChat` is rendered expanded with `activeSessionId="session-abc"`
- **When** the drawer content renders
- **Then** the text "No active session" is not present
- **And** no dice trigger, dice panel, or dice-pool control is present in the drawer
- **And** the chat feed region remains the flex-growing element of the drawer

#### Scenario: Footer appears and disappears as the active session changes while open

- **Given** the drawer is expanded with `activeSessionId="session-abc"` and no footer strip
- **When** the same `CampaignChat` instance re-renders with `activeSessionId={null}`
- **Then** the "No active session" footer strip becomes present
- **And when** it re-renders again with `activeSessionId="session-xyz"`
- **Then** the footer strip is removed and no error is raised

## MODIFIED Requirements

### Requirement: MODIFIED CampaignChat accepts activeSessionId prop

The system SHALL accept an `activeSessionId: string | null` prop on `CampaignChat` and use
it to gate roll-history fetching and dice-session presence announcement (see
`dice-session-bridge` capability). It SHALL NOT gate any dice-rolling control, because the
chat dock no longer renders one; all dice rolling is provided by `GlobalDiceFab` (see
`global-dice-fab` capability).

#### Scenario: activeSessionId null disables roll history and presence, feed still loads

- **Given** `CampaignChat` is rendered with `activeSessionId={null}`
- **When** the dock is expanded
- **Then** no roll-history fetch to `/api/campaigns/[id]/rolls` is attempted
- **And** no dice-session presence is announced
- **And** the message feed loads normally
- **And** the "No active session" footer is shown (see ADDED requirement above)

#### Scenario: activeSessionId non-null enables roll history and presence

- **Given** `CampaignChat` is rendered with `activeSessionId="session-abc"`
- **When** the dock is expanded
- **Then** roll history is fetched for "session-abc"
- **And** dice-session presence `{ campaignId, sessionId: "session-abc" }` is announced
  while the component owns that active session
- **And** no dice control is rendered in the drawer

### Requirement: MODIFIED Feed auto-scrolls on a new dice roll, consumed solely via the SSE stream

The system SHALL scroll the chat feed so the current user's own committed roll is always
visible immediately after it is appended, and SHALL append every roll to the feed solely
via the SSE `'roll'` stream event. For a roll committed by a different user, the system
SHALL only auto-scroll if the feed was already within approximately 100px of the bottom
immediately before the roll was appended. Auto-scroll SHALL fire at most once per roll,
determined by checking the ingested roll's `rollerId` against the current user. This
behavior is unchanged by the removal of the chat-docked dice panel — rolls originate
entirely from `GlobalDiceFab` (or any future presence-announcing surface) and reach chat
only through the stream. Auto-scroll does NOT apply to plain chat messages.

#### Scenario: The current user's own roll (committed via GlobalDiceFab) scrolls the feed once ingested via the stream

- **Given** the feed is scrolled such that the bottom is not visible, and the current user
  has just committed a roll via `GlobalDiceFab`'s "send to session chat"
- **When** the SSE `'roll'` event for that roll (`rollerId === user.userId`) is received
  and appended to the feed
- **Then** the feed container's scroll position moves so the newly-appended roll item is
  visible, regardless of how far from the bottom the user had scrolled

#### Scenario: A roll from another player triggers auto-scroll only when the user is near the bottom

- **Given** an SSE `'roll'` event for a roll posted by a different user arrives
- **When** the feed's scroll position was within 100px of the bottom immediately before append
- **Then** the feed scrolls to show the new roll
- **And when** instead the feed was more than 100px from the bottom
- **Then** the feed's scroll position does not change

#### Scenario: A new chat message does not trigger auto-scroll

- **Given** the feed is scrolled such that the bottom is not visible
- **When** a new `message`-kind item is appended
- **Then** the feed's scroll position does not change

## REMOVED Requirements

### Requirement: REMOVED ADDED Commit rolls the entire staged pool as one combined roll

Reason for removal: The chat dock no longer hosts a dice staging pool or a "Roll" commit
control. Building and committing a combined pool roll is provided solely by `GlobalDiceFab`
(see `global-dice-fab` capability), which composes the roll through the shared
`dice-pool-shared-state` capability (`buildRoll`) and submits it through the shared
`useRollSubmission` capability. The `/api/campaigns/[id]/rolls` contract is unchanged.

### Requirement: REMOVED MODIFIED Roll-entry strip is replaced by the dice pop-out trigger and pool

Reason for removal: The roll-entry strip was already removed by earlier changes; its
replacement — the dice pop-out trigger and pool inside the chat dock — is now also
removed. The chat dock renders no roll-entry affordance of any kind. The modifier input
and visibility selector live only in `GlobalDiceFab`'s modal.

### Requirement: REMOVED MODIFIED Dice pop-out trigger anchored to the chat dock

Reason for removal: The persistent d20 trigger button anchored at the bottom of the chat
dock (`DiceTriggerButton`, `title="Dice Rolls for main screen pop out"`) is deleted. The
only dice trigger in the app is `GlobalDiceFab`'s fab (see `global-dice-fab` capability).

### Requirement: REMOVED MODIFIED Dice staging pool

Reason for removal: The chat-docked dice panel (`DicePoolPanel`) and its per-die
add/remove controls, shared modifier, and visible `d{sides}` labels are deleted. The
equivalent staging pool — using the shared `DiePoolButton`/`DieGlyph` components and
visible labels — exists only in `GlobalDiceFab`'s modal (see `global-dice-fab` and
`dice-iconography` capabilities).

### Requirement: REMOVED ADDED Standalone percentile (d%) roll control

Reason for removal: The chat-docked dice panel's inline percentile control is deleted
along with the panel. `GlobalDiceFab`'s modal retains a standalone percentile control
(shared `PercentileButton`, `d%` glyph) that produces a percentile roll via
`buildPercentileRoll()` and submits it with `formula: "d%"`, `rolls: [value]`,
`total: value` through the unchanged rolls contract (see `global-dice-fab` and
`dice-pool-shared-state` capabilities). Persisted percentile rolls are still rendered in
the chat feed by the retained "Roll feed renders a percentile roll through the existing
formula path" requirement.

### Requirement: REMOVED MODIFIED Dice panel renders as an in-flow flex sibling to the left of the chat dock

Reason for removal: There is no dice panel in the chat dock to position. `GlobalDiceFab`'s
modal owns its own anchoring (bottom-left, over its trigger) per the `global-dice-fab`
capability. The `CampaignChat` flex-row wrapper is retained but now has the drawer as its
only child.

## Traceability

- Proposal element "Remove `<DicePoolPanel>`, `<DiceTriggerButton>`, `useCampaignDice`,
  refs/state/handlers from `index.tsx`" → Requirements: REMOVED (all six), MODIFIED
  CampaignChat accepts activeSessionId prop
- Proposal element "Bottom bar rendered only when `activeSessionId === null` with just the
  'No active session' message" → Requirement: ADDED Chat dock shows a no-active-session
  footer instead of a dice bar
- Proposal element "Keep `announcePresence`/`clearPresence` and `activeSessionId` prop" →
  Requirement: MODIFIED CampaignChat accepts activeSessionId prop
- Design decision 1 (delete the chat-docked dice UI outright) → Requirements: REMOVED (all six)
- Design decision 2 (session-gated footer) → Requirement: ADDED Chat dock shows a
  no-active-session footer instead of a dice bar
- Design decision 4 (roll-share-ui reduced, not deleted) → Requirements: MODIFIED (both),
  retained requirements untouched
- Requirement → Task(s): see `openspec/changes/remove-chat-docked-dice/tasks.md`
  ("Edit CampaignChat/index.tsx", "Delete dead source", "Delete/adjust dice-pool tests",
  "Add footer tests" task groups)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Chat dock server-renders without document/portal access after the dice panel removal

- **Given** `CampaignChat` (including its now dice-free drawer) is rendered in a Node.js
  (non-browser) environment
- **When** the module is imported and the component tree is server-rendered
- **Then** no `document` access, portal-root creation, or overlay-root creation is
  attempted (the removed `CampaignChat.dicePool.ssr` coverage is superseded here; dice
  panel SSR safety is covered by `global-dice-fab`)

#### Scenario: Existing chat-dock and feed tests pass after the removal

- **Given** the dice trigger, dice panel, and `useCampaignDice` are deleted
- **When** `npm run test:unit` is executed against `tests/unit/components/CampaignChat/`
- **Then** every remaining test file (drawer, resize, composer, history, members, roll,
  scene, sse, unread, visibility) passes without modification to its original assertions,
  except assertions that queried for the now-removed dice trigger

### Requirement: Security

See functional scenario: "activeSessionId non-null enables roll history and presence". No
access-control surface changes — `/api/campaigns/[id]/rolls` remains the sole
authorization/validation boundary (owned by this capability's server route), and this
change removes a client caller without touching it.

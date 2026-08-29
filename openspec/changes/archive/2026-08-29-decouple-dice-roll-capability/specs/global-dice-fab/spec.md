## ADDED Requirements

### Requirement: ADDED Sending to session chat succeeds whether or not CampaignChat is mounted

The system SHALL cause `GlobalDiceFab`'s "send to session chat" action to succeed based solely on whether dice-session presence exists (see `dice-session-bridge` capability), independent of whether any `CampaignChat` instance is currently mounted anywhere on the page.

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

## MODIFIED Requirements

### Requirement: MODIFIED "Send to session chat" option appears only while a matching campaign session is present

The system SHALL show a "send to session chat" control in the modal only while the dice-session bridge (see `dice-session-bridge` capability) reports a non-null presence, and SHALL omit it otherwise. Choosing to send SHALL call the shared roll-submission capability (`lib/dice/useRollSubmission.ts`, see `dice-pool-shared-state` capability) directly with the current presence's `campaignId` and the rolled `{formula, rolls, total, visibility}`, rather than routing the request through `lib/dice/diceSessionBridge.ts`'s `requestRoll`.

#### Scenario: Option hidden with no presence

- **Given** the modal is open and no presence has been announced (the user is not on a
  campaign page with an active session)
- **When** the user rolls
- **Then** no "send to session chat" control is shown alongside the result

#### Scenario: Option shown once presence is announced

- **Given** the user is on a campaign page whose `CampaignChat` has announced presence for
  `{campaignId, sessionId}`
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

## Traceability

- Proposal "What Changes" (`GlobalDiceFab` updated to submit directly) → Requirements:
  MODIFIED "Send to session chat" option, ADDED Sending to session chat succeeds whether or
  not CampaignChat is mounted
- Design decision 1 (shared hooks) → Requirements: both requirements in this delta
- Design decision 3 (bridge narrows) → Requirements: MODIFIED "Send to session chat"
  option (removes `requestRoll` usage)
- Requirement → Task(s): see `tasks.md`, "Update GlobalDiceFab" task group

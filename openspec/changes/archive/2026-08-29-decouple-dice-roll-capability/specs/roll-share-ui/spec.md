## MODIFIED Requirements

### Requirement: MODIFIED Feed auto-scrolls on a new dice roll, consumed solely via the SSE stream

The system SHALL scroll the chat feed so the current user's own committed roll is always visible immediately after it is appended, and shall append every roll to the feed solely via the SSE `'roll'` stream event — there is no longer a separate local POST-response callback path that appends a roll to the feed ahead of, or independent from, the stream. For a roll committed by a different user, the system SHALL only auto-scroll if the feed was already within approximately 100px of the bottom immediately before the roll was appended — a user who has scrolled up to read history (or is at the top triggering an older-page load) is NOT auto-scrolled by another player's roll. Auto-scroll SHALL fire at most once per roll, determined by checking the ingested roll's `rollerId` against the current user, not by which code path appended it (since there is now only one). The feed's item order is unaffected. Auto-scroll does NOT apply to plain chat messages (unchanged from today: messages never auto-scroll).

#### Scenario: Committing a roll scrolls the feed to show it once ingested via the stream

- **Given** the feed is scrolled such that the bottom is not visible, and the dice panel
  (whether chat-docked or `GlobalDiceFab`, once sent to session chat) has just had a roll
  committed by the current user
- **When** the SSE `'roll'` event for that roll is received and appended to the feed
- **Then** the feed container's scroll position moves so the newly-appended roll item is
  visible, without requiring the user to scroll manually, and without any earlier
  optimistic append having already placed the item in the feed

#### Scenario: The roller is scrolled to their own roll even if they had scrolled away from the bottom

- **Given** the feed is scrolled such that the bottom is not visible, and the current user
  has just committed a roll (via either the chat-docked panel or `GlobalDiceFab`'s "send to
  session chat")
- **When** the SSE `'roll'` event for that roll arrives, identified as the current user's
  own roll via `rollerId === user.userId`
- **Then** the feed container's scroll position moves so the roll is visible, regardless of
  how far from the bottom the user had scrolled

#### Scenario: A roll from another player triggers auto-scroll when the user is already near the bottom

- **Given** the feed's scroll position is within 100px of the bottom
- **When** an SSE `roll` event for a roll posted by a different user arrives and is
  appended to the feed
- **Then** the feed container's scroll position moves so the newly-appended roll item is
  visible

#### Scenario: A roll from another player does not yank the feed when the user has scrolled away to read history

- **Given** the feed's scroll position is more than 100px from the bottom (e.g. the user
  scrolled up to read earlier messages, or is at the top to trigger the older-page load)
- **When** an SSE `roll` event for a roll posted by a different user arrives and is
  appended to the feed
- **Then** the feed container's scroll position does NOT change

#### Scenario: A roll submitted while chat was unmounted still scrolls the feed once ingested after chat mounts

- **Given** a roll was submitted via `GlobalDiceFab` while no `CampaignChat` instance was
  mounted, and the user subsequently opens/mounts chat
- **When** the feed loads that roll via history (on expand) or, if chat was already open
  when the roll landed, via the SSE stream
- **Then** the roll appears in the feed exactly as any other roll does, with the same
  rollerId-based auto-scroll rule applied if it arrives live via the stream

#### Scenario: Auto-scroll does not reorder the feed

- **Given** the feed contains items in chronological order
- **When** a roll is appended and the auto-scroll occurs
- **Then** the feed's item order is unchanged (the new roll remains the last item, appended
  in place; it is not moved to the top or re-sorted)

#### Scenario: A new chat message does not trigger auto-scroll

- **Given** the feed is scrolled such that the bottom is not visible
- **When** a new `message`-kind item (from either the composer's optimistic append or an
  SSE `message` event) is appended to the feed
- **Then** the feed's scroll position does not change

---

## REMOVED Requirements

### Requirement: ADDED CampaignChat submits externally-requested rolls through its existing commit path

**Reason**: The concept of an "externally-requested roll" routed through
`CampaignChat` no longer exists. `GlobalDiceFab` (and any future roll-triggering surface)
now submits directly via the shared `lib/dice/useRollSubmission.ts` capability (see
`dice-pool-shared-state` capability), so there is nothing for `CampaignChat` to receive,
scope-check, or forward. Chat consumes every roll — its own and everyone else's — purely
via the SSE `'roll'` stream event, the same as it always has for rolls it didn't
originate.

**Migration**: Any test asserting `CampaignChat` submits a roll on behalf of a bridge
request (`tests/unit/components/CampaignChat/CampaignChat.diceSessionBridge.test.tsx`) is
deleted; `GlobalDiceFab`'s own tests now assert its direct submission instead (see
`global-dice-fab` capability's "ADDED Sending to session chat succeeds whether or not
CampaignChat is mounted"). The four scenarios previously under this requirement (roll
appears identically, matching auto-scroll rule, 409 handling, in-chat trigger unaffected)
are superseded: identical-appearance and matching-auto-scroll are now general properties of
"MODIFIED Feed auto-scrolls on a new dice roll, consumed solely via the SSE stream" above
(any roll from any source looks and scrolls the same, because there is only one ingestion
path); 409 handling is now `GlobalDiceFab`'s own concern via its direct `submitRoll` call
(see `global-dice-fab` capability); and the in-chat trigger's own behavior is unaffected and
continues to be covered by the unmodified staging/commit requirements in this file.

---

## Traceability

- Proposal "What Changes" (chat's optimistic roll append removed) → Requirements: MODIFIED
  Feed auto-scrolls on a new dice roll, consumed solely via the SSE stream
- Proposal "Scope" (external-roll-request path removed) → Requirements: REMOVED ADDED
  CampaignChat submits externally-requested rolls through its existing commit path
- Design decision 4 (useChatFeed owns SSE-only ingestion, `handleRollPosted` deleted) →
  Requirements: MODIFIED Feed auto-scrolls on a new dice roll, consumed solely via the SSE
  stream
- Requirement → Task(s): see `tasks.md`, "Remove optimistic roll append" and "Delete
  diceSessionBridge test coverage for externally-requested rolls" task groups

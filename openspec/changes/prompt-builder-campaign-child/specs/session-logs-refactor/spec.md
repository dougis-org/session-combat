## ADDED Requirements

No new session log requirements added.

## MODIFIED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: MODIFIED Session logs page uses all linked parties for NPC event suggestions

The system SHALL use all parties linked to the campaign (not just the first) when auto-populating NPC join/leave events in the session log editor.

#### Scenario: Campaign with single party — behaviour unchanged

- **Given** one `Party` linked to campaign "camp-1" with two active members
- **When** the user opens the session log editor for a new session
- **Then** NPC join events are suggested for both members (behaviour identical to before refactor)

#### Scenario: Campaign with multiple parties — all members included

- **Given** two parties linked to campaign "camp-1": Party A with members Alice and Bob, Party B with member Carol
- **When** the user opens the session log editor for a new session
- **Then** NPC join events are suggested for Alice, Bob, and Carol

#### Scenario: No linked party — informational message unchanged

- **Given** no party linked to campaign "camp-1"
- **When** the session log editor is opened
- **Then** the "No linked party found for this campaign" message is displayed (behaviour unchanged)

### Requirement: MODIFIED Session logs page data fetching uses `useCampaignContext`

The system SHALL replace the manual `fetch('/api/parties')` + `Array.find()` logic in `app/campaigns/[id]/sessions/page.tsx` with `useCampaignContext(campaignId)`.

#### Scenario: Refactored page renders identically to original for single-party campaign

- **Given** a campaign with one linked party
- **When** the sessions page renders after refactor
- **Then** all existing session log UI elements (session list, editor, delete, edit) behave identically to before the refactor

#### Scenario: `buildNpcEventsFromMemberChanges` called with merged members

- **Given** two parties linked to the campaign, each with two members
- **When** the session log editor initialises for a new session
- **Then** `buildNpcEventsFromMemberChanges` is called with `context.allMembers` (4 members total), not a single party's members

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal element: shared helper fixing #212 → Requirement: MODIFIED session logs uses all linked parties
- Proposal element: session logs refactor → Requirement: MODIFIED data fetching uses `useCampaignContext`
- Design decision: Decision 7 (distinct guarded task) → both MODIFIED requirements
- Requirements → Tasks: Task group D in `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: All pre-existing session logs integration tests pass after refactor

- **Given** the session logs regression test suite exists and is green before the refactor task begins
- **When** the `useCampaignContext` refactor is applied to `app/campaigns/[id]/sessions/page.tsx`
- **Then** all pre-existing session logs tests continue to pass without modification

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `fetchCampaignContext` returns all parties and merged members

The system SHALL fetch all parties whose `campaignId` matches the given campaign ID, merge their `members` arrays, and return them in the `CampaignContext`.

#### Scenario: Single party linked to campaign

- **Given** one `Party` exists with `campaignId === "camp-1"`
- **When** `fetchCampaignContext("camp-1")` is called
- **Then** `context.parties` has length 1 and `context.allMembers` equals that party's `members` array

#### Scenario: Multiple parties linked to same campaign

- **Given** three `Party` records all have `campaignId === "camp-1"`, with 2, 3, and 4 members respectively
- **When** `fetchCampaignContext("camp-1")` is called
- **Then** `context.parties` has length 3 and `context.allMembers` has length 9 (all members merged)

#### Scenario: No parties linked to campaign

- **Given** no `Party` records have `campaignId === "camp-1"`
- **When** `fetchCampaignContext("camp-1")` is called
- **Then** `context.parties` is `[]` and `context.allMembers` is `[]`

### Requirement: ADDED `fetchCampaignContext` resolves current chapter

The system SHALL resolve `campaign.currentChapterId` to the matching `CampaignChapter` object from `campaign.chapters`.

#### Scenario: Campaign has a current chapter set

- **Given** a `Campaign` with `chapters: [{ id: "ch-2", title: "The Sunken Temple", ... }]` and `currentChapterId: "ch-2"`
- **When** `fetchCampaignContext` resolves the campaign
- **Then** `context.chapter.title === "The Sunken Temple"`

#### Scenario: Campaign has no current chapter set

- **Given** a `Campaign` with `currentChapterId: undefined`
- **When** `fetchCampaignContext` resolves the campaign
- **Then** `context.chapter === null`

### Requirement: ADDED `fetchCampaignContext` resolves character objects for party members

The system SHALL resolve each `PartyMember.characterId` in `allMembers` to a full `Character` object, excluding soft-deleted characters.

#### Scenario: All members have active characters

- **Given** `allMembers` contains two `PartyMember` records with `characterId` values "c-1" and "c-2"
- **And** both characters exist and have `deletedAt === undefined`
- **When** `fetchCampaignContext` resolves
- **Then** `context.characters` contains exactly those two `Character` objects

#### Scenario: A party member's character is soft-deleted

- **Given** a `PartyMember` with `characterId: "c-3"` and the corresponding `Character` has `deletedAt` set
- **When** `fetchCampaignContext` resolves
- **Then** `context.characters` does not include the soft-deleted character

### Requirement: ADDED fetches execute in parallel

The system SHALL issue the campaign, parties, and characters fetch requests concurrently, not sequentially.

#### Scenario: Parallel execution

- **Given** mocked fetch functions for campaign, parties, and characters
- **When** `fetchCampaignContext` is called
- **Then** all three fetch calls are initiated before any awaited result is consumed (verified via `Promise.all` ordering in test)

## MODIFIED Requirements

### Requirement: MODIFIED `CampaignContext` and `BuiltPrompt` interfaces exported from `lib/types.ts`

The system SHALL export `CampaignContext` and `BuiltPrompt` from `lib/types.ts` as the canonical type definitions.

#### Scenario: Interfaces importable by consumers

- **Given** `lib/types.ts` defines and exports `CampaignContext` and `BuiltPrompt`
- **When** `app/campaigns/[id]/prompts/page.tsx` and `app/campaigns/[id]/sessions/page.tsx` import them
- **Then** TypeScript compilation succeeds with no type errors

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal element: shared helper fixing #212 → Requirement: ADDED `fetchCampaignContext` returns all parties and merged members
- Proposal element: character resolution → Requirement: ADDED `fetchCampaignContext` resolves character objects
- Design decision: Decision 1 (pure function + hook) → Requirement: interfaces exported from `lib/types.ts`
- Design decision: Decision 2 (parallel fetch) → Requirement: ADDED fetches execute in parallel
- Design decision: Decision 3 (`CampaignContext` interface) → Requirement: MODIFIED interfaces in `lib/types.ts`
- Requirements → Tasks: Task group A in `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Parallel fetch completes within acceptable latency

- **Given** a campaign with 2 linked parties and 10 characters
- **When** `useCampaignContext(campaignId)` mounts
- **Then** `loading` transitions to `false` after a single `Promise.all` resolution (no serial awaits between fetches)

### Requirement: Reliability

#### Scenario: Fetch failure surfaces as error state

- **Given** the `/api/parties` fetch returns a non-OK response
- **When** `useCampaignContext(campaignId)` is mounted
- **Then** `error` is set to a non-null string and `context` remains `null`; no unhandled promise rejection occurs

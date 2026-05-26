## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Session context in CampaignContext

The system SHALL include `recentSessions?: SessionLog[]` as an optional field on `CampaignContext`, populated with up to 3 recent session logs for the campaign.

#### Scenario: Sessions exist for campaign

- **Given** a campaign with 5 session logs stored in the database
- **When** `fetchCampaignContext(campaignId)` is called
- **Then** the returned `CampaignContext` includes a `recentSessions` array containing the 3 most recent sessions (descending by `sessionNumber`)

#### Scenario: Campaign has no session logs

- **Given** a campaign with zero session logs
- **When** `fetchCampaignContext(campaignId)` is called
- **Then** the returned `CampaignContext` includes `recentSessions` as an empty array

#### Scenario: Sessions endpoint returns an error

- **Given** the sessions API returns a 500 response
- **When** `fetchCampaignContext(campaignId)` is called
- **Then** the function resolves successfully with `recentSessions: []` and does not throw
- **And** the error is logged to the console

---

### Requirement: ADDED Recent sessions block in generated prompts

The system SHALL append a "Recent sessions:" block to the system prompt produced by `buildSystemPrompt()` when `recentSessions` is non-empty.

#### Scenario: One or more sessions present

- **Given** a `CampaignContext` with `recentSessions` containing at least one entry
- **When** `buildSystemPrompt(context)` is called
- **Then** the returned string contains a "Recent sessions:" heading followed by one line per session in the format `- Session {N} ({date}): {title or "Untitled Session"}`

#### Scenario: Session with milestone

- **Given** a `CampaignContext` with a session where `milestone: true` and `newLevel: 11`
- **When** `buildSystemPrompt(context)` is called
- **Then** the session line includes the suffix ` — party reached Level 11.`

#### Scenario: Session with milestone but no newLevel

- **Given** a `CampaignContext` with a session where `milestone: true` and `newLevel` is absent
- **When** `buildSystemPrompt(context)` is called
- **Then** the session line includes the suffix ` — milestone reached.`

#### Scenario: Session with no title

- **Given** a session with no `title` field set
- **When** `buildSystemPrompt(context)` is called
- **Then** the session line uses `"Untitled Session"` in place of a title

#### Scenario: No sessions present

- **Given** a `CampaignContext` with `recentSessions: []` or `recentSessions` undefined
- **When** `buildSystemPrompt(context)` is called
- **Then** the returned string does not contain the text "Recent sessions:"

---

### Requirement: ADDED Prompt Builder loading label reflects sessions fetch

The system SHALL display `"Loading campaign and session history..."` as the loading label while `useCampaignContext` is resolving.

#### Scenario: Prompt Builder page is loading

- **Given** the Prompt Builder page for a campaign is opened
- **When** `useCampaignContext` has not yet resolved
- **Then** the `LoadingState` component renders with label `"Loading campaign and session history..."`

## MODIFIED Requirements

### Requirement: MODIFIED `fetchCampaignContext` fetches four endpoints in parallel

The system SHALL fetch `GET /api/campaigns/[id]/sessions?limit=3` in the same `Promise.all` as the campaign, parties, and characters fetches.

#### Scenario: All endpoints succeed

- **Given** all four endpoints return 200
- **When** `fetchCampaignContext(campaignId)` is called
- **Then** the returned context includes `campaign`, `chapter`, `parties`, `allMembers`, `characters`, and `recentSessions`

#### Scenario: Sessions endpoint called with correct limit

- **Given** `fetchCampaignContext` is invoked for campaign `"abc123"`
- **When** the sessions fetch fires
- **Then** the URL called is `/api/campaigns/abc123/sessions?limit=3`

## REMOVED Requirements

None. No existing requirements are removed by this change.

## Traceability

- Proposal element "Add `recentSessions?: SessionLog[]` to `CampaignContext`" → Requirement: ADDED Session context in CampaignContext
- Proposal element "Fetch sessions in main `Promise.all`" → Requirement: MODIFIED `fetchCampaignContext` fetches four endpoints in parallel
- Proposal element "`buildSystemPrompt()` session block" → Requirement: ADDED Recent sessions block in generated prompts
- Proposal element "Loading label update" → Requirement: ADDED Prompt Builder loading label reflects sessions fetch
- Design Decision 1 → ADDED Session context in CampaignContext, ADDED Recent sessions block
- Design Decision 2 → MODIFIED `fetchCampaignContext`
- Design Decision 3 → ADDED Session context (error scenario)
- Design Decision 4 → ADDED Recent sessions block (all scenarios)
- All requirements → tasks.md (implementation tasks)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Sessions endpoint unavailable

- **Given** the sessions API returns a network error or 5xx
- **When** `fetchCampaignContext` runs
- **Then** the Prompt Builder page loads successfully with an empty session block
- **And** no error banner is shown to the DM for the sessions failure specifically

### Requirement: Performance

#### Scenario: Sessions fetch runs in parallel

- **Given** the campaign, parties, and characters fetches are already in a `Promise.all`
- **When** the sessions fetch is added
- **Then** all four requests fire simultaneously and the total load time is bounded by the slowest single request, not the sum of all four

### Requirement: Security

#### Scenario: Sessions fetch is user-scoped

- **Given** an authenticated DM
- **When** `GET /api/campaigns/[id]/sessions?limit=3` is called
- **Then** the endpoint (already implemented) returns only session logs belonging to that user's campaign, enforced by `withAuthAndParams` middleware

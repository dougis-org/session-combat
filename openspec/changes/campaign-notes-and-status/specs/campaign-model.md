## ADDED Requirements

### Requirement: ADDED Campaign status field

The system SHALL accept and persist a `status` field on Campaign with values `planning`, `active`, `on-hold`, or `completed`.

#### Scenario: Create campaign with explicit status

- **Given** an authenticated DM
- **When** POST `/api/campaigns` with `{ status: 'planning' }`
- **Then** the response includes `status: 'planning'` and `active` is absent from the response body

#### Scenario: Create campaign with no status defaults to 'active'

- **Given** an authenticated DM
- **When** POST `/api/campaigns` with no `status` field
- **Then** the response includes `status: 'active'`

#### Scenario: PATCH campaign with valid status updates correctly

- **Given** an existing campaign with `status: 'active'`
- **When** PATCH `/api/campaigns/[id]` with `{ status: 'on-hold' }`
- **Then** the response includes `status: 'on-hold'` and the document is persisted

#### Scenario: PATCH campaign with invalid status is rejected

- **Given** an existing campaign
- **When** PATCH `/api/campaigns/[id]` with `{ status: 'running' }`
- **Then** the response is 400 with an error message indicating invalid status

### Requirement: ADDED Campaign notes field

The system SHALL accept and persist a `notes` field on Campaign as a plain string up to 10,000 characters.

#### Scenario: PATCH campaign with notes under limit

- **Given** an existing campaign
- **When** PATCH `/api/campaigns/[id]` with `{ notes: 'string of 10000 chars or fewer' }`
- **Then** the response is 200 and `notes` is persisted

#### Scenario: PATCH campaign with notes over limit is rejected

- **Given** an existing campaign
- **When** PATCH `/api/campaigns/[id]` with a `notes` value of 10,001 characters
- **Then** the response is 400 with an error message about notes length

#### Scenario: Notes defaults to empty string on create

- **Given** an authenticated DM
- **When** POST `/api/campaigns` with no `notes` field
- **Then** the response includes `notes: ''`

### Requirement: ADDED Campaign copy sets status to 'planning'

The system SHALL set `status: 'planning'` when copying a global campaign template.

#### Scenario: Copy global campaign template

- **Given** an existing global campaign template
- **When** POST `/api/campaigns/global/[id]/copy`
- **Then** the new campaign has `status: 'planning'` and `active` is absent

## MODIFIED Requirements

### Requirement: MODIFIED Campaign dashboard filters by status

The system SHALL display only campaigns with `status === 'active'` in the Active Campaign Dashboard section.

#### Scenario: Active campaign appears in dashboard

- **Given** a campaign with `status: 'active'`
- **When** the DM views `/campaigns`
- **Then** the campaign appears in the Active Campaigns section

#### Scenario: Non-active campaign excluded from dashboard

- **Given** a campaign with `status: 'planning'`
- **When** the DM views `/campaigns`
- **Then** the campaign does not appear in the Active Campaigns section (but is still visible in the campaign management list below)

#### Scenario: No active campaigns renders CTA

- **Given** no campaigns have `status: 'active'`
- **When** the DM views `/campaigns`
- **Then** the dashboard section shows a CTA card with text "set one to Active or create a new one"

### Requirement: MODIFIED Campaign status badge in list

The system SHALL render a coloured status badge on each campaign row in the management list.

#### Scenario: Each status value renders correct badge colour

- **Given** four campaigns each with a different status value
- **When** the DM views the campaign list
- **Then**:
  - `planning` → badge with `bg-slate-600`
  - `active` → badge with `bg-green-700`
  - `on-hold` → badge with `bg-yellow-600`
  - `completed` → badge with `bg-gray-600`

### Requirement: MODIFIED Campaign dashboard shows notes snippet

The system SHALL display the first 3–4 lines of DM notes in the dashboard campaign card when notes are non-empty.

#### Scenario: Non-empty notes renders snippet

- **Given** a campaign with `status: 'active'` and `notes: 'Quest: find the orb...'`
- **When** the DM views `/campaigns`
- **Then** the campaign card includes a DM Notes section with a truncated snippet and a link to edit

#### Scenario: Empty notes renders no notes section

- **Given** a campaign with `status: 'active'` and `notes: ''`
- **When** the DM views `/campaigns`
- **Then** the campaign card has no DM Notes section

### Requirement: MODIFIED Campaign form — status dropdown replaces active checkbox

The system SHALL present a status dropdown (Planning / Active / On Hold / Completed) in the campaign create/edit form instead of the active checkbox.

#### Scenario: Status dropdown renders with current value selected

- **Given** an existing campaign with `status: 'on-hold'`
- **When** the DM opens the edit form
- **Then** the status dropdown shows "On Hold" as the selected value

#### Scenario: Saving form with new status calls onSave with updated status

- **Given** the campaign edit form is open with `status: 'active'`
- **When** the DM changes the dropdown to "Completed" and saves
- **Then** `onSave` is called with a campaign object where `status === 'completed'`

### Requirement: MODIFIED Campaign form — notes textarea

The system SHALL present a notes textarea in the campaign create/edit form.

#### Scenario: Notes textarea renders with current value

- **Given** an existing campaign with `notes: 'Party at level 5'`
- **When** the DM opens the edit form
- **Then** the notes textarea contains "Party at level 5"

#### Scenario: Textarea enforces 10,000 char max client-side

- **Given** the campaign edit form is open
- **When** the DM views the notes textarea
- **Then** the textarea has `maxLength={10000}` and a character counter is visible

## REMOVED Requirements

### Requirement: REMOVED `active: boolean` on Campaign

The `active` field is removed from the `Campaign` TypeScript interface and from all API request/response contracts.

Reason for removal: Replaced by `status` enum which expresses the same boolean state (`active: true` ≡ `status: 'active'`) plus additional lifecycle states.

## Traceability

- Proposal: "Remove `active: boolean`, add `status` enum" → Requirements: Campaign status field, Campaign dashboard filters by status, Campaign status badge, Campaign form status dropdown
- Proposal: "Add `notes: string`, max 10k chars" → Requirements: Campaign notes field, Campaign form notes textarea, Campaign dashboard notes snippet
- Proposal: "Campaign copy sets `status: 'planning'`" → Requirement: Campaign copy sets status to 'planning'
- Design Decision 1 (clean cut) → Requirement: REMOVED `active: boolean`
- Design Decision 2 (inline validation) → Requirement: notes field max 10k
- Design Decision 3 (backwards-compatible read) → Requirement: handled in tasks (PATCH handler guard)
- Design Decision 4 (inline badge) → Requirement: Campaign status badge
- All requirements → Tasks: tasks.md

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Notes stored as plain string — no XSS vector

- **Given** a DM submits notes containing `<script>alert(1)</script>`
- **When** the notes are stored and retrieved
- **Then** the value is stored and returned as a plain string with no HTML processing or execution

### Requirement: Reliability

#### Scenario: Legacy document missing `status` field handled gracefully

- **Given** a MongoDB document with no `status` field (pre-migration)
- **When** the PATCH handler loads the campaign
- **Then** the campaign is treated as `status: 'active'` and the PATCH proceeds without error

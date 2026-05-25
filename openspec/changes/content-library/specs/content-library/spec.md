## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

---

### Requirement: ADDED SavedContent persistence

The system SHALL persist a generated prompt (all three fields: systemPrompt, userMessage, fullText) with a DM-supplied title, type, and campaign context to MongoDB when the DM saves from the Prompt Builder.

#### Scenario: DM saves a generated prompt

- **Given** the DM has generated a prompt on `/campaigns/[id]/prompts`
- **When** the DM clicks "Save to Library", enters a title, and clicks "Save"
- **Then** a `SavedContent` document is created in MongoDB containing `systemPrompt`, `userMessage`, `prompt` (fullText), `type`, `title`, `campaignId`, `userId`, `chapter` (if set), `createdAt`, and `updatedAt`

#### Scenario: Save is blocked without a title

- **Given** the DM has generated a prompt and opened the Save panel
- **When** the DM leaves the title input empty and clicks "Save"
- **Then** the save is not submitted and a validation message is shown requiring a title

#### Scenario: Save is blocked before a prompt is generated

- **Given** the DM is on the Prompt Builder page but has not clicked "Generate Prompt"
- **When** the page renders
- **Then** the "Save to Library" button is disabled and not clickable

---

### Requirement: ADDED Title pre-fill from template fields

The system SHALL pre-fill the Save panel title input with the first non-empty template field value when the Save panel opens.

#### Scenario: Title pre-filled from first field

- **Given** the DM generated an NPC prompt with role "innkeeper"
- **When** the DM clicks "Save to Library"
- **Then** the title input is pre-filled with "innkeeper" (the value of the first non-empty field)

#### Scenario: Title pre-fill is editable

- **Given** the Save panel is open with a pre-filled title
- **When** the DM clears and types a custom title
- **Then** the custom title is used when saving

---

### Requirement: ADDED Campaign content library page

The system SHALL display saved content items for the active campaign at `/campaigns/[id]/library`, filterable by type.

#### Scenario: Library loads saved items for the campaign

- **Given** the campaign has three saved items (one NPC, one location, one shop)
- **When** the DM navigates to `/campaigns/[id]/library`
- **Then** all three items appear as collapsed cards, newest first

#### Scenario: Filter tabs narrow items by type

- **Given** the library shows items of mixed types
- **When** the DM clicks the "NPC" filter tab
- **Then** only NPC items are shown; location and shop items are hidden

#### Scenario: Empty library shows empty state

- **Given** the campaign has no saved content
- **When** the DM navigates to `/campaigns/[id]/library`
- **Then** an empty state message is shown (not an error)

---

### Requirement: ADDED Collapsed card summary

The system SHALL display each saved item as a collapsed card showing: type badge, title, chapter (if set), created date, and a checkmark indicator if a result has been pasted in.

#### Scenario: Collapsed card shows all summary fields

- **Given** a saved NPC item with title "Old Grigor", chapter "Chapter 2", and a pasted result
- **When** the library page renders
- **Then** the card shows the "NPC" type badge, "Old Grigor", "Chapter 2", the created date, and a checkmark icon

#### Scenario: Card without result shows no checkmark

- **Given** a saved item with no result pasted
- **When** the library page renders
- **Then** the card does not show a checkmark

---

### Requirement: ADDED Expanded card with prompt display

The system SHALL show the full prompt split into system and user sections when a card is expanded, with visual differentiation between sections.

#### Scenario: Expanded card shows system and user message separately

- **Given** a saved item with distinct `systemPrompt` and `userMessage`
- **When** the DM clicks to expand the card
- **Then** the `systemPrompt` is shown in muted monospace text and the `userMessage` is shown in bright monospace text, in separate labelled sections

#### Scenario: Copy Full Prompt copies fullText

- **Given** the card is expanded
- **When** the DM clicks "Copy Full Prompt"
- **Then** the clipboard contains the `prompt` (fullText) field — the complete combined prompt ready to paste into an AI agent

---

### Requirement: ADDED Edit result and notes

The system SHALL allow the DM to paste an AI response into a "Response" textarea and add freeform notes in a "Notes" textarea on an expanded card, and persist both on save.

#### Scenario: DM pastes response and saves

- **Given** the card is expanded and the response textarea is empty
- **When** the DM types an AI response and clicks "Save"
- **Then** `PUT /api/content/[id]` is called with the updated `result` value, and on reload the response is shown

#### Scenario: DM adds notes and saves

- **Given** the card is expanded
- **When** the DM types notes and clicks "Save"
- **Then** the notes are persisted and shown on reload

#### Scenario: Save failure shows error banner

- **Given** the card is expanded and the DM clicks "Save"
- **When** the API returns a 500 error
- **Then** an error banner is shown and the form values are not lost

---

### Requirement: ADDED Delete saved content

The system SHALL delete a saved item when the DM clicks "Delete" on an expanded card.

#### Scenario: DM deletes a saved item

- **Given** the card is expanded
- **When** the DM clicks "Delete"
- **Then** `DELETE /api/content/[id]` is called and the item is removed from the list

---

### Requirement: ADDED Library nav link on campaign cards

The system SHALL show a "Library" navigation button on each campaign card in `app/campaigns/page.tsx`, linking to `/campaigns/[id]/library`.

#### Scenario: Library button is present on campaign card

- **Given** the campaigns list page renders
- **When** a campaign has been selected
- **Then** a "Library" button is visible alongside "Prompt Builder" linking to `/campaigns/[id]/library`

---

## MODIFIED Requirements

### Requirement: MODIFIED Save to Library button in Prompt Builder

The "Save to Library" button in the Prompt Builder SHALL be enabled (not disabled) after a prompt is generated, and SHALL open an inline save panel rather than being a non-interactive stub.

#### Scenario: Save panel opens after prompt generation

- **Given** the DM has generated a prompt
- **When** the DM clicks "Save to Library"
- **Then** an inline save panel appears below the prompt output with a title input and Save/Cancel buttons

#### Scenario: Cancel dismisses the save panel

- **Given** the Save panel is open
- **When** the DM clicks "Cancel"
- **Then** the save panel closes and no API call is made

#### Scenario: Successful save shows confirmation

- **Given** the Save panel is open with a valid title
- **When** the DM clicks "Save" and the API responds with 201
- **Then** a confirmation message is shown with a link to the campaign library

---

## REMOVED Requirements

No requirements removed. The disabled Save to Library stub is replaced, not removed — the button now functions.

---

## Traceability

- Proposal: persist prompts → Requirement: ADDED SavedContent persistence
- Proposal: campaign-child route → Requirement: ADDED Campaign content library page
- Proposal: type union matches template IDs → Requirement: ADDED SavedContent persistence (type field)
- Proposal: all three prompt fields → Requirement: ADDED Expanded card with prompt display
- Proposal: inline save panel → Requirement: MODIFIED Save to Library button
- Design Decision 1 (storage pattern) → Requirement: ADDED SavedContent persistence
- Design Decision 2 (three prompt fields) → Requirement: ADDED Expanded card with prompt display
- Design Decision 3 (campaign-child route) → Requirement: ADDED Campaign content library page
- Design Decision 4 (type union) → Requirement: ADDED SavedContent persistence
- Design Decision 5 (DM-supplied title with suggestion) → Requirement: ADDED Title pre-fill from template fields
- Design Decision 6 (inline save panel) → Requirement: MODIFIED Save to Library button

---

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Unauthenticated access is rejected

- **Given** a request to `GET /api/content?campaignId=…` with no session cookie
- **When** the request is processed
- **Then** the response is 401 Unauthorized and no content data is returned

#### Scenario: User cannot access another user's content

- **Given** a `SavedContent` document owned by userId A
- **When** userId B requests `GET /api/content?campaignId=…` (same campaign)
- **Then** the item is not returned (userId filter applied to all queries)

### Requirement: Reliability

#### Scenario: Save API failure does not lose prompt

- **Given** the DM has generated a prompt and opened the Save panel
- **When** `POST /api/content` returns a 500 error
- **Then** an error banner is shown, the Save panel remains open, and the generated prompt is still visible on the page

### Requirement: Performance

#### Scenario: Library page loads content for a campaign

- **Given** a campaign with up to 100 saved items
- **When** the DM navigates to `/campaigns/[id]/library`
- **Then** the page renders the item list within an acceptable time (no formal SLA in v1; no N+1 queries — list is fetched in a single `GET /api/content?campaignId=…` call)

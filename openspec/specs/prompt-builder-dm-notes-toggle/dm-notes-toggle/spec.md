## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED DM notes toggle checkbox in Prompt Builder

The system SHALL render a labelled checkbox "Include DM notes in prompt" near the Generate button when `campaign.notes` is non-empty, and SHALL hide it when `campaign.notes` is empty or whitespace-only.

#### Scenario: Checkbox visible when notes are present

- **Given** the DM is on the Prompt Builder page for a campaign where `campaign.notes` is `"Active quest: find the lost relic."`
- **When** the page finishes loading
- **Then** a checkbox labelled "Include DM notes in prompt" is present in the DOM

#### Scenario: Checkbox hidden when notes are absent

- **Given** the DM is on the Prompt Builder page for a campaign where `campaign.notes` is `""` (empty string)
- **When** the page finishes loading
- **Then** no checkbox labelled "Include DM notes in prompt" is rendered

#### Scenario: Checkbox hidden when notes are whitespace only

- **Given** the DM is on the Prompt Builder page for a campaign where `campaign.notes` is `"   "` (whitespace only)
- **When** the page finishes loading
- **Then** no checkbox labelled "Include DM notes in prompt" is rendered

---

### Requirement: ADDED Notes block injected into prompt when toggle is checked

The system SHALL append a `"Current campaign context (DM notes):\n{campaign.notes}"` block to the generated prompt when the checkbox is checked and `campaign.notes` is non-empty.

#### Scenario: Notes block present when toggle checked

- **Given** the Prompt Builder has `campaign.notes = "Party just reached level 11."` and the "Include DM notes in prompt" checkbox is checked
- **When** the DM clicks Generate Prompt
- **Then** the generated prompt contains the line `"Current campaign context (DM notes):"` followed by `"Party just reached level 11."`

#### Scenario: Notes block absent when toggle unchecked

- **Given** the Prompt Builder has `campaign.notes = "Party just reached level 11."` and the "Include DM notes in prompt" checkbox is unchecked
- **When** the DM clicks Generate Prompt
- **Then** the generated prompt does NOT contain the string `"Current campaign context (DM notes):"`

---

### Requirement: ADDED Toggle is session-local with no persistence

The system SHALL default the toggle to unchecked on every page load and SHALL NOT persist the toggle state to any storage backend.

#### Scenario: Checkbox unchecked on initial load

- **Given** the DM navigates to the Prompt Builder page
- **When** the component mounts
- **Then** the "Include DM notes in prompt" checkbox is unchecked

---

### Requirement: ADDED Stale prompt cleared on toggle change

The system SHALL clear any previously generated prompt when the DM changes the notes toggle state, so the displayed prompt always reflects the current toggle value.

#### Scenario: Generated prompt cleared when toggle changes

- **Given** the DM has already generated a prompt with the checkbox unchecked
- **When** the DM checks the "Include DM notes in prompt" checkbox
- **Then** the previously generated prompt output is no longer displayed

## MODIFIED Requirements

### Requirement: MODIFIED `buildSystemPrompt` assembles notes block conditionally

`buildSystemPrompt(context, opts?)` in `lib/prompts/templates.ts` SHALL accept an optional second parameter `opts?: { includeNotes?: boolean }` and SHALL append the notes block only when `opts.includeNotes` is `true` and `context.campaign.notes.trim()` is non-empty. Existing call sites that omit `opts` SHALL be unaffected.

#### Scenario: Existing call sites unaffected

- **Given** `buildSystemPrompt(context)` is called without a second argument
- **When** the function executes
- **Then** the output is identical to the current behaviour (no notes block, no error)

#### Scenario: Notes block format is correct

- **Given** `buildSystemPrompt(context, { includeNotes: true })` is called with `context.campaign.notes = "Quest hook: the gate is sealed."`
- **When** the function executes
- **Then** the output contains exactly:
  ```
  Current campaign context (DM notes):
  Quest hook: the gate is sealed.
  ```

## REMOVED Requirements

None.

## Traceability

- Proposal element "checkbox hidden when notes empty" → Requirement: DM notes toggle checkbox (visibility rules)
- Proposal element "notes block appended when checked" → Requirement: Notes block injected into prompt
- Proposal element "toggle resets each session" → Requirement: Toggle is session-local
- Proposal element "clear builtPrompt on toggle" → Requirement: Stale prompt cleared on toggle change
- Design Decision 1 (opts parameter) → Requirement: MODIFIED buildSystemPrompt
- Design Decision 3 (hidden not disabled) → Requirement: DM notes toggle checkbox (visibility)
- Design Decision 4 (clear builtPrompt) → Requirement: Stale prompt cleared on toggle change
- Requirement: DM notes toggle checkbox → Task: Add checkbox UI to PromptBuilderContent
- Requirement: Notes block injected → Task: Extend buildSystemPrompt with opts
- Requirement: MODIFIED buildSystemPrompt → Task: Thread opts through PromptTemplate.build

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No regression when toggle is off

- **Given** the Prompt Builder is used without the notes toggle (notes empty or checkbox unchecked)
- **When** the DM generates any prompt
- **Then** the output is identical to the pre-change behaviour; all existing unit tests pass

### Requirement: Performance

#### Scenario: No additional network requests

- **Given** the DM opens the Prompt Builder page
- **When** the page loads and the DM interacts with the notes toggle
- **Then** no additional API calls are made; all data comes from the already-fetched `CampaignContext`

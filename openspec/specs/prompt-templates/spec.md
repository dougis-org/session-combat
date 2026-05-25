## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Five prompt templates defined in `lib/prompts/templates.ts`

The system SHALL export five `PromptTemplate` objects: `npcTemplate`, `locationTemplate`, `shopTemplate`, `magicItemTemplate`, and `roomTemplate`.

#### Scenario: All templates are exported and typed

- **Given** `lib/prompts/templates.ts` is imported
- **When** TypeScript compilation runs
- **Then** all five template exports conform to the `PromptTemplate` interface with no type errors

### Requirement: ADDED Each template's `build()` returns a `BuiltPrompt` with non-empty fields

The system SHALL return a `BuiltPrompt` whose `systemPrompt`, `userMessage`, and `fullText` are all non-empty strings when called with valid `fields` and a populated `CampaignContext`.

#### Scenario: NPC template with full context

- **Given** a `CampaignContext` with `campaign.name: "Curse of Strahd"`, `chapter.title: "Act II"`, one party with two resolved characters
- **And** `fields: { role: "innkeeper", location: "Barovia", requirements: "" }`
- **When** `npcTemplate.build(fields, context)` is called
- **Then** `result.systemPrompt` contains "Curse of Strahd" and "Act II" and both character names
- **And** `result.userMessage` contains "innkeeper" and "Barovia"
- **And** `result.fullText === result.systemPrompt + "\n\n" + result.userMessage`

#### Scenario: Template with null chapter

- **Given** a `CampaignContext` where `chapter === null`
- **When** any template's `build()` is called
- **Then** `result.systemPrompt` does not contain "undefined" or "null"; the chapter line is omitted gracefully

#### Scenario: Template with empty party

- **Given** a `CampaignContext` where `characters === []`
- **When** any template's `build()` is called
- **Then** `result.systemPrompt` contains a "no party members" or equivalent graceful note; no runtime error thrown

### Requirement: ADDED `buildSystemPrompt` utility shared across templates

The system SHALL export a `buildSystemPrompt(context: CampaignContext): string` function that assembles the campaign/party context block used by all templates.

#### Scenario: System prompt contains all context fields

- **Given** a fully populated `CampaignContext`
- **When** `buildSystemPrompt(context)` is called
- **Then** the returned string contains: campaign name, module name, chapter title, and a list of character names with class/level

#### Scenario: System prompt with partial context

- **Given** a `CampaignContext` with `chapter === null` and `characters === []`
- **When** `buildSystemPrompt(context)` is called
- **Then** no runtime error; string contains campaign name and module name at minimum

### Requirement: ADDED Each template defines its `fields` metadata

The system SHALL define a `fields: PromptField[]` array on each template, with at least one required field.

#### Scenario: Fields metadata drives dynamic form

- **Given** `npcTemplate.fields`
- **When** the UI iterates over `fields` to render form inputs
- **Then** each field has `key`, `label`, and at least a `placeholder`; required fields have `optional: false` or `optional` absent

## MODIFIED Requirements

No existing requirements modified.

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal element: 5 templates (NPC, Location, Shop, Magic Item, Room) → Requirement: ADDED Five templates
- Proposal element: agentic-ready return type → Requirement: ADDED `build()` returns `BuiltPrompt`
- Design decision: Decision 4 (`BuiltPrompt` interface) → Requirement: ADDED `build()` returns `BuiltPrompt`
- Design decision: Decision 6 (shared `buildSystemPrompt`) → Requirement: ADDED `buildSystemPrompt` utility
- Requirements → Tasks: Task group B in `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Template build never throws for missing optional fields

- **Given** a template with optional fields
- **When** `build()` is called with those optional fields absent from `fields` record
- **Then** no runtime error; optional content is omitted from the prompt gracefully

### Requirement: Extensibility

#### Scenario: Adding a sixth template requires no structural changes

- **Given** the `PromptTemplate` interface and `TEMPLATES` array in `lib/prompts/templates.ts`
- **When** a new template object is added to the array
- **Then** the UI renders it as a new tab without any changes to `page.tsx` template-selection logic

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED MonsterTemplateEditor is a standalone exported component

The system SHALL export `MonsterTemplateEditor` from `app/monsters/MonsterTemplateEditor.tsx` as a named export, independently importable.

#### Scenario: MonsterTemplateEditor renders with a template

- **Given** a `MonsterTemplate` object, `onSave`, `onCancel` callbacks, `isNew: false`, and `isGlobal: false`
- **When** `MonsterTemplateEditor` is rendered
- **Then** the template's name, size, type, alignment, speed, CR, source, and description fields are populated in the form

#### Scenario: MonsterTemplateEditor validates empty name on save

- **Given** `MonsterTemplateEditor` is rendered with a template
- **When** the user clears the name field and clicks Save
- **Then** a validation error is displayed and `onSave` is not called

#### Scenario: MonsterTemplateEditor calls onSave with updated data

- **Given** `MonsterTemplateEditor` is rendered with a valid template
- **When** the user updates the name and clicks Save
- **Then** `onSave` is called with the updated template object

#### Scenario: MonsterTemplateEditor calls onCancel

- **Given** `MonsterTemplateEditor` is rendered
- **When** the user clicks Cancel
- **Then** `onCancel` is called and `onSave` is not called

#### Scenario: MonsterTemplateEditor applies isGlobal styling

- **Given** `isGlobal: true`
- **When** `MonsterTemplateEditor` is rendered
- **Then** global-variant styling (e.g., purple border/badge) is applied to the editor shell

### Requirement: ADDED MonsterTemplateCard is a standalone exported component

The system SHALL export `MonsterTemplateCard` from `app/monsters/MonsterTemplateCard.tsx` as a named export.

#### Scenario: MonsterTemplateCard renders template info

- **Given** a `MonsterTemplate` with name, size, type, and challenge rating
- **When** `MonsterTemplateCard` is rendered with `isGlobal: false`
- **Then** the name, size/type, and CR are visible; no Global badge is shown

#### Scenario: MonsterTemplateCard shows global badge for global templates

- **Given** a `MonsterTemplate` and `isGlobal: true`
- **When** `MonsterTemplateCard` is rendered
- **Then** a "Global" badge is displayed alongside the template name

### Requirement: ADDED formatSpeedValue correctly formats stored speed values

The system SHALL have a `formatSpeedValue` helper inside `MonsterTemplateEditor.tsx` that:
- Returns a string as-is if the speed value is already a string
- Converts a key/value object into a comma-separated string (e.g., `{ walk: "30 ft.", fly: "60 ft." }` → `"walk 30 ft., fly 60 ft."`)
- Returns `"30 ft."` for null/undefined/unrecognised input

#### Scenario: formatSpeedValue with string input

- **Given** `speed` is stored as a plain string `"30 ft."`
- **When** `formatSpeedValue("30 ft.")` is called
- **Then** it returns `"30 ft."` unchanged

#### Scenario: formatSpeedValue with object input

- **Given** `speed` is stored as `{ walk: "30 ft.", fly: "60 ft." }`
- **When** `formatSpeedValue` is called with that object
- **Then** it returns `"walk 30 ft., fly 60 ft."`

## MODIFIED Requirements

### Requirement: MODIFIED app/monsters/page.tsx imports extracted components

The system SHALL import `MonsterTemplateEditor` and `MonsterTemplateCard` from their respective files rather than defining them inline.

#### Scenario: page.tsx compiles without errors after extraction

- **Given** `MonsterTemplateEditor` and `MonsterTemplateCard` have been moved to their own files
- **When** `tsc --noEmit` is run
- **Then** zero TypeScript errors are reported

#### Scenario: MonstersPage renders without regressions

- **Given** the extraction is complete and the test file has been moved to `tests/unit/components/MonstersPage.test.tsx`
- **When** the existing monsters page test suite is run
- **Then** all previously-passing scenarios continue to pass with the same count

## REMOVED Requirements

None. This is a structural refactor with no behaviour removed.

## Traceability

- Proposal element "Extract MonsterTemplateEditor" → Requirement: ADDED MonsterTemplateEditor is a standalone exported component
- Proposal element "Extract MonsterTemplateCard" → Requirement: ADDED MonsterTemplateCard is a standalone exported component
- Proposal element "Rename normalizeSpeed → formatSpeedValue" → Requirement: ADDED formatSpeedValue correctly formats stored speed values
- Proposal element "Move monstersPage.test.tsx" → Requirement: MODIFIED app/monsters/page.tsx imports extracted components (scenario: MonstersPage renders without regressions)
- Design Decision 1 → ADDED MonsterTemplateEditor / MonsterTemplateCard requirements
- Design Decision 2 → ADDED formatSpeedValue requirement
- Design Decision 3 → MODIFIED page.tsx imports (scenario: MonstersPage renders without regressions)
- ADDED MonsterTemplateEditor requirement → Task: Extract MonsterTemplateEditor, Task: Add MonsterTemplateEditor.test.tsx
- ADDED MonsterTemplateCard requirement → Task: Extract MonsterTemplateCard
- ADDED formatSpeedValue requirement → Task: Extract MonsterTemplateEditor (rename is part of extraction)
- MODIFIED page.tsx requirement → Task: Update page.tsx imports, Task: Move monstersPage.test.tsx

## Non-Functional Acceptance Criteria

### Requirement: Performance

No latency or throughput impact. This is a static refactor with no runtime changes — no NFAC performance scenario required.

### Requirement: Security

No new network calls, auth paths, or data exposure introduced. See functional scenario: "page.tsx compiles without errors after extraction".

### Requirement: Reliability

#### Scenario: No test regressions after extraction

- **Given** the full Jest test suite is run after extraction
- **When** comparing test pass counts for `monsters`-related tests before and after
- **Then** the count is identical and no tests are skipped or removed

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED EncounterEditor extraction and unit test coverage

The `EncounterEditor` component SHALL be extracted from `app/encounters/page.tsx` into `app/encounters/EncounterEditor.tsx` as a named export, following the `CampaignEditor` convention. Unit tests SHALL cover rendering, field pre-population, save/cancel callbacks, monster list display, and the Add Combatant button.

#### Scenario: Shows "Create Encounter" title when isNew is true

- **Given** `EncounterEditor` is rendered with `isNew={true}`
- **When** the component mounts
- **Then** a heading containing "Create Encounter" is present in the DOM

#### Scenario: Shows "Edit Encounter" title when isNew is false

- **Given** `EncounterEditor` is rendered with `isNew={false}`
- **When** the component mounts
- **Then** a heading containing "Edit Encounter" is present in the DOM

#### Scenario: Name and description fields are pre-populated from encounter prop

- **Given** an encounter with `name: "Goblin Ambush"` and `description: "Roadside attack"` is passed
- **When** the component mounts
- **Then** the name input has value "Goblin Ambush" and the description textarea has value "Roadside attack"

#### Scenario: Save button is disabled when name is empty

- **Given** an encounter with an empty name is passed
- **When** the component renders
- **Then** the "Save Encounter" button is disabled

#### Scenario: Save button is enabled when name is non-empty

- **Given** an encounter with a non-empty name is passed
- **When** the component renders
- **Then** the "Save Encounter" button is enabled

#### Scenario: Clicking Save calls onSave with the merged encounter shape

- **Given** a name and description are displayed, and `onSave` is a jest spy
- **When** the user clicks the Save Encounter button
- **Then** `onSave` is called once with an object containing the current `name`, `description`, and `monsters`

#### Scenario: Clicking Cancel calls onCancel

- **Given** `onCancel` is a jest spy
- **When** the user clicks the Cancel button
- **Then** `onCancel` is called once

#### Scenario: Shows empty monster list state

- **Given** an encounter with `monsters: []`
- **When** the component mounts
- **Then** "No monsters added yet." text is present

#### Scenario: Shows monster rows when monsters are present

- **Given** an encounter with one or more monsters
- **When** the component mounts
- **Then** each monster's name is visible; Edit and Delete buttons are present per monster

#### Scenario: Add Combatant button is present

- **Given** `EncounterEditor` is rendered
- **When** the component mounts
- **Then** a button labeled "Add Combatant" is present in the DOM

## MODIFIED Requirements

### Requirement: MODIFIED EncounterEditor file location

`EncounterEditor` SHALL move from being a private function in `app/encounters/page.tsx` to a named export in `app/encounters/EncounterEditor.tsx`.

#### Scenario: Named import resolves correctly

- **Given** `import { EncounterEditor } from '@/app/encounters/EncounterEditor'` in a consumer or test
- **When** the module is resolved
- **Then** `EncounterEditor` is a renderable React component accepting `{ encounter, onSave, onCancel, isNew }`

#### Scenario: app/encounters/page.tsx still compiles after extraction

- **Given** `EncounterEditor` has been removed from `page.tsx` and added as an import from `./EncounterEditor`
- **When** TypeScript compiles the project
- **Then** no type errors or missing-import errors are reported

## REMOVED Requirements

_(None — MonsterEditor is intentionally not extracted or tested in this change; see #378/#379.)_

## Traceability

- Proposal element (EncounterEditor extraction) → MODIFIED file location requirement
- Proposal element (EncounterEditor test coverage) → ADDED unit test coverage requirement
- Design decision 1 (extraction follows CampaignEditor) → MODIFIED file location
- Design decision 4 (mock boundary: mock QuickCombatantModal, Modal, MonsterEditor) → All scenarios
- Requirement → Task: `app/encounters/EncounterEditor.tsx` + `tests/unit/components/EncounterEditor.test.tsx`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Extraction causes no runtime regression

- **Given** the full test suite runs after `EncounterEditor` is extracted
- **When** `npm run test:unit` executes
- **Then** all previously passing tests continue to pass

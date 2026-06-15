## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED MonsterStatEditor shared form component

The system SHALL provide a controlled `MonsterStatEditor` form component in `lib/components/MonsterStatEditor.tsx` that renders all editable monster header fields and the full `CreatureStatsForm` stat block, accepting a `MonsterEditableFields` value and an `onChange` callback.

#### Scenario: Renders all header fields

- **Given** `MonsterStatEditor` is rendered with a `MonsterEditableFields` value
- **When** the component mounts
- **Then** inputs for name, size, type, alignment, speed, challengeRating, source, and description are present in the DOM

#### Scenario: Renders the stat block form

- **Given** `MonsterStatEditor` is rendered with a `MonsterEditableFields` value
- **When** the component mounts
- **Then** `CreatureStatsForm` is rendered with `stats` equal to the `CreatureStats` portion of `value`

#### Scenario: Header field change propagates via onChange

- **Given** `MonsterStatEditor` is rendered with an `onChange` spy
- **When** the user changes the name field
- **Then** `onChange` is called with an updated `MonsterEditableFields` containing the new name

#### Scenario: Stat block change propagates via onChange

- **Given** `MonsterStatEditor` is rendered with an `onChange` spy
- **When** `CreatureStatsForm` fires its `onChange` with updated stats
- **Then** `MonsterStatEditor`'s `onChange` is called with a `MonsterEditableFields` merging the updated stats

### Requirement: ADDED MonsterEditableFields type

The system SHALL export a `MonsterEditableFields` type from `lib/types.ts` that is structurally assignable from both `Monster` and `MonsterTemplate`.

#### Scenario: Monster is assignable to MonsterEditableFields

- **Given** a value of type `Monster`
- **When** it is passed as `value` to `MonsterStatEditor`
- **Then** TypeScript compilation succeeds with no type errors

#### Scenario: MonsterTemplate is assignable to MonsterEditableFields

- **Given** a value of type `MonsterTemplate`
- **When** it is passed as `value` to `MonsterStatEditor`
- **Then** TypeScript compilation succeeds with no type errors

## MODIFIED Requirements

### Requirement: MODIFIED MonsterEditor renders full stat block

The system SHALL render the full `CreatureStatsForm` stat block (not just 5 fields) when `MonsterEditor` is displayed, by delegating form rendering to `MonsterStatEditor`.

#### Scenario: Full stat block is present

- **Given** `MonsterEditor` is rendered with a `Monster`
- **When** the component mounts
- **Then** the full stat block (abilityScores, ac, hp, maxHp, skills, traits, actions, etc.) is rendered via `MonsterStatEditor`

#### Scenario: Save callback receives fully merged Monster

- **Given** `MonsterEditor` is rendered with a `Monster` and an `onSave` spy
- **When** the user edits a header field and clicks Save
- **Then** `onSave` is called with a `Monster` that includes the updated field merged onto the original Monster value

#### Scenario: Cancel fires onCancel

- **Given** `MonsterEditor` is rendered with an `onCancel` spy
- **When** the user clicks Cancel
- **Then** `onCancel` is called

### Requirement: MODIFIED MonsterTemplateEditor delegates form rendering to MonsterStatEditor

The system SHALL delegate all header field and stat block rendering to `MonsterStatEditor`, retaining only save logic, validation, `isGlobal` styling, and `isNew` button label in the wrapper.

#### Scenario: MonsterStatEditor receives correct value

- **Given** `MonsterTemplateEditor` is rendered with a `MonsterTemplate`
- **When** the component mounts
- **Then** `MonsterStatEditor` receives a `value` equal to the editable fields of the template

#### Scenario: Validation error shown on empty name

- **Given** `MonsterTemplateEditor` is rendered with an `isNew` template
- **When** the user clears the name field and clicks Save
- **Then** a validation error message is displayed and the API is not called

#### Scenario: Async save calls API and fires onSave

- **Given** `MonsterTemplateEditor` is rendered with a valid template
- **When** the user clicks Save
- **Then** `fetch` is called with the correct endpoint and the updated template body, and `onSave` is called on success

#### Scenario: isGlobal styling applied

- **Given** `MonsterTemplateEditor` is rendered with `isGlobal={true}`
- **When** the component mounts
- **Then** the global styling indicator is present in the DOM

#### Scenario: isNew shows Create button label

- **Given** `MonsterTemplateEditor` is rendered with `isNew={true}`
- **When** the component mounts
- **Then** the save button label reads "Create"

#### Scenario: Not isNew shows Save button label

- **Given** `MonsterTemplateEditor` is rendered with `isNew={false}`
- **When** the component mounts
- **Then** the save button label reads "Save"

## REMOVED Requirements

### Requirement: REMOVED MonsterEditor 5-field-only editing surface

Reason for removal: The 5-field implementation (name, hp, maxHp, ac, dexterity only) is superseded by the full stat block via `MonsterStatEditor`. There is no good reason to restrict encounter-instance editing compared to the catalog editor.

## Traceability

- Proposal element "new lib/components/MonsterStatEditor.tsx" -> Requirement: ADDED MonsterStatEditor shared form component
- Proposal element "MonsterEditableFields structural type" -> Requirement: ADDED MonsterEditableFields type
- Proposal element "Refactor MonsterEditor to thin wrapper" -> Requirement: MODIFIED MonsterEditor renders full stat block
- Proposal element "Refactor MonsterTemplateEditor to thin wrapper" -> Requirement: MODIFIED MonsterTemplateEditor delegates form rendering to MonsterStatEditor
- Design Decision 1 (MonsterEditableFields type) -> Requirement: ADDED MonsterEditableFields type
- Design Decision 2 (MonsterStatEditor controlled interface) -> Requirement: ADDED MonsterStatEditor shared form component
- Design Decision 3 (location in lib/components/) -> Requirement: ADDED MonsterStatEditor shared form component
- Design Decision 4 (save behavior unchanged) -> Requirement: MODIFIED MonsterEditor renders full stat block, MODIFIED MonsterTemplateEditor delegates form rendering
- Requirement ADDED MonsterStatEditor -> Task: Create lib/components/MonsterStatEditor.tsx
- Requirement ADDED MonsterEditableFields -> Task: Add MonsterEditableFields to lib/types.ts
- Requirement MODIFIED MonsterEditor -> Task: Refactor app/encounters/MonsterEditor.tsx
- Requirement MODIFIED MonsterTemplateEditor -> Task: Refactor app/monsters/MonsterTemplateEditor.tsx

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: TypeScript build passes with no new errors

- **Given** the implementation is complete
- **When** `tsc --noEmit` (or `npm run build`) is run
- **Then** zero TypeScript errors are reported related to `MonsterEditableFields`, `MonsterStatEditor`, `MonsterEditor`, or `MonsterTemplateEditor`

#### Scenario: Test suite passes with no regressions

- **Given** the implementation is complete
- **When** `npm run test:unit` is run
- **Then** all tests pass with zero failures in `MonsterEditor.test.tsx`, `MonsterTemplateEditor.test.tsx`, and any new `MonsterStatEditor.test.tsx`

### Requirement: Security

See functional scenarios above — no new security surface is introduced by this change. All save paths are unchanged.

### Requirement: Performance

No performance-sensitive paths are modified. Form rendering is synchronous and client-side only.

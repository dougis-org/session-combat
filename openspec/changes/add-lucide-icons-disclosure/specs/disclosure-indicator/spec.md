## ADDED Requirements

This document details *changes* to requirements and is additive to the
[`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Shared chevron indicator component

The system SHALL provide a `Chevron` component in `lib/components/ui.tsx`,
built on the `lucide-react` `ChevronRight` icon, that visually rotates between
a "closed" and "open" orientation based on an `expanded` boolean prop.

#### Scenario: Chevron renders closed by default

- **Given** a `Chevron` is rendered with `expanded={false}`
- **When** the component is inspected
- **Then** it renders the lucide `ChevronRight` icon with no rotation applied

#### Scenario: Chevron rotates when expanded

- **Given** a `Chevron` is rendered with `expanded={true}`
- **When** the component is inspected
- **Then** it renders the same icon with a 90-degree rotation class applied,
  visually distinguishing the open state from the closed state

### Requirement: ADDED Shared controlled disclosure wrapper component

The system SHALL provide a `Disclosure` component in `lib/components/ui.tsx`
that renders a `<button>` containing a label and a trailing `Chevron`, with
`aria-expanded` reflecting an externally supplied `open` boolean, and that
calls an externally supplied `onToggle` callback on click rather than managing
its own internal open/closed state.

#### Scenario: Disclosure reflects controlled open state

- **Given** a `Disclosure` is rendered with `open={true}`
- **When** the rendered button is inspected
- **Then** the button has `aria-expanded="true"` and its `Chevron` is rotated
  to the open orientation

#### Scenario: Disclosure reflects controlled closed state

- **Given** a `Disclosure` is rendered with `open={false}`
- **When** the rendered button is inspected
- **Then** the button has `aria-expanded="false"` and its `Chevron` is not
  rotated

#### Scenario: Disclosure delegates toggling to the caller

- **Given** a `Disclosure` is rendered with `open={false}` and an `onToggle`
  callback
- **When** the user clicks the button
- **Then** `onToggle` is called exactly once, and the component's own
  displayed `open` state does not change until the caller re-renders it with a
  new `open` value (the component holds no internal state of its own)

### Requirement: ADDED Session log entries expose a visible expand/collapse indicator

The system SHALL render a `Chevron` inside each session log entry's title
button in `app/campaigns/[id]/sessions/page.tsx` (`SessionEntryCard`),
reflecting the entry's current expanded/collapsed state, and set
`aria-expanded` on that button. This closes GitHub issue #726.

#### Scenario: Collapsed session log entry shows a closed chevron

- **Given** a session log entry rendered in its default (collapsed) state
- **When** the entry's title row is inspected
- **Then** it shows a `Chevron` in the closed orientation and the title
  button has `aria-expanded="false"`

#### Scenario: Clicking a session log entry's title expands it and rotates the chevron

- **Given** a collapsed session log entry
- **When** the user clicks the entry's title row
- **Then** the entry's summary/events content becomes visible, the button's
  `aria-expanded` becomes `"true"`, and the `Chevron` rotates to the open
  orientation

#### Scenario: Clicking an expanded session log entry's title collapses it again

- **Given** an expanded session log entry
- **When** the user clicks the entry's title row again
- **Then** the entry's summary/events content is hidden again, the button's
  `aria-expanded` returns to `"false"`, and the `Chevron` rotates back to the
  closed orientation

### Requirement: ADDED Condition list toggle exposes a visible expand/collapse indicator

The system SHALL render a `Chevron` inside the "Conditions (N)" toggle button
in `lib/components/combatant-card/ConditionControls.tsx`, reflecting the
list's current expanded/collapsed state, and set `aria-expanded` on that
button, without changing when the button itself is shown.

#### Scenario: Conditions toggle is absent with zero conditions

- **Given** a combatant with zero conditions
- **When** the combatant card is rendered
- **Then** no conditions toggle button (and therefore no `Chevron`) is
  rendered — unchanged from current behavior

#### Scenario: Conditions toggle shows a chevron reflecting state

- **Given** a combatant with one or more conditions, and the conditions list
  currently collapsed
- **When** the toggle button is inspected
- **Then** it shows the condition count, a `Chevron` in the closed
  orientation, and `aria-expanded="false"`

#### Scenario: Expanding the conditions list rotates the chevron

- **Given** a combatant with one or more conditions, conditions list collapsed
- **When** the user clicks the toggle button
- **Then** the conditions list becomes visible, `aria-expanded` becomes
  `"true"`, and the `Chevron` rotates to the open orientation

### Requirement: ADDED Character card stat-block toggle uses the shared disclosure component

The system SHALL replace the text-only "Expand"/"Collapse" toggle in
`lib/components/CharacterCard.tsx` with a `Disclosure` component, preserving
the same content (the `CreatureStatBlock`) being shown or hidden.

#### Scenario: Character card toggle shows a labeled disclosure with chevron

- **Given** a character card rendered in its default (collapsed) state
- **When** the toggle control is inspected
- **Then** it is rendered via `Disclosure`, with `aria-expanded="false"` and a
  closed-orientation `Chevron`

#### Scenario: Expanding a character card reveals the same stat block as before

- **Given** a collapsed character card
- **When** the user clicks the disclosure toggle
- **Then** the character's `CreatureStatBlock` becomes visible (unchanged
  content/props from before migration), `aria-expanded` becomes `"true"`, and
  the `Chevron` rotates open

### Requirement: ADDED Campaign editor chapters section uses the shared disclosure component

The system SHALL replace the unicode `▲`/`▼` indicator in the chapters
accordion section of `app/campaigns/CampaignEditor.tsx` with a `Disclosure`
component (or a `Chevron` embedded in the existing button, preserving the
"📖 Chapters (N)" label), preserving existing `aria-expanded` behavior and
revealed content.

#### Scenario: Chapters section shows a chevron reflecting state

- **Given** the campaign editor's chapters section, in its default state
- **When** the section header is inspected
- **Then** `aria-expanded` matches the section's open/closed state and a
  `Chevron` (not a unicode glyph) is rendered in the matching orientation

#### Scenario: Toggling the chapters section preserves existing revealed content

- **Given** the campaign editor's chapters section collapsed
- **When** the user clicks the section header
- **Then** the same chapter content that was revealed before this migration
  (current chapter display, chapter list, etc.) is revealed unchanged, and the
  `Chevron` rotates open

### Requirement: ADDED Campaign library entries use the shared disclosure component

The system SHALL replace the unicode `▲`/`▼` indicator in
`app/campaigns/[id]/library/page.tsx` with a `Chevron` embedded in the
existing entry button (preserving the type label, title, chapter, date, and
"saved result" indicator already rendered in that button), preserving existing
`aria-expanded` behavior and revealed content.

#### Scenario: Library entry shows a chevron reflecting state

- **Given** a campaign library entry in its default (collapsed) state
- **When** the entry's button is inspected
- **Then** `aria-expanded="false"` and a `Chevron` (not a unicode glyph) is
  rendered in the closed orientation, alongside the entry's existing metadata

#### Scenario: Toggling a library entry preserves existing revealed content

- **Given** a collapsed campaign library entry
- **When** the user clicks the entry's button
- **Then** the same prompt/response content that was revealed before this
  migration is revealed unchanged, `aria-expanded` becomes `"true"`, and the
  `Chevron` rotates open

### Requirement: ADDED Creature stats form sections use the shared disclosure component

The system SHALL replace the unicode `▶`/`▼` indicators in all five toggle
sections of `lib/components/CreatureStatsForm.tsx` (ability scores, skills,
resistances, senses, and the remaining independently-toggled section) with the
`Disclosure` component (or `Chevron`, per Design Decision 2), driven by the
existing `expandedSections` state (and the independent `expanded` state for
the fifth section), moving the indicator from a leading to a trailing position
relative to the section label.

#### Scenario: Each stats form section shows a chevron reflecting its own state

- **Given** the creature stats form with some sections expanded and others
  collapsed
- **When** each section's header is inspected independently
- **Then** each section's `aria-expanded` and `Chevron` orientation reflect
  that section's own state, independent of the other four sections

#### Scenario: Toggling one stats form section does not affect the others

- **Given** the creature stats form with all sections collapsed
- **When** the user clicks the "Skills" section header
- **Then** only the skills section's content becomes visible and only its
  `Chevron` rotates open; the other four sections remain collapsed with
  closed-orientation chevrons

## Traceability

- Proposal element: Add `lucide-react` dependency -> Requirement: ADDED Shared
  chevron indicator component.
- Proposal element: Shared `Disclosure`/`Chevron` component in `ui.tsx` ->
  Requirement: ADDED Shared chevron indicator component; ADDED Shared
  controlled disclosure wrapper component.
- Proposal element: Migrate `SessionEntryCard` (closes #726) -> Requirement:
  ADDED Session log entries expose a visible expand/collapse indicator.
- Proposal element: Migrate `ConditionControls` -> Requirement: ADDED
  Condition list toggle exposes a visible expand/collapse indicator.
- Proposal element: Migrate `CharacterCard` -> Requirement: ADDED Character
  card stat-block toggle uses the shared disclosure component.
- Proposal element: Migrate `CampaignEditor` chapters section -> Requirement:
  ADDED Campaign editor chapters section uses the shared disclosure component.
- Proposal element: Migrate library page -> Requirement: ADDED Campaign
  library entries use the shared disclosure component.
- Proposal element: Migrate `CreatureStatsForm` (5 sections) -> Requirement:
  ADDED Creature stats form sections use the shared disclosure component.
- Design decision -> Requirement: Decision 1 (single rotating icon) ->
  Shared chevron indicator component; Decision 2 (two exports) -> Shared
  chevron indicator component + Shared controlled disclosure wrapper
  component; Decision 3 (controlled API) -> Shared controlled disclosure
  wrapper component; Decision 4 (trailing placement) -> all six per-call-site
  requirements above; Decision 5 (conditional render preserved) -> Condition
  list toggle requirement.
- Requirement -> Task(s): see `tasks.md` (one implementation task per
  requirement above, plus the shared-component task each depends on).

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Lucide import stays limited to the chevron icon

- **Given** the `Chevron` component's implementation
- **When** its imports are inspected
- **Then** it imports only `ChevronRight` from `lucide-react` (no other icons,
  no default/wildcard import of the package)

### Requirement: Accessibility

#### Scenario: Every migrated disclosure control exposes `aria-expanded`

- **Given** any of the six migrated call sites (session log entries,
  conditions toggle, character card, campaign editor chapters, library
  entries, creature stats form sections)
- **When** the interactive button for that disclosure is inspected in either
  state
- **Then** the button carries an `aria-expanded` attribute whose value
  (`"true"`/`"false"`) matches the control's current open/closed state

# D&D Beyond Character Import

## Purpose
Allow authenticated users to import D&D Beyond characters into the app by submitting a publicly available character URL that the system can fetch and parse.
## Requirements
### Requirement: Users can import a public D&D Beyond character by URL
The system SHALL allow an authenticated user to submit a publicly available D&D Beyond character URL and import that character into the user's character list when the system can access and parse the character data from that URL.

#### Scenario: Successful import creates a new character
- **WHEN** an authenticated user submits a publicly available D&D Beyond character URL that the system can fetch and parse and no existing character with the same name exists for that user
- **THEN** the system fetches and parses the remote character data from the submitted URL
- **THEN** the system normalizes the imported data into a valid local `Character` record
- **THEN** the system persists the new character for that user

#### Scenario: Any publicly accessible character URL is accepted
- **WHEN** an authenticated user submits a publicly accessible URL that the system can fetch and parse into importable D&D Beyond character data
- **THEN** the system treats the URL as a supported import source without requiring a specific path shape

#### Scenario: Import requires authentication
- **WHEN** an unauthenticated request is made to the import workflow
- **THEN** the system rejects the request using the application's existing auth enforcement behavior

### Requirement: Duplicate-name imports require explicit abort-or-overwrite

The system SHALL detect existing characters with the same name for the
authenticated user before persisting an imported character and SHALL require the
user to either abort the import or explicitly request a full overwrite.

#### Scenario: Duplicate name returns a conflict decision point

- **WHEN** the imported character name matches an existing character name for

  the authenticated user and the request does not include overwrite approval

- **THEN** the system does not modify the existing character
- **THEN** the system returns a conflict response that allows the UI to present

  abort or overwrite options

#### Scenario: Abort leaves existing data unchanged

- **WHEN** the user chooses to abort after the system reports a duplicate-name

  conflict

- **THEN** no new character is created
- **THEN** the existing character remains unchanged

#### Scenario: Overwrite replaces the existing same-name character

- **WHEN** the user explicitly confirms overwrite for a duplicate-name import
- **THEN** the system replaces the existing same-name character with the

  imported data as a complete replacement

- **THEN** the system does not merge fields from the previous record into the

  imported record

- **THEN** the system preserves the existing local character ID

### Requirement: Imported data must be normalized and validated before storage

The system SHALL validate imported D&D Beyond data against the local character
model before persistence, SHALL coerce unsupported imported values to safe local
defaults where possible, and SHALL reject imports that cannot be normalized into
valid local data.

The system SHALL correctly incorporate all D&D Beyond modifier contributions to
HP and AC during normalization, including subclass features and item bonuses
expressed via `hit-points-per-level`, `hit-points`, and `unarmored-armor-class`
modifier subtypes.

#### Scenario: Missing optional fields are defaulted safely

- **WHEN** the source character omits local optional fields or omits required

  combat values that have safe existing app defaults

- **THEN** the system applies those safe defaults during normalization
- **THEN** the persisted character remains valid for the existing character and

  combat UI flows

#### Scenario: Unsupported values are coerced and reported

- **WHEN** imported fields contain values outside the app's supported enums or

  shapes and a safe local default exists

- **THEN** the system coerces those fields to safe defaults during

  normalization

- **THEN** the system returns a warning summary describing the fields that were

  normalized for the user

#### Scenario: Unsupported required data causes import failure

- **WHEN** the source data is missing required identity or class information, or

  contains values that cannot be normalized into the local character model even
  after safe-default coercion is attempted

- **THEN** the system rejects the import
- **THEN** the system does not persist a partial character record

#### Scenario: Unarmored AC includes set-type unarmored-armor-class modifiers

- **WHEN** a character has no equipped armor and one or more modifiers with
  `subType === "unarmored-armor-class"` and `type === "set"`
- **THEN** the normalized AC uses the highest such `set` value as the unarmored
  base offset (added to the base of 10) before adding the DEX modifier
- **THEN** the resulting AC equals `10 + max(set values) + sum(bonus values) + DEX modifier`

#### Scenario: Unarmored AC includes bonus-type unarmored-armor-class modifiers

- **WHEN** a character has no equipped armor and one or more modifiers with
  `subType === "unarmored-armor-class"` and `type === "bonus"`
- **THEN** each such modifier's value is added to the unarmored AC
- **THEN** the bonus stacks with any `set`-type unarmored-armor-class modifier

#### Scenario: Unarmored AC combines set and bonus unarmored modifiers

- **WHEN** a character has both `set` and `bonus` `unarmored-armor-class`
  modifiers and no equipped armor
- **THEN** the system applies `10 + max(set values) + sum(bonus values) + DEX modifier`
- **THEN** no modifier contribution is double-counted or omitted

#### Scenario: Max HP includes per-level hit point bonus modifiers

- **WHEN** a character has one or more modifiers with
  `subType === "hit-points-per-level"` and no HP override is set
- **THEN** each such modifier's value is multiplied by total character level
  and added to max HP
- **THEN** the total reflects the full hit-points-per-level bonus across all
  modifier groups

#### Scenario: Max HP includes flat hit point bonus modifiers

- **WHEN** a character has one or more modifiers with `subType === "hit-points"`
  and no HP override is set
- **THEN** each such modifier's fixed or numeric value is added to max HP

#### Scenario: HP override still takes precedence over all modifiers

- **WHEN** a character has `overrideHitPoints` set and also has
  `hit-points-per-level` or `hit-points` modifiers
- **THEN** the normalized max HP equals `overrideHitPoints` exactly
- **THEN** modifier-derived HP bonuses are not applied

### Requirement: Import failures are explicit and non-destructive
The system SHALL return explicit failure results when a submitted URL cannot be accessed or cannot be parsed into importable D&D Beyond character data, as well as for remote fetch failures, parsing failures, and validation failures, without modifying existing character records.

#### Scenario: Unsupported or invalid URL is rejected
- **WHEN** the user submits a URL that the system cannot access or cannot parse into importable D&D Beyond character data
- **THEN** the system rejects the request with a validation or import error
- **THEN** no character data is created or modified

#### Scenario: Source character cannot be accessed or parsed
- **WHEN** the remote character page is unavailable, not public, times out, or cannot be parsed into importable data
- **THEN** the system returns an import failure with a user-actionable error
- **THEN** no character data is created or modified

#### Scenario: Access drives acceptance before URL shape assumptions
- **WHEN** the system can access the submitted URL and parse importable character data from it
- **THEN** shape-only assumptions do not block the import
- **THEN** the system proceeds with normalization and persistence

### Requirement: The import UI preserves the submitted source URL verbatim
The system SHALL display the exact URL entered by the user as transient import source data and SHALL prompt the user to enter a publicly available URL.

#### Scenario: Submitted public URL is echoed verbatim
- **WHEN** the user enters a URL into the import flow and the UI displays source URL state or follow-up messaging
- **THEN** the displayed URL matches the submitted text
- **THEN** the display does not canonicalize or rewrite the URL

#### Scenario: UI copy mentions publicly available URL
- **WHEN** the user opens the D&D Beyond import form
- **THEN** the form instructs the user to provide a publicly available URL

### Requirement: Users are alerted when imports are normalized

The system SHALL alert the user when imported data was coerced, defaulted, or
partially downgraded during normalization.

#### Scenario: Successful import surfaces normalization warnings

- **WHEN** an import succeeds with one or more normalization warnings
- **THEN** the system surfaces a user-visible warning summary after the import
- **THEN** the warning summary identifies that some imported fields were changed

  to safe defaults

### Requirement: The import flow must remain testable and operationally safe

The system SHALL provide automated coverage for successful import,
duplicate-name conflict handling, overwrite behavior, and representative import
failure cases.

#### Scenario: Automated coverage protects the import contract

- **WHEN** the import capability is implemented
- **THEN** automated tests cover successful create, duplicate conflict, abort,

  overwrite, and invalid-source failure behavior

#### Scenario: Remote fetch handling is bounded

- **WHEN** the system performs a remote fetch for import
- **THEN** the request is subject to an explicit timeout or equivalent bounded

  failure behavior

- **THEN** a stalled remote source does not leave the import workflow hanging

  indefinitely

### Requirement: D&D Beyond modifier types are fully modeled

The system's internal `DndBeyondModifier` interface SHALL model the `"set"`
modifier type as a recognized value alongside `"bonus"` and `"set-base"`, so
that all modifier shapes returned by the D&D Beyond character service are typed
correctly.

#### Scenario: Set-type modifiers are recognized at the type level

- **WHEN** the D&D Beyond character service returns a modifier with
  `type === "set"` (e.g. for `unarmored-armor-class`)
- **THEN** the modifier is handled by normalization logic without requiring a
  type cast or falling through unhandled

### Requirement: Support for additional official races and subraces
The system SHALL recognize and import a broader range of official D&D races and subraces, including "Mountain Dwarf", "Aasimar", "Goliath", and others.

#### Scenario: Mountain Dwarf is imported successfully
- **WHEN** a character with the race "Mountain Dwarf" is imported from DnD Beyond
- **THEN** the system SHALL recognize it as a valid race
- **THEN** the system SHALL persist the character with the race "Mountain Dwarf"
- **THEN** no normalization warning for the race SHALL be returned

#### Scenario: Aasimar is imported successfully
- **WHEN** a character with the race "Aasimar" is imported from DnD Beyond
- **THEN** the system SHALL recognize it as a valid race
- **THEN** the system SHALL persist the character with the race "Aasimar"
- **THEN** no normalization warning for the race SHALL be returned

### Requirement: Support for Artificer and other classes
The system SHALL recognize and import additional official classes, specifically the "Artificer" and "Blood Hunter" classes.

#### Scenario: Artificer class is imported successfully
- **WHEN** a character with the "Artificer" class is imported from DnD Beyond
- **THEN** the system SHALL recognize it as a valid class
- **THEN** the system SHALL persist the character with the "Artificer" class
- **THEN** no normalization warning for the class SHALL be returned

### Requirement: Resilient race matching logic
The system SHALL use a resilient matching strategy for races that handles case sensitivity, leading/trailing whitespace, and fallback to base races via substring matching.

#### Scenario: Case-insensitive race matching
- **WHEN** a character with the race "dwarf" (lowercase) is imported
- **THEN** the system SHALL recognize it as "Dwarf" (canonical case)

#### Scenario: Substring fallback for unknown subraces
- **WHEN** a character with an unknown subrace like "Custom Elf" is imported
- **THEN** the system SHALL fallback to the base race "Elf" if "Elf" is a substring of the input
- **THEN** the system SHALL return a normalization warning indicating the fallback

## ADDED Requirements

### Requirement: Support for additional official races and subraces
The system SHALL recognize and import a broader range of official D&D races and subraces, including "Mountain Dwarf", "Aasimar", "Goliath", and others.

#### Scenario: Mountain Dwarf is imported successfully
- **WHEN** a character with the race "Mountain Dwarf" is imported from DnD Beyond
- **THEN** the system SHALL recognize it as a valid race
- **THEN** the system SHALL persist the character with the race "Mountain Dwarf"
- **THEN** no normalization warning for the race SHALL be returned

#### Scenario: Aasimar is imported successfully
- **WHEN** a character with the race "Aasimar" is imported from DnD Beyond
- **THEN** the system SHALL recognize it as a valid race
- **THEN** the system SHALL persist the character with the race "Aasimar"
- **THEN** no normalization warning for the race SHALL be returned

### Requirement: Support for Artificer and other classes
The system SHALL recognize and import additional official classes, specifically the "Artificer" and "Blood Hunter" classes.

#### Scenario: Artificer class is imported successfully
- **WHEN** a character with the "Artificer" class is imported from DnD Beyond
- **THEN** the system SHALL recognize it as a valid class
- **THEN** the system SHALL persist the character with the "Artificer" class
- **THEN** no normalization warning for the class SHALL be returned

### Requirement: Resilient race matching logic
The system SHALL use a resilient matching strategy for races that handles case sensitivity, leading/trailing whitespace, and fallback to base races via substring matching.

#### Scenario: Case-insensitive race matching
- **WHEN** a character with the race "dwarf" (lowercase) is imported
- **THEN** the system SHALL recognize it as "Dwarf" (canonical case)

#### Scenario: Substring fallback for unknown subraces
- **WHEN** a character with an unknown subrace like "Custom Elf" is imported
- **THEN** the system SHALL fallback to the base race "Elf" if "Elf" is a substring of the input
- **THEN** the system SHALL return a normalization warning indicating the fallback

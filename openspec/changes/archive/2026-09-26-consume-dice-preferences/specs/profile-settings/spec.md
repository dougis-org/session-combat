This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

## MODIFIED Requirements

### Requirement: Dice color and surface preferences

The system SHALL support `color`, `surface`, and `material` settings for the dice preference
domain. `dice.color` is `{ foreground: string; background: string } | null`, where each field
is a short hex string (`#rgb` / `#rrggbb`) and `null` means no custom color is set. `dice.surface`
is `'green-felt' | 'wood-table' | 'wood-tray' | 'metal' | null`, where `null` is the default
surface. `dice.material` is `'glass' | 'none' | 'metal' | 'wood' | null`, where `null` is the
default material. This supersedes the previous `dice.surface: string | null` (unconstrained) and
`dice.color: string | null` (single hex) shapes.

#### Scenario: Save valid color preference

- **Given** a PATCH request to `/api/me/preferences` containing `dice.color` set to
  `{ foreground: "#000000", background: "#ff0000" }` or `null`
- **When** the server processes the request
- **Then** the preference is validated by `schema.ts`, accepted, and saved to the user's profile.

#### Scenario: Invalid dice color object is rejected

- **Given** a PATCH request to `/api/me/preferences` containing `dice.color` as a value that is
  not `null` and either is missing `foreground` or `background`, or has a field that fails the
  hex-color pattern
- **When** the server processes the request
- **Then** `validatePreferencePatch` rejects the entire body with an error and no write occurs;
  no partial repair of just the invalid field is attempted.

#### Scenario: Save valid surface preference

- **Given** a PATCH request to `/api/me/preferences` containing `dice.surface` set to one of
  `green-felt`, `wood-table`, `wood-tray`, `metal`, or `null`
- **When** the server processes the request
- **Then** the preference is validated by `schema.ts`, accepted, and saved to the user's profile.

#### Scenario: Reject unsupported surface value

- **Given** a PATCH request to `/api/me/preferences` containing a `dice.surface` value that is
  not one of the four supported values or `null`
- **When** the server processes the request
- **Then** `validatePreferencePatch` rejects the body and no write occurs.

#### Scenario: Malformed stored dice preference degrades to default

- **Given** a stored preferences document whose `dice.color`, `dice.surface`, or `dice.material`
  value is malformed, of the wrong shape, or (for `surface`/`material`) not in the current enum
- **When** `resolvePreferences` merges the stored document onto defaults
- **Then** the affected key resolves to its default (`null`) rather than throwing, independently
  of any other valid keys in the same document.

#### Scenario: Save valid material preference

- **Given** a PATCH request to `/api/me/preferences` containing `dice.material` set to one of
  `glass`, `none`, `metal`, `wood`, or `null`
- **When** the server processes the request
- **Then** the preference is validated by `schema.ts`, accepted, and saved to the user's profile.

#### Scenario: Reject unsupported material value

- **Given** a PATCH request to `/api/me/preferences` containing a `dice.material` value that is
  not one of the four supported values or `null`
- **When** the server processes the request
- **Then** `validatePreferencePatch` rejects the body and no write occurs.

### Requirement: Edit dice preferences

The system SHALL allow an authenticated user on `/profile` to edit `dice.color` (as a
foreground/background hex pair), `dice.surface`, and `dice.material` (each as a `<select>`
populated from the canonical enum), in addition to the existing "Send rolls to chat" toggle.

#### Scenario: Edit dice appearance preferences

- **Given** an authenticated user is on the `/profile` page
- **When** they change the foreground or background color field, the "Dice Surface" select, or
  the "Dice Material" select
- **Then** the `usePreferences` context updates immediately and syncs with the server.

## Traceability

- Proposal element "dice.color schema change to `{ foreground, background }`" -> Requirement: MODIFIED Dice color and surface preferences
- Proposal element "dice.surface enum tightened to engine values" -> Requirement: MODIFIED Dice color and surface preferences
- Proposal element "new dice.material preference" -> Requirement: MODIFIED Dice color and surface preferences
- Proposal element "rework /profile dice UI" -> Requirement: MODIFIED Edit dice preferences
- Design Decision 1 -> Requirement: MODIFIED Dice color and surface preferences (color scenarios)
- Design Decision 2 -> Requirement: MODIFIED Dice color and surface preferences (surface scenarios)
- Design Decision 3 -> Requirement: MODIFIED Dice color and surface preferences (material scenarios)
- Design Decision 7 -> Requirement: MODIFIED Edit dice preferences
- Requirement "MODIFIED Dice color and surface preferences" -> Tasks: schema/validator tasks
- Requirement "MODIFIED Edit dice preferences" -> Tasks: /profile UI rework tasks

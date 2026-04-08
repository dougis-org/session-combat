## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Strict DnDAlignment typing on entity interfaces

The system SHALL type the `alignment` field on `Character`, `MonsterTemplate`, and `Monster` interfaces as `DnDAlignment | undefined` rather than `string | undefined`.

#### Scenario: TypeScript compilation succeeds after type narrowing

- **Given** `lib/types.ts` has `alignment?: DnDAlignment` on all three interfaces
- **When** `tsc --noEmit` runs against the full project
- **Then** zero new TypeScript errors are reported

#### Scenario: D&D Beyond import assignment is still valid

- **Given** `normalizeAlignment()` already returns `DnDAlignment | undefined`
- **When** `tsc --noEmit` runs
- **Then** the assignment `alignment: normalizeAlignment(...)` in `dndBeyondCharacterImport.ts` compiles without error

## MODIFIED Requirements

### Requirement: MODIFIED Character, MonsterTemplate, Monster alignment field type

The system SHALL represent alignment on entity interfaces as `DnDAlignment` (not `string`), making the type self-documenting and ensuring compile-time safety for any direct assignments.

#### Scenario: Invalid string assignment is caught at compile time

- **Given** `Character.alignment` is typed as `DnDAlignment`
- **When** code attempts to assign an arbitrary string (e.g., `character.alignment = "made up"`)
- **Then** TypeScript reports a type error (validated via `tsc --noEmit`)

## REMOVED Requirements

### Requirement: REMOVED Loose string typing for alignment on entity interfaces

Reason for removal: Using `string` was overly permissive. The stricter `DnDAlignment` type is already available in `lib/types.ts` and used by the D&D Beyond import path. The loose type is superseded by the narrowed type.

## Traceability

- Proposal element "Tighten interface types to DnDAlignment" → Requirement: ADDED Strict DnDAlignment typing
- Design Decision 4 (types first, tsc verify) → Scenario: TypeScript compilation succeeds
- Requirement: ADDED Strict typing → Task: Update lib/types.ts interfaces

## Non-Functional Acceptance Criteria

### Requirement: Type safety (compile-time enforcement)

#### Scenario: CI TypeScript build passes

- **Given** all three interfaces use `DnDAlignment`
- **When** the CI TypeScript build step runs (`tsc --noEmit`)
- **Then** the build exits 0 with no type errors

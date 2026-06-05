## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED groupCombatantsForDisplay utility function

The system SHALL provide an exported pure function `groupCombatantsForDisplay(combatants: CombatantState[]): GroupedCombatants` in `lib/utils/combat.ts` that partitions and groups combatants for display without side effects.

#### Scenario: Alive/dead split on hp boundary

- **Given** a mixed array containing combatants with `hp > 0` and combatants with `hp <= 0`
- **When** `groupCombatantsForDisplay` is called
- **Then** combatants with `hp > 0` appear in `alive.players` or `alive.monsters`; combatants with `hp <= 0` appear in `dead.players` or `dead.monsters`; no combatant appears in both alive and dead

#### Scenario: Grouping by type — player vs monster

- **Given** an array containing both `type: 'player'` and `type: 'monster'` alive combatants
- **When** `groupCombatantsForDisplay` is called
- **Then** `alive.players` contains only players; `alive.monsters` contains only monsters

#### Scenario: Grouping by name within type

- **Given** two alive monsters both named "Goblin"
- **When** `groupCombatantsForDisplay` is called
- **Then** `alive.monsters.get('Goblin')` returns an array of length 2 containing both combatants

#### Scenario: Totals count alive combatants only

- **Given** 2 alive players and 1 dead player, 1 alive monster and 2 dead monsters
- **When** `groupCombatantsForDisplay` is called
- **Then** `totals.players` equals 2; `totals.monsters` equals 1

#### Scenario: Empty input

- **Given** an empty combatants array
- **When** `groupCombatantsForDisplay` is called
- **Then** all four Maps are empty and both totals are 0

#### Scenario: All combatants dead

- **Given** an array where every combatant has `hp <= 0`
- **When** `groupCombatantsForDisplay` is called
- **Then** `alive.players` and `alive.monsters` are empty Maps; `totals.players` and `totals.monsters` are 0; dead Maps are populated correctly

#### Scenario: Lair pseudo-combatants are excluded

- **Given** an array containing one or more combatants with `type: 'lair'`
- **When** `groupCombatantsForDisplay` is called
- **Then** no lair combatant appears in any alive or dead Map; lair combatants do not contribute to totals

## MODIFIED Requirements

### Requirement: MODIFIED CombatInfoIcon data transformation

The system SHALL compute grouping data by calling `groupCombatantsForDisplay` rather than performing inline filtering and Map construction inside the component body.

#### Scenario: Render output after refactor

- **Given** `CombatInfoIcon` receives a combatants array (without lair entries)
- **When** the user hovers the info icon
- **Then** the tooltip renders identically to the pre-refactor behavior — same combatant names, same ×N multipliers, same DEFEATED sections, same header counts

#### Scenario: Lair entries excluded from tooltip

- **Given** `CombatInfoIcon` receives a combatants array that includes lair pseudo-combatants
- **When** the user hovers the info icon
- **Then** lair combatants do not appear in any section of the tooltip

## REMOVED Requirements

No requirements removed. The inline grouping logic is moved, not deleted. One latent bug was fixed during extraction: lair pseudo-combatants (`type: 'lair'`) previously appeared in the dead-monster bucket; they are now correctly excluded.

## Traceability

- Proposal: "Extract filtering + grouping from `CombatInfoIcon`" → Requirement: ADDED groupCombatantsForDisplay
- Proposal: "Update `CombatInfoIcon` to call the utility" → Requirement: MODIFIED CombatInfoIcon data transformation
- Design Decision 1 (placement in `combat.ts`) → ADDED groupCombatantsForDisplay
- Design Decision 2 (nested return shape) → ADDED groupCombatantsForDisplay — return type
- Design Decision 3 (`totals` = alive only) → ADDED groupCombatantsForDisplay — totals scenario
- ADDED groupCombatantsForDisplay → Task: Add `GroupedCombatants` type and `groupCombatantsForDisplay` to `combat.ts`
- MODIFIED CombatInfoIcon → Task: Refactor `CombatInfoIcon` to call utility

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Existing test suite remains green

- **Given** the refactor is applied to `lib/utils/combat.ts` and `lib/components/CombatInfoIcon.tsx`
- **When** `npm run test:unit -- --testPathPattern CombatInfoIcon` is run
- **Then** all tests pass with no failures or skips

### Requirement: Operability

#### Scenario: TypeScript compilation succeeds

- **Given** `groupCombatantsForDisplay` and `GroupedCombatants` are added to `combat.ts` and imported in `CombatInfoIcon.tsx`
- **When** `tsc --noEmit` is run
- **Then** zero type errors are reported

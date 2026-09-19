# open5e-api-shape-verification Specification

## Purpose
Defines the manual, on-demand check that verifies the live Open5E API still satisfies the `Open5ECreature`/`Open5ESpell` shape the codebase's import tooling depends on, replacing the dead, always-skipped Jest integration test that previously served this purpose.

## Requirements

### Requirement: ADDED Manual Open5E API shape verification script

The system SHALL provide a standalone, manually-invoked script at `lib/scripts/checkOpen5eApiShape.ts` that fetches one page of creatures and one page of spells from the live Open5E API through `Open5EClient` (from `lib/import/open5eAdapter.ts`) and reports whether the response data satisfies the `Open5ECreature`/`Open5ESpell` shape the rest of the codebase depends on.

#### Scenario: Script fetches live data through the shared client

- **Given** the script `lib/scripts/checkOpen5eApiShape.ts` exists
- **When** it is run (e.g. via `npm run check:open5e-api-shape`)
- **Then** it constructs an `Open5EClient` and calls `fetchMonsters(1)` and `fetchSpells(1)` on it, performing no raw `fetch()` calls of its own

#### Scenario: Script reports success when the live API matches the expected shape

- **Given** the Open5E API is reachable and returns creature/spell data matching the `Open5ECreature`/`Open5ESpell` types (e.g., `key` present, `armor_class`/`hit_points`/`desc` present as documented)
- **When** the script is run
- **Then** it exits with status code 0 and prints a message confirming the shape checks passed for both creatures and spells

#### Scenario: Script fails loudly on an unreachable or erroring API

- **Given** the Open5E API is unreachable, rate-limited, or returns a non-OK HTTP status
- **When** the script is run
- **Then** it exits with a non-zero status code and prints an error message that includes the failing endpoint and HTTP status (propagated from `Open5EClient`'s existing `fetchPage` error), without retrying

#### Scenario: Script fails loudly when the live shape no longer matches expectations

- **Given** the Open5E API returns data missing an expected field (e.g., no `key`, or `actions`/`traits` not present as arrays) or with an unexpected type (e.g., `concentration` not a boolean)
- **When** the script is run
- **Then** it exits with a non-zero status code and reports which field/assertion failed

### Requirement: ADDED `npm run` entry for the manual shape-check script

The system SHALL expose the manual Open5E API shape-check script through a documented `npm run` command in `package.json`, following the same `npx tsx lib/scripts/<name>.ts` pattern used by other adhoc scripts in `lib/scripts/`.

#### Scenario: Script is runnable via npm

- **Given** `package.json` `scripts` includes a `check:open5e-api-shape` entry
- **When** a developer runs `npm run check:open5e-api-shape`
- **Then** `lib/scripts/checkOpen5eApiShape.ts` executes via `tsx` without requiring any manual `npx tsx <path>` invocation

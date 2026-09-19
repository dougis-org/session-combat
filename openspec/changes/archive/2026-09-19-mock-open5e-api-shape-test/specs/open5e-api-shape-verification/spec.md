## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

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

## REMOVED Requirements

### Requirement: REMOVED Live-network Open5E API shape/connectivity Jest tests

Reason for removal: `tests/integration/api/open5eApiShape.test.ts` performed live network calls to `https://api.open5e.com` using a bespoke local `fetchWithRetry` helper instead of the shared `Open5EClient`. The entire file was already wrapped in `describe.skip` (PR #533) due to CI flakiness, meaning it contributed no active verification while still living inside `tests/integration/`, a path matched by `jest.integration.config.js`'s `testMatch`. Its intent (documenting/verifying the live Open5E API response shape) is replaced by the manual script added above (ADDED Requirement: Manual Open5E API shape verification script), which is not discovered or run by any Jest config.

## Traceability

- Proposal element: "Remove `tests/integration/api/open5eApiShape.test.ts` from the Jest test tree" -> Requirement: REMOVED Live-network Open5E API shape/connectivity Jest tests
- Proposal element: "Create a manual/adhoc script ... using `Open5EClient`" -> Requirement: ADDED Manual Open5E API shape verification script
- Proposal element: "Add an `npm run` script ... to execute it on demand" -> Requirement: ADDED `npm run` entry for the manual shape-check script
- Design decision: Decision 1 (delete outright) -> Requirement: REMOVED Live-network Open5E API shape/connectivity Jest tests
- Design decision: Decision 2 (`lib/scripts/checkOpen5eApiShape.ts` + `npx tsx` + `npm run`) -> Requirement: ADDED `npm run` entry for the manual shape-check script
- Design decision: Decision 3 (use `Open5EClient` directly) -> Requirement: ADDED Manual Open5E API shape verification script, Scenario: "Script fetches live data through the shared client"
- Design decision: Decision 4 (no retry, fail fast) -> Requirement: ADDED Manual Open5E API shape verification script, Scenario: "Script fails loudly on an unreachable or erroring API"
- Design decision: Decision 5 (assert against adapter-parsed types) -> Requirement: ADDED Manual Open5E API shape verification script, Scenarios: "Script reports success..." and "Script fails loudly when the live shape no longer matches expectations"
- Requirement: ADDED Manual Open5E API shape verification script -> Task(s): implement `lib/scripts/checkOpen5eApiShape.ts` (see tasks.md)
- Requirement: ADDED `npm run` entry for the manual shape-check script -> Task(s): add `check:open5e-api-shape` to `package.json` (see tasks.md)
- Requirement: REMOVED Live-network Open5E API shape/connectivity Jest tests -> Task(s): delete `tests/integration/api/open5eApiShape.test.ts` (see tasks.md)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** a transient network failure occurs during a manual run
- **When** the script exits non-zero with the propagated error
- **Then** a developer can simply re-run `npm run check:open5e-api-shape`; no automatic retry is performed (see functional scenario: "Script fails loudly on an unreachable or erroring API" — this is the same failure path, called out here only to confirm no hidden retry/backoff exists)

### Requirement: Operability

#### Scenario: No CI or scheduled dependency on script success

- **Given** the script exists at `lib/scripts/checkOpen5eApiShape.ts` and is not matched by any Jest `testMatch` pattern
- **When** `npm run test:unit`, `npm run test:integration`, or `npm run test:ci` are executed
- **Then** none of them invoke or depend on the script's outcome, so a live Open5E API outage never fails CI

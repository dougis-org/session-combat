## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Client hook mirrors server-side roll-submission validation

The system SHALL validate the outgoing roll payload in `useRollSubmission`'s `submitRoll` against the shared `rollSubmissionSchema` (from `lib/validation/rollSubmission.ts`) before issuing any network request, and SHALL return `'error'` with no `fetch` call when the payload fails that validation.

#### Scenario: Oversized formula is rejected locally

- **Given** a caller of `submitRoll` with a `formula` string longer than `MAX_FORMULA_LENGTH`
- **When** `submitRoll` is invoked
- **Then** it resolves to `'error'` and `fetch` is not called

#### Scenario: Oversized rolls array is rejected locally

- **Given** a caller of `submitRoll` with a `rolls` array longer than `MAX_DICE_IN_ROLL`
- **When** `submitRoll` is invoked
- **Then** it resolves to `'error'` and `fetch` is not called

#### Scenario: Out-of-range die value is rejected locally

- **Given** a caller of `submitRoll` whose `rolls` array contains a value below `1` or above `MAX_DIE_VALUE`
- **When** `submitRoll` is invoked
- **Then** it resolves to `'error'` and `fetch` is not called

#### Scenario: Out-of-range total is rejected locally

- **Given** a caller of `submitRoll` whose `total` has an absolute value greater than `MAX_TOTAL_MAGNITUDE`
- **When** `submitRoll` is invoked
- **Then** it resolves to `'error'` and `fetch` is not called

#### Scenario: A well-formed pool roll is still submitted

- **Given** a caller of `submitRoll` with a payload shaped like `useDicePoolState.buildRoll()`'s output, including the maximum legitimate pool (`MAX_PER_DIE * DIE_SIDES.length` dice plus `MAX_MODIFIER`)
- **When** `submitRoll` is invoked
- **Then** local validation passes and `fetch` is called with the unmodified payload, preserving the existing `'success' | 'conflict' | 'error'` status mapping

#### Scenario: A well-formed percentile (d%) roll is still submitted

- **Given** a caller of `submitRoll` with a payload shaped like `useDicePoolState.buildPercentileRoll()`'s output (`formula` `"d%"`, a single `rolls` entry between 1 and 100)
- **When** `submitRoll` is invoked
- **Then** local validation passes and `fetch` is called with the unmodified payload

## MODIFIED Requirements

_None. This change adds a client-side requirement to an existing capability without altering a previously-recorded requirement._

## REMOVED Requirements

_None._

## Traceability

- Proposal element "`submitRoll` runs the shared schema's `safeParse` ... before `fetch`" -> Requirement: Client hook mirrors server-side roll-submission validation
- Proposal element "On parse failure: return `'error'`, do not call `fetch`" -> Requirement: Client hook mirrors server-side roll-submission validation (all rejection scenarios)
- Proposal element "valid pool roll and `d%` percentile roll → still submitted" -> Requirement: Client hook mirrors server-side roll-submission validation (both happy-path scenarios)
- Design Decision 1 (validate with `safeParse`) -> Requirement: Client hook mirrors server-side roll-submission validation
- Design Decision 2 (no `label` field in the parsed input) -> Requirement: Client hook mirrors server-side roll-submission validation (implicit: `label` is absent from all scenario payloads and does not cause rejection, since it is `.optional()`)
- Design Decision 3 (gate placed before the existing `try`/`fetch` block) -> Requirement: Client hook mirrors server-side roll-submission validation (all "fetch is not called" scenarios)
- Requirement: Client hook mirrors server-side roll-submission validation -> Tasks: "Wire safeParse into submitRoll", "Client rejection unit tests", "Client boundary happy-path unit tests"

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Local rejection avoids a network round trip

- **Given** a payload that fails `rollSubmissionSchema.safeParse`
- **When** `submitRoll` is invoked
- **Then** no `fetch` call is made, so no network latency or server processing is incurred for that submission attempt

### Requirement: Security

See functional scenarios: "Oversized formula is rejected locally", "Oversized rolls array is rejected locally", "Out-of-range die value is rejected locally", and "Out-of-range total is rejected locally". These provide a client-side defense-in-depth mirror of the server-side trust boundary already specified for `POST /api/campaigns/[id]/rolls` (see the "Rolls API rejects out-of-bounds roll payloads" requirement in this same capability document). The server route remains the authoritative enforcement point; no additional distinct security scenario is required here.

### Requirement: Reliability

#### Scenario: `safeParse` never throws

- **Given** any input to `submitRoll`, valid or invalid
- **When** the local validation gate runs
- **Then** it never throws synchronously (using `safeParse`, not `parse`), so `submitRoll`'s returned promise always resolves to one of `'success' | 'conflict' | 'error'` and never rejects due to validation

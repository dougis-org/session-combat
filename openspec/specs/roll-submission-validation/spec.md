## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-09-13-bound-rolls-api-validation/design.md) document, not a replacement.

### Requirement: Shared roll-submission validator with dice-derived bounds

The system SHALL provide a single shared validator module (`lib/validation/rollSubmission.ts`) that defines a well-formed roll-submission payload and exports the named bounds constants `MAX_FORMULA_LENGTH`, `MAX_DICE_IN_ROLL`, `MAX_DIE_VALUE`, `MAX_TOTAL_MAGNITUDE`, and `MAX_LABEL_LENGTH`. Each bound SHALL be greater than or equal to the corresponding maximum legitimate value computed from `lib/utils/dice.ts`, and `MAX_LABEL_LENGTH` SHALL equal 128. The module SHALL import only `zod` and `lib/utils/dice.ts` (no `next/*`, no storage) so it can also run in the browser.

#### Scenario: Bounds are derived from dice constants

- **Given** the constants `MAX_PER_DIE`, `DIE_SIDES`, `SUPPORTED_SIDES`, and `MAX_MODIFIER` in `lib/utils/dice.ts`
- **When** the exported bounds in `lib/validation/rollSubmission.ts` are compared against the computed legitimate maxima (`MAX_DICE_IN_ROLL` ≥ `MAX_PER_DIE * DIE_SIDES.length`; `MAX_DIE_VALUE` ≥ `max(SUPPORTED_SIDES)`; `MAX_TOTAL_MAGNITUDE` ≥ `MAX_DICE_IN_ROLL * MAX_DIE_VALUE + MAX_MODIFIER`)
- **Then** every exported bound is greater than or equal to its computed legitimate maximum, and `MAX_LABEL_LENGTH` equals 128

#### Scenario: Validator module is browser-safe

- **Given** the source of `lib/validation/rollSubmission.ts`
- **When** its import statements are inspected
- **Then** it imports only from `zod` and `@/lib/utils/dice` and from no `next/*` or storage module

### Requirement: Rolls API rejects out-of-bounds roll payloads

The system SHALL validate the parsed request body of `POST /api/campaigns/[id]/rolls` with the shared roll-submission schema before persisting or broadcasting, and SHALL respond `400` with a concise error and perform no `storage.saveCampaignRoll` and no `emitFiltered` when the payload violates any bound or shape rule.

#### Scenario: Oversized formula is rejected

- **Given** an authenticated active campaign member during an active session
- **When** they `POST` a roll whose `formula` string length exceeds `MAX_FORMULA_LENGTH`
- **Then** the response status is `400`, `storage.saveCampaignRoll` is not called, and `emitFiltered` is not called

#### Scenario: Oversized rolls array is rejected

- **Given** an authenticated active campaign member during an active session
- **When** they `POST` a roll whose `rolls` array length exceeds `MAX_DICE_IN_ROLL`
- **Then** the response status is `400` with no persistence and no broadcast

#### Scenario: Out-of-range die value is rejected

- **Given** an authenticated active campaign member during an active session
- **When** they `POST` a roll whose `rolls` contains a non-integer, a value below 1, or a value above `MAX_DIE_VALUE`
- **Then** the response status is `400` with no persistence and no broadcast

#### Scenario: Out-of-range total is rejected

- **Given** an authenticated active campaign member during an active session
- **When** they `POST` a roll whose `total` is non-finite or whose absolute value exceeds `MAX_TOTAL_MAGNITUDE`
- **Then** the response status is `400` with no persistence and no broadcast

#### Scenario: Oversized label is rejected

- **Given** an authenticated active campaign member during an active session
- **When** they `POST` a roll whose `label` string length exceeds `MAX_LABEL_LENGTH` (128)
- **Then** the response status is `400` with no persistence and no broadcast

#### Scenario: Invalid visibility scope is rejected

- **Given** an authenticated active campaign member during an active session
- **When** they `POST` a roll whose `visibility.scope` is absent or is a value other than `group` or `dm-only`
- **Then** the response status is `400` with no persistence and no broadcast

#### Scenario: Schema error body does not leak internal detail

- **Given** any payload that fails schema validation
- **When** the `400` response body is inspected
- **Then** it contains a single concise `error` string and does not include a raw `zod` issue dump

### Requirement: Rolls API caps the request body size

The system SHALL read the `POST /api/campaigns/[id]/rolls` request body under a fixed byte cap (`ROLL_BODY_MAX_BYTES`, default 16 KiB), aborting the read once the cap is exceeded rather than buffering the whole body, and SHALL respond `413` with no `storage.saveCampaignRoll` and no `emitFiltered` when the body exceeds the cap. A request declaring a `Content-Length` above the cap SHALL be rejected `413` without reading the stream.

#### Scenario: Body over the cap is rejected with 413

- **Given** an authenticated active campaign member
- **When** they `POST` a request body larger than `ROLL_BODY_MAX_BYTES`
- **Then** the response status is `413`, the body stream read is aborted before completion, `storage.saveCampaignRoll` is not called, and `emitFiltered` is not called

#### Scenario: Oversized Content-Length is rejected without reading the body

- **Given** an authenticated active campaign member
- **When** they `POST` a request whose `Content-Length` header exceeds `ROLL_BODY_MAX_BYTES`
- **Then** the response status is `413` and the request body stream is not read

#### Scenario: Body at or under the cap proceeds to schema validation

- **Given** an authenticated active campaign member
- **When** they `POST` a well-formed roll whose serialized body is at or below `ROLL_BODY_MAX_BYTES`
- **Then** the request is not rejected for size and proceeds to schema validation

### Requirement: Rolls API accepts well-formed rolls unchanged

The system SHALL accept every roll submission that is valid under today's rules and within the derived bounds, persisting and broadcasting it and returning `201` with the stored roll, without parsing the `formula` string or recomputing `total`.

#### Scenario: Normal pool roll still succeeds

- **Given** an authenticated active campaign member during an active session
- **When** they `POST` a standard dice-pool roll (e.g. `formula` `"3d6 + 2"`, `rolls` `[4,2,5]`, `total` `13`, `visibility.scope` `"group"`)
- **Then** the response status is `201`, the stored `CampaignRoll` is returned, `storage.saveCampaignRoll` is called once, and `emitFiltered` is called once

#### Scenario: Percentile (d%) roll still succeeds

- **Given** an authenticated active campaign member during an active session
- **When** they `POST` a percentile roll with `formula` equal to `PERCENTILE_FORMULA` (`"d%"`), a single `rolls` entry between 1 and 100, and a matching `total`
- **Then** the response status is `201` with persistence and broadcast

#### Scenario: Maximum legitimate pool still succeeds

- **Given** an authenticated active campaign member during an active session
- **When** they `POST` a roll with `MAX_PER_DIE * DIE_SIDES.length` (120) dice entries plus a `MAX_MODIFIER` (999) modifier
- **Then** the response status is `201`

#### Scenario: Total is not recomputed or cross-checked

- **Given** an authenticated active campaign member during an active session
- **When** they `POST` an otherwise in-bounds roll whose `total` does not equal the sum of `rolls` plus any modifier
- **Then** the response status is `201` and the submitted `total` is stored verbatim

#### Scenario: Empty rolls array remains acceptable

- **Given** an authenticated active campaign member during an active session
- **When** they `POST` an otherwise valid roll whose `rolls` array is empty
- **Then** the response status is `201` (behavior unchanged from before this change)

### Requirement: Rolls API preserves existing auth and session errors

The system SHALL preserve the pre-existing error behavior of `POST /api/campaigns/[id]/rolls`: malformed JSON and non-object bodies return `400`, a non-active or non-member caller returns `403`, and a campaign with no active session returns `409`.

#### Scenario: Malformed JSON still returns 400

- **Given** an authenticated caller
- **When** they `POST` a body that is not valid JSON
- **Then** the response status is `400` with an `Invalid JSON` error and no persistence or broadcast

#### Scenario: Non-object body still returns 400

- **Given** an authenticated caller
- **When** they `POST` a JSON array or primitive as the body
- **Then** the response status is `400` and no persistence or broadcast occurs

#### Scenario: Non-member caller still returns 403

- **Given** an authenticated user who is not an active member of the campaign
- **When** they `POST` an in-bounds well-formed roll
- **Then** the response status is `403` and no persistence or broadcast occurs

#### Scenario: No active session still returns 409

- **Given** an authenticated active member whose campaign has no `activeSessionId`
- **When** they `POST` an in-bounds well-formed roll
- **Then** the response status is `409` and no persistence or broadcast occurs

## MODIFIED Requirements

_None. This change adds a new capability and does not modify a previously-recorded requirement._

## REMOVED Requirements

_None._

## Traceability

- Proposal element "shared bounded roll-payload validator" -> Requirement: Shared roll-submission validator with dice-derived bounds
- Proposal element "enforce it in the route before saveCampaignRoll, returning 400" -> Requirement: Rolls API rejects out-of-bounds roll payloads
- Proposal element "add a request-body size cap, returning 413" -> Requirement: Rolls API caps the request body size
- Proposal element "confirm a normal pool roll and a d% percentile roll still succeed" -> Requirement: Rolls API accepts well-formed rolls unchanged
- Proposal element "validate only, do not parse formula or recompute total" -> Requirement: Rolls API accepts well-formed rolls unchanged (scenario: Total is not recomputed or cross-checked)
- Proposal element "include label, max 128" -> Requirement: Rolls API rejects out-of-bounds roll payloads (scenario: Oversized label is rejected); Requirement: Shared roll-submission validator (MAX_LABEL_LENGTH = 128)
- Design Decision 1 & 2 -> Requirement: Shared roll-submission validator with dice-derived bounds
- Design Decision 3 -> Requirement: Rolls API caps the request body size
- Design Decision 4 -> Requirement: Rolls API rejects out-of-bounds roll payloads; Requirement: Rolls API preserves existing auth and session errors
- Design Decision 5 -> this capability document
- Requirement: Shared roll-submission validator -> Tasks: "Create lib/validation/rollSubmission.ts", "Schema unit tests"
- Requirement: Rolls API rejects out-of-bounds roll payloads -> Tasks: "Wire safeParse into the route", "Route rejection tests"
- Requirement: Rolls API caps the request body size -> Tasks: "Add lib/server/readBoundedJson.ts", "Wire bounded read into the route", "Body-size tests"
- Requirement: Rolls API accepts well-formed rolls unchanged -> Tasks: "Route happy-path tests"
- Requirement: Rolls API preserves existing auth and session errors -> Tasks: "Retain/adjust existing route tests"

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Oversized body is not fully buffered

- **Given** a `POST /api/campaigns/[id]/rolls` request with a body far larger than `ROLL_BODY_MAX_BYTES`
- **When** the route reads the body
- **Then** the stream reader is cancelled once cumulative bytes exceed `ROLL_BODY_MAX_BYTES`, so peak memory for the body is bounded by the cap regardless of the sender's payload size

### Requirement: Security

See functional scenarios: "Oversized formula is rejected", "Oversized rolls array is rejected", "Out-of-range die value is rejected", "Out-of-range total is rejected", "Oversized label is rejected", "Body over the cap is rejected with 413", and "Schema error body does not leak internal detail". Together these enforce the server-side trust boundary required by project decision n050 for any dice-submission path, and confirm the `400` body does not leak validator internals. No additional distinct security scenario is required.

### Requirement: Reliability

#### Scenario: Validation failure leaves no partial state

- **Given** any payload that fails the body-size cap or schema validation
- **When** the request is rejected
- **Then** no `CampaignRoll` is written to storage and no `roll` event is emitted, so a retried valid submission behaves identically to a first-attempt valid submission

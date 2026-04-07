## Context

- Relevant architecture: Next.js app with a React `CharacterEditor` component in `app/characters/page.tsx`, API routes at `app/api/characters/route.ts` (POST) and `app/api/characters/[id]/route.ts` (PUT), shared types in `lib/types.ts`, and E2E helpers in `tests/e2e/helpers/actions.ts`.
- Dependencies: MongoDB for character persistence. `lib/types.ts` `Character` interface is the shared contract between UI and API.
- Interfaces/contracts touched: `Character` type, `CharacterEditor` component props/state, POST and PUT character API request bodies, `createCharacter()` E2E helper signature.

## Goals / Non-Goals

### Goals

- Add `gender?: string` to the `Character` type
- Free-text input in `CharacterEditor` with correct `aria-label`
- Gender persisted through create and edit API flows
- Gender displayed prepended to race everywhere race is shown
- API validation: optional, max 50 chars
- E2E test coverage for field presence, persistence, and display

### Non-Goals

- Predefined gender options or hybrid dropdown
- Gender on party, encounter, or any view beyond character list card
- Filtering or sorting by gender

## Decisions

### Decision 1: Free-text input, no enum

- Chosen: `gender?: string` with a plain `<input type="text">` in the form
- Alternatives considered: Closed dropdown (Male/Female/Non-binary/Other), hybrid select-with-custom
- Rationale: Inclusive, future-proof, consistent with how `alignment` is handled (free string, no enum constraint)
- Trade-offs: No validation of gender vocabulary; API only enforces max length. Acceptable — the field is purely descriptive.

### Decision 2: Display as `[gender] [race]` joined with a space

- Chosen: `[gender, race].filter(Boolean).join(' ')` prepended with ` - ` separator on the card subtitle
- Alternatives considered: Separate lines; gender in parentheses; show only in editor
- Rationale: Minimal change to existing card layout. Handles all four combinations (both/gender-only/race-only/neither) with one expression.
- Trade-offs: Long gender values can overflow card width — accepted per user decision; API max 50 chars limits worst case.

### Decision 3: Extend `createCharacter()` with optional `gender`

- Chosen: Add `gender?: string` to the helper's input type; add conditional `fill` call only when provided
- Alternatives considered: New helper; overloaded helper
- Rationale: Existing callers pass no `gender` and continue to work unchanged. Simplest backward-compatible extension.
- Trade-offs: Helper type stays loosely typed (`race` and `alignment` already exist without strict enforcement in some callers).

### Decision 4: API validation via inline length check (no new validator function)

- Chosen: Inline `if (gender && gender.length > 50)` check in POST and PUT routes
- Alternatives considered: Add `isValidGender()` to `lib/types.ts` matching the `isValidRace`/`isValidAlignment` pattern
- Rationale: Length-only validation doesn't warrant a named validator. Race validation is complex (enum membership); gender is a simple length bound.
- Trade-offs: Less discoverable than a named validator, but avoids over-engineering a trivial check.

## Proposal to Design Mapping

- Proposal element: `gender?: string` on `Character` type
  - Design decision: Decision 1 (free-text, no enum)
  - Validation approach: TypeScript compile-time; unit test via API route tests

- Proposal element: Free-text input in `CharacterEditor`
  - Design decision: Decision 1
  - Validation approach: E2E — `getByLabel("Character gender")` present in form

- Proposal element: Display prepended to race on card
  - Design decision: Decision 2
  - Validation approach: E2E — gender value visible in card after save

- Proposal element: API max 50 chars validation
  - Design decision: Decision 4
  - Validation approach: API-level; E2E with a >50-char value is out of scope (unit/integration test preferred)

- Proposal element: `createCharacter()` helper extension
  - Design decision: Decision 3
  - Validation approach: Existing E2E callers pass; new gender test uses extended helper

## Functional Requirements Mapping

- Requirement: Gender field present in `Character` type as optional string
  - Design element: `lib/types.ts` — `gender?: string`
  - Acceptance criteria reference: specs/character-gender/spec.md — type definition
  - Testability notes: TypeScript compiler enforces; no runtime test needed

- Requirement: Gender input in `CharacterEditor`
  - Design element: `<input type="text" aria-label="Character gender">` in form
  - Acceptance criteria reference: specs/character-gender/spec.md — form field
  - Testability notes: E2E `getByLabel("Character gender")` selector

- Requirement: Gender persists through create flow
  - Design element: POST route destructures and stores `gender`
  - Acceptance criteria reference: specs/character-gender/spec.md — create persistence
  - Testability notes: E2E — create character with gender, verify card shows value

- Requirement: Gender persists through edit flow
  - Design element: PUT route handles `gender` update
  - Acceptance criteria reference: specs/character-gender/spec.md — edit persistence
  - Testability notes: E2E — edit character, change gender, verify updated value

- Requirement: Gender displayed prepended to race on character card
  - Design element: Card subtitle join expression (Decision 2)
  - Acceptance criteria reference: specs/character-gender/spec.md — display
  - Testability notes: E2E — assert card text contains gender value

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Optional field must not break existing characters or API callers
  - Design element: `gender?: string` (optional); all existing code paths unaffected
  - Acceptance criteria reference: Existing E2E suite must continue to pass
  - Testability notes: Run full E2E suite after change; no existing test should reference gender

- Requirement category: security
  - Requirement: Input length bounded to prevent abuse
  - Design element: API max 50 char validation in POST and PUT routes
  - Acceptance criteria reference: specs/character-gender/spec.md — validation
  - Testability notes: Integration/unit test for >50-char rejection

- Requirement category: accessibility
  - Requirement: Gender input is keyboard and screen-reader accessible
  - Design element: `aria-label="Character gender"` on input
  - Acceptance criteria reference: specs/character-gender/spec.md — accessibility
  - Testability notes: E2E uses `getByLabel` selector which validates aria-label presence

## Risks / Trade-offs

- Risk/trade-off: Card overflow for long gender values
  - Impact: Low — cosmetic only; API caps at 50 chars
  - Mitigation: API validation limits worst case; accepted by user

- Risk/trade-off: `createCharacter()` helper callers that pass `alignment` already have a mismatch (helper ignores alignment). Adding gender follows the same pattern.
  - Impact: Low — no regression, just pre-existing inconsistency
  - Mitigation: Out of scope for this change; noted for awareness

## Rollback / Mitigation

- Rollback trigger: E2E suite failures, or gender field causing data corruption in production characters
- Rollback steps: Revert commits to `lib/types.ts`, `app/characters/page.tsx`, and both API routes. Gender field is additive and optional — existing records unaffected by rollback.
- Data migration considerations: None. Field is optional; removing it from the type does not corrupt existing records that stored a gender value (MongoDB is schemaless).
- Verification after rollback: Run full E2E suite; confirm character create/edit/display works without gender.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing tests or type errors before proceeding.
- If security checks fail: Do not merge. Review input validation on POST/PUT routes.
- If required reviews are blocked/stale: Ping reviewer after 24h; escalate to repo owner after 48h.
- Escalation path and timeout: If blocked >48h with no response, raise in project channel and reassign review.

## Open Questions

No open questions. All design decisions were resolved during explore session prior to proposal creation.

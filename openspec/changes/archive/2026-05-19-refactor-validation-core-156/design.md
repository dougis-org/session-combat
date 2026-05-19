## Context

- Relevant architecture: `lib/validation/` contains hand-rolled validation utilities. `monsterUpload.ts` is currently the only consumer of the generic helpers. `lib/validation/password.ts` is unrelated and untouched.
- Dependencies: `lib/types` (for `AbilityScores`), `lib/validation/core.ts` → `lib/validation/dnd.ts` → `lib/validation/monsterUpload.ts` (import chain)
- Interfaces/contracts touched: `validateMonsterData`, `validateMonsterUploadDocument`, `transformMonsterData` public signatures are unchanged. `ValidationError` and `ValidationResult` types move to `core.ts` but are re-exported from `monsterUpload.ts` for backward compatibility.

## Goals / Non-Goals

### Goals

- Centralise generic validators in `lib/validation/core.ts` so any future feature can import without touching monster code
- Centralise D&D-domain validators in `lib/validation/dnd.ts` for reuse across character, NPC, and spell flows
- Fix the `validateString` trim bug without changing any other behaviour
- Delete dead code (`validateStringNumberRecord`)
- Achieve full unit-test coverage of the extracted validators

### Non-Goals

- Replacing hand-rolled validators with a schema library (zod, yup, etc.)
- Migrating existing character/spell import code
- Changing any public API in `monsterUpload.ts`

## Decisions

### Decision 1: Three-tier file structure

- Chosen: `core.ts` (generic) → `dnd.ts` (D&D domain) → `monsterUpload.ts` (feature-specific)
- Alternatives considered: Single `field-validators.ts` alongside `monsterUpload.ts`; two tiers with no D&D layer
- Rationale: The generic helpers have zero D&D knowledge and should be independently importable. The D&D-domain helpers (`validateAbilityScores`, `validateAbility`, `validateAbilityArray`) encode D&D rules and will be needed by character/NPC/spell flows — keeping them separate from a monster-specific file avoids coupling.
- Trade-offs: One extra file; callers must know which layer to import from. Mitigated by clear naming convention.

### Decision 2: Re-export `ValidationError` and `ValidationResult` from `monsterUpload.ts`

- Chosen: Types move to `core.ts`; `monsterUpload.ts` re-exports them (`export type { ValidationError, ValidationResult } from './core'`)
- Alternatives considered: Leave types in `monsterUpload.ts` and import them into `core.ts` (inverted dependency — wrong direction); duplicate type definitions
- Rationale: Types belong with the validators that produce them. Re-export preserves any existing consumer that imports from `monsterUpload.ts`.
- Trade-offs: Re-export adds a minor indirection; TypeScript handles this transparently.

### Decision 3: `validateString` trim fix scope

- Chosen: Trim leading/trailing whitespace from the value before the `minLength` check only. Do not mutate the returned value — return the trimmed string as `value`.
- Alternatives considered: Trim only for length check but return original; add a separate `trimmed` option flag
- Rationale: Returning the trimmed value is consistent — callers downstream (e.g. `transformMonsterData` already calls `.trim()` on `name`) get a clean value. A flag adds complexity with no benefit given current usage.
- Trade-offs: Behaviour change: `validateString(" a ", { minLength: 2 })` now returns `valid: true, value: "a"` where before it returned `valid: true, value: " a "`. Confirmed acceptable — no existing test asserts whitespace-padded pass-through.

### Decision 4: Inline checks that stay in `validateMonsterData`

- Chosen: Keep cross-field (`hp ≤ maxHp`), enum (`size` vs `VALID_SIZES`), and integer (`legendaryActionCount`) checks inline
- Alternatives considered: Add `validateEnum`, `validateInteger` helpers to `core.ts`
- Rationale: These are narrow, one-off constraints not yet needed elsewhere. Adding helpers for them now is premature abstraction. They can be promoted later when a second consumer appears.
- Trade-offs: `validateMonsterData` retains a small number of inline checks; cognitive complexity reduction is partial but still significant (10 helper calls replace ~100 lines of inline logic).

### Decision 5: `validateStringNumberRecord` deletion

- Chosen: Delete — it is defined but never called anywhere in the codebase
- Alternatives considered: Move it to `core.ts` anyway for completeness
- Rationale: Dead code has no value and creates maintenance burden. If needed later it can be added from scratch or recovered from git history.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Create `lib/validation/core.ts`
  - Design decision: Decision 1 (three-tier structure), Decision 2 (type re-export)
  - Validation approach: `tests/unit/validation/core.test.ts` covers each exported validator

- Proposal element: Create `lib/validation/dnd.ts`
  - Design decision: Decision 1
  - Validation approach: `tests/unit/validation/dnd.test.ts` covers each exported validator

- Proposal element: Fix `validateString` trim behaviour
  - Design decision: Decision 3
  - Validation approach: Test in `core.test.ts`: whitespace-only string with `minLength: 1` → invalid; padded string with `minLength: 1` → valid, returned value is trimmed

- Proposal element: Delete `validateStringNumberRecord`
  - Design decision: Decision 5
  - Validation approach: TypeScript compile passes; grep confirms no remaining references

- Proposal element: Refactor `validateMonsterData` inline scalar checks
  - Design decision: Decision 4
  - Validation approach: All existing `tests/unit/monster-upload/` tests pass without modification

## Functional Requirements Mapping

- Requirement: `core.ts` exports `validateString`, `validateNumber`, `validateStringArray`, `validateRecord`, `validateStringRecord`, `validateNumberRecord`, `ValidationError`, `ValidationResult`
  - Design element: Decision 1, Decision 2
  - Acceptance criteria reference: specs/core-validators/spec.md
  - Testability notes: Import each export in `core.test.ts`; verify type signatures compile

- Requirement: `validateString` trims leading/trailing whitespace before `minLength` check and returns trimmed value
  - Design element: Decision 3
  - Acceptance criteria reference: specs/core-validators/spec.md
  - Testability notes: Parametric tests: `"  ab  "` with `minLength: 2` → `{ valid: true, value: "ab" }`; `"  "` with `minLength: 1` → `{ valid: false }`

- Requirement: `dnd.ts` exports `validateAbilityScores`, `validateAbility`, `validateAbilityArray`
  - Design element: Decision 1
  - Acceptance criteria reference: specs/dnd-validators/spec.md
  - Testability notes: Import each export in `dnd.test.ts`; test valid and invalid inputs for each

- Requirement: All existing `tests/unit/monster-upload/` tests pass unchanged
  - Design element: Decision 4, Decision 2
  - Acceptance criteria reference: specs/monster-upload-refactor/spec.md
  - Testability notes: Run `jest tests/unit/monster-upload/` — zero failures, zero snapshot changes

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No regression in monster validation behaviour
  - Design element: Public API of `validateMonsterData` / `validateMonsterUploadDocument` unchanged
  - Acceptance criteria reference: specs/monster-upload-refactor/spec.md
  - Testability notes: Existing test suite is the regression harness; no mocking changes needed

- Requirement category: operability
  - Requirement: TypeScript compilation succeeds with zero errors
  - Design element: All import paths updated; re-exports in place
  - Acceptance criteria reference: All specs
  - Testability notes: `tsc --noEmit` in CI

## Risks / Trade-offs

- Risk/trade-off: Import path change from `monsterUpload.ts` to `core.ts` for types
  - Impact: Any file importing `ValidationError` directly from `monsterUpload.ts` continues to work via re-export; any file that was importing it from a type-only perspective is unaffected
  - Mitigation: Re-export from `monsterUpload.ts`; grep all import sites before cutting over

- Risk/trade-off: `validateString` trim fix is a silent behaviour change
  - Impact: Low — the only current consumer is `validateMonsterData`, where `name` is already trimmed in `transformMonsterData`
  - Mitigation: Confirm no existing test relies on un-trimmed pass-through before merging

## Rollback / Mitigation

- Rollback trigger: CI failure after merge, or a consumer reports unexpected validation results
- Rollback steps: Revert the PR; all changes are in `lib/validation/` and `tests/unit/validation/` — no database migrations, no API contract changes
- Data migration considerations: None
- Verification after rollback: `jest tests/unit/monster-upload/` green; `tsc --noEmit` passes

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failure in the feature branch.
- If security checks fail: Do not merge. This refactor touches no auth, secrets, or external I/O — a security failure here likely indicates a tooling misconfiguration to investigate.
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to repo owner after 48 hours.
- Escalation path and timeout: Repo owner (`dougis`) has merge authority after 48-hour stale review.

## Open Questions

No open questions. All design decisions confirmed during explore session on 2026-05-19.

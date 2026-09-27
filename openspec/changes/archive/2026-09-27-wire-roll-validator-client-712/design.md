## Context

- Relevant architecture: `lib/dice/useRollSubmission.ts` is a client-only `'use client'` React hook that wraps the `POST /api/campaigns/[id]/rolls` call. `lib/validation/rollSubmission.ts` is a browser-safe zod module (no `next/*`, no storage imports) already used server-side in `app/api/campaigns/[id]/rolls/route.ts` (PR #715).
- Dependencies: #577 / PR #715 (merged) — delivered `rollSubmissionSchema` and its exported bounds. No other dependency.
- Interfaces/contracts touched: `submitRoll`'s internal implementation only. Its exported signature `(formula: string, rolls: number[], total: number, visibility: RollVisibility) => Promise<RollSubmitResult>` and the `RollSubmitResult` union (`'success' | 'conflict' | 'error'`) are unchanged.

## Goals / Non-Goals

### Goals

- Reject a malformed/out-of-bounds roll payload locally, before any network call, using the exact same schema the server enforces.
- Preserve all existing observable behavior for well-formed payloads (200/409/500/network-error handling untouched).

### Non-Goals

- Changing `submitRoll`'s signature (e.g. adding `label`).
- Surfacing a distinct error type/message for "local validation failed" vs. any other `'error'` cause — both collapse to `'error'` today and continue to do so.
- Touching the server route or the validator module itself.

## Decisions

### Decision 1: Validate with `rollSubmissionSchema.safeParse`, not a manual bounds check

- Chosen: Import `rollSubmissionSchema` from `@/lib/validation/rollSubmission` and call `.safeParse({ formula, rolls, total, visibility })` at the top of `submitRoll`, before the `try`/`fetch` block. If `!result.success`, `return 'error'` immediately.
- Alternatives considered:
  1. Re-implement bounds checks inline in the hook (reject: duplicates logic, exactly what issue #712 says to avoid — "no new constants, reuse the exported bounds").
  2. Use `.parse()` and catch the thrown `ZodError` (reject: `safeParse` avoids a try/catch just for control flow and matches the module's own doc comment, which anticipates `safeParse` in the client — see the file's header block referencing "usable server-side now and, per issue #712, importable client-side later").
- Rationale: Single source of truth stays in `lib/validation/rollSubmission.ts`; the hook only decides *what to do* on failure (skip `fetch`), not *what's valid*.
- Trade-offs: `submitRoll` now has a hard dependency on a module it previously didn't import. Acceptable — that module was purpose-built for this and has no framework/runtime baggage that would taint a client bundle.

### Decision 2: Parse the payload without a `label` field

- Chosen: Build the parse input as `{ formula, rolls, total, visibility }` — the same four values already assembled for the `fetch` body — and let zod's `.optional()` on `label` pass with it simply absent.
- Alternatives considered: Add a `label` parameter to `submitRoll` to fully mirror the schema shape (reject: out of scope per proposal; no caller has a label to pass; would be speculative API surface with no consumer).
- Rationale: `rollSubmissionSchema.shape.label` is `z.string().max(MAX_LABEL_LENGTH).optional()` — an absent key satisfies `.optional()` under zod's default parsing (only `.strict()` schemas reject unknown/extra keys; missing optional keys are never a `safeParse` failure).
- Trade-offs: None functionally; noted only so a future reader doesn't wonder why `label` is untouched.

### Decision 3: Validation gate lives inside `submitRoll`, before the existing `try` block

- Chosen: Structure as:
  ```ts
  async function submitRoll(formula, rolls, total, visibility) {
    if (!rollSubmissionSchema.safeParse({ formula, rolls, total, visibility }).success) {
      return 'error'
    }
    try {
      // existing fetch logic, unchanged
    } catch { return 'error' }
  }
  ```
- Alternatives considered: A separate exported `isValidRollPayload` helper in the hook file (reject: unnecessary indirection for a single call site; the proposal's non-goals rule out new abstractions here).
- Rationale: Keeps the diff minimal and localizes the new behavior to exactly the function issue #712 names.
- Trade-offs: None significant.

## Proposal to Design Mapping

- Proposal element: "`submitRoll` runs the shared schema's `safeParse` ... before `fetch`"
  - Design decision: Decision 1, Decision 3
  - Validation approach: Unit tests asserting `fetch` is not called and result is `'error'` for out-of-bounds inputs.
- Proposal element: "On parse failure: return `'error'`, do not call `fetch`"
  - Design decision: Decision 3
  - Validation approach: `expect(global.fetch).not.toHaveBeenCalled()` assertions per bound.
- Proposal element: "No new constants — reuse the exported bounds"
  - Design decision: Decision 1
  - Validation approach: Code review / grep confirms no new `MAX_*` constants introduced in `useRollSubmission.ts`.
- Proposal element: "valid pool roll and `d%` percentile roll → still submitted"
  - Design decision: Decision 1 (schema already permits these shapes), Decision 2 (no `label` needed for them to pass)
  - Validation approach: Existing passing tests in `useRollSubmission.test.ts` re-verified unchanged; add one test using a `buildRoll()`-shaped max pool payload and one `d%`-shaped payload to pin this at the boundary rather than only mid-range values.

## Functional Requirements Mapping

- Requirement: Reject oversized `formula` (`length > MAX_FORMULA_LENGTH`) locally.
  - Design element: Decision 1 (`safeParse`).
  - Acceptance criteria reference: tasks.md test case "oversized formula → 'error', no fetch".
  - Testability notes: Deterministic — construct a string of `MAX_FORMULA_LENGTH + 1` chars; no mocking needed beyond existing `fetch` spy.
- Requirement: Reject oversized `rolls` array (`length > MAX_DICE_IN_ROLL`) locally.
  - Design element: Decision 1.
  - Acceptance criteria reference: tasks.md test case "oversized rolls array → 'error', no fetch".
  - Testability notes: Array of `MAX_DICE_IN_ROLL + 1` valid entries.
- Requirement: Reject out-of-range die value (`< 1` or `> MAX_DIE_VALUE`) locally.
  - Design element: Decision 1.
  - Acceptance criteria reference: tasks.md test case "out-of-range die value → 'error', no fetch".
  - Testability notes: Single entry `MAX_DIE_VALUE + 1` (e.g. 101) is sufficient; also verify `0` and negative are rejected (schema's `.min(1)`).
- Requirement: Reject `total` magnitude beyond `MAX_TOTAL_MAGNITUDE` locally.
  - Design element: Decision 1.
  - Acceptance criteria reference: tasks.md test case "out-of-range total → 'error', no fetch".
  - Testability notes: Test both `+` and `-` overflow since the schema bounds `|total|`.
- Requirement: Valid pool roll and `d%` roll still submitted.
  - Design element: Decision 1, Decision 2.
  - Acceptance criteria reference: existing tests + new boundary-value tests.
  - Testability notes: Reuse the existing `'1d20', [10], 10, { scope: 'group' }` fixture as the baseline "still works" case; add a max-pool-shaped and a `d%`-shaped (`rolls: [<1..100>]`) case.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Client-side rejection must never throw synchronously or leave `submitRoll`'s returned promise unresolved.
  - Design element: `safeParse` never throws (unlike `.parse`); the gate is a plain `if` before any `try`, so no new exception path is introduced.
  - Acceptance criteria reference: tasks.md — no new `try/catch` needed around the parse call.
  - Testability notes: Existing "thrown network error resolves to error" test continues to cover the `fetch`-side exception path unchanged; no equivalent test needed for the parse gate since it cannot throw.
- Requirement category: performance
  - Requirement: The added `safeParse` call must not introduce a network round trip or async work.
  - Design element: `safeParse` is synchronous; the gate runs before the `async`/`await fetch` line.
  - Acceptance criteria reference: N/A (structural — no test needed beyond confirming `fetch` isn't called on failure, which is already required above).
  - Testability notes: Implicit in "no fetch called" assertions.

## Risks / Trade-offs

- Risk/trade-off: Boundary mismatch between `buildRoll()`/`buildPercentileRoll()` output and schema bounds (see proposal Risk 1).
  - Impact: A legitimate roll silently fails client-side with a generic `'error'`.
  - Mitigation: Boundary-value unit tests (max pool, `d%`) in tasks.md close this gap before merge; no server-side change needed since the schema is shared and was already validated against these exact shapes in PR #715.
- Risk/trade-off: `useRollSubmission.ts` becomes a client-code importer of `lib/validation/rollSubmission.ts`.
  - Impact: If a future edit adds a `next/*` or storage import to the validator module, it would break client bundling only at that future point, not now.
  - Mitigation: None added by this change — the validator module's own header comment already documents this constraint for future editors; out of scope to add tooling enforcement here.

## Rollback / Mitigation

- Rollback trigger: If the new local-validation gate is found to reject legitimate payloads in production (e.g. an unanticipated roll shape from a feature not yet built), or introduces any regression in the existing `'success' | 'conflict' | 'error'` mapping.
- Rollback steps: Revert the single commit touching `lib/dice/useRollSubmission.ts` (and its test file). No schema, server route, or data changes are involved, so this is a pure code revert with no migration.
- Data migration considerations: None — no persisted data or API contract changes.
- Verification after rollback: Re-run `tests/unit/lib/dice/useRollSubmission.test.ts`; confirm `GlobalDiceFab.tsx`'s roll flow (pool + `d%`) submits successfully in a manual/dev check.

## Operational Blocking Policy

- If CI checks fail: Fix the underlying test/lint/type failure before merging; this change has no infra or flaky-dependency surface (pure unit-testable logic), so a CI failure here is almost certainly a real regression.
- If security checks fail: Not expected — no new external input surface, no new dependency, reuses an already-reviewed validator. If Verity or another gate flags something, treat it as a real finding per repo policy (fix, don't waive, unless a human explicitly accepts the risk).
- If required reviews are blocked/stale: Standard repo process — ping for review; do not merge with `--admin`.
- Escalation path and timeout: None beyond normal PR review cadence; this is a small, low-risk, single-file change.

## Open Questions

None.

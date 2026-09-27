## GitHub Issues

- #712
- #577 (dependency; closed via PR #715, merged)

## Why

- Problem statement: `useRollSubmission.submitRoll` posts `{ formula, rolls, total, visibility }` to `POST /api/campaigns/[id]/rolls` with no client-side shape/bounds check. The server route (hardened in PR #715 via `lib/validation/rollSubmission.ts`) is the real trust boundary, but any future caller that builds a payload without `useDicePoolState.buildRoll()`/`buildPercentileRoll()` currently has no local guard and will always round-trip to the network before finding out the payload is malformed.
- Why now: #577's server-side fix explicitly split this client mirror out as a tracked follow-up (issue #712), and the shared validator it produced (`lib/validation/rollSubmission.ts`) was deliberately written with no `next/*` or storage imports so it is safe to import from client code — the dependency is unblocked.
- Business/user impact: Low direct user-facing impact (legitimate pool/percentile rolls are already well-formed and will keep succeeding). The value is defense-in-depth: a caller with a bug or a future new roll-entry path fails fast locally (`'error'`, no `fetch`) instead of depending solely on the server for correctness, and instead of the fan-out cost of a rejected round-trip.

## Problem Space

- Current behavior: `submitRoll(formula, rolls, total, visibility)` in `lib/dice/useRollSubmission.ts` builds the JSON body and calls `fetch` unconditionally; the only local validation is TypeScript's static typing, which does not catch out-of-range values, oversized arrays/strings, etc.
- Desired behavior: `submitRoll` runs `rollSubmissionSchema.safeParse` on the outgoing payload before calling `fetch`. On parse failure, return `'error'` immediately with no network call. On success, behavior is unchanged (still dispatches `fetch` and maps `201`/`409`/other statuses as today).
- Constraints:
  - No new validation constants — reuse the exported bounds/schema from `lib/validation/rollSubmission.ts` (`MAX_DIE_VALUE`, `MAX_DICE_IN_ROLL`, `MAX_TOTAL_MAGNITUDE`, `MAX_FORMULA_LENGTH`, `MAX_LABEL_LENGTH`, `rollSubmissionSchema`).
  - `rollSubmissionSchema` is a `.optional()`-`label`, non-`.strict()` zod object; extra/missing optional keys must not break existing call sites.
  - `submitRoll`'s current signature is `(formula, rolls, total, visibility)` — no `label` parameter exists today, and no caller (`GlobalDiceFab.tsx`) passes one. The schema's `label` field stays optional and is simply omitted from the parsed object; the signature does not change.
  - Must not change `'success' | 'conflict' | 'error'` return semantics for anything that already reaches `fetch` today.
- Assumptions:
  - The only two current callers of `buildRoll()`/`buildPercentileRoll()` (`GlobalDiceFab.tsx`) already produce schema-conformant payloads, so this change is invisible to them in the happy path.
  - `visibility` passed in is always `{ scope: 'group' | 'dm-only' }`, matching `RollVisibility` and the schema's `visibility.scope` enum.
- Edge cases considered:
  - Oversized `rolls` array (> `MAX_DICE_IN_ROLL`) → local `'error'`, no `fetch`.
  - Out-of-range single die value (< 1 or > `MAX_DIE_VALUE`, e.g. a corrupted d% entry) → local `'error'`.
  - Oversized/empty `formula` string → local `'error'`.
  - `total` magnitude beyond `MAX_TOTAL_MAGNITUDE` (either sign) → local `'error'`.
  - Legitimate `d%` percentile roll (`buildPercentileRoll()`) and a max-size pool roll (all six dice types at `MAX_PER_DIE`) must still parse successfully and reach `fetch`.
  - Network/HTTP failure paths (`409`, `500`, thrown `fetch` rejection) are unaffected — validation only gates whether `fetch` is called at all.

## Scope

### In Scope

- Import `rollSubmissionSchema` from `lib/validation/rollSubmission.ts` into `lib/dice/useRollSubmission.ts`.
- Run `safeParse` on `{ formula, rolls, total, visibility }` inside `submitRoll` before the `fetch` call.
- Return `'error'` and skip `fetch` on parse failure.
- Unit tests in `tests/unit/lib/dice/useRollSubmission.test.ts`: oversized/out-of-range payload → `'error'`, `fetch` not called (for at least one case per bound: formula length, rolls length, die-value range, total magnitude); valid pool roll and `d%` roll → still submitted (already covered by existing passing tests, confirm they still pass unchanged).

### Out of Scope

- Any change to the server route (`app/api/campaigns/[id]/rolls/route.ts`) or `lib/validation/rollSubmission.ts` itself — both were delivered and closed by #577/PR #715.
- Adding a `label` parameter to `submitRoll` or wiring `label` end-to-end from any caller.
- Changes to `useDicePoolState.buildRoll()` / `buildPercentileRoll()`.
- Any UI-visible error messaging for the new local-validation-failure path (it maps to the existing generic `'error'` outcome, same as any other failure today).

## What Changes

- `lib/dice/useRollSubmission.ts`: add a `safeParse` gate using `rollSubmissionSchema` before `fetch` in `submitRoll`; return `'error'` on failure without calling `fetch`.
- `tests/unit/lib/dice/useRollSubmission.test.ts`: add test cases covering local rejection for each bound, and confirm existing valid-payload tests still pass.

## Risks

- Risk: A legitimate but edge-case payload (e.g., a modifier-heavy formula string right at 64 chars, or a max pool roll) gets rejected locally due to an off-by-one mismatch between what `buildRoll()`/`buildPercentileRoll()` produce and what the schema allows.
  - Impact: Users would see rolls silently fail to submit (`'error'`) even though the server would have accepted them.
  - Mitigation: Task list includes exercising the schema against the actual output of `buildRoll()` (max pool) and `buildPercentileRoll()` (`d%`) as unit tests, not just synthetic in-range values — this mirrors what #577's own suggested-fix section already required server-side, applied here client-side.
- Risk: Divergence between client and server validation if `lib/validation/rollSubmission.ts` changes later without this hook being revisited.
  - Impact: Low — both sides import the same shared module, so divergence would require someone to change the schema and this is the intended single-source-of-truth design already documented in the module's own comments.
  - Mitigation: None needed beyond what's already in place; noting for awareness only.

## Open Questions

None — #577 (the blocking dependency) is closed and merged (PR #715), the shared validator already exists in the exact importable form issue #712 anticipated, and the only ambiguity from initial exploration (whether `label` needs a signature change) is resolved: it does not, since the field is optional in the schema and no caller passes it.

## Non-Goals

- Rewriting or renaming `useRollSubmission`'s public API/signature.
- Introducing new validation constants beyond what `lib/validation/rollSubmission.ts` already exports.
- Retrofitting `label` support into the roll-submission flow.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

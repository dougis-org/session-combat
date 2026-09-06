## GitHub Issues

- #577
- #712 (follow-up, out of scope here — client-side defense-in-depth)

## Why

- Problem statement: `POST /api/campaigns/[id]/rolls` (`app/api/campaigns/[id]/rolls/route.ts`) validates only the type/shape of `formula`, `rolls`, `total`, and `visibility.scope` — never their size or magnitude — and the route has no request-body size cap (`withAuthAndParams` calls `request.json()` directly, buffering the whole body first). Any authenticated active campaign member can persist a multi-megabyte `formula`, a `rolls` array with hundreds of thousands of entries, an absurd `total`, or an oversized `label`. The stored roll is then fan-out broadcast to every active member via `emitFiltered`, amplifying the cost.
- Why now: This is a live gap, not hypothetical. It violates recorded project decision **n050** ("Any dice submission path must validate the pool, bounds, formula, and applicable permissions — or otherwise recompute the result server-side — before accepting it") and contradicts the comment in `lib/utils/dice.ts` that "the server route is the real trust boundary." The route is currently not enforcing that boundary for bounds.
- Business/user impact: Resource exhaustion / storage bloat (unbounded Mongo documents via `storage.saveCampaignRoll`), fan-out amplification to all connected clients, and memory pressure from unbounded body buffering. Severity: medium — requires auth + campaign membership, no data disclosure, but a low-bar abuse vector exploitable by any member (not just DMs).

## Problem Space

- Current behavior: Route performs inline `typeof` / `Array.isArray` / `Number.isFinite` checks and a `scope` enum check, then writes and broadcasts. No `formula.length`, no `rolls.length`, no per-entry range, no `total` magnitude, no `label.length`, no body-size limit.
- Desired behavior: A single shared, bounded validator (zod, in `lib/validation/`, matching the `lib/validation/monsterUploadSchema.ts` precedent) is the one definition of a well-formed roll submission. The route reads the body under a small byte cap (returns `413` on oversize) and validates the parsed payload with `schema.safeParse` (returns `400` on invalid) before `storage.saveCampaignRoll` / `emitFiltered`. Bounds are derived from constants already in `lib/utils/dice.ts`.
- Constraints:
  - Bounds must be derived from existing dice constants: `MAX_PER_DIE = 20`, `DIE_SIDES = [4,6,8,10,12,20]` (length 6 → 120 standard-dice ceiling), percentile die max value 100, `MAX_MODIFIER = 999`. Add modest headroom so legitimate edge cases (`d%` percentile rolls) are unaffected.
  - `MAX_LABEL_LENGTH = 128` (explicit decision by requester).
  - Validate only — do NOT parse the `formula` string or recompute `total` from `rolls`. There is no server-side formula parser today; building one is out of scope. This takes the "validate the bounds" half of n050's "or", not the "recompute server-side" half.
  - The shared validator module must be structured so it can later be imported by the client hook (`lib/dice/useRollSubmission.ts`) without pulling server-only code — that wiring is #712, not this change.
  - Must not change the wire contract for well-formed rolls: a normal pool roll and a `d%` percentile roll that succeed today must still return `201`.
  - `visibility.scope` enum (`'group' | 'dm-only'`) behavior is already correct and must be preserved (folded into the schema, not loosened).
- Assumptions:
  - `zod` is already a project dependency (used by `lib/validation/monsterUploadSchema.ts`).
  - `rolls` entries can only be range-checked as generic integers in `1..MAX_DIE_VALUE` (100), because the route receives a flat `rolls[]` with no per-die context and formula parsing is out of scope.
  - The existing `readBoundedText` streaming helper in `app/api/monsters/upload/shared.ts` is the reuse model for the body cap; a JSON-only endpoint needs a much smaller cap than `MAX_UPLOAD_BYTES` (5 MB).
- Edge cases considered:
  - `d%` percentile roll: single entry up to 100, `formula` = `PERCENTILE_FORMULA`. Must pass.
  - Maximum legitimate pool: 120 dice (`MAX_PER_DIE` × 6 groups) plus a modifier up to `MAX_MODIFIER`. `MAX_DICE_IN_ROLL` and `MAX_TOTAL_MAGNITUDE` must have headroom above this.
  - `label` absent / empty / whitespace-only: still valid (route already treats these as "no label").
  - Body exactly at the cap vs. one byte over.
  - Non-object JSON, malformed JSON, arrays as body: already handled; must remain handled after refactor.
  - Negative `total` (mitigation/penalty rolls): `MAX_TOTAL_MAGNITUDE` is an absolute-value bound.

## Scope

### In Scope

- New `lib/validation/rollSubmission.ts`: zod schema for the roll-submission payload plus exported bounds constants `MAX_FORMULA_LENGTH`, `MAX_DICE_IN_ROLL`, `MAX_DIE_VALUE`, `MAX_TOTAL_MAGNITUDE`, `MAX_LABEL_LENGTH` (= 128), with values derived/documented from `lib/utils/dice.ts`.
- Bounded request-body read in `app/api/campaigns/[id]/rolls/route.ts` (small byte cap; `413` on oversize) — a shared/generalized helper or a lightweight local one, decided in `design.md`.
- Replace the route's inline shape checks with `rollSubmissionSchema.safeParse(...)`; return `400` with a useful error on failure; keep the existing `403` / `409` / `201` flow unchanged.
- Unit tests for the schema (accept valid pool roll, accept `d%`, reject oversized formula / oversized `rolls` / out-of-range die value / out-of-range total / oversized label).
- Route/integration tests: oversized body → `413` with no `saveCampaignRoll` / `emitFiltered`; invalid payload → `400` with no `saveCampaignRoll` / `emitFiltered`; valid pool roll and `d%` roll → `201`.
- Follow-up GitHub issue #712 created and assigned for the client-side wiring.

### Out of Scope

- Wiring the shared validator into the client hook `lib/dice/useRollSubmission.ts` (`submitRoll`) — tracked as #712.
- Parsing the `formula` string or recomputing `total` server-side.
- Per-die range validation that depends on knowing which dice were in the pool.
- Applying a body-size cap to other routes or changing `withAuthAndParams` for all callers (a shared helper may be added, but only this route is migrated).
- Rate limiting the rolls endpoint.
- Any change to `storage.saveCampaignRoll`, `emitFiltered`, `canSeeRoll`, or the `CampaignRoll` type.

## What Changes

- Add `lib/validation/rollSubmission.ts` (zod schema + exported bounds constants).
- Modify `app/api/campaigns/[id]/rolls/route.ts`: bounded body read (`413`), `safeParse` validation (`400`), remove now-redundant inline checks.
- Possibly add a small shared bounded-JSON read helper (location/shape decided in `design.md`); if added, only the rolls route consumes it in this change.
- Add unit tests for the schema and route behavior.
- New capability delta: `roll-submission-validation` (or extend the existing roll-share capability — decided in `design.md`).

## Risks

- Risk: Bounds set too tight reject legitimate rolls (large custom pools, `d%`).
  - Impact: Players get spurious `400`s; regression in a core feature.
  - Mitigation: Derive ceilings from `lib/utils/dice.ts` with explicit headroom; add tests covering the maximum legitimate pool and `d%`; document each constant's derivation in code comments.
- Risk: Bounded body read changes how the body stream is consumed and breaks the existing JSON parse / malformed-body handling.
  - Impact: Well-formed rolls fail, or error responses regress.
  - Mitigation: Model on the proven `readBoundedText` helper; keep existing malformed-JSON / non-object tests green; add a body-at-cap boundary test.
- Risk: Shared module accidentally imports server-only code, blocking the future #712 client wiring.
  - Impact: #712 becomes harder than intended.
  - Mitigation: Keep `lib/validation/rollSubmission.ts` dependency-free except `zod` and constants re-exported from `lib/utils/dice.ts`; no `next/server`, no storage imports.
- Risk: Error message from `safeParse` leaks internal schema detail into the `400` body.
  - Impact: Noisy / confusing API responses.
  - Mitigation: Map `safeParse` failure to a concise, stable error string in the route (design decision).

## Open Questions

- Question: Body-size cap value for this JSON-only endpoint — proposal assumes ~16 KB. Acceptable, or prefer a different number?
  - Needed from: requester
  - Blocker for apply: no (design.md will set a concrete default; 16 KB unless told otherwise)
- Question: New standalone capability `roll-submission-validation`, or a MODIFIED delta on the existing roll-share capability?
  - Needed from: requester
  - Blocker for apply: no (design.md will choose; leaning standalone capability for the validator + a MODIFIED delta on the route's capability)

All other requirements are considered resolved following the explore-mode session (issue 577): approach = shared single validator applied to this one route (1A+B), validate-not-recompute (2 + 3), follow-up issue created (4 = #712), `label` included with `MAX_LABEL_LENGTH = 128` (5).

## Non-Goals

- Making the rolls endpoint DM-only or otherwise changing its authorization model.
- Introducing a server-side dice-formula parser or result recomputation.
- Retrofitting body-size caps across all API routes.
- Adding rate limiting or abuse telemetry to the rolls endpoint.
- Changing the real-time broadcast (`emitFiltered`) or roll visibility rules.

## Change Control

If scope changes after proposal approval, update `openspec/changes/bound-rolls-api-validation/proposal.md`,
`openspec/changes/bound-rolls-api-validation/design.md`,
`openspec/changes/bound-rolls-api-validation/specs/**/*.md`, and
`openspec/changes/bound-rolls-api-validation/tasks.md` before implementation starts.

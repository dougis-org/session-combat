## Context

- Relevant architecture:
  - `app/api/campaigns/[id]/rolls/route.ts` — `POST` handler wrapped by `withAuthAndParams<Params>` (`lib/middleware`). Handler signature `(request, auth, { id: campaignId })`. It calls `await request.json()`, does inline shape checks, resolves membership/access, builds a `CampaignRoll`, calls `storage.saveCampaignRoll(roll)`, then `emitFiltered(campaignId, { type: 'roll', campaignId, data: roll }, canSeeRoll-predicate)`, and returns `201` with the roll.
  - `lib/utils/dice.ts` — source of truth for dice bounds: `SUPPORTED_SIDES = [4,6,8,10,12,20,100]`, `DIE_SIDES = [4,6,8,10,12,20]`, `MAX_PER_DIE = 20`, `MAX_MODIFIER = 999`, `PERCENTILE_FORMULA = "d%"`. Percentile die max face value = 100.
  - `lib/validation/monsterUploadSchema.ts` — precedent for bounded `zod` schemas in `lib/validation/` (`UPLOAD_LIMITS`, `boundedRecord`, `.refine` for cardinality).
  - `app/api/monsters/upload/shared.ts` — precedent for a streaming bounded body read: `readBoundedText(request, maxBytes)` returns `{ ok:false, reason:'oversize' }` / `{ ok:false, reason:'error' }` / `{ ok:true, text }`, aborting the stream once `maxBytes` is exceeded; `readMonstersBody` also short-circuits on a too-large `Content-Length` header. `readBoundedText` is currently module-private; `MAX_UPLOAD_BYTES` (5 MB) and `readMonstersBody` are exported.
- Dependencies: `zod` (already used by `lib/validation/monsterUploadSchema.ts`); constants re-exported from `lib/utils/dice.ts`.
- Interfaces/contracts touched:
  - `POST /api/campaigns/[id]/rolls` request body: `{ formula: string, rolls: number[], total: number, label?: string, visibility: { scope: 'group' | 'dm-only' } }`. Wire contract for well-formed payloads is unchanged; new rejections are `413` (oversize body) and a broadened `400` (bounds/shape).
  - New module `lib/validation/rollSubmission.ts` (public: schema + bounds constants).
  - New module `lib/server/readBoundedJson.ts` (public: `readBoundedJson(request, maxBytes)`).

## Goals / Non-Goals

### Goals

- One shared definition of a well-formed roll submission (`lib/validation/rollSubmission.ts`), usable server-side now and client-side later (#712) without pulling server-only imports.
- The rolls route enforces a small request-body byte cap (`413`) and schema validation (`400`) before any persistence or broadcast.
- All bounds derive from, and are documented against, `lib/utils/dice.ts` constants with explicit headroom so legitimate rolls (max pool, `d%`) are unaffected.
- Existing `403` / `409` / `201` behavior and malformed-JSON / non-object `400` handling are preserved.

### Non-Goals

- Parsing `formula` or recomputing `total` from `rolls`.
- Per-die range validation requiring pool context.
- Migrating other routes to the bounded-read helper or changing `withAuthAndParams`.
- Rate limiting, telemetry, or authorization changes on the rolls endpoint.
- Changes to `storage.saveCampaignRoll`, `emitFiltered`, `canSeeRoll`, or the `CampaignRoll` type.

## Decisions

### Decision 1: Single shared zod validator in `lib/validation/rollSubmission.ts`

- Chosen: New module exporting `rollSubmissionSchema` (a `zod` object schema) plus named bounds constants. Schema shape:
  - `formula`: `z.string().trim().min(1).max(MAX_FORMULA_LENGTH)`
  - `rolls`: `z.array(z.number().int().min(1).max(MAX_DIE_VALUE)).max(MAX_DICE_IN_ROLL)` — non-empty not required (route currently accepts `[]`; keep that unless tests say otherwise), finite guaranteed by `.int()`
  - `total`: `z.number().finite().refine(n => Math.abs(n) <= MAX_TOTAL_MAGNITUDE)`
  - `label`: `z.string().max(MAX_LABEL_LENGTH).optional()` (route already trims/drops empty)
  - `visibility`: `z.object({ scope: z.enum(['group', 'dm-only']) })`
  - `.strict()` is NOT used — extra keys are ignored, matching today's behavior where the route destructures only known fields.
- Alternatives considered: (a) keep hand-rolled checks in the route and just add length guards — rejected: no shared definition for #712, easy to drift; (b) extend `withAuthAndParams` to accept a schema for every JSON route — rejected: out of scope, broad blast radius.
- Rationale: Matches the `lib/validation/monsterUploadSchema.ts` precedent; one import for both trust boundaries; `safeParse` gives a structured result the route maps to `400`.
- Trade-offs: A second validation layer (schema + Mongo write) — negligible cost; the schema module must stay free of `next/*` and storage imports so the client can consume it later.

### Decision 2: Bounds constants and their derivation

- Chosen (in `lib/validation/rollSubmission.ts`, each with a comment citing its `lib/utils/dice.ts` basis): **tight** bounds, matched exactly to today's real ceilings rather than rounded up with generous headroom — an explicit requester decision (over the alternative of loose headroom for hypothetical future growth).
  - `MAX_DIE_VALUE = 100` — largest face in `SUPPORTED_SIDES` (the `d%` percentile die). Exact ceiling for a single die result.
  - `MAX_DICE_IN_ROLL = 120` — exact ceiling: `MAX_PER_DIE (20) × DIE_SIDES.length (6) = 120`, the real pool-builder maximum. No rounding up.
  - `MAX_TOTAL_MAGNITUDE = 13_000` — exact ceiling: `MAX_DICE_IN_ROLL (120) × MAX_DIE_VALUE (100) + MAX_MODIFIER (999) = 12_999`, rounded up slightly to a round number. Absolute-value bound so negative totals (penalties) pass.
  - `MAX_FORMULA_LENGTH = 64` — a fully-expanded max pool formula (`20d4+20d6+20d8+20d10+20d12+20d20+999`) is ~36 chars; 64 is tight headroom, not loose padding.
  - `MAX_LABEL_LENGTH = 128` — explicit requester decision.
- Alternatives considered: Loose headroom (e.g. `MAX_DICE_IN_ROLL = 200`, `MAX_TOTAL_MAGNITUDE = 100_000`, `MAX_FORMULA_LENGTH = 256`) to absorb hypothetical future die groups without a follow-up spec change — rejected: the point of this change is a meaningful trust boundary, and any real feature growth (a new die size, a bigger pool cap) already requires touching `lib/utils/dice.ts` and can bump these constants in the same PR.
- Rationale: A bound that sits far above the real maximum isn't much of a bound. Tight-but-derived values still never reject a legitimate roll (verified by the max-pool and `d%` test cases) while making the boundary actually meaningful.
- Trade-offs: Any future increase to `MAX_PER_DIE`, `DIE_SIDES`, or `MAX_MODIFIER` must be accompanied by an update here — acceptable since both live under `lib/utils/dice.ts` and a change to one is a deliberate, reviewed edit, not organic drift. It is still a resource-exhaustion backstop, not a correctness check (that is what n050's "recompute" half would be, explicitly out of scope).

### Decision 3: Bounded JSON body read via new `lib/server/readBoundedJson.ts`

- Chosen: Extract a small generic helper `readBoundedJson(request, maxBytes): Promise<{ ok: true; value: unknown } | { ok: false; reason: 'oversize' | 'error' | 'invalid-json' }>`. It mirrors `readBoundedText` (stream via `request.body.getReader()`, abort once `total > maxBytes`), also short-circuits on an oversized `Content-Length` header, then `JSON.parse`s the text. The rolls route calls it with `ROLL_BODY_MAX_BYTES = 16 * 1024` (16 KiB).
- Alternatives considered: (a) export `readBoundedText` from the monsters `shared.ts` and JSON-parse in the route — workable but leaves the helper in a monster-specific module and duplicates the parse/short-circuit logic; (b) a purely `Content-Length`-based check — rejected: `Content-Length` is client-controlled and may be absent for chunked bodies, so a streaming byte cap is still required.
- Rationale: Keeps the proven streaming-abort behavior, gives a reusable seam (future routes can adopt it) without forcing this change to migrate them, and keeps the rolls route readable.
- Trade-offs: One new small module. The monsters route is intentionally left on its own helper in this change (could be de-duplicated later).
- Note: `ROLL_BODY_MAX_BYTES = 16 KiB` is the proposal's assumed default (open question). 16 KiB fits the maximum legitimate payload (`~200` small numbers + short strings ≈ <2 KiB) with large headroom.

### Decision 4: Route wiring and response mapping

- Chosen order in the `POST` handler:
  1. `readBoundedJson(request, ROLL_BODY_MAX_BYTES)` → `413` on `reason: 'oversize'`, `400 { error: 'Invalid JSON' }` on `reason: 'invalid-json'`, `500` on `reason: 'error'` (matches existing internal-error behavior).
  2. `rollSubmissionSchema.safeParse(value)` → on failure return `400 { error: <concise stable message> }`. Map to a short fixed string per first issue (e.g. `` `formula: ${issue.message}` ``) rather than dumping `error.flatten()`, to avoid leaking schema internals.
  3. Use `parsed.data` for `formula` (already trimmed by schema), `rolls`, `total`, `label`, `visibility.scope` — delete the corresponding inline `typeof` / `Array.isArray` / `Number.isFinite` / `scope` checks.
  4. Unchanged from here: `storage.getMember` → `403`, `assertCampaignAccess` → passthrough, `!campaign.activeSessionId` → `409`, build `CampaignRoll`, `storage.saveCampaignRoll`, `emitFiltered`, `201`.
- Alternatives considered: Returning `422` for schema failure — rejected: repo convention is `400` for bad request shape; keep consistency.
- Rationale: Minimal, mechanical refactor; validation failure short-circuits before membership lookup (cheaper, and avoids leaking membership state to unauthenticated-of-intent callers).
- Trade-offs: Body-size and schema errors are now returned before the `403` membership check — acceptable and arguably better (no DB call for junk payloads); the caller is still authenticated (wrapper runs first).

### Decision 5: Capability layout

- Chosen: One new capability delta directory `openspec/changes/bound-rolls-api-validation/specs/roll-submission-validation/spec.md` with `## ADDED Requirements` covering the shared validator + the route's enforcement (bounded body, schema `400`, preserved `201`/`403`/`409`). No pre-existing `openspec/specs/roll-submission-validation/` — this is net-new.
- Alternatives considered: A `## MODIFIED Requirements` delta against an existing roll-share capability — rejected: the roll-share specs are archived / focused on UI commit behavior, not the API trust boundary; a dedicated capability is cleaner and matches the shared-validator framing.
- Rationale: The validator is a distinct, reusable concern (server now, client later via #712).
- Trade-offs: A new capability to maintain; acceptable given it has a clear owner (the rolls trust boundary).

## Proposal to Design Mapping

- Proposal element: Shared bounded roll-payload validator in `lib/validation/`
  - Design decision: Decision 1 + Decision 2
  - Validation approach: Unit tests on `rollSubmissionSchema` (accept max legitimate pool, accept `d%`; reject oversized formula / `rolls` length / die value / `total` / label). Assert exported constants equal the documented derived values.
- Proposal element: Request-body size cap (`413`)
  - Design decision: Decision 3 + Decision 4 step 1
  - Validation approach: Route test posting a body > 16 KiB → `413`, `storage.saveCampaignRoll` and `emitFiltered` not called. Boundary test at exactly the cap → passes to schema stage.
- Proposal element: Replace inline shape checks with `safeParse` (`400`)
  - Design decision: Decision 4 steps 2–3
  - Validation approach: Route tests for each invalid field → `400`, no persistence/broadcast; existing malformed-JSON and non-object-body tests stay green.
- Proposal element: Validate only, do not parse formula / recompute total
  - Design decision: Non-Goals; Decision 2 trade-offs
  - Validation approach: Schema has no formula parsing; a roll whose `total` disagrees with `rolls` is still accepted (test asserts this is intentional).
- Proposal element: Include `label` with `MAX_LABEL_LENGTH = 128`
  - Design decision: Decision 1 (`label` field), Decision 2
  - Validation approach: Unit test — 128-char label accepted, 129-char rejected; absent/empty label still accepted.
- Proposal element: Follow-up issue for client-side wiring
  - Design decision: Non-Goals (out of scope)
  - Validation approach: Issue #712 exists, is assigned, and references #577.
- Proposal element: Preserve `visibility.scope` enum behavior
  - Design decision: Decision 1 (`visibility` field)
  - Validation approach: Existing scope tests (`group`, `dm-only` accepted; other rejected) pass unchanged.

## Functional Requirements Mapping

- Requirement: Reject roll submissions whose fields exceed derived bounds with `400` and no side effects.
  - Design element: Decision 1, Decision 2, Decision 4 step 2
  - Acceptance criteria reference: `specs/roll-submission-validation/spec.md` — "Rejects out-of-bounds roll payloads"
  - Testability notes: Table-driven unit tests per field; route tests assert `saveCampaignRoll`/`emitFiltered` mock not called.
- Requirement: Reject oversized request bodies with `413` before buffering the whole body.
  - Design element: Decision 3, Decision 4 step 1
  - Acceptance criteria reference: `specs/roll-submission-validation/spec.md` — "Caps the request body size"
  - Testability notes: Post a large body; assert `413` and no downstream mock calls. Assert stream abort via `maxBytes` (unit test on `readBoundedJson`).
- Requirement: Accept all currently-valid rolls unchanged (`201`), including `d%` and the maximum legitimate pool.
  - Design element: Decision 2 (headroom), Decision 4 steps 3–4
  - Acceptance criteria reference: `specs/roll-submission-validation/spec.md` — "Accepts well-formed rolls unchanged"
  - Testability notes: Route tests for a normal pool roll and a `PERCENTILE_FORMULA` roll → `201` with the persisted roll echoed.
- Requirement: Preserve `403` / `409` and malformed-JSON / non-object-body `400` behavior.
  - Design element: Decision 4 steps 1 & 4
  - Acceptance criteria reference: `specs/roll-submission-validation/spec.md` — "Preserves existing auth and session errors"
  - Testability notes: Keep existing route tests; add malformed-JSON test through the new helper path.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: The rolls API enforces the server-side trust boundary for payload size and magnitude (n050), so an authenticated member cannot persist or broadcast an unbounded document.
  - Design element: Decisions 1–4
  - Acceptance criteria reference: `specs/roll-submission-validation/spec.md` — NFAC Security (cross-references the functional bounds/`413` scenarios)
  - Testability notes: Covered by the functional rejection scenarios; no separate duplicate scenario.
- Requirement category: performance / reliability
  - Requirement: Oversized bodies are rejected without being fully buffered into memory; validation runs before any DB read or broadcast.
  - Design element: Decision 3 (streaming abort), Decision 4 (validation precedes `getMember`)
  - Acceptance criteria reference: `specs/roll-submission-validation/spec.md` — "Caps the request body size"
  - Testability notes: Unit test that `readBoundedJson` cancels the reader once `maxBytes` is exceeded; route test that a junk payload never reaches `storage`.
- Requirement category: operability
  - Requirement: Bounds constants are single-sourced and self-documenting so future dice changes have one place to update.
  - Design element: Decision 2 (constants + derivation comments in `lib/validation/rollSubmission.ts`)
  - Acceptance criteria reference: `specs/roll-submission-validation/spec.md` — "Bounds are derived from dice constants"
  - Testability notes: Unit test asserting each exported constant ≥ the corresponding computed legitimate maximum from `lib/utils/dice.ts`.

## Risks / Trade-offs

- Risk/trade-off: Bounds too tight → legitimate rolls rejected.
  - Impact: Core-feature regression, player-visible `400`s.
  - Mitigation: Generous headroom (Decision 2); explicit "max legitimate pool" and `d%` acceptance tests; constants asserted against computed maxima.
- Risk/trade-off: New streaming read path regresses malformed-body handling.
  - Impact: Well-formed rolls fail or error responses change.
  - Mitigation: `readBoundedJson` modeled on the proven `readBoundedText`; existing malformed-JSON / non-object tests retained; boundary-at-cap test added.
- Risk/trade-off: Schema module pulls server-only code, blocking #712.
  - Impact: Client wiring harder than intended.
  - Mitigation: Lint/review check that `lib/validation/rollSubmission.ts` imports only `zod` and `lib/utils/dice.ts`; no `next/*`, no `lib/storage`.
- Risk/trade-off: `safeParse` error detail leaks into API responses.
  - Impact: Noisy/unstable `400` bodies.
  - Mitigation: Map to a concise fixed message (Decision 4 step 2); test asserts the response body shape.
- Risk/trade-off: Validation now precedes the `403` membership check.
  - Impact: Behavior-order change; a non-member sending junk gets `400`/`413` instead of `403`.
  - Mitigation: Acceptable (caller is still authenticated; avoids a DB call for junk). Documented in the spec.

## Rollback / Mitigation

- Rollback trigger: Post-deploy spike in `400`/`413` on `POST /api/campaigns/[id]/rolls`, or reports that legitimate rolls fail.
- Rollback steps: Revert the PR (single squash commit). The three touched/added files (`lib/validation/rollSubmission.ts`, `lib/server/readBoundedJson.ts`, `app/api/campaigns/[id]/rolls/route.ts`) revert cleanly; no data or schema migration involved.
- Data migration considerations: None. No stored data shape changes; previously-stored oversized rolls (if any) are unaffected and still readable.
- Verification after rollback: `POST` a normal pool roll and a `d%` roll → `201`; confirm `400`/`413` rates return to baseline.

## Operational Blocking Policy

- If CI checks fail: Fix forward on the branch; do not merge. Verity pre-push/pre-commit findings are fixed, not waived (waive only for a human-accepted risk per project policy).
- If security checks fail: Treat as blocking. This change is itself a security fix; a new finding must be resolved before merge.
- If required reviews are blocked/stale: Re-request review; if `pr-review-toolkit:review-pr` stalls with no progress after 3 iterations, report remaining findings to the user and wait for guidance (per tasks rules).
- Escalation path and timeout: If blocked > 2 working days, escalate to the repo owner (dougis) with the specific blocker; the underlying issue #577 stays `in-progress` until resolved.

## Open Questions

- `ROLL_BODY_MAX_BYTES` default of 16 KiB — confirm or override (non-blocking; 16 KiB used unless changed).
- Whether to de-duplicate `readBoundedText` (monsters) against the new `readBoundedJson` now or leave as a later cleanup (leaning: leave it; out of scope).
- Confirm `rolls: []` should remain acceptable (current route behavior). Assumed yes; a scenario documents it.

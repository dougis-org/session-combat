## Context

- Relevant architecture: Mongo-native-driver storage layer in
  `lib/storage.ts`. All `Campaign` reads flow through `loadCampaigns()` /
  `loadCampaignById()`, both of which call `normalizeCampaign()` before
  returning documents to callers. `saveCampaign()` upserts the full object
  (minus `_id`) via `$set`, so any field present on the in-memory
  `Campaign` object persists without a dedicated write path.
- Dependencies: none — this change only touches `lib/types.ts` and
  `lib/storage.ts`. No new npm packages, no schema/index changes on the
  `campaigns` Mongo collection.
- Interfaces/contracts touched: the `Campaign` TypeScript interface
  (`lib/types.ts:603`) and the `normalizeCampaign()` function
  (`lib/storage.ts:56`). No API route or UI component is touched.

## Goals / Non-Goals

### Goals

- Add `encounterIds?: string[]` to `Campaign` as the many-to-many link to
  `Encounter.id`.
- Guarantee every `Campaign` object returned from the storage layer has a
  concrete `encounterIds` array (never `undefined`, `null`, or a
  non-array value), matching the existing guarantee already made for
  `chapters`.
- Keep the change purely additive: zero behavior change for any existing
  campaign beyond the new field appearing.

### Non-Goals

- Building the `/api/campaigns/[id]/encounters` routes.
- Any UI surfacing of encounters on a campaign.
- Enforcing referential integrity between `encounterIds` entries and
  actual `Encounter` documents (no encounter existence/ownership check at
  this layer — that belongs to the future link/unlink API routes, which
  will validate ownership before `$addToSet`).

## Decisions

### Decision 1: Field shape — `encounterIds?: string[]` (optional at the type level)

- Chosen: declare the field as optional (`encounterIds?: string[]`) on
  the `Campaign` interface, matching how `currentChapterId` and
  `templateId` are already declared as optional, rather than required.
- Alternatives considered: making it required (`encounterIds: string[]`)
  like `chapters`.
- Rationale: `chapters` is required because every code path that
  constructs a `Campaign` object already had to set it (it's core to
  what a campaign is). `encounterIds` is a newly-bolted-on link field;
  making it required would force every existing `Campaign`-construction
  call site (tests, seed scripts, template-to-campaign conversion, etc.)
  to be updated in this same change to satisfy the type checker, which
  is out of scope. Optional keeps the type change isolated to
  `lib/types.ts` and `lib/storage.ts` only.
- Trade-offs: call sites that read `campaign.encounterIds` directly
  (bypassing `normalizeCampaign()`) must handle `undefined`. This is
  acceptable because no such call sites exist yet — they'll be written in
  later issues, informed by this decision.

### Decision 2: Default via `normalizeCampaign()`, following the `chapters` pattern exactly

- Chosen: add one line to `normalizeCampaign()`:
  `encounterIds: Array.isArray(campaign.encounterIds) ? campaign.encounterIds : []`
  placed alongside the existing `chapters` line, which uses the identical
  `Array.isArray(...)` guard.
- Alternatives considered:
  1. A MongoDB migration script that backfills `encounterIds: []` onto
     every existing campaign document.
  2. Defaulting only with `campaign.encounterIds ?? []` (nullish
     coalescing, no array-type check).
- Rationale: (1) is unnecessary — `normalizeCampaign()` already
  intercepts every read path (`loadCampaigns`, `loadCampaignById`), so
  there is no scenario where a legacy doc reaches application code
  without normalization; a migration would add operational risk
  (write load, need for a rollback plan) for zero behavioral gain. (2) is
  rejected for consistency: the `chapters` field guards against
  non-array values with `Array.isArray`, not just nullish ones, and
  matching that exact style keeps `normalizeCampaign()` internally
  consistent and easy to scan.
- Trade-offs: none material. The `Array.isArray` check is marginally
  more defensive than `??` (also catches a malformed non-array value,
  e.g. a doc hand-edited in the Mongo shell), at negligible cost.

## Proposal to Design Mapping

- Proposal element: "Add `encounterIds?: string[]` to `Campaign` in
  `lib/types.ts`."
  - Design decision: Decision 1
  - Validation approach: TypeScript compiler (`tsc --noEmit`) confirms
    the interface change compiles; no existing call site breaks since the
    field is optional.
- Proposal element: "Default it to `[]` in `normalizeCampaign()` so
  existing campaign docs without the field normalize safely."
  - Design decision: Decision 2
  - Validation approach: unit test on `normalizeCampaign()` covering
    (a) doc missing the field, (b) doc with a valid `string[]`, (c) doc
    with a malformed non-array value.

## Functional Requirements Mapping

- Requirement: `Campaign` type includes `encounterIds?: string[]`.
  - Design element: Decision 1 (`lib/types.ts` interface change).
  - Acceptance criteria reference: proposal.md Scope > In Scope, item 1.
  - Testability notes: verified statically by the TypeScript compiler;
    no runtime test needed for the type declaration itself.
- Requirement: `normalizeCampaign()` returns `encounterIds: []` for
  legacy docs that predate the field.
  - Design element: Decision 2 (`lib/storage.ts` normalization line).
  - Acceptance criteria reference: proposal.md Scope > In Scope, item 2.
  - Testability notes: directly unit-testable — call `normalizeCampaign()`
    with a plain object missing `encounterIds` and assert the return
    value has `encounterIds: []`.
- Requirement: no behavior change for existing campaigns beyond the new
  field being present.
  - Design element: both decisions together — optional type + additive
    normalization line, no other line in `normalizeCampaign()` touched.
  - Acceptance criteria reference: proposal.md Acceptance criteria
    (via issue #535) / Scope.
  - Testability notes: existing `normalizeCampaign()` / storage test
    suite must continue to pass unmodified, proving `chapters`, `status`,
    `notes` defaulting behavior is untouched.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: no data migration required; legacy documents must
    normalize safely on every read without a one-time backfill step.
  - Design element: Decision 2 — normalization happens in-memory on
    every read, not via a stored migration.
  - Acceptance criteria reference: proposal.md Problem Space > Constraints.
  - Testability notes: unit test with a mock legacy doc object (no
    `encounterIds` key at all) proves this without touching a real
    database.

## Risks / Trade-offs

- Risk/trade-off: a future issue assumes `encounterIds` is always a
  concrete array on every `Campaign` object, including ones constructed
  outside `normalizeCampaign()` (tests, seed/fixture data, template
  instantiation).
  - Impact: `undefined.includes(...)` or similar runtime error if a
    downstream call site skips normalization.
  - Mitigation: keeping the field optional at the type level (Decision 1)
    means TypeScript will flag any downstream code that doesn't handle
    the possibly-missing case, surfacing the gap at compile time rather
    than runtime. Downstream issues should route through
    `normalizeCampaign()` or replicate its default explicitly.

## Rollback / Mitigation

- Rollback trigger: none anticipated — this is a purely additive,
  backward-compatible type and normalization change with no migration,
  no new API surface, and no UI change. If a regression were somehow
  observed, it would only be a TypeScript compile failure at a call site
  that assumed the field's presence/absence differently.
- Rollback steps: revert the two-line diff (`lib/types.ts`,
  `lib/storage.ts`). No data was written or migrated, so there is nothing
  to undo in MongoDB.
- Data migration considerations: none — no migration is performed as
  part of this change (see Decision 2).
- Verification after rollback: run the existing test suite; confirm
  `Campaign`/`normalizeCampaign()` behavior returns to its pre-change
  state.

## Operational Blocking Policy

- If CI checks fail: fix forward on this change's branch before merging;
  do not merge with a failing type-check or test run, since this change
  has no urgency that would justify bypassing CI.
- If security checks fail: not applicable — this change introduces no
  new external input, network call, or dependency; if a scanner still
  flags something, treat it as a false positive to triage before merge,
  not to bypass.
- If required reviews are blocked/stale: ping the reviewer directly;
  given the small, low-risk diff, escalate to any available maintainer
  rather than waiting indefinitely.
- Escalation path and timeout: if no review response within 1 business
  day, escalate to the repo owner (@dougis) directly, since this change
  blocks the rest of the campaign-encounter-linking issue sequence.

## Open Questions

- None. The design fully follows the pattern already established by
  `chapters`/`status`/`notes` in `normalizeCampaign()`, and the proposal
  raised no unresolved ambiguity.

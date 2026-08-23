## GitHub Issues

- #535

## Why

- Problem statement: `Campaign` has no relationship to `Encounter` at all.
  `CombatSetupView`'s "From Library" picker always fetches every encounter
  the user owns (`GET /api/encounters`, no filter), regardless of which
  campaign combat was started from. As a DM accumulates encounters across
  campaigns, this list becomes unusable.
- Why now: this is the first issue in a sequenced breakdown of the
  "Campaign-Aware Combat Start" design
  (`docs/superpowers/specs/2026-08-23-campaign-encounter-linking-design.md`,
  landed via PR #534). Every downstream piece (link/unlink API routes,
  campaign-scoped encounter picker, encounters-management screen) depends
  on this field existing on the `Campaign` document and type.
- Business/user impact: none directly user-visible yet — this issue only
  lays the data-model foundation. No behavior change for existing
  campaigns beyond the new field being present.

## Problem Space

- Current behavior: `Campaign` (`lib/types.ts:603`) has no `encounterIds`
  field. `normalizeCampaign()` (`lib/storage.ts:56`) defaults `chapters`,
  `status`, and `notes` for legacy docs but has no notion of encounters.
- Desired behavior: `Campaign` gains an optional `encounterIds: string[]`
  field (many-to-many link to `Encounter.id`, array lives on `Campaign`
  only — no reverse field on `Encounter`, no join collection).
  `normalizeCampaign()` defaults it to `[]` for documents that predate the
  field, following the exact pattern already used for `chapters`.
- Constraints:
  - Must not require a data migration — normalization happens on every
    read path (`loadCampaigns`, `loadCampaignById`), so legacy Mongo docs
    missing the field simply come back `undefined` and get defaulted in
    memory.
  - Must not change the shape or behavior of any other field.
  - Field is optional (`encounterIds?: string[]`) at the type level to
    reflect that not every in-flight object construction site sets it,
    but `normalizeCampaign()` guarantees it's always a concrete array by
    the time a `Campaign` leaves the storage layer.
- Assumptions:
  - `Party.campaignId` (single-FK-on-child) and this new
    `Campaign.encounterIds` (array-on-parent) are intentionally different
    linking patterns, per the design spec's own precedent note — encounters
    must be reusable across multiple campaigns, so a single reverse FK on
    `Encounter` wouldn't fit.
  - No other code currently reads or writes `encounterIds` — this issue
    only adds the field and its default; wiring (API routes, UI) is
    explicitly out of scope and covered by later issues in the sequence.
- Edge cases considered:
  - Legacy campaign doc with no `encounterIds` key at all → normalized to
    `[]`.
  - Campaign doc where `encounterIds` was somehow stored as a non-array
    (e.g. `null`, a string) → normalized to `[]`, matching the
    `Array.isArray(...)` guard style already used for `chapters`.
  - `saveCampaign()` spreads the full `Campaign` object into `$set`, so
    once `encounterIds` is present on an in-memory object it persists
    automatically — no separate save-path change needed.

## Scope

### In Scope

- Add `encounterIds?: string[]` to the `Campaign` interface in
  `lib/types.ts`.
- Default `encounterIds` to `[]` inside `normalizeCampaign()` in
  `lib/storage.ts`, using the same `Array.isArray(...)` guard pattern as
  the existing `chapters` field.
- Unit test coverage for `normalizeCampaign()`'s new default (legacy doc
  without the field, doc with a valid array, doc with a malformed value).

### Out of Scope

- Any new API route (`GET/POST/DELETE /api/campaigns/[id]/encounters`).
- Any UI change (encounters tab, "Start Combat" button relabel, campaign
  banner on `/combat`).
- Any change to the `Encounter` type or collection.
- Retroactive linking UX, campaign-scoped picker filtering in
  `CombatSetupView`/`useCombat`.
- These are all covered by later issues in the same sequenced breakdown.

## What Changes

- `lib/types.ts`: `Campaign` interface gains `encounterIds?: string[]`.
- `lib/storage.ts`: `normalizeCampaign()` gains an `encounterIds` default,
  mirroring the `chapters` default one line above it.

## Risks

- Risk: a future issue in the sequence assumes `encounterIds` is always
  present and array-typed on every `Campaign` object, including ones
  constructed outside the storage layer (e.g. in tests or seed scripts)
  that bypass `normalizeCampaign()`.
  - Impact: `TypeError` or silent `undefined` handling in downstream code
    that doesn't defensively check.
  - Mitigation: keep the field optional at the type level (documented
    above) so TypeScript forces call sites to handle the possibly-missing
    case; downstream issues that assume a concrete array should call
    `normalizeCampaign()` or apply their own default.
- Risk: none anticipated for existing data — this is additive-only and
  every read path already funnels through `normalizeCampaign()`.
  - Impact: n/a
  - Mitigation: n/a

## Open Questions

- No unresolved ambiguity. This issue was explored prior to proposal
  (see conversation context / issue #535), the design spec already
  specifies the exact type addition and normalization line to use, and no
  open questions were raised during that exploration.

## Non-Goals

- Building any of the downstream API routes, UI screens, or picker
  filtering described in the design spec — those are separate,
  dependent issues in the same breakdown.
- Changing the `Party.campaignId` linking pattern or reconciling it with
  this new array-based pattern.

## Change Control

If scope changes after proposal approval, update `proposal.md`,
`design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts.

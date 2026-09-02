## Context

- **Relevant architecture**:
  - `docs/campaign-encounter-rollout.md` partitions the 49 remaining
    campaigns into 5 groups. G1 (PR #647), G2 (PR #661), G3, and G4 are
    merged. G5 (this change) is the final group — 25 Classic & 3PP /
    legacy campaigns — completing the bulk-pass rollout.
  - The Vecna/G1/G2/G3/G4 pattern is the established convention: one
    `xxEncounters()` helper per campaign + one per-campaign contract test
    in `tests/unit/lib/scripts/seedCampaignTemplates.test.ts`.
  - `lib/data/customMonsters.ts` is the single source of truth for
    `CUSTOM_MONSTERS`. `findCustomMonsterById` and `toEncounterMonster(s)`
    are the typed helpers that build encounter monster instances with
    unique `id`s.
- **Dependencies**:
  - `fix-campaign-template-seed` change (PR #609/#610) — provides the
    `--force` flag on the seed script so existing campaigns can be upserted
    with new content.
  - `backfillCampaignEncounters.ts` (PR #591) — handles retroactive ingest
    for already-copied user campaigns.
  - Existing `CUSTOM_MONSTERS` from G1/G2/G3/G4 — G5 may reference shared
    elementals/undead/fiends defined in earlier groups.
- **Interfaces/contracts touched**:
  - `CAMPAIGN_CATALOG` entries for the 25 G5 campaigns (encounters arrays
    move from `[]` to fully-populated).
  - `CUSTOM_MONSTERS` registry (additive — no removals or modifications to
    existing entries).
  - `seedCampaignTemplates.ts` exports (additive — no signature changes).
  - `docs/campaign-encounter-rollout.md` Status header (transitions to
    "rollout complete").

## Goals / Non-Goals

### Goals

- Populate full encounter + monster data for the 25 G5 campaigns.
- Follow the existing `vecnaEncounters()` / `cosEncounters()` /
  `wdhEncounters()` pattern verbatim — no new helpers, no new conventions.
- Preserve the canonical `DamageType` invariant already specified by
  `openspec/specs/campaign-monsters/spec.md`.
- Cover every campaign with at least one contract test (chapter count,
  encounter count, full Monster blocks, unique instance ids).
- Maintain the "self-contained encounter" rule: any monster referenced by
  a G5 encounter must be defined either in `CUSTOM_MONSTERS` (this change)
  or already in the registry from G1-G4.
- Mark the bulk-pass rollout complete in
  `docs/campaign-encounter-rollout.md`.

### Non-Goals

- UI work on the encounters panel (#606, #607).
- Global Encounters Library feature (#578) — separate scope.
- Ingesting encounters into existing user campaigns — handled by
  `backfillCampaignEncounters.ts`.
- Splitting `customMonsters.ts` (deferred to a post-G5 follow-up PR).
- Adding new monster types beyond what's documented in the 5e SRD.

## Decisions

### Decision 1: Split G5 into 2-3 PRs (G5a, G5b, G5c)

- **Chosen**: Split G5 into 2-3 sub-group PRs based on campaign
  popularity / size.
- **Alternatives considered**:
  - Single mega-PR with all 25 campaigns.
  - One PR per campaign (25 PRs).
- **Rationale**: G5 has 25 campaigns and ~7,000 lines of customMonsters
  additions. Single PR exceeds reviewer bandwidth; 25 PRs is excessive
  coordination overhead. 2-3 sub-groups strike the balance.
- **Trade-offs**: 2-3 PRs add coordination overhead but keep each PR
  reviewable. Sub-groups can be merged sequentially without blocking on
  each other (no inter-campaign dependencies).

### Decision 2: 3PP stat blocks fit `MonsterTemplate` shape

- **Chosen**: 3PP campaigns (Drakkenheim, Hot Springs Island, etc.) use
  5e `MonsterTemplate` shape; non-5e fields (e.g., Drakkenheim
  contamination) are encoded in `traits[]` descriptions.
- **Alternatives considered**:
  - Extend `MonsterTemplate` to support 3PP-specific fields.
  - Skip 3PP-specific fields (lose info).
- **Rationale**: Extending `MonsterTemplate` is out of scope for this
  rollout (would break existing consumers). Encoding non-5e fields in
  `traits[].description` preserves the information without schema changes.
- **Trade-offs**: Some 3PP-specific mechanics are lost (e.g.,
  contamination levels). DM must track them manually.

### Decision 3: Pathfinder AP stat blocks converted to 5e

- **Chosen**: Empire of the Ghouls uses 5e stat-block conversions, with
  `source: "<campaign title> (5e)"`.
- **Alternatives considered**:
  - Use Pathfinder stat blocks directly (5e conversion).
  - Skip the conversion entirely (leave placeholders).
- **Rationale**: Same as G3/G4 Decision 3.
- **Trade-offs**: Pathfinder stat numbers don't translate 1:1; we follow
  the most-cited community 5e conversions. Document any deviations in
  the per-campaign encounter description.

### Decision 4: Defer `customMonsters.ts` split

- **Chosen**: Add new `cm-` entries to the existing single file; defer the
  per-campaign file split to a follow-up PR after G5 lands.
- **Alternatives considered**:
  - Split per-campaign into `lib/data/monsters/{g1,g2,g3,g4,g5}.ts` as
    part of this change.
  - Split per-monster-type (undead, fiend, elemental, etc.).
- **Rationale**: After G5, `customMonsters.ts` will exceed 22,000 lines —
  the split is urgent. But the split is its own PR-sized change; we don't
  want to bundle it with the G5 implementation. The `findCustomMonsterById`
  API is stable so consumers won't break.
- **Trade-offs**: `customMonsters.ts` reaches ~22,000+ lines after G5.
  Editor performance and diff size degrade; the follow-up split is
  necessary.

### Decision 5: Doc status transition to "rollout complete"

- **Chosen**: After G5 lands, update `docs/campaign-encounter-rollout.md`
  Status header to "rollout complete".
- **Alternatives considered**:
  - Leave the Status header as "in progress" indefinitely.
- **Rationale**: G5 is the final group; the rollout is complete. The doc
  accurately reflects the new state.
- **Trade-offs**: None.

## Proposal to Design Mapping

- **Proposal element**: Populate G5 catalog entries with non-empty
  encounter arrays.
  - **Design decision**: Decision 1.
  - **Validation approach**: Per-campaign contract test asserts
    `encounters.length > 0`.

- **Proposal element**: Add ~250-350 new `cm-` monsters.
  - **Design decision**: Decision 2, Decision 3, Decision 4.
  - **Validation approach**: TypeScript compile + eslint on
    `lib/data/customMonsters.ts`; manual review of CR ≥ 5 monsters
    against 5etools mirror.

- **Proposal element**: Update rollout doc to "rollout complete".
  - **Design decision**: Decision 5.
  - **Validation approach**: Manual review of the doc after G5 merge.

## Functional Requirements Mapping

- **Requirement**: Every G5 catalog entry has a non-empty `encounters`
  array.
  - **Design element**: Decision 1; per-campaign `xxEncounters()` helper.
  - **Acceptance criteria reference**: `populate-campaigns-g5/spec.md`
    §"G5 Encounter Population" scenarios.
  - **Testability notes**: `tests/unit/lib/scripts/seedCampaignTemplates.test.ts`
    per-campaign describe block verifies the array is non-empty.

- **Requirement**: Every encounter's `monsters` array contains full
  `Monster` stat blocks.
  - **Design element**: Decision 2; `findCustomMonsterById` +
    `toEncounterMonster(s)` helpers.
  - **Acceptance criteria reference**: `populate-campaigns-g5/spec.md`
    §"G5 Encounter Population" per-campaign scenarios.
  - **Testability notes**: Same per-campaign describe block iterates
    `monsters` and asserts non-zero `hp`, `ac`, `challengeRating`,
    `abilityScores`.

- **Requirement**: Every monster instance has a unique `id`.
  - **Design element**: `toEncounterMonster` mints a fresh `randomUUID()`
    per call.
  - **Acceptance criteria reference**:
    `populate-campaigns-g5/spec.md` §"G5 Encounter Population" — unique
    instance ids per campaign.
  - **Testability notes**: `assertCampaignEncounterContract` helper
    asserts `new Set(allIds).size === allIds.length`.

- **Requirement**: Rollout doc reflects "rollout complete".
  - **Design element**: Decision 5.
  - **Acceptance criteria reference**:
    `populate-campaigns-g5/spec.md` §"G5 Encounter Population" — rollout
    complete.
  - **Testability notes**: Manual review.

## Non-Functional Requirements Mapping

- **Requirement category**: performance
  - **Requirement**: Encounter copy latency unchanged.
  - **Design element**: Existing `findCustomMonsterById` is O(n); a future
    PR (post-G5 split) can index by id if needed.
  - **Acceptance criteria reference**: No regression in PR copy latency
    tests.
  - **Testability notes**: Existing integration tests cover copy latency
    budget.

- **Requirement category**: security
  - **Requirement**: No new attack surface.
  - **Design element**: Additive changes only — no new endpoints, no new
    input shapes.
  - **Acceptance criteria reference**: No new security findings from
    Codacy SAST / Snyk.
  - **Testability notes**: Codacy static analysis on the changed files.

- **Requirement category**: reliability
  - **Requirement**: Seed script fails fast on missing monster references.
  - **Design element**: `findCustomMonsterById` throws if id not found;
    every encounter passes through it.
  - **Acceptance criteria reference**: Test suite passes for all 25 G5
    campaigns; CI catches missing references.
  - **Testability notes**: Existing test scaffolding exercises the
    contract via per-campaign describe blocks.

## Risks / Trade-offs

- **Risk/trade-off**: G5 review burden (25 campaigns, ~7,000 lines).
  - **Impact**: high (PR review fatigue).
  - **Mitigation**: Split into 2-3 sub-group PRs (Decision 1).

- **Risk/trade-off**: 3PP stat blocks don't fit 5e `MonsterTemplate`
  cleanly.
  - **Impact**: medium (some 3PP mechanics lost).
  - **Mitigation**: Encode non-5e fields in `traits[].description`
    (Decision 2).

- **Risk/trade-off**: Pathfinder-to-5e stat block fidelity (Empire of
  the Ghouls).
  - **Impact**: medium (DM-facing).
  - **Mitigation**: Document any deviations in encounter description.

- **Risk/trade-off**: Stale `customMonsters.ts` performance (~22,000
  lines).
  - **Impact**: high (file size, editor performance).
  - **Mitigation**: Decision 4 follow-up split PR after G5 lands.

## Rollback / Mitigation

- **Rollback trigger**: G5 PR introduces a regression (failing tests,
  lint errors, broken existing encounter copy path).
- **Rollback steps**:
  1. `git revert <merge-commit>` to remove the G5 PR(s).
  2. Run `npm run seed -- --force` to restore the previous encounter
     state in any DB that had been updated.
  3. Verify with `npm run test:unit`.
- **Data migration considerations**: G5 is additive — no schema migration.
  Existing user campaigns are unaffected until the seed script is re-run
  with `--force`. A bad release can be reverted by reverting the commit
  and re-running the seed script.
- **Verification after rollback**: All existing tests pass; the 25 G5
  campaign catalog entries revert to placeholder encounters.

## Operational Blocking Policy

- **If CI checks fail**: Address the failure in code (do not skip). If the
  failure is environmental (e.g. transient Mongo connection), retry
  once; otherwise fix and re-push.
- **If security checks fail**: Address before merge. Codacy findings
  flagged as "potential" can be addressed with a code comment; "warning"
  findings must be resolved.
- **If required reviews are blocked/stale**: After 3 attempts to address
  review feedback with no progress, report the stall to the user with the
  remaining findings listed. Do not force-merge.
- **Escalation path and timeout**: Report to user after the 3-attempt
  threshold. No autonomous force-merge.

## Open Questions

None at this time. The G5 split-decision is captured in Decision 1 above.

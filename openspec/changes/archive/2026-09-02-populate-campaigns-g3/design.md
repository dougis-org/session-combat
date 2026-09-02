## Context

- **Relevant architecture**:
  - `docs/campaign-encounter-rollout.md` partitions the 49 remaining
    campaigns into 5 groups. G1 (PR #647), G2 (PR #661), and the Vecna pilot
    (PR #615) are merged. G3 (this change) covers the Planar & non-Realms
    cluster — 6 campaigns across Elemental Evil, Icewind Dale, the Feywild,
    Pathfinder APs ported to 5e, and a 3.5e AP.
  - The Vecna/G1/G2 pattern is the established convention: one
    `xxEncounters()` helper per campaign + one per-campaign contract test
    in `tests/unit/lib/scripts/seedCampaignTemplates.test.ts`.
  - `lib/data/customMonsters.ts` is the single source of truth for
    `CUSTOM_MONSTERS`. `findCustomMonsterById` and `toEncounterMonster(s)`
    are the typed helpers that build encounter monster instances with unique
    `id`s.
- **Dependencies**:
  - `fix-campaign-template-seed` change (PR #609/#610) — provides the
    `--force` flag on the seed script so existing campaigns can be upserted
    with new content.
  - `backfillCampaignEncounters.ts` (PR #591) — handles retroactive ingest
    for already-copied user campaigns.
  - Existing `CUSTOM_MONSTERS` from G1/G2 — G3 may reference shared
    elementals/undead/fiends defined in earlier groups.
- **Interfaces/contracts touched**:
  - `CAMPAIGN_CATALOG` entries for the 6 G3 campaigns (encounters arrays
    move from `[]` to fully-populated).
  - `CUSTOM_MONSTERS` registry (additive — no removals or modifications to
    existing entries).
  - `seedCampaignTemplates.ts` exports (additive — no signature changes).

## Goals / Non-Goals

### Goals

- Populate full encounter + monster data for the 6 G3 campaigns.
- Follow the existing `vecnaEncounters()` / `cosEncounters()` /
  `wdhEncounters()` pattern verbatim — no new helpers, no new conventions.
- Preserve the canonical `DamageType` invariant already specified by
  `openspec/specs/campaign-monsters/spec.md`.
- Cover every campaign with at least one contract test (chapter count,
  encounter count, full Monster blocks, unique instance ids).
- Maintain the "self-contained encounter" rule: any monster referenced by
  a G3 encounter must be defined either in `CUSTOM_MONSTERS` (this change)
  or already in the registry from G1/G2.

### Non-Goals

- UI work on the encounters panel (#606, #607).
- Global Encounters Library feature (#578) — separate scope.
- Ingesting encounters into existing user campaigns — handled by
  `backfillCampaignEncounters.ts`.
- G4 (Anthologies/APs), G5 (Classic/legacy/3PP) — separate changes per
  group.
- Refactoring `CUSTOM_MONSTERS` into per-campaign files — deferred until
  after G5 lands.

## Decisions

### Decision 1: One PR per group (not per campaign)

- **Chosen**: Single commit per campaign, single PR per group (6 commits, 1
  PR).
- **Alternatives considered**:
  - 6 separate PRs (one per campaign).
  - Single mega-commit with all 6 campaigns at once.
- **Rationale**: Matches G1 and G2 precedent and the per-group rollout plan
  in `docs/campaign-encounter-rollout.md`. Per-campaign split creates 6x
  review overhead with no quality benefit. Single mega-commit makes bisect
  useless.
- **Trade-offs**: Reviewers must read a large PR (~3,000+ lines) but get
  one-shot approval; per-campaign split would let reviewers approve in
  small batches but at higher coordination cost.

### Decision 2: Campaign-specific antagonists inlined as `cm-` monsters

- **Chosen**: Each campaign gets its unique antagonists as inline `cm-`
  entries with `source: "<campaign title>"`.
- **Alternatives considered**:
  - Reference open5e adapter for SRD creatures only, inline custom NPCs.
  - Split per-campaign into separate files.
- **Rationale**: The open5e SRD doesn't include campaign-exclusive NPCs like
  Auril (Rime), the Hourglass Coven (Witchlight), or the four Elemental
  Princes (PotA). SRD mirrors (elementals, fiends, etc.) are inlined rather
  than referenced so encounters remain self-contained per the rollout doc
  architecture.
- **Trade-offs**: `CUSTOM_MONSTERS` keeps growing. The future
  per-campaign-file refactor (Decision 4) will reduce that.

### Decision 3: Pathfinder AP stat blocks converted to 5e

- **Chosen**: Curse of the Crimson Throne and Hell's Rebels use 5e
  stat-block conversions (matching how 5e conversion guides present them),
  with `source: "<campaign title> (5e)"`.
- **Alternatives considered**:
  - Use Pathfinder stat blocks directly (5e conversion).
  - Skip the conversion entirely (leave placeholders).
- **Rationale**: Both APs are listed in `CAMPAIGN_CATALOG` as 5e products
  (published by Paizo with 5e conversion support). Skipping would leave
  the catalogs inconsistent with the rest of the rollout.
- **Trade-offs**: Pathfinder stat numbers don't translate 1:1; we follow
  the most-cited community 5e conversions. Document any deviations in the
  per-campaign encounter description.

### Decision 4: No `CUSTOM_MONSTERS` file split

- **Chosen**: Add new `cm-` entries to the existing single file.
- **Alternatives considered**:
  - Split per-campaign into `lib/data/monsters/{g1,g2,g3,g4,g5}.ts`.
  - Split per-monster-type (undead, fiend, elemental, etc.).
- **Rationale**: Both refactors add risk to G3 implementation. A future PR
  (post-G5) can split the file once the registry stabilizes. The
  `findCustomMonsterById` API is stable so consumers won't break.
- **Trade-offs**: `customMonsters.ts` reaches ~10,000+ lines after G3.
  Editor performance and diff size degrade but remain workable.

## Proposal to Design Mapping

- **Proposal element**: Populate G3 catalog entries with non-empty
  encounter arrays.
  - **Design decision**: Decision 1, Decision 2.
  - **Validation approach**: Per-campaign contract test asserts
    `encounters.length > 0` and every encounter has a non-empty `monsters`
    array.

- **Proposal element**: Add ~80-120 new `cm-` monsters.
  - **Design decision**: Decision 2, Decision 4.
  - **Validation approach**: TypeScript compile + eslint on
    `lib/data/customMonsters.ts`; manual review of CR ≥ 5 monsters
    against 5etools mirror.

- **Proposal element**: Pathfinder stat blocks converted to 5e.
  - **Design decision**: Decision 3.
  - **Validation approach**: Encounter description includes a `(5e
    conversion)` note for affected encounters; per-campaign test covers
    the encounter but not the conversion fidelity (out of scope).

## Functional Requirements Mapping

- **Requirement**: Every G3 catalog entry has a non-empty `encounters`
  array.
  - **Design element**: Decision 1; per-campaign `xxEncounters()` helper.
  - **Acceptance criteria reference**: `populate-campaigns-g3/spec.md`
    §"G3 Encounter Population" scenarios.
  - **Testability notes**: `tests/unit/lib/scripts/seedCampaignTemplates.test.ts`
    per-campaign describe block verifies the array is non-empty.

- **Requirement**: Every encounter's `monsters` array contains full
  `Monster` stat blocks.
  - **Design element**: Decision 2; `findCustomMonsterById` +
    `toEncounterMonster(s)` helpers.
  - **Acceptance criteria reference**: `populate-campaigns-g3/spec.md`
    §"G3 Encounter Population" per-campaign scenarios.
  - **Testability notes**: Same per-campaign describe block iterates
    `monsters` and asserts non-zero `hp`, `ac`, `challengeRating`,
    `abilityScores`.

- **Requirement**: Every monster instance has a unique `id`.
  - **Design element**: `toEncounterMonster` mints a fresh `randomUUID()`
    per call.
  - **Acceptance criteria reference**:
    `populate-campaigns-g3/spec.md` §"G3 Encounter Population" — unique
    instance ids per campaign.
  - **Testability notes**: `assertCampaignEncounterContract` helper
    asserts `new Set(allIds).size === allIds.length`.

## Non-Functional Requirements Mapping

- **Requirement category**: performance
  - **Requirement**: Encounter copy latency unchanged (the per-encounter
    monster count doesn't increase).
  - **Design element**: Existing `findCustomMonsterById` is O(n); a future
    PR can index by id if needed.
  - **Acceptance criteria reference**: No regression in PR copy latency
    tests.
  - **Testability notes**: Existing integration tests cover copy latency
    budget (15 encounters / 500ms).

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
  - **Acceptance criteria reference**: Test suite passes for all 6 G3
    campaigns; CI catches missing references.
  - **Testability notes**: Existing test scaffolding exercises the
    contract via per-campaign describe blocks.

## Risks / Trade-offs

- **Risk/trade-off**: Pathfinder-to-5e stat block fidelity.
  - **Impact**: medium (DM-facing; encounter difficulty may differ from
    original AP playtest).
  - **Mitigation**: Document any deviations in the encounter description;
    flag affected encounters with a `(5e conversion)` note in the
    description string.

- **Risk/trade-off**: Elemental Evil creature count (PotA has 80+
  elementals of various CRs).
  - **Impact**: medium (file size + review burden).
  - **Mitigation**: Use `toEncounterMonsters(template, n)` for repeated
    elementals; only add new `cm-` entries for unique variants.

- **Risk/trade-off**: Stale `customMonsters.ts` performance (~10,000
  lines).
  - **Impact**: low (manageable).
  - **Mitigation**: Decision 4 defer-and-refactor plan.

## Rollback / Mitigation

- **Rollback trigger**: G3 PR introduces a regression (failing tests,
  lint errors, broken existing encounter copy path).
- **Rollback steps**:
  1. `git revert <merge-commit>` to remove the G3 PR.
  2. Run `npm run seed -- --force` to restore the previous encounter
     state in any DB that had been updated.
  3. Verify with `npm run test:unit`.
- **Data migration considerations**: G3 is additive — no schema migration.
  Existing user campaigns are unaffected until the seed script is re-run
  with `--force`. A bad release can be reverted by reverting the commit
  and re-running the seed script.
- **Verification after rollback**: All existing tests pass; the 6 G3
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

None at this time. Research is complete for all 6 G3 campaigns in
`docs/research/`.

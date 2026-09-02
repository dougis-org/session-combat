## Context

- **Relevant architecture**:
  - `docs/campaign-encounter-rollout.md` partitions the 49 remaining
    campaigns into 5 groups. G1 (PR #647), G2 (PR #661), and G3 (this
    wave + previous) are merged. G4 covers the Anthologies & APs cluster
    — 9 campaigns spanning reprinted 5e hardcovers, OSR-to-5e conversions,
    and Pathfinder APs ported to 5e.
  - The Vecna/G1/G2/G3 pattern is the established convention: one
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
  - Existing `CUSTOM_MONSTERS` from G1/G2/G3 — G4 may reference shared
    elementals/undead/fiends defined in earlier groups.
- **Interfaces/contracts touched**:
  - `CAMPAIGN_CATALOG` entries for the 9 G4 campaigns (encounters arrays
    move from `[]` to fully-populated).
  - `CUSTOM_MONSTERS` registry (additive — no removals or modifications to
    existing entries).
  - `seedCampaignTemplates.ts` exports (additive — no signature changes).

## Goals / Non-Goals

### Goals

- Populate full encounter + monster data for the 9 G4 campaigns.
- Follow the existing `vecnaEncounters()` / `cosEncounters()` /
  `wdhEncounters()` pattern verbatim — no new helpers, no new conventions.
- Preserve the canonical `DamageType` invariant already specified by
  `openspec/specs/campaign-monsters/spec.md`.
- Cover every campaign with at least one contract test (chapter count,
  encounter count, full Monster blocks, unique instance ids).
- Maintain the "self-contained encounter" rule: any monster referenced by
  a G4 encounter must be defined either in `CUSTOM_MONSTERS` (this change)
  or already in the registry from G1/G2/G3.

### Non-Goals

- UI work on the encounters panel (#606, #607).
- Global Encounters Library feature (#578) — separate scope.
- Ingesting encounters into existing user campaigns — handled by
  `backfillCampaignEncounters.ts`.
- G5 (Classic/legacy/3PP) — separate change.
- Refactoring `CUSTOM_MONSTERS` into per-campaign files — deferred until
  after G5 lands.

## Decisions

### Decision 1: One PR per group, possibly split for Mad Mage

- **Chosen**: Single commit per campaign, single PR per group (9 commits,
  1 PR).
- **Alternatives considered**:
  - 9 separate PRs (one per campaign).
  - Split Mad Mage into 2 PRs (levels 1-10 and levels 11-23).
  - Single mega-commit with all 9 campaigns at once.
- **Rationale**: Matches G1/G2/G3 precedent. Mad Mage is the largest
  single campaign (23 levels, 80+ encounters) — if the review burden is
  too heavy, splitting Mad Mage into 2 PRs is acceptable.
- **Trade-offs**: Reviewers must read a large PR (~5,000+ lines) but get
  one-shot approval; per-campaign split would let reviewers approve in
  small batches but at higher coordination cost.

### Decision 2: Yawning Portal uses original stat blocks

- **Chosen**: Tales from the Yawning Portal reprints classic adventures;
  encounters reference the original monsters (Acererak, Vecna, etc.) per
  the source material, not 5e conversions.
- **Alternatives considered**:
  - Convert all classic monsters to 5e stat blocks.
  - Reference the global SRD library only.
- **Rationale**: DMs playing Yawning Portal expect the original stat
  blocks; the `cm-` prefix convention allows both 5e and classic stat
  blocks to coexist.
- **Trade-offs**: Some Yawning Portal encounters may reference monsters
  with non-5e stat block fields — verify they fit the `MonsterTemplate`
  shape before adding.

### Decision 3: Pathfinder AP stat blocks converted to 5e

- **Chosen**: Rise of the Runelords, Kingmaker, and Wrath of the Righteous
  use 5e stat-block conversions, with `source: "<campaign title> (5e)"`.
- **Alternatives considered**:
  - Use Pathfinder stat blocks directly (5e conversion).
  - Skip the conversion entirely (leave placeholders).
- **Rationale**: Same as G3 Decision 3. All three APs are listed in
  `CAMPAIGN_CATALOG` as 5e products.
- **Trade-offs**: Pathfinder stat numbers don't translate 1:1; we follow
  the most-cited community 5e conversions. Document any deviations in the
  per-campaign encounter description.

### Decision 4: No `CUSTOM_MONSTERS` file split

- **Chosen**: Add new `cm-` entries to the existing single file.
- **Alternatives considered**:
  - Split per-campaign into `lib/data/monsters/{g1,g2,g3,g4,g5}.ts`.
  - Split per-monster-type (undead, fiend, elemental, etc.).
- **Rationale**: Both refactors add risk to G4 implementation. A future
  PR (post-G5) can split the file once the registry stabilizes. The
  `findCustomMonsterById` API is stable so consumers won't break.
- **Trade-offs**: `customMonsters.ts` reaches ~15,000+ lines after G4.
  Editor performance and diff size degrade but remain workable.

## Proposal to Design Mapping

- **Proposal element**: Populate G4 catalog entries with non-empty
  encounter arrays.
  - **Design decision**: Decision 1, Decision 2.
  - **Validation approach**: Per-campaign contract test asserts
    `encounters.length > 0` and every encounter has a non-empty `monsters`
    array.

- **Proposal element**: Add ~150-200 new `cm-` monsters.
  - **Design decision**: Decision 2, Decision 3, Decision 4.
  - **Validation approach**: TypeScript compile + eslint on
    `lib/data/customMonsters.ts`; manual review of CR ≥ 5 monsters
    against 5etools mirror.

- **Proposal element**: Pathfinder stat blocks converted to 5e.
  - **Design decision**: Decision 3.
  - **Validation approach**: Encounter description includes a `(5e
    conversion)` note for affected encounters.

## Functional Requirements Mapping

- **Requirement**: Every G4 catalog entry has a non-empty `encounters`
  array.
  - **Design element**: Decision 1; per-campaign `xxEncounters()` helper.
  - **Acceptance criteria reference**: `populate-campaigns-g4/spec.md`
    §"G4 Encounter Population" scenarios.
  - **Testability notes**: `tests/unit/lib/scripts/seedCampaignTemplates.test.ts`
    per-campaign describe block verifies the array is non-empty.

- **Requirement**: Every encounter's `monsters` array contains full
  `Monster` stat blocks.
  - **Design element**: Decision 2; `findCustomMonsterById` +
    `toEncounterMonster(s)` helpers.
  - **Acceptance criteria reference**: `populate-campaigns-g4/spec.md`
    §"G4 Encounter Population" per-campaign scenarios.
  - **Testability notes**: Same per-campaign describe block iterates
    `monsters` and asserts non-zero `hp`, `ac`, `challengeRating`,
    `abilityScores`.

- **Requirement**: Every monster instance has a unique `id`.
  - **Design element**: `toEncounterMonster` mints a fresh `randomUUID()`
    per call.
  - **Acceptance criteria reference**:
    `populate-campaigns-g4/spec.md` §"G4 Encounter Population" — unique
    instance ids per campaign.
  - **Testability notes**: `assertCampaignEncounterContract` helper
    asserts `new Set(allIds).size === allIds.length`.

## Non-Functional Requirements Mapping

- **Requirement category**: performance
  - **Requirement**: Encounter copy latency unchanged.
  - **Design element**: Existing `findCustomMonsterById` is O(n); a future
    PR can index by id if needed.
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
  - **Acceptance criteria reference**: Test suite passes for all 9 G4
    campaigns; CI catches missing references.
  - **Testability notes**: Existing test scaffolding exercises the
    contract via per-campaign describe blocks.

## Risks / Trade-offs

- **Risk/trade-off**: Mad Mage review burden (80+ encounters).
  - **Impact**: medium (longer PR review cycle).
  - **Mitigation**: Split Mad Mage into 2 PRs if necessary (Decision 1).

- **Risk/trade-off**: Pathfinder-to-5e stat block fidelity (Runelords,
  Kingmaker, WotR).
  - **Impact**: medium (DM-facing; encounter difficulty may differ).
  - **Mitigation**: Document any deviations in encounter description.

- **Risk/trade-off**: Stale `customMonsters.ts` performance (~15,000
  lines).
  - **Impact**: low (manageable).
  - **Mitigation**: Decision 4 defer-and-refactor plan.

## Rollback / Mitigation

- **Rollback trigger**: G4 PR introduces a regression (failing tests,
  lint errors, broken existing encounter copy path).
- **Rollback steps**:
  1. `git revert <merge-commit>` to remove the G4 PR.
  2. Run `npm run seed -- --force` to restore the previous encounter
     state in any DB that had been updated.
  3. Verify with `npm run test:unit`.
- **Data migration considerations**: G4 is additive — no schema migration.
  Existing user campaigns are unaffected until the seed script is re-run
  with `--force`. A bad release can be reverted by reverting the commit
  and re-running the seed script.
- **Verification after rollback**: All existing tests pass; the 9 G4
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

None at this time. Research is complete for all 9 G4 campaigns in
`docs/research/`.

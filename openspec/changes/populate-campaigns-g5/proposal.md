## GitHub Issues

- #581 — Ingest Encounter Content for Existing Campaigns

## Why

- **Problem statement**: Group 5 of the bulk campaign encounter rollout (per
  `docs/campaign-encounter-rollout.md`) covers 25 Classic & 3PP / legacy
  campaigns that currently ship with placeholder encounters and no
  campaign-specific monsters. Each must be populated with full `Monster`
  stat blocks before newly-copied campaigns are immediately playable.
- **Why now**: Vecna (PR #615), G1 (PR #647), G2 (PR #661), G3, and G4
  follow a documented sequence in the rollout plan. G5 is the final group
  in the bulk-pass plan; it completes the 49-campaign rollout.
- **Business/user impact**: Dungeon Masters copying G5 campaigns get empty
  encounter arrays and must hand-author every encounter before play. After
  G5 ships, every campaign in the catalog ships with the same
  out-of-the-box playability as the rest of the rollout.

## Problem Space

- **Current behavior**: G5 catalog entries in `CAMPAIGN_CATALOG` reference
  placeholder encounters (`{ name, description, monsters: [] }`) and the
  `CUSTOM_MONSTERS` registry contains zero entries tagged with a G5
  campaign title in their `source` field.
- **Desired behavior**: Each G5 catalog entry ships with a non-empty
  `encounters` array where every encounter's `monsters` array contains full
  `Monster` stat blocks built via `findCustomMonsterById` +
  `toEncounterMonster(s)` so every instance has a unique `id`.
- **Constraints**:
  - Follow the `vecnaEncounters()` / `cosEncounters()` / `wdhEncounters()`
    pattern verbatim — no new helpers, no new conventions.
  - Canonical `DamageType` values only (no descriptive strings in
    `damageResistances` / `damageImmunities` / `damageVulnerabilities`).
  - `passive Perception` is a string, not a number.
  - No `as any` casts, no `eslint-disable` comments.
  - G5 is the **largest** group by campaign count (25); review burden is
    significant.
- **Assumptions**:
  - The PR #620 research markdown under `docs/research/` is authoritative
    for chapter lists and monster rosters. We do not re-research.
  - 3PP (third-party publisher) campaigns (Drakkenheim, Hot Springs
    Island, Scarlet Citadel, Courts of the Shadow Fey) follow the same
    stat-block conventions as WotC 5e products.
  - Legacy 3.5e / Pathfinder conversions follow the same 5e conversion
    pattern as G3/G4.
- **Edge cases considered**:
  - **File size**: `customMonsters.ts` will exceed 20,000 lines after G5
    lands — the per-campaign-file refactor becomes urgent. Decision 4
    defers this to a follow-up PR.
  - **Drakkenheim**: 3PP setting with contamination system — stat blocks
    use 5e conventions but include contamination mechanics as `traits[]`.
  - **Return to Tomb of Horrors**: classic AD&D module ported to 5e —
    Acererak stat block follows 5e conventions.
  - **Hot Springs Island**: hexcrawl with procedural encounters — use the
    research-file encounter table directly.
  - **Spelljammer**: planar travel setting — monsters span multiple worlds.

## Scope

### In Scope

- **25 G5 campaigns**: Age of Worms, Dungeons of Drakkenheim, Dark of Hot
  Springs Island, Scarlet Citadel, Courts of the Shadow Fey, Vault of the
  Drow, Shackled City, Reavers of Harkenwold, The Lost City, Turn of
  Fortune's Wheel, Dragonlance: Shadow of the Dragon Queen, Empire of the
  Ghouls, Temple of Elemental Evil, Keep on the Borderlands, Points of
  Light, Night Below, Return to Temple of Elemental Evil, Desert of
  Desolation, Queen of the Spiders, Against the Cult of the Reptile God,
  Spelljammer: Light of Xaryxis, Expedition to the Barrier Peaks, Return
  to the Tomb of Horrors, Savage Tide, Expedition.
- ~250-350 new `cm-` monsters covering campaign-specific antagonists and SRD
  mirrors needed for encounter references.
- 25 per-campaign encounter helpers.
- 25 per-campaign contract tests in `seedCampaignTemplates.test.ts`.
- Updates to `docs/campaign-encounter-rollout.md` status table.
- Follow-up split of `customMonsters.ts` into per-campaign files
  (deferred to a separate PR after G5 lands).

### Out of Scope

- UI work on the encounters panel (#606, #607).
- Global Encounters Library feature (#578) — separate scope.
- Ingesting encounters into existing user campaigns — handled by
  `backfillCampaignEncounters.ts` (PR #591).
- Renaming or removing existing `cm-` monsters from G1-G4.

## What Changes

- **`lib/data/customMonsters.ts`** (+~7,000 lines estimated): new `cm-`
  monsters for all 25 G5 campaigns. Includes classic monsters (Acererak
  for Return to Tomb of Horrors, Kyuss for Age of Worms, Iuz for
  3.5e-era campaigns, Lolth reprints, etc.), 3PP antagonists
  (Drakkenheim contamination bosses), and legacy module conversions.
- **`lib/scripts/seedCampaignTemplates.ts`** (+~1,500 lines estimated): 25
  new per-campaign encounter helpers. Each encounter built from
  `findCustomMonsterById` + `toEncounterMonster(s)` with unique per-instance
  ids. Catalog `makeTemplate` calls rewired to invoke the helpers.
- **`tests/unit/lib/scripts/seedCampaignTemplates.test.ts`** (+~250 lines):
  25 new per-campaign contract tests verifying chapter count, encounter
  count, full Monster blocks, unique instance ids.
- **`docs/campaign-encounter-rollout.md`**: status table updated for the 25
  G5 entries to reflect new monster counts and PR number. The "Status"
  header transitions to "rollout complete".
- **No new dependencies.**
- **No breaking changes** — campaigns already in the database are
  unaffected until the seed script is run with `--force` (provided by the
  already-merged `fix-campaign-template-seed` change, PR #609/#610).

## Risks

- **Risk**: G5 is the largest group by campaign count (25). Single PR
  may exceed reviewer bandwidth.
  - **Impact**: high (PR review fatigue).
  - **Mitigation**: split G5 into 2-3 PRs (sub-groups G5a, G5b, G5c). For
    example: G5a = top 8 campaigns by popularity; G5b = next 10; G5c =
    remaining 7.
- **Risk**: 3PP stat blocks may have non-5e field shapes (Drakkenheim
  contamination, Hot Springs Island procedural tags).
  - **Impact**: medium (must fit the `MonsterTemplate` shape).
  - **Mitigation**: research files flag non-standard fields; document in
    encounter description; ignore non-5e fields that don't fit the schema.
- **Risk**: Pathfinder AP stat blocks (Empire of the Ghouls) lack clean 5e
  mappings.
  - **Impact**: low-medium (DM-facing).
  - **Mitigation**: follow most-cited community 5e conversions; document
    deviations in encounter description.
- **Risk**: File size growth on `customMonsters.ts` (now ~22,000+ lines
  after G5 lands).
  - **Impact**: high (file size, editor performance, diff size).
  - **Mitigation**: a follow-up PR after G5 splits `customMonsters.ts`
    into per-campaign files. The `findCustomMonsterById` API stays the
    same.

## Open Questions

None at this time. The G5 split-decision is documented in `design.md`
Decision 1 (split into 2-3 sub-group PRs by campaign popularity / size) and
reflected in `tasks.md` Preparation Step 2. The default split into 3 PRs
(G5a, G5b, G5c) can be overridden during the apply phase if needed.

## Non-Goals

- Renaming or removing existing `cm-` monsters from G1-G4.
- Changing the encounter format (EncounterTemplate shape stays the same).
- Splitting `customMonsters.ts` (deferred to a post-G5 follow-up PR).
- Anything that touches the encounter UI (#606, #607).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

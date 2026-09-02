## GitHub Issues

- #581 — Ingest Encounter Content for Existing Campaigns

## Why

- **Problem statement**: Group 4 of the bulk campaign encounter rollout (per
  `docs/campaign-encounter-rollout.md`) covers 9 anthology / adventure-path /
  OSR-to-5e campaigns that currently ship with placeholder encounters and no
  campaign-specific monsters. Each must be populated with full `Monster` stat
  blocks before newly-copied campaigns are immediately playable.
- **Why now**: Vecna (PR #615), G1 (PR #647), G2 (PR #661), and G3 (this
  wave) follow a documented sequence in the rollout plan. G4 is the next
  logical group after G3 lands; deferring pushes the remaining 16 campaigns
  further out.
- **Business/user impact**: Dungeon Masters copying G4 campaigns get empty
  encounter arrays and must hand-author every encounter before play. After
  G4 ships, they get the same out-of-the-box playability G1/G2/G3 already
  provide.

## Problem Space

- **Current behavior**: G4 catalog entries in `CAMPAIGN_CATALOG` reference
  placeholder encounters (`{ name, description, monsters: [] }`) and the
  `CUSTOM_MONSTERS` registry contains zero entries tagged with a G4 campaign
  title in their `source` field.
- **Desired behavior**: Each G4 catalog entry ships with a non-empty
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
- **Assumptions**:
  - The PR #620 research markdown under `docs/research/` is authoritative
    for chapter lists and monster rosters. We do not re-research.
  - Anthology campaigns (Candlekeep, Radiant Citadel, Golden Vault, Yawning
    Portal) have independent one-shot adventures — each adventure gets its
    own encounter(s).
  - Saltmarsh and Mad Mage are reprinted 5e hardcover adventures with full
    stat blocks in the open SRD where applicable.
  - Rise of the Runelords, Kingmaker, and Wrath of the Righteous are
    Pathfinder APs ported to 5e — same 5e conversion treatment as CotCT/HR
    in G3.
- **Edge cases considered**:
  - Yawning Portal reprints classic adventures (Tomb of Horrors, White
    Plume Mountain, etc.) — encounters reference the original monsters,
    not 5e versions.
  - Radiant Citadel adventures are set in the Radiant Citadel itself and
    visit other settings — monsters span multiple types.
  - Mad Mage has 23 levels with ~80+ encounters — file size and review
    burden must be managed carefully.
  - Pathfinder AP stat blocks don't translate 1:1 to 5e — document any
    deviations in encounter descriptions.

## Scope

### In Scope

- **9 G4 campaigns**: Candlekeep Mysteries, Journeys Through the Radiant
  Citadel, Keys from the Golden Vault, Tales from the Yawning Portal, Ghosts
  of Saltmarsh, Waterdeep: Dungeon of the Mad Mage, Rise of the Runelords,
  Kingmaker, Wrath of the Righteous.
- ~150-200 new `cm-` monsters covering campaign-specific antagonists and SRD
  mirrors needed for encounter references.
- 9 per-campaign encounter helpers (`candlekeepEncounters`,
  `radiantCitadelEncounters`, `goldenVaultEncounters`, `yawningPortalEncounters`,
  `saltmarshEncounters`, `madMageEncounters`, `runelordsEncounters`,
  `kingmakerEncounters`, `wrathOfTheRighteousEncounters`).
- 9 per-campaign contract tests in `seedCampaignTemplates.test.ts`.
- Updates to `docs/campaign-encounter-rollout.md` status table.

### Out of Scope

- UI work on the encounters panel (#606, #607).
- Global Encounters Library feature (#578) — separate scope.
- Ingesting encounters into existing user campaigns — handled by
  `backfillCampaignEncounters.ts` (PR #591).
- G5 (Classic/legacy/3PP) — separate change.
- Any new monster types beyond what's documented in the 5e SRD.
- Splitting `customMonsters.ts` into per-campaign files (deferred until
  after G5).

## What Changes

- **`lib/data/customMonsters.ts`** (+~5,000 lines estimated): new `cm-`
  monsters for all 9 G4 campaigns. Includes classic monsters (Acererak,
  Vecna reprints from Yawning Portal), AP antagonists (Karzoug for
  Runelords, the Lantern King for Kingmaker, the Deskari herald for WotR),
  Saltmarsh monsters (sea creatures, sahuagin), Mad Mage monsters
  (Halaster's apprentices, Undermountain denizens), and anthology-specific
  creatures.
- **`lib/scripts/seedCampaignTemplates.ts`** (+~800 lines estimated): 9 new
  per-campaign encounter helpers. Each encounter built from
  `findCustomMonsterById` + `toEncounterMonster(s)` with unique per-instance
  ids. Catalog `makeTemplate` calls rewired to invoke the helpers.
- **`tests/unit/lib/scripts/seedCampaignTemplates.test.ts`** (+~120 lines):
  9 new per-campaign contract tests verifying chapter count, encounter
  count, full Monster blocks, unique instance ids.
- **`docs/campaign-encounter-rollout.md`**: status table updated for the 9
  G4 entries to reflect new monster counts and PR number.
- **No new dependencies.**
- **No breaking changes** — campaigns already in the database are
  unaffected until the seed script is run with `--force` (provided by the
  already-merged `fix-campaign-template-seed` change, PR #609/#610).

## Risks

- **Risk**: Mad Mage has 80+ encounters — review burden is heavy.
  - **Impact**: medium (longer PR review cycle).
  - **Mitigation**: split Mad Mage encounters into 2 PRs (levels 1-10,
    levels 11-23) if necessary. Single PR is preferred but not mandatory.
- **Risk**: Anthology encounters reference 5etools monsters not yet in the
  global SRD library.
  - **Impact**: medium (must inline SRD mirrors per existing convention).
  - **Mitigation**: research files list each encounter's monsters; inline
    as `cm-` entries.
- **Risk**: Pathfinder AP stat blocks (Runelords, Kingmaker, WotR) lack
  clean 5e mappings.
  - **Impact**: low-medium (DM-facing; encounter difficulty may differ).
  - **Mitigation**: follow most-cited community 5e conversions; document
    deviations in encounter description.
- **Risk**: File size growth on `customMonsters.ts` (now ~15,000+ lines
  after G4 lands).
  - **Impact**: low (manageable but slowing).
  - **Mitigation**: a future refactor can split per-campaign into separate
    files; the existing `findCustomMonsterById` API is stable so consumers
    won't break.

## Open Questions

None at this time. Research is complete in `docs/research/` for all 9
campaigns.

## Non-Goals

- Renaming existing `cm-` monsters from G1/G2/G3.
- Changing the encounter format (EncounterTemplate shape stays the same).
- Anything that touches the encounter UI (#606, #607).
- Optimizing the global monster library (deferred).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

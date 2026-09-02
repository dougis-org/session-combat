## GitHub Issues

- #581 — Ingest Encounter Content for Existing Campaigns

## Why

- **Problem statement**: Group 3 of the bulk campaign encounter rollout (per
  `docs/campaign-encounter-rollout.md`) covers 6 Planar & non-Realms campaigns
  that currently ship with placeholder encounters and no campaign-specific
  monsters. Each must be populated with full `Monster` stat blocks before
  newly-copied campaigns are immediately playable.
- **Why now**: Vecna (PR #615), G1 (PR #647), and G2 (PR #661) are merged.
  G3 is the next group in the documented rollout sequence; deferring pushes
  the remaining 25 campaigns further out and risks losing context across the
  parallel research agents.
- **Business/user impact**: Dungeon Masters copying G3 campaigns get empty
  encounter arrays and must hand-author every encounter before play. After
  G3 ships, they get the same out-of-the-box playability G1 and G2 already
  provide.

## Problem Space

- **Current behavior**: G3 catalog entries in `CAMPAIGN_CATALOG` reference
  placeholder encounters (`{ name, description, monsters: [] }`) and the
  `CUSTOM_MONSTERS` registry contains zero entries tagged with a G3 campaign
  title in their `source` field.
- **Desired behavior**: Each G3 catalog entry ships with a non-empty
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
  - The existing PR #620 research markdown under `docs/research/` is
    authoritative for chapter lists and monster rosters. We do not re-research.
  - SRD monsters referenced by G3 encounters that are not in the global SRD
    library must be inlined as `cm-` entries (same pattern as G1/G2).
- **Edge cases considered**:
  - Multi-source stat blocks (e.g. Rime's Frostmaiden has both 5e and 5.5e
    stat blocks depending on source) — we use the 5e block to match the rest
    of the registry.
  - Out-of-realms monster rosters (e.g. Elemental Evil in PotA) — every
    elemental/myriad/elemental-lord type follows the same `cm-` + canonical
    `DamageType` invariant.
  - Hell's Rebels and Curse of the Crimson Throne are Pathfinder APs ported
    to 5e — we treat them as 5e content (matching how the campaign is listed
    in the catalog).
  - Red Hand of Doom is a 3.5e AP — we apply the same 5e stat conversion
    pattern used for Dragonlance in G5.

## Scope

### In Scope

- **6 G3 campaigns**: Icewind Dale: Rime of the Frostmaiden, The Wild Beyond
  the Witchlight, Princes of the Apocalypse, Curse of the Crimson Throne,
  Hell's Rebels, Red Hand of Doom.
- ~80-120 new `cm-` monsters covering campaign-specific antagonists and SRD
  mirrors needed for encounter references.
- 6 per-campaign encounter helpers (`rimeEncounters`, `wbtwEncounters`,
  `potaEncounters`, `cotctEncounters`, `hrEncounters`, `rhodEncounters`).
- 6 per-campaign contract tests in `seedCampaignTemplates.test.ts`.
- Updates to `docs/campaign-encounter-rollout.md` status table.

### Out of Scope

- UI work on the encounters panel (#606, #607).
- Global Encounters Library feature (#578) — separate scope.
- Ingesting encounters into existing user campaigns — handled by
  `backfillCampaignEncounters.ts` (PR #591).
- G4 (Anthologies/APs), G5 (Classic/legacy/3PP) — separate changes per
  group.
- Any new monster types beyond what's documented in the 5e SRD.

## What Changes

- **`lib/data/customMonsters.ts`** (+~3,000 lines estimated): new `cm-`
  monsters for all 6 G3 campaigns. Antagonists like Auril the Frostmaiden,
  the Hourglass Coven (Witchlight), the four Elemental Princes (PotA),
  Ileosa Arabasti (Crimson Throne), the Thrune-aligned NPCs (Hell's Rebels),
  and the eponymous Red Hand. Plus SRD mirrors for the dozens of elementals,
  fiends, and undead needed to populate encounters.
- **`lib/scripts/seedCampaignTemplates.ts`** (+~600 lines estimated): 6 new
  per-campaign encounter helpers. Each encounter built from
  `findCustomMonsterById` + `toEncounterMonster(s)` with unique per-instance
  ids. Catalog `makeTemplate` calls rewired to invoke the helpers.
- **`tests/unit/lib/scripts/seedCampaignTemplates.test.ts`** (+~100 lines):
  6 new per-campaign contract tests verifying chapter count, encounter
  count, full Monster blocks, unique instance ids.
- **`docs/campaign-encounter-rollout.md`**: status table updated for the 6
  G3 entries to reflect new monster counts and PR number.
- **No new dependencies.**
- **No breaking changes** — campaigns already in the database are
  unaffected until the seed script is run with `--force` (provided by the
  already-merged `fix-campaign-template-seed` change, PR #609/#610).

## Risks

- **Risk**: A typo in a stat block propagates to every copied campaign.
  - **Impact**: medium (correctable retroactively but disruptive).
  - **Mitigation**: per-campaign contract test asserts `monsters.length > 0`,
    non-zero `hp`, `ac`, `challengeRating`. Manual cross-reference against
    the 5etools mirror for every CR ≥ 5 monster before commit.
- **Risk**: Out-of-bounds references to monsters not yet defined (e.g. an
  encounter references `cm-auril` but the helper forgets to add it).
  - **Impact**: medium (seed script throws; surfaces during `npm test`).
  - **Mitigation**: every helper passes through `findCustomMonsterById` —
    a missing monster throws at seed time, surfacing the gap during CI.
- **Risk**: Pathfinder stat blocks (Crimson Throne, Hell's Rebels) don't
  have a clean 5e mapping for some creatures.
  - **Impact**: low (we use 5e stat blocks where available; document gaps).
  - **Mitigation**: research files flag Pathfinder-original stat blocks; we
    mark those encounters with the 5e SRD-equivalent or omit if no 5e
    equivalent exists.
- **Risk**: File size growth on `customMonsters.ts` (now ~10,000+ lines
  after G3 lands).
  - **Impact**: low (manageable but slowing).
  - **Mitigation**: a future refactor can split per-campaign into separate
    files; the existing `findCustomMonsterById` API is stable so consumers
    won't break.

## Open Questions

None at this time. Research is complete in `docs/research/` for all 6
campaigns.

## Non-Goals

- Renaming existing `cm-` monsters from G1/G2.
- Changing the encounter format (EncounterTemplate shape stays the same).
- Adding a "global monster library reference" optimization (deferred until
  all G3-G5 work is merged).
- Anything that touches the encounter UI (#606, #607).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

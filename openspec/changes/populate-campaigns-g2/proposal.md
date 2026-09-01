## Why

Group 2 of the bulk campaign encounter rollout (per `docs/campaign-encounter-rollout.md`)
continues the work started by the Vecna pilot (PR #615) and G1 (PR #647). The 5 Sword
Coast & Savage Frontier campaigns — Waterdeep: Dragon Heist, Storm King's Thunder,
Out of the Abyss, Dragon of Icespire Peak, and Phandelver and Below: The Shattered
Obelisk — currently ship with placeholder encounters and no custom monsters. This
change populates them with full Monster stat blocks so newly-created campaigns are
immediately playable.

## What Changes

- **New custom monsters** in `lib/data/customMonsters.ts`: ~85 monsters covering all
  5 G2 campaigns — campaign-specific antagonists (Manshoon, Jarlaxle, Iymrith,
  Maegera, demigod demon lords, Cryovain, Elder Brain Dragon) plus SRD mirrors
  needed for encounters that reference them. `cm-` prefix convention,
  `source: "<campaign title>"`, full stat blocks with traits/actions/legendary
  actions.
- **Encounter helpers** in `lib/scripts/seedCampaignTemplates.ts`: per-campaign
  helpers (`wdhEncounters`, `sktEncounters`, `ootEncounters`, `dipEncounters`,
  `pabtsoEncounters`) following the Vecna/G1 pattern. Each encounter built from
  `findCustomMonsterById` + `toEncounterMonster(s)` with unique per-instance ids.
- **Catalog wiring**: `makeTemplate` calls for the 5 G2 campaigns updated to invoke
  the new helpers so encounters are non-empty in the seeded templates.
- **Tests** in `tests/unit/lib/scripts/seedCampaignTemplates.test.ts`: 5 new
  per-campaign tests verifying chapter count, full Monster blocks (no empty
  arrays), unique instance ids.

## Capabilities

### New Capabilities
- `populate-campaigns-g2`: Document the per-campaign encounter + monster scope for
  the 5 G2 campaigns and the constraint invariants the helpers preserve.

### Modified Capabilities
- `campaign-monsters`: Adds ~85 new entries to the `CUSTOM_MONSTERS` registry and
  enforces the `cm-` prefix + canonical `DamageType` invariants already specified
  by this capability.
- `campaign-templates`: 5 catalog entries (WDH, SKT, OotA, DIP, PaBtSO) move from
  placeholder encounters to fully-defined encounter arrays via the new helpers.

## Impact

- `lib/data/customMonsters.ts` — ~3,275 lines added (1 large commit; one per
  campaign in subsequent refactors if needed).
- `lib/scripts/seedCampaignTemplates.ts` — ~503 lines added (new helpers +
  rewired catalog).
- `tests/unit/lib/scripts/seedCampaignTemplates.test.ts` — ~85 lines added
  (5 per-campaign contract tests).
- **No new dependencies.**
- **No breaking changes** — campaigns already in the database are unaffected until
  the seed script is run with `--force` (provided by the already-merged
  `fix-campaign-template-seed` change, PR #609/#610).
- **Issue #581** (Ingest Encounter Content for Existing Campaigns) — follow-up
  work continues to close incrementally per group.

## GitHub Issues

- #581 — Ingest Encounter Content for Existing Campaigns

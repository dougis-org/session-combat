## GitHub Issues

- #601

## Why

- Problem statement: The encounters added to `seedCampaignTemplates.ts` currently have empty `monsters` arrays because the system requires full `Monster` stat blocks. Without these, the encounters act merely as empty containers, requiring the DM to manually construct or import complex monsters (like Acererak or Baba Lysaga).
- Why now: We just added campaign-specific encounters to the templates. To make them truly "ready to play", they must contain the correct monsters.
- Business/user impact: DMs can immediately run the encounters provided in the templates without having to manually build boss or custom monsters from scratch.

## Problem Space

- Current behavior: `seedCampaignTemplates.ts` creates encounters with `monsters: []`.
- Desired behavior: We define full `Monster` stat blocks for these specific creatures (e.g., Vecna cultists, Spiderdragons, Zombie T-Rex) in a new seed script (e.g., `seedGlobalMonsters.ts`) and push them into the global library (`monsterTemplates` with `userId: GLOBAL_USER_ID`), AND reference them fully populated in `seedCampaignTemplates.ts`.
- Constraints: The monsters must conform to the full `MonsterTemplate` / `Monster` interface.
- Assumptions: We will manually define the stat blocks for a handful of key encounters to demonstrate the feature.
- Edge cases considered: 
  - Duplicate global monsters: The seed script should upsert or skip existing monsters to remain idempotent.

## Scope

### In Scope

- Creating a new script (e.g. `lib/scripts/seedGlobalMonsters.ts`) that defines and upserts several custom, high-level monsters into the `monsterTemplates` collection.
- Updating `lib/scripts/seedCampaignTemplates.ts` to import these definitions and inject them into the `monsters` array of the respective encounters.

### Out of Scope

- Seeding the entire D&D 5e monster manual (this is handled by SRD importers).
- Creating a UI for users to import these.

## What Changes

- A new file `lib/scripts/seedGlobalMonsters.ts` is added to define and seed the new `MonsterTemplate`s.
- `lib/scripts/seedCampaignTemplates.ts` is updated to include these monsters in the `encounters` arrays.
- Update `package.json` to include a script command for running `seedGlobalMonsters.ts`.

## Risks

- Risk: The hardcoded monster JSON is very large and complex, leading to potential type errors.
  - Impact: Typecheck or seed script failure.
  - Mitigation: Rely on TypeScript strict typing and unit tests to ensure the manually defined monsters perfectly match `MonsterTemplate`.

## Open Questions

- Question: Should the `seedGlobalMonsters.ts` script be run automatically as part of the `seedCampaignTemplates.ts` script, or kept entirely separate?
  - Needed from: User
  - Blocker for apply: no

## Non-Goals

- Writing an automated web scraper to fetch monster stats from external wikis.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

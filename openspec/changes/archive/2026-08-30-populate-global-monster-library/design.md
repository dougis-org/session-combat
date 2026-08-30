## Context

We are currently unable to test or utilize the newly added campaign encounters because they rely on full `Monster` and `MonsterTemplate` records, which we haven't defined yet for campaign-specific enemies (like Acererak or Vecna Cultists). The current D&D 5e SRD monster imports do not contain these module-specific monsters.

## Goals / Non-Goals

**Goals:**
- Provide full JSON stat blocks for a selection of campaign-specific monsters.
- Create a script `seedGlobalMonsters.ts` to push these definitions into the global `monsterTemplates` MongoDB collection.
- Update `seedCampaignTemplates.ts` to actually inject these full monster definitions into the campaign template encounters.

**Non-Goals:**
- Creating an administrative UI to edit global monsters.
- Creating an exhaustive list of every monster from every published campaign. We are just seeding a targeted subset.

## Decisions

### Decision 1: Shared Data File vs Script-Internal
- **Chosen**: Define the raw monster data inside `lib/data/customMonsters.ts` and export it, so that both `seedGlobalMonsters.ts` and `seedCampaignTemplates.ts` can import the exact same objects.
- **Rationale**: This prevents duplication. `seedCampaignTemplates.ts` needs the full objects to attach them to the encounters, and `seedGlobalMonsters.ts` needs the full objects to insert them into the `monsterTemplates` global library.

### Decision 2: Identifier Strategy
- **Chosen**: Hardcode a unique UUID or a deterministic ID (like `id: "custom-monster-acererak"`) in the data file.
- **Rationale**: This ensures that `seedGlobalMonsters.ts` can use `updateOne` with `upsert: true` to reliably update the monsters without creating duplicates on repeated runs.

## Risks / Trade-offs

- **Risk**: Typing issues with `MonsterTemplate`. The TypeScript interface for monsters is extremely strict (requiring specific string literals for `size`, `type`, etc.).
  - **Mitigation**: We will write the data file in TypeScript (`customMonsters.ts`) and type it explicitly as `Omit<MonsterTemplate, 'createdAt' | 'updatedAt'>[]` to get compiler errors if any required fields are missing or mistyped.

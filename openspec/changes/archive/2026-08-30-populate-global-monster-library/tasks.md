## 1. Data Definitions

-[x] 1.1 Create `lib/data/customMonsters.ts` that exports a `const CUSTOM_MONSTERS: Omit<MonsterTemplate, 'createdAt' | 'updatedAt'>[]` array.
-[x] 1.2 Define the full JSON stat blocks for at least 3-4 key monsters inside this file (e.g., Vecna Cultist, Spiderdragon, Deathwolf, Relentless Impaler).

## 2. Seed Scripts

-[x] 2.1 Create `lib/scripts/seedGlobalMonsters.ts`.
-[x] 2.2 In `seedGlobalMonsters.ts`, import `CUSTOM_MONSTERS` and write a script that connects to the database, iterates over them, and upserts them into the `monsterTemplates` collection (adding `createdAt` and `updatedAt`).
-[x] 2.3 Modify `lib/scripts/seedCampaignTemplates.ts` to import `CUSTOM_MONSTERS`.
-[x] 2.4 Update the `encounterData` dictionary inside `seedCampaignTemplates.ts` so the encounters for `Vecna: Eve of Ruin` include references to the imported monsters inside their `monsters: []` array.

## 3. Tooling and Validation

-[x] 3.1 Update `package.json` to include a `"seed:monsters"` script that runs `lib/scripts/seedGlobalMonsters.ts`.
-[x] 3.2 Run the typechecker locally to ensure `customMonsters.ts` perfectly matches the required `MonsterTemplate` structure without any missing mandatory fields.
-[x] 3.3 Execute `npm run seed:monsters` locally to verify insertion works.
-[x] 3.4 Execute the campaign template seed script to verify it still builds.

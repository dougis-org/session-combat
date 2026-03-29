## 1. Preparation

- [x] 1.1 Checkout `main` branch and pull with fast-forward only: `git checkout main && git pull --ff-only`
- [x] 1.2 Create feature branch and push to remote: `git checkout -b fix/restore-srd-monster-library && git push -u origin fix/restore-srd-monster-library`

## 2. Transformation Script

- [x] 2.1 Create `scripts/transform-monster-data.mjs` — a Node.js ESM script that reads each of the 14 category files from git history (`git show 1743fd4:lib/data/monsters/<file>.ts`), applies all field transformations (speed, abilities→abilityScores, savingThrows keys, senses, maxHp, size, delete armorType/hitDice/hitPoints), and writes the transformed TypeScript source files to `lib/data/monsters/`
- [x] 2.2 Run the transformation script: `node scripts/transform-monster-data.mjs`
- [x] 2.3 Verify all 14 files were created in `lib/data/monsters/` (aberrations.ts, beasts.ts, celestials.ts, constructs.ts, dragons.ts, elementals.ts, fey.ts, fiends.ts, giants.ts, humanoids.ts, monstrosities.ts, oozes.ts, plants.ts, undead.ts)
- [x] 2.4 Delete the one-time transformation script: `rm scripts/transform-monster-data.mjs`

## 3. Re-enable Monster Library Index

- [x] 3.1 Update `lib/data/monsters/index.ts`: remove the empty array export and TODO comment; add imports for all 14 category files; export `ALL_SRD_MONSTERS` as the spread of all 14 arrays (matching the pre-deletion state from `1743fd4`)

## 4. TypeScript Validation

- [x] 4.1 Run `npx tsc --noEmit` and fix any type errors in the restored category files — common issues: `size` capitalization, `savingThrows` keys, `senses` type, extra fields
- [x] 4.2 Run `npm run build` (or `next build`) and confirm it succeeds with no errors in `lib/data/monsters/`

## 5. Unit Test: Monster Library Integrity

- [x] 5.1 Create `tests/unit/monsterLibrary.test.ts` that imports `ALL_SRD_MONSTERS` from `lib/data/monsters` and verifies:
  - Array length > 300
  - All 14 creature type categories are represented
  - Every monster: `speed` is a string, `abilityScores` exists with full key names, no `str`/`dex`/etc. abbreviated keys
  - Every monster with `savingThrows`: all keys are full names
  - Every monster with `senses`: is a plain object (not string), all values are strings
  - Every monster: `maxHp` is a number >= `hp`, `size` equals its `.toLowerCase()`, `size` is in the valid union
  - Every monster: has required fields (`name`, `size`, `type`, `ac`, `hp`, `maxHp`, `speed`, `abilityScores`, `challengeRating`)
  - Every monster: has no forbidden extra fields (`armorType`, `hitDice`, `hitPoints`)
- [x] 5.2 Run `npm test -- tests/unit/monsterLibrary.test.ts` and confirm all assertions pass

## 6. Validation

- [x] 6.1 Run full test suite: `npm test` — confirm no regressions
- [x] 6.2 Manually verify monster count: > 300 confirmed (334)
- [x] 6.3 Spot-check 3 monsters across different categories (e.g. Aboleth, Adult Gold Dragon, Zombie) — verify `speed`, `abilityScores`, `senses`, `savingThrows` fields look correct
- [x] 6.4 Verify TypeScript compilation: `npx tsc --noEmit` exits with code 0

## 7. PR and Merge

- [ ] 7.1 Stage and commit all changes (14 category files + `index.ts` + new test): `git add lib/data/monsters/ tests/unit/monsterLibrary.test.ts && git commit -m "fix: restore 334 SRD monsters and add regression test (fixes #102)"`
- [ ] 7.2 Push branch: `git push`
- [ ] 7.3 Open PR targeting `main` — title: "fix: restore SRD monster library (334 monsters, fixes #102)"
- [ ] 7.4 Monitor CI: if any check fails, diagnose → fix → commit → push → repeat until all checks pass
- [ ] 7.5 Address any review comments: fix → commit → push → repeat until no unresolved comments remain
- [ ] 7.6 Enable auto-merge once all CI checks are green and no blocking review comments remain

## 8. Post-Merge

- [ ] 8.1 Checkout `main` and pull: `git checkout main && git pull --ff-only`
- [ ] 8.2 Verify the restored monster files appear on `main`
- [ ] 8.3 Sync approved spec delta: copy `openspec/changes/restore-srd-monster-library/specs/srd-monster-library-integrity/spec.md` to `openspec/specs/srd-monster-library-integrity/spec.md`
- [ ] 8.4 Archive the change (single atomic commit): move `openspec/changes/restore-srd-monster-library/` to `openspec/changes/archive/` and push to `main`
- [ ] 8.5 Delete local feature branch: `git branch -d fix/restore-srd-monster-library`

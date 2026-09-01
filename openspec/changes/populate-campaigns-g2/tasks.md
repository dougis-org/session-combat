## 1. Branch & Worktree

- [x] 1.1 Confirm `feature/populate-campaigns-g2` branch exists on remote and is checked out at `.worktrees/populate-campaign-encounters-g2`.
- [x] 1.2 Confirm the G2 implementation commit `d0efa5f7` is the tip of the branch.

## 2. Custom Monster Authoring

- [x] 2.1 Add ~85 new `cm-` monsters for the 5 G2 campaigns to `lib/data/customMonsters.ts` (WDH, SKT, OotA, DIP, PaBtSO).
- [x] 2.2 Every new monster uses the `cm-` prefix and `source: "<campaign title>"`.
- [x] 2.3 Every new monster has full stat blocks (HP, AC, abilities, traits, actions; legendary actions where applicable).
- [x] 2.4 Every new monster's `damageResistances`/`damageImmunities` arrays contain only canonical `DamageType` values.
- [x] 2.5 Every new monster's `senses["passive Perception"]` is a string.
- [x] 2.6 No `as any` casts introduced.
- [x] 2.7 No `eslint-disable` comments introduced.

## 3. Encounter Helper Authoring

- [x] 3.1 Add `wdhEncounters()` returning `EncounterTemplate[]` for Waterdeep: Dragon Heist (≥3 encounters).
- [x] 3.2 Add `sktEncounters()` returning `EncounterTemplate[]` for Storm King's Thunder (≥10 encounters).
- [x] 3.3 Add `ootEncounters()` returning `EncounterTemplate[]` for Out of the Abyss (≥16 encounters).
- [x] 3.4 Add `dipEncounters()` returning `EncounterTemplate[]` for Dragon of Icespire Peak (≥15 encounters).
- [x] 3.5 Add `pabtsoEncounters()` returning `EncounterTemplate[]` for Phandelver and Below (≥9 encounters).
- [x] 3.6 Every encounter is built from `findCustomMonsterById` + `toEncounterMonster(s)` with unique per-instance ids.
- [x] 3.7 Wire each helper into the corresponding `makeTemplate` call in `CAMPAIGN_CATALOG`.

## 4. Contract Tests

- [x] 4.1 Add a per-campaign contract test for WDH asserting chapter count, encounter count, full Monster blocks, unique instance ids.
- [x] 4.2 Add a per-campaign contract test for SKT.
- [x] 4.3 Add a per-campaign contract test for OotA.
- [x] 4.4 Add a per-campaign contract test for DIP.
- [x] 4.5 Add a per-campaign contract test for PaBtSO.

## 5. Pre-Commit Code Review

- [ ] 5.1 Spawn sub-agent to run `openspec-review-code` skill on the changed files (`lib/data/customMonsters.ts`, `lib/scripts/seedCampaignTemplates.ts`, `tests/unit/lib/scripts/seedCampaignTemplates.test.ts`).
- [ ] 5.2 Apply all clearly-correct findings to the code (no stopping, no user prompt).
- [ ] 5.3 Re-run `npm run test:unit` after applying fixes; confirm all tests pass.

## 6. Validation

- [ ] 6.1 `npm run typecheck` exits clean.
- [ ] 6.2 `npm run test:unit` exits clean — all 5 new G2 tests pass.
- [ ] 6.3 `npx eslint lib/data/customMonsters.ts lib/scripts/seedCampaignTemplates.ts tests/unit/lib/scripts/seedCampaignTemplates.test.ts` exits clean.

## 7. PR and Merge

- [ ] 7.1 Open a PR from `feature/populate-campaigns-g2` to `main` with title `feat(campaigns): populate G2 encounters (WDH, SKT, OotA, DIP, PaBtSO)` and a body modeled on PR #647.
- [ ] 7.2 Enable auto-merge on the PR.
- [ ] 7.3 Wait 3 minutes for CI to start.
- [ ] 7.4 Spawn sub-agent to run `pr-review-toolkit:review-pr` on the PR.
- [ ] 7.5 Address all findings from the review (commit, push, re-run) until zero findings remain.
- [ ] 7.6 Monitor PR for new comments and CI failures autonomously; iterate until merged.
- [ ] 7.7 After merge, verify changes appear on `main`.

## 8. Post-Merge

- [ ] 8.1 Sync approved spec deltas from `openspec/changes/populate-campaigns-g2/specs/` back to `openspec/specs/`.
- [ ] 8.2 Archive the change directory in a single atomic commit to `openspec/changes/archive/2026-09-01-populate-campaigns-g2/`.
- [ ] 8.3 Remove `.worktrees/populate-campaign-encounters-g2`.
- [ ] 8.4 `git fetch --prune` and `git branch -d feature/populate-campaigns-g2`.

## 9. Documentation

- [ ] 9.1 Update the `## Status` table in `docs/campaign-encounter-rollout.md` to mark WDH, SKT, OotA, DIP, PaBtSO as ✅ merged with the new PR number.

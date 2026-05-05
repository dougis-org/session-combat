# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b extract-dnd-skills-senses` then immediately `git push -u origin extract-dnd-skills-senses`

## Execution

- [ ] **Update `lib/import/dndBeyond-utils.ts`** — append `collectModifierSubtypeSet` as a new export:
  ```ts
  export function collectModifierSubtypeSet(
    modifiers: DndBeyondModifier[],
    predicate: (modifier: DndBeyondModifier) => boolean,
    mapSubtype: (modifier: DndBeyondModifier) => string,
  ): Set<string> {
    return new Set(
      modifiers
        .filter(predicate)
        .map(mapSubtype)
        .filter((value) => value.length > 0),
    );
  }
  ```
  Verify the local `DndBeyondModifier` interface in that file includes at least `type` and `subType` fields (add if missing).

- [ ] **Create `lib/import/dndBeyond-skills-senses.ts`** with:
  - Local `interface DndBeyondModifier` (fields: `type`, `subType`) — unexported
  - Imports:
    - `import type { AbilityScores } from "../types"`
    - `import { getAbilityModifier, ABILITY_KEYS } from "./utils"`
    - `import { collectModifierSubtypeSet, sumModifierBonusesBySubtype, getModifierNumericValue } from "./dndBeyond-utils"`
    - `import { SKILL_ABILITY_MAP, PASSIVE_SENSE_SKILLS } from "../characterReference"`
  - Unexported helpers copied verbatim from `lib/dndBeyondCharacterImport.ts`:
    - `normalizeSkillName` (line 642)
    - `denormalizeSkillSubtype` (line 646)
    - `normalizeSenseKey` (line 650)
    - `collectSenseModifiers` (line 624)
  - Exported functions copied verbatim:
    - `normalizeSavingThrows` (line 438)
    - `normalizeSkills` (line 462)
    - `normalizeSenses` (line 493)
  - Note: `normalizeSenses` takes `DndBeyondCharacterData` — define a minimal local interface for the fields it uses (`race?: { weightSpeeds?: { normal?: { walk?: number | null } | null } | null } | null`)

- [ ] **Update `lib/dndBeyondCharacterImport.ts`**:
  - Add to imports: `import { normalizeSavingThrows, normalizeSkills, normalizeSenses } from "./import/dndBeyond-skills-senses"`
  - Add `collectModifierSubtypeSet` to the existing `dndBeyond-utils` import line
  - Remove the nine local function definitions:
    - `normalizeSavingThrows` (line 438–460)
    - `normalizeSkills` (line 462–491)
    - `normalizeSenses` (line 493–519)
    - `collectModifierSubtypeSet` (line 611–622)
    - `collectSenseModifiers` (line 624–640)
    - `normalizeSkillName` (line 642–644)
    - `denormalizeSkillSubtype` (line 646–648)
    - `normalizeSenseKey` (line 650–652)

- [ ] Verify no `from "../dndBeyondCharacterImport"` import exists in the new file
- [ ] Review for duplication and unnecessary complexity

## Validation

- [ ] `npx tsc --noEmit` — passes with no errors
- [ ] `npm test` — all tests pass
- [ ] `npm run build` — build succeeds
- [ ] `npm run lint` (or equivalent) — no lint errors
- [ ] Confirm `lib/import/dndBeyond-skills-senses.ts` has no import from `../dndBeyondCharacterImport`
- [ ] Confirm `collectModifierSubtypeSet` is no longer defined in `lib/dndBeyondCharacterImport.ts`
- [ ] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- **Type check** — `npx tsc --noEmit`; must pass

If **ANY** of the above fail, iterate and address the failure before pushing.

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to `extract-dnd-skills-senses` branch and push to remote
- [ ] Open PR from `extract-dnd-skills-senses` to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix, commit fixes, follow all steps in [Remote push validation] then push; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: dougis
- Reviewer(s): agentic reviewer (auto)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on main
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No doc updates needed — purely structural refactor
- [ ] Archive the change: move `openspec/changes/extract-dnd-skills-senses/` to `openspec/changes/archive/YYYY-MM-DD-extract-dnd-skills-senses/` — stage both the new location and deletion of the old in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-extract-dnd-skills-senses/` exists and `openspec/changes/extract-dnd-skills-senses/` is gone
- [ ] Commit and push the archive to main in one commit
- [ ] Prune merged local feature branch: `git fetch --prune` and `git branch -d extract-dnd-skills-senses`

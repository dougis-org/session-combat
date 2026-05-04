# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b extract-dnd-beyond-defenses` then immediately `git push -u origin extract-dnd-beyond-defenses`

## Execution

- [x] **Create `lib/import/dndBeyond-defenses.ts`** with:
  - Local `interface DndBeyondModifier` (fields: `type`, `subType`, `friendlySubtypeName`) — unexported
  - `import { dedupeStrings, titleize, isDamageTypeModifier } from "./utils"`
  - Export `normalizeLanguages`, `normalizeByModifierType`, `normalizeImmunities` — copied verbatim from `lib/dndBeyondCharacterImport.ts`
- [x] **Update `lib/dndBeyondCharacterImport.ts`**:
  - Add `import { normalizeImmunities, normalizeByModifierType, normalizeLanguages } from "./import/dndBeyond-defenses"`
  - Remove the three local function definitions (`normalizeLanguages` at line ~368, `normalizeByModifierType` at line ~542, `normalizeImmunities` at line ~556)
- [x] Verify no `from "../dndBeyondCharacterImport"` import exists in the new file
- [x] Review for duplication and unnecessary complexity

## Validation

- [x] `npx tsc --noEmit` — passes with no errors
- [x] `npm test` — all tests pass
- [x] `npm run build` — build succeeds
- [x] `npm run lint` (or equivalent) — no lint errors
- [x] Confirm `lib/import/dndBeyond-defenses.ts` has no import from `../dndBeyondCharacterImport`
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- **Type check** — `npx tsc --noEmit`; must pass

If **ANY** of the above fail, iterate and address the failure before pushing.

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `extract-dnd-beyond-defenses` branch and push to remote
- [x] Open PR from `extract-dnd-beyond-defenses` to `main`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge --auto --merge`
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix, commit fixes, follow all steps in [Remote push validation] then push; wait 180 seconds then repeat until all checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: dougis
- Reviewer(s): agentic reviewer (auto)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on main
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No doc updates needed — purely structural refactor
- [ ] Archive the change: move `openspec/changes/extract-dnd-beyond-defenses/` to `openspec/changes/archive/YYYY-MM-DD-extract-dnd-beyond-defenses/` — stage both the new location and deletion of the old in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-extract-dnd-beyond-defenses/` exists and `openspec/changes/extract-dnd-beyond-defenses/` is gone
- [ ] Commit and push the archive to main in one commit
- [ ] Prune merged local feature branch: `git fetch --prune` and `git branch -d extract-dnd-beyond-defenses`

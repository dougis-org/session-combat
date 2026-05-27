# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/scripts-test-coverage` then immediately `git push -u origin feat/scripts-test-coverage`

## Execution

### T1 — Guard + export: migrateGlobalMonsters.ts

- [x] In `lib/scripts/migrateGlobalMonsters.ts`, wrap the top-level invocation in `if (require.main === module) { ... }`
- [x] Export the `migrateGlobalMonsters` function
- [x] Verify: `npx ts-node -e "import('./lib/scripts/migrateGlobalMonsters').then(m => console.log(typeof m.migrateGlobalMonsters))"` should print `function` without triggering DB connections

### T2 — Guard + exports: populateMonstersByType.js

- [x] In `lib/scripts/populateMonstersByType.js`, wrap the `main()` call in `if (require.main === module) { ... }`
- [x] Add `module.exports = { normalizeType, getCRExperience, transformMonster, generateTypeFile }` at the bottom of the file
- [x] Verify: `node -e "const m = require('./lib/scripts/populateMonstersByType'); console.log(Object.keys(m))"` prints the four export names without making HTTP calls

### T3 — Integration test: migrateGlobalMonsters

- [x] Create `tests/integration/scripts/migrateGlobalMonsters.integration.test.ts`
- [x] Test setup: get a direct MongoDB collection handle using `MONGODB_URI` / `MONGODB_DB` env vars (already set by global test setup)
- [x] Seed documents: one untagged global monster (`source` absent), one with `source: ""`, one with `source: "SRD"` (already tagged), one non-global monster with no source
- [x] Test: call `migrateGlobalMonsters()`, assert tagged docs have `source: "SRD"`, assert `modifiedCount === 2` (the two untagged ones), assert already-tagged and non-global docs unchanged
- [x] Test idempotency: call `migrateGlobalMonsters()` again, assert `modifiedCount === 0`
- [x] `afterEach`: delete seeded test documents by a unique test-run marker field to avoid polluting other tests
- [x] Verify: `npm run test:integration -- --testPathPattern=scripts/migrateGlobalMonsters` passes

### T4 — Unit tests: populateMonstersByType

- [x] Create `tests/unit/lib/scripts/populateMonstersByType.test.ts`
- [x] Test `normalizeType`: swarm strings → `"beast"`, standard type → lowercased, already-lowercase unchanged
- [x] Test `getCRExperience`: CR `0` → `10`, CR `0.5` → `100`, CR `1` → `200`, CR `20` → `25000`, unknown CR → `0`
- [x] Test `transformMonster`: full fixture → verify `name`, `ac`, `abilities`, `savingThrows`, `skills`, `actions`, `traits`, `source: "SRD"`
- [x] Test `transformMonster`: no `proficiencies` → `savingThrows` and `skills` absent from result
- [x] Test `transformMonster`: no `senses` → `senses === ""`
- [x] Test `transformMonster`: no `actions` → `actions` absent from result
- [x] Test `transformMonster`: no `xp`, CR `5` → `experiencePoints === 1800`
- [x] Test `generateTypeFile`: creates `beasts.ts` in temp dir, file contains `export const BEASTS:`
- [x] Test `generateTypeFile`: cleanup — `afterEach` removes temp dir
- [x] Verify: `npm run test:unit -- --testPathPattern=lib/scripts/populateMonstersByType` passes

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Review its report and apply fixes for duplication, complexity, and completeness before committing.

## Validation

- [x] `npm run test:unit` — all unit tests pass
- [x] `npm run test:integration` — all integration tests pass
- [x] `npm run build` — TypeScript build succeeds
- [x] `npm run lint` (if available) — no new lint errors
- [ ] `lib/scripts/` coverage ≥ 70% (check with `npm run test:unit -- --coverage`)
- [ ] All execution tasks marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run before the final commit
- [ ] Commit all changes to `feat/scripts-test-coverage` and push to remote
- [ ] Open PR from `feat/scripts-test-coverage` to `main`. PR body MUST include `Closes #246`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Monitor PR comments** — poll autonomously; address, commit, validate locally, push, wait 180s, repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll via `gh pr checks <PR-URL> --json isRequired,state`; fix any blocking failures, push, wait 180s, repeat
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` notify user

Ownership metadata:

- Implementer: dougis
- Reviewer(s): agentic reviewer (auto)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks complete
- [ ] No documentation updates required for this change
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec directory) — copy `specs/migrate-global-monsters.md` and `specs/populate-monsters-by-type.md` to `openspec/specs/scripts/`
- [ ] Archive the change: move `openspec/changes/scripts-test-coverage/` to `openspec/changes/archive/YYYY-MM-DD-scripts-test-coverage/` in a single atomic commit (stage both copy and deletion together)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-scripts-test-coverage/` exists and `openspec/changes/scripts-test-coverage/` is gone
- [ ] **Create a doc branch**: `git checkout -b doc/archive-YYYY-MM-DD-scripts-test-coverage` then `git push -u origin doc/archive-YYYY-MM-DD-scripts-test-coverage`
- [ ] Open PR from doc branch to `main` with title `docs: archive scripts-test-coverage (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor doc PR until merged (same loop — address comments/CI, push to doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/scripts-test-coverage doc/archive-YYYY-MM-DD-scripts-test-coverage`

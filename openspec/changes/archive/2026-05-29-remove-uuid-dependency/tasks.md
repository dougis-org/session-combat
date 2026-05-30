# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b chore/remove-uuid-dependency` then immediately `git push -u origin chore/remove-uuid-dependency`

## Execution

### Migrate source files

- [x] **`lib/api/spell-helpers.ts`** — replace `import { v4 as uuidv4 } from "uuid"` with `import { randomUUID } from "crypto"` and `uuidv4()` with `randomUUID()`
- [x] **`lib/import/transformMonster.ts`** — same swap
- [x] **`lib/import/transformSpell.ts`** — same swap

### Migrate test helpers

- [x] **`tests/e2e/helpers/actions.ts`** — replace import + `uuidv4()` with `randomUUID()`
- [x] **`tests/e2e/helpers/isolation.ts`** — replace import + `uuidv4().replace(/-/g, "")` with `randomUUID().replace(/-/g, "")`

### Remove the packages

- [x] Remove `uuid` from `dependencies` and `@types/uuid` from `devDependencies` in `package.json`
- [x] Run `npm install` to update `package-lock.json`

### Verify no references remain

- [x] Run: `grep -r "from 'uuid'\|from \"uuid\"\|require('uuid')\|require(\"uuid\")" --include="*.ts" --include="*.tsx" --include="*.js" . --exclude-dir=node_modules --exclude-dir=.next` — must return zero matches
- [x] Run: `grep "uuid" package.json` — must return zero matches

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] **Type check:** `npx tsc --noEmit` — must pass with zero errors (pre-existing errors unrelated to this change)
- [x] **Unit tests:** `npm run test:unit` — all 135 suites pass
- [x] **Integration tests:** `npm run test:integration` — all 20 suites pass
- [x] **Build:** `npm run build` — must succeed with zero errors
- [x] All completed tasks marked `[x]`

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `chore/remove-uuid-dependency` and push to remote
- [x] Open PR from `chore/remove-uuid-dependency` to `main`. PR body **must** include `Closes #240`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status using `gh pr checks <PR-URL> --json isRequired,state`; when any required check fails, diagnose and fix, commit, follow [Remote push validation], push, wait 180 seconds, repeat until all required checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never force-merge**

Ownership metadata:

- Implementer: AI agent
- Reviewer(s): doug@dougis.com
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No documentation updates required (pure dependency removal)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/remove-uuid-dependency/` to `openspec/changes/archive/YYYY-MM-DD-remove-uuid-dependency/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-remove-uuid-dependency/` exists and `openspec/changes/remove-uuid-dependency/` is gone
- [ ] **Create a doc branch** for the archive: `git checkout -b doc/archive-YYYY-MM-DD-remove-uuid-dependency` then `git push -u origin doc/archive-YYYY-MM-DD-remove-uuid-dependency`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-remove-uuid-dependency` to `main` with title `docs: archive remove-uuid-dependency (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until it merges
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d chore/remove-uuid-dependency doc/archive-YYYY-MM-DD-remove-uuid-dependency`

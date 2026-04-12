# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and
  `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/align-dnd-beyond-fixture-contracts`
  then immediately `git push -u origin fix/align-dnd-beyond-fixture-contracts`

## Execution

- [x] 1. Reproduce the current issue #138 failure set with `npx tsc --noEmit`
  and record the D&D Beyond-specific failures that define scope
- [x] 2. Update `tests/fixtures/dndBeyondCharacter.ts` so the shared fixture
  source satisfies the current `DndBeyondCharacterData` contract directly
- [x] 3. Refactor
  `tests/unit/import/dndBeyondCharacterImport.test.ts` to preserve
  modifier/action unions in override-heavy test cases without repeated unsafe
  casts
- [x] 4. Replace direct optional-property assertions for normalized fields with
  explicit narrowing where required
- [x] 5. Review the touched tests for duplication and simplify any helper shape
  introduced during the cleanup
- [x] 6. Confirm the change remains limited to fixture/test alignment and does
  not loosen production contracts

Suggested start-of-work commands:
`git checkout main` → `git pull --ff-only` →
`git checkout -b fix/align-dnd-beyond-fixture-contracts` →
`git push -u origin fix/align-dnd-beyond-fixture-contracts`

## Validation

- [x] Run targeted unit tests:
  `npm run test:unit -- tests/unit/import/dndBeyondCharacterImport.test.ts`
- [x] Run any directly related import integration tests if fixture changes touch
  shared import helpers
- [x] Run repo-wide typecheck: `npx tsc --noEmit`
- [x] Run lint: `npm run lint`
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite for any
  directly affected import flows; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression suite
  if the touched import flow is covered there; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

Use the project's documented commands for each of the above.

## PR and Merge

- [x] Run the required pre-PR self-review from
  `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`
- [x] Wait for 120 seconds for the Agentic reviewers to post their comments
- [x] **Monitor PR comments** — when comments appear, address them, commit
  fixes, follow all steps in [Remote push validation] then push to the same
  working branch; repeat until no unresolved comments remain
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — when any CI check fails, diagnose and fix the
  failure, commit fixes, follow all steps in [Remote push validation] then push
  to the same working branch; repeat until all checks pass
- [x] Wait for the PR to merge — **never force-merge**; if a human force-merges,
  continue to Post-Merge

Ownership metadata:

- Implementer: dougis
- Reviewer(s):
- Required approvals: 1 human approval before apply and merge

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm
  resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change
- [x] Sync approved spec deltas into `openspec/specs/`
- [x] Archive the change: move
  `openspec/changes/align-dnd-beyond-fixture-contracts/` to
  `openspec/changes/archive/YYYY-MM-DD-align-dnd-beyond-fixture-contracts/`
  **and stage both the new location and the deletion of the old location in a
  single commit**
- [x] Confirm the archived path exists and the original change directory is gone
- [x] Commit and push the archive to `main` in one commit
- [x] Prune merged local feature branches:
  `git fetch --prune` and
  `git branch -d fix/align-dnd-beyond-fixture-contracts`

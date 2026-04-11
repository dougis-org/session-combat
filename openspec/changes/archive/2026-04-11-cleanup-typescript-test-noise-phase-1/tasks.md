# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and
  `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:**
  `git checkout -b cleanup-typescript-test-noise-phase-1` then immediately
  `git push -u origin cleanup-typescript-test-noise-phase-1`

## Execution

- [x] **3.1 Define failing tests first for the combat fixture drift**
  in `tests/unit/combat/conditionExpiry.test.ts` and
  `tests/unit/combat/damageResistance.test.ts`, then update those tests to match
  current exported combat contracts without changing production code
- [x] **3.2 Define failing tests first for helper and import-route typing drift**
  in `tests/unit/helpers/route.test.helpers.ts`,
  `tests/unit/import/characterImportRoute.test.ts`, and
  `tests/unit/import/charactersPageImport.test.ts`, then replace stale auth,
  async, and response-mock patterns with type-safe test-only patterns
- [x] **3.3 Define failing tests first for env and optional-property hygiene**
  in `tests/unit/import/dndBeyondCharacterServer.test.ts` and
  `tests/integration/monsterUpload.test.ts`, then refactor the tests to avoid
  direct read-only env mutations and unsafe optional-property assertions
- [x] **3.4 Review the touched files for duplication and unnecessary complexity**
  and confirm the cleanup stays strictly within the non-D&D phase 1 boundary
- [x] **3.5 Confirm acceptance criteria are covered** and that no work from
  issue `#138` is pulled into this branch

Suggested start-of-work commands: `git checkout main` →
`git pull --ff-only` →
`git checkout -b cleanup-typescript-test-noise-phase-1` →
`git push -u origin cleanup-typescript-test-noise-phase-1`

## Validation

- [x] **4.1 Run the targeted non-D&D suites** needed to confirm the touched
  tests still protect their intended behavior
- [x] **4.2 Run `npx tsc --noEmit`** and confirm the bounded non-D&D failures
  from phase 1 no longer appear
- [x] **4.3 Run `npm run lint`** for repository lint validation
- [x] **4.4 Run any additional focused validation required by the touched files**
  and record the exact commands/results in the PR
- [x] **4.5 All completed tasks marked as complete**
- [x] **4.6 All steps in [Remote push validation]**

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run the relevant Jest unit suites for the touched files; all
  tests must pass
- **Integration tests** — run the relevant integration suite for
  `tests/integration/monsterUpload.test.ts`; all tests must pass
- **Regression / E2E tests** — not required unless a touched helper change
  expands beyond unit/integration scope
- **Build** — not required for this test-only cleanup unless the touched changes
  surface a build regression during validation
- if **ANY** of the above fail, you **MUST** iterate and address the failure

Use the project's documented commands for each of the above (see `README.md`,
`CONTRIBUTING.md`, and `AGENTS.md`).

## PR and Merge

- [x] Run the required pre-PR self-review from
  `.github/openspec-shared/.codex/skills/openspec-apply-change/SKILL.md` before
  committing
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

The comment and CI resolution loops are iterative: address → validate locally →
push → sleep for 120 seconds → re-check → repeat until the PR is fully clean.
If a human force-merges before the PR is clean, proceed directly to Post-Merge
steps.

Ownership metadata:

- Implementer: AI agent plus human reviewer
- Reviewer(s): repository maintainer(s)
- Required approvals: explicit human approval before apply, then normal PR
  review approval before merge

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm
  resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change, if any
- [x] Sync approved spec deltas into `openspec/specs/` if this change is
  approved for long-term global spec retention
- [x] Archive the change: move
  `openspec/changes/cleanup-typescript-test-noise-phase-1/` to
  `openspec/changes/archive/YYYY-MM-DD-cleanup-typescript-test-noise-phase-1/`
  **and stage both the new location and the deletion of the old location in a
  single commit** — do not commit the copy and delete separately
- [x] Confirm the archive location exists and the original change directory is
  gone
- [x] Commit and push the archive to `main` in one commit
- [x] Prune merged local feature branches:
  `git fetch --prune` and
  `git branch -d cleanup-typescript-test-noise-phase-1`

Required cleanup after archive: `git fetch --prune` and
`git branch -d cleanup-typescript-test-noise-phase-1`

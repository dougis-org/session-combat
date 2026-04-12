# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix-lint-workflow` then immediately `git push -u origin fix-lint-workflow`

## Execution

### 1. Fix `eslint.config.mjs`

- [x] Open `eslint.config.mjs`
- [x] Replace the current direct re-export with a spread array pattern and add an `ignores` block:
  ```js
  import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

  export default [
    ...nextCoreWebVitals,
    {
      ignores: [
        ".next/**",
        "node_modules/**",
        "coverage/**",
        "coverage-e2e/**",
        "playwright-report/**",
      ],
    },
  ];
  ```
- [x] Verify the file saved correctly
- Spec: `openspec/changes/fix-lint-workflow/specs/lint-config/spec.md` — FR1, FR2

### 2. Update lint script in `package.json`

- [x] Open `package.json`
- [x] Change the `lint` script from `eslint . --ext .js,.jsx,.ts,.tsx` to `eslint .`
- [x] Save the file
- Spec: `openspec/changes/fix-lint-workflow/specs/lint-config/spec.md` — MODIFIED lint script

### 3. Delete `.eslintrc.json`

- [x] Delete `.eslintrc.json` from the repository root
- [x] Confirm the file no longer exists: `ls .eslintrc*` should return nothing
- Spec: `openspec/changes/fix-lint-workflow/specs/lint-config/spec.md` — REMOVED legacy config

### 4. Add `lint` job to `.github/workflows/build-test.yml`

- [x] Add a new `lint` job before the existing test jobs:
  ```yaml
  lint:
    runs-on: ubuntu-latest

    permissions:
      contents: read

    steps:
      - name: Checkout code
        uses: actions/checkout@v6

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint
  ```
- Spec: `openspec/changes/fix-lint-workflow/specs/ci-lint-gate/spec.md` — FR1

### 5. Wire `needs: [lint]` onto all three test jobs

- [x] Add `needs: [lint]` to `unit-tests` job
- [x] Add `needs: [lint]` to `integration-tests` job
- [x] Add `needs: [lint]` to `regression-tests` job
- [x] Verify `finalize-coverage` still has `needs: [unit-tests, integration-tests, regression-tests]` (unchanged)
- Spec: `openspec/changes/fix-lint-workflow/specs/ci-lint-gate/spec.md` — MODIFIED test job prerequisites

### 6. Verify lint runs cleanly locally

- [x] Run `npm ci` to ensure dependencies are installed
- [x] Run `npm run lint`
- [x] If lint reports violations, fix them before proceeding (do not merge a broken lint gate)
- [x] Confirm lint exits 0

## Validation

- [x] `npm run lint` exits 0 with no config errors or `--ext` warnings
- [x] `.eslintrc.json` does not exist (`ls .eslintrc*` returns nothing)
- [x] `eslint.config.mjs` contains an `ignores` block covering `.next/`, `node_modules/`, `coverage*/`, `playwright-report/`
- [x] `package.json` lint script reads `eslint .` with no `--ext` flag
- [x] `build-test.yml` contains a `lint` job with checkout, node setup, npm ci, and `npm run lint` steps
- [x] `unit-tests`, `integration-tests`, and `regression-tests` each declare `needs: [lint]`
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:ci`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors
- **Lint** — `npm run lint`; must exit 0
- If **ANY** of the above fail, you **MUST** iterate and address the failure before pushing

## PR and Merge

- [x] Run the required pre-PR self-review before committing
- [x] Commit all changes to `fix-lint-workflow` branch and push to remote
- [x] Open PR from `fix-lint-workflow` to `main` — reference issue #130 in the PR body
- [x] Wait 120 seconds for agentic reviewers to post comments
- [x] **Monitor PR comments** — address each one, commit fixes, follow all steps in Remote push validation, push; repeat until no unresolved comments remain
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — when any check fails, diagnose and fix, commit, follow Remote push validation, push; repeat until all checks pass
- [x] Wait for the PR to merge — **never force-merge**; if a human force-merges, continue to Post-Merge

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): automated (Codacy, CodeRabbit) + human
- Required approvals: 1 human

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No documentation updates required for this change
- [x] Sync approved spec deltas into `openspec/specs/` (global spec) if applicable
- [x] Archive the change: move `openspec/changes/fix-lint-workflow/` to `openspec/changes/archive/YYYY-MM-DD-fix-lint-workflow/` **staging both the new location and deletion of the old location in a single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-lint-workflow/` exists and `openspec/changes/fix-lint-workflow/` is gone
- [x] Commit and push the archive commit to `main`
- [x] Prune merged local branch: `git fetch --prune` and `git branch -d fix-lint-workflow`

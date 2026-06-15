# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/flatten-eslint-next-config` then immediately `git push -u origin fix/flatten-eslint-next-config`

## Execution

### Task 1 — Capture pre-change ESLint baseline

- [x] Run `npx eslint --print-config src/app/page.tsx > /tmp/eslint-before.json` to capture the resolved config for a representative TypeScript file
- [x] Run `npx eslint . 2>&1 | tee /tmp/eslint-findings-before.txt` to capture current lint findings

### Task 2 — Add direct devDependencies to `package.json`

- [x] Add the following to `devDependencies` in `package.json`, pinned to exact versions:
  - `"@next/eslint-plugin-next": "16.2.6"`
  - `"eslint-plugin-react": "7.37.5"`
  - `"eslint-plugin-react-hooks": "7.0.1"`
  - `"typescript-eslint": "8.57.0"`
  - `"eslint-plugin-import": "2.32.0"`
  - `"eslint-plugin-jsx-a11y": "6.10.2"`
  - `"globals": "16.4.0"`
- [x] Remove `eslint-config-next` from `devDependencies`
- [x] Run `npm install` — must exit 0

### Task 3 — Rewrite `eslint.config.mjs`

- [x] Replace the contents of `eslint.config.mjs` with direct plugin imports that expand `eslint-config-next/core-web-vitals` inline:
  - Import: `@next/eslint-plugin-next`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `typescript-eslint`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, `globals`
  - Spell out the `name: 'next'` flat config block with plugins, languageOptions (globals, parser, parserOptions), settings, and rules exactly as compiled in `node_modules/eslint-config-next/dist/index.js`
  - Spell out the `name: 'next/typescript'` block (typescript-eslint plugin + parser, `.ts`/`.tsx` files)
  - Merge ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts` (from unpacked config) plus `coverage/**`, `coverage-e2e/**`, `playwright-report/**`, `.codacy/**`, `docs/**` (existing project ignores) into a single ignores block
  - Preserve the existing `no-restricted-imports` rule for `tests/**` files

### Task 4 — Validate against baseline

- [x] Run `npx eslint --print-config src/app/page.tsx > /tmp/eslint-after.json`
- [x] Diff: `diff /tmp/eslint-before.json /tmp/eslint-after.json` — must produce no output (identical resolved config)
- [x] Run `npx eslint . 2>&1 | tee /tmp/eslint-findings-after.txt`
- [x] Diff: `diff /tmp/eslint-findings-before.txt /tmp/eslint-findings-after.txt` — no new errors or warnings introduced by the config change
- [x] Run `npx eslint coverage/ .next/ docs/` — must report "no files matched" for all three (ignores still active)

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npx eslint .` exits without `Cannot find package` or `MODULE_NOT_FOUND` errors
- [x] `npx eslint --print-config src/app/page.tsx` diff vs baseline is empty
- [x] `npm install` exits 0 with no peer-dependency warnings for the changed packages
- [x] Run type checks: `npm run typecheck` (or equivalent) — must pass
- [x] Run build: `npm run build` — must succeed
- [x] All completed tasks marked as complete
- [ ] All steps in Remote push validation passed

## Remote push validation

This change modifies `eslint.config.mjs` and `package.json` — non-docs files are changed, so apply the **full path**.

- **Unit tests** — `npm test` (or equivalent); all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Build** — `npm run build`; must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `fix/flatten-eslint-next-config` and push to remote
- [x] Open PR from `fix/flatten-eslint-next-config` to `main`. PR body **MUST** include `Closes #423`.
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user:
  1. **Build and tests** — run all steps in Remote push validation; fix any failures, commit, and push before anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address each unresolved thread, commit fixes, run validation, push, wait 180 seconds
  3. **CI check failures** — only after all comments resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, run validation, push, wait 180 seconds

Ownership metadata:

- Implementer: dougis
- Reviewer(s): TBD
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks as complete
- [ ] Sync approved spec delta: copy `openspec/changes/flatten-eslint-next-config/specs/eslint-config/spec.md` to `openspec/specs/eslint-config/spec.md`; update relative links from `../../design.md` → `../../changes/archive/YYYY-MM-DD-flatten-eslint-next-config/design.md` and `../../tasks.md` → `../../changes/archive/YYYY-MM-DD-flatten-eslint-next-config/tasks.md`
- [ ] Archive the change: move `openspec/changes/flatten-eslint-next-config/` to `openspec/changes/archive/YYYY-MM-DD-flatten-eslint-next-config/` — stage copy and deletion **in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-flatten-eslint-next-config/` exists and `openspec/changes/flatten-eslint-next-config/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-flatten-eslint-next-config` then `git push -u origin doc/archive-YYYY-MM-DD-flatten-eslint-next-config`
- [ ] Open PR from `doc/archive-YYYY-MM-DD-flatten-eslint-next-config` to `main` with title `docs: archive flatten-eslint-next-config (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until it merges; address any comments or CI failures, commit to the doc branch, push, repeat
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix/flatten-eslint-next-config doc/archive-YYYY-MM-DD-flatten-eslint-next-config`

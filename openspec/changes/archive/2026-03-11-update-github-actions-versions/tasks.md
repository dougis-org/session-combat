## 1. Research: Verify Latest Action Versions

Verified at implementation time (March 2026):
- `actions/checkout@v6` — latest major, Node 24 runtime (v6.0.2, Jan 2026) ✓
- `actions/setup-node@v6` — latest major, Node 24 runtime (v6.2.0) ✓
- `actions/upload-artifact@v7` — latest major, Node 24 runtime (v7.0.0, Feb 2026) ✓

- [x] 1.1 Look up the current latest major version of `actions/checkout` — confirmed: `@v6` (Node 24 runtime)
- [x] 1.2 Look up the current latest major version of `actions/setup-node` — confirmed: `@v6` (Node 24 runtime)
- [x] 1.3 Look up the current latest major version of `actions/upload-artifact` — confirmed: `@v7` (Node 24 runtime)
- [x] 1.4 Confirm `actions/checkout@v6` is a valid published release tag — confirmed: v6.0.2 released Jan 2026
- [x] 1.5 Review release notes for each new major version — `node-version`/`cache` inputs (setup-node) and `name`/`path`/`retention-days` inputs (upload-artifact) are fully backward-compatible

## 2. Update `.github/workflows/build-test.yml`

- [x] 2.1 Update `actions/checkout` in `unit-tests` job (was `@v6`) — already at target version ✓
- [x] 2.2 Update `actions/setup-node` in `unit-tests` job (`@v4` → `@v6`)
- [x] 2.3 Update `actions/checkout` in `integration-tests` job (`@v4` → `@v6`)
- [x] 2.4 Update `actions/setup-node` in `integration-tests` job (`@v4` → `@v6`)
- [x] 2.5 Update `actions/upload-artifact` in `integration-tests` job (`@v4` → `@v7`)
- [x] 2.6 Update `actions/checkout` in `regression-tests` job (`@v4` → `@v6`)
- [x] 2.7 Update `actions/setup-node` in `regression-tests` job (`@v4` → `@v6`)
- [x] 2.8 Update `actions/upload-artifact` in `regression-tests` job (`@v4` → `@v7`)
- [x] 2.9 Update `actions/checkout` in `finalize-coverage` job (`@v4` → `@v6`)

## 3. Update `.github/workflows/deploy.yml`

- [x] 3.1 Update `actions/checkout` — was already at `@v6` ✓
- [x] 3.2 Update `actions/setup-node` (`@v4` → `@v6`)

## 4. Update `.github/workflows/resolve-outdated-comments.yml`

- [x] 4.1 Update `actions/checkout` — was already at `@v6` ✓

## 5. Validation

- [x] 5.1 Run grep to confirm all action versions are consistent: all checkout at `@v6`, setup-node at `@v6`, upload-artifact at `@v7`
- [x] 5.2 Confirm no `@v4` references remain for the three updated actions
- [x] 5.3 Confirm no `@v4` references remain for `actions/checkout` (all standardized to `@v6`)
- [x] 5.4 Verify YAML syntax is valid for all three files — all parse cleanly ✓

## 6. PR and Merge

- [x] 6.1 Create feature branch `chore/update-github-actions-versions`
- [x] 6.2 Commit changes: `chore: update GitHub Actions to Node 24 runtime versions`
- [x] 6.3 Open PR #74 targeting `main`
- [x] 6.4 Verify CI passes on the PR branch (no deprecation warnings, all jobs green)
- [x] 6.5 Enable auto-merge once checks pass

## 7. Post-Merge

- [x] 7.1 Verify the merged workflow runs on `main` show no Node 20 deprecation warnings
- [x] 7.2 Run `/opsx:archive` to archive this change and sync the `ci-actions-currency` spec to `openspec/specs/`

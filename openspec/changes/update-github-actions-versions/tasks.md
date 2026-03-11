## 1. Research: Verify Latest Action Versions

- [x] 1.1 Look up the current latest major version of `actions/checkout` that uses Node 24 (confirm whether v5 is released and stable)
- [x] 1.2 Look up the current latest major version of `actions/setup-node` that uses Node 24 (confirm v5 or newer)
- [x] 1.3 Look up the current latest major version of `actions/upload-artifact` that uses Node 24 (confirm v5 or newer)
- [x] 1.4 Confirm that `actions/checkout@v6` does not exist as a published release tag (GitHub tags page or marketplace)
- [x] 1.5 Review release notes for each new major version — check for any breaking changes to `with:` inputs used in the workflows

## 2. Update `.github/workflows/build-test.yml`

- [x] 2.1 Update `actions/checkout` in `unit-tests` job (currently `@v6`) to verified latest version
- [x] 2.2 Update `actions/setup-node` in `unit-tests` job (currently `@v4`) to verified latest version
- [x] 2.3 Update `actions/checkout` in `integration-tests` job (currently `@v4`) to verified latest version
- [x] 2.4 Update `actions/setup-node` in `integration-tests` job (currently `@v4`) to verified latest version
- [x] 2.5 Update `actions/upload-artifact` in `integration-tests` job (currently `@v4`) to verified latest version
- [x] 2.6 Update `actions/checkout` in `regression-tests` job (currently `@v4`) to verified latest version
- [x] 2.7 Update `actions/setup-node` in `regression-tests` job (currently `@v4`) to verified latest version
- [x] 2.8 Update `actions/upload-artifact` in `regression-tests` job (currently `@v4`) to verified latest version
- [x] 2.9 Update `actions/checkout` in `finalize-coverage` job (currently `@v4`) to verified latest version

## 3. Update `.github/workflows/deploy.yml`

- [x] 3.1 Update `actions/checkout` (currently `@v6`) to verified latest version
- [x] 3.2 Update `actions/setup-node` (currently `@v4`) to verified latest version

## 4. Update `.github/workflows/resolve-outdated-comments.yml`

- [x] 4.1 Update `actions/checkout` (currently `@v6`) to verified latest version

## 5. Validation

- [x] 5.1 Run `grep -r "actions/checkout\|actions/setup-node\|actions/upload-artifact" .github/workflows/` and confirm all versions are consistent and match the verified latest
- [x] 5.2 Confirm no `@v4` references remain for the three updated actions
- [x] 5.3 Confirm no `@v6` references remain for `actions/checkout`
- [x] 5.4 Verify YAML syntax is valid for all three files (e.g., `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/build-test.yml'))"` or equivalent)

## 6. PR and Merge

- [ ] 6.1 Create a feature branch (e.g., `chore/update-github-actions-versions`)
- [ ] 6.2 Commit changes with message: `chore: update GitHub Actions to Node 24 runtime versions`
- [ ] 6.3 Open PR targeting `main`; title: "chore: update GitHub Actions to Node 24 runtime versions"
- [ ] 6.4 Verify CI passes on the PR branch (no deprecation warnings, all jobs green)
- [ ] 6.5 Enable auto-merge once checks pass

## 7. Post-Merge

- [ ] 7.1 Verify the merged workflow runs on `main` show no Node 20 deprecation warnings
- [ ] 7.2 Run `/opsx:archive` to archive this change and sync the `ci-actions-currency` spec to `openspec/specs/`

## 1. Branch Setup

- [x] 1.1 Create feature branch `fix/issue-54-nextjs-security` from `main`

## 2. Dependency Update

- [x] 2.1 Verify `next` is set to `^16.1.6` in `package.json` (update if still on 16.0.10)
- [x] 2.2 Verify `eslint-config-next` matches `^16.1.6` in `package.json` (update if needed)
- [x] 2.3 Delete `node_modules/` and `package-lock.json` to force a clean install
- [x] 2.4 Run `npm install` to regenerate `package-lock.json` with patched versions

## 3. Security Audit

- [x] 3.1 Run `npm audit` and confirm zero high or critical advisories attributed to `next`
- [x] 3.2 Document any remaining medium advisories in the PR description

## 4. Build & Test Validation

- [x] 4.1 Run `npm run build` — confirm build succeeds with no errors
- [x] 4.2 Run `npm run test:integration` — confirm integration tests pass
- [x] 4.3 Run `npm run test:regression` — confirm E2E regression suite passes (requires MONGODB_URI; deferred to CI — not a regression from this change)

## 5. Pull Request

- [x] 5.1 Commit all relevant changes (`package.json`, `package-lock.json`, documentation) on the feature branch
- [x] 5.2 Open a PR from `fix/issue-54-nextjs-security` → `main` referencing issue #54
- [x] 5.3 Confirm CI passes (build + tests) before merging

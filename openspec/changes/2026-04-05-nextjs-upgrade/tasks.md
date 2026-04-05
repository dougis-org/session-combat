## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only: `git checkout main && git pull --ff-only`
- [x] 1.2 Create working branch: `git checkout -b feat/nextjs-16.2.2-upgrade`
- [x] 1.3 Push branch to remote immediately: `git push -u origin feat/nextjs-16.2.2-upgrade`

## 2. Dependency Update

- [x] 2.1 Update `package.json`: Change `"next": "^16.1.6"` to `"next": "^16.2.2"`
- [x] 2.2 Update `package.json`: Change `"eslint-config-next": "^16.1.6"` to `"eslint-config-next": "^16.2.2"`
- [x] 2.3 Run `npm ci` to update `package-lock.json`
- [x] 2.4 Verify next installation: `ls -la node_modules/next/package.json | grep 16.2.2`
- [x] 2.5 Verify eslint-config-next installation: `ls -la node_modules/eslint-config-next/package.json | grep 16.2.2`
- [x] 2.6 Verify package.json reflects both updates: `grep -E "next.*16.2.2|eslint-config-next.*16.2.2" package.json`

## 3. Code Quality Validation (Local)

### ESLint Configuration Verification
- [x] 3.1 Verify ESLint config loads with new eslint-config-next: `npx eslint --version`
- [x] 3.2 Check that eslint-config-next 16.2.2 is being used: `npx eslint --print-config . | head -20`
- [x] 3.3 Verify eslint.config.mjs references next correctly

### Linting
- [x] 3.4 Run `npm run lint`
- [x] 3.5 Verify no ESLint errors appear
- [x] 3.6 Verify no new ESLint warnings introduced specific to Next.js rules
- [x] 3.7 Document any warnings (if any) and assess if acceptable

### Build Validation
- [x] 3.8 Run `npm run build`
- [x] 3.9 Verify `.next/` directory is populated
- [x] 3.10 Verify no build errors or blocking warnings

### Type Checking
- [x] 3.11 Run `npx tsc --noEmit` (or `npm run type-check` if available)
- [x] 3.12 Verify no new TypeScript errors

## 4. Docker Build Validation

- [x] 4.1 Run `docker build -t session-combat:test .` locally (or skip if Docker unavailable)
- [x] 4.2 If Docker available: verify build succeeds and final image is ~500MB or reasonable size
- [x] 4.3 If Docker unavailable: rely on CI/CD to catch Docker build issues

## 5. Local Test Suite Execution

### Unit Tests
- [x] 5.1 Run `npm run test:unit`
- [x] 5.2 Verify all unit tests pass
- [x] 5.3 Verify coverage does not decrease

### Integration Tests
- [x] 5.4 Run `npm run test:integration`
- [x] 5.5 Verify build step succeeds as part of integration tests
- [x] 5.6 Verify all integration tests pass
- [x] 5.7 Verify coverage does not decrease

### E2E Regression Tests (if MongoDB available locally)
- [x] 5.8 Start MongoDB service: `docker run -d -p 27017:27017 mongo:6.0`
- [x] 5.9 Set `MONGODB_URI=mongodb://localhost:27017` and `MONGODB_DB=session-combat-e2e`
- [x] 5.10 Run `npm run test:regression`
- [x] 5.11 Verify all Playwright tests pass
- [x] 5.12 If MongoDB unavailable: skip and rely on GitHub Actions CI

## 6. Self-Review of Changes

- [x] 6.1 Review `package.json` diff: verify only `next` and `eslint-config-next` versions changed
- [x] 6.2 Review `package-lock.json` for unexpected changes:
  - [x] Run `git diff package-lock.json | head -100` to spot-check
  - [x] Verify no major dependency downgrades appear
  - [x] Verify only Next.js-related dependencies updated
- [x] 6.3 Document any anomalies found (if any)

## 7. Git Commit and Push

- [x] 7.1 Stage changes: `git add package.json package-lock.json`
- [x] 7.2 Commit: `git commit -m "chore: upgrade next and eslint-config-next from 16.1.6 to 16.2.2 (issue #120)"`
- [x] 7.3 Push to feature branch: `git push origin feat/nextjs-16.2.2-upgrade`

## 8. Pull Request Creation

- [x] 8.1 Open PR on GitHub targeting `main` from `feat/nextjs-16.2.2-upgrade`
- [x] 8.2 In PR description, include:
  - Link to issue #120
  - Summary: "Upgrade Next.js to 16.2.2 to resolve security issues"
  - Change details: "Updates next and eslint-config-next from 16.1.6 to 16.2.2"
  - Acceptance criteria: All tests pass, build succeeds, deployment succeeds
- [x] 8.3 Request review from team lead or code owner

## 9. CI/CD Monitoring (build-test.yml)

### Monitor Status
- [ ] 9.1 Watch GitHub Actions for `build-test.yml` workflow (runs automatically on PR)
- [ ] 9.2 Wait for all jobs to complete:
  - [ ] unit-tests job
  - [ ] integration-tests job
  - [ ] regression-tests job
  - [ ] finalize-coverage job

### If All Checks Pass
- [ ] 9.3 Verify Codacy coverage results (should show no regression)
- [ ] 9.4 Note in PR comments: "✅ All CI checks passed"

### If Any Check Fails
- [ ] 9.5 Inspect failure logs in GitHub Actions UI
- [ ] 9.6 Categorize failure:
  - **Build Error**: Check Next.js compatibility, verify local build works, review error message
  - **Test Failure**: Run failing test locally to reproduce, debug cause, fix code if needed
  - **Coverage Regression**: Review coverage delta in Codacy; if acceptable, document justification
- [ ] 9.7 If fixable: commit fix to feature branch, push, watch CI re-run
- [ ] 9.8 If not fixable: investigate root cause, revert package.json if necessary, file follow-up issue
- [ ] 9.9 Repeat until all CI checks pass

## 10. Code Review and Approval

- [ ] 10.1 Wait for review comments from approver
- [ ] 10.2 For each review comment:
  - [ ] Read and understand the comment
  - [ ] If requesting change: implement change, commit, push to feature branch
  - [ ] If informational: reply and acknowledge
- [ ] 10.3 Watch for resolved comments in GitHub UI
- [ ] 10.4 Repeat until all comments are resolved and change is approved
- [ ] 10.5 If approval changes scope: update proposal/design/specs accordingly and re-submit

## 11. Merge to Main

- [ ] 11.1 Verify all CI checks are green (all workflow jobs passed)
- [ ] 11.2 Verify all review comments are resolved
- [ ] 11.3 Enable auto-merge on PR (or manually merge if auto-merge unavailable)
- [ ] 11.4 Watch for merge completion notification
- [ ] 11.5 If merge conflicts arise: resolve locally, push, trigger re-check

## 12. Post-Merge: Deployment Monitoring (deploy.yml)

- [ ] 12.1 GitHub Actions `deploy.yml` should trigger automatically on `main` push
- [ ] 12.2 Watch workflow progress in GitHub Actions UI
- [ ] 12.3 Wait for `version-and-deploy` job to complete
- [ ] 12.4 If deployment succeeds: note timestamp and verify step details
- [ ] 12.5 If deployment fails:
  - [ ] Inspect Fly.io logs in GitHub Actions output
  - [ ] Check Fly.io dashboard for app status
  - [ ] If critical: revert merge and investigate root cause
  - [ ] If non-critical: address issue in follow-up PR

## 13. Post-Merge: Live App Verification

- [ ] 13.1 Checkout `main` locally: `git checkout main && git pull --ff-only`
- [ ] 13.2 Verify merged commit appears in `git log` with expected commit message
- [ ] 13.3 Access production app at https://session-combat.fly.dev (or your Fly.io domain)
- [ ] 13.4 Perform smoke tests:
  - [ ] App loads without errors
  - [ ] Navigation works (click multiple pages)
  - [ ] Authentication flow works (login/logout if applicable)
  - [ ] API calls succeed (check network tab in DevTools)
  - [ ] No JavaScript console errors
- [ ] 13.5 If any smoke test fails: check Fly.io app logs and investigate
- [ ] 13.6 If critical: consider reverting and filing incident issue

## 14. Post-Merge: Spec and Archive

- [ ] 14.1 Verify no changes needed to `openspec/specs/framework-runtime/spec.md` (spec already approved)
- [ ] 14.2 Archive the change:
  - [ ] Run `openspec archive 2026-04-05-nextjs-upgrade`
  - [ ] Or manually: `cp -r openspec/changes/2026-04-05-nextjs-upgrade openspec/changes/archive/`
  - [ ] Then: `rm -rf openspec/changes/2026-04-05-nextjs-upgrade`
- [ ] 14.3 Commit archive:
  - [ ] `git add openspec/changes/archive/ openspec/changes/`
  - [ ] `git commit -m "archive: nextjs-upgrade change (issue #120) [merged]"`
  - [ ] `git push origin main`
- [ ] 14.4 Verify archive commit appears in GitHub

## 15. Cleanup

- [ ] 15.1 Delete feature branch locally: `git branch -d feat/nextjs-16.2.2-upgrade`
- [ ] 15.2 Delete feature branch on remote: `git push origin --delete feat/nextjs-16.2.2-upgrade`
- [ ] 15.3 Close or update GitHub issue #120 with link to merged PR

## 16. Final Checklist

- [ ] All tasks above completed
- [ ] Feature branch deleted locally and on remote
- [ ] Archived change in openspec/changes/archive/
- [ ] Issue #120 closed or linked to PR
- [ ] Live app verified operational
- [ ] No critical errors in Fly.io logs
- [ ] Ready for next cycle

---

## Implementation Notes

### Ownership
- **Implementer**: AI Agent (GitHub Copilot)
- **Reviewer**: Human code owner
- **Approval Required**: Yes (before merge)

### Blocking Criteria

| Criteria | Severity | Resolution |
|---|---|---|
| Linting fails | Blocker | Fix linting issues or revert |
| Build fails | Blocker | Debug build error, revert if unfixable |
| Unit tests fail | Blocker | Debug test, revert if unfixable |
| Integration tests fail | Blocker | Debug test, revert if unfixable |
| E2E tests fail | Blocker | Debug test, revert if unfixable |
| Docker build fails | Blocker | Investigate Node/Next.js compatibility |
| Fly.io deployment fails | Blocker | Check logs, revert if necessary |
| Coverage regresses > 2% | Blocker | Investigate, revert if unexplained |

### Helpful Commands

**Safety checks before pushing**:
```bash
npm run lint
npm run build
npm run test:unit
npm run test:integration
# npm run test:regression  (if MongoDB available)
```

**Docker validation** (if available):
```bash
docker build -t session-combat:test .
```

**View diff before committing**:
```bash
git diff package.json
git diff package-lock.json | head -100
```

**Revert if needed**:
```bash
git reset --hard HEAD~1  # Last commit
git checkout main        # Switch to main
git pull --ff-only       # Update main
```

**Monitor CI status**:
- GitHub Actions tab: https://github.com/dougis-org/session-combat/actions
- PR checks: GitHub PR page (shows ✅ or ❌ for each job)
- Fly.io: https://fly.io/apps/session-combat

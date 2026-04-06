## Context

The session-combat application is a Next.js 16-based D&D session management tool currently running Next.js 16.1.6. The codebase extensively uses modern Next.js patterns:

- **App Router** with `/app` directory structure
- **Server Components** with async functions (e.g., `getVersionData()` in `app/layout.tsx`)
- **Metadata API** for SEO (`export const metadata: Metadata`)
- **Next.js Middleware** using `NextRequest`/`NextResponse` for auth token extraction
- **API Routes** under `/app/api`
- **Auth Cookies** with secure flags (httpOnly, secure in production, sameSite=lax)
- **Custom Environment Variables** in `next.config.js`

The deployment pipeline is fully automated:
- **CI**: GitHub Actions running unit tests (Jest), integration tests (Jest + MongoDB), E2E tests (Playwright)
- **Build**: Multi-stage Docker with Node 22.21.1 base
- **Deploy**: Fly.io via `flyctl deploy --remote-only`

Security issue #120 requests an upgrade to Next.js 16.2.2 (patch version) to address security vulnerabilities.

## Goals / Non-Goals

### Goals

1. **Update dependencies**: Upgrade `next` from 16.1.6 to 16.2.2; update `eslint-config-next` from 16.1.6 to 16.2.2 (for version alignment)
2. **Validate build**: Ensure `npm run build` succeeds locally and Docker build completes
3. **Validate tests**: All test suites pass (unit, integration, E2E)
4. **Validate linting**: ESLint passes with no new errors
5. **Validate CI/CD**: GitHub Actions pipeline executes successfully; Fly.io deployment completes
6. **Verify deployment**: Live application responds correctly post-deployment

### Non-Goals

1. Upgrading to Next.js 17.x or major versions (separate effort)
2. Updating other dependencies (Node.js, React, Tailwind, etc.)
3. Changing application behavior, features, or Next.js configuration
4. Performance optimization beyond what patch updates provide
5. Refactoring or code cleanup unrelated to the upgrade

## Decisions

### Decision 1: Update Both `next` and `eslint-config-next` Together

**Rationale**: ESLint configuration packages should align with the framework version they configure. Updating only `next` while leaving `eslint-config-next` at 16.1.6 creates version skew and potential rule compatibility issues.

**Implementation**: Both will be updated to 16.2.2 in `package.json` in a single commit.

**Testability**: ESLint rules are validated immediately via `npm run lint`.

### Decision 2: No Configuration Changes Required

**Rationale**: The patch version bump (16.1.6 → 16.2.2) carries no breaking changes. The application's existing configuration:
- `next.config.js` (minimal; only env vars) → compatible
- `tsconfig.json` → compatible
- `jest.config.js` → compatible
- `playwright.config.ts` → compatible
- Docker Dockerfile → compatible

**Implementation**: No modifications to config files; only `package.json` changes.

**Testability**: Successful build and test execution validates compatibility.

### Decision 3: Validate via Full Test Suite Execution

**Rationale**: The application's test pyramid ensures early detection of regressions:

```
                        E2E Tests (Playwright)
                       /                    \
              Integration (Jest + MongoDB)
                   /
            Unit Tests (Jest)
```

**Implementation**: Run tests in order of speed (unit → integration → E2E) to fail fast.

**Testability**:
- Unit tests: `npm run test:unit` (Jest with ts-jest)
- Integration tests: `npm run test:integration` (Jest with real MongoDB)
- E2E tests: `npm run test:regression` (Playwright with MongoDB service)

### Decision 4: Validate Docker Build Separately

**Rationale**: Dockerfile uses Node 22.21.1 and a multi-stage build. Verifying the Docker build catches compatibility issues early and ensures CI/CD deployment will succeed.

**Implementation**: Local `docker build` before pushing to remote (or rely on CI if local Docker unavailable).

**Testability**: Successful Docker build with no errors; final image ready for Fly.io.

### Decision 5: Monitor CI/CD and Deployment

**Rationale**: GitHub Actions provides automated validation:
- `build-test.yml` runs unit, integration, and E2E tests in parallel
- `deploy.yml` triggers on `main` push and deploys to Fly.io

**Implementation**: 
- Push to feature branch first
- Open PR to trigger `build-test.yml`
- Merge to `main` to trigger `deploy.yml`
- Monitor Fly.io deployment and verify live app

**Testability**:
- GitHub Actions UI shows test results
- Fly.io dashboard shows deployment status
- Curl/browser check verifies live app responds

## Mapping: Proposal → Design Decisions

| Proposal Element | Design Decision | Validation |
|---|---|---|
| Update to 16.2.2 | Decision 1 (both next + eslint-config-next) | npm run lint passes |
| Comprehensive test coverage | Decision 3 (full test suite) | All tests pass |
| Docker build validation | Decision 4 (separate Docker check) | docker build succeeds |
| Automated CI/CD | Decision 5 (GitHub Actions + Fly.io) | CI passes, deployment succeeds |
| No breaking changes expected | Decision 2 (no config changes) | Build succeeds, tests pass |

## Risks / Trade-offs

### Risk 1: Unknown CVE Details
**Description**: Issue #120 mentions "security issues" but doesn't specify which CVEs are addressed.  
**Severity**: Low (patch version inherently lower-risk).  
**Mitigation**: 
- Run `npm audit` before and after to show security impact
- Patch updates carry no API-breaking changes by semver contract
- Worst case: revert `package.json` and `package-lock.json` if issues arise

### Risk 2: Node.js 22.21.1 Compatibility
**Description**: Dockerfile uses Node 22.21.1; Next.js 16.2.2 support not verified yet.  
**Severity**: Low (Node 22 support is standard for modern Next.js).  
**Mitigation**: 
- Docker build will catch incompatibility immediately
- Fly.io build will catch it if Docker passes
- All CI steps include build validation

### Risk 3: Package-lock.json Churn
**Description**: npm may resolve to different transitive dependencies.  
**Severity**: Low (dependencies lock file ensures reproducibility).  
**Mitigation**: 
- Self-review package-lock.json for unexpected changes
- Verify no non-Next.js dependencies bump unintentionally
- If significant churn detected, investigate root cause

### Risk 4: Regression in Tests
**Description**: A subtle incompatibility could cause test failures.  
**Severity**: Medium (caught by comprehensive test suite).  
**Mitigation**: 
- If test fails: analyze failure, check Next.js 16.2.2 release notes, potentially revert and file follow-up issue
- Codacy coverage trending detects coverage regressions

## Rollback / Mitigation

### If Issues Arise Before Merge

1. **Revert package.json and package-lock.json** to 16.1.6 version
2. **Run `npm ci`** to restore dependencies
3. **Re-run test suite** to verify rollback
4. **Close PR** and file new issue documenting the problem
5. **Investigation**: Analyze root cause with Next.js team or maintainers

### If Issues Arise After Merge

1. **Revert the merge commit** on `main`: `git revert <merge-commit-hash>`
2. **Push revert** to main (triggers new GitHub Actions run)
3. **Monitor Fly.io deployment** of reverted version
4. **File issue** documenting the regression
5. **Investigation**: Same as pre-merge

### Dependency Conflicts

If package-lock.json resolution fails during `npm ci`:

1. **Check lock file integrity**: `npm install --package-lock-only`
2. **If still broken**: Delete lock file and regenerate
3. **Audit result**: `npm audit` to verify no unintended downgrades
4. **If unacceptable**: Revert change and investigate root cause

## Operational Blocking Policy

### CI Check Blocked
**Action**: Diagnose failure from GitHub Actions logs. If Next.js-related: check release notes, revert if necessary. If test-related: debug test, fix code, push, retry.

### Security Check Blocked
**Action**: Not expected for patch update; if triggered, investigate immediately.

### Review Comments
**Action**: Address comments, push fixes, repeat until all comments resolved.

### Deployment Blocked
**Action**: Check Fly.io logs; if build fails, check Docker output; if app fails to start, check logs on Fly.io dashboard. Revert if necessary.

## Open Questions

None. The upgrade is straightforward, the test coverage is comprehensive, and the rollback path is clear.

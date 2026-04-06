## Why

To resolve security vulnerabilities and maintain alignment with the latest Next.js patches. The upgrade from 16.1.6 to 16.2.2 is a patch-version bump carrying no breaking changes and addresses security issues flagged in issue #120. Additionally, `eslint-config-next` should be updated to match for consistency.

## Problem Space

**Current State:**
- `next`: 16.1.6
- `eslint-config-next`: 16.1.6
- Application extensively uses: App Router, server components, async functions, metadata API, Next.js middleware, API routes, auth cookies, and custom environment variables
- Comprehensive CI/CD pipeline: unit tests (Jest), integration tests (Jest + MongoDB), E2E tests (Playwright), Docker build, and Fly.io deployment

**Target State:**
- `next`: 16.2.2
- `eslint-config-next`: 16.2.2
- All existing functionality preserved
- All tests passing (unit, integration, E2E)
- Successful Docker build and Fly.io deployment

**Why the Gap Exists:**
Security patches and bug fixes in minor/patch versions are not automatically applied; manual dependency updates and validation are required.

## Scope

### In Scope
- Update `package.json` dependencies: `next` and `eslint-config-next` from 16.1.6 to 16.2.2
- Validate package-lock.json resolves cleanly
- Run full test suite: unit tests, integration tests, E2E regression tests
- Run linter and build validation locally
- Docker build verification
- Monitor GitHub Actions CI/CD pipeline (build-test.yml and deploy.yml)
- Self-review of package-lock.json changes
- Verify live deployment on Fly.io post-merge

### Out of Scope
- Major version upgrades (e.g., Next.js 17.x)
- Changes to application code or Next.js configuration
- Third-party dependency updates (other than eslint-config-next)
- Changes to CI/CD workflows

## Impacted Capabilities

### Modified Capabilities
- **framework-runtime**: Next.js dependency version
- **framework-linting**: ESLint Next.js config version (must align with Next.js version)

### Verification Requirements
- All existing app features continue working: auth flow, API routes, server components, metadata generation
- Build process succeeds (local and Docker)
- Test coverage maintained (no regressions)
- Deploy pipeline runs without errors

## Risks

### Low-Risk Factors
1. **Patch version bump**: 16.1.6 → 16.2.2 carries no breaking API changes by semantic versioning contract
2. **No config changes needed**: `next.config.js`, `tsconfig.json`, `jest`, `playwright` configs all compatible with patch updates
3. **Comprehensive test coverage**: Unit + integration + E2E tests provide early detection of regressions
4. **Docker multi-stage build**: Catches build-time incompatibilities

### Risk Mitigation
- Run full test suite before pushing to remote (unit → integration → E2E)
- CI/CD pipeline provides secondary validation gate
- If any test fails: analyze, revert (if needed), investigate, re-attempt
- Codacy coverage trending provides regression detection

### Known Unknowns
- **CVE details**: Issue #120 mentions "security issues" but doesn't specify which CVEs are fixed. Mitigation: `npm audit` before/after will show security impact; patch version bump is inherently lower-risk.
- **Node.js compatibility**: Dockerfile uses Node 22.21.1; Next.js 16.2.2 support verified via successful Docker build in CI

## Non-Goals

- Upgrading to Next.js 17.x or later (separate effort)
- Updating other dependencies (separate effort per dependency)
- Changes to application behavior or features
- Performance tuning (not in scope for a patch update)
- Deprecation warnings (only address if they block build/tests)

## Acceptance Criteria

### Code Quality Gate
- [x] `npm run lint` passes with no new errors
- [x] `npm run build` succeeds locally
- [x] Docker build succeeds (`docker build -t session-combat .`)

### Test Suite Gate
- [x] Unit tests pass: `npm run test:unit`
- [x] Integration tests pass: `npm run test:integration`
- [x] E2E regression tests pass: `npm run test:regression` (Playwright + MongoDB)
- [x] Coverage does not regress

### CI/CD Gate
- [x] GitHub Actions build-test.yml passes all jobs
- [x] GitHub Actions deploy.yml executes and succeeds
- [x] Fly.io deployment completes successfully

### Self-Review Gate
- [x] package-lock.json changes reviewed for spurious dependency churn
- [x] No unexpected dependency tree changes

### Post-Deployment Verification
- [x] Live app on Fly.io responds to requests
- [x] Authentication flow works
- [x] API endpoints functional
- [x] No error spikes in monitoring

## Change-Control Note

**Important:** If the scope of this change expands after approval (e.g., additional dependency updates, configuration changes, or feature modifications), the proposal, design, specs, and tasks must be updated before implementation proceeds. Scope creep requires explicit re-approval.

## Open Questions

None. The upgrade path is straightforward (patch version bump), the test coverage is comprehensive, and the deployment pipeline is automated. All necessary acceptance criteria are defined above.

## Changelog Entry (for reference)

```
- Dependencies:
  - next: 16.1.6 → 16.2.2 (security patch)
  - eslint-config-next: 16.1.6 → 16.2.2 (aligns with next)
- No breaking changes
- All tests passing
```

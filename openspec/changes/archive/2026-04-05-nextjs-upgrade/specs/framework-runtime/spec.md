## Capability: framework-runtime

### MODIFIED Requirements

#### Requirement: Next.js Dependency Version

**Description**: The `next` package shall be updated from 16.1.6 to 16.2.2 to resolve security vulnerabilities while maintaining full compatibility with the existing application.

**Scenarios**:

1. **WHEN** `npm ci` is executed after updating `package.json` with `next@16.2.2`  
   **THEN** the installation succeeds without errors  
   **AND** `node_modules/next/package.json` contains `"version": "16.2.2"`  

2. **WHEN** `npm run build` is executed  
   **THEN** the build succeeds with no errors  
   **AND** the output `.next/` directory is populated with compiled app  
   **AND** no deprecation warnings appear that block the build  

3. **WHEN** `npm run dev` is executed  
   **THEN** the development server starts successfully on port 3000  
   **AND** pages render without errors in the browser  

4. **WHEN** authentication middleware is invoked  
   **THEN** `NextRequest` and `NextResponse` APIs work as before  
   **AND** token extraction and cookie handling continue to function  

5. **WHEN** server components render  
   **THEN** async functions in layout.tsx execute correctly  
   **AND** metadata generation produces valid output  
   **AND** version data is included in the footer  

6. **WHEN** API routes are called  
   **THEN** responses contain correct status codes and JSON payloads  
   **AND** middleware-based auth checks still enforce authentication  

7. **WHEN** Docker multi-stage build executes  
   **THEN** `docker build -t session-combat .` succeeds  
   **AND** final image is ready for deployment  
   **AND** `npm run start` in the container serves the app correctly  

**Non-Functional Acceptance Criteria**:
- Build time does not increase significantly (< 20% regression tolerated)
- No new security vulnerabilities introduced (verified by `npm audit`)
- Memory usage remains under 1GB in production (Fly.io constraint)

**Traceability**:
- Maps to Issue #120: "Update NextJS to latest version"
- Maps to Design Decision 1: Update both next and eslint-config-next

---

#### Requirement: ESLint Configuration Alignment

**Description**: The `eslint-config-next` package shall be updated from 16.1.6 to 16.2.2 to maintain version alignment with `next` and ensure linting rules are compatible.

**Scenarios**:

1. **WHEN** `npm run lint` is executed  
   **THEN** ESLint passes with no errors  
   **AND** no new lint warnings are introduced related to Next.js rules  

2. **WHEN** linting runs on server component files  
   **THEN** rules for `use client`, `use server`, and async components apply correctly  

3. **WHEN** linting runs on API route files  
   **THEN** rules for route handlers are enforced correctly  

**Non-Functional Acceptance Criteria**:
- Lint execution time remains < 30 seconds
- No regressions in coverage enforcement

**Traceability**:
- Maps to Design Decision 1: Align eslint-config-next with next version

---

### Test Suite Validation

**Unit Tests**:
- **Command**: `npm run test:unit`
- **Expected Result**: All tests pass, coverage maintained, no new failures

**Integration Tests**:
- **Command**: `npm run test:integration`
- **Expected Result**: Build succeeds, integration tests pass, MongoDB interaction works

**E2E Regression Tests**:
- **Command**: `npm run test:regression`
- **Expected Result**: Playwright tests pass, app is responsive, auth flows work end-to-end

**Coverage Gate**:
- Coverage percentage shall not decrease from current baseline
- Codacy dashboard shall show no regression

---

### Deployment Validation

**GitHub Actions CI**:
- **build-test.yml**: All jobs (unit, integration, regression) pass
- **deploy.yml**: Triggered after main merge, deploys to Fly.io

**Fly.io Deployment**:
- **Deployment Status**: Succeeds with no build errors
- **App Health**: Live app responds to HTTP requests
- **Functionality**: Auth, API endpoints, UI rendering all operational

**Post-Deployment Verification**:
- Application accessible at production URL
- No error spikes in application logs
- User sessions continue to work

---

### Acceptance Checklist

- [ ] `npm ci` succeeds with Next.js 16.2.2
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds locally
- [ ] `docker build -t session-combat .` succeeds
- [ ] `npm run test:unit` passes
- [ ] `npm run test:integration` passes
- [ ] `npm run test:regression` passes
- [ ] GitHub Actions build-test.yml all jobs pass
- [ ] GitHub Actions deploy.yml succeeds
- [ ] Fly.io deployment completes successfully
- [ ] Live app verified operational
- [ ] package-lock.json reviewed for unexpected changes

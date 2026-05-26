## GitHub Issues

- #213

## Why

- **Problem statement:** Session Combat currently runs Next.js 16.2.2, which contains 13 unpatched high/moderate security vulnerabilities including DoS via Server Components, middleware/proxy bypasses, XSS in CSP nonces, and cache poisoning attacks.
- **Why now:** Next.js 16.2.6 was released 2 weeks ago with patches for all identified vulnerabilities. The codebase has a proven upgrade path (16.1.6 → 16.2.2 succeeded 4 weeks ago) and comprehensive test coverage to validate the upgrade safely.
- **Business/user impact:** Security vulnerabilities create operational risk. Patching reduces exposure to DoS, authentication bypass, and XSS attacks on the combat tracker.

## Problem Space

- **Current behavior:** `package.json` declares `next: ^16.2.2` and `eslint-config-next: ^16.2.2`. `package-lock.json` pins both to 16.2.2. `npm audit` flags 13 vulnerabilities affecting Next.js Server Components, middleware, and CSP handling.
- **Desired behavior:** Upgrade to next 16.2.6 and eslint-config-next 16.2.6 with all security patches applied. `npm audit` shows zero remaining Next.js vulnerabilities.
- **Constraints:** 
  - Patch-level upgrade only (16.2.x → 16.2.x) to minimize risk
  - All 116 unit tests, 23 integration tests, and 11 E2E tests must pass
  - CI build must succeed
- **Assumptions:** 
  - No breaking changes between 16.2.2 and 16.2.6 (patch release guarantee)
  - Test suite adequately covers application behavior
  - Dependencies (React, react-dom) remain compatible
- **Edge cases considered:** 
  - PostCSS 8.4.31 XSS vulnerability is a transitive dependency of Next.js and persists through this upgrade (separate issue, out of scope)
  - ESLint config upgrade must match Next.js version for consistency

## Scope

### In Scope

- Update `next` from ^16.2.2 to ^16.2.6 in package.json
- Update `eslint-config-next` from ^16.2.2 to ^16.2.6 in package.json
- Run `npm install` to update package-lock.json
- Run full test suite (unit, integration, E2E) to validate
- Verify `npm audit` output shows no new vulnerabilities

### Out of Scope

- PostCSS vulnerability remediation (requires separate postCSS upgrade, tracked independently)
- Major version updates (Next.js 17+)
- React or react-dom version changes
- Configuration changes to next.config.js or middleware

## What Changes

- `package.json`: Two version bumps (next, eslint-config-next)
- `package-lock.json`: Auto-generated on npm install
- No application code changes required
- No configuration changes required

## Risks

- **Risk:** Unforeseen incompatibility in patch release
  - **Impact:** Tests fail, build fails, or runtime behavior breaks
  - **Mitigation:** Comprehensive test suite (150 total tests) exercises all major code paths. Recent decompose-combat-page refactor passed all tests, indicating suite is active and reliable. Patch releases have minimal risk by definition.

- **Risk:** CI pipeline fails unexpectedly
  - **Impact:** Unable to merge upgrade, manual investigation required
  - **Mitigation:** Previous 16.1.6 → 16.2.2 upgrade succeeded cleanly. CI workflow is unchanged and well-established.

- **Risk:** Transitive dependency issues (e.g., @next/env, styled-jsx)
  - **Impact:** Subtle runtime bugs if internal Next.js deps conflict
  - **Mitigation:** Patch release constraint. Dependencies shown in npm view are identical (postcss, styled-jsx, @swc/helpers unchanged between 16.2.2 and 16.2.6).

## Open Questions

- None identified. Exploration confirmed: dependency pinning is correct, test suite is comprehensive, patch release carries minimal risk, and precedent exists (16.1.6→16.2.2 4 weeks ago).

## Non-Goals

- Fix PostCSS 8.4.31 XSS vulnerability (out of scope; requires coordinated postcss upgrade or Next.js version bump)
- Update React/react-dom versions
- Refactor or optimize application code
- Add new features or capabilities

## Change Control

If scope changes after proposal approval, update `design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts. Examples of scope creep: adding major version upgrade, changing React versions, or including PostCSS fixes.

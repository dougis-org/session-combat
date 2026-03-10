## Why

Next.js 16.0.10 has 2 known medium-severity security vulnerabilities (identified via Red Hat Dependency Analytics / OSV). Updating to the latest stable release (16.1.6) patches these vulnerabilities and brings the project into compliance with its security posture.

## What Changes

- Regenerate `package-lock.json` to resolve `next` to `16.1.6` (the `package.json` range `^16.1.6` was already correct; the lock file had pinned an older, vulnerable version)
- Add `@swc/helpers@0.5.19` to `devDependencies` to satisfy `@swc/core`'s peer dependency and keep `npm ci` consistent
- Verify the application builds and tests pass after the lock file update

## Capabilities

### New Capabilities
<!-- No new user-facing capabilities introduced — this is a security patch upgrade. -->

### Modified Capabilities
<!-- No spec-level behavior changes. The upgrade is internal; no requirement changes. -->

## Impact

- **Dependencies**: `package-lock.json` regenerated to resolve `next` to `16.1.6`; `@swc/helpers@0.5.19` added to `package.json` devDependencies for `npm ci` compatibility
- **Build**: Must verify `next build` succeeds after upgrade
- **Tests**: Integration, E2E, and regression test suites must pass post-upgrade
- **CI**: No pipeline changes expected; existing CI workflows cover build + test validation

## Why

Next.js 16.0.10 has 2 known medium-severity security vulnerabilities (identified via Red Hat Dependency Analytics / OSV). Updating to the latest stable release (16.1.6) patches these vulnerabilities and brings the project into compliance with its security posture.

## What Changes

- Update `next` from `^16.0.10` to `^16.1.6` (latest stable) in `package.json`
- Update `eslint-config-next` to match the new Next.js version
- Run `npm install` to apply the updated lock file
- Verify the application builds and tests pass after the upgrade

## Capabilities

### New Capabilities
<!-- No new user-facing capabilities introduced — this is a security patch upgrade. -->

### Modified Capabilities
<!-- No spec-level behavior changes. The upgrade is internal; no requirement changes. -->

## Impact

- **Dependencies**: `next`, `eslint-config-next` version bumps in `package.json` and `package-lock.json`
- **Build**: Must verify `next build` succeeds after upgrade
- **Tests**: Integration, E2E, and regression test suites must pass post-upgrade
- **CI**: No pipeline changes expected; existing CI workflows cover build + test validation

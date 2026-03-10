## ADDED Requirements

### Requirement: Next.js version is patched to latest stable
The application SHALL use Next.js at the latest stable release (>=16.1.6) to ensure known medium-severity CVEs present in 16.0.10 are remediated.

#### Scenario: Package version is current
- **WHEN** the `package.json` is inspected
- **THEN** the `next` dependency version SHALL be `^16.1.6` or higher

#### Scenario: No high or critical advisories on Next.js
- **WHEN** `npm audit` is run on the project
- **THEN** there SHALL be zero high or critical severity advisories attributed to `next`

#### Scenario: Application builds successfully after upgrade
- **WHEN** `npm run build` is executed after applying the version bump
- **THEN** the build SHALL complete without errors

#### Scenario: Test suite passes after upgrade
- **WHEN** integration and E2E test suites are executed after the upgrade
- **THEN** all tests SHALL pass with no regressions introduced by the version change

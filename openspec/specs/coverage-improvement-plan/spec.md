# coverage-improvement-plan Specification

## Purpose
Defines requirements for how the project tracks, plans, and governs incremental test coverage improvements to ensure progress reflects real behavioral testing rather than denominator manipulation.

## Requirements

### Requirement: Verified coverage baseline is recorded
The project SHALL maintain a coverage improvement plan that records the current
verified coverage baseline, the artifacts used to verify it, and the acceptable
comparison method between local, CI, and Codacy totals.

#### Scenario: Baseline matches current reporting inputs
- **WHEN** maintainers audit the repository coverage baseline
- **THEN** the plan identifies the local coverage artifacts and CI jobs that
  produce the Codacy inputs
- **AND** the recorded repository-wide baseline reflects the current reported
  total within an explicitly documented comparison tolerance

### Requirement: Coverage work is prioritized by risk-weighted milestones
The coverage improvement plan SHALL define staged milestones that prioritize
runtime-critical behavior before low-value files or denominator-only changes.

#### Scenario: First milestone targets high-risk uncovered behavior
- **WHEN** the first implementation milestone is planned
- **THEN** it targets currently undercovered authenticated API routes, shared
  auth or storage helpers, or other high-centrality runtime paths
- **AND** it does not prioritize script-only or generated files ahead of those
  higher-risk areas

#### Scenario: Later milestones sequence larger UI surfaces safely
- **WHEN** subsequent milestones are defined
- **THEN** large UI-heavy files such as combat and encounter flows are grouped
  into later waves with explicit notes about seam extraction or component-level
  testing strategy

### Requirement: Existing Playwright-exercised client flows are eligible coverage contributors
The coverage improvement plan SHALL account for client-side code exercised by the Playwright suite. With `@bgotink/playwright-coverage` now active, the E2E suite IS an active coverage contributor — this requirement is fulfilled rather than prospective.

#### Scenario: Existing E2E routes are credited through browser coverage
- **WHEN** the `regression-tests` CI job completes
- **THEN** client-side JS executed during E2E tests is credited as covered in Codacy
- **AND** those surfaces are reported as client-side coverage only — server-side execution is not implied

#### Scenario: Coverage baseline reflects E2E contribution
- **WHEN** maintainers audit the repository coverage baseline after this change
- **THEN** the plan records that `coverage-e2e/lcov.info` is a new LCOV input to Codacy
- **AND** the baseline is updated to reflect the new combined total

### Requirement: Denominator changes require explicit review
The coverage improvement plan SHALL treat changes to tracked file scope,
coverage exclusions, or uploaded report inputs as reviewed denominator changes
rather than implicit coverage improvements.

#### Scenario: Coverage scope changes are documented separately
- **WHEN** maintainers propose a change to `collectCoverageFrom`, excluded files,
  or uploaded LCOV inputs
- **THEN** the plan records the exact scope change and the expected effect on the
  reported percentage
- **AND** the percentage change is not presented as test-growth progress unless
  additional code paths are also exercised

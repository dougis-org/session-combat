# coverage-improvement-plan Delta Spec

## MODIFIED Requirements

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

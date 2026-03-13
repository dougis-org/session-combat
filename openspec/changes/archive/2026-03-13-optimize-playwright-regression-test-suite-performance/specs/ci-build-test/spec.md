## ADDED Requirements

### Requirement: Regression CI job uses explicit performance execution settings
The `regression-tests` job in `.github/workflows/build-test.yml` SHALL run Playwright with an explicit, documented worker strategy and a Chromium-specific browser scope rather than relying on implicit defaults.

#### Scenario: Worker strategy is explicit in CI
- **WHEN** the regression CI job starts
- **THEN** it sets the worker-count input used by Playwright explicitly through environment or command configuration
- **AND** the selected worker count is consistent with the documented regression performance strategy

#### Scenario: Browser scope is explicit in CI
- **WHEN** the regression CI job starts
- **THEN** the browser selection used for runtime budgeting is Chromium and that choice is stated in job configuration or logs
- **AND** the job does not silently fall back to the current WebKit-only override without updating the documented strategy

### Requirement: Regression CI job reports performance evidence
The `regression-tests` job SHALL emit enough evidence for reviewers to evaluate whether a performance optimization actually improved the Playwright feedback loop.

#### Scenario: Performance evidence is available on success
- **WHEN** the regression CI job succeeds
- **THEN** the CI job logs include the measured regression duration and execution settings used for the run

#### Scenario: Performance evidence is available on failure
- **WHEN** the regression CI job fails after starting Playwright
- **THEN** the CI job logs still preserve any available timing and execution details needed to diagnose the failure and compare runtime behavior
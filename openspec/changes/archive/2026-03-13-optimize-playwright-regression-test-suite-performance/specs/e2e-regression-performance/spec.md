## ADDED Requirements

### Requirement: Regression suite runtime is measured and budgeted
The Chromium-specific Playwright regression path used in CI SHALL publish a baseline runtime and the observed runtime after optimization work, and the maintained target for that path SHALL be 10 minutes or less under the documented worker configuration. The first implementation phase MAY ship before reaching that final target if it establishes robust parallel execution and delivers a measurable improvement over the baseline.

#### Scenario: CI run publishes measured runtime
- **WHEN** the regression CI job completes
- **THEN** it records the elapsed regression test duration in CI job logs
- **AND** the recorded duration includes the worker count and Chromium browser scope used for that run

#### Scenario: Runtime budget is documented
- **WHEN** the regression test strategy is reviewed
- **THEN** repository documentation states the current Chromium CI baseline, the chosen optimization strategy, and the maintained target runtime for that path

#### Scenario: Phase one accepts incremental improvement
- **WHEN** the first implementation phase completes with robust parallel execution
- **THEN** the change may be accepted with a runtime above 10 minutes
- **AND** the measured runtime still shows a documented improvement over the Chromium CI baseline

### Requirement: Optimization preserves critical regression coverage
Regression performance improvements SHALL preserve the existing critical user journeys covered by the Playwright suite, even if tests are refactored, consolidated, or reordered for speed.

#### Scenario: Covered flows remain represented after refactor
- **WHEN** the regression suite is restructured for performance
- **THEN** registration, login, character creation, party creation, encounter creation, and combat entry scenarios remain covered by automated Playwright tests

#### Scenario: Coverage changes are explicit
- **WHEN** any non-critical regression scenario is removed, merged, or moved out of the default regression path
- **THEN** the change documents the rationale and identifies where the scenario is still validated or why it is no longer required
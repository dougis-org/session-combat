## Why

The Playwright regression suite is taking roughly 17 to 20 minutes in CI, which makes the feedback loop too slow for routine feature work and pull request iteration. The repository already contains investigation material and partial worker configuration for faster execution, but the current runtime behavior, CI workflow, and documentation are still misaligned.

## Problem Space

The current regression pipeline has three competing realities:

- GitHub issue #55 sets a clear goal to reduce runtime to under 5 to 10 minutes while preserving coverage and reliability.
- The current Playwright configuration still serializes execution safeguards with `fullyParallel: false` and a default of one worker, even though CI overrides worker count to `2`.
- Repository documentation and investigation artifacts describe broader parallelization and performance improvements, but those expectations are not yet encoded as spec-level requirements.

This change needs to define the required runtime target, the acceptable optimization strategies, and the guardrails that keep faster execution from creating flaky tests or hidden coverage loss.

## What Changes

- Define a new capability for Playwright regression performance that sets runtime expectations, measurement requirements, and acceptable optimization strategies.
- Update E2E test requirements so the first implementation phase establishes robust parallel execution, per-test isolation, and performance-oriented helper patterns without reintroducing flakiness.
- Update CI build/test requirements so the regression workflow explicitly profiles and runs a Chromium-specific path with an approved worker strategy instead of relying on ad hoc configuration.
- Require the implementation to document baseline timing, chosen optimizations, and measured post-change results, with timing evidence emitted in CI logs.

## Scope

In scope:

- Playwright regression execution behavior in local and CI environments
- GitHub Actions regression job configuration and related runtime measurement for the Chromium-specific CI path
- Playwright helper/test patterns needed to support safe runtime improvements
- Documentation of baseline, trade-offs, and measured improvement

Out of scope:

- Rewriting the application under test for unrelated product performance work
- Expanding regression coverage beyond what is needed to preserve existing scenarios
- Large-scale CI platform migration or replacement of Playwright with another framework

## Capabilities

### New Capabilities
- `e2e-regression-performance`: Defines target runtime, profiling expectations, approved optimization levers, and required reporting for the Playwright regression suite.

### Modified Capabilities
- `ci-build-test`: The regression CI job requirements will change to explicitly support and validate the chosen worker strategy, timing measurements, and artifact/report expectations for performance tuning.
- `e2e-test-patterns`: Existing E2E requirements will change to cover parallel-safe isolation, helper behavior, and scenario ownership rules needed to keep faster execution reliable.

## Impact

- Affected code: `playwright.config.ts`, `tests/e2e/**`, `.github/workflows/build-test.yml`, `docs/E2E_REGRESSION_TESTS.md`
- Affected systems: Playwright regression pipeline, GitHub Actions CI, MongoDB-backed E2E test environment
- Dependencies: No new product dependencies are expected, but Playwright/CI configuration and test helpers will be adjusted
- Operational impact: CI resource usage may increase modestly if worker counts rise; the implementation must balance speed gains against stability and runner constraints while moving the regression job from its current WebKit-only path to a Chromium-specific path

## Risks

- Increased parallelism can introduce data races or cleanup interference if test isolation is incomplete.
- Runtime improvements can hide scenario loss if tests are consolidated without explicit coverage accounting.
- CI timing gains may vary across runner sizes and browser selections, and the Chromium-specific path may expose runner-specific issues that the current WebKit-only job avoids, so success criteria need measured evidence rather than assumptions.

## Open Questions

- None currently. This change now assumes the runtime target applies to the Chromium-specific CI path, incremental improvement is acceptable for the first merge if it establishes robust parallel execution, and timing evidence will be emitted in CI logs while the strategy is summarized in repository documentation.

## Non-Goals

- This change does not promise zero-flake execution under arbitrary worker counts.
- This change does not require the first implementation phase to hit the final sub-10-minute runtime target if it delivers robust parallel execution and a measurable improvement over baseline.
- This change does not require moving non-critical tests to a nightly workflow unless the design determines that is necessary to satisfy the runtime budget without reducing core regression coverage.
- This change does not alter unit or Jest integration test architecture except where CI reporting or shared documentation references regression timing.

## Change Control

If scope, success criteria, or affected capabilities change after approval, `proposal.md`, `design.md`, relevant spec deltas, and `tasks.md` must be updated before `/opsx:apply` or implementation work proceeds.

## Approval

This proposal requires explicit human review and approval before implementation begins.
## Context

GitHub issue #55 asks for a measurable reduction in Playwright regression runtime from roughly 17 to 20 minutes in CI to a sub-10-minute feedback loop without sacrificing reliability. The repository already contains investigation documents for parallel test execution and currently exposes a partial optimization path through `REGRESSION_WORKERS`, but the active implementation still reflects conservative serialization choices such as `fullyParallel: false`, a default worker count of `1`, and shared-state cleanup assumptions.

The current CI workflow does not exercise a Chrome/Chromium path for this budget. It sets `SKIP_CHROMIUM_FIREFOX=true`, which forces the regression job onto the WebKit-only branch in `playwright.config.ts`. A Chromium-specific target can still work in GitHub Actions because the job already runs `npx playwright install --with-deps` on `ubuntu-latest`, but this change needs to make Chromium explicit and retain a rollback path if runner-specific browser issues reappear.

This change crosses multiple modules and concerns:

- `playwright.config.ts` controls runtime concurrency, browser scope, retries, and server startup.
- `tests/e2e/**` owns test isolation, helper waits, and scenario organization.
- `.github/workflows/build-test.yml` defines CI worker count, browser selection, and reporting.
- `docs/E2E_REGRESSION_TESTS.md` documents behavior that currently overstates effective parallel execution.

Proposal-to-design mapping:

- Define a performance capability: map to Decisions 1 and 4.
- Update E2E parallel-safety behavior: map to Decisions 2 and 3.
- Update CI execution/reporting requirements: map to Decisions 2 and 4.
- Preserve coverage while optimizing: map to Decision 5.

## Goals / Non-Goals

**Goals:**

- Make regression performance an explicit, testable contract rather than an ad hoc implementation detail.
- Reduce CI runtime through controlled parallelism and lower per-test overhead on the Chromium-specific CI path.
- Preserve determinism by replacing destructive shared cleanup assumptions with parallel-safe isolation.
- Require baseline and post-change measurement so the team can verify impact.
- Keep implementation incremental so the first pass can land robust parallel execution and measurable gains without a workflow rewrite.

**Non-Goals:**

- Redesign the full CI platform or split the repository into separate applications.
- Broaden the regression suite beyond preserving existing critical scenarios.
- Optimize unrelated application runtime behavior outside the test harness.
- Guarantee arbitrary worker counts across every browser/project combination.

## Decisions

### Decision 1: Treat runtime as a first-class requirement with measurement before and after changes

Rationale:

- The issue is explicitly performance-driven, so success cannot be evaluated from configuration changes alone.
- Existing repository docs contain performance expectations that are not backed by current enforced requirements.

Alternatives considered:

- Ad hoc tuning without a runtime contract: rejected because it makes regressions hard to detect.
- Hard-coding a single target without measurement reporting: rejected because it obscures whether failures come from infra variance or design flaws.

Validation:

- CI must emit measurable timing information for the Chromium-specific regression run in job logs.
- Documentation must capture the baseline and observed post-change result.

### Decision 2: Use controlled worker-based parallelism as the primary optimization lever

Rationale:

- `REGRESSION_WORKERS` already exists, and CI is already experimenting with `2` workers.
- Worker tuning is a lower-risk, higher-leverage improvement than introducing a new test runner or major workflow split.
- The first implementation phase is explicitly about robust parallel execution, so worker safety matters more than chasing the final runtime target immediately.
- The current CI job is not Chromium-specific today, so browser scope needs to change intentionally rather than remain tied to the existing WebKit-only override.

Alternatives considered:

- Keep sequential execution and only tune waits: rejected because it is unlikely to close the gap alone.
- Enable unrestricted `fullyParallel: true` across the suite immediately: rejected because the current cleanup model is not safe for that.
- Keep the current WebKit-only CI path for the runtime budget: rejected because the approved target is now Chromium-specific.
- Move most tests to nightly immediately: rejected as a first step because the issue asks to maintain coverage and improve the core feedback loop.

Validation:

- CI must run Chromium with an explicit approved worker count.
- The chosen worker strategy must complete reliably and improve runtime against the Chromium baseline.

### Decision 3: Replace shared destructive cleanup assumptions with parallel-safe test isolation

Rationale:

- The current E2E spec requires per-test database cleanup via shared collection clearing.
- Shared cleanup is compatible with serialized execution but conflicts with concurrent workers because one worker can delete another worker's data.
- Isolation must move from “delete everything globally before each test” to “each worker owns an isolated namespace or equivalent safe cleanup boundary.”

Alternatives considered:

- Keep global collection clearing and hope two workers do not overlap destructively: rejected because it is inherently flaky.
- Use a single serial setup/teardown around the entire suite: rejected because it preserves cross-test coupling.
- Spin up one database container per test: rejected as too expensive for the target feedback loop.

Validation:

- Multiple workers must be able to run without cross-worker data deletion.
- Each test must still begin from a clean state within its worker-specific namespace.

### Decision 4: Capture optimization evidence in CI logs and summarize the strategy in repository docs

Rationale:

- CI logs provide immediate evidence for a run, and repository docs preserve the rationale and chosen strategy for future maintainers.
- The current E2E documentation overstates the suite's parallel behavior, so documentation must be updated as part of the change.

Alternatives considered:

- Logs plus dedicated artifacts for timing: not required for phase one because CI logs are sufficient evidence for the approved scope.
- Docs only: rejected because it does not prove the current run actually met expectations.

Validation:

- CI output must include timing and execution-mode details.
- `docs/E2E_REGRESSION_TESTS.md` must describe the supported worker strategy and measurement expectations.

### Decision 5: Preserve scenario coverage while allowing consolidation or helper refactors

Rationale:

- The issue calls for optimization, not coverage reduction.
- Some gains may come from removing redundant setup, consolidating related scenarios, or eliminating unnecessary waits.
- Existing `e2e-test-patterns` requirements already insist that scenario ownership is explicit and no coverage is silently dropped.

Alternatives considered:

- Forbid any suite restructuring: rejected because it blocks legitimate performance work.
- Allow unrestricted test removal if runtime improves: rejected because it undermines regression confidence.

Validation:

- Acceptance criteria must verify that critical covered flows remain represented after refactoring.

## Risks / Trade-offs

- [Parallel data interference] -> Mitigation: require worker-scoped isolation and acceptance scenarios proving one worker does not delete another worker's data.
- [CI resource exhaustion] -> Mitigation: require explicit worker configuration and measured tuning rather than unconstrained auto-scaling.
- [Coverage erosion during consolidation] -> Mitigation: preserve scenario ownership rules and require documentation of retained coverage.
- [Environment-specific timing variance] -> Mitigation: base success on measured repeated CI runs and document the browser scope used for the measurement.
- [Operational blockage from flaky runs] -> Mitigation: stop increasing worker count and fall back to the last known stable configuration until isolation or helper issues are fixed.

## Rollback / Mitigation

- If regression stability worsens after introducing higher concurrency, restore the last stable worker configuration in `playwright.config.ts` and `.github/workflows/build-test.yml`.
- If worker-scoped isolation proves incomplete, temporarily keep the new measurement/reporting behavior but revert to serialized execution until isolation is corrected.
- If CI, review, or security checks remain blocked, implementation work must pause at the smallest stable step: keep the proposal/design/specs as the approved target, revert unstable runtime changes, and open follow-up tasks for unresolved blockers before further optimization.

## Open Questions

- None currently. This design assumes a Chromium-specific CI target, accepts incremental measurable improvement for phase one, and uses CI logs as the required timing evidence.
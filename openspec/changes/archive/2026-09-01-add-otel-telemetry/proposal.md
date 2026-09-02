## GitHub Issues

- #505

## Why

- Problem statement: All 64 storage methods now route through `logStorageEvent` as part of the god-object refactor (#499). However, `logStorageEvent` currently only logs to the console. We cannot dashboard or alert on these storage operations yet.
- Why now: This is the payoff step of the storage refactor work done in #501, #502, #503, and #504.
- Business/user impact: Enables proper monitoring, alerting, and dashboarding of storage operations using OpenTelemetry.

## Problem Space

- Current behavior: `logStorageEvent` logs to the console only.
- Desired behavior: `logStorageEvent` emits OpenTelemetry metrics (an operation counter) and traces (a span per operation), while preserving console logging for local development.
- Constraints: Must not modify any of the 64 storage methods or their callers (zero changes outside `logger.ts` and tests).
- Assumptions: The Next.js framework provides or will host the OpenTelemetry initialization; we just need to use `@opentelemetry/api` here.
- Edge cases considered:
  - Application running without OTel SDK (local dev): Will safely no-op OpenTelemetry calls and use console logging.

## Scope

### In Scope

- Adding `@opentelemetry/api` as a project dependency.
- Emitting an OTel counter: `storage.ops` with `{name, collection, outcome}` attributes.
- Emitting an OTel span retroactively per operation with scoped naming (e.g. `storage.campaigns.findCampaign`).
- Recording exceptions on the span when `outcome === "error"`.
- Modifying `lib/telemetry/logger.ts` and its associated unit tests.

### Out of Scope

- Modifying `lib/storage/runOp.ts`.
- Modifying any specific storage method or their callers.
- Initializing the OpenTelemetry SDK (Collector/Exporter configuration is handled at the application framework level).

## What Changes

- `package.json` gets `@opentelemetry/api`.
- `lib/telemetry/logger.ts` uses `trace.getTracer` and `metrics.getMeter` to record retroactive spans and counters.
- Console fallback in `logger.ts` is explicitly gated by `process.env.NODE_ENV === 'development'`.

## Risks

- Risk: The `@opentelemetry/api` package version is incompatible with Next.js built-in OTel dependencies.
  - Impact: Runtime errors or missing telemetry.
  - Mitigation: Ensure we use the standard API version and verify in tests.

## Open Questions

None. (Exploration phase resolved all questions: we will add `@opentelemetry/api`, we will gate console fallback on `NODE_ENV === 'development'`, we will use scoped span names, and we will record exceptions.)

## Non-Goals

- Refactoring any other part of the storage layer.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

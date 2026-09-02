## Context

- Relevant architecture: The storage layer uses a centralized logging function (`logStorageEvent`) for all operations. This function is currently a console-logging stub. Next.js natively handles tracing, but we need `@opentelemetry/api` to interact with it safely across the codebase.
- Dependencies: Requires adding `@opentelemetry/api`.
- Interfaces/contracts touched: `StorageEvent` and `logStorageEvent` in `lib/telemetry/logger.ts`.

## Goals / Non-Goals

### Goals

- Instrument the existing `logStorageEvent` seam with OpenTelemetry metrics and traces.
- Retain console fallback behavior for local development.
- Trace operations retroactively to nest under Next.js request spans.
- Record exceptions when an operation errors out.

### Non-Goals

- Modifying the storage caller logic or how operations are wrapped.
- Providing an OpenTelemetry SDK initialization (relying on framework setup).

## Decisions

### Decision 1: Use OTel Retroactive Spans

- Chosen: Start spans retroactively using the explicit `startTime: endTime - durationMs` pattern.
- Alternatives considered: Wrapping storage execution inside an active span (would require changing all 64 methods).
- Rationale: Satisfies the requirement of zero changes to caller code while still providing accurate operation duration and parent context nesting.
- Trade-offs: Any internal processing within `logStorageEvent` is excluded from the span duration, but this is negligible.

### Decision 2: Console Logging Gated by NODE_ENV

- Chosen: `console.log` and `console.error` will only trigger when `process.env.NODE_ENV === 'development'`.
- Alternatives considered: Conditionally logging if OTel is not initialized, or unconditionally logging.
- Rationale: The issue requests keeping console fallback for local dev. Since OTel handles no-op gracefully without an SDK, checking `NODE_ENV` is the cleanest toggle. Unconditional console logging in production would pollute logs alongside OTel data.
- Trade-offs: If a user runs production mode locally, console logs will not appear.

### Decision 3: Record Exceptions in Error Cases

- Chosen: Use `span.recordException()` and `span.setStatus({ code: SpanStatusCode.ERROR })` when `outcome === "error"`.
- Alternatives considered: Only setting `outcome: "error"` attribute.
- Rationale: Standard OTel practice for errors, ensuring they show up in APM tracing tools.
- Trade-offs: Minor API usage overhead.

## Proposal to Design Mapping

- Proposal element: Emitting an OTel span retroactively per operation
  - Design decision: Decision 1 (Use OTel Retroactive Spans)
  - Validation approach: Unit tests verifying `startTime` logic on mock tracer.
- Proposal element: Console fallback in `logger.ts` is explicitly gated by `process.env.NODE_ENV === 'development'`
  - Design decision: Decision 2
  - Validation approach: Unit tests verifying console behavior across NODE_ENV states.
- Proposal element: Recording exceptions on the span
  - Design decision: Decision 3
  - Validation approach: Unit test verifying `recordException` is called when `event.error` is present.

## Functional Requirements Mapping

- Requirement: Emit a `storage.ops` counter.
  - Design element: `meter.createCounter` in `logger.ts`.
  - Acceptance criteria reference: Specs (Counter emission)
  - Testability notes: Verify `opCounter.add` is called with the correct attributes.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: OpenTelemetry logic must not crash if no OTel SDK is provided.
  - Design element: Reliance on standard `@opentelemetry/api` global instances, which default to no-op.
  - Acceptance criteria reference: Specs (SDK independence)
  - Testability notes: Ensure tests do not throw when SDK is unconfigured.

## Risks / Trade-offs

- Risk/trade-off: Next.js or APM agent behavior might conflict with manual `@opentelemetry/api` usage if versions mismatch.
  - Impact: Traces missing or duplicated.
  - Mitigation: Add standard peer dependency ranges.

## Rollback / Mitigation

- Rollback trigger: Telemetry is fundamentally broken, or app fails to build due to missing API.
- Rollback steps: Revert `lib/telemetry/logger.ts` changes.
- Data migration considerations: N/A.
- Verification after rollback: Check local console logs.

## Operational Blocking Policy

- If CI checks fail: Resolve locally, tests must mock OTel.
- If security checks fail: Ensure no sensitive data is passed to `recordException`.
- If required reviews are blocked/stale: Escalate to the tech lead.
- Escalation path and timeout: 1 day.

## Open Questions

- None.

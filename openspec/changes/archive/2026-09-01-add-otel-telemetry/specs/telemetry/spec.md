## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Emit OpenTelemetry counter for storage operations

The system SHALL record an OpenTelemetry counter metric named `storage.ops` each time `logStorageEvent` is invoked.

#### Scenario: Successful metrics emission

- **Given** `logStorageEvent` receives a successful event with `name: "findCampaign"` and `collection: "campaigns"`
- **When** the event is processed
- **Then** the `storage.ops` counter increments by 1 with attributes `{ name: "findCampaign", collection: "campaigns", outcome: "success" }`

### Requirement: ADDED Emit OpenTelemetry trace span for storage operations

The system SHALL create an OpenTelemetry span representing the operation, applying the actual start and end times retroactively.

#### Scenario: Retroactive span creation

- **Given** an event containing `durationMs: 50`
- **When** `logStorageEvent` processes the event
- **Then** a span named `storage.campaigns.findCampaign` is started and ended, with a calculated `startTime` that is exactly 50ms before its `endTime`, and has the attribute `outcome: "success"`

#### Scenario: Recording exceptions on error spans

- **Given** an event with `outcome: "error"` and an `Error` object attached
- **When** the span is processed
- **Then** `span.recordException(error)` is called, and the span status is set to `ERROR`

## MODIFIED Requirements

### Requirement: MODIFIED Console logging fallback

The system SHALL only output console logs for storage events when running in development mode.

#### Scenario: Console logging in development

- **Given** `process.env.NODE_ENV` is set to `development`
- **When** `logStorageEvent` processes a success event
- **Then** it is written to `console.log`

#### Scenario: Console logging suppressed in production

- **Given** `process.env.NODE_ENV` is set to `production`
- **When** `logStorageEvent` processes an event
- **Then** no console logging occurs

## REMOVED Requirements

None.

## Traceability

- Proposal element -> Requirement: Emitting an OTel counter -> Emit OpenTelemetry counter for storage operations
- Proposal element -> Requirement: Emitting an OTel span retroactively -> Emit OpenTelemetry trace span for storage operations
- Design decision -> Requirement: Decision 2 (Console Logging Gated by NODE_ENV) -> Console logging fallback
- Design decision -> Requirement: Decision 3 (Record Exceptions) -> Recording exceptions on error spans

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED).

### Requirement: Performance

#### Scenario: No blocking I/O for telemetry

- **Given** `logStorageEvent` is invoked
- **When** the metrics and trace APIs are called
- **Then** no async I/O occurs that blocks the completion of the main execution thread.

### Requirement: Security

See functional scenarios: Console logging suppressed in production.

### Requirement: Reliability

#### Scenario: Missing OTel SDK

- **Given** the application does not configure an OpenTelemetry SDK
- **When** `logStorageEvent` invokes `@opentelemetry/api` globals
- **Then** it operates normally without throwing errors, relying on the built-in Noop implementations.

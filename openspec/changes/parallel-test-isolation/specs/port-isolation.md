## ADDED Requirements

### Requirement: ADDED Directory-derived port selection

The system SHALL derive a stable, unique base port for each working directory by hashing `process.cwd()` into the range 20000–50000, and use that port for all test servers started from that directory.

#### Scenario: Different directories produce different ports

- **Given** two agents running in different working directories (e.g., `/home/a/session-combat` and `/home/b/session-combat`)
- **When** each calls `getDirectoryBasePort()`
- **Then** the returned ports differ, eliminating cross-agent port collision

#### Scenario: Same directory always produces same port

- **Given** an agent running in `/home/a/session-combat`
- **When** `getDirectoryBasePort()` is called at any point during the run
- **Then** the returned port is identical every time, making logs and debugging deterministic

#### Scenario: Port falls within safe range

- **Given** any working directory path
- **When** `getDirectoryBasePort()` is called
- **Then** the returned value is between 20000 and 49999 inclusive

### Requirement: ADDED CI-observable port log line

The system SHALL emit a structured log line during integration globalSetup identifying the selected port.

#### Scenario: Port log appears exactly once per run

- **Given** the integration test suite is started
- **When** `global.setup.ts` runs
- **Then** stdout contains exactly one line matching `[port-select] cwd=<path> port=<number>`

#### Scenario: Log line is greppable across parallel agent outputs

- **Given** two agents running simultaneously from different directories
- **When** their stdout logs are concatenated
- **Then** each `[port-select]` line contains a distinct port, confirming no collision

## MODIFIED Requirements

### Requirement: MODIFIED E2E test port default

The system SHALL derive the e2e port from `getDirectoryBasePort()` when `process.env.PORT` is not set, instead of hardcoding 3000.

#### Scenario: E2E suite uses directory-derived port

- **Given** `process.env.PORT` is not set
- **When** `playwright.config.ts` is evaluated
- **Then** `testPort` equals `String(getDirectoryBasePort())`, not `"3000"`

#### Scenario: Explicit PORT env var still takes precedence

- **Given** `process.env.PORT` is set to `"9000"`
- **When** `playwright.config.ts` is evaluated
- **Then** `testPort` is `"9000"`

## Traceability

- Proposal element "Port isolation (cross-agent)" → Requirement: Directory-derived port selection
- Design Decision 1 (djb2 hash) → Requirement: Directory-derived port selection
- Requirement: Directory-derived port selection → Task: Implement `tests/shared/port.ts`
- Requirement: CI-observable port log line → Task: Implement `global.setup.ts`
- Requirement: E2E port default → Task: Update `playwright.config.ts`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No EADDRINUSE under parallel agent load

- **Given** 5 agents running integration tests simultaneously from different directories
- **When** all suites complete
- **Then** no suite exits with an EADDRINUSE error

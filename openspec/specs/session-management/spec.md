## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-09-01-fix-active-session-claim/design.md) document, not a replacement.

*(None)*

## MODIFIED Requirements

### Requirement: MODIFIED Active Session Claim Rollback

The system SHALL roll back the `activeSessionId` claim on a campaign if the corresponding `SessionLog` document fails to save to the database.

#### Scenario: DB failure during session creation

- **Given** a campaign with no active session and a valid DM request
- **When** the DM attempts to start a session, but the session log save operation fails
- **Then** the `activeSessionId` on the campaign is reverted to `null` and a 500 Server Error is returned.

## REMOVED Requirements

*(None)*

## Traceability

- Proposal element -> Requirement: Roll back the activeSessionId claim if the save fails -> MODIFIED Active Session Claim Rollback
- Design decision -> Requirement: Decision 1: Try/Catch Rollback -> MODIFIED Active Session Claim Rollback
- Requirement -> Task(s): MODIFIED Active Session Claim Rollback -> TBD

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

*(None)*

### Requirement: Security

*(None)*

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** a transient database write failure during session creation
- **When** the DM attempts to start a session again after the transient failure resolves
- **Then** the request succeeds because the previous failed request correctly rolled back the claim and did not leave a dangling pointer.

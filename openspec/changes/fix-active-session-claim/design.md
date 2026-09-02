## Context

- Relevant architecture: Next.js API Routes (Serverless), MongoDB Storage.
- Dependencies: `lib/storage.ts`
- Interfaces/contracts touched: `POST /api/campaigns/[id]/sessions/active/route.ts`

## Goals / Non-Goals

### Goals

- Eliminate the bug where a failed session log save results in a dangling `activeSessionId` on the campaign.

### Non-Goals

- Refactoring the storage layer to use MongoDB transactions.
- Hardening the application against total database outages.

## Decisions

### Decision 1: Try/Catch Rollback

- Chosen: Wrap `storage.saveSessionLog(log)` in a `try/catch`. In the catch block, explicitly call `storage.setActiveCampaignSession(campaignId, campaign.userId, null)` to roll back the claim, then rethrow or return the error.
- Alternatives considered: Reordering data prep before the claim (shrinks the window slightly but doesn't solve the core issue of DB save failure). Moving to true DB transactions (too heavy for this fix, complex to set up).
- Rationale: Most practical, covers 99% of failures (schema validation, network blips, single-document write failures).
- Trade-offs: In a hard DB outage, the rollback will also fail, leaving the dangling pointer (accepted risk).

## Proposal to Design Mapping

- Proposal element: Roll back the activeSessionId claim if the save fails.
  - Design decision: Decision 1: Try/Catch Rollback.
  - Validation approach: Mock `storage.saveSessionLog` to throw an error and verify the active session is cleared.

## Functional Requirements Mapping

- Requirement: If session creation fails after the campaign is claimed, the campaign claim is removed.
  - Design element: Decision 1
  - Acceptance criteria reference: Spec 1
  - Testability notes: Mock DB error on `saveSessionLog` and verify rollback is called.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Ensure partial state is cleaned up gracefully on transient failure.
  - Design element: Decision 1
  - Acceptance criteria reference: Spec 1
  - Testability notes: Simulated DB failure in integration test.

## Risks / Trade-offs

- Risk/trade-off: DB outage prevents rollback.
  - Impact: Campaign locked until manually cleared via `DELETE ?force=true`.
  - Mitigation: Escalate error correctly (return 500) and rely on the existing manual escape hatch.

## Rollback / Mitigation

- Rollback trigger: Code introduces unforeseen bugs or regressions in session creation.
- Rollback steps: Revert the PR.
- Data migration considerations: None, no schema changes.
- Verification after rollback: Verify sessions can be created successfully again.

## Operational Blocking Policy

- If CI checks fail: Fix before merge.
- If security checks fail: Fix before merge.
- If required reviews are blocked/stale: Ping reviewers after 24 hours.
- Escalation path and timeout: N/A (minor bug fix).

## Open Questions

- None.

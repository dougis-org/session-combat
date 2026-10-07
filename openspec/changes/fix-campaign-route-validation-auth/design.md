## Context

- Relevant architecture: Next.js route handlers; auth via `withAuth` / `withAuthAndParams` (`lib/middleware.ts`) and `requireAdmin` (`lib/api-helpers.ts`); storage via `lib/storage/*Repo`.
- Dependencies: `validateEntityId` in `lib/validation/core.ts` (string, required, 1–200 chars); already used in `app/api/parties/[id]/route.ts`.
- Interfaces/contracts touched: HTTP responses only; new 400 (invalid id) and 401 (global GET). Success paths unchanged. See proposal.md - Why.

## Goals / Non-Goals

### Goals

- Validate every flagged path id before any storage or membership call.
- Require auth on the global template list.

### Non-Goals

- New validators, ObjectId checks, or response format changes.

## Decisions

### Decision 1: Reuse `validateEntityId`

- Chosen: Call `validateEntityId(id, 'id')` first in each handler; return `400 { error: result.error.message }`.
- Alternatives considered: `ObjectId.isValid` (wrong: ids are UUID strings); regex UUID check (rejects legacy ids); new helper (duplicates existing).
- Rationale: Matches the established pattern and bounds in the parties route.
- Trade-offs: Does not verify id format, only shape/length; storage lookups still return 404 for unknown ids.

### Decision 2: Order of checks

- Chosen: auth/admin → id validation → storage. In global DELETE, validate after `requireAdmin`.
- Alternatives considered: validate first (leaks that the route exists/validates to anonymous callers).
- Rationale: Anonymous callers get 401, not 400.
- Trade-offs: None.

### Decision 3: Wrap global GET in `withAuth`

- Chosen: `export const GET = withAuth(async () => ...)`.
- Alternatives considered: keep public and waive the Verity `api-auth-required` finding.
- Rationale: Sole consumer is a logged-in page; consistent with other campaign routes; no sensitive-data leak concern but removes unauthenticated DB reads.
- Trade-offs: Reverses documented spec; spec delta updates it.

### Decision 4: Swap copy route validator

- Chosen: Replace `validateString(minLength: 1)` with `validateEntityId` in `global/[id]/copy`.
- Alternatives considered: leave as is (no max length).
- Rationale: Uniform bounds across sibling routes.
- Trade-offs: Route has `istanbul ignore file`; tests still cover the new 400 path.

## Proposal to Design Mapping

- Proposal element: Auth on global GET
  - Design decision: Decision 3
  - Validation approach: unit test 401 without cookie
- Proposal element: Validate ids on four routes + copy
  - Design decision: Decisions 1, 2, 4
  - Validation approach: unit tests for 400 and storage-not-called

## Functional Requirements Mapping

- Requirement: Invalid ids rejected before storage
  - Design element: Decisions 1, 2
  - Acceptance criteria reference: specs/campaign-template-admin, campaign-character-shares, campaign-copy
  - Testability notes: Assert 400 and `expect(storage.*).not.toHaveBeenCalled()`
- Requirement: Global list requires auth
  - Design element: Decision 3
  - Acceptance criteria reference: specs/campaign-template-admin
  - Testability notes: Request without auth cookie returns 401

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: No unauthenticated DB reads; bounded input to storage
  - Design element: Decisions 1–3
  - Acceptance criteria reference: specs Security NFAC
  - Testability notes: Verity gate passes on touched files

## Risks / Trade-offs

- Risk/trade-off: Spec reversal of "public list"
  - Impact: Anonymous callers get 401
  - Mitigation: Documented in spec delta; single known consumer is authenticated

## Rollback / Mitigation

- Rollback trigger: Authenticated users report failures loading the campaigns page.
- Rollback steps: Revert the PR.
- Data migration considerations: None.
- Verification after rollback: `GET /api/campaigns/global` returns 200 unauthenticated.

## Operational Blocking Policy

- If CI checks fail: fix, re-run local validation, push.
- If security checks fail: remediate; never waive without explicit human acceptance.
- If required reviews are blocked/stale: ping reviewer; escalate to the repo owner after 24h.
- Escalation path and timeout: repo owner, 24h.

## Open Questions

- None blocking. Reversal of the "public list" spec is acknowledged in proposal.md.

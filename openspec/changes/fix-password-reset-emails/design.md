## Context

- Relevant architecture: Next.js API Routes for authentication (`app/api/auth/password/forgot/route.ts`).
- Dependencies: MongoDB for user lookup and tokens, Mailtrap for email sending.
- Interfaces/contracts touched: `POST /api/auth/password/forgot`

## Goals / Non-Goals

### Goals

- Ensure background promises (saving token and sending email) reliably finish executing.
- Make the email lookup in the forgot password form case-insensitive.
- Surface missing Mailtrap configurations gracefully in logs.

### Non-Goals

- Refactoring the whole authentication subsystem.
- Replacing Mailtrap with another provider.

## Decisions

### Decision 1: Await Email and Use Dummy Delay for Timing Attacks

- Chosen: Instead of relying on Vercel/Next.js specific `waitUntil` which may not be supported depending on deployment, we will `await` the token storage and email sending promises before returning the HTTP response. For cases where the user does not exist, we will introduce a dummy hashing operation and delay to match the typical response time, mitigating timing attacks.
- Alternatives considered: Using Next.js `waitUntil()` (vendor specific, experimental in some versions), or a background job queue like Redis/Bull (too heavy for this).
- Rationale: Awaiting the promise natively ensures it completes in all deployment environments (Node.js server, edge, serverless). A dummy delay prevents enumeration attacks.
- Trade-offs: Increases the response time for the API route compared to the immediate return, but guarantees delivery.

### Decision 2: Case-Insensitive MongoDB Query

- Chosen: Use a case-insensitive regex or MongoDB collation for the `findOne` query on the `email` field.
- Alternatives considered: Storing a lowercase `email_normalized` field on registration.
- Rationale: While normalizing on save is better long-term, changing the query is simpler and fixes the bug for existing users immediately without a data migration.
- Trade-offs: Case-insensitive queries can be slightly less performant without a specific index.

### Decision 3: Explicit Mailtrap Token Check

- Chosen: In `app/api/auth/password/forgot/route.ts` or `lib/email.ts`, if the email sending fails due to missing environment variables, catch it and log it as a critical warning without breaking the 200 OK response to the user.
- Alternatives considered: Crashing the route (currently happening if uncaught).
- Rationale: Keeps the frontend experience smooth and prevents user enumeration while making the error visible to operators.
- Trade-offs: User won't know the email failed to send, but this is necessary for the anti-enumeration security requirement.

## Proposal to Design Mapping

- Proposal element: Fix early termination of background email promise.
  - Design decision: Decision 1 (Await Email and Use Dummy Delay for Timing Attacks).
  - Validation approach: End-to-end test or manual verification that the route blocks until the email is sent, and Mailtrap receives the email.

- Proposal element: Update email lookup to be case-insensitive.
  - Design decision: Decision 2 (Case-Insensitive MongoDB Query).
  - Validation approach: Unit test verifying that different casing variations of an email still match the user.

- Proposal element: Add clearer logging when Mailtrap fails or is misconfigured.
  - Design decision: Decision 3 (Explicit Mailtrap Token Check).
  - Validation approach: Manual verification that a missing `MAILTRAP_TOKEN` does not return a 500 but logs an error.

## Functional Requirements Mapping

- Requirement: Password reset emails must be sent when a valid email (regardless of casing) is provided.
  - Design element: Decision 1 and Decision 2.
  - Acceptance criteria reference: TBD in specs.
  - Testability notes: Mock the DB and email client; assert `sendPasswordResetEmail` is called with correct arguments even with uppercase input.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: The API must not reveal if an email is registered or not (Anti-enumeration).
  - Design element: Decision 1 (Dummy Delay).
  - Acceptance criteria reference: TBD in specs.
  - Testability notes: Benchmark the API route response time for existing vs non-existing users to ensure they are indistinguishable.

## Risks / Trade-offs

- Risk/trade-off: Dummy delay might not perfectly match the real email sending time.
  - Impact: A sophisticated attacker might still glean some statistical hints.
  - Mitigation: Add a randomized jitter to both paths (success and failure).

## Rollback / Mitigation

- Rollback trigger: The forgot password route starts failing or throwing 500 errors in production.
- Rollback steps: Revert the commit for this change.
- Data migration considerations: None, we are only changing the query, not the data schema.
- Verification after rollback: Test the forgot password form manually to ensure it returns 200 OK.

## Operational Blocking Policy

- If CI checks fail: Developer must fix linting, type-checking, or tests before merging.
- If security checks fail: Block merge until timing attack mitigation is verified.
- If required reviews are blocked/stale: Ping code owners after 24 hours.
- Escalation path and timeout: N/A for this minor bug fix.

## Open Questions

- Question: Should we add a `normalizedEmail` field via a data migration instead of doing a case-insensitive query? (Assuming regex query for now).

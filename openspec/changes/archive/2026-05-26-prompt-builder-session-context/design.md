## Context

- Relevant architecture: `fetchCampaignContext()` in `lib/utils/campaignContext.ts` is the single fetch entry point for all campaign-scoped page contexts. It feeds `useCampaignContext()` hook, which feeds the Prompt Builder page. All five prompt templates call `buildSystemPrompt(context: CampaignContext)` to produce the system prompt portion of every generated prompt.
- Dependencies: Sessions API (`GET /api/campaigns/[id]/sessions?limit=N`) is fully implemented. `SessionLog` and `CampaignContext` types exist in `lib/types.ts`. No new infrastructure required.
- Interfaces/contracts touched: `CampaignContext` (type), `fetchCampaignContext` (function signature unchanged, return value extended), `buildSystemPrompt` (function — output extended, signature unchanged).

## Goals / Non-Goals

### Goals

- Enrich every prompt template's system prompt with the last 3 session summaries when they exist
- Keep the fetch blocking so the Prompt Builder shows a single loading state
- Degrade gracefully: a failed sessions fetch yields an empty list, not an error
- Reflect the additional fetch in the loading label

### Non-Goals

- Per-template opt-in/opt-out
- User-configurable session count
- Changes to sessions API, storage, or journal UI

## Decisions

### Decision 1: Extend `CampaignContext`, not template signatures

- Chosen: Add `recentSessions?: SessionLog[]` to `CampaignContext` and inject context in `buildSystemPrompt()`. All template `build()` signatures remain `(fields, context)` unchanged.
- Alternatives considered: Pass sessions as a third argument to each template's `build()` function; add a separate `buildSessionBlock()` utility called per-template.
- Rationale: `CampaignContext` is already the single carrier of all campaign-scoped runtime data. Extending it keeps every template automatically enriched without per-template changes. All templates already delegate to `buildSystemPrompt(context)`.
- Trade-offs: `CampaignContext` grows by one optional field. Any future consumer of `fetchCampaignContext` will receive session data even if unused — acceptable since the field is optional and the data is small.

### Decision 2: Fetch sessions in main `Promise.all` (blocking)

- Chosen: Add the sessions fetch to the existing `Promise.all` inside `fetchCampaignContext()`. The Prompt Builder loading spinner covers all four fetches at once.
- Alternatives considered: Secondary `useEffect` after main context loads (non-blocking, as used by the dashboard).
- Rationale: The Prompt Builder cannot generate until context is fully loaded anyway. A single loading state is simpler and avoids a partial-render where the form appears but session context arrives later mid-session.
- Trade-offs: If the sessions endpoint is slow, the Prompt Builder load is slightly longer. Mitigated by the `?limit=3` cap and the graceful-degradation error handler.

### Decision 3: Graceful degradation on sessions fetch failure

- Chosen: Wrap the sessions fetch in a try/catch inside `fetchCampaignContext()`. On failure, `recentSessions` is set to `[]` and an error is logged to the console. The overall context load succeeds.
- Alternatives considered: Propagate the error and surface it to the DM; omit the try/catch and let a sessions failure block the whole page.
- Rationale: Session history is enrichment data. A temporary API hiccup should not prevent a DM from using the Prompt Builder. This matches the pattern established in #186 where session data absence never blocks the dashboard.
- Trade-offs: Silent failure if sessions are consistently unavailable — the console log is the only signal. Acceptable for enrichment-tier data.

### Decision 4: Session block format in system prompt

- Chosen:
  ```
  Recent sessions:
  - Session 11 (May 14, 2026): The Betrayer Revealed — party reached Level 11.
  - Session 10 (May 7, 2026): Explored the War of Pandesmos.
  ```
  Format per entry: `Session {N} ({date}): {title or "Untitled Session"}{milestone suffix}`.
  Milestone suffix: ` — party reached Level {newLevel}.` when `milestone: true`.
- Alternatives considered: Freeform summary injection (includes the `summary` field); structured JSON block for the AI to parse.
- Rationale: The issue spec provides this exact format. Concise single-line entries keep prompt token cost low. The `summary` field can be long and unstructured — including it risks bloating the system prompt. The title and milestone flag carry the highest signal-to-token ratio.
- Trade-offs: DMs who write detailed summaries lose that detail in the prompt. They can always paste extra context in the template's optional fields.

## Proposal to Design Mapping

- Proposal element: Add `recentSessions?: SessionLog[]` to `CampaignContext`
  - Design decision: Decision 1
  - Validation approach: TypeScript compilation; unit test asserting field present in returned context

- Proposal element: Fetch sessions in main `Promise.all` (blocking)
  - Design decision: Decision 2
  - Validation approach: Unit test mocking all four endpoints; assert sessions endpoint called once per `fetchCampaignContext` invocation

- Proposal element: Failed sessions fetch → empty list
  - Design decision: Decision 3
  - Validation approach: Unit test simulating sessions endpoint 500 response; assert context returns with `recentSessions: []` and no thrown error

- Proposal element: `buildSystemPrompt()` session block
  - Design decision: Decision 4
  - Validation approach: Unit tests for zero sessions (block absent), one session (block present, no milestone), one session with `milestone: true` (milestone suffix appended)

- Proposal element: Loading label update
  - Design decision: n/a (cosmetic string change)
  - Validation approach: String value verified in component test or visual inspection

## Functional Requirements Mapping

- Requirement: All five templates include recent sessions in their system prompt when sessions exist
  - Design element: Decision 1 — `buildSystemPrompt()` receives sessions via `CampaignContext`
  - Acceptance criteria reference: specs/prompt-context/spec.md
  - Testability notes: Unit test `buildSystemPrompt()` with `recentSessions` array; all templates share this path, no per-template tests needed

- Requirement: Zero sessions → no session block in prompt
  - Design element: Decision 4 — `buildSystemPrompt()` filters on `recentSessions?.length`
  - Acceptance criteria reference: specs/prompt-context/spec.md
  - Testability notes: Unit test with `recentSessions: []` asserts "Recent sessions:" absent from output

- Requirement: Milestone sessions show level attained
  - Design element: Decision 4 — milestone suffix appended when `milestone: true`
  - Acceptance criteria reference: specs/prompt-context/spec.md
  - Testability notes: Unit test with `milestone: true` and `newLevel: 11` asserts "Level 11" present in output

- Requirement: Sessions fetch failure does not break Prompt Builder
  - Design element: Decision 3 — try/catch in `fetchCampaignContext`
  - Acceptance criteria reference: specs/prompt-context/spec.md
  - Testability notes: Unit test with mocked 500 on sessions endpoint; assert function resolves with empty `recentSessions`

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Sessions fetch must not measurably increase Prompt Builder load time beyond network latency of `GET /api/campaigns/[id]/sessions?limit=3`
  - Design element: Decision 2 — parallel fetch in `Promise.all` with `?limit=3` cap
  - Acceptance criteria reference: n/a (no hard SLA; `limit=3` keeps payload small)
  - Testability notes: Manual observation; no automated performance test required

- Requirement category: reliability
  - Requirement: Sessions endpoint failure must not degrade Prompt Builder availability
  - Design element: Decision 3 — graceful degradation
  - Acceptance criteria reference: specs/prompt-context/spec.md
  - Testability notes: Unit test with 500 mock

- Requirement category: operability
  - Requirement: Loading state accurately describes what is being fetched
  - Design element: Loading label change in `app/campaigns/[id]/prompts/page.tsx`
  - Acceptance criteria reference: n/a
  - Testability notes: String verified in component snapshot or manual review

## Risks / Trade-offs

- Risk/trade-off: Existing `fetchCampaignContext` tests do not mock the sessions endpoint and will fail with an unmatched fetch call.
  - Impact: CI failure.
  - Mitigation: Audit `tests/unit/utils/campaignContext.test.ts` before implementing; add sessions mock returning `[]` to all existing test cases.

- Risk/trade-off: System prompt length increases for campaigns with active session logs.
  - Impact: Higher token cost per prompt; possible truncation if context window is tight.
  - Mitigation: Only 3 sessions max; each entry is a single short line. Total addition is under 300 tokens in the worst case.

## Rollback / Mitigation

- Rollback trigger: Sessions fetch consistently errors in production, or system prompt bloat causes AI quality regression.
- Rollback steps: Revert the four file changes (types, campaignContext, templates, prompts page) in a single commit. No DB migration needed — sessions data is untouched.
- Data migration considerations: None — this change is purely read-path enrichment. No schema changes.
- Verification after rollback: Prompt Builder loads, generates prompts without session block, sessions journal unchanged.

## Operational Blocking Policy

- If CI checks fail: Fix failing tests before merging. Do not bypass CI with `--no-verify` or equivalent.
- If security checks fail: Treat as a blocker; the sessions fetch uses the existing `withAuthAndParams` middleware — investigate any unexpected auth failure.
- If required reviews are blocked/stale: Re-request review after 24 hours; escalate to repo owner after 48 hours.
- Escalation path and timeout: Tag @dougis in the PR if unreviewed after 48 hours.

## Open Questions

No open questions. All design decisions are resolved and confirmed.

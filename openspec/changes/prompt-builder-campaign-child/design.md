## Context

- **Relevant architecture:**
  - Next.js App Router with `app/campaigns/[id]/` child routes (sessions pattern already established)
  - MongoDB via raw `mongodb` Node.js driver — no Mongoose; data access in `lib/storage.ts`
  - Auth via `requireAuth` middleware; all API routes follow `app/api/parties/route.ts` pattern
  - `lib/types.ts` holds all shared interfaces (`Campaign`, `CampaignChapter`, `Party`, `PartyMember`, `Character`)
  - Existing `/api/characters` and `/api/parties` endpoints return full arrays scoped to the authenticated user
- **Dependencies:**
  - Campaign Management (#182) — complete; `Campaign`, `CampaignChapter`, `Party` types and APIs exist
  - `lib/utils/sessionEvents.ts` — `buildNpcEventsFromMemberChanges(members, windowStart)` consumed by session logs; must remain compatible after refactor
- **Interfaces/contracts touched:**
  - `app/campaigns/[id]/sessions/page.tsx` — internal fetch logic replaced with `useCampaignContext()`
  - `lib/types.ts` — two new exported interfaces: `CampaignContext`, `BuiltPrompt`
  - No API route changes required for v1

## Goals / Non-Goals

### Goals

- Zero-configuration context loading: route param `campaignId` drives all data fetching
- All parties linked to a campaign included (fixes #212)
- Character names/classes/levels resolved for prompt injection
- Template architecture supports future Claude API agentic path without rewrites
- Session logs refactored to the same data path as the prompt builder

### Non-Goals

- Server-side prompt assembly or Claude API calls (v1)
- Persistent prompt storage / Content Library (#185)
- New API routes for prompt generation

## Decisions

### Decision 1: Shared data helper — pure async function + thin React hook

- **Chosen:** `lib/utils/campaignContext.ts` exports `fetchCampaignContext(campaignId, fetchImpl?)` as a pure async function. `lib/hooks/useCampaignContext.ts` wraps it with `useState`/`useEffect`/`useCallback` and returns `{ context, loading, error, refresh }`.
- **Alternatives considered:**
  - Inline fetch logic in each page (current sessions approach) — rejected: duplicates code, propagates the #212 bug
  - Server component with `async` page function — rejected: prompt builder needs client interactivity (form, clipboard); sessions page is already `'use client'`
- **Rationale:** Separating the pure fetch from the React lifecycle makes the helper unit-testable without rendering. The hook is a thin adapter, not logic.
- **Trade-offs:** Two files instead of one; hook is trivial boilerplate.

### Decision 2: `fetchCampaignContext` fetches campaign, parties, and characters in parallel

- **Chosen:** Single `Promise.all([fetch campaign, fetch parties, fetch characters])`. Resolves chapter from `campaign.chapters` in-memory. Filters parties by `campaignId`. Filters characters by merged member IDs.
- **Alternatives considered:**
  - Sequential fetches — rejected: unnecessary latency
  - New `/api/campaigns/[id]/context` endpoint — rejected: over-engineering for v1; all data is already accessible client-side
- **Rationale:** Three independent fetches; parallelism is free with `Promise.all`. Campaign detail (`/api/campaigns/[id]`) gives us the chapters array so chapter resolution is O(n) in-memory.
- **Trade-offs:** Fetches all characters for the user then filters — acceptable given typical character counts (<50).

### Decision 3: `CampaignContext` interface in `lib/types.ts`

- **Chosen:**
  ```typescript
  export interface CampaignContext {
    campaign: Campaign;
    chapter: CampaignChapter | null;
    parties: Party[];
    allMembers: PartyMember[];   // merged across all parties
    characters: Character[];      // resolved, excludes soft-deleted
  }
  ```
- **Alternatives considered:** Local interface in `campaignContext.ts` — rejected: both sessions and prompts pages need to type against it.
- **Rationale:** `lib/types.ts` is the single source of truth for shared types in this project.
- **Trade-offs:** Adds one interface to an already large types file.

### Decision 4: Template return type `BuiltPrompt` with `systemPrompt` / `userMessage` / `fullText`

- **Chosen:**
  ```typescript
  export interface BuiltPrompt {
    systemPrompt: string;  // campaign + party context
    userMessage: string;   // template-specific request
    fullText: string;      // concat for v1 copy-paste
  }
  ```
  Each template's `build(fields, context)` returns `BuiltPrompt`. v1 displays `fullText` in a read-only textarea. A future agentic route receives `{ systemPrompt, userMessage }` as-is.
- **Alternatives considered:**
  - `build()` returns a plain string — rejected: collapses the context/request boundary, forces template rewrites when adding agentic support
  - Separate `buildSystemPrompt()` utility + `build()` per template — rejected: duplication; callers must remember to call both
- **Rationale:** `fullText` keeps v1 simple. The structured pair is ready for the Claude Messages API (`system` param + first `user` message) with zero changes.
- **Trade-offs:** Slightly more template boilerplate; worth it for the agentic upgrade path.

### Decision 5: Route at `app/campaigns/[id]/prompts/page.tsx`

- **Chosen:** Child route of the campaign, identical in structure to `app/campaigns/[id]/sessions/page.tsx`.
- **Alternatives considered:** Top-level `app/prompts/page.tsx` with campaign selector dropdown — rejected: forces the user to re-select context they already have; was the original issue design.
- **Rationale:** Context is injected by the URL. Nav link sits alongside "Sessions" in the campaign detail view. Zero disambiguation needed.
- **Trade-offs:** Prompt builder is only reachable from within a campaign — acceptable since all prompts are campaign-contextual.

### Decision 6: Five templates in `lib/prompts/templates.ts`, ported from dm-dashboard reference

- **Chosen:** NPC, Location Description, Shop/Establishment, Magic Item, Room Description. Each exported as a `PromptTemplate` object. Shared `buildSystemPrompt(context: CampaignContext): string` utility in same file.
- **Rationale:** Direct TypeScript port of the dm-dashboard JS implementation. `buildSystemPrompt` is extracted so the system context boilerplate isn't duplicated across all five `build()` functions.
- **Trade-offs:** Adding a sixth template in future requires a new `PromptTemplate` object only — no structural changes.

### Decision 7: Session logs refactor is a distinct task, guarded by regression tests

- **Chosen:** Write regression tests for session logs behaviour first, then replace the manual fetch+find with `useCampaignContext()`. Implemented as a separate task that can be reverted without touching the prompt builder.
- **Rationale:** Session logs is a live feature. Independent task = independent revert if something goes wrong.
- **Trade-offs:** Slight additional scope in this change; the alternative (a separate PR) was rejected because the shared helper would otherwise be unused at merge time.

## Proposal to Design Mapping

- Proposal element: shared helper fixing #212 (multi-party)
  - Design decision: Decision 1 (`fetchCampaignContext`), Decision 2 (parallel fetch + `filter`)
  - Validation approach: unit test — mock fetch returns 3 parties for same campaignId, assert all 3 in `context.parties` and all members merged in `context.allMembers`

- Proposal element: agentic-ready template architecture
  - Design decision: Decision 4 (`BuiltPrompt` interface)
  - Validation approach: unit tests assert each template's `build()` returns non-empty `systemPrompt`, `userMessage`, and `fullText`; `fullText === systemPrompt + '\n\n' + userMessage`

- Proposal element: route as campaign child
  - Design decision: Decision 5 (route location)
  - Validation approach: integration test — navigate to `/campaigns/[id]/prompts`, assert page renders with campaign name in heading

- Proposal element: character resolution
  - Design decision: Decision 2 (parallel fetch, filter by member IDs)
  - Validation approach: unit test — mock characters endpoint, assert only members present in parties appear in `context.characters`

- Proposal element: session logs refactor
  - Design decision: Decision 7 (distinct guarded task)
  - Validation approach: existing + new regression tests pass before and after refactor

## Functional Requirements Mapping

- **Requirement:** All parties linked to a campaign are included; members merged
  - Design element: `fetchCampaignContext` — `filter()` + member array concat
  - Acceptance criteria reference: specs/campaign-context/spec.md
  - Testability notes: unit test with mocked fetch; 2-3 parties with overlapping/non-overlapping members

- **Requirement:** Current chapter resolved from `currentChapterId`
  - Design element: `fetchCampaignContext` — `campaign.chapters.find(c => c.id === campaign.currentChapterId)`
  - Acceptance criteria reference: specs/campaign-context/spec.md
  - Testability notes: unit test — campaign with known `currentChapterId`, assert `context.chapter.title` matches

- **Requirement:** Each template assembles a complete prompt from `CampaignContext` + form fields
  - Design element: `lib/prompts/templates.ts` — `build(fields, context): BuiltPrompt`
  - Acceptance criteria reference: specs/prompt-templates/spec.md
  - Testability notes: unit test each template with fixed context and fields; assert key strings present in output

- **Requirement:** DM can copy generated prompt in one click
  - Design element: `app/campaigns/[id]/prompts/page.tsx` — "Copy" button calls `navigator.clipboard.writeText(builtPrompt.fullText)`
  - Acceptance criteria reference: specs/prompt-builder-ui/spec.md
  - Testability notes: mock `navigator.clipboard`; assert `writeText` called with correct string

- **Requirement:** Session logs uses merged member list (fixes #212)
  - Design element: Decision 7 — session logs refactor task
  - Acceptance criteria reference: specs/session-logs-refactor/spec.md
  - Testability notes: integration test — campaign with 2 parties, assert NPC events suggested from both parties' members

## Non-Functional Requirements Mapping

- **Requirement category:** Performance
  - Requirement: Context load does not serialize fetches
  - Design element: `Promise.all` in `fetchCampaignContext`
  - Testability notes: assert fetch mock called concurrently (same tick), not sequentially

- **Requirement category:** Reliability
  - Requirement: Graceful degradation when no parties or no current chapter
  - Design element: `context.parties` may be `[]`; `context.chapter` may be `null`; templates handle both
  - Testability notes: unit test each template with `null` chapter and empty `parties`/`characters`

- **Requirement category:** Operability
  - Requirement: Session logs regression-free after refactor
  - Design element: Decision 7 regression tests written before refactor
  - Testability notes: all existing session logs integration tests pass before and after

## Risks / Trade-offs

- **Risk/trade-off:** Session logs refactor introduces regression
  - Impact: Medium — logs is a used feature
  - Mitigation: Write regression tests first (separate task); refactor task can be reverted independently

- **Risk/trade-off:** `buildNpcEventsFromMemberChanges` called with merged members changes auto-event suggestions
  - Impact: Low — more complete suggestions is the desired behaviour
  - Mitigation: Existing unit tests for `buildNpcEventsFromMemberChanges` remain; verify output is a superset, not different

## Rollback / Mitigation

- **Rollback trigger:** Session logs regression detected after sessions refactor task merges.
- **Rollback steps:** Revert the sessions refactor task commit only (prompt builder commits are unaffected). The shared helper remains; sessions reverts to its own fetch logic temporarily.
- **Data migration considerations:** None — no schema changes.
- **Verification after rollback:** Session logs integration tests green; `useCampaignContext` still used by prompt builder.

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix the failing check. Do not use `--admin` bypass or `--no-verify`.
- **If security checks fail:** Do not merge. Address Codacy findings before requesting re-review.
- **If required reviews are blocked/stale:** Ping reviewer after 24 hours. Escalate to repo owner after 48 hours.
- **Escalation path and timeout:** If blocked beyond 48 hours, open a discussion issue describing the block.

## Open Questions

No open questions. All ambiguities resolved during exploration phase (see proposal.md).

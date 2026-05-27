## Context

- Relevant architecture: The Prompt Builder (`app/campaigns/[id]/prompts/page.tsx`) uses `useCampaignContext` to fetch a `CampaignContext` object, then calls `activeTemplate.build(fields, ctx)` to assemble prompts. Every template delegates to `buildSystemPrompt(context)` in `lib/prompts/templates.ts`. `Campaign.notes` is already present on the fetched context object via `context.campaign.notes`.
- Dependencies: Issue #189 complete — `Campaign.notes: string` exists in `lib/types.ts`. No new API endpoints or storage changes required.
- Interfaces/contracts touched: `buildSystemPrompt()` signature in `lib/prompts/templates.ts`; `PromptTemplate.build` method signature; `PromptBuilderContent` component state in `app/campaigns/[id]/prompts/page.tsx`.

## Goals / Non-Goals

### Goals

- Let DMs opt in per-session to including their campaign notes in generated prompts
- Keep the toggle invisible when there are no notes to include
- Ensure toggling after generation clears the stale prompt
- Keep all five prompt templates working without behaviour change when toggle is off

### Non-Goals

- Persisting the toggle state
- Per-template notes control
- Truncating or summarising long notes
- Any UI for editing notes (handled by Campaign Editor)

## Decisions

### Decision 1: Extend `buildSystemPrompt` with an `opts` parameter

- Chosen: `buildSystemPrompt(context: CampaignContext, opts?: { includeNotes?: boolean }): string`
- Alternatives considered:
  - Inject notes into `CampaignContext` before calling `build` — pollutes the shared context type with UI-only state
  - Assemble the notes block in the page after `build` returns — inconsistent with how `recentSessions` is handled; bypasses the single assembly point
- Rationale: A simple optional opts bag is the lowest-impact change to a stable public function. It mirrors how other optional blocks (`recentSessions`) are handled: context provides the data, the function decides whether to emit it.
- Trade-offs: Every `build` implementation must thread `opts` through to `buildSystemPrompt`. Five templates, one-line change each — acceptable.

### Decision 2: Thread `opts` through `PromptTemplate.build`

- Chosen: `build(fields: Record<string, string>, context: CampaignContext, opts?: { includeNotes?: boolean }): BuiltPrompt`
- Alternatives considered:
  - Have the page call a wrapper that post-processes the returned `BuiltPrompt` string — creates two assembly paths and a risk of format divergence
- Rationale: A uniform `build` signature keeps prompt assembly in one place. Callers that don't pass `opts` get the existing behaviour unchanged (TypeScript optional parameter).
- Trade-offs: The `PromptTemplate` interface changes — any external consumer of this interface would need to update. No external consumers exist in this codebase.

### Decision 3: Checkbox hidden (not disabled) when notes are absent

- Chosen: Hide the checkbox entirely when `campaign.notes.trim().length === 0`
- Alternatives considered: Render the checkbox disabled with a tooltip — adds complexity and presents a control DMs can't act on
- Rationale: Issue #231 specifies "hidden or disabled"; hidden is simpler and avoids visual noise.
- Trade-offs: If notes are added in another tab mid-session the checkbox won't appear without a page reload. Acceptable — notes are not live-updated in this view.

### Decision 4: Clear `builtPrompt` on toggle change

- Chosen: `setBuiltPrompt(null)` in the checkbox `onChange` handler
- Alternatives considered: Re-run generation automatically — surprising; the DM should confirm intent
- Rationale: Mirrors the existing `handleFieldChange` pattern exactly. Prevents a stale prompt from being displayed with the wrong notes inclusion state.
- Trade-offs: DM must re-click Generate after toggling. Expected and obvious.

## Proposal to Design Mapping

- Proposal element: `buildSystemPrompt` gains `opts?: { includeNotes?: boolean }`
  - Design decision: Decision 1 — opts parameter on `buildSystemPrompt`
  - Validation approach: Unit tests assert notes block present/absent based on flag value
- Proposal element: `PromptTemplate.build` signature gains `opts?`
  - Design decision: Decision 2 — thread opts through build
  - Validation approach: TypeScript compilation; existing tests pass without modification
- Proposal element: Checkbox hidden when notes empty
  - Design decision: Decision 3 — conditional render on `campaign.notes.trim().length > 0`
  - Validation approach: Unit test — checkbox not rendered when notes empty; rendered when non-empty
- Proposal element: Clear `builtPrompt` on toggle
  - Design decision: Decision 4 — `setBuiltPrompt(null)` in onChange
  - Validation approach: Unit test — generated prompt does not appear after toggle change

## Functional Requirements Mapping

- Requirement: Checkbox visible only when `campaign.notes` is non-empty
  - Design element: Conditional render in `PromptBuilderContent`
  - Acceptance criteria reference: specs/dm-notes-toggle/spec.md — visibility rules
  - Testability notes: Render with empty notes → checkbox absent; render with non-empty notes → checkbox present

- Requirement: Checked state appends notes block to prompt
  - Design element: `buildSystemPrompt` opts branch
  - Acceptance criteria reference: specs/dm-notes-toggle/spec.md — prompt output format
  - Testability notes: Call `buildSystemPrompt` with `opts.includeNotes: true` and assert block appears with correct header

- Requirement: Unchecked state omits notes block
  - Design element: `buildSystemPrompt` guard on `opts?.includeNotes`
  - Acceptance criteria reference: specs/dm-notes-toggle/spec.md — prompt output format
  - Testability notes: Call `buildSystemPrompt` without opts → notes block absent in output

- Requirement: Toggle resets to unchecked each session
  - Design element: `useState(false)` default in `PromptBuilderContent`
  - Acceptance criteria reference: No persistence; verified by absence of any localStorage/API write
  - Testability notes: Component initial render — checkbox unchecked

- Requirement: Notes block format is `"Current campaign context (DM notes):\n{notes}"`
  - Design element: Template string in `buildSystemPrompt`
  - Acceptance criteria reference: specs/dm-notes-toggle/spec.md — format spec
  - Testability notes: Assert exact header line in unit test

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No regression in existing prompt generation when toggle is off
  - Design element: `opts` is optional; existing callers pass nothing; `buildSystemPrompt` behaviour unchanged
  - Acceptance criteria reference: Existing `templates.test.ts` tests must continue passing
  - Testability notes: Run existing test suite; no changes to non-notes test cases

- Requirement category: operability
  - Requirement: No new network calls, no new API endpoints
  - Design element: All data comes from `context.campaign.notes` already fetched by `useCampaignContext`
  - Testability notes: No new fetch mocks needed; existing context mock suffices

## Risks / Trade-offs

- Risk/trade-off: Long notes injected verbatim could push prompts over AI token limits
  - Impact: AI tool may reject or truncate the prompt silently
  - Mitigation: Out of scope for this change (no truncation). Notes field has a 10,000 char server-side limit from #189. Documented as a known limitation.

- Risk/trade-off: Existing `buildSystemPrompt` test snapshots may assert on the full prompt string
  - Impact: Tests would fail after notes block is added if `includeNotes` inadvertently defaults to true
  - Mitigation: `opts?.includeNotes` defaults to falsy — no block is appended unless explicitly passed. No existing test breakage expected.

## Rollback / Mitigation

- Rollback trigger: Notes block consistently appears in prompts when toggle is off, or checkbox renders when notes are empty.
- Rollback steps: Revert the `buildSystemPrompt` opts change and the checkbox UI. No data migration needed — this is purely a UI change with no persistence.
- Data migration considerations: None. No new fields, no new storage.
- Verification after rollback: Existing unit tests pass; Prompt Builder generates prompts without notes block.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing test or lint error before proceeding.
- If security checks fail: Do not merge. This change has no new API surface or auth logic; a security failure is likely a pre-existing issue — investigate before attributing to this change.
- If required reviews are blocked/stale: Wait up to 48 hours, then ping the reviewer. Do not self-merge.
- Escalation path and timeout: After 48 hours with no review response, escalate to project owner.

## Open Questions

No unresolved questions. All design decisions confirmed during explore session and proposal review.

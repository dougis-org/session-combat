## GitHub Issues

- #231

## Why

- Problem statement: The Prompt Builder generates prompts using campaign name, chapter, party members, and recent sessions — but the DM's freeform campaign notes (added in #189) are never surfaced. A DM who has carefully written notes about current plot hooks, NPC states, and world events has to manually re-type that context every time they generate a prompt.
- Why now: Issue #189 (Campaign DM notes and lifecycle status) is fully implemented and closed. `Campaign.notes` exists in `lib/types.ts` and is returned by the campaign API. This is the only remaining gap for the notes field to have practical value in the Prompt Builder.
- Business/user impact: DMs with rich notes get dramatically more relevant AI prompts without extra effort. Notes are already written — this change makes them actionable in one click.

## Problem Space

- Current behaviour: `buildSystemPrompt()` in `lib/prompts/templates.ts` emits campaign name, module, current chapter, party members, and recent sessions. `Campaign.notes` is fetched as part of the campaign context but never injected into any prompt.
- Desired behaviour: A checkbox in the Prompt Builder UI lets the DM opt in to appending their notes to the generated prompt. When checked and notes are non-empty, a `"Current campaign context (DM notes):\n{campaign.notes}"` block is appended by `buildSystemPrompt()`. The toggle is session-local — it resets to unchecked on each page load.
- Constraints: Notes may contain spoilers or work-in-progress content the DM doesn't always want in the AI prompt, so the toggle must be opt-in (default off). No backend changes are needed — this is purely a UI + prompt assembly change.
- Assumptions: `campaign.notes` is already available inside `CampaignContext` via `context.campaign.notes` (confirmed — `Campaign` interface has `notes: string`). The `useCampaignContext` hook already fetches the full campaign object.
- Edge cases considered: Notes empty or whitespace-only → checkbox is hidden; no block is ever appended. Notes non-empty but checkbox unchecked → block is omitted. Toggle change after a prompt is already generated → clear `builtPrompt` so stale output is not shown with wrong content.

## Scope

### In Scope

- Add `opts?: { includeNotes?: boolean }` parameter to `buildSystemPrompt()` in `lib/prompts/templates.ts`
- Append `"Current campaign context (DM notes):\n{campaign.notes}"` block when `opts.includeNotes` is true and `campaign.notes.trim()` is non-empty
- Thread `opts` through `PromptTemplate.build(fields, context, opts?)` interface and all five template implementations (`npc`, `location`, `shop`, `magic-item`, `room`)
- Add `includeNotes: boolean` state (default `false`) to `PromptBuilderContent` in `app/campaigns/[id]/prompts/page.tsx`
- Render a labelled checkbox "Include DM notes in prompt" near the Generate button; hide/disable it when `campaign.notes` is empty or whitespace
- Clear `builtPrompt` when the checkbox is toggled
- Five unit tests covering the checkbox visibility and prompt output behaviours described in #231

### Out of Scope

- Persisting the toggle across sessions or page reloads
- Per-template opt-in (all templates share the same `buildSystemPrompt` call)
- Any changes to the sessions API, storage layer, or campaign notes editing UI
- Configurable notes length or truncation

## What Changes

- `lib/prompts/templates.ts` — `buildSystemPrompt()` gains `opts?: { includeNotes?: boolean }`; `PromptTemplate.build` signature gains `opts?`; all five `build` implementations thread `opts` through
- `app/campaigns/[id]/prompts/page.tsx` — `includeNotes` state, checkbox UI, `handleGenerate` passes opts
- `tests/unit/prompts/templates.test.ts` — five new unit tests for the notes toggle behaviour

## Risks

- Risk: Toggling the checkbox after prompt generation could leave the UI showing a prompt that doesn't match the current toggle state.
  - Impact: Confusing UX — DM thinks notes are included when they're not, or vice versa.
  - Mitigation: Clear `builtPrompt` in the checkbox `onChange` handler (same pattern as `handleFieldChange`).
- Risk: Existing `buildSystemPrompt` tests break because the signature changed.
  - Impact: CI failure.
  - Mitigation: `opts` is optional with a default of `undefined`; existing call sites pass nothing and behaviour is unchanged. Audit existing tests before implementation.
- Risk: `campaign.notes` contains only whitespace but the checkbox renders as enabled.
  - Impact: Checking it injects an empty-looking notes block into the prompt.
  - Mitigation: Gate both checkbox visibility and block injection on `campaign.notes.trim().length > 0`.

## Open Questions

No unresolved ambiguity. All decisions confirmed during exploration:
- Toggle is opt-in (default unchecked): specified in #231.
- Session-local only (no persistence): specified in #231.
- `opts` parameter on `buildSystemPrompt` (not context mutation): decided during explore session.
- Block format `"Current campaign context (DM notes):\n{notes}"`: specified in #231.
- Checkbox hidden (not just disabled) when notes empty: specified in #231.

## Non-Goals

- Persisting the notes toggle preference
- Per-template notes injection control
- Truncating or summarising long notes before injection
- Any changes to where or how notes are edited (that's the Campaign Editor, covered by #189)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

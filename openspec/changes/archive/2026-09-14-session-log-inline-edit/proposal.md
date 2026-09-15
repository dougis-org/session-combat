## GitHub Issues

- #723

## Why

- Problem statement: When reviewing a list of session logs, clicking edit opens the modal at the top of the page, which may not be where the user is currently at (e.g. if they scrolled down).
- Why now: A similar issue was fixed for campaigns and encounters, making the UX inconsistent.
- Business/user impact: Improves UX by allowing DMs to edit a session log directly where they are viewing it, without losing their scroll position or context.

## Problem Space

- Current behavior: The `<SessionForm>` is rendered conditionally above the entire list of logs when creating a new session or editing an existing one.
- Desired behavior: The `<SessionForm>` should render inline in place of the `<SessionEntryCard>` for the specific log being edited, while still rendering at the top for creating a new session.
- Constraints: The form needs all of the context properties (members, dates, etc.) that are already available in `SessionsContent`.
- Assumptions: The `SessionForm` component itself doesn't need to change its props drastically, it can just be rendered inside the `logs.map` loop.
- Edge cases considered: Canceling an edit should simply restore the card. Saving an edit should also restore the card with updated data.

## Scope

### In Scope

- Updating `app/campaigns/[id]/sessions/page.tsx` to render `<SessionForm>` inline for editing existing sessions.
- Keeping the "New Session" form rendered at the top of the list.

### Out of Scope

- Any changes to the underlying `SessionForm` logic or API endpoints.
- Any changes to how encounters or campaigns are rendered.

## What Changes

- In `app/campaigns/[id]/sessions/page.tsx`, the `logs.map` loop will check if `editingLog?.id === log.id`. If true, it renders `<SessionForm existing={log} ... />`. If false, it renders `<SessionEntryCard>`.
- The top-level `<SessionForm>` render condition will be changed from `showForm || editingLog` to `showForm && !editingLog`.

## Risks

- Risk: The inline form is too wide or looks broken in the list context.
  - Impact: Low (it's already displayed in a similar card context, and Encounters proved this pattern works).
  - Mitigation: Verify the form styling looks correct when rendered inside the list layout.

## Open Questions

- None.

## Non-Goals

- Refactoring the session form to a separate component file (it's fine to leave it in the page file for now).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

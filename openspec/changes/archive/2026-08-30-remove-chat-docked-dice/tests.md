---
name: tests
description: Tests for the remove-chat-docked-dice change
---

# Tests

## Overview

Tests for the `remove-chat-docked-dice` change (GitHub issue #585). This change is a
removal plus a small layout change; most of the "testing" is deletion of dead suites and
`grep`/`ls` structural checks, plus a handful of new behavior assertions for the
session-gated footer. Follow strict TDD for the new assertions: write them failing against
the current code (dice trigger still present), then make the `index.tsx` edit, then
refactor.

Commands: unit via `npm run test:unit`; integration via the project harness
(`npm run test:integration`), never Jest directly; typecheck `npm run typecheck`; build
`npm run build`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test / check:** capture the requirement; run it; confirm it fails
   (or, for deletions, confirm the file still exists and its suite still passes on the
   untouched branch as the baseline).
2. **Make the change:** the simplest edit/deletion that satisfies it.
3. **Refactor:** tidy the diff; keep every unrelated assertion verbatim.

## Test Cases

### T1 / T2 — Session-gated footer (spec: `roll-share-ui` ADDED "Chat dock shows a no-active-session footer instead of a dice bar")

- [ ] **Footer message shown when no session is active** — render `<CampaignChat campaignId="c1" activeSessionId={null} />`
  expanded; assert `screen.getByText('No active session')` is in the drawer.
  _Fails now: passes today too, but see next case._
- [ ] **No dice trigger when no session** — same render; assert
  `screen.queryByRole('button', { name: /roll|dice/i })` is `null` and
  `document.querySelector('[title="Dice Rolls for main screen pop out"]')` is `null`.
  _Fails now (trigger is rendered, just disabled)._
- [ ] **No footer strip when a session is active** — render with
  `activeSessionId="session-abc"` expanded; assert `screen.queryByText('No active session')`
  is `null` AND no `/roll|dice/i` button in the drawer AND no
  `[title="Dice Rolls for main screen pop out"]`. _Fails now (trigger rendered)._
- [ ] **Footer toggles with activeSessionId while open** — render with
  `activeSessionId="session-abc"`, expand, rerender with `activeSessionId={null}`; assert
  "No active session" appears; rerender with `activeSessionId="session-xyz"`; assert it
  disappears and no error is thrown.
- [ ] **Feed remains the flex-grow element** — with an active session, assert the
  `feedRef` container still carries the `flex-1` class and is the drawer's growing child
  (guards against the footer removal changing layout roles).

### T1 — Auto-scroll coverage migration (spec: `roll-share-ui` MODIFIED "Feed auto-scrolls on a new dice roll, consumed solely via the SSE stream")

- [ ] **Audit** `CampaignChat.dicePool.scroll.test.tsx` `it(...)` blocks vs
  `CampaignChat.roll.test.tsx`. For any SSE-`'roll'`-driven auto-scroll case not already
  in `roll.test.tsx`:
  - [ ] **Own roll scrolls into view regardless of scroll position** — mock an SSE
    `'roll'` event with `rollerId === user.userId`; assert `scrollIntoView`/scroll-to-
    bottom fired.
  - [ ] **Other player's roll scrolls only when near bottom** — SSE `'roll'` with a
    different `rollerId`; feed near bottom → scrolls; feed far from bottom → no scroll.
  - [ ] Port these into `CampaignChat.roll.test.tsx` driving the roll via the mocked SSE
    event (not the panel); confirm green against current code before T4 deletes the source.
- [ ] Any auto-scroll case that only made sense driven through the removed panel (e.g.
  "committing via the dock panel scrolls") is dropped — the panel no longer exists and
  the equivalent stream-driven case above covers the surviving behavior.

### T3 — Dead source removed (spec: `roll-share-ui` REMOVED requirements; `campaign-chat-dock` MODIFIED "Source location")

- [ ] `test -f lib/components/dice/DicePoolPanel.tsx` → false after change.
- [ ] `test -f lib/components/dice/DiceTriggerButton.tsx` → false after change.
- [ ] `test -f lib/components/CampaignChat/useCampaignDice.ts` → false after change.
- [ ] `grep -rn "DicePoolPanel\|DiceTriggerButton\|useCampaignDice" lib/ app/ tests/`
  returns nothing after change.
- [ ] `grep -rEn "useDicePoolState|useRollSubmission|/api/campaigns/.*/rolls" lib/components/CampaignChat/`
  returns only feed-render / history files (`useChatFeed.ts`, `useHistoryPagination.ts`),
  never `index.tsx` submitting a roll.
- [ ] `npm run typecheck` green (no dangling imports).

### T4 — Dead tests removed, shared-component tests intact

- [ ] `CampaignChat.dicePool.{ui,commit,scroll,ssr}.test.tsx` no longer exist.
- [ ] `tests/unit/components/dice/{DieGlyph,DiePoolButton,PercentileButton}.test.tsx`
  unchanged and green.
- [ ] `tests/unit/components/GlobalDiceFab.test.tsx` and `GlobalDiceFab.ssr.test.tsx`
  unchanged and green — including the "Send to session chat appears when CampaignChat has
  announced presence" case (proves the presence bridge still works).
- [ ] `CampaignChat.roll.test.tsx`, `.scene.test.tsx`, `.sse.test.tsx`, `.visibility.test.tsx`,
  `.unread.test.tsx`, `.history.test.tsx`, `.members.test.tsx`, `.composer.test.tsx`,
  `.drawer.test.tsx`, `.resize.test.tsx` pass with only dice-trigger-targeting assertions
  changed (if any).

### T5 — Spec & regression gates (spec: all deltas; `campaign-chat-dock` MODIFIED "Source location")

- [ ] `openspec validate remove-chat-docked-dice --strict` passes.
- [ ] `ls lib/components/CampaignChat/` matches the file list in the modified
  `campaign-chat-dock` "Source location" requirement (no `useCampaignDice.ts`).
- [ ] NFAC reliability: a `renderToString(<CampaignChat campaignId="c1" activeSessionId={null} />)`
  smoke test throws no `document`/portal error (add to the dock SSR coverage if not
  already present; supersedes the removed `CampaignChat.dicePool.ssr.test.tsx`).
- [ ] Full `npm run test:unit`, `npm run test:integration`, E2E/regression, and
  `npm run build` green (Remote push validation, full path).
- [ ] Verity pre-commit/pre-push gate green.

## Traceability

| Test case group | tasks.md task | specs scenario |
|---|---|---|
| Session-gated footer | T2 | `roll-share-ui` ADDED "Chat dock shows a no-active-session footer instead of a dice bar" (all scenarios) |
| activeSessionId still gates history+presence, not dice | T2, T4 | `roll-share-ui` MODIFIED "CampaignChat accepts activeSessionId prop" |
| Auto-scroll migration | T1 | `roll-share-ui` MODIFIED "Feed auto-scrolls on a new dice roll, consumed solely via the SSE stream" |
| Dead source removed | T3 | `roll-share-ui` REMOVED (all six); `campaign-chat-dock` MODIFIED "Source location" |
| Dead tests removed / shared tests intact | T4 | `roll-share-ui` REMOVED; NFAC "Existing chat-dock and feed tests pass after the removal" |
| SSR smoke | T5 | `roll-share-ui` NFAC "Chat dock server-renders without document/portal access" |
| Structural / spec gates | T5 | `campaign-chat-dock` MODIFIED "Source location" (both scenarios) |

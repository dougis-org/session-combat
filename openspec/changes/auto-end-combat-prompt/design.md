## Context

- Relevant architecture: `useCombat` owns combat state and `endCombat`; `ActiveCombatView` renders the active UI and already hosts the End Combat `ConfirmDialog`. `CombatantState` has `type`, `hp`, `lifeState`.
- Dependencies: `lib/components/ConfirmDialog.tsx`, `lib/combat/deathSaves.ts` (`usesDeathSaves`).
- Interfaces/contracts touched: `ActiveCombatView` internals only; no API, type, or persistence changes.

## Goals / Non-Goals

### Goals

- Prompt once when all monsters are down or the party is a true TPK.
- Yes ends combat with no further dialog.

### Non-Goals

- Fled tracking, auto-end, server changes.

## Decisions

### Decision 1: Pure helper `getCombatEndSuggestion`

- Chosen: `lib/combat/combatEnd.ts`, `(combatants) => 'monsters-defeated' | 'players-down' | null`.
- Alternatives considered: Inline logic in the component; logic inside `useCombat`.
- Rationale: Pure and unit-testable, matches `deathSaves.ts` style.
- Trade-offs: One more file.

Rules: monsters-defeated iff ≥1 `monster` and every `monster` has `hp <= 0`. players-down iff ≥1 `player` and every `player` has `lifeState === 'dead'` (players always use death saves, so 0 HP alone never counts). `lair` ignored. Dying/stable/no-lifeState-at-0 players are not down. If both hold, `monsters-defeated` wins.

### Decision 2: Prompt in `ActiveCombatView` with answered-suggestion state

- Chosen: `answeredSuggestion` state stores the suggestion the user answered; the prompt is open when the derived suggestion is non-null and differs from it; it is cleared (during render) when the suggestion is null. No effect is needed (avoids `react-hooks/set-state-in-effect`).
- Alternatives considered: Fire only on false→true transitions via previous-value ref (breaks on reload); persist dismissal.
- Rationale: Derived-state approach handles reload and re-arming with minimal state.
- Trade-offs: Dismissal is not persisted; reload re-prompts.

### Decision 3: Yes calls `endCombat()` directly

- Chosen: Second `ConfirmDialog` (unique `titleId`) whose confirm closes the dialog and calls `endCombat()`, bypassing `showEndCombatConfirm`.
- Alternatives considered: Reuse the existing dialog with dynamic text.
- Rationale: Meets "no dialog since already responded" and keeps the manual button path untouched.
- Trade-offs: Two dialog instances.

## Proposal to Design Mapping

- Proposal element: Derive suggestion from combatants
  - Design decision: Decision 1
  - Validation approach: Unit tests for helper
- Proposal element: Prompt once, no nagging, re-arm
  - Design decision: Decision 2
  - Validation approach: Component tests
- Proposal element: Yes ends combat without second dialog
  - Design decision: Decision 3
  - Validation approach: Component test asserts `endCombat` called and no "End Combat?" dialog

## Functional Requirements Mapping

- Requirement: Prompt when all monsters down
  - Design element: Decision 1, 2
  - Acceptance criteria reference: specs/combat-end-prompt/spec.md "Monsters defeated prompt"
  - Testability notes: Pure helper + RTL
- Requirement: Prompt on true TPK only
  - Design element: Decision 1
  - Acceptance criteria reference: "Dying players do not trigger"
  - Testability notes: Helper table tests
- Requirement: No nag after No; re-arm
  - Design element: Decision 2
  - Acceptance criteria reference: "Dismissal respected", "Re-arm"
  - Testability notes: RTL rerender with changed combatants
- Requirement: Yes ends combat directly
  - Design element: Decision 3
  - Acceptance criteria reference: "Confirm ends combat"
  - Testability notes: Mock `endCombat`

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: Dialog accessible (focus trap, Escape cancels) via `ConfirmDialog`
  - Design element: Decision 3
  - Acceptance criteria reference: NFAC Operability
  - Testability notes: Existing `Modal` behavior; assert Escape dismisses

## Risks / Trade-offs

- Risk/trade-off: Reload re-prompts after earlier "No".
  - Impact: Minor annoyance.
  - Mitigation: Accepted; revisit if reported.

## Rollback / Mitigation

- Rollback trigger: Prompt misfires in play.
- Rollback steps: Revert the PR (UI-only change).
- Data migration considerations: None.
- Verification after rollback: Manual End Combat button still works.

## Operational Blocking Policy

- If CI checks fail: Fix, validate locally, push; do not merge with failing required checks.
- If security checks fail: Remediate and re-scan; no waivers without explicit human acceptance.
- If required reviews are blocked/stale: Ping reviewer; after 24h escalate to the requester.
- Escalation path and timeout: Report stall to requester after three no-progress iterations.

## Open Questions

- Should all-monsters-removed prompt? Default: no.

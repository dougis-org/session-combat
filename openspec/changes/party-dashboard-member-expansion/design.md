## Context

- Relevant architecture: Next.js app with a `lib/components/` shared component library. `CreatureStatBlock` is the canonical stat display used in combat and encounter views. `app/parties/page.tsx` fetches all characters and parties on mount and holds them in local state — no additional fetches needed for this change.
- Dependencies: `lib/types.ts` exports `CharacterType`, `CHARACTER_TYPE_ORDER`, `CHARACTER_TYPE_LABELS`, `getCharacterType`. All character fields needed (name, race, classes, ac, hp, maxHp, characterType) are present on the `Character` interface which extends `CreatureStats`.
- Interfaces/contracts touched:
  - `lib/components/CreatureStatBlock.tsx` — props interface unchanged; internal rendering refactored to use `CombatStatsRow`
  - `lib/components/CombatStatsRow.tsx` — new component, new public interface
  - `lib/components/CharacterMiniSummary.tsx` — new component, new public interface
  - `app/parties/page.tsx` — party card rendering updated; no prop/API changes

## Goals / Non-Goals

### Goals

- Extract `CombatStatsRow` so AC/HP display logic lives in exactly one place
- Provide `CharacterMiniSummary` as a lightweight read-only card (name, identity line, AC/HP)
- Party list cards group members by `characterType` and render one `CharacterMiniSummary` per member
- Zero visual regression in existing `CreatureStatBlock` consumers

### Non-Goals

- Prompt builder integration
- Any changes to campaigns page or combat/encounter views beyond refactoring `CreatureStatBlock`
- Editable inline stats in the party list

## Decisions

### Decision 1: Extract `CombatStatsRow` as a shared primitive

- Chosen: New `lib/components/CombatStatsRow.tsx` exporting `CombatStatsRow`. Props: `{ ac: number; acNote?: string; hp: number; maxHp: number }`. Renders the exact same JSX/Tailwind currently in `CreatureStatBlock` lines 64–78.
- Alternatives considered: Keep AC/HP inline in both components (duplication); make `CharacterMiniSummary` a thin wrapper around `CreatureStatBlock` with `isCompact` (wrong coupling — pulls character fields into a creature component).
- Rationale: Single source of truth for AC/HP layout. Neither component owns it; both consume it.
- Trade-offs: One extra file, one extra import. Negligible.

### Decision 2: `CharacterMiniSummary` is standalone, not embedded in `CreatureStatBlock`

- Chosen: `CharacterMiniSummary` is its own component with character-specific props (`name`, `race`, `characterType`, `classes`, `ac`, `hp`, `maxHp`). It uses `CombatStatsRow` internally. `CreatureStatBlock` is unaware of it.
- Alternatives considered: Accept optional character props in `CreatureStatBlock` and render a header — rejected because it couples character domain into a generic creature component.
- Rationale: `CreatureStatBlock` is generic (works for monsters too). Character identity belongs in a character-specific component.
- Trade-offs: Two separate components instead of one. Justified by clean domain separation.

### Decision 3: Level derived from `classes` array sum

- Chosen: `const level = classes?.reduce((sum, c) => sum + (c.level ?? 0), 0) ?? 0`. Display as `Lv {level}` or omit if 0.
- Alternatives considered: Accept a `level` prop directly — rejected because `Character` stores per-class levels; summing is the correct derived value.
- Rationale: Consistent with how level is computed elsewhere in the app.
- Trade-offs: Minor computation per render; negligible.

### Decision 4: Defensive fallbacks for missing character fields

- Chosen: `race ?? '—'`, empty classes array renders no class/level line. No throws.
- Alternatives considered: Assert fields present — rejected; older records may lack them.
- Rationale: Graceful degradation over crashes.
- Trade-offs: Slightly noisier display for incomplete records; acceptable.

### Decision 5: Party card replaces `getCharacterNames()` with grouped mini-summary sections

- Chosen: In the party card render, replace the `getCharacterNames()` text block with a `CHARACTER_TYPE_ORDER.map(type => ...)` section (same pattern as `PartyEditor` lines 288–306) rendering `CharacterMiniSummary` per member. Groups with zero members return `null`.
- Alternatives considered: Collapsible expand/collapse — rejected as unnecessary complexity for the current scope.
- Rationale: Always-visible grouped display matches the issue requirement and mirrors the editor pattern already in the file.
- Trade-offs: Party cards become taller for large parties; acceptable for a DM-facing tool.

## Proposal to Design Mapping

- Proposal element: Extract `CombatStatsRow` from `CreatureStatBlock`
  - Design decision: Decision 1
  - Validation approach: Unit test that `CreatureStatBlock` renders identical AC/HP output before and after refactor

- Proposal element: New `CharacterMiniSummary` component
  - Design decision: Decisions 2, 3, 4
  - Validation approach: Unit tests covering name/race/class/level/AC/HP rendering and all fallback cases

- Proposal element: Party list grouped member display
  - Design decision: Decision 5
  - Validation approach: Unit test that party card renders three sections for a mixed party; hidden sections for missing types

## Functional Requirements Mapping

- Requirement: Party card shows members grouped by `characterType`
  - Design element: Decision 5 — `CHARACTER_TYPE_ORDER.map` in party card render
  - Acceptance criteria reference: specs/party-member-expansion/spec.md
  - Testability notes: Render party with 2 PCs + 1 NPC; assert two visible group sections

- Requirement: Empty groups are hidden
  - Design element: Decision 5 — group returns `null` when `group.length === 0`
  - Acceptance criteria reference: specs/party-member-expansion/spec.md
  - Testability notes: Render party with PCs only; assert no Companions or NPCs section in DOM

- Requirement: `CharacterMiniSummary` shows name, identity, AC, HP
  - Design element: Decisions 2, 3, 4
  - Acceptance criteria reference: specs/character-mini-summary/spec.md
  - Testability notes: Render with known props; assert all fields present

- Requirement: `CreatureStatBlock` unchanged visually
  - Design element: Decision 1 — pure extraction, same JSX
  - Acceptance criteria reference: specs/combat-stats-row/spec.md
  - Testability notes: Snapshot test or explicit assertion on rendered AC/HP values

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No crashes on partial character data (missing race, empty classes)
  - Design element: Decision 4 — defensive fallbacks
  - Acceptance criteria reference: specs/character-mini-summary/spec.md
  - Testability notes: Render `CharacterMiniSummary` with `race: undefined`, `classes: []`; assert no throw and graceful output

- Requirement category: performance
  - Requirement: No additional network requests for party list rendering
  - Design element: All data already in `PartiesContent` state; no new fetches
  - Acceptance criteria reference: N/A — architectural constraint, not a spec scenario
  - Testability notes: Verify no `fetch` calls in `CharacterMiniSummary` or `CombatStatsRow`

## Risks / Trade-offs

- Risk/trade-off: `CreatureStatBlock` visual regression after `CombatStatsRow` extraction
  - Impact: Combat/encounter views display broken AC/HP
  - Mitigation: Extraction is identical JSX — no class or prop changes. Existing unit tests catch regressions.

- Risk/trade-off: Older character records missing `race` or `classes`
  - Impact: Mini-summary shows `—` or no class line
  - Mitigation: Decision 4 fallbacks; acceptable display degradation

## Rollback / Mitigation

- Rollback trigger: Visual regression in `CreatureStatBlock` consumers, or crash in party list for any character record
- Rollback steps: Revert the three changed/new files (`CombatStatsRow.tsx`, `CharacterMiniSummary.tsx`, `CreatureStatBlock.tsx`, `parties/page.tsx`); no schema or API changes to undo
- Data migration considerations: None — pure UI change
- Verification after rollback: Party list shows comma-name list; `CreatureStatBlock` renders AC/HP as before

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check before proceeding.
- If security checks fail: Do not merge. Escalate to repo owner (dougis).
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to repo owner after 48 hours.
- Escalation path and timeout: Repo owner resolves all blocks within 48 hours or defers the change.

## Open Questions

No open questions. All decisions confirmed during explore mode.

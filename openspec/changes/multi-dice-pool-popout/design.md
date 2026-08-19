## Context

- Relevant architecture: `lib/components/CampaignChat.tsx` hosts the chat dock (its own `isExpanded`/`isPinned`/`isLarge`/`customHeight` dock-shell state machine, see `campaign-chat-dock` spec) and, inside it, `RollEntryStrip` (lines ~255-347) and `RollFeedItem` (lines ~91-109). `lib/utils/dice.ts` exports `rollDie(sides, count = 1): number[]` using rejection-sampled `crypto.getRandomValues`. `app/api/campaigns/[id]/rolls/route.ts` validates and persists `{ formula: string, rolls: number[], total: number, visibility, ... }` — generic, formula-agnostic.
- Dependencies: none new (no new npm packages — `createPortal` is part of `react-dom`, already a project dependency).
- Interfaces/contracts touched:
  - `lib/utils/dice.ts` — additive export only, `rollDie` untouched.
  - `lib/components/CampaignChat.tsx` — `RollEntryStrip` removed and replaced; `RollFeedItem`, dock-shell state, SSE handling, and all other sub-components untouched.
  - No changes to `lib/types.ts`, `app/api/campaigns/[id]/rolls/route.ts`, or `lib/utils/campaignRolls.ts`.

## Goals / Non-Goals

### Goals

- Let a player stage a mix of any supported die sizes (4/6/8/10/12/20/100) plus a modifier, then commit them as one combined roll.
- Return staged/committed results as `{ sides, value }[]` so per-die identity survives the roll (groundwork for later animation), while still posting the existing flat `formula`/`rolls`/`total` shape to the unchanged API.
- Move the dice UI out of the chat dock's permanent footprint into a floating, portaled pop-out triggered by a small persistent d20 icon.

### Non-Goals

- Visual dice animation (tumble/roll effects) — deferred; only the data shape is prepared.
- Cross-viewer replay of per-die breakdown — deferred; `CampaignRoll`/API/`RollFeedItem` unchanged.
- Any change to `rollDie`, its callers, or the chat dock's own shell state machine.

## Decisions

### Decision 1: New multi-group roll function, `rollDicePool`, added alongside `rollDie`

- Chosen: Add `rollDicePool(groups: { sides: number; count: number }[]): { sides: number; value: number }[]` to `lib/utils/dice.ts`. Internally it validates each group's `sides` against the same `SUPPORTED_SIDES` list and calls the existing `rollOneDie` helper per die (reusing the exact rejection-sampling logic `rollDie` uses today), just tagging each result with its source `sides`.
- Alternatives considered:
  1. Change `rollDie`'s return type to `{sides, value}[]`. Rejected — breaks `InitiativeEntry`/`lib/utils/combat.ts`, which expect a flat `number[]`; out of scope per the proposal's explicit constraint.
  2. Have the UI call `rollDie` once per die-size group and zip in the `sides` tag client-side, with no new `dice.ts` export. Rejected — this would duplicate the "loop count times, tag with sides" logic in the component instead of the utility layer, and the `dice-rolling` capability is specifically meant to own all dice-roll logic centrally (see its existing Purpose statement: "one shared implementation instead of ad-hoc local dice logic").
- Rationale: Keeps `dice-rolling`'s "single centralized dice-rolling utility" principle intact, keeps `rollDie`'s existing, spec-locked contract untouched, and gives the UI layer exactly the `{sides, value}[]` shape the proposal requires.
- Trade-offs: One more exported function to maintain in `dice.ts`; acceptable given it's a thin, ~10-line wrapper around already-tested primitives.

### Decision 2: Staging pool represented as `Record<number, number>` (sides → count), not a flat list of staged die instances

- Chosen: Client component state is a map of die size to count, e.g. `{ 6: 2, 8: 2 }`, edited via per-size increment/decrement controls (mirrors today's die-button row, now with a count badge instead of firing an immediate roll).
- Alternatives considered: A flat array of individually-addressable staged dice (`{id, sides}[]`) with per-line remove buttons. Rejected as the default — for the common case (multiple dice of the *same* size), a per-line list adds visual noise and scroll risk with no benefit, since individual same-size dice are interchangeable before rolling. This remains open per the proposal's Open Questions; grouped counters are the default pending confirmation.
- Rationale: Matches the existing die-button row's visual language most closely (least surprising evolution of current UI), trivially serializes to both the `rollDicePool` group input and a `"NdX"`-per-group formula string, and needs no list-key/virtualization handling.
- Trade-offs: If the requester confirms they want a flat per-instance list instead (e.g. to remove exactly one specific staged d6 while a 2nd d6 is retried differently — not meaningfully different pre-roll), this decision is revisited; the counter model can't express "these two d6 are different" because pre-roll they aren't.

### Decision 3: Formula and breakdown strings are built from the staged state, never parsed from free text

- Chosen: `formula` is composed as `Nd<sides>` per non-zero group, joined with `+`, with the modifier appended (`+M`/`-M`, omitted at 0) — same convention `RollEntryStrip` already uses for the modifier sign. `rolls: number[]` is `rollDicePool(...).map(r => r.value)` in staged-group order.
- Alternatives considered: A free-text formula input (`"2d6+2d8+3"`) parsed client-side. Rejected — parsing/validating arbitrary dice-notation text is materially more surface area (ambiguous syntax, injection-adjacent input handling) for no benefit over structured staging controls, and wasn't requested.
- Rationale: No parser needed; the wire format the server already validates (`formula` non-empty string, `rolls` finite-number array, `total` finite number) is satisfied trivially by construction.
- Trade-offs: None significant — this is strictly simpler than the alternative.

### Decision 4: Pop-out renders via `createPortal` to a dedicated overlay root appended to `document.body`, `fixed`-positioned from the trigger's `getBoundingClientRect()`

- Chosen: A small `DicePoolPortal` wrapper creates (once, lazily, guarded by `typeof document !== 'undefined'` for SSR safety — same `isBrowser()` convention `LocalStore` already uses) a dedicated `<div id="dice-pool-overlay-root">` under `document.body` if one doesn't exist, and portals the pop-out contents into it. Position is computed from the trigger button's bounding rect on open and on window resize/scroll, anchored above-right of the trigger (mirroring the existing chat-dock pill's `fixed bottom-4 right-4` corner convention). `z-index` is set explicitly higher than the chat dock's `z-40`.
- Alternatives considered:
  1. `position: fixed` nested directly in the DOM tree without a portal, relying on the dock not having `overflow: hidden`/`transform` ancestors that would trap it. Rejected — proposal explicitly requires floating outside the chat frame, and the chat drawer's existing height-constrained, resizable box is exactly the kind of container `fixed` positioning can get trapped inside if any ancestor establishes a containing block; a portal sidesteps that entirely and is the standard React solution for this problem.
  2. CSS-only `position: fixed` at the top of the React tree (sibling of `CampaignChat`, not a portal). Rejected — would require lifting the pop-out's mount point up to wherever `CampaignChat` itself is rendered (`app/campaigns/[id]/layout.tsx`), coupling two independent components' render trees for a purely visual/z-order concern that `createPortal` solves locally.
- Rationale: This is the standard, idiomatic React pattern for "float above everything, ignore ancestor clipping/stacking context" — introducing it here (as the first portal in the codebase) is lower-risk than the workarounds.
- Trade-offs: First portal usage means no existing test-harness precedent in this repo for asserting portaled content (e.g. RTL's `screen` queries against `document.body` generally still work fine since portals still attach to the DOM, but this should be explicitly verified in the first test written against it — see Testability below).

### Decision 5: Pop-out open/close is local, independent React state — not wired into the chat dock's `dockReducer`

- Chosen: A single `isDicePoolOpen` boolean (plus staged-pool state) lives in a new sub-component, siblings with `RollFeedItem`/etc. inside `CampaignChat`, entirely separate from `dockReducer`'s `isExpanded`/`isPinned`/`isLarge`/`customHeight`.
- Alternatives considered: Extend `dockReducer` with pop-out state. Rejected — proposal explicitly scopes the chat dock's own shell state machine as untouched; the pop-out is a sibling floating panel with independent lifecycle (it can open/close regardless of whether the chat drawer itself is expanded, as long as an active session exists).
- Rationale: Keeps the two concerns (chat drawer visibility vs. dice pop-out visibility) decoupled, avoids growing `dockReducer`'s action surface for an unrelated feature, and matches the proposal's explicit non-goal.
- Trade-offs: None significant.

## Proposal to Design Mapping

- Proposal element: New multi-group roll operation returning `{sides, value}[]`
  - Design decision: Decision 1
  - Validation approach: Unit tests in `tests/unit/lib/dice.test.ts` (extended) covering mixed-group input, per-group validation errors, and result tagging.
- Proposal element: Staging pool (add/remove dice of any size, shared modifier, explicit "Roll" commit)
  - Design decision: Decision 2, Decision 3
  - Validation approach: Component tests asserting pool state changes on increment/decrement, formula/rolls/total composed correctly at commit, and no POST fires before commit.
- Proposal element: Floating pop-out outside the chat dock frame, triggered by a d20 icon
  - Design decision: Decision 4
  - Validation approach: Component test asserting the pop-out's DOM node is a descendant of the overlay root (not the chat dock's drawer container), plus a manual/visual verification task on desktop and narrow viewports (per proposal Risk 1).
- Proposal element: No change to `CampaignRoll`/rolls API; flatten to existing POST shape at commit
  - Design decision: Decision 3
  - Validation approach: Existing `tests/unit/api/campaigns/[id]/rolls.route.test.ts` requires zero changes; a new component-level test asserts the POST body shape matches today's contract for a mixed-group roll.
- Proposal element: Pop-out has independent open/close state, not part of `dockReducer`
  - Design decision: Decision 5
  - Validation approach: Component test asserting the pop-out can be opened/closed independently of the chat drawer's expand/collapse state.

## Functional Requirements Mapping

- Requirement: Staging pool accumulates dice across multiple sizes before any roll occurs
  - Design element: Decision 2 (`Record<number, number>` pool state)
  - Acceptance criteria reference: `roll-share-ui` delta spec, "ADDED Dice staging pool"
  - Testability notes: Assert pool state after N increment clicks across multiple die sizes; assert zero network calls until commit.

- Requirement: Commit posts one combined roll matching today's API contract
  - Design element: Decision 3 (formula/rolls composition)
  - Acceptance criteria reference: `roll-share-ui` delta spec, "MODIFIED Roll-entry mechanism now stages then commits"
  - Testability notes: Assert POST body `formula`, `rolls`, `total` for a known pool + modifier + mocked `rollDicePool` result.

- Requirement: New `rollDicePool` operation validates and tags results by die size
  - Design element: Decision 1
  - Acceptance criteria reference: `dice-rolling` delta spec, "ADDED Multi-group dice roll operation"
  - Testability notes: Unit test each supported size, an unsupported size (rejection), zero/negative counts (rejection), and result ordering/tagging.

- Requirement: Pop-out floats outside the chat dock frame
  - Design element: Decision 4
  - Acceptance criteria reference: `roll-share-ui` delta spec, "ADDED Floating dice pop-out"
  - Testability notes: DOM structure assertion (portal target is a sibling of, not nested in, the chat dock drawer); no clipping under a constrained-height/`overflow:hidden` container in a test harness that simulates one.

## Non-Functional Requirements Mapping

- Requirement category: Reliability
  - Requirement: Pop-out portal target creation is SSR-safe (no `document` access during server render)
  - Design element: Decision 4 (`isBrowser()`-guarded lazy creation)
  - Acceptance criteria reference: `roll-share-ui` delta spec, NFAC "Reliability — SSR safety"
  - Testability notes: Mirrors the existing SSR-safety test pattern already used for `LocalStore`/`campaign-chat-dock` (`No localStorage access during server render`); add an analogous "no `document` access during server render for the dice pop-out" test.

- Requirement category: Security
  - Requirement: No new user-supplied input parsing (formula is constructed, never parsed) avoids introducing an injection/parsing surface
  - Design element: Decision 3
  - Acceptance criteria reference: See functional scenario "Commit posts one combined roll matching today's API contract" — no distinct NFAC scenario needed (per this project's rule against duplicating functional coverage in NFAC).

- Requirement category: Operability
  - Requirement: First-ever portal pattern in the codebase should not require ongoing bespoke handling by future components
  - Design element: Decision 4 (`DicePoolPortal` wrapper is a small, reusable-shaped component, not inlined ad hoc)
  - Acceptance criteria reference: N/A (implementation-quality guidance, not a testable scenario)
  - Testability notes: Code review checklist item during `openspec-review-code` pass in tasks.md.

## Risks / Trade-offs

- Risk/trade-off: Grouped-counter staging model (Decision 2) can't express "these two same-size dice are individually distinct" pre-roll.
  - Impact: If the requester's real intent was a flat per-instance list, this is a UI rework after the fact.
  - Mitigation: Explicitly flagged in proposal Open Questions as non-blocking-but-pending; cheap to revisit since it's isolated to one sub-component's internal state shape, not the `rollDicePool` contract or the API.
- Risk/trade-off: First portal usage (Decision 4) has no precedent test pattern in this repo.
  - Impact: Slightly higher chance of an RTL/jsdom-specific gotcha (e.g. `document.body` cleanup between tests) surfacing during implementation.
  - Mitigation: Write the portal-structure test early (per Functional Requirements Mapping) so any jsdom/RTL friction is caught before the rest of the pop-out is built on top of it.

## Rollback / Mitigation

- Rollback trigger: Pop-out positioning/z-index breaks on a real viewport in a way visual verification (Risk 1 in proposal) can't catch pre-merge, or the staging interaction is confirmed unwanted post-merge.
- Rollback steps: Revert the `CampaignChat.tsx` changes to restore `RollEntryStrip` (git revert of the single implementation commit/PR); `rollDicePool` in `dice.ts` can be left in place harmlessly (unused, additive) or reverted alongside — no data/schema to roll back since `CampaignRoll`/API are untouched.
- Data migration considerations: None — no persisted schema changes.
- Verification after rollback: Existing `roll-share-ui`/`CampaignChat` test suites (pre-change baseline) pass unmodified, confirming the old strip's behavior is fully restored.

## Operational Blocking Policy

- If CI checks fail: Diagnose and fix per this project's tasks.md rules (mandatory pre-commit `openspec-review-code` pass, then `pr-review-toolkit:review-pr` gate loop) before enabling auto-merge; never force-merge.
- If security checks fail: Treat as blocking; since this change introduces no new server-side input parsing or auth surface (Decision 3 explicitly avoids formula parsing), no security-specific exception is anticipated, but any finding must be resolved, not suppressed.
- If required reviews are blocked/stale: Follow tasks.md's stall policy — after three or more review-fix-push iterations with no progress, report the stall to the user with remaining findings listed and wait for guidance, per `openspec/config.yaml`'s tasks rules.
- Escalation path and timeout: Same as above — no distinct timeout beyond the "three-plus iterations with no progress" trigger already codified project-wide.

## Open Questions

- (Carried from proposal.md, both non-blocking for apply, defaults chosen above pending confirmation)
  - Grouped per-size counters vs. flat per-instance staged list for the pool UI (Decision 2).
  - Exact pop-out anchor/animation beyond "above-right of the trigger, matching the dock pill's corner convention, simple fade/scale" (Decision 4).

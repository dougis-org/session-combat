## Context

- Relevant architecture: `GlobalDiceFab` (manages dice pool state via `useDicePoolState`, initiates roll via `performRoll`). `DiceRollOverlay` (react portal component that displays roll result total and hosts the 3d canvas when enabled).
- Dependencies: `useDicePoolState`, `game-icons.net` SVGs stored in `lib/components/icons/dice.tsx`.
- Interfaces/contracts touched: Adding visual SVG rendering to `DiceRollOverlay`, hooking into `built.breakdown` and `built.percentileFaces`. `GlobalDiceFab` roll triggers.

## Goals / Non-Goals

### Goals

- Show static visual representations (SVG) of rolled dice in the modal.
- Render percentile rolls correctly as two d10s (tens and ones digits).
- Make the roll formula label larger (`text-2xl` or similar).
- Automatically reset the dice pool upon rolling.

### Non-Goals

- Attempting to take WebGL snapshots from the 3D physics library.
- Overhauling the styling of the 3D physics dice themselves.

## Decisions

### Decision 1: Render Dice Results using game-icons.net SVGs

- Chosen: Create a `StaticRollResult` sub-component inside (or alongside) `DiceRollOverlay` that uses the SVGs in `lib/components/icons/dice.tsx`. It will map over `built.breakdown` and position the `value` rolled in the center of the SVG icon.
- Alternatives considered: Capturing a WebGL frame from `@3d-dice/dice-box`.
- Rationale: Capturing frames is highly complex, breaks when animations are disabled, and isn't reliably centered. SVGs are clean, lightweight, and always available.
- Trade-offs: The SVGs are 2D representations rather than fully shaded 3D models matching the tumbling dice, but they maintain aesthetic consistency with the rest of the application's icons.

### Decision 2: Render Percentile Rolls as two D10s

- Chosen: If `built.percentileFaces` is present, render two D10 icons side-by-side using the two faces rather than a single `d%` icon.
- Alternatives considered: Showing a single icon with the sum (e.g. 74).
- Rationale: Showing the actual faces rolled (e.g., 70 and 4) mimics the physical dice experience, aligning closely with user expectations for percentile rolls.
- Trade-offs: Requires a slight branching logic in the render path.

### Decision 3: Call `dp.reset()` in `GlobalDiceFab.tsx`

- Chosen: Call `dp.reset()` inside `handleRoll` and `handlePercentileRoll` (or directly within `performRoll` upon success).
- Alternatives considered: Modifying `useDicePoolState.ts` to auto-reset when `buildRoll` is called.
- Rationale: `buildRoll` is a pure function that generates the roll; mutating state inside it is an anti-pattern. Invoking the reset explicitly in the event handler is cleaner.
- Trade-offs: Minor imperative code in the component.

## Proposal to Design Mapping

- Proposal element: Increase font size of formula label
  - Design decision: Update Tailwind classes in `DiceRollOverlay.tsx`
  - Validation approach: Visual inspection / unit test snapshot

- Proposal element: Show visual representation of dice results
  - Design decision: Decision 1 & Decision 2 (SVG overlay)
  - Validation approach: E2E or unit testing to ensure icons render with correct numbers

- Proposal element: Reset dice pool on roll
  - Design decision: Decision 3 (`dp.reset()` call)
  - Validation approach: Unit test that pool state empties after rolling

## Functional Requirements Mapping

- Requirement: Dice results rendered visually
  - Design element: `StaticRollResult` SVG mappings
  - Acceptance criteria reference: Specs
  - Testability notes: Mock `built.breakdown` and `built.percentileFaces` to verify correct icons and values are mounted.

- Requirement: Dice pool resets after roll
  - Design element: `performRoll` handler updates
  - Acceptance criteria reference: Specs
  - Testability notes: Dispatch a roll and assert the pool is `EMPTY_POOL`.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Rendering many SVGs should not degrade performance
  - Design element: Use lightweight SVG icons
  - Acceptance criteria reference: Specs
  - Testability notes: Test with maximum pool size.

## Risks / Trade-offs

- Risk/trade-off: Visual clutter with large pools
  - Impact: Low
  - Mitigation: Use flex-wrap and responsive sizing for the dice icons container.

## Rollback / Mitigation

- Rollback trigger: Modal styling breaks or becomes unusable on mobile
- Rollback steps: Revert the PR
- Data migration considerations: N/A
- Verification after rollback: Open the global dice fab and roll.

## Operational Blocking Policy

- If CI checks fail: Developer resolves failures before merge.
- If security checks fail: Same.
- If required reviews are blocked/stale: Ping reviewer.
- Escalation path and timeout: N/A

## Open Questions

- None

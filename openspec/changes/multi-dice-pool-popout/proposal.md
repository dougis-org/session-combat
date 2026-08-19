## GitHub Issues

- dougis-org/session-combat#509

## Why

- Problem statement: The dice roller only supports rolling one die size at a time (`RollEntryStrip` in `lib/components/CampaignChat.tsx`). A player who needs a mixed roll — e.g. `2d6 + 2d8` for a multi-die damage formula — has to roll each die size separately and add totals by hand, and each click posts an individual roll to the chat feed instead of one combined result.
- Why now: Filed by the campaign owner as issue #509; the always-visible strip also crowds the chat dock footer, and the issue explicitly asks for it to become a pop-out so it stops competing for space with the chat composer.
- Business/user impact: Faster, less error-prone rolling for multi-die formulas (common in D&D damage/attack rolls); a cleaner chat dock footer (a single d20 trigger icon instead of a permanent row of six die buttons + modifier + visibility select).

## Problem Space

- Current behavior: `RollEntryStrip` renders six always-visible die buttons (d4–d20). Clicking any button immediately rolls one die of that size via `rollDie(sides, 1)`, adds the shared modifier, and POSTs a single-die-type formula (e.g. `"1d20+3"`) to `/api/campaigns/[id]/rolls`. There is no concept of combining multiple die sizes into one roll, and no staging step — every click is a commit.
- Desired behavior: A d20 icon anchored at the bottom of the chat panel opens a floating pop-out, positioned outside the chat dock's own box (not clipped by it). Inside the pop-out, the user builds up a pool of dice across any mix of sizes (e.g. 2×d6, 2×d8) plus a modifier, then explicitly commits with a single "Roll" action. Nothing rolls until that commit — including a pool of exactly one die. The commit posts one combined roll (e.g. `formula: "2d6+2d8+3"`) to the existing rolls API, unchanged.
- Constraints:
  - The rolls API and `CampaignRoll` type (`lib/types.ts`, `app/api/campaigns/[id]/rolls/route.ts`) are not part of this change — the POST body shape (`formula: string`, `rolls: number[]`, `total: number`, `visibility`) stays exactly as today.
  - `dice-rolling`'s existing `rollDie(sides, count = 1): number[]` contract must not change — other callers (`InitiativeEntry`, `lib/utils/combat.ts`) depend on its current single-die-type, flat-array shape.
  - This repo has no existing React portal usage anywhere in `lib/components` — this is the first component to render outside its parent's DOM subtree via `createPortal`.
- Assumptions:
  - "Float outside the existing chat frame" means the pop-out is portaled to `document.body` (or a shared overlay root) and `fixed`-positioned relative to the viewport/trigger, not constrained by the chat dock's own layout/overflow.
  - The per-die `{sides, value}` result shape is needed now (even though animation itself is deferred) so the staging/roll code path doesn't need a second breaking rework when animation is added later.
  - Cross-viewer animated replay of a mixed roll (other campaign members watching the dice land) is a separate, later change — see Non-Goals.
- Edge cases considered:
  - Empty pool: "Roll" must be disabled/no-op with nothing staged.
  - Removing all staged dice after adding some: pool returns to empty state, not an error state.
  - No active session (`activeSessionId === null`): pop-out trigger/contents must be disabled the same way `RollEntryStrip` is disabled today, with the same "No active session" messaging.
  - Same 409 race today's strip handles (session ends between staging and commit) must still surface an inline error without silently dropping the roll or double-posting.
  - Large pools (e.g. 20 dice of one size): no artificial cap is introduced by this change; the existing `rollDie` per-call behavior and `SUPPORTED_SIDES` validation in `lib/utils/dice.ts` already bound individual die-size validity.

## Scope

### In Scope

- A new multi-group dice-roll operation in `lib/utils/dice.ts` (additive, alongside unchanged `rollDie`) that accepts a mixed set of `{sides, count}` groups and returns `{sides, value}[]` per individual die.
- A staging-pool UI: add/remove dice of any supported size to a pool, edit a shared modifier, then commit with one "Roll" action. Replaces the always-visible, click-to-roll `RollEntryStrip`.
- A floating pop-out, rendered via a new React portal, triggered by a d20 icon anchored at the bottom of the chat dock — the first portal-based component in this codebase.
- Flattening the staged `{sides, value}[]` + modifier into the existing formula-string/`rolls: number[]`/`total` POST shape at commit time (client-side only), so the existing `/api/campaigns/[id]/rolls` endpoint and `CampaignRoll` type require zero changes.
- Updated delta specs for the `roll-share-ui` and `dice-rolling` capabilities.

### Out of Scope

- Animating individual dice (visually) as they roll — explicitly deferred; this change only produces the `{sides, value}[]` data groundwork for it.
- Persisting/broadcasting per-die breakdown to other campaign members for cross-viewer animated replay — `CampaignRoll`, the rolls API, and `RollFeedItem`'s rendering (`lib/components/CampaignChat.tsx` ~L91-109) are unchanged; the feed still shows the flat `formula → [rolls] = total` breakdown it shows today.
- Any change to `campaign-chat-dock`'s own dock shell (collapse/pin/drag/resize state machine) — the dice pop-out is a sibling floating panel with its own independent open/close state, not a mode of the chat dock.
- Changing `rollDie`'s existing signature/contract or any of its current callers (`InitiativeEntry`, `lib/utils/combat.ts`).

## What Changes

- `lib/utils/dice.ts`: add a new multi-group roll operation (name TBD in design, e.g. `rollDicePool`) returning `{ sides: number; value: number }[]`; `rollDie` is untouched.
- `lib/components/CampaignChat.tsx`: remove the always-visible `RollEntryStrip`; add a d20 trigger button anchored at the dock's bottom, plus a new pop-out component (staging pool + modifier + visibility + commit) rendered through a portal.
- New portal-rendering pattern introduced for the pop-out (first use of `createPortal` in `lib/components`).
- `openspec/specs/roll-share-ui/spec.md`: MODIFIED — "Roll-entry strip in the chat dock" requirement's immediate-click scenarios are superseded by staging + explicit-commit scenarios; ADDED requirements for the staging pool and the floating pop-out. "Roll feed item rendering" requirement is explicitly left unchanged.
- `openspec/specs/dice-rolling/spec.md`: ADDED requirement for the new multi-group roll operation; existing `rollDie` requirements are explicitly left unchanged.

## Risks

- Risk: First-ever portal usage in this codebase could interact awkwardly with existing global styles/z-index stacking (the chat dock pill/drawer already uses `fixed` positioning with `z-40`).
  - Impact: Pop-out could render behind the chat dock or other fixed UI, or clip on small viewports.
  - Mitigation: Pick a portal root/z-index explicitly higher than the chat dock's, and verify visually on both desktop and narrow viewports before merge; add this as an explicit test/verification task.
- Risk: Changing the interaction model from immediate-click to stage-then-commit is a behavior change for existing muscle memory (today, clicking `d20` rolls instantly).
  - Impact: Users accustomed to one-click rolls may find the extra "Roll" commit step slower for the common single-die case.
  - Mitigation: This was an explicit, deliberate decision from the requester (see Non-Goals/Problem Space) — no mitigation beyond clear UI affordance (an obviously-enabled "Roll" button showing the current pool) is planned in this change.
- Risk: Flattening `{sides, value}[]` to `rolls: number[]` at commit time discards per-die grouping before it reaches the server, meaning the groundwork laid now is inert until the deferred animation/broadcast work lands.
  - Impact: None to current users; a documented deferred-work dependency for whoever picks up the animation feature later.
  - Mitigation: Explicitly noted in Non-Goals and cross-referenced in the `dice-rolling` delta spec so the next change can find the `{sides, value}[]` shape it needs already in place.

## Open Questions

- Question: What is the exact staged-pool UI shape — a running list of individual staged dice with per-line remove buttons, or grouped counters per die size (e.g. a stepper next to each of d4–d20 showing "×2")?
  - Needed from: requester (design-level preference; either satisfies the "stage before roll" requirement)
  - Blocker for apply: no — design.md will propose grouped per-size counters (matches the existing die-button row layout most closely and needs no per-line list virtualization) as the default; flagged for confirmation before/at apply.
- Question: Exact placement, sizing, and open/close animation of the pop-out beyond "d20 icon at the bottom of the chat panel, floating outside the frame."
  - Needed from: requester (visual/UX preference)
  - Blocker for apply: no — design.md will propose anchoring the pop-out above-right of the trigger icon (same corner convention as the existing chat dock pill) with a simple fade/scale transition; flagged for confirmation before/at apply.

## Non-Goals

- Dice animation (visual roll/tumble of individual dice).
- Cross-viewer broadcast/replay of per-die breakdown to other campaign members.
- Any change to the `rolls-api` or `CampaignRoll` schema.
- Any change to `campaign-chat-dock`'s own shell/state machine.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

## MODIFIED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Source location for CampaignChat submodules

The system SHALL organize the source implementing the `CampaignChat` dock shell, feed, composer, and dock-state logic under `lib/components/CampaignChat/` as `index.tsx` (coordinator), `ChatFeed.tsx`, `Composer.tsx`, `useDockState.ts`, `useChatFeed.ts`, `useHistoryPagination.ts`, `useComposer.ts`, `useMembers.ts`, and `DragHandle.tsx`, in
place of the single `lib/components/CampaignChat.tsx` file, with **no dice-pool selection,
roll-submission, or dice-pool-wiring hook** remaining in any of these files (the
`useCampaignDice.ts` hook that previously lived here is deleted; all dice-pool and
roll-submission logic lives in `lib/dice/` and is consumed only by `GlobalDiceFab` — see
`dice-pool-shared-state` and `global-dice-fab` capabilities). The public import
`import { CampaignChat } from '@/lib/components/CampaignChat'` SHALL continue to resolve
unchanged.

#### Scenario: Public import path is unaffected by the removal

- **Given** `lib/components/CampaignChat/useCampaignDice.ts` has been deleted
- **When** any existing file imports `{ CampaignChat }` from `'@/lib/components/CampaignChat'`
- **Then** the import resolves to the same exported component with no change to the import
  statement required

#### Scenario: No dice-pool, roll-submission, or dice-wiring code remains in the CampaignChat submodules

- **Given** the removal is complete
- **When** every file under `lib/components/CampaignChat/` is inspected
- **Then** none of them defines dice-pool selection state, a POST call to
  `/api/campaigns/[id]/rolls`, an import of `useDicePoolState` / `useRollSubmission`, or a
  render of `DicePoolPanel` / `DiceTriggerButton`
- **And** `lib/components/CampaignChat/useCampaignDice.ts` does not exist

#### Scenario: Dock/drawer behavior is unchanged after the removal

- **Given** the `CampaignChat` dock shell (collapse/expand, pin, keyboard accessibility,
  drag-resize, persisted size) is exercised
- **When** `npm run test:unit` is executed against the decomposed files
- **Then** all existing dock-shell test files under `tests/unit/components/CampaignChat/`
  pass without modification to their original assertions

#### Scenario: No file in the split exceeds the project's readability/size guidance

- **Given** the removal is complete
- **When** each file under `lib/components/CampaignChat/` is measured
- **Then** none of them trips the Verity quality gate's size threshold (`index.tsx` is
  smaller than before the removal)

## Traceability

- Proposal element "Delete `lib/components/CampaignChat/useCampaignDice.ts`" → Requirement:
  MODIFIED ADDED Source location for CampaignChat submodules
- Design decision 5 (`campaign-chat-dock` "Source location" requirement drops
  `useCampaignDice.ts`) → Requirement: MODIFIED ADDED Source location for CampaignChat
  submodules
- Requirement → Task(s): see `openspec/changes/remove-chat-docked-dice/tasks.md`
  ("Delete dead source" task group)

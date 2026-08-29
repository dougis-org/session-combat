## ADDED Requirements

### Requirement: ADDED Source location for CampaignChat submodules

The source implementing the `CampaignChat` dock shell, feed, composer, and dock-state logic SHALL be organized under `lib/components/CampaignChat/` as `index.tsx` (coordinator), `ChatFeed.tsx`, `Composer.tsx`, `useDockState.ts`, `useChatFeed.ts`, `useHistoryPagination.ts`, `useComposer.ts`, `useMembers.ts`, `useCampaignDice.ts`, and `DragHandle.tsx`, in place of the single `lib/components/CampaignChat.tsx` file, with no dice-pool selection or roll-submission logic remaining in any of these files (see `dice-pool-shared-state` capability for where that logic now lives). The public import `import { CampaignChat } from '@/lib/components/CampaignChat'` SHALL continue to resolve unchanged.

#### Scenario: Public import path is unaffected by the split

- **Given** `lib/components/CampaignChat.tsx` has been decomposed into
  `lib/components/CampaignChat/`
- **When** any existing file imports `{ CampaignChat }` from
  `'@/lib/components/CampaignChat'`
- **Then** the import resolves to the same exported component with no change to the import
  statement required

#### Scenario: No file in the split exceeds the project's readability/size guidance

- **Given** the split is complete
- **When** each file under `lib/components/CampaignChat/` is measured
- **Then** none of them trips the Verity quality gate's size threshold that originally
  flagged the single 1054-line file

#### Scenario: Dock/drawer behavior is unchanged after the split

- **Given** the `CampaignChat` dock shell (collapse/expand, pin, keyboard accessibility,
  drag-resize, persisted size) is exercised
- **When** `npm run test:unit` is executed against the decomposed files
- **Then** all existing dock-shell test files under `tests/unit/components/CampaignChat/`
  pass without modification to their original assertions

#### Scenario: No dice-pool or roll-submission code remains in the CampaignChat submodules

- **Given** the split is complete
- **When** every file under `lib/components/CampaignChat/` is inspected
- **Then** none of them defines dice-pool selection state or a POST call to
  `/api/campaigns/[id]/rolls` — both live exclusively in `lib/dice/` (see
  `dice-pool-shared-state` capability) and are consumed by `index.tsx` via the shared hooks

---

## Traceability

- Proposal "Scope" (CampaignChat.tsx split into submodules) → Requirements: ADDED Source
  location for CampaignChat submodules
- Design decision 4 (submodule layout) → Requirements: ADDED Source location for
  CampaignChat submodules
- Mirrors the existing "MODIFIED Test suite location for CampaignChat dock shell"
  requirement's pattern (companion source-file split following the already-completed
  test-file split from issue #518)
- Requirement → Task(s): see `tasks.md`, "Split CampaignChat.tsx" task group

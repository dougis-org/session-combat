## Preparation

- [x] Ensure local environment is up-to-date and all dependencies are installed.
- [x] Run the existing test suite to ensure a clean baseline.

## Implementation Tasks

### 1. Refactor Application Routes and Scripts

- [x] `app/api/campaigns/route.ts`: Replace `storage.loadCampaigns`, `storage.saveCampaign`, `storage.deleteCampaign` with `campaignRepo` equivalents.
- [x] `app/api/campaigns/[id]/route.ts`: Replace `storage.saveCampaign`, `storage.deleteCampaign`.
- [x] `app/api/campaigns/[id]/sessions/active/route.ts`: Replace `storage.claimActiveCampaignSession`, `storage.setActiveCampaignSession`.
- [x] `app/api/campaigns/global/[id]/copy/route.ts`: Replace `storage.saveCampaign`, `storage.deleteCampaign`.
- [x] `app/api/me/invitations/route.ts`: Replace `storage.getCampaignsByIds`.
- [x] `lib/scripts/backfillCampaignEncounters.ts`: Replace `storage.saveCampaign`.
- [x] `lib/utils/campaign.ts`: Replace `storage.loadCampaignByIdAny`.

### 2. Refactor Tests

- [x] `tests/unit/api/campaigns/[id]/encounters/[encounterId]/route.test.ts`: Update mock to `campaignRepo.loadCampaignByIdAny`.
- [x] `tests/unit/api/campaigns/[id]/encounters/route.test.ts`: Update mock to `campaignRepo.loadCampaignByIdAny`.
- [x] `tests/unit/api/me/invitations.test.ts`: Update mock to `campaignRepo.getCampaignsByIds`.
- [x] `tests/unit/storage/campaignMembers.test.ts`: Update mocks and references for `loadCampaignByIdAny`.
- [x] `tests/unit/storage/campaigns.members.test.ts`: Update references to `listCampaignsForMember`.
- [x] `tests/unit/storage/campaigns.test.ts`: Update references to `loadCampaigns` and `loadCampaignById`.
- [x] `tests/integration/campaigns.members.integration.test.ts`: Update references to `listCampaignsForMember`.
- [x] Update any other test files that surface during the migration.

## Review & Validation

- [x] Run full test suite (`npm test`).
- [x] Perform a global search (`grep`) to ensure no usages of `storage.loadCampaigns`, `storage.saveCampaign`, etc. remain.
- [ ] Address any PR review feedback.
- [ ] Merge the PR.

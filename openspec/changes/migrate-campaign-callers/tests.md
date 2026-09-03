---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `migrate-campaign-callers` change. This is a pure refactor, so no *new* tests are written. Instead, existing tests must be updated to mock the correct narrow dependencies, and we must ensure all existing assertions still pass.

## Testing Steps

For each task in `tasks.md`:

1.  **Refactor Mocks:** Update `jest.mock("@/lib/storage")` blocks to include `jest.mock("@/lib/storage/campaignRepo")`.
2.  **Refactor Code:** Update the implementation file to import and use the narrow repo.
3.  **Validate:** Ensure the test still passes exactly as it did before.

## Test Cases

- [ ] Route tests pass with narrow repo mocks for `app/api/campaigns/route.ts` and `app/api/campaigns/[id]/route.ts`.
- [ ] Active session route tests pass for `app/api/campaigns/[id]/sessions/active/route.ts`.
- [ ] Global campaign copy route tests pass for `app/api/campaigns/global/[id]/copy/route.ts`.
- [ ] Invitations API tests pass with updated `getCampaignsByIds` mock.
- [ ] Encounter API tests pass with updated `loadCampaignByIdAny` mock.
- [ ] Integration tests pass utilizing the correct storage facade or narrow repo where applicable.

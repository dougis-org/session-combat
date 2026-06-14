---
name: tests
description: Tests for fix-campaign-catalog-copy
---

# Tests

## Overview

Tests for the `fix-campaign-catalog-copy` change. Follow strict TDD: write the failing test first, then implement the minimum code to make it pass, then refactor.

All integration tests live under `tests/integration/`. Unit tests for the copy route rollback behavior live under `tests/unit/`.

## Test Cases

### Task 1 — Copy route: member record creation with rollback

**Integration test** — `tests/integration/api/campaigns-catalog-copy.test.ts` (new file)

Follow pattern established in `tests/integration/api/sessions.test.ts`: use `registerTestUser` for auth, `node-fetch` for HTTP, and `MongoClient` directly for DB assertions.

Setup: create a global campaign template via `POST /api/campaigns/global` (requires admin user — use `makeUserAdmin` helper).

- [ ] **Scenario: Successful copy — 201 and campaign accessible**
  - TDD: Write test first (it will fail: copy returns 201 but GET /api/campaigns/[id] returns 404 until fix is applied)
  - Test: `POST /api/campaigns/global/<templateId>/copy` as authenticated user → assert status 201 → assert response body has `id` field → `GET /api/campaigns/<id>` → assert status 200 → assert response `name` matches template name
  - Spec: `specs/campaign-catalog-copy/spec.md` — Scenario: Successful copy

- [ ] **Scenario: Member record persisted in DB**
  - TDD: Write test first (it will fail: no member record exists until fix is applied)
  - Test: After successful copy, query `campaignMembers` collection directly via `MongoClient` → assert document exists with `{ campaignId: <newId>, userId: <userId>, role: 'dm', status: 'active' }`
  - Spec: `specs/campaign-catalog-copy/spec.md` — Scenario: Successful copy

- [ ] **Scenario: Template not found returns 404**
  - TDD: Write test (should pass already — existing behavior)
  - Test: `POST /api/campaigns/global/nonexistent-id/copy` → assert status 404 → query `campaigns` collection → assert no document with that id
  - Spec: `specs/campaign-catalog-copy/spec.md` — Scenario: Template not found

**Unit test** — `tests/unit/api/campaigns/global/copy.test.ts` (new file)

Mock `storage.saveCampaign`, `storage.addMember`, `storage.deleteCampaign`, `storage.loadGlobalCampaignTemplateById`.

- [ ] **Scenario: Member insert failure triggers rollback**
  - TDD: Write test first (will fail: currently no rollback call exists)
  - Test: mock `addMember` to throw → call copy handler → assert `deleteCampaign` was called with the campaign id → assert response status 500
  - Spec: `specs/campaign-catalog-copy/spec.md` — Scenario: Member insert failure — campaign rolled back

- [ ] **Scenario: Campaign save failure — no rollback needed**
  - TDD: Write test (should pass once rollback logic is in place — `deleteCampaign` must NOT be called if `saveCampaign` fails)
  - Test: mock `saveCampaign` to throw → call copy handler → assert `deleteCampaign` NOT called → assert status 500

### Task 2 — Alphabetical sort of global templates

**Unit test** — `tests/unit/lib/storage.test.ts` (extend existing file) or a dedicated `campaignTemplates` test

- [ ] **Scenario: Templates returned in alphabetical order**
  - TDD: Write test first (will fail: current query has no sort)
  - Test: seed DB (or mock) with templates named `["Rime", "Curse", "Baldur's Gate"]` → call `storage.loadGlobalCampaignTemplates()` → assert returned array is `["Baldur's Gate", "Curse", "Rime"]`
  - Spec: `specs/campaign-catalog/spec.md` — Scenario: List returned in alphabetical order

- [ ] **Scenario: Empty catalog returns empty array**
  - TDD: Write test (should pass already)
  - Test: no templates in DB → call `loadGlobalCampaignTemplates()` → assert `[]`
  - Spec: `specs/campaign-catalog/spec.md` — Scenario: Empty catalog

### Task 3 — Search input filters catalog UI

**Component test** — `tests/unit/components/CampaignCatalogSearch.test.tsx` (new file) or extend existing campaign page tests

Use React Testing Library. Mock `fetch` to return a fixed list of templates.

- [ ] **Scenario: Search filters by name (case-insensitive)**
  - TDD: Write test first (will fail: no search input exists yet)
  - Test: render `CampaignsContent` (or extract catalog section) with mocked templates → type `"rim"` into search input → assert only "Rime of the Frostmaiden" card is visible → assert "Curse of Strahd" is not rendered
  - Spec: `specs/campaign-catalog/spec.md` — Scenario: Search filters by name

- [ ] **Scenario: Empty search shows all templates**
  - TDD: Write test (will pass once input exists and default is empty)
  - Test: render with mocked templates → assert all template cards rendered → assert search input value is `""`
  - Spec: `specs/campaign-catalog/spec.md` — Scenario: Empty search shows all templates

- [ ] **Scenario: No match shows empty-state message**
  - TDD: Write test first (will fail: no empty-state message exists yet)
  - Test: render with mocked templates → type `"zzznomatch"` → assert template cards not rendered → assert text "No templates match your search." is visible
  - Spec: `specs/campaign-catalog/spec.md` — Scenario: Search with no matches shows empty state

- [ ] **Scenario: Search does not trigger a network request**
  - TDD: Write test (should pass once client-side filter is implemented)
  - Test: spy on `fetch` → render with pre-loaded templates → type in search input → assert `fetch` not called after initial load
  - Spec: `specs/campaign-catalog/spec.md` — NFAC: Search filtering is synchronous

### Task 4 — Integration test: end-to-end copy flow (primary acceptance test)

Covered by Task 1 integration tests above. The two scenarios "Successful copy — 201 and campaign accessible" and "Member record persisted in DB" together constitute the end-to-end validation required by the user: copying a campaign from the library results in the copy being persisted and accessible.

Cleanup in `afterAll`: delete all campaigns and member records created during the test run using `MongoClient` directly to avoid leaving test data.

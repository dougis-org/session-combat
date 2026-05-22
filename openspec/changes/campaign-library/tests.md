---
name: tests
description: Tests for the campaign-library change
---

# Tests

## Overview

This document outlines the tests for the `campaign-library` change. All work follows a strict TDD workflow: write a failing test first, implement the minimum code to pass it, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — Before any implementation code, write the test. Run it and confirm it fails.
2. **Write code to pass the test** — Implement the minimum to make it green.
3. **Refactor** — Improve structure and quality; confirm tests remain green.

---

## Test Cases

### Task 1 — Types (lib/types.ts)

- [ ] **Type: CampaignChapter accepts minimal fields** — Construct `{ id: 'x', title: 'Intro', order: 0 }` and assert it satisfies `CampaignChapter`
  - Spec: `specs/campaign-model-expansion/spec.md` → "CampaignChapter is well-formed"
- [ ] **Type: CampaignChapter accepts all optional fields** — Construct with all fields including `description`, `levelRange`, `location`; assert no TypeScript error
  - Spec: `specs/campaign-model-expansion/spec.md` → "CampaignChapter with all fields"
- [ ] **Type: Campaign accepts chapters and currentChapterId** — Construct a Campaign with `chapters: [...]` and `currentChapterId`; assert TypeScript compiles cleanly
  - Spec: `specs/campaign-model-expansion/spec.md` → "Campaign with chapter list"
- [ ] **Type: Campaign accepts empty chapters** — Construct a Campaign with `chapters: []` and no `currentChapterId`; assert TypeScript compiles cleanly
  - Spec: `specs/campaign-model-expansion/spec.md` → "Campaign with no chapters"
- [ ] **Type: Campaign rejects currentChapter field** — Attempt to assign `currentChapter: "foo"` to a Campaign; assert TypeScript emits a type error
  - Spec: `specs/campaign-model-expansion/spec.md` → "Campaign save no longer accepts legacy fields"
- [ ] **Type: Campaign rejects currentChapterOrder field** — Attempt to assign `currentChapterOrder: 1`; assert TypeScript emits a type error
  - Spec: `specs/campaign-model-expansion/spec.md` → "Campaign save no longer accepts legacy fields"
- [ ] **Type: Campaign templateId is optional** — Construct Campaign without `templateId`; assert no error. Construct with `templateId: 'abc'`; assert no error.
  - Spec: `specs/campaign-model-expansion/spec.md` → "Manually created campaign has no templateId"

---

### Task 2 — Storage (lib/storage.ts)

Test file: `tests/integration/campaign-templates.integration.test.ts`

- [ ] **Storage: loadGlobalCampaignTemplates returns all global templates** — Seed two CampaignTemplate docs with `userId: GLOBAL_USER_ID`; call `loadGlobalCampaignTemplates()`; assert both returned
  - Spec: `specs/campaign-template-admin/spec.md` → "Load returns all global templates"
- [ ] **Storage: loadGlobalCampaignTemplates returns empty array when none exist** — Call `loadGlobalCampaignTemplates()` on empty collection; assert `[]`
  - Spec: `specs/campaign-template-admin/spec.md` → "Empty catalog returns empty array"
- [ ] **Storage: saveCampaignTemplate persists template** — Call `saveCampaignTemplate(template)`; then `loadGlobalCampaignTemplates()`; assert template is present
  - Spec: `specs/campaign-template-admin/spec.md` → "Save persists a new template"
- [ ] **Storage: deleteCampaignTemplate removes template** — Seed a template; call `deleteCampaignTemplate(id)`; assert no longer in `loadGlobalCampaignTemplates()`
  - Spec: `specs/campaign-template-admin/spec.md` → "Delete removes the template"

---

### Task 3 — GET /api/campaigns/global

Test file: `tests/integration/campaign-global-api.integration.test.ts`

- [ ] **GET: returns 200 with array (no auth)** — Call `GET /api/campaigns/global` with no session; assert `200` and array response
  - Spec: `specs/campaign-template-admin/spec.md` → "Unauthenticated user fetches templates"
- [ ] **GET: returns empty array when no templates** — Empty collection; `GET /api/campaigns/global`; assert `200` with `[]`
  - Spec: `specs/campaign-template-admin/spec.md` → "Empty catalog returns empty array"

### Task 3 — POST /api/campaigns/global

- [ ] **POST: admin creates template returns 201** — Call with admin session and valid body `{ name, moduleName, chapters: [] }`; assert `201`, `isGlobal: true`, `userId: GLOBAL_USER_ID`
  - Spec: `specs/campaign-template-admin/spec.md` → "Admin creates a valid template"
- [ ] **POST: non-admin returns 403** — Call with non-admin session; assert `403`
  - Spec: `specs/campaign-template-admin/spec.md` → "Non-admin is rejected"
- [ ] **POST: missing name returns 400** — Admin session, body without `name`; assert `400`
  - Spec: `specs/campaign-template-admin/spec.md` → "Missing required name field"
- [ ] **POST: empty chapters is valid** — Admin session, `chapters: []`; assert `201`
  - Spec: `specs/campaign-template-admin/spec.md` → "Template with empty chapters array"

### Task 3 — PUT /api/campaigns/global

- [ ] **PUT: admin gets 501** — Admin session; `PUT /api/campaigns/global`; assert `501`
  - Spec: `specs/campaign-template-admin/spec.md` → "Admin calls seed endpoint before implementation"
- [ ] **PUT: non-admin returns 403** — Non-admin session; assert `403`
  - Spec: `specs/campaign-template-admin/spec.md` → "Non-admin seed call is rejected"

---

### Task 4 — DELETE /api/campaigns/global/[id]

- [ ] **DELETE: admin deletes existing template returns 200** — Seed template; admin `DELETE /api/campaigns/global/[id]`; assert `200`; assert template gone from GET
  - Spec: `specs/campaign-template-admin/spec.md` → "Admin deletes an existing template"
- [ ] **DELETE: non-admin returns 403** — Non-admin session; assert `403`
  - Spec: `specs/campaign-template-admin/spec.md` → "Non-admin delete is rejected"
- [ ] **DELETE: non-existent id returns 404** — Admin session, unknown id; assert `404`
  - Spec: `specs/campaign-template-admin/spec.md` → "Delete non-existent template"

---

### Task 5 — POST /api/campaigns/global/[id]/copy

- [ ] **Copy: authenticated user gets 201 with new Campaign** — Seed template with 2 chapters; user session; `POST /api/campaigns/global/[id]/copy`; assert `201`; assert `userId` = user, `templateId` = template id, `chapters.length === 2`, `currentChapterId === chapters[0].id`
  - Spec: `specs/campaign-copy/spec.md` → "Authenticated user copies a template"
- [ ] **Copy: unauthenticated returns 401** — No session; assert `401`
  - Spec: `specs/campaign-copy/spec.md` → "Unauthenticated copy attempt is rejected"
- [ ] **Copy: non-existent template returns 404** — Valid session, unknown template id; assert `404`
  - Spec: `specs/campaign-copy/spec.md` → "Copy of non-existent template"
- [ ] **Copy: chapter ids are new UUIDs (deep copy)** — Seed template with 1 chapter; copy; assert resulting campaign's chapter id differs from template's chapter id
  - Spec: `specs/campaign-copy/spec.md` → "Authenticated user copies a template"
- [ ] **Copy: same template can be copied twice** — User copies twice; assert two distinct Campaign docs exist
  - Spec: `specs/campaign-copy/spec.md` → "User copies same template twice"
- [ ] **Copy: empty chapters template returns campaign with empty chapters** — Template `chapters: []`; copy; assert `chapters: []`, `currentChapterId: undefined`
  - Spec: `specs/campaign-copy/spec.md` → "Template with no chapters is copyable"
- [ ] **Copy: userId comes from session, not request body** — User session; assert resulting `userId` matches session user id regardless of any body content
  - Spec: `specs/campaign-copy/spec.md` → "User cannot copy into another user's account"

---

### Task 6 — CampaignEditor

Test file: `tests/unit/components/CampaignEditor.test.tsx`

- [ ] **Editor: does not render currentChapter input** — Render `CampaignEditor` with a Campaign; assert no element with label "Current Chapter" is present
  - Spec: `specs/campaign-catalog-ui/spec.md` → "Legacy fields are absent from the editor form"
- [ ] **Editor: does not render currentChapterOrder input** — Same render; assert no "Chapter Order" input present
  - Spec: `specs/campaign-catalog-ui/spec.md` → "Legacy fields are absent from the editor form"
- [ ] **Editor: renders chapter list when chapters present** — Render with a Campaign that has 3 chapters; assert all 3 chapter titles visible
  - Spec: `specs/campaign-catalog-ui/spec.md` → "Copied campaign shows chapter list in editor"
- [ ] **Editor: save with no chapters succeeds** — Render with `chapters: []`; click Save; assert `onSave` called with `chapters: []`
  - Spec: `specs/campaign-catalog-ui/spec.md` → "Create campaign with no chapters"

---

### Task 7 — Campaign Catalog UI

Test file: `tests/unit/components/CampaignsPage.test.tsx`

- [ ] **Dashboard: renders Campaign Catalog section** — Mock `GET /api/campaigns/global` returning 2 templates; render `CampaignsContent`; assert "Campaign Catalog" heading present
  - Spec: `specs/campaign-catalog-ui/spec.md` → "Catalog section renders below user campaigns"
- [ ] **Dashboard: catalog appears after user campaigns** — Assert user campaigns section precedes catalog section in DOM order
  - Spec: `specs/campaign-catalog-ui/spec.md` → "Catalog section renders below user campaigns"
- [ ] **Dashboard: each template shows name, module, chapter count, Copy button** — Mock 1 template with 4 chapters; assert name, moduleName, "4 chapters" text, and Copy button all present
  - Spec: `specs/campaign-catalog-ui/spec.md` → "Catalog shows available templates"
- [ ] **Dashboard: empty catalog shows empty state message** — Mock empty template array; assert empty-state message rendered
  - Spec: `specs/campaign-catalog-ui/spec.md` → "Empty catalog renders gracefully"
- [ ] **Dashboard: Copy button calls copy API and refreshes campaigns** — Mock copy endpoint returning new Campaign; click Copy; assert POST made to correct URL; assert new campaign appears in list
  - Spec: `specs/campaign-catalog-ui/spec.md` → "User clicks Copy"
- [ ] **Dashboard: Copy button shows loading during request** — Simulate slow POST; assert button is disabled during in-flight request
  - Spec: `specs/campaign-catalog-ui/spec.md` → "Copy in progress shows loading state"
- [ ] **Dashboard: Copy failure shows inline error** — Mock POST returning 500; click Copy; assert error message rendered near template
  - Spec: `specs/campaign-catalog-ui/spec.md` → "Copy failure shows error"
- [ ] **Dashboard: catalog fetch failure does not crash page** — Mock `GET /api/campaigns/global` returning error; assert user campaigns still render; assert error state shown in catalog section
  - Spec: `specs/campaign-catalog-ui/spec.md` → "Catalog fetch failure does not crash the dashboard"

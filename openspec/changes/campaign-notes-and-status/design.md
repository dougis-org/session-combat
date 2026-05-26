## Context

- **Relevant architecture:** Next.js 14 app router; raw MongoDB driver via `lib/storage.ts` (no Mongoose); plain TypeScript interfaces in `lib/types.ts`; API routes protected by `requireAuth` / `withAuthAndParams` middleware; Tailwind CSS for styling.
- **Dependencies:** #182, #184, #186 all closed. `Campaign` type, storage upsert, and API routes are live. Active Campaign Dashboard and Prompt Builder are live.
- **Interfaces/contracts touched:**
  - `Campaign` TypeScript interface (`lib/types.ts:541`)
  - `POST /api/campaigns` (`app/api/campaigns/route.ts`)
  - `PATCH /api/campaigns/[id]` (`app/api/campaigns/[id]/route.ts`)
  - `POST /api/campaigns/global/[id]/copy` (`app/api/campaigns/global/[id]/copy/route.ts`)
  - `CampaignEditor` component (`app/campaigns/CampaignEditor.tsx`)
  - Campaigns page (`app/campaigns/page.tsx`)

## Goals / Non-Goals

### Goals

- Replace `active: boolean` with `status` enum; maintain dashboard filter semantics
- Add `notes: string` with server-side length enforcement
- Update all UI, API, and test touch points consistently
- Keep the change self-contained: no new abstractions, no new components

### Non-Goals

- Prompt Builder notes injection (tracked in #231)
- Database migration script
- Status transition enforcement or confirmation dialogs

## Decisions

### Decision 1: Remove `active`, add `status` — no coexistence period

- **Chosen:** Delete `active` from the type and every touch point in one change. No deprecation shim.
- **Alternatives considered:** Keep `active` as a computed getter aliasing `status === 'active'`. Rejected — would perpetuate the ambiguous field and add complexity.
- **Rationale:** Beta project, minimal live data. Clean cut is lower risk than maintaining both.
- **Trade-offs:** Any MongoDB document that was never re-saved after this deploy will lack `status`. Mitigated by defaulting `status` to `'active'` on read when the field is absent (see Decision 3).

### Decision 2: Notes length — inline validation, no helper

- **Chosen:** Inline `if (notes.length > 10000) return 400` in the PATCH handler. No utility function.
- **Alternatives considered:** Shared validator utility. Rejected — only one call site; abstraction adds no value.
- **Rationale:** YAGNI. Consistent with how the rest of the PATCH handler validates fields.
- **Trade-offs:** If a second notes field is added elsewhere, the limit must be duplicated. Acceptable for now.

### Decision 3: Backwards-compatible read for documents lacking `status`

- **Chosen:** In the PATCH handler, when loading the existing campaign, treat a missing `status` as `'active'` before applying the update. The GET route returns the document as-is (MongoDB will return `undefined` for missing fields; callers already default in UI).
- **Alternatives considered:** Accept data inconsistency and let the UI handle `undefined`. Acceptable for Beta but slightly risky for the dashboard filter.
- **Rationale:** One-line guard (`campaign.status ?? 'active'`) prevents silent dashboard drops with zero schema migration cost.
- **Trade-offs:** None meaningful.

### Decision 4: Status badge — inline Tailwind span, no component

- **Chosen:** `<span className="px-2 py-1 bg-X text-xs rounded text-white">{status}</span>` inline at point of use.
- **Alternatives considered:** Shared `StatusBadge` component. Rejected — no existing badge component; creating one for a single use site is premature.
- **Rationale:** Matches the existing codebase pattern (monsters Global badge, spells badge, sessions buttons).
- **Trade-offs:** Colour map duplicated if badges appear in multiple places. Currently only two: campaign list row and dashboard card header.

### Decision 5: Campaign copy sets `status: 'planning'`

- **Chosen:** The global campaign copy route replaces `active: false` with `status: 'planning'`.
- **Rationale:** A copy of a campaign template is the start of a new campaign run — "planning" is the correct initial state. Matches the migration rule for `active: false`.
- **Trade-offs:** None.

## Proposal to Design Mapping

- Proposal element: Remove `active: boolean`, add `status` enum
  - Design decision: Decision 1 (clean cut, no coexistence)
  - Validation approach: TypeScript compile error if any file still references `campaign.active`; integration test verifies `active` absent from API response

- Proposal element: Add `notes: string`, max 10k chars
  - Design decision: Decision 2 (inline validation)
  - Validation approach: Unit test — PATCH with 10,001-char notes returns 400; PATCH with 10,000-char notes returns 200

- Proposal element: Backwards compat for existing documents
  - Design decision: Decision 3 (`status ?? 'active'` on read)
  - Validation approach: Unit test — storage returns campaign with no `status` field; PATCH handler treats it as `'active'`

- Proposal element: Status badge rendering
  - Design decision: Decision 4 (inline Tailwind span)
  - Validation approach: Unit test — each status value renders correct `bg-*` class

- Proposal element: Campaign copy status
  - Design decision: Decision 5 (`status: 'planning'` on copy)
  - Validation approach: Integration test — POST copy returns `status: 'planning'`

## Functional Requirements Mapping

- **Requirement:** `status` field accepts only `planning | active | on-hold | completed`
  - Design element: PATCH handler enum validation
  - Acceptance criteria: invalid value → 400; valid value → 200 with updated document
  - Testability: unit test against PATCH handler

- **Requirement:** `notes` field capped at 10,000 chars
  - Design element: inline length check in PATCH handler
  - Acceptance criteria: 10,001 chars → 400; 10,000 chars → 200
  - Testability: unit test against PATCH handler

- **Requirement:** Dashboard shows only `status === 'active'` campaigns
  - Design element: `campaigns.filter(c => c.status === 'active')` in `page.tsx`
  - Acceptance criteria: campaign with `status: 'planning'` does not appear in dashboard section
  - Testability: unit test — campaigns-dashboard.test.tsx

- **Requirement:** Status badge renders correct colour per status value
  - Design element: inline span with colour map
  - Acceptance criteria: each of the four statuses renders its designated `bg-*` class
  - Testability: unit test — CampaignsPage.test.tsx

- **Requirement:** DM notes snippet appears in dashboard card when non-empty
  - Design element: conditional render in Active Campaign section of `page.tsx`
  - Acceptance criteria: campaign with empty notes → no notes card; non-empty → truncated snippet shown
  - Testability: unit test — campaigns-dashboard.test.tsx

## Non-Functional Requirements Mapping

- **Requirement category:** Security
  - Requirement: Notes content not executable; stored as plain string
  - Design element: `notes.trim().slice(0, 10000)` — plain string, no HTML processing
  - Testability: Code review; no XSS vector introduced

- **Requirement category:** Reliability
  - Requirement: Existing campaigns without `status` field continue to function
  - Design element: Decision 3 — `status ?? 'active'` guard
  - Testability: Unit test with fixture missing `status` field

## Risks / Trade-offs

- Risk: Grep misses a `campaign.active` reference
  - Impact: Runtime undefined access; TypeScript may not catch if field was `any`-typed in a test fixture
  - Mitigation: Post-implementation grep across whole codebase for `\.active` in campaign context; TypeScript strict mode will catch most cases at compile time

- Risk: Notes textarea encourages very large inputs client-side with no client-side feedback before submit
  - Impact: Poor UX — user writes a long note, hits save, gets a 400
  - Mitigation: Add `maxLength={10000}` on the textarea element and a character counter. Included in implementation scope.

## Rollback / Mitigation

- **Rollback trigger:** API returning 500s on campaign PATCH; dashboard filter broken; TypeScript build failure
- **Rollback steps:** Revert the PR. No data migration was run, so MongoDB documents are unaffected.
- **Data migration considerations:** None — new fields default gracefully; removed field is absent from documents but not read after rollback.
- **Verification after rollback:** Campaign list loads, active checkbox appears, dashboard shows previously-active campaigns.

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix the failing check before requesting re-review.
- **If security checks fail:** Do not merge. Triage immediately — this change touches API validation.
- **If required reviews are blocked/stale:** Re-request after 24 hours; escalate to repo owner after 48 hours.
- **Escalation path:** GitHub issue #189 thread.

## Open Questions

No open questions. All design decisions resolved during explore session.

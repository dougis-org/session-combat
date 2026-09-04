## Context

- Relevant architecture:
  - Next.js App Router. `/monsters` is `app/monsters/page.tsx` (client component
    wrapped in `ProtectedRoute`), which fetches `/api/monsters` and renders
    `MonsterTemplateCard` / `MonsterTemplateEditor`. Admin status comes from
    `/api/admin/check` style call already used (`checkAdminStatus`).
  - Bulk import today: `app/monsters/import/page.tsx` → `POST /api/monsters/upload`
    (`withAuth`) → `validateMonsterUploadDocument` + `transformMonsterData`
    (`lib/validation/monsterUpload.ts`) → `storage.saveMonsterTemplate` per row.
  - Storage: `lib/storage/monsterTemplateRepo.ts` over MongoDB via
    `getDatabase()` + `runStorageOp` wrapper (telemetry seam). `saveMonsterTemplate`
    is an idempotent upsert keyed by `buildEntityQuery`. `monsterExistsByNameAndSource`
    / `findMonsterByNameAndSource` exist but are unused.
  - Global vs personal: `userId = GLOBAL_USER_ID` (`'GLOBAL'`, `lib/constants.ts`)
    and `isGlobal = true` for global; `app/monsters/page.tsx` already gates global
    creation on `isAdmin`.
  - No MongoDB transactions anywhere; deployment does not support them.
- Dependencies:
  - Add `zod` (if not already present) as the schema/validation library.
  - No new infra. Reuses `withAuth`, `getDatabase`, `runStorageOp`,
    `normalizeAlignment`, `filterToDamageTypes`, `GLOBAL_USER_ID`.
- Interfaces/contracts touched:
  - `lib/validation/monsterUpload.ts` public API (`validateMonsterData`,
    `validateMonsterUploadDocument`, `transformMonsterData`, `RawMonsterData`,
    `MonsterUploadDocument`, `ValidationResult`).
  - `POST /api/monsters/upload` request/response shape.
  - New `POST /api/monsters/upload/validate` route.
  - New `GET /api/monsters/import-schema` (structure document) route.
  - `lib/storage/monsterTemplateRepo.ts` — new bulk + scoped-dedupe functions.
  - `app/monsters/page.tsx` — new button + modal.
  - `app/monsters/import/page.tsx` — remove file-upload panel.

## Goals / Non-Goals

### Goals

- Any authenticated user can bulk-import monsters from a JSON file via a modal on
  `/monsters`, with a downloadable structure document, a pre-commit preview
  (count + names), and clear errors.
- Admins can send a whole batch to the Global library; enforced server-side.
- Duplicates (name + source, within target scope, including in-file repeats) are
  skipped and reported by name; 0 inserted is a success, not an error.
- "No half import": on any ingestion error, the just-inserted rows are removed
  (best-effort compensation) and the user is told the load was reverted.
- One schema source of truth (Zod) drives validation, transform, and the
  structure document.

### Non-Goals

- Atomic / crash-safe rollback (no DB transactions available).
- Upsert / merge on duplicate; per-monster scope; non-JSON formats.
- Changes to single-monster editing or the open5e sync feature (other than
  removing the duplicate file-upload panel from the import page).

## Decisions

### Decision 1: Zod schema as single source of truth

- Chosen: Define `monsterUploadSchema` (array wrapper) and `rawMonsterSchema` in
  `lib/validation/monsterUpload.ts` using Zod. Derive:
  - `validateMonsterUploadDocument(doc)` → runs `.safeParse`, maps
    `ZodError.issues` to the existing `ValidationError { field, message, index }`
    shape (field = `monsters[i].path.to.field`), preserving the current
    `ValidationResult { valid, errors }` contract.
  - `transformMonsterData(raw, { userId, isGlobal })` → operates on the parsed +
    defaulted output, keeping `normalizeAlignment` / `filterToDamageTypes`
    post-processing.
  - `describeMonsterUploadSchema()` → a plain-data field descriptor
    (name, type, required, description, calculated?) used by the structure-doc
    route. "Calculated" fields (e.g. `experiencePoints` derived from CR, ability
    modifiers) are excluded from the uploadable schema entirely, so the doc lists
    exactly what Zod accepts.
- Alternatives considered:
  - Keep hand-rolled validators, add a separate JSON Schema file — rejected:
    three-way drift is the current problem.
  - `@sinclair/typebox` / `ajv` — rejected: Zod is the common choice for this
    stack and gives TS inference for the transform.
- Rationale: Eliminates drift; `z.toJSONSchema` (or a small serializer over the
  descriptor) gives the structure document for free; TS types flow from the
  schema.
- Trade-offs: Rewriting validation risks behavior drift; mitigated by porting the
  existing `monsterUpload` unit tests first (TDD) and keeping signatures stable.
  Adds a dependency.

### Decision 2: Required-field set

- Chosen: Required in `rawMonsterSchema`: `name` (non-empty, trimmed, max 200),
  `size` (enum `VALID_SIZES`), `type` (non-empty), `ac` (int 0–30), `maxHp`
  (int ≥ 1), `speed` (non-empty string), `abilityScores` (all six, int 1–30),
  `challengeRating` (number ≥ 0). `hp` optional, defaults to `maxHp`, must be
  ≤ `maxHp`. All collection/nested fields (`traits`, `actions`, `bonusActions`,
  `reactions`, `lairActions`, `legendaryActions`, `legendaryActionCount`,
  `savingThrows`, `skills`, `senses`, `languages`, damage
  resistances/immunities/vulnerabilities, `conditionImmunities`, `alignment`,
  `acNote`, `description`, `source`) optional.
- Alternatives considered: keep only `name` + `maxHp` required (status quo) —
  rejected, issue says all listed non-calculated fields are required. Make
  `speed`/`hp` required too — deferred to Open Question OQ-1.
- Rationale: Matches the issue's intent that an imported monster is "complete".
- Trade-offs: Rejects sparse/older files; mitigated by the downloadable structure
  document and precise per-field errors. `speed` and separate `hp` are the
  contested items — see OQ-1; if OQ-1 makes `speed` optional, only the schema
  changes, not the design.

### Decision 3: Two routes — validate then ingest, client re-sends the file

- Chosen:
  - `POST /api/monsters/upload/validate` (`withAuth`): body = the parsed file
    (`{ monsters: [...] }` or a bare array — accept both, normalize to
    `{ monsters }`). Returns `200 { valid: true, count, names: string[] }` or
    `400 { valid: false, errors: ValidationError[] }`. No writes. Also returns
    `isAdmin` so the modal can decide whether to show the scope choice
    (authoritative check still happens on ingest).
  - `POST /api/monsters/upload` (`withAuth`): body =
    `{ monsters: [...], scope: 'personal' | 'global' }`. Re-validates the whole
    document (authority). If `scope === 'global'`, require admin → else `403`.
    Then runs the ingestion flow (Decision 4). Returns
    `200 { inserted: string[], skippedDuplicates: string[], reverted: boolean, errors: [...] }`.
  - The client keeps the parsed file in React state between the two calls and
    re-sends it; no server-side session/token.
- Alternatives considered:
  - Single route with a `phase` field — workable but overloads one handler's
    response contract; two routes keep each response shape simple and testable.
  - Server stores validated payload behind a token — rejected: adds TTL state,
    cleanup, and a new failure mode for no real benefit at this size (≤ 5 MB).
- Rationale: Stateless, simple to test, server stays the validation authority.
- Trade-offs: File is validated twice (once per call). Acceptable — validation is
  CPU-cheap and bounded by the 5 MB cap.

### Decision 4: No-transaction ingestion — validate-all → dedupe → bulk insert → compensating delete

- Chosen, in order, inside `POST /api/monsters/upload`:
  1. Re-validate the full document. Any error → `400`, nothing written.
  2. Admin check for `scope === 'global'`. Fail → `403`, nothing written.
  3. In-file dedupe: collapse rows with the same `name`+`source` key, first
     occurrence wins; the rest go straight into `skippedDuplicates`.
  4. DB dedupe: `findExistingMonsterKeys(keys, targetUserId)` — one query
     (`$in` over name, filtered by `userId` = caller id or `GLOBAL_USER_ID`,
     projecting `name`+`source`) → matching rows go into `skippedDuplicates`.
  5. `transformMonsterData` the survivors with `{ userId: targetUserId, isGlobal }`.
     Collect their generated `id`s.
  6. `saveManyMonsterTemplates(templates)` — a single `insertMany(docs, { ordered: false })`
     wrapped in `runStorageOp`.
  7. On any thrown error from step 6: call
     `deleteMonsterTemplatesByIds(generatedIds, targetUserId)` in a `catch`,
     log any ids that fail to delete as `orphanedMonsterIds`, and return
     `500 { reverted: true, errors, orphanedMonsterIds }`.
  8. Success → `200 { inserted: names, skippedDuplicates, reverted: false }`.
- Alternatives considered:
  - Per-row `saveMonsterTemplate` in `Promise.all` with 207 partial success
    (status quo) — rejected: violates "no half import".
  - `insertMany({ ordered: true })` then delete inserted-so-far — same
    compensation need, but stops at first failure; `ordered:false` lets us report
    all failing rows at once. Either is acceptable; chose `ordered:false` for
    fuller error reporting, compensating on the full generated-id set regardless.
- Rationale: Best available "all-or-nothing" without transactions; exhaustive
  up-front validation makes step-6 failures rare (infra/DB only).
- Trade-offs: Not crash-safe — a process death between insert and compensating
  delete leaves orphans. Accepted per proposal; `orphanedMonsterIds` are logged
  and surfaced so support/user can clean up. `insertMany` is not itself atomic,
  so a partial insert that then throws is handled by deleting the whole
  generated-id set (ids not actually inserted just no-op on delete).

### Decision 5: Structure document — JSON Schema + annotated example

- Chosen: `GET /api/monsters/import-schema` returns
  `{ jsonSchema, example, fields: FieldDescriptor[] }` as JSON, generated from
  the Zod schema via `describeMonsterUploadSchema()`. The modal's "Download the
  required JSON structure" link triggers a client-side download of a
  `monster-import-template.json` built from `example` (a one-monster array with
  every field populated with a representative value and required fields marked in
  an adjacent `_README` note is avoided — instead the modal renders the
  `fields` table inline and the download is a clean importable example).
- Alternatives considered: static committed file (drifts); pure Markdown table
  (not importable as a starting point).
- Rationale: Users get both a human-readable field list (required flagged) and a
  ready-to-edit example file; both derive from Zod so they can't drift.
- Trade-offs: Slightly more code than a static file; one extra tiny route.

### Decision 6: Modal component + `/monsters` integration

- Chosen: `app/monsters/ImportMonstersModal.tsx`, a client component with an
  explicit state machine:
  `idle → fileSelected → validating → preview → confirming → done | error`.
  - `idle`: schema link + field table + file picker (`accept=".json,application/json"`,
    5 MB cap client-side).
  - On select: parse JSON client-side (catch → `error`), normalize to `{ monsters }`,
    `POST .../validate`. `400` → `error` with the `ValidationError[]` rendered as
    a `monsters[i].field: message` list.
  - `preview`: "N monsters to import" + `<ul>` of names; if `isAdmin`, a
    fieldset with radio `Personal` (default) / `Global`; `Confirm` + `Cancel`.
  - `confirming`: `POST /api/monsters/upload` with `{ monsters, scope }`.
  - `done`: "Imported N. Skipped M duplicates: …". If `reverted`, `error` copy:
    "Import failed and was rolled back. <errors>. Some monsters may need manual
    cleanup." Close button; on close with any inserts, call the page's
    `loadTemplates()` refresh.
  - Error region: `role="alert"` **and** `data-testid="import-modal-error"`
    (project decisions: monster-import errors must be alerts; use `data-testid`
    when multiple `role="alert"` can render — the page already has its own).
  - Focus trap + `Esc` to close, matching the existing editor-modal pattern in
    `app/monsters/page.tsx` (body overflow hidden, keydown handler).
- `app/monsters/page.tsx`: add `Import Monster(s)` button in the header row / near
  `Add New Monster`, visible to all authenticated users; `useState` for modal
  open; pass `isAdmin` and a refresh callback.
- Alternatives considered: keep it a route (`/monsters/import`) — rejected, issue
  explicitly asks for a modal.
- Trade-offs: Adds a stateful component; covered by E2E.

### Decision 7: Keep the open5e sync page, remove its file-upload panel

- Chosen: `app/monsters/import/page.tsx` keeps the admin "Sync from open5e"
  panel and its `handleSync`; delete the "Upload Monster JSON File" form,
  `handleSubmit`, and now-unused refs/state. Leave the route in place (linked
  from admin tooling).
- Alternatives considered: delete the whole page (open5e sync has no other home);
  move sync into the modal (out of scope, admin-only concern).
- Rationale: One import UI for users; no dead second uploader.
- Trade-offs: The page becomes admin-only in practice; acceptable.

## Proposal to Design Mapping

- Proposal element: `Import Monster(s)` button for all authenticated users
  - Design decision: Decision 6
  - Validation approach: E2E — non-admin sees button, opens modal; Jest render
    test for `app/monsters/page.tsx`.
- Proposal element: Downloadable JSON structure document listing fields + required
  - Design decision: Decision 5
  - Validation approach: Integration test on `GET /api/monsters/import-schema`
    asserting required fields flagged and calculated fields absent; unit test on
    `describeMonsterUploadSchema()`.
- Proposal element: Validate whole file, then preview count + names
  - Design decision: Decision 3 + Decision 6
  - Validation approach: Integration test on `/validate` (valid → count+names,
    invalid → errors); E2E preview step.
- Proposal element: Admin whole-batch Global vs Personal, enforced server-side
  - Design decision: Decision 3 (step 2) + Decision 4 (targetUserId/isGlobal)
  - Validation approach: Integration tests — non-admin + `scope:global` → 403;
    admin + global → rows have `userId=GLOBAL`, `isGlobal=true`. E2E: radio only
    shown for admin.
- Proposal element: Dedupe skip + skipped list shown
  - Design decision: Decision 4 (steps 3–4), Decision 6 (`done` copy)
  - Validation approach: Integration — pre-seed a monster, import a batch
    containing it → `skippedDuplicates` contains its name, not inserted; in-file
    duplicate → reported once. E2E asserts skipped names render.
- Proposal element: No half import / revert on error
  - Design decision: Decision 4 (steps 6–7)
  - Validation approach: Integration — mock `insertMany` / a row to throw →
    assert `deleteMonsterTemplatesByIds` called with generated ids, response
    `reverted:true`, DB has none of the batch.
- Proposal element: Single schema source (Zod)
  - Design decision: Decision 1 + Decision 2
  - Validation approach: Port existing `monsterUpload` unit tests; add Zod cases;
    assert structure doc derives from same schema.
- Proposal element: Remove duplicate file-upload UI
  - Design decision: Decision 7
  - Validation approach: Jest render test — import page no longer renders the
    upload form; open5e panel still present.

## Functional Requirements Mapping

- Requirement: Button on `/monsters` opens the import modal for any authed user.
  - Design element: Decision 6
  - Acceptance criteria reference: specs `monster-import` — "Import entry point".
  - Testability notes: E2E click → modal visible; render test asserts button not
    admin-gated.
- Requirement: Modal exposes a downloadable structure doc + inline required-field
  list.
  - Design element: Decision 5, Decision 6
  - Acceptance criteria reference: specs — "Structure document".
  - Testability notes: Integration test on schema route; E2E asserts link present
    and field table lists required markers.
- Requirement: File must be a JSON array of ≥ 1 monsters; whole file validated
  before preview.
  - Design element: Decision 3, Decision 1
  - Acceptance criteria reference: specs — "File validation".
  - Testability notes: Unit tests for empty array, non-array, bad JSON, missing
    required field; integration `/validate` returns structured errors.
- Requirement: Preview shows total count and all names before any write.
  - Design element: Decision 3, Decision 6
  - Acceptance criteria reference: specs — "Import preview".
  - Testability notes: `/validate` response asserts `count === names.length`;
    E2E reads the rendered list.
- Requirement: Admin-only whole-batch scope choice; server enforces admin for
  global.
  - Design element: Decision 3 (step 2), Decision 4 (step 5)
  - Acceptance criteria reference: specs — "Import scope".
  - Testability notes: Integration 403 for non-admin global; field assertions on
    inserted docs.
- Requirement: Duplicates skipped (name+source, target scope, in-file too) and
  returned by name; 0 inserted is success.
  - Design element: Decision 4 (steps 3–4)
  - Acceptance criteria reference: specs — "Duplicate handling".
  - Testability notes: Integration with seeded duplicate; assert not double
    inserted, name in `skippedDuplicates`, HTTP 200.
- Requirement: On any ingestion error, revert the whole load and show errors.
  - Design element: Decision 4 (steps 6–7)
  - Acceptance criteria reference: specs — "Atomic-ish ingestion".
  - Testability notes: Integration forces a throw; assert compensating delete and
    empty final state; `reverted:true`.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: User never observes a partially-applied import in the UI.
  - Design element: Decision 4 (validate-all first; compensating delete).
  - Acceptance criteria reference: specs — "Atomic-ish ingestion".
  - Testability notes: Integration test asserts DB empty of the batch after a
    forced mid-ingest failure. Documented non-guarantee: process crash between
    insert and compensation (logged `orphanedMonsterIds`).
- Requirement category: security
  - Requirement: Global writes require server-verified admin; scope radio is
    advisory.
  - Design element: Decision 3 step 2, `withAuth` + existing admin check helper.
  - Acceptance criteria reference: specs — "Import scope".
  - Testability notes: Integration — forged `scope:global` from non-admin → 403,
    no writes.
- Requirement category: security
  - Requirement: Monster content comes only from the file; string fields trimmed
    and length-bounded; unknown fields stripped by Zod.
  - Design element: Decision 1 (`.strip()` / no passthrough), Decision 2 bounds.
  - Acceptance criteria reference: specs — "File validation".
  - Testability notes: Unit — extra keys dropped; overlong `name` rejected.
- Requirement category: performance
  - Requirement: Handle the documented max (5 MB file) without excessive DB round
    trips.
  - Design element: Decision 4 — one dedupe query (`$in`), one `insertMany`, one
    compensating `deleteMany`.
  - Acceptance criteria reference: specs — "File validation" (size cap).
  - Testability notes: Integration with ~hundreds of monsters asserts a single
    `insertMany` call (spy count).
- Requirement category: operability
  - Requirement: Storage ops stay on the telemetry seam; orphans are logged.
  - Design element: `saveManyMonsterTemplates` / `deleteMonsterTemplatesByIds`
    wrapped in `runStorageOp`; `console.error` with `orphanedMonsterIds`.
  - Acceptance criteria reference: specs — "Atomic-ish ingestion".
  - Testability notes: Unit — repo functions call `runStorageOp` with correct op
    name/collection.
- Requirement category: accessibility
  - Requirement: Import errors announced; test locator unambiguous.
  - Design element: Decision 6 — `role="alert"` + `data-testid="import-modal-error"`.
  - Acceptance criteria reference: specs — "Import error reporting".
  - Testability notes: E2E asserts alert text via the test id; jest-axe on the
    modal.

## Risks / Trade-offs

- Risk/trade-off: Compensating delete is not crash-safe.
  - Impact: Orphan monsters after a process death mid-ingest.
  - Mitigation: Exhaustive pre-write validation; delete in `catch`; log
    `orphanedMonsterIds`; modal error copy warns about possible manual cleanup;
    `deleteMonsterTemplatesByIds` is idempotent.
- Risk/trade-off: Zod rewrite of `monsterUpload.ts` drifts from current behavior.
  - Impact: Regressions for `/api/monsters/upload` and any shared caller.
  - Mitigation: TDD — port existing unit tests unchanged first; keep exported
    signatures + `ValidationResult` shape; grep importers (`monsterUpload`) and
    update call sites in the same change.
- Risk/trade-off: Newly-required fields reject previously-valid files.
  - Impact: User friction on older exports.
  - Mitigation: Structure document + example download; precise
    `monsters[i].field` errors; OQ-1 confirms the contested `speed`/`hp`.
- Risk/trade-off: Two `role="alert"` regions on the page.
  - Impact: Playwright strict-mode ambiguity / flaky E2E.
  - Mitigation: `data-testid="import-modal-error"` for the modal alert.
- Risk/trade-off: Dedupe key too coarse/fine.
  - Impact: Legit monsters skipped or near-dupes both imported.
  - Mitigation: Scope to target library; report skipped names; 0 inserted = 200.
- Risk/trade-off: Adding `zod` dependency.
  - Impact: Bundle + supply-chain surface.
  - Mitigation: Widely-used, already common in this stack; server-side use
    dominates; check it's not already transitively present first.

## Rollback / Mitigation

- Rollback trigger: Import flow causes data corruption, elevated 500s on
  `/api/monsters/upload`, or the Zod rewrite breaks existing monster
  validation in production.
- Rollback steps:
  1. Revert the change's merge commit (single squash-merge on `main`).
  2. `app/monsters/import/page.tsx` file-upload panel returns with the revert;
     the old `/api/monsters/upload` per-row behavior returns.
  3. Redeploy previous image.
- Data migration considerations: None — no schema/collection changes; monster
  documents written by this feature are ordinary `MonsterTemplate` rows readable
  by the pre-change code. Any monsters imported before rollback simply remain.
- Verification after rollback: `/monsters` loads; `Add New Monster` works;
  `GET /api/monsters` returns lists; existing `monsterUpload` unit + integration
  suites green on the reverted tree; spot-check that pre-change import page
  renders.

## Operational Blocking Policy

- If CI checks fail: Fix forward on the change branch; do not merge. The Verity
  pre-push gate FAILs are fixed, not waived (waive only to relay a human-accepted
  risk per `CLAUDE.md`). Re-run `openspec status` / test suites until green.
- If security checks fail: Treat as blocking. Most likely area: the admin check
  for global scope and Zod input bounds — address directly. Do not disable
  scanners or add path ignores to pass.
- If required reviews are blocked/stale: `main` is a squash-only ruleset with
  `ci-gate` + Codacy required and 0 approvals — auto-merge via `--squash` once
  checks pass. If a human review is requested and stalls > 2 business days, ping
  the requester (Doug) on the PR; do not `--admin` bypass.
- Escalation path and timeout: Requester (Doug) is the decision-maker. If a
  blocker (e.g. OQ-1) is unresolved after 3 business days, park the change branch
  and note status in the PR; do not proceed to `apply`.

## Open Questions

- OQ-1: RESOLVED 2026-09-03 (requester) — Decision 2 default stands: `speed`
  required, `hp` optional and defaults to `maxHp`.
- OQ-2: RESOLVED 2026-09-03 (requester) — Decision 5 default stands: inline field
  table + downloadable example file (no separate formal JSON Schema download
  required, though the route may still expose `jsonSchema` for convenience).
- OQ-3: RESOLVED 2026-09-03 (requester) — Decision 4 default stands: in-file
  duplicate name+source entries are reported as skipped duplicates (first wins),
  not a hard validation error.
- OQ-4: Is leaving `/monsters/import` as an effectively admin-only page
  acceptable, or should the open5e sync move behind an admin settings area in a
  later change? Not a blocker for this change.

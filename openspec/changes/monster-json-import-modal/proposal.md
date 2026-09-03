## GitHub Issues

- #626

## Why

- Problem statement: Users can only add monsters to their library one at a time
  through the `Add New Monster` editor. A bulk-import path exists in the codebase
  (`app/monsters/import/page.tsx`, `app/api/monsters/upload/route.ts`,
  `lib/validation/monsterUpload.ts`) but it is unreachable from `/monsters` (no
  link or button), it is a standalone page rather than an in-context modal, it
  gives the user no way to learn the expected JSON structure, it uploads
  immediately with no confirmation/preview, it silently allows partial imports
  (HTTP 207), and it has no admin control over Global vs personal scope.
- Why now: Issue #626 asks for a first-class, self-service monster import
  experience. GMs are assembling large homebrew bestiaries and re-keying each
  monster by hand is the current bottleneck.
- Business/user impact: Any authenticated user can import a validated batch of
  monsters in one action, with a clear preview before committing and clear
  errors if something is wrong. Admins can choose to publish a batch to the
  Global library. Reduces data-entry friction and support requests about
  "how do I bulk add monsters".

## Problem Space

- Current behavior:
  - `/monsters` (`app/monsters/page.tsx`) has `Add New Monster` (and, for admins,
    `Add New Global Monster`) but no import affordance.
  - `/monsters/import` (`app/monsters/import/page.tsx`) is a separate page with a
    file input and an admin-only "Sync from open5e" panel. It POSTs the raw file
    JSON to `/api/monsters/upload`.
  - `/api/monsters/upload` (`app/api/monsters/upload/route.ts`) validates via
    `validateMonsterUploadDocument`, then `Promise.all`s `storage.saveMonsterTemplate`
    per row, returning 201 (all ok), 207 (partial), 400 (validation), or 500.
  - `transformMonsterData` hardcodes `isGlobal: false` and `userId: auth.userId`.
  - Validation lives in three drifting places: the `RawMonsterData` interface,
    the hand-rolled `validateMonsterData` checks, and `transformMonsterData`
    defaults. Only `name` and `maxHp` are required today.
  - `lib/storage/monsterTemplateRepo.ts` exposes `monsterExistsByNameAndSource`
    and `findMonsterByNameAndSource`, currently unused, plus `saveMonsterTemplate`
    (single upsert). No bulk write, no transactions anywhere in the codebase.
- Desired behavior:
  - `/monsters` shows an `Import Monster(s)` button available to every
    authenticated user (not admin-gated).
  - The button opens a modal (not a route) that:
    1. Links to a downloadable JSON structure document listing every
       non-calculated field and which fields are required.
    2. Provides a file picker for a JSON file whose top level is an array of one
       or more monsters.
    3. On file selection, validates the entire file (round trip 1 — server is
       authority) and, on success, shows the total count and the list of monster
       names to be imported.
    4. If the current user is an admin, shows a whole-batch scope choice:
       Global or Personal (default Personal). Non-admins always import Personal.
    5. On Confirm, ingests the batch (round trip 2). Dedupe is applied: monsters
       that collide with an existing monster (by name + source, within the target
       scope) are skipped, and the skipped names are returned and shown to the
       user.
    6. If any ingestion error occurs, the user is shown the errors and the entire
       load is reverted (best-effort compensation — see design.md; our MongoDB
       does not support multi-document transactions).
- Constraints:
  - MongoDB deployment does not support multi-document transactions. "The user
    never sees a half import" is achieved by validate-everything-first, then bulk
    insert, then compensating delete of the just-inserted ids on failure. This is
    not crash-safe (a process death mid-insert can leave orphans) and that
    limitation is accepted for this change.
  - Server must re-check admin status for Global imports; the client scope radio
    is advisory only.
  - Zod is adopted as the single source of truth for the upload schema; the JSON
    structure document is generated from that schema so it cannot drift.
  - Header/user-derived text is not written into monster records; monster content
    comes only from the uploaded file. (No GitHub-issue-style sanitization
    concern here, but names are trimmed and length-bounded.)
  - The import-error UI must expose failures via a stable, unambiguous locator.
    Existing project decisions require `role="alert"` on monster-import errors and
    a `data-testid` when multiple `role="alert"` nodes can render — the modal must
    follow both.
  - Follow project tooling rules: MCP (serena/tokensave) over Bash for file ops;
    tests are mandatory (`tests.md` artifact + Jest/Playwright suites).
- Assumptions:
  - The existing `/monsters/import` page stays for the admin-only "Sync from
    open5e" feature; only the JSON-file upload responsibility moves into the
    modal. The page's file-upload panel is removed to avoid two import UIs.
  - `MonsterTemplate` remains the stored shape. Global monsters use
    `userId = GLOBAL_USER_ID` and `isGlobal = true`, matching how
    `app/monsters/page.tsx` already creates global templates.
  - "All listed fields required" = the fields enumerated in the issue's field
    list become required in the Zod schema: `name`, `size`, `type`, `ac`, `hp`,
    `maxHp`, `speed`, `abilityScores`, `challengeRating`. Nested/collection
    fields (traits, actions, resistances, senses, etc.) remain optional. Final
    required set is confirmed in Open Questions.
  - Dedupe key is `name` + `source` (matching `monsterExistsByNameAndSource`),
    scoped to the target library (personal `userId` or `GLOBAL_USER_ID`).
- Edge cases considered:
  - Empty array / non-array top level / not valid JSON → validation error, modal
    stays open, nothing imported.
  - Duplicate names within the same uploaded file → treated as: first wins,
    later same-key rows reported as skipped duplicates (in-file dedupe) so the
    preview count and the imported count stay consistent.
  - Entire batch are duplicates → import succeeds with 0 inserted, full skipped
    list shown; not treated as an error.
  - Mix of valid rows + one row that fails DB insert → compensating delete of the
    inserted ids, user shown the failing row error, modal reports "reverted".
  - Admin selects Global but loses admin between preview and confirm → server
    rejects with 403, nothing imported.
  - Very large file → existing 5 MB cap is kept; oversize rejected client-side
    and server-side.
  - File with a monster whose `alignment` string is unrecognised → normalized
    away (existing `normalizeAlignment` behavior), not an error.
  - User closes the modal mid-flow → no state persisted, no partial writes.

## Scope

### In Scope

- `Import Monster(s)` button on `/monsters` for all authenticated users.
- New client modal component for the import flow (schema link, file picker,
  validate → preview → confirm, skipped-duplicates display, error display).
- A downloadable JSON structure document endpoint/asset, generated from the Zod
  schema, listing non-calculated fields and marking required ones.
- Adopt Zod for `lib/validation/monsterUpload.ts` as the single schema source;
  keep exported function names/return contract stable where feasible.
- Two-phase API:
  - Validation phase: validate the whole document, return count + names (or
    structured errors).
  - Ingestion phase: dedupe (name+source within target scope), bulk insert
    remaining, compensating delete on failure; return inserted names, skipped
    (duplicate) names, and errors.
- Admin-only whole-batch Global vs Personal scope, enforced server-side.
- Bulk insert + compensating-delete helpers in `lib/storage/monsterTemplateRepo.ts`.
- Remove the JSON-file upload panel from `app/monsters/import/page.tsx` (keep the
  open5e sync panel).
- Jest unit/integration tests + Playwright E2E for the modal flow.

### Out of Scope

- True atomic transactions / crash-safe rollback (MongoDB deployment can't).
- Editing or merging into existing monsters on duplicate (we skip, not upsert).
- Per-monster scope selection (whole batch only).
- CSV or other formats; only JSON.
- Importing anything other than monster templates (no spells/characters here).
- Changes to the open5e sync feature beyond leaving it where it is.
- Export of monsters to JSON (import only).

## What Changes

- `app/monsters/page.tsx`: add `Import Monster(s)` button + modal wiring; refresh
  the library list after a successful import.
- New `app/monsters/ImportMonstersModal.tsx` (or `lib/components/...`): the modal.
- `lib/validation/monsterUpload.ts`: reimplemented on Zod; add a schema-descriptor
  export used to render/generate the structure document.
- `app/api/monsters/upload/route.ts`: split into validate vs ingest behavior
  (either a `phase` param or a companion `validate` route — decided in design),
  add scope handling + admin check, add dedupe + compensating-delete flow,
  change response shape to `{ inserted, skipped, errors }`.
- New route/asset for the downloadable JSON structure document.
- `lib/storage/monsterTemplateRepo.ts`: add `saveManyMonsterTemplates` and
  `deleteMonsterTemplatesByIds` (or equivalent) plus a scoped dedupe lookup.
- `app/monsters/import/page.tsx`: remove the file-upload panel.
- New/updated specs under `openspec/changes/monster-json-import-modal/specs/`.
- New tests (unit, integration, E2E).
- Possibly add `zod` to `package.json` if not already a dependency.

## Risks

- Risk: Compensating delete is not crash-safe; a crash between insert and
  delete-on-error leaves orphan monsters in a user's library.
  - Impact: User sees monsters they didn't intend to keep; must delete manually.
  - Mitigation: Validate exhaustively before any write so mid-batch failures are
    rare (only DB/infra errors remain); delete inserted ids in a `finally`/catch;
    log orphaned ids for support; document the limitation in the modal's error
    copy ("some monsters may need manual cleanup").
- Risk: Rewriting `monsterUpload.ts` on Zod changes validation behavior and
  breaks existing callers/tests.
  - Impact: Regressions in `/api/monsters/upload` and open5e import if it shares
    code.
  - Mitigation: Keep the public function signatures and `ValidationResult` shape;
    port the existing unit tests first (TDD), add Zod-specific cases; grep all
    importers of `monsterUpload` before changing.
- Risk: Making previously-optional fields required rejects files that worked
  before (including any fixtures / open5e-derived exports).
  - Impact: Users with older export files get validation errors.
  - Mitigation: Confirm the required set in Open Questions; provide the
    downloadable structure doc; give precise per-field error messages with the
    `monsters[i].field` path already used today.
- Risk: Dedupe key (name+source) is too coarse or too fine.
  - Impact: Legit distinct monsters skipped, or near-duplicates both imported.
  - Mitigation: Scope the check to the target library; surface skipped names so
    the user can react; treat 0-inserted as success not error.
- Risk: Modal + two round trips increases client complexity and error-state
  surface.
  - Impact: More ways for the UI to get stuck.
  - Mitigation: Explicit state machine in design.md; E2E coverage of each
    transition; modal is fully re-openable with no persisted state.
- Risk: Two `role="alert"` regions (page-level error + modal error) cause
  Playwright strict-mode ambiguity.
  - Impact: Flaky/failing E2E.
  - Mitigation: Give the modal error a unique `data-testid` per existing project
    decision.

## Open Questions

- Question: Confirm the exact required-field set for the Zod schema. Proposed
  required: `name`, `size`, `type`, `ac`, `hp`, `maxHp`, `speed`,
  `abilityScores` (all six scores), `challengeRating`. Everything else optional.
  Is `speed` really required (open5e monsters sometimes omit it)? Is `hp`
  required separately from `maxHp`, or should `hp` default to `maxHp`?
  - Needed from: requester (Doug)
  - Blocker for apply: yes
- Question: Downloadable structure document format — a `.json` example file, a
  JSON Schema document, or a human-readable field table (Markdown/HTML)? The
  issue says "list all fields ... and define which are required", which a JSON
  Schema or a table both satisfy.
  - Needed from: requester (Doug)
  - Blocker for apply: no (design will pick a default: JSON Schema + example)
- Question: Validate phase — reuse `/api/monsters/upload` with a `phase` field,
  or add a dedicated `/api/monsters/upload/validate` route?
  - Needed from: design decision, no external input required
  - Blocker for apply: no
- Question: On confirm, should the client re-send the original file, or a token
  referencing the server-validated payload? (Re-sending the file means the
  server re-validates; simplest, no server-side session state.)
  - Needed from: design decision
  - Blocker for apply: no
- Question: Should in-file duplicate names be reported as "skipped duplicates"
  or rejected as a validation error? Proposal assumes skipped (first wins).
  - Needed from: requester (Doug)
  - Blocker for apply: no

## Non-Goals

- Not building a monster-editing/merge-on-conflict workflow.
- Not adding transaction support to the storage layer.
- Not changing how single-monster creation or the monster editor works.
- Not migrating or re-tagging existing monster records.
- Not adding monster export.
- Not touching spell/character import flows.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

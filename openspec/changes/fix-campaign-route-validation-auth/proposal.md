## GitHub Issues

- #829

## Why

- Problem statement: Verity flagged four pre-existing gaps in campaign routes: one unauthenticated read and three routes that pass unvalidated path ids to storage.
- Why now: Surfaced while working #689; the findings block the Verity gate for any future edit to these files.
- Business/user impact: Unauthenticated callers can hit MongoDB through `GET /api/campaigns/global`; oversized or malformed ids reach storage queries unbounded.

## Problem Space

- Current behavior:
  - `GET /api/campaigns/global` has no auth check; `openspec/specs/campaign-template-admin/spec.md` documents it as a deliberate "public list".
  - `DELETE /api/campaigns/global/[id]` passes `id` straight to `storage.deleteCampaignTemplate`.
  - `POST`/`GET /api/campaigns/[id]/characters` pass the campaign id to `getMember` / storage unvalidated.
  - `DELETE /api/campaigns/[id]/characters/[cid]` passes both ids unvalidated.
  - `POST /api/campaigns/global/[id]/copy` validates with `validateString(minLength: 1)` only (no max length).
- Desired behavior: Every route validates path ids with `validateEntityId` (string, 1–200 chars) before any storage call, returning 400 on failure. The global list requires an authenticated session.
- Constraints: Ids are string UUIDs matched against string `id` fields (not ObjectId). Admin DELETE must keep 401/403 ahead of 400.
- Assumptions: The only consumer of `GET /api/campaigns/global` is `app/campaigns/page.tsx`, a logged-in page that already sends cookies.
- Edge cases considered: empty id, id over 200 chars, whitespace-only id, non-string param, unauthenticated vs. invalid-id precedence.

## Scope

### In Scope

- Add `withAuth` to `GET /api/campaigns/global`.
- Add `validateEntityId` to the four flagged routes and to the sibling `global/[id]/copy` route.
- Unit tests for each route: 400 on invalid ids, 401 on unauthenticated global GET, storage not called on invalid input.
- Update `openspec/specs/campaign-template-admin` (public → authenticated) via delta.

### Out of Scope

- Changing the response shape or status codes of any success path.
- `PUT /api/campaigns/global` seed stub.
- Validating ids on routes not flagged by Verity.
- Rate limiting.

## What Changes

- `app/api/campaigns/global/route.ts`: GET wrapped in `withAuth`.
- `app/api/campaigns/global/[id]/route.ts`: validate `id` after `requireAdmin`.
- `app/api/campaigns/[id]/characters/route.ts`: validate campaign id in POST and GET.
- `app/api/campaigns/[id]/characters/[cid]/route.ts`: validate `id` and `cid`.
- `app/api/campaigns/global/[id]/copy/route.ts`: swap `validateString` for `validateEntityId`.
- Tests under `tests/unit/api/campaigns/`.

## Capabilities

### Modified Capabilities

- `campaign-template-admin`: global list now requires authentication; template DELETE validates id.
- `campaign-character-shares`: share/list/unshare routes validate path ids.
- `campaign-copy`: copy route validates template id with the shared bounded validator.

## Risks

- Risk: Reverses the documented "public list" decision for `GET /api/campaigns/global`.
  - Impact: Any anonymous consumer (none found in the repo) would receive 401.
  - Mitigation: Spec delta records the reversal; grep confirmed `app/campaigns/page.tsx` is the sole caller.
- Risk: Stricter id validation rejects previously accepted ids over 200 chars.
  - Impact: None for real data (UUIDs are 36 chars).
  - Mitigation: Same bounds already used by `app/api/parties/[id]/route.ts`.

## Open Questions

- Question: Confirm reversing the "public list" requirement in `campaign-template-admin` is intended.
  - Needed from: Requester (decided as option A in explore; recorded here for visibility).
  - Blocker for apply: no

## Non-Goals

- Redesigning campaign authorization or membership checks.
- Introducing a new validation module.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

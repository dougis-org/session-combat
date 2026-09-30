## GitHub Issues

- #782

## Why

- Problem statement: Party routes let any active campaign member link an arbitrary party to a campaign's `campaignId` via `partyRepo.addPartyToCampaign`/`reassignCampaign`. Only the *characters* being placed into the party are checked against campaign sharing (`canAddToCampaignParty`); the caller's own authority over the *target campaign* is never checked. Separately, `PUT /api/parties/[id]` destructures fields off the parsed JSON body without validating its shape, and a malformed or empty `campaignId` value is silently normalized to "unlink from campaign" rather than rejected.
- Why now: Flagged by Verity's pre-commit gate during #683 (party-callers narrow-import migration) as a pre-existing gap, intentionally deferred to keep that PR behavior-preserving. Tracked as its own security/tech-debt issue (#782) so it isn't lost.
- Business/user impact: A non-DM active campaign member can link (or silently unlink) any of their own parties to a campaign they don't run, polluting that campaign's roster of parties or detaching a DM's existing party-campaign link without permission. No data is destroyed (soft, reversible link state) but it's an authorization bypass and a data-integrity foot-gun.

## Problem Space

- Current behavior:
  - `POST /api/parties` and `PUT /api/parties/[id]` both accept an optional `campaignId` and call into `partyRepo.canAddToCampaignParty` (per character) before calling `partyRepo.addPartyToCampaign` / `reassignCampaign`.
  - `canAddToCampaignParty(campaignId, characterId, callerId)` only verifies the *character* is owned by the caller or shared into the campaign by an active member — it never checks the caller's role on `campaignId`.
  - `reassignCampaign` in `app/api/parties/[id]/route.ts` treats `campaignId === undefined` as "no change," but any other value is coerced with `typeof campaignId === 'string' ? campaignId.trim() : ''`. An empty string, a non-string type (e.g. `123`, `null`, `[]`), or an unknown campaign id all normalize to `''`, which unconditionally unlinks the party from all campaigns via `removePartyFromAllCampaigns`.
  - `PUT`'s handler does `const { name, description, characterIds, campaignId } = body;` right after `await request.json()`, with no check that `body` is a plain object. A non-object body (array, string, number, `null`) either throws a generic error (caught and reported as a 500, masking the real 400-worthy failure) or, for `null`, throws on property access — again surfacing as a 500 instead of a clear 400.
- Desired behavior:
  - Linking (or relinking) a party to a campaign is gated on the caller having active DM membership on that target campaign, enforced at the repository layer (`partyRepo.addPartyToCampaign` and the reassignment path used by `PUT`), not only in route handlers — so any future caller of these functions inherits the check.
  - A `campaignId` that is not `undefined` and not a string at all (e.g. `null`, a number, boolean, array, object) is rejected with 400 as malformed input. `campaignId === undefined` still means "no change"; `campaignId === ''` (a string) still means "explicit unlink" — both existing, legitimate signals are preserved unchanged. A non-empty string that doesn't resolve to a campaign the caller has DM authority over is rejected via the new repository-level authorization check (403), not silently treated as unlink.
  - `PUT`'s body is validated as a non-null plain object before any field is destructured, returning 400 for anything else.
- Constraints:
  - `addPartyToCampaign` is also called from `POST /api/parties` (party creation with a `campaignId`) and must apply the same DM check there.
  - Must not break the existing character-share check (`canAddToCampaignParty`); both checks are independent and both are required (caller authority over the campaign, AND legitimacy of the characters being placed).
  - Existing unlink semantics (`campaignId: ''` means unlink, `campaignId: undefined` means no change — confirmed against `app/parties/page.tsx:352-356`) must be preserved exactly; only non-string values change from silent-coerce-to-unlink to 400.
  - No schema/DB migration; this is authorization + input-validation logic only.
- Assumptions:
  - "DM" authorization means `getMember(campaignId, callerId)` returns a member with `role === 'dm'` and `status === 'active'`, mirroring `app/api/campaigns/[id]/members/[userId]/route.ts:12`.
  - Confirmed against the frontend (`app/parties/page.tsx:352-356`, the party editor's Campaign `<select>` has an explicit "None" option with `value=""`): `campaignId` is only ever sent by the app as a string — either a real campaign id or `''` to explicitly unlink. The validation contract is therefore: `campaignId === undefined` → no change; `typeof campaignId === 'string'` (including `''`) → link/unlink request, handled by the existing string-based logic; anything else (`null`, a number, boolean, array, object) → malformed, reject with 400. This preserves the existing, legitimate empty-string-means-unlink behavior and only tightens validation for values the frontend never sends.
- Edge cases considered:
  - Party owner is also the target campaign's DM: check passes normally (still requires active DM membership row to exist).
  - Party being created with no `campaignId` at all: no authorization check needed (existing behavior unchanged).
  - Caller is DM of a *different* campaign than the one they're trying to link into: must fail.
  - `campaignId` present in PUT body but unchanged from `existingParty.campaignId`: still goes through `reassignCampaign`, which today unconditionally calls `removePartyFromAllCampaigns` + `addPartyToCampaign`; this proposal keeps that idempotent round-trip but the round-trip must pass the new DM check too (caller must still be DM of the unchanged campaign).
  - DELETE and GET routes are unaffected — no campaign linking happens there.

## Scope

### In Scope

- `lib/storage/partyRepo.ts`: add a DM-authorization check inside `addPartyToCampaign` (and any shared helper used by `reassignCampaign`'s relink path), sourced from `membershipRepo.getMember`.
- `app/api/parties/route.ts` (`POST`): pass the caller's id through so the repo-level check can run; handle the new authorization failure with an appropriate 403; validate `campaignId` value (reject malformed/empty-but-present-as-garbage rather than silently skipping the link).
- `app/api/parties/[id]/route.ts` (`PUT`): validate request body shape (non-null object) before destructuring; validate `campaignId` (malformed or empty-but-invalid → 400) before calling `reassignCampaign`; propagate the new repo-level DM-authorization failure as 403.
- Tests: unit/integration coverage for both routes covering the new authorization gate and the new validation rules (unauthorized DM, malformed body, non-string `campaignId`, and the still-valid unlink and no-change paths).

### Out of Scope

- Changing the underlying party/campaign data model (`partyIds` vs. legacy `parties.campaignId` migration logic in `addPartyToCampaign`/`removePartyFromCampaign`).
- Any UI/frontend changes; this is API-layer only. `campaignId: ''` continues to mean "explicit unlink" from the frontend's perspective.
- Authorization checks on `characterIds` membership beyond the existing `canAddToCampaignParty` behavior (unchanged).
- Broader audit of other routes for similar gaps (tracked separately if found).

## What Changes

- `partyRepo.addPartyToCampaign(campaignId, partyId, callerId)` gains a required `callerId` parameter and verifies active DM membership before writing; throws/returns a typed authorization error on failure (mirrors existing repo error conventions, e.g. `lib/storage/errors.ts`).
- The reassignment path called from `PUT /api/parties/[id]` (currently `reassignCampaign` in the route file, extracted into `partyRepo.reassignPartyCampaign` for reuse) performs a DM check before *both* halves of the operation: it verifies DM authority on the party's currently-linked campaign before calling `removePartyFromAllCampaigns` (so a non-DM can't strip an existing link via `campaignId: ''`), and DM authority on the new target campaign via `addPartyToCampaign` before linking to it.
- `app/api/parties/route.ts` `POST`: adds explicit `campaignId` type validation (reject non-string, non-undefined values with 400) and catches the new repo-level authorization error to return 403 with a clear message, keeping the existing compensating `deleteParty` rollback on failure.
- `app/api/parties/[id]/route.ts` `PUT`: adds a body-shape guard (`typeof body === 'object' && body !== null && !Array.isArray(body)`) before destructuring; adds `campaignId` type validation matching POST's rule; catches the new authorization error as 403.
- New/updated tests in the routes' existing test suites (and `partyRepo`'s test suite) covering: non-DM caller rejected (403), DM caller of unrelated campaign rejected (403), non-string `campaignId` rejected (400), non-object PUT body rejected (400), valid unlink (`campaignId: ''`) still succeeds, valid link/relink by the actual DM still succeeds, no-op when `campaignId` is `undefined`.

## Risks

- Risk: Adding a `callerId` parameter to `addPartyToCampaign` changes its signature, potentially breaking other call sites.
  - Impact: Compile-time TypeScript errors surface any missed call site immediately; a grep confirms only `app/api/parties/route.ts` and `app/api/parties/[id]/route.ts` (via `reassignCampaign`) call it today.
  - Mitigation: Update both call sites in this change; run full typecheck before merging.
- Risk: Reclassifying non-string `campaignId` as a 400 could break a caller that unintentionally relies on the silent-unlink coercion.
  - Impact: A caller sending a non-string value would start getting 400 where it previously got a silent unlink.
  - Mitigation: Confirmed via `app/parties/page.tsx:352-356` that the app's own frontend only ever sends a string (`''` or a real campaign id) for `campaignId`; no legitimate caller relies on non-string coercion. Direct API callers sending malformed types were already relying on undocumented, unintended behavior.
- Risk: The DM-authorization check adds a `getMember` DB read to every party-campaign link/relink, including the idempotent round-trip in `reassignCampaign` when `campaignId` is unchanged.
  - Impact: Minor added latency; no correctness risk since it was already doing an unconditional unlink+relink round-trip.
  - Mitigation: Accept the extra read; it's a single indexed lookup, consistent with the pattern already used elsewhere (e.g. `members/[userId]/route.ts`).

## Open Questions

- Question: Should the repo-level authorization error be a distinct error class (e.g. `PartyCampaignAuthorizationError` in `lib/storage/errors.ts`) that route handlers catch explicitly, or should `addPartyToCampaign` simply return a boolean/result type that callers check?
  - Needed from: implementer discretion during design, informed by existing repo error conventions in `lib/storage/errors.ts`.
  - Blocker for apply: no — resolved in design.md.
- Question (resolved): Does the frontend ever send a non-string `campaignId`, or rely on empty string meaning something other than "unlink"? No — confirmed via `app/parties/page.tsx:352-356` (explicit "None" `<option value="">`) that the frontend only ever sends a string, and `''` is the deliberate, legitimate unlink signal. User confirmed: keep `''` (typeof string) as valid unlink; only non-string values are "malformed" and rejected with 400.
  - Blocker for apply: no — resolved, reflected in Problem Space and What Changes above.

## Non-Goals

- Rewriting the legacy `partyIds`-vs-`parties.campaignId` migration logic inside `addPartyToCampaign`/`removePartyFromCampaign`.
- Adding authorization checks to `GET`/`DELETE` party routes (not part of the reported issue).
- General input-validation hardening across other API routes beyond `app/api/parties/*`.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

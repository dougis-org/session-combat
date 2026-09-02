## GitHub Issues

- #503
- Parent tracking issue: #499

## Why

- Problem statement: `lib/storage.ts` is still a ~1071-line god object. 27 methods
  covering monster templates, campaign templates, campaigns, and campaign
  membership remain in the monolith, each making its own ad-hoc choice about
  whether a MongoDB failure is swallowed (returns `[]`/`null`/`false`),
  rethrown raw, or not caught at all. Callers cannot distinguish "genuinely
  empty" from "database is down."
- Why now: The foundation this cluster needs — `runStorageOp`, `logStorageEvent`,
  `StorageError` — merged in #501 (via #531). Cluster 1 (#502, via #572) already
  migrated encounters, characters, combat state, and parties onto it and
  established the pattern (`lib/storage/partyRepo.ts` is the reference). #503 is
  the largest of the three remaining migration clusters and unblocks nothing
  else until it lands, but #504 (content/reference domains) will reuse whatever
  precedent #503 sets for domain-specific error types.
- Business/user impact: A database outage on a campaign-scoped route currently
  masquerades as a 404 "Campaign not found" (via `getMember` siblings that
  swallow) or as inconsistent partial data. After this change such failures
  surface as real 500s with a logged `StorageError`, so operators can see
  outages and users get an honest error instead of a misleading one.

## Problem Space

- Current behavior:
  - The 27 methods live as inline async functions on the `storage` object
    literal in `lib/storage.ts`.
  - Error handling is inconsistent. Per the #503 issue comment cross-referencing
    `docs/storage-refactor/inventory.json`, 10 of the 27 currently **swallow**
    DB errors and return a sentinel: `loadMonsterTemplates` (`[]`),
    `loadAllMonsterTemplates` (`[]`), `monsterExistsByNameAndSource` (`false`),
    `findMonsterByNameAndSource` (`null`), `loadGlobalCampaignTemplates` (`[]`),
    `loadGlobalCampaignTemplateById` (`null`), `loadCampaigns` (`[]`),
    `loadCampaignById` (`null`), `listCampaignsForMember` (`[]`),
    `listMembersForCampaign` (`[]`).
  - `getMember` already rethrows raw driver errors today.
  - `addMember` catches the MongoDB duplicate-key error (code `11000`) and
    rethrows it as a domain-specific `DuplicateMemberError`; three routes
    depend on `error instanceof DuplicateMemberError`.
- Desired behavior:
  - All 27 methods move into four new per-domain repo modules under
    `lib/storage/`, each DB operation wrapped in `runStorageOp`.
  - `lib/storage.ts` re-exports every method under the same `storage` object
    with byte-identical names and signatures (thin delegation, matching the
    #502 pattern).
  - Swallowing is removed: a real DB failure now rejects with `StorageError`
    (logged via `logStorageEvent`). "Not found" / "genuinely empty" stays a
    non-throwing `null`/`[]`/`false`.
  - `addMember` still throws `DuplicateMemberError` (not `StorageError`) on a
    duplicate key, preserving the three call sites.
- Constraints:
  - `lib/storage.ts` public shape (the `storage` object) must not change. No
    caller import statement may change.
  - All existing test mocks of `storage` must pass unmodified.
  - Characterization tests from #500 covering this domain cluster must still
    pass; any intentional behavior change is called out in the PR description.
  - `@drdreo/dice-box-threejs` pin and other unrelated concerns are untouched.
  - Work happens in the `.worktrees/refactor-storage-issue-503` worktree.
- Assumptions:
  - The #500 inventory's classification of these 27 methods is still accurate;
    the tasks artifact re-verifies method count and behavior against current
    source before relying on it (per the inventory's own staleness warning).
  - `runStorageOp` from #501 is the correct and only error-handling seam; no
    second helper is introduced.
  - Cross-repo calls (e.g. `loadGlobalMonsterTemplates` →
    `loadMonsterTemplates(GLOBAL_USER_ID)`) can call the sibling repo function
    directly rather than bouncing through the `storage` facade.
- Edge cases considered:
  - `addMember`'s `DuplicateMemberError` being swallowed by `runStorageOp`'s
    catch-all wrap — addressed by the Option B foundation change below.
  - `deleteCampaignTemplate`, `claimActiveCampaignSession`,
    `canAddToCampaignParty`, `monsterExistsByNameAndSource` return a *result*
    boolean, not an error sentinel — `isEmpty` must not misclassify `false`.
  - `loadAllMonsterTemplates` has a latent quirk
    (`[...userTemplates, globalTemplates].flat()`); migration keeps semantics,
    tidy-up is optional and called out if done.
  - `assertCampaignAccess` (`lib/utils/campaign.ts`) calls `getMember` with no
    try/catch and runs on nearly every campaign-scoped route — its behavior
    under a DB outage is explicitly verified.
  - `listMembersForCampaign` has 4 callers and is the highest-blast-radius
    swallow→rethrow conversion in the cluster.

## Scope

### In Scope

- Create `lib/storage/monsterTemplateRepo.ts`, `lib/storage/campaignTemplateRepo.ts`,
  `lib/storage/campaignRepo.ts`, `lib/storage/membershipRepo.ts`.
- Move all 27 named methods into those modules, each built on `runStorageOp`.
- Update `lib/storage.ts` to import and re-export the 27 methods with unchanged
  public shape.
- Add a `rethrowAsIs?: (error: unknown) => boolean` predicate to
  `RunStorageOpMeta` in `lib/storage/runOp.ts` (Option B) so `runStorageOp`
  rethrows matching errors unwrapped instead of replacing them with
  `StorageError`. Update `lib/storage/runOp.ts`'s own unit tests
  (`tests/unit/lib/storage/runOp.test.ts`) to cover the new branch.
- Use `rethrowAsIs` in `membershipRepo.addMember` to let `DuplicateMemberError`
  pass through.
- New per-repo unit tests: `tests/unit/lib/storage/{monsterTemplateRepo,
  campaignTemplateRepo,campaignRepo,membershipRepo}.test.ts`, including explicit
  verification of the `getMember` → `assertCampaignAccess` DB-outage path and
  the `listMembersForCampaign` swallow→rethrow conversion.

### Out of Scope

- Cluster 3 domains — sessionLogs, shares, spells, rolls, misc (#504).
- Swapping the `logStorageEvent` console seam for OpenTelemetry (#505).
- Migrating callers off the `storage` facade to narrow imports (#506).
- Any change to route handlers, `lib/utils/campaign.ts`, or business logic
  beyond what is required to keep `DuplicateMemberError` behavior identical.
- Extending characterization-test coverage to methods #500 left un-pinned
  (beyond the new per-repo tests this change adds).
- Refactoring the `loadAllMonsterTemplates` spread quirk (optional, diff-purity
  call made during implementation).

## What Changes

- 27 storage methods physically relocate from `lib/storage.ts` into 4 new
  `lib/storage/*Repo.ts` modules; `lib/storage.ts` keeps them reachable via
  unchanged `storage.*` delegation.
- 10 methods change runtime behavior on DB failure: swallow → reject with
  `StorageError`. Not-found / empty results are unchanged.
- `getMember`, `loadCampaignByIdAny`, `saveCampaign`, `deleteCampaign`,
  `setActiveCampaignSession`, `claimActiveCampaignSession`, `saveCampaignTemplate`,
  `deleteCampaignTemplate`, `saveMonsterTemplate`, `deleteMonsterTemplate`,
  `updateMemberStatus`, `addMember` — currently rethrow (raw or wrapped); now
  reject with `StorageError` (except `addMember`'s `DuplicateMemberError`,
  preserved via `rethrowAsIs`).
- `RunStorageOpMeta` gains an optional `rethrowAsIs` predicate; `runStorageOp`
  gains one conditional branch in its catch block.
- New spec capability documenting the per-domain storage decomposition contract
  and the domain-error passthrough rule.

## Risks

- Risk: A swallow→rethrow conversion breaks a caller that branches on the
  sentinel (e.g. `members.length === 0` treated as "empty campaign" when it was
  actually a DB failure).
  - Impact: A route that previously rendered an empty state now returns 500 —
    intended, but could surprise if a caller relied on the masking.
  - Mitigation: Enumerate all callers of the 10 converting methods (from
    `inventory.json`, re-verified against source) in tasks; give
    `listMembersForCampaign` (4 callers) and `loadAllMonsterTemplates`
    (2 callers) the same explicit-test treatment the issue mandates for
    `getMember`. Call out every behavior change in the PR description.
- Risk: The `rethrowAsIs` predicate edits foundation code merged in #501,
  outside this cluster's nominal boundary.
  - Impact: A regression in `runStorageOp` affects every migrated repo
    (clusters 1 and 2) and #504.
  - Mitigation: Additive optional field, single guarded branch, default
    behavior byte-identical when `rethrowAsIs` is absent; extend
    `runOp.test.ts` to cover both the matching and non-matching paths.
- Risk: `runStorageOp`'s `isEmpty` misclassifies a legitimate `false`/empty
  result boolean as `not_found` telemetry.
  - Impact: Misleading operational logs (not a correctness bug).
  - Mitigation: Only set `isEmpty` on genuine collection-returning reads; omit
    it for result-boolean methods.
- Risk: `lib/storage.ts` public shape drifts (a signature typo in delegation).
  - Impact: Type errors or silently changed behavior; test mocks break.
  - Mitigation: Type-check + full existing `storage` test suites run unmodified
    as the guardrail; method-count assertion in tasks.
- Risk: Worktree / `openspec-shared` submodule friction (known issue —
  `[[project_worktree_openspec_schema_missing]]`).
  - Impact: `openspec` commands fail inside the worktree.
  - Mitigation: Submodule force-checked-out at worktree creation; verified
    before writing artifacts.

## Open Questions

- Question: For cross-repo helper calls (`loadGlobalMonsterTemplates` →
  `loadMonsterTemplates`, `loadAllMonsterTemplates` → both), call the sibling
  repo function directly or via the `storage` facade?
  - Needed from: requester (dougis)
  - Blocker for apply: no — design.md proposes "direct import" as the default
    (cleaner, avoids facade round-trip); flag if you want facade consistency
    with `partyRepo`'s mixed style.
- Question: Should the `loadAllMonsterTemplates` spread quirk be tidied during
  migration or preserved verbatim for diff purity?
  - Needed from: requester (dougis)
  - Blocker for apply: no — default is preserve verbatim.

No other unresolved ambiguity: the migration pattern, the foundation change
(Option B), and the two mandated verification points (`getMember` /
`assertCampaignAccess`, `listMembersForCampaign`) are settled.

## Non-Goals

- Not decomposing `lib/storage.ts` fully — 3 domain clusters remain after this
  one lands (#504 and the `savedContent` nested methods).
- Not changing what `logStorageEvent` does with events (console today, OTel in
  #505).
- Not improving test coverage of the ~61 methods #500 inventoried but did not
  test-pin, beyond the per-repo tests added here.
- Not touching any route handler, middleware, or `lib/utils/` logic except to
  preserve `DuplicateMemberError` semantics.
- Not a performance optimization pass.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.

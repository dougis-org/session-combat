## Context

- Relevant architecture:
  - `lib/storage.ts` — a single `storage` object literal (~1071 lines) consumed
    by ~36 files. Cluster 1 (#502) already extracted 19 methods into
    `lib/storage/{encounterRepo,characterRepo,combatStateRepo,partyRepo}.ts`,
    each method delegating from `storage` to the repo. `lib/storage/partyRepo.ts`
    is the reference implementation.
  - `lib/storage/runOp.ts` — `runStorageOp(meta, fn)` from #501. Times `fn`,
    logs a `StorageError`-outcome event and rethrows `new StorageError(name,
    collection, { cause })` on failure; logs `success`/`not_found` (via
    `meta.isEmpty`) otherwise.
  - `lib/storage/errors.ts` — `StorageError` (fields `op`, `collection`, `cause`).
  - `lib/telemetry/logger.ts` — `logStorageEvent` (console seam).
  - `lib/errors.ts` — `DuplicateMemberError`, `DuplicateShareError` (domain
    errors thrown by `storage` methods, matched with `instanceof` by routes).
  - `lib/utils/campaign.ts` — `assertCampaignAccess(campaignId, userId)` calls
    `storage.getMember` then `storage.loadCampaignByIdAny`, no try/catch; used by
    nearly every campaign-scoped route.
- Dependencies:
  - #501 (`runStorageOp` foundation) — merged.
  - #502 (cluster 1 pattern) — merged.
  - `docs/storage-refactor/inventory.json` — per-method behavior classification
    and caller lists (point-in-time snapshot; re-verified in tasks).
- Interfaces/contracts touched:
  - `RunStorageOpMeta<T>` — gains optional `rethrowAsIs?: (error: unknown) => boolean`.
  - `storage` object in `lib/storage.ts` — 27 methods change from inline
    implementations to delegations; **public shape unchanged**.
  - New modules: `lib/storage/monsterTemplateRepo.ts`,
    `lib/storage/campaignTemplateRepo.ts`, `lib/storage/campaignRepo.ts`,
    `lib/storage/membershipRepo.ts`.

## Goals / Non-Goals

### Goals

- Move the 27 monster-template / campaign-template / campaign / membership
  methods into 4 per-domain repos, each DB call wrapped in `runStorageOp`.
- Remove error swallowing: real DB failures reject with `StorageError`; not-found
  / empty stays a non-throwing sentinel.
- Preserve `lib/storage.ts`'s public shape and every caller's import statements.
- Preserve `addMember`'s `DuplicateMemberError` contract for its 3 call sites.
- Add a reusable mechanism (`rethrowAsIs`) for domain errors to bypass
  `StorageError` wrapping, so #504 inherits a settled precedent.
- Explicitly verify the two highest-blast-radius conversions: `getMember` via
  `assertCampaignAccess`, and `listMembersForCampaign` (4 callers).

### Non-Goals

- Cluster 3 (#504), OTel seam (#505), narrow-import migration (#506).
- Route/middleware/business-logic changes beyond `DuplicateMemberError` parity.
- Coverage extension for #500's un-pinned methods beyond the new per-repo tests.
- Performance work; `loadAllMonsterTemplates` quirk clean-up (optional).

## Decisions

### Decision 1: `rethrowAsIs` predicate on `RunStorageOpMeta` (Option B)

- Chosen: Add `rethrowAsIs?: (error: unknown) => boolean` to `RunStorageOpMeta<T>`.
  In `runStorageOp`'s `catch` block, after `logStorageEvent({outcome: "error"})`,
  if `meta.rethrowAsIs?.(error)` is true, `throw error` unchanged; otherwise
  `throw new StorageError(...)` as today. `membershipRepo.addMember` detects the
  duplicate-key case inside `fn` (`error.code === 11000` → throw
  `new DuplicateMemberError(campaignId, userId)`) and passes
  `rethrowAsIs: (e) => e instanceof DuplicateMemberError`.
- Alternatives considered:
  - **Option A** — detect the duplicate key *outside* `runStorageOp`:
    `addMember` wraps the `runStorageOp` call in its own try/catch and inspects
    `err.cause?.code`. Rejected: leaves `addMember` bespoke, relies on walking
    the `StorageError.cause` chain, and gives #504's `DuplicateShareError` no
    shared path.
  - **Option C** — `runStorageOp` never wraps `Error` subclasses it does not
    own (implicit allowlist by `name`/`instanceof`). Rejected: implicit magic,
    surprising for future readers, hard to reason about which errors wrap.
- Rationale: The concern ("some domain errors are meaningful and must not be
  flattened") belongs explicitly on the operation's metadata, next to `name`
  and `isEmpty`. Additive and opt-in — every existing call site is byte-identical.
- Trade-offs: Edits foundation code merged in #501, widening this cluster's
  blast radius to clusters 1 and 2 and #504. Mitigated by the field being
  optional with a single guarded branch and default behavior unchanged; the
  branch is covered both ways in `tests/unit/lib/storage/runOp.test.ts`.

### Decision 2: Thin delegation preserves `lib/storage.ts` public shape

- Chosen: Each of the 27 methods becomes a one-line delegate on the `storage`
  object: `loadCampaigns: (userId) => campaignRepo.loadCampaigns(userId)` (and
  the equivalent for the others), with `import * as campaignRepo from
  "./storage/campaignRepo"` etc. `normalizeCampaign` (currently a module-scope
  helper in `lib/storage.ts`) moves into `campaignRepo.ts`. Signatures copied
  verbatim; `tsc` + the untouched `storage` test suites are the guardrail.
- Alternatives considered: Re-export bindings directly
  (`export const storage = { ...campaignRepo, ... }`). Rejected: `storage` mixes
  flat methods with `storage.savedContent.*` nesting and cross-method `this`
  calls historically; explicit per-method delegation matches #502 and keeps the
  object literal greppable.
- Rationale: Zero caller churn is a hard acceptance criterion; explicit
  delegation is the lowest-risk way to hit it and matches the established
  pattern.
- Trade-offs: Verbose (27 delegate lines). Acceptable — it is transitional; #506
  removes the facade.

### Decision 3: Swallow removal — sentinel semantics preserved for "empty", not for "failure"

- Chosen: The 10 swallowing methods lose their `catch { return sentinel }`.
  Their `runStorageOp` `meta` sets `isEmpty` only where the sentinel means
  "no rows" (`loadMonsterTemplates`, `loadAllMonsterTemplates`,
  `loadGlobalCampaignTemplates`, `loadCampaigns`, `listCampaignsForMember`,
  `listMembersForCampaign` → `res.length === 0`;
  `loadGlobalCampaignTemplateById`, `loadCampaignById`,
  `findMonsterByNameAndSource` → `res === null`). `monsterExistsByNameAndSource`
  returns a *result* boolean (`false` = "does not exist") — no `isEmpty`, the
  method still returns `false`/`true` normally and only a DB failure throws.
- Alternatives considered: Keep a local `catch` in a few high-traffic methods to
  preserve the empty-state UX. Rejected: the entire point of the epic is to stop
  masking outages; any caller that genuinely wants a soft-fail can catch
  `StorageError` itself.
- Rationale: Matches #502 and the #500 taxonomy; "not found" and "DB down" must
  be distinguishable.
- Trade-offs: Callers that branched on the sentinel as a catch-all now see 500s.
  Enumerated and tested (Decision 4).

### Decision 4: Explicit verification for `getMember`/`assertCampaignAccess` and `listMembersForCampaign`

- Chosen: New per-repo tests assert:
  - `getMember` rejects with `StorageError` (not `null`, not raw) when the
    driver throws; `assertCampaignAccess` propagates it (does not convert to the
    404 "Campaign not found" path); a representative campaign-scoped route
    surfaces it as a 500 with a logged `StorageError`, not a 404 and not an
    unhandled crash.
  - `listMembersForCampaign` rejects with `StorageError` on driver failure and
    still returns `[]` for a genuinely member-less campaign; each of its 4
    callers is listed in the test file's header comment with its post-change
    behavior.
- Alternatives considered: Route-level integration test per caller. Rejected as
  disproportionate; one representative route plus unit-level propagation proof
  covers the contract.
- Rationale: These are the acceptance criteria the issue calls out by name.
- Trade-offs: None significant.

### Decision 5: Cross-repo helper calls use direct sibling imports

- Chosen: `monsterTemplateRepo.loadGlobalMonsterTemplates` calls
  `loadMonsterTemplates(GLOBAL_USER_ID)` directly (same module);
  `loadAllMonsterTemplates` calls both local functions directly. No bounce
  through the `storage` facade.
- Alternatives considered: `storage.loadMonsterTemplates(...)` (matches
  `partyRepo`'s mixed style). Deferred to Open Question — default is direct.
- Rationale: Avoids a needless facade round-trip and a potential import cycle
  (`repo → storage → repo`); direct calls keep each repo self-contained.
- Trade-offs: Slight inconsistency with `partyRepo` until #506/a follow-up
  normalizes it.

## Proposal to Design Mapping

- Proposal element: Move 27 methods into 4 repos on `runStorageOp`.
  - Design decision: Decision 2, Decision 3, Decision 5.
  - Validation approach: `tsc`, unmodified `storage` test suites, new per-repo
    unit tests, method-count assertion.
- Proposal element: `addMember` keeps `DuplicateMemberError` (Option B).
  - Design decision: Decision 1.
  - Validation approach: `runOp.test.ts` covers `rethrowAsIs` both ways;
    `membershipRepo.test.ts` asserts duplicate key → `DuplicateMemberError`
    (not `StorageError`); the 3 route call sites' `instanceof` checks verified.
- Proposal element: Swallow → `StorageError`; empty/not-found unchanged.
  - Design decision: Decision 3.
  - Validation approach: per-repo tests assert throw-on-failure and
    sentinel-on-empty for each of the 10 converting methods.
- Proposal element: `getMember`/`assertCampaignAccess` and
  `listMembersForCampaign` explicit verification.
  - Design decision: Decision 4.
  - Validation approach: dedicated tests described in Decision 4.
- Proposal element: `lib/storage.ts` public shape unchanged; no caller imports
  change.
  - Design decision: Decision 2.
  - Validation approach: `git grep` of caller imports before/after;
    all `storage` mock-based tests pass unmodified; `tsc`.
- Proposal element: `rethrowAsIs` foundation change is safe.
  - Design decision: Decision 1 trade-offs.
  - Validation approach: additive optional field; `runOp.test.ts` default-path
    regression; cluster-1 repo tests still green.

## Functional Requirements Mapping

- Requirement: All 27 named methods are reachable via `storage.<name>` with
  identical signatures after migration.
  - Design element: Decision 2.
  - Acceptance criteria reference: specs — "Public facade shape is preserved".
  - Testability notes: `tsc` strict; existing `tests/unit/lib/storage*.test.ts`
    and `storage-shares.test.ts` run unmodified; assertion comparing the count
    of own-enumerable `storage` methods before/after (expected unchanged).
- Requirement: A DB driver failure in any of the 27 methods rejects with
  `StorageError` (except `addMember` duplicate key → `DuplicateMemberError`).
  - Design element: Decision 1, Decision 3.
  - Acceptance criteria reference: specs — "Storage operations surface failures
    as StorageError" and "Domain errors bypass StorageError wrapping".
  - Testability notes: each per-repo test mocks `getDatabase`/collection to
    throw; asserts `rejects.toThrow(StorageError)`; `membershipRepo` asserts the
    `11000` path yields `DuplicateMemberError`.
- Requirement: Not-found / empty results remain non-throwing sentinels
  (`null` / `[]` / `false`).
  - Design element: Decision 3.
  - Acceptance criteria reference: specs — "Empty and not-found results do not
    throw".
  - Testability notes: per-repo tests with empty collections assert
    `resolves.toEqual([])` / `toBeNull()` / `toBe(false)`.
- Requirement: `assertCampaignAccess` propagates `StorageError` from `getMember`
  rather than returning 404.
  - Design element: Decision 4.
  - Acceptance criteria reference: specs — "Campaign access checks do not mask
    storage failures as not-found".
  - Testability notes: unit test on `assertCampaignAccess` with `getMember`
    mocked to reject; representative route test asserts HTTP 500 + logged
    `StorageError`.
- Requirement: `#500` characterization tests for this cluster still pass.
  - Design element: Decisions 2-4.
  - Acceptance criteria reference: specs — "Characterization coverage remains
    green".
  - Testability notes: run `tests/unit/lib/storage.characterization.test.ts`;
    any intentional diff documented in the PR body.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Storage failures are observable, not silently absorbed.
  - Design element: Decision 3 (swallow removal), `runStorageOp` error logging.
  - Acceptance criteria reference: specs — "Storage operations surface failures
    as StorageError".
  - Testability notes: assert `logStorageEvent` called with `outcome: "error"`
    on the failure path in per-repo tests.
- Requirement category: operability
  - Requirement: Every migrated DB op emits a structured telemetry event with
    stable `name` + `collection`.
  - Design element: `runStorageOp` `meta` — `name` matches the method name,
    `collection` matches the Mongo collection.
  - Acceptance criteria reference: specs — "Every storage operation emits a
    telemetry event".
  - Testability notes: per-repo tests assert event `name`/`collection`/`outcome`
    on success, not-found, and error paths.
- Requirement category: security
  - Requirement: No secrets or new external calls introduced; `StorageError`
    message does not leak connection strings.
  - Design element: `StorageError` message is `op` + `collection` only; `cause`
    holds the original error (server-side logs).
  - Acceptance criteria reference: existing project security gate (Verity /
    Semgrep / Codacy).
  - Testability notes: security scan in the push-validation gate; assert
    `StorageError.message` contains no interpolated driver detail.
- Requirement category: performance
  - Requirement: No added latency beyond `runStorageOp`'s existing
    `Date.now()` bracketing (already in cluster 1).
  - Design element: no new awaits; cross-repo helpers call sibling functions
    directly (Decision 5).
  - Acceptance criteria reference: n/a (no perf budget defined).
  - Testability notes: existing suites' runtime unchanged; no benchmark added.

## Risks / Trade-offs

- Risk/trade-off: Swallow→rethrow surprises a caller relying on sentinel-as-
  catch-all.
  - Impact: Previously-masked empty state becomes a 500.
  - Mitigation: Re-verified caller enumeration in tasks; explicit tests for the
    4-caller and 2-caller conversions; PR description lists every behavior
    change.
- Risk/trade-off: `rethrowAsIs` regresses `runStorageOp` for all migrated repos.
  - Impact: Cross-cluster.
  - Mitigation: Optional additive field, single branch, default path unchanged
    and regression-tested; cluster-1 repo suites run in validation.
- Risk/trade-off: Delegation typo silently changes a signature.
  - Impact: Type error or wrong runtime behavior.
  - Mitigation: `tsc` strict + unmodified mock-based suites + method-count
    assertion.
- Risk/trade-off: Import cycle `repo → lib/storage → repo`.
  - Impact: Runtime `undefined` at module load.
  - Mitigation: Decision 5 — cross-repo calls use direct sibling imports, never
    the facade.
- Risk/trade-off: Worktree `openspec-shared` submodule friction
  (`[[project_worktree_openspec_schema_missing]]`).
  - Impact: `openspec` tooling breaks mid-change.
  - Mitigation: submodule force-checked-out at worktree creation and verified.

## Rollback / Mitigation

- Rollback trigger: Post-merge spike in 5xx on campaign-scoped routes, or a
  broken `DuplicateMemberError` path (duplicate invites returning 500), or
  cluster-1 repo regressions.
- Rollback steps: `git revert` the squash-merge commit on `main` (single PR,
  `Closes #503`); no schema or data changes to undo. Redeploy.
- Data migration considerations: None — this change moves code only; no
  collection, index, or document shape changes.
- Verification after rollback: `storage` test suites green on the reverted tree;
  campaign route smoke test (list members, access a campaign, add a member,
  re-add same member → expect 409); 5xx rate returns to baseline.

## Operational Blocking Policy

- If CI checks fail: fix forward on the working branch — never `--admin`,
  never bypass branch protection (`[[feedback_no_branch_protection_bypass]]`,
  `[[feedback_no_admin_merge]]`). Re-run the full push-validation gate locally
  before each push.
- If security checks fail (Verity gate / Semgrep / Codacy): remediate the
  finding. Use `verity waive` only to relay a risk a human explicitly accepted
  in review, with the `--reason` citing that source; never waive on agent
  judgment.
- If required reviews are blocked/stale: run the `pr-reviewer` skill; address
  every unresolved thread and resolve it before merge
  (`[[feedback_resolve_pr_comments]]`). `main` is a squash-only ruleset, 0
  approvals, required checks `ci-gate` + Codacy — auto-merge with
  `gh pr merge --squash --auto` (`[[project_main_branch_squash_only_ruleset]]`).
- Escalation path and timeout: if `pr-reviewer` stalls with no progress after 3+
  iterations, stop and report remaining findings to the requester (dougis) for
  a human decision. Do not force-merge.

## Open Questions

- Cross-repo helper calls: direct sibling import (design default) vs. `storage`
  facade (matches `partyRepo`'s mixed style)? Not a blocker for apply.
- Tidy the `loadAllMonsterTemplates`
  `[...userTemplates, globalTemplates].flat()` quirk during migration, or
  preserve verbatim for diff purity (design default: preserve)? Not a blocker.

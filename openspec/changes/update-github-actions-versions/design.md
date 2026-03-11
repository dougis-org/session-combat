## Context

Three CI workflow files reference GitHub Actions pinned to major versions that run on Node.js 20 as their internal runtime. Verified state at implementation time:
- `actions/checkout`: mixed `@v4` (3 occurrences) and `@v6` (3 occurrences) — inconsistent; `@v6` is the current latest (Node 24 runtime, released v6.0.2 Jan 2026)
- `actions/setup-node@v4` (3 occurrences) — `@v6` is the current latest (Node 24 runtime, released v6.2.0)
- `actions/upload-artifact@v4` (2 occurrences) — `@v7` is the current latest (Node 24 runtime, released v7.0.0 Feb 2026)

GitHub deprecated Node 20 as an action runtime. All three actions now have newer major versions shipping with Node 24.

**Proposal mapping:**
| Proposal element | Design decision |
|---|---|
| Standardize checkout versions | Standardize all occurrences to `@v6` (verified latest) |
| Upgrade setup-node | Bump `@v4` → `@v6` (verified latest, Node 24) |
| Upgrade upload-artifact | Bump `@v4` → `@v7` (verified latest, Node 24) |
| Audit versions before updating | Completed: web lookup confirmed exact latest tags |

## Goals / Non-Goals

**Goals:**
- All three workflow files use only action versions whose internal runtime is Node 24 or later
- Consistent version tags across all workflow files (all checkout at `@v6`, all setup-node at `@v6`, all upload-artifact at `@v7`)
- Zero behavioral change to CI job logic

**Non-Goals:**
- Changing the `node-version:` value used to build/test/deploy the application
- Upgrading unrelated actions or workflow tooling
- Refactoring job structure or adding new CI steps

## Decisions

### Decision 1: Verify latest stable major version before editing

**Rationale:** Action maintainers release new major versions independently and on different schedules. A web lookup at implementation time avoids pinning to a non-existent or not-yet-released version.

**Outcome:** Verified versions — checkout: `@v6`, setup-node: `@v6`, upload-artifact: `@v7`.

### Decision 2: Pin to major version tag, not SHA or minor

**Rationale:** The existing convention in this project is major-version tags (`@v4`). Switching to SHA pins would diverge from convention and add maintenance overhead for a maintenance-only change. Major tags receive security patches automatically.

**Alternative considered:** SHA pinning for supply-chain security — rejected as out of scope; a separate security hardening change can address this.

### Decision 3: Standardize all checkout references to `@v6`

**Rationale:** Prior to this change, `actions/checkout` was inconsistently pinned (`@v4` in some jobs, `@v6` in others within the same file). `@v6` is the verified current latest and uses Node 24 — standardising on it is both a correctness and consistency fix.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| New major version introduces breaking input/output changes | Verified at implementation time: `node-version` + `cache` (setup-node) and `name` + `path` + `retention-days` (upload-artifact) are backward-compatible |
| Workflow breaks in CI | All CI checks passed green on the PR branch |

## Rollback / Mitigation

- All changes are in workflow YAML files under version control; revert via `git revert` or PR close
- No application code or data is affected — rollback risk is minimal

## Open Questions

None — all version lookups completed and CI verified green.

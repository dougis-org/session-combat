## Context

Three CI workflow files reference GitHub Actions pinned to major versions that run on Node.js 20 as their internal runtime:
- `actions/checkout@v4` (5 occurrences, plus 3 erroneous `@v6` references)
- `actions/setup-node@v4` (3 occurrences)
- `actions/upload-artifact@v4` (2 occurrences)

GitHub deprecated Node 20 as an action runtime. The successor versions of each action ship with a Node 24 runtime. The `@v6` references to `actions/checkout` are invalid (no such release exists as of this writing) and must be corrected.

**Proposal mapping:**
| Proposal element | Design decision |
|---|---|
| Standardize checkout versions | Single version tag used everywhere; verify latest major |
| Upgrade setup-node | Bump to next major that uses Node 24 |
| Upgrade upload-artifact | Bump to next major that uses Node 24 |
| Audit versions before updating | Web lookup step in tasks to confirm exact latest tags |

## Goals / Non-Goals

**Goals:**
- All three workflow files use only action versions whose internal runtime is Node 24 or later
- Consistent version tags across all workflow files (no mixed `@v4` / `@v6`)
- Zero behavioral change to CI job logic

**Non-Goals:**
- Changing the `node-version:` value used to build/test the application
- Upgrading unrelated actions or workflow tooling
- Refactoring job structure or adding new CI steps

## Decisions

### Decision 1: Resolve latest stable major version at implementation time

**Rationale:** Action maintainers do not always publish new Node-runtime versions under predictable major bumps (e.g., `checkout` moved from v3→v4 for Node 20; v4→v5 for Node 24 is expected but must be confirmed). A web lookup at implementation time is cheaper than assuming and shipping a broken workflow.

**Approach:** Before editing files, verify current latest tags for:
- `actions/checkout`
- `actions/setup-node`
- `actions/upload-artifact`

### Decision 2: Pin to major version tag (e.g., `@v5`), not SHA or minor

**Rationale:** The existing convention in this project is major-version tags (`@v4`). Switching to SHA pins would diverge from convention and add maintenance overhead for a maintenance-only change. Major tags receive security patches automatically.

**Alternative considered:** SHA pinning for supply-chain security — rejected as out of scope; a separate security hardening change can address this.

### Decision 3: Fix `actions/checkout@v6` references to the correct latest version

**Rationale:** `@v6` does not correspond to any published `actions/checkout` release. These references either resolve to an unexpected tag or fail silently. They must be corrected to the verified latest major version in the same update pass.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| New major version introduces breaking input/output changes | Inspect release notes and `with:` inputs for each action before updating |
| `@v6` references currently "work" via some fallback behavior | Verify workflow run history; the fix normalizes behavior regardless |
| Workflow breaks in CI before fix is merged | Branch-based PR; CI failure is observable before merge |

## Rollback / Mitigation

- All changes are in workflow YAML files under version control; revert via `git revert` or PR close
- No application code or data is affected — rollback risk is minimal
- If a new major action version has a breaking `with:` interface change, the fix is to add/rename the required input key

## Open Questions

1. Confirm: does `actions/checkout@v6` currently resolve to a real tag, or is it silently no-op / error? (Check workflow run history or GitHub tag list at implementation time.)

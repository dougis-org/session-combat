## Why

GitHub has deprecated Node.js 20 as the runtime for GitHub Actions, and the current workflows use several actions pinned to major versions (`v4`) that run on Node 20. Additionally, the workflows are inconsistent — some steps reference `actions/checkout@v6` (a non-existent version), while others still reference `@v4`. This must be resolved before GitHub begins hard-failing workflows that depend on deprecated Node runtimes.

## What Changes

- **`actions/checkout`**: Standardize all references from the inconsistent mix of `@v4` / `@v6` to the current latest major version that runs on Node 24
- **`actions/setup-node`**: Upgrade all references from `@v4` to the latest major version that runs on Node 24
- **`actions/upload-artifact`**: Upgrade all references from `@v4` to the latest major version that runs on Node 24
- **Version audit**: Verify the exact latest stable version pins for each action before updating

Affected workflow files:
- `.github/workflows/build-test.yml` (most changes: 4× checkout, 3× setup-node, 2× upload-artifact)
- `.github/workflows/deploy.yml` (1× checkout, 1× setup-node)
- `.github/workflows/resolve-outdated-comments.yml` (1× checkout)

## Capabilities

### New Capabilities
<!-- None — this is a maintenance-only change -->

### Modified Capabilities
- `ci-build-test`: The workflow implementation changes (action version pins), but no behavioral requirements change. No spec delta required — requirement semantics are unchanged.

## Impact

- **CI workflows**: All three workflow files are modified; no behavioral change expected
- **No application code changes**: This is infrastructure-only
- **Deprecation risk removed**: Eliminates GitHub runner warnings/failures caused by Node 20 action runtimes
- **Consistency restored**: Removes the `@v6` references that point to non-existent tags

## Non-Goals

- Changing the Node.js version used to *build* the application (currently `'20'` in `setup-node` `node-version:` — this is separate from the action's own runtime)
- Upgrading any application dependencies
- Modifying workflow logic or job structure

## Risks

- A new major version of an action (e.g., `v5`) may introduce breaking API or input/output changes; each upgrade must be verified against the workflow's `with:` inputs
- `actions/checkout@v6` does not currently exist on the GitHub Marketplace; referencing it may be silently failing or falling back — this needs investigation before assuming it "works"

## Open Questions

1. What is the current latest stable major version for each action as of today? (Requires a web lookup at implementation time — `actions/checkout`, `actions/setup-node`, `actions/upload-artifact`)
2. Does `actions/checkout@v6` exist and work, or is it silently resolving to a fallback? If it doesn't exist, what version introduced Node 24 support?

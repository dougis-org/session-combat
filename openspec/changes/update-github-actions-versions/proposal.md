## Why

GitHub has deprecated Node.js 20 as the runtime for GitHub Actions, and the current workflows use several actions pinned to major versions (`v4`) that run on Node 20. Additionally, the workflows are inconsistent — some steps already reference `actions/checkout@v6` while others still reference `@v4`. This must be resolved before GitHub begins hard-failing workflows that depend on deprecated Node runtimes.

## What Changes

Verified latest versions (Node 24 runtime, confirmed at implementation time):
- **`actions/checkout`**: Standardize all references to `@v6` — the current latest major version running on Node 24
- **`actions/setup-node`**: Upgrade all references from `@v4` to `@v6` — the current latest major version running on Node 24
- **`actions/upload-artifact`**: Upgrade all references from `@v4` to `@v7` — the current latest major version running on Node 24

Affected workflow files:
- `.github/workflows/build-test.yml` (most changes: 4× checkout, 3× setup-node, 2× upload-artifact)
- `.github/workflows/deploy.yml` (1× checkout already correct at `@v6`, 1× setup-node upgraded to `@v6`)
- `.github/workflows/resolve-outdated-comments.yml` (1× checkout already at `@v6`)

Note: `deploy.yml` uses `node-version: '18'` and `build-test.yml` uses `node-version: '20'` for the application's Node runtime — these are unchanged by this PR (separate from the action's own internal runtime).

## Capabilities

### New Capabilities
<!-- None — this is a maintenance-only change -->

### Modified Capabilities
- `ci-build-test`: The workflow implementation changes (action version pins), but no behavioral requirements change. No spec delta required — requirement semantics are unchanged.

## Impact

- **CI workflows**: All three workflow files are modified; no behavioral change expected
- **No application code changes**: This is infrastructure-only
- **Deprecation risk removed**: Eliminates GitHub runner warnings/failures caused by Node 20 action runtimes
- **Consistency restored**: All checkout references now uniformly at `@v6`; setup-node at `@v6`; upload-artifact at `@v7`

## Non-Goals

- Changing the Node.js version used to *build* or *deploy* the application (`node-version:` inputs are untouched)
- Upgrading any application dependencies
- Modifying workflow logic or job structure

## Risks

- A new major version of an action may introduce breaking API or input/output changes; verified at implementation time that `node-version`, `cache` (setup-node) and `name`, `path`, `retention-days` (upload-artifact) inputs are fully backward-compatible in the new versions

## ADDED Requirements

### Requirement: GitHub Actions use Node 24 runtimes
All GitHub Actions used in CI workflows under `.github/workflows/` SHALL reference major versions whose internal action runtime is Node.js 24 or later. Actions pinned to versions that run on Node.js 20 or earlier SHALL NOT be used.

#### Scenario: No deprecated Node runtime warnings on workflow runs
- **WHEN** any CI workflow runs on GitHub Actions
- **THEN** no "Node.js 20 is deprecated" or equivalent deprecation warning appears in the step logs for any action

#### Scenario: Consistent version tags across all workflow files
- **WHEN** the same action (e.g., `actions/checkout`) appears in multiple workflow files
- **THEN** all occurrences reference the same major version tag

### Requirement: All action version tags reference published releases
All `uses: <action>@<version>` references in CI workflow files SHALL reference version tags that exist in the action's GitHub repository. Non-existent version tags (such as `@v6` for an action that has no v6 release) SHALL NOT be used.

#### Scenario: Valid version tag
- **WHEN** a CI workflow references `actions/checkout@vN`
- **THEN** a corresponding `vN` tag exists in the `actions/checkout` GitHub repository

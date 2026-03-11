# ci-actions-currency Specification

## Purpose
Defines requirements for GitHub Actions used in CI workflows to use current, non-deprecated Node.js runtimes and valid published release tags.

## Requirements

### Requirement: GitHub Actions use Node 24 runtimes
All GitHub Actions used in CI workflows under `.github/workflows/` SHALL reference major versions whose internal action runtime is Node.js 24 or later. Actions pinned to versions that run on Node.js 20 or earlier SHALL NOT be used.

#### Scenario: No deprecated Node runtime warnings on workflow runs
- **WHEN** any CI workflow runs on GitHub Actions
- **THEN** no "Node.js 20 is deprecated" or equivalent deprecation warning appears in the step logs for any action

#### Scenario: Consistent version tags across all workflow files
- **WHEN** the same action (e.g., `actions/checkout`) appears in multiple workflow files
- **THEN** all occurrences reference the same major version tag

### Requirement: All action version tags reference published releases
All `uses: <action>@<version>` references in CI workflow files SHALL reference version tags that exist in the action's GitHub repository. Version tags that do not exist in the corresponding action repository SHALL NOT be used.

#### Scenario: Valid version tag
- **WHEN** a CI workflow references an action at a major version tag
- **THEN** a corresponding release tag exists in that action's GitHub repository

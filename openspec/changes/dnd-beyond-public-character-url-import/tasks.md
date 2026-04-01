## Preparation

Implementer: GitHub Copilot
Reviewer: human reviewer
Approval expectation: proposal approval required before implementation begins

- [x] 1.1 Check out `main` and pull the latest remote changes with fast-forward only
- [x] 1.2 Create a working branch for the change and push it to the remote before any implementation work begins
- [x] 1.3 Review the existing import route, server importer, and UI against the approved proposal and spec delta
- [x] 1.4 Confirm the test coverage needed for access-based acceptance, failure handling, and verbatim URL display

## Execution

- [x] 2.1 Update the D&D Beyond import server path so acceptance is based on successful access and parsing rather than URL shape
- [x] 2.2 Update the characters import UI copy to instruct users to enter a publicly available URL
- [x] 2.3 Preserve the exact entered URL in transient display state and any related response data
- [x] 2.4 Add or adjust unit and integration tests for accessible URL success, inaccessible URL failure, parse failure, and verbatim URL display

## Validation

- [x] 3.1 Run the focused unit and integration test suites covering D&D Beyond import behavior
- [x] 3.2 Run lint for the touched files and fix any issues introduced by the change
- [x] 3.3 Verify the UI import flow still handles duplicate-name conflicts and overwrite behavior unchanged

## PR and Merge

- [ ] 4.1 Create a pull request from the feature branch to `main`
- [ ] 4.2 Request review and monitor CI status until all required checks are green
- [ ] 4.3 Address every review comment with targeted follow-up commits on the working branch, then push the updates
- [ ] 4.4 Re-run validation after each round of fixes until no blocking comments or failures remain
- [ ] 4.5 Enable auto-merge only when CI is green and no blocking review comments remain

## Post-Merge

- [ ] 5.1 Checkout `main` and pull the merged changes after the PR is merged
- [ ] 5.2 Verify the merged changes are present on `main`
- [ ] 5.3 Mark all tasks complete and sync the approved spec delta back into `openspec/specs/dnd-beyond-character-import/spec.md` if required by the archive flow
- [ ] 5.4 Archive the change directory as a single atomic commit that includes both the archive copy and deletion of the original change directory
- [ ] 5.5 Push the archive commit to `main`
- [ ] 5.6 Prune merged local branches after archive and verify the repository is clean
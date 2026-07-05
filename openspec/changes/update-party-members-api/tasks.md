## Setup

- [x] Ensure on default branch and pull latest changes
- [x] Create a feature branch for the change (`git checkout -b feature/update-party-members-api`)

## Tasks

- [x] 1. Write tests FIRST based on `tests.md` (TDD/BDD workflow). This step must be completed, and tests must be failing, before moving to implementation.
- [x] 2. Implement the new route `app/api/campaigns/[id]/members/[userId]/parties/[partyId]/route.ts`:
  - Validate the caller is the `userId` OR the GM.
  - Validate `userId` is an active member of the campaign.
  - Load party, verify it belongs to the campaign.
  - Call `storage.loadCharacters(userId)` to validate all `characterIds` in payload belong to `userId`.
  - Calculate `addedAt` for new IDs and `leftAt` for removed IDs belonging to `userId`. Leave other members' characters intact.
  - Save party via `storage.saveParty`.
- [x] 3. Ensure all tests from Step 1 are now passing.
- [x] 4. Perform pre-PR self-review using `openspec-review-code` skill to ensure code quality, minimize complexity, and eliminate duplication.
- [x] 5. Commit and push the branch.
- [x] 6. Open a Pull Request and verify all CI checks pass.

## Review and Merge

- [ ] Address review feedback.
- [ ] Merge PR to the default branch.

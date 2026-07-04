## Setup

- [x] Ensure on default branch and pull latest changes
- [x] Create a feature branch for the change (`git checkout -b feature/update-party-members-api`)

## Tasks

- [x] 1. Write tests FIRST based on `tests.md` (TDD/BDD workflow). This step must be completed, and tests must be failing, before moving to implementation.
- [x] 2. Implement the new route `app/api/campaigns/[id]/members/[memberId]/parties/[partyId]/route.ts`:
  - Validate the caller is the `memberId` OR the GM.
  - Validate `memberId` is an active member of the campaign.
  - Load party, verify it belongs to the campaign.
  - Call `storage.loadCharacters(memberId)` to validate all `characterIds` in payload belong to `memberId`.
  - Calculate `addedAt` for new IDs and `leftAt` for removed IDs belonging to `memberId`. Leave other members' characters intact.
  - Save party via `storage.saveParty`.
- [x] 3. Ensure all tests from Step 1 are now passing.
- [ ] 4. Perform pre-PR self-review using `openspec-review-code` skill to ensure code quality, minimize complexity, and eliminate duplication.
- [ ] 5. Commit and push the branch.
- [ ] 6. Open a Pull Request and verify all CI checks pass.

## Review and Merge

- [ ] Address review feedback.
- [ ] Merge PR to the default branch.

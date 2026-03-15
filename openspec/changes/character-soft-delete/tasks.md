## 1. Setup and Type Definitions

- [x] 1.1 Add `deletedAt?: Date` field to Character interface in lib/types.ts  
- [x] 1.2 Update Character interface JSDoc to document the new deletedAt field purpose
- [x] 1.3 Verify TypeScript compilation passes with new field

## 2. Database Setup - View and Index

- [x] 2.1 Create MongoDB view `characters_active` that filters `{ deletedAt: null }`
- [x] 2.2 Create MongoDB index on `characters.deletedAt` field for view performance
- [x] 2.3 Verify view creation in test/staging database
- [x] 2.4 Test view returns only active (non-deleted) characters

## 3. Storage Layer Implementation

- [x] 3.1 Update collection references in storage.ts to query `characters_active` view instead of `characters`
- [x] 3.2 Update `loadCharacters()` to query `characters_active` view
- [ ] 3.3 Write unit test for loadCharacters() returning only active characters (deletedAt = null)
- [ ] 3.4 Write unit test for existing characters without deletedAt field being treated as active
- [ ] 3.5 Write unit test for deleteCharacter() to verify it sets deletedAt timestamp
- [x] 3.6 Update deleteCharacter() in lib/storage.ts to perform update (set deletedAt) instead of deleteOne
- [x] 3.7 Verify party cleanup logic still executes after soft delete (update party characterIds)
- [ ] 3.8 Add unit test for party cleanup occurring atomically with soft delete

## 4. API Endpoint Updates

- [x] 4.1 Write integration test for GET /api/characters to verify deleted characters excluded from list
- [x] 4.2 Verify existing GET /api/characters endpoint works with updated storage (querying view)
- [x] 4.3 Write integration test for GET /api/characters/{id} returning 404 for deleted character
- [x] 4.4 Update GET /api/characters/{id} handler to return 404 when character has deletedAt != null
- [x] 4.5 Write integration test for DELETE /api/characters/{id} setting deletedAt timestamp
- [x] 4.6 Verify DELETE /api/characters/{id} response message remains appropriate
- [x] 4.7 Write integration test for deleted character disappearing from list after deletion

## 5. UI and Hooks Verification

- [ ] 5.1 Write test for character list hook excluding soft-deleted characters (via view)
- [ ] 5.2 Verify character detail pages handle 404 from deleted characters gracefully
- [ ] 5.3 Write test scenario: user deletes character, list refreshes, character disappears
- [ ] 5.4 Test character selection dropdown/modal excludes deleted characters
- [ ] 5.5 Verify party creation/editing doesn't reference deleted characters

## 6. Data Integrity and Edge Cases

- [ ] 6.1 Write test: double-delete of same character returns appropriate response
- [ ] 6.2 Write test: delete character that's in multiple parties removes from all
- [ ] 6.3 Write test: soft-deleted character data remains intact (no field mutations)
- [ ] 6.4 Write test: backwards compatibility with pre-soft-delete characters (no deletedAt field)
- [ ] 6.5 Write test: mixed active and deleted characters queried correctly via view

## 7. Testing and Validation

- [x] 7.1 Run unit test suite: `npm run test:unit` and verify all new tests pass
- [x] 7.2 Run integration test suite: `npm run test:integration` and verify all tests pass
- [ ] 7.3 Run full test suite: `npm run test` and verify no regressions
- [x] 7.4 Verify test coverage for storage.ts to include soft delete path
- [x] 7.5 Verify test coverage for API endpoint to include soft delete path

## 8. Code Quality and Documentation

- [ ] 8.1 Update JSDoc comments on deleteCharacter() to document soft delete behavior
- [ ] 8.2 Update JSDoc comments on loadCharacters() to document view usage
- [ ] 8.3 Add inline comment explaining the characters_active view purpose
- [x] 8.4 Run ESLint: `npm run lint` and fix any new linting issues
- [x] 8.5 Verify no TypeScript errors: `npm run build`

## 9. Manual Testing

- [ ] 9.1 Test UI: Create a character and delete it; verify it disappears from list
- [ ] 9.2 Test UI: After delete, verify character detail page returns appropriate error
- [ ] 9.3 Test UI: Create multiple characters; verify only active ones display
- [ ] 9.4 Test API: Call DELETE endpoint, verify character no longer in GET list
- [ ] 9.5 Test API: Call DELETE on invalid/nonexistent character, verify error handling
- [ ] 9.6 Test UI: In party creation, verify deleted characters don't appear as options

## 10. Execution Checklist

### Before Implementation
- [x] 10.1 Check out main branch: `git checkout main`
- [x] 10.2 Pull latest changes: `git pull origin main`
- [x] 10.3 Create feature branch: `git checkout -b feat/character-soft-delete`
- [x] 10.4 Verify environment setup: `npm install` and environment variables configured

### During Implementation
- [x] 10.5 Follow TDD: write test first, then implementation for each task
- [x] 10.6 Commit frequently with clear messages: `git commit -m "..."`
- [x] 10.7 After each major section, verify tests pass: `npm run test`

### Post-Implementation
- [x] 10.8 Run full build: `npm run build`
- [ ] 10.9 Run full test suite: `npm run test`
- [x] 10.10 Run linting: `npm run lint`

## 11. PR and Merge

- [ ] 11.1 Create pull request with title "feat: Implement character soft delete (#77)"
- [ ] 11.2 Reference issue #77 in PR description
- [ ] 11.3 Include summary of changes: type modifications, view creation, storage layer updates, API updates, tests
- [ ] 11.4 Verify all GitHub checks pass (build, tests, lint)
- [ ] 11.5 Request human review from team
- [ ] 11.6 Address any review comments and push updates
- [ ] 11.7 Merge pull request using squash or regular merge (maintain clean history)

## 12. Post-Merge

- [ ] 12.1 Verify deployed version includes soft delete functionality and view
- [ ] 12.2 Monitor for any issues related to character deletion in production
- [ ] 12.3 Delete feature branch: `git branch -d feat/character-soft-delete`
- [ ] 12.4 Archive this change using `/opsx:archive` when complete
- [ ] 12.5 Close GitHub issue #77


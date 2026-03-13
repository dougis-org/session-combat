# Import Public D&D Beyond Characters

Closes #39

## Summary

This change adds authenticated import of a public D&D Beyond character into the
local character library.

Users can paste a canonical public D&D Beyond character URL on the Characters
page, import the character into the app, review normalization warnings, and
explicitly overwrite an existing same-name character instead of merging data
silently.

## Implementation

- Add `POST /api/characters/import` for authenticated imports
- Add `lib/dndBeyondCharacterImport.ts` to validate canonical URLs, fetch the
  public D&D Beyond character-service payload, normalize the response, and
  return warnings for unsupported or downgraded fields
- Update the Characters page with import UI, duplicate conflict handling,
  overwrite confirmation, and warning display
- Preserve the existing local character ID when overwriting a same-name record
- Migrate linting to ESLint flat config and clean up existing repo lint issues
  so the new lint gate stays green
- Sync the approved capability spec into `openspec/specs/dnd-beyond-character-import/spec.md`

## Validation

- `npm run test:unit -- --runInBand tests/unit`
- `npm run test:integration -- --runInBand tests/integration`
- `npm run lint`
- `npm run build`
- `MONGODB_URI=mongodb://localhost:27017 MONGODB_DB=session-combat-e2e CHROMIUM_ONLY=1 npx playwright test tests/e2e/combat.spec.ts --grep "import a D&D Beyond character"`

## Reviewer Notes

- Import input is the canonical public page URL, but the server resolves that
  URL to D&D Beyond's public character-service payload instead of scraping
  rendered HTML
- Duplicate-name detection is case-insensitive and scoped to the authenticated
  user's character library
- Overwrite is a full replacement, not a merge, and keeps the existing local ID
- The only new security note observed during review is a low-severity cleartext
  HTTP warning on the local integration-test mock service, not on the production
  import path

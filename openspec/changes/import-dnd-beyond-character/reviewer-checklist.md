# Reviewer Checklist

## Core Behavior

- [ ] Import accepts canonical public D&D Beyond URLs in the form `https://www.dndbeyond.com/characters/<id>/<shareCode>`
- [ ] Unauthenticated import requests are rejected
- [ ] Invalid or unsupported URLs fail clearly without persisting data
- [ ] Duplicate-name imports return a conflict rather than silently overwriting
- [ ] Explicit overwrite replaces the character and preserves the existing local ID
- [ ] Successful imports surface normalization warnings when fields are omitted or downgraded

## Normalization

- [ ] Required identity and class data are enforced
- [ ] Unsupported optional values are omitted with warnings rather than persisted unsafely
- [ ] Derived values such as AC, HP, saving throws, skills, senses, and abilities look correct for the sample fixture
- [ ] Remote fetches are timeout-bounded

## Validation Evidence

- [ ] Unit import suite passed
- [ ] Integration import suites passed
- [ ] Lint passed with the new ESLint flat-config gate
- [ ] Build passed with `/api/characters/import` present
- [ ] Focused Playwright regression passed for import conflict and overwrite flow

## Risks To Inspect

- [ ] Dependence on D&D Beyond public character-service payload shape
- [ ] Name-based overwrite ambiguity for users who intentionally store multiple same-name variants
- [ ] Behavior if D&D Beyond removes or changes the public payload contract

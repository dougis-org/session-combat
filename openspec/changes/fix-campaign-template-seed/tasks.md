## 1. Script Logic

- [x] 1.1 Parse `process.argv` in `lib/scripts/seedCampaignTemplates.ts` to check for `--force` flag.
- [x] 1.2 Modify the seeding logic in `seedCampaignTemplates.ts` to use `updateOne` with `{ $set: campaign }` and `{ upsert: true }` when `--force` is present.
- [x] 1.3 Add a console log indicating when templates are forcefully updated versus skipped.

## 2. Documentation

- [x] 2.1 Update `README.md` or equivalent project documentation with instructions on how to use `npm run seed -- --force`.
- [x] 2.2 Add or update a `seed:force` script shortcut in `package.json` for convenience (e.g. `"seed:force": "npx tsx lib/scripts/seedCampaignTemplates.ts --force"`).

## 3. Pull Request Review

- [ ] 3.1 Perform a PR review, address comments/feedback, and ensure all required checks pass.

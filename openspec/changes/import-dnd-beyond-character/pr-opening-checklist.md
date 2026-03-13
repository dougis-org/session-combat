# PR Opening Checklist

## Branch and Remote

- Branch: `import-dnd-beyond-character`
- Remote: `https://github.com/dougis-org/session-combat.git`

## Before Opening The PR

1. Review the working tree:
   - `git status --short`
2. Stage the intended changes:
   - `git add .`
3. Create a commit:
   - Suggested subject: `Add D&D Beyond character import flow`
4. Push the branch:
   - `git push -u origin import-dnd-beyond-character`

## PR Body Sources

- Full reviewer summary:
  - `openspec/changes/import-dnd-beyond-character/pr-summary.md`
- Concise PR body:
  - `openspec/changes/import-dnd-beyond-character/pr-body.md`
- Reviewer checklist:
  - `openspec/changes/import-dnd-beyond-character/reviewer-checklist.md`

## GitHub CLI Flow

Create the PR with GitHub CLI after the branch is pushed:

```bash
gh pr create \
  --base main \
  --head import-dnd-beyond-character \
  --title "Import public D&D Beyond characters" \
  --body-file openspec/changes/import-dnd-beyond-character/pr-body.md
```

## After PR Creation

1. Request human review.
2. Add or paste the reviewer checklist into the PR description or a review comment.
3. Request Copilot or automated review if your workflow supports it.
4. Keep auto-merge disabled until required checks are green.

## Validation Commands

Run or rerun as needed before pushing:

```bash
npm run lint
npm run build
npm run test:unit -- --runInBand tests/unit
npm run test:integration -- --runInBand tests/integration
MONGODB_URI=mongodb://localhost:27017 MONGODB_DB=session-combat-e2e CHROMIUM_ONLY=1 npx playwright test tests/e2e/combat.spec.ts --grep "import a D&D Beyond character"
```

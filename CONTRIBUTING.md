# Contributing to Session Combat

## Guidelines

- Follow TDD: write tests first, then implementation
- Keep methods under 25 lines
- Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`
- Run `npm run lint` before submitting
- Ensure all tests pass: `npm run test`

## Code Style

- TypeScript strict mode enabled
- ESLint configured; follow all rules
- Avoid console.log; use console.debug for non-critical output
- No production code without tests

## Branch Naming

- Feature: `feature/<issue-number>-short-description`
- Bug: `fix/<issue-number>-short-description`
- Docs: `docs/<issue-number>-short-description`

## PR Requirements

- Link to GitHub issue
- Include test evidence
- Document breaking changes
- Request review from CODEOWNERS


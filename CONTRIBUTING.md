# Contributing to session-combat

Thank you for your interest in contributing to session-combat! This document outlines the standards and expectations for contributions.

## Repository Standards

### Change Management (OpenSpec)

This repository requires the use of **OpenSpec** for all feature development, bug fixes, and non-trivial changes. 

#### Prerequisites & Setup
The repository utilizes a custom OpenSpec schema defined in the [openspec-shared](https://github.com/dougis-org/openspec-shared) repository. This must be initialized and updated as a Git submodule:
1. **Initialize/update the submodule**:
   ```sh
   git submodule update --init --recursive
   ```
   Or if configuring from scratch, add the submodule and run the bootstrap script as outlined in the [openspec-shared README](https://github.com/dougis-org/openspec-shared/blob/main/README.md):
   ```sh
   git submodule add https://github.com/dougis-org/openspec-shared .github/openspec-shared
   sh .github/openspec-shared/bootstrap.sh
   ```

#### Contribution & Change Flow
All work in this repository must follow this specific process:
1. **Capture details in a GitHub issue**: Create a GitHub issue representing the work (it can be a detailed spec or a simple one-liner).
2. **Self-assign**: When starting work on any issue, assign it to yourself.
3. **Explore**: Use `/openspec:explore` (or the `/opsx-explore` workflow) to brainstorm design decisions, passing the GitHub issue as the context. The custom schema will facilitate reading the issue details.
4. **Propose**: Once all questions in explore are answered, switch to proposal mode to generate all required OpenSpec change artifacts (e.g. proposal, design, tasks).
5. **Apply & Implement**: Run `/openspec:apply` (or `/opsx-apply`) to begin implementation. Note that the tasks in our custom schema include performing a PR review, addressing feedback/comments, and ensuring all required CI/CD checks pass.
6. **Complete & Sync**: Once the PR is merged (which requires all reviewer comment threads to be fully resolved), run `/openspec:apply` (or `/opsx-apply`) again, noting that the PR has been merged. This will complete the change flow, triggering the archiving of the change folder and updating the main branch with the merged specifications.

### Code Quality

- Follow the existing code style and conventions
- Use TypeScript for type safety
- Ensure all code passes linting (`npm run lint`)
- Write clear, self-documenting code with meaningful variable and function names

### Git Workflow

- Create feature branches from the default branch (pull the default first)
- Use descriptive commit messages following the conventional commits format when possible
- Keep commits focused and atomic
- Ensure all tests pass before submitting a pull request

### Testing Guidance

For jest setup conventions and the import pattern all test files must follow, see [docs/TESTING.md](docs/TESTING.md).

#### Mocks vs Integration

**We prefer integration tests using Testcontainers over complex mocks.**

#### When to Use Integration Tests (Preferred)

Integration tests should be your **first choice** when:

- Testing API routes that interact with databases or external services
- Validating end-to-end workflows
- Testing behavior that depends on real infrastructure (databases, message queues, etc.)
- The external dependency can be easily containerized

Benefits:

- Tests real behavior, not mocked behavior
- Catches integration issues early
- Reduces maintenance burden compared to complex mocks
- Increases confidence in deployments

See [docs/INTEGRATION_TESTS.md](docs/INTEGRATION_TESTS.md) for detailed guidance on writing integration tests with Testcontainers.

#### When Mocks Are Acceptable
Mocks are appropriate when:
- Testing pure business logic without external dependencies
- The external service cannot be easily containerized (e.g., third-party APIs with no local equivalent)
- Performance is critical (e.g., unit tests that run in milliseconds)
- Testing error conditions that are difficult to reproduce with real dependencies
- Testing UI components in isolation

#### Reviewer Expectations
When submitting a pull request:
1. **Integration tests are expected** for new API routes or features that interact with databases/services
2. If you choose mocks over integration tests, **document your rationale** in the PR description
3. Reviewers will ask for integration tests if the justification for mocks is not compelling
4. Consider whether your mocks are testing real behavior or just implementation details

### Documentation
- Update relevant documentation when changing functionality
- Add JSDoc comments for public APIs
- Keep the README up to date with new features

## Pull Request Process

1. Self-review (or use an agentic reviewer) before cutting the PR, review for quality, duplication, and complexity issues
2. Fill out the pull request template completely
3. Ensure all tests pass locally
4. Address any CI/CD failures
5. Respond to reviewer feedback promptly
6. All reviewer threads must be resolved before code can merge
7. Squash commits if requested before merging

## Questions?

Open an issue for questions or clarifications about contributing.

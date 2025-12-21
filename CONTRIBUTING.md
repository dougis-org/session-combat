# Contributing to session-combat

Thank you for your interest in contributing to session-combat! This document outlines the standards and expectations for contributions.

## Repository Standards

### Code Quality

- Follow the existing code style and conventions
- Use TypeScript for type safety
- Ensure all code passes linting (`npm run lint`)
- Write clear, self-documenting code with meaningful variable and function names

### Git Workflow

- Create feature branches from the default branch (pull the default first)
- Use descriptive commit messages following conventional commits format when possible
- Keep commits focused and atomic
- Ensure all tests pass before submitting a pull request

### Testing Guidance: Mocks vs Integration

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

1. Fill out the pull request template completely
2. Ensure all tests pass locally
3. Address any CI/CD failures
4. Respond to reviewer feedback promptly
5. Squash commits if requested before merging

## Questions?

Open an issue for questions or clarifications about contributing.

# AI Agent Contribution Guidelines

Guidelines for AI agents contributing to this repository.  
Follow the [CONTRIBUTING.md](CONTRIBUTING.md) standards and these additional requirements.

## Core Principles

- Well-documented, maintainable contributions
- Human review before merge
- No breaking changes without documented approval
- Test-Driven Development (TDD): write failing tests first, then implement
- **NEVER** reduce quality for token constraints or speed

## Documentation

- Include change summary and rationale in PR descriptions
- Pass all linting checks
- Adhere to line length limits (80-120 chars)

## Testing

- Provide evidence of passing tests (never skip)
- Use data-driven parameterized tests when possible
- Cover typical and edge cases
- Prefer integration tests over mocks

## Tooling

- Use MCP servers first for any task they cover; never request a raw shell session.
- If no MCP tool exists for the task, run the command via `start_process` (desktop commander)
  only.
- Examples: use MCP `read_file`/`write_file` for files; GitHub MCP for git; Jira/Confluence
  MCP for tickets; `start_process` for commands like `gradlew clean test` or `python -m pytest` when no
  MCP wrapper exists.

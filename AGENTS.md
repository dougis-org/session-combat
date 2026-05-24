# AI Agent Contribution Guidelines

Guidelines for AI agents contributing to this repo.
Follow [CONTRIBUTING.md](CONTRIBUTING.md) standards plus these requirements.

## Core Principles

- Well-documented, maintainable contributions
- Human review before merge
- No breaking changes without documented approval
- Test-Driven Development (TDD): write failing tests first, then implement
- **Mandatory OpenSpec usage**: Use the OpenSpec toolchain and workflows (`/openspec:explore`, `/openspec:propose`, `/openspec:apply` or their `/opsx-*` workflow equivalents) for all feature development and bug fixes. The repository uses a custom OpenSpec schema managed via the `.github/openspec-shared` Git submodule. Never implement changes without an active OpenSpec change.

## OpenSpec Workflow

AI agents must strictly follow the OpenSpec framework for all contributions. The workspace includes specialized workflows and skills under `.agent/` designed around a custom OpenSpec schema. The workflow requires the submodule to be initialized (`git submodule update --init --recursive`) and bootstrapped.

The contribution process is structured as follows:
1. **GitHub Issue**: The work must be captured in a GitHub issue (ranging from a detailed spec to a one-liner).
2. **Assignment**: When starting on any issue, assign it to yourself.
3. **Explore**: Run `/openspec:explore` (or the `/opsx-explore` workflow) passing the GitHub issue as the context. The custom schema will facilitate reading the issue details. Ensure all questions are answered in this phase.
4. **Propose**: Switch to proposal mode (`/opsx-propose` or `openspec-propose` skill) to initialize the change and generate all required artifacts (e.g. proposal, design, tasks).
5. **Apply & Implement**: Run `/openspec:apply` (or `/opsx-apply`) to begin implementation. Note that the tasks generated under the custom schema explicitly include performing a PR review, addressing comments/feedback, and ensuring all required checks pass.
6. **Complete & Sync**: Once the PR is merged (which requires all reviewer comment threads to be fully resolved), run `/openspec:apply` (or `/opsx-apply`) again, noting that the PR has been merged. This will automatically complete the change flow, archiving the change folder and updating the main branch with the merged specifications.

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

- Use the most efficient and robust tool for the task at hand.
- **File & Search Operations**: Prefer high-fidelity, dedicated filesystem and search tools (like `view_file`, `replace_file_content`, `write_to_file`, and `grep_search`) over raw shell commands (such as `cat`, `sed`, `grep`, or redirection) to ensure precise, structured editing and viewing.
- **System Commands & CLIs**: Run shell commands and utilize system CLIs via terminal tools where it makes sense (e.g., executing the `openspec` CLI, performing `git` version control operations, running build/lint commands like `npm run lint`, and running tests).
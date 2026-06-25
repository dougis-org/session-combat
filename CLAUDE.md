# OpenWolf

@.wolf/OPENWOLF.md

This project uses OpenWolf for context management. Read and follow .wolf/OPENWOLF.md every session. Check .wolf/cerebrum.md before generating code. Check .wolf/anatomy.md before reading files.


# Claude Code Instructions

## Tool Preferences

**Prefer MCP tooling over Bash for all file operations and searches.**

- Use `mcp__oraios_serena__read_file` or `mcp__oraios_serena__search_for_pattern` instead of `sed`, `awk`, `cat`, `grep` via Bash
- Use `mcp__oraios_serena__find_symbol` / `mcp__oraios_serena__get_symbols_overview` for code navigation
- Use `mcp__oraios_serena__replace_content` or `mcp__oraios_serena__replace_symbol_body` for edits when possible
- Fall back to Claude Code native tools (Read, Edit, Grep, Glob) only when MCP tools cannot accomplish task
- Only use Bash for system commands with no MCP equivalent (git, npm, node, etc.)

<!-- verity-memory:start -->
## Project Memory

This project has a knowledge graph maintained at `.verity/memory/`. Before starting
non-trivial work, scan `.verity/memory/index.md` for decisions, gotchas, and patterns
that may apply to the change you are about to make. Open specific node files via
the Read tool when the title or scope suggests relevance.

The graph is auto-maintained by Verity. Files at `.verity/memory/_archive/` are
superseded — ignore them unless investigating history.

> Durable, hand-curated guidance goes in the preserve region below (it survives
> regeneration) or anywhere OUTSIDE these markers. Everything else between the
> markers is tool-owned and overwritten on each run.

<!-- verity-memory:preserve -->
<!-- Add binding, hand-curated guidance here; it survives Verity regeneration. -->
<!-- /verity-memory:preserve -->
<!-- verity-memory:end -->

## Post-task reflection
When a task is complete (you've created a PR, the user says "done" or "ship it",
or the work is clearly finished), ask the user one question before moving on:

> "Quick reflection for future agents: what's one thing you learned during this
> task that would help next time? A decision, a gotcha, a pattern — anything
> worth remembering. (Say 'skip' to skip.)"

If the user responds (not "skip"), run `verity reflect --user-input "<their response>"`.

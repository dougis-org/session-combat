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
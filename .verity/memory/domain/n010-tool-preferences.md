---
schema: 1
id: n010-tool-preferences
kind: domain
title: "Tool Preferences"
confidence: 0.6
status: active
source: extractor
created_by: seed
created_at: 2026-06-25T21:18:08.217Z
updated_at: 2026-06-25T21:18:08.217Z
---

# Tool Preferences

**Prefer MCP tooling over Bash for all file operations and searches.**

- Use `mcp__oraios_serena__read_file` or `mcp__oraios_serena__search_for_pattern` instead of `sed`, `awk`, `cat`, `grep` via Bash
- Use `mcp__oraios_serena__find_symbol` / `mcp__oraios_serena__get_symbols_overview` for code navigation
- Use `mcp__oraios_serena__replace_content` or `mcp__oraios_serena__replace_symbol_body` for edits when possible
- Fall back to Claude Code native tools (Read, Edit, Grep, Glob) only when MCP tools cannot accomplish task
- Only use Bash for system commands with no MCP equivalent (git, npm, node, etc.)

<!-- verity-memory:start -->

_Seeded from CLAUDE.md. Edit or archive if outdated._

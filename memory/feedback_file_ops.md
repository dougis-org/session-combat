---
name: Avoid shell commands for file operations
description: Use MCP Serena tools or native Claude Code tools (Read, Write, Glob) for file ops; only use Bash for git/npm/node
type: feedback
---

Avoid using Bash shell commands (cp, mkdir, rm, mv, cat, grep, etc.) for file operations.

**Why:** User preference — CLAUDE.md and personal preference require MCP tooling or native tools for all file operations.

**How to apply:**
- For copying files: Read the file, then Write to new location
- For listing files: Use Glob
- For deleting tracked files: Use `git rm` via Bash (git is OK)
- For creating directories: Use Write (will create parent dirs) or Serena MCP
- Only use Bash for: git, npm, node, and other system commands with no MCP equivalent

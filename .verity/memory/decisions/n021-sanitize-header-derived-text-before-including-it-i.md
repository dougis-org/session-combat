---
schema: 1
id: n021-sanitize-header-derived-text-before-including-it-i
kind: decision
title: "Sanitize header-derived text before including it in GitHub issue bodies"
domains: ["security", "github-issues"]
file_globs: []
confidence: 0.92
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-06-28T21:11:11.935761+00:00
updated_at: 2026-06-28T21:11:11.844+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Sanitize header-derived text before including it in GitHub issue bodies

Any metadata copied from request headers must be sanitized before it is written into an issue body. Header values are untrusted input and can contain control characters or Markdown that would change the rendered issue content or inject misleading text. This applies wherever request-derived metadata is assembled into GitHub-facing text, especially issue creation paths.

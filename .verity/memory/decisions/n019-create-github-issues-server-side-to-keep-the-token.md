---
schema: 1
id: n019-create-github-issues-server-side-to-keep-the-token
kind: decision
title: "Create GitHub issues server-side to keep the token off the client"
domains: ["security", "feedback", "github"]
file_globs:
  - "app/api/**/route.ts"
confidence: 0.91
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-06-28T16:33:06.098501+00:00
updated_at: 2026-06-28T16:33:06.008+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Create GitHub issues server-side to keep the token off the client

When feedback submission creates GitHub issues, the request must be handled on the server rather than from browser code. This keeps the GitHub token out of client bundles and prevents untrusted clients from calling the issue-creation API directly. Apply this to any feedback/help flow that reaches GitHub or another privileged external service from the app.

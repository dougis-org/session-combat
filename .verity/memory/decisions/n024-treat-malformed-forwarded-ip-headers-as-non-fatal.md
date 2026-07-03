---
schema: 1
id: n024-treat-malformed-forwarded-ip-headers-as-non-fatal
kind: decision
title: "Treat malformed forwarded IP headers as non-fatal and fall back to x-real-ip"
domains: ["networking", "http", "server"]
file_globs: []
confidence: 0.78
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-01T01:03:06.99619+00:00
updated_at: 2026-07-01T01:03:06.904+00:00
related: ["n019-create-github-issues-server-side-to-keep-the-token"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Treat malformed forwarded IP headers as non-fatal and fall back to x-real-ip

When deriving client IPs from proxy headers, invalid `x-forwarded-for` / forwarded-IP values must not break the request path. The helper should ignore malformed entries, try `x-real-ip` next, and only return `unknown` when no trusted header yields a usable address. This keeps request handling resilient to bad or partially configured proxies and prevents IP parsing from becoming a hard failure in routes that depend on it.

## Related

**Related:**
- [[n019-create-github-issues-server-side-to-keep-the-token]]


---
schema: 1
id: n022-restrict-feedback-issue-context-urls-to-same-origi
kind: decision
title: "Restrict feedback issue context URLs to same-origin or https"
domains: ["security", "feedback-api", "github-issues"]
file_globs: []
confidence: 0.91
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-06-29T12:39:53.807381+00:00
updated_at: 2026-06-29T12:39:53.695+00:00
related: ["n018-store-feedback-rate-limits-in-a-ttl-backed-mongodb"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Restrict feedback issue context URLs to same-origin or https

When the feedback API turns a page URL into GitHub issue context, it must reject anything except same-origin relative URLs or explicit https URLs. This is a safety constraint, not a UX preference: allowing arbitrary schemes or origins can inject untrusted links into issue bodies and make downstream issue content misleading or unsafe. Apply this anywhere feedback payloads are normalized into issue text or metadata.

## Related

**Related:**
- [[n018-store-feedback-rate-limits-in-a-ttl-backed-mongodb]]


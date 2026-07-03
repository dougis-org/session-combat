---
schema: 1
id: n026-use-relative-links-for-spec-references
kind: decision
title: "Use relative links for spec references"
domains: ["documentation", "repository"]
file_globs:
  - "docs/**/*.md"
confidence: 0.82
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-01T01:32:04.69692+00:00
updated_at: 2026-07-01T01:32:04.604+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Use relative links for spec references

Keep links to repository specs relative, not absolute, so they remain valid across forks, renamed remotes, and branch previews. Absolute URLs couple the documentation to a specific host/path and break portability when the repo is mirrored or reviewed outside its original origin. Apply this any time one repo document links to another internal spec or guide.

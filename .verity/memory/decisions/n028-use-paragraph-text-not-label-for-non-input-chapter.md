---
schema: 1
id: n028-use-paragraph-text-not-label-for-non-input-chapter
kind: decision
title: "Use paragraph text, not <label>, for non-input chapter headings"
domains: ["accessibility", "react"]
file_globs: []
confidence: 0.91
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-01T01:44:09.511146+00:00
updated_at: 2026-07-01T01:44:09.419+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Use paragraph text, not <label>, for non-input chapter headings

Do not use a <label> for chapter heading text unless it is actually labeling a form control. A label without an associated input is invalid semantics and harms accessibility tooling, so editor headings and other read-only display text should be rendered as plain text elements instead. Apply this anywhere the UI shows descriptive text that is not meant to activate or name an input.

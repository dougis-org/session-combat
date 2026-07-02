---
schema: 1
id: n029-open-the-chapters-accordion-before-asserting-chapt
kind: decision
title: "Open the chapters accordion before asserting chapter-empty states"
domains: ["react", "testing", "ui"]
file_globs: []
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-01T04:17:25.573398+00:00
updated_at: 2026-07-01T04:17:25.471+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Open the chapters accordion before asserting chapter-empty states

When testing chapter-related empty states, expand the chapters accordion first so the assertion actually exercises the visible content. If the accordion stays collapsed, components that default to closed when no chapters exist can make the test pass vacuously without proving the fallback UI is rendered. This applies to chapter/accordion tests that need to verify either the current-chapter display or the empty-state message.

---
schema: 1
id: n051-centralize-unbiased-dice-generation-behind-a-rejec
kind: decision
title: "Centralize unbiased dice generation behind a rejection-sampling utility"
domains: ["dice", "randomness", "security"]
file_globs: []
confidence: 0.86
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-20T00:21:35.285966+00:00
updated_at: 2026-08-20T00:21:35.173+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Centralize unbiased dice generation behind a rejection-sampling utility

All dice generation in the dice subsystem must use the centralized utility and rejection sampling rather than ad hoc random-number mapping. Rejection sampling avoids modulo bias, preserving the security and fairness guarantees required for rolls, while one array-returning operation keeps client and server validation aligned. Apply this whenever adding or changing dice-generation paths.

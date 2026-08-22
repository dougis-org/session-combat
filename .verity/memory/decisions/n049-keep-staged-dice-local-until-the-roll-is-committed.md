---
schema: 1
id: n049-keep-staged-dice-local-until-the-roll-is-committed
kind: decision
title: "Keep staged dice local until the roll is committed"
domains: ["dice", "networking", "state-management"]
file_globs: []
confidence: 0.78
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-19T01:45:17.407509+00:00
updated_at: 2026-08-19T01:45:17.386+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Keep staged dice local until the roll is committed

Dice-pool editing must remain local while users add or remove dice, with a single combined POST issued only when Roll is submitted. This keeps exploratory changes from causing repeated network requests and ensures the server receives one coherent committed pool. Apply this to dice-pool state management and its submit path.

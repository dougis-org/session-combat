---
schema: 1
id: n163-apply-vendor-fixes-with-exact-version-patch-packag
kind: decision
title: "Apply vendor fixes with exact-version patch-package patches"
domains: ["dependencies", "dice", "animation", "build-reproducibility"]
file_globs:
  - "patches/**"
  - "package.json"
confidence: 0.88
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-31T03:07:20.648895+00:00
updated_at: 2026-08-31T03:07:20.554+00:00
related: ["n139-predetermine-dice-outcomes-treat-3d-animation-as-c", "n061-use-a-typed-session-scoped-roll-event-contract-wit", "n102-run-integration-tests-through-the-project-harness", "n146-bound-every-dice-animation-phase-and-guarantee-tea"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Apply vendor fixes with exact-version patch-package patches

Dependency corrections that must remain reproducible should be applied as exact-version patch-package patches rather than runtime special cases. This keeps the fix explicit in source control and causes installation or marker tests to fail loudly when the dependency version or patch no longer matches. Apply this to dependency-level corrections in the dice/animation integration.

## Related

**Related:**
- [[n139-predetermine-dice-outcomes-treat-3d-animation-as-c]]
- [[n061-use-a-typed-session-scoped-roll-event-contract-wit]]
- [[n102-run-integration-tests-through-the-project-harness]]
- [[n146-bound-every-dice-animation-phase-and-guarantee-tea]]


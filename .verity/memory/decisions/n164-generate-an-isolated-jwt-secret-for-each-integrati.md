---
schema: 1
id: n164-generate-an-isolated-jwt-secret-for-each-integrati
kind: decision
title: "Generate an isolated JWT secret for each integration-test run"
domains: ["testing", "integration", "authentication", "security"]
file_globs:
  - "tests/integration/global.setup.ts"
confidence: 0.88
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-31T04:48:32.902174+00:00
updated_at: 2026-08-31T04:48:32.805+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Generate an isolated JWT secret for each integration-test run

When integration tests start a spawned server and no JWT secret is explicitly configured, generate a cryptographically random per-run secret and pass the same value to the server and test process. This avoids hardcoded credentials and prevents authentication state from being shared across runs. Apply this to integration-test bootstrap and server-launch code that establishes test authentication.

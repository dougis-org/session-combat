# VERITY.md — Quality Gate

> This project uses [Verity](https://verity.md) to enforce quality and security standards on AI-generated code.

**URL:** https://ofcamwrjwrkazqvdchko.supabase.co/functions/v1
**Project:** b3d688e1-0b2e-4ac4-b33f-7a9bccfe9988
**Standard:** v1

## Quality Dimensions
- Comprehensibility (file length, complexity, naming)
- Modularity (separation of concerns, shallow abstractions)
- Type Safety (strict types, explicit returns)
- Test Adequacy (coverage, test quality)

## Security Patterns
- No hardcoded secrets (CWE-798)
- Input sanitization (CWE-20)
- Parameterized queries (CWE-89)
- Dependency verification (CWE-1395)
- No unsafe deserialization (CWE-502)
- Access control checks (CWE-639)
- Config file integrity (CWE-15)

## How It Works
Every time the coding agent stops, the Verity hook:
1. Runs static analysis via @codacy/analysis-cli
2. Sends results + code to the Verity service
3. Gemini independently reviews the code
4. Returns PASS / WARN / FAIL with actionable findings

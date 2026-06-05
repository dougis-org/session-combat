# ADR: Test Helper File Layering for Import Pipeline

**Status:** Accepted  
**Date:** 2026-06-04  
**GitHub Issue:** #171  
**Change:** expand-test-helper-factories

---

## Context

The session-combat import pipeline supports multiple data sources:
- **Open5E** — monsters and spells (read-only reference data)
- **DnD Beyond** — player characters (active import with normalization)
- **Future sources** — Roll20, Pathbuilder, others (planned)

Each source has its own raw API shape. All sources normalize their data into the same generic D&D 5e shapes defined in `lib/types.ts` (`AbilityScores`, `CharacterClass`, `ImportedCharacterDraft`, etc.).

Before this change, test helpers were organized by implementation history rather than architectural purpose:
- `importTestHelpers.ts` was named generically but contained only Open5E-specific code
- `dndBeyondImport.ts` contained normalized 5e output factories despite its name implying DnD Beyond specificity
- `testFactories.ts` was a 5-line re-export shim with no utility

This caused two problems: contributors did not know which file to extend for new work, and the same inline shapes were duplicated across test files.

---

## Decision

Test helpers are organized into three layers matching the production architecture:

```
tests/helpers/
├── open5eTestHelpers.ts      ← Open5E-specific raw shapes and mock clients
├── characterTestHelpers.ts   ← Generic D&D 5e character shapes (shared by all import sources)
└── dndBeyondTestHelpers.ts   ← DnD Beyond-specific raw API shapes
```

**Layer 1 — Source-specific raw shapes** (`open5eTestHelpers.ts`, `dndBeyondTestHelpers.ts`, future `roll20TestHelpers.ts`): Factories and mocks for the raw API format of a single import source. Nothing here crosses source boundaries.

**Layer 2 — Generic 5e shapes** (`characterTestHelpers.ts`): Factories for the normalized output that every import source produces. When a new source is added, its test helpers for the normalized output go here, not in its source-specific file.

**`testFactories.ts`** re-exports from all three layers so existing test files that import from `testFactories.ts` continue to work without path changes.

---

## Consequences

**Positive:**
- Unambiguous home for every test helper: ask "is this a raw API shape or a normalized 5e shape?" to know which file to open
- `characterTestHelpers.ts` is immediately usable by Roll20 or any future import source tests
- Header comments in each file enforce the boundary without requiring contributors to read this ADR

**Negative:**
- Three files to maintain instead of one
- Import paths in ~6 existing test files required a one-time update

---

## Alternatives Considered

**Single flat file** (`importTestHelpers.ts` with everything): Simpler short-term, but would require a breaking split when the second import source (e.g., Roll20) is added. The time to pay the split cost grows as more tests accumulate.

**Two files** (source-specific vs generic): Viable, but Open5E and DnD Beyond serve different roles in the pipeline (reference data vs character import). Mixing them in one "source-specific" file would create the same naming confusion that triggered this change.

---

## Enforcement

Each helper file opens with a scope-defining header comment stating what belongs and what does not. This is the primary guardrail for future contributors — it does not require reading the ADR.

```
// characterTestHelpers.ts
// Generic D&D 5e character shape factories.
// Use this file for normalized output shapes shared across import sources
// (DnD Beyond, Roll20, Pathbuilder, etc.).
// Raw source-specific shapes belong in the source's own helper file.
```

---

## ADDED Requirements

This ADR is a specification artifact — its existence is an acceptance criterion.

### Requirement: ADDED ADR document

The system SHALL include this ADR at `openspec/specs/adr-test-helper-layers.md` (or equivalent project-level specs location) so future contributors can understand the test helper layering decision.

#### Scenario: ADR is discoverable

- **Given** a contributor is adding a new import source (e.g., Roll20)
- **When** they search for guidance on where to put test helpers
- **Then** this ADR is findable via `openspec/specs/` and explains the three-layer structure

## Traceability

- Proposal element "Write an ADR documenting the test helper architecture decision" -> This document
- Design decision 5 (ADR in openspec/specs/) -> This document
- Requirements -> Tasks: task-07 (copy ADR to openspec/specs/)

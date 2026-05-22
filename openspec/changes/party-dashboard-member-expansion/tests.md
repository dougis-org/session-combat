---
name: tests
description: Tests for the party-dashboard-member-expansion change
---

# Tests

## Overview

This document outlines the tests for the `party-dashboard-member-expansion` change. All work follows strict TDD: write a failing test first, implement the minimum code to pass it, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — before any implementation code, write a test capturing the task's requirements. Run it; confirm it fails.
2. **Write code to pass the test** — simplest code that makes it green.
3. **Refactor** — improve quality while keeping the test green.

## Test Cases

### Task 1 — `CombatStatsRow` component (`tests/unit/CombatStatsRow.test.tsx`)

- [ ] **AC value is rendered** — render `<CombatStatsRow ac={18} hp={45} maxHp={58} />`; assert "18" and the label "AC" are in the output. → Spec: `specs/combat-stats-row/spec.md` — "Renders AC and HP values"
- [ ] **HP/maxHp is rendered as fraction** — same render; assert "45/58" appears. → Spec: "Renders AC and HP values"
- [ ] **acNote renders in parentheses** — render with `acNote="leather armor"`; assert "(leather armor)" is visible. → Spec: "Renders acNote when provided"
- [ ] **No acNote when omitted** — render without `acNote`; assert no parenthetical text adjacent to AC. → Spec: "Renders without acNote when omitted"

### Task 2 — `CreatureStatBlock` refactor (`tests/unit/components/CreatureStatBlock.test.tsx`)

- [ ] **AC and HP still render after refactor** — render `<CreatureStatBlock ac={16} hp={30} maxHp={30} abilityScores={...} />`; assert "16" under "AC" and "30/30" under "HP". → Spec: `specs/combat-stats-row/spec.md` — "CreatureStatBlock visual output unchanged after refactor"
- [ ] **acNote still renders in CreatureStatBlock** — render with `acNote="shield"`; assert "(shield)" visible. → Spec: "CreatureStatBlock visual output unchanged after refactor"

### Task 3 — `CharacterMiniSummary` component (`tests/unit/CharacterMiniSummary.test.tsx`)

- [ ] **Full render — all fields present** — render with `name="Aragorn"`, `race="Human"`, `characterType="character"`, `classes=[{name:"Fighter",level:5}]`, `ac={18}`, `hp={45}`, `maxHp={58}`; assert name, "Human", "Fighter", "Lv 5", "18", "45/58" all visible. → Spec: `specs/character-mini-summary/spec.md` — "Renders full character identity and stats"
- [ ] **NPC badge shown for npc** — render with `characterType="npc"`; assert "NPC" label/badge visible. → Spec: "Renders NPC badge for characterType npc"
- [ ] **Companion badge shown for companion** — render with `characterType="companion"`; assert "Companion" label/badge visible. → Spec: "Renders Companion badge for characterType companion"
- [ ] **No badge for character type** — render with `characterType="character"`; assert neither "NPC" nor "Companion" badge present. → Spec: "Renders no badge for characterType character"
- [ ] **Multiclass level summed** — render with `classes=[{name:"Fighter",level:3},{name:"Rogue",level:2}]`; assert "Lv 5" present. → Spec: "Multiclass level is summed across all classes"
- [ ] **Graceful render — undefined race** — render with `race={undefined}`; assert no throw; "—" or no race text visible. → Spec: "Graceful render when race is undefined"
- [ ] **Graceful render — empty classes** — render with `classes={[]}`; assert no throw; no class/level line rendered. → Spec: "Graceful render when classes is empty"
- [ ] **No fetch calls made** — verify `CharacterMiniSummary` makes no `fetch` or HTTP calls on mount. → Spec: "No network requests made by CharacterMiniSummary"

### Task 4 — Party list card update (`tests/unit/components/PartiesPage.test.tsx`)

- [ ] **Mixed party renders three sections** — render party page with a party containing 2 PCs, 1 NPC, 1 Companion; assert "Player Characters", "Travelling NPCs", and "Companions" section labels all present. → Spec: `specs/party-member-expansion/spec.md` — "Party with all three types renders three sections"
- [ ] **PC-only party renders one section** — render party with only `characterType="character"` members; assert "Travelling NPCs" and "Companions" sections absent. → Spec: "Party with only player characters renders one section"
- [ ] **NPC-only party hides PC section** — render party with only `characterType="npc"` members; assert "Player Characters" section absent. → Spec: "Party with NPCs and no PCs hides the PC section"
- [ ] **Each member card shows key fields** — assert that a known member's name, race, class, level, AC, HP are all rendered within the party card. → Spec: "Each member card shows name, race, class, level, AC, HP"
- [ ] **Zero-member party shows no sections** — render party with `characterIds: []`; assert no type-group sections rendered. → Spec: "Party with zero members shows no member sections"
- [ ] **Undefined characterType defaults to PC section** — render party with a member having `characterType: undefined`; assert that member appears under "Player Characters". → Spec: "Member with no characterType defaults to Player Characters"
- [ ] **Comma list no longer rendered** — render party with three members; assert no comma-joined name string is present in the output. → Spec: "Comma-separated name list is no longer rendered"
- [ ] **No additional fetches on render** — assert no extra `fetch` calls are made when party cards render grouped members. → Spec: `specs/party-member-expansion/spec.md` — "No additional network requests when rendering grouped party members"

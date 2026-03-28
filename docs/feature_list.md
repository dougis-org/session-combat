# Session Combat — Suggested Feature List

This list draws on the [dnd-tracker Product Requirements](../../dnd-tracker/docs/Product-Requirements.md)
and [Feature Roadmap](../../dnd-tracker/docs/Feature-Roadmap.md) as reference material for detailed
requirements and acceptance criteria.

Features are grouped by theme and roughly ordered by value-to-effort. Each entry notes the source
document section where more detail can be found.

---

## 1. Combat Mechanics (Core Gaps)

### 1.1 Temporary HP Tracking
Combatants can have temporary hit points that absorb damage before regular HP is reduced. Temp HP
does not stack — taking the higher value is the standard rule.

- Visual distinction between temp and regular HP in health bars
- Temp HP cleared on long rest or as a separate action
- **Ref**: [PRD §4.5 — HP Tracking](../../dnd-tracker/docs/Product-Requirements.md#45-combat-management)

### 1.2 Damage Types, Resistances, and Immunities
When dealing damage, allow specifying damage type (fire, slashing, necrotic, etc.). Auto-halve or
ignore damage for combatants with resistance/immunity to that type.

- Per-combatant resistance/immunity/vulnerability lists (editable on the stat block)
- Visual indicator when a hit is resisted or immune
- **Ref**: [dnd-tracker F050 — Damage Types & Resistances](../../dnd-tracker/docs/Feature-Roadmap.md)

### 1.3 HP Undo / Damage History
Allow undoing the last HP change so DMs can correct accidental inputs without restarting combat.

- Per-combatant history stack (last N changes)
- Undo button in the combatant row
- **Ref**: [dnd-tracker F052 — HP History & Undo](../../dnd-tracker/docs/Feature-Roadmap.md)

### 1.4 Legendary Actions
Many boss-tier monsters have legendary actions — a pool of reactions usable outside their turn.
Track the count per round and reset it automatically at the start of the monster's turn.

- Configurable legendary action count per creature (0 = none)
- Action descriptions stored on the stat block
- Visual counter that auto-resets each round
- **Ref**: [PRD §4.5 — Legendary Actions](../../dnd-tracker/docs/Product-Requirements.md#45-combat-management)

### 1.5 Lair Actions
At initiative count 20, certain monsters trigger lair-based environmental effects. This is a
first-class D&D mechanic that is currently absent.

- Toggle lair actions on/off per encounter
- Configurable list of lair action descriptions
- Automatic prompt at initiative count 20 (before any creature acts)
- Visual indicator in the initiative order when lair action is pending
- **Ref**: [PRD §4.5 — Lair Actions](../../dnd-tracker/docs/Product-Requirements.md#45-combat-management),
  [PRD §12.4 — Lair Action Enhancements](../../dnd-tracker/docs/Product-Requirements.md#124-lair-action-enhancements),
  [dnd-tracker F056 — Lair Actions System](../../dnd-tracker/docs/Feature-Roadmap.md)

### 1.6 Death Saving Throws
Track death save successes and failures for downed characters (0 HP). Three successes = stable,
three failures = dead.

- Three-slot tracker (success / failure) shown when HP = 0
- Auto-clear on healing above 0 HP
- Visual distinct state for "unconscious but stable" vs "dead"

### 1.7 Concentration Tracking
Many D&D spells require concentration. When a concentrating creature takes damage, it must make
a Constitution save (DC 10 or half damage taken, whichever is higher).

- Mark a combatant as concentrating on a named spell
- Auto-prompt the DC when they take damage
- Visual indicator in the combatant row

---

## 2. Initiative & Turn Order

### 2.1 Dexterity Tiebreaker
When two combatants roll the same initiative, D&D rules use Dexterity score as the tiebreaker.
Currently the sort order for ties is undefined.

- Store DEX score on each combatant
- Apply DEX as automatic tiebreaker during sort
- Allow manual override as a final fallback
- **Ref**: [PRD §4.4 — Smart Sorting](../../dnd-tracker/docs/Product-Requirements.md#44-initiative--combat-tracker)

### 2.2 Initiative Modifiers & Advantage
Allow rolling initiative with advantage (roll twice, take higher) or applying a flat modifier
beyond the basic initiative bonus.

- Advantage toggle per combatant at roll-time
- Flat bonus field (used for Alert feat, bardic inspiration, etc.)
- **Ref**: [dnd-tracker F047 — Initiative Modifiers & Effects](../../dnd-tracker/docs/Feature-Roadmap.md)

### 2.3 Manual Initiative Input Before Roll
Allow the DM to pre-enter known initiatives (e.g. from player dice rolls at the table) rather
than having the app roll them.

- Editable initiative field per combatant before combat starts
- "Use entered values" option alongside "Roll for all"

---

## 3. Session Persistence & History

### 3.1 Save & Resume Combat Sessions
Pause mid-combat and return later without losing state. Useful for sessions that run long or need
to be resumed the following week.

- Active combat state persisted to MongoDB
- "Resume last session" prompt on the combat page
- Multiple saved sessions per user
- **Ref**: [dnd-tracker F057 — Save & Load Combat Sessions](../../dnd-tracker/docs/Feature-Roadmap.md)

### 3.2 Combat Session History / Archive
After a combat ends, archive a summary: who participated, rounds taken, final HP states, kills.

- Session log stored per user
- Browsable history list
- Basic summary card (encounter name, date, rounds, outcome)
- **Ref**: [dnd-tracker F058 — Combat Session History & Archive](../../dnd-tracker/docs/Feature-Roadmap.md)

### 3.3 Combat Event Log
Record a turn-by-turn log during combat: who attacked whom, HP changes, conditions applied.

- Timestamped event feed visible during combat
- Persisted with the session archive
- Optional: export as text/JSON for session notes
- **Ref**: [dnd-tracker F059 — Combat Event Logging](../../dnd-tracker/docs/Feature-Roadmap.md),
  [PRD §4.5 — Combat Log](../../dnd-tracker/docs/Product-Requirements.md#45-combat-management)

---

## 4. Entity Management

### 4.1 Party Management with Templates
Save a named party composition (set of characters) and load it into combat in one step. Great
for recurring groups.

- Create/name parties from existing characters
- Load a party directly into the combat setup screen
- **Ref**: [PRD §4.2 — Party Templates](../../dnd-tracker/docs/Product-Requirements.md#42-party-management),
  [dnd-tracker F032–F034](../../dnd-tracker/docs/Feature-Roadmap.md)

### 4.2 Encounter CR Calculator / Difficulty Rating
When building an encounter, display the estimated difficulty (Easy/Medium/Hard/Deadly) based on
party level and monster CRs.

- XP budget calculation per D&D 5e DMG rules
- Difficulty label shown in encounter builder
- **Ref**: [PRD §4.3 — Encounter Builder](../../dnd-tracker/docs/Product-Requirements.md#43-encounter-management)

### 4.3 Encounter Templates / Presets
Save a completed encounter as a reusable template — handy for recurring enemy groups or random
encounter tables.

- "Save as template" action on any encounter
- Template library browseable when creating a new encounter
- **Ref**: [dnd-tracker F042 — Encounter Templates & Presets](../../dnd-tracker/docs/Feature-Roadmap.md)

### 4.4 Character Multiclassing
Characters can belong to more than one class. The current character model likely supports a single
class field.

- Array of `{ class, level }` pairs instead of a single class string
- Total level derived from sum
- **Ref**: [PRD §4.2 — Character Creation](../../dnd-tracker/docs/Product-Requirements.md#42-party-management)

### 4.5 Expand SRD Monster Library
The current library ships 32+ monsters. The full SRD contains ~400 creatures. Expanding coverage
reduces the need for DMs to enter common monsters manually.

- Bulk-import remaining SRD creatures
- Filter by CR, type, size, and source in the monster selector
- **Ref**: [docs/PUBLIC_DOMAIN_MONSTER_PLAN.md](./PUBLIC_DOMAIN_MONSTER_PLAN.md),
  [dnd-tracker F027 — Monster Validation & SRD Integration](../../dnd-tracker/docs/Feature-Roadmap.md)

---

## 5. Import / Export

### 5.1 Export Combat Data (JSON / PDF)
Allow DMs to export encounter or session data for record-keeping or sharing.

- JSON export of any encounter or combat session
- Optional PDF summary for session notes
- **Ref**: [PRD §4.6 — Import/Export](../../dnd-tracker/docs/Product-Requirements.md#46-data-persistence--sync),
  [dnd-tracker F062 — Data Export System](../../dnd-tracker/docs/Feature-Roadmap.md)

### 5.2 Import Characters from Roll20
Complement the existing D&D Beyond import with Roll20 character sheet import (JSON export format).

- Parse Roll20 character JSON
- Map to session-combat character model with normalization warnings
- **Ref**: [PRD §4.2 — Import/Export](../../dnd-tracker/docs/Product-Requirements.md#42-party-management),
  [dnd-tracker F063 — Data Import System](../../dnd-tracker/docs/Feature-Roadmap.md)

---

## 6. UX & Accessibility

### 6.1 Keyboard Shortcuts for Combat
DMs at the table need to advance turns and apply damage quickly without reaching for a mouse.

- `N` → next turn, `P` → previous turn
- `Space` → roll initiative
- Number keys or hotkeys for HP quick-adjust
- Discoverable via a keyboard shortcut overlay (`?` key)
- **Ref**: [PRD §5.3 — Desktop Enhancement](../../dnd-tracker/docs/Product-Requirements.md#53-responsive-design)

### 6.2 Mobile / Tablet Optimisation
The combat tracker is used at the gaming table on a tablet or phone. The current layout may not
be fully optimised for touch.

- Touch-friendly HP adjustment (large tap targets)
- Swipe gestures for next/previous turn
- Collapsible combatant rows for dense encounters on small screens
- **Ref**: [PRD §5.3 — Mobile-First](../../dnd-tracker/docs/Product-Requirements.md#53-responsive-design)

### 6.3 User Profile & Preferences
Let users set their D&D edition, experience level, and preferred defaults (e.g. automatic vs
manual initiative rolling).

- Settings page: rules edition, DM experience level, role (Player / DM / both)
- Saved per user account
- **Ref**: [PRD §4.1 — User Profile](../../dnd-tracker/docs/Product-Requirements.md#41-user-management--authentication)

### 6.4 Quick-Add Combatant During Active Combat
Allow adding a surprise combatant mid-combat (ambush, reinforcements) without ending the session.

- "Add combatant" action available during combat
- Prompt for initiative placement (roll or manual)

---

## 7. Collaborative / Shared Play

### 7.1 Shareable Combat View (Read-Only)
Generate a URL that players can open on their phones to see the current initiative order, their
own HP, and active conditions — without giving them DM controls.

- Per-session share link (token-gated)
- Player view shows: initiative order, visible HP bars, own character detail
- DM view retains full control

### 7.2 Player-Controlled Characters
Allow a player to control their own character's HP and conditions via the share link, reducing DM
overhead.

- Optional: grant write access to specific combatants per player token
- **Ref**: [PRD §4.2 — Character Sharing](../../dnd-tracker/docs/Product-Requirements.md#42-party-management),
  [dnd-tracker F070 — Character Sharing](../../dnd-tracker/docs/Feature-Roadmap.md),
  [dnd-tracker F073 — Collaborative Mode](../../dnd-tracker/docs/Feature-Roadmap.md)

---

## 8. Stretch / Future

| Feature | Notes | Ref |
|---|---|---|
| AI encounter balancer | Suggest monster mix for target difficulty given party composition | [PRD §12.3](../../dnd-tracker/docs/Product-Requirements.md#123-advanced-features) |
| Custom UI themes | Dark/light variants, high-contrast, tabletop colour palettes | [dnd-tracker F072](../../dnd-tracker/docs/Feature-Roadmap.md) |
| Spells & actions reference | Quick-lookup panel for spell descriptions during combat | — |
| Lair action animations | Visual effects triggered by lair actions (CSS/canvas) | [PRD §12.4](../../dnd-tracker/docs/Product-Requirements.md#124-lair-action-enhancements) |
| Condition reference cards | Tooltip/modal showing the rules text for each condition | — |
| Multi-encounter campaign view | Link multiple encounters into a session/campaign arc | [PRD §12.3](../../dnd-tracker/docs/Product-Requirements.md#123-advanced-features) |

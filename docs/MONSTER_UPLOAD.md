# Monster JSON Upload Feature

This document describes the monster JSON upload feature that allows users to bulk import monster templates from JSON documents.

## Overview

The monster upload feature enables users to:
- Upload a JSON document containing multiple monster definitions
- Automatically validate the data format
- Create user-specific (non-global) monster templates in the database
- Receive detailed feedback on validation errors and successfully imported monsters

## API Endpoint

**POST** `/api/monsters/upload`

### Authentication
Requires valid JWT authentication token in the `Authorization` header.

### Request Body

The request body must be a JSON object with the following structure:

```json
{
  "monsters": [
    {
      "name": "Monster Name",
      "maxHp": 50,
      "ac": 15,
      "size": "medium",
      "type": "humanoid",
      "challengeRating": 2,
      "abilityScores": {
        "strength": 15,
        "dexterity": 12,
        "constitution": 14,
        "intelligence": 10,
        "wisdom": 11,
        "charisma": 10
      }
    }
  ]
}
```

### Required Fields

- `monsters` (array): Must contain at least one monster object
- `name` (string): Monster name (non-empty)
- `maxHp` (number): Maximum hit points (must be > 0)

### Optional Fields

All other fields from the [MonsterTemplate](../../lib/types.ts) interface are supported:

- `hp` (number): Current hit points (defaults to maxHp if not provided)
- `ac` (number): Armor class (0-30)
- `size` (string): Monster size (`tiny`, `small`, `medium`, `large`, `huge`, `gargantuan`)
- `type` (string): Monster type (e.g., "humanoid", "beast", "dragon")
- `alignment` (string): Alignment description
- `speed` (string): Movement speeds (e.g., "30 ft., fly 60 ft.")
- `challengeRating` (number): CR value (non-negative)
- `experiencePoints` (number): XP reward
- `description` (string): Additional lore or notes
- `source` (string): Source material reference
- `abilityScores` (object): All six ability scores (1-30 range)
  - `strength`, `dexterity`, `constitution`, `intelligence`, `wisdom`, `charisma`
- `savingThrows` (object): Saving throw modifiers by ability
- `skills` (object): Skill bonuses
- `damageResistances` (array): List of damage types
- `damageImmunities` (array): List of damage types
- `damageVulnerabilities` (array): List of damage types
- `conditionImmunities` (array): List of conditions
- `senses` (object): Special senses (e.g., `{ "darkvision": "120 ft." }`)
- `languages` (array): Languages understood/spoken
- `traits` (array): Creature traits/features
- `actions` (array): Combat actions
- `bonusActions` (array): Bonus actions
- `reactions` (array): Reaction actions
- `lairActions` (array): Lair-specific actions
- `legendaryActions` (array): Legendary actions

### Ability Objects

For `traits`, `actions`, `bonusActions`, `reactions`, `lairActions`, and `legendaryActions`, each ability must have:

```json
{
  "name": "Ability Name",
  "description": "Description of what this ability does.",
  "attackBonus": 5,          // Optional
  "damageDescription": "2d6 + 2 slashing",  // Optional
  "saveDC": 14,              // Optional
  "saveType": "Dexterity",   // Optional
  "recharge": "5-6"          // Optional
}
```

### Response

#### Success (201 Created)

```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "imported": [
    {
      "index": 0,
      "id": "uuid-1",
      "name": "Goblin"
    },
    {
      "index": 1,
      "id": "uuid-2",
      "name": "Bugbear"
    }
  ]
}
```

#### Partial Success (207 Multi-Status)

When some monsters fail to save:

```json
{
  "success": false,
  "count": 1,
  "total": 2,
  "imported": [
    {
      "index": 0,
      "id": "uuid-1",
      "name": "Goblin"
    }
  ],
  "errors": [
    {
      "index": 1,
      "message": "Failed to save monster: Database connection error"
    }
  ]
}
```

#### Validation Failure (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "monsters[0].name",
      "message": "Monster name is required and must be a non-empty string",
      "index": 0
    },
    {
      "field": "monsters[0].maxHp",
      "message": "maxHp is required and must be greater than 0",
      "index": 0
    }
  ],
  "count": 0,
  "imported": []
}
```

### Error Codes

- `200`: Invalid JSON body
- `400`: Validation failed
- `401`: Not authenticated
- `500`: Server error

## Sample Document

See [samples/monster-upload-example.json](../../samples/monster-upload-example.json) for a complete example based on the D&D 5e SRD Aboleth monster.

## Implementation

### Files

- **Validation**: [lib/validation/monsterUpload.ts](../../lib/validation/monsterUpload.ts)
  - `validateMonsterUploadDocument()`: Validates entire JSON structure
  - `validateMonsterData()`: Validates individual monster
  - `transformMonsterData()`: Converts raw data to MonsterTemplate

- **Route Handler**: [app/api/monsters/upload/route.ts](../../app/api/monsters/upload/route.ts)
  - Handles POST requests
  - Manages authentication
  - Orchestrates validation and storage

- **Tests**: [tests/integration/monsterUpload.test.ts](../../tests/integration/monsterUpload.test.ts)
  - 33 test cases covering validation logic
  - Unit tests for individual validators
  - End-to-end integration tests

## Usage Example

```bash
# Upload monsters from a JSON file
curl -X POST http://localhost:3000/api/monsters/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @samples/monster-upload-example.json
```

## Validation Rules

### Required
- Monster must have a non-empty `name`
- Monster must have `maxHp > 0`

### Type Validation
- `hp`: number, must be ≤ maxHp
- `ac`: number, range 0-30
- `size`: one of the valid sizes
- `challengeRating`: non-negative number
- `abilityScores`: all six scores must be 1-30

### Array Validation
- All array fields must contain properly typed elements
- Traits, actions, etc. must have `name` and `description`
- Languages must be strings

### User Ownership
- All imported monsters are assigned to the authenticated user's ID
- `isGlobal` is always set to `false` for uploaded monsters
- Global monsters can only be created/modified by admins

## Testing

Run the validation tests:

```bash
npm run test:integration -- tests/integration/monsterUpload.test.ts
```

All 33 tests should pass, covering:
- Document structure validation
- Required field validation
- Type validation
- Range validation
- Array element validation
- Data transformation
- End-to-end workflows

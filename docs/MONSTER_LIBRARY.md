# D&D Monster Library System

## Overview

The Session Combat application includes a comprehensive library of Standard Reference Document (SRD) monsters from D&D 5e. These public domain creatures can be seeded into any instance of the application for use by all users.

## Features

- **18 SRD Monsters** - Complete stat blocks for standard D&D creatures
- **Global Templates** - Available to all users in the encounter builder
- **Simple Seeding** - Two easy methods to populate the database
- **Full D&D 5e Stats** - Comprehensive ability scores, actions, legendary actions, and more

## Available Monsters

The library includes creatures across various challenge ratings:

### Creatures by Challenge Rating

- **CR 0** - Commoner
- **CR 1/8** - Bandit
- **CR 1/4** - Goblin
- **CR 1/2** - Black Bear
- **CR 1** - Mummy
- **CR 3** - Ankheg, Dire Wolf
- **CR 4** - Red Dragon Wyrmling
- **CR 6** - Chimera
- **CR 8** - Assassin, Frost Giant
- **CR 10** - Aboleth
- **CR 13** - Beholder
- **CR 17** - Adult Gold Dragon
- **CR 19** - Demon Balor
- **CR 21** - Lich
- **CR 22** - Ancient Green Dragon

## Seeding Methods

### Method 1: Admin API Endpoint (Recommended)

For application administrators, a PUT endpoint is available to seed the monster library:

```bash
# Seed all SRD monsters into the database
curl -X PUT http://localhost:3000/api/monsters/global/seed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Requirements:**
- User must be an admin (verified via database)
- Returns JSON response with list of seeded monsters
- Idempotent: Deletes existing global monsters before reseeding

**Response:**
```json
{
  "success": true,
  "message": "Seeded 18 SRD monsters",
  "count": 18,
  "monsters": [
    { "id": "uuid", "name": "Aboleth", "cr": 10 },
    { "id": "uuid", "name": "Adult Gold Dragon", "cr": 17 },
    // ... more monsters
  ]
}
```

### Method 2: CLI Script

For development or direct database access:

```bash
# Run from project root
npx ts-node lib/scripts/seedMonsters.ts
```

**Output:**
```
✓ Successfully seeded 18 monsters

Seeded Monsters:
  - Aboleth (CR 10)
  - Adult Gold Dragon (CR 17)
  - ... (more monsters)

✓ Seeding complete! 18 monsters are now available globally.
```

**Requirements:**
- Node.js with TypeScript support
- Database connection configured in `.env.local`
- Direct filesystem access

## Using Global Monsters

Once seeded, monsters are available to all users:

1. **In Encounter Builder:**
   - Click "Browse Library" or similar button
   - Select a monster from the SRD library
   - Click "Add to Encounter" to clone it into your encounter

2. **Monster Details:**
   - Full stat blocks including ability scores, saving throws, and skills
   - Special traits, actions, bonus actions, and legendary actions
   - Damage immunities, resistances, and condition immunities
   - Senses and languages

## Data Structure

Each monster in the library includes:

```typescript
interface Monster {
  // Basic Information
  name: string;
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
  type: string;  // e.g., 'humanoid', 'beast', 'aberration'
  alignment?: string;

  // Combat Stats
  ac: number;
  hp: number;
  maxHp: number;
  speed: string;  // e.g., '30 ft., fly 60 ft.'

  // Ability Scores (6 abilities)
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };

  // Optional Combat Features
  savingThrows?: Record<string, number>;
  skills?: Record<string, number>;
  damageResistances?: string[];
  damageImmunities?: string[];
  damageVulnerabilities?: string[];
  conditionImmunities?: string[];

  // Senses and Communication
  senses?: Record<string, string>;
  languages?: string[];

  // D&D Features
  traits?: CreatureAbility[];
  actions?: CreatureAbility[];
  bonusActions?: CreatureAbility[];
  reactions?: CreatureAbility[];
  legendaryActions?: CreatureAbility[];

  // Challenge and Rewards
  challengeRating: number;
  experiencePoints: number;

  // Metadata
  source?: string;  // e.g., 'Monster Manual'
  description?: string;
}
```

## Extending the Library

To add more monsters to the library:

1. Edit `lib/data/srd-monsters.ts`
2. Add new monster objects following the existing format
3. Update the `SRD_MONSTERS` array export
4. Run seeding to update the database

Example:

```typescript
{
  name: 'Griffon',
  size: 'large',
  type: 'monstrosity',
  alignment: 'unaligned',
  ac: 12,
  hp: 59,
  maxHp: 59,
  speed: '30 ft., fly 80 ft.',
  abilityScores: {
    strength: 18,
    dexterity: 14,
    constitution: 16,
    intelligence: 2,
    wisdom: 12,
    charisma: 8,
  },
  // ... more fields
}
```

## Technical Details

- **Storage:** MongoDB collection `monsterTemplates`
- **User ID:** Set to `'GLOBAL'` for shared access
- **Availability:** Visible to all authenticated users
- **Permissions:** Creation/deletion restricted to admins

## Troubleshooting

### "Failed to seed monsters" error
- Check database connection is working
- Verify admin status for the seeding user
- Check logs for MongoDB errors

### Monsters not appearing
- Verify seeding completed successfully
- Check database contains entries with `userId: 'GLOBAL'`
- Clear browser cache and reload page

### Duplicate monsters
- Run seeding again (automatically deletes old entries first)
- Manually check and delete duplicates in database

## Future Enhancements

- [ ] UI button in app to trigger seeding for admins
- [ ] Search and filter global monsters
- [ ] Monster statistics and usage tracking
- [ ] Community-contributed monster additions
- [ ] Monster customization before adding to encounter

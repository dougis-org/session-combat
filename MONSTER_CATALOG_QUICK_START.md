# Monster Catalog Feature - Quick Start

## Overview
The application now includes a **Monster Library** feature that allows you to create a reusable catalog of monster templates. Instead of manually entering the same monster stats every time you create an encounter, you can:

1. **Define** monsters once in the Monster Library
2. **Reuse** them in multiple encounters
3. **Customize** individual instances in encounters without affecting the library

## How to Use

### 1. Create Monster Templates (Library)

From the home page:
1. Click **"Monster Library"** 
2. Click **"Add New Monster"**
3. Fill in the monster's stats:
   - Name (required)
   - Current HP
   - Max HP (required, must be > 0)
   - AC (defaults to 10)
   - Initiative Bonus (defaults to 0)
   - Dexterity (defaults to 10)
4. Click **"Save Monster"**

The monster is now available in your library for use in encounters.

### 2. Use Library in Encounters

When creating or editing an encounter:
1. Click **"Add from Library"** (purple button)
2. A list of your saved monsters appears
3. Click **"Add"** next to the monster you want to include
4. The monster is added as a unique instance to the encounter
5. You can still edit individual instance stats if needed
6. Click **"Save Encounter"**

### 3. Manage Your Library

In the Monster Library:
- **Edit**: Click the blue "Edit" button to modify a template
- **Delete**: Click the red "Delete" button to remove a template
- **Note**: Deleting affects future encounters, not existing ones

## Key Benefits

✅ **No Repetition** - Define goblin stats once, use in any encounter
✅ **Consistency** - Same base stats across encounters for balance
✅ **Flexibility** - Still customize individual instances when needed
✅ **Speed** - Quickly populate encounters with common creatures
✅ **Organization** - All monster definitions in one place

## Technical Details

- **Independent Instances**: Each monster in an encounter is a unique instance
- **Instance Customization**: Edit a monster's stats in an encounter without affecting the library template
- **Template Tracking**: Monsters created from library show "(from library)" label
- **Backward Compatible**: Existing custom-created monsters (without templates) still work

## Examples

### Example 1: Goblin Encounters
1. Create a "Goblin" template: HP 7/7, AC 15, Init +2
2. Add it to Encounter A (3 goblins)
3. Add it to Encounter B (5 goblins)
4. If you need different goblins, edit individual instances in encounters

### Example 2: Mixed Party
1. Create templates: Goblin, Orc, Hobgoblin
2. Build encounter with 2 Goblins + 1 Orc from library
3. Later add custom "Boss Goblin" manually
4. Save encounter with mixed sources

## Database Impact

The application adds a new MongoDB collection:
- `monsterTemplates` - Stores all user monster definitions

This is separate from encounter monsters, so:
- ✅ Deleting a template doesn't delete monsters in existing encounters
- ✅ Each user has their own private library
- ✅ No data is duplicated between template and encounter instances

# Monster Catalog Feature Implementation

## Overview
The application now supports a monster catalog/library feature. Users can create reusable monster templates and add unique instances of them to encounters, eliminating the need to repeatedly enter the same monster stats.

## Changes Made

### 1. **Data Model Updates** (`lib/types.ts`)
- **New Interface: `MonsterTemplate`**
  - Represents reusable monster definitions stored in the library
  - Fields: `id`, `userId`, `name`, `hp`, `maxHp`, `ac`, `initiativeBonus`, `dexterity`, `createdAt`, `updatedAt`
  
- **Updated Interface: `Monster`**
  - Now supports two use cases: standalone custom monsters and instances from library
  - New optional field: `templateId` - tracks which template the monster was created from
  - Optional `userId` field since encounter instances don't need to track user separately

### 2. **Database Layer** (`lib/storage.ts`)
Added three new storage functions:
- `loadMonsterTemplates(userId)` - Retrieves all monster templates for a user
- `saveMonsterTemplate(template)` - Creates or updates a monster template
- `deleteMonsterTemplate(id, userId)` - Deletes a monster template

### 3. **API Endpoints**

#### `app/api/monsters/route.ts` (List and Create)
- **GET**: Returns all monster templates for the authenticated user
- **POST**: Creates a new monster template
  - Validates: name is required, maxHp > 0
  - Defaults: ac=10, initiativeBonus=0, dexterity=10
  - Returns: 201 with created template, 400 for validation errors

#### `app/api/monsters/[id]/route.ts` (Retrieve, Update, Delete)
- **GET**: Retrieves a specific monster template by ID
- **PUT**: Updates a monster template
  - Validates ownership and input constraints
  - Returns: 200 with updated template, 404 if not found
- **DELETE**: Deletes a monster template
  - Returns: 200 on success, 404 if not found

### 4. **Monster Library UI** (`app/monsters/page.tsx`)
New page for managing the monster catalog:
- **List View**: Displays all monster templates with stats summary
  - Shows: Name, HP (current/max), AC, Initiative bonus, Dexterity
- **Create/Edit**: Form to add or modify monster templates
  - Input fields: Name, Current HP, Max HP, AC, Initiative Bonus, Dexterity
  - Validation: Name required, Max HP > 0
- **Delete**: Removes monster templates from the library
- **Navigation**: Back button to home page

### 5. **Updated Encounter System** (`app/encounters/page.tsx`)
Enhanced encounter editor with library integration:
- **Two ways to add monsters to encounters**:
  1. **"Add from Library"** button (purple) - Opens a selector showing all monster templates
  2. **"Add Custom"** button (green) - Creates a blank monster to customize manually
  
- **Library Integration**:
  - When adding from library, creates a unique instance of the template
  - Each instance gets its own ID but retains `templateId` reference
  - Template changes don't affect existing encounter instances
  - Visual indicator "(from library)" shows which monsters are template-based
  
- **Monster instance editing**: Still allows customization of individual monster stats even if created from library

### 6. **Updated Navigation** (`app/page.tsx`)
- Added "Monster Library" card to main navigation
- Links to `/monsters` page
- Positioned between "Encounters" and "Characters"

### 7. **Integration Tests** (`tests/integration/monsters.integration.test.ts`)
Comprehensive test suite for the monster API:
- **Setup**: MongoDB container for real database interaction
- **Tests cover**:
  - Health check endpoint
  - Creating monsters with valid/invalid data
  - Default value assignment
  - Validation error handling (missing name, invalid maxHp)
  - CRUD operations (read, update, delete)
  - Authentication scenarios
  - Edge cases (non-existent resources)

## User Workflow

### Creating a Monster Library
1. Click "Monster Library" from home page
2. Click "Add New Monster"
3. Fill in stats (name, HP, AC, Initiative, Dexterity)
4. Click "Save Monster"
5. Monster appears in the library for reuse

### Using Library in Encounters
1. Go to Encounters page
2. Create or edit an encounter
3. In the Monsters section, click "Add from Library"
4. Select a monster from the list and click "Add"
5. Monster is added as a unique instance with the template's stats
6. Optionally edit the instance's stats individually
7. Save the encounter

### Advantages
- **No duplication**: Define monster stats once in the library
- **Consistency**: Encounters using the same template have matching base stats
- **Flexibility**: Individual instances can still be customized after adding
- **Speed**: Quickly populate encounters with common creatures
- **Organization**: Central location to manage monster definitions

## Technical Notes

- **Separation of Concerns**: `MonsterTemplate` (library) vs `Monster` (encounter instances)
- **Independence**: Modifying a template doesn't affect existing encounters
- **Unique Instances**: Each monster in an encounter has its own ID, allowing independent customization
- **Backward Compatibility**: Existing custom monsters (without `templateId`) still work
- **Scalability**: Support for multiple users with separate libraries via `userId`

## Testing
Run integration tests with:
```bash
npm run test:integration
```

The test suite validates:
- API endpoint functionality
- Input validation
- Error handling
- Database operations with real MongoDB

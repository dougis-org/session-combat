# session-combat

A Next.js application for tracking encounters and combat for D&D sessions.

## Features

- **Encounter Management**: Create and manage encounters with monsters ahead of time
- **Character Management**: Track your characters and their stats with full D&D 5e stat blocks
- **SRD Monster Library**: 32+ public domain D&D 5e monsters available globally to all users
- **Combat Tracker**: Full-featured combat tracker with:
  - Initiative tracking and automatic sorting
  - Hit point management with visual health bars
  - Armor class (AC) tracking
  - Status conditions with duration tracking
  - Round and turn tracking
  - Quick HP adjustment buttons

## Getting Started

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Usage

### 1. Add Characters

Navigate to the Characters page to add your characters. For each character, enter:
- Name
- Hit Points (HP) and Max HP
- Armor Class (AC)
- Initiative Bonus

### 2. Create Encounters

Navigate to the Encounters page to create encounters:
- Give your encounter a name and description
- Add monsters from the **SRD Monster Library** (global templates)
- Or create custom monsters with full D&D stat blocks
- Define all monster stats including ability scores, actions, and special abilities

### 3. Start Combat

Navigate to the Combat Tracker:
1. Select an encounter (optional - you can start combat with just characters)
2. Click "Start Combat" to initialize the combat session
3. Click "Roll Initiative" to roll for all combatants and sort by initiative order
4. Use "Next Turn" to advance through combat
5. Adjust HP with the +5/-5 buttons or directly edit stats
6. Add status conditions to combatants (with optional duration in rounds)
7. Click "End Combat" when the encounter is complete

## Data Persistence

The application uses **MongoDB** for persistent data storage. All encounters, characters, and monsters are saved to the database, allowing:

- Data to persist across browser sessions and devices
- Multi-user access and authentication
- Server-side backup and recovery
- Scaling to production deployments

For development, a local MongoDB connection is configured via `.env.local`.

## Monster Library

The application includes a built-in library of 32+ Standard Reference Document (SRD) monsters from D&D 5e that are available to all users. These public domain creatures include famous enemies and NPCs like:

- Dragons (Red Dragon Wyrmling, Wyvern, Adult Gold Dragon, Ancient Green Dragon)
- Liches and Undead (Lich, Vampire, Wraith, Zombie, Skeleton, Ghast, Mummy)
- Giants (Frost Giant)
- Monstrosities (Hydra, Manticore, Basilisk, Medusa, Chimera)
- Beasts (Dire Wolf, Black Bear)
- Humanoids (Assassin, Ogre, Orc, Goblin, Bandit, Drow, Commoner)
- Aberrations (Aboleth, Beholder)
- Fey/Elementals (Harpy, Gargoyle)
- And more!

### Seeding the Library

To make the monsters available in your instance, an administrator can seed them using:

```bash
# API endpoint (admin only)
curl -X PUT http://localhost:3000/api/monsters/global/seed

# Or use the CLI script
npx ts-node lib/scripts/seedMonsters.ts
```

See [docs/MONSTER_LIBRARY.md](docs/MONSTER_LIBRARY.md) for complete documentation on the monster library system.

## Technology Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **MongoDB** - Database persistence

## License

ISC

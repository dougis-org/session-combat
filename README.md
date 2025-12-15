# session-combat

A Next.js application for tracking encounters and combat for D&D sessions.

## Features

- **Encounter Management**: Create and manage encounters with monsters ahead of time
- **Character Management**: Track your characters and their stats
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
- Add monsters to the encounter with their stats (HP, AC, Initiative Bonus)

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

The application uses **localStorage** for simple, client-side data persistence. All encounters, characters, and combat state are automatically saved to your browser's local storage. This means:

- Your data persists between browser sessions
- Data is stored locally on your device
- No server or database setup required
- Each browser/device has its own separate data

## Technology Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **localStorage** - Data persistence

## License

ISC

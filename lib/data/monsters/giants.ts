/**
 * D&D 5e SRD Giants
 * Source: D&D 5e API (https://www.dnd5eapi.co)
 */

import { MonsterTemplate } from '@/lib/types';

export const GIANTS: Omit<MonsterTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | '_id'>[] = [
  {
    "name": "Cloud Giant",
    "size": "huge",
    "type": "giant",
    "alignment": "neutral good (50%) or neutral evil (50%)",
    "ac": 14,
    "acNote": "natural armor",
    "hp": 200,
    "maxHp": 200,
    "speed": "40 ft.",
    "abilityScores": {
      "strength": 27,
      "dexterity": 10,
      "constitution": 22,
      "intelligence": 12,
      "wisdom": 16,
      "charisma": 16
    },
    "savingThrows": {
      "con": 10,
      "wis": 7,
      "cha": 7
    },
    "skills": {
      "insight": 7,
      "perception": 7
    },
    "senses": {
      "passive_perception": "17"
    },
    "languages": [
      "Common",
      "Giant"
    ],
    "challengeRating": 9,
    "experiencePoints": 5000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The giant has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The giant's innate spellcasting ability is Charisma. It can innately cast the following spells, requiring no material components:\n\nAt will: detect magic, fog cloud, light\n3/day each: feather fall, fly, misty step, telekinesis\n1/day each: control weather, gaseous form"
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The giant makes two morningstar attacks."
      },
      {
        "name": "Morningstar",
        "description": "Melee Weapon Attack: +12 to hit, reach 10 ft., one target. Hit: 21 (3d8 + 8) piercing damage.",
        "attackBonus": 12,
        "damageDescription": "3d8+8 Piercing"
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack: +12 to hit, range 60/240 ft., one target. Hit: 30 (4d10 + 8) bludgeoning damage.",
        "attackBonus": 12,
        "damageDescription": "4d10+8 Bludgeoning"
      }
    ]
  },
  {
    "name": "Ettin",
    "size": "large",
    "type": "giant",
    "alignment": "chaotic evil",
    "ac": 12,
    "acNote": "natural armor",
    "hp": 85,
    "maxHp": 85,
    "speed": "40 ft.",
    "abilityScores": {
      "strength": 21,
      "dexterity": 8,
      "constitution": 17,
      "intelligence": 6,
      "wisdom": 10,
      "charisma": 8
    },
    "skills": {
      "perception": 4
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": "14"
    },
    "languages": [
      "Giant",
      "Orc"
    ],
    "challengeRating": 4,
    "experiencePoints": 1100,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Two Heads",
        "description": "The ettin has advantage on Wisdom (Perception) checks and on saving throws against being blinded, charmed, deafened, frightened, stunned, and knocked unconscious."
      },
      {
        "name": "Wakeful",
        "description": "When one of the ettin's heads is asleep, its other head is awake."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The ettin makes two attacks: one with its battleaxe and one with its morningstar."
      },
      {
        "name": "Battleaxe",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) slashing damage.",
        "attackBonus": 7,
        "damageDescription": "2d8+5 Slashing"
      },
      {
        "name": "Morningstar",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) piercing damage.",
        "attackBonus": 7,
        "damageDescription": "2d8+5 Piercing"
      }
    ]
  },
  {
    "name": "Fire Giant",
    "size": "huge",
    "type": "giant",
    "alignment": "lawful evil",
    "ac": 18,
    "acNote": "armor armor",
    "hp": 162,
    "maxHp": 162,
    "speed": "30 ft.",
    "abilityScores": {
      "strength": 25,
      "dexterity": 9,
      "constitution": 23,
      "intelligence": 10,
      "wisdom": 14,
      "charisma": 13
    },
    "savingThrows": {
      "dex": 3,
      "con": 10,
      "cha": 5
    },
    "skills": {
      "athletics": 11,
      "perception": 6
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "passive_perception": "16"
    },
    "languages": [
      "Giant"
    ],
    "challengeRating": 9,
    "experiencePoints": 5000,
    "source": "SRD",
    "isGlobal": true,
    "actions": [
      {
        "name": "Multiattack",
        "description": "The giant makes two greatsword attacks."
      },
      {
        "name": "Greatsword",
        "description": "Melee Weapon Attack: +11 to hit, reach 10 ft., one target. Hit: 28 (6d6 + 7) slashing damage.",
        "attackBonus": 11,
        "damageDescription": "6d6+7 Slashing"
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack: +11 to hit, range 60/240 ft., one target. Hit: 29 (4d10 + 7) bludgeoning damage.",
        "attackBonus": 11,
        "damageDescription": "4d10+7 Bludgeoning"
      }
    ]
  },
  {
    "name": "Frost Giant",
    "size": "huge",
    "type": "giant",
    "alignment": "neutral evil",
    "ac": 15,
    "acNote": "armor armor",
    "hp": 138,
    "maxHp": 138,
    "speed": "40 ft.",
    "abilityScores": {
      "strength": 23,
      "dexterity": 9,
      "constitution": 21,
      "intelligence": 9,
      "wisdom": 10,
      "charisma": 12
    },
    "savingThrows": {
      "con": 8,
      "wis": 3,
      "cha": 4
    },
    "skills": {
      "athletics": 9,
      "perception": 3
    },
    "damageImmunities": [
      "cold"
    ],
    "senses": {
      "passive_perception": "13"
    },
    "languages": [
      "Giant"
    ],
    "challengeRating": 8,
    "experiencePoints": 3900,
    "source": "SRD",
    "isGlobal": true,
    "actions": [
      {
        "name": "Multiattack",
        "description": "The giant makes two greataxe attacks."
      },
      {
        "name": "Greataxe",
        "description": "Melee Weapon Attack: +9 to hit, reach 10 ft., one target. Hit: 25 (3d12 + 6) slashing damage.",
        "attackBonus": 9,
        "damageDescription": "3d12+6 Slashing"
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack: +9 to hit, range 60/240 ft., one target. Hit: 28 (4d10 + 6) bludgeoning damage.",
        "attackBonus": 9,
        "damageDescription": "4d10+6 Bludgeoning"
      }
    ]
  },
  {
    "name": "Hill Giant",
    "size": "huge",
    "type": "giant",
    "alignment": "chaotic evil",
    "ac": 13,
    "acNote": "natural armor",
    "hp": 105,
    "maxHp": 105,
    "speed": "40 ft.",
    "abilityScores": {
      "strength": 21,
      "dexterity": 8,
      "constitution": 19,
      "intelligence": 5,
      "wisdom": 9,
      "charisma": 6
    },
    "skills": {
      "perception": 2
    },
    "senses": {
      "passive_perception": "12"
    },
    "languages": [
      "Giant"
    ],
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "isGlobal": true,
    "actions": [
      {
        "name": "Multiattack",
        "description": "The giant makes two greatclub attacks."
      },
      {
        "name": "Greatclub",
        "description": "Melee Weapon Attack: +8 to hit, reach 10 ft., one target. Hit: 18 (3d8 + 5) bludgeoning damage.",
        "attackBonus": 8,
        "damageDescription": "3d8+5 Bludgeoning"
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack: +8 to hit, range 60/240 ft., one target. Hit: 21 (3d10 + 5) bludgeoning damage.",
        "attackBonus": 8,
        "damageDescription": "3d10+5 Bludgeoning"
      }
    ]
  },
  {
    "name": "Ogre",
    "size": "large",
    "type": "giant",
    "alignment": "chaotic evil",
    "ac": 11,
    "acNote": "armor armor",
    "hp": 59,
    "maxHp": 59,
    "speed": "40 ft.",
    "abilityScores": {
      "strength": 19,
      "dexterity": 8,
      "constitution": 16,
      "intelligence": 5,
      "wisdom": 7,
      "charisma": 7
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": "8"
    },
    "languages": [
      "Common",
      "Giant"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "isGlobal": true,
    "actions": [
      {
        "name": "Greatclub",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) bludgeoning damage.",
        "attackBonus": 6,
        "damageDescription": "2d8+4 Bludgeoning"
      },
      {
        "name": "Javelin",
        "description": "Melee or Ranged Weapon Attack: +6 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 11 (2d6 + 4) piercing damage.",
        "attackBonus": 6,
        "damageDescription": "2d6+4 Piercing"
      }
    ]
  },
  {
    "name": "Oni",
    "size": "large",
    "type": "giant",
    "alignment": "lawful evil",
    "ac": 16,
    "acNote": "armor armor",
    "hp": 110,
    "maxHp": 110,
    "speed": "30 ft., fly 30 ft.",
    "abilityScores": {
      "strength": 19,
      "dexterity": 11,
      "constitution": 16,
      "intelligence": 14,
      "wisdom": 12,
      "charisma": 15
    },
    "savingThrows": {
      "dex": 3,
      "con": 6,
      "wis": 4,
      "cha": 5
    },
    "skills": {
      "arcana": 5,
      "deception": 8,
      "perception": 4
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": "14"
    },
    "languages": [
      "Common",
      "Giant"
    ],
    "challengeRating": 7,
    "experiencePoints": 2900,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Innate Spellcasting",
        "description": "The oni's innate spellcasting ability is Charisma (spell save DC 13). The oni can innately cast the following spells, requiring no material components:\n\nAt will: darkness, invisibility\n1/day each: charm person, cone of cold, gaseous form, sleep"
      },
      {
        "name": "Magic Weapons",
        "description": "The oni's weapon attacks are magical."
      },
      {
        "name": "Regeneration",
        "description": "The oni regains 10 hit points at the start of its turn if it has at least 1 hit point."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The oni makes two attacks, either with its claws or its glaive."
      },
      {
        "name": "Claw (Oni Form Only)",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) slashing damage.",
        "attackBonus": 7,
        "damageDescription": "1d8+4 Slashing"
      },
      {
        "name": "Glaive",
        "description": "Melee Weapon Attack: +7 to hit, reach 10 ft., one target. Hit: 15 (2d10 + 4) slashing damage, or 9 (1d10 + 4) slashing damage in Small or Medium form.",
        "attackBonus": 7,
        "damageDescription": "2d10+4 Slashing"
      },
      {
        "name": "Change Shape",
        "description": "The oni magically polymorphs into a Small or Medium humanoid, into a Large giant, or back into its true form. Other than its size, its statistics are the same in each form. The only equipment that is transformed is its glaive, which shrinks so that it can be wielded in humanoid form. If the oni dies, it reverts to its true form, and its glaive reverts to its normal size."
      }
    ]
  },
  {
    "name": "Stone Giant",
    "size": "huge",
    "type": "giant",
    "alignment": "neutral",
    "ac": 17,
    "acNote": "natural armor",
    "hp": 126,
    "maxHp": 126,
    "speed": "40 ft.",
    "abilityScores": {
      "strength": 23,
      "dexterity": 15,
      "constitution": 20,
      "intelligence": 10,
      "wisdom": 12,
      "charisma": 9
    },
    "savingThrows": {
      "dex": 5,
      "con": 8,
      "wis": 4
    },
    "skills": {
      "athletics": 12,
      "perception": 4
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": "14"
    },
    "languages": [
      "Giant"
    ],
    "challengeRating": 7,
    "experiencePoints": 2900,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Stone Camouflage",
        "description": "The giant has advantage on Dexterity (Stealth) checks made to hide in rocky terrain."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The giant makes two greatclub attacks."
      },
      {
        "name": "Greatclub",
        "description": "Melee Weapon Attack: +9 to hit, reach 15 ft., one target. Hit: 19 (3d8 + 6) bludgeoning damage.",
        "attackBonus": 9,
        "damageDescription": "3d8+6 Bludgeoning"
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack: +9 to hit, range 60/240 ft., one target. Hit: 28 (4d10 + 6) bludgeoning damage. If the target is a creature, it must succeed on a DC 17 Strength saving throw or be knocked prone.",
        "attackBonus": 9,
        "damageDescription": "4d10+6 Bludgeoning"
      }
    ],
    "reactions": [
      {
        "name": "Rock Catching",
        "description": "If a rock or similar object is hurled at the giant, the giant can, with a successful DC 10 Dexterity saving throw, catch the missile and take no bludgeoning damage from it."
      }
    ]
  },
  {
    "name": "Storm Giant",
    "size": "huge",
    "type": "giant",
    "alignment": "chaotic good",
    "ac": 16,
    "acNote": "armor armor",
    "hp": 230,
    "maxHp": 230,
    "speed": "50 ft., swim 50 ft.",
    "abilityScores": {
      "strength": 29,
      "dexterity": 14,
      "constitution": 20,
      "intelligence": 16,
      "wisdom": 18,
      "charisma": 18
    },
    "savingThrows": {
      "str": 14,
      "con": 10,
      "wis": 9,
      "cha": 9
    },
    "skills": {
      "arcana": 8,
      "athletics": 14,
      "history": 8,
      "perception": 9
    },
    "damageResistances": [
      "cold"
    ],
    "damageImmunities": [
      "lightning",
      "thunder"
    ],
    "senses": {
      "passive_perception": "19"
    },
    "languages": [
      "Common",
      "Giant"
    ],
    "challengeRating": 13,
    "experiencePoints": 10000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Amphibious",
        "description": "The giant can breathe air and water."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The giant's innate spellcasting ability is Charisma (spell save DC 17). It can innately cast the following spells, requiring no material components:\n\nAt will: detect magic, feather fall, levitate, light\n3/day each: control weather, water breathing"
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The giant makes two greatsword attacks."
      },
      {
        "name": "Greatsword",
        "description": "Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 30 (6d6 + 9) slashing damage.",
        "attackBonus": 14,
        "damageDescription": "6d6+9 Slashing"
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack: +14 to hit, range 60/240 ft., one target. Hit: 35 (4d12 + 9) bludgeoning damage.",
        "attackBonus": 14,
        "damageDescription": "4d12+9 Bludgeoning"
      },
      {
        "name": "Lightning Strike",
        "description": "The giant hurls a magical lightning bolt at a point it can see within 500 feet of it. Each creature within 10 feet of that point must make a DC 17 Dexterity saving throw, taking 54 (12d8) lightning damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "12d8 Lightning",
        "saveDC": 17,
        "saveType": "DEX"
      }
    ]
  },
  {
    "name": "Troll",
    "size": "large",
    "type": "giant",
    "alignment": "chaotic evil",
    "ac": 15,
    "acNote": "natural armor",
    "hp": 84,
    "maxHp": 84,
    "speed": "30 ft.",
    "abilityScores": {
      "strength": 18,
      "dexterity": 13,
      "constitution": 20,
      "intelligence": 7,
      "wisdom": 9,
      "charisma": 7
    },
    "skills": {
      "perception": 2
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": "12"
    },
    "languages": [
      "Giant"
    ],
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The troll has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Regeneration",
        "description": "The troll regains 10 hit points at the start of its turn. If the troll takes acid or fire damage, this trait doesn't function at the start of the troll's next turn. The troll dies only if it starts its turn with 0 hit points and doesn't regenerate."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The troll makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 7 (1d6 + 4) piercing damage.",
        "attackBonus": 7,
        "damageDescription": "1d6+4 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage.",
        "attackBonus": 7,
        "damageDescription": "2d6+4 Slashing"
      }
    ]
  }
];

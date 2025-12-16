/**
 * D&D 5e SRD Plants
 * Source: D&D 5e API (https://www.dnd5eapi.co)
 */

import { MonsterTemplate } from '@/lib/types';

export const PLANTS: Omit<MonsterTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | '_id'>[] = [
  {
    "name": "Awakened Shrub",
    "size": "small",
    "type": "plant",
    "alignment": "unaligned",
    "ac": 9,
    "acNote": "dex armor",
    "hp": 10,
    "maxHp": 10,
    "speed": "20 ft.",
    "abilityScores": {
      "strength": 3,
      "dexterity": 8,
      "constitution": 11,
      "intelligence": 10,
      "wisdom": 10,
      "charisma": 6
    },
    "damageResistances": [
      "piercing"
    ],
    "damageVulnerabilities": [
      "fire"
    ],
    "senses": {
      "passive_perception": "10"
    },
    "languages": [
      "one language known by its creator"
    ],
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "False Appearance",
        "description": "While the shrub remains motionless, it is indistinguishable from a normal shrub."
      }
    ],
    "actions": [
      {
        "name": "Rake",
        "description": "Melee Weapon Attack: +1 to hit, reach 5 ft., one target. Hit: 1 (1d4 - 1) slashing damage.",
        "attackBonus": 1,
        "damageDescription": "1d4-1 Slashing"
      }
    ]
  },
  {
    "name": "Awakened Tree",
    "size": "huge",
    "type": "plant",
    "alignment": "unaligned",
    "ac": 13,
    "acNote": "natural armor",
    "hp": 59,
    "maxHp": 59,
    "speed": "20 ft.",
    "abilityScores": {
      "strength": 19,
      "dexterity": 6,
      "constitution": 15,
      "intelligence": 10,
      "wisdom": 10,
      "charisma": 7
    },
    "damageResistances": [
      "bludgeoning",
      "piercing"
    ],
    "damageVulnerabilities": [
      "fire"
    ],
    "senses": {
      "passive_perception": "10"
    },
    "languages": [
      "one language known by its creator"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "False Appearance",
        "description": "While the tree remains motionless, it is indistinguishable from a normal tree."
      }
    ],
    "actions": [
      {
        "name": "Slam",
        "description": "Melee Weapon Attack: +6 to hit, reach 10 ft., one target. Hit: 14 (3d6 + 4) bludgeoning damage.",
        "attackBonus": 6,
        "damageDescription": "3d6+4 Bludgeoning"
      }
    ]
  },
  {
    "name": "Shambling Mound",
    "size": "large",
    "type": "plant",
    "alignment": "unaligned",
    "ac": 15,
    "acNote": "natural armor",
    "hp": 136,
    "maxHp": 136,
    "speed": "20 ft., swim 20 ft.",
    "abilityScores": {
      "strength": 18,
      "dexterity": 8,
      "constitution": 16,
      "intelligence": 5,
      "wisdom": 10,
      "charisma": 5
    },
    "skills": {
      "stealth": 2
    },
    "damageResistances": [
      "cold",
      "fire"
    ],
    "damageImmunities": [
      "lightning"
    ],
    "conditionImmunities": [
      "Blinded",
      "Blinded",
      "Exhaustion"
    ],
    "senses": {
      "blindsight": "60 ft. (blind beyond this radius)",
      "passive_perception": "10"
    },
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Lightning Absorption",
        "description": "Whenever the shambling mound is subjected to lightning damage, it takes no damage and regains a number of hit points equal to the lightning damage dealt."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The shambling mound makes two slam attacks. If both attacks hit a Medium or smaller target, the target is grappled (escape DC 14), and the shambling mound uses its Engulf on it."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) bludgeoning damage.",
        "attackBonus": 7,
        "damageDescription": "2d8+4 Bludgeoning"
      },
      {
        "name": "Engulf",
        "description": "The shambling mound engulfs a Medium or smaller creature grappled by it. The engulfed target is blinded, restrained, and unable to breathe, and it must succeed on a DC 14 Constitution saving throw at the start of each of the mound's turns or take 13 (2d8 + 4) bludgeoning damage. If the mound moves, the engulfed target moves with it. The mound can have only one creature engulfed at a time."
      }
    ]
  },
  {
    "name": "Shrieker",
    "size": "medium",
    "type": "plant",
    "alignment": "unaligned",
    "ac": 5,
    "acNote": "dex armor",
    "hp": 13,
    "maxHp": 13,
    "speed": "0 ft.",
    "abilityScores": {
      "strength": 1,
      "dexterity": 1,
      "constitution": 10,
      "intelligence": 1,
      "wisdom": 3,
      "charisma": 1
    },
    "conditionImmunities": [
      "Blinded",
      "Blinded",
      "Frightened"
    ],
    "senses": {
      "blindsight": "30 ft. (blind beyond this radius)",
      "passive_perception": "6"
    },
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "False Appearance",
        "description": "While the shrieker remains motionless, it is indistinguishable from an ordinary fungus."
      }
    ],
    "reactions": [
      {
        "name": "Shriek",
        "description": "When bright light or a creature is within 30 feet of the shrieker, it emits a shriek audible within 300 feet of it. The shrieker continues to shriek until the disturbance moves out of range and for 1d4 of the shrieker's turns afterward"
      }
    ]
  },
  {
    "name": "Treant",
    "size": "huge",
    "type": "plant",
    "alignment": "chaotic good",
    "ac": 16,
    "acNote": "natural armor",
    "hp": 138,
    "maxHp": 138,
    "speed": "30 ft.",
    "abilityScores": {
      "strength": 23,
      "dexterity": 8,
      "constitution": 21,
      "intelligence": 12,
      "wisdom": 16,
      "charisma": 12
    },
    "damageResistances": [
      "bludgeoning",
      "piercing"
    ],
    "damageVulnerabilities": [
      "fire"
    ],
    "senses": {
      "passive_perception": "13"
    },
    "languages": [
      "Common",
      "Druidic",
      "Elvish",
      "Sylvan"
    ],
    "challengeRating": 9,
    "experiencePoints": 5000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "False Appearance",
        "description": "While the treant remains motionless, it is indistinguishable from a normal tree."
      },
      {
        "name": "Siege Monster",
        "description": "The treant deals double damage to objects and structures."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The treant makes two slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack: +10 to hit, reach 5 ft., one target. Hit: 16 (3d6 + 6) bludgeoning damage.",
        "attackBonus": 10,
        "damageDescription": "3d6+6 Bludgeoning"
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack: +10 to hit, range 60/180 ft., one target. Hit: 28 (4d10 + 6) bludgeoning damage.",
        "attackBonus": 10,
        "damageDescription": "4d10+6 Bludgeoning"
      },
      {
        "name": "Animate Trees",
        "description": "The treant magically animates one or two trees it can see within 60 feet of it. These trees have the same statistics as a treant, except they have Intelligence and Charisma scores of 1, they can't speak, and they have only the Slam action option. An animated tree acts as an ally of the treant. The tree remains animate for 1 day or until it dies; until the treant dies or is more than 120 feet from the tree; or until the treant takes a bonus action to turn it back into an inanimate tree. The tree then takes root if possible."
      }
    ]
  },
  {
    "name": "Violet Fungus",
    "size": "medium",
    "type": "plant",
    "alignment": "unaligned",
    "ac": 5,
    "acNote": "dex armor",
    "hp": 18,
    "maxHp": 18,
    "speed": "5 ft.",
    "abilityScores": {
      "strength": 3,
      "dexterity": 1,
      "constitution": 10,
      "intelligence": 1,
      "wisdom": 3,
      "charisma": 1
    },
    "conditionImmunities": [
      "Blinded",
      "Blinded",
      "Frightened"
    ],
    "senses": {
      "blindsight": "30 ft. (blind beyond this radius)",
      "passive_perception": "6"
    },
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "False Appearance",
        "description": "While the violet fungus remains motionless, it is indistinguishable from an ordinary fungus."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The fungus makes 1d4 Rotting Touch attacks."
      },
      {
        "name": "Rotting Touch",
        "description": "Melee Weapon Attack: +2 to hit, reach 10 ft., one creature. Hit: 4 (1d8) necrotic damage.",
        "attackBonus": 2,
        "damageDescription": "1d8 Necrotic"
      }
    ]
  }
];

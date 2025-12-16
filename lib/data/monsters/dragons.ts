/**
 * D&D 5e SRD Dragons
 * Source: D&D 5e API (https://www.dnd5eapi.co)
 */

import { MonsterTemplate } from '@/lib/types';

export const DRAGONS: Omit<MonsterTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | '_id'>[] = [
  {
    "name": "Adult Black Dragon",
    "size": "huge",
    "type": "dragon",
    "alignment": "chaotic evil",
    "ac": 19,
    "acNote": "natural armor",
    "hp": 195,
    "maxHp": 195,
    "speed": "40 ft., fly 80 ft., swim 40 ft.",
    "abilityScores": {
      "strength": 23,
      "dexterity": 14,
      "constitution": 21,
      "intelligence": 14,
      "wisdom": 13,
      "charisma": 17
    },
    "savingThrows": {
      "dex": 7,
      "con": 10,
      "wis": 6,
      "cha": 8
    },
    "skills": {
      "perception": 11,
      "stealth": 7
    },
    "damageImmunities": [
      "acid"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "21"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 14,
    "experiencePoints": 11500,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      },
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +11 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage plus 4 (1d8) acid damage.",
        "attackBonus": 11,
        "damageDescription": "2d10+6 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +11 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage.",
        "attackBonus": 11,
        "damageDescription": "2d6+6 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +11 to hit, reach 15 ft., one target. Hit: 15 (2d8 + 6) bludgeoning damage.",
        "attackBonus": 11,
        "damageDescription": "2d8+6 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 16 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
        "saveDC": 16,
        "saveType": "WIS"
      },
      {
        "name": "Acid Breath",
        "description": "The dragon exhales acid in a 60-foot line that is 5 feet wide. Each creature in that line must make a DC 18 Dexterity saving throw, taking 54 (12d8) acid damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "12d8 Acid",
        "saveDC": 18,
        "saveType": "DEX"
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 10 ft. of the dragon must succeed on a DC 19 Dexterity saving throw or take 13 (2d6 + 6) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Adult Blue Dragon",
    "size": "huge",
    "type": "dragon",
    "alignment": "lawful evil",
    "ac": 19,
    "acNote": "natural armor",
    "hp": 225,
    "maxHp": 225,
    "speed": "40 ft., burrow 30 ft., fly 80 ft.",
    "abilityScores": {
      "strength": 25,
      "dexterity": 10,
      "constitution": 23,
      "intelligence": 16,
      "wisdom": 15,
      "charisma": 19
    },
    "savingThrows": {
      "dex": 5,
      "con": 11,
      "wis": 7,
      "cha": 9
    },
    "skills": {
      "perception": 12,
      "stealth": 5
    },
    "damageImmunities": [
      "lightning"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "22"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 16,
    "experiencePoints": 15000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +12 to hit, reach 10 ft., one target. Hit: 18 (2d10 + 7) piercing damage plus 5 (1d10) lightning damage.",
        "attackBonus": 12,
        "damageDescription": "2d10+7 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +12 to hit, reach 5 ft., one target. Hit: 14 (2d6 + 7) slashing damage.",
        "attackBonus": 12,
        "damageDescription": "2d6+7 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +12 to hit, reach 15 ft., one target. Hit: 16 (2d8 + 7) bludgeoning damage.",
        "attackBonus": 12,
        "damageDescription": "2d8+7 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 ft. of the dragon and aware of it must succeed on a DC 17 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
        "saveDC": 17,
        "saveType": "WIS"
      },
      {
        "name": "Lightning Breath",
        "description": "The dragon exhales lightning in a 90-foot line that is 5 ft. wide. Each creature in that line must make a DC 19 Dexterity saving throw, taking 66 (12d10) lightning damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "12d10 Lightning",
        "saveDC": 19,
        "saveType": "DEX"
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 10 ft. of the dragon must succeed on a DC 20 Dexterity saving throw or take 14 (2d6 + 7) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Adult Brass Dragon",
    "size": "huge",
    "type": "dragon",
    "alignment": "chaotic good",
    "ac": 18,
    "acNote": "natural armor",
    "hp": 172,
    "maxHp": 172,
    "speed": "40 ft., burrow 40 ft., fly 80 ft.",
    "abilityScores": {
      "strength": 23,
      "dexterity": 10,
      "constitution": 21,
      "intelligence": 14,
      "wisdom": 13,
      "charisma": 17
    },
    "savingThrows": {
      "dex": 5,
      "con": 10,
      "wis": 6,
      "cha": 8
    },
    "skills": {
      "history": 7,
      "perception": 11,
      "persuasion": 8,
      "stealth": 5
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "21"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 13,
    "experiencePoints": 10000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +11 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage.",
        "attackBonus": 11,
        "damageDescription": "2d10+6 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +11 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage.",
        "attackBonus": 11,
        "damageDescription": "2d6+6 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +11 to hit, reach 15 ft., one target. Hit: 15 (2d8 + 6) bludgeoning damage.",
        "attackBonus": 11,
        "damageDescription": "2d8+6 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 16 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours .",
        "saveDC": 16,
        "saveType": "WIS"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nFire Breath. The dragon exhales fire in an 60-foot line that is 5 feet wide. Each creature in that line must make a DC 18 Dexterity saving throw, taking 45 (13d6) fire damage on a failed save, or half as much damage on a successful one.\nSleep Breath. The dragon exhales sleep gas in a 60-foot cone. Each creature in that area must succeed on a DC 18 Constitution saving throw or fall unconscious for 10 minutes. This effect ends for a creature if the creature takes damage or someone uses an action to wake it."
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 10 ft. of the dragon must succeed on a DC 19 Dexterity saving throw or take 13 (2d6 + 6) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Adult Bronze Dragon",
    "size": "huge",
    "type": "dragon",
    "alignment": "lawful good",
    "ac": 19,
    "acNote": "natural armor",
    "hp": 212,
    "maxHp": 212,
    "speed": "40 ft., fly 80 ft., swim 40 ft.",
    "abilityScores": {
      "strength": 25,
      "dexterity": 10,
      "constitution": 23,
      "intelligence": 16,
      "wisdom": 15,
      "charisma": 19
    },
    "savingThrows": {
      "dex": 5,
      "con": 11,
      "wis": 7,
      "cha": 9
    },
    "skills": {
      "insight": 7,
      "perception": 12,
      "stealth": 5
    },
    "damageImmunities": [
      "lightning"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "22"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 15,
    "experiencePoints": 13000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      },
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +12 to hit, reach 10 ft., one target. Hit: 18 (2d10 + 7) piercing damage.",
        "attackBonus": 12,
        "damageDescription": "2d10+7 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +12 to hit, reach 5 ft., one target. Hit: 14 (2d6 + 7) slashing damage.",
        "attackBonus": 12,
        "damageDescription": "2d6+7 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +12 to hit, reach 15 ft., one target. Hit: 16 (2d8 + 7) bludgeoning damage.",
        "attackBonus": 12,
        "damageDescription": "2d8+7 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 17 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
        "saveDC": 17,
        "saveType": "WIS"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nLightning Breath. The dragon exhales lightning in a 90-foot line that is 5 feet wide. Each creature in that line must make a DC 19 Dexterity saving throw, taking 66 (12d10) lightning damage on a failed save, or half as much damage on a successful one.\nRepulsion Breath. The dragon exhales repulsion energy in a 30-foot cone. Each creature in that area must succeed on a DC 19 Strength saving throw. On a failed save, the creature is pushed 60 feet away from the dragon."
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 10 ft. of the dragon must succeed on a DC 20 Dexterity saving throw or take 14 (2d6 + 7) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Adult Copper Dragon",
    "size": "huge",
    "type": "dragon",
    "alignment": "chaotic good",
    "ac": 18,
    "acNote": "natural armor",
    "hp": 184,
    "maxHp": 184,
    "speed": "40 ft., climb 40 ft., fly 80 ft.",
    "abilityScores": {
      "strength": 23,
      "dexterity": 12,
      "constitution": 21,
      "intelligence": 18,
      "wisdom": 15,
      "charisma": 17
    },
    "savingThrows": {
      "dex": 6,
      "con": 10,
      "wis": 7,
      "cha": 8
    },
    "skills": {
      "deception": 8,
      "perception": 12,
      "stealth": 6
    },
    "damageImmunities": [
      "acid"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "22"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 14,
    "experiencePoints": 11500,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +11 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage.",
        "attackBonus": 11,
        "damageDescription": "2d10+6 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +11 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage.",
        "attackBonus": 11,
        "damageDescription": "2d6+6 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +11 to hit, reach 15 ft., one target. Hit: 15 (2d8 + 6) bludgeoning damage.",
        "attackBonus": 11,
        "damageDescription": "2d8+6 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 16 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
        "saveDC": 16,
        "saveType": "WIS"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nAcid Breath. The dragon exhales acid in an 60-foot line that is 5 feet wide. Each creature in that line must make a DC 18 Dexterity saving throw, taking 54 (12d8) acid damage on a failed save, or half as much damage on a successful one.\nSlowing Breath. The dragon exhales gas in a 60-foot cone. Each creature in that area must succeed on a DC 18 Constitution saving throw. On a failed save, the creature can't use reactions, its speed is halved, and it can't make more than one attack on its turn. In addition, the creature can use either an action or a bonus action on its turn, but not both. These effects last for 1 minute. The creature can repeat the saving throw at the end of each of its turns, ending the effect on itself with a successful save."
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 10 ft. of the dragon must succeed on a DC 19 Dexterity saving throw or take 13 (2d6 + 6) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Adult Gold Dragon",
    "size": "huge",
    "type": "dragon",
    "alignment": "lawful good",
    "ac": 19,
    "acNote": "natural armor",
    "hp": 256,
    "maxHp": 256,
    "speed": "40 ft., fly 80 ft., swim 40 ft.",
    "abilityScores": {
      "strength": 27,
      "dexterity": 14,
      "constitution": 25,
      "intelligence": 16,
      "wisdom": 15,
      "charisma": 24
    },
    "savingThrows": {
      "dex": 8,
      "con": 13,
      "wis": 8,
      "cha": 13
    },
    "skills": {
      "insight": 8,
      "perception": 14,
      "persuasion": 13,
      "stealth": 8
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "24"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 17,
    "experiencePoints": 18000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      },
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 19 (2d10 + 8) piercing damage.",
        "attackBonus": 14,
        "damageDescription": "2d10+8 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +14 to hit, reach 5 ft., one target. Hit: 15 (2d6 + 8) slashing damage.",
        "attackBonus": 14,
        "damageDescription": "2d6+8 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +14 to hit, reach 15 ft., one target. Hit: 17 (2d8 + 8) bludgeoning damage.",
        "attackBonus": 14,
        "damageDescription": "2d8+8 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 21 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
        "saveDC": 21,
        "saveType": "WIS"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nFire Breath. The dragon exhales fire in a 60-foot cone. Each creature in that area must make a DC 21 Dexterity saving throw, taking 66 (12d10) fire damage on a failed save, or half as much damage on a successful one.\nWeakening Breath. The dragon exhales gas in a 60-foot cone. Each creature in that area must succeed on a DC 21 Strength saving throw or have disadvantage on Strength-based attack rolls, Strength checks, and Strength saving throws for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 10 ft. of the dragon must succeed on a DC 22 Dexterity saving throw or take 15 (2d6 + 8) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Adult Green Dragon",
    "size": "huge",
    "type": "dragon",
    "alignment": "lawful evil",
    "ac": 19,
    "acNote": "natural armor",
    "hp": 207,
    "maxHp": 207,
    "speed": "40 ft., fly 80 ft., swim 40 ft.",
    "abilityScores": {
      "strength": 23,
      "dexterity": 12,
      "constitution": 21,
      "intelligence": 18,
      "wisdom": 15,
      "charisma": 17
    },
    "savingThrows": {
      "dex": 6,
      "con": 10,
      "wis": 7,
      "cha": 8
    },
    "skills": {
      "deception": 8,
      "insight": 7,
      "perception": 12,
      "persuasion": 8,
      "stealth": 6
    },
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "Poisoned"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "22"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 15,
    "experiencePoints": 13000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      },
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +11 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage plus 7 (2d6) poison damage.",
        "attackBonus": 11,
        "damageDescription": "2d10+6 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +11 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage.",
        "attackBonus": 11,
        "damageDescription": "2d6+6 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +11 to hit, reach 15 ft., one target. Hit: 15 (2d8 + 6) bludgeoning damage.",
        "attackBonus": 11,
        "damageDescription": "2d8+6 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 16 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours .",
        "saveDC": 16,
        "saveType": "WIS"
      },
      {
        "name": "Poison Breath",
        "description": "The dragon exhales poisonous gas in a 60-foot cone. Each creature in that area must make a DC 18 Constitution saving throw, taking 56 (16d6) poison damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "16d6 Poison",
        "saveDC": 18,
        "saveType": "CON"
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 10 ft. of the dragon must succeed on a DC 19 Dexterity saving throw or take 13 (2d6 + 6) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Adult Red Dragon",
    "size": "huge",
    "type": "dragon",
    "alignment": "chaotic evil",
    "ac": 19,
    "acNote": "natural armor",
    "hp": 256,
    "maxHp": 256,
    "speed": "40 ft., climb 40 ft., fly 80 ft.",
    "abilityScores": {
      "strength": 27,
      "dexterity": 10,
      "constitution": 25,
      "intelligence": 16,
      "wisdom": 13,
      "charisma": 21
    },
    "savingThrows": {
      "dex": 6,
      "con": 13,
      "wis": 7,
      "cha": 11
    },
    "skills": {
      "perception": 13,
      "stealth": 6
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "23"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 17,
    "experiencePoints": 18000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 19 (2d10 + 8) piercing damage plus 7 (2d6) fire damage.",
        "attackBonus": 14,
        "damageDescription": "2d10+8 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +14 to hit, reach 5 ft., one target. Hit: 15 (2d6 + 8) slashing damage.",
        "attackBonus": 14,
        "damageDescription": "2d6+8 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +14 to hit, reach 15 ft., one target. Hit: 17 (2d8 + 8) bludgeoning damage.",
        "attackBonus": 14,
        "damageDescription": "2d8+8 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 ft. of the dragon and aware of it must succeed on a DC 19 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
        "saveDC": 19,
        "saveType": "WIS"
      },
      {
        "name": "Fire Breath",
        "description": "The dragon exhales fire in a 60-foot cone. Each creature in that area must make a DC 21 Dexterity saving throw, taking 63 (18d6) fire damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "18d6 Fire",
        "saveDC": 21,
        "saveType": "DEX"
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 10 ft. of the dragon must succeed on a DC 22 Dexterity saving throw or take 15 (2d6 + 8) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Adult Silver Dragon",
    "size": "huge",
    "type": "dragon",
    "alignment": "lawful good",
    "ac": 19,
    "acNote": "natural armor",
    "hp": 243,
    "maxHp": 243,
    "speed": "40 ft., fly 80 ft.",
    "abilityScores": {
      "strength": 27,
      "dexterity": 10,
      "constitution": 25,
      "intelligence": 16,
      "wisdom": 13,
      "charisma": 21
    },
    "savingThrows": {
      "dex": 5,
      "con": 12,
      "wis": 6,
      "cha": 10
    },
    "skills": {
      "arcana": 8,
      "history": 8,
      "perception": 11,
      "stealth": 5
    },
    "damageImmunities": [
      "cold"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "21"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 16,
    "experiencePoints": 15000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +13 to hit, reach 10 ft., one target. Hit: 19 (2d10 + 8) piercing damage.",
        "attackBonus": 13,
        "damageDescription": "2d10+8 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +13 to hit, reach 5 ft., one target. Hit: 15 (2d6 + 8) slashing damage.",
        "attackBonus": 13,
        "damageDescription": "2d6+8 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +13 to hit, reach 15 ft., one target. Hit: 17 (2d8 + 8) bludgeoning damage.",
        "attackBonus": 13,
        "damageDescription": "2d8+8 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 18 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
        "saveDC": 18,
        "saveType": "WIS"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nCold Breath. The dragon exhales an icy blast in a 60-foot cone. Each creature in that area must make a DC 20 Constitution saving throw, taking 58 (13d8) cold damage on a failed save, or half as much damage on a successful one.\nParalyzing Breath. The dragon exhales paralyzing gas in a 60-foot cone. Each creature in that area must succeed on a DC 20 Constitution saving throw or be paralyzed for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 10 ft. of the dragon must succeed on a DC 22 Dexterity saving throw or take 15 (2d6 + 8) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Adult White Dragon",
    "size": "huge",
    "type": "dragon",
    "alignment": "chaotic evil",
    "ac": 18,
    "acNote": "natural armor",
    "hp": 200,
    "maxHp": 200,
    "speed": "40 ft., burrow 30 ft., fly 80 ft., swim 40 ft.",
    "abilityScores": {
      "strength": 22,
      "dexterity": 10,
      "constitution": 22,
      "intelligence": 8,
      "wisdom": 12,
      "charisma": 12
    },
    "savingThrows": {
      "dex": 5,
      "con": 11,
      "wis": 6,
      "cha": 6
    },
    "skills": {
      "perception": 11,
      "stealth": 5
    },
    "damageImmunities": [
      "cold"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "21"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 13,
    "experiencePoints": 10000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Ice Walk",
        "description": "The dragon can move across and climb icy surfaces without needing to make an ability check. Additionally, difficult terrain composed of ice or snow doesn't cost it extra moment."
      },
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +11 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage plus 4 (1d8) cold damage.",
        "attackBonus": 11,
        "damageDescription": "2d10+6 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +11 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage.",
        "attackBonus": 11,
        "damageDescription": "2d6+6 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +11 to hit, reach 15 ft., one target. Hit: 15 (2d8 + 6) bludgeoning damage.",
        "attackBonus": 11,
        "damageDescription": "2d8+6 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 ft. of the dragon and aware of it must succeed on a DC 14 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
        "saveDC": 14,
        "saveType": "WIS"
      },
      {
        "name": "Cold Breath",
        "description": "The dragon exhales an icy blast in a 60-foot cone. Each creature in that area must make a DC 19 Constitution saving throw, taking 54 (12d8) cold damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "12d8 Cold",
        "saveDC": 19,
        "saveType": "CON"
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 10 ft. of the dragon must succeed on a DC 19 Dexterity saving throw or take 13 (2d6 + 6) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Ancient Black Dragon",
    "size": "gargantuan",
    "type": "dragon",
    "alignment": "chaotic evil",
    "ac": 22,
    "acNote": "natural armor",
    "hp": 367,
    "maxHp": 367,
    "speed": "40 ft., fly 80 ft., swim 40 ft.",
    "abilityScores": {
      "strength": 27,
      "dexterity": 14,
      "constitution": 25,
      "intelligence": 16,
      "wisdom": 15,
      "charisma": 19
    },
    "savingThrows": {
      "dex": 9,
      "con": 14,
      "wis": 9,
      "cha": 11
    },
    "skills": {
      "perception": 16,
      "stealth": 9
    },
    "damageImmunities": [
      "acid"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "26"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 21,
    "experiencePoints": 33000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      },
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack:+ 15 to hit, reach 15 ft., one target. Hit: 19 (2d10 + 8) piercing damage plus 9 (2d8) acid damage.",
        "attackBonus": 15,
        "damageDescription": "2d10+8 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +15 to hit, reach 10 ft., one target. Hit: 15 (2d6 + 8) slashing damage.",
        "attackBonus": 15,
        "damageDescription": "2d6+8 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +15 to hit, reach 20 ft., one target. Hit: 17 (2d8 + 8) bludgeoning damage.",
        "attackBonus": 15,
        "damageDescription": "2d8+8 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 19 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
        "saveDC": 19,
        "saveType": "WIS"
      },
      {
        "name": "Acid Breath",
        "description": "The dragon exhales acid in a 90-foot line that is 10 feet wide. Each creature in that line must make a DC 22 Dexterity saving throw, taking 67 (15d8) acid damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "15d8 Acid",
        "saveDC": 22,
        "saveType": "DEX"
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 15 ft. of the dragon must succeed on a DC 23 Dexterity saving throw or take 15 (2d6 + 8) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Ancient Blue Dragon",
    "size": "gargantuan",
    "type": "dragon",
    "alignment": "lawful evil",
    "ac": 22,
    "acNote": "natural armor",
    "hp": 481,
    "maxHp": 481,
    "speed": "40 ft., burrow 40 ft., fly 80 ft.",
    "abilityScores": {
      "strength": 29,
      "dexterity": 10,
      "constitution": 27,
      "intelligence": 18,
      "wisdom": 17,
      "charisma": 21
    },
    "savingThrows": {
      "dex": 7,
      "con": 15,
      "wis": 10,
      "cha": 12
    },
    "skills": {
      "perception": 17,
      "stealth": 7
    },
    "damageImmunities": [
      "lightning"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "27"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 23,
    "experiencePoints": 50000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +16 to hit, reach 15 ft., one target. Hit: 20 (2d10 + 9) piercing damage plus 11 (2d10) lightning damage.",
        "attackBonus": 16,
        "damageDescription": "2d10+9 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +16 to hit, reach 10 ft., one target. Hit: 16 (2d6 + 9) slashing damage.",
        "attackBonus": 16,
        "damageDescription": "2d6+9 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +16 to hit, reach 20 ft., one target. Hit: 18 (2d8 + 9) bludgeoning damage.",
        "attackBonus": 16,
        "damageDescription": "2d8+9 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 20 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
        "saveDC": 20,
        "saveType": "WIS"
      },
      {
        "name": "Lightning Breath",
        "description": "The dragon exhales lightning in a 120-foot line that is 10 feet wide. Each creature in that line must make a DC 23 Dexterity saving throw, taking 88 (16d10) lightning damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "16d10 Lightning",
        "saveDC": 23,
        "saveType": "DEX"
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 15 ft. of the dragon must succeed on a DC 24 Dexterity saving throw or take 16 (2d6 + 9) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Ancient Brass Dragon",
    "size": "gargantuan",
    "type": "dragon",
    "alignment": "chaotic good",
    "ac": 20,
    "acNote": "natural armor",
    "hp": 297,
    "maxHp": 297,
    "speed": "40 ft., burrow 40 ft., fly 80 ft.",
    "abilityScores": {
      "strength": 27,
      "dexterity": 10,
      "constitution": 25,
      "intelligence": 16,
      "wisdom": 15,
      "charisma": 19
    },
    "savingThrows": {
      "dex": 6,
      "con": 13,
      "wis": 8,
      "cha": 10
    },
    "skills": {
      "history": 9,
      "perception": 14,
      "persuasion": 10,
      "stealth": 6
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "24"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 20,
    "experiencePoints": 25000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +14 to hit, reach 15 ft., one target. Hit: 19 (2d10 + 8) piercing damage.",
        "attackBonus": 14,
        "damageDescription": "2d10+8 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 15 (2d6 + 8) slashing damage.",
        "attackBonus": 14,
        "damageDescription": "2d6+8 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +14 to hit, reach 20 ft., one target. Hit: 17 (2d8 + 8) bludgeoning damage.",
        "attackBonus": 14,
        "damageDescription": "2d8+8 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 18 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
        "saveDC": 18,
        "saveType": "WIS"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons:\nFire Breath. The dragon exhales fire in an 90-foot line that is 10 feet wide. Each creature in that line must make a DC 21 Dexterity saving throw, taking 56 (16d6) fire damage on a failed save, or half as much damage on a successful one.\nSleep Breath. The dragon exhales sleep gas in a 90-foot cone. Each creature in that area must succeed on a DC 21 Constitution saving throw or fall unconscious for 10 minutes. This effect ends for a creature if the creature takes damage or someone uses an action to wake it."
      },
      {
        "name": "Change Shape",
        "description": "The dragon magically polymorphs into a humanoid or beast that has a challenge rating no higher than its own, or back into its true form. It reverts to its true form if it dies. Any equipment it is wearing or carrying is absorbed or borne by the new form (the dragon's choice).\nIn a new form, the dragon retains its alignment, hit points, Hit Dice, ability to speak, proficiencies, Legendary Resistance, lair actions, and Intelligence, Wisdom, and Charisma scores, as well as this action. Its statistics and capabilities are otherwise replaced by those of the new form, except any class features or legendary actions of that form."
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 15 ft. of the dragon must succeed on a DC 22 Dexterity saving throw or take 15 (2d6 + 8) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Ancient Bronze Dragon",
    "size": "gargantuan",
    "type": "dragon",
    "alignment": "lawful good",
    "ac": 22,
    "acNote": "natural armor",
    "hp": 444,
    "maxHp": 444,
    "speed": "40 ft., fly 80 ft., swim 40 ft.",
    "abilityScores": {
      "strength": 29,
      "dexterity": 10,
      "constitution": 27,
      "intelligence": 18,
      "wisdom": 17,
      "charisma": 21
    },
    "savingThrows": {
      "dex": 7,
      "con": 15,
      "wis": 10,
      "cha": 12
    },
    "skills": {
      "insight": 10,
      "perception": 17,
      "stealth": 7
    },
    "damageImmunities": [
      "lightning"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "27"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 22,
    "experiencePoints": 41000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      },
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +16 to hit, reach 15 ft., one target. Hit: 20 (2d10 + 9) piercing damage.",
        "attackBonus": 16,
        "damageDescription": "2d10+9 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +16 to hit, reach 10 ft., one target. Hit: 16 (2d6 + 9) slashing damage.",
        "attackBonus": 16,
        "damageDescription": "2d6+9 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +16 to hit, reach 20 ft., one target. Hit: 18 (2d8 + 9) bludgeoning damage.",
        "attackBonus": 16,
        "damageDescription": "2d8+9 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 20 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
        "saveDC": 20,
        "saveType": "WIS"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nLightning Breath. The dragon exhales lightning in a 120-foot line that is 10 feet wide. Each creature in that line must make a DC 23 Dexterity saving throw, taking 88 (16d10) lightning damage on a failed save, or half as much damage on a successful one.\nRepulsion Breath. The dragon exhales repulsion energy in a 30-foot cone. Each creature in that area must succeed on a DC 23 Strength saving throw. On a failed save, the creature is pushed 60 feet away from the dragon."
      },
      {
        "name": "Change Shape",
        "description": "The dragon magically polymorphs into a humanoid or beast that has a challenge rating no higher than its own, or back into its true form. It reverts to its true form if it dies. Any equipment it is wearing or carrying is absorbed or borne by the new form (the dragon's choice).\nIn a new form, the dragon retains its alignment, hit points, Hit Dice, ability to speak, proficiencies, Legendary Resistance, lair actions, and Intelligence, Wisdom, and Charisma scores, as well as this action. Its statistics and capabilities are otherwise replaced by those of the new form, except any class features or legendary actions of that form."
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 15 ft. of the dragon must succeed on a DC 24 Dexterity saving throw or take 16 (2d6 + 9) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Ancient Copper Dragon",
    "size": "gargantuan",
    "type": "dragon",
    "alignment": "chaotic good",
    "ac": 21,
    "acNote": "natural armor",
    "hp": 350,
    "maxHp": 350,
    "speed": "40 ft., climb 40 ft., fly 80 ft.",
    "abilityScores": {
      "strength": 27,
      "dexterity": 12,
      "constitution": 25,
      "intelligence": 20,
      "wisdom": 17,
      "charisma": 19
    },
    "savingThrows": {
      "dex": 8,
      "con": 14,
      "wis": 10,
      "cha": 11
    },
    "skills": {
      "deception": 11,
      "perception": 17,
      "stealth": 8
    },
    "damageImmunities": [
      "acid"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "27"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 21,
    "experiencePoints": 33000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +15 to hit, reach 15 ft., one target. Hit: 19 (2d10 + 8) piercing damage.",
        "attackBonus": 15,
        "damageDescription": "2d10+8 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +15 to hit, reach 10 ft., one target. Hit: 15 (2d6 + 8) slashing damage.",
        "attackBonus": 15,
        "damageDescription": "2d6+8 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +15 to hit, reach 20 ft., one target. Hit: 17 (2d8 + 8) bludgeoning damage.",
        "attackBonus": 15,
        "damageDescription": "2d8+8 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 19 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
        "saveDC": 19,
        "saveType": "WIS"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nAcid Breath. The dragon exhales acid in an 90-foot line that is 10 feet wide. Each creature in that line must make a DC 22 Dexterity saving throw, taking 63 (14d8) acid damage on a failed save, or half as much damage on a successful one.\nSlowing Breath. The dragon exhales gas in a 90-foot cone. Each creature in that area must succeed on a DC 22 Constitution saving throw. On a failed save, the creature can't use reactions, its speed is halved, and it can't make more than one attack on its turn. In addition, the creature can use either an action or a bonus action on its turn, but not both. These effects last for 1 minute. The creature can repeat the saving throw at the end of each of its turns, ending the effect on itself with a successful save."
      },
      {
        "name": "Change Shape",
        "description": "The dragon magically polymorphs into a humanoid or beast that has a challenge rating no higher than its own, or back into its true form. It reverts to its true form if it dies. Any equipment it is wearing or carrying is absorbed or borne by the new form (the dragon's choice).\nIn a new form, the dragon retains its alignment, hit points, Hit Dice, ability to speak, proficiencies, Legendary Resistance, lair actions, and Intelligence, Wisdom, and Charisma scores, as well as this action. Its statistics and capabilities are otherwise replaced by those of the new form, except any class features or legendary actions of that form."
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 15 ft. of the dragon must succeed on a DC 23 Dexterity saving throw or take 15 (2d6 + 8) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Ancient Gold Dragon",
    "size": "gargantuan",
    "type": "dragon",
    "alignment": "lawful good",
    "ac": 22,
    "acNote": "natural armor",
    "hp": 546,
    "maxHp": 546,
    "speed": "40 ft., fly 80 ft., swim 40 ft.",
    "abilityScores": {
      "strength": 30,
      "dexterity": 14,
      "constitution": 29,
      "intelligence": 18,
      "wisdom": 17,
      "charisma": 28
    },
    "savingThrows": {
      "dex": 9,
      "con": 16,
      "wis": 10,
      "cha": 16
    },
    "skills": {
      "insight": 10,
      "perception": 17,
      "persuasion": 16,
      "stealth": 9
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "27"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 24,
    "experiencePoints": 62000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      },
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +17 to hit, reach 15 ft., one target. Hit: 21 (2d10 + 10) piercing damage.",
        "attackBonus": 17,
        "damageDescription": "2d10+10 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +17 to hit, reach 10 ft., one target. Hit: 17 (2d6 + 10) slashing damage.",
        "attackBonus": 17,
        "damageDescription": "2d6+10 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +17 to hit, reach 20 ft., one target. Hit: 19 (2d8 + 10) bludgeoning damage.",
        "attackBonus": 17,
        "damageDescription": "2d8+10 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 24 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
        "saveDC": 24,
        "saveType": "WIS"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nFire Breath. The dragon exhales fire in a 90-foot cone. Each creature in that area must make a DC 24 Dexterity saving throw, taking 71 (13d10) fire damage on a failed save, or half as much damage on a successful one.\nWeakening Breath. The dragon exhales gas in a 90-foot cone. Each creature in that area must succeed on a DC 24 Strength saving throw or have disadvantage on Strength-based attack rolls, Strength checks, and Strength saving throws for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
      },
      {
        "name": "Change Shape",
        "description": "The dragon magically polymorphs into a humanoid or beast that has a challenge rating no higher than its own, or back into its true form. It reverts to its true form if it dies. Any equipment it is wearing or carrying is absorbed or borne by the new form (the dragon's choice).\nIn a new form, the dragon retains its alignment, hit points, Hit Dice, ability to speak, proficiencies, Legendary Resistance, lair actions, and Intelligence, Wisdom, and Charisma scores, as well as this action. Its statistics and capabilities are otherwise replaced by those of the new form, except any class features or legendary actions of that form."
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 15 ft. of the dragon must succeed on a DC 25 Dexterity saving throw or take 17 (2d6 + 10) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Ancient Green Dragon",
    "size": "gargantuan",
    "type": "dragon",
    "alignment": "lawful evil",
    "ac": 21,
    "acNote": "natural armor",
    "hp": 385,
    "maxHp": 385,
    "speed": "40 ft., fly 80 ft., swim 40 ft.",
    "abilityScores": {
      "strength": 27,
      "dexterity": 12,
      "constitution": 25,
      "intelligence": 20,
      "wisdom": 17,
      "charisma": 19
    },
    "savingThrows": {
      "dex": 8,
      "con": 14,
      "wis": 10,
      "cha": 11
    },
    "skills": {
      "deception": 11,
      "insight": 10,
      "perception": 17,
      "persuasion": 11,
      "stealth": 8
    },
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "Poisoned"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "27"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 22,
    "experiencePoints": 41000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      },
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +15 to hit, reach 15 ft., one target. Hit: 19 (2d10 + 8) piercing damage plus 10 (3d6) poison damage.",
        "attackBonus": 15,
        "damageDescription": "2d10+8 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +15 to hit, reach 10 ft., one target. Hit: 22 (4d6 + 8) slashing damage.",
        "attackBonus": 15,
        "damageDescription": "4d6+8 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +15 to hit, reach 20 ft., one target. Hit: 17 (2d8 + 8) bludgeoning damage.",
        "attackBonus": 15,
        "damageDescription": "2d8+8 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 19 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
        "saveDC": 19,
        "saveType": "WIS"
      },
      {
        "name": "Poison Breath",
        "description": "The dragon exhales poisonous gas in a 90-foot cone. Each creature in that area must make a DC 22 Constitution saving throw, taking 77 (22d6) poison damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "22d6 Poison",
        "saveDC": 22,
        "saveType": "CON"
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 15 ft. of the dragon must succeed on a DC 23 Dexterity saving throw or take 15 (2d6 + 8) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Ancient Red Dragon",
    "size": "gargantuan",
    "type": "dragon",
    "alignment": "chaotic evil",
    "ac": 22,
    "acNote": "natural armor",
    "hp": 546,
    "maxHp": 546,
    "speed": "40 ft., climb 40 ft., fly 80 ft.",
    "abilityScores": {
      "strength": 30,
      "dexterity": 10,
      "constitution": 29,
      "intelligence": 18,
      "wisdom": 15,
      "charisma": 23
    },
    "savingThrows": {
      "dex": 7,
      "con": 16,
      "wis": 9,
      "cha": 13
    },
    "skills": {
      "perception": 16,
      "stealth": 7
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "26"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 24,
    "experiencePoints": 62000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +17 to hit, reach 15 ft., one target. Hit: 21 (2d10 + 10) piercing damage plus 14 (4d6) fire damage.",
        "attackBonus": 17,
        "damageDescription": "2d10+10 Bludgeoning"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +17 to hit, reach 10 ft., one target. Hit: 17 (2d6 + 10) slashing damage.",
        "attackBonus": 17,
        "damageDescription": "2d6+10 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +17 to hit, reach 20 ft., one target. Hit: 19 (2d8 + 10) bludgeoning damage.",
        "attackBonus": 17,
        "damageDescription": "2d8+10 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 21 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
        "saveDC": 21,
        "saveType": "WIS"
      },
      {
        "name": "Fire Breath",
        "description": "The dragon exhales fire in a 90-foot cone. Each creature in that area must make a DC 24 Dexterity saving throw, taking 91 (26d6) fire damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "26d6 Fire",
        "saveDC": 24,
        "saveType": "DEX"
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 15 ft. of the dragon must succeed on a DC 25 Dexterity saving throw or take 17 (2d6 + 10) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Ancient Silver Dragon",
    "size": "gargantuan",
    "type": "dragon",
    "alignment": "lawful good",
    "ac": 22,
    "acNote": "natural armor",
    "hp": 487,
    "maxHp": 487,
    "speed": "40 ft., fly 80 ft.",
    "abilityScores": {
      "strength": 30,
      "dexterity": 10,
      "constitution": 29,
      "intelligence": 18,
      "wisdom": 15,
      "charisma": 23
    },
    "savingThrows": {
      "dex": 7,
      "con": 16,
      "wis": 9,
      "cha": 13
    },
    "skills": {
      "arcana": 11,
      "history": 11,
      "perception": 16,
      "stealth": 7
    },
    "damageImmunities": [
      "cold"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "26"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 23,
    "experiencePoints": 50000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +17 to hit, reach 15 ft., one target. Hit: 21 (2d10 + 10) piercing damage.",
        "attackBonus": 17,
        "damageDescription": "2d10+10 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +17 to hit, reach 10 ft., one target. Hit: 17 (2d6 + 10) slashing damage.",
        "attackBonus": 17,
        "damageDescription": "2d6+10 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +17 to hit, reach 20 ft., one target. Hit: 19 (2d8 + 10) bludgeoning damage.",
        "attackBonus": 17,
        "damageDescription": "2d8+10 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 21 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
        "saveDC": 21,
        "saveType": "WIS"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nCold Breath. The dragon exhales an icy blast in a 90-foot cone. Each creature in that area must make a DC 24 Constitution saving throw, taking 67 (15d8) cold damage on a failed save, or half as much damage on a successful one.\nParalyzing Breath. The dragon exhales paralyzing gas in a 90- foot cone. Each creature in that area must succeed on a DC 24 Constitution saving throw or be paralyzed for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
      },
      {
        "name": "Change Shape",
        "description": "The dragon magically polymorphs into a humanoid or beast that has a challenge rating no higher than its own, or back into its true form. It reverts to its true form if it dies. Any equipment it is wearing or carrying is absorbed or borne by the new form (the dragon's choice).\nIn a new form, the dragon retains its alignment, hit points, Hit Dice, ability to speak, proficiencies, Legendary Resistance, lair actions, and Intelligence, Wisdom, and Charisma scores, as well as this action. Its statistics and capabilities are otherwise replaced by those of the new form, except any class features or legendary actions of that form."
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 15 ft. of the dragon must succeed on a DC 25 Dexterity saving throw or take 17 (2d6 + 10) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Ancient White Dragon",
    "size": "gargantuan",
    "type": "dragon",
    "alignment": "chaotic evil",
    "ac": 20,
    "acNote": "natural armor",
    "hp": 333,
    "maxHp": 333,
    "speed": "40 ft., burrow 40 ft., fly 80 ft., swim 40 ft.",
    "abilityScores": {
      "strength": 26,
      "dexterity": 10,
      "constitution": 26,
      "intelligence": 10,
      "wisdom": 13,
      "charisma": 14
    },
    "savingThrows": {
      "dex": 6,
      "con": 14,
      "wis": 7,
      "cha": 8
    },
    "skills": {
      "perception": 13,
      "stealth": 6
    },
    "damageImmunities": [
      "cold"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "23"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 20,
    "experiencePoints": 25000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Ice Walk",
        "description": "The dragon can move across and climb icy surfaces without needing to make an ability check. Additionally, difficult terrain composed of ice or snow doesn't cost it extra moment."
      },
      {
        "name": "Legendary Resistance",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +14 to hit, reach 15 ft., one target. Hit: 19 (2d10 + 8) piercing damage plus 9 (2d8) cold damage.",
        "attackBonus": 14,
        "damageDescription": "2d10+8 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 15 (2d6 + 8) slashing damage.",
        "attackBonus": 14,
        "damageDescription": "2d6+8 Slashing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +14 to hit, reach 20 ft., one target. Hit: 17 (2d8 + 8) bludgeoning damage.",
        "attackBonus": 14,
        "damageDescription": "2d8+8 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 16 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours .",
        "saveDC": 16,
        "saveType": "WIS"
      },
      {
        "name": "Cold Breath",
        "description": "The dragon exhales an icy blast in a 90-foot cone. Each creature in that area must make a DC 22 Constitution saving throw, taking 72 (l6d8) cold damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "16d8 Cold",
        "saveDC": 22,
        "saveType": "CON"
      }
    ],
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail Attack",
        "description": "The dragon makes a tail attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its wings. Each creature within 15 ft. of the dragon must succeed on a DC 22 Dexterity saving throw or take 15 (2d6 + 8) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed."
      }
    ]
  },
  {
    "name": "Black Dragon Wyrmling",
    "size": "medium",
    "type": "dragon",
    "alignment": "chaotic evil",
    "ac": 17,
    "acNote": "natural armor",
    "hp": 33,
    "maxHp": 33,
    "speed": "30 ft., fly 60 ft., swim 30 ft.",
    "abilityScores": {
      "strength": 15,
      "dexterity": 14,
      "constitution": 13,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 13
    },
    "savingThrows": {
      "dex": 4,
      "con": 3,
      "wis": 2,
      "cha": 3
    },
    "skills": {
      "perception": 4,
      "stealth": 4
    },
    "damageImmunities": [
      "acid"
    ],
    "senses": {
      "blindsight": "10 ft.",
      "darkvision": "60 ft.",
      "passive_perception": "14"
    },
    "languages": [
      "Draconic"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (1d10 + 2) piercing damage plus 2 (1d4) acid damage.",
        "attackBonus": 4,
        "damageDescription": "1d10+2 Piercing"
      },
      {
        "name": "Acid Breath",
        "description": "The dragon exhales acid in a 15-foot line that is 5 feet wide. Each creature in that line must make a DC 11 Dexterity saving throw, taking 22 (5d8) acid damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "5d8 Acid",
        "saveDC": 11,
        "saveType": "DEX"
      }
    ]
  },
  {
    "name": "Blue Dragon Wyrmling",
    "size": "medium",
    "type": "dragon",
    "alignment": "lawful evil",
    "ac": 17,
    "acNote": "natural armor",
    "hp": 52,
    "maxHp": 52,
    "speed": "30 ft., burrow 15 ft., fly 60 ft.",
    "abilityScores": {
      "strength": 17,
      "dexterity": 10,
      "constitution": 15,
      "intelligence": 12,
      "wisdom": 11,
      "charisma": 15
    },
    "savingThrows": {
      "dex": 2,
      "con": 4,
      "wis": 2,
      "cha": 4
    },
    "skills": {
      "perception": 4,
      "stealth": 2
    },
    "damageImmunities": [
      "lightning"
    ],
    "senses": {
      "blindsight": "10 ft.",
      "darkvision": "60 ft.",
      "passive_perception": "14"
    },
    "languages": [
      "Draconic"
    ],
    "challengeRating": 3,
    "experiencePoints": 700,
    "source": "SRD",
    "isGlobal": true,
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (1d10 + 3) piercing damage plus 3 (1d6) lightning damage.",
        "attackBonus": 5,
        "damageDescription": "1d10+3 Piercing"
      },
      {
        "name": "Lightning Breath",
        "description": "The dragon exhales lightning in a 30-foot line that is 5 feet wide. Each creature in that line must make a DC 12 Dexterity saving throw, taking 22 (4d10) lightning damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "4d10 Bludgeoning",
        "saveDC": 12,
        "saveType": "DEX"
      }
    ]
  },
  {
    "name": "Brass Dragon Wyrmling",
    "size": "medium",
    "type": "dragon",
    "alignment": "chaotic good",
    "ac": 16,
    "acNote": "natural armor",
    "hp": 16,
    "maxHp": 16,
    "speed": "30 ft., burrow 15 ft., fly 60 ft.",
    "abilityScores": {
      "strength": 15,
      "dexterity": 10,
      "constitution": 13,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 13
    },
    "savingThrows": {
      "dex": 2,
      "con": 3,
      "wis": 2,
      "cha": 3
    },
    "skills": {
      "perception": 4,
      "stealth": 2
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "blindsight": "10 ft.",
      "darkvision": "60 ft.",
      "passive_perception": "14"
    },
    "languages": [
      "Draconic"
    ],
    "challengeRating": 1,
    "experiencePoints": 100,
    "source": "SRD",
    "isGlobal": true,
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (1d10 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d10+2 Piercing"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nFire Breath. The dragon exhales fire in an 20-foot line that is 5 feet wide. Each creature in that line must make a DC 11 Dexterity saving throw, taking 14 (4d6) fire damage on a failed save, or half as much damage on a successful one.\nSleep Breath. The dragon exhales sleep gas in a 15-foot cone. Each creature in that area must succeed on a DC 11 Constitution saving throw or fall unconscious for 1 minute. This effect ends for a creature if the creature takes damage or someone uses an action to wake it."
      }
    ]
  },
  {
    "name": "Bronze Dragon Wyrmling",
    "size": "medium",
    "type": "dragon",
    "alignment": "lawful good",
    "ac": 17,
    "acNote": "natural armor",
    "hp": 32,
    "maxHp": 32,
    "speed": "30 ft., fly 60 ft., swim 30 ft.",
    "abilityScores": {
      "strength": 17,
      "dexterity": 10,
      "constitution": 15,
      "intelligence": 12,
      "wisdom": 11,
      "charisma": 15
    },
    "savingThrows": {
      "dex": 2,
      "con": 4,
      "wis": 2,
      "cha": 4
    },
    "skills": {
      "perception": 4,
      "stealth": 2
    },
    "damageImmunities": [
      "lightning"
    ],
    "senses": {
      "blindsight": "10 ft.",
      "darkvision": "60 ft.",
      "passive_perception": "14"
    },
    "languages": [
      "Draconic"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (1d10 + 3) piercing damage.",
        "attackBonus": 5,
        "damageDescription": "1d10+3 Piercing"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nLightning Breath. The dragon exhales lightning in a 40-foot line that is 5 feet wide. Each creature in that line must make a DC 12 Dexterity saving throw, taking 16 (3d10) lightning damage on a failed save, or half as much damage on a successful one.\nRepulsion Breath. The dragon exhales repulsion energy in a 30-foot cone. Each creature in that area must succeed on a DC 12 Strength saving throw. On a failed save, the creature is pushed 30 feet away from the dragon."
      }
    ]
  },
  {
    "name": "Copper Dragon Wyrmling",
    "size": "medium",
    "type": "dragon",
    "alignment": "chaotic good",
    "ac": 16,
    "acNote": "natural armor",
    "hp": 22,
    "maxHp": 22,
    "speed": "30 ft., climb 30 ft., fly 60 ft.",
    "abilityScores": {
      "strength": 15,
      "dexterity": 12,
      "constitution": 13,
      "intelligence": 14,
      "wisdom": 11,
      "charisma": 13
    },
    "savingThrows": {
      "dex": 3,
      "con": 3,
      "wis": 2,
      "cha": 3
    },
    "skills": {
      "perception": 4,
      "stealth": 3
    },
    "damageImmunities": [
      "acid"
    ],
    "senses": {
      "blindsight": "10 ft.",
      "darkvision": "60 ft.",
      "passive_perception": "14"
    },
    "languages": [
      "Draconic"
    ],
    "challengeRating": 1,
    "experiencePoints": 200,
    "source": "SRD",
    "isGlobal": true,
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (1d10 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d10+2 Piercing"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nAcid Breath. The dragon exhales acid in an 20-foot line that is 5 feet wide. Each creature in that line must make a DC 11 Dexterity saving throw, taking 18 (4d8) acid damage on a failed save, or half as much damage on a successful one.\nSlowing Breath. The dragon exhales gas in a 15-foot cone. Each creature in that area must succeed on a DC 11 Constitution saving throw. On a failed save, the creature can't use reactions, its speed is halved, and it can't make more than one attack on its turn. In addition, the creature can use either an action or a bonus action on its turn, but not both. These effects last for 1 minute. The creature can repeat the saving throw at the end of each of its turns, ending the effect on itself with a successful save."
      }
    ]
  },
  {
    "name": "Dragon Turtle",
    "size": "gargantuan",
    "type": "dragon",
    "alignment": "neutral",
    "ac": 20,
    "acNote": "natural armor",
    "hp": 341,
    "maxHp": 341,
    "speed": "20 ft., swim 40 ft.",
    "abilityScores": {
      "strength": 25,
      "dexterity": 10,
      "constitution": 20,
      "intelligence": 10,
      "wisdom": 12,
      "charisma": 12
    },
    "savingThrows": {
      "dex": 6,
      "con": 11,
      "wis": 7
    },
    "damageResistances": [
      "fire"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive_perception": "11"
    },
    "languages": [
      "Aquan",
      "Draconic"
    ],
    "challengeRating": 17,
    "experiencePoints": 18000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon turtle can breathe air and water."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon turtle makes three attacks: one with its bite and two with its claws. It can make one tail attack in place of its two claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +13 to hit, reach 15 ft., one target. Hit: 26 (3d12 + 7) piercing damage.",
        "attackBonus": 13,
        "damageDescription": "3d12+7 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +13 to hit, reach 10 ft., one target. Hit: 16 (2d8 + 7) slashing damage.",
        "attackBonus": 13,
        "damageDescription": "2d8+7 Piercing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +13 to hit, reach 15 ft., one target. Hit: 26 (3d12 + 7) bludgeoning damage. If the target is a creature, it must succeed on a DC 20 Strength saving throw or be pushed up to 10 feet away from the dragon turtle and knocked prone.",
        "attackBonus": 13,
        "damageDescription": "3d12+7 Bludgeoning"
      },
      {
        "name": "Steam Breath",
        "description": "The dragon turtle exhales scalding steam in a 60-foot cone. Each creature in that area must make a DC 18 Constitution saving throw, taking 52 (15d6) fire damage on a failed save, or half as much damage on a successful one. Being underwater doesn't grant resistance against this damage.",
        "damageDescription": "15d6 Fire",
        "saveDC": 18,
        "saveType": "CON"
      }
    ]
  },
  {
    "name": "Gold Dragon Wyrmling",
    "size": "medium",
    "type": "dragon",
    "alignment": "lawful good",
    "ac": 17,
    "acNote": "natural armor",
    "hp": 60,
    "maxHp": 60,
    "speed": "30 ft., fly 60 ft., swim 30 ft.",
    "abilityScores": {
      "strength": 19,
      "dexterity": 14,
      "constitution": 17,
      "intelligence": 14,
      "wisdom": 11,
      "charisma": 16
    },
    "savingThrows": {
      "dex": 4,
      "con": 5,
      "wis": 2,
      "cha": 5
    },
    "skills": {
      "perception": 4,
      "stealth": 4
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "blindsight": "10 ft.",
      "darkvision": "60 ft.",
      "passive_perception": "14"
    },
    "languages": [
      "Draconic"
    ],
    "challengeRating": 3,
    "experiencePoints": 700,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 9 (1d10 + 4) piercing damage.",
        "attackBonus": 6,
        "damageDescription": "1d10+4 Piercing"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nFire Breath. The dragon exhales fire in a 15-foot cone. Each creature in that area must make a DC 13 Dexterity saving throw, taking 22 (4d10) fire damage on a failed save, or half as much damage on a successful one.\nWeakening Breath. The dragon exhales gas in a 15-foot cone. Each creature in that area must succeed on a DC 13 Strength saving throw or have disadvantage on Strength-based attack rolls, Strength checks, and Strength saving throws for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
      }
    ]
  },
  {
    "name": "Green Dragon Wyrmling",
    "size": "medium",
    "type": "dragon",
    "alignment": "lawful evil",
    "ac": 17,
    "acNote": "natural armor",
    "hp": 38,
    "maxHp": 38,
    "speed": "30 ft., fly 60 ft., swim 30 ft.",
    "abilityScores": {
      "strength": 15,
      "dexterity": 12,
      "constitution": 13,
      "intelligence": 14,
      "wisdom": 11,
      "charisma": 13
    },
    "savingThrows": {
      "dex": 3,
      "con": 3,
      "wis": 2,
      "cha": 3
    },
    "skills": {
      "perception": 4,
      "stealth": 3
    },
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "Poisoned"
    ],
    "senses": {
      "blindsight": "10 ft.",
      "darkvision": "60 ft.",
      "passive_perception": "14"
    },
    "languages": [
      "Draconic"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (1d10 + 2) piercing damage plus 3 (1d6) poison damage.",
        "attackBonus": 4,
        "damageDescription": "1d10+2 Piercing"
      },
      {
        "name": "Poison Breath",
        "description": "The dragon exhales poisonous gas in a 15-foot cone. Each creature in that area must make a DC 11 Constitution saving throw, taking 21 (6d6) poison damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "6d6 Poison",
        "saveDC": 11,
        "saveType": "CON"
      }
    ]
  },
  {
    "name": "Pseudodragon",
    "size": "tiny",
    "type": "dragon",
    "alignment": "neutral good",
    "ac": 13,
    "acNote": "natural armor",
    "hp": 7,
    "maxHp": 7,
    "speed": "15 ft., fly 60 ft.",
    "abilityScores": {
      "strength": 6,
      "dexterity": 15,
      "constitution": 13,
      "intelligence": 10,
      "wisdom": 12,
      "charisma": 10
    },
    "skills": {
      "perception": 3,
      "stealth": 4
    },
    "senses": {
      "blindsight": "10 ft.",
      "darkvision": "60 ft.",
      "passive_perception": "13"
    },
    "languages": [
      "understands Common and Draconic but can't speak"
    ],
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Keen Senses",
        "description": "The pseudodragon has advantage on Wisdom (Perception) checks that rely on sight, hearing, or smell."
      },
      {
        "name": "Magic Resistance",
        "description": "The pseudodragon has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Limited Telepathy",
        "description": "The pseudodragon can magically communicate simple ideas, emotions, and images telepathically with any creature within 100 ft. of it that can understand a language."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d4+2 Piercing"
      },
      {
        "name": "Sting",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 4 (1d4 + 2) piercing damage, and the target must succeed on a DC 11 Constitution saving throw or become poisoned for 1 hour. If the saving throw fails by 5 or more, the target falls unconscious for the same duration, or until it takes damage or another creature uses an action to shake it awake.",
        "attackBonus": 4,
        "damageDescription": "1d4+2 Piercing"
      }
    ]
  },
  {
    "name": "Red Dragon Wyrmling",
    "size": "medium",
    "type": "dragon",
    "alignment": "chaotic evil",
    "ac": 17,
    "acNote": "natural armor",
    "hp": 75,
    "maxHp": 75,
    "speed": "30 ft., climb 30 ft., fly 60 ft.",
    "abilityScores": {
      "strength": 19,
      "dexterity": 10,
      "constitution": 17,
      "intelligence": 12,
      "wisdom": 11,
      "charisma": 15
    },
    "savingThrows": {
      "dex": 2,
      "con": 5,
      "wis": 2,
      "cha": 4
    },
    "skills": {
      "perception": 4,
      "stealth": 2
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "blindsight": "10 ft.",
      "darkvision": "60 ft.",
      "passive_perception": "14"
    },
    "languages": [
      "Draconic"
    ],
    "challengeRating": 4,
    "experiencePoints": 1100,
    "source": "SRD",
    "isGlobal": true,
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 9 (1d10 + 4) piercing damage plus 3 (1d6) fire damage.",
        "attackBonus": 6,
        "damageDescription": "1d10+4 Piercing"
      },
      {
        "name": "Fire Breath",
        "description": "The dragon exhales fire in a 15-foot cone. Each creature in that area must make a DC 13 Dexterity saving throw, taking 24 (7d6) fire damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "7d6 Fire",
        "saveDC": 13,
        "saveType": "DEX"
      }
    ]
  },
  {
    "name": "Silver Dragon Wyrmling",
    "size": "medium",
    "type": "dragon",
    "alignment": "lawful good",
    "ac": 17,
    "acNote": "natural armor",
    "hp": 45,
    "maxHp": 45,
    "speed": "30 ft., fly 60 ft.",
    "abilityScores": {
      "strength": 19,
      "dexterity": 10,
      "constitution": 17,
      "intelligence": 12,
      "wisdom": 11,
      "charisma": 15
    },
    "savingThrows": {
      "dex": 2,
      "con": 5,
      "wis": 2,
      "cha": 4
    },
    "skills": {
      "perception": 4,
      "stealth": 2
    },
    "damageImmunities": [
      "cold"
    ],
    "senses": {
      "blindsight": "10 ft.",
      "darkvision": "60 ft.",
      "passive_perception": "14"
    },
    "languages": [
      "Draconic"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "isGlobal": true,
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 9 (1d10 + 4) piercing damage.",
        "attackBonus": 6,
        "damageDescription": "1d10+4 Piercing"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nCold Breath. The dragon exhales an icy blast in a 15-foot cone. Each creature in that area must make a DC 13 Constitution saving throw, taking 18 (4d8) cold damage on a failed save, or half as much damage on a successful one.\nParalyzing Breath. The dragon exhales paralyzing gas in a 15-foot cone. Each creature in that area must succeed on a DC 13 Constitution saving throw or be paralyzed for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
      }
    ]
  },
  {
    "name": "White Dragon Wyrmling",
    "size": "medium",
    "type": "dragon",
    "alignment": "chaotic evil",
    "ac": 16,
    "acNote": "natural armor",
    "hp": 32,
    "maxHp": 32,
    "speed": "30 ft., burrow 15 ft., fly 60 ft., swim 30 ft.",
    "abilityScores": {
      "strength": 14,
      "dexterity": 10,
      "constitution": 14,
      "intelligence": 5,
      "wisdom": 10,
      "charisma": 11
    },
    "savingThrows": {
      "dex": 2,
      "con": 4,
      "wis": 2,
      "cha": 2
    },
    "skills": {
      "perception": 4,
      "stealth": 2
    },
    "damageImmunities": [
      "cold"
    ],
    "senses": {
      "blindsight": "10 ft.",
      "darkvision": "60 ft.",
      "passive_perception": "14"
    },
    "languages": [
      "Draconic"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "isGlobal": true,
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (1d10 + 2) piercing damage plus 2 (1d4) cold damage.",
        "attackBonus": 4,
        "damageDescription": "1d10+2 Piercing"
      },
      {
        "name": "Cold Breath",
        "description": "The dragon exhales an icy blast of hail in a 15-foot cone. Each creature in that area must make a DC 12 Constitution saving throw, taking 22 (5d8) cold damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "5d8 Cold",
        "saveDC": 12,
        "saveType": "CON"
      }
    ]
  },
  {
    "name": "Wyvern",
    "size": "large",
    "type": "dragon",
    "alignment": "unaligned",
    "ac": 13,
    "acNote": "natural armor",
    "hp": 110,
    "maxHp": 110,
    "speed": "20 ft., fly 80 ft.",
    "abilityScores": {
      "strength": 19,
      "dexterity": 10,
      "constitution": 16,
      "intelligence": 5,
      "wisdom": 12,
      "charisma": 6
    },
    "skills": {
      "perception": 4
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": "14"
    },
    "challengeRating": 6,
    "experiencePoints": 2300,
    "source": "SRD",
    "isGlobal": true,
    "actions": [
      {
        "name": "Multiattack",
        "description": "The wyvern makes two attacks: one with its bite and one with its stinger. While flying, it can use its claws in place of one other attack."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 10 ft., one creature. Hit: 11 (2d6 + 4) piercing damage.",
        "attackBonus": 7,
        "damageDescription": "2d6+4 Piercing"
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) slashing damage.",
        "attackBonus": 7,
        "damageDescription": "2d8+4 Slashing"
      },
      {
        "name": "Stinger",
        "description": "Melee Weapon Attack: +7 to hit, reach 10 ft., one creature. Hit: 11 (2d6 + 4) piercing damage. The target must make a DC 15 Constitution saving throw, taking 24 (7d6) poison damage on a failed save, or half as much damage on a successful one.",
        "attackBonus": 7,
        "damageDescription": "2d6+4 Piercing"
      }
    ]
  },
  {
    "name": "Young Black Dragon",
    "size": "large",
    "type": "dragon",
    "alignment": "chaotic evil",
    "ac": 18,
    "acNote": "natural armor",
    "hp": 127,
    "maxHp": 127,
    "speed": "40 ft., fly 80 ft., swim 40 ft.",
    "abilityScores": {
      "strength": 19,
      "dexterity": 14,
      "constitution": 17,
      "intelligence": 12,
      "wisdom": 11,
      "charisma": 15
    },
    "savingThrows": {
      "dex": 5,
      "con": 6,
      "wis": 3,
      "cha": 5
    },
    "skills": {
      "perception": 6,
      "stealth": 5
    },
    "damageImmunities": [
      "acid"
    ],
    "senses": {
      "blindsight": "30 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "16"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 7,
    "experiencePoints": 2900,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 10 ft., one target. Hit: 15 (2d10 + 4) piercing damage plus 4 (1d8) acid damage.",
        "attackBonus": 7,
        "damageDescription": "2d10+4 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage.",
        "attackBonus": 7,
        "damageDescription": "2d6+4 Slashing"
      },
      {
        "name": "Acid Breath",
        "description": "The dragon exhales acid in a 30-foot line that is 5 feet wide. Each creature in that line must make a DC 14 Dexterity saving throw, taking 49 (11d8) acid damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "11d8 Acid",
        "saveDC": 14,
        "saveType": "DEX"
      }
    ]
  },
  {
    "name": "Young Blue Dragon",
    "size": "large",
    "type": "dragon",
    "alignment": "lawful evil",
    "ac": 18,
    "acNote": "natural armor",
    "hp": 152,
    "maxHp": 152,
    "speed": "40 ft., burrow 20 ft., fly 80 ft.",
    "abilityScores": {
      "strength": 21,
      "dexterity": 10,
      "constitution": 19,
      "intelligence": 14,
      "wisdom": 13,
      "charisma": 17
    },
    "savingThrows": {
      "dex": 4,
      "con": 8,
      "wis": 5,
      "cha": 7
    },
    "skills": {
      "perception": 9,
      "stealth": 4
    },
    "damageImmunities": [
      "lightning"
    ],
    "senses": {
      "blindsight": "30 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "19"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 9,
    "experiencePoints": 5000,
    "source": "SRD",
    "isGlobal": true,
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +9 to hit, reach 10 ft., one target. Hit: 16 (2d10 + 5) piercing damage plus 5 (1d10) lightning damage.",
        "attackBonus": 9,
        "damageDescription": "2d10+5 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +9 to hit, reach 5 ft., one target. Hit: 12 (2d6 + 5) slashing damage.",
        "attackBonus": 9,
        "damageDescription": "2d6+5 Slashing"
      },
      {
        "name": "Lightning Breath",
        "description": "The dragon exhales lightning in an 60-foot line that is 5 feet wide. Each creature in that line must make a DC 16 Dexterity saving throw, taking 55 (10d10) lightning damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "10d10 Lightning",
        "saveDC": 16,
        "saveType": "DEX"
      }
    ]
  },
  {
    "name": "Young Brass Dragon",
    "size": "large",
    "type": "dragon",
    "alignment": "chaotic good",
    "ac": 17,
    "acNote": "natural armor",
    "hp": 110,
    "maxHp": 110,
    "speed": "40 ft., burrow 20 ft., fly 80 ft.",
    "abilityScores": {
      "strength": 19,
      "dexterity": 10,
      "constitution": 17,
      "intelligence": 12,
      "wisdom": 11,
      "charisma": 15
    },
    "savingThrows": {
      "dex": 3,
      "con": 6,
      "wis": 3,
      "cha": 5
    },
    "skills": {
      "perception": 6,
      "persuasion": 5,
      "stealth": 3
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "blindsight": "30 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "16"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 6,
    "experiencePoints": 2300,
    "source": "SRD",
    "isGlobal": true,
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 10 ft., one target. Hit: 15 (2d10 + 4) piercing damage.",
        "attackBonus": 7,
        "damageDescription": "2d10+4 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage.",
        "attackBonus": 7,
        "damageDescription": "2d6+4 Slashing"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nFire Breath. The dragon exhales fire in a 40-foot line that is 5 feet wide. Each creature in that line must make a DC 14 Dexterity saving throw, taking 42 (12d6) fire damage on a failed save, or half as much damage on a successful one.\nSleep Breath. The dragon exhales sleep gas in a 30-foot cone. Each creature in that area must succeed on a DC 14 Constitution saving throw or fall unconscious for 5 minutes. This effect ends for a creature if the creature takes damage or someone uses an action to wake it."
      }
    ]
  },
  {
    "name": "Young Bronze Dragon",
    "size": "large",
    "type": "dragon",
    "alignment": "lawful good",
    "ac": 18,
    "acNote": "natural armor",
    "hp": 142,
    "maxHp": 142,
    "speed": "40 ft., fly 80 ft., swim 40 ft.",
    "abilityScores": {
      "strength": 21,
      "dexterity": 10,
      "constitution": 19,
      "intelligence": 14,
      "wisdom": 13,
      "charisma": 17
    },
    "savingThrows": {
      "dex": 3,
      "con": 7,
      "wis": 4,
      "cha": 6
    },
    "skills": {
      "insight": 4,
      "perception": 7,
      "stealth": 3
    },
    "damageImmunities": [
      "lightning"
    ],
    "senses": {
      "blindsight": "30 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "17"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 8,
    "experiencePoints": 3900,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +8 to hit, reach 10 ft., one target. Hit: 16 (2d10 + 5) piercing damage.",
        "attackBonus": 8,
        "damageDescription": "2d10+5 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 12 (2d6 + 5) slashing damage.",
        "attackBonus": 8,
        "damageDescription": "2d6+5 Slashing"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nLightning Breath. The dragon exhales lightning in a 60-foot line that is 5 feet wide. Each creature in that line must make a DC 15 Dexterity saving throw, taking 55 (10d10) lightning damage on a failed save, or half as much damage on a successful one.\nRepulsion Breath. The dragon exhales repulsion energy in a 30-foot cone. Each creature in that area must succeed on a DC 15 Strength saving throw. On a failed save, the creature is pushed 40 feet away from the dragon."
      }
    ]
  },
  {
    "name": "Young Copper Dragon",
    "size": "large",
    "type": "dragon",
    "alignment": "chaotic good",
    "ac": 17,
    "acNote": "natural armor",
    "hp": 119,
    "maxHp": 119,
    "speed": "40 ft., climb 40 ft., fly 80 ft.",
    "abilityScores": {
      "strength": 19,
      "dexterity": 12,
      "constitution": 17,
      "intelligence": 16,
      "wisdom": 13,
      "charisma": 15
    },
    "savingThrows": {
      "dex": 4,
      "con": 6,
      "wis": 4,
      "cha": 5
    },
    "skills": {
      "deception": 5,
      "perception": 7,
      "stealth": 4
    },
    "damageImmunities": [
      "acid"
    ],
    "senses": {
      "blindsight": "30 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "17"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 7,
    "experiencePoints": 2900,
    "source": "SRD",
    "isGlobal": true,
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 10 ft., one target. Hit: 15 (2d10 + 4) piercing damage.",
        "attackBonus": 7,
        "damageDescription": "2d10+4 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage.",
        "attackBonus": 7,
        "damageDescription": "2d6+4 Slashing"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nAcid Breath. The dragon exhales acid in an 40-foot line that is 5 feet wide. Each creature in that line must make a DC 14 Dexterity saving throw, taking 40 (9d8) acid damage on a failed save, or half as much damage on a successful one.\nSlowing Breath. The dragon exhales gas in a 30-foot cone. Each creature in that area must succeed on a DC 14 Constitution saving throw. On a failed save, the creature can't use reactions, its speed is halved, and it can't make more than one attack on its turn. In addition, the creature can use either an action or a bonus action on its turn, but not both. These effects last for 1 minute. The creature can repeat the saving throw at the end of each of its turns, ending the effect on itself with a successful save."
      }
    ]
  },
  {
    "name": "Young Gold Dragon",
    "size": "large",
    "type": "dragon",
    "alignment": "lawful good",
    "ac": 18,
    "acNote": "natural armor",
    "hp": 178,
    "maxHp": 178,
    "speed": "40 ft., fly 80 ft., swim 40 ft.",
    "abilityScores": {
      "strength": 23,
      "dexterity": 14,
      "constitution": 21,
      "intelligence": 16,
      "wisdom": 13,
      "charisma": 20
    },
    "savingThrows": {
      "dex": 6,
      "con": 9,
      "wis": 5,
      "cha": 9
    },
    "skills": {
      "insight": 5,
      "perception": 9,
      "persuasion": 9,
      "stealth": 6
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "blindsight": "30 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "19"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 10,
    "experiencePoints": 5900,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage.",
        "attackBonus": 10,
        "damageDescription": "2d10+6 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +10 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage.",
        "attackBonus": 10,
        "damageDescription": "2d6+6 Slashing"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nFire Breath. The dragon exhales fire in a 30-foot cone. Each creature in that area must make a DC 17 Dexterity saving throw, taking 55 (10d10) fire damage on a failed save, or half as much damage on a successful one.\nWeakening Breath. The dragon exhales gas in a 30-foot cone. Each creature in that area must succeed on a DC 17 Strength saving throw or have disadvantage on Strength-based attack rolls, Strength checks, and Strength saving throws for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
      }
    ]
  },
  {
    "name": "Young Green Dragon",
    "size": "large",
    "type": "dragon",
    "alignment": "lawful evil",
    "ac": 18,
    "acNote": "natural armor",
    "hp": 136,
    "maxHp": 136,
    "speed": "40 ft., fly 80 ft., swim 40 ft.",
    "abilityScores": {
      "strength": 19,
      "dexterity": 12,
      "constitution": 17,
      "intelligence": 16,
      "wisdom": 13,
      "charisma": 15
    },
    "savingThrows": {
      "dex": 4,
      "con": 6,
      "wis": 4,
      "cha": 5
    },
    "skills": {
      "deception": 5,
      "perception": 7,
      "stealth": 4
    },
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "Poisoned"
    ],
    "senses": {
      "blindsight": "30 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "17"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 8,
    "experiencePoints": 3900,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Amphibious",
        "description": "The dragon can breathe air and water."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 10 ft., one target. Hit: 15 (2d10 + 4) piercing damage plus 7 (2d6) poison damage.",
        "attackBonus": 7,
        "damageDescription": "2d10+4 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage.",
        "attackBonus": 7,
        "damageDescription": "2d6+4 Slashing"
      },
      {
        "name": "Poison Breath",
        "description": "The dragon exhales poisonous gas in a 30-foot cone. Each creature in that area must make a DC 14 Constitution saving throw, taking 42 (12d6) poison damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "12d6 Poison",
        "saveDC": 14,
        "saveType": "CON"
      }
    ]
  },
  {
    "name": "Young Red Dragon",
    "size": "large",
    "type": "dragon",
    "alignment": "chaotic evil",
    "ac": 18,
    "acNote": "natural armor",
    "hp": 178,
    "maxHp": 178,
    "speed": "40 ft., climb 40 ft., fly 80 ft.",
    "abilityScores": {
      "strength": 23,
      "dexterity": 10,
      "constitution": 21,
      "intelligence": 14,
      "wisdom": 11,
      "charisma": 19
    },
    "savingThrows": {
      "dex": 4,
      "con": 9,
      "wis": 4,
      "cha": 8
    },
    "skills": {
      "perception": 8,
      "stealth": 4
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "blindsight": "30 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "18"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 10,
    "experiencePoints": 5900,
    "source": "SRD",
    "isGlobal": true,
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage plus 3 (1d6) fire damage.",
        "attackBonus": 10,
        "damageDescription": "2d10+6 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +10 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage.",
        "attackBonus": 10,
        "damageDescription": "2d6+6 Slashing"
      },
      {
        "name": "Fire Breath",
        "description": "The dragon exhales fire in a 30-foot cone. Each creature in that area must make a DC 17 Dexterity saving throw, taking 56 (16d6) fire damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "16d6 Fire",
        "saveDC": 17,
        "saveType": "DEX"
      }
    ]
  },
  {
    "name": "Young Silver Dragon",
    "size": "large",
    "type": "dragon",
    "alignment": "lawful good",
    "ac": 18,
    "acNote": "natural armor",
    "hp": 168,
    "maxHp": 168,
    "speed": "40 ft., fly 80 ft.",
    "abilityScores": {
      "strength": 23,
      "dexterity": 10,
      "constitution": 21,
      "intelligence": 14,
      "wisdom": 11,
      "charisma": 19
    },
    "savingThrows": {
      "dex": 4,
      "con": 9,
      "wis": 4,
      "cha": 8
    },
    "skills": {
      "arcana": 6,
      "history": 6,
      "perception": 8,
      "stealth": 4
    },
    "damageImmunities": [
      "cold"
    ],
    "senses": {
      "blindsight": "30 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "18"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 9,
    "experiencePoints": 5000,
    "source": "SRD",
    "isGlobal": true,
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage.",
        "attackBonus": 10,
        "damageDescription": "2d10+6 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +10 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage.",
        "attackBonus": 10,
        "damageDescription": "2d6+6 Slashing"
      },
      {
        "name": "Breath Weapons",
        "description": "The dragon uses one of the following breath weapons.\nCold Breath. The dragon exhales an icy blast in a 30-foot cone. Each creature in that area must make a DC 17 Constitution saving throw, taking 54 (12d8) cold damage on a failed save, or half as much damage on a successful one.\nParalyzing Breath. The dragon exhales paralyzing gas in a 30-foot cone. Each creature in that area must succeed on a DC 17 Constitution saving throw or be paralyzed for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
      }
    ]
  },
  {
    "name": "Young White Dragon",
    "size": "large",
    "type": "dragon",
    "alignment": "chaotic evil",
    "ac": 17,
    "acNote": "natural armor",
    "hp": 133,
    "maxHp": 133,
    "speed": "40 ft., burrow 20 ft., fly 80 ft., swim 40 ft.",
    "abilityScores": {
      "strength": 18,
      "dexterity": 10,
      "constitution": 18,
      "intelligence": 6,
      "wisdom": 11,
      "charisma": 12
    },
    "savingThrows": {
      "dex": 3,
      "con": 7,
      "wis": 3,
      "cha": 4
    },
    "skills": {
      "perception": 6,
      "stealth": 3
    },
    "damageImmunities": [
      "cold"
    ],
    "senses": {
      "blindsight": "30 ft.",
      "darkvision": "120 ft.",
      "passive_perception": "16"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 6,
    "experiencePoints": 2300,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Ice Walk",
        "description": "The dragon can move across and climb icy surfaces without needing to make an ability check. Additionally, difficult terrain composed of ice or snow doesn't cost it extra moment."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 10 ft., one target. Hit: 15 (2d10 + 4) piercing damage plus 4 (1d8) cold damage.",
        "attackBonus": 7,
        "damageDescription": "2d10+4 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage.",
        "attackBonus": 7,
        "damageDescription": "2d6+4 Slashing"
      },
      {
        "name": "Cold Breath",
        "description": "The dragon exhales an icy blast in a 30-foot cone. Each creature in that area must make a DC 15 Constitution saving throw, taking 45 (10d8) cold damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "10d8 Cold",
        "saveDC": 15,
        "saveType": "CON"
      }
    ]
  }
];

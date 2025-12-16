/**
 * Beast-type monsters from D&D 5e SRD
 * Auto-generated from D&D 5e API
 */

import { MonsterTemplate } from "../../types";

export const BEASTS: Omit<
  MonsterTemplate,
  "id" | "userId" | "createdAt" | "updatedAt" | "_id"
>[] = [
  {
    "name": "Ape",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 19,
    "hitDice": "3d8",
    "speed": {
      "walk": "30 ft.",
      "climb": "30 ft."
    },
    "abilities": {
      "strength": 16,
      "dexterity": 14,
      "constitution": 14,
      "intelligence": 6,
      "wisdom": 12,
      "charisma": 7
    },
    "skills": {
      "athletics": 5,
      "perception": 3
    },
    "senses": "passive_perception 13",
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "actions": [
      {
        "name": "Multiattack",
        "description": "The ape makes two fist attacks."
      },
      {
        "name": "Fist",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) bludgeoning damage.",
        "attackBonus": 5,
        "damageDescription": "1d6+3 Bludgeoning"
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack: +5 to hit, range 25/50 ft., one target. Hit: 6 (1d6 + 3) bludgeoning damage.",
        "attackBonus": 5,
        "damageDescription": "1d6+3 Bludgeoning"
      }
    ]
  },
  {
    "name": "Axe Beak",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "dex",
    "hp": 19,
    "hitDice": "3d10",
    "speed": {
      "walk": "50 ft."
    },
    "abilities": {
      "strength": 14,
      "dexterity": 12,
      "constitution": 12,
      "intelligence": 2,
      "wisdom": 10,
      "charisma": 5
    },
    "senses": "passive_perception 10",
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "actions": [
      {
        "name": "Beak",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) slashing damage.",
        "attackBonus": 4,
        "damageDescription": "1d8+2 Slashing"
      }
    ]
  },
  {
    "name": "Baboon",
    "type": "beast",
    "size": "Small",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 3,
    "hitDice": "1d6",
    "speed": {
      "walk": "30 ft.",
      "climb": "30 ft."
    },
    "abilities": {
      "strength": 8,
      "dexterity": 14,
      "constitution": 11,
      "intelligence": 4,
      "wisdom": 12,
      "charisma": 6
    },
    "senses": "passive_perception 11",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Pack Tactics",
        "description": "The baboon has advantage on an attack roll against a creature if at least one of the baboon's allies is within 5 ft. of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +1 to hit, reach 5 ft., one target. Hit: 1 (1d4 - 1) piercing damage.",
        "attackBonus": 1,
        "damageDescription": "1d4-1 Piercing"
      }
    ]
  },
  {
    "name": "Badger",
    "type": "beast",
    "size": "Tiny",
    "alignment": "unaligned",
    "ac": 10,
    "armorType": "dex",
    "hp": 3,
    "hitDice": "1d4",
    "speed": {
      "walk": "20 ft.",
      "burrow": "5 ft."
    },
    "abilities": {
      "strength": 4,
      "dexterity": 11,
      "constitution": 12,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 5
    },
    "senses": "darkvision 30 ft., passive_perception 11",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The badger has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 1 piercing damage.",
        "attackBonus": 2,
        "damageDescription": "1 Piercing"
      }
    ]
  },
  {
    "name": "Bat",
    "type": "beast",
    "size": "Tiny",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 1,
    "hitDice": "1d4",
    "speed": {
      "walk": "5 ft.",
      "fly": "30 ft."
    },
    "abilities": {
      "strength": 2,
      "dexterity": 15,
      "constitution": 8,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 4
    },
    "senses": "blindsight 60 ft., passive_perception 11",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Echolocation",
        "description": "The bat can't use its blindsight while deafened."
      },
      {
        "name": "Keen Hearing",
        "description": "The bat has advantage on Wisdom (Perception) checks that rely on hearing."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +0 to hit, reach 5 ft., one creature. Hit: 1 piercing damage.",
        "damageDescription": "1 Piercing"
      }
    ]
  },
  {
    "name": "Black Bear",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "natural",
    "hp": 19,
    "hitDice": "3d8",
    "speed": {
      "walk": "40 ft.",
      "climb": "30 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 10,
      "constitution": 14,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 7
    },
    "senses": "passive_perception 13",
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The bear has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The bear makes two attacks: one with its bite and one with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 3,
        "damageDescription": "1d6+2 Piercing"
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) slashing damage.",
        "attackBonus": 3,
        "damageDescription": "2d4+2 Slashing"
      }
    ]
  },
  {
    "name": "Blood Hawk",
    "type": "beast",
    "size": "Small",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 7,
    "hitDice": "2d6",
    "speed": {
      "walk": "10 ft.",
      "fly": "60 ft."
    },
    "abilities": {
      "strength": 6,
      "dexterity": 14,
      "constitution": 10,
      "intelligence": 3,
      "wisdom": 14,
      "charisma": 5
    },
    "skills": {
      "perception": 4
    },
    "senses": "passive_perception 14",
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Sight",
        "description": "The hawk has advantage on Wisdom (Perception) checks that rely on sight."
      },
      {
        "name": "Pack Tactics",
        "description": "The hawk has advantage on an attack roll against a creature if at least one of the hawk's allies is within 5 ft. of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Beak",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d4+2 Piercing"
      }
    ]
  },
  {
    "name": "Boar",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "natural",
    "hp": 11,
    "hitDice": "2d8",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 13,
      "dexterity": 11,
      "constitution": 12,
      "intelligence": 2,
      "wisdom": 9,
      "charisma": 5
    },
    "senses": "passive_perception 9",
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "traits": [
      {
        "name": "Charge",
        "description": "If the boar moves at least 20 ft. straight toward a target and then hits it with a tusk attack on the same turn, the target takes an extra 3 (1d6) slashing damage. If the target is a creature, it must succeed on a DC 11 Strength saving throw or be knocked prone."
      },
      {
        "name": "Relentless",
        "description": "If the boar takes 7 damage or less that would reduce it to 0 hit points, it is reduced to 1 hit point instead."
      }
    ],
    "actions": [
      {
        "name": "Tusk",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) slashing damage.",
        "attackBonus": 3,
        "damageDescription": "1d6+1 Slashing"
      }
    ]
  },
  {
    "name": "Brown Bear",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "natural",
    "hp": 34,
    "hitDice": "4d10",
    "speed": {
      "walk": "40 ft.",
      "climb": "30 ft."
    },
    "abilities": {
      "strength": 19,
      "dexterity": 10,
      "constitution": 16,
      "intelligence": 2,
      "wisdom": 13,
      "charisma": 7
    },
    "skills": {
      "perception": 3
    },
    "senses": "passive_perception 13",
    "challengeRating": 1,
    "experiencePoints": 200,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The bear has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The bear makes two attacks: one with its bite and one with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) piercing damage.",
        "attackBonus": 5,
        "damageDescription": "1d8+4 Piercing"
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage.",
        "attackBonus": 5,
        "damageDescription": "2d6+4 Slashing"
      }
    ]
  },
  {
    "name": "Camel",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 9,
    "armorType": "dex",
    "hp": 15,
    "hitDice": "2d10",
    "speed": {
      "walk": "50 ft."
    },
    "abilities": {
      "strength": 16,
      "dexterity": 8,
      "constitution": 14,
      "intelligence": 2,
      "wisdom": 8,
      "charisma": 5
    },
    "senses": "passive_perception 9",
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 2 (1d4) bludgeoning damage.",
        "attackBonus": 5,
        "damageDescription": "1d4 Bludgeoning"
      }
    ]
  },
  {
    "name": "Cat",
    "type": "beast",
    "size": "Tiny",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 2,
    "hitDice": "1d4",
    "speed": {
      "walk": "40 ft.",
      "climb": "30 ft."
    },
    "abilities": {
      "strength": 3,
      "dexterity": 15,
      "constitution": 10,
      "intelligence": 3,
      "wisdom": 12,
      "charisma": 7
    },
    "skills": {
      "perception": 3,
      "stealth": 4
    },
    "senses": "passive_perception 13",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The cat has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +0 to hit, reach 5 ft., one target. Hit: 1 slashing damage.",
        "damageDescription": "1 Slashing"
      }
    ]
  },
  {
    "name": "Constrictor Snake",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 13,
    "hitDice": "2d10",
    "speed": {
      "walk": "30 ft.",
      "swim": "30 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 14,
      "constitution": 12,
      "intelligence": 1,
      "wisdom": 10,
      "charisma": 3
    },
    "senses": "blindsight 10 ft., passive_perception 10",
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Piercing"
      },
      {
        "name": "Constrict",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 6 (1d8 + 2) bludgeoning damage, and the target is grappled (escape DC 14). Until this grapple ends, the creature is restrained, and the snake can't constrict another target.",
        "attackBonus": 4,
        "damageDescription": "1d8+2 Bludgeoning"
      }
    ]
  },
  {
    "name": "Crab",
    "type": "beast",
    "size": "Tiny",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "natural",
    "hp": 2,
    "hitDice": "1d4",
    "speed": {
      "walk": "20 ft.",
      "swim": "20 ft."
    },
    "abilities": {
      "strength": 2,
      "dexterity": 11,
      "constitution": 10,
      "intelligence": 1,
      "wisdom": 8,
      "charisma": 2
    },
    "skills": {
      "stealth": 2
    },
    "senses": "blindsight 30 ft., passive_perception 9",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Amphibious",
        "description": "The crab can breathe air and water."
      }
    ],
    "actions": [
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +0 to hit, reach 5 ft., one target. Hit: 1 bludgeoning damage.",
        "damageDescription": "1 Bludgeoning"
      }
    ]
  },
  {
    "name": "Crocodile",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "natural",
    "hp": 19,
    "hitDice": "3d10",
    "speed": {
      "walk": "20 ft.",
      "swim": "20 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 10,
      "constitution": 13,
      "intelligence": 2,
      "wisdom": 10,
      "charisma": 5
    },
    "skills": {
      "stealth": 2
    },
    "senses": "passive_perception 10",
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Hold Breath",
        "description": "The crocodile can hold its breath for 15 minutes."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 7 (1d10 + 2) piercing damage, and the target is grappled (escape DC 12). Until this grapple ends, the target is restrained, and the crocodile can't bite another target",
        "attackBonus": 4,
        "damageDescription": "1d10+2 Bludgeoning"
      }
    ]
  },
  {
    "name": "Deer",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "dex",
    "hp": 4,
    "hitDice": "1d8",
    "speed": {
      "walk": "50 ft."
    },
    "abilities": {
      "strength": 11,
      "dexterity": 16,
      "constitution": 11,
      "intelligence": 2,
      "wisdom": 14,
      "charisma": 5
    },
    "senses": "passive_perception 12",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 2 (1d4) piercing damage.",
        "attackBonus": 2,
        "damageDescription": "1d4 Piercing"
      }
    ]
  },
  {
    "name": "Dire Wolf",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 14,
    "armorType": "natural",
    "hp": 37,
    "hitDice": "5d10",
    "speed": {
      "walk": "50 ft."
    },
    "abilities": {
      "strength": 17,
      "dexterity": 15,
      "constitution": 15,
      "intelligence": 3,
      "wisdom": 12,
      "charisma": 7
    },
    "skills": {
      "perception": 3,
      "stealth": 4
    },
    "senses": "passive_perception 13",
    "challengeRating": 1,
    "experiencePoints": 200,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Hearing and Smell",
        "description": "The wolf has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      },
      {
        "name": "Pack Tactics",
        "description": "The wolf has advantage on an attack roll against a creature if at least one of the wolf's allies is within 5 ft. of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) piercing damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or be knocked prone.",
        "attackBonus": 5,
        "damageDescription": "2d6+3 Piercing"
      }
    ]
  },
  {
    "name": "Draft Horse",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 10,
    "armorType": "dex",
    "hp": 19,
    "hitDice": "3d10",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 18,
      "dexterity": 10,
      "constitution": 12,
      "intelligence": 2,
      "wisdom": 11,
      "charisma": 7
    },
    "senses": "passive_perception 10",
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "actions": [
      {
        "name": "Hooves",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 9 (2d4 + 4) bludgeoning damage.",
        "attackBonus": 6,
        "damageDescription": "2d4+4 Bludgeoning"
      }
    ]
  },
  {
    "name": "Eagle",
    "type": "beast",
    "size": "Small",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 3,
    "hitDice": "1d6",
    "speed": {
      "walk": "10 ft.",
      "fly": "60 ft."
    },
    "abilities": {
      "strength": 6,
      "dexterity": 15,
      "constitution": 10,
      "intelligence": 2,
      "wisdom": 14,
      "charisma": 7
    },
    "skills": {
      "perception": 4
    },
    "senses": "passive_perception 14",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Sight",
        "description": "The eagle has advantage on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Talons",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) slashing damage.",
        "attackBonus": 4,
        "damageDescription": "1d4+2 Bludgeoning"
      }
    ]
  },
  {
    "name": "Elephant",
    "type": "beast",
    "size": "Huge",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "natural",
    "hp": 76,
    "hitDice": "8d12",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 22,
      "dexterity": 9,
      "constitution": 17,
      "intelligence": 3,
      "wisdom": 11,
      "charisma": 6
    },
    "senses": "passive_perception 10",
    "challengeRating": 4,
    "experiencePoints": 1100,
    "source": "SRD",
    "traits": [
      {
        "name": "Trampling Charge",
        "description": "If the elephant moves at least 20 ft. straight toward a creature and then hits it with a gore attack on the same turn, that target must succeed on a DC 12 Strength saving throw or be knocked prone. If the target is prone, the elephant can make one stomp attack against it as a bonus action."
      }
    ],
    "actions": [
      {
        "name": "Gore",
        "description": "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 19 (3d8 + 6) piercing damage.",
        "attackBonus": 8,
        "damageDescription": "3d8+6 Piercing"
      },
      {
        "name": "Stomp",
        "description": "Melee Weapon Attack: +8 to hit, reach 5 ft., one prone creature. Hit: 22 (3d10 + 6) bludgeoning damage.",
        "attackBonus": 8,
        "damageDescription": "3d10+6 Bludgeoning"
      }
    ]
  },
  {
    "name": "Elk",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 10,
    "armorType": "dex",
    "hp": 13,
    "hitDice": "2d10",
    "speed": {
      "walk": "50 ft."
    },
    "abilities": {
      "strength": 16,
      "dexterity": 10,
      "constitution": 12,
      "intelligence": 2,
      "wisdom": 10,
      "charisma": 6
    },
    "senses": "passive_perception 10",
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "traits": [
      {
        "name": "Charge",
        "description": "If the elk moves at least 20 ft. straight toward a target and then hits it with a ram attack on the same turn, the target takes an extra 7 (2d6) damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or be knocked prone."
      }
    ],
    "actions": [
      {
        "name": "Ram",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) bludgeoning damage.",
        "attackBonus": 5,
        "damageDescription": "1d6+3 Bludgeoning"
      },
      {
        "name": "Hooves",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one prone creature. Hit: 8 (2d4 + 3) bludgeoning damage.",
        "attackBonus": 5,
        "damageDescription": "2d4+3 Bludgeoning"
      }
    ]
  },
  {
    "name": "Flying Snake",
    "type": "beast",
    "size": "Tiny",
    "alignment": "unaligned",
    "ac": 14,
    "armorType": "dex",
    "hp": 5,
    "hitDice": "2d4",
    "speed": {
      "walk": "30 ft.",
      "fly": "60 ft.",
      "swim": "30 ft."
    },
    "abilities": {
      "strength": 4,
      "dexterity": 18,
      "constitution": 11,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 5
    },
    "senses": "blindsight 10 ft., passive_perception 11",
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "traits": [
      {
        "name": "Flyby",
        "description": "The snake doesn't provoke opportunity attacks when it flies out of an enemy's reach."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 1 piercing damage plus 7 (3d4) poison damage.",
        "attackBonus": 6,
        "damageDescription": "1 Bludgeoning"
      }
    ]
  },
  {
    "name": "Frog",
    "type": "beast",
    "size": "Tiny",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "dex",
    "hp": 1,
    "hitDice": "1d4",
    "speed": {
      "walk": "20 ft.",
      "swim": "20 ft."
    },
    "abilities": {
      "strength": 1,
      "dexterity": 13,
      "constitution": 8,
      "intelligence": 1,
      "wisdom": 8,
      "charisma": 3
    },
    "skills": {
      "perception": 1,
      "stealth": 3
    },
    "senses": "darkvision 30 ft., passive_perception 11",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Amphibious",
        "description": "The frog can breathe air and water"
      },
      {
        "name": "Standing Leap",
        "description": "The frog's long jump is up to 10 ft. and its high jump is up to 5 ft., with or without a running start."
      }
    ]
  },
  {
    "name": "Giant Ape",
    "type": "beast",
    "size": "Huge",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 157,
    "hitDice": "15d12",
    "speed": {
      "walk": "40 ft.",
      "climb": "40 ft."
    },
    "abilities": {
      "strength": 23,
      "dexterity": 14,
      "constitution": 18,
      "intelligence": 7,
      "wisdom": 12,
      "charisma": 7
    },
    "skills": {
      "athletics": 9,
      "perception": 4
    },
    "senses": "passive_perception 14",
    "challengeRating": 7,
    "experiencePoints": 2900,
    "source": "SRD",
    "actions": [
      {
        "name": "Multiattack",
        "description": "The ape makes two fist attacks."
      },
      {
        "name": "Fist",
        "description": "Melee Weapon Attack: +9 to hit, reach 10 ft., one target. Hit: 22 (3d10 + 6) bludgeoning damage.",
        "attackBonus": 9,
        "damageDescription": "3d10+6 Bludgeoning"
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack: +9 to hit, range 50/100 ft., one target. Hit: 30 (7d6 + 6) bludgeoning damage.",
        "attackBonus": 9,
        "damageDescription": "7d6+6 Bludgeoning"
      }
    ]
  },
  {
    "name": "Giant Badger",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 10,
    "armorType": "dex",
    "hp": 13,
    "hitDice": "2d8",
    "speed": {
      "walk": "30 ft.",
      "burrow": "10 ft."
    },
    "abilities": {
      "strength": 13,
      "dexterity": 10,
      "constitution": 15,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 5
    },
    "senses": "darkvision 30 ft., passive_perception 11",
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The badger has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The badger makes two attacks: one with its bite and one with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) piercing damage.",
        "attackBonus": 3,
        "damageDescription": "1d6+1 Piercing"
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 6 (2d4 + 1) slashing damage.",
        "attackBonus": 3,
        "damageDescription": "2d4+1 Slashing"
      }
    ]
  },
  {
    "name": "Giant Bat",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "dex",
    "hp": 22,
    "hitDice": "4d10",
    "speed": {
      "walk": "10 ft.",
      "fly": "60 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 16,
      "constitution": 11,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 6
    },
    "senses": "blindsight 60 ft., passive_perception 11",
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "traits": [
      {
        "name": "Echolocation",
        "description": "The bat can't use its blindsight while deafened."
      },
      {
        "name": "Keen Hearing",
        "description": "The bat has advantage on Wisdom (Perception) checks that rely on hearing."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Piercing"
      }
    ]
  },
  {
    "name": "Giant Boar",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "natural",
    "hp": 42,
    "hitDice": "5d10",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 17,
      "dexterity": 10,
      "constitution": 16,
      "intelligence": 2,
      "wisdom": 7,
      "charisma": 5
    },
    "senses": "passive_perception 8",
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Charge",
        "description": "If the boar moves at least 20 ft. straight toward a target and then hits it with a tusk attack on the same turn, the target takes an extra 7 (2d6) slashing damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or be knocked prone."
      },
      {
        "name": "Relentless",
        "description": "If the boar takes 10 damage or less that would reduce it to 0 hit points, it is reduced to 1 hit point instead."
      }
    ],
    "actions": [
      {
        "name": "Tusk",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) slashing damage.",
        "attackBonus": 5,
        "damageDescription": "2d6+3 Slashing"
      }
    ]
  },
  {
    "name": "Giant Centipede",
    "type": "beast",
    "size": "Small",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "natural",
    "hp": 4,
    "hitDice": "1d6",
    "speed": {
      "walk": "30 ft.",
      "climb": "30 ft."
    },
    "abilities": {
      "strength": 5,
      "dexterity": 14,
      "constitution": 12,
      "intelligence": 1,
      "wisdom": 7,
      "charisma": 3
    },
    "senses": "blindsight 30 ft., passive_perception 8",
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 4 (1d4 + 2) piercing damage, and the target must succeed on a DC 11 Constitution saving throw or take 10 (3d6) poison damage. If the poison damage reduces the target to 0 hit points, the target is stable but poisoned for 1 hour, even after regaining hit points, and is paralyzed while poisoned in this way.",
        "attackBonus": 4,
        "damageDescription": "1d4+2 Piercing"
      }
    ]
  },
  {
    "name": "Giant Constrictor Snake",
    "type": "beast",
    "size": "Huge",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 60,
    "hitDice": "8d12",
    "speed": {
      "walk": "30 ft.",
      "swim": "30 ft."
    },
    "abilities": {
      "strength": 19,
      "dexterity": 14,
      "constitution": 12,
      "intelligence": 1,
      "wisdom": 10,
      "charisma": 3
    },
    "skills": {
      "perception": 2
    },
    "senses": "blindsight 10 ft., passive_perception 12",
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +6 to hit, reach 10 ft., one creature. Hit: 11 (2d6 + 4) piercing damage.",
        "attackBonus": 6,
        "damageDescription": "2d6+4 Piercing"
      },
      {
        "name": "Constrict",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one creature. Hit: 13 (2d8 + 4) bludgeoning damage, and the target is grappled (escape DC 16). Until this grapple ends, the creature is restrained, and the snake can't constrict another target.",
        "attackBonus": 6,
        "damageDescription": "2d8+4 Bludgeoning"
      }
    ]
  },
  {
    "name": "Giant Crab",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 15,
    "armorType": "natural",
    "hp": 13,
    "hitDice": "3d8",
    "speed": {
      "walk": "30 ft.",
      "swim": "30 ft."
    },
    "abilities": {
      "strength": 13,
      "dexterity": 15,
      "constitution": 11,
      "intelligence": 1,
      "wisdom": 9,
      "charisma": 3
    },
    "skills": {
      "stealth": 4
    },
    "senses": "blindsight 30 ft., passive_perception 9",
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "traits": [
      {
        "name": "Amphibious",
        "description": "The crab can breathe air and water."
      }
    ],
    "actions": [
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) bludgeoning damage, and the target is grappled (escape DC 11). The crab has two claws, each of which can grapple only one target.",
        "attackBonus": 3,
        "damageDescription": "1d6+1 Bludgeoning"
      }
    ]
  },
  {
    "name": "Giant Crocodile",
    "type": "beast",
    "size": "Huge",
    "alignment": "unaligned",
    "ac": 14,
    "armorType": "natural",
    "hp": 85,
    "hitDice": "9d12",
    "speed": {
      "walk": "30 ft.",
      "swim": "50 ft."
    },
    "abilities": {
      "strength": 21,
      "dexterity": 9,
      "constitution": 17,
      "intelligence": 2,
      "wisdom": 10,
      "charisma": 7
    },
    "skills": {
      "stealth": 5
    },
    "senses": "passive_perception 10",
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "traits": [
      {
        "name": "Hold Breath",
        "description": "The crocodile can hold its breath for 30 minutes."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The crocodile makes two attacks: one with its bite and one with its tail."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 21 (3d10 + 5) piercing damage, and the target is grappled (escape DC 16). Until this grapple ends, the target is restrained, and the crocodile can't bite another target.",
        "attackBonus": 8,
        "damageDescription": "3d10+5 Piercing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +8 to hit, reach 10 ft., one target not grappled by the crocodile. Hit: 14 (2d8 + 5) bludgeoning damage. If the target is a creature, it must succeed on a DC 16 Strength saving throw or be knocked prone.",
        "attackBonus": 8,
        "damageDescription": "2d8+5 Bludgeoning"
      }
    ]
  },
  {
    "name": "Giant Eagle",
    "type": "beast",
    "size": "Large",
    "alignment": "neutral good",
    "ac": 13,
    "armorType": "dex",
    "hp": 26,
    "hitDice": "4d10",
    "speed": {
      "walk": "10 ft.",
      "fly": "80 ft."
    },
    "abilities": {
      "strength": 16,
      "dexterity": 17,
      "constitution": 13,
      "intelligence": 8,
      "wisdom": 14,
      "charisma": 10
    },
    "skills": {
      "perception": 4
    },
    "senses": "passive_perception 14",
    "languages": [
      "Giant Eagle",
      "understands Common and Auran but can't speak"
    ],
    "challengeRating": 1,
    "experiencePoints": 200,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Sight",
        "description": "The eagle has advantage on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The eagle makes two attacks: one with its beak and one with its talons."
      },
      {
        "name": "Beak",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) piercing damage.",
        "attackBonus": 5,
        "damageDescription": "1d6+3 Piercing"
      },
      {
        "name": "Talons",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) slashing damage.",
        "attackBonus": 5,
        "damageDescription": "2d6+3 Slashing"
      }
    ]
  },
  {
    "name": "Giant Elk",
    "type": "beast",
    "size": "Huge",
    "alignment": "unaligned",
    "ac": 14,
    "armorType": "natural",
    "hp": 42,
    "hitDice": "5d12",
    "speed": {
      "walk": "60 ft."
    },
    "abilities": {
      "strength": 19,
      "dexterity": 16,
      "constitution": 14,
      "intelligence": 7,
      "wisdom": 14,
      "charisma": 10
    },
    "skills": {
      "perception": 4
    },
    "senses": "passive_perception 14",
    "languages": [
      "Giant Elk",
      "understands Common",
      "Elvish",
      "and Sylvan but can't speak"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Charge",
        "description": "If the elk moves at least 20 ft. straight toward a target and then hits it with a ram attack on the same turn, the target takes an extra 7 (2d6) damage. If the target is a creature, it must succeed on a DC 14 Strength saving throw or be knocked prone."
      }
    ],
    "actions": [
      {
        "name": "Ram",
        "description": "Melee Weapon Attack: +6 to hit, reach 10 ft., one target. Hit: 11 (2d6 + 4) bludgeoning damage.",
        "attackBonus": 6,
        "damageDescription": "2d6+4 Bludgeoning"
      },
      {
        "name": "Hooves",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one prone creature. Hit: 22 (4d8 + 4) bludgeoning damage.",
        "attackBonus": 6,
        "damageDescription": "4d8+4 Bludgeoning"
      }
    ]
  },
  {
    "name": "Giant Fire Beetle",
    "type": "beast",
    "size": "Small",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "natural",
    "hp": 4,
    "hitDice": "1d6",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 8,
      "dexterity": 10,
      "constitution": 12,
      "intelligence": 1,
      "wisdom": 7,
      "charisma": 3
    },
    "senses": "blindsight 30 ft., passive_perception 8",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Illumination",
        "description": "The beetle sheds bright light in a 10-foot radius and dim light for an additional 10 ft.."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +1 to hit, reach 5 ft., one target. Hit: 2 (1d6 - 1) slashing damage.",
        "attackBonus": 1,
        "damageDescription": "1d6-1 Slashing"
      }
    ]
  },
  {
    "name": "Giant Frog",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "dex",
    "hp": 18,
    "hitDice": "4d8",
    "speed": {
      "walk": "30 ft.",
      "swim": "30 ft."
    },
    "abilities": {
      "strength": 12,
      "dexterity": 13,
      "constitution": 11,
      "intelligence": 2,
      "wisdom": 10,
      "charisma": 3
    },
    "skills": {
      "perception": 2,
      "stealth": 3
    },
    "senses": "darkvision 30 ft., passive_perception 12",
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "traits": [
      {
        "name": "Amphibious",
        "description": "The frog can breathe air and water"
      },
      {
        "name": "Standing Leap",
        "description": "The frog's long jump is up to 20 ft. and its high jump is up to 10 ft., with or without a running start."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) piercing damage, and the target is grappled (escape DC 11). Until this grapple ends, the target is restrained, and the frog can't bite another target.",
        "attackBonus": 3,
        "damageDescription": "1d6+1 Piercing"
      },
      {
        "name": "Swallow",
        "description": "The frog makes one bite attack against a Small or smaller target it is grappling. If the attack hits, the target is swallowed, and the grapple ends. The swallowed target is blinded and restrained, it has total cover against attacks and other effects outside the frog, and it takes 5 (2d4) acid damage at the start of each of the frog's turns. The frog can have only one target swallowed at a time. If the frog dies, a swallowed creature is no longer restrained by it and can escape from the corpse using 5 ft. of movement, exiting prone."
      }
    ]
  },
  {
    "name": "Giant Goat",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "dex",
    "hp": 19,
    "hitDice": "3d10",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 17,
      "dexterity": 11,
      "constitution": 12,
      "intelligence": 3,
      "wisdom": 12,
      "charisma": 6
    },
    "senses": "passive_perception 11",
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Charge",
        "description": "If the goat moves at least 20 ft. straight toward a target and then hits it with a ram attack on the same turn, the target takes an extra 5 (2d4) bludgeoning damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or be knocked prone."
      },
      {
        "name": "Sure-Footed",
        "description": "The goat has advantage on Strength and Dexterity saving throws made against effects that would knock it prone."
      }
    ],
    "actions": [
      {
        "name": "Ram",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (2d4 + 3) bludgeoning damage.",
        "attackBonus": 5,
        "damageDescription": "2d4+3 Bludgeoning"
      }
    ]
  },
  {
    "name": "Giant Hyena",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 45,
    "hitDice": "6d10",
    "speed": {
      "walk": "50 ft."
    },
    "abilities": {
      "strength": 16,
      "dexterity": 14,
      "constitution": 14,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 7
    },
    "skills": {
      "perception": 3
    },
    "senses": "passive_perception 13",
    "challengeRating": 1,
    "experiencePoints": 200,
    "source": "SRD",
    "traits": [
      {
        "name": "Rampage",
        "description": "When the hyena reduces a creature to 0 hit points with a melee attack on its turn, the hyena can take a bonus action to move up to half its speed and make a bite attack."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) piercing damage.",
        "attackBonus": 5,
        "damageDescription": "2d6+3 Piercing"
      }
    ]
  },
  {
    "name": "Giant Lizard",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "natural",
    "hp": 19,
    "hitDice": "3d10",
    "speed": {
      "walk": "30 ft.",
      "climb": "30 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 12,
      "constitution": 13,
      "intelligence": 2,
      "wisdom": 10,
      "charisma": 5
    },
    "senses": "darkvision 30 ft., passive_perception 10",
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d8+2 Piercing"
      }
    ]
  },
  {
    "name": "Giant Octopus",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "dex",
    "hp": 52,
    "hitDice": "8d10",
    "speed": {
      "walk": "10 ft.",
      "swim": "60 ft."
    },
    "abilities": {
      "strength": 17,
      "dexterity": 13,
      "constitution": 13,
      "intelligence": 4,
      "wisdom": 10,
      "charisma": 4
    },
    "skills": {
      "perception": 4,
      "stealth": 5
    },
    "senses": "darkvision 60 ft., passive_perception 14",
    "challengeRating": 1,
    "experiencePoints": 200,
    "source": "SRD",
    "traits": [
      {
        "name": "Hold Breath",
        "description": "While out of water, the octopus can hold its breath for 1 hour."
      },
      {
        "name": "Underwater Camouflage",
        "description": "The octopus has advantage on Dexterity (Stealth) checks made while underwater."
      },
      {
        "name": "Water Breathing",
        "description": "The octopus can breathe only underwater."
      }
    ],
    "actions": [
      {
        "name": "Tentacles",
        "description": "Melee Weapon Attack: +5 to hit, reach 15 ft., one target. Hit: 10 (2d6 + 3) bludgeoning damage. If the target is a creature, it is grappled (escape DC 16). Until this grapple ends, the target is restrained, and the octopus can't use its tentacles on another target.",
        "attackBonus": 5,
        "damageDescription": "2d6+3 Bludgeoning"
      },
      {
        "name": "Ink Cloud",
        "description": "A 20-foot-radius cloud of ink extends all around the octopus if it is underwater. The area is heavily obscured for 1 minute, although a significant current can disperse the ink. After releasing the ink, the octopus can use the Dash action as a bonus action."
      }
    ]
  },
  {
    "name": "Giant Owl",
    "type": "beast",
    "size": "Large",
    "alignment": "neutral",
    "ac": 12,
    "armorType": "dex",
    "hp": 19,
    "hitDice": "3d10",
    "speed": {
      "walk": "5 ft.",
      "fly": "60 ft."
    },
    "abilities": {
      "strength": 13,
      "dexterity": 15,
      "constitution": 12,
      "intelligence": 8,
      "wisdom": 13,
      "charisma": 10
    },
    "skills": {
      "perception": 5,
      "stealth": 4
    },
    "senses": "darkvision 120 ft., passive_perception 15",
    "languages": [
      "Giant Owl",
      "understands Common",
      "Elvish",
      "and Sylvan but can't speak"
    ],
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "traits": [
      {
        "name": "Flyby",
        "description": "The owl doesn't provoke opportunity attacks when it flies out of an enemy's reach."
      },
      {
        "name": "Keen Hearing and Sight",
        "description": "The owl has advantage on Wisdom (Perception) checks that rely on hearing or sight."
      }
    ],
    "actions": [
      {
        "name": "Talons",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 8 (2d6 + 1) slashing damage.",
        "attackBonus": 3,
        "damageDescription": "2d6+1 Slashing"
      }
    ]
  },
  {
    "name": "Giant Poisonous Snake",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 14,
    "armorType": "dex",
    "hp": 11,
    "hitDice": "2d8",
    "speed": {
      "walk": "30 ft.",
      "swim": "30 ft."
    },
    "abilities": {
      "strength": 10,
      "dexterity": 18,
      "constitution": 13,
      "intelligence": 2,
      "wisdom": 10,
      "charisma": 3
    },
    "skills": {
      "perception": 2
    },
    "senses": "blindsight 10 ft., passive_perception 12",
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +6 to hit, reach 10 ft., one target. Hit: 6 (1d4 + 4) piercing damage, and the target must make a DC 11 Constitution saving throw, taking 10 (3d6) poison damage on a failed save, or half as much damage on a successful one.",
        "attackBonus": 6,
        "damageDescription": "1d4+4 Piercing"
      }
    ]
  },
  {
    "name": "Giant Rat",
    "type": "beast",
    "size": "Small",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 7,
    "hitDice": "2d6",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 7,
      "dexterity": 15,
      "constitution": 11,
      "intelligence": 2,
      "wisdom": 10,
      "charisma": 4
    },
    "senses": "darkvision 60 ft., passive_perception 10",
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The rat has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Pack Tactics",
        "description": "The rat has advantage on an attack roll against a creature if at least one of the rat's allies is within 5 ft. of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d4+2 Piercing"
      }
    ]
  },
  {
    "name": "Giant Rat (Diseased)",
    "type": "beast",
    "size": "Small",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 7,
    "hitDice": "2d6",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 7,
      "dexterity": 15,
      "constitution": 11,
      "intelligence": 2,
      "wisdom": 10,
      "charisma": 4
    },
    "senses": "darkvision 60 ft., passive_perception 10",
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The rat has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Pack Tactics",
        "description": "The rat has advantage on an attack roll against a creature if at least one of the rat's allies is within 5 ft. of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 3 (1d4 + 2) piercing damage. If the target is a creature, it must succeed on a DC 10 Constitution saving throw or contract a disease. Until the disease is cured, the target can't regain hit points except by magical means, and the target's hit point maximum decreases by 3 (1d6) every 24 hours. If the target's hit point maximum drops to 0 as a result of this disease, the target dies.",
        "attackBonus": 4,
        "damageDescription": "1d4+2 Piercing"
      }
    ]
  },
  {
    "name": "Giant Scorpion",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 15,
    "armorType": "natural",
    "hp": 52,
    "hitDice": "7d10",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 13,
      "constitution": 15,
      "intelligence": 1,
      "wisdom": 9,
      "charisma": 3
    },
    "senses": "blindsight 60 ft., passive_perception 9",
    "challengeRating": 3,
    "experiencePoints": 700,
    "source": "SRD",
    "actions": [
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) bludgeoning damage, and the target is grappled (escape DC 12). The scorpion has two claws, each of which can grapple only one target.",
        "attackBonus": 4,
        "damageDescription": "1d8+2 Bludgeoning"
      },
      {
        "name": "Multiattack",
        "description": "The scorpion makes three attacks: two with its claws and one with its sting."
      },
      {
        "name": "Sting",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 7 (1d10 + 2) piercing damage, and the target must make a DC 12 Constitution saving throw, taking 22 (4d10) poison damage on a failed save, or half as much damage on a successful one.",
        "attackBonus": 4,
        "damageDescription": "1d10+2 Piercing"
      }
    ]
  },
  {
    "name": "Giant Sea Horse",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "natural",
    "hp": 16,
    "hitDice": "3d10",
    "speed": {
      "walk": "0 ft.",
      "swim": "40 ft."
    },
    "abilities": {
      "strength": 12,
      "dexterity": 15,
      "constitution": 11,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 5
    },
    "senses": "passive_perception 11",
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Charge",
        "description": "If the sea horse moves at least 20 ft. straight toward a target and then hits it with a ram attack on the same turn, the target takes an extra 7 (2d6) bludgeoning damage. If the target is a creature, it must succeed on a DC 11 Strength saving throw or be knocked prone."
      },
      {
        "name": "Water Breathing",
        "description": "The sea horse can breathe only underwater."
      }
    ],
    "actions": [
      {
        "name": "Ram",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) bludgeoning damage.",
        "attackBonus": 3,
        "damageDescription": "1d6+1 Bludgeoning"
      }
    ]
  },
  {
    "name": "Giant Shark",
    "type": "beast",
    "size": "Huge",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "natural",
    "hp": 126,
    "hitDice": "11d12",
    "speed": {
      "swim": "50 ft."
    },
    "abilities": {
      "strength": 23,
      "dexterity": 11,
      "constitution": 21,
      "intelligence": 1,
      "wisdom": 10,
      "charisma": 5
    },
    "skills": {
      "perception": 3
    },
    "senses": "blindsight 60 ft., passive_perception 13",
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "traits": [
      {
        "name": "Blood Frenzy",
        "description": "The shark has advantage on melee attack rolls against any creature that doesn't have all its hit points."
      },
      {
        "name": "Water Breathing",
        "description": "The shark can breathe only underwater."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +9 to hit, reach 5 ft., one target. Hit: 22 (3d10 + 6) piercing damage.",
        "attackBonus": 9,
        "damageDescription": "3d10+6 Piercing"
      }
    ]
  },
  {
    "name": "Giant Spider",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 14,
    "armorType": "natural",
    "hp": 26,
    "hitDice": "4d10",
    "speed": {
      "walk": "30 ft.",
      "climb": "30 ft."
    },
    "abilities": {
      "strength": 14,
      "dexterity": 16,
      "constitution": 12,
      "intelligence": 2,
      "wisdom": 11,
      "charisma": 4
    },
    "skills": {
      "stealth": 7
    },
    "senses": "blindsight 10 ft., darkvision 60 ft., passive_perception 10",
    "challengeRating": 1,
    "experiencePoints": 200,
    "source": "SRD",
    "traits": [
      {
        "name": "Spider Climb",
        "description": "The spider can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      },
      {
        "name": "Web Sense",
        "description": "While in contact with a web, the spider knows the exact location of any other creature in contact with the same web."
      },
      {
        "name": "Web Walker",
        "description": "The spider ignores movement restrictions caused by webbing."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one creature. Hit: 7 (1d8 + 3) piercing damage, and the target must make a DC 11 Constitution saving throw, taking 9 (2d8) poison damage on a failed save, or half as much damage on a successful one. If the poison damage reduces the target to 0 hit points, the target is stable but poisoned for 1 hour, even after regaining hit points, and is paralyzed while poisoned in this way.",
        "attackBonus": 5,
        "damageDescription": "1d8+3 Piercing"
      },
      {
        "name": "Web",
        "description": "Ranged Weapon Attack: +5 to hit, range 30/60 ft., one creature. Hit: The target is restrained by webbing. As an action, the restrained target can make a DC 12 Strength check, bursting the webbing on a success. The webbing can also be attacked and destroyed (AC 10; hp 5; vulnerability to fire damage; immunity to bludgeoning, poison, and psychic damage).",
        "attackBonus": 5
      }
    ]
  },
  {
    "name": "Giant Toad",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "dex",
    "hp": 39,
    "hitDice": "6d10",
    "speed": {
      "walk": "20 ft.",
      "swim": "40 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 13,
      "constitution": 13,
      "intelligence": 2,
      "wisdom": 10,
      "charisma": 3
    },
    "senses": "darkvision 30 ft., passive_perception 10",
    "challengeRating": 1,
    "experiencePoints": 200,
    "source": "SRD",
    "traits": [
      {
        "name": "Amphibious",
        "description": "The toad can breathe air and water"
      },
      {
        "name": "Standing Leap",
        "description": "The toad's long jump is up to 20 ft. and its high jump is up to 10 ft., with or without a running start."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (1d10 + 2) piercing damage plus 5 (1d10) poison damage, and the target is grappled (escape DC 13). Until this grapple ends, the target is restrained, and the toad can't bite another target.",
        "attackBonus": 4,
        "damageDescription": "1d10+2 Piercing"
      },
      {
        "name": "Swallow",
        "description": "The toad makes one bite attack against a Medium or smaller target it is grappling. If the attack hits, the target is swallowed, and the grapple ends. The swallowed target is blinded and restrained, it has total cover against attacks and other effects outside the toad, and it takes 10 (3d6) acid damage at the start of each of the toad's turns. The toad can have only one target swallowed at a time.\nIf the toad dies, a swallowed creature is no longer restrained by it and can escape from the corpse using 5 feet of movement, exiting prone."
      }
    ]
  },
  {
    "name": "Giant Vulture",
    "type": "beast",
    "size": "Large",
    "alignment": "neutral evil",
    "ac": 10,
    "armorType": "dex",
    "hp": 22,
    "hitDice": "3d10",
    "speed": {
      "walk": "10 ft.",
      "fly": "60 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 10,
      "constitution": 15,
      "intelligence": 6,
      "wisdom": 12,
      "charisma": 7
    },
    "skills": {
      "perception": 3
    },
    "senses": "passive_perception 13",
    "languages": [
      "understands Common but can't speak"
    ],
    "challengeRating": 1,
    "experiencePoints": 200,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Sight and Smell",
        "description": "The vulture has advantage on Wisdom (Perception) checks that rely on sight or smell."
      },
      {
        "name": "Pack Tactics",
        "description": "The vulture has advantage on an attack roll against a creature if at least one of the vulture's allies is within 5 ft. of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The vulture makes two attacks: one with its beak and one with its talons."
      },
      {
        "name": "Beak",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "2d4+2 Piercing"
      },
      {
        "name": "Talons",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 9 (2d6 + 2) slashing damage.",
        "attackBonus": 4,
        "damageDescription": "2d6+2 Slashing"
      }
    ]
  },
  {
    "name": "Giant Wasp",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 13,
    "hitDice": "3d8",
    "speed": {
      "walk": "10 ft.",
      "fly": "50 ft.",
      "swim": "50 ft."
    },
    "abilities": {
      "strength": 10,
      "dexterity": 14,
      "constitution": 10,
      "intelligence": 1,
      "wisdom": 10,
      "charisma": 3
    },
    "senses": "passive_perception 10",
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "actions": [
      {
        "name": "Sting",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 5 (1d6 + 2) piercing damage, and the target must make a DC 11 Constitution saving throw, taking 10 (3d6) poison damage on a failed save, or half as much damage on a successful one. If the poison damage reduces the target to 0 hit points, the target is stable but poisoned for 1 hour, even after regaining hit points, and is paralyzed while poisoned in this way.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Piercing"
      }
    ]
  },
  {
    "name": "Giant Weasel",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "dex",
    "hp": 9,
    "hitDice": "2d8",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 11,
      "dexterity": 16,
      "constitution": 10,
      "intelligence": 4,
      "wisdom": 12,
      "charisma": 5
    },
    "skills": {
      "perception": 3,
      "stealth": 5
    },
    "senses": "darkvision 60 ft., passive_perception 13",
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Hearing and Smell",
        "description": "The weasel has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 5 (1d4 + 3) piercing damage.",
        "attackBonus": 5,
        "damageDescription": "1d4+3 Piercing"
      }
    ]
  },
  {
    "name": "Giant Wolf Spider",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "dex",
    "hp": 11,
    "hitDice": "2d8",
    "speed": {
      "walk": "40 ft.",
      "climb": "40 ft."
    },
    "abilities": {
      "strength": 12,
      "dexterity": 16,
      "constitution": 13,
      "intelligence": 3,
      "wisdom": 12,
      "charisma": 4
    },
    "skills": {
      "perception": 3,
      "stealth": 7
    },
    "senses": "blindsight 10 ft., darkvision 60 ft., passive_perception 13",
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "traits": [
      {
        "name": "Spider Climb",
        "description": "The spider can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      },
      {
        "name": "Web Sense",
        "description": "While in contact with a web, the spider knows the exact location of any other creature in contact with the same web."
      },
      {
        "name": "Web Walker",
        "description": "The spider ignores movement restrictions caused by webbing."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one creature. Hit: 4 (1d6 + 1) piercing damage, and the target must make a DC 11 Constitution saving throw, taking 7 (2d6) poison damage on a failed save, or half as much damage on a successful one. If the poison damage reduces the target to 0 hit points, the target is stable but poisoned for 1 hour, even after regaining hit points, and is paralyzed while poisoned in this way.",
        "attackBonus": 3,
        "damageDescription": "1d6+1 Piercing"
      }
    ]
  },
  {
    "name": "Goat",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 10,
    "armorType": "dex",
    "hp": 4,
    "hitDice": "1d8",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 12,
      "dexterity": 10,
      "constitution": 11,
      "intelligence": 2,
      "wisdom": 10,
      "charisma": 5
    },
    "senses": "passive_perception 10",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Charge",
        "description": "If the goat moves at least 20 ft. straight toward a target and then hits it with a ram attack on the same turn, the target takes an extra 2 (1d4) bludgeoning damage. If the target is a creature, it must succeed on a DC 10 Strength saving throw or be knocked prone."
      },
      {
        "name": "Sure-Footed",
        "description": "The goat has advantage on Strength and Dexterity saving throws made against effects that would knock it prone."
      }
    ],
    "actions": [
      {
        "name": "Ram",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 3 (1d4 + 1) bludgeoning damage.",
        "attackBonus": 3,
        "damageDescription": "1d4+1 Bludgeoning"
      }
    ]
  },
  {
    "name": "Hawk",
    "type": "beast",
    "size": "Tiny",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "dex",
    "hp": 1,
    "hitDice": "1d4",
    "speed": {
      "walk": "10 ft.",
      "fly": "60 ft."
    },
    "abilities": {
      "strength": 5,
      "dexterity": 16,
      "constitution": 8,
      "intelligence": 2,
      "wisdom": 14,
      "charisma": 6
    },
    "skills": {
      "perception": 4
    },
    "senses": "passive_perception 14",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Sight",
        "description": "The hawk has advantage on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Talons",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 1 slashing damage.",
        "attackBonus": 5,
        "damageDescription": "1 Slashing"
      }
    ]
  },
  {
    "name": "Hunter Shark",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 45,
    "hitDice": "6d10",
    "speed": {
      "swim": "40 ft."
    },
    "abilities": {
      "strength": 18,
      "dexterity": 13,
      "constitution": 15,
      "intelligence": 1,
      "wisdom": 10,
      "charisma": 4
    },
    "skills": {
      "perception": 2
    },
    "senses": "darkvision 30 ft., passive_perception 12",
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Blood Frenzy",
        "description": "The shark has advantage on melee attack rolls against any creature that doesn't have all its hit points."
      },
      {
        "name": "Water Breathing",
        "description": "The shark can breathe only underwater."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) piercing damage.",
        "attackBonus": 6,
        "damageDescription": "2d8+4 Bludgeoning"
      }
    ]
  },
  {
    "name": "Hyena",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "dex",
    "hp": 5,
    "hitDice": "1d8",
    "speed": {
      "walk": "50 ft."
    },
    "abilities": {
      "strength": 11,
      "dexterity": 13,
      "constitution": 12,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 5
    },
    "skills": {
      "perception": 3
    },
    "senses": "passive_perception 13",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Pack Tactics",
        "description": "The hyena has advantage on an attack roll against a creature if at least one of the hyena's allies is within 5 ft. of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 3 (1d6) piercing damage.",
        "attackBonus": 2,
        "damageDescription": "1d6 Piercing"
      }
    ]
  },
  {
    "name": "Jackal",
    "type": "beast",
    "size": "Small",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 3,
    "hitDice": "1d6",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 8,
      "dexterity": 15,
      "constitution": 11,
      "intelligence": 3,
      "wisdom": 12,
      "charisma": 6
    },
    "skills": {
      "perception": 3
    },
    "senses": "passive_perception 13",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Hearing and Smell",
        "description": "The jackal has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      },
      {
        "name": "Pack Tactics",
        "description": "The jackal has advantage on an attack roll against a creature if at least one of the jackal's allies is within 5 ft. of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +1 to hit, reach 5 ft., one target. Hit: 1 (1d4 - 1) piercing damage.",
        "attackBonus": 1,
        "damageDescription": "1d4-1 Piercing"
      }
    ]
  },
  {
    "name": "Killer Whale",
    "type": "beast",
    "size": "Huge",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "natural",
    "hp": 90,
    "hitDice": "12d12",
    "speed": {
      "swim": "60 ft."
    },
    "abilities": {
      "strength": 19,
      "dexterity": 10,
      "constitution": 13,
      "intelligence": 3,
      "wisdom": 12,
      "charisma": 7
    },
    "skills": {
      "perception": 3
    },
    "senses": "blindsight 120 ft., passive_perception 13",
    "challengeRating": 3,
    "experiencePoints": 700,
    "source": "SRD",
    "traits": [
      {
        "name": "Echolocation",
        "description": "The whale can't use its blindsight while deafened."
      },
      {
        "name": "Hold Breath",
        "description": "The whale can hold its breath for 30 minutes"
      },
      {
        "name": "Keen Hearing",
        "description": "The whale has advantage on Wisdom (Perception) checks that rely on hearing."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 21 (5d6 + 4) piercing damage.",
        "attackBonus": 6,
        "damageDescription": "5d6+4 Piercing"
      }
    ]
  },
  {
    "name": "Lion",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 26,
    "hitDice": "4d10",
    "speed": {
      "walk": "50 ft."
    },
    "abilities": {
      "strength": 17,
      "dexterity": 15,
      "constitution": 13,
      "intelligence": 3,
      "wisdom": 12,
      "charisma": 8
    },
    "skills": {
      "perception": 3,
      "stealth": 6
    },
    "senses": "passive_perception 13",
    "challengeRating": 1,
    "experiencePoints": 200,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The lion has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Pack Tactics",
        "description": "The lion has advantage on an attack roll against a creature if at least one of the lion's allies is within 5 ft. of the creature and the ally isn't incapacitated."
      },
      {
        "name": "Pounce",
        "description": "If the lion moves at least 20 ft. straight toward a creature and then hits it with a claw attack on the same turn, that target must succeed on a DC 13 Strength saving throw or be knocked prone. If the target is prone, the lion can make one bite attack against it as a bonus action.",
        "saveDC": 13,
        "saveType": "STR"
      },
      {
        "name": "Running Leap",
        "description": "With a 10-foot running start, the lion can long jump up to 25 ft.."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) piercing damage.",
        "attackBonus": 5,
        "damageDescription": "1d8+3 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) slashing damage.",
        "attackBonus": 5,
        "damageDescription": "1d6+3 Slashing"
      }
    ]
  },
  {
    "name": "Lizard",
    "type": "beast",
    "size": "Tiny",
    "alignment": "unaligned",
    "ac": 10,
    "armorType": "dex",
    "hp": 2,
    "hitDice": "1d4",
    "speed": {
      "walk": "20 ft.",
      "climb": "20 ft."
    },
    "abilities": {
      "strength": 2,
      "dexterity": 11,
      "constitution": 10,
      "intelligence": 1,
      "wisdom": 8,
      "charisma": 3
    },
    "senses": "darkvision 30 ft., passive_perception 9",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +0 to hit, reach 5 ft., one target. Hit: 1 piercing damage.",
        "damageDescription": "1 Piercing"
      }
    ]
  },
  {
    "name": "Mammoth",
    "type": "beast",
    "size": "Huge",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "natural",
    "hp": 126,
    "hitDice": "11d12",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 24,
      "dexterity": 9,
      "constitution": 21,
      "intelligence": 3,
      "wisdom": 11,
      "charisma": 6
    },
    "senses": "passive_perception 10",
    "challengeRating": 6,
    "experiencePoints": 2300,
    "source": "SRD",
    "traits": [
      {
        "name": "Trampling Charge",
        "description": "If the mammoth moves at least 20 ft. straight toward a creature and then hits it with a gore attack on the same turn, that target must succeed on a DC 18 Strength saving throw or be knocked prone. If the target is prone, the mammoth can make one stomp attack against it as a bonus action."
      }
    ],
    "actions": [
      {
        "name": "Gore",
        "description": "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 25 (4d8 + 7) piercing damage.",
        "attackBonus": 10,
        "damageDescription": "4d8+7 Piercing"
      },
      {
        "name": "Stomp",
        "description": "Melee Weapon Attack: +10 to hit, reach 5 ft., one prone creature. Hit: 29 (4d10 + 7) bludgeoning damage.",
        "attackBonus": 10,
        "damageDescription": "4d10+7 Bludgeoning"
      }
    ]
  },
  {
    "name": "Mastiff",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 5,
    "hitDice": "1d8",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 13,
      "dexterity": 14,
      "constitution": 12,
      "intelligence": 3,
      "wisdom": 12,
      "charisma": 7
    },
    "skills": {
      "perception": 3
    },
    "senses": "passive_perception 13",
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Hearing and Smell",
        "description": "The mastiff has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) piercing damage. If the target is a creature, it must succeed on a DC 11 Strength saving throw or be knocked prone.",
        "attackBonus": 3,
        "damageDescription": "1d6+1 Piercing"
      }
    ]
  },
  {
    "name": "Mule",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 10,
    "armorType": "dex",
    "hp": 11,
    "hitDice": "2d8",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 14,
      "dexterity": 10,
      "constitution": 13,
      "intelligence": 2,
      "wisdom": 10,
      "charisma": 5
    },
    "senses": "passive_perception 10",
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "traits": [
      {
        "name": "Beast of Burden",
        "description": "The mule is considered to be a Large animal for the purpose of determining its carrying capacity."
      },
      {
        "name": "Sure-Footed",
        "description": "The mule has advantage on Strength and Dexterity saving throws made against effects that would knock it prone."
      }
    ],
    "actions": [
      {
        "name": "Hooves",
        "description": "Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) bludgeoning damage.",
        "attackBonus": 2,
        "damageDescription": "1d4+2 Bludgeoning"
      }
    ]
  },
  {
    "name": "Octopus",
    "type": "beast",
    "size": "Small",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 3,
    "hitDice": "1d6",
    "speed": {
      "walk": "5 ft.",
      "swim": "30 ft."
    },
    "abilities": {
      "strength": 4,
      "dexterity": 15,
      "constitution": 11,
      "intelligence": 3,
      "wisdom": 10,
      "charisma": 4
    },
    "skills": {
      "perception": 2,
      "stealth": 4
    },
    "senses": "darkvision 30 ft., passive_perception 12",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Hold Breath",
        "description": "While out of water, the octopus can hold its breath for 30 minutes."
      },
      {
        "name": "Underwater Camouflage",
        "description": "The octopus has advantage on Dexterity (Stealth) checks made while underwater."
      },
      {
        "name": "Water Breathing",
        "description": "The octopus can breathe only underwater."
      }
    ],
    "actions": [
      {
        "name": "Tentacles",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 1 bludgeoning damage, and the target is grappled (escape DC 10). Until this grapple ends, the octopus can't use its tentacles on another target.",
        "attackBonus": 4,
        "damageDescription": "1 Bludgeoning"
      },
      {
        "name": "Ink Cloud",
        "description": "A 5-foot-radius cloud of ink extends all around the octopus if it is underwater. The area is heavily obscured for 1 minute, although a significant current can disperse the ink. After releasing the ink, the octopus can use the Dash action as a bonus action."
      }
    ]
  },
  {
    "name": "Owl",
    "type": "beast",
    "size": "Tiny",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "dex",
    "hp": 1,
    "hitDice": "1d4",
    "speed": {
      "walk": "5 ft.",
      "fly": "60 ft."
    },
    "abilities": {
      "strength": 3,
      "dexterity": 13,
      "constitution": 8,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 7
    },
    "skills": {
      "perception": 3,
      "stealth": 3
    },
    "senses": "darkvision 120 ft., passive_perception 13",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Flyby",
        "description": "The owl doesn't provoke opportunity attacks when it flies out of an enemy's reach."
      },
      {
        "name": "Keen Hearing and Sight",
        "description": "The owl has advantage on Wisdom (Perception) checks that rely on hearing or sight."
      }
    ],
    "actions": [
      {
        "name": "Talons",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 1 slashing damage.",
        "attackBonus": 3,
        "damageDescription": "1 Slashing"
      }
    ]
  },
  {
    "name": "Panther",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 13,
    "hitDice": "3d8",
    "speed": {
      "walk": "50 ft.",
      "climb": "40 ft."
    },
    "abilities": {
      "strength": 14,
      "dexterity": 15,
      "constitution": 10,
      "intelligence": 3,
      "wisdom": 14,
      "charisma": 7
    },
    "skills": {
      "perception": 4,
      "stealth": 6
    },
    "senses": "passive_perception 14",
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The panther has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Pounce",
        "description": "If the panther moves at least 20 ft. straight toward a creature and then hits it with a claw attack on the same turn, that target must succeed on a DC 12 Strength saving throw or be knocked prone. If the target is prone, the panther can make one bite attack against it as a bonus action.",
        "saveDC": 12,
        "saveType": "STR"
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) slashing damage.",
        "attackBonus": 4,
        "damageDescription": "1d4+2 Slashing"
      }
    ]
  },
  {
    "name": "Plesiosaurus",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "natural",
    "hp": 68,
    "hitDice": "8d10",
    "speed": {
      "walk": "20 ft.",
      "swim": "40 ft."
    },
    "abilities": {
      "strength": 18,
      "dexterity": 15,
      "constitution": 16,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 5
    },
    "skills": {
      "perception": 3,
      "stealth": 4
    },
    "senses": "passive_perception 13",
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Hold Breath",
        "description": "The plesiosaurus can hold its breath for 1 hour."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +6 to hit, reach 10 ft., one target. Hit: 14 (3d6 + 4) piercing damage.",
        "attackBonus": 6,
        "damageDescription": "3d6+4 Bludgeoning"
      }
    ]
  },
  {
    "name": "Poisonous Snake",
    "type": "beast",
    "size": "Tiny",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "dex",
    "hp": 2,
    "hitDice": "1d4",
    "speed": {
      "walk": "30 ft.",
      "swim": "30 ft."
    },
    "abilities": {
      "strength": 2,
      "dexterity": 16,
      "constitution": 11,
      "intelligence": 1,
      "wisdom": 10,
      "charisma": 3
    },
    "senses": "blindsight 10 ft., passive_perception 10",
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 1 piercing damage, and the target must make a DC 10 Constitution saving throw, taking 5 (2d4) poison damage on a failed save, or half as much damage on a successful one.",
        "attackBonus": 5,
        "damageDescription": "1 Piercing"
      }
    ]
  },
  {
    "name": "Polar Bear",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "natural",
    "hp": 42,
    "hitDice": "5d10",
    "speed": {
      "walk": "40 ft.",
      "swim": "30 ft."
    },
    "abilities": {
      "strength": 20,
      "dexterity": 10,
      "constitution": 16,
      "intelligence": 2,
      "wisdom": 13,
      "charisma": 7
    },
    "skills": {
      "perception": 3
    },
    "senses": "passive_perception 13",
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The bear has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The bear makes two attacks: one with its bite and one with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 9 (1d8 + 5) piercing damage.",
        "attackBonus": 7,
        "damageDescription": "1d8+5 Piercing"
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 12 (2d6 + 5) slashing damage.",
        "attackBonus": 7,
        "damageDescription": "2d6+5 Slashing"
      }
    ]
  },
  {
    "name": "Pony",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 10,
    "armorType": "dex",
    "hp": 11,
    "hitDice": "2d8",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 10,
      "constitution": 13,
      "intelligence": 2,
      "wisdom": 11,
      "charisma": 7
    },
    "senses": "passive_perception 10",
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "actions": [
      {
        "name": "Hooves",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) bludgeoning damage.",
        "attackBonus": 4,
        "damageDescription": "2d4+2 Bludgeoning"
      }
    ]
  },
  {
    "name": "Quipper",
    "type": "beast",
    "size": "Tiny",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "dex",
    "hp": 1,
    "hitDice": "1d4",
    "speed": {
      "swim": "40 ft."
    },
    "abilities": {
      "strength": 2,
      "dexterity": 16,
      "constitution": 9,
      "intelligence": 1,
      "wisdom": 7,
      "charisma": 2
    },
    "senses": "darkvision 60 ft., passive_perception 8",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Blood Frenzy",
        "description": "The quipper has advantage on melee attack rolls against any creature that doesn't have all its hit points."
      },
      {
        "name": "Water Breathing",
        "description": "The quipper can breathe only underwater."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 1 piercing damage.",
        "attackBonus": 5,
        "damageDescription": "1 Piercing"
      }
    ]
  },
  {
    "name": "Rat",
    "type": "beast",
    "size": "Tiny",
    "alignment": "unaligned",
    "ac": 10,
    "armorType": "dex",
    "hp": 1,
    "hitDice": "1d4",
    "speed": {
      "walk": "20 ft."
    },
    "abilities": {
      "strength": 2,
      "dexterity": 11,
      "constitution": 9,
      "intelligence": 2,
      "wisdom": 10,
      "charisma": 4
    },
    "senses": "darkvision 30 ft., passive_perception 10",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The rat has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +0 to hit, reach 5 ft., one target. Hit: 1 piercing damage.",
        "damageDescription": "1 Piercing"
      }
    ]
  },
  {
    "name": "Raven",
    "type": "beast",
    "size": "Tiny",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 1,
    "hitDice": "1d4",
    "speed": {
      "walk": "10 ft.",
      "fly": "50 ft."
    },
    "abilities": {
      "strength": 2,
      "dexterity": 14,
      "constitution": 8,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 6
    },
    "skills": {
      "perception": 3
    },
    "senses": "passive_perception 13",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Mimicry",
        "description": "The raven can mimic simple sounds it has heard, such as a person whispering, a baby crying, or an animal chittering. A creature that hears the sounds can tell they are imitations with a successful DC 10 Wisdom (Insight) check."
      }
    ],
    "actions": [
      {
        "name": "Beak",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 1 piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1 Piercing"
      }
    ]
  },
  {
    "name": "Reef Shark",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "natural",
    "hp": 22,
    "hitDice": "4d8",
    "speed": {
      "swim": "40 ft."
    },
    "abilities": {
      "strength": 14,
      "dexterity": 13,
      "constitution": 13,
      "intelligence": 1,
      "wisdom": 10,
      "charisma": 4
    },
    "skills": {
      "perception": 2
    },
    "senses": "blindsight 30 ft., passive_perception 12",
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Pack Tactics",
        "description": "The shark has advantage on an attack roll against a creature if at least one of the shark's allies is within 5 ft. of the creature and the ally isn't incapacitated."
      },
      {
        "name": "Water Breathing",
        "description": "The shark can breathe only underwater."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d8+2 Piercing"
      }
    ]
  },
  {
    "name": "Rhinoceros",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "natural",
    "hp": 45,
    "hitDice": "6d10",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 21,
      "dexterity": 8,
      "constitution": 15,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 6
    },
    "senses": "passive_perception 11",
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Charge",
        "description": "If the rhinoceros moves at least 20 ft. straight toward a target and then hits it with a gore attack on the same turn, the target takes an extra 9 (2d8) bludgeoning damage. If the target is a creature, it must succeed on a DC 15 Strength saving throw or be knocked prone."
      }
    ],
    "actions": [
      {
        "name": "Gore",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) bludgeoning damage.",
        "attackBonus": 7,
        "damageDescription": "2d8+5 Bludgeoning"
      }
    ]
  },
  {
    "name": "Riding Horse",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 10,
    "armorType": "dex",
    "hp": 13,
    "hitDice": "2d10",
    "speed": {
      "walk": "60 ft."
    },
    "abilities": {
      "strength": 16,
      "dexterity": 10,
      "constitution": 12,
      "intelligence": 2,
      "wisdom": 11,
      "charisma": 7
    },
    "senses": "passive_perception 10",
    "challengeRating": 0.25,
    "experiencePoints": 25,
    "source": "SRD",
    "actions": [
      {
        "name": "Hooves",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (2d4 + 3) bludgeoning damage.",
        "attackBonus": 5,
        "damageDescription": "2d4+3 Bludgeoning"
      }
    ]
  },
  {
    "name": "Saber-Toothed Tiger",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 52,
    "hitDice": "7d10",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 18,
      "dexterity": 14,
      "constitution": 15,
      "intelligence": 3,
      "wisdom": 12,
      "charisma": 8
    },
    "skills": {
      "perception": 3,
      "stealth": 6
    },
    "senses": "passive_perception 13",
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The tiger has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Pounce",
        "description": "If the tiger moves at least 20 ft. straight toward a creature and then hits it with a claw attack on the same turn, that target must succeed on a DC 14 Strength saving throw or be knocked prone. If the target is prone, the tiger can make one bite attack against it as a bonus action.",
        "saveDC": 14,
        "saveType": "STR"
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 10 (1d10 + 5) piercing damage.",
        "attackBonus": 6,
        "damageDescription": "1d10+5 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 12 (2d6 + 5) slashing damage.",
        "attackBonus": 6,
        "damageDescription": "2d6+5 Slashing"
      }
    ]
  },
  {
    "name": "Scorpion",
    "type": "beast",
    "size": "Tiny",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "natural",
    "hp": 1,
    "hitDice": "1d4",
    "speed": {
      "walk": "10 ft."
    },
    "abilities": {
      "strength": 2,
      "dexterity": 11,
      "constitution": 8,
      "intelligence": 1,
      "wisdom": 8,
      "charisma": 2
    },
    "senses": "blindsight 10 ft., passive_perception 9",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "actions": [
      {
        "name": "Sting",
        "description": "Melee Weapon Attack: +2 to hit, reach 5 ft., one creature. Hit: 1 piercing damage, and the target must make a DC 9 Constitution saving throw, taking 4 (1d8) poison damage on a failed save, or half as much damage on a successful one.",
        "attackBonus": 2,
        "damageDescription": "1 Bludgeoning"
      }
    ]
  },
  {
    "name": "Sea Horse",
    "type": "beast",
    "size": "Tiny",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "dex",
    "hp": 1,
    "hitDice": "1d4",
    "speed": {
      "swim": "20 ft."
    },
    "abilities": {
      "strength": 1,
      "dexterity": 12,
      "constitution": 8,
      "intelligence": 1,
      "wisdom": 10,
      "charisma": 2
    },
    "senses": "passive_perception 10",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Water Breathing",
        "description": "The sea horse can breathe only underwater."
      }
    ]
  },
  {
    "name": "Spider",
    "type": "beast",
    "size": "Tiny",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 1,
    "hitDice": "1d4",
    "speed": {
      "walk": "20 ft.",
      "climb": "20 ft."
    },
    "abilities": {
      "strength": 2,
      "dexterity": 14,
      "constitution": 8,
      "intelligence": 1,
      "wisdom": 10,
      "charisma": 2
    },
    "skills": {
      "stealth": 4
    },
    "senses": "darkvision 30 ft., passive_perception 12",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Spider Climb",
        "description": "The spider can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      },
      {
        "name": "Web Sense",
        "description": "While in contact with a web, the spider knows the exact location of any other creature in contact with the same web."
      },
      {
        "name": "Web Walker",
        "description": "The spider ignores movement restrictions caused by webbing."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 1 piercing damage, and the target must succeed on a DC 9 Constitution saving throw or take 2 (1d4) poison damage.",
        "attackBonus": 4,
        "damageDescription": "1 Piercing"
      }
    ]
  },
  {
    "name": "Stirge",
    "type": "beast",
    "size": "Tiny",
    "alignment": "unaligned",
    "ac": 14,
    "armorType": "natural",
    "hp": 2,
    "hitDice": "1d4",
    "speed": {
      "walk": "10 ft.",
      "fly": "40 ft."
    },
    "abilities": {
      "strength": 4,
      "dexterity": 16,
      "constitution": 11,
      "intelligence": 2,
      "wisdom": 8,
      "charisma": 6
    },
    "senses": "darkvision 60 ft., passive_perception 9",
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "actions": [
      {
        "name": "Blood Drain",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one creature. Hit: 5 (1d4 + 3) piercing damage, and the stirge attaches to the target. While attached, the stirge doesn't attack. Instead, at the start of each of the stirge's turns, the target loses 5 (1d4 + 3) hit points due to blood loss.\nThe stirge can detach itself by spending 5 feet of its movement. It does so after it drains 10 hit points of blood from the target or the target dies. A creature, including the target, can use its action to detach the stirge.",
        "attackBonus": 5,
        "damageDescription": "1d4+3 Piercing"
      }
    ]
  },
  {
    "name": "Swarm of Bats",
    "type": "swarm of Tiny beasts",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 22,
    "hitDice": "5d8",
    "speed": {
      "walk": "0 ft.",
      "fly": "30 ft."
    },
    "abilities": {
      "strength": 5,
      "dexterity": 15,
      "constitution": 10,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 4
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "conditionImmunities": [
      "Charmed",
      "Frightened",
      "Grappled",
      "Paralyzed",
      "Petrified",
      "Prone",
      "Restrained",
      "Stunned"
    ],
    "senses": "blindsight 60 ft., passive_perception 11",
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "traits": [
      {
        "name": "Echolocation",
        "description": "The swarm can't use its blindsight while deafened."
      },
      {
        "name": "Keen Hearing",
        "description": "The swarm has advantage on Wisdom (Perception) checks that rely on hearing."
      },
      {
        "name": "Swarm",
        "description": "The swarm can occupy another creature's space and vice versa, and the swarm can move through any opening large enough for a Tiny bat. The swarm can't regain hit points or gain temporary hit points."
      }
    ],
    "actions": [
      {
        "name": "Bites",
        "description": "Melee Weapon Attack: +4 to hit, reach 0 ft., one creature in the swarm's space. Hit: 5 (2d4) piercing damage, or 2 (1d4) piercing damage if the swarm has half of its hit points or fewer.",
        "attackBonus": 4,
        "damageDescription": "2d4 Piercing"
      }
    ]
  },
  {
    "name": "Swarm of Beetles",
    "type": "swarm of Tiny beasts",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "natural",
    "hp": 22,
    "hitDice": "5d8",
    "speed": {
      "walk": "20 ft.",
      "burrow": "5 ft.",
      "climb": "20 ft."
    },
    "abilities": {
      "strength": 3,
      "dexterity": 13,
      "constitution": 10,
      "intelligence": 1,
      "wisdom": 7,
      "charisma": 1
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "conditionImmunities": [
      "Charmed",
      "Frightened",
      "Grappled",
      "Paralyzed",
      "Petrified",
      "Prone",
      "Restrained",
      "Stunned"
    ],
    "senses": "blindsight 10 ft., passive_perception 8",
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Swarm",
        "description": "The swarm can occupy another creature's space and vice versa, and the swarm can move through any opening large enough for a Tiny insect. The swarm can't regain hit points or gain temporary hit points."
      }
    ],
    "actions": [
      {
        "name": "Bites",
        "description": "Melee Weapon Attack: +3 to hit, reach 0 ft., one target in the swarm's space. Hit: 10 (4d4) piercing damage, or 5 (2d4) piercing damage if the swarm has half of its hit points or fewer.",
        "attackBonus": 3,
        "damageDescription": "4d4 Piercing"
      }
    ]
  },
  {
    "name": "Swarm of Centipedes",
    "type": "swarm of Tiny beasts",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "natural",
    "hp": 22,
    "hitDice": "5d8",
    "speed": {
      "walk": "20 ft.",
      "climb": "20 ft."
    },
    "abilities": {
      "strength": 3,
      "dexterity": 13,
      "constitution": 10,
      "intelligence": 1,
      "wisdom": 7,
      "charisma": 1
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "conditionImmunities": [
      "Charmed",
      "Frightened",
      "Grappled",
      "Paralyzed",
      "Petrified",
      "Prone",
      "Restrained",
      "Stunned"
    ],
    "senses": "blindsight 10 ft., passive_perception 8",
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Swarm",
        "description": "The swarm can occupy another creature's space and vice versa, and the swarm can move through any opening large enough for a Tiny insect. The swarm can't regain hit points or gain temporary hit points."
      }
    ],
    "actions": [
      {
        "name": "Bites",
        "description": "Melee Weapon Attack: +3 to hit, reach 0 ft., one target in the swarm's space. Hit: 10 (4d4) piercing damage, or 5 (2d4) piercing damage if the swarm has half of its hit points or fewer.\nA creature reduced to 0 hit points by a swarm of centipedes is stable but poisoned for 1 hour, even after regaining hit points, and paralyzed while poisoned in this way.",
        "attackBonus": 3,
        "damageDescription": "4d4 Piercing"
      }
    ]
  },
  {
    "name": "Swarm of Insects",
    "type": "swarm of Tiny beasts",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "natural",
    "hp": 22,
    "hitDice": "5d8",
    "speed": {
      "walk": "20 ft.",
      "climb": "20 ft."
    },
    "abilities": {
      "strength": 3,
      "dexterity": 13,
      "constitution": 10,
      "intelligence": 1,
      "wisdom": 7,
      "charisma": 1
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "conditionImmunities": [
      "Charmed",
      "Frightened",
      "Grappled",
      "Paralyzed",
      "Petrified",
      "Prone",
      "Restrained",
      "Stunned"
    ],
    "senses": "blindsight 10 ft., passive_perception 8",
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Swarm",
        "description": "The swarm can occupy another creature's space and vice versa, and the swarm can move through any opening large enough for a Tiny insect. The swarm can't regain hit points or gain temporary hit points."
      }
    ],
    "actions": [
      {
        "name": "Bites",
        "description": "Melee Weapon Attack: +3 to hit, reach 0 ft., one target in the swarm's space. Hit: 10 (4d4) piercing damage, or 5 (2d4) piercing damage if the swarm has half of its hit points or fewer.",
        "attackBonus": 3,
        "damageDescription": "4d4 Piercing"
      }
    ]
  },
  {
    "name": "Swarm of Poisonous Snakes",
    "type": "swarm of Tiny beasts",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 14,
    "armorType": "dex",
    "hp": 36,
    "hitDice": "8d8",
    "speed": {
      "walk": "30 ft.",
      "swim": "30 ft."
    },
    "abilities": {
      "strength": 8,
      "dexterity": 18,
      "constitution": 11,
      "intelligence": 1,
      "wisdom": 10,
      "charisma": 3
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "conditionImmunities": [
      "Charmed",
      "Frightened",
      "Grappled",
      "Paralyzed",
      "Petrified",
      "Prone",
      "Restrained",
      "Stunned"
    ],
    "senses": "blindsight 10 ft., passive_perception 10",
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Swarm",
        "description": "The swarm can occupy another creature's space and vice versa, and the swarm can move through any opening large enough for a Tiny snake. The swarm can't regain hit points or gain temporary hit points."
      }
    ],
    "actions": [
      {
        "name": "Bites",
        "description": "Melee Weapon Attack: +6 to hit, reach 0 ft., one creature in the swarm's space. Hit: 7 (2d6) piercing damage, or 3 (1d6) piercing damage if the swarm has half of its hit points or fewer. The target must make a DC 10 Constitution saving throw, taking 14 (4d6) poison damage on a failed save, or half as much damage on a successful one.",
        "attackBonus": 6,
        "damageDescription": "2d6 Piercing"
      }
    ]
  },
  {
    "name": "Swarm of Quippers",
    "type": "swarm of Tiny beasts",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "dex",
    "hp": 28,
    "hitDice": "8d8",
    "speed": {
      "walk": "0 ft.",
      "swim": "40 ft."
    },
    "abilities": {
      "strength": 13,
      "dexterity": 16,
      "constitution": 9,
      "intelligence": 1,
      "wisdom": 7,
      "charisma": 2
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "conditionImmunities": [
      "Charmed",
      "Frightened",
      "Grappled",
      "Paralyzed",
      "Petrified",
      "Prone",
      "Restrained",
      "Stunned"
    ],
    "senses": "darkvision 60 ft., passive_perception 8",
    "challengeRating": 1,
    "experiencePoints": 200,
    "source": "SRD",
    "traits": [
      {
        "name": "Blood Frenzy",
        "description": "The swarm has advantage on melee attack rolls against any creature that doesn't have all its hit points."
      },
      {
        "name": "Swarm",
        "description": "The swarm can occupy another creature's space and vice versa, and the swarm can move through any opening large enough for a Tiny quipper. The swarm can't regain hit points or gain temporary hit points."
      },
      {
        "name": "Water Breathing",
        "description": "The swarm can breathe only underwater."
      }
    ],
    "actions": [
      {
        "name": "Bites",
        "description": "Melee Weapon Attack: +5 to hit, reach 0 ft., one creature in the swarm's space. Hit: 14 (4d6) piercing damage, or 7 (2d6) piercing damage if the swarm has half of its hit points or fewer.",
        "attackBonus": 5,
        "damageDescription": "4d6 Piercing"
      }
    ]
  },
  {
    "name": "Swarm of Rats",
    "type": "swarm of Tiny beasts",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 10,
    "armorType": "dex",
    "hp": 24,
    "hitDice": "7d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 9,
      "dexterity": 11,
      "constitution": 9,
      "intelligence": 2,
      "wisdom": 10,
      "charisma": 3
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "conditionImmunities": [
      "Charmed",
      "Frightened",
      "Grappled",
      "Paralyzed",
      "Petrified",
      "Prone",
      "Restrained",
      "Stunned"
    ],
    "senses": "darkvision 30 ft., passive_perception 10",
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The swarm has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Swarm",
        "description": "The swarm can occupy another creature's space and vice versa, and the swarm can move through any opening large enough for a Tiny rat. The swarm can't regain hit points or gain temporary hit points."
      }
    ],
    "actions": [
      {
        "name": "Bites",
        "description": "Melee Weapon Attack: +2 to hit, reach 0 ft., one target in the swarm's space. Hit: 7 (2d6) piercing damage, or 3 (1d6) piercing damage if the swarm has half of its hit points or fewer.",
        "attackBonus": 2,
        "damageDescription": "2d6 Piercing"
      }
    ]
  },
  {
    "name": "Swarm of Ravens",
    "type": "swarm of Tiny beasts",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 24,
    "hitDice": "7d8",
    "speed": {
      "walk": "10 ft.",
      "fly": "50 ft."
    },
    "abilities": {
      "strength": 6,
      "dexterity": 14,
      "constitution": 8,
      "intelligence": 3,
      "wisdom": 12,
      "charisma": 6
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "conditionImmunities": [
      "Charmed",
      "Frightened",
      "Grappled",
      "Paralyzed",
      "Petrified",
      "Prone",
      "Restrained",
      "Stunned"
    ],
    "senses": "passive_perception 15",
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "traits": [
      {
        "name": "Swarm",
        "description": "The swarm can occupy another creature's space and vice versa, and the swarm can move through any opening large enough for a Tiny raven. The swarm can't regain hit points or gain temporary hit points."
      }
    ],
    "actions": [
      {
        "name": "Beaks",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target in the swarm's space. Hit: 7 (2d6) piercing damage, or 3 (1d6) piercing damage if the swarm has half of its hit points or fewer.",
        "attackBonus": 4,
        "damageDescription": "2d6 Piercing"
      }
    ]
  },
  {
    "name": "Swarm of Spiders",
    "type": "swarm of Tiny beasts",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "natural",
    "hp": 22,
    "hitDice": "5d8",
    "speed": {
      "walk": "20 ft.",
      "climb": "20 ft."
    },
    "abilities": {
      "strength": 3,
      "dexterity": 13,
      "constitution": 10,
      "intelligence": 1,
      "wisdom": 7,
      "charisma": 1
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "conditionImmunities": [
      "Charmed",
      "Frightened",
      "Paralyzed",
      "Petrified",
      "Prone",
      "Restrained",
      "Stunned"
    ],
    "senses": "blindsight 10 ft., passive_perception 8",
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Swarm",
        "description": "The swarm can occupy another creature's space and vice versa, and the swarm can move through any opening large enough for a Tiny insect. The swarm can't regain hit points or gain temporary hit points."
      },
      {
        "name": "Spider Climb",
        "description": "The swarm can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      },
      {
        "name": "Web Sense",
        "description": "While in contact with a web, the swarm knows the exact location of any other creature in contact with the same web."
      },
      {
        "name": "Web Walker",
        "description": "The swarm ignores movement restrictions caused by webbing."
      }
    ],
    "actions": [
      {
        "name": "Bites",
        "description": "Melee Weapon Attack: +3 to hit, reach 0 ft., one target in the swarm's space. Hit: 10 (4d4) piercing damage, or 5 (2d4) piercing damage if the swarm has half of its hit points or fewer.",
        "attackBonus": 3,
        "damageDescription": "4d4 Piercing"
      }
    ]
  },
  {
    "name": "Swarm of Wasps",
    "type": "swarm of Tiny beasts",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "natural",
    "hp": 22,
    "hitDice": "5d8",
    "speed": {
      "walk": "5 ft.",
      "fly": "30 ft."
    },
    "abilities": {
      "strength": 3,
      "dexterity": 13,
      "constitution": 10,
      "intelligence": 1,
      "wisdom": 7,
      "charisma": 1
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "conditionImmunities": [
      "Charmed",
      "Frightened",
      "Grappled",
      "Paralyzed",
      "Petrified",
      "Prone",
      "Restrained",
      "Stunned"
    ],
    "senses": "blindsight 10 ft., passive_perception 8",
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Swarm",
        "description": "The swarm can occupy another creature's space and vice versa, and the swarm can move through any opening large enough for a Tiny insect. The swarm can't regain hit points or gain temporary hit points."
      }
    ],
    "actions": [
      {
        "name": "Bites",
        "description": "Melee Weapon Attack: +3 to hit, reach 0 ft., one target in the swarm's space. Hit: 10 (4d4) piercing damage, or 5 (2d4) piercing damage if the swarm has half of its hit points or fewer.",
        "attackBonus": 3,
        "damageDescription": "4d4 Piercing"
      }
    ]
  },
  {
    "name": "Tiger",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 37,
    "hitDice": "5d10",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 17,
      "dexterity": 15,
      "constitution": 14,
      "intelligence": 3,
      "wisdom": 12,
      "charisma": 8
    },
    "skills": {
      "perception": 3,
      "stealth": 6
    },
    "senses": "darkvision 60 ft., passive_perception 13",
    "challengeRating": 1,
    "experiencePoints": 200,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Smell",
        "description": "The tiger has advantage on Wisdom (Perception) checks that rely on smell."
      },
      {
        "name": "Pounce",
        "description": "If the tiger moves at least 20 ft. straight toward a creature and then hits it with a claw attack on the same turn, that target must succeed on a DC 13 Strength saving throw or be knocked prone. If the target is prone, the tiger can make one bite attack against it as a bonus action.",
        "saveDC": 13,
        "saveType": "STR"
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
        "name": "Claw",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) slashing damage.",
        "attackBonus": 5,
        "damageDescription": "1d8+3 Slashing"
      }
    ]
  },
  {
    "name": "Triceratops",
    "type": "beast",
    "size": "Huge",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "natural",
    "hp": 95,
    "hitDice": "10d12",
    "speed": {
      "walk": "50 ft."
    },
    "abilities": {
      "strength": 22,
      "dexterity": 9,
      "constitution": 17,
      "intelligence": 2,
      "wisdom": 11,
      "charisma": 5
    },
    "senses": "passive_perception 10",
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "traits": [
      {
        "name": "Trampling Charge",
        "description": "If the triceratops moves at least 20 ft. straight toward a creature and then hits it with a gore attack on the same turn, that target must succeed on a DC 13 Strength saving throw or be knocked prone. If the target is prone, the triceratops can make one stomp attack against it as a bonus action."
      }
    ],
    "actions": [
      {
        "name": "Gore",
        "description": "Melee Weapon Attack: +9 to hit, reach 5 ft., one target. Hit: 24 (4d8 + 6) piercing damage.",
        "attackBonus": 9,
        "damageDescription": "4d8+6 Piercing"
      },
      {
        "name": "Stomp",
        "description": "Melee Weapon Attack: +9 to hit, reach 5 ft., one prone creature. Hit: 22 (3d10 + 6) bludgeoning damage",
        "attackBonus": 9,
        "damageDescription": "3d10+6 Bludgeoning"
      }
    ]
  },
  {
    "name": "Tyrannosaurus Rex",
    "type": "beast",
    "size": "Huge",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "natural",
    "hp": 136,
    "hitDice": "13d12",
    "speed": {
      "walk": "50 ft."
    },
    "abilities": {
      "strength": 25,
      "dexterity": 10,
      "constitution": 19,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 9
    },
    "skills": {
      "perception": 4
    },
    "senses": "passive_perception 14",
    "challengeRating": 8,
    "experiencePoints": 3900,
    "source": "SRD",
    "actions": [
      {
        "name": "Multiattack",
        "description": "The tyrannosaurus makes two attacks: one with its bite and one with its tail. It can't make both attacks against the same target."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 33 (4d12 + 7) piercing damage. If the target is a Medium or smaller creature, it is grappled (escape DC 17). Until this grapple ends, the target is restrained, and the tyrannosaurus can't bite another target.",
        "attackBonus": 10,
        "damageDescription": "4d12+7 Piercing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 20 (3d8 + 7) bludgeoning damage.",
        "attackBonus": 10,
        "damageDescription": "3d8+7 Bludgeoning"
      }
    ]
  },
  {
    "name": "Vulture",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 10,
    "armorType": "dex",
    "hp": 5,
    "hitDice": "1d8",
    "speed": {
      "walk": "10 ft.",
      "fly": "50 ft."
    },
    "abilities": {
      "strength": 7,
      "dexterity": 10,
      "constitution": 13,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 4
    },
    "skills": {
      "perception": 3
    },
    "senses": "passive_perception 13",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Sight and Smell",
        "description": "The vulture has advantage on Wisdom (Perception) checks that rely on sight or smell."
      },
      {
        "name": "Pack Tactics",
        "description": "The vulture has advantage on an attack roll against a creature if at least one of the vulture's allies is within 5 ft. of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Beak",
        "description": "Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 2 (1d4) piercing damage.",
        "attackBonus": 2,
        "damageDescription": "1d4 Piercing"
      }
    ]
  },
  {
    "name": "Warhorse",
    "type": "beast",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "dex",
    "hp": 19,
    "hitDice": "3d10",
    "speed": {
      "walk": "60 ft."
    },
    "abilities": {
      "strength": 18,
      "dexterity": 12,
      "constitution": 13,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 7
    },
    "senses": "passive_perception 11",
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Trampling Charge",
        "description": "If the horse moves at least 20 ft. straight toward a creature and then hits it with a hooves attack on the same turn, that target must succeed on a DC 14 Strength saving throw or be knocked prone. If the target is prone, the horse can make another attack with its hooves against it as a bonus action."
      }
    ],
    "actions": [
      {
        "name": "Hooves",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) bludgeoning damage.",
        "attackBonus": 6,
        "damageDescription": "2d6+4 Bludgeoning"
      }
    ]
  },
  {
    "name": "Weasel",
    "type": "beast",
    "size": "Tiny",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "dex",
    "hp": 1,
    "hitDice": "1d4",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 3,
      "dexterity": 16,
      "constitution": 8,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 3
    },
    "skills": {
      "perception": 3,
      "stealth": 5
    },
    "senses": "passive_perception 13",
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Hearing and Smell",
        "description": "The weasel has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one creature. Hit: 1 piercing damage.",
        "attackBonus": 5,
        "damageDescription": "1 Piercing"
      }
    ]
  },
  {
    "name": "Wolf",
    "type": "beast",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "natural",
    "hp": 11,
    "hitDice": "2d8",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 12,
      "dexterity": 15,
      "constitution": 12,
      "intelligence": 3,
      "wisdom": 12,
      "charisma": 6
    },
    "skills": {
      "perception": 3,
      "stealth": 4
    },
    "senses": "passive_perception 13",
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Hearing and Smell",
        "description": "The wolf has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      },
      {
        "name": "Pack Tactics",
        "description": "The wolf has advantage on an attack roll against a creature if at least one of the wolf's allies is within 5 ft. of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) piercing damage. If the target is a creature, it must succeed on a DC 11 Strength saving throw or be knocked prone.",
        "attackBonus": 4,
        "damageDescription": "2d4+2 Piercing"
      }
    ]
  }
];

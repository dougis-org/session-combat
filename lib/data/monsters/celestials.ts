/**
 * D&D 5e SRD Celestials
 * Source: D&D 5e API (https://www.dnd5eapi.co)
 */

import { MonsterTemplate } from '@/lib/types';

export const CELESTIALS: Omit<MonsterTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | '_id'>[] = [
  {
    "name": "Couatl",
    "size": "medium",
    "type": "celestial",
    "alignment": "lawful good",
    "ac": 19,
    "acNote": "natural armor",
    "hp": 97,
    "maxHp": 97,
    "speed": "30 ft., fly 90 ft.",
    "abilityScores": {
      "strength": 16,
      "dexterity": 20,
      "constitution": 17,
      "intelligence": 18,
      "wisdom": 20,
      "charisma": 18
    },
    "savingThrows": {
      "con": 5,
      "wis": 7,
      "cha": 6
    },
    "damageResistances": [
      "radiant"
    ],
    "damageImmunities": [
      "psychic",
      "bludgeoning, piercing, and slashing from nonmagical weapons"
    ],
    "senses": {
      "truesight": "120 ft.",
      "passive_perception": "15"
    },
    "languages": [
      "all",
      "telepathy 120 ft."
    ],
    "challengeRating": 4,
    "experiencePoints": 1100,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Innate Spellcasting",
        "description": "The couatl's spellcasting ability is Charisma (spell save DC 14). It can innately cast the following spells, requiring only verbal components:\n\nAt will: detect evil and good, detect magic, detect thoughts\n3/day each: bless, create food and water, cure wounds, lesser restoration, protection from poison, sanctuary, shield\n1/day each: dream, greater restoration, scrying"
      },
      {
        "name": "Magic Weapons",
        "description": "The couatl's weapon attacks are magical."
      },
      {
        "name": "Shielded Mind",
        "description": "The couatl is immune to scrying and to any effect that would sense its emotions, read its thoughts, or detect its location."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +8 to hit, reach 5 ft., one creature. Hit: 8 (1d6 + 5) piercing damage, and the target must succeed on a DC 13 Constitution saving throw or be poisoned for 24 hours. Until this poison ends, the target is unconscious. Another creature can use an action to shake the target awake.",
        "attackBonus": 8,
        "damageDescription": "1d6+5 Piercing"
      },
      {
        "name": "Constrict",
        "description": "Melee Weapon Attack: +6 to hit, reach 10 ft., one Medium or smaller creature. Hit: 10 (2d6 + 3) bludgeoning damage, and the target is grappled (escape DC 15). Until this grapple ends, the target is restrained, and the couatl can't constrict another target.",
        "attackBonus": 6,
        "damageDescription": "2d6+3 Bludgeoning"
      },
      {
        "name": "Change Shape",
        "description": "The couatl magically polymorphs into a humanoid or beast that has a challenge rating equal to or less than its own, or back into its true form. It reverts to its true form if it dies. Any equipment it is wearing or carrying is absorbed or borne by the new form (the couatl's choice).\nIn a new form, the couatl retains its game statistics and ability to speak, but its AC, movement modes, Strength, Dexterity, and other actions are replaced by those of the new form, and it gains any statistics and capabilities (except class features, legendary actions, and lair actions) that the new form has but that it lacks. If the new form has a bite attack, the couatl can use its bite in that form."
      }
    ]
  },
  {
    "name": "Deva",
    "size": "medium",
    "type": "celestial",
    "alignment": "lawful good",
    "ac": 17,
    "acNote": "natural armor",
    "hp": 136,
    "maxHp": 136,
    "speed": "30 ft., fly 90 ft.",
    "abilityScores": {
      "strength": 18,
      "dexterity": 18,
      "constitution": 18,
      "intelligence": 17,
      "wisdom": 20,
      "charisma": 20
    },
    "savingThrows": {
      "wis": 9,
      "cha": 9
    },
    "skills": {
      "insight": 9,
      "perception": 9
    },
    "damageResistances": [
      "radiant",
      "bludgeoning, piercing, and slashing from nonmagical weapons"
    ],
    "conditionImmunities": [
      "Charmed",
      "Exhaustion",
      "Frightened"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive_perception": "19"
    },
    "languages": [
      "all",
      "telepathy 120 ft."
    ],
    "challengeRating": 10,
    "experiencePoints": 5900,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Angelic Weapons",
        "description": "The deva's weapon attacks are magical. When the deva hits with any weapon, the weapon deals an extra 4d8 radiant damage (included in the attack)."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The deva's spellcasting ability is Charisma (spell save DC 17). The deva can innately cast the following spells, requiring only verbal components:\nAt will: detect evil and good\n1/day each: commune, raise dead"
      },
      {
        "name": "Magic Resistance",
        "description": "The deva has advantage on saving throws against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The deva makes two melee attacks."
      },
      {
        "name": "Mace",
        "description": "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 7 (1d6 + 4) bludgeoning damage plus 18 (4d8) radiant damage.",
        "attackBonus": 8,
        "damageDescription": "1d6+4 Bludgeoning"
      },
      {
        "name": "Healing Touch",
        "description": "The deva touches another creature. The target magically regains 20 (4d8 + 2) hit points and is freed from any curse, disease, poison, blindness, or deafness."
      },
      {
        "name": "Change Shape",
        "description": "The deva magically polymorphs into a humanoid or beast that has a challenge rating equal to or less than its own, or back into its true form. It reverts to its true form if it dies. Any equipment it is wearing or carrying is absorbed or borne by the new form (the deva's choice).\nIn a new form, the deva retains its game statistics and ability to speak, but its AC, movement modes, Strength, Dexterity, and special senses are replaced by those of the new form, and it gains any statistics and capabilities (except class features, legendary actions, and lair actions) that the new form has but that it lacks."
      }
    ]
  },
  {
    "name": "Pegasus",
    "size": "large",
    "type": "celestial",
    "alignment": "chaotic good",
    "ac": 12,
    "acNote": "dex armor",
    "hp": 59,
    "maxHp": 59,
    "speed": "60 ft., fly 90 ft.",
    "abilityScores": {
      "strength": 18,
      "dexterity": 15,
      "constitution": 16,
      "intelligence": 10,
      "wisdom": 15,
      "charisma": 13
    },
    "savingThrows": {
      "dex": 4,
      "wis": 4,
      "cha": 3
    },
    "skills": {
      "perception": 6
    },
    "senses": {
      "passive_perception": "16"
    },
    "languages": [
      "understands Celestial",
      "Common",
      "Elvish",
      "and Sylvan but can't speak"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "isGlobal": true,
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
    "name": "Planetar",
    "size": "large",
    "type": "celestial",
    "alignment": "lawful good",
    "ac": 19,
    "acNote": "natural armor",
    "hp": 200,
    "maxHp": 200,
    "speed": "40 ft., fly 120 ft.",
    "abilityScores": {
      "strength": 24,
      "dexterity": 20,
      "constitution": 24,
      "intelligence": 19,
      "wisdom": 22,
      "charisma": 25
    },
    "savingThrows": {
      "con": 12,
      "wis": 11,
      "cha": 12
    },
    "skills": {
      "perception": 11
    },
    "damageResistances": [
      "radiant",
      "bludgeoning, piercing, and slashing from nonmagical weapons"
    ],
    "conditionImmunities": [
      "Charmed",
      "Exhaustion",
      "Frightened"
    ],
    "senses": {
      "truesight": "120 ft.",
      "passive_perception": "21"
    },
    "languages": [
      "all",
      "telepathy 120 ft."
    ],
    "challengeRating": 16,
    "experiencePoints": 15000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Angelic Weapons",
        "description": "The planetar's weapon attacks are magical. When the planetar hits with any weapon, the weapon deals an extra 5d8 radiant damage (included in the attack)."
      },
      {
        "name": "Divine Awareness",
        "description": "The planetar knows if it hears a lie."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The planetar's spellcasting ability is Charisma (spell save DC 20). The planetar can innately cast the following spells, requiring no material components:\nAt will: detect evil and good, invisibility (self only)\n3/day each: blade barrier, dispel evil and good, flame strike, raise dead\n1/day each: commune, control weather, insect plague"
      },
      {
        "name": "Magic Resistance",
        "description": "The planetar has advantage on saving throws against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The planetar makes two melee attacks."
      },
      {
        "name": "Greatsword",
        "description": "Melee Weapon Attack: +12 to hit, reach 5 ft., one target. Hit: 21 (4d6 + 7) slashing damage plus 22 (5d8) radiant damage.",
        "attackBonus": 12,
        "damageDescription": "4d6+7 Slashing"
      },
      {
        "name": "Healing Touch",
        "description": "The planetar touches another creature. The target magically regains 30 (6d8 + 3) hit points and is freed from any curse, disease, poison, blindness, or deafness."
      }
    ]
  },
  {
    "name": "Solar",
    "size": "large",
    "type": "celestial",
    "alignment": "lawful good",
    "ac": 21,
    "acNote": "natural armor",
    "hp": 243,
    "maxHp": 243,
    "speed": "50 ft., fly 150 ft.",
    "abilityScores": {
      "strength": 26,
      "dexterity": 22,
      "constitution": 26,
      "intelligence": 25,
      "wisdom": 25,
      "charisma": 30
    },
    "savingThrows": {
      "int": 14,
      "wis": 14,
      "cha": 17
    },
    "skills": {
      "perception": 14
    },
    "damageResistances": [
      "radiant",
      "bludgeoning, piercing, and slashing from nonmagical weapons"
    ],
    "damageImmunities": [
      "necrotic",
      "poison"
    ],
    "conditionImmunities": [
      "Charmed",
      "Exhaustion",
      "Frightened",
      "Poisoned"
    ],
    "senses": {
      "truesight": "120 ft.",
      "passive_perception": "24"
    },
    "languages": [
      "all",
      "telepathy 120 ft."
    ],
    "challengeRating": 21,
    "experiencePoints": 33000,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Angelic Weapons",
        "description": "The solar's weapon attacks are magical. When the solar hits with any weapon, the weapon deals an extra 6d8 radiant damage (included in the attack)."
      },
      {
        "name": "Divine Awareness",
        "description": "The solar knows if it hears a lie."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The solar's spell casting ability is Charisma (spell save DC 25). It can innately cast the following spells, requiring no material components:\nAt will: detect evil and good, invisibility (self only)\n3/day each: blade barrier, dispel evil and good, resurrection\n1/day each: commune, control weather"
      },
      {
        "name": "Magic Resistance",
        "description": "The solar has advantage on saving throws against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The solar makes two greatsword attacks."
      },
      {
        "name": "Greatsword",
        "description": "Melee Weapon Attack: +15 to hit, reach 5 ft., one target. Hit: 22 (4d6 + 8) slashing damage plus 27 (6d8) radiant damage.",
        "attackBonus": 15,
        "damageDescription": "4d6+8 Radiant"
      },
      {
        "name": "Slaying Longbow",
        "description": "Ranged Weapon Attack: +13 to hit, range 150/600 ft., one target. Hit: 15 (2d8 + 6) piercing damage plus 27 (6d8) radiant damage. If the target is a creature that has 190 hit points or fewer, it must succeed on a DC 15 Constitution saving throw or die.",
        "attackBonus": 13,
        "damageDescription": "2d8+6 Piercing"
      },
      {
        "name": "Flying Sword",
        "description": "The solar releases its greatsword to hover magically in an unoccupied space within 5 ft. of it. If the solar can see the sword, the solar can mentally command it as a bonus action to fly up to 50 ft. and either make one attack against a target or return to the solar's hands. If the hovering sword is targeted by any effect, the solar is considered to be holding it. The hovering sword falls if the solar dies."
      },
      {
        "name": "Healing Touch",
        "description": "The solar touches another creature. The target magically regains 40 (8d8 + 4) hit points and is freed from any curse, disease, poison, blindness, or deafness."
      }
    ],
    "legendaryActions": [
      {
        "name": "Teleport",
        "description": "The solar magically teleports, along with any equipment it is wearing or carrying, up to 120 ft. to an unoccupied space it can see."
      },
      {
        "name": "Searing Burst (Costs 2 Actions)",
        "description": "The solar emits magical, divine energy. Each creature of its choice in a 10 -foot radius must make a DC 23 Dexterity saving throw, taking 14 (4d6) fire damage plus 14 (4d6) radiant damage on a failed save, or half as much damage on a successful one."
      },
      {
        "name": "Blinding Gaze (Costs 3 Actions)",
        "description": "The solar targets one creature it can see within 30 ft. of it. If the target can see it, the target must succeed on a DC 15 Constitution saving throw or be blinded until magic such as the lesser restoration spell removes the blindness."
      }
    ]
  },
  {
    "name": "Unicorn",
    "size": "large",
    "type": "celestial",
    "alignment": "lawful good",
    "ac": 12,
    "acNote": "dex armor",
    "hp": 67,
    "maxHp": 67,
    "speed": "50 ft.",
    "abilityScores": {
      "strength": 18,
      "dexterity": 14,
      "constitution": 15,
      "intelligence": 11,
      "wisdom": 17,
      "charisma": 16
    },
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "Charmed",
      "Paralyzed",
      "Poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": "13"
    },
    "languages": [
      "Celestial",
      "Elvish",
      "Sylvan",
      "telepathy 60 ft."
    ],
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Charge",
        "description": "If the unicorn moves at least 20 ft. straight toward a target and then hits it with a horn attack on the same turn, the target takes an extra 9 (2d8) piercing damage. If the target is a creature, it must succeed on a DC 15 Strength saving throw or be knocked prone."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The unicorn's innate spellcasting ability is Charisma (spell save DC 14). The unicorn can innately cast the following spells, requiring no components:\n\nAt will: detect evil and good, druidcraft, pass without trace\n1/day each: calm emotions, dispel evil and good, entangle"
      },
      {
        "name": "Magic Resistance",
        "description": "The unicorn has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Magic Weapons",
        "description": "The unicorn's weapon attacks are magical."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The unicorn makes two attacks: one with its hooves and one with its horn."
      },
      {
        "name": "Hooves",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) bludgeoning damage.",
        "attackBonus": 7,
        "damageDescription": "2d6+4 Bludgeoning"
      },
      {
        "name": "Horn",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) piercing damage.",
        "attackBonus": 7,
        "damageDescription": "1d8+4 Piercing"
      },
      {
        "name": "Healing Touch",
        "description": "The unicorn touches another creature with its horn. The target magically regains 11 (2d8 + 2) hit points. In addition, the touch removes all diseases and neutralizes all poisons afflicting the target."
      },
      {
        "name": "Teleport",
        "description": "The unicorn magically teleports itself and up to three willing creatures it can see within 5 ft. of it, along with any equipment they are wearing or carrying, to a location the unicorn is familiar with, up to 1 mile away."
      }
    ],
    "legendaryActions": [
      {
        "name": "Hooves",
        "description": "The unicorn makes one attack with its hooves."
      },
      {
        "name": "Shimmering Shield (Costs 2 Actions)",
        "description": "The unicorn creates a shimmering, magical field around itself or another creature it can see within 60 ft. of it. The target gains a +2 bonus to AC until the end of the unicorn's next turn."
      },
      {
        "name": "Heal Self (Costs 3 Actions)",
        "description": "The unicorn magically regains 11 (2d8 + 2) hit points."
      }
    ]
  }
];

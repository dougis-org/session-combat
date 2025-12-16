/**
 * D&D 5e SRD Elementals
 * Source: D&D 5e API (https://www.dnd5eapi.co)
 */

import { MonsterTemplate } from '@/lib/types';

export const ELEMENTALS: Omit<MonsterTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt' | '_id'>[] = [
  {
    "name": "Air Elemental",
    "size": "large",
    "type": "elemental",
    "alignment": "neutral",
    "ac": 15,
    "acNote": "dex armor",
    "hp": 90,
    "maxHp": 90,
    "speed": "fly 90 ft.",
    "abilityScores": {
      "strength": 14,
      "dexterity": 20,
      "constitution": 14,
      "intelligence": 6,
      "wisdom": 10,
      "charisma": 6
    },
    "damageResistances": [
      "lightning",
      "thunder",
      "bludgeoning, piercing, and slashing from nonmagical weapons"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "Exhaustion",
      "Grappled",
      "Paralyzed",
      "Petrified",
      "Poisoned",
      "Prone",
      "Restrained",
      "Unconscious"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": "10"
    },
    "languages": [
      "Auran"
    ],
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Air Form",
        "description": "The elemental can enter a hostile creature's space and stop there. It can move through a space as narrow as 1 inch wide without squeezing."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The elemental makes two slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) bludgeoning damage.",
        "attackBonus": 8,
        "damageDescription": "2d8+5 Bludgeoning"
      },
      {
        "name": "Whirlwind",
        "description": "Each creature in the elemental's space must make a DC 13 Strength saving throw. On a failure, a target takes 15 (3d8 + 2) bludgeoning damage and is flung up 20 feet away from the elemental in a random direction and knocked prone. If a thrown target strikes an object, such as a wall or floor, the target takes 3 (1d6) bludgeoning damage for every 10 feet it was thrown. If the target is thrown at another creature, that creature must succeed on a DC 13 Dexterity saving throw or take the same damage and be knocked prone.\nIf the saving throw is successful, the target takes half the bludgeoning damage and isn't flung away or knocked prone."
      }
    ]
  },
  {
    "name": "Azer",
    "size": "medium",
    "type": "elemental",
    "alignment": "lawful neutral",
    "ac": 15,
    "acNote": "natural armor",
    "hp": 39,
    "maxHp": 39,
    "speed": "30 ft.",
    "abilityScores": {
      "strength": 17,
      "dexterity": 12,
      "constitution": 15,
      "intelligence": 12,
      "wisdom": 13,
      "charisma": 10
    },
    "savingThrows": {
      "con": 4
    },
    "damageImmunities": [
      "fire",
      "poison"
    ],
    "conditionImmunities": [
      "Poisoned"
    ],
    "senses": {
      "passive_perception": "11"
    },
    "languages": [
      "Ignan"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Heated Body",
        "description": "A creature that touches the azer or hits it with a melee attack while within 5 ft. of it takes 5 (1d10) fire damage."
      },
      {
        "name": "Heated Weapons",
        "description": "When the azer hits with a metal melee weapon, it deals an extra 3 (1d6) fire damage (included in the attack)."
      },
      {
        "name": "Illumination",
        "description": "The azer sheds bright light in a 10-foot radius and dim light for an additional 10 ft.."
      }
    ],
    "actions": [
      {
        "name": "Warhammer",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) bludgeoning damage, or 8 (1d10 + 3) bludgeoning damage if used with two hands to make a melee attack, plus 3 (1d6) fire damage.",
        "attackBonus": 5,
        "damageDescription": "1d8+3 Bludgeoning"
      }
    ]
  },
  {
    "name": "Djinni",
    "size": "large",
    "type": "elemental",
    "alignment": "chaotic good",
    "ac": 17,
    "acNote": "natural armor",
    "hp": 161,
    "maxHp": 161,
    "speed": "30 ft., fly 90 ft.",
    "abilityScores": {
      "strength": 21,
      "dexterity": 15,
      "constitution": 22,
      "intelligence": 15,
      "wisdom": 16,
      "charisma": 20
    },
    "savingThrows": {
      "dex": 6,
      "wis": 7,
      "cha": 9
    },
    "damageImmunities": [
      "lightning",
      "thunder"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive_perception": "13"
    },
    "languages": [
      "Auran"
    ],
    "challengeRating": 11,
    "experiencePoints": 7200,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Elemental Demise",
        "description": "If the djinni dies, its body disintegrates into a warm breeze, leaving behind only equipment the djinni was wearing or carrying."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The djinni's innate spellcasting ability is Charisma (spell save DC 17, +9 to hit with spell attacks). It can innately cast the following spells, requiring no material components:\n\nAt will: detect evil and good, detect magic, thunderwave\n3/day each: create food and water (can create wine instead of water), tongues, wind walk\n1/day each: conjure elemental (air elemental only), creation, gaseous form, invisibility, major image, plane shift"
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The djinni makes three scimitar attacks."
      },
      {
        "name": "Scimitar",
        "description": "Melee Weapon Attack: +9 to hit, reach 5 ft., one target. Hit: 12 (2d6 + 5) slashing damage plus 3 (1d6) lightning or thunder damage (djinni's choice).",
        "attackBonus": 9,
        "damageDescription": "2d6+5 Slashing"
      },
      {
        "name": "Create Whirlwind",
        "description": "A 5-foot-radius, 30-foot-tall cylinder of swirling air magically forms on a point the djinni can see within 120 feet of it. The whirlwind lasts as long as the djinni maintains concentration (as if concentrating on a spell). Any creature but the djinni that enters the whirlwind must succeed on a DC 18 Strength saving throw or be restrained by it. The djinni can move the whirlwind up to 60 feet as an action, and creatures restrained by the whirlwind move with it. The whirlwind ends if the djinni loses sight of it.\nA creature can use its action to free a creature restrained by the whirlwind, including itself, by succeeding on a DC 18 Strength check. If the check succeeds, the creature is no longer restrained and moves to the nearest space outside the whirlwind.",
        "saveDC": 18,
        "saveType": "STR"
      }
    ]
  },
  {
    "name": "Dust Mephit",
    "size": "small",
    "type": "elemental",
    "alignment": "neutral evil",
    "ac": 12,
    "acNote": "dex armor",
    "hp": 17,
    "maxHp": 17,
    "speed": "30 ft., fly 30 ft.",
    "abilityScores": {
      "strength": 5,
      "dexterity": 14,
      "constitution": 10,
      "intelligence": 9,
      "wisdom": 11,
      "charisma": 10
    },
    "skills": {
      "perception": 2,
      "stealth": 4
    },
    "damageImmunities": [
      "poison"
    ],
    "damageVulnerabilities": [
      "fire"
    ],
    "conditionImmunities": [
      "Poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": "12"
    },
    "languages": [
      "Auran",
      "Terran"
    ],
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Death Burst",
        "description": "When the mephit dies, it explodes in a burst of dust. Each creature within 5 ft. of it must then succeed on a DC 10 Constitution saving throw or be blinded for 1 minute. A blinded creature can repeat the saving throw on each of its turns, ending the effect on itself on a success.",
        "saveDC": 10,
        "saveType": "CON"
      },
      {
        "name": "Innate Spellcasting",
        "description": "The mephit can innately cast sleep, requiring no material components. Its innate spellcasting ability is Charisma."
      }
    ],
    "actions": [
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 4 (1d4 + 2) slashing damage.",
        "attackBonus": 4,
        "damageDescription": "1d4+2 Slashing"
      },
      {
        "name": "Blinding Breath",
        "description": "The mephit exhales a 15-foot cone of blinding dust. Each creature in that area must succeed on a DC 10 Dexterity saving throw or be blinded for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.",
        "saveDC": 10,
        "saveType": "DEX"
      }
    ]
  },
  {
    "name": "Earth Elemental",
    "size": "large",
    "type": "elemental",
    "alignment": "neutral",
    "ac": 17,
    "acNote": "natural armor",
    "hp": 126,
    "maxHp": 126,
    "speed": "30 ft., burrow 30 ft.",
    "abilityScores": {
      "strength": 20,
      "dexterity": 8,
      "constitution": 20,
      "intelligence": 5,
      "wisdom": 10,
      "charisma": 5
    },
    "damageResistances": [
      "bludgeoning, piercing, and slashing from nonmagical weapons"
    ],
    "damageImmunities": [
      "poison"
    ],
    "damageVulnerabilities": [
      "thunder"
    ],
    "conditionImmunities": [
      "Exhaustion",
      "Paralyzed",
      "Petrified",
      "Poisoned",
      "Unconscious"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "tremorsense": "60 ft.",
      "passive_perception": "10"
    },
    "languages": [
      "Terran"
    ],
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Earth Glide",
        "description": "The elemental can burrow through nonmagical, unworked earth and stone. While doing so, the elemental doesn't disturb the material it moves through."
      },
      {
        "name": "Siege Monster",
        "description": "The elemental deals double damage to objects and structures."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The elemental makes two slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack: +8 to hit, reach 10 ft., one target. Hit: 14 (2d8 + 5) bludgeoning damage.",
        "attackBonus": 8,
        "damageDescription": "2d8+5 Bludgeoning"
      }
    ]
  },
  {
    "name": "Efreeti",
    "size": "large",
    "type": "elemental",
    "alignment": "lawful evil",
    "ac": 17,
    "acNote": "natural armor",
    "hp": 200,
    "maxHp": 200,
    "speed": "40 ft., fly 60 ft.",
    "abilityScores": {
      "strength": 22,
      "dexterity": 12,
      "constitution": 24,
      "intelligence": 16,
      "wisdom": 15,
      "charisma": 16
    },
    "savingThrows": {
      "int": 7,
      "wis": 6,
      "cha": 7
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive_perception": "12"
    },
    "languages": [
      "Ignan"
    ],
    "challengeRating": 11,
    "experiencePoints": 7200,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Elemental Demise",
        "description": "If the efreeti dies, its body disintegrates in a flash of fire and puff of smoke, leaving behind only equipment the djinni was wearing or carrying."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The efreeti's innate spell casting ability is Charisma (spell save DC 15, +7 to hit with spell attacks). It can innately cast the following spells, requiring no material components:\n\nAt will: detect magic\n3/day: enlarge/reduce, tongues\n1/day each: conjure elemental (fire elemental only), gaseous form, invisibility, major image, plane shift, wall of fire"
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The efreeti makes two scimitar attacks or uses its Hurl Flame twice."
      },
      {
        "name": "Scimitar",
        "description": "Melee Weapon Attack: +10 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage plus 7 (2d6) fire damage.",
        "attackBonus": 10,
        "damageDescription": "2d6+6 Slashing"
      },
      {
        "name": "Hurl Flame",
        "description": "Ranged Spell Attack: +7 to hit, range 120 ft., one target. Hit: 17 (5d6) fire damage.",
        "attackBonus": 7,
        "damageDescription": "5d6 Fire"
      }
    ]
  },
  {
    "name": "Fire Elemental",
    "size": "large",
    "type": "elemental",
    "alignment": "neutral",
    "ac": 13,
    "acNote": "dex armor",
    "hp": 102,
    "maxHp": 102,
    "speed": "50 ft.",
    "abilityScores": {
      "strength": 10,
      "dexterity": 17,
      "constitution": 16,
      "intelligence": 6,
      "wisdom": 10,
      "charisma": 7
    },
    "damageResistances": [
      "bludgeoning, piercing, and slashing from nonmagical weapons"
    ],
    "damageImmunities": [
      "fire",
      "poison"
    ],
    "conditionImmunities": [
      "Exhaustion",
      "Grappled",
      "Paralyzed",
      "Petrified",
      "Poisoned",
      "Prone",
      "Restrained",
      "Unconscious"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": "10"
    },
    "languages": [
      "Ignan"
    ],
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Fire Form",
        "description": "The elemental can move through a space as narrow as 1 inch wide without squeezing. A creature that touches the elemental or hits it with a melee attack while within 5 ft. of it takes 5 (1d10) fire damage. In addition, the elemental can enter a hostile creature's space and stop there. The first time it enters a creature's space on a turn, that creature takes 5 (1d10) fire damage and catches fire; until someone takes an action to douse the fire, the creature takes 5 (1d10) fire damage at the start of each of its turns."
      },
      {
        "name": "Illumination",
        "description": "The elemental sheds bright light in a 30-foot radius and dim light in an additional 30 ft.."
      },
      {
        "name": "Water Susceptibility",
        "description": "For every 5 ft. the elemental moves in water, or for every gallon of water splashed on it, it takes 1 cold damage."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The elemental makes two touch attacks."
      },
      {
        "name": "Touch",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) fire damage. If the target is a creature or a flammable object, it ignites. Until a creature takes an action to douse the fire, the target takes 5 (1d10) fire damage at the start of each of its turns.",
        "attackBonus": 6,
        "damageDescription": "2d6+3 Fire"
      }
    ]
  },
  {
    "name": "Gargoyle",
    "size": "medium",
    "type": "elemental",
    "alignment": "chaotic evil",
    "ac": 15,
    "acNote": "natural armor",
    "hp": 52,
    "maxHp": 52,
    "speed": "30 ft., fly 60 ft.",
    "abilityScores": {
      "strength": 15,
      "dexterity": 11,
      "constitution": 16,
      "intelligence": 6,
      "wisdom": 11,
      "charisma": 7
    },
    "damageResistances": [
      "bludgeoning, piercing, and slashing from nonmagical weapons that aren't adamantine"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "Exhaustion",
      "Petrified",
      "Poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": "10"
    },
    "languages": [
      "Terran"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "False Appearance",
        "description": "While the gargoyle remains motion less, it is indistinguishable from an inanimate statue."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The gargoyle makes two attacks: one with its bite and one with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Piercing"
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Slashing"
      }
    ]
  },
  {
    "name": "Ice Mephit",
    "size": "small",
    "type": "elemental",
    "alignment": "neutral evil",
    "ac": 11,
    "acNote": "dex armor",
    "hp": 21,
    "maxHp": 21,
    "speed": "30 ft., fly 30 ft.",
    "abilityScores": {
      "strength": 7,
      "dexterity": 13,
      "constitution": 10,
      "intelligence": 9,
      "wisdom": 11,
      "charisma": 12
    },
    "skills": {
      "perception": 2,
      "stealth": 3
    },
    "damageImmunities": [
      "cold",
      "poison"
    ],
    "damageVulnerabilities": [
      "bludgeoning",
      "fire"
    ],
    "conditionImmunities": [
      "Poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": "12"
    },
    "languages": [
      "Aquan",
      "Auran"
    ],
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Death Burst",
        "description": "When the mephit dies, it explodes in a burst of jagged ice. Each creature within 5 ft. of it must make a DC 10 Dexterity saving throw, taking 4 (1d8) slashing damage on a failed save, or half as much damage on a successful one.",
        "saveDC": 10,
        "saveType": "DEX"
      },
      {
        "name": "False Appearance",
        "description": "While the mephit remains motionless, it is indistinguishable from an ordinary shard of ice."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The mephit can innately cast fog cloud, requiring no material components. Its innate spellcasting ability is Charisma."
      }
    ],
    "actions": [
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one creature. Hit: 3 (1d4 + 1) slashing damage plus 2 (1d4) cold damage.",
        "attackBonus": 3,
        "damageDescription": "1d4+1 Slashing"
      },
      {
        "name": "Frost Breath",
        "description": "The mephit exhales a 15-foot cone of cold air. Each creature in that area must succeed on a DC 10 Dexterity saving throw, taking 5 (2d4) cold damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "2d4 Cold",
        "saveDC": 10,
        "saveType": "DEX"
      }
    ]
  },
  {
    "name": "Invisible Stalker",
    "size": "medium",
    "type": "elemental",
    "alignment": "neutral",
    "ac": 14,
    "acNote": "dex armor",
    "hp": 104,
    "maxHp": 104,
    "speed": "50 ft., fly 50 ft.",
    "abilityScores": {
      "strength": 16,
      "dexterity": 19,
      "constitution": 14,
      "intelligence": 10,
      "wisdom": 15,
      "charisma": 11
    },
    "skills": {
      "perception": 8,
      "stealth": 10
    },
    "damageResistances": [
      "bludgeoning, piercing, and slashing from nonmagical weapons"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "Exhaustion",
      "Grappled",
      "Paralyzed",
      "Petrified",
      "Poisoned",
      "Prone",
      "Restrained",
      "Unconscious"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": "18"
    },
    "languages": [
      "Auran",
      "understands Common but doesn't speak it"
    ],
    "challengeRating": 6,
    "experiencePoints": 2300,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Invisibility",
        "description": "The stalker is invisible."
      },
      {
        "name": "Faultless Tracker",
        "description": "The stalker is given a quarry by its summoner. The stalker knows the direction and distance to its quarry as long as the two of them are on the same plane of existence. The stalker also knows the location of its summoner."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The stalker makes two slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) bludgeoning damage.",
        "attackBonus": 6,
        "damageDescription": "2d6+3 Bludgeoning"
      }
    ]
  },
  {
    "name": "Magma Mephit",
    "size": "small",
    "type": "elemental",
    "alignment": "neutral evil",
    "ac": 11,
    "acNote": "dex armor",
    "hp": 22,
    "maxHp": 22,
    "speed": "30 ft., fly 30 ft.",
    "abilityScores": {
      "strength": 8,
      "dexterity": 12,
      "constitution": 12,
      "intelligence": 7,
      "wisdom": 10,
      "charisma": 10
    },
    "skills": {
      "stealth": 3
    },
    "damageImmunities": [
      "fire",
      "poison"
    ],
    "damageVulnerabilities": [
      "cold"
    ],
    "conditionImmunities": [
      "Poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": "10"
    },
    "languages": [
      "Ignan",
      "Terran"
    ],
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Death Burst",
        "description": "When the mephit dies, it explodes in a burst of lava. Each creature within 5 ft. of it must make a DC 11 Dexterity saving throw, taking 7 (2d6) fire damage on a failed save, or half as much damage on a successful one.",
        "saveDC": 11,
        "saveType": "DEX"
      },
      {
        "name": "False Appearance",
        "description": "While the mephit remains motionless, it is indistinguishable from an ordinary mound of magma."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The mephit can innately cast heat metal (spell save DC 10), requiring no material components. Its innate spellcasting ability is Charisma."
      }
    ],
    "actions": [
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one creature. Hit: 3 (1d4 + 1) slashing damage plus 2 (1d4) fire damage.",
        "attackBonus": 3,
        "damageDescription": "1d4+1 Slashing"
      },
      {
        "name": "Fire Breath",
        "description": "The mephit exhales a 15-foot cone of fire. Each creature in that area must make a DC 11 Dexterity saving throw, taking 7 (2d6) fire damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "2d6 Fire",
        "saveDC": 11,
        "saveType": "DEX"
      }
    ]
  },
  {
    "name": "Magmin",
    "size": "small",
    "type": "elemental",
    "alignment": "chaotic neutral",
    "ac": 14,
    "acNote": "natural armor",
    "hp": 9,
    "maxHp": 9,
    "speed": "30 ft.",
    "abilityScores": {
      "strength": 7,
      "dexterity": 15,
      "constitution": 12,
      "intelligence": 8,
      "wisdom": 11,
      "charisma": 10
    },
    "damageResistances": [
      "bludgeoning, piercing, and slashing from nonmagical weapons"
    ],
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": "10"
    },
    "languages": [
      "Ignan"
    ],
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Death Burst",
        "description": "When the magmin dies, it explodes in a burst of fire and magma. Each creature within 10 ft. of it must make a DC 11 Dexterity saving throw, taking 7 (2d6) fire damage on a failed save, or half as much damage on a successful one. Flammable objects that aren't being worn or carried in that area are ignited.",
        "saveDC": 11,
        "saveType": "DEX"
      },
      {
        "name": "Ignited Illumination",
        "description": "As a bonus action, the magmin can set itself ablaze or extinguish its flames. While ablaze, the magmin sheds bright light in a 10-foot radius and dim light for an additional 10 ft."
      }
    ],
    "actions": [
      {
        "name": "Touch",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (2d6) fire damage. If the target is a creature or a flammable object, it ignites. Until a target takes an action to douse the fire, the target takes 3 (1d6) fire damage at the end of each of its turns.",
        "attackBonus": 4,
        "damageDescription": "2d6 Fire"
      }
    ]
  },
  {
    "name": "Salamander",
    "size": "large",
    "type": "elemental",
    "alignment": "neutral evil",
    "ac": 15,
    "acNote": "natural armor",
    "hp": 90,
    "maxHp": 90,
    "speed": "30 ft.",
    "abilityScores": {
      "strength": 18,
      "dexterity": 14,
      "constitution": 15,
      "intelligence": 11,
      "wisdom": 10,
      "charisma": 12
    },
    "damageResistances": [
      "bludgeoning, piercing, and slashing from nonmagical weapons"
    ],
    "damageImmunities": [
      "fire"
    ],
    "damageVulnerabilities": [
      "cold"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": "10"
    },
    "languages": [
      "Ignan"
    ],
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Heated Body",
        "description": "A creature that touches the salamander or hits it with a melee attack while within 5 ft. of it takes 7 (2d6) fire damage."
      },
      {
        "name": "Heated Weapons",
        "description": "Any metal melee weapon the salamander wields deals an extra 3 (1d6) fire damage on a hit (included in the attack)."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The salamander makes two attacks: one with its spear and one with its tail."
      },
      {
        "name": "Spear",
        "description": "Melee or Ranged Weapon Attack: +7 to hit, reach 5 ft. or range 20 ft./60 ft., one target. Hit: 11 (2d6 + 4) piercing damage, or 13 (2d8 + 4) piercing damage if used with two hands to make a melee attack, plus 3 (1d6) fire damage.",
        "attackBonus": 7,
        "damageDescription": "undefined"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +7 to hit, reach 10 ft., one target. Hit: 11 (2d6 + 4) bludgeoning damage plus 7 (2d6) fire damage, and the target is grappled (escape DC 14). Until this grapple ends, the target is restrained, the salamander can automatically hit the target with its tail, and the salamander can't make tail attacks against other targets.",
        "attackBonus": 7,
        "damageDescription": "2d6+4 Bludgeoning"
      }
    ]
  },
  {
    "name": "Steam Mephit",
    "size": "small",
    "type": "elemental",
    "alignment": "neutral evil",
    "ac": 10,
    "acNote": "dex armor",
    "hp": 21,
    "maxHp": 21,
    "speed": "30 ft., fly 30 ft.",
    "abilityScores": {
      "strength": 5,
      "dexterity": 11,
      "constitution": 10,
      "intelligence": 11,
      "wisdom": 10,
      "charisma": 12
    },
    "damageImmunities": [
      "fire",
      "poison"
    ],
    "conditionImmunities": [
      "Poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": "10"
    },
    "languages": [
      "Aquan",
      "Ignan"
    ],
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Death Burst",
        "description": "When the mephit dies, it explodes in a cloud of steam. Each creature within 5 ft. of the mephit must succeed on a DC 10 Dexterity saving throw or take 4 (1d8) fire damage.",
        "saveDC": 10,
        "saveType": "DEX"
      },
      {
        "name": "Innate Spellcasting",
        "description": "The mephit can innately cast blur, requiring no material components. Its innate spellcasting ability is Charisma."
      }
    ],
    "actions": [
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +2 to hit, reach 5 ft., one creature. Hit: 2 (1d4) slashing damage plus 2 (1d4) fire damage.",
        "attackBonus": 2,
        "damageDescription": "1d4 Slashing"
      },
      {
        "name": "Steam Breath",
        "description": "The mephit exhales a 15-foot cone of scalding steam. Each creature in that area must succeed on a DC 10 Dexterity saving throw, taking 4 (1d8) fire damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "1d8 Fire",
        "saveDC": 10,
        "saveType": "DEX"
      }
    ]
  },
  {
    "name": "Water Elemental",
    "size": "large",
    "type": "elemental",
    "alignment": "neutral",
    "ac": 14,
    "acNote": "natural armor",
    "hp": 114,
    "maxHp": 114,
    "speed": "30 ft., swim 90 ft.",
    "abilityScores": {
      "strength": 18,
      "dexterity": 14,
      "constitution": 18,
      "intelligence": 5,
      "wisdom": 10,
      "charisma": 8
    },
    "damageResistances": [
      "acid",
      "bludgeoning, piercing, and slashing from nonmagical weapons"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "Exhaustion",
      "Grappled",
      "Paralyzed",
      "Petrified",
      "Poisoned",
      "Prone",
      "Restrained",
      "Unconscious"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": "10"
    },
    "languages": [
      "Aquan"
    ],
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Water Form",
        "description": "The elemental can enter a hostile creature's space and stop there. It can move through a space as narrow as 1 inch wide without squeezing."
      },
      {
        "name": "Freeze",
        "description": "If the elemental takes cold damage, it partially freezes; its speed is reduced by 20 ft. until the end of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The elemental makes two slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) bludgeoning damage.",
        "attackBonus": 7,
        "damageDescription": "2d8+4 Bludgeoning"
      },
      {
        "name": "Whelm",
        "description": "Each creature in the elemental's space must make a DC 15 Strength saving throw. On a failure, a target takes 13 (2d8 + 4) bludgeoning damage. If it is Large or smaller, it is also grappled (escape DC 14). Until this grapple ends, the target is restrained and unable to breathe unless it can breathe water. If the saving throw is successful, the target is pushed out of the elemental's space.\nThe elemental can grapple one Large creature or up to two Medium or smaller creatures at one time. At the start of each of the elemental's turns, each target grappled by it takes 13 (2d8 + 4) bludgeoning damage. A creature within 5 feet of the elemental can pull a creature or object out of it by taking an action to make a DC 14 Strength and succeeding.",
        "damageDescription": "2d8+4 Bludgeoning",
        "saveDC": 15,
        "saveType": "STR"
      }
    ]
  },
  {
    "name": "Xorn",
    "size": "medium",
    "type": "elemental",
    "alignment": "neutral",
    "ac": 19,
    "acNote": "natural armor",
    "hp": 73,
    "maxHp": 73,
    "speed": "20 ft., burrow 20 ft.",
    "abilityScores": {
      "strength": 17,
      "dexterity": 10,
      "constitution": 22,
      "intelligence": 11,
      "wisdom": 10,
      "charisma": 11
    },
    "skills": {
      "perception": 6,
      "stealth": 3
    },
    "damageResistances": [
      "piercing and slashing from nonmagical weapons that aren't adamantine"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "tremorsense": "60 ft.",
      "passive_perception": "16"
    },
    "languages": [
      "Terran"
    ],
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "isGlobal": true,
    "traits": [
      {
        "name": "Earth Glide",
        "description": "The xorn can burrow through nonmagical, unworked earth and stone. While doing so, the xorn doesn't disturb the material it moves through."
      },
      {
        "name": "Stone Camouflage",
        "description": "The xorn has advantage on Dexterity (Stealth) checks made to hide in rocky terrain."
      },
      {
        "name": "Treasure Sense",
        "description": "The xorn can pinpoint, by scent, the location of precious metals and stones, such as coins and gems, within 60 ft. of it."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The xorn makes three claw attacks and one bite attack."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 13 (3d6 + 3) piercing damage.",
        "attackBonus": 6,
        "damageDescription": "3d6+3 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) slashing damage.",
        "attackBonus": 6,
        "damageDescription": "1d6+3 Slashing"
      }
    ]
  }
];

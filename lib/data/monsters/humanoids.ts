/**
 * Humanoid-type monsters from D&D 5e SRD
 * Auto-generated from D&D 5e API
 */

import { MonsterTemplate } from "../../types";

export const HUMANOIDS: Omit<
  MonsterTemplate,
  "id" | "userId" | "createdAt" | "updatedAt" | "_id"
>[] = [
  {
    "name": "Acolyte",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any alignment",
    "ac": 10,
    "armorType": "dex",
    "hp": 9,
    "hitDice": "2d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 10,
      "dexterity": 10,
      "constitution": 10,
      "intelligence": 10,
      "wisdom": 14,
      "charisma": 11
    },
    "skills": {
      "medicine": 4,
      "religion": 2
    },
    "senses": "passive_perception 12",
    "languages": [
      "any one language (usually Common)"
    ],
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "traits": [
      {
        "name": "Spellcasting",
        "description": "The acolyte is a 1st-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 12, +4 to hit with spell attacks). The acolyte has following cleric spells prepared:\n\n- Cantrips (at will): light, sacred flame, thaumaturgy\n- 1st level (3 slots): bless, cure wounds, sanctuary"
      }
    ],
    "actions": [
      {
        "name": "Club",
        "description": "Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 2 (1d4) bludgeoning damage.",
        "attackBonus": 2,
        "damageDescription": "1d4 Bludgeoning"
      }
    ]
  },
  {
    "name": "Archmage",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any alignment",
    "ac": 12,
    "armorType": "dex",
    "hp": 99,
    "hitDice": "18d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 10,
      "dexterity": 14,
      "constitution": 12,
      "intelligence": 20,
      "wisdom": 15,
      "charisma": 16
    },
    "savingThrows": {
      "int": 9,
      "wis": 6
    },
    "skills": {
      "arcana": 13,
      "history": 13
    },
    "damageResistances": [
      "damage from spells",
      "bludgeoning, piercing, and slashing from nonmagical attacks (from stoneskin)"
    ],
    "senses": "passive_perception 12",
    "languages": [
      "any six languages"
    ],
    "challengeRating": 12,
    "experiencePoints": 8400,
    "source": "SRD",
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "The archmage has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Spellcasting",
        "description": "The archmage is an 18th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 17, +9 to hit with spell attacks). The archmage can cast disguise self and invisibility at will and has the following wizard spells prepared:\n\n- Cantrips (at will): fire bolt, light, mage hand, prestidigitation, shocking grasp\n- 1st level (4 slots): detect magic, identify, mage armor*, magic missile\n- 2nd level (3 slots): detect thoughts, mirror image, misty step\n- 3rd level (3 slots): counterspell, fly, lightning bolt\n- 4th level (3 slots): banishment, fire shield, stoneskin*\n- 5th level (3 slots): cone of cold, scrying, wall of force\n- 6th level (1 slot): globe of invulnerability\n- 7th level (1 slot): teleport\n- 8th level (1 slot): mind blank*\n- 9th level (1 slot): time stop\n* The archmage casts these spells on itself before combat."
      }
    ],
    "actions": [
      {
        "name": "Dagger",
        "description": "Melee or Ranged Weapon Attack: +6 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 4 (1d4 + 2) piercing damage.",
        "attackBonus": 6,
        "damageDescription": "1d4+2 Piercing"
      }
    ]
  },
  {
    "name": "Assassin",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any non-good alignment",
    "ac": 15,
    "armorType": "armor",
    "hp": 78,
    "hitDice": "12d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 11,
      "dexterity": 16,
      "constitution": 14,
      "intelligence": 13,
      "wisdom": 11,
      "charisma": 10
    },
    "savingThrows": {
      "dex": 6,
      "int": 4
    },
    "skills": {
      "acrobatics": 6,
      "deception": 3,
      "perception": 3,
      "stealth": 9
    },
    "damageResistances": [
      "poison"
    ],
    "senses": "passive_perception 13",
    "languages": [
      "Thieves' cant plus any two languages"
    ],
    "challengeRating": 8,
    "experiencePoints": 3900,
    "source": "SRD",
    "traits": [
      {
        "name": "Assassinate",
        "description": "During its first turn, the assassin has advantage on attack rolls against any creature that hasn't taken a turn. Any hit the assassin scores against a surprised creature is a critical hit."
      },
      {
        "name": "Evasion",
        "description": "If the assassin is subjected to an effect that allows it to make a Dexterity saving throw to take only half damage, the assassin instead takes no damage if it succeeds on the saving throw, and only half damage if it fails."
      },
      {
        "name": "Sneak Attack (1/Turn)",
        "description": "The assassin deals an extra 13 (4d6) damage when it hits a target with a weapon attack and has advantage on the attack roll, or when the target is within 5 ft. of an ally of the assassin that isn't incapacitated and the assassin doesn't have disadvantage on the attack roll."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The assassin makes two shortsword attacks."
      },
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) piercing damage, and the target must make a DC 15 Constitution saving throw, taking 24 (7d6) poison damage on a failed save, or half as much damage on a successful one.",
        "attackBonus": 6,
        "damageDescription": "1d6+3 Piercing"
      },
      {
        "name": "Light Crossbow",
        "description": "Ranged Weapon Attack: +6 to hit, range 80/320 ft., one target. Hit: 7 (1d8 + 3) piercing damage, and the target must make a DC 15 Constitution saving throw, taking 24 (7d6) poison damage on a failed save, or half as much damage on a successful one.",
        "attackBonus": 6,
        "damageDescription": "1d8+3 Piercing"
      }
    ]
  },
  {
    "name": "Bandit",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any non-lawful alignment",
    "ac": 12,
    "armorType": "armor",
    "hp": 11,
    "hitDice": "2d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 11,
      "dexterity": 12,
      "constitution": 12,
      "intelligence": 10,
      "wisdom": 10,
      "charisma": 10
    },
    "senses": "passive_perception 10",
    "languages": [
      "any one language (usually Common)"
    ],
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "actions": [
      {
        "name": "Scimitar",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) slashing damage.",
        "attackBonus": 3,
        "damageDescription": "1d6+1 Slashing"
      },
      {
        "name": "Light Crossbow",
        "description": "Ranged Weapon Attack: +3 to hit, range 80 ft./320 ft., one target. Hit: 5 (1d8 + 1) piercing damage.",
        "attackBonus": 3,
        "damageDescription": "1d8+1 Piercing"
      }
    ]
  },
  {
    "name": "Bandit Captain",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any non-lawful alignment",
    "ac": 15,
    "armorType": "armor",
    "hp": 65,
    "hitDice": "10d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 16,
      "constitution": 14,
      "intelligence": 14,
      "wisdom": 11,
      "charisma": 14
    },
    "savingThrows": {
      "str": 4,
      "dex": 5,
      "wis": 2
    },
    "skills": {
      "athletics": 4,
      "deception": 4
    },
    "senses": "passive_perception 10",
    "languages": [
      "any two languages"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "actions": [
      {
        "name": "Multiattack",
        "description": "The captain makes three melee attacks: two with its scimitar and one with its dagger. Or the captain makes two ranged attacks with its daggers."
      },
      {
        "name": "Scimitar",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) slashing damage.",
        "attackBonus": 5,
        "damageDescription": "1d6+3 Slashing"
      },
      {
        "name": "Dagger",
        "description": "Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 5 (1d4 + 3) piercing damage.",
        "attackBonus": 5,
        "damageDescription": "1d4+3 Piercing"
      }
    ],
    "reactions": [
      {
        "name": "Parry",
        "description": "The captain adds 2 to its AC against one melee attack that would hit it. To do so, the captain must see the attacker and be wielding a melee weapon."
      }
    ]
  },
  {
    "name": "Berserker",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any chaotic alignment",
    "ac": 13,
    "armorType": "armor",
    "hp": 67,
    "hitDice": "9d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 16,
      "dexterity": 12,
      "constitution": 17,
      "intelligence": 9,
      "wisdom": 11,
      "charisma": 9
    },
    "senses": "passive_perception 10",
    "languages": [
      "any one language (usually Common)"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Reckless",
        "description": "At the start of its turn, the berserker can gain advantage on all melee weapon attack rolls during that turn, but attack rolls against it have advantage until the start of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Greataxe",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 9 (1d12 + 3) slashing damage.",
        "attackBonus": 5,
        "damageDescription": "1d12+3 Slashing"
      }
    ]
  },
  {
    "name": "Bugbear",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "chaotic evil",
    "ac": 16,
    "armorType": "armor",
    "hp": 27,
    "hitDice": "5d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 14,
      "constitution": 13,
      "intelligence": 8,
      "wisdom": 11,
      "charisma": 9
    },
    "skills": {
      "stealth": 6,
      "survival": 2
    },
    "senses": "darkvision 60 ft., passive_perception 10",
    "languages": [
      "Common",
      "Goblin"
    ],
    "challengeRating": 1,
    "experiencePoints": 200,
    "source": "SRD",
    "traits": [
      {
        "name": "Brute",
        "description": "A melee weapon deals one extra die of its damage when the bugbear hits with it (included in the attack)."
      },
      {
        "name": "Surprise Attack",
        "description": "If the bugbear surprises a creature and hits it with an attack during the first round of combat, the target takes an extra 7 (2d6) damage from the attack."
      }
    ],
    "actions": [
      {
        "name": "Morningstar",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 11 (2d8 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "2d8+2 Piercing"
      },
      {
        "name": "Javelin",
        "description": "Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 9 (2d6 + 2) piercing damage in melee or 5 (1d6 + 2) piercing damage at range.",
        "attackBonus": 4,
        "damageDescription": "2d6+2 Piercing"
      }
    ]
  },
  {
    "name": "Commoner",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any alignment",
    "ac": 10,
    "armorType": "dex",
    "hp": 4,
    "hitDice": "1d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 10,
      "dexterity": 10,
      "constitution": 10,
      "intelligence": 10,
      "wisdom": 10,
      "charisma": 10
    },
    "senses": "passive_perception 10",
    "languages": [
      "any one language (usually Common)"
    ],
    "challengeRating": 0,
    "experiencePoints": 10,
    "source": "SRD",
    "actions": [
      {
        "name": "Club",
        "description": "Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 2 (1d4) bludgeoning damage.",
        "attackBonus": 2,
        "damageDescription": "1d4 Bludgeoning"
      }
    ]
  },
  {
    "name": "Cult Fanatic",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any non-good alignment",
    "ac": 13,
    "armorType": "armor",
    "hp": 22,
    "hitDice": "6d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 11,
      "dexterity": 14,
      "constitution": 12,
      "intelligence": 10,
      "wisdom": 13,
      "charisma": 14
    },
    "skills": {
      "deception": 4,
      "persuasion": 4,
      "religion": 2
    },
    "senses": "passive_perception 11",
    "languages": [
      "any one language (usually Common)"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Dark Devotion",
        "description": "The fanatic has advantage on saving throws against being charmed or frightened."
      },
      {
        "name": "Spellcasting",
        "description": "The fanatic is a 4th-level spellcaster. Its spell casting ability is Wisdom (spell save DC 11, +3 to hit with spell attacks). The fanatic has the following cleric spells prepared:\n\nCantrips (at will): light, sacred flame, thaumaturgy\n- 1st level (4 slots): command, inflict wounds, shield of faith\n- 2nd level (3 slots): hold person, spiritual weapon"
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The fanatic makes two melee attacks."
      },
      {
        "name": "Dagger",
        "description": "Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 20/60 ft., one creature. Hit: 4 (1d4 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d4+2 Piercing"
      }
    ]
  },
  {
    "name": "Cultist",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any non-good alignment",
    "ac": 12,
    "armorType": "armor",
    "hp": 9,
    "hitDice": "2d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 11,
      "dexterity": 12,
      "constitution": 10,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 10
    },
    "skills": {
      "deception": 2,
      "religion": 2
    },
    "senses": "passive_perception 10",
    "languages": [
      "any one language (usually Common)"
    ],
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "traits": [
      {
        "name": "Dark Devotion",
        "description": "The cultist has advantage on saving throws against being charmed or frightened."
      }
    ],
    "actions": [
      {
        "name": "Scimitar",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one creature. Hit: 4 (1d6 + 1) slashing damage.",
        "attackBonus": 3,
        "damageDescription": "1d6+1 Slashing"
      }
    ]
  },
  {
    "name": "Deep Gnome (Svirfneblin)",
    "type": "humanoid",
    "size": "Small",
    "alignment": "neutral good",
    "ac": 15,
    "armorType": "armor",
    "hp": 16,
    "hitDice": "3d6",
    "speed": {
      "walk": "20 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 14,
      "constitution": 14,
      "intelligence": 12,
      "wisdom": 10,
      "charisma": 9
    },
    "skills": {
      "investigation": 3,
      "perception": 2,
      "stealth": 4
    },
    "senses": "darkvision 120 ft., passive_perception 12",
    "languages": [
      "Gnomish",
      "Terran",
      "Undercommon"
    ],
    "challengeRating": 0.5,
    "experiencePoints": 50,
    "source": "SRD",
    "traits": [
      {
        "name": "Stone Camouflage",
        "description": "The gnome has advantage on Dexterity (Stealth) checks made to hide in rocky terrain."
      },
      {
        "name": "Gnome Cunning",
        "description": "The gnome has advantage on Intelligence, Wisdom, and Charisma saving throws against magic."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The gnome's innate spellcasting ability is Intelligence (spell save DC 11). It can innately cast the following spells, requiring no material components:\nAt will: nondetection (self only)\n1/day each: blindness/deafness, blur, disguise self"
      }
    ],
    "actions": [
      {
        "name": "War Pick",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d8+2 Piercing"
      },
      {
        "name": "Poisoned Dart",
        "description": "Ranged Weapon Attack: +4 to hit, range 30/120 ft., one creature. Hit: 4 (1d4 + 2) piercing damage, and the target must succeed on a DC 12 Constitution saving throw or be poisoned for 1 minute. The target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success",
        "attackBonus": 4,
        "damageDescription": "1d4+2 Piercing"
      }
    ]
  },
  {
    "name": "Drow",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "neutral evil",
    "ac": 15,
    "armorType": "armor",
    "hp": 13,
    "hitDice": "3d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 10,
      "dexterity": 14,
      "constitution": 10,
      "intelligence": 11,
      "wisdom": 11,
      "charisma": 12
    },
    "skills": {
      "perception": 2,
      "stealth": 4
    },
    "senses": "darkvision 120 ft., passive_perception 12",
    "languages": [
      "Elvish",
      "Undercommon"
    ],
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "traits": [
      {
        "name": "Fey Ancestry",
        "description": "The drow has advantage on saving throws against being charmed, and magic can't put the drow to sleep."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The drow's spellcasting ability is Charisma (spell save DC 11). It can innately cast the following spells, requiring no material components:\nAt will: dancing lights\n1/day each: darkness, faerie fire"
      },
      {
        "name": "Sunlight Sensitivity",
        "description": "While in sunlight, the drow has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Bludgeoning"
      },
      {
        "name": "Hand Crossbow",
        "description": "Ranged Weapon Attack: +4 to hit, range 30/120 ft., one target. Hit: 5 (1d6 + 2) piercing damage, and the target must succeed on a DC 13 Constitution saving throw or be poisoned for 1 hour. If the saving throw fails by 5 or more, the target is also unconscious while poisoned in this way. The target wakes up if it takes damage or if another creature takes an action to shake it awake.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Piercing"
      }
    ]
  },
  {
    "name": "Druid",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any alignment",
    "ac": 11,
    "armorType": "dex",
    "hp": 27,
    "hitDice": "5d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 10,
      "dexterity": 12,
      "constitution": 13,
      "intelligence": 12,
      "wisdom": 15,
      "charisma": 11
    },
    "skills": {
      "medicine": 4,
      "nature": 3,
      "perception": 4
    },
    "senses": "passive_perception 14",
    "languages": [
      "Druidic plus any two languages"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Spellcasting",
        "description": "The druid is a 4th-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 12, +4 to hit with spell attacks). It has the following druid spells prepared:\n\n- Cantrips (at will): druidcraft, produce flame, shillelagh\n- 1st level (4 slots): entangle, longstrider, speak with animals, thunderwave\n- 2nd level (3 slots): animal messenger, barkskin"
      }
    ],
    "actions": [
      {
        "name": "Quarterstaff",
        "description": " Melee Weapon Attack: +2 to hit (+4 to hit with shillelagh), reach 5 ft., one target. Hit: 3 (1d6) bludgeoning damage, 4 (1d8) bludgeoning damage if wielded with two hands, or 6 (1d8 + 2) bludgeoning damage with shillelagh.",
        "attackBonus": 2,
        "damageDescription": "undefined"
      }
    ]
  },
  {
    "name": "Duergar",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "lawful evil",
    "ac": 16,
    "armorType": "armor",
    "hp": 26,
    "hitDice": "4d8",
    "speed": {
      "walk": "25 ft."
    },
    "abilities": {
      "strength": 14,
      "dexterity": 11,
      "constitution": 14,
      "intelligence": 11,
      "wisdom": 10,
      "charisma": 9
    },
    "damageResistances": [
      "poison"
    ],
    "senses": "darkvision 120 ft., passive_perception 10",
    "languages": [
      "Dwarvish",
      "Undercommon"
    ],
    "challengeRating": 1,
    "experiencePoints": 200,
    "source": "SRD",
    "traits": [
      {
        "name": "Duergar Resilience",
        "description": "The duergar has advantage on saving throws against poison, spells, and illusions, as well as to resist being charmed or paralyzed."
      },
      {
        "name": "Sunlight Sensitivity",
        "description": "While in sunlight, the duergar has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Enlarge",
        "description": "For 1 minute, the duergar magically increases in size, along with anything it is wearing or carrying. While enlarged, the duergar is Large, doubles its damage dice on Strength-based weapon attacks (included in the attacks), and makes Strength checks and Strength saving throws with advantage. If the duergar lacks the room to become Large, it attains the maximum size possible in the space available."
      },
      {
        "name": "War Pick",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) piercing damage, or 11 (2d8 + 2) piercing damage while enlarged.",
        "attackBonus": 4,
        "damageDescription": "1d8+2 Piercing"
      },
      {
        "name": "Javelin",
        "description": "Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 5 (1d6 + 2) piercing damage, or 9 (2d6 + 2) piercing damage while enlarged.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Bludgeoning"
      },
      {
        "name": "Invisibility",
        "description": "The duergar magically turns invisible until it attacks, casts a spell, or uses its Enlarge, or until its concentration is broken, up to 1 hour (as if concentrating on a spell). Any equipment the duergar wears or carries is invisible with it."
      }
    ]
  },
  {
    "name": "Gladiator",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any alignment",
    "ac": 16,
    "armorType": "armor",
    "hp": 112,
    "hitDice": "15d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 18,
      "dexterity": 15,
      "constitution": 16,
      "intelligence": 10,
      "wisdom": 12,
      "charisma": 15
    },
    "savingThrows": {
      "str": 7,
      "dex": 5,
      "con": 6
    },
    "skills": {
      "athletics": 10,
      "intimidation": 5
    },
    "senses": "passive_perception 11",
    "languages": [
      "any one language (usually Common)"
    ],
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "traits": [
      {
        "name": "Brave",
        "description": "The gladiator has advantage on saving throws against being frightened."
      },
      {
        "name": "Brute",
        "description": "A melee weapon deals one extra die of its damage when the gladiator hits with it (included in the attack)."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The gladiator makes three melee attacks or two ranged attacks."
      },
      {
        "name": "Spear",
        "description": "Melee or Ranged Weapon Attack: +7 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 11 (2d6 + 4) piercing damage, or 13 (2d8 + 4) piercing damage if used with two hands to make a melee attack.",
        "attackBonus": 7,
        "damageDescription": "undefined"
      },
      {
        "name": "Shield Bash",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one creature. Hit: 9 (2d4 + 4) bludgeoning damage. If the target is a Medium or smaller creature, it must succeed on a DC 15 Strength saving throw or be knocked prone.",
        "attackBonus": 7,
        "damageDescription": "2d4+4 Bludgeoning"
      }
    ],
    "reactions": [
      {
        "name": "Parry",
        "description": "The gladiator adds 3 to its AC against one melee attack that would hit it. To do so, the gladiator must see the attacker and be wielding a melee weapon."
      }
    ]
  },
  {
    "name": "Gnoll",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "chaotic evil",
    "ac": 15,
    "armorType": "armor",
    "hp": 22,
    "hitDice": "5d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 14,
      "dexterity": 12,
      "constitution": 11,
      "intelligence": 6,
      "wisdom": 10,
      "charisma": 7
    },
    "senses": "darkvision 60 ft., passive_perception 10",
    "languages": [
      "Gnoll"
    ],
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Rampage",
        "description": "When the gnoll reduces a creature to 0 hit points with a melee attack on its turn, the gnoll can take a bonus action to move up to half its speed and make a bite attack."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 4 (1d4 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d4+2 Piercing"
      },
      {
        "name": "Spear",
        "description": "Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 5 (1d6 + 2) piercing damage, or 6 (1d8 + 2) piercing damage if used with two hands to make a melee attack.",
        "attackBonus": 4,
        "damageDescription": "undefined"
      },
      {
        "name": "Longbow",
        "description": "Ranged Weapon Attack: +3 to hit, range 150/600 ft., one target. Hit: 5 (1d8 + 1) piercing damage.",
        "attackBonus": 3,
        "damageDescription": "1d8+1 Piercing"
      }
    ]
  },
  {
    "name": "Goblin",
    "type": "humanoid",
    "size": "Small",
    "alignment": "neutral evil",
    "ac": 15,
    "armorType": "armor",
    "hp": 7,
    "hitDice": "2d6",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 8,
      "dexterity": 14,
      "constitution": 10,
      "intelligence": 10,
      "wisdom": 8,
      "charisma": 8
    },
    "skills": {
      "stealth": 6
    },
    "senses": "darkvision 60 ft., passive_perception 9",
    "languages": [
      "Common",
      "Goblin"
    ],
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "traits": [
      {
        "name": "Nimble Escape",
        "description": "The goblin can take the Disengage or Hide action as a bonus action on each of its turns."
      }
    ],
    "actions": [
      {
        "name": "Scimitar",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Slashing"
      },
      {
        "name": "Shortbow",
        "description": "Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Piercing"
      }
    ]
  },
  {
    "name": "Grimlock",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "neutral evil",
    "ac": 11,
    "armorType": "dex",
    "hp": 11,
    "hitDice": "2d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 16,
      "dexterity": 12,
      "constitution": 12,
      "intelligence": 9,
      "wisdom": 8,
      "charisma": 6
    },
    "skills": {
      "athletics": 5,
      "perception": 3,
      "stealth": 3
    },
    "conditionImmunities": [
      "Blinded"
    ],
    "senses": "blindsight 30 ft. or 10 ft. while deafened (blind beyond this radius), passive_perception 13",
    "languages": [
      "Undercommon"
    ],
    "challengeRating": 0.25,
    "experiencePoints": 50,
    "source": "SRD",
    "traits": [
      {
        "name": "Blind Senses",
        "description": "The grimlock can't use its blindsight while deafened and unable to smell."
      },
      {
        "name": "Keen Hearing and Smell",
        "description": "The grimlock has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      },
      {
        "name": "Stone Camouflage",
        "description": "The grimlock has advantage on Dexterity (Stealth) checks made to hide in rocky terrain."
      }
    ],
    "actions": [
      {
        "name": "Spiked Bone Club",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 5 (1d4 + 3) bludgeoning damage plus 2 (1d4) piercing damage.",
        "attackBonus": 5,
        "damageDescription": "1d4+3 Bludgeoning"
      }
    ]
  },
  {
    "name": "Guard",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any alignment",
    "ac": 16,
    "armorType": "armor",
    "hp": 11,
    "hitDice": "2d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 13,
      "dexterity": 12,
      "constitution": 12,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 10
    },
    "skills": {
      "perception": 2
    },
    "senses": "passive_perception 12",
    "languages": [
      "any one language (usually Common)"
    ],
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "actions": [
      {
        "name": "Spear",
        "description": "Melee or Ranged Weapon Attack: +3 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 4 (1d6 + 1) piercing damage or 5 (1d8 + 1) piercing damage if used with two hands to make a melee attack.",
        "attackBonus": 3,
        "damageDescription": "undefined"
      }
    ]
  },
  {
    "name": "Half-Red Dragon Veteran",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any alignment",
    "ac": 18,
    "armorType": "armor",
    "hp": 65,
    "hitDice": "10d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 16,
      "dexterity": 13,
      "constitution": 14,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 10
    },
    "damageResistances": [
      "fire"
    ],
    "senses": "blindsight 10 ft., darkvision 60 ft., passive_perception 12",
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "actions": [
      {
        "name": "Multiattack",
        "description": "The veteran makes two longsword attacks. If it has a shortsword drawn, it can also make a shortsword attack."
      },
      {
        "name": "Longsword",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) slashing damage, or 8 (1d10 + 3) slashing damage if used with two hands.",
        "attackBonus": 5,
        "damageDescription": "undefined"
      },
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) piercing damage.",
        "attackBonus": 5,
        "damageDescription": "1d6+3 Piercing"
      },
      {
        "name": "Heavy Crossbow",
        "description": "Ranged Weapon Attack: +3 to hit, range 100/400 ft., one target. Hit: 6 (1d10 + 1) piercing damage.",
        "attackBonus": 3,
        "damageDescription": "1d10+1 Piercing"
      },
      {
        "name": "Fire Breath",
        "description": "The veteran exhales fire in a 15-foot cone. Each creature in that area must make a DC 15 Dexterity saving throw, taking 24 (7d6) fire damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "7d6 Fire",
        "saveDC": 15,
        "saveType": "DEX"
      }
    ]
  },
  {
    "name": "Hobgoblin",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "lawful evil",
    "ac": 18,
    "armorType": "armor",
    "hp": 11,
    "hitDice": "2d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 13,
      "dexterity": 12,
      "constitution": 12,
      "intelligence": 10,
      "wisdom": 10,
      "charisma": 9
    },
    "senses": "darkvision 60 ft., passive_perception 10",
    "languages": [
      "Common",
      "Goblin"
    ],
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Martial Advantage",
        "description": "Once per turn, the hobgoblin can deal an extra 7 (2d6) damage to a creature it hits with a weapon attack if that creature is within 5 ft. of an ally of the hobgoblin that isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Longsword",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 5 (1d8 + 1) slashing damage, or 6 (1d10 + 1) slashing damage if used with two hands.",
        "attackBonus": 3,
        "damageDescription": "undefined"
      },
      {
        "name": "Longbow",
        "description": "Ranged Weapon Attack: +3 to hit, range 150/600 ft., one target. Hit: 5 (1d8 + 1) piercing damage.",
        "attackBonus": 3,
        "damageDescription": "1d8+1 Piercing"
      }
    ]
  },
  {
    "name": "Knight",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any alignment",
    "ac": 18,
    "armorType": "armor",
    "hp": 52,
    "hitDice": "8d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 16,
      "dexterity": 11,
      "constitution": 14,
      "intelligence": 11,
      "wisdom": 11,
      "charisma": 15
    },
    "savingThrows": {
      "con": 4,
      "wis": 2
    },
    "senses": "passive_perception 10",
    "languages": [
      "any one language (usually Common)"
    ],
    "challengeRating": 3,
    "experiencePoints": 700,
    "source": "SRD",
    "traits": [
      {
        "name": "Brave",
        "description": "The knight has advantage on saving throws against being frightened."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The knight makes two melee attacks."
      },
      {
        "name": "Greatsword",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) slashing damage.",
        "attackBonus": 5,
        "damageDescription": "2d6+3 Slashing"
      },
      {
        "name": "Heavy Crossbow",
        "description": "Ranged Weapon Attack: +2 to hit, range 100/400 ft., one target. Hit: 5 (1d10) piercing damage.",
        "attackBonus": 2,
        "damageDescription": "1d10 Piercing"
      },
      {
        "name": "Leadership",
        "description": "For 1 minute, the knight can utter a special command or warning whenever a nonhostile creature that it can see within 30 ft. of it makes an attack roll or a saving throw. The creature can add a d4 to its roll provided it can hear and understand the knight. A creature can benefit from only one Leadership die at a time. This effect ends if the knight is incapacitated."
      }
    ],
    "reactions": [
      {
        "name": "Parry",
        "description": "The knight adds 2 to its AC against one melee attack that would hit it. To do so, the knight must see the attacker and be wielding a melee weapon."
      }
    ]
  },
  {
    "name": "Kobold",
    "type": "humanoid",
    "size": "Small",
    "alignment": "lawful evil",
    "ac": 12,
    "armorType": "dex",
    "hp": 5,
    "hitDice": "2d6",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 7,
      "dexterity": 15,
      "constitution": 9,
      "intelligence": 8,
      "wisdom": 7,
      "charisma": 8
    },
    "senses": "darkvision 60 ft., passive_perception 8",
    "languages": [
      "Common",
      "Draconic"
    ],
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "traits": [
      {
        "name": "Sunlight Sensitivity",
        "description": "While in sunlight, the kobold has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
      },
      {
        "name": "Pack Tactics",
        "description": "The kobold has advantage on an attack roll against a creature if at least one of the kobold's allies is within 5 ft. of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Dagger",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d4+2 Piercing"
      },
      {
        "name": "Sling",
        "description": "Ranged Weapon Attack: +4 to hit, range 30/120 ft., one target. Hit: 4 (1d4 + 2) bludgeoning damage.",
        "attackBonus": 4,
        "damageDescription": "1d4+2 Bludgeoning"
      }
    ]
  },
  {
    "name": "Lizardfolk",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "neutral",
    "ac": 13,
    "armorType": "natural",
    "hp": 22,
    "hitDice": "4d8",
    "speed": {
      "walk": "30 ft.",
      "swim": "30 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 10,
      "constitution": 13,
      "intelligence": 7,
      "wisdom": 12,
      "charisma": 7
    },
    "skills": {
      "perception": 3,
      "stealth": 4,
      "survival": 5
    },
    "senses": "passive_perception 13",
    "languages": [
      "Draconic"
    ],
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Hold Breath",
        "description": "The lizardfolk can hold its breath for 15 minutes."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The lizardfolk makes two melee attacks, each one with a different weapon."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Piercing"
      },
      {
        "name": "Heavy Club",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) bludgeoning damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Bludgeoning"
      },
      {
        "name": "Javelin",
        "description": "Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Piercing"
      },
      {
        "name": "Spiked Shield",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Piercing"
      }
    ]
  },
  {
    "name": "Mage",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any alignment",
    "ac": 12,
    "armorType": "dex",
    "hp": 40,
    "hitDice": "9d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 9,
      "dexterity": 14,
      "constitution": 11,
      "intelligence": 17,
      "wisdom": 12,
      "charisma": 11
    },
    "savingThrows": {
      "int": 6,
      "wis": 4
    },
    "skills": {
      "arcana": 6,
      "history": 6
    },
    "senses": "passive_perception 11",
    "languages": [
      "any four languages"
    ],
    "challengeRating": 6,
    "experiencePoints": 2300,
    "source": "SRD",
    "traits": [
      {
        "name": "Spellcasting",
        "description": "The mage is a 9th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 14, +6 to hit with spell attacks). The mage has the following wizard spells prepared:\n\n- Cantrips (at will): fire bolt, light, mage hand, prestidigitation\n- 1st level (4 slots): detect magic, mage armor, magic missile, shield\n- 2nd level (3 slots): misty step, suggestion\n- 3rd level (3 slots): counterspell, fireball, fly\n- 4th level (3 slots): greater invisibility, ice storm\n- 5th level (1 slot): cone of cold"
      }
    ],
    "actions": [
      {
        "name": "Dagger",
        "description": "Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 4 (1d4 + 2) piercing damage.",
        "attackBonus": 5,
        "damageDescription": "1d4+2 Piercing"
      }
    ]
  },
  {
    "name": "Merfolk",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "neutral",
    "ac": 11,
    "armorType": "dex",
    "hp": 11,
    "hitDice": "2d8",
    "speed": {
      "walk": "10 ft.",
      "swim": "40 ft."
    },
    "abilities": {
      "strength": 10,
      "dexterity": 13,
      "constitution": 12,
      "intelligence": 11,
      "wisdom": 11,
      "charisma": 12
    },
    "skills": {
      "perception": 2
    },
    "senses": "passive_perception 12",
    "languages": [
      "Aquan",
      "Common"
    ],
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "traits": [
      {
        "name": "Amphibious",
        "description": "The merfolk can breathe air and water."
      }
    ],
    "actions": [
      {
        "name": "Spear",
        "description": "Melee or Ranged Weapon Attack: +2 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 3 (1d6) piercing damage, or 4 (1d8) piercing damage if used with two hands to make a melee attack.",
        "attackBonus": 2,
        "damageDescription": "undefined"
      }
    ]
  },
  {
    "name": "Noble",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any alignment",
    "ac": 15,
    "armorType": "armor",
    "hp": 9,
    "hitDice": "2d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 11,
      "dexterity": 12,
      "constitution": 11,
      "intelligence": 12,
      "wisdom": 14,
      "charisma": 16
    },
    "skills": {
      "deception": 5,
      "insight": 4,
      "persuasion": 5
    },
    "senses": "passive_perception 12",
    "languages": [
      "any two languages"
    ],
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "actions": [
      {
        "name": "Rapier",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 5 (1d8 + 1) piercing damage.",
        "attackBonus": 3,
        "damageDescription": "1d8+1 Bludgeoning"
      }
    ],
    "reactions": [
      {
        "name": "Parry",
        "description": "The noble adds 2 to its AC against one melee attack that would hit it. To do so, the noble must see the attacker and be wielding a melee weapon."
      }
    ]
  },
  {
    "name": "Orc",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "chaotic evil",
    "ac": 13,
    "armorType": "armor",
    "hp": 15,
    "hitDice": "2d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 16,
      "dexterity": 12,
      "constitution": 16,
      "intelligence": 7,
      "wisdom": 11,
      "charisma": 10
    },
    "skills": {
      "intimidation": 2
    },
    "senses": "darkvision 60 ft., passive_perception 10",
    "languages": [
      "Common",
      "Orc"
    ],
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Aggressive",
        "description": "As a bonus action, the orc can move up to its speed toward a hostile creature that it can see."
      }
    ],
    "actions": [
      {
        "name": "Greataxe",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 9 (1d12 + 3) slashing damage.",
        "attackBonus": 5,
        "damageDescription": "1d12+3 Slashing"
      },
      {
        "name": "Javelin",
        "description": "Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 6 (1d6 + 3) piercing damage.",
        "attackBonus": 5,
        "damageDescription": "1d6+3 Piercing"
      }
    ]
  },
  {
    "name": "Priest",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any alignment",
    "ac": 13,
    "armorType": "armor",
    "hp": 27,
    "hitDice": "5d8",
    "speed": {
      "walk": "25 ft."
    },
    "abilities": {
      "strength": 10,
      "dexterity": 10,
      "constitution": 12,
      "intelligence": 13,
      "wisdom": 16,
      "charisma": 13
    },
    "skills": {
      "medicine": 7,
      "persuasion": 3,
      "religion": 4
    },
    "senses": "passive_perception 13",
    "languages": [
      "any two languages"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Divine Eminence",
        "description": "As a bonus action, the priest can expend a spell slot to cause its melee weapon attacks to magically deal an extra 10 (3d6) radiant damage to a target on a hit. This benefit lasts until the end of the turn. If the priest expends a spell slot of 2nd level or higher, the extra damage increases by 1d6 for each level above 1st."
      },
      {
        "name": "Spellcasting",
        "description": "The priest is a 5th-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 13, +5 to hit with spell attacks). The priest has the following cleric spells prepared:\n\n- Cantrips (at will): light, sacred flame, thaumaturgy\n- 1st level (4 slots): cure wounds, guiding bolt, sanctuary\n- 2nd level (3 slots): lesser restoration, spiritual weapon\n- 3rd level (2 slots): dispel magic, spirit guardians"
      }
    ],
    "actions": [
      {
        "name": "Mace",
        "description": "Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 3 (1d6) bludgeoning damage.",
        "attackBonus": 2,
        "damageDescription": "1d6 Bludgeoning"
      }
    ]
  },
  {
    "name": "Sahuagin",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "lawful evil",
    "ac": 12,
    "armorType": "natural",
    "hp": 22,
    "hitDice": "4d8",
    "speed": {
      "walk": "30 ft.",
      "swim": "40 ft."
    },
    "abilities": {
      "strength": 13,
      "dexterity": 11,
      "constitution": 12,
      "intelligence": 12,
      "wisdom": 13,
      "charisma": 9
    },
    "skills": {
      "perception": 5
    },
    "senses": "darkvision 120 ft., passive_perception 15",
    "languages": [
      "Sahuagin"
    ],
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Blood Frenzy",
        "description": "The sahuagin has advantage on melee attack rolls against any creature that doesn't have all its hit points."
      },
      {
        "name": "Limited Amphibiousness",
        "description": "The sahuagin can breathe air and water, but it needs to be submerged at least once every 4 hours to avoid suffocating."
      },
      {
        "name": "Shark Telepathy",
        "description": "The sahuagin can magically command any shark within 120 feet of it, using a limited telepathy."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The sahuagin makes two melee attacks: one with its bite and one with its claws or spear."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 3 (1d4 + 1) piercing damage.",
        "attackBonus": 3,
        "damageDescription": "1d4+1 Piercing"
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 3 (1d4 + 1) slashing damage.",
        "attackBonus": 3,
        "damageDescription": "1d4+1 Slashing"
      },
      {
        "name": "Spear",
        "description": "Melee or Ranged Weapon Attack: +3 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 4 (1d6 + 1) piercing damage, or 5 (1d8 + 1) piercing damage if used with two hands to make a melee attack.",
        "attackBonus": 3,
        "damageDescription": "undefined"
      }
    ]
  },
  {
    "name": "Scout",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any alignment",
    "ac": 13,
    "armorType": "armor",
    "hp": 16,
    "hitDice": "3d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 11,
      "dexterity": 14,
      "constitution": 12,
      "intelligence": 11,
      "wisdom": 13,
      "charisma": 11
    },
    "skills": {
      "nature": 4,
      "perception": 5,
      "stealth": 6,
      "survival": 5
    },
    "senses": "passive_perception 15",
    "languages": [
      "any one language (usually Common)"
    ],
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Hearing and Sight",
        "description": "The scout has advantage on Wisdom (Perception) checks that rely on hearing or sight."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The scout makes two melee attacks or two ranged attacks."
      },
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Piercing"
      },
      {
        "name": "Longbow",
        "description": "Ranged Weapon Attack: +4 to hit, range 150/600 ft., one target. Hit: 6 (1d8 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d8+2 Piercing"
      }
    ]
  },
  {
    "name": "Spy",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any alignment",
    "ac": 12,
    "armorType": "dex",
    "hp": 27,
    "hitDice": "6d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 10,
      "dexterity": 15,
      "constitution": 10,
      "intelligence": 12,
      "wisdom": 14,
      "charisma": 16
    },
    "skills": {
      "deception": 5,
      "insight": 4,
      "investigation": 5,
      "perception": 6,
      "persuasion": 5,
      "stealth": 4
    },
    "senses": "passive_perception 16",
    "languages": [
      "any two languages"
    ],
    "challengeRating": 1,
    "experiencePoints": 200,
    "source": "SRD",
    "traits": [
      {
        "name": "Cunning Action",
        "description": "On each of its turns, the spy can use a bonus action to take the Dash, Disengage, or Hide action."
      },
      {
        "name": "Sneak Attack (1/Turn)",
        "description": "The spy deals an extra 7 (2d6) damage when it hits a target with a weapon attack and has advantage on the attack roll, or when the target is within 5 ft. of an ally of the spy that isn't incapacitated and the spy doesn't have disadvantage on the attack roll."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The spy makes two melee attacks."
      },
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Piercing"
      },
      {
        "name": "Hand Crossbow",
        "description": "Ranged Weapon Attack: +4 to hit, range 30/120 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Piercing"
      }
    ]
  },
  {
    "name": "Thug",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any non-good alignment",
    "ac": 11,
    "armorType": "armor",
    "hp": 32,
    "hitDice": "5d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 11,
      "constitution": 14,
      "intelligence": 10,
      "wisdom": 10,
      "charisma": 11
    },
    "skills": {
      "intimidation": 2
    },
    "senses": "passive_perception 10",
    "languages": [
      "any one language (usually Common)"
    ],
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Pack Tactics",
        "description": "The thug has advantage on an attack roll against a creature if at least one of the thug's allies is within 5 ft. of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The thug makes two melee attacks."
      },
      {
        "name": "Mace",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 5 (1d6 + 2) bludgeoning damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Bludgeoning"
      },
      {
        "name": "Heavy Crossbow",
        "description": "Ranged Weapon Attack: +2 to hit, range 100/400 ft., one target. Hit: 5 (1d10) piercing damage.",
        "attackBonus": 2,
        "damageDescription": "1d10 Piercing"
      }
    ]
  },
  {
    "name": "Tribal Warrior",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any alignment",
    "ac": 12,
    "armorType": "armor",
    "hp": 11,
    "hitDice": "2d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 13,
      "dexterity": 11,
      "constitution": 12,
      "intelligence": 8,
      "wisdom": 11,
      "charisma": 8
    },
    "senses": "passive_perception 10",
    "languages": [
      "any one language"
    ],
    "challengeRating": 0.125,
    "experiencePoints": 25,
    "source": "SRD",
    "traits": [
      {
        "name": "Pack Tactics",
        "description": "The warrior has advantage on an attack roll against a creature if at least one of the warrior's allies is within 5 ft. of the creature and the ally isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Spear",
        "description": "Melee or Ranged Weapon Attack: +3 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 4 (1d6 + 1) piercing damage, or 5 (1d8 + 1) piercing damage if used with two hands to make a melee attack.",
        "attackBonus": 3,
        "damageDescription": "undefined"
      }
    ]
  },
  {
    "name": "Veteran",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "any alignment",
    "ac": 17,
    "armorType": "armor",
    "hp": 58,
    "hitDice": "9d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 16,
      "dexterity": 13,
      "constitution": 14,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 10
    },
    "skills": {
      "athletics": 5,
      "perception": 2
    },
    "senses": "passive_perception 12",
    "languages": [
      "any one language (usually Common)"
    ],
    "challengeRating": 3,
    "experiencePoints": 700,
    "source": "SRD",
    "actions": [
      {
        "name": "Multiattack",
        "description": "The veteran makes two longsword attacks. If it has a shortsword drawn, it can also make a shortsword attack."
      },
      {
        "name": "Longsword",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) slashing damage, or 8 (1d10 + 3) slashing damage if used with two hands.",
        "attackBonus": 5,
        "damageDescription": "undefined"
      },
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) piercing damage.",
        "attackBonus": 5,
        "damageDescription": "1d6+3 Piercing"
      },
      {
        "name": "Heavy Crossbow",
        "description": "Ranged Weapon Attack: +3 to hit, range 100/400 ft., one target. Hit: 6 (1d10 + 1) piercing damage.",
        "attackBonus": 3,
        "damageDescription": "1d10+1 Piercing"
      }
    ]
  },
  {
    "name": "Werebear, Bear Form",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "neutral good",
    "ac": 11,
    "armorType": "natural",
    "hp": 135,
    "hitDice": "18d8",
    "speed": {
      "walk": "40 ft.",
      "climb": "30 ft."
    },
    "abilities": {
      "strength": 19,
      "dexterity": 10,
      "constitution": 17,
      "intelligence": 11,
      "wisdom": 12,
      "charisma": 12
    },
    "skills": {
      "perception": 7
    },
    "damageImmunities": [
      "bludgeoning, piercing, and slashing from nonmagical weapons that aren't silvered"
    ],
    "senses": "passive_perception 17",
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The werebear can use its action to polymorph into a Large bear-humanoid hybrid or into a Large bear, or back into its true form, which is humanoid. Its statistics, other than its size and AC, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Keen Smell",
        "description": "The werebear has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "In bear form, the werebear makes two claw attacks. In humanoid form, it makes two greataxe attacks. In hybrid form, it can attack like a bear or a humanoid."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 15 (2d10 + 4) piercing damage. If the target is a humanoid, it must succeed on a DC 14 Constitution saving throw or be cursed with werebear lycanthropy.",
        "attackBonus": 7,
        "damageDescription": "2d10+4 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) slashing damage.",
        "attackBonus": 7,
        "damageDescription": "2d8+4 Slashing"
      }
    ]
  },
  {
    "name": "Werebear, Human Form",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "neutral good",
    "ac": 10,
    "armorType": "dex",
    "hp": 135,
    "hitDice": "18d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 19,
      "dexterity": 10,
      "constitution": 17,
      "intelligence": 11,
      "wisdom": 12,
      "charisma": 12
    },
    "skills": {
      "perception": 7
    },
    "damageImmunities": [
      "bludgeoning, piercing, and slashing from nonmagical weapons that aren't silvered"
    ],
    "senses": "passive_perception 17",
    "languages": [
      "Common"
    ],
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The werebear can use its action to polymorph into a Large bear-humanoid hybrid or into a Large bear, or back into its true form, which is humanoid. Its statistics, other than its size and AC, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Keen Smell",
        "description": "The werebear has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "In bear form, the werebear makes two claw attacks. In humanoid form, it makes two greataxe attacks. In hybrid form, it can attack like a bear or a humanoid."
      },
      {
        "name": "Greataxe",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 10 (1d12 + 4) slashing damage.",
        "attackBonus": 7,
        "damageDescription": "1d12+4 Slashing"
      }
    ]
  },
  {
    "name": "Werebear, Hybrid Form",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "neutral good",
    "ac": 11,
    "armorType": "natural",
    "hp": 135,
    "hitDice": "18d8",
    "speed": {
      "walk": "40 ft.",
      "climb": "30 ft."
    },
    "abilities": {
      "strength": 19,
      "dexterity": 10,
      "constitution": 17,
      "intelligence": 11,
      "wisdom": 12,
      "charisma": 12
    },
    "skills": {
      "perception": 7
    },
    "damageImmunities": [
      "bludgeoning, piercing, and slashing from nonmagical weapons that aren't silvered"
    ],
    "senses": "passive_perception 17",
    "languages": [
      "Common"
    ],
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The werebear can use its action to polymorph into a Large bear-humanoid hybrid or into a Large bear, or back into its true form, which is humanoid. Its statistics, other than its size and AC, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Keen Smell",
        "description": "The werebear has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "In bear form, the werebear makes two claw attacks. In humanoid form, it makes two greataxe attacks. In hybrid form, it can attack like a bear or a humanoid."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 15 (2d10 + 4) piercing damage. If the target is a humanoid, it must succeed on a DC 14 Constitution saving throw or be cursed with werebear lycanthropy.",
        "attackBonus": 7,
        "damageDescription": "2d10+4 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) slashing damage.",
        "attackBonus": 7,
        "damageDescription": "2d8+4 Slashing"
      },
      {
        "name": "Greataxe",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 10 (1d12 + 4) slashing damage.",
        "attackBonus": 7,
        "damageDescription": "1d12+4 Slashing"
      }
    ]
  },
  {
    "name": "Wereboar, Boar Form",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "neutral evil",
    "ac": 11,
    "armorType": "natural",
    "hp": 78,
    "hitDice": "12d8",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 17,
      "dexterity": 10,
      "constitution": 15,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 8
    },
    "skills": {
      "perception": 2
    },
    "damageImmunities": [
      "bludgeoning, piercing, and slashing from nonmagical weapons that aren't silvered"
    ],
    "senses": "passive_perception 12",
    "challengeRating": 4,
    "experiencePoints": 1100,
    "source": "SRD",
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The wereboar can use its action to polymorph into a boar-humanoid hybrid or into a boar, or back into its true form, which is humanoid. Its statistics, other than its AC, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Charge (Boar or Hybrid Form Only)",
        "description": "If the wereboar moves at least 15 feet straight toward a target and then hits it with its tusks on the same turn, the target takes an extra 7 (2d6) slashing damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or be knocked prone."
      },
      {
        "name": "Relentless",
        "description": "If the wereboar takes 14 damage or less that would reduce it to 0 hit points, it is reduced to 1 hit point instead."
      }
    ],
    "actions": [
      {
        "name": "Tusks",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) slashing damage. If the target is a humanoid, it must succeed on a DC 12 Constitution saving throw or be cursed with wereboar lycanthropy.",
        "attackBonus": 5,
        "damageDescription": "2d6+3 Slashing"
      }
    ]
  },
  {
    "name": "Wereboar, Human Form",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "neutral evil",
    "ac": 10,
    "armorType": "dex",
    "hp": 78,
    "hitDice": "12d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 17,
      "dexterity": 10,
      "constitution": 15,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 8
    },
    "skills": {
      "perception": 2
    },
    "damageImmunities": [
      "bludgeoning, piercing, and slashing from nonmagical weapons that aren't silvered"
    ],
    "senses": "passive_perception 12",
    "languages": [
      "Common (can't speak in boar form)"
    ],
    "challengeRating": 4,
    "experiencePoints": 1100,
    "source": "SRD",
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The wereboar can use its action to polymorph into a boar-humanoid hybrid or into a boar, or back into its true form, which is humanoid. Its statistics, other than its AC, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Relentless",
        "description": "If the wereboar takes 14 damage or less that would reduce it to 0 hit points, it is reduced to 1 hit point instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The wereboar makes two attacks, only one of which can be with its tusks."
      },
      {
        "name": "Maul",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) bludgeoning damage.",
        "attackBonus": 5,
        "damageDescription": "2d6+3 Bludgeoning"
      }
    ]
  },
  {
    "name": "Wereboar, Hybrid Form",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "neutral evil",
    "ac": 11,
    "armorType": "natural",
    "hp": 78,
    "hitDice": "12d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 17,
      "dexterity": 10,
      "constitution": 15,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 8
    },
    "skills": {
      "perception": 2
    },
    "damageImmunities": [
      "bludgeoning, piercing, and slashing from nonmagical weapons that aren't silvered"
    ],
    "senses": "passive_perception 12",
    "languages": [
      "Common"
    ],
    "challengeRating": 4,
    "experiencePoints": 1100,
    "source": "SRD",
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The wereboar can use its action to polymorph into a boar-humanoid hybrid or into a boar, or back into its true form, which is humanoid. Its statistics, other than its AC, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Charge (Boar or Hybrid Form Only)",
        "description": "If the wereboar moves at least 15 feet straight toward a target and then hits it with its tusks on the same turn, the target takes an extra 7 (2d6) slashing damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or be knocked prone."
      },
      {
        "name": "Relentless",
        "description": "If the wereboar takes 14 damage or less that would reduce it to 0 hit points, it is reduced to 1 hit point instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The wereboar makes two attacks, only one of which can be with its tusks."
      },
      {
        "name": "Maul",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) bludgeoning damage.",
        "attackBonus": 5,
        "damageDescription": "2d6+3 Bludgeoning"
      },
      {
        "name": "Tusks",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) slashing damage. If the target is a humanoid, it must succeed on a DC 12 Constitution saving throw or be cursed with wereboar lycanthropy.",
        "attackBonus": 5,
        "damageDescription": "2d6+3 Slashing"
      }
    ]
  },
  {
    "name": "Wererat, Human Form",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "lawful evil",
    "ac": 12,
    "armorType": "dex",
    "hp": 33,
    "hitDice": "6d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 10,
      "dexterity": 15,
      "constitution": 12,
      "intelligence": 11,
      "wisdom": 10,
      "charisma": 8
    },
    "skills": {
      "perception": 2,
      "stealth": 4
    },
    "damageImmunities": [
      "bludgeoning, piercing, and slashing from nonmagical weapons that aren't silvered"
    ],
    "senses": "passive_perception 12",
    "languages": [
      "Common"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The wererat can use its action to polymorph into a rat-humanoid hybrid or into a giant rat, or back into its true form, which is humanoid. Its statistics, other than its size, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Keen Smell",
        "description": "The wererat has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The wererat makes two attacks, only one of which can be a bite."
      },
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Piercing"
      },
      {
        "name": "Hand Crossbow",
        "description": "Ranged Weapon Attack: +4 to hit, range 30/120 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Piercing"
      }
    ]
  },
  {
    "name": "Wererat, Hybrid Form",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "lawful evil",
    "ac": 12,
    "armorType": "natural",
    "hp": 33,
    "hitDice": "6d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 10,
      "dexterity": 15,
      "constitution": 12,
      "intelligence": 11,
      "wisdom": 10,
      "charisma": 8
    },
    "skills": {
      "perception": 2,
      "stealth": 4
    },
    "damageImmunities": [
      "bludgeoning, piercing, and slashing from nonmagical weapons that aren't silvered"
    ],
    "senses": "passive_perception 12",
    "languages": [
      "Common"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The wererat can use its action to polymorph into a rat-humanoid hybrid or into a giant rat, or back into its true form, which is humanoid. Its statistics, other than its size, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Keen Smell",
        "description": "The wererat has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The wererat makes two attacks, only one of which can be a bite."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) piercing damage. If the target is a humanoid, it must succeed on a DC 11 Constitution saving throw or be cursed with wererat lycanthropy.",
        "attackBonus": 4,
        "damageDescription": "1d4+2 Piercing"
      },
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Piercing"
      },
      {
        "name": "Hand Crossbow",
        "description": "Ranged Weapon Attack: +4 to hit, range 30/120 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Piercing"
      }
    ]
  },
  {
    "name": "Wererat, Rat Form",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "lawful evil",
    "ac": 12,
    "armorType": "natural",
    "hp": 33,
    "hitDice": "6d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 10,
      "dexterity": 15,
      "constitution": 12,
      "intelligence": 11,
      "wisdom": 10,
      "charisma": 8
    },
    "skills": {
      "perception": 2,
      "stealth": 4
    },
    "damageImmunities": [
      "bludgeoning, piercing, and slashing from nonmagical weapons that aren't silvered"
    ],
    "senses": "darkvision 60 ft., passive_perception 12",
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The wererat can use its action to polymorph into a rat-humanoid hybrid or into a giant rat, or back into its true form, which is humanoid. Its statistics, other than its size, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Keen Smell",
        "description": "The wererat has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) piercing damage. If the target is a humanoid, it must succeed on a DC 11 Constitution saving throw or be cursed with wererat lycanthropy.",
        "attackBonus": 4,
        "damageDescription": "1d4+2 Piercing"
      }
    ]
  },
  {
    "name": "Weretiger, Human Form",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "neutral",
    "ac": 12,
    "armorType": "dex",
    "hp": 120,
    "hitDice": "16d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 17,
      "dexterity": 15,
      "constitution": 16,
      "intelligence": 10,
      "wisdom": 13,
      "charisma": 11
    },
    "skills": {
      "perception": 5,
      "stealth": 4
    },
    "damageImmunities": [
      "bludgeoning, piercing, and slashing from nonmagical weapons that aren't silvered"
    ],
    "senses": "darkvision 60 ft., passive_perception 15",
    "languages": [
      "Common"
    ],
    "challengeRating": 4,
    "experiencePoints": 1100,
    "source": "SRD",
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The weretiger can use its action to polymorph into a tiger-humanoid hybrid or into a tiger, or back into its true form, which is humanoid. Its statistics, other than its size, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Keen Hearing and Smell",
        "description": "The weretiger has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "In humanoid form, the weretiger makes two scimitar attacks or two longbow attacks. In hybrid form, it can attack like a humanoid or make two claw attacks."
      },
      {
        "name": "Scimitar",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) slashing damage.",
        "attackBonus": 5,
        "damageDescription": "1d6+3 Slashing"
      },
      {
        "name": "Longbow",
        "description": "Ranged Weapon Attack: +4 to hit, range 150/600 ft., one target. Hit: 6 (1d8 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d8+2 Piercing"
      }
    ]
  },
  {
    "name": "Weretiger, Hybrid Form",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "neutral",
    "ac": 12,
    "armorType": "dex",
    "hp": 120,
    "hitDice": "16d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 17,
      "dexterity": 15,
      "constitution": 16,
      "intelligence": 10,
      "wisdom": 13,
      "charisma": 11
    },
    "skills": {
      "perception": 5,
      "stealth": 4
    },
    "damageImmunities": [
      "bludgeoning, piercing, and slashing from nonmagical weapons that aren't silvered"
    ],
    "senses": "darkvision 60 ft., passive_perception 15",
    "languages": [
      "Common"
    ],
    "challengeRating": 4,
    "experiencePoints": 1100,
    "source": "SRD",
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The weretiger can use its action to polymorph into a tiger-humanoid hybrid or into a tiger, or back into its true form, which is humanoid. Its statistics, other than its size, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Keen Hearing and Smell",
        "description": "The weretiger has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      },
      {
        "name": "Pounce",
        "description": "If the weretiger moves at least 15 feet straight toward a creature and then hits it with a claw attack on the same turn, that target must succeed on a DC 14 Strength saving throw or be knocked prone. If the target is prone, the weretiger can make one bite attack against it as a bonus action.",
        "saveDC": 14,
        "saveType": "STR"
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "In humanoid form, the weretiger makes two scimitar attacks or two longbow attacks. In hybrid form, it can attack like a humanoid or make two claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (1d10 + 3) piercing damage. If the target is a humanoid, it must succeed on a DC 13 Constitution saving throw or be cursed with weretiger lycanthropy.",
        "attackBonus": 5,
        "damageDescription": "1d10+3 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) slashing damage.",
        "attackBonus": 5,
        "damageDescription": "1d8+3 Slashing"
      },
      {
        "name": "Scimitar",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) slashing damage.",
        "attackBonus": 5,
        "damageDescription": "1d6+3 Slashing"
      },
      {
        "name": "Longbow",
        "description": "Ranged Weapon Attack: +4 to hit, range 150/600 ft., one target. Hit: 6 (1d8 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d8+2 Piercing"
      }
    ]
  },
  {
    "name": "Weretiger, Tiger Form",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "neutral",
    "ac": 12,
    "armorType": "natural",
    "hp": 120,
    "hitDice": "16d8",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 17,
      "dexterity": 15,
      "constitution": 16,
      "intelligence": 10,
      "wisdom": 13,
      "charisma": 11
    },
    "skills": {
      "perception": 5,
      "stealth": 4
    },
    "damageImmunities": [
      "bludgeoning, piercing, and slashing from nonmagical weapons that aren't silvered"
    ],
    "senses": "darkvision 60 ft., passive_perception 15",
    "challengeRating": 4,
    "experiencePoints": 1100,
    "source": "SRD",
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The weretiger can use its action to polymorph into a tiger-humanoid hybrid or into a tiger, or back into its true form, which is humanoid. Its statistics, other than its size, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Keen Hearing and Smell",
        "description": "The weretiger has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      },
      {
        "name": "Pounce",
        "description": "If the weretiger moves at least 15 feet straight toward a creature and then hits it with a claw attack on the same turn, that target must succeed on a DC 14 Strength saving throw or be knocked prone. If the target is prone, the weretiger can make one bite attack against it as a bonus action.",
        "saveDC": 14,
        "saveType": "STR"
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (1d10 + 3) piercing damage. If the target is a humanoid, it must succeed on a DC 13 Constitution saving throw or be cursed with weretiger lycanthropy.",
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
    "name": "Werewolf, Human Form",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "chaotic evil",
    "ac": 11,
    "armorType": "dex",
    "hp": 58,
    "hitDice": "9d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 13,
      "constitution": 14,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 10
    },
    "skills": {
      "perception": 4
    },
    "damageImmunities": [
      "bludgeoning, piercing, and slashing from nonmagical weapons that aren't silvered"
    ],
    "senses": "passive_perception 14",
    "languages": [
      "Common"
    ],
    "challengeRating": 3,
    "experiencePoints": 700,
    "source": "SRD",
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The werewolf can use its action to polymorph into a wolf-humanoid hybrid or into a wolf, or back into its true form, which is humanoid. Its statistics, other than its AC, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Keen Hearing and Smell",
        "description": "The werewolf has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The werewolf makes two attacks: two with its spear (humanoid form) or one with its bite and one with its claws (hybrid form)."
      },
      {
        "name": "Spear",
        "description": "Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 20/60 ft., one creature. Hit: 5 (1d6 + 2) piercing damage, or 6 (1d8 + 2) piercing damage if used with two hands to make a melee attack.",
        "attackBonus": 4,
        "damageDescription": "undefined"
      }
    ]
  },
  {
    "name": "Werewolf, Hybrid Form",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "chaotic evil",
    "ac": 12,
    "armorType": "natural",
    "hp": 58,
    "hitDice": "9d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 13,
      "constitution": 14,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 10
    },
    "skills": {
      "perception": 4
    },
    "damageImmunities": [
      "bludgeoning, piercing, and slashing from nonmagical weapons that aren't silvered"
    ],
    "senses": "passive_perception 14",
    "languages": [
      "Common"
    ],
    "challengeRating": 3,
    "experiencePoints": 700,
    "source": "SRD",
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The werewolf can use its action to polymorph into a wolf-humanoid hybrid or into a wolf, or back into its true form, which is humanoid. Its statistics, other than its AC, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Keen Hearing and Smell",
        "description": "The werewolf has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The werewolf makes two attacks: two with its spear (humanoid form) or one with its bite and one with its claws (hybrid form)."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) piercing damage. If the target is a humanoid, it must succeed on a DC 12 Constitution saving throw or be cursed with werewolf lycanthropy.",
        "attackBonus": 4,
        "damageDescription": "1d8+2 Piercing"
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 7 (2d4 + 2) slashing damage.",
        "attackBonus": 4,
        "damageDescription": "2d4+2 Slashing"
      }
    ]
  },
  {
    "name": "Werewolf, Wolf Form",
    "type": "humanoid",
    "size": "Medium",
    "alignment": "chaotic evil",
    "ac": 12,
    "armorType": "natural",
    "hp": 58,
    "hitDice": "9d8",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 13,
      "constitution": 14,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 10
    },
    "skills": {
      "perception": 4
    },
    "damageImmunities": [
      "bludgeoning, piercing, and slashing from nonmagical weapons that aren't silvered"
    ],
    "senses": "passive_perception 14",
    "challengeRating": 3,
    "experiencePoints": 700,
    "source": "SRD",
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The werewolf can use its action to polymorph into a wolf-humanoid hybrid or into a wolf, or back into its true form, which is humanoid. Its statistics, other than its AC, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Keen Hearing and Smell",
        "description": "The werewolf has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) piercing damage. If the target is a humanoid, it must succeed on a DC 12 Constitution saving throw or be cursed with werewolf lycanthropy.",
        "attackBonus": 4,
        "damageDescription": "1d8+2 Piercing"
      }
    ]
  }
];

import { randomUUID } from 'crypto';
import { Monster, MonsterTemplate } from '../types';
import { GLOBAL_USER_ID } from '../constants';

/**
 * Custom campaign-specific monsters (not in the SRD).
 * Used by `seedGlobalMonsters.ts` (inserts into the global monster library)
 * and by `seedCampaignTemplates.ts` (embeds into campaign encounter monsters).
 */
export const CUSTOM_MONSTERS: Omit<MonsterTemplate, 'createdAt' | 'updatedAt'>[] = [
  {
    id: "cm-vecna-cultist",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin",
    name: "Cultist of the Whispered One",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 2,
    ac: 13,
    acNote: "leather armor",
    hp: 33,
    maxHp: 33,
    abilityScores: {
      strength: 11,
      dexterity: 14,
      constitution: 12,
      intelligence: 10,
      wisdom: 13,
      charisma: 14
    },
    savingThrows: {
      wisdom: 3
    },
    skills: {
      Deception: 4,
      Religion: 2
    },
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: ["Common", "Abyssal"],
    traits: [
      {
        name: "Dark Devotion",
        description: "The cultist has advantage on saving throws against being charmed or frightened."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The cultist makes two melee attacks."
      },
      {
        name: "Scimitar",
        description: "Melee Weapon Attack",
        attackBonus: 4,
        damageDescription: "1d6+2 slashing"
      }
    ]
  },
  {
    id: "cm-spiderdragon",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin",
    name: "Spiderdragon",
    size: "large",
    type: "monstrosity",
    alignment: "Chaotic Evil",
    speed: "40 ft., climb 40 ft., fly 80 ft.",
    challengeRating: 8,
    ac: 16,
    acNote: "natural armor",
    hp: 114,
    maxHp: 114,
    abilityScores: {
      strength: 19,
      dexterity: 16,
      constitution: 18,
      intelligence: 6,
      wisdom: 12,
      charisma: 7
    },
    savingThrows: {
      dexterity: 6,
      constitution: 7
    },
    skills: {
      Perception: 4,
      Stealth: 6
    },
    senses: { blindsight: "30 ft.", darkvision: "120 ft.", "passive Perception": "14" },
    languages: ["Understands Undercommon but can't speak"],
    traits: [
      {
        name: "Spider Climb",
        description: "The spiderdragon can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      },
      {
        name: "Web Walker",
        description: "The spiderdragon ignores movement restrictions caused by webbing."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The spiderdragon makes one Bite attack and two Claw attacks."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack",
        attackBonus: 7,
        damageDescription: "2d10+4 piercing"
      },
      {
        name: "Claw",
        description: "Melee Weapon Attack",
        attackBonus: 7,
        damageDescription: "2d6+4 slashing"
      },
      {
        name: "Poison Breath (Recharge 5-6)",
        description: "The spiderdragon exhales poisonous gas in a 30-foot cone. Each creature in that area must make a DC 15 Constitution saving throw, taking 42 (12d6) poison damage on a failed save, or half as much damage on a successful one."
      }
    ]
  },
  {
    id: "cm-relentless-impaler",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin",
    name: "Relentless Impaler",
    size: "medium",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "40 ft.",
    challengeRating: 11,
    ac: 17,
    acNote: "natural armor",
    hp: 153,
    maxHp: 153,
    abilityScores: {
      strength: 20,
      dexterity: 14,
      constitution: 18,
      intelligence: 10,
      wisdom: 14,
      charisma: 15
    },
    savingThrows: {
      strength: 9,
      constitution: 8
    },
    damageImmunities: ["poison", "necrotic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "12" },
    languages: ["Common", "Abyssal", "Telepathy 60 ft."],
    traits: [
      {
        name: "Undead Nature",
        description: "The impaler doesn't require air, food, drink, or sleep."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The impaler makes three Impaling Thrust attacks."
      },
      {
        name: "Impaling Thrust",
        description: "Melee Weapon Attack",
        attackBonus: 9,
        damageDescription: "2d8+5 piercing"
      }
    ]
  },
  {
    id: "cm-deathwolf",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin",
    name: "Deathwolf",
    size: "large",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "50 ft.",
    challengeRating: 9,
    ac: 15,
    acNote: "natural armor",
    hp: 120,
    maxHp: 120,
    abilityScores: {
      strength: 18,
      dexterity: 15,
      constitution: 14,
      intelligence: 7,
      wisdom: 12,
      charisma: 8
    },
    savingThrows: {
      dexterity: 6
    },
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["exhaustion", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: ["Understands Common but can't speak"],
    traits: [
      {
        name: "Pack Tactics",
        description: "The deathwolf has advantage on an attack roll against a creature if at least one of the deathwolf's allies is within 5 ft. of the creature and the ally isn't incapacitated."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The deathwolf makes two bite attacks."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack",
        attackBonus: 8,
        damageDescription: "2d8+4 piercing"
      }
    ]
  },
  {
    id: "cm-kas-vampire",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin",
    name: "Kas the Bloody, Vampire Form",
    size: "medium",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "40 ft., climb 30 ft.",
    challengeRating: 15,
    ac: 16,
    acNote: "natural armor",
    hp: 178,
    maxHp: 178,
    abilityScores: {
      strength: 18,
      dexterity: 18,
      constitution: 18,
      intelligence: 17,
      wisdom: 15,
      charisma: 18
    },
    savingThrows: {
      dexterity: 9,
      wisdom: 7,
      charisma: 9
    },
    damageResistances: ["necrotic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "12" },
    languages: ["Common", "Abyssal", "telepathy 120 ft."],
    traits: [
      {
        name: "Damage Resistance (Nonmagical)",
        description: "Kas takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical."
      },
      {
        name: "Shapechanger",
        description: "Kas can use his action to polymorph into a cloud of vapor or back into his true form. While in vapor form, he can't take actions and has a flying speed of 20 ft., immunity to nonmagical damage, and he can enter a creature's space and stop there."
      },
      {
        name: "Spider Climb",
        description: "Kas can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      },
      {
        name: "Legendary Resistance (3/Day)",
        description: "If Kas fails a saving throw, he can choose to succeed instead."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Kas makes two attacks: one with his sword and one with his bite, or he makes two bite attacks."
      },
      {
        name: "Sword of Kas",
        description: "Melee Weapon Attack",
        attackBonus: 10,
        damageDescription: "1d10+4 slashing plus 3d6 necrotic"
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack",
        attackBonus: 9,
        damageDescription: "1d6+4 piercing plus 3d6 necrotic"
      }
    ],
    legendaryActions: [
      {
        name: "Move",
        description: "Kas moves up to half his speed without provoking opportunity attacks."
      },
      {
        name: "Charm",
        description: "One creature Kas can see makes a DC 17 Wisdom saving throw. On a failure, it is charmed by Kas until the end of its next turn."
      },
      {
        name: "Necrotic Bolt (Costs 2 Actions)",
        description: "Kas hurls a bolt of necrotic energy at a creature he can see within 60 feet. The target takes 21 (6d6) necrotic damage on a failed DC 17 Dexterity save, or half on a success."
      }
    ]
  },
  {
    id: "cm-kas-death-knight",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin",
    name: "Kas the Bloody, Death Knight",
    size: "medium",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 17,
    ac: 20,
    acNote: "plate armor, shield",
    hp: 225,
    maxHp: 225,
    abilityScores: {
      strength: 20,
      dexterity: 11,
      constitution: 20,
      intelligence: 16,
      wisdom: 14,
      charisma: 18
    },
    savingThrows: {
      constitution: 10,
      wisdom: 7,
      charisma: 9
    },
    damageResistances: ["necrotic"],
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "12" },
    languages: ["Common", "Abyssal", "Infernal", "telepathy 120 ft."],
    traits: [
      {
        name: "Damage Resistance (Non-Silvered Nonmagical)",
        description: "Kas takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical and not silvered."
      },
      {
        name: "Magic Resistance",
        description: "Kas has advantage on saving throws against spells and other magical effects."
      },
      {
        name: "Marshal Undead",
        description: "Undead allies within 60 ft. of Kas have advantage on saving throws and can't be charmed or frightened."
      },
      {
        name: "Legendary Resistance (3/Day)",
        description: "If Kas fails a saving throw, he can choose to succeed instead."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Kas makes three attacks with his sword of Kas or his long sword."
      },
      {
        name: "Sword of Kas",
        description: "Melee Weapon Attack",
        attackBonus: 11,
        damageDescription: "1d10+5 slashing plus 3d6 necrotic, or 1d10+5 slashing and the target must succeed on a DC 18 Wisdom save or be paralyzed."
      },
      {
        name: "Hellfire Orb (Recharge 5-6)",
        description: "Kas hurls a ball of hellfire at a point within 120 ft. Each creature in a 20-foot radius makes a DC 18 Dexterity save, taking 28 (8d6) fire damage and 28 (8d6) necrotic damage on a failure, or half on a success."
      }
    ],
    legendaryActions: [
      {
        name: "Attack",
        description: "Kas makes one sword attack."
      },
      {
        name: "Spellcasting",
        description: "Kas casts one of his prepared spells (see original statblock)."
      },
      {
        name: "Terror (Costs 2 Actions)",
        description: "Each creature of Kas's choice within 30 ft. makes a DC 18 Wisdom save or is frightened until the end of its next turn."
      }
    ]
  },
  {
    id: "cm-vecna",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin",
    name: "Vecna, the Whispered One",
    size: "medium",
    type: "undead",
    alignment: "Lawful Evil",
    speed: "30 ft., fly 60 ft. (hover)",
    challengeRating: 22,
    ac: 19,
    acNote: "natural armor",
    hp: 360,
    maxHp: 360,
    abilityScores: {
      strength: 14,
      dexterity: 18,
      constitution: 22,
      intelligence: 26,
      wisdom: 20,
      charisma: 22
    },
    savingThrows: {
      dexterity: 13,
      constitution: 14,
      intelligence: 16,
      wisdom: 13,
      charisma: 14
    },
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned", "stunned"],
    senses: { truesight: "240 ft.", "passive Perception": "27" },
    languages: ["All", "telepathy 240 ft."],
    description: "The archlich Vecna, ultimate BBEG of the Eve of Ruin adventure. Use sparingly and tailor to your table.",
    traits: [
      {
        name: "Damage Immunity (Nonmagical)",
        description: "Vecna takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical."
      },
      {
        name: "Legendary Resistance (5/Day)",
        description: "If Vecna fails a saving throw, he can choose to succeed instead. He can do this 5 times per day."
      },
      {
        name: "Magic Resistance",
        description: "Vecna has advantage on saving throws against spells and other magical effects."
      },
      {
        name: "Rejuvenation",
        description: "If Vecna is destroyed, his eye and hand reform him within 1d10 days somewhere in the multiverse."
      },
      {
        name: "Spellcasting",
        description: "Vecna is a 20th-level spellcaster. His spellcasting ability is Intelligence (spell save DC 24, +16 to hit with spell attacks). Vecna has access to lich spell list."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Vecna makes three attacks: one with his sword, one with his Hand of Vecna, and one with his Eye of Vecna beam."
      },
      {
        name: "Sword of Kas (Wielded)",
        description: "Melee Weapon Attack",
        attackBonus: 13,
        damageDescription: "1d10+4 slashing plus 4d8 necrotic and the target must succeed on a DC 22 Constitution save or have its hit point maximum reduced by an amount equal to the necrotic damage taken."
      },
      {
        name: "Hand of Vecna (Reaction)",
        description: "When Vecna is hit by a melee attack, the Hand of Vecna intercepts. The attacker must succeed on a DC 22 Strength save or take 14 (4d6) necrotic damage and be knocked prone."
      },
      {
        name: "Eye Ray (Recharge 5-6)",
        description: "Vecna targets one creature he can see within 240 ft. The target makes a DC 22 Dexterity save, taking 55 (10d10) necrotic damage on a failure, or half on a success."
      }
    ],
    legendaryActions: [
      {
        name: "Vecna's Will",
        description: "Vecna targets one creature he can see within 120 ft. The target makes a DC 22 Wisdom save or is charmed by Vecna for 1 minute."
      },
      {
        name: "Necrotic Burst",
        description: "Each creature within 30 ft. of Vecna takes 21 (6d6) necrotic damage (DC 22 Constitution save for half)."
      },
      {
        name: "Cast a Spell",
        description: "Vecna casts one of his prepared spells."
      }
    ]
  },
  {
    id: "cm-acererak",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin",
    name: "Acererak the Archlich",
    size: "medium",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 20,
    ac: 17,
    acNote: "natural armor",
    hp: 299,
    maxHp: 299,
    abilityScores: {
      strength: 9,
      dexterity: 20,
      constitution: 18,
      intelligence: 26,
      wisdom: 18,
      charisma: 20
    },
    savingThrows: {
      dexterity: 14,
      constitution: 13,
      intelligence: 17,
      wisdom: 13
    },
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned", "stunned"],
    senses: { truesight: "120 ft.", "passive Perception": "23" },
    languages: ["Common", "Deep Speech", "Draconic", "Dwarvish", "telepathy 120 ft."],
    description: "The demilich architect of the Tomb of Horrors. Appears as an adversary in Chapter 7's Tomb of Wayward Souls.",
    traits: [
      {
        name: "Damage Immunity (Nonmagical)",
        description: "Acererak takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical."
      },
      {
        name: "Legendary Resistance (3/Day)",
        description: "If Acererak fails a saving throw, he can choose to succeed instead."
      },
      {
        name: "Magic Resistance",
        description: "Acererak has advantage on saving throws against spells and other magical effects."
      },
      {
        name: "Rejuvenation",
        description: "If Acererak is destroyed, his soul reforms in the Negative Energy Plane in 1d10 days."
      },
      {
        name: "Spellcasting",
        description: "Acererak is an 18th-level spellcaster. His spellcasting ability is Intelligence (spell save DC 25, +17 to hit with spell attacks). He typically has the following prepared: dispel magic, fireball, counterspell, finger of death, and other lich staples."
      }
    ],
    actions: [
      {
        name: "Skull Toss",
        description: "Ranged Spell Attack",
        attackBonus: 17,
        damageDescription: "21 (4d8+4) bludgeoning damage, and the target must succeed on a DC 25 Constitution save or have its hit point maximum reduced by an amount equal to the damage taken."
      },
      {
        name: "Paralyzing Touch",
        description: "Melee Spell Attack",
        attackBonus: 17,
        damageDescription: "21 (4d8+3) cold damage, and the target must succeed on a DC 25 Constitution save or be paralyzed for 1 minute."
      }
    ],
    legendaryActions: [
      {
        name: "Cast a Spell",
        description: "Acererak casts one of his prepared spells."
      },
      {
        name: "Skull Attack (Costs 2 Actions)",
        description: "Acererak makes one skull toss attack."
      },
      {
        name: "Frightening Presence",
        description: "Each creature of Acererak's choice within 60 ft. makes a DC 25 Wisdom save or is frightened until the end of its next turn."
      }
    ]
  },
  {
    id: "cm-miska",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin",
    name: "Miska the Wolf-Spider",
    size: "gargantuan",
    type: "fiend",
    alignment: "Chaotic Evil",
    speed: "60 ft., climb 60 ft.",
    challengeRating: 25,
    ac: 22,
    acNote: "natural armor",
    hp: 615,
    maxHp: 615,
    abilityScores: {
      strength: 27,
      dexterity: 16,
      constitution: 24,
      intelligence: 19,
      wisdom: 16,
      charisma: 20
    },
    savingThrows: {
      dexterity: 12,
      constitution: 13,
      intelligence: 11,
      wisdom: 11,
      charisma: 12
    },
    damageResistances: ["cold", "fire", "lightning"],
    damageImmunities: ["poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "13" },
    languages: ["Abyssal", "telepathy 120 ft."],
    description: "Demon lord of the Spider King, imprisoned by Vecna and freed during the Eve of Ruin climax. Boss of Chapter 10: The War of Pandesmos.",
    traits: [
      {
        name: "Damage Immunity (Nonmagical)",
        description: "Miska takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical."
      },
      {
        name: "Magic Resistance",
        description: "Miska has advantage on saving throws against spells and other magical effects."
      },
      {
        name: "Legendary Resistance (3/Day)",
        description: "If Miska fails a saving throw, she can choose to succeed instead."
      },
      {
        name: "Spider Climb",
        description: "Miska can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      },
      {
        name: "Web Walker",
        description: "Miska ignores movement restrictions caused by webbing."
      },
      {
        name: "Spider Demon Aura",
        description: "Any creature within 30 ft. of Miska that isn't a demon or fiend has disadvantage on saving throws against being charmed, frightened, or poisoned."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Miska makes four attacks: one bite, two claws, and one web attack."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack",
        attackBonus: 17,
        damageDescription: "3d10+8 piercing plus 21 (6d6) poison (DC 24 Constitution save for half)."
      },
      {
        name: "Claw",
        description: "Melee Weapon Attack",
        attackBonus: 17,
        damageDescription: "2d8+8 slashing"
      },
      {
        name: "Web",
        description: "Ranged Weapon Attack",
        attackBonus: 12,
        damageDescription: "restrained, DC 24 Strength save breaks free."
      },
      {
        name: "Soul Bite (Recharge 5-6)",
        description: "Miska bites a creature within 10 ft. and attempts to devour its soul. The target makes a DC 24 Charisma save. On a failure, the target's hit point maximum is halved and Miska regains that many hit points. This reduction lasts until the target finishes a long rest."
      }
    ],
    legendaryActions: [
      {
        name: "Attack",
        description: "Miska makes one claw or web attack."
      },
      {
        name: "Move",
        description: "Miska moves up to half her speed without provoking opportunity attacks."
      },
      {
        name: "Summon Spiders (Costs 2 Actions)",
        description: "Miska summons 1d4 phase spiders or 1d6 giant spiders, which arrive at the start of her next turn."
      },
      {
        name: "Web Blast (Costs 3 Actions)",
        description: "Miska releases a 60-foot cone of sticky webbing. Each creature in the area makes a DC 24 Dexterity save or is restrained."
      }
    ]
  },
  {
    id: "cm-lord-soth",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin",
    name: "Lord Soth, Death Knight of the Rose",
    size: "medium",
    type: "undead",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 16,
    ac: 20,
    acNote: "plate armor",
    hp: 230,
    maxHp: 230,
    abilityScores: {
      strength: 20,
      dexterity: 14,
      constitution: 20,
      intelligence: 16,
      wisdom: 14,
      charisma: 18
    },
    savingThrows: {
      constitution: 10,
      wisdom: 7,
      charisma: 9
    },
    damageResistances: ["necrotic"],
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "12" },
    languages: ["Common", "Draconic", "Infernal"],
    description: "Death Knight from Dragonlance commanding Krynn's forces in Chapter 6.",
    traits: [
      {
        name: "Damage Resistance (Non-Silvered Nonmagical)",
        description: "Soth takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical and not silvered."
      },
      {
        name: "Magic Resistance",
        description: "Soth has advantage on saving throws against spells and other magical effects."
      },
      {
        name: "Marshal Undead",
        description: "Undead allies within 60 ft. of Soth have advantage on saving throws."
      },
      {
        name: "Legendary Resistance (3/Day)",
        description: "If Soth fails a saving throw, he can choose to succeed instead."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Soth makes three attacks with his bastard sword or his hellfire orb."
      },
      {
        name: "Bastard Sword",
        description: "Melee Weapon Attack",
        attackBonus: 11,
        damageDescription: "2d8+5 slashing plus 3d6 necrotic"
      },
      {
        name: "Hellfire Orb (Recharge 5-6)",
        description: "Soth hurls a ball of hellfire at a point within 120 ft. Each creature in a 20-foot radius makes a DC 18 Dexterity save, taking 28 (8d6) fire damage and 28 (8d6) necrotic damage on a failure, or half on a success."
      }
    ],
    legendaryActions: [
      {
        name: "Attack",
        description: "Soth makes one sword attack."
      },
      {
        name: "Terror",
        description: "One creature within 30 ft. makes a DC 18 Wisdom save or is frightened until the end of its next turn."
      }
    ]
  },
  {
    id: "cm-tiamat-servant",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin",
    name: "Tiamat (Material Aspect)",
    size: "huge",
    type: "fiend",
    alignment: "Lawful Evil",
    speed: "40 ft., fly 80 ft.",
    challengeRating: 30,
    ac: 25,
    acNote: "natural armor",
    hp: 615,
    maxHp: 615,
    abilityScores: {
      strength: 27,
      dexterity: 10,
      constitution: 25,
      intelligence: 26,
      wisdom: 16,
      charisma: 26
    },
    savingThrows: {
      constitution: 14,
      intelligence: 15,
      wisdom: 11,
      charisma: 15
    },
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["charmed", "exhausted", "frightened", "paralyzed", "poisoned"],
    senses: { blindsight: "120 ft.", darkvision: "240 ft.", "passive Perception": "26" },
    languages: ["All", "telepathy 240 ft."],
    description: "Aspect of Tiamat as a huge chromatic dragon with five heads. Encountered in Chapter 8 at the Dragon Queen's Pride casino.",
    traits: [
      {
        name: "Damage Immunity (Nonmagical)",
        description: "Tiamat takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical."
      },
      {
        name: "Legendary Resistance (5/Day)",
        description: "If Tiamat fails a saving throw, she can choose to succeed instead."
      },
      {
        name: "Magic Resistance",
        description: "Tiamat has advantage on saving throws against spells and other magical effects."
      },
      {
        name: "Five-Headed Advantage",
        description: "Tiamat has advantage on initiative rolls. She cannot be surprised."
      }
    ],
    actions: [
      {
        name: "Multiattack (Bite/Claw form)",
        description: "Tiamat makes one bite attack, one claw attack, and uses her Breath Weapons once per head."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack",
        attackBonus: 17,
        damageDescription: "2d10+8 piercing plus 21 (6d6) of the breath's damage type (chosen per head)."
      },
      {
        name: "Claw",
        description: "Melee Weapon Attack",
        attackBonus: 17,
        damageDescription: "2d6+8 slashing"
      },
      {
        name: "Five-Breath Attack (Recharge 5-6)",
        description: "Tiamat breathes fire, cold, lightning, acid, and poison in a 120-foot line, 120-foot cone, 120-foot line, 120-foot cone, and 120-foot line respectively. Each creature in each area makes a DC 24 Dexterity save, taking 26 (12d10) damage of the relevant type on a failure, or half on a success. A creature in overlapping areas takes 5d10 of each type."
      }
    ],
    legendaryActions: [
      {
        name: "Bite Attack",
        description: "Tiamat makes one bite attack."
      },
      {
        name: "Claw Attack",
        description: "Tiamat makes one claw attack."
      },
      {
        name: "Wing Attack (Costs 2 Actions)",
        description: "Tiamat beats her wings. Each creature within 20 ft. makes a DC 25 Strength save or is knocked prone and pushed 30 ft. away. Tiamat can then fly up to half her speed."
      }
    ]
  },
  {
    id: "cm-necromancer-wizard",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin",
    name: "Necromancer Wizard (Cult of Vecna)",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 6,
    ac: 14,
    acNote: "studded leather",
    hp: 84,
    maxHp: 84,
    abilityScores: {
      strength: 9,
      dexterity: 14,
      constitution: 14,
      intelligence: 18,
      wisdom: 13,
      charisma: 11
    },
    savingThrows: {
      intelligence: 7,
      wisdom: 4
    },
    skills: {
      Arcana: 7,
      History: 7,
      Religion: 4
    },
    senses: { "passive Perception": "11" },
    languages: ["Common", "Abyssal", "Draconic"],
    description: "Veteran cult wizard leading strike teams. Appears in multiple chapters as lieutenant-level threat.",
    traits: [
      {
        name: "Spellcasting",
        description: "The necromancer is a 9th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 15, +7 to hit with spell attacks). It typically has prepared: fireball, counterspell, hold person, fear, animate dead, and other control/necromancy staples."
      },
      {
        name: "Undead Thralls (1/Day)",
        description: "As a bonus action, the necromancer commands any undead it can see within 60 ft. to take an immediate action."
      }
    ],
    actions: [
      {
        name: "Quarterstaff",
        description: "Melee Weapon Attack",
        attackBonus: 2,
        damageDescription: "1d6-2 bludgeoning"
      },
      {
        name: "Necrotic Bolt",
        description: "Ranged Spell Attack",
        attackBonus: 7,
        damageDescription: "16 (3d10) necrotic damage, DC 15 Constitution save for half."
      }
    ]
  },
  {
    id: "cm-priest-of-osybus",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin - Chapter 5: Death House",
    name: "Priest of Osybus",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 6,
    experiencePoints: 2300,
    ac: 14,
    acNote: "natural armor",
    hp: 60,
    maxHp: 60,
    abilityScores: {
      strength: 10,
      dexterity: 14,
      constitution: 16,
      intelligence: 18,
      wisdom: 17,
      charisma: 11
    },
    savingThrows: {
      intelligence: 7,
      wisdom: 6,
      charisma: 3
    },
    conditionImmunities: [
      "frightened"
    ],
    senses: {
      darkvision: "120 ft.",
      "passive Perception": "13"
    },
    languages: ["any three languages"],
    traits: [
      {
        name: "Tattoo of Osybus",
        description: "If the priest drops to 0 hit points, roll on the Boons of Undeath table for the boon the priest receives. The priest dies if it receives a boon it already has. If it receives a new boon, it revives at the start of its next turn with half its hit points restored, and its creature type is now Undead. To prevent this revival, the tattoo of Osybus on the priest's body must be destroyed. The tattoo is invulnerable while the priest has at least 1 hit point. The tattoo is otherwise an object with AC 15, 15 HP, and immunity to poison and psychic damage. It regains all its hit points at the end of every combatant's turn."
      },
      {
        name: "Boons of Undeath",
        description: "1. Dread: Eerie whispers surround the priest. Non-Undead starting within 30 ft must make DC 15 Wis save or be frightened until start of next turn.\n2. Ectoplasmic: Slime drips off priest. Creatures starting within 10 ft have speed reduced by 10 ft until start of next turn. As an action, disguise as Medium/Small creature for 8 hrs.\n3. Vampiric: On necrotic damage dealt, gains temp HP equal to half damage. Speed +10 ft.\n4. Blazing: Flesh sloughs off; becomes flameskull (CR +1) keeping Tattoo of Osybus. Fire damage becomes necrotic.\n5. Spectral: Wraith-like (CR +1). Resistance to all damage except force, radiant, psychic; vulnerable to radiant. Move through creatures/objects as difficult terrain (1d10 force if ending turn inside).\n6. Deathly: Bone-white (CR +1). Animate Dead & Create Undead 1/day each. Circle of Death (Spell; Recharge 5-6, DC 15 Con save, 8d6 necrotic, 60-ft radius)."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The priest makes two attacks."
      },
      {
        name: "Soul Blade",
        description: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) piercing damage. If the target is a creature, it is paralyzed until the start of the priest's next turn. If this reduces a Medium or smaller creature to 0 HP, it dies and its soul is trapped as a Soul Tattoo.",
        attackBonus: 5,
        damageDescription: "7 (2d4 + 2) piercing damage"
      },
      {
        name: "Necrotic Bolt",
        description: "Ranged Spell Attack: +7 to hit, range 120 ft., one target. Hit: 17 (3d8 + 4) necrotic damage. The target can't regain hit points until the start of the priest's next turn.",
        attackBonus: 7,
        damageDescription: "17 (3d8 + 4) necrotic damage"
      }
    ],
    bonusActions: [
      {
        name: "Soul Tattoo",
        recharge: "Recharge 5-6",
        description: "The priest touches one of the Soul Tattoos on its body. The tattoo manifests as a shadow (obeying mental commands, acts after priest) within 30 feet. If within 5 ft, it can take an action to return to the flesh, regaining all HP."
      }
    ]
  },
  {
    id: "cm-inquisitor-of-the-tome",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin - Chapter 5: Death House",
    name: "Inquisitor of the Tome",
    description: "Sarusanda Allester / Ulmist Inquisition template",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral",
    speed: "30 ft.",
    challengeRating: 8,
    experiencePoints: 3900,
    ac: 11,
    acNote: "14 with Mage Armor",
    hp: 77,
    maxHp: 77,
    abilityScores: {
      strength: 10,
      dexterity: 12,
      constitution: 12,
      intelligence: 19,
      wisdom: 16,
      charisma: 15
    },
    savingThrows: {
      intelligence: 7,
      wisdom: 6,
      charisma: 5
    },
    skills: {
      Arcana: 10,
      History: 7,
      Nature: 7,
      Religion: 10
    },
    conditionImmunities: [
      "charmed",
      "frightened"
    ],
    senses: {
      truesight: "30 ft.",
      "passive Perception": "13"
    },
    languages: ["any four languages", "telepathy 120 ft."],
    traits: [
      {
        name: "Innate Spellcasting (Psionics)",
        description: "Spellcasting ability is Intelligence (spell save DC 15, no components required).\nAt will: Detect Magic, Dispel Magic, Levitate, Mage Armor, Mage Hand, Sending\n1/day each: Otiluke's Resilient Sphere, Telekinesis"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The inquisitor makes two attacks."
      },
      {
        name: "Silver Longsword",
        description: "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) slashing damage (or 9 (1d10 + 4) two-handed) plus 18 (4d8) force damage.",
        attackBonus: 7,
        damageDescription: "8 (1d8 + 4) slashing + 18 (4d8) force"
      },
      {
        name: "Force Bolt",
        description: "Ranged Spell Attack: +7 to hit, range 120 ft., one target. Hit: 22 (4d8 + 4) force damage, and Large or smaller creatures can be pushed up to 10 feet away.",
        attackBonus: 7,
        damageDescription: "22 (4d8 + 4) force damage"
      },
      {
        name: "Implode",
        recharge: "Recharge 4-6",
        description: "Each creature in a 20-foot-radius sphere centered on a point within 120 feet must succeed on a DC 15 Constitution saving throw or take 31 (6d8 + 4) force damage, be knocked prone, and pulled to the center. Unattended Large or smaller objects take damage and move."
      }
    ],
    reactions: [
      {
        name: "Telekinetic Deflection",
        description: "In response to being hit by an attack roll, increases AC by 4 against the attack. If this causes the attack to miss, the attacker is hit by the attack instead."
      }
    ]
  },
  {
    id: "cm-whirling-chandelier",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin - Chapter 5: Death House",
    name: "Whirling Chandelier",
    size: "large",
    type: "construct",
    alignment: "Unaligned",
    speed: "30 ft., fly 30 ft. (hover)",
    challengeRating: 8,
    experiencePoints: 3900,
    ac: 13,
    acNote: "natural armor",
    hp: 105,
    maxHp: 105,
    abilityScores: {
      strength: 18,
      dexterity: 15,
      constitution: 15,
      intelligence: 3,
      wisdom: 5,
      charisma: 1
    },
    damageResistances: [
      "fire"
    ],
    damageImmunities: [
      "poison",
      "psychic"
    ],
    conditionImmunities: [
      "blinded",
      "charmed",
      "deafened",
      "exhaustion",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned"
    ],
    senses: {
      blindsight: "60 ft. (blind beyond this radius)",
      "passive Perception": "7"
    },
    languages: ["understands Common but can't speak"],
    traits: [
      {
        name: "False Appearance",
        description: "If motionless at the start of combat, has advantage on initiative. A creature must succeed on a DC 18 Intelligence (Investigation) check to discern it is animate before it moves or acts."
      },
      {
        name: "Fiery Aura",
        description: "Any creature that starts its turn within 5 feet of the chandelier takes 7 (2d6) fire damage."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The chandelier makes three Chain attacks, three Lamp attacks, or a combination thereof."
      },
      {
        name: "Chain",
        description: "Melee Weapon Attack: +7 to hit, reach 15 ft., one target. Hit: 13 (2d8 + 4) bludgeoning damage and target must make DC 15 Strength save or be pulled within 5 ft of chandelier.",
        attackBonus: 7,
        damageDescription: "13 (2d8 + 4) bludgeoning"
      },
      {
        name: "Lamp",
        description: "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 9 (2d4 + 4) bludgeoning damage plus 13 (3d8) fire damage.",
        attackBonus: 7,
        damageDescription: "9 (2d4 + 4) bludgeoning + 13 (3d8) fire"
      },
      {
        name: "Blazing Vortex",
        recharge: "Recharge 5-6",
        description: "Each creature within 20 feet not behind total cover must succeed on a DC 14 Constitution saving throw or take 36 (8d8) fire damage and be blinded until the start of chandelier's next turn."
      }
    ]
  },
  {
    id: "cm-strahd-master-of-death-house",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin - Chapter 5: Death House",
    name: "Strahd, Master of Death House",
    description: "Unique variant of Strahd von Zarovich confronting the party in Death House.",
    size: "medium",
    type: "undead",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 15,
    experiencePoints: 13000,
    ac: 16,
    acNote: "natural armor",
    hp: 136,
    maxHp: 136,
    abilityScores: {
      strength: 18,
      dexterity: 18,
      constitution: 18,
      intelligence: 20,
      wisdom: 15,
      charisma: 18
    },
    savingThrows: {
      dexterity: 9,
      wisdom: 7,
      charisma: 9
    },
    skills: {
      Arcana: 15,
      Perception: 12,
      Religion: 10,
      Stealth: 14
    },
    damageResistances: [
      "necrotic"
    ],
    senses: {
      darkvision: "120 ft.",
      "passive Perception": "22"
    },
    languages: ["Abyssal", "Common", "Draconic", "Elvish", "Giant", "Infernal"],
    traits: [
      {
        name: "Legendary Resistance (3/Day)",
        description: "If Strahd fails a saving throw, he can choose to succeed instead."
      },
      {
        name: "Master of the House",
        description: "When reduced to 0 HP, dissolves into mist and teleports to Castle Ravenloft lair, re-forming 1d4 hours later at full HP."
      },
      {
        name: "Regeneration",
        description: "Regains 20 HP at start of turn if he has at least 1 HP. Radiant damage stops this for next turn."
      },
      {
        name: "Spider Climb",
        description: "Can climb difficult surfaces, including ceilings upside down, without ability checks."
      },
      {
        name: "Vampire Weaknesses",
        description: "Harmed by Running Water: takes 20 acid damage ending turn in running water, can't Change Shape. Sunlight Hypersensitivity: takes 20 radiant damage starting turn in sunlight, disadvantage on attack rolls and ability checks, can't Change Shape."
      },
      {
        name: "Spellcasting",
        description: "Spellcaster (Int-based, DC 18).\nAt will: Detect Thoughts, Fog Cloud, Mage Hand\n2/day each: Animate Dead (as action), Gust of Wind, Mirror Image, Nondetection\n1/day each: Greater Invisibility, Polymorph, Scrying (as action)"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Strahd makes two Death Strike attacks. Can replace one with Blighted Fire if available."
      },
      {
        name: "Death Strike",
        description: "Melee Weapon Attack: +9 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) slashing plus 14 (4d6) necrotic. Can forgo slashing damage to grapple target instead (escape DC 18, 1 creature max).",
        attackBonus: 9,
        damageDescription: "8 (1d8 + 4) slashing + 14 (4d6) necrotic"
      },
      {
        name: "Blighted Fire",
        recharge: "Recharge 5-6",
        description: "Shadowy necrotic fire fills 20-ft radius sphere within 90 ft. DC 18 Dex save, taking 14 (4d6) fire + 14 (4d6) necrotic on fail, half on success."
      },
      {
        name: "Charm",
        description: "Targets one Humanoid within 30 ft. DC 17 Wisdom saving throw or charmed (regards Strahd as trusted friend, ends if harmed, lasts 24h or until Strahd 0 HP/dismissed)."
      }
    ],
    bonusActions: [
      {
        name: "Bite",
        description: "Melee Weapon Attack: +9 to hit, reach 5 ft., one charmed or grappled creature. Hit: 7 (1d6 + 4) piercing + 10 (3d6) necrotic. Target's max HP reduced by necrotic damage, Strahd heals equal amount. Humanoid slain rises as vampire spawn next night.",
        attackBonus: 9,
        damageDescription: "7 (1d6 + 4) piercing + 10 (3d6) necrotic"
      },
      {
        name: "Change Shape",
        description: "Transforms into Tiny bat (fly 30 ft), Medium wolf (speed 40 ft), or Medium mist cloud (fly 20 ft hover, immune to nonmagical damage), or back to true form."
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Cunning Escape",
        cost: 1,
        description: "Strahd moves up to his speed without provoking opportunity attacks."
      },
      {
        name: "Strike",
        cost: 2,
        description: "Strahd makes one Death Strike attack."
      }
    ]
  },
  {
    id: "cm-flameskull-death-house",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin - Chapter 5: Death House",
    name: "Flameskull",
    size: "tiny",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "0 ft., fly 40 ft. (hover)",
    challengeRating: 4,
    experiencePoints: 1100,
    ac: 13,
    hp: 40,
    maxHp: 40,
    abilityScores: {
      strength: 1,
      dexterity: 17,
      constitution: 14,
      intelligence: 16,
      wisdom: 10,
      charisma: 11
    },
    skills: {
      Arcana: 5,
      Perception: 2
    },
    damageResistances: [
      "lightning",
      "necrotic",
      "piercing"
    ],
    damageImmunities: [
      "cold",
      "fire",
      "poison"
    ],
    conditionImmunities: [
      "charmed",
      "frightened",
      "paralyzed",
      "poisoned",
      "prone"
    ],
    senses: {
      darkvision: "60 ft.",
      "passive Perception": "12"
    },
    languages: ["Common"],
    traits: [
      {
        name: "Illumination",
        description: "The flameskull sheds either dim light in a 15-foot radius, or bright light in a 15-foot radius and dim light for an additional 15 ft."
      },
      {
        name: "Magic Resistance",
        description: "The flameskull has advantage on saving throws against spells and other magical effects."
      },
      {
        name: "Rejuvenation",
        description: "If destroyed, regains all HP in 1 hour unless holy water is sprinkled or dispel magic/remove curse is cast on remains."
      },
      {
        name: "Spellcasting",
        description: "5th-level spellcaster (Int-based, DC 13, +5 to hit with spell attacks, no somatic or material components).\nCantrips (at will): mage hand\n1st level (3 slots): magic missile, shield\n2nd level (2 slots): blur, flaming sphere\n3rd level (1 slot): fireball"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The flameskull makes two fire ray attacks."
      },
      {
        name: "Fire Ray",
        description: "Ranged Spell Attack: +5 to hit, range 30 ft., one target. Hit: 10 (3d6) fire damage.",
        attackBonus: 5,
        damageDescription: "10 (3d6) fire damage"
      }
    ]
  },
  {
    id: "cm-helmed-horror-death-house",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin - Chapter 5: Death House",
    name: "Helmed Horror",
    size: "medium",
    type: "construct",
    alignment: "Unaligned",
    speed: "30 ft., fly 30 ft.",
    challengeRating: 4,
    experiencePoints: 1100,
    ac: 20,
    acNote: "plate armor, shield",
    hp: 60,
    maxHp: 60,
    abilityScores: {
      strength: 18,
      dexterity: 13,
      constitution: 16,
      intelligence: 10,
      wisdom: 13,
      charisma: 10
    },
    skills: {
      Perception: 4
    },
    damageImmunities: [
      "force",
      "necrotic",
      "poison"
    ],
    conditionImmunities: [
      "blinded",
      "charmed",
      "deafened",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned",
      "stunned"
    ],
    senses: {
      blindsight: "60 ft. (blind beyond this radius)",
      "passive Perception": "14"
    },
    languages: ["understands the languages of its creator but can't speak"],
    traits: [
      {
        name: "Magic Resistance",
        description: "The helmed horror has advantage on saving throws against spells and other magical effects."
      },
      {
        name: "Spell Immunity",
        description: "The helmed horror is immune to three spells chosen by its creator (typically fireball, heat metal, and lightning bolt)."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The helmed horror makes two longsword attacks."
      },
      {
        name: "Longsword",
        description: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) slashing damage, or 9 (1d10 + 4) slashing damage if used with two hands.",
        attackBonus: 6,
        damageDescription: "8 (1d8 + 4) slashing / 9 (1d10 + 4) two-handed"
      }
    ]
  },
  // ─── Curse of Strahd ─────────────────────────────────────────────────────
  {
    id: "cm-wintersplinter",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of Strahd",
    name: "The Wintersplinter",
    size: "gargantuan",
    type: "plant",
    alignment: "Chaotic Evil",
    speed: "40 ft.",
    challengeRating: 9,
    ac: 16,
    acNote: "natural armor",
    hp: 161,
    maxHp: 161,
    abilityScores: {
      strength: 21,
      dexterity: 8,
      constitution: 19,
      intelligence: 6,
      wisdom: 10,
      charisma: 6
    },
    savingThrows: { strength: 9, constitution: 8 },
    damageResistances: ["bludgeoning", "piercing"],
    conditionImmunities: ["blinded", "deafened"],
    senses: { tremorsense: "60 ft.", "passive Perception": "10" },
    languages: ["Understands Druidic but can't speak"],
    description: "Gargantuan awakened tree animated by the Keepers of the Feather to destroy Strahd's enemies.",
    traits: [
      {
        name: "Siege Monster",
        description: "The Wintersplinter deals double damage to objects and structures."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The Wintersplinter makes two Slam attacks."
      },
      {
        name: "Slam",
        description: "Melee Weapon Attack",
        attackBonus: 9,
        damageDescription: "21 (3d8 + 7) bludgeoning damage."
      },
      {
        name: "Rock",
        description: "Ranged Weapon Attack",
        attackBonus: 9,
        damageDescription: "28 (5d8 + 7) bludgeoning damage."
      }
    ]
  },
  {
    id: "cm-baba-lysaga",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of Strahd",
    name: "Baba Lysaga",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 11,
    ac: 17,
    acNote: "Mage Armor",
    hp: 162,
    maxHp: 162,
    abilityScores: {
      strength: 10,
      dexterity: 14,
      constitution: 16,
      intelligence: 19,
      wisdom: 16,
      charisma: 15
    },
    savingThrows: { intelligence: 8, wisdom: 7, charisma: 6 },
    skills: { Arcana: 8, Deception: 6, Medicine: 7, Religion: 8, Stealth: 6 },
    senses: { "passive Perception": "13" },
    languages: ["Common", "Druidic", "Sylvan"],
    description: "The swamp witch of Berez and Ireena's true mother. Commands the Creeping Hut and a coven of crows.",
    traits: [
      {
        name: "Spellcasting",
        description: "Baba Lysaga is an 14th-level spellcaster. Her spellcasting ability is Intelligence (spell save DC 16, +8 to hit with spell attacks). She typically has prepared: dispel magic, fireball, lightning bolt, polymorph, pass without trace, and other druid/witch staples."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Baba Lysaga casts one spell and makes one Bite attack."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack",
        attackBonus: 4,
        damageDescription: "5 (1d6 + 2) piercing damage plus 14 (4d6) necrotic damage."
      }
    ]
  },
  {
    id: "cm-creeping-hut",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of Strahd",
    name: "The Creeping Hut",
    size: "large",
    type: "monstrosity",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 8,
    ac: 14,
    acNote: "natural armor",
    hp: 119,
    maxHp: 119,
    abilityScores: {
      strength: 18,
      dexterity: 10,
      constitution: 18,
      intelligence: 6,
      wisdom: 12,
      charisma: 5
    },
    skills: { Perception: 4 },
    damageVulnerabilities: ["fire"],
    senses: { "passive Perception": "14" },
    languages: ["Understands Common but can't speak"],
    description: "Baba Lysaga's walking hut, mounted on giant chicken legs and studded with glowing windows.",
    traits: [
      {
        name: "Magic Resistance",
        description: "The Creeping Hut has advantage on saving throws against spells and other magical effects."
      },
      {
        name: "Siege Monster (Inside)",
        description: "While Baba Lysaga is inside, the hut's Slam attacks deal double damage to objects and structures."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The Creeping Hut makes two Leg attacks and one Window attack."
      },
      {
        name: "Leg",
        description: "Melee Weapon Attack",
        attackBonus: 7,
        damageDescription: "15 (2d10 + 4) bludgeoning damage."
      },
      {
        name: "Window",
        description: "Ranged Weapon Attack",
        attackBonus: 4,
        damageDescription: "21 (6d6) piercing damage."
      }
    ]
  },
  {
    id: "cm-strahd-von-zarovich",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of Strahd",
    name: "Strahd von Zarovich",
    size: "medium",
    type: "undead",
    alignment: "Lawful Evil",
    speed: "30 ft., climb 30 ft.",
    challengeRating: 15,
    ac: 16,
    acNote: "natural armor",
    hp: 200,
    maxHp: 200,
    abilityScores: {
      strength: 18,
      dexterity: 18,
      constitution: 18,
      intelligence: 20,
      wisdom: 15,
      charisma: 18
    },
    savingThrows: { dexterity: 9, wisdom: 7, charisma: 9 },
    skills: { Arcana: 15, Perception: 12, Stealth: 14 },
    damageResistances: ["necrotic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "22" },
    languages: ["Common", "Draconic", "Elvish", "Infernal"],
    description: "The vampire lord of Barovia. Wields the Heart of Sorrow to anchor his presence to the demiplane.",
    traits: [
      {
        name: "Heart of Sorrow",
        description: "Strahd has 30 temporary hit points that regenerate at the start of his turn while within Castle Ravenloft. Damage to the Heart bypasses Strahd's damage resistance."
      },
      {
        name: "Legendary Resistance (3/Day)",
        description: "If Strahd fails a saving throw, he can choose to succeed instead."
      },
      {
        name: "Magic Resistance",
        description: "Strahd has advantage on saving throws against spells and other magical effects."
      },
      {
        name: "Mist Form",
        description: "Strahd can use his action to polymorph into a cloud of vapor or back into his true form. While in vapor form, he has a flying speed of 20 ft., immunity to nonmagical damage, and cannot take actions."
      },
      {
        name: "Regeneration",
        description: "Strahd regains 20 hit points at the start of his turn if he has at least 1 HP and isn't in sunlight or running water."
      },
      {
        name: "Spellcasting",
        description: "Strahd is a 9th-level spellcaster. His spellcasting ability is Intelligence (spell save DC 18, +10 to hit with spell attacks). At will: detect thoughts, fog cloud, mage hand. 3/day each: animate dead, lightning bolt. 1/day each: greater invisibility, polymorph."
      },
      {
        name: "Vampire Weaknesses",
        description: "Strahd has the following flaws: forbiddance, harmed by running water, stake to the heart, sunlight hypersensitivity."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Strahd makes two Unarmed Strike attacks."
      },
      {
        name: "Unarmed Strike",
        description: "Melee Weapon Attack",
        attackBonus: 9,
        damageDescription: "8 (1d8 + 4) bludgeoning damage plus 14 (4d6) necrotic damage. Strahd can grapple the target (escape DC 18) instead of dealing bludgeoning damage."
      },
      {
        name: "Charm",
        description: "Strahd targets one humanoid he can see within 30 ft. The target makes a DC 17 Wisdom saving throw or is charmed by Strahd for 24 hours."
      }
    ],
    bonusActions: [
      {
        name: "Bite",
        description: "Melee Weapon Attack",
        attackBonus: 9,
        damageDescription: "7 (1d6 + 4) piercing damage plus 10 (3d6) necrotic damage. The target's hit point maximum is reduced by an amount equal to the necrotic damage taken. Strahd regains hit points equal to that amount. A humanoid slain this way rises as a vampire spawn under Strahd's control at the next midnight."
      }
    ],
    legendaryActions: [
      {
        name: "Move",
        description: "Strahd moves up to his speed without provoking opportunity attacks."
      },
      {
        name: "Attack",
        description: "Strahd makes one Unarmed Strike attack."
      },
      {
        name: "Spellcasting",
        description: "Strahd casts one of his at-will spells."
      }
    ]
  },
  // SRD-faithful mirrors used in Curse of Strahd encounters
  {
    id: "cm-animated-armor",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of Strahd",
    name: "Animated Armor",
    size: "medium",
    type: "construct",
    alignment: "Unaligned",
    speed: "25 ft.",
    challengeRating: 1,
    ac: 14,
    acNote: "natural armor",
    hp: 33,
    maxHp: 33,
    abilityScores: {
      strength: 14, dexterity: 11, constitution: 13,
      intelligence: 1, wisdom: 3, charisma: 1
    },
    conditionImmunities: ["blinded", "charmed", "deafened", "frightened", "paralyzed", "poisoned", "stunned"],
    senses: { "passive Perception": "6" },
    languages: ["understands the languages of its creator but can't speak"],
    traits: [
      { name: "Antimagic Susceptibility", description: "The armor is incapacitated while in the area of an antimagic field. If targeted by dispel magic, the armor is suppressed for 1 minute and reverts to an inanimate suit of armor." },
      { name: "False Appearance", description: "While motionless, the armor is indistinguishable from a normal suit of armor." }
    ],
    actions: [
      { name: "Multiattack", description: "The armor makes two melee attacks." },
      {
        name: "Slam",
        description: "Melee Weapon Attack",
        attackBonus: 4,
        damageDescription: "6 (1d8 + 2) bludgeoning damage."
      }
    ]
  },
  {
    id: "cm-ghoul",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of Strahd",
    name: "Ghoul",
    size: "medium",
    type: "undead",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 1,
    ac: 12,
    hp: 22,
    maxHp: 22,
    abilityScores: {
      strength: 13, dexterity: 15, constitution: 10,
      intelligence: 6, wisdom: 10, charisma: 6
    },
    damageImmunities: ["poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: ["Common"],
    traits: [
      { name: "Damage Immunity (Nonmagical)", description: "The ghoul takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical." }
    ],
    actions: [
      { name: "Multiattack", description: "The ghoul makes two Bite or Claw attacks." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 2, damageDescription: "5 (2d4) piercing damage." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "7 (2d4 + 2) slashing damage. If the target is a creature other than an elf or undead, it must succeed on a DC 10 Constitution saving throw or be paralyzed for 1 minute." }
    ]
  },
  {
    id: "cm-shambling-mound",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of Strahd",
    name: "Shambling Mound",
    size: "large",
    type: "plant",
    alignment: "Unaligned",
    speed: "20 ft., swim 20 ft.",
    challengeRating: 5,
    ac: 15,
    acNote: "natural armor",
    hp: 146,
    maxHp: 146,
    abilityScores: {
      strength: 18, dexterity: 8, constitution: 16,
      intelligence: 5, wisdom: 12, charisma: 5
    },
    skills: { Stealth: 3 },
    damageImmunities: ["fire", "lightning"],
    conditionImmunities: ["blinded", "deafened", "exhaustion"],
    senses: { blindsight: "60 ft.", "passive Perception": "11" },
    languages: ["understands Sylvan but can't speak"],
    traits: [
      { name: "Damage Immunity (Lightning/Fire)", description: "The mound is immune to fire and lightning damage, and any fire or lightning damage dealt to it is absorbed and converted into healing." },
      { name: "Engulf", description: "The mound can engulf a creature of its size or smaller as an action. The engulfed target is grappled, has its speed reduced to 0, and takes 21 (6d6) bludgeoning damage at the start of each of the mound's turns." }
    ],
    actions: [
      { name: "Multiattack", description: "The mound makes two Slam attacks. If both attacks hit a Medium or smaller target, the target is grappled (escape DC 14)." },
      { name: "Slam", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "13 (2d8 + 4) bludgeoning damage." }
    ]
  },
  {
    id: "cm-vampire-spawn",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of Strahd",
    name: "Vampire Spawn",
    size: "medium",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "30 ft., climb 30 ft.",
    challengeRating: 5,
    ac: 15,
    acNote: "natural armor",
    hp: 82,
    maxHp: 82,
    abilityScores: {
      strength: 16, dexterity: 16, constitution: 16,
      intelligence: 11, wisdom: 12, charisma: 14
    },
    savingThrows: { dexterity: 6, wisdom: 4 },
    skills: { Perception: 3, Stealth: 6 },
    damageResistances: ["necrotic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["the languages it knew in life"],
    traits: [
      { name: "Damage Resistance (Nonmagical)", description: "The vampire spawn takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical." },
      { name: "Regeneration", description: "The vampire spawn regains 10 hit points at the start of its turn if it has at least 1 HP and isn't in sunlight or running water." },
      { name: "Spider Climb", description: "The vampire spawn can climb difficult surfaces, including upside down on ceilings, without an ability check." },
      { name: "Vampire Weaknesses", description: "The vampire spawn has the following flaws: forbiddance, harmed by running water, stake to the heart, sunlight hypersensitivity." }
    ],
    actions: [
      { name: "Multiattack", description: "The vampire spawn makes two attacks, only one of which can be a bite." },
      { name: "Claws", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "7 (1d8 + 3) slashing damage plus 3 (1d6) necrotic damage. The target's hit point maximum is reduced by an amount equal to the necrotic damage taken." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "6 (1d6 + 3) piercing damage plus 7 (2d6) necrotic damage. The target's hit point maximum is reduced by the necrotic damage taken. The vampire spawn regains hit points equal to that amount." }
    ]
  },
  {
    id: "cm-night-hag",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of Strahd",
    name: "Night Hag",
    size: "medium",
    type: "fiend",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 5,
    ac: 17,
    acNote: "natural armor",
    hp: 112,
    maxHp: 112,
    abilityScores: {
      strength: 16, dexterity: 16, constitution: 16,
      intelligence: 16, wisdom: 14, charisma: 16
    },
    skills: { Deception: 5, Insight: 4, Perception: 4, Stealth: 5 },
    damageResistances: ["acid", "cold", "fire"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "14" },
    languages: ["Abyssal", "Common", "Infernal", "Primordial"],
    traits: [
      { name: "Magic Resistance", description: "The night hag has advantage on saving throws against spells and other magical effects." },
      { name: "Invisible Passage", description: "The night hag can magically pass through creatures and objects as if they were difficult terrain." }
    ],
    actions: [
      { name: "Multiattack", description: "The night hag makes two Claw attacks." },
      { name: "Claw", description: "Melee Spell Attack", attackBonus: 7, damageDescription: "13 (2d8 + 4) slashing damage." },
      {
        name: "Etherealness",
        description: "The night hag magically enters the Ethereal Plane from the Material Plane, or vice versa."
      },
      {
        name: "Nightmare Haunting (1/Day)",
        description: "The night hag targets one creature she can see within 300 ft that is sleeping. If the target fails a DC 15 Wisdom saving throw, it is wracked by nightmares."
      }
    ]
  },
  {
    id: "cm-wight",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of Strahd",
    name: "Wight",
    size: "medium",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 3,
    ac: 14,
    acNote: "natural armor",
    hp: 45,
    maxHp: 45,
    abilityScores: {
      strength: 16, dexterity: 14, constitution: 16,
      intelligence: 11, wisdom: 13, charisma: 15
    },
    skills: { Perception: 3, Stealth: 4 },
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["the languages it knew in life"],
    traits: [
      { name: "Damage Resistance (Nonmagical)", description: "The wight takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical." },
      { name: "Sunlight Sensitivity", description: "While in sunlight, the wight has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight." }
    ],
    actions: [
      { name: "Multiattack", description: "The wight makes two Longsword or Longbow attacks." },
      { name: "Longsword", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "8 (1d10 + 3) slashing damage, or 7 (1d8 + 3) if one-handed." },
      {
        name: "Life Drain",
        description: "Melee Spell Attack",
        attackBonus: 5,
        damageDescription: "5 (1d6 + 2) necrotic damage. The target must succeed on a DC 13 Constitution saving throw or its hit point maximum is reduced by an amount equal to the damage taken. This reduction lasts until the target finishes a long rest. A humanoid slain this way rises as a zombie under the wight's control."
      }
    ]
  },
  {
    id: "cm-vampire",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of Strahd",
    name: "Vampire",
    size: "medium",
    type: "undead",
    alignment: "Lawful Evil",
    speed: "30 ft., climb 30 ft.",
    challengeRating: 13,
    ac: 16,
    acNote: "natural armor",
    hp: 178,
    maxHp: 178,
    abilityScores: {
      strength: 18, dexterity: 18, constitution: 18,
      intelligence: 17, wisdom: 15, charisma: 18
    },
    savingThrows: { dexterity: 9, wisdom: 7, charisma: 9 },
    skills: { Perception: 7, Stealth: 9 },
    damageResistances: ["necrotic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "17" },
    languages: ["Common", "the languages it knew in life"],
    traits: [
      { name: "Damage Resistance (Nonmagical)", description: "The vampire takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical." },
      { name: "Legendary Resistance (3/Day)", description: "If the vampire fails a saving throw, it can choose to succeed instead." },
      { name: "Mist Form", description: "The vampire can use its action to polymorph into a cloud of vapor or back. While in vapor form it has a flying speed of 20 ft., immunity to nonmagical damage, and cannot take actions." },
      { name: "Regeneration", description: "The vampire regains 20 hit points at the start of its turn if it has at least 1 HP and isn't in sunlight or running water." },
      { name: "Spider Climb", description: "The vampire can climb difficult surfaces, including upside down on ceilings, without an ability check." },
      { name: "Vampire Weaknesses", description: "The vampire has the following flaws: forbiddance, harmed by running water, stake to the heart, sunlight hypersensitivity." }
    ],
    actions: [
      { name: "Multiattack", description: "The vampire makes two attacks, only one of which can be a bite." },
      {
        name: "Unarmed Strike",
        description: "Melee Weapon Attack",
        attackBonus: 9,
        damageDescription: "8 (1d8 + 4) bludgeoning damage plus 7 (2d6) necrotic damage. The target's hit point maximum is reduced by an amount equal to the necrotic damage taken. The vampire can grapple instead."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack",
        attackBonus: 9,
        damageDescription: "7 (1d6 + 4) piercing damage plus 7 (2d6) necrotic damage. The target's hit point maximum is reduced by an amount equal to the necrotic damage taken, and the vampire regains hit points equal to that amount."
      },
      {
        name: "Charm",
        description: "The vampire targets one humanoid within 30 ft. DC 17 Wisdom save or charmed for 24 hours."
      }
    ],
    legendaryActions: [
      { name: "Move", description: "The vampire moves up to half its speed without provoking opportunity attacks." },
      { name: "Attack", description: "The vampire makes one Unarmed Strike attack." },
      { name: "Bite", description: "The vampire makes one Bite attack." }
    ]
  },
  // ─── Tomb of Annihilation ─────────────────────────────────────────────────
  {
    id: "cm-tyrannosaurus-zombie",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tomb of Annihilation",
    name: "Tyrannosaurus Zombie",
    size: "huge",
    type: "undead",
    alignment: "Neutral",
    speed: "40 ft.",
    challengeRating: 8,
    ac: 13,
    acNote: "natural armor",
    hp: 136,
    maxHp: 136,
    abilityScores: {
      strength: 21, dexterity: 6, constitution: 19,
      intelligence: 3, wisdom: 9, charisma: 6
    },
    skills: { Perception: 2, Stealth: 1 },
    savingThrows: { wisdom: 2 },
    damageImmunities: ["poison"],
    conditionImmunities: ["exhaustion", "poisoned"],
    senses: { "passive Perception": "12" },
    languages: ["understands Draconic but can't speak"],
    description: "An undead tyrannosaurus regurgitating zombies in the jungles of Chult.",
    traits: [
      { name: "Undead Fortitude", description: "If damage reduces the zombie to 0 hit points, it makes a Constitution saving throw with a +5 bonus. On a success, it drops to 1 hit point instead." }
    ],
    actions: [
      { name: "Multiattack", description: "The tyrannosaurus zombie makes two attacks: one Bite and one Tail." },
      {
        name: "Bite",
        description: "Melee Weapon Attack",
        attackBonus: 8,
        damageDescription: "33 (4d12 + 5) piercing damage. If the target is a creature, it is grappled (escape DC 16). Until this grapple ends, the target is restrained, and the tyrannosaurus zombie can't bite another target."
      },
      {
        name: "Tail",
        description: "Melee Weapon Attack",
        attackBonus: 8,
        damageDescription: "20 (3d8 + 5) bludgeoning damage."
      },
      {
        name: "Regurgitate",
        description: "The tyrannosaurus zombie vomits up to 4 zombies that appeared as the zombie's indigestible meal. Each zombie acts under the tyrannosaurus zombie's control until destroyed."
      }
    ]
  },
  {
    id: "cm-firenewt-warlock",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tomb of Annihilation",
    name: "Firenewt Warlock of Imix",
    size: "small",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 1,
    ac: 13,
    hp: 22,
    maxHp: 22,
    abilityScores: {
      strength: 8, dexterity: 14, constitution: 12,
      intelligence: 11, wisdom: 12, charisma: 14
    },
    skills: { Arcana: 2, Religion: 3 },
    damageVulnerabilities: ["cold"],
    senses: { "passive Perception": "11" },
    languages: ["Draconic", "Ignan"],
    traits: [
      { name: "Fire Resistance", description: "The firenewt has resistance to fire damage." },
      { name: "Spellcasting", description: "The firenewt is a 1st-level spellcaster. Its spellcasting ability is Charisma (spell save DC 12, +4 to hit with spell attacks). At will: fire bolt, produce flame. 1/day each: burning hands, scorching ray." }
    ],
    actions: [
      {
        name: "Fire Bolt",
        description: "Ranged Spell Attack",
        attackBonus: 4,
        damageDescription: "5 (1d10) fire damage."
      },
      {
        name: "Summon Firenewt",
        description: "The firenewt warlock has a 25% chance of summoning 1d2 firenewt warriors (reused via cm-firenewt-warrior)."
      }
    ]
  },
  {
    id: "cm-firenewt-warrior",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tomb of Annihilation",
    name: "Firenewt Warrior",
    size: "small",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 0.5,
    ac: 13,
    acNote: "leather armor",
    hp: 11,
    maxHp: 11,
    abilityScores: {
      strength: 8, dexterity: 14, constitution: 12,
      intelligence: 7, wisdom: 11, charisma: 10
    },
    skills: { Athletics: 1 },
    damageVulnerabilities: ["cold"],
    senses: { "passive Perception": "10" },
    languages: ["Draconic", "Ignan"],
    traits: [
      { name: "Fire Resistance", description: "The firenewt has resistance to fire damage." }
    ],
    actions: [
      { name: "Multiattack", description: "The firenewt makes two attacks: one Bite and one Fire Spear." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "4 (1d4 + 2) piercing damage." },
      {
        name: "Fire Spear",
        description: "Melee or Ranged Weapon Attack",
        attackBonus: 4,
        damageDescription: "4 (1d6 + 1) piercing damage plus 2 (1d4) fire damage."
      }
    ]
  },
  {
    id: "cm-yuan-ti-broodguard",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tomb of Annihilation",
    name: "Yuan-ti Broodguard",
    size: "medium",
    type: "monstrosity",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 4,
    ac: 14,
    acNote: "natural armor",
    hp: 88,
    maxHp: 88,
    abilityScores: {
      strength: 17, dexterity: 12, constitution: 16,
      intelligence: 13, wisdom: 12, charisma: 13
    },
    skills: { Deception: 3, Stealth: 3 },
    damageImmunities: ["poison"],
    conditionImmunities: ["poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: ["Abyssal", "Common", "Draconic"],
    traits: [
      { name: "Magic Resistance", description: "The broodguard has advantage on saving throws against spells and other magical effects." },
      { name: "Serpentine Embrace", description: "If the broodguard grapples a creature, it constricts it at the start of each of its turns for 7 (2d6) bludgeoning damage." }
    ],
    actions: [
      { name: "Multiattack", description: "The broodguard makes two Constrict attacks and one Poison Spit attack." },
      { name: "Constrict", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "6 (1d6 + 3) bludgeoning damage, and the target is grappled (escape DC 13)." },
      {
        name: "Poison Spit",
        description: "Ranged Weapon Attack",
        attackBonus: 5,
        damageDescription: "7 (2d6) poison damage."
      }
    ]
  },
  {
    id: "cm-yuan-ti-nightmare-speaker",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tomb of Annihilation",
    name: "Yuan-ti Nightmare Speaker",
    size: "medium",
    type: "monstrosity",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 6,
    ac: 14,
    acNote: "natural armor",
    hp: 119,
    maxHp: 119,
    abilityScores: {
      strength: 16, dexterity: 14, constitution: 17,
      intelligence: 16, wisdom: 16, charisma: 17
    },
    skills: { Deception: 5, Religion: 5, Stealth: 4 },
    damageImmunities: ["poison"],
    conditionImmunities: ["poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["Abyssal", "Common", "Draconic"],
    traits: [
      { name: "Innate Spellcasting (Psionics)", description: "The nightmare speaker's spellcasting ability is Charisma (spell save DC 15, +7 to hit with spell attacks). At will: friends, suggestion. 1/day each: charm person, detect thoughts, hold person, suggestion." },
      { name: "Magic Resistance", description: "The nightmare speaker has advantage on saving throws against spells and other magical effects." }
    ],
    actions: [
      { name: "Multiattack", description: "The nightmare speaker makes two Constrict attacks and one Scimitar attack." },
      {
        name: "Constrict",
        description: "Melee Weapon Attack",
        attackBonus: 6,
        damageDescription: "7 (1d8 + 3) bludgeoning damage, and the target is grappled (escape DC 14)."
      },
      {
        name: "Scimitar",
        description: "Melee Weapon Attack",
        attackBonus: 6,
        damageDescription: "5 (1d6 + 2) slashing damage plus 10 (3d6) poison damage."
      }
    ]
  },
  {
    id: "cm-ras-nsi",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tomb of Annihilation",
    name: "Ras Nsi",
    size: "medium",
    type: "monstrosity",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 8,
    ac: 16,
    acNote: "breastplate",
    hp: 168,
    maxHp: 168,
    abilityScores: {
      strength: 17, dexterity: 14, constitution: 18,
      intelligence: 16, wisdom: 14, charisma: 18
    },
    savingThrows: { dexterity: 6, constitution: 8, wisdom: 6, charisma: 8 },
    skills: { Deception: 8, Insight: 6, Persuasion: 8, Religion: 7 },
    damageImmunities: ["poison"],
    conditionImmunities: ["poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["Abyssal", "Common", "Draconic"],
    description: "The cursed paladin turned yuan-ti exarch who guards the Fane of the Night Serpent. Sealed in 189 DR after defying Ubtao.",
    traits: [
      { name: "Innate Spellcasting", description: "Ras Nsi's spellcasting ability is Charisma (spell save DC 16, +8 to hit with spell attacks). At will: command, friends, guidance. 3/day each: bestow curse, dominate person, suggestion. 1/day: divine word." },
      { name: "Magic Resistance", description: "Ras Nsi has advantage on saving throws against spells and other magical effects." },
      { name: "Sacred Oath", description: "Ras Nsi retains vestiges of his paladin oath; he can use his reaction to add 3 to the AC of an ally within 5 ft. of an attacker he can see." }
    ],
    actions: [
      { name: "Multiattack", description: "Ras Nsi makes three attacks: one Constrict, one Longsword, and one Poison Spit." },
      {
        name: "Constrict",
        description: "Melee Weapon Attack",
        attackBonus: 7,
        damageDescription: "8 (1d8 + 4) bludgeoning damage, and the target is grappled (escape DC 15). While grappled, the target takes 14 (4d6) poison damage at the start of each of Ras Nsi's turns."
      },
      {
        name: "Longsword",
        description: "Melee Weapon Attack",
        attackBonus: 7,
        damageDescription: "7 (1d8 + 3) slashing damage, or 8 (1d10 + 3) if used two-handed."
      },
      {
        name: "Poison Spit",
        description: "Ranged Weapon Attack",
        attackBonus: 7,
        damageDescription: "17 (5d6) poison damage."
      }
    ]
  },
  // SRD-faithful mirrors for Tomb of Annihilation encounters
  {
    id: "cm-atropal",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tomb of Annihilation",
    name: "Atropal",
    size: "tiny",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "0 ft., fly 40 ft. (hover)",
    challengeRating: 13,
    ac: 17,
    acNote: "natural armor",
    hp: 200,
    maxHp: 200,
    abilityScores: {
      strength: 8, dexterity: 18, constitution: 18,
      intelligence: 16, wisdom: 16, charisma: 18
    },
    savingThrows: { dexterity: 8, constitution: 8, wisdom: 7 },
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "petrified", "poisoned", "stunned"],
    senses: { truesight: "120 ft.", "passive Perception": "13" },
    languages: ["understands the languages it knew in life but can't speak"],
    description: "The undead fetus of a dead god, used by Acererak to power the Soulmonger.",
    traits: [
      { name: "Damage Absorption", description: "When the atropal is hit by an attack that deals necrotic damage, it regains hit points equal to half the necrotic damage dealt." },
      { name: "Magic Resistance", description: "The atropal has advantage on saving throws against spells and other magical effects." },
      { name: "Spellcasting", description: "The atropal is a 10th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 17, +9 to hit with spell attacks). At will: detect magic, mage hand. 3/day each: counterspell, dispel magic. 1/day each: finger of death, power word kill." }
    ],
    actions: [
      {
        name: "Withering Touch",
        description: "Melee Spell Attack",
        attackBonus: 9,
        damageDescription: "16 (3d8 + 3) necrotic damage. The target must succeed on a DC 17 Constitution saving throw or have its hit point maximum reduced by an amount equal to the damage taken."
      },
      {
        name: "Life Drain (Recharge 5-6)",
        description: "The atropal targets one creature within 60 ft. The target makes a DC 17 Constitution saving throw, taking 45 (10d8) necrotic damage on a failure, or half on a success. A humanoid slain this way rises as a wraith under the atropal's control."
      }
    ]
  },
  {
    id: "cm-bodak",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tomb of Annihilation",
    name: "Bodak",
    size: "medium",
    type: "undead",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 6,
    ac: 14,
    acNote: "natural armor",
    hp: 97,
    maxHp: 97,
    abilityScores: {
      strength: 15, dexterity: 16, constitution: 16,
      intelligence: 7, wisdom: 12, charisma: 12
    },
    skills: { Stealth: 6 },
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "frightened", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: ["understands the languages it knew in life but can't speak"],
    traits: [
      { name: "Aura of Annihilation", description: "A creature that starts its turn within 30 ft. of the bodak must succeed on a DC 14 Constitution saving throw or take 16 (3d10) necrotic damage and have its hit point maximum reduced by the same amount." },
      { name: "Death Gaze", description: "When a creature the bodak can see starts its turn within 30 ft., the bodak can force it to make a DC 14 Constitution saving throw if the bodak isn't incapacitated and can see the creature. On a failure, the creature takes 16 (3d10) necrotic damage and is blinded until the start of its next turn." },
      { name: "Sunlight Sensitivity", description: "While in sunlight, the bodak has disadvantage on attack rolls, and on Wisdom (Perception) checks that rely on sight." }
    ],
    actions: [
      {
        name: "Slam",
        description: "Melee Weapon Attack",
        attackBonus: 6,
        damageDescription: "8 (1d10 + 3) bludgeoning damage plus 9 (2d8) necrotic damage."
      }
    ]
  },
  {
    id: "cm-skeleton",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tomb of Annihilation",
    name: "Skeleton",
    size: "medium",
    type: "undead",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 0.25,
    ac: 13,
    acNote: "armor scraps",
    hp: 13,
    maxHp: 13,
    abilityScores: {
      strength: 10, dexterity: 14, constitution: 15,
      intelligence: 6, wisdom: 8, charisma: 5
    },
    damageVulnerabilities: ["bludgeoning"],
    damageImmunities: ["poison"],
    conditionImmunities: ["exhaustion", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "9" },
    languages: ["understands all languages it knew in life but can't speak"],
    traits: [],
    actions: [
      { name: "Multiattack", description: "The skeleton makes two Shortsword attacks. It can use its bow instead of two melee attacks if it has one." },
      { name: "Shortsword", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "5 (1d6 + 2) piercing damage." }
    ]
  },
  // ─── Lost Mine of Phandelver ──────────────────────────────────────────────
  {
    id: "cm-goblin",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Lost Mine of Phandelver",
    name: "Goblin",
    size: "small",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 0.25,
    ac: 15,
    acNote: "leather armor, shield",
    hp: 7,
    maxHp: 7,
    abilityScores: {
      strength: 8, dexterity: 14, constitution: 10,
      intelligence: 10, wisdom: 8, charisma: 8
    },
    skills: { Stealth: 6 },
    senses: { darkvision: "60 ft.", "passive Perception": "9" },
    languages: ["Common", "Goblin"],
    traits: [
      { name: "Nimble Escape", description: "The goblin can disengage or hide as a bonus action on each of its turns." }
    ],
    actions: [
      { name: "Multiattack", description: "The goblin makes two attacks with its Shortsword. It can use its Shortbow instead of two melee attacks if it has one." },
      { name: "Shortsword", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "5 (1d6 + 2) piercing damage." },
      { name: "Shortbow", description: "Ranged Weapon Attack", attackBonus: 4, damageDescription: "5 (1d6 + 2) piercing damage." }
    ]
  },
  {
    id: "cm-bugbear-chief",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Lost Mine of Phandelver",
    name: "Bugbear Chief",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 3,
    ac: 17,
    acNote: "hide armor, shield",
    hp: 65,
    maxHp: 65,
    abilityScores: {
      strength: 17, dexterity: 14, constitution: 14,
      intelligence: 11, wisdom: 12, charisma: 11
    },
    skills: { Intimidation: 2, Stealth: 6, Survival: 3 },
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: ["Common", "Goblin"],
    traits: [
      { name: "Brute", description: "A melee weapon deals one extra die of damage on a hit (included in the attack)." },
      { name: "Heart of Hruggek", description: "The bugbear has advantage on saving throws against being charmed, frightened, paralyzed, poisoned, stunned, or put to sleep." },
      { name: "Surprise Attack", description: "If the bugbear surprises a creature and hits it with a melee attack during the first round of combat, the attack deals an extra 7 (2d6) damage." }
    ],
    actions: [
      { name: "Multiattack", description: "The bugbear makes two Morningstar attacks." },
      { name: "Morningstar", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "11 (2d8 + 2) piercing damage." }
    ]
  },
  {
    id: "cm-bandit",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Lost Mine of Phandelver",
    name: "Bandit",
    size: "medium",
    type: "humanoid",
    alignment: "Any Non-Lawful Alignment",
    speed: "30 ft.",
    challengeRating: 0.125,
    ac: 12,
    acNote: "leather armor",
    hp: 11,
    maxHp: 11,
    abilityScores: {
      strength: 11, dexterity: 12, constitution: 12,
      intelligence: 10, wisdom: 10, charisma: 10
    },
    senses: { "passive Perception": "10" },
    languages: ["any one language (usually Common)"],
    traits: [],
    actions: [
      { name: "Scimitar", description: "Melee Weapon Attack", attackBonus: 3, damageDescription: "4 (1d6 + 1) slashing damage." },
      { name: "Light Crossbow", description: "Ranged Weapon Attack", attackBonus: 3, damageDescription: "5 (1d8 + 1) piercing damage." }
    ]
  },
  {
    id: "cm-bandit-captain",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Lost Mine of Phandelver",
    name: "Bandit Captain",
    size: "medium",
    type: "humanoid",
    alignment: "Any Non-Lawful Alignment",
    speed: "30 ft.",
    challengeRating: 2,
    ac: 15,
    acNote: "studded leather",
    hp: 65,
    maxHp: 65,
    abilityScores: {
      strength: 15, dexterity: 16, constitution: 14,
      intelligence: 14, wisdom: 11, charisma: 14
    },
    savingThrows: { strength: 4, dexterity: 5, wisdom: 2 },
    skills: { Athletics: 4, Deception: 4 },
    senses: { "passive Perception": "10" },
    languages: ["any two languages"],
    traits: [],
    actions: [
      { name: "Multiattack", description: "The captain makes three melee attacks: two with its scimitar and one with its dagger. Or three with its dagger." },
      { name: "Scimitar", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "6 (1d6 + 3) slashing damage." },
      { name: "Dagger", description: "Melee or Ranged Weapon Attack", attackBonus: 5, damageDescription: "5 (1d4 + 3) piercing damage." }
    ],
    reactions: [
      { name: "Parry", description: "The captain adds 2 to its AC against one melee attack that would hit it. To do so, the captain must see the attacker and be wielding a melee weapon." }
    ]
  },
  {
    id: "cm-mage",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Lost Mine of Phandelver",
    name: "Mage",
    size: "medium",
    type: "humanoid",
    alignment: "Any Alignment",
    speed: "30 ft.",
    challengeRating: 6,
    ac: 12,
    acNote: "15 with mage armor",
    hp: 40,
    maxHp: 40,
    abilityScores: {
      strength: 9, dexterity: 14, constitution: 11,
      intelligence: 17, wisdom: 12, charisma: 11
    },
    savingThrows: { intelligence: 6, wisdom: 4 },
    skills: { Arcana: 6, History: 6 },
    senses: { "passive Perception": "11" },
    languages: ["any four languages"],
    traits: [
      { name: "Spellcasting", description: "The mage is a 9th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 14, +6 to hit with spell attacks). At will: light, mage hand. 3/day each: detect magic, fireball, counterspell, misty step. 1/day each: cone of cold, dispel magic, fire bolt, shield." }
    ],
    actions: [
      { name: "Dagger", description: "Melee or Ranged Weapon Attack", attackBonus: 4, damageDescription: "4 (1d4 + 2) piercing damage." }
    ]
  },
  {
    id: "cm-doppelganger",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Lost Mine of Phandelver",
    name: "Doppelganger",
    size: "medium",
    type: "monstrosity",
    alignment: "Neutral",
    speed: "30 ft.",
    challengeRating: 3,
    ac: 14,
    hp: 52,
    maxHp: 52,
    abilityScores: {
      strength: 11, dexterity: 18, constitution: 12,
      intelligence: 11, wisdom: 12, charisma: 14
    },
    skills: { Deception: 6, Insight: 3 },
    conditionImmunities: ["charmed"],
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: ["Common"],
    traits: [
      { name: "Shapechanger", description: "The doppelganger can use its action to polymorph into a humanoid it has seen, or back into its true form. Its statistics, other than its size and speed, are the same in each form. Equipment it is wearing transforms with it." },
      { name: "Ambusher", description: "The doppelganger has advantage on attack rolls against any creature it has surprised." }
    ],
    actions: [
      { name: "Multiattack", description: "The doppelganger makes two attacks." },
      { name: "Slam", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "7 (1d6 + 4) bludgeoning damage. If the target is a creature, it must succeed on a DC 14 Wisdom saving throw or be knocked unconscious. The target wakes up at the start of the doppelganger's next turn." }
    ]
  },
  {
    id: "cm-green-hag",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Lost Mine of Phandelver",
    name: "Green Hag",
    size: "medium",
    type: "fey",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 3,
    ac: 17,
    acNote: "natural armor",
    hp: 82,
    maxHp: 82,
    abilityScores: {
      strength: 18, dexterity: 12, constitution: 16,
      intelligence: 13, wisdom: 14, charisma: 14
    },
    skills: { Arcana: 3, Deception: 4, Perception: 4, Stealth: 3 },
    senses: { "passive Perception": "14" },
    languages: ["Common, Giant, Sylvan"],
    traits: [
      { name: "Innate Spellcasting", description: "The hag's innate spellcasting ability is Charisma (spell save DC 12). At will: druidcraft, minor illusion. 1/day each: charm person, comprehend languages, detect thoughts, invisibility, speak with animals, water breathing." },
      { name: "Mimicry", description: "The hag can mimic animal sounds and humanoid voices. A creature that hears the sounds can tell they are imitations with a successful DC 14 Wisdom (Insight) check." }
    ],
    actions: [
      { name: "Multiattack", description: "The hag makes two Claws attacks." },
      { name: "Claws", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "13 (2d8 + 4) slashing damage." },
      { name: "Illusory Appearance", description: "The hag covers herself and anything she is wearing or carrying with a magical illusion that makes her look like an attractive creature of her general size and humanoid shape. The illusion ends if the hag takes a bonus action to end it or is incapacitated." }
    ]
  },
  {
    id: "cm-wyvern",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Lost Mine of Phandelver",
    name: "Wyvern",
    size: "large",
    type: "dragon",
    alignment: "Unaligned",
    speed: "20 ft., fly 80 ft.",
    challengeRating: 6,
    ac: 13,
    acNote: "natural armor",
    hp: 110,
    maxHp: 110,
    abilityScores: {
      strength: 19, dexterity: 10, constitution: 16,
      intelligence: 5, wisdom: 12, charisma: 6
    },
    skills: { Perception: 4 },
    senses: { darkvision: "60 ft.", "passive Perception": "14" },
    languages: ["understands Draconic but can't speak"],
    traits: [],
    actions: [
      { name: "Multiattack", description: "The wyvern makes two attacks: one Bite and one Stinger." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "11 (2d6 + 4) piercing damage." },
      {
        name: "Stinger",
        description: "Melee Weapon Attack",
        attackBonus: 7,
        damageDescription: "11 (2d6 + 4) piercing damage. The target must make a DC 15 Constitution saving throw, taking 24 (7d6) poison damage on a failed save, or half as much damage on a successful one. If the target is reduced to 0 HP by this damage, it rises as a ghoul under the wyvern's control."
      }
    ]
  },
  {
    id: "cm-orc",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Lost Mine of Phandelver",
    name: "Orc",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 0.5,
    ac: 13,
    acNote: "hide armor",
    hp: 15,
    maxHp: 15,
    abilityScores: {
      strength: 16, dexterity: 12, constitution: 16,
      intelligence: 7, wisdom: 11, charisma: 10
    },
    skills: { Intimidation: 2 },
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: ["Common", "Orc"],
    traits: [
      { name: "Aggressive", description: "As a bonus action, the orc can move up to its speed toward a hostile creature it can see." }
    ],
    actions: [
      { name: "Greataxe", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "9 (1d12 + 3) slashing damage." },
      { name: "Javelin", description: "Melee or Ranged Weapon Attack", attackBonus: 5, damageDescription: "5 (1d6 + 2) piercing damage." }
    ]
  },
  {
    id: "cm-drow-mage",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Lost Mine of Phandelver",
    name: "Drow Mage",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 7,
    ac: 15,
    acNote: "studded leather",
    hp: 45,
    maxHp: 45,
    abilityScores: {
      strength: 10, dexterity: 18, constitution: 14,
      intelligence: 20, wisdom: 13, charisma: 11
    },
    savingThrows: { intelligence: 9, wisdom: 6 },
    skills: { Arcana: 9, Deception: 3, Perception: 6, Stealth: 7 },
    damageImmunities: ["poison"],
    conditionImmunities: ["poisoned"],
    senses: { darkvision: "120 ft.", truesight: "30 ft.", "passive Perception": "16" },
    languages: ["Common", "Elvish", "Undercommon"],
    traits: [
      { name: "Fey Ancestry", description: "The drow has advantage on saving throws against being charmed, and magic can't put it to sleep." },
      { name: "Innate Spellcasting", description: "Innate spellcasting ability is Charisma (spell save DC 12). At will: dancing lights. 1/day each: darkness, faerie fire." },
      { name: "Spellcasting", description: "The drow mage is a 10th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 17, +9 to hit with spell attacks). At will: light, mage hand, ray of frost. 3/day each: counterspell, dispel magic, fireball. 1/day each: confusion, detect magic, shield." }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The drow mage makes two attacks: one with its dagger and one with its shortbow."
      },
      { name: "Dagger", description: "Melee or Ranged Weapon Attack", attackBonus: 7, damageDescription: "5 (1d4 + 3) piercing damage plus 10 (3d6) poison damage." },
      {
        name: "Shortbow",
        description: "Ranged Weapon Attack",
        attackBonus: 7,
        damageDescription: "6 (1d6 + 3) piercing damage plus 3 (1d6) poison damage."
      }
    ]
  },
  {
    id: "cm-spectator",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Lost Mine of Phandelver",
    name: "Spectator",
    size: "medium",
    type: "aberration",
    alignment: "Lawful Neutral",
    speed: "0 ft., fly 30 ft. (hover)",
    challengeRating: 3,
    ac: 14,
    acNote: "natural armor",
    hp: 39,
    maxHp: 39,
    abilityScores: {
      strength: 8, dexterity: 14, constitution: 14,
      intelligence: 13, wisdom: 14, charisma: 11
    },
    skills: { Perception: 4 },
    conditionImmunities: ["prone"],
    senses: { darkvision: "60 ft.", "passive Perception": "14" },
    languages: ["Deep Speech", "Undercommon"],
    traits: [
      { name: "Magic Resistance", description: "The spectator has advantage on saving throws against spells and other magical effects." },
      { name: "Spell Reflection", description: "If the spectator is targeted by a spell, it can use its reaction to make the attack target a different creature within 30 ft. it can see." }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The spectator makes two Eye Ray attacks and one Bite attack."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack",
        attackBonus: 4,
        damageDescription: "5 (1d6 + 2) piercing damage."
      },
      {
        name: "Eye Ray Charm",
        description: "One creature the spectator can see within 90 ft. must succeed on a DC 13 Wisdom saving throw or be charmed for 1 minute."
      },
      {
        name: "Eye Ray Fear",
        description: "One creature the spectator can see within 90 ft. must succeed on a DC 13 Wisdom saving throw or be frightened for 1 minute."
      },
      {
        name: "Eye Ray Blinding",
        description: "One creature the spectator can see within 90 ft. must succeed on a DC 13 Constitution saving throw or be blinded until the end of its next turn."
      },
      {
        name: "Eye Ray Wounding",
        description: "One creature the spectator can see within 90 ft. must succeed on a DC 13 Constitution saving throw or take 9 (2d8) radiant damage."
      },
      {
        name: "Create Food and Water",
        description: "The spectator magically creates enough food and water to sustain itself and three other Medium creatures for 24 hours."
      }
    ]
  },
  {
    id: "cm-young-green-dragon",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Lost Mine of Phandelver",
    name: "Young Green Dragon",
    description: "Venomfang, a young green dragon who has taken over the ruined village of Thundertree.",
    size: "large",
    type: "dragon",
    alignment: "Lawful Evil",
    speed: "40 ft., fly 80 ft., swim 40 ft.",
    challengeRating: 8,
    ac: 18,
    acNote: "natural armor",
    hp: 136,
    maxHp: 136,
    abilityScores: {
      strength: 19, dexterity: 12, constitution: 17,
      intelligence: 16, wisdom: 13, charisma: 15
    },
    savingThrows: { dexterity: 4, constitution: 6, wisdom: 4, charisma: 5 },
    skills: { Deception: 5, Perception: 7, Stealth: 4 },
    damageImmunities: ["poison"],
    conditionImmunities: ["poisoned"],
    senses: { blindsight: "30 ft.", darkvision: "120 ft.", "passive Perception": "17" },
    languages: ["Common", "Draconic"],
    traits: [
      { name: "Amphibious", description: "The dragon can breathe air and water." }
    ],
    actions: [
      { name: "Multiattack", description: "The dragon makes three attacks: one Bite and two Claws." },
      {
        name: "Bite",
        description: "Melee Weapon Attack",
        attackBonus: 7,
        damageDescription: "15 (2d10 + 4) piercing damage plus 7 (2d6) poison damage."
      },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "11 (2d6 + 4) slashing damage." },
      {
        name: "Poison Breath (Recharge 5-6)",
        description: "The dragon exhales poisonous gas in a 30-foot cone. Each creature in that area must make a DC 14 Constitution saving throw, taking 42 (12d6) poison damage on a failed save, or half as much damage on a successful one."
      }
    ]
  },
  // ─── Tyranny of Dragons ───────────────────────────────────────────────────
  {
    id: "cm-langdedrosa-cyanwrath",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tyranny of Dragons",
    name: "Langdedrosa Cyanwrath",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 8,
    ac: 18,
    acNote: "half plate",
    hp: 152,
    maxHp: 152,
    abilityScores: {
      strength: 19, dexterity: 13, constitution: 18,
      intelligence: 12, wisdom: 12, charisma: 15
    },
    savingThrows: { strength: 7, constitution: 7, wisdom: 4 },
    skills: { Athletics: 7, Intimidation: 5, Perception: 4 },
    senses: { "passive Perception": "14" },
    languages: ["Common", "Draconic"],
    description: "A half-blue-dragon veteran who serves the Cult of the Dragon. Cyanwrath leads the assault on Greenest.",
    traits: [
      { name: "Draconic Ancestry", description: "Cyanwrath's breath weapon deals lightning damage and uses a DC 15 Dexterity save." },
      { name: "Half-Dragon", description: "Cyanwrath has resistance to lightning damage and immunity to poison." }
    ],
    actions: [
      { name: "Multiattack", description: "Cyanwrath makes three attacks: one with his bite and two with his warhammer, or two with his warhammer and one Lightning Breath." },
      {
        name: "Warhammer",
        description: "Melee Weapon Attack",
        attackBonus: 7,
        damageDescription: "10 (1d8 + 6) bludgeoning damage, or 11 (1d10 + 6) if used two-handed."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack",
        attackBonus: 7,
        damageDescription: "10 (2d4 + 6) piercing damage."
      },
      {
        name: "Lightning Breath (Recharge 5-6)",
        description: "Cyanwrath exhales lightning in a 30-foot line that is 5 feet wide. Each creature in that line must make a DC 15 Dexterity saving throw, taking 33 (6d10) lightning damage on a failed save, or half as much damage on a successful one."
      }
    ]
  },
  {
    id: "cm-frulam-mondath",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tyranny of Dragons",
    name: "Frulam Mondath",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 6,
    ac: 15,
    acNote: "Mage Armor",
    hp: 88,
    maxHp: 88,
    abilityScores: {
      strength: 9, dexterity: 14, constitution: 16,
      intelligence: 17, wisdom: 14, charisma: 12
    },
    savingThrows: { intelligence: 6, wisdom: 5 },
    skills: { Arcana: 6, History: 6, Religion: 5 },
    senses: { "passive Perception": "12" },
    languages: ["Common", "Draconic", "Infernal"],
    description: "A Red Wizard of Thay leading the Cult of the Dragon's raider camp. Mondath gathers Tiamat's treasure.",
    traits: [
      { name: "Spellcasting", description: "Mondath is a 9th-level spellcaster. Her spellcasting ability is Intelligence (spell save DC 14, +6 to hit with spell attacks). At will: light, mage hand. 3/day each: fireball, counterspell, hold person. 1/day each: cone of cold, fire shield, lightning bolt." }
    ],
    actions: [
      { name: "Dagger", description: "Melee or Ranged Weapon Attack", attackBonus: 4, damageDescription: "4 (1d4 + 2) piercing damage." }
    ]
  },
  {
    id: "cm-rezmir",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tyranny of Dragons",
    name: "Rezmir",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 8,
    ac: 18,
    acNote: "half plate",
    hp: 152,
    maxHp: 152,
    abilityScores: {
      strength: 17, dexterity: 13, constitution: 18,
      intelligence: 14, wisdom: 14, charisma: 17
    },
    savingThrows: { strength: 6, constitution: 7, wisdom: 5 },
    skills: { Athletics: 6, Intimidation: 6, Perception: 5, Persuasion: 6 },
    senses: { "passive Perception": "15" },
    languages: ["Common", "Draconic"],
    description: "A half-black-dragon veteran who commands Castle Naerytar as Wyrmspeaker of the Cult of the Dragon.",
    traits: [
      { name: "Draconic Ancestry", description: "Rezmir's breath weapon deals acid damage and uses a DC 15 Dexterity save." },
      { name: "Half-Dragon", description: "Rezmir has resistance to acid damage and immunity to poison." }
    ],
    actions: [
      { name: "Multiattack", description: "Rezmir makes three attacks: one with her bite and two with her long sword, or two with her long sword and one Acid Breath." },
      {
        name: "Longsword",
        description: "Melee Weapon Attack",
        attackBonus: 6,
        damageDescription: "7 (1d8 + 3) slashing damage, or 8 (1d10 + 3) if used two-handed."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack",
        attackBonus: 6,
        damageDescription: "9 (2d4 + 5) piercing damage."
      },
      {
        name: "Acid Breath (Recharge 5-6)",
        description: "Rezmir exhales acid in a 30-foot cone. Each creature in that area must make a DC 15 Dexterity saving throw, taking 49 (6d12 + 8) acid damage on a failed save, or half as much damage on a successful one."
      }
    ]
  },
  {
    id: "cm-severin",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tyranny of Dragons",
    name: "Severin, the Wyrmspeaker",
    size: "medium",
    type: "undead",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 17,
    ac: 20,
    acNote: "plate armor, shield",
    hp: 230,
    maxHp: 230,
    abilityScores: {
      strength: 20, dexterity: 11, constitution: 20,
      intelligence: 16, wisdom: 14, charisma: 18
    },
    savingThrows: { constitution: 10, wisdom: 7, charisma: 9 },
    skills: { Intimidation: 9, Religion: 7 },
    damageResistances: ["necrotic"],
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "12" },
    languages: ["Common", "Draconic", "Infernal"],
    description: "Death-knight leader of the Cult of the Dragon who seeks to summon Tiamat to the Material Plane.",
    traits: [
      { name: "Damage Resistance (Non-Silvered Nonmagical)", description: "Severin takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical and not silvered." },
      { name: "Legendary Resistance (3/Day)", description: "If Severin fails a saving throw, he can choose to succeed instead." },
      { name: "Magic Resistance", description: "Severin has advantage on saving throws against spells and other magical effects." },
      { name: "Marshal Undead", description: "Undead allies within 60 ft. of Severin have advantage on saving throws and can't be charmed or frightened." },
      { name: "Spellcasting", description: "Severin is a 13th-level spellcaster. His spellcasting ability is Charisma (spell save DC 17, +9 to hit with spell attacks). At will: detect magic, light. 3/day each: command, dispel magic. 1/day each: animate dead, bestow curse, dominate person, fireball." }
    ],
    actions: [
      { name: "Multiattack", description: "Severin makes three Longsword or Hellfire Orb attacks." },
      {
        name: "Longsword",
        description: "Melee Weapon Attack",
        attackBonus: 10,
        damageDescription: "11 (2d8 + 3) slashing damage, or 12 (2d10 + 3) if two-handed, plus 10 (3d6) necrotic damage."
      },
      {
        name: "Hellfire Orb (Recharge 5-6)",
        description: "Severin hurls a ball of hellfire at a point within 120 ft. Each creature in a 20-foot radius makes a DC 18 Dexterity save, taking 28 (8d6) fire damage and 28 (8d6) necrotic damage on a failure, or half on a success."
      }
    ],
    legendaryActions: [
      { name: "Attack", description: "Severin makes one Longsword attack." },
      { name: "Spellcasting", description: "Severin casts one of his prepared spells." },
      { name: "Terror (Costs 2 Actions)", description: "Each creature of Severin's choice within 30 ft. makes a DC 18 Wisdom save or is frightened until the end of its next turn." }
    ]
  },
  {
    id: "cm-rath-modar",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tyranny of Dragons",
    name: "Rath Modar",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 12,
    ac: 17,
    acNote: "Mage Armor + bracers",
    hp: 130,
    maxHp: 130,
    abilityScores: {
      strength: 11, dexterity: 14, constitution: 14,
      intelligence: 20, wisdom: 17, charisma: 13
    },
    savingThrows: { intelligence: 9, wisdom: 7 },
    skills: { Arcana: 13, History: 9, Insight: 7, Perception: 7 },
    senses: { truesight: "30 ft.", "passive Perception": "17" },
    languages: ["Common", "Draconic", "Infernal", "Thayan"],
    description: "A Red Wizard archmage and Szass Tam's lieutenant. Rath Modar advises Severin on the summoning of Tiamat.",
    traits: [
      { name: "Spellcasting", description: "Rath Modar is a 17th-level spellcaster. His spellcasting ability is Intelligence (spell save DC 17, +9 to hit with spell attacks). At will: detect magic, light, mage hand. 3/day each: counterspell, dispel magic, fireball. 1/day each: Bigby's hand, hold monster, plane shift, teleport, wall of force." },
      { name: "Magic Resistance", description: "Rath Modar has advantage on saving throws against spells and other magical effects." }
    ],
    actions: [
      {
        name: "Acid Splash",
        description: "Ranged Spell Attack",
        attackBonus: 9,
        damageDescription: "16 (3d10) acid damage."
      }
    ]
  },
  {
    id: "cm-talis-the-white",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tyranny of Dragons",
    name: "Talis the White",
    size: "huge",
    type: "dragon",
    alignment: "Lawful Good",
    speed: "40 ft., fly 80 ft.",
    challengeRating: 16,
    ac: 19,
    acNote: "natural armor",
    hp: 243,
    maxHp: 243,
    abilityScores: {
      strength: 27, dexterity: 10, constitution: 25,
      intelligence: 16, wisdom: 13, charisma: 17
    },
    savingThrows: { dexterity: 5, constitution: 12, wisdom: 6, charisma: 8 },
    skills: { Perception: 9, Persuasion: 8, Stealth: 5 },
    damageImmunities: ["cold"],
    senses: { blindsight: "30 ft.", darkvision: "120 ft.", "passive Perception": "19" },
    languages: ["Common", "Draconic", "Sylvan"],
    description: "Adult silver dragon ally who joins the Council of Dragons against Tiamat.",
    traits: [
      { name: "Ice Walk", description: "The dragon can move across and climb icy surfaces without needing to make an ability check." }
    ],
    actions: [
      { name: "Multiattack", description: "The dragon makes three attacks: one Bite and two Claws." },
      {
        name: "Bite",
        description: "Melee Weapon Attack",
        attackBonus: 14,
        damageDescription: "19 (2d10 + 8) piercing damage."
      },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 14, damageDescription: "15 (2d6 + 8) slashing damage." },
      {
        name: "Frost Breath (Recharge 5-6)",
        description: "The dragon exhales an icy blast in a 60-foot cone. Each creature in that area must make a DC 20 Constitution saving throw, taking 54 (12d8) cold damage on a failed save, or half as much damage on a successful one."
      },
      {
        name: "Paralyzing Breath (Recharge 4-6)",
        description: "The dragon exhales paralyzing gas in a 30-foot cone. Each creature in that area must succeed on a DC 20 Constitution saving throw or be paralyzed for 1 minute."
      }
    ],
    legendaryActions: [
      { name: "Frost Breath", description: "The dragon uses Frost Breath if it is recharged. Otherwise it makes one Claw or Bite attack." },
      { name: "Detect", description: "The dragon makes a Wisdom (Perception) check." },
      { name: "Wing Attack (Costs 2 Actions)", description: "The dragon beats its wings. Each creature within 10 ft. must succeed on a DC 20 Dexterity saving throw or take 13 (2d6 + 8) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed." }
    ]
  },
  {
    id: "cm-tiamat",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tyranny of Dragons",
    name: "Tiamat, Queen of Evil Dragons",
    size: "gargantuan",
    type: "fiend",
    alignment: "Lawful Evil",
    speed: "20 ft., fly 120 ft.",
    challengeRating: 30,
    ac: 25,
    acNote: "natural armor",
    hp: 615,
    maxHp: 615,
    abilityScores: {
      strength: 27, dexterity: 10, constitution: 25,
      intelligence: 26, wisdom: 16, charisma: 26
    },
    savingThrows: { constitution: 14, intelligence: 16, wisdom: 9, charisma: 16 },
    skills: { Perception: 9 },
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["blinded", "charmed", "exhaustion", "frightened", "paralyzed", "petrified", "poisoned", "stunned"],
    senses: { blindsight: "120 ft.", darkvision: "240 ft.", truesight: "30 ft.", "passive Perception": "26" },
    languages: ["All", "telepathy 240 ft."],
    description: "The five-headed dragon goddess of evil, manifested at the Well of Dragons for the campaign's climax.",
    traits: [
      { name: "Damage Immunity (Nonmagical)", description: "Tiamat takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical." },
      { name: "Legendary Resistance (5/Day)", description: "If Tiamat fails a saving throw, she can choose to succeed instead." },
      { name: "Magic Resistance", description: "Tiamat has advantage on saving throws against spells and other magical effects." }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Tiamat makes five attacks: one with each head using either a Bite or one of her breath weapons."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack",
        attackBonus: 17,
        damageDescription: "21 (2d10 + 10) piercing damage plus 14 (4d6) of one of the following damage types (chosen per head): acid, cold, fire, lightning, or poison."
      },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 17, damageDescription: "17 (2d8 + 8) slashing damage." },
      {
        name: "Five-Breath Attack (Recharge 5-6)",
        description: "Tiamat breathes fire, cold, lightning, acid, and poison in a 120-foot line, 120-foot cone, 120-foot line, 120-foot cone, and 120-foot line respectively. Each creature in each area makes a DC 24 Dexterity save, taking 26 (12d10) damage of the relevant type on a failure, or half on a success."
      }
    ],
    legendaryActions: [
      { name: "Bite Attack", description: "Tiamat makes one bite attack with one of her heads." },
      { name: "Claw Attack", description: "Tiamat makes one claw attack." },
      { name: "Wing Attack (Costs 2 Actions)", description: "Tiamat beats her wings. Each creature within 20 ft. makes a DC 25 Strength save or is knocked prone and pushed 30 ft. away. Tiamat can then fly up to half her speed." }
    ]
  },
  {
    id: "cm-blagothkus",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tyranny of Dragons",
    name: "Blagothkus",
    size: "huge",
    type: "giant",
    alignment: "Neutral Evil",
    speed: "40 ft.",
    challengeRating: 9,
    ac: 14,
    acNote: "natural armor",
    hp: 168,
    maxHp: 168,
    abilityScores: {
      strength: 27, dexterity: 10, constitution: 22,
      intelligence: 10, wisdom: 12, charisma: 12
    },
    savingThrows: { strength: 13, constitution: 10 },
    skills: { Insight: 4, Intimidation: 4, Perception: 4 },
    damageResistances: ["cold"],
    senses: { "passive Perception": "14" },
    languages: ["Common", "Giant"],
    description: "A cloud giant warlord who rules Skyreach Castle and uses a roc egg to power his castle.",
    traits: [
      { name: "Keen Smell", description: "Blagothkus has advantage on Wisdom (Perception) checks that rely on smell." }
    ],
    actions: [
      { name: "Multiattack", description: "Blagothkus makes two Morningstar attacks." },
      {
        name: "Morningstar",
        description: "Melee Weapon Attack",
        attackBonus: 13,
        damageDescription: "29 (4d8 + 9) piercing damage."
      },
      {
        name: "Rock",
        description: "Ranged Weapon Attack",
        attackBonus: 13,
        damageDescription: "35 (7d6 + 9) bludgeoning damage."
      }
    ]
  },
  {
    id: "cm-dragonclaw",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tyranny of Dragons",
    name: "Dragonclaw",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 3,
    ac: 18,
    acNote: "scale mail, shield",
    hp: 58,
    maxHp: 58,
    abilityScores: {
      strength: 16, dexterity: 11, constitution: 16,
      intelligence: 11, wisdom: 12, charisma: 13
    },
    skills: { Athletics: 5, Intimidation: 3 },
    senses: { "passive Perception": "11" },
    languages: ["Common", "Draconic"],
    description: "A mid-ranking cult warrior of the Cult of the Dragon armed with a greataxe and shield.",
    traits: [
      { name: "Draconic Worship", description: "Dragonclaws have advantage on saving throws against being frightened by dragons." }
    ],
    actions: [
      { name: "Multiattack", description: "The dragonclaw makes two Greataxe attacks." },
      {
        name: "Greataxe",
        description: "Melee Weapon Attack",
        attackBonus: 5,
        damageDescription: "12 (1d12 + 5) slashing damage."
      },
      { name: "Javelin", description: "Melee or Ranged Weapon Attack", attackBonus: 5, damageDescription: "6 (1d6 + 3) piercing damage." }
    ]
  },
  {
    id: "cm-dragonfang",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tyranny of Dragons",
    name: "Dragonfang",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 3,
    ac: 16,
    acNote: "breastplate",
    hp: 65,
    maxHp: 65,
    abilityScores: {
      strength: 17, dexterity: 10, constitution: 16,
      intelligence: 11, wisdom: 12, charisma: 13
    },
    skills: { Athletics: 5, Intimidation: 3 },
    senses: { "passive Perception": "11" },
    languages: ["Common", "Draconic"],
    description: "A cult veteran wielding a halberd in service of Tiamat.",
    traits: [],
    actions: [
      { name: "Multiattack", description: "The dragonfang makes two Halberd attacks." },
      {
        name: "Halberd",
        description: "Melee Weapon Attack",
        attackBonus: 5,
        damageDescription: "12 (2d8 + 3) slashing damage."
      }
    ]
  },
  {
    id: "cm-dragonsoul",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tyranny of Dragons",
    name: "Dragonsoul",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 6,
    ac: 17,
    acNote: "Mage Armor",
    hp: 84,
    maxHp: 84,
    abilityScores: {
      strength: 9, dexterity: 14, constitution: 14,
      intelligence: 17, wisdom: 12, charisma: 11
    },
    savingThrows: { intelligence: 6, wisdom: 4 },
    skills: { Arcana: 6, Religion: 4 },
    senses: { "passive Perception": "11" },
    languages: ["Common", "Draconic"],
    description: "A cult spellcaster who leads small raiding parties. Trained in the arts of Tiamat.",
    traits: [
      { name: "Spellcasting", description: "The dragonsoul is a 9th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 14, +6 to hit with spell attacks). At will: light, mage hand. 3/day each: fireball, hold person, magic missile. 1/day each: dispel magic, fire shield." }
    ],
    actions: [
      { name: "Dagger", description: "Melee or Ranged Weapon Attack", attackBonus: 4, damageDescription: "4 (1d4 + 2) piercing damage." }
    ]
  },
  {
    id: "cm-dragonwing",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tyranny of Dragons",
    name: "Dragonwing",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft., fly 30 ft.",
    challengeRating: 3,
    ac: 16,
    acNote: "leather armor",
    hp: 45,
    maxHp: 45,
    abilityScores: {
      strength: 12, dexterity: 18, constitution: 14,
      intelligence: 10, wisdom: 11, charisma: 12
    },
    skills: { Acrobatics: 6, Perception: 2 },
    senses: { "passive Perception": "11" },
    languages: ["Common", "Draconic"],
    description: "A winged cultist who rides a wyvern or serves as a fast scout for the Cult of the Dragon.",
    traits: [],
    actions: [
      { name: "Multiattack", description: "The dragonwing makes two Shortsword attacks." },
      { name: "Shortsword", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "7 (1d6 + 4) piercing damage." },
      { name: "Shortbow", description: "Ranged Weapon Attack", attackBonus: 6, damageDescription: "7 (1d6 + 4) piercing damage." }
    ]
  },
  {
    id: "cm-ambush-drake",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tyranny of Dragons",
    name: "Ambush Drake",
    size: "small",
    type: "dragon",
    alignment: "Unaligned",
    speed: "30 ft.",
    challengeRating: 0.5,
    ac: 13,
    acNote: "natural armor",
    hp: 16,
    maxHp: 16,
    abilityScores: {
      strength: 14, dexterity: 13, constitution: 12,
      intelligence: 4, wisdom: 10, charisma: 6
    },
    skills: { Perception: 2, Stealth: 3 },
    senses: { blindsight: "10 ft.", "passive Perception": "12" },
    languages: ["understands Draconic but can't speak"],
    traits: [
      { name: "Pack Tactics", description: "The drake has advantage on an attack roll against a creature if at least one of the drake's allies is within 5 ft. of the creature and the ally isn't incapacitated." }
    ],
    actions: [
      { name: "Multiattack", description: "The drake makes two attacks: one Bite and one Claw." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "6 (1d6 + 3) piercing damage." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "5 (1d4 + 3) slashing damage." }
    ]
  },
  {
    id: "cm-guard-drake",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tyranny of Dragons",
    name: "Guard Drake",
    size: "medium",
    type: "dragon",
    alignment: "Unaligned",
    speed: "30 ft.",
    challengeRating: 2,
    ac: 14,
    acNote: "natural armor",
    hp: 49,
    maxHp: 49,
    abilityScores: {
      strength: 16, dexterity: 11, constitution: 14,
      intelligence: 4, wisdom: 11, charisma: 7
    },
    skills: { Perception: 2, Stealth: 2 },
    senses: { blindsight: "10 ft.", darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["understands Draconic but can't speak"],
    traits: [
      { name: "Scent", description: "The drake has advantage on Wisdom (Perception) checks that rely on smell." }
    ],
    actions: [
      { name: "Multiattack", description: "The drake makes two attacks: one Bite and one Claw." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "8 (1d8 + 4) piercing damage." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "7 (1d6 + 4) slashing damage." }
    ]
  },
  {
    id: "cm-kobold-inventor",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tyranny of Dragons",
    name: "Kobold Inventor",
    size: "small",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 0.25,
    ac: 12,
    hp: 13,
    maxHp: 13,
    abilityScores: {
      strength: 8, dexterity: 14, constitution: 10,
      intelligence: 12, wisdom: 9, charisma: 8
    },
    skills: { Arcana: 3, Investigation: 3 },
    senses: { darkvision: "60 ft.", "passive Perception": "9" },
    languages: ["Common", "Draconic"],
    traits: [
      { name: "Sunlight Sensitivity", description: "While in sunlight, the kobold has disadvantage on attack rolls, and on Wisdom (Perception) checks that rely on sight." }
    ],
    actions: [
      { name: "Multiattack", description: "The inventor makes two attacks with its Sling." },
      {
        name: "Sling",
        description: "Ranged Weapon Attack",
        attackBonus: 4,
        damageDescription: "4 (1d4 + 2) bludgeoning damage."
      },
      {
        name: "Alchemist's Fire",
        description: "The inventor hurls a flask of alchemist's fire. Target makes DC 13 Dexterity save or takes 8 (1d8 + 4) fire damage on a failed save."
      }
    ]
  },
  {
    id: "cm-kobold-scale-sorcerer",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tyranny of Dragons",
    name: "Kobold Scale Sorcerer",
    size: "small",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 1,
    ac: 13,
    acNote: "Mage Armor",
    hp: 27,
    maxHp: 27,
    abilityScores: {
      strength: 7, dexterity: 14, constitution: 12,
      intelligence: 10, wisdom: 9, charisma: 14
    },
    skills: { Persuasion: 4 },
    senses: { darkvision: "60 ft.", "passive Perception": "9" },
    languages: ["Common", "Draconic"],
    traits: [
      { name: "Draconic Ancestry", description: "The sorcerer deals an extra 1d6 damage on its Draconic Cantrip when cast." },
      { name: "Sunlight Sensitivity", description: "While in sunlight, the kobold has disadvantage on attack rolls, and on Wisdom (Perception) checks that rely on sight." }
    ],
    actions: [
      {
        name: "Draconic Cantrip",
        description: "Ranged Spell Attack",
        attackBonus: 4,
        damageDescription: "5 (1d10) damage of its chosen damage type (fire, cold, or poison)."
      },
      { name: "Dagger", description: "Melee Weapon Attack", attackBonus: 2, damageDescription: "3 (1d4 + 1) piercing damage." }
    ]
  },
  {
    id: "cm-ice-toad",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tyranny of Dragons",
    name: "Ice Toad",
    size: "medium",
    type: "monstrosity",
    alignment: "Unaligned",
    speed: "20 ft., swim 20 ft.",
    challengeRating: 1,
    ac: 13,
    acNote: "natural armor",
    hp: 30,
    maxHp: 30,
    abilityScores: {
      strength: 14, dexterity: 10, constitution: 14,
      intelligence: 2, wisdom: 10, charisma: 3
    },
    skills: { Athletics: 4, Perception: 2 },
    damageImmunities: ["cold"],
    senses: { "passive Perception": "12" },
    languages: ["understands Sylvan but can't speak"],
    traits: [
      { name: "Amphibious", description: "The ice toad can breathe air and water." },
      { name: "Ice Walk", description: "The ice toad can move across and climb icy surfaces without needing to make an ability check." }
    ],
    actions: [
      { name: "Multiattack", description: "The ice toad makes two attacks: one Bite and one Frost Breath if available." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "7 (1d8 + 3) piercing damage plus 3 (1d6) cold damage." },
      {
        name: "Frost Breath (Recharge 5-6)",
        description: "The ice toad exhales a 15-foot cone of cold. Each creature in that area must make a DC 12 Constitution saving throw, taking 10 (3d6) cold damage on a failed save, or half as much damage on a successful one."
      }
    ]
  },
  {
    id: "cm-half-dragon-veteran",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Tyranny of Dragons",
    name: "Half-Dragon Veteran",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 5,
    ac: 17,
    acNote: "breastplate, shield",
    hp: 110,
    maxHp: 110,
    abilityScores: {
      strength: 16, dexterity: 13, constitution: 18,
      intelligence: 12, wisdom: 12, charisma: 13
    },
    savingThrows: { strength: 6, constitution: 7 },
    skills: { Athletics: 6, Perception: 4 },
    damageImmunities: ["fire"],
    senses: { "passive Perception": "14" },
    languages: ["Common", "Draconic"],
    description: "An elite veteran of the Cult of the Dragon infused with draconic blood.",
    traits: [
      { name: "Draconic Breath", description: "Once per turn, the veteran can exhale a 15-foot cone of fire. Each creature makes a DC 15 Dexterity save, taking 21 (6d6) fire damage on a failure or half on a success. Recharges on 5-6." }
    ],
    actions: [
      { name: "Multiattack", description: "The veteran makes three Longsword attacks." },
      {
        name: "Longsword",
        description: "Melee Weapon Attack",
        attackBonus: 6,
        damageDescription: "9 (1d10 + 3) slashing damage, or 8 (1d8 + 3) if used one-handed."
      },
      {
        name: "Shortbow",
        description: "Ranged Weapon Attack",
        attackBonus: 5,
        damageDescription: "5 (1d6 + 2) piercing damage."
      }
    ]
  },
  // ─── Baldur's Gate: Descent into Avernus ──────────────────────────────────
  {
    id: "cm-zariel",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Baldur's Gate: Descent into Avernus",
    name: "Zariel, Archdevil of Avernus",
    size: "large",
    type: "fiend",
    alignment: "Lawful Evil",
    speed: "50 ft., fly 150 ft.",
    challengeRating: 26,
    ac: 21,
    acNote: "natural armor",
    hp: 580,
    maxHp: 580,
    abilityScores: {
      strength: 27, dexterity: 18, constitution: 26,
      intelligence: 24, wisdom: 20, charisma: 26
    },
    savingThrows: { strength: 17, dexterity: 13, constitution: 17, wisdom: 13, charisma: 17 },
    skills: { Perception: 16, Persuasion: 17 },
    damageResistances: ["bludgeoning", "piercing", "slashing"],
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "poisoned", "stunned"],
    senses: { truesight: "120 ft.", "passive Perception": "26" },
    languages: ["All", "telepathy 120 ft."],
    description: "The fallen angel who rules the first layer of the Nine Hells. Pulls Elturel into Avernus in the campaign's opening.",
    traits: [
      {
        name: "Damage Resistance (Nonmagical)",
        description: "Zariel takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical."
      },
      {
        name: "Legendary Resistance (5/Day)",
        description: "If Zariel fails a saving throw, she can choose to succeed instead."
      },
      {
        name: "Magic Resistance",
        description: "Zariel has advantage on saving throws against spells and other magical effects."
      },
      {
        name: "Innate Spellcasting",
        description: "Zariel's spellcasting ability is Charisma (spell save DC 25, +17 to hit with spell attacks). At will: detect magic, fireball (as 6th-level spell). 3/day each: blade barrier, dispel magic, hold monster. 1/day each: fire storm, wall of fire."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Zariel makes one Sword of Zariel attack, two Sword attacks, and one Colossal Slam."
      },
      {
        name: "Sword of Zariel",
        description: "Melee Weapon Attack",
        attackBonus: 17,
        damageDescription: "21 (2d10 + 10) slashing damage plus 18 (4d8) fire damage and 18 (4d8) necrotic damage."
      },
      { name: "Sword", description: "Melee Weapon Attack", attackBonus: 17, damageDescription: "16 (2d8 + 8) slashing damage plus 14 (4d6) fire damage." },
      {
        name: "Colossal Slam",
        description: "Melee Weapon Attack",
        attackBonus: 17,
        damageDescription: "29 (4d8 + 10) bludgeoning damage. The target must make a DC 25 Strength save or be knocked prone."
      },
      {
        name: "Hellfire Ray (Recharge 5-6)",
        description: "Zariel exhales hellfire in a 120-foot line. Each creature in the line makes a DC 25 Dexterity save, taking 88 (16d10) fire damage and 88 (16d10) necrotic damage on a failure, or half on a success."
      }
    ],
    legendaryActions: [
      { name: "Attack", description: "Zariel makes one Sword or Sword of Zariel attack." },
      { name: "Cast a Spell", description: "Zariel casts one of her prepared spells." },
      { name: "Teleport", description: "Zariel teleports up to 120 ft. to an unoccupied space she can see." }
    ]
  },
  {
    id: "cm-yeenoghu",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Baldur's Gate: Descent into Avernus",
    name: "Yeenoghu, Demon Lord of Gnolls",
    size: "large",
    type: "fiend",
    alignment: "Chaotic Evil",
    speed: "50 ft.",
    challengeRating: 24,
    ac: 20,
    acNote: "natural armor",
    hp: 480,
    maxHp: 480,
    abilityScores: {
      strength: 27, dexterity: 17, constitution: 24,
      intelligence: 16, wisdom: 16, charisma: 19
    },
    savingThrows: { dexterity: 11, constitution: 16, wisdom: 11, charisma: 10 },
    skills: { Perception: 11 },
    damageResistances: ["acid", "cold", "fire", "lightning"],
    damageImmunities: ["poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned", "stunned"],
    senses: { truesight: "120 ft.", "passive Perception": "21" },
    languages: ["Abyssal", "Gnoll", "telepathy 120 ft."],
    description: "The demon lord of gnolls who stalks the Blood War. Appears in the Wrecked Flying Fortress in Avernus.",
    traits: [
      {
        name: "Damage Resistance (Nonmagical)",
        description: "Yeenoghu takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical."
      },
      {
        name: "Legendary Resistance (4/Day)",
        description: "If Yeenoghu fails a saving throw, he can choose to succeed instead."
      },
      {
        name: "Magic Resistance",
        description: "Yeenoghu has advantage on saving throws against spells and other magical effects."
      },
      {
        name: "Rampage",
        description: "When Yeenoghu reduces a creature to 0 hit points with a melee attack, he can use a bonus action to move up to half his speed and make a bite attack."
      }
    ],
    actions: [
      { name: "Multiattack", description: "Yeenoghu makes three attacks: one Bite, one Greatsword, and one Flail." },
      {
        name: "Multiattack (Gore)",
        description: "Yeenoghu makes three Gore attacks."
      },
      {
        name: "Greatsword",
        description: "Melee Weapon Attack",
        attackBonus: 16,
        damageDescription: "26 (3d10 + 10) slashing damage."
      },
      {
        name: "Flail",
        description: "Melee Weapon Attack",
        attackBonus: 16,
        damageDescription: "21 (3d8 + 9) bludgeoning damage plus 14 (4d6) necrotic damage."
      },
      {
        name: "Gore",
        description: "Melee Weapon Attack",
        attackBonus: 16,
        damageDescription: "24 (3d10 + 9) piercing damage."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack",
        attackBonus: 16,
        damageDescription: "21 (3d8 + 9) piercing damage plus 14 (4d6) necrotic damage."
      },
      {
        name: "Butcher's Cleaver (Recharge 5-6)",
        description: "Yeenoghu sweeps his flail across a 30-foot radius centered on himself. Each creature in the area makes a DC 22 Dexterity save, taking 33 (6d10) necrotic damage on a failure, or half on a success."
      }
    ],
    legendaryActions: [
      { name: "Attack", description: "Yeenoghu makes one Greatsword, Flail, or Gore attack." },
      { name: "Move", description: "Yeenoghu moves up to his speed without provoking opportunity attacks." },
      { name: "Summon Gnolls", description: "Yeenoghu summons 1d4 gnoll packs in unoccupied spaces he can see. The gnolls act on his initiative." }
    ]
  },
  {
    id: "cm-narzugon",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Baldur's Gate: Descent into Avernus",
    name: "Narzugon, the Hellrider",
    size: "medium",
    type: "undead",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 13,
    ac: 19,
    acNote: "plate armor",
    hp: 168,
    maxHp: 168,
    abilityScores: {
      strength: 18, dexterity: 14, constitution: 17,
      intelligence: 14, wisdom: 14, charisma: 16
    },
    savingThrows: { dexterity: 8, wisdom: 8, charisma: 9 },
    skills: { Perception: 8, Stealth: 8 },
    damageVulnerabilities: ["radiant"],
    damageResistances: ["bludgeoning", "piercing", "slashing"],
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "18" },
    languages: ["Common", "Infernal"],
    description: "A skeletal devil mounted on a nightmare steed who hunts the Blood War's stragglers.",
    traits: [
      {
        name: "Damage Resistance (Nonmagical)",
        description: "The narzugon takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical."
      },
      {
        name: "Fierce Strike",
        description: "When the narzugon hits with its hellfire lance while mounted, the target makes a DC 17 Strength save or is knocked prone and the target's speed is halved until the start of the narzugon's next turn."
      },
      {
        name: "Hellfire Lance",
        description: "The narzugon's hellfire lance deals fire and necrotic damage and ignores resistance to fire damage."
      },
      {
        name: "Marshal Undead",
        description: "Undead allies within 60 ft. of the narzugon have advantage on saving throws."
      }
    ],
    actions: [
      { name: "Multiattack", description: "The narzugon makes two Hellfire Lance attacks." },
      {
        name: "Hellfire Lance",
        description: "Melee Weapon Attack",
        attackBonus: 10,
        damageDescription: "12 (2d6 + 6) piercing damage plus 18 (4d8) fire damage and 18 (4d8) necrotic damage."
      },
      {
        name: "Hurl Hellfire (Recharge 5-6)",
        description: "The narzugon hurls hellfire at a point within 120 ft. Each creature in a 20-foot radius makes a DC 18 Dexterity save, taking 28 (8d6) fire damage and 28 (8d6) necrotic damage on a failure, or half on a success."
      }
    ]
  },
  {
    id: "cm-hollyphant",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Baldur's Gate: Descent into Avernus",
    name: "Hollyphant",
    size: "tiny",
    type: "celestial",
    alignment: "Lawful Good",
    speed: "20 ft., fly 80 ft.",
    challengeRating: 4,
    ac: 18,
    acNote: "natural armor",
    hp: 90,
    maxHp: 90,
    abilityScores: {
      strength: 5, dexterity: 16, constitution: 14,
      intelligence: 13, wisdom: 15, charisma: 17
    },
    savingThrows: { dexterity: 6, wisdom: 5 },
    skills: { Insight: 5, Perception: 5 },
    damageResistances: ["radiant"],
    senses: { truesight: "120 ft.", "passive Perception": "15" },
    languages: ["all", "telepathy 120 ft."],
    description: "An elephantine celestial with butterfly wings. Lulu the hollyphant is the campaign's most important ally.",
    traits: [
      { name: "Innate Spellcasting", description: "The hollyphant's spellcasting ability is Charisma (spell save DC 13). At will: detect evil and good, detect magic, see invisibility. 3/day each: dispel evil and good, tongues." },
      { name: "Magic Resistance", description: "The hollyphant has advantage on saving throws against spells and other magical effects." }
    ],
    actions: [
      {
        name: "Tusks",
        description: "Melee Weapon Attack",
        attackBonus: 6,
        damageDescription: "10 (2d6 + 3) piercing damage plus 7 (2d6) radiant damage."
      },
      {
        name: "Trunk",
        description: "The hollyphant uses its trunk to lift a creature up to Large size that is within 5 ft. The target must succeed on a DC 13 Strength save or be lifted and held. The hollyphant can carry the target up to 30 ft."
      },
      {
        name: "Radiant Bolt (Recharge 5-6)",
        description: "The hollyphant hurls a bolt of radiance. Make a ranged spell attack (+6 to hit, range 120 ft.) dealing 21 (6d6) radiant damage."
      }
    ]
  },
  {
    id: "cm-bulezau",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Baldur's Gate: Descent into Avernus",
    name: "Bulezau",
    size: "large",
    type: "fiend",
    alignment: "Lawful Evil",
    speed: "30 ft., climb 30 ft.",
    challengeRating: 3,
    ac: 13,
    acNote: "natural armor",
    hp: 60,
    maxHp: 60,
    abilityScores: {
      strength: 18, dexterity: 12, constitution: 16,
      intelligence: 6, wisdom: 11, charisma: 9
    },
    skills: { Athletics: 7, Perception: 4 },
    damageVulnerabilities: ["radiant"],
    senses: { darkvision: "120 ft.", "passive Perception": "14" },
    languages: ["Infernal"],
    description: "Goat-headed, cloven-hoofed fiends in service to Bel at the Avernus forge.",
    traits: [
      { name: "Death Rattle", description: "When the bulezau drops to 0 HP, it explodes. Each creature within 10 ft. makes a DC 13 Constitution save or takes 9 (2d8) necrotic damage." }
    ],
    actions: [
      { name: "Multiattack", description: "The bulezau makes two Gore attacks." },
      {
        name: "Gore",
        description: "Melee Weapon Attack",
        attackBonus: 7,
        damageDescription: "10 (2d6 + 4) piercing damage."
      }
    ]
  },
  {
    id: "cm-white-abishai",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Baldur's Gate: Descent into Avernus",
    name: "White Abishai",
    size: "medium",
    type: "fiend",
    alignment: "Lawful Evil",
    speed: "30 ft., fly 60 ft.",
    challengeRating: 6,
    ac: 17,
    acNote: "natural armor",
    hp: 119,
    maxHp: 119,
    abilityScores: {
      strength: 14, dexterity: 17, constitution: 16,
      intelligence: 14, wisdom: 13, charisma: 15
    },
    savingThrows: { dexterity: 6, constitution: 6 },
    skills: { Deception: 5, Perception: 4 },
    damageResistances: ["bludgeoning", "piercing", "slashing"],
    damageImmunities: ["cold"],
    conditionImmunities: ["poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "14" },
    languages: ["Abyssal", "Common", "Draconic", "Infernal"],
    description: "White-scaled dragon-tailed devil kin of Tiamat serving in the Blood War's front lines.",
    traits: [
      {
        name: "Damage Resistance (Nonmagical)",
        description: "The white abishai takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical."
      },
      {
        name: "Devil's Sight",
        description: "Magical darkness doesn't impede the white abishai's darkvision."
      }
    ],
    actions: [
      { name: "Multiattack", description: "The white abishai makes two attacks: one Bite and one Claw." },
      {
        name: "Bite",
        description: "Melee Weapon Attack",
        attackBonus: 6,
        damageDescription: "5 (1d4 + 3) piercing damage plus 7 (2d6) cold damage."
      },
      {
        name: "Claw",
        description: "Melee Weapon Attack",
        attackBonus: 6,
        damageDescription: "7 (1d6 + 3) slashing damage plus 7 (2d6) cold damage."
      },
      {
        name: "Frost Breath (Recharge 5-6)",
        description: "The white abishai exhales a 15-foot cone of frost. Each creature makes a DC 14 Constitution save, taking 16 (3d10) cold damage on a failure, or half on a success."
      }
    ]
  },
  {
    id: "cm-cultist-dead-three",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Baldur's Gate: Descent into Avernus",
    name: "Cultist of the Dead Three",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 0.125,
    ac: 12,
    acNote: "leather armor",
    hp: 9,
    maxHp: 9,
    abilityScores: {
      strength: 10, dexterity: 12, constitution: 10,
      intelligence: 11, wisdom: 11, charisma: 10
    },
    skills: { Deception: 2, Religion: 2 },
    senses: { "passive Perception": "10" },
    languages: ["Common", "Infernal"],
    description: "Worshippers of Bane, Bhaal, and Myrkul performing murders in Baldur's Gate. Skilled at ambush.",
    traits: [
      { name: "Dark Devotion", description: "The cultist has advantage on saving throws against being charmed or frightened." }
    ],
    actions: [
      {
        name: "Scimitar",
        description: "Melee Weapon Attack",
        attackBonus: 3,
        damageDescription: "4 (1d6 + 1) slashing damage."
      }
    ]
  },
  {
    id: "cm-hellwasp",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Baldur's Gate: Descent into Avernus",
    name: "Hellwasp",
    size: "large",
    type: "fiend",
    alignment: "Neutral Evil",
    speed: "30 ft., fly 60 ft.",
    challengeRating: 5,
    ac: 14,
    acNote: "natural armor",
    hp: 94,
    maxHp: 94,
    abilityScores: {
      strength: 14, dexterity: 16, constitution: 16,
      intelligence: 6, wisdom: 12, charisma: 8
    },
    skills: { Perception: 4 },
    damageVulnerabilities: ["radiant"],
    senses: { darkvision: "120 ft.", "passive Perception": "14" },
    languages: ["understands Infernal but can't speak"],
    description: "Hellfire-tinted wasp that builds nests in the bone fields of Avernus.",
    traits: [
      {
        name: "Hellfire Husk",
        description: "If the hellwasp dies, its body bursts into hellfire. Each creature within 5 ft. makes a DC 14 Constitution save, taking 10 (3d6) fire damage on a failure, or half on a success."
      }
    ],
    actions: [
      { name: "Multiattack", description: "The hellwasp makes two Stinger attacks." },
      {
        name: "Stinger",
        description: "Melee Weapon Attack",
        attackBonus: 6,
        damageDescription: "10 (2d6 + 3) piercing damage plus 14 (4d6) fire damage."
      },
      {
        name: "Hellfire Breath (Recharge 5-6)",
        description: "The hellwasp exhales a 30-foot cone of hellfire. Each creature in the area makes a DC 14 Constitution save, taking 14 (4d6) fire damage on a failure, or half on a success. A creature that fails its save is also blinded until the end of its next turn."
      }
    ]
  },
  {
    id: "cm-hellwasp-swarm",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Baldur's Gate: Descent into Avernus",
    name: "Hellwasp Swarm",
    size: "medium",
    type: "fiend",
    alignment: "Neutral Evil",
    speed: "20 ft., fly 60 ft.",
    challengeRating: 3,
    ac: 12,
    hp: 84,
    maxHp: 84,
    abilityScores: {
      strength: 8, dexterity: 14, constitution: 12,
      intelligence: 1, wisdom: 7, charisma: 1
    },
    damageVulnerabilities: ["radiant"],
    damageResistances: ["bludgeoning", "piercing", "slashing"],
    conditionImmunities: ["charmed", "frightened", "grappled", "paralyzed", "petrified", "prone", "restrained", "stunned"],
    senses: { blindsight: "60 ft.", "passive Perception": "8" },
    languages: ["understands Infernal but can't speak"],
    description: "A swarm of hellwasps surrounding any creature foolish enough to disturb their nest.",
    traits: [
      {
        name: "Hellfire Aura",
        description: "Any creature ending its turn within the swarm's space takes 3 (1d6) fire damage."
      },
      {
        name: "Swarm",
        description: "The swarm can occupy another creature's space and vice versa, and it can move through any opening large enough for a Tiny creature. The swarm can't regain hit points or benefit from short or long rests."
      }
    ],
    actions: [
      {
        name: "Stingers",
        description: "Melee Weapon Attack",
        attackBonus: 4,
        damageDescription: "10 (3d6) piercing damage plus 10 (3d6) fire damage, or 5 (1d10) piercing damage plus 5 (1d10) fire damage if the target has resistance to fire damage."
      }
    ]
  },
  {
    id: "cm-merregon",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Baldur's Gate: Descent into Avernus",
    name: "Merregon",
    size: "medium",
    type: "fiend",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 1,
    ac: 14,
    acNote: "breastplate",
    hp: 22,
    maxHp: 22,
    abilityScores: {
      strength: 13, dexterity: 14, constitution: 12,
      intelligence: 9, wisdom: 11, charisma: 8
    },
    skills: { Athletics: 3, Perception: 2 },
    damageResistances: ["bludgeoning", "piercing", "slashing"],
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["frightened", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["understands Infernal but can't speak"],
    description: "Lowly devil foot-soldiers in infernal legions.",
    traits: [
      {
        name: "Damage Resistance (Nonmagical)",
        description: "The merregon takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical."
      },
      {
        name: "Relentless",
        description: "The merregon can take 1 action immediately after being targeted by an effect or attack that would cause it to lose concentration, drop a held object, be knocked prone, or be restrained. It can do so only once per round."
      }
    ],
    actions: [
      { name: "Multiattack", description: "The merregon makes two Halberd attacks." },
      {
        name: "Halberd",
        description: "Melee Weapon Attack",
        attackBonus: 4,
        damageDescription: "7 (1d10 + 2) slashing damage."
      }
    ]
  },
  {
    id: "cm-sword-wraith-commander",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Baldur's Gate: Descent into Avernus",
    name: "Sword Wraith Commander",
    size: "medium",
    type: "undead",
    alignment: "Lawful Evil",
    speed: "30 ft., fly 60 ft.",
    challengeRating: 10,
    ac: 16,
    acNote: "splint armor",
    hp: 144,
    maxHp: 144,
    abilityScores: {
      strength: 18, dexterity: 16, constitution: 16,
      intelligence: 12, wisdom: 14, charisma: 15
    },
    savingThrows: { dexterity: 7, wisdom: 6 },
    skills: { Perception: 6, Stealth: 7 },
    damageResistances: ["bludgeoning", "piercing", "slashing"],
    damageImmunities: ["necrotic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "grappled", "paralyzed", "poisoned", "prone", "restrained"],
    senses: { darkvision: "120 ft.", "passive Perception": "16" },
    languages: ["the languages it knew in life"],
    description: "The champion of an undead Hellrider host. Hangs around the Crypt of the Hellriders.",
    traits: [
      {
        name: "Damage Resistance (Nonmagical)",
        description: "The sword wraith commander takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical."
      },
      {
        name: "Incorporeal Movement",
        description: "The commander can move through other creatures and objects as if they were difficult terrain. It takes 5 (1d10) force damage if it ends its turn inside an object."
      },
      {
        name: "Marshal Undead",
        description: "Undead allies within 60 ft. have advantage on saving throws and can't be charmed or frightened."
      }
    ],
    actions: [
      { name: "Multiattack", description: "The commander makes two Longsword attacks and one Life Drain attack." },
      {
        name: "Longsword",
        description: "Melee Weapon Attack",
        attackBonus: 8,
        damageDescription: "8 (1d8 + 4) slashing damage, or 9 (1d10 + 4) if used two-handed, plus 4 (1d8) necrotic damage."
      },
      {
        name: "Life Drain",
        description: "Melee Spell Attack",
        attackBonus: 7,
        damageDescription: "14 (3d8 + 1) necrotic damage. The target must succeed on a DC 15 Constitution saving throw or its hit point maximum is reduced by an amount equal to the damage taken. This reduction lasts until the target finishes a long rest. The target dies if its hit point maximum is reduced to 0."
      }
    ],
    legendaryActions: [
      { name: "Attack", description: "The commander makes one Longsword attack." },
      { name: "Life Drain", description: "The commander makes one Life Drain attack." },
      { name: "Command Undead (Costs 2 Actions)", description: "The commander targets one undead ally it can see. The ally can use its reaction to make one attack." }
    ]
  },
  {
    id: "cm-fiendish-flesh-golem",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Baldur's Gate: Descent into Avernus",
    name: "Fiendish Flesh Golem",
    size: "large",
    type: "construct",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 10,
    ac: 14,
    acNote: "natural armor",
    hp: 157,
    maxHp: 157,
    abilityScores: {
      strength: 19, dexterity: 9, constitution: 18,
      intelligence: 6, wisdom: 11, charisma: 7
    },
    damageResistances: ["bludgeoning", "piercing", "slashing"],
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "petrified", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "10" },
    languages: ["understands the languages of its creator but can't speak"],
    description: "Flesh golems stitched together with fiendish organs, found in the Vanthampur Villa dungeon.",
    traits: [
      {
        name: "Damage Absorption (Fire)",
        description: "When the golem is hit by an attack that deals fire damage, it regains hit points equal to half the fire damage dealt."
      },
      {
        name: "Magic Resistance",
        description: "The golem has advantage on saving throws against spells and other magical effects."
      },
      {
        name: "Searing Smite",
        description: "The golem's slam attacks deal an extra 7 (2d6) fire damage on a hit (already included)."
      }
    ],
    actions: [
      { name: "Multiattack", description: "The golem makes two Slam attacks." },
      {
        name: "Slam",
        description: "Melee Weapon Attack",
        attackBonus: 8,
        damageDescription: "16 (2d10 + 5) bludgeoning damage plus 7 (2d6) fire damage."
      },
      {
        name: "Berserk Flame (Recharge 5-6)",
        description: "The golem exhales a 15-foot cone of hellfire. Each creature in the area makes a DC 16 Dexterity save, taking 28 (8d6) fire damage on a failure, or half on a success."
      }
    ]
  },
  // ─── Waterdeep: Dragon Heist ─────────────────────────────────────────
  {
    id: "cm-zhentarim-thug",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Waterdeep: Dragon Heist",
    name: "Zhentarim Thug",
    size: "medium",
    type: "humanoid",
    alignment: "Any Non-Lawful Alignment",
    speed: "30 ft.",
    challengeRating: 0.5,
    ac: 12,
    acNote: "leather armor",
    hp: 11,
    maxHp: 11,
    abilityScores: {
      strength: 11, dexterity: 12, constitution: 12,
      intelligence: 10, wisdom: 10, charisma: 10
    },
    skills: { Intimidation: 2 },
    senses: { "passive Perception": "10" },
    languages: ["Common"],
    description: "A hired blade of the Zhentarim Black Network who enforces the merchant cartel's 'interest' along the Sword Coast.",
    traits: [
      { name: "Black Network Loyalty", description: "The thug has advantage on saving throws against being charmed or frightened while within 30 ft. of another Zhentarim ally." }
    ],
    actions: [
      { name: "Scimitar", description: "Melee Weapon Attack", attackBonus: 3, damageDescription: "4 (1d6 + 1) slashing damage." },
      { name: "Light Crossbow", description: "Ranged Weapon Attack", attackBonus: 3, damageDescription: "5 (1d8 + 1) piercing damage." }
    ]
  },
  {
    id: "cm-manshoon-manyfaced",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Waterdeep: Dragon Heist",
    name: "Manshoon the Manyfaced",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 12,
    experiencePoints: 8400,
    ac: 14,
    acNote: "Mage Armor",
    hp: 168,
    maxHp: 168,
    abilityScores: {
      strength: 10, dexterity: 16, constitution: 16,
      intelligence: 20, wisdom: 16, charisma: 16
    },
    savingThrows: { intelligence: 11, wisdom: 9 },
    skills: { Arcana: 11, Deception: 9, History: 11, Insight: 9, Perception: 9 },
    senses: { truesight: "30 ft.", "passive Perception": "19" },
    languages: ["Common", "Deep Speech", "Infernal", "Thayan"],
    description: "A Zhentarim clone of Manshoon the Warlock who masquerades as Kolat Towers' landlord, secretly scheming to claim the gold for the Black Network.",
    traits: [
      { name: "Shapechanger", description: "Manshoon can use his action to polymorph into any humanoid he has seen, or back into his true form. His statistics, other than his size and speed, are the same in each form." },
      { name: "Spellcasting", description: "Manshoon is an 18th-level spellcaster. His spellcasting ability is Intelligence (spell save DC 19, +11 to hit with spell attacks). At will: detect magic, mage hand. 3/day each: counterspell, dispel magic, fireball, hold person, major image, suggestion. 1/day each: dominate person, mass suggestion, polymorph, teleport." }
    ],
    actions: [
      { name: "Multiattack", description: "Manshoon makes two Dagger attacks." },
      { name: "Dagger", description: "Melee or Ranged Weapon Attack", attackBonus: 8, damageDescription: "7 (1d4 + 5) piercing damage." }
    ]
  },
  {
    id: "cm-jarlaxle-baenre",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Waterdeep: Dragon Heist",
    name: "Jarlaxle Baenre",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Neutral",
    speed: "30 ft.",
    challengeRating: 13,
    experiencePoints: 10000,
    ac: 18,
    acNote: "studded leather + bracers of defense",
    hp: 195,
    maxHp: 195,
    abilityScores: {
      strength: 12, dexterity: 20, constitution: 16,
      intelligence: 18, wisdom: 14, charisma: 18
    },
    savingThrows: { dexterity: 10, intelligence: 9, charisma: 9 },
    skills: { Deception: 9, Perception: 7, Persuasion: 9, Stealth: 10 },
    damageImmunities: ["poison"],
    conditionImmunities: ["poisoned"],
    senses: { darkvision: "120 ft.", truesight: "30 ft.", "passive Perception": "17" },
    languages: ["Common", "Elvish", "Undercommon"],
    description: "The flamboyant drow mercenary leader of Bregan D'aerthe. Wears the legendary hat of disguise and wields the eye of Lhammar (a sentient magical eye that fires force bolts).",
    traits: [
      { name: "Fey Ancestry", description: "Jarlaxle has advantage on saving throws against being charmed, and magic can't put him to sleep." },
      { name: "Hat of Disguise", description: "Jarlaxle can use his action to cast disguise self at will without expending a spell slot." },
      { name: "Innate Spellcasting", description: "Jarlaxle's innate spellcasting ability is Charisma (spell save DC 16). At will: dancing lights. 1/day each: darkness, faerie fire." },
      { name: "Spellcasting", description: "Jarlaxle is a 12th-level spellcaster. His spellcasting ability is Intelligence (spell save DC 17, +9 to hit with spell attacks). At will: light, mage hand, ray of frost. 3/day each: counterspell, fireball, hold person. 1/day each: confusion, detect magic, shield." }
    ],
    actions: [
      { name: "Multiattack", description: "Jarlaxle makes three attacks: one Dagger, one Shortsword, and one Eye Ray." },
      { name: "Dagger", description: "Melee or Ranged Weapon Attack", attackBonus: 10, damageDescription: "7 (1d4 + 5) piercing damage plus 10 (3d6) poison damage." },
      { name: "Shortsword", description: "Melee Weapon Attack", attackBonus: 10, damageDescription: "8 (1d6 + 5) piercing damage plus 10 (3d6) poison damage." },
      { name: "Eye Ray", description: "Ranged Spell Attack", attackBonus: 9, damageDescription: "18 (4d8) force damage." }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      { name: "Eye Ray", description: "Jarlaxle uses his Eye Ray." },
      { name: "Cast a Spell", description: "Jarlaxle casts one of his prepared spells." },
      { name: "Disappear (Costs 2 Actions)", description: "Jarlaxle casts greater invisibility on himself without expending a spell slot." }
    ]
  },
  // SRD-faithful mirrors used in Waterdeep: Dragon Heist encounters
  {
    id: "cm-kenku",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Waterdeep: Dragon Heist",
    name: "Kenku",
    size: "small",
    type: "humanoid",
    alignment: "Chaotic Neutral",
    speed: "30 ft.",
    challengeRating: 0.25,
    ac: 13,
    hp: 13,
    maxHp: 13,
    abilityScores: {
      strength: 10, dexterity: 16, constitution: 10,
      intelligence: 11, wisdom: 10, charisma: 10
    },
    skills: { Deception: 4, Perception: 2, Stealth: 6 },
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["understands Common and Auran but can't speak"],
    traits: [
      { name: "Mimicry", description: "The kenku can mimic any sound it has heard, including voices. A creature that hears the sounds can tell they are imitations with a successful DC 14 Wisdom (Insight) check." }
    ],
    actions: [
      { name: "Shortsword", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "6 (1d6 + 3) piercing damage." },
      { name: "Shortbow", description: "Ranged Weapon Attack", attackBonus: 5, damageDescription: "6 (1d6 + 3) piercing damage." }
    ]
  },
  {
    id: "cm-veteran",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Waterdeep: Dragon Heist",
    name: "Veteran",
    size: "medium",
    type: "humanoid",
    alignment: "Any Alignment",
    speed: "30 ft.",
    challengeRating: 3,
    ac: 17,
    acNote: "splint armor, shield",
    hp: 58,
    maxHp: 58,
    abilityScores: {
      strength: 16, dexterity: 13, constitution: 14,
      intelligence: 10, wisdom: 11, charisma: 10
    },
    savingThrows: { strength: 5, constitution: 4 },
    skills: { Athletics: 5, Perception: 2 },
    senses: { "passive Perception": "12" },
    languages: ["any one language (usually Common)"],
    traits: [],
    actions: [
      { name: "Multiattack", description: "The veteran makes two Longsword attacks. If it has a shortsword drawn, it can also make a Shortsword attack." },
      { name: "Longsword", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "7 (1d8 + 3) slashing damage, or 8 (1d10 + 3) if used two-handed." },
      { name: "Shortsword", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "6 (1d6 + 3) piercing damage." },
      { name: "Heavy Crossbow", description: "Ranged Weapon Attack", attackBonus: 3, damageDescription: "7 (1d10 + 1) piercing damage." }
    ]
  },
  {
    id: "cm-beholder",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Waterdeep: Dragon Heist",
    name: "Beholder",
    size: "large",
    type: "aberration",
    alignment: "Lawful Evil",
    speed: "0 ft., fly 20 ft. (hover)",
    challengeRating: 13,
    experiencePoints: 10000,
    ac: 18,
    acNote: "natural armor",
    hp: 180,
    maxHp: 180,
    abilityScores: {
      strength: 10, dexterity: 14, constitution: 18,
      intelligence: 17, wisdom: 15, charisma: 13
    },
    savingThrows: { intelligence: 7, wisdom: 6 },
    skills: { Perception: 12 },
    conditionImmunities: ["prone"],
    senses: { darkvision: "120 ft.", "passive Perception": "22" },
    languages: ["Deep Speech", "Undercommon"],
    description: "The Xanathar, a paranoid beholder crime lord who runs the Xanathar Guild from a beholder-sized lair beneath the Skulks.",
    traits: [
      { name: "Antimagic Cone", description: "The beholder's central eye creates a 150-foot cone of antimagic at the start of each of its turns. The eye can't be closed; the cone can be suppressed for 1 minute by a successful DC 14 Constitution save taken as an action." }
    ],
    actions: [
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "14 (2d10 + 3) piercing damage." },
      { name: "Eye Rays", description: "The beholder shoots three of the following magical eye rays at random (reroll duplicates), choosing targets it can see within 120 ft.: Charm Ray (DC 16 Wis), Paralyzing Ray (DC 16 Con), Fear Ray (DC 16 Wis), Slowing Ray (DC 16 Wis), Enervation Ray (DC 16 Dex), Telekinetic Ray (DC 16 Str), Sleep Ray (DC 15 Wis), Petrification Ray (DC 16 Con), Disintegration Ray (DC 16 Dex), Death Ray (DC 16 Dex)." }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      { name: "Eye Ray", description: "The beholder uses one random eye ray." },
      { name: "Move", description: "The beholder moves up to half its speed without provoking opportunity attacks." }
    ]
  },
  {
    id: "cm-grimlock",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Waterdeep: Dragon Heist",
    name: "Grimlock",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 0.25,
    ac: 11,
    hp: 11,
    maxHp: 11,
    abilityScores: {
      strength: 12, dexterity: 14, constitution: 11,
      intelligence: 9, wisdom: 8, charisma: 6
    },
    skills: { Athletics: 3, Perception: 3, Stealth: 4 },
    conditionImmunities: ["blinded"],
    senses: { blindsight: "30 ft.", "passive Perception": "13" },
    languages: ["Undercommon"],
    traits: [],
    actions: [
      { name: "Multiattack", description: "The grimlock makes two attacks." },
      { name: "Spiked Bone Club", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "5 (1d6 + 2) piercing damage." }
    ]
  },
  {
    id: "cm-nothic",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Waterdeep: Dragon Heist",
    name: "Nothic",
    size: "medium",
    type: "aberration",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 2,
    ac: 15,
    acNote: "natural armor",
    hp: 45,
    maxHp: 45,
    abilityScores: {
      strength: 14, dexterity: 16, constitution: 14,
      intelligence: 13, wisdom: 10, charisma: 8
    },
    skills: { Arcana: 3, Perception: 5, Stealth: 4 },
    senses: { truesight: "60 ft.", darkvision: "60 ft.", "passive Perception": "15" },
    languages: ["Undercommon"],
    description: "A degenerate aberration with one magical eye that crawls through the Xanathar Guild's secret passages, feeding on fear and using its weird gaze to glean secrets.",
    traits: [
      { name: "Keen Sight", description: "The nothic has advantage on Wisdom (Perception) checks that rely on sight." },
      { name: "Weird Insight", description: "The nothic can target one creature it can see within 30 ft. The target must make a DC 12 Wisdom save or the nothic learns one of its ideals, bonds, or flaws." }
    ],
    actions: [
      { name: "Multiattack", description: "The nothic makes two Rotting Claw attacks." },
      { name: "Rotting Claw", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "8 (2d4 + 3) slashing damage." },
      { name: "Rotting Gaze", description: "The nothic targets one creature it can see within 30 ft. The target makes a DC 12 Constitution save, taking 6 (1d8 + 2) necrotic damage on a failure." }
    ]
  },
  // ─── Storm King's Thunder ────────────────────────────────────────────
  {
    id: "cm-chief-guh",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "Chief Guh",
    size: "large",
    type: "giant",
    alignment: "Chaotic Evil",
    speed: "40 ft.",
    challengeRating: 7,
    experiencePoints: 2900,
    ac: 13,
    acNote: "natural armor",
    hp: 105,
    maxHp: 105,
    abilityScores: {
      strength: 21, dexterity: 8, constitution: 17,
      intelligence: 6, wisdom: 10, charisma: 8
    },
    savingThrows: { strength: 8, constitution: 6 },
    skills: { Athletics: 8, Perception: 3 },
    senses: { "passive Perception": "13" },
    languages: ["Common", "Giant"],
    description: "Hill giant chief of Grudd Haug. Holds captives for ransom and feasts on anyone who can't pay.",
    traits: [
      { name: "Hill Giant Chief", description: "Guh has advantage on Strength (Athletics) checks and adds twice his proficiency bonus (included) to damage rolls with boulder attacks." }
    ],
    actions: [
      { name: "Multiattack", description: "Guh makes two Greatclub attacks." },
      { name: "Greatclub", description: "Melee Weapon Attack", attackBonus: 8, damageDescription: "18 (3d8 + 5) bludgeoning damage." },
      { name: "Boulder", description: "Ranged Weapon Attack", attackBonus: 8, damageDescription: "21 (3d10 + 5) bludgeoning damage." }
    ],
    reactions: [
      { name: "Catch Rock", description: "Guh has advantage on Dexterity saving throws to avoid taking damage from a ranged attack that deals bludgeoning damage, and he catches the rock if he avoids the damage." }
    ]
  },
  {
    id: "cm-jarl-storvald",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "Jarl Storvald",
    size: "large",
    type: "giant",
    alignment: "Neutral Evil",
    speed: "40 ft.",
    challengeRating: 9,
    experiencePoints: 5000,
    ac: 15,
    acNote: "natural armor",
    hp: 168,
    maxHp: 168,
    abilityScores: {
      strength: 23, dexterity: 9, constitution: 20,
      intelligence: 10, wisdom: 12, charisma: 13
    },
    savingThrows: { strength: 10, constitution: 9, charisma: 5 },
    skills: { Athletics: 10, Perception: 5, Persuasion: 5 },
    senses: { "passive Perception": "15" },
    languages: ["Common", "Giant"],
    description: "Frost giant jarl of the Glacial Rift who refuses to share the ordning and keeps the Vonindod skull.",
    traits: [
      { name: "Frost Giant Jarl", description: "Storvald deals an extra 1d8 cold damage on weapon attacks (included)." }
    ],
    actions: [
      { name: "Multiattack", description: "Storvald makes two Greataxe attacks." },
      { name: "Greataxe", description: "Melee Weapon Attack", attackBonus: 10, damageDescription: "25 (3d12 + 6) slashing damage, or 21 (3d10 + 6) if used one-handed." },
      { name: "Boulder", description: "Ranged Weapon Attack", attackBonus: 10, damageDescription: "28 (4d10 + 6) bludgeoning damage." },
      { name: "Frost Breath (Recharge 5-6)", description: "Storvald exhales a 30-foot cone of cold. Each creature in the area makes a DC 17 Constitution save, taking 21 (6d6) cold damage on a failure, or half on a success." }
    ],
    reactions: [
      { name: "Catch Rock", description: "Storvald has advantage on Dexterity saving throws to avoid taking damage from a ranged attack that deals bludgeoning damage, and he catches the rock if he avoids the damage." }
    ]
  },
  {
    id: "cm-duke-zalto",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "Duke Zalto",
    size: "huge",
    type: "giant",
    alignment: "Lawful Evil",
    speed: "40 ft.",
    challengeRating: 11,
    experiencePoints: 7200,
    ac: 17,
    acNote: "plate armor",
    hp: 200,
    maxHp: 200,
    abilityScores: {
      strength: 25, dexterity: 9, constitution: 21,
      intelligence: 14, wisdom: 13, charisma: 16
    },
    savingThrows: { strength: 11, constitution: 9, charisma: 7 },
    skills: { Athletics: 11, Intimidation: 7, Perception: 5 },
    senses: { "passive Perception": "15" },
    languages: ["Common", "Giant", "Ignan"],
    description: "Fire giant duke of Ironslag who forges the Vonindod skeleton from golden dragon bones.",
    traits: [
      { name: "Fire Giant Duke", description: "Zalto deals an extra 2d6 fire damage on weapon attacks (included)." },
      { name: "Smith's Hammer", description: "Zalto can repair damaged constructs or forge a new magic item with 1 day's uninterrupted work." }
    ],
    actions: [
      { name: "Multiattack", description: "Zalto makes three War Pick attacks." },
      { name: "War Pick", description: "Melee Weapon Attack", attackBonus: 11, damageDescription: "22 (3d8 + 9) piercing damage plus 7 (2d6) fire damage." },
      { name: "Boulder", description: "Ranged Weapon Attack", attackBonus: 11, damageDescription: "30 (4d10 + 9) bludgeoning damage." },
      { name: "Fire Breath (Recharge 5-6)", description: "Zalto exhales a 30-foot cone of flame. Each creature makes a DC 17 Dexterity save, taking 28 (8d6) fire damage on a failure, or half on a success." }
    ],
    reactions: [
      { name: "Catch Rock", description: "Zalto has advantage on Dexterity saving throws to avoid taking damage from a ranged attack that deals bludgeoning damage, and he catches the rock if he avoids the damage." }
    ]
  },
  {
    id: "cm-yikaria",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "Yikaria the Yakfolk",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 8,
    experiencePoints: 3900,
    ac: 14,
    acNote: "Mage Armor",
    hp: 110,
    maxHp: 110,
    abilityScores: {
      strength: 10, dexterity: 14, constitution: 14,
      intelligence: 17, wisdom: 12, charisma: 13
    },
    savingThrows: { intelligence: 7, wisdom: 5 },
    skills: { Arcana: 7, Deception: 5, Insight: 5 },
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: ["Common", "Giant", "Yakfolk"],
    description: "A yakfolk mage and prisoner of Duke Zalto at Ironslag. Once freed, may join or betray the party.",
    traits: [
      { name: "Magic Resistance", description: "Yikaria has advantage on saving throws against spells and other magical effects." },
      { name: "Spellcasting", description: "Yikaria is an 11th-level spellcaster. Her spellcasting ability is Intelligence (spell save DC 15, +7 to hit with spell attacks). At will: detect magic, light, mage hand, prestidigitation. 3/day each: counterspell, fireball, hold person, suggestion. 1/day each: confusion, polymorph, teleport." }
    ],
    actions: [
      { name: "Multiattack", description: "Yikaria makes two Dagger attacks." },
      { name: "Dagger", description: "Melee or Ranged Weapon Attack", attackBonus: 6, damageDescription: "6 (1d4 + 4) piercing damage plus 3 (1d6) poison damage." }
    ]
  },
  {
    id: "cm-uthgardt-shaman",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "Uthgardt Shaman",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Neutral",
    speed: "30 ft.",
    challengeRating: 5,
    experiencePoints: 1800,
    ac: 13,
    acNote: "Mage Armor",
    hp: 75,
    maxHp: 75,
    abilityScores: {
      strength: 10, dexterity: 14, constitution: 14,
      intelligence: 12, wisdom: 16, charisma: 11
    },
    savingThrows: { wisdom: 6 },
    skills: { Medicine: 6, Nature: 4, Religion: 6 },
    senses: { "passive Perception": "13" },
    languages: ["Common", "Druidic"],
    description: "Tribal shaman of the Uthgardt, the barbarian people of the North. Allies with frost giants after the ordning broke.",
    traits: [
      { name: "Spellcasting", description: "The shaman is a 7th-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 14, +6 to hit with spell attacks). At will: druidcraft, guidance. 3/day each: cure wounds, thunderwave. 1/day each: call lightning, healing spirit, lightning bolt." }
    ],
    actions: [
      { name: "Multiattack", description: "The shaman makes two attacks." },
      { name: "Quarterstaff", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "6 (1d8 + 2) bludgeoning damage." },
      { name: "Javelin", description: "Melee or Ranged Weapon Attack", attackBonus: 4, damageDescription: "5 (1d6 + 2) piercing damage." }
    ]
  },
  {
    id: "cm-slarkrethel",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "Slarkrethel the Kraken",
    size: "huge",
    type: "monstrosity",
    alignment: "Chaotic Evil",
    speed: "20 ft., swim 60 ft.",
    challengeRating: 23,
    experiencePoints: 50000,
    ac: 18,
    acNote: "natural armor",
    hp: 472,
    maxHp: 472,
    abilityScores: {
      strength: 25, dexterity: 11, constitution: 25,
      intelligence: 21, wisdom: 18, charisma: 19
    },
    savingThrows: { strength: 12, dexterity: 6, constitution: 12, wisdom: 9 },
    skills: { Perception: 14 },
    damageImmunities: ["lightning", "poison"],
    conditionImmunities: ["frightened", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "24" },
    languages: ["Abyssal", "Common", "Deep Speech", "telepathy 120 ft."],
    description: "The kraken patron of the Kraken Society, manipulating events from its lair in the Trackless Sea.",
    traits: [
      { name: "Amphibious", description: "Slarkrethel can breathe air and water." },
      { name: "Freedom of Movement", description: "Slarkrethel ignores difficult terrain, magical or otherwise, and effects that would end his movement or reduce his speed." },
      { name: "Magic Resistance", description: "Slarkrethel has advantage on saving throws against spells and other magical effects." },
      { name: "Siege Monster", description: "Slarkrethel deals double damage to objects and structures." }
    ],
    actions: [
      { name: "Multiattack", description: "Slarkrethel makes three Tentacle attacks, one Beak attack, and uses Fling." },
      { name: "Tentacle", description: "Melee Weapon Attack", attackBonus: 14, damageDescription: "20 (3d8 + 7) bludgeoning damage. The target is grappled (escape DC 18). Until this grapple ends, the target is restrained and takes 20 (3d8 + 7) bludgeoning damage at the start of each of Slarkrethel's turns." },
      { name: "Beak", description: "Melee Weapon Attack", attackBonus: 14, damageDescription: "32 (5d10 + 7) piercing damage." },
      { name: "Lightning Storm (Recharge 5-6)", description: "Slarkrethel magically creates three bolts of lightning, each of which can be aimed at any point he can see within 120 ft. Each creature within 5 ft. of a bolt makes a DC 18 Dexterity save, taking 22 (4d10) lightning damage on a failure, or half on a success." },
      { name: "Fling", description: "Slarkrethel flings one grappled creature up to 60 ft. in any direction. The creature takes 20 (3d8 + 7) bludgeoning damage on landing." }
    ],
    legendaryActions: [
      { name: "Tentacle Attack", description: "Slarkrethel makes one Tentacle attack." },
      { name: "Lightning Storm (Costs 2 Actions)", description: "Slarkrethel uses Lightning Storm, creating only two lightning bolts." },
      { name: "Ink Cloud", description: "Slarkrethel creates a 60-foot-radius cloud of ink centered on a point he can see within 120 ft. The cloud spreads around corners, heavily obscures the area, and lasts for 1 minute. Slarkrethel can see through the cloud." }
    ],
    legendaryActionCount: 3
  },
  {
    id: "cm-king-hekaton",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "King Hekaton",
    size: "huge",
    type: "giant",
    alignment: "Chaotic Good",
    speed: "50 ft., swim 50 ft.",
    challengeRating: 16,
    experiencePoints: 15000,
    ac: 20,
    acNote: "natural armor",
    hp: 230,
    maxHp: 230,
    abilityScores: {
      strength: 29, dexterity: 14, constitution: 20,
      intelligence: 16, wisdom: 18, charisma: 18
    },
    savingThrows: { strength: 14, dexterity: 8, constitution: 11, wisdom: 10, charisma: 10 },
    skills: { Athletics: 14, Insight: 10, Perception: 10, Persuasion: 10 },
    senses: { "passive Perception": "20" },
    languages: ["Common", "Giant", "Primordial"],
    description: "The storm giant king of the Maelstrom, patriarch of the royal line. Captured by Iymrith and freed by the party.",
    traits: [
      { name: "Amphibious", description: "Hekaton can breathe air and water." },
      { name: "Innate Spellcasting", description: "Hekaton's innate spellcasting ability is Charisma (spell save DC 18). At will: detect magic, fog cloud, light. 1/day each: control weather, water breathing." }
    ],
    actions: [
      { name: "Multiattack", description: "Hekaton makes two Trident attacks and uses Lightning Throw if available." },
      { name: "Trident", description: "Melee or Ranged Weapon Attack", attackBonus: 14, damageDescription: "22 (3d8 + 9) piercing damage, or 24 (3d10 + 9) if used two-handed." },
      { name: "Lightning Strike (Recharge 4-6)", description: "Hekaton hurls a magical lightning bolt at a point he can see within 500 ft. Each creature within 10 ft. of the point makes a DC 19 Dexterity save, taking 49 (9d10) lightning damage on a failure, or half on a success." }
    ],
    legendaryActions: [
      { name: "Trident Attack", description: "Hekaton makes one Trident attack." },
      { name: "Lightning Strike (Costs 2 Actions)", description: "Hekaton uses Lightning Strike if available, otherwise makes one Trident attack." },
      { name: "Storm's Blessing", description: "Hekaton targets one ally he can see. That ally has advantage on its next attack roll." }
    ],
    legendaryActionCount: 3
  },
  {
    id: "cm-iymrith-disguised",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "Iymrith in Human Form",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 0.125,
    ac: 10,
    hp: 4,
    maxHp: 4,
    abilityScores: {
      strength: 10, dexterity: 10, constitution: 10,
      intelligence: 10, wisdom: 10, charisma: 10
    },
    senses: { "passive Perception": "10" },
    languages: ["Common"],
    description: "The ancient blue dragon Iymrith disguised as a pale human attendant at the Eye of the All-Father. Maintains her true form on another plane.",
    traits: [
      { name: "Polymorphed Dragon", description: "This is the human form of Iymrith the Blue Dragon. She is invulnerable to harm in this form while her true form remains alive on another plane. Detect magic reveals strong conjuration magic; true seeing reveals her draconic nature." }
    ],
    actions: []
  },
  {
    id: "cm-iymrith-ancient-blue",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "Iymrith the Blue Dragon",
    size: "huge",
    type: "dragon",
    alignment: "Chaotic Evil",
    speed: "40 ft., burrow 40 ft., fly 80 ft.",
    challengeRating: 22,
    experiencePoints: 41000,
    ac: 19,
    acNote: "natural armor",
    hp: 481,
    maxHp: 481,
    abilityScores: {
      strength: 27, dexterity: 10, constitution: 25,
      intelligence: 16, wisdom: 13, charisma: 13
    },
    savingThrows: { dexterity: 5, constitution: 12, wisdom: 6, charisma: 6 },
    skills: { Perception: 16, Persuasion: 6, Stealth: 5 },
    damageImmunities: ["lightning"],
    senses: { blindsight: "60 ft.", darkvision: "120 ft.", truesight: "30 ft.", "passive Perception": "26" },
    languages: ["Common", "Draconic"],
    description: "An ancient blue dragon masquerading as the storm giant princess Iymrith. The secret mastermind behind the giant civil war and the final boss of Storm King's Thunder.",
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If Iymrith fails a saving throw, she can choose to succeed instead." },
      { name: "Magic Resistance", description: "Iymrith has advantage on saving throws against spells and other magical effects." },
      { name: "Innate Spellcasting", description: "Iymrith's spellcasting ability is Charisma (spell save DC 18). At will: detect magic, minor illusion. 1/day each: confusion, hold monster, suggestion, Major Image (as 4th level)." }
    ],
    actions: [
      { name: "Multiattack", description: "Iymrith makes three attacks: one Bite and two Claws." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 14, damageDescription: "19 (2d10 + 8) piercing damage plus 9 (2d8) lightning damage." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 14, damageDescription: "15 (2d6 + 8) slashing damage." },
      { name: "Tail", description: "Melee Weapon Attack", attackBonus: 14, damageDescription: "17 (2d8 + 8) bludgeoning damage." },
      { name: "Lightning Breath (Recharge 5-6)", description: "Iymrith exhales lightning in a 120-foot line that is 10 ft. wide. Each creature makes a DC 20 Dexterity save, taking 88 (16d10) lightning damage on a failure, or half on a success." }
    ],
    legendaryActions: [
      { name: "Bite Attack", description: "Iymrith makes one Bite attack." },
      { name: "Claw Attack", description: "Iymrith makes one Claw attack." },
      { name: "Wing Attack (Costs 2 Actions)", description: "Iymrith beats her wings. Each creature within 15 ft. makes a DC 22 Strength save or is knocked prone and pushed 30 ft. away. Iymrith can then fly up to half her speed." }
    ],
    legendaryActionCount: 3
  },
  {
    id: "cm-maegera-dawn-titan",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "Maegera the Dawn Titan",
    size: "huge",
    type: "elemental",
    alignment: "Chaotic Good",
    speed: "40 ft.",
    challengeRating: 22,
    experiencePoints: 41000,
    ac: 22,
    acNote: "natural armor",
    hp: 481,
    maxHp: 481,
    abilityScores: {
      strength: 30, dexterity: 10, constitution: 26,
      intelligence: 14, wisdom: 14, charisma: 20
    },
    savingThrows: { strength: 15, dexterity: 5, constitution: 13, wisdom: 7, charisma: 10 },
    skills: { Athletics: 15, Perception: 7 },
    damageImmunities: ["fire"],
    senses: { truesight: "60 ft.", "passive Perception": "17" },
    languages: ["Common", "Ignan", "Primordial"],
    description: "An elder fire titan trapped beneath Iymrith's desert lair. Imprisoned by the dragon and freed during the final confrontation.",
    traits: [
      { name: "Damage Resistance (Nonmagical)", description: "Maegera takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical." },
      { name: "Legendary Resistance (3/Day)", description: "If Maegera fails a saving throw, she can choose to succeed instead." },
      { name: "Magic Resistance", description: "Maegera has advantage on saving throws against spells and other magical effects." },
      { name: "Siege Monster", description: "Maegera deals double damage to objects and structures." }
    ],
    actions: [
      { name: "Multiattack", description: "Maegera makes two Molten Boulder attacks and one Fiery Slam attack." },
      { name: "Fiery Slam", description: "Melee Weapon Attack", attackBonus: 15, damageDescription: "22 (3d8 + 10) bludgeoning damage plus 14 (4d6) fire damage." },
      { name: "Molten Boulder", description: "Ranged Weapon Attack", attackBonus: 15, damageDescription: "21 (3d8 + 10) bludgeoning damage plus 14 (4d6) fire damage." },
      { name: "Dawn Fire (Recharge 5-6)", description: "Maegera emits a 60-foot cone of brilliant flame. Each creature makes a DC 21 Dexterity save, taking 66 (12d10) fire damage and 66 (12d10) radiant damage on a failure, or half on a success." }
    ],
    legendaryActions: [
      { name: "Molten Boulder", description: "Maegera makes one Molten Boulder attack." },
      { name: "Dawn Step", description: "Maegera teleports up to 60 ft. to an unoccupied space she can see." },
      { name: "Immolating Aura (Costs 2 Actions)", description: "Each creature of Maegera's choice within 30 ft. makes a DC 21 Constitution save, taking 21 (6d6) fire damage on a failure, or half on a success." }
    ],
    legendaryActionCount: 3
  },
  // SRD-faithful mirrors used in Storm King's Thunder encounters
  {
    id: "cm-cloud-giant",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "Cloud Giant",
    size: "huge",
    type: "giant",
    alignment: "Neutral Good",
    speed: "40 ft.",
    challengeRating: 9,
    experiencePoints: 5000,
    ac: 14,
    acNote: "natural armor",
    hp: 200,
    maxHp: 200,
    abilityScores: {
      strength: 27, dexterity: 10, constitution: 22,
      intelligence: 12, wisdom: 16, charisma: 16
    },
    savingThrows: { constitution: 10, charisma: 7 },
    skills: { Insight: 7, Perception: 7 },
    senses: { "passive Perception": "17" },
    languages: ["Common", "Giant"],
    description: "A cloud giant - one of the giant lords displaced by the breaking of the ordning.",
    traits: [
      { name: "Keen Smell", description: "The giant has advantage on Wisdom (Perception) checks that rely on smell." }
    ],
    actions: [
      { name: "Multiattack", description: "The giant makes two Morningstar attacks." },
      { name: "Morningstar", description: "Melee Weapon Attack", attackBonus: 12, damageDescription: "29 (4d8 + 9) piercing damage." },
      { name: "Rock", description: "Ranged Weapon Attack", attackBonus: 12, damageDescription: "35 (7d6 + 9) bludgeoning damage." }
    ],
    reactions: [
      { name: "Catch Rock", description: "The giant has advantage on Dexterity saving throws to avoid taking damage from a ranged attack that deals bludgeoning damage, and it catches the rock if it avoids the damage." }
    ]
  },
  {
    id: "cm-frost-giant",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "Frost Giant",
    size: "large",
    type: "giant",
    alignment: "Neutral Evil",
    speed: "40 ft.",
    challengeRating: 8,
    experiencePoints: 3900,
    ac: 15,
    acNote: "natural armor",
    hp: 138,
    maxHp: 138,
    abilityScores: {
      strength: 23, dexterity: 9, constitution: 21,
      intelligence: 9, wisdom: 10, charisma: 12
    },
    savingThrows: { constitution: 8, charisma: 4 },
    skills: { Athletics: 9, Perception: 3 },
    senses: { "passive Perception": "13" },
    languages: ["Common", "Giant"],
    description: "A frost giant of the frozen north, displaced by the breaking of the ordning.",
    traits: [
      { name: "Keen Smell", description: "The giant has advantage on Wisdom (Perception) checks that rely on smell." }
    ],
    actions: [
      { name: "Multiattack", description: "The giant makes two Greataxe attacks." },
      { name: "Greataxe", description: "Melee Weapon Attack", attackBonus: 9, damageDescription: "25 (3d12 + 6) slashing damage, or 21 (3d10 + 6) if used one-handed." },
      { name: "Rock", description: "Ranged Weapon Attack", attackBonus: 9, damageDescription: "28 (4d10 + 6) bludgeoning damage." }
    ],
    reactions: [
      { name: "Catch Rock", description: "The giant has advantage on Dexterity saving throws to avoid taking damage from a ranged attack that deals bludgeoning damage, and it catches the rock if it avoids the damage." }
    ]
  },
  {
    id: "cm-fire-giant",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "Fire Giant",
    size: "huge",
    type: "giant",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 9,
    experiencePoints: 5000,
    ac: 18,
    acNote: "plate armor",
    hp: 162,
    maxHp: 162,
    abilityScores: {
      strength: 25, dexterity: 9, constitution: 23,
      intelligence: 11, wisdom: 14, charisma: 13
    },
    savingThrows: { strength: 12, dexterity: 4, constitution: 10, wisdom: 6, charisma: 5 },
    skills: { Athletics: 12, Perception: 6 },
    senses: { "passive Perception": "16" },
    languages: ["Common", "Giant"],
    description: "A fire giant from the Muspelheim, displaced by the breaking of the ordning.",
    traits: [
      { name: "Keen Smell", description: "The giant has advantage on Wisdom (Perception) checks that rely on smell." }
    ],
    actions: [
      { name: "Multiattack", description: "The giant makes two Melee attacks." },
      { name: "Melee Attack", description: "Melee Weapon Attack", attackBonus: 11, damageDescription: "21 (3d8 + 7) bludgeoning damage, or 22 (3d10 + 7) if used two-handed." },
      { name: "Rock", description: "Ranged Weapon Attack", attackBonus: 11, damageDescription: "29 (4d10 + 7) bludgeoning damage." }
    ],
    reactions: [
      { name: "Catch Rock", description: "The giant has advantage on Dexterity saving throws to avoid taking damage from a ranged attack that deals bludgeoning damage, and it catches the rock if it avoids the damage." }
    ]
  },
  {
    id: "cm-hill-giant",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "Hill Giant",
    size: "large",
    type: "giant",
    alignment: "Chaotic Evil",
    speed: "40 ft.",
    challengeRating: 5,
    experiencePoints: 1800,
    ac: 13,
    acNote: "natural armor",
    hp: 105,
    maxHp: 105,
    abilityScores: {
      strength: 21, dexterity: 8, constitution: 17,
      intelligence: 5, wisdom: 9, charisma: 6
    },
    savingThrows: { strength: 8, constitution: 6 },
    skills: { Athletics: 8, Perception: 2 },
    senses: { "passive Perception": "12" },
    languages: ["Common", "Giant"],
    description: "A hill giant raider displaced by the breaking of the ordning.",
    traits: [],
    actions: [
      { name: "Multiattack", description: "The giant makes two Greatclub attacks." },
      { name: "Greatclub", description: "Melee Weapon Attack", attackBonus: 8, damageDescription: "18 (3d8 + 5) bludgeoning damage." },
      { name: "Rock", description: "Ranged Weapon Attack", attackBonus: 8, damageDescription: "21 (3d10 + 5) bludgeoning damage." }
    ],
    reactions: [
      { name: "Catch Rock", description: "The giant has advantage on Dexterity saving throws to avoid taking damage from a ranged attack that deals bludgeoning damage, and it catches the rock if he avoids the damage." }
    ]
  },
  {
    id: "cm-ogre",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "Ogre",
    size: "large",
    type: "giant",
    alignment: "Chaotic Evil",
    speed: "40 ft.",
    challengeRating: 2,
    experiencePoints: 450,
    ac: 11,
    acNote: "hide armor",
    hp: 59,
    maxHp: 59,
    abilityScores: {
      strength: 19, dexterity: 8, constitution: 16,
      intelligence: 5, wisdom: 7, charisma: 7
    },
    skills: { Athletics: 6 },
    senses: { darkvision: "60 ft.", "passive Perception": "8" },
    languages: ["Common", "Giant"],
    description: "Brutish giants used as foot soldiers by hill giants and other larger giants.",
    traits: [],
    actions: [
      { name: "Greatclub", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "13 (2d8 + 4) bludgeoning damage." },
      { name: "Javelin", description: "Melee or Ranged Weapon Attack", attackBonus: 6, damageDescription: "11 (2d6 + 4) piercing damage." }
    ]
  },
  {
    id: "cm-yeti",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "Yeti",
    size: "large",
    type: "monstrosity",
    alignment: "Chaotic Evil",
    speed: "40 ft., climb 40 ft.",
    challengeRating: 4,
    experiencePoints: 1100,
    ac: 13,
    acNote: "natural armor",
    hp: 51,
    maxHp: 51,
    abilityScores: {
      strength: 18, dexterity: 10, constitution: 18,
      intelligence: 8, wisdom: 12, charisma: 7
    },
    skills: { Perception: 4, Stealth: 3 },
    senses: { darkvision: "60 ft.", "passive Perception": "14" },
    languages: ["Yeti"],
    description: "A terrifying predator of the frozen north.",
    traits: [
      { name: "Keen Smell", description: "The yeti has advantage on Wisdom (Perception) checks that rely on smell." },
      { name: "Snow Camouflage", description: "The yeti has advantage on Dexterity (Stealth) checks made to hide in snowy terrain." }
    ],
    actions: [
      { name: "Multiattack", description: "The yeti makes two attacks: one with its claws and one with its bite." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "11 (2d6 + 4) slashing damage plus 3 (1d6) cold damage." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "10 (1d10 + 4) piercing damage plus 3 (1d6) cold damage." },
      { name: "Chilling Gaze", description: "The yeti targets one creature within 30 ft. The target makes a DC 13 Constitution save, taking 10 (3d6) cold damage on a failure, or half on a success." }
    ]
  },
  {
    id: "cm-polar-bear",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "Polar Bear",
    size: "large",
    type: "beast",
    alignment: "Unaligned",
    speed: "40 ft., swim 30 ft.",
    challengeRating: 2,
    experiencePoints: 450,
    ac: 12,
    hp: 42,
    maxHp: 42,
    abilityScores: {
      strength: 20, dexterity: 10, constitution: 16,
      intelligence: 2, wisdom: 13, charisma: 7
    },
    skills: { Perception: 3 },
    senses: { "passive Perception": "13" },
    languages: ["understands Common but can't speak"],
    description: "A massive bear of the arctic, often found in the company of frost giants.",
    traits: [
      { name: "Keen Smell", description: "The bear has advantage on Wisdom (Perception) checks that rely on smell." }
    ],
    actions: [
      { name: "Multiattack", description: "The bear makes two attacks: one Bite and one Claw." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "9 (1d8 + 5) piercing damage." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "11 (2d6 + 5) slashing damage." }
    ]
  },
  {
    id: "cm-magmin",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "Magmin",
    size: "small",
    type: "elemental",
    alignment: "Chaotic Neutral",
    speed: "30 ft.",
    challengeRating: 0.5,
    experiencePoints: 100,
    ac: 14,
    acNote: "natural armor",
    hp: 9,
    maxHp: 9,
    abilityScores: {
      strength: 7, dexterity: 15, constitution: 12,
      intelligence: 8, wisdom: 11, charisma: 10
    },
    damageImmunities: ["fire"],
    senses: { "passive Perception": "10" },
    languages: ["Ignan"],
    description: "A small flame elemental that serves fire giants.",
    traits: [
      { name: "Death Burst", description: "When the magmin dies, it explodes. Each creature within 5 ft. makes a DC 11 Constitution save, taking 3 (1d6) fire damage on a failure, or half on a success." },
      { name: "Fire Form", description: "The magmin can move through a space as narrow as 1 inch wide without squeezing. Any creature that touches the magmin takes 2 (1d4) fire damage. The magmin can deliberately ignite flammable objects with a touch." }
    ],
    actions: [
      { name: "Touch", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "4 (1d4 + 2) fire damage. If the target is a flammable object that hasn't been worn or carried, it catches fire." }
    ]
  },
  {
    id: "cm-cult-fanatic",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Storm King's Thunder",
    name: "Cult Fanatic",
    size: "medium",
    type: "humanoid",
    alignment: "Any Non-Good Alignment",
    speed: "30 ft.",
    challengeRating: 2,
    experiencePoints: 450,
    ac: 13,
    acNote: "leather armor",
    hp: 33,
    maxHp: 33,
    abilityScores: {
      strength: 11, dexterity: 14, constitution: 12,
      intelligence: 10, wisdom: 13, charisma: 14
    },
    skills: { Deception: 4, Persuasion: 4, Religion: 2 },
    senses: { "passive Perception": "11" },
    languages: ["any one language (usually Common)"],
    description: "A fanatic adherent of a dark cult - Kraken Society, Iymrith's cult, or similar.",
    traits: [
      { name: "Dark Devotion", description: "The fanatic has advantage on saving throws against being charmed or frightened." },
      { name: "Spellcasting", description: "The fanatic is a 4th-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 11, +3 to hit with spell attacks). At will: light, sacred flame. 1/day each: command, shield of faith." }
    ],
    actions: [
      { name: "Multiattack", description: "The fanatic makes two melee attacks." },
      { name: "Dagger", description: "Melee or Ranged Weapon Attack", attackBonus: 4, damageDescription: "4 (1d4 + 2) piercing damage." }
    ]
  },
  // ─── Out of the Abyss ─────────────────────────────────────────────────
  {
    id: "cm-ilvara-mizzrym",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Ilvara Mizzrym",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 5,
    experiencePoints: 1800,
    ac: 15,
    acNote: "studded leather",
    hp: 84,
    maxHp: 84,
    abilityScores: {
      strength: 10, dexterity: 18, constitution: 14,
      intelligence: 13, wisdom: 16, charisma: 17
    },
    savingThrows: { dexterity: 7, wisdom: 6, charisma: 6 },
    skills: { Deception: 6, Insight: 6, Perception: 6, Persuasion: 6, Stealth: 7 },
    senses: { darkvision: "120 ft.", "passive Perception": "16" },
    languages: ["Common", "Elvish", "Undercommon"],
    description: "Drow priestess of Lolth who commands the Velkynvelve outpost. Pursues the party across the Underdark for chapters 1-7.",
    traits: [
      { name: "Fey Ancestry", description: "Ilvara has advantage on saving throws against being charmed, and magic can't put her to sleep." },
      { name: "Innate Spellcasting", description: "Ilvara's innate spellcasting ability is Wisdom (spell save DC 13, +5 to hit with spell attacks). At will: dancing lights. 1/day each: darkness, faerie fire." },
      { name: "Spellcasting", description: "Ilvara is a 5th-level spellcaster. Her spellcasting ability is Wisdom (spell save DC 13, +5 to hit with spell attacks). At will: guidance, sacred flame, thaumaturgy. 2/day each: command, detect magic, inflict wounds. 1/day each: death word, dispel magic." }
    ],
    actions: [
      { name: "Multiattack", description: "Ilvara makes two Rapier attacks." },
      { name: "Rapier", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "7 (1d8 + 3) piercing damage plus 3 (1d6) poison damage." },
      { name: "Hand Crossbow", description: "Ranged Weapon Attack", attackBonus: 7, damageDescription: "6 (1d6 + 3) piercing damage plus 3 (1d6) poison damage." }
    ]
  },
  {
    id: "cm-themberchaud",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Themberchaud the Fire Giant Wyrmrider",
    size: "huge",
    type: "giant",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 9,
    experiencePoints: 5000,
    ac: 18,
    acNote: "plate armor",
    hp: 155,
    maxHp: 155,
    abilityScores: {
      strength: 25, dexterity: 9, constitution: 21,
      intelligence: 8, wisdom: 12, charisma: 14
    },
    savingThrows: { strength: 12, constitution: 9, wisdom: 5 },
    skills: { Athletics: 12, Intimidation: 6, Perception: 5 },
    senses: { "passive Perception": "15" },
    languages: ["Common", "Giant", "Draconic"],
    description: "A fire giant who rules Gracklstugh from below, riding a young red dragon named Ashvaxar and commanding the city's duergar through intimidation.",
    traits: [
      { name: "Wyrmrider", description: "Themberchaud is always mounted on his dragon Ashvaxar. While mounted, he cannot be targeted by melee attacks unless the attacker can also reach the dragon." }
    ],
    actions: [
      { name: "Multiattack", description: "Themberchaud makes two War Pick attacks." },
      { name: "War Pick", description: "Melee Weapon Attack", attackBonus: 11, damageDescription: "22 (3d8 + 8) piercing damage." },
      { name: "Rock", description: "Ranged Weapon Attack", attackBonus: 11, damageDescription: "30 (4d10 + 8) bludgeoning damage." },
      { name: "Fire Breath (Recharge 5-6)", description: "Themberchaud exhales fire in a 30-foot cone. Each creature makes a DC 16 Dexterity save, taking 28 (8d6) fire damage on a failure, or half on a success." }
    ]
  },
  {
    id: "cm-rockblight",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Rockblight (Corrupted Svirfneblin)",
    size: "small",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "20 ft.",
    challengeRating: 2,
    experiencePoints: 450,
    ac: 14,
    hp: 39,
    maxHp: 39,
    abilityScores: {
      strength: 8, dexterity: 14, constitution: 12,
      intelligence: 11, wisdom: 12, charisma: 9
    },
    skills: { Perception: 3, Stealth: 6 },
    damageVulnerabilities: ["radiant"],
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["Common", "Gnomish", "Undercommon"],
    description: "A svirfneblin whose mind was broken by the aboleth Song of the Deep. Now serves the Blingdenstone aboleth overlord with zealous obedience.",
    traits: [
      { name: "Compulsion", description: "If the rockblight takes psychic damage, it has disadvantage on attack rolls until the end of its next turn." },
      { name: "Psychic Resistance", description: "The rockblight has advantage on saving throws against being charmed." },
      { name: "Stone Camouflage", description: "The rockblight has advantage on Dexterity (Stealth) checks made to hide in rocky terrain." }
    ],
    actions: [
      { name: "Multiattack", description: "The rockblight makes two attacks: one with its shortsword and one with its poison bite." },
      { name: "Shortsword", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "5 (1d6 + 2) piercing damage." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "3 (1d4 + 1) piercing damage plus 4 (1d8) poison damage." },
      { name: "Poison Spray", description: "Ranged Spell Attack", attackBonus: 4, damageDescription: "5 (2d4) poison damage." }
    ]
  },
  {
    id: "cm-pudding-king",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "The Pudding King",
    size: "large",
    type: "ooze",
    alignment: "Neutral Evil",
    speed: "20 ft., climb 20 ft.",
    challengeRating: 8,
    experiencePoints: 3900,
    ac: 6,
    hp: 152,
    maxHp: 152,
    abilityScores: {
      strength: 14, dexterity: 6, constitution: 20,
      intelligence: 2, wisdom: 6, charisma: 1
    },
    conditionImmunities: ["blinded", "charmed", "deafened", "exhaustion", "frightened", "prone"],
    senses: { blindsight: "60 ft.", "passive Perception": "8" },
    languages: ["understands Undercommon but can't speak"],
    description: "An awakened, sentient gelatinous cube that rules the Pudding Court in Blingdenstone. Forms a crude crown of absorbed treasure.",
    traits: [
      { name: "Amorphous", description: "The Pudding King can move through a space as narrow as 1 inch wide without squeezing." },
      { name: "Damage Immunity (Acid)", description: "The Pudding King is immune to acid damage and any acid damage dealt to it is converted into temporary HP for one round." },
      { name: "Ooze Cube", description: "If the Pudding King is hit by a melee attack, the attacker takes 10 (3d6) acid damage. The Pudding King can occupy the same space as another creature." },
      { name: "Royal Parasol", description: "As a reaction, the Pudding King creates a 15-foot dome of hardened slime that grants three-quarters cover to allies within it for 1 minute (recharges after a long rest)." }
    ],
    actions: [
      { name: "Pseudopod", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "12 (3d6 + 3) acid damage. The target is grappled (escape DC 13). Until this grapple ends, the target takes 12 (3d6 + 3) acid damage at the start of each of the Pudding King's turns." },
      { name: "Engulf", description: "The Pudding King moves up to its speed. While doing so, it can enter Large or smaller creatures' spaces. Each time the Pudding King enters a creature's space, the creature makes a DC 13 Dexterity save or is engulfed and restrained." },
      { name: "Royal Command (Recharge 5-6)", description: "Each creature within 30 ft. that can hear the Pudding King makes a DC 14 Wisdom save or is charmed for 1 minute." }
    ]
  },
  {
    id: "cm-troglodyte-champion",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Troglodyte Champion",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 3,
    experiencePoints: 700,
    ac: 14,
    acNote: "natural armor",
    hp: 75,
    maxHp: 75,
    abilityScores: {
      strength: 17, dexterity: 12, constitution: 16,
      intelligence: 6, wisdom: 11, charisma: 9
    },
    skills: { Athletics: 6, Intimidation: 3 },
    damageImmunities: ["poison"],
    conditionImmunities: ["poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: ["Troglodyte"],
    description: "An elite troglodyte champion who leads a hunting pack in the Wormwrithings.",
    traits: [
      { name: "Chameleon Skin", description: "The troglodyte has advantage on Dexterity (Stealth) checks." },
      { name: "Stench of Death", description: "Any creature other than a troglodyte that starts its turn within 5 ft. makes a DC 13 Constitution save or is poisoned until the start of its next turn." }
    ],
    actions: [
      { name: "Multiattack", description: "The troglodyte makes three attacks: one Bite and two Claws." },
      { name: "Multiattack (Spit)", description: "The troglodyte makes a Bite attack and uses Spit." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "6 (1d6 + 3) piercing damage." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "7 (1d8 + 3) slashing damage." },
      { name: "Spit", description: "Ranged Weapon Attack", attackBonus: 5, damageDescription: "7 (2d6) poison damage. The target must succeed on a DC 13 Constitution save or be poisoned for 1 minute." }
    ]
  },
  {
    id: "cm-dark-hunter",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Dark Hunter",
    size: "medium",
    type: "monstrosity",
    alignment: "Neutral",
    speed: "30 ft., climb 30 ft.",
    challengeRating: 5,
    experiencePoints: 1800,
    ac: 16,
    acNote: "natural armor",
    hp: 75,
    maxHp: 75,
    abilityScores: {
      strength: 16, dexterity: 18, constitution: 14,
      intelligence: 5, wisdom: 12, charisma: 6
    },
    skills: { Perception: 6, Stealth: 9 },
    senses: { blindsight: "30 ft.", darkvision: "60 ft.", "passive Perception": "16" },
    languages: ["understands Undercommon but can't speak"],
    description: "An aberration that stalks the Wormwrithings tunnels, ambushing lone travelers. It can phase through solid stone at will.",
    traits: [
      { name: "Stone Strider", description: "The dark hunter can move through solid rock as if it were difficult terrain. It can't end its turn inside an object." },
      { name: "Keen Smell", description: "The hunter has advantage on Wisdom (Perception) checks that rely on smell." }
    ],
    actions: [
      { name: "Multiattack", description: "The dark hunter makes two Bite or Claw attacks." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "8 (1d8 + 4) piercing damage." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "9 (2d4 + 4) slashing damage." }
    ]
  },
  {
    id: "cm-elder-purple-worm",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Elder Purple Worm",
    size: "gargantuan",
    type: "monstrosity",
    alignment: "Unaligned",
    speed: "50 ft., burrow 30 ft.",
    challengeRating: 12,
    experiencePoints: 8400,
    ac: 18,
    acNote: "natural armor",
    hp: 247,
    maxHp: 247,
    abilityScores: {
      strength: 28, dexterity: 8, constitution: 22,
      intelligence: 1, wisdom: 8, charisma: 4
    },
    savingThrows: { constitution: 11 },
    skills: { Perception: 4 },
    senses: { blindsight: "30 ft.", tremorsense: "120 ft.", "passive Perception": "14" },
    languages: ["understands Common but can't speak"],
    description: "A massive purple worm from the deepest Underdark, much larger than its standard kin. The Vast Oblivium is its breeding ground.",
    traits: [],
    actions: [
      { name: "Multiattack", description: "The worm makes three attacks: one Bite, one Stinger, and one Tail. It can use its Tail attack only if its Stinger attack hits the same turn." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 14, damageDescription: "32 (4d12 + 9) piercing damage. If the target is a Large or smaller creature, it is grappled (escape DC 19) and pulled into the worm's gullet. While grappled this way, the target is blinded and restrained, and takes 28 (8d6) bludgeoning damage at the start of each of the worm's turns." },
      { name: "Stinger", description: "Melee Weapon Attack", attackBonus: 14, damageDescription: "21 (3d8 + 9) piercing damage. The target makes a DC 19 Constitution save, taking 24 (7d6) poison damage on a failure, or half on a success." },
      { name: "Tail", description: "Melee Weapon Attack", attackBonus: 14, damageDescription: "24 (3d10 + 9) bludgeoning damage. The target makes a DC 19 Strength save or is knocked prone." }
    ]
  },
  {
    id: "cm-maze-engine",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "The Maze Engine",
    size: "huge",
    type: "construct",
    alignment: "Unaligned",
    speed: "0 ft.",
    challengeRating: 14,
    experiencePoints: 11500,
    ac: 18,
    acNote: "natural armor",
    hp: 222,
    maxHp: 222,
    abilityScores: {
      strength: 21, dexterity: 6, constitution: 20,
      intelligence: 22, wisdom: 16, charisma: 10
    },
    savingThrows: { intelligence: 11, wisdom: 8 },
    skills: { Arcana: 11, Perception: 8 },
    damageImmunities: ["poison", "psychic"],
    conditionImmunities: ["blinded", "charmed", "deafened", "exhaustion", "frightened", "paralyzed", "petrified", "poisoned", "stunned"],
    senses: { truesight: "120 ft.", "passive Perception": "18" },
    languages: ["understands all languages but can't speak"],
    description: "An ancient construct at the heart of the Labyrinth that endlessly rebuilds its maze to entrap intruders.",
    traits: [
      { name: "Immutable Form", description: "The Maze Engine is immune to any spell or effect that would alter its form." },
      { name: "Magic Resistance", description: "The Maze Engine has advantage on saving throws against spells and other magical effects." },
      { name: "Wall Mover", description: "As a bonus action on each of its turns, the Maze Engine can teleport any portion of wall or floor within the Labyrinth up to 30 ft. Creatures within teleported space make a DC 18 Dexterity save, taking 21 (6d6) force damage on a failure, or half on a success." }
    ],
    actions: [
      { name: "Multiattack", description: "The Maze Engine makes two Slam attacks and casts one spell." },
      { name: "Slam", description: "Melee Weapon Attack", attackBonus: 10, damageDescription: "23 (3d10 + 7) bludgeoning damage plus 10 (3d6) force damage." },
      { name: "Spellcasting", description: "The Maze Engine is a 15th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 19, +11 to hit with spell attacks). At will: detect magic, mage hand. 3/day each: dispel magic, fear, hold person, lightning bolt. 1/day each: confusion, maze, prismatic wall, wall of force." }
    ],
    legendaryActions: [
      { name: "Wall Mover", description: "The Maze Engine uses its Wall Mover trait." },
      { name: "Slam", description: "The Maze Engine makes one Slam attack." },
      { name: "Cast a Spell", description: "The Maze Engine casts one of its prepared spells." }
    ],
    legendaryActionCount: 3
  },
  {
    id: "cm-spore-servant-brute",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Spore Servant Brute",
    size: "medium",
    type: "plant",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 4,
    experiencePoints: 1100,
    ac: 13,
    acNote: "natural armor",
    hp: 90,
    maxHp: 90,
    abilityScores: {
      strength: 18, dexterity: 8, constitution: 16,
      intelligence: 5, wisdom: 10, charisma: 5
    },
    skills: { Athletics: 7 },
    damageVulnerabilities: ["fire"],
    damageImmunities: ["poison"],
    conditionImmunities: ["blinded", "deafened", "frightened", "poisoned"],
    senses: { blindsight: "30 ft.", "passive Perception": "10" },
    languages: ["understands Demonic but can't speak"],
    description: "A once-human corpse reanimated by Zuggtmoy's fungal spores and bloated to enormous size. Found in the Araumycos and Demogorgon's lair.",
    traits: [
      { name: "Spore Infection", description: "Any creature that starts its turn within 5 ft. makes a DC 13 Constitution save or is infected with a disease. The disease has an incubation period of 1d4 days; afterwards the target takes 8 (2d8) necrotic damage per long rest and sprouts fungal growths (becoming a spore servant if reduced to 0 HP)." },
      { name: "False Appearance", description: "While motionless, the brute is indistinguishable from a normal pile of mushrooms." }
    ],
    actions: [
      { name: "Multiattack", description: "The brute makes two Fist attacks." },
      { name: "Fist", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "12 (2d8 + 4) bludgeoning damage plus 5 (1d10) necrotic damage." },
      { name: "Spore Burst (Recharge 5-6)", description: "The brute releases a 15-foot cone of spores. Each creature makes a DC 13 Constitution save, taking 14 (4d6) poison damage on a failure, or half on a success." }
    ]
  },
  {
    id: "cm-demogorgon",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Demogorgon, Prince of Demons",
    size: "huge",
    type: "fiend",
    alignment: "Chaotic Evil",
    speed: "40 ft., swim 40 ft.",
    challengeRating: 26,
    experiencePoints: 90000,
    ac: 22,
    acNote: "natural armor",
    hp: 666,
    maxHp: 666,
    abilityScores: {
      strength: 29, dexterity: 14, constitution: 24,
      intelligence: 26, wisdom: 20, charisma: 24
    },
    savingThrows: { strength: 15, dexterity: 10, constitution: 14, wisdom: 12, charisma: 14 },
    skills: { Deception: 14, Perception: 12, Persuasion: 14 },
    damageImmunities: ["poison"],
    conditionImmunities: ["charmed", "exhausted", "frightened", "paralyzed", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "22" },
    languages: ["Abyssal", "all", "telepathy 120 ft."],
    description: "The twin-headed Prince of Demons, mad-schemer of the Abyss. Demogorgon manifests in the Fetid Wedding and the final confrontation.",
    traits: [
      { name: "Damage Resistance (Nonmagical)", description: "Demogorgon takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical." },
      { name: "Legendary Resistance (5/Day)", description: "If Demogorgon fails a saving throw, he can choose to succeed instead." },
      { name: "Magic Resistance", description: "Demogorgon has advantage on saving throws against spells and other magical effects." },
      { name: "Two Heads", description: "Demogorgon has advantage on Wisdom (Perception) checks and on saving throws against being blinded, charmed, deafened, frightened, stunned, or knocked unconscious." }
    ],
    actions: [
      { name: "Multiattack", description: "Demogorgon makes two Bite attacks, one with each head, and four Tentacle attacks. He can use Spellcasting in place of any of these attacks." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 17, damageDescription: "29 (4d10 + 9) piercing damage plus 14 (4d6) poison damage." },
      { name: "Tentacle", description: "Melee Weapon Attack", attackBonus: 17, damageDescription: "23 (4d8 + 9) bludgeoning damage plus 14 (4d6) poison damage, and the target is grappled (escape DC 22)." },
      { name: "Spellcasting", description: "Demogorgon is a 20th-level spellcaster. His spellcasting ability is Intelligence (spell save DC 24, +16 to hit with spell attacks). At will: detect magic, major image. 3/day each: dispel magic, fear, hold monster, telekinesis. 1/day each: confusion, project image, teleport." }
    ],
    legendaryActions: [
      { name: "Bite or Tentacle Attack", description: "Demogorgon makes one Bite or Tentacle attack with each head." },
      { name: "Cast a Spell", description: "Demogorgon casts one of his prepared spells." },
      { name: "Acid Breath (Costs 2 Actions)", description: "Each head exhales acid in a 30-foot cone. Each creature makes a DC 22 Dexterity save, taking 35 (10d6) acid damage on a failure, or half on a success." }
    ],
    legendaryActionCount: 3
  },
  {
    id: "cm-orcus",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Orcus, Demon Prince of Undeath",
    size: "huge",
    type: "fiend",
    alignment: "Chaotic Evil",
    speed: "40 ft., fly 40 ft.",
    challengeRating: 27,
    experiencePoints: 105000,
    ac: 22,
    acNote: "natural armor",
    hp: 660,
    maxHp: 660,
    abilityScores: {
      strength: 27, dexterity: 14, constitution: 26,
      intelligence: 22, wisdom: 18, charisma: 26
    },
    savingThrows: { strength: 15, dexterity: 10, constitution: 15, wisdom: 11, charisma: 15 },
    skills: { Arcana: 14, Persuasion: 15 },
    damageImmunities: ["poison"],
    conditionImmunities: ["charmed", "exhausted", "frightened", "paralyzed", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "20" },
    languages: ["Abyssal", "all", "telepathy 120 ft."],
    description: "The Demon Prince of Undeath, wielder of the Wand of Orcus. Seeks to make all existence undead.",
    traits: [
      { name: "Damage Resistance (Nonmagical)", description: "Orcus takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical." },
      { name: "Legendary Resistance (5/Day)", description: "If Orcus fails a saving throw, he can choose to succeed instead." },
      { name: "Magic Resistance", description: "Orcus has advantage on saving throws against spells and other magical effects." }
    ],
    actions: [
      { name: "Multiattack", description: "Orcus makes one Wand of Orcus attack, one Maul attack, and one Tail attack." },
      { name: "Wand of Orcus", description: "Melee Weapon Attack", attackBonus: 17, damageDescription: "21 (2d10 + 10) bludgeoning damage plus 35 (10d6) necrotic damage." },
      { name: "Maul", description: "Melee Weapon Attack", attackBonus: 17, damageDescription: "30 (4d8 + 12) bludgeoning damage." },
      { name: "Tail", description: "Melee Weapon Attack", attackBonus: 17, damageDescription: "21 (2d10 + 10) bludgeoning damage." },
      { name: "Death Implosion (Recharge 5-6)", description: "Each creature within 60 ft. of Orcus makes a DC 24 Constitution save, taking 70 (20d6) necrotic damage on a failure, or half on a success. Humanoids killed by this attack rise as ghouls under Orcus's control." }
    ],
    legendaryActions: [
      { name: "Wand of Orcus", description: "Orcus makes one Wand of Orcus attack." },
      { name: "Cast a Spell", description: "Orcus casts one of his prepared spells." },
      { name: "Necrotic Burst (Costs 2 Actions)", description: "Each creature of Orcus's choice within 30 ft. makes a DC 24 Constitution save, taking 28 (8d6) necrotic damage on a failure, or half on a success." }
    ],
    legendaryActionCount: 3
  },
  {
    id: "cm-zuggtmoy",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Zuggtmoy, Lady of Fungi",
    size: "huge",
    type: "fiend",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 22,
    experiencePoints: 41000,
    ac: 20,
    acNote: "natural armor",
    hp: 480,
    maxHp: 480,
    abilityScores: {
      strength: 24, dexterity: 14, constitution: 24,
      intelligence: 22, wisdom: 18, charisma: 24
    },
    savingThrows: { constitution: 13, wisdom: 11, charisma: 13 },
    skills: { Deception: 13, Perception: 11 },
    damageImmunities: ["poison"],
    conditionImmunities: ["blinded", "charmed", "deafened", "exhausted", "frightened", "paralyzed", "poisoned", "stunned"],
    senses: { truesight: "120 ft.", "passive Perception": "21" },
    languages: ["Abyssal", "all", "telepathy 120 ft."],
    description: "The Demon Queen of Fungi, who corrupts myconids and plant life. She appears in Neverlight Grove (Ch 5) and the final confrontation (Ch 17).",
    traits: [
      { name: "Damage Resistance (Nonmagical)", description: "Zuggtmoy takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical." },
      { name: "Legendary Resistance (4/Day)", description: "If Zuggtmoy fails a saving throw, she can choose to succeed instead." },
      { name: "Magic Resistance", description: "Zuggtmoy has advantage on saving throws against spells and other magical effects." },
      { name: "Spore Aura", description: "Any creature that starts its turn within 30 ft. makes a DC 22 Constitution save or is infected with demon spores (DC 22 Constitution save every 24 hours or 11 (2d10) necrotic damage and paralyzed until the end of the next turn)." }
    ],
    actions: [
      { name: "Multiattack", description: "Zuggtmoy makes two Slam attacks and one Infestation attack." },
      { name: "Slam", description: "Melee Weapon Attack", attackBonus: 13, damageDescription: "23 (3d10 + 8) bludgeoning damage plus 14 (4d6) poison damage." },
      { name: "Infestation", description: "Melee Spell Attack", attackBonus: 13, damageDescription: "21 (4d8 + 3) necrotic damage. The target is infected with demon spores (see Spore Aura)." },
      { name: "Fungal Bloom (Recharge 5-6)", description: "Zuggtmoy fills a 60-foot radius with toxic spores. Each creature in the area makes a DC 22 Constitution save, taking 49 (14d6) poison damage on a failure, or half on a success. Plant creatures and undead are unaffected." }
    ],
    legendaryActions: [
      { name: "Slam", description: "Zuggtmoy makes one Slam attack." },
      { name: "Infestation", description: "Zuggtmoy makes one Infestation attack." },
      { name: "Summon Spore Servants (Costs 2 Actions)", description: "Zuggtmoy summons 2d4 spore servants in unoccupied spaces she can see." }
    ],
    legendaryActionCount: 3
  },
  {
    id: "cm-juiblex",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Juiblex, Demon Prince of Oozes",
    size: "huge",
    type: "fiend",
    alignment: "Chaotic Evil",
    speed: "20 ft., climb 20 ft., swim 20 ft.",
    challengeRating: 22,
    experiencePoints: 41000,
    ac: 14,
    acNote: "natural armor",
    hp: 450,
    maxHp: 450,
    abilityScores: {
      strength: 26, dexterity: 6, constitution: 26,
      intelligence: 20, wisdom: 16, charisma: 18
    },
    savingThrows: { strength: 14, constitution: 14, wisdom: 10 },
    skills: { Perception: 10 },
    damageImmunities: ["acid", "poison"],
    conditionImmunities: ["blinded", "charmed", "deafened", "exhausted", "frightened", "grappled", "paralyzed", "poisoned", "prone", "restrained", "stunned"],
    senses: { blindsight: "120 ft.", "passive Perception": "20" },
    languages: ["Abyssal", "all", "telepathy 120 ft."],
    description: "The Faceless Lord, Demon Prince of Oozes. A writhing mass of black ichor and acidic slime.",
    traits: [
      { name: "Damage Resistance (Nonmagical)", description: "Juiblex takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical." },
      { name: "Legendary Resistance (4/Day)", description: "If Juiblex fails a saving throw, he can choose to succeed instead." },
      { name: "Magic Resistance", description: "Juiblex has advantage on saving throws against spells and other magical effects." },
      { name: "Ooze Form", description: "Juiblex can occupy the space of another Large creature and can move through a space as narrow as 1 inch wide." }
    ],
    actions: [
      { name: "Multiattack", description: "Juiblex makes two Pseudopod attacks and one Acid Breath attack." },
      { name: "Pseudopod", description: "Melee Weapon Attack", attackBonus: 14, damageDescription: "22 (3d10 + 8) bludgeoning damage plus 21 (6d6) acid damage." },
      { name: "Constrict", description: "Melee Weapon Attack", attackBonus: 14, damageDescription: "13 (2d8 + 8) bludgeoning damage. The target is grappled (escape DC 22)." },
      { name: "Acid Breath (Recharge 5-6)", description: "Juiblex exhales acid in a 60-foot cone. Each creature makes a DC 22 Dexterity save, taking 70 (20d6) acid damage on a failure, or half on a success." }
    ],
    legendaryActions: [
      { name: "Pseudopod", description: "Juiblex makes one Pseudopod attack." },
      { name: "Constrict", description: "Juiblex makes one Constrict attack." },
      { name: "Split (Costs 2 Actions)", description: "Juiblex splits into two Juiblex duplicates, each with half its current HP. Each duplicate acts on the same initiative count. The duplicates merge back together at the start of Juiblex's next turn." }
    ],
    legendaryActionCount: 3
  },
  {
    id: "cm-fraz-urbluu",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Fraz-Urb'luu, Prince of Deception",
    size: "huge",
    type: "fiend",
    alignment: "Chaotic Evil",
    speed: "40 ft.",
    challengeRating: 21,
    experiencePoints: 33000,
    ac: 20,
    acNote: "natural armor",
    hp: 437,
    maxHp: 437,
    abilityScores: {
      strength: 24, dexterity: 16, constitution: 24,
      intelligence: 22, wisdom: 20, charisma: 22
    },
    savingThrows: { strength: 13, dexterity: 10, constitution: 13, wisdom: 11, charisma: 11 },
    skills: { Deception: 18, Persuasion: 11 },
    damageImmunities: ["psychic"],
    conditionImmunities: ["charmed", "exhausted", "frightened"],
    senses: { truesight: "120 ft.", "passive Perception": "20" },
    languages: ["Abyssal", "all", "telepathy 120 ft."],
    description: "The Prince of Deception, exiled to the Stygian depths by his fellow demon lords. His image stands in Mantol-Derith.",
    traits: [
      { name: "Damage Resistance (Nonmagical)", description: "Fraz-Urb'luu takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical." },
      { name: "Legendary Resistance (4/Day)", description: "If Fraz-Urb'luu fails a saving throw, he can choose to succeed instead." },
      { name: "Magic Resistance", description: "Fraz-Urb'luu has advantage on saving throws against spells and other magical effects." }
    ],
    actions: [
      { name: "Multiattack", description: "Fraz-Urb'luu makes two Fist attacks and casts one spell." },
      { name: "Fist", description: "Melee Weapon Attack", attackBonus: 13, damageDescription: "21 (3d8 + 8) bludgeoning damage plus 10 (3d6) psychic damage." },
      { name: "Spellcasting", description: "Fraz-Urb'luu is a 16th-level spellcaster. His spellcasting ability is Charisma (spell save DC 19, +11 to hit with spell attacks). At will: detect magic, disguise self. 3/day each: charm monster, hold monster, major image. 1/day each: dominate monster, feeblemind, project image, teleport." }
    ],
    legendaryActions: [
      { name: "Fist Attack", description: "Fraz-Urb'luu makes one Fist attack." },
      { name: "Cast a Spell", description: "Fraz-Urb'luu casts one of his prepared spells." },
      { name: "Prying Eyes (Costs 2 Actions)", description: "Fraz-Urb'luu summons 1d6 magic eye servants that scout for him." }
    ],
    legendaryActionCount: 3
  },
  {
    id: "cm-derro-savant",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Derro Savant",
    size: "small",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 5,
    experiencePoints: 1800,
    ac: 15,
    acNote: "Mage Armor",
    hp: 75,
    maxHp: 75,
    abilityScores: {
      strength: 10, dexterity: 14, constitution: 12,
      intelligence: 17, wisdom: 12, charisma: 8
    },
    savingThrows: { intelligence: 7, wisdom: 4 },
    skills: { Arcana: 7, Perception: 4 },
    senses: { darkvision: "120 ft.", "passive Perception": "14" },
    languages: ["Common", "Dwarvish", "Undercommon"],
    description: "A mad, psionic derro mage who manipulates the party's minds during the Underdark journey.",
    traits: [
      { name: "Innate Spellcasting (Psionics)", description: "The savant's spellcasting ability is Intelligence (spell save DC 14, +7 to hit with spell attacks). At will: friends, mage hand. 1/day each: charm person, detect thoughts, phantasmal force, sleep." },
      { name: "Magic Resistance", description: "The savant has advantage on saving throws against spells and other magical effects." }
    ],
    actions: [
      { name: "Multiattack", description: "The savant makes two attacks." },
      { name: "Dagger", description: "Melee or Ranged Weapon Attack", attackBonus: 5, damageDescription: "4 (1d4 + 2) piercing damage." },
      { name: "Psychic Lance (Recharge 5-6)", description: "The savant targets one creature within 60 ft. The target makes a DC 14 Intelligence save, taking 22 (4d10) psychic damage on a failure, or half on a success." }
    ]
  },
  {
    id: "cm-ixitxachitl",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Ixitxachitl (Vampiric)",
    size: "medium",
    type: "aberration",
    alignment: "Chaotic Evil",
    speed: "0 ft., swim 40 ft.",
    challengeRating: 6,
    experiencePoints: 2300,
    ac: 17,
    acNote: "natural armor",
    hp: 110,
    maxHp: 110,
    abilityScores: {
      strength: 14, dexterity: 14, constitution: 18,
      intelligence: 10, wisdom: 11, charisma: 8
    },
    skills: { Perception: 2, Stealth: 4 },
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["Abyssal", "Undercommon"],
    description: "A vampiric ray-like aberration that lurks in the dark waters of the Underdark, draining blood from prey.",
    traits: [
      { name: "Blood Frenzy", description: "The ixitxachitl has advantage on attack rolls against any creature that doesn't have all its hit points." },
      { name: "Damage Resistance (Nonmagical)", description: "The ixitxachitl takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical." },
      { name: "Incorporeal Movement", description: "The ixitxachitl can move through other creatures and objects as if they were difficult terrain. It takes 5 (1d10) force damage if it ends its turn inside an object." }
    ],
    actions: [
      { name: "Life Drain", description: "Melee Spell Attack", attackBonus: 6, damageDescription: "14 (3d8 + 1) necrotic damage. The target makes a DC 14 Constitution save or its hit point maximum is reduced by an amount equal to the damage taken. The ixitxachitl regains hit points equal to that amount." }
    ]
  },  // SRD-faithful mirrors used in Out of the Abyss encounters
  {
    id: "cm-drow-elite-warrior",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Drow Elite Warrior",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 5,
    experiencePoints: 1800,
    ac: 18,
    acNote: "chain shirt, shield",
    hp: 71,
    maxHp: 71,
    abilityScores: {
      strength: 13, dexterity: 18, constitution: 14,
      intelligence: 13, wisdom: 14, charisma: 13
    },
    savingThrows: { dexterity: 7, intelligence: 4, wisdom: 4 },
    skills: { Perception: 4, Stealth: 7 },
    damageImmunities: ["poison"],
    conditionImmunities: ["poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "14" },
    languages: ["Common", "Elvish", "Undercommon"],
    traits: [
      { name: "Fey Ancestry", description: "The drow has advantage on saving throws against being charmed, and magic can't put it to sleep." },
      { name: "Innate Spellcasting", description: "Innate spellcasting ability is Charisma (spell save DC 12). At will: dancing lights. 1/day each: darkness, faerie fire." }
    ],
    actions: [
      { name: "Multiattack", description: "The drow makes three attacks: two with its shortsword and one with its hand crossbow. It can replace one shortsword attack with a bite attack." },
      { name: "Shortsword", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "6 (1d6 + 3) piercing damage plus 10 (3d6) poison damage." },
      { name: "Hand Crossbow", description: "Ranged Weapon Attack", attackBonus: 7, damageDescription: "6 (1d6 + 3) piercing damage plus 10 (3d6) poison damage." }
    ]
  },
  {
    id: "cm-drider",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Drider",
    size: "large",
    type: "monstrosity",
    alignment: "Chaotic Evil",
    speed: "30 ft., climb 30 ft.",
    challengeRating: 6,
    experiencePoints: 2300,
    ac: 16,
    acNote: "chain shirt",
    hp: 120,
    maxHp: 120,
    abilityScores: {
      strength: 16, dexterity: 16, constitution: 14,
      intelligence: 13, wisdom: 14, charisma: 12
    },
    skills: { Perception: 5, Stealth: 9 },
    damageImmunities: ["poison"],
    conditionImmunities: ["poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "15" },
    languages: ["Common", "Elvish", "Undercommon"],
    traits: [
      { name: "Fey Ancestry", description: "The drider has advantage on saving throws against being charmed, and magic can't put it to sleep." },
      { name: "Innate Spellcasting", description: "Innate spellcasting ability is Wisdom (spell save DC 12). At will: dancing lights. 1/day each: darkness, faerie fire." },
      { name: "Spider Climb", description: "The drider can climb difficult surfaces, including upside down on ceilings, without making an ability check." }
    ],
    actions: [
      { name: "Multiattack", description: "The drider makes three attacks: two with its longsword and one with its bite. It can replace one attack with a use of Innate Spellcasting if available." },
      { name: "Longsword", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "7 (1d8 + 3) slashing damage, or 8 (1d10 + 3) if used two-handed." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "5 (1d6 + 2) piercing damage plus 10 (3d6) poison damage." }
    ]
  },
  {
    id: "cm-svirfneblin",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Svirfneblin",
    size: "small",
    type: "humanoid",
    alignment: "Neutral Good",
    speed: "20 ft.",
    challengeRating: 0.25,
    ac: 15,
    acNote: "studded leather + stone",
    hp: 9,
    maxHp: 9,
    abilityScores: {
      strength: 8, dexterity: 14, constitution: 11,
      intelligence: 10, wisdom: 11, charisma: 9
    },
    skills: { Investigation: 2, Perception: 2, Stealth: 4 },
    senses: { darkvision: "120 ft.", "passive Perception": "12" },
    languages: ["Common", "Gnomish", "Undercommon"],
    traits: [
      { name: "Stone Camouflage", description: "The svirfneblin has advantage on Dexterity (Stealth) checks made to hide in rocky terrain." },
      { name: "Gnome Cunning", description: "The svirfneblin has advantage on Intelligence, Wisdom, and Charisma saving throws against magic." }
    ],
    actions: [
      { name: "War Pick", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "5 (1d8 + 1) piercing damage." },
      { name: "Poisoned Blowdart", description: "Ranged Weapon Attack", attackBonus: 4, damageDescription: "3 (1d4 + 1) piercing damage plus 7 (2d6) poison damage." }
    ]
  },
  {
    id: "cm-duergar",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Duergar",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "25 ft.",
    challengeRating: 1,
    experiencePoints: 200,
    ac: 16,
    acNote: "scale mail, shield",
    hp: 26,
    maxHp: 26,
    abilityScores: {
      strength: 14, dexterity: 11, constitution: 14,
      intelligence: 11, wisdom: 10, charisma: 9
    },
    skills: { Perception: 2 },
    damageImmunities: ["poison"],
    conditionImmunities: ["charmed", "frightened", "paralyzed", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "12" },
    languages: ["Common", "Dwarvish", "Undercommon"],
    traits: [
      { name: "Duergar Resilience", description: "The duergar has advantage on saving throws against poison, and it has resistance against poison damage." },
      { name: "Innate Spellcasting", description: "Innate spellcasting ability is Intelligence (spell save DC 10). 1/day each: enlarge/reduce, invisibility." },
      { name: "Sunlight Sensitivity", description: "While in sunlight, the duergar has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight." }
    ],
    actions: [
      { name: "War Pick", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "6 (1d8 + 2) piercing damage." },
      { name: "Javelin", description: "Melee or Ranged Weapon Attack", attackBonus: 4, damageDescription: "5 (1d6 + 2) piercing damage." }
    ]
  },
  {
    id: "cm-duergar-stone-guard",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Duergar Stone Guard",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "25 ft.",
    challengeRating: 2,
    experiencePoints: 450,
    ac: 18,
    acNote: "plate armor, shield",
    hp: 49,
    maxHp: 49,
    abilityScores: {
      strength: 16, dexterity: 11, constitution: 16,
      intelligence: 10, wisdom: 10, charisma: 9
    },
    damageImmunities: ["poison"],
    conditionImmunities: ["charmed", "frightened", "paralyzed", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "10" },
    languages: ["Common", "Dwarvish", "Undercommon"],
    traits: [
      { name: "Duergar Resilience", description: "The stone guard has advantage on saving throws against poison, and it has resistance against poison damage." },
      { name: "Innate Spellcasting", description: "1/day each: enlarge/reduce, invisibility." },
      { name: "Sunlight Sensitivity", description: "While in sunlight, the stone guard has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight." }
    ],
    actions: [
      { name: "Multiattack", description: "The stone guard makes two War Pick attacks." },
      { name: "War Pick", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "8 (1d8 + 4) piercing damage." }
    ]
  },
  {
    id: "cm-shield-guardian",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Shield Guardian",
    size: "large",
    type: "construct",
    alignment: "Unaligned",
    speed: "30 ft.",
    challengeRating: 7,
    experiencePoints: 2900,
    ac: 17,
    acNote: "natural armor",
    hp: 142,
    maxHp: 142,
    abilityScores: {
      strength: 18, dexterity: 8, constitution: 18,
      intelligence: 7, wisdom: 10, charisma: 1
    },
    senses: { darkvision: "120 ft.", "passive Perception": "10" },
    languages: ["understands commands in any language but can't speak"],
    traits: [
      { name: "Bound", description: "The shield guardian is magically bound to an amulet. The amulet's wearer can telepathically call the guardian to travel to its location and back." },
      { name: "Regeneration", description: "The guardian regains 10 hit points at the start of its turn if it has at least 1 hit point." },
      { name: "Spell Storing", description: "A spell can be stored in the guardian. The guardian can use the stored spell as a reaction when its bonded wearer is targeted by an attack." }
    ],
    actions: [
      { name: "Multiattack", description: "The guardian makes two Fist attacks." },
      { name: "Fist", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "14 (2d10 + 4) bludgeoning damage." },
      { name: "Shield (Recharge 6)", description: "The guardian grants its bonded wearer a +5 bonus to AC until the start of the guardian's next turn." }
    ]
  },
  {
    id: "cm-mind-flayer",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Mind Flayer",
    size: "medium",
    type: "aberration",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 7,
    experiencePoints: 2900,
    ac: 15,
    acNote: "breastplate",
    hp: 71,
    maxHp: 71,
    abilityScores: {
      strength: 11, dexterity: 12, constitution: 12,
      intelligence: 19, wisdom: 17, charisma: 17
    },
    savingThrows: { intelligence: 8, wisdom: 7 },
    skills: { Arcana: 7, Deception: 5, Insight: 7, Perception: 7, Persuasion: 5, Stealth: 4 },
    senses: { darkvision: "120 ft.", "passive Perception": "17" },
    languages: ["Deep Speech", "Undercommon"],
    description: "A psionic aberration that feeds on brains.",
    traits: [
      { name: "Magic Resistance", description: "The mind flayer has advantage on saving throws against spells and other magical effects." },
      { name: "Innate Spellcasting (Psionics)", description: "The mind flayer's innate spellcasting ability is Intelligence (spell save DC 16, +8 to hit with spell attacks). At will: detect thoughts, levitate. 1/day each: dominate monster, plane shift." }
    ],
    actions: [
      { name: "Tentacles", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "15 (2d10 + 4) psychic damage. If the target is Large or smaller, it is grappled (escape DC 15). Until this grapple ends, the target takes 15 (2d10 + 4) psychic damage at the start of each of the mind flayer's turns, and the mind flayer can't use its tentacles on another target." },
      { name: "Extract Brain", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "The mind flayer kills a creature grappled by its tentacles, absorbing its brain." }
    ]
  },
  {
    id: "cm-kuo-toa",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Kuo-Toa",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft., swim 30 ft.",
    challengeRating: 1,
    experiencePoints: 200,
    ac: 13,
    acNote: "shield",
    hp: 18,
    maxHp: 18,
    abilityScores: {
      strength: 13, dexterity: 10, constitution: 14,
      intelligence: 11, wisdom: 12, charisma: 10
    },
    skills: { Perception: 3 },
    senses: { darkvision: "120 ft.", "passive Perception": "13" },
    languages: ["Undercommon"],
    traits: [
      { name: "Amphibious", description: "The kuo-toa can breathe air and water." },
      { name: "Otherworldly Perception", description: "The kuo-toa can sense the presence of any creature within 30 ft. that has an Intelligence of 5 or higher." }
    ],
    actions: [
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 3, damageDescription: "4 (1d6 + 1) piercing damage." },
      { name: "Spear", description: "Melee or Ranged Weapon Attack", attackBonus: 3, damageDescription: "5 (1d6 + 2) piercing damage, or 4 (1d8) if used two-handed in melee." },
      { name: "Net", description: "Ranged Weapon Attack", attackBonus: 3, damageDescription: "no damage; target is restrained." }
    ]
  },
  {
    id: "cm-kuo-toa-whip",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Kuo-Toa Whip",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft., swim 30 ft.",
    challengeRating: 3,
    experiencePoints: 700,
    ac: 15,
    acNote: "chain shirt, shield",
    hp: 65,
    maxHp: 65,
    abilityScores: {
      strength: 13, dexterity: 10, constitution: 16,
      intelligence: 14, wisdom: 14, charisma: 12
    },
    savingThrows: { wisdom: 5 },
    skills: { Perception: 5 },
    senses: { darkvision: "120 ft.", "passive Perception": "15" },
    languages: ["Undercommon"],
    traits: [
      { name: "Amphibious", description: "The whip can breathe air and water." },
      { name: "Innate Spellcasting (Psionics)", description: "Innate spellcasting ability is Wisdom (spell save DC 13, +5 to hit with spell attacks). At will: dancing lights. 1/day each: bless, command, faerie fire, hold person." }
    ],
    actions: [
      { name: "Multiattack", description: "The whip makes two Pincer Staff attacks." },
      { name: "Pincer Staff", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "7 (1d8 + 3) piercing damage, and the target is grappled (escape DC 13)." }
    ]
  },
  {
    id: "cm-hook-horror",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Hook Horror",
    size: "large",
    type: "monstrosity",
    alignment: "Unaligned",
    speed: "30 ft., climb 30 ft.",
    challengeRating: 3,
    experiencePoints: 700,
    ac: 15,
    acNote: "natural armor",
    hp: 75,
    maxHp: 75,
    abilityScores: {
      strength: 18, dexterity: 10, constitution: 18,
      intelligence: 3, wisdom: 12, charisma: 7
    },
    skills: { Perception: 4 },
    senses: { blindsight: "30 ft.", darkvision: "60 ft.", "passive Perception": "14" },
    languages: ["understands Undercommon but can't speak"],
    description: "A carapaced predator of the deep Underdark with chitinous hook arms.",
    traits: [],
    actions: [
      { name: "Multiattack", description: "The horror makes three attacks: one with its bite and two with its hooks." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "11 (2d6 + 4) piercing damage." },
      { name: "Hook", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "11 (2d6 + 4) slashing damage." }
    ]
  },
  {
    id: "cm-piercer",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Piercer",
    size: "medium",
    type: "monstrosity",
    alignment: "Unaligned",
    speed: "0 ft., climb 30 ft.",
    challengeRating: 1,
    experiencePoints: 100,
    ac: 15,
    acNote: "natural armor",
    hp: 22,
    maxHp: 22,
    abilityScores: {
      strength: 10, dexterity: 15, constitution: 10,
      intelligence: 1, wisdom: 10, charisma: 3
    },
    skills: { Stealth: 6 },
    senses: { darkvision: "60 ft.", tremorsense: "60 ft.", "passive Perception": "10" },
    languages: ["understands Undercommon but can't speak"],
    description: "A stalactite-shaped predator that drops from ceilings onto prey.",
    traits: [
      { name: "False Appearance", description: "While motionless, the piercer is indistinguishable from a normal stalactite or stalagmite." }
    ],
    actions: [
      { name: "Drop", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "11 (2d6 + 4) bludgeoning damage." }
    ]
  },
  {
    id: "cm-young-red-dragon",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Young Red Dragon",
    size: "large",
    type: "dragon",
    alignment: "Chaotic Evil",
    speed: "40 ft., climb 40 ft., fly 80 ft.",
    challengeRating: 10,
    experiencePoints: 5900,
    ac: 18,
    acNote: "natural armor",
    hp: 178,
    maxHp: 178,
    abilityScores: {
      strength: 23, dexterity: 10, constitution: 21,
      intelligence: 14, wisdom: 11, charisma: 19
    },
    savingThrows: { dexterity: 6, constitution: 9, wisdom: 4, charisma: 7 },
    skills: { Perception: 8, Stealth: 6 },
    damageImmunities: ["fire"],
    senses: { blindsight: "30 ft.", darkvision: "120 ft.", "passive Perception": "18" },
    languages: ["Common", "Draconic"],
    description: "A young red dragon, such as Ashvaxar who serves Themberchaud.",
    traits: [],
    actions: [
      { name: "Multiattack", description: "The dragon makes three attacks: one Bite and two Claws." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 10, damageDescription: "17 (2d10 + 6) piercing damage plus 3 (1d6) fire damage." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 10, damageDescription: "13 (2d6 + 6) slashing damage." },
      { name: "Fire Breath (Recharge 5-6)", description: "The dragon exhales fire in a 30-foot cone. Each creature makes a DC 17 Dexterity save, taking 56 (16d6) fire damage on a failure, or half on a success." }
    ]
  },
  {
    id: "cm-troglodyte",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Troglodyte",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 0.25,
    experiencePoints: 50,
    ac: 11,
    hp: 13,
    maxHp: 13,
    abilityScores: {
      strength: 13, dexterity: 10, constitution: 13,
      intelligence: 5, wisdom: 8, charisma: 6
    },
    senses: { darkvision: "60 ft.", "passive Perception": "9" },
    languages: ["Troglodyte"],
    description: "A subterranean reptilian humanoid of the Wormwrithings.",
    traits: [
      { name: "Chameleon Skin", description: "The troglodyte has advantage on Dexterity (Stealth) checks." },
      { name: "Stench of Death", description: "Any creature other than a troglodyte that starts its turn within 5 ft. makes a DC 13 Constitution save or is poisoned until the start of its next turn." }
    ],
    actions: [
      { name: "Multiattack", description: "The troglodyte makes two attacks: one Bite and one Claw." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 3, damageDescription: "4 (1d4 + 2) piercing damage." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 3, damageDescription: "4 (1d4 + 2) slashing damage." }
    ]
  },
  {
    id: "cm-balor",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Balor",
    size: "huge",
    type: "fiend",
    alignment: "Chaotic Evil",
    speed: "40 ft., fly 80 ft.",
    challengeRating: 19,
    experiencePoints: 22000,
    ac: 19,
    acNote: "natural armor",
    hp: 500,
    maxHp: 500,
    abilityScores: {
      strength: 26, dexterity: 15, constitution: 24,
      intelligence: 20, wisdom: 16, charisma: 22
    },
    savingThrows: { strength: 15, constitution: 14, wisdom: 10, charisma: 13 },
    skills: { Intimidation: 13 },
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "13" },
    languages: ["Abyssal", "all", "telepathy 120 ft."],
    description: "A massive demon general of the Blood War.",
    traits: [
      { name: "Damage Resistance (Nonmagical)", description: "The balor takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical." },
      { name: "Magic Resistance", description: "The balor has advantage on saving throws against spells and other magical effects." }
    ],
    actions: [
      { name: "Multiattack", description: "The balor makes two attacks: one with its longsword and one with its whip. It can use its Death Throes in place of one attack." },
      { name: "Longsword", description: "Melee Weapon Attack", attackBonus: 14, damageDescription: "21 (3d8 + 9) slashing damage plus 14 (4d6) fire damage." },
      { name: "Whip", description: "Melee Weapon Attack", attackBonus: 14, damageDescription: "15 (2d8 + 9) slashing damage plus 14 (4d6) fire damage, and the target makes a DC 20 Strength save or is pulled up to 25 ft. toward the balor." },
      { name: "Death Throes", description: "When the balor dies, it explodes. Each creature within 30 ft. makes a DC 20 Dexterity save, taking 21 (6d6) fire damage and 21 (6d6) force damage on a failure, or half on a success." }
    ],
    legendaryActions: [
      { name: "Attack", description: "The balor makes one attack." },
      { name: "Teleport", description: "The balor teleports up to 120 ft. to an unoccupied space it can see." }
    ],
    legendaryActionCount: 3
  },
  {
    id: "cm-gnoll-fang-of-yeenoghu",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Gnoll Fang of Yeenoghu",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 4,
    experiencePoints: 1100,
    ac: 14,
    acNote: "hide armor, shield",
    hp: 65,
    maxHp: 65,
    abilityScores: {
      strength: 16, dexterity: 13, constitution: 14,
      intelligence: 7, wisdom: 9, charisma: 9
    },
    skills: { Survival: 2 },
    senses: { darkvision: "60 ft.", "passive Perception": "9" },
    languages: ["Common", "Gnoll"],
    description: "An elite gnoll warrior who serves Yeenoghu, the demon prince of gnolls.",
    traits: [
      { name: "Rampage", description: "When the fang reduces a creature to 0 hit points with a melee attack on its turn, it can use a bonus action to move up to half its speed and make a bite attack." }
    ],
    actions: [
      { name: "Multiattack", description: "The fang makes two Bite attacks. If it has a spear drawn, it can make one Bite and one Spear attack." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "5 (1d4 + 3) piercing damage." },
      { name: "Spear", description: "Melee or Ranged Weapon Attack", attackBonus: 5, damageDescription: "6 (1d6 + 3) piercing damage, or 7 (1d8 + 3) if used two-handed." }
    ]
  },
  {
    id: "cm-death-slaad",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Death Slaad",
    size: "large",
    type: "aberration",
    alignment: "Chaotic Neutral",
    speed: "40 ft.",
    challengeRating: 10,
    experiencePoints: 5900,
    ac: 17,
    acNote: "natural armor",
    hp: 161,
    maxHp: 161,
    abilityScores: {
      strength: 20, dexterity: 14, constitution: 19,
      intelligence: 12, wisdom: 14, charisma: 16
    },
    savingThrows: { constitution: 8, wisdom: 6, charisma: 7 },
    skills: { Intimidation: 7 },
    damageImmunities: ["acid"],
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["Common", "Slaad"],
    description: "A slaad advanced beyond its prime form, deadlier and more cunning than its lesser kin.",
    traits: [
      { name: "Magic Resistance", description: "The death slaad has advantage on saving throws against spells and other magical effects." }
    ],
    actions: [
      { name: "Multiattack", description: "The slaad makes two Claw attacks and one Bite attack." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 9, damageDescription: "21 (3d8 + 8) piercing damage." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 9, damageDescription: "13 (2d6 + 8) slashing damage." },
      { name: "Implant Egg", description: "The death slaad implants an egg in a creature it has grappled. After 1d4 hours, the egg hatches into a red slaad." }
    ],
    legendaryActions: [
      { name: "Bite", description: "The slaad makes one Bite attack." },
      { name: "Claw", description: "The slaad makes one Claw attack." },
      { name: "Acid Breath (Costs 2 Actions)", description: "The slaad exhales acid in a 30-foot cone. Each creature makes a DC 16 Dexterity save, taking 28 (8d6) acid damage on a failure, or half on a success." }
    ],
    legendaryActionCount: 3
  },
  {
    id: "cm-erinyes",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Erinyes",
    size: "medium",
    type: "fiend",
    alignment: "Lawful Evil",
    speed: "30 ft., fly 60 ft.",
    challengeRating: 12,
    experiencePoints: 8400,
    ac: 18,
    acNote: "plate armor",
    hp: 153,
    maxHp: 153,
    abilityScores: {
      strength: 18, dexterity: 16, constitution: 18,
      intelligence: 14, wisdom: 14, charisma: 18
    },
    savingThrows: { strength: 8, dexterity: 7, constitution: 8, wisdom: 6, charisma: 8 },
    skills: { Deception: 8, Perception: 6, Persuasion: 8 },
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "16" },
    languages: ["Common", "Infernal"],
    description: "A fiendish devil in service to the archdevils.",
    traits: [
      { name: "Hellish Weapons", description: "The erinyes's weapon attacks deal an extra 13 (3d8) poison damage on a hit (included)." },
      { name: "Magic Resistance", description: "The erinyes has advantage on saving throws against spells and other magical effects." }
    ],
    actions: [
      { name: "Multiattack", description: "The erinyes makes three attacks: one with its longsword, one with its longbow, and one with its barbed tail." },
      { name: "Longsword", description: "Melee Weapon Attack", attackBonus: 8, damageDescription: "14 (2d10 + 4) slashing damage plus 13 (3d8) poison damage." },
      { name: "Longbow", description: "Ranged Weapon Attack", attackBonus: 8, damageDescription: "13 (2d8 + 4) piercing damage plus 13 (3d8) poison damage." },
      { name: "Barbed Tail", description: "Melee Weapon Attack", attackBonus: 8, damageDescription: "10 (2d4 + 4) piercing damage." }
    ]
  },
  {
    id: "cm-hell-hound",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Hell Hound",
    size: "medium",
    type: "fiend",
    alignment: "Lawful Evil",
    speed: "40 ft.",
    challengeRating: 3,
    experiencePoints: 700,
    ac: 15,
    acNote: "natural armor",
    hp: 45,
    maxHp: 45,
    abilityScores: {
      strength: 17, dexterity: 10, constitution: 14,
      intelligence: 6, wisdom: 11, charisma: 8
    },
    skills: { Perception: 5 },
    damageImmunities: ["fire"],
    senses: { darkvision: "60 ft.", "passive Perception": "15" },
    languages: ["understands Infernal but can't speak"],
    description: "A fire-breathing hound of the lower planes.",
    traits: [
      { name: "Keen Hearing and Smell", description: "The hound has advantage on Wisdom (Perception) checks that rely on hearing or smell." },
      { name: "Pack Tactics", description: "The hound has advantage on an attack roll against a creature if at least one of the hound's allies is within 5 ft. of the creature and the ally isn't incapacitated." }
    ],
    actions: [
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "7 (1d8 + 3) piercing damage plus 3 (1d6) fire damage." },
      { name: "Fire Breath (Recharge 5-6)", description: "The hound exhales fire in a 15-foot cone. Each creature makes a DC 13 Dexterity save, taking 14 (4d6) fire damage on a failure, or half on a success." }
    ]
  },
  {
    id: "cm-gelatinous-cube",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Gelatinous Cube",
    size: "large",
    type: "ooze",
    alignment: "Unaligned",
    speed: "15 ft.",
    challengeRating: 2,
    experiencePoints: 450,
    ac: 6,
    hp: 84,
    maxHp: 84,
    abilityScores: {
      strength: 14, dexterity: 3, constitution: 20,
      intelligence: 1, wisdom: 6, charisma: 1
    },
    conditionImmunities: ["blinded", "charmed", "deafened", "exhaustion", "frightened", "prone"],
    senses: { blindsight: "60 ft.", "passive Perception": "8" },
    languages: ["understands Common but can't speak"],
    description: "A translucent cube of acidic jelly that fills dungeon corridors.",
    traits: [
      { name: "Ooze Cube", description: "The cube can occupy the same space as another creature. If a creature ends its turn in the cube's space, it makes a DC 14 Dexterity save or takes 10 (3d6) acid damage." },
      { name: "Transparent", description: "Even when in plain sight, it takes a successful DC 15 Wisdom (Perception) check to spot a cube that has neither moved nor attacked." }
    ],
    actions: [
      { name: "Pseudopod", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "10 (3d6) acid damage. The target is grappled (escape DC 14)." }
    ]
  },
  {
    id: "cm-modron-quadrone",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Quadrone (Modron)",
    size: "medium",
    type: "construct",
    alignment: "Lawful Neutral",
    speed: "30 ft., fly 30 ft.",
    challengeRating: 1,
    experiencePoints: 200,
    ac: 16,
    acNote: "natural armor",
    hp: 22,
    maxHp: 22,
    abilityScores: {
      strength: 13, dexterity: 12, constitution: 12,
      intelligence: 10, wisdom: 10, charisma: 10
    },
    skills: { Perception: 2 },
    senses: { truesight: "120 ft.", "passive Perception": "12" },
    languages: ["Modron"],
    traits: [
      { name: "Axiomatic Mind", description: "The quadrone can't be compelled to act against its directives." },
      { name: "Disassembly", description: "When the quadrone drops to 0 HP, it disassembles into a pile of cubes. It can't be restored to function except by a fabricate spell or similar magic." }
    ],
    actions: [
      { name: "Multiattack", description: "The quadrone makes two Fist attacks." },
      { name: "Fist", description: "Melee Weapon Attack", attackBonus: 3, damageDescription: "4 (1d4 + 2) bludgeoning damage." }
    ]
  },
  {
    id: "cm-modron-monodrone",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Out of the Abyss",
    name: "Monodrone (Modron)",
    size: "tiny",
    type: "construct",
    alignment: "Lawful Neutral",
    speed: "30 ft.",
    challengeRating: 0.125,
    ac: 13,
    hp: 5,
    maxHp: 5,
    abilityScores: {
      strength: 10, dexterity: 12, constitution: 10,
      intelligence: 8, wisdom: 10, charisma: 8
    },
    senses: { truesight: "120 ft.", "passive Perception": "10" },
    languages: ["Modron"],
    traits: [
      { name: "Axiomatic Mind", description: "The monodrone can't be compelled to act against its directives." }
    ],
    actions: [
      { name: "Fist", description: "Melee Weapon Attack", attackBonus: 3, damageDescription: "3 (1d4 + 1) bludgeoning damage." }
    ]
  },
  // ─── Dragon of Icespire Peak ──────────────────────────────────────────
  {
    id: "cm-storm-giant-awakened",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dragon of Icespire Peak",
    name: "Storm Giant Awakened",
    size: "huge",
    type: "giant",
    alignment: "Chaotic Good",
    speed: "40 ft., swim 40 ft.",
    challengeRating: 9,
    experiencePoints: 5000,
    ac: 16,
    acNote: "natural armor",
    hp: 168,
    maxHp: 168,
    abilityScores: {
      strength: 25, dexterity: 14, constitution: 20,
      intelligence: 14, wisdom: 18, charisma: 18
    },
    savingThrows: { strength: 11, dexterity: 7, constitution: 10, wisdom: 9, charisma: 9 },
    skills: { Athletics: 11, Insight: 9, Perception: 9 },
    senses: { "passive Perception": "19" },
    languages: ["Common", "Giant", "Primordial"],
    description: "A storm giant who recovered his sanity after being imprisoned as a statue in the Tower of Storms. Reduced statblock from the SRD storm giant to fit Tier 2 quest pacing.",
    traits: [
      { name: "Amphibious", description: "The storm giant can breathe air and water." },
      { name: "Innate Spellcasting", description: "The storm giant's innate spellcasting ability is Charisma (spell save DC 16). At will: detect magic, fog cloud, light. 1/day each: control weather, water breathing." }
    ],
    actions: [
      { name: "Multiattack", description: "The storm giant makes two Trident attacks." },
      { name: "Trident", description: "Melee or Ranged Weapon Attack", attackBonus: 11, damageDescription: "19 (3d8 + 7) piercing damage, or 21 (3d10 + 7) if used two-handed." },
      { name: "Lightning Strike (Recharge 4-6)", description: "The storm giant hurls a magical lightning bolt at a point it can see within 500 ft. Each creature within 10 ft. of the point makes a DC 17 Dexterity save, taking 35 (10d6) lightning damage on a failure, or half on a success." }
    ]
  },
  {
    id: "cm-cryovain",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dragon of Icespire Peak",
    name: "Cryovain the White Dragon",
    size: "large",
    type: "dragon",
    alignment: "Chaotic Evil",
    speed: "40 ft., burrow 20 ft., fly 80 ft.",
    challengeRating: 6,
    experiencePoints: 2300,
    ac: 17,
    acNote: "natural armor",
    hp: 200,
    maxHp: 200,
    abilityScores: {
      strength: 18, dexterity: 10, constitution: 18,
      intelligence: 11, wisdom: 11, charisma: 12
    },
    savingThrows: { dexterity: 3, constitution: 7, wisdom: 3, charisma: 4 },
    skills: { Perception: 6, Stealth: 3 },
    damageImmunities: ["cold"],
    senses: { blindsight: "30 ft.", darkvision: "120 ft.", "passive Perception": "16" },
    languages: ["Common", "Draconic"],
    description: "A young white dragon who has claimed Icespire Hold as his lair and drives the monsters of the Sword Mountains into Phandalin.",
    traits: [
      { name: "Ice Walk", description: "The dragon can move across and climb icy surfaces without needing to make an ability check." }
    ],
    actions: [
      { name: "Multiattack", description: "The dragon makes three attacks: one Bite and two Claws." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "11 (2d6 + 4) piercing damage plus 4 (1d8) cold damage." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "7 (1d6 + 4) slashing damage." },
      { name: "Frost Breath (Recharge 5-6)", description: "The dragon exhales an icy blast in a 30-foot cone. Each creature makes a DC 15 Constitution save, taking 54 (12d8) cold damage on a failure, or half on a success." }
    ]
  },
  // SRD-faithful mirrors used in Dragon of Icespire Peak encounters
  {
    id: "cm-manticore",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dragon of Icespire Peak",
    name: "Manticore",
    size: "large",
    type: "monstrosity",
    alignment: "Lawful Evil",
    speed: "30 ft., fly 50 ft.",
    challengeRating: 3,
    experiencePoints: 700,
    ac: 14,
    acNote: "natural armor",
    hp: 68,
    maxHp: 68,
    abilityScores: {
      strength: 17, dexterity: 16, constitution: 17,
      intelligence: 7, wisdom: 12, charisma: 8
    },
    skills: { Perception: 3 },
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["understands Common but can't speak"],
    description: "A lion-bodied monster with bat wings and a tail of iron spikes.",
    traits: [],
    actions: [
      { name: "Multiattack", description: "The manticore makes three attacks: one with its bite and two with its claws or two with its tail spikes." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "7 (1d8 + 3) piercing damage." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "6 (1d6 + 3) slashing damage." },
      { name: "Tail Spike", description: "Ranged Weapon Attack", attackBonus: 5, damageDescription: "7 (1d8 + 3) piercing damage." }
    ]
  },
  {
    id: "cm-orog",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dragon of Icespire Peak",
    name: "Orog",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 2,
    experiencePoints: 450,
    ac: 18,
    acNote: "chain shirt, shield",
    hp: 42,
    maxHp: 42,
    abilityScores: {
      strength: 16, dexterity: 12, constitution: 16,
      intelligence: 12, wisdom: 12, charisma: 10
    },
    skills: { Intimidation: 2 },
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: ["Common", "Orc"],
    description: "A disciplined orc commander, often leading warbands in the Sword Mountains.",
    traits: [
      { name: "Aggressive", description: "As a bonus action, the orog can move up to its speed toward a hostile creature it can see." }
    ],
    actions: [
      { name: "Multiattack", description: "The orog makes two attacks with its Scimitar or its Javelin." },
      { name: "Scimitar", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "6 (1d6 + 3) slashing damage." },
      { name: "Javelin", description: "Melee or Ranged Weapon Attack", attackBonus: 5, damageDescription: "6 (1d6 + 3) piercing damage." }
    ]
  },
  {
    id: "cm-hobgoblin-captain",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dragon of Icespire Peak",
    name: "Hobgoblin Captain",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 3,
    experiencePoints: 700,
    ac: 17,
    acNote: "chain shirt, shield",
    hp: 39,
    maxHp: 39,
    abilityScores: {
      strength: 13, dexterity: 14, constitution: 12,
      intelligence: 12, wisdom: 10, charisma: 13
    },
    savingThrows: { constitution: 3, wisdom: 2 },
    skills: { Athletics: 3, Perception: 2 },
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["Common", "Goblin"],
    description: "A hobgoblin officer commanding a warband in the Sword Mountains.",
    traits: [
      { name: "Martial Advantage", description: "Once per turn, the captain can deal an extra 7 (2d6) damage to a creature it hits with a weapon attack if that creature is within 5 ft. of an ally of the captain that isn't incapacitated." }
    ],
    actions: [
      { name: "Multiattack", description: "The captain makes two attacks with its Scimitar. It can replace one attack with a use of Leadership if available." },
      { name: "Scimitar", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "5 (1d6 + 2) slashing damage." },
      { name: "Javelin", description: "Melee or Ranged Weapon Attack", attackBonus: 4, damageDescription: "5 (1d6 + 2) piercing damage." },
      { name: "Leadership (Recharge 4-6)", description: "For 1 minute, the captain can utter a special command or warning whenever a nonhostile creature that it can see within 30 ft. of it makes an attack roll or saving throw. The creature adds 4 (1d8) to the roll." }
    ],
    reactions: [
      { name: "Parry", description: "The captain adds 2 to its AC against one melee attack that would hit it. To do so, it must see the attacker and be wielding a melee weapon." }
    ]
  },
  {
    id: "cm-half-ogre",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dragon of Icespire Peak",
    name: "Half-Ogre",
    size: "large",
    type: "giant",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 1,
    experiencePoints: 200,
    ac: 12,
    acNote: "hide armor",
    hp: 30,
    maxHp: 30,
    abilityScores: {
      strength: 16, dexterity: 10, constitution: 14,
      intelligence: 6, wisdom: 7, charisma: 6
    },
    skills: { Intimidation: 2 },
    senses: { darkvision: "60 ft.", "passive Perception": "8" },
    languages: ["Common", "Giant"],
    description: "A half-ogre cultist serving in Icespire Hold.",
    traits: [
      { name: "Brute", description: "A melee weapon deals one extra die of damage on a hit (included)." }
    ],
    actions: [
      { name: "Greatclub", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "11 (2d8 + 3) bludgeoning damage." }
    ]
  },
  // ─── Phandelver and Below: The Shattered Obelisk ─────────────────────
  {
    id: "cm-psionic-goblin",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Psionic Goblin",
    size: "small",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 0.5,
    experiencePoints: 100,
    ac: 13,
    acNote: "leather armor, shield",
    hp: 16,
    maxHp: 16,
    abilityScores: {
      strength: 8, dexterity: 14, constitution: 10,
      intelligence: 10, wisdom: 8, charisma: 8
    },
    skills: { Stealth: 6 },
    senses: { darkvision: "60 ft.", "passive Perception": "9" },
    languages: ["Common", "Goblin"],
    description: "A goblin whose mind has been touched by the Far Realm, granting it minor psionic powers. Often found in Psionic Goblin raiding parties.",
    traits: [
      { name: "Nimble Escape", description: "The goblin can disengage or hide as a bonus action on each of its turns." },
      { name: "Mind Link", description: "The goblin can telepathically communicate with any creature within 30 ft. that understands at least one language." },
      { name: "Telekinetic Shove", description: "As a bonus action, the goblin can target one creature it can see within 30 ft. The target makes a DC 10 Strength save or is moved 5 ft. in any direction the goblin chooses." }
    ],
    actions: [
      { name: "Multiattack", description: "The goblin makes two Scimitar attacks. It can use its Mind Spike attack in place of one melee attack." },
      { name: "Scimitar", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "5 (1d6 + 2) slashing damage." },
      { name: "Shortbow", description: "Ranged Weapon Attack", attackBonus: 4, damageDescription: "5 (1d6 + 2) piercing damage." },
      { name: "Mind Spike", description: "Ranged Spell Attack", attackBonus: 3, damageDescription: "5 (2d4) psychic damage." }
    ]
  },
  {
    id: "cm-psionic-goblin-boss",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Psionic Goblin Boss",
    size: "small",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 2,
    experiencePoints: 450,
    ac: 15,
    acNote: "chain shirt, shield",
    hp: 45,
    maxHp: 45,
    abilityScores: {
      strength: 10, dexterity: 14, constitution: 12,
      intelligence: 14, wisdom: 11, charisma: 10
    },
    skills: { Stealth: 6 },
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: ["Common", "Goblin", "Undercommon"],
    description: "A psionic goblin who has led a raiding band to success. Possesses more developed Far Realm mind powers.",
    traits: [
      { name: "Nimble Escape", description: "The boss can disengage or hide as a bonus action on each of its turns." },
      { name: "Innate Spellcasting (Psionics)", description: "The boss's innate spellcasting ability is Intelligence (spell save DC 12, +4 to hit with spell attacks). At will: friends, mage hand. 1/day each: charm person, detect thoughts, hold person, suggestion." }
    ],
    actions: [
      { name: "Multiattack", description: "The boss makes two Scimitar attacks. It can use Mind Blast in place of one attack." },
      { name: "Scimitar", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "5 (1d6 + 2) slashing damage." },
      { name: "Mind Blast (Recharge 4-6)", description: "Each creature of the boss's choice within 20 ft. makes a DC 12 Wisdom save, taking 9 (2d8) psychic damage on a failure, or half on a success. Targets that fail are pushed 10 ft. away." }
    ]
  },
  {
    id: "cm-cloaker-mutate",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Cloaker Mutate",
    size: "large",
    type: "aberration",
    alignment: "Chaotic Evil",
    speed: "10 ft., fly 60 ft. (hover)",
    challengeRating: 8,
    experiencePoints: 3900,
    ac: 14,
    acNote: "natural armor",
    hp: 161,
    maxHp: 161,
    abilityScores: {
      strength: 19, dexterity: 15, constitution: 16,
      intelligence: 16, wisdom: 14, charisma: 14
    },
    skills: { Perception: 4, Stealth: 7 },
    damageImmunities: ["psychic"],
    senses: { darkvision: "60 ft.", "passive Perception": "14" },
    languages: ["Deep Speech", "Undercommon", "telepathy 60 ft."],
    description: "A cloaker twisted by illithid psionic experimentation. Its bite now delivers a psychic drain rather than a tail attack.",
    traits: [
      { name: "False Appearance", description: "While motionless, the mutate is indistinguishable from a tattered cloak." },
      { name: "Magic Resistance", description: "The mutate has advantage on saving throws against spells and other magical effects." },
      { name: "Mind Echo", description: "Each creature within 30 ft. of the mutate at the start of its turn makes a DC 14 Wisdom save or is frightened until the end of the creature's next turn." }
    ],
    actions: [
      { name: "Multiattack", description: "The mutate makes two Bite attacks and one Tail attacks." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "11 (2d6 + 4) piercing damage. The target makes a DC 14 Wisdom save or is afflicted with psychic feedback for 1 minute, taking 7 (2d6) psychic damage each time it deals damage to the mutate." },
      { name: "Tail", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "8 (1d8 + 4) slashing damage." },
      { name: "Phantasmal Embrace", description: "The mutate wraps itself around one creature within 5 ft. The target makes a DC 14 Dexterity save or is grappled (escape DC 16) and takes 11 (2d10) psychic damage at the start of each of the mutate's turns." },
      { name: "Horrific Moan (Recharge 5-6)", description: "Each creature within 30 ft. of the mutate that can hear it makes a DC 14 Wisdom save or is frightened for 1 minute. A frightened target can repeat the save at the end of each of its turns." }
    ]
  },
  {
    id: "cm-nezznar",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Nezznar the Black Spider",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 8,
    experiencePoints: 3900,
    ac: 15,
    acNote: "studded leather",
    hp: 120,
    maxHp: 120,
    abilityScores: {
      strength: 10, dexterity: 18, constitution: 14,
      intelligence: 20, wisdom: 13, charisma: 11
    },
    savingThrows: { intelligence: 9, wisdom: 5 },
    skills: { Arcana: 9, Deception: 4, Perception: 6, Stealth: 9 },
    damageImmunities: ["poison"],
    conditionImmunities: ["poisoned"],
    senses: { darkvision: "120 ft.", truesight: "30 ft.", "passive Perception": "16" },
    languages: ["Common", "Elvish", "Undercommon"],
    description: "A drow mage in disguise (as a human wizard) who seeks the Forge of Spells in Wave Echo Cave.",
    traits: [
      { name: "Fey Ancestry", description: "Nezznar has advantage on saving throws against being charmed, and magic can't put him to sleep." },
      { name: "Innate Spellcasting", description: "Innate spellcasting ability is Charisma (spell save DC 12). At will: dancing lights. 1/day each: darkness, faerie fire." },
      { name: "Spellcasting", description: "Nezznar is a 10th-level spellcaster. His spellcasting ability is Intelligence (spell save DC 17, +9 to hit with spell attacks). At will: light, mage hand, ray of frost. 3/day each: counterspell, dispel magic, fireball. 1/day each: confusion, detect magic, shield, web." }
    ],
    actions: [
      { name: "Multiattack", description: "Nezznar makes two Dagger attacks and one Spider Staff attack." },
      { name: "Dagger", description: "Melee or Ranged Weapon Attack", attackBonus: 7, damageDescription: "5 (1d4 + 3) piercing damage plus 10 (3d6) poison damage." },
      { name: "Spider Staff", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "6 (1d6 + 3) bludgeoning damage plus 10 (3d6) poison damage." }
    ],
    legendaryActions: [
      { name: "Spellcasting", description: "Nezznar casts one of his prepared spells." },
      { name: "Web Spray (Costs 2 Actions)", description: "Nezznar casts web centered on a point he can see within 60 ft." }
    ],
    legendaryActionCount: 3
  },
  {
    id: "cm-mind-flayer-cultist",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Mind Flayer Cultist",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 3,
    experiencePoints: 700,
    ac: 14,
    acNote: "leather armor",
    hp: 38,
    maxHp: 38,
    abilityScores: {
      strength: 9, dexterity: 14, constitution: 12,
      intelligence: 15, wisdom: 14, charisma: 11
    },
    skills: { Arcana: 4, Deception: 3, Perception: 4 },
    senses: { darkvision: "60 ft.", "passive Perception": "14" },
    languages: ["Common", "Deep Speech", "Undercommon"],
    description: "A human cultist sworn to the mind flayer cause, granted minor psionic gifts in exchange for service.",
    traits: [
      { name: "Innate Spellcasting (Psionics)", description: "Innate spellcasting ability is Intelligence (spell save DC 12, +4 to hit with spell attacks). At will: friends, mage hand. 1/day each: detect thoughts, sleep." },
      { name: "Devoted Will", description: "The cultist has advantage on saving throws against being charmed by non-illithid creatures." }
    ],
    actions: [
      { name: "Multiattack", description: "The cultist makes two Scimitar attacks." },
      { name: "Scimitar", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "5 (1d6 + 2) slashing damage." },
      { name: "Mind Bolt", description: "Ranged Spell Attack", attackBonus: 4, damageDescription: "9 (2d8) psychic damage." }
    ]
  },
  {
    id: "cm-obelisk-sentinel",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Obelisk Sentinel",
    size: "large",
    type: "construct",
    alignment: "Neutral Evil",
    speed: "0 ft., fly 30 ft. (hover)",
    challengeRating: 5,
    experiencePoints: 1800,
    ac: 16,
    acNote: "natural armor",
    hp: 110,
    maxHp: 110,
    abilityScores: {
      strength: 18, dexterity: 14, constitution: 18,
      intelligence: 8, wisdom: 11, charisma: 1
    },
    damageImmunities: ["force", "poison", "psychic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned", "stunned"],
    senses: { blindsight: "60 ft.", darkvision: "120 ft.", "passive Perception": "10" },
    languages: ["understands Deep Speech but can't speak"],
    description: "A Far-Realm-tinged construct that hovers over the Netherese obelisks, pulsing with psionic energy.",
    traits: [
      { name: "Antimagic Susceptibility", description: "The sentinel is incapacitated while in the area of an antimagic field. If targeted by dispel magic, it is suppressed for 1 minute." },
      { name: "Damage Resistance (Nonmagical)", description: "The sentinel takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical." }
    ],
    actions: [
      { name: "Multiattack", description: "The sentinel makes two Slam attacks." },
      { name: "Slam", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "13 (2d8 + 4) bludgeoning damage plus 4 (1d8) force damage." },
      { name: "Psychic Beam", description: "Ranged Spell Attack", attackBonus: 5, damageDescription: "16 (3d8 + 2) psychic damage. The target makes a DC 13 Wisdom save or is stunned until the end of its next turn." }
    ]
  },
  {
    id: "cm-elder-brain-dragon",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Elder Brain Dragon",
    size: "large",
    type: "aberration",
    alignment: "Lawful Evil",
    speed: "0 ft., fly 30 ft. (hover)",
    challengeRating: 12,
    experiencePoints: 8400,
    ac: 17,
    acNote: "natural armor",
    hp: 210,
    maxHp: 210,
    abilityScores: {
      strength: 18, dexterity: 14, constitution: 18,
      intelligence: 20, wisdom: 18, charisma: 18
    },
    savingThrows: { intelligence: 9, wisdom: 8, charisma: 8 },
    skills: { Arcana: 9, Insight: 8, Perception: 8 },
    damageImmunities: ["psychic"],
    conditionImmunities: ["charmed", "frightened"],
    senses: { blindsight: "120 ft.", truesight: "60 ft.", "passive Perception": "18" },
    languages: ["Deep Speech", "Undercommon", "telepathy 120 ft."],
    description: "An elder brain that has fused with the remains of an aboleth, gained flight and a draconic form.",
    traits: [
      { name: "Magic Resistance", description: "The elder brain dragon has advantage on saving throws against spells and other magical effects." },
      { name: "Telepathic Hub", description: "The elder brain dragon can telepathically communicate with any creature it has enslaved within 1 mile. It can use any ally's senses and can read any ally's thoughts." }
    ],
    actions: [
      { name: "Multiattack", description: "The elder brain dragon makes one Bite attack and uses Psychic Drain." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 9, damageDescription: "12 (2d8 + 4) piercing damage." },
      { name: "Psychic Drain", description: "The elder brain dragon targets one creature within 120 ft. The target makes a DC 16 Intelligence save, taking 27 (6d8) psychic damage on a failure, or half on a success. If the target fails, the elder brain dragon learns one fact or memory of its choice." },
      { name: "Mind Blast (Recharge 5-6)", description: "The elder brain dragon emits psychic energy in a 60-foot cone. Each creature makes a DC 16 Intelligence save, taking 22 (4d10) psychic damage on a failure, or half on a success. On a failure, the target is also stunned for 1 minute." }
    ],
    legendaryActions: [
      { name: "Psychic Drain", description: "The elder brain dragon uses Psychic Drain." },
      { name: "Command Thrall", description: "The elder brain dragon commands one enslaved creature to take an action immediately." }
    ],
    legendaryActionCount: 2
  },
  {
    id: "cm-netherese-obelisk-boss",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Netherese Obelisk Boss",
    size: "huge",
    type: "aberration",
    alignment: "Lawful Evil",
    speed: "0 ft., fly 40 ft. (hover)",
    challengeRating: 18,
    experiencePoints: 20000,
    ac: 19,
    acNote: "natural armor",
    hp: 350,
    maxHp: 350,
    abilityScores: {
      strength: 20, dexterity: 14, constitution: 22,
      intelligence: 24, wisdom: 20, charisma: 22
    },
    savingThrows: { intelligence: 13, wisdom: 11, charisma: 11 },
    skills: { Arcana: 13, Insight: 11, Perception: 11, Persuasion: 11 },
    damageImmunities: ["force", "psychic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned", "stunned"],
    senses: { truesight: "240 ft.", "passive Perception": "21" },
    languages: ["Deep Speech", "Undercommon", "telepathy 240 ft."],
    description: "An illithilich formed from the Netherese obelisk's psionic core. Final boss of the campaign.",
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If the obelisk fails a saving throw, it can choose to succeed instead." },
      { name: "Magic Resistance", description: "The obelisk has advantage on saving throws against spells and other magical effects." },
      { name: "Rejuvenation", description: "If the obelisk is destroyed, it reforms within 1d10 days in the Netherese Obelisk unless a psychic link to it is severed." },
      { name: "Spellcasting", description: "The obelisk is a 17th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 21, +13 to hit with spell attacks). At will: detect magic, mage hand, minor illusion. 3/day each: counterspell, dispel magic, hold monster. 1/day each: feeblemind, prismatic wall, psychic crush, teleport." }
    ],
    actions: [
      { name: "Multiattack", description: "The obelisk makes two Tendril attacks and one Psychic Lance attack." },
      { name: "Tendril", description: "Melee Weapon Attack", attackBonus: 12, damageDescription: "17 (2d10 + 6) force damage, and the target is grappled (escape DC 19)." },
      { name: "Psychic Lance", description: "Ranged Spell Attack", attackBonus: 13, damageDescription: "28 (8d6) psychic damage. The target makes a DC 21 Intelligence save or is stunned for 1 minute." },
      { name: "Mind Storm (Recharge 5-6)", description: "The obelisk emits a 120-foot cone of psychic force. Each creature makes a DC 21 Intelligence save, taking 45 (10d8) psychic damage and 21 (6d6) force damage on a failure, or half on a success. Targets that fail are also knocked prone." }
    ],
    legendaryActions: [
      { name: "Psychic Lance", description: "The obelisk makes one Psychic Lance attack." },
      { name: "Tendril", description: "The obelisk makes one Tendril attack." },
      { name: "Cast a Spell", description: "The obelisk casts one of its prepared spells." }
    ],
    legendaryActionCount: 3
  },
  // SRD-faithful mirrors used in Phandelver and Below encounters
  {
    id: "cm-goblin-boss",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Goblin Boss",
    size: "small",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 1,
    experiencePoints: 200,
    ac: 17,
    acNote: "chain shirt, shield",
    hp: 21,
    maxHp: 21,
    abilityScores: {
      strength: 10, dexterity: 14, constitution: 10,
      intelligence: 10, wisdom: 8, charisma: 10
    },
    skills: { Stealth: 6 },
    senses: { darkvision: "60 ft.", "passive Perception": "9" },
    languages: ["Common", "Goblin"],
    description: "The biggest, meanest goblin in a raiding party.",
    traits: [
      { name: "Nimble Escape", description: "The goblin can disengage or hide as a bonus action on each of its turns." }
    ],
    actions: [
      { name: "Multiattack", description: "The goblin makes two attacks with its Scimitar. It can use its Shortbow in place of one melee attack." },
      { name: "Scimitar", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "5 (1d6 + 2) slashing damage." },
      { name: "Shortbow", description: "Ranged Weapon Attack", attackBonus: 4, damageDescription: "5 (1d6 + 2) piercing damage." },
      { name: "Javelin", description: "Melee or Ranged Weapon Attack", attackBonus: 4, damageDescription: "5 (1d6 + 2) piercing damage." }
    ]
  },
  {
    id: "cm-bugbear",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Bugbear",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 1,
    experiencePoints: 200,
    ac: 16,
    acNote: "hide armor, shield",
    hp: 27,
    maxHp: 27,
    abilityScores: {
      strength: 15, dexterity: 14, constitution: 13,
      intelligence: 8, wisdom: 11, charisma: 9
    },
    skills: { Stealth: 6, Survival: 2 },
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: ["Common", "Goblin"],
    description: "A stealthy, hairy goblinoid raider.",
    traits: [
      { name: "Brute", description: "A melee weapon deals one extra die of damage on a hit (included)." },
      { name: "Heart of Hruggek", description: "The bugbear has advantage on saving throws against being charmed, frightened, paralyzed, poisoned, stunned, or put to sleep." },
      { name: "Surprise Attack", description: "If the bugbear surprises a creature and hits it with a melee attack during the first round of combat, the attack deals an extra 7 (2d6) damage." }
    ],
    actions: [
      { name: "Morningstar", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "11 (2d8 + 2) piercing damage." }
    ]
  },
  {
    id: "cm-hobgoblin",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Hobgoblin",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 0.5,
    experiencePoints: 100,
    ac: 18,
    acNote: "chain shirt, shield",
    hp: 11,
    maxHp: 11,
    abilityScores: {
      strength: 13, dexterity: 12, constitution: 12,
      intelligence: 10, wisdom: 10, charisma: 9
    },
    skills: { Athletics: 3 },
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: ["Common", "Goblin"],
    description: "A disciplined goblinoid soldier.",
    traits: [
      { name: "Martial Advantage", description: "Once per turn, the hobgoblin can deal an extra 7 (2d6) damage to a creature it hits with a weapon attack if that creature is within 5 ft. of an ally of the hobgoblin that isn't incapacitated." }
    ],
    actions: [
      { name: "Longsword", description: "Melee Weapon Attack", attackBonus: 3, damageDescription: "5 (1d8 + 1) slashing damage, or 6 (1d10 + 1) if used two-handed." },
      { name: "Longbow", description: "Ranged Weapon Attack", attackBonus: 3, damageDescription: "5 (1d8 + 1) piercing damage." }
    ]
  },
  {
    id: "cm-owlbear",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Owlbear",
    size: "large",
    type: "monstrosity",
    alignment: "Unaligned",
    speed: "40 ft.",
    challengeRating: 3,
    experiencePoints: 700,
    ac: 13,
    acNote: "natural armor",
    hp: 59,
    maxHp: 59,
    abilityScores: {
      strength: 20, dexterity: 12, constitution: 17,
      intelligence: 3, wisdom: 12, charisma: 7
    },
    skills: { Perception: 3 },
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["understands Common but can't speak"],
    description: "A monstrous cross between an owl and a bear. Territorial and ferocious.",
    traits: [
      { name: "Keen Sight and Smell", description: "The owlbear has advantage on Wisdom (Perception) checks that rely on sight or smell." }
    ],
    actions: [
      { name: "Multiattack", description: "The owlbear makes two attacks: one with its beak and one with its claws." },
      { name: "Beak", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "10 (1d10 + 4) piercing damage." },
      { name: "Claws", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "14 (2d8 + 4) slashing damage." }
    ]
  },
  {
    id: "cm-banshee",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Banshee",
    size: "medium",
    type: "undead",
    alignment: "Chaotic Evil",
    speed: "0 ft., fly 40 ft. (hover)",
    challengeRating: 4,
    experiencePoints: 1100,
    ac: 12,
    hp: 58,
    maxHp: 58,
    abilityScores: {
      strength: 1, dexterity: 14, constitution: 10,
      intelligence: 12, wisdom: 11, charisma: 17
    },
    skills: { Perception: 4 },
    damageResistances: ["acid", "fire", "lightning", "thunder"],
    damageImmunities: ["cold", "necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "grappled", "paralyzed", "petrified", "poisoned", "prone", "restrained"],
    senses: { darkvision: "60 ft.", "passive Perception": "14" },
    languages: ["Common", "Sylvan"],
    description: "The wailing spirit of a wronged woman, endlessly mourning.",
    traits: [
      { name: "Detect Life", description: "The banshee can magically sense the presence of living creatures up to 5 miles away." },
      { name: "Incorporeal Movement", description: "The banshee can move through other creatures and objects as if they were difficult terrain." }
    ],
    actions: [
      { name: "Corrupting Touch", description: "Melee Spell Attack", attackBonus: 4, damageDescription: "12 (3d6 + 2) necrotic damage." },
      { name: "Horrifying Visage (Recharge 4-6)", description: "Each non-undead creature within 60 ft. that can see the banshee makes a DC 13 Wisdom save or is frightened for 1 minute." },
      { name: "Wail (1/Day)", description: "The banshee wails loudly. Each creature within 30 ft. makes a DC 13 Constitution save, taking 21 (6d6) thunder damage on a failure, or half on a success. A creature that fails is reduced to 0 hit points." }
    ]
  },
  {
    id: "cm-shadow",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Shadow",
    size: "medium",
    type: "undead",
    alignment: "Chaotic Evil",
    speed: "40 ft.",
    challengeRating: 1,
    experiencePoints: 200,
    ac: 12,
    hp: 16,
    maxHp: 16,
    abilityScores: {
      strength: 6, dexterity: 14, constitution: 10,
      intelligence: 6, wisdom: 8, charisma: 8
    },
    skills: { Stealth: 4 },
    damageResistances: ["acid", "cold", "fire", "lightning", "thunder"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["exhaustion", "frightened", "grappled", "paralyzed", "petrified", "poisoned", "prone", "restrained"],
    senses: { darkvision: "60 ft.", "passive Perception": "9" },
    languages: ["understands Common but can't speak"],
    description: "A gloomy, incorporeal undead born from dark magic.",
    traits: [
      { name: "Amorphous", description: "The shadow can move through a space as narrow as 1 inch wide without squeezing." },
      { name: "Incorporeal Movement", description: "The shadow can move through other creatures and objects as if they were difficult terrain." },
      { name: "Sunlight Weakness", description: "While in sunlight, the shadow has disadvantage on attack rolls, ability checks, and saving throws." }
    ],
    actions: [
      { name: "Multiattack", description: "The shadow makes two Shadow Touch attacks." },
      { name: "Shadow Touch", description: "Melee Spell Attack", attackBonus: 4, damageDescription: "9 (2d6 + 2) necrotic damage. The target's Strength is reduced by 2 (minimum 0). The target dies if its Strength is reduced to 0. If a non-evil humanoid dies this way, it rises as a shadow under the control of its killer." }
    ]
  },
  {
    id: "cm-spy",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Spy",
    size: "medium",
    type: "humanoid",
    alignment: "Any Non-Good Alignment",
    speed: "30 ft.",
    challengeRating: 1,
    experiencePoints: 200,
    ac: 12,
    hp: 27,
    maxHp: 27,
    abilityScores: {
      strength: 10, dexterity: 15, constitution: 10,
      intelligence: 12, wisdom: 12, charisma: 13
    },
    skills: { Deception: 5, Insight: 3, Investigation: 4, Perception: 3, Persuasion: 3, Stealth: 6 },
    senses: { "passive Perception": "13" },
    languages: ["any two languages"],
    description: "An infiltrator trained in deception and stealth.",
    traits: [
      { name: "Cunning Action", description: "The spy can take the Dash, Disengage, or Hide action as a bonus action on each of its turns." }
    ],
    actions: [
      { name: "Multiattack", description: "The spy makes two attacks with its shortsword. It can replace one attack with a use of Hand Crossbow." },
      { name: "Shortsword", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "5 (1d6 + 2) piercing damage." },
      { name: "Hand Crossbow", description: "Ranged Weapon Attack", attackBonus: 4, damageDescription: "5 (1d6 + 2) piercing damage." }
    ]
  },
  {
    id: "cm-stirges",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Stirges",
    size: "tiny",
    type: "beast",
    alignment: "Unaligned",
    speed: "10 ft., fly 40 ft.",
    challengeRating: 0.125,
    ac: 14,
    hp: 2,
    maxHp: 2,
    abilityScores: {
      strength: 4, dexterity: 16, constitution: 8,
      intelligence: 2, wisdom: 8, charisma: 6
    },
    senses: { darkvision: "60 ft.", "passive Perception": "9" },
    languages: ["understands Common but can't speak"],
    description: "Tiny, mosquito-like pests that suck blood.",
    traits: [],
    actions: [
      { name: "Blood Drain", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "5 (1d4 + 3) piercing damage, and the stirge attaches to the target. While attached, the stirge doesn't attack, but it drains 5 (1d4 + 3) hit points of blood from the target at the start of each of its turns. The stirge can detach itself by spending 5 ft. of movement." }
    ]
  },
  {
    id: "cm-giant-spider",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Giant Spider",
    size: "large",
    type: "beast",
    alignment: "Unaligned",
    speed: "30 ft., climb 30 ft.",
    challengeRating: 1,
    experiencePoints: 200,
    ac: 14,
    acNote: "natural armor",
    hp: 26,
    maxHp: 26,
    abilityScores: {
      strength: 14, dexterity: 16, constitution: 12,
      intelligence: 2, wisdom: 11, charisma: 4
    },
    skills: { Perception: 3, Stealth: 7 },
    senses: { blindsight: "10 ft.", darkvision: "60 ft.", tremorsense: "60 ft.", "passive Perception": "13" },
    languages: ["understands Common but can't speak"],
    description: "A massive spider that hunts in caverns and ruins.",
    traits: [
      { name: "Spider Climb", description: "The spider can climb difficult surfaces, including upside down on ceilings, without making an ability check." }
    ],
    actions: [
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "7 (1d8 + 3) piercing damage, and the target makes a DC 11 Constitution save, taking 9 (2d8) poison damage on a failure, or half on a success. If the poison damage reduces the target to 0 hit points, the target is stable but poisoned for 1 hour." },
      { name: "Web", description: "Ranged Weapon Attack", attackBonus: 5, damageDescription: "no damage; target is restrained by webbing." }
    ]
  },
  {
    id: "cm-wraith",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Wraith",
    size: "medium",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "0 ft., fly 60 ft. (hover)",
    challengeRating: 5,
    experiencePoints: 1800,
    ac: 13,
    hp: 67,
    maxHp: 67,
    abilityScores: {
      strength: 6, dexterity: 16, constitution: 16,
      intelligence: 12, wisdom: 14, charisma: 15
    },
    damageResistances: ["acid", "cold", "fire", "lightning", "thunder"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "grappled", "paralyzed", "petrified", "poisoned", "prone", "restrained"],
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["the languages it knew in life"],
    description: "The malevolent spirit of a person who refused to rest in death.",
    traits: [
      { name: "Incorporeal Movement", description: "The wraith can move through other creatures and objects as if they were difficult terrain." },
      { name: "Sunlight Sensitivity", description: "While in sunlight, the wraith has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight." }
    ],
    actions: [
      { name: "Multiattack", description: "The wraith makes two Life Drain attacks." },
      { name: "Life Drain", description: "Melee Spell Attack", attackBonus: 6, damageDescription: "21 (4d8 + 3) necrotic damage. The target must succeed on a DC 14 Constitution save or its hit point maximum is reduced by an amount equal to the damage taken. This reduction lasts until the target finishes a long rest. The target dies if its hit point maximum is reduced to 0." },
      { name: "Create Specter", description: "The wraith targets a humanoid within 10 ft. that has been dead for no longer than 1 minute and died violently. The target's spirit rises as a specter under the wraith's command." }
    ],
    legendaryActions: [
      { name: "Life Drain", description: "The wraith makes one Life Drain attack." }
    ],
    legendaryActionCount: 1
  },
  {
    id: "cm-cloaker",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Cloaker",
    size: "large",
    type: "aberration",
    alignment: "Chaotic Neutral",
    speed: "10 ft., fly 60 ft.",
    challengeRating: 8,
    experiencePoints: 3900,
    ac: 14,
    acNote: "natural armor",
    hp: 78,
    maxHp: 78,
    abilityScores: {
      strength: 15, dexterity: 14, constitution: 14,
      intelligence: 13, wisdom: 12, charisma: 11
    },
    skills: { Perception: 5, Stealth: 4 },
    senses: { darkvision: "60 ft.", "passive Perception": "15" },
    languages: ["understands Deep Speech but can't speak"],
    description: "A carnivorous aberration that resembles a tattered cloak.",
    traits: [
      { name: "Damage Resistance (Nonmagical)", description: "The cloaker takes no damage from bludgeoning, piercing, and slashing attacks that are nonmagical." },
      { name: "False Appearance", description: "While motionless, the cloaker is indistinguishable from a dark cloak." },
      { name: "Light Sensitivity", description: "While in bright light, the cloaker has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight." }
    ],
    actions: [
      { name: "Multiattack", description: "The cloaker makes two attacks: one with its bite and one with its tail." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "10 (2d6 + 3) piercing damage. If the target is a Medium or smaller creature, it is grappled (escape DC 13)." },
      { name: "Tail", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "8 (1d8 + 4) slashing damage." },
      { name: "Engulf", description: "The cloaker moves up to its speed. While doing so, it can enter a Medium or smaller creature's space. When it does so, the cloaker can make a bite attack against that creature." },
      { name: "Phantasms (Recharge 4-6)", description: "The cloaker magically creates illusions that cause one creature within 30 ft. to see the cloaker as a dead relative, friend, or loved one. The target makes a DC 13 Wisdom save. On a failure, it is paralyzed for 1 minute." }
    ]
  },
  {
    id: "cm-elder-brain",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Elder Brain",
    size: "large",
    type: "aberration",
    alignment: "Lawful Evil",
    speed: "0 ft., swim 10 ft.",
    challengeRating: 14,
    experiencePoints: 11500,
    ac: 17,
    acNote: "natural armor",
    hp: 210,
    maxHp: 210,
    abilityScores: {
      strength: 14, dexterity: 12, constitution: 18,
      intelligence: 21, wisdom: 19, charisma: 21
    },
    savingThrows: { intelligence: 9, wisdom: 8, charisma: 9 },
    skills: { Arcana: 9, Insight: 8, Perception: 8, Persuasion: 9 },
    damageImmunities: ["psychic"],
    conditionImmunities: ["charmed", "frightened"],
    senses: { blindsight: "120 ft.", truesight: "60 ft.", "passive Perception": "18" },
    languages: ["Deep Speech", "Undercommon", "telepathy 120 ft."],
    description: "A massive, sentient brain that dominates an entire mind flayer colony.",
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If the elder brain fails a saving throw, it can choose to succeed instead." },
      { name: "Magic Resistance", description: "The elder brain has advantage on saving throws against spells and other magical effects." },
      { name: "Telepathic Hub", description: "The elder brain can telepathically communicate with any creature it has enslaved within 5 miles." }
    ],
    actions: [
      { name: "Multiattack", description: "The elder brain makes one Tentacle attack and casts one spell." },
      { name: "Tentacle", description: "Melee Weapon Attack", attackBonus: 8, damageDescription: "13 (3d6 + 3) bludgeoning damage. If the target is a creature, it is grappled (escape DC 15) and pulled up to 5 ft. toward the elder brain." },
      { name: "Psychic Drain", description: "The elder brain targets one creature within 120 ft. that it can see. The target makes a DC 16 Intelligence save, taking 55 (10d10) psychic damage on a failure, or half on a success. On a failure, the elder brain learns one fact or memory of its choice." },
      { name: "Mind Blast (Recharge 5-6)", description: "The elder brain emits psychic energy in a 60-foot cone. Each creature in the area makes a DC 16 Intelligence save, taking 22 (4d10) psychic damage on a failure, or half on a success. On a failure, a creature also becomes stunned for 1 minute." },
      { name: "Spellcasting", description: "The elder brain is a 14th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 17, +9 to hit with spell attacks). At will: detect magic, levitate, mage hand. 3/day each: dispel magic, fear, hold monster, telekinesis. 1/day each: dominate monster, feeblemind, plane shift, psychic crush." }
    ],
    legendaryActions: [
      { name: "Tentacle Attack", description: "The elder brain makes one Tentacle attack." },
      { name: "Psychic Drain (Costs 2 Actions)", description: "The elder brain uses Psychic Drain." },
      { name: "Command Thrall", description: "The elder brain commands one enslaved creature within 120 ft. to take an action immediately." }
    ],
    legendaryActionCount: 2
  },
  {
    id: "cm-zombie",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Phandelver and Below: The Shattered Obelisk",
    name: "Zombie",
    size: "medium",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "20 ft.",
    challengeRating: 0.25,
    experiencePoints: 50,
    ac: 8,
    hp: 22,
    maxHp: 22,
    abilityScores: {
      strength: 13, dexterity: 6, constitution: 16,
      intelligence: 3, wisdom: 6, charisma: 5
    },
    savingThrows: { wisdom: 0 },
    damageImmunities: ["poison"],
    conditionImmunities: ["poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "8" },
    languages: ["understands the languages it knew in life but can't speak"],
    description: "A reanimated corpse that lurches forward seeking flesh.",
    traits: [
      { name: "Undead Fortitude", description: "If damage reduces the zombie to 0 hit points, it makes a Constitution saving throw with a +5 bonus. On a success, it drops to 1 hit point instead." }
    ],
    actions: [
      { name: "Slam", description: "Melee Weapon Attack", attackBonus: 3, damageDescription: "4 (1d6 + 1) bludgeoning damage." }
    ]
  },
  {
    "id": "cm-auril-frostmaiden",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Icewind Dale: Rime of the Frostmaiden",
    "name": "Auril, the Frostmaiden",
    "size": "medium",
    "type": "fiend (deity)",
    "alignment": "Neutral Evil",
    "speed": "40 ft., fly 40 ft.",
    "challengeRating": 12,
    "ac": 19,
    "acNote": "natural armor",
    "hp": 202,
    "maxHp": 202,
    "abilityScores": {
      "strength": 18,
      "dexterity": 22,
      "constitution": 20,
      "intelligence": 16,
      "wisdom": 20,
      "charisma": 18
    },
    "savingThrows": {
      "dexterity": 11,
      "constitution": 10,
      "wisdom": 10,
      "charisma": 9
    },
    "skills": {
      "Perception": 10,
      "Stealth": 11
    },
    "damageImmunities": [
      "cold"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "19"
    },
    "languages": [
      "Common",
      "Giant",
      "Primordial"
    ],
    "description": "The cruel goddess of winter, cast in the form of a ten-foot woman of blue-white ice (\"Lady Icekiss\").",
    "traits": [
      {
        "name": "Frost Aura",
        "description": "At the start of each of its turns, each creature within 10 feet of Auril takes 11 (2d10) cold damage. A creature that touches Auril or hits her with a melee attack while within 5 feet of her takes 11 (2d10) cold damage."
      },
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If Auril fails a saving throw, she can choose to succeed instead."
      },
      {
        "name": "Icewalk",
        "description": "Auril can move across and climb icy surfaces without needing to make an ability check. Difficult terrain composed of ice or snow does not cost her extra movement."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Auril makes three Frostbite Touch attacks."
      },
      {
        "name": "Frostbite Touch",
        "description": "Melee Spell Attack",
        "attackBonus": 11,
        "damageDescription": "18 (4d6 + 4) cold damage, and the target must succeed on a DC 19 Constitution saving throw or its speed is halved until the end of its next turn."
      },
      {
        "name": "Cone of Cold (Recharge 5-6)",
        "description": "Auril unleashes a 60-foot cone of frost. Each creature in that area must make a DC 19 Constitution saving throw, taking 36 (8d8) cold damage on a failed save, or half as much on a success."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Move",
        "description": "Auril moves up to her speed without provoking opportunity attacks."
      },
      {
        "name": "Frostbite Touch",
        "description": "Auril makes one Frostbite Touch attack."
      },
      {
        "name": "Blizzard (Costs 2 Actions)",
        "description": "Auril conjures a 20-foot-radius sphere of howling wind and snow centered on a point she can see within 60 feet. Each creature in the area must succeed on a DC 19 Strength saving throw or be knocked prone and take 14 (4d6) cold damage.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-coldlight-walker",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Icewind Dale: Rime of the Frostmaiden",
    "name": "Coldlight Walker",
    "size": "medium",
    "type": "undead",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 5,
    "ac": 12,
    "acNote": "natural armor",
    "hp": 97,
    "maxHp": 97,
    "abilityScores": {
      "strength": 18,
      "dexterity": 10,
      "constitution": 18,
      "intelligence": 6,
      "wisdom": 12,
      "charisma": 8
    },
    "savingThrows": {
      "constitution": 6
    },
    "damageImmunities": [
      "cold",
      "necrotic",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "understands Common but can't speak"
    ],
    "description": "A frozen wanderer that died in the everlasting blizzard, now hollow and radiating unnatural cold.",
    "traits": [
      {
        "name": "Cold Radiance",
        "description": "At the start of each of the walker's turns, each creature within 20 feet of it takes 5 (1d10) cold damage. A creature reduced to 0 hit points by this damage dies and rises as a coldlight walker after 1 minute."
      },
      {
        "name": "Frozen Fortitude",
        "description": "If damage reduces the walker to 0 hit points, it makes a DC 10 Constitution saving throw, dropping to 1 hit point instead on a success unless the damage was fire or radiant."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The coldlight walker makes two Slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "13 (2d8 + 4) bludgeoning damage plus 9 (2d8) cold damage."
      }
    ]
  },
  {
    "id": "cm-chardalyn-dragon",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Icewind Dale: Rime of the Frostmaiden",
    "name": "Chardalyn Dragon",
    "size": "huge",
    "type": "construct",
    "alignment": "Chaotic Evil",
    "speed": "40 ft., fly 80 ft.",
    "challengeRating": 14,
    "ac": 19,
    "acNote": "natural armor",
    "hp": 195,
    "maxHp": 195,
    "abilityScores": {
      "strength": 23,
      "dexterity": 10,
      "constitution": 22,
      "intelligence": 14,
      "wisdom": 11,
      "charisma": 19
    },
    "savingThrows": {
      "dexterity": 5,
      "constitution": 11,
      "wisdom": 5,
      "charisma": 9
    },
    "skills": {
      "Perception": 10
    },
    "damageImmunities": [
      "poison",
      "psychic"
    ],
    "conditionImmunities": [
      "blinded",
      "charmed",
      "deafened",
      "exhaustion",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive Perception": "15"
    },
    "languages": [
      "understands Common and Draconic but can't speak"
    ],
    "description": "A dragon-shaped automaton forged from black chardalyn crystal by the duergar of Sunblight, driven by a bound elemental hatred.",
    "traits": [
      {
        "name": "Magic Absorption",
        "description": "Whenever the dragon is targeted by a spell of 5th level or lower, the spell has no effect on it and it regains hit points equal to 5 times the spell's level."
      },
      {
        "name": "Unusual Nature",
        "description": "The dragon doesn't require air, food, drink, or sleep."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes one Bite attack and two Claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 11,
        "damageDescription": "17 (2d10 + 6) piercing damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 11,
        "damageDescription": "13 (2d6 + 6) slashing damage."
      },
      {
        "name": "Shard Breath (Recharge 5-6)",
        "description": "The dragon exhales a 60-foot cone of razor crystal shards. Each creature in that area must make a DC 19 Dexterity saving throw, taking 45 (10d8) slashing damage on a failed save, or half as much on a success."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Claw Attack",
        "description": "The dragon makes one Claw attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "The dragon beats its metal wings. Each creature within 10 feet must succeed on a DC 19 Dexterity saving throw or take 13 (2d6 + 6) bludgeoning damage and be knocked prone. The dragon can then fly up to half its speed.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-aunaut-aurilblight",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Icewind Dale: Rime of the Frostmaiden",
    "name": "Aunaut Aurilblight",
    "size": "huge",
    "type": "giant",
    "alignment": "Neutral Evil",
    "speed": "40 ft.",
    "challengeRating": 11,
    "ac": 16,
    "acNote": "natural armor",
    "hp": 172,
    "maxHp": 172,
    "abilityScores": {
      "strength": 23,
      "dexterity": 9,
      "constitution": 21,
      "intelligence": 12,
      "wisdom": 18,
      "charisma": 13
    },
    "savingThrows": {
      "constitution": 9,
      "wisdom": 8
    },
    "skills": {
      "Perception": 8,
      "Religion": 5
    },
    "damageImmunities": [
      "cold"
    ],
    "senses": {
      "passive Perception": "18"
    },
    "languages": [
      "Giant",
      "Common"
    ],
    "description": "A frost giant priest-king of fallen Ythryn who survived the city's plunge into the glacier, now a fanatical cleric of Auril.",
    "traits": [
      {
        "name": "Frozen Devotion",
        "description": "Aunaut has advantage on saving throws against being charmed or frightened, and creatures within 10 feet of him have their speed reduced by 10 feet from the ambient cold."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Aunaut makes two Greataxe attacks or two Ice Bolt attacks."
      },
      {
        "name": "Greataxe",
        "description": "Melee Weapon Attack",
        "attackBonus": 10,
        "damageDescription": "19 (3d8 + 6) slashing damage plus 7 (2d6) cold damage."
      },
      {
        "name": "Ice Bolt",
        "description": "Ranged Spell Attack",
        "attackBonus": 8,
        "damageDescription": "21 (6d6) cold damage, and the target's speed is reduced by 10 feet until the end of its next turn."
      },
      {
        "name": "Sleet Storm (1/Day)",
        "description": "Aunaut conjures freezing rain and sleet in a 20-foot-tall, 40-foot-radius cylinder centered on a point within 150 feet. The area is heavily obscured and difficult terrain, and creatures that enter for the first time on a turn or start there must succeed on a DC 16 Dexterity saving throw or fall prone."
      }
    ]
  },
  {
    "id": "cm-iriolarthas",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Icewind Dale: Rime of the Frostmaiden",
    "name": "Iriolarthas, the Netherese Necromancer",
    "size": "medium",
    "type": "undead",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 12,
    "ac": 17,
    "acNote": "natural armor",
    "hp": 150,
    "maxHp": 150,
    "abilityScores": {
      "strength": 11,
      "dexterity": 16,
      "constitution": 16,
      "intelligence": 21,
      "wisdom": 15,
      "charisma": 17
    },
    "savingThrows": {
      "constitution": 8,
      "intelligence": 10,
      "wisdom": 7
    },
    "skills": {
      "Arcana": 15,
      "History": 15,
      "Perception": 7
    },
    "damageResistances": [
      "cold",
      "lightning"
    ],
    "damageImmunities": [
      "necrotic",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "poisoned"
    ],
    "senses": {
      "truesight": "120 ft.",
      "passive Perception": "16"
    },
    "languages": [
      "Common",
      "Netherese",
      "Draconic",
      "Abyssal"
    ],
    "description": "The last archwizard of Ythryn, sustained past death by the city's mythallar, obsessed with restarting the engine that doomed his people.",
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If Iriolarthas fails a saving throw, he can choose to succeed instead."
      },
      {
        "name": "Rejuvenation",
        "description": "If destroyed while the Ythryn mythallar functions, Iriolarthas reforms in 1d10 days within the necropolis."
      },
      {
        "name": "Spellcasting",
        "description": "Iriolarthas casts spells as a 17th-level wizard (spell save DC 18). He has prepared blight, cloudkill, cone of cold, finger of death, and wall of ice."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Iriolarthas makes three Chill Touch attacks."
      },
      {
        "name": "Chill Touch",
        "description": "Ranged Spell Attack",
        "attackBonus": 10,
        "damageDescription": "16 (3d8 + 3) necrotic damage, and the target can't regain hit points until the start of Iriolarthas's next turn."
      },
      {
        "name": "Finger of Death (1/Day)",
        "description": "One creature within 60 feet must make a DC 18 Constitution saving throw, taking 62 (7d8 + 30) necrotic damage on a failed save, or half as much on a success. A humanoid killed by this attack rises as a zombie under Iriolarthas's control."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Chill Touch",
        "description": "Iriolarthas makes one Chill Touch attack."
      },
      {
        "name": "Frozen Step",
        "description": "Iriolarthas teleports up to 30 feet to an unoccupied space he can see."
      },
      {
        "name": "Withering Word (Costs 2 Actions)",
        "description": "Each creature of Iriolarthas's choice within 30 feet must succeed on a DC 18 Wisdom saving throw or take 18 (4d8) psychic damage.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-leviathan",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Icewind Dale: Rime of the Frostmaiden",
    "name": "Leviathan (Netherese)",
    "size": "gargantuan",
    "type": "elemental",
    "alignment": "Neutral",
    "speed": "0 ft., swim 60 ft., fly 60 ft. (hover)",
    "challengeRating": 20,
    "ac": 17,
    "hp": 310,
    "maxHp": 310,
    "abilityScores": {
      "strength": 29,
      "dexterity": 14,
      "constitution": 26,
      "intelligence": 5,
      "wisdom": 12,
      "charisma": 14
    },
    "savingThrows": {
      "strength": 16,
      "constitution": 15,
      "wisdom": 7
    },
    "skills": {
      "Perception": 7
    },
    "damageResistances": [
      "acid",
      "fire",
      "lightning"
    ],
    "damageImmunities": [
      "cold",
      "poison"
    ],
    "conditionImmunities": [
      "exhaustion",
      "grappled",
      "paralyzed",
      "petrified",
      "poisoned",
      "prone",
      "restrained",
      "unconscious"
    ],
    "senses": {
      "blindsight": "120 ft.",
      "passive Perception": "17"
    },
    "languages": [
      "understands Primordial"
    ],
    "description": "A colossal wave-serpent of living water summoned from Realms myth, released as a last resort against Auril.",
    "traits": [
      {
        "name": "Water Form",
        "description": "The leviathan can enter a hostile creature's space and stop there. It can move through a space as narrow as 1 inch wide without squeezing."
      },
      {
        "name": "Freeze",
        "description": "If the leviathan takes cold damage, it partly freezes: its speed is reduced by 20 feet until the end of its next turn."
      },
      {
        "name": "Siege Monster",
        "description": "The leviathan deals double damage to objects and structures."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The leviathan makes two Slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 16,
        "damageDescription": "30 (4d10 + 8) bludgeoning damage, and the target must succeed on a DC 24 Strength saving throw or be knocked prone."
      },
      {
        "name": "Tidal Crush (Recharge 5-6)",
        "description": "The leviathan slams a 90-foot-long, 30-foot-wide line of water down. Each creature in that line must make a DC 24 Dexterity saving throw, taking 55 (10d10) bludgeoning damage and being swept 30 feet away and knocked prone on a failed save, or half as much damage on a success."
      }
    ]
  },
  {
    "id": "cm-chardalyn-berserker",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Icewind Dale: Rime of the Frostmaiden",
    "name": "Chardalyn Berserker",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Chaotic Neutral",
    "speed": "30 ft.",
    "challengeRating": 2,
    "ac": 12,
    "acNote": "hide armor",
    "hp": 45,
    "maxHp": 45,
    "abilityScores": {
      "strength": 16,
      "dexterity": 12,
      "constitution": 16,
      "intelligence": 8,
      "wisdom": 10,
      "charisma": 10
    },
    "senses": {
      "passive Perception": "10"
    },
    "languages": [
      "Common"
    ],
    "description": "A Reghed nomad driven murderously insane by exposure to raw chardalyn crystal.",
    "traits": [
      {
        "name": "Reckless",
        "description": "At the start of its turn, the berserker can gain advantage on all melee weapon attack rolls it makes during that turn, but attack rolls against it have advantage until the start of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The berserker makes two Greataxe attacks."
      },
      {
        "name": "Greataxe",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "9 (1d12 + 3) slashing damage."
      }
    ]
  },
  {
    "id": "cm-white-dragon-wyrmling-rime",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Icewind Dale: Rime of the Frostmaiden",
    "name": "White Dragon Wyrmling",
    "size": "medium",
    "type": "dragon",
    "alignment": "Chaotic Evil",
    "speed": "30 ft., burrow 15 ft., fly 60 ft., swim 30 ft.",
    "challengeRating": 2,
    "ac": 16,
    "acNote": "natural armor",
    "hp": 32,
    "maxHp": 32,
    "abilityScores": {
      "strength": 14,
      "dexterity": 10,
      "constitution": 14,
      "intelligence": 5,
      "wisdom": 10,
      "charisma": 11
    },
    "savingThrows": {
      "dexterity": 2,
      "constitution": 4,
      "wisdom": 2,
      "charisma": 2
    },
    "skills": {
      "Perception": 4,
      "Stealth": 2
    },
    "damageImmunities": [
      "cold"
    ],
    "senses": {
      "blindsight": "10 ft.",
      "darkvision": "60 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "Draconic"
    ],
    "description": "A young white dragon serving as a mount or guardian in the frozen reaches.",
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "5 (1d10) piercing damage plus 2 (1d4) cold damage."
      },
      {
        "name": "Cold Breath (Recharge 5-6)",
        "description": "The wyrmling exhales an icy blast in a 15-foot cone. Each creature in that area must make a DC 12 Constitution saving throw, taking 22 (5d8) cold damage on a failed save, or half as much on a success."
      }
    ]
  },
  {
    "id": "cm-xardorok-sunblight",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Icewind Dale: Rime of the Frostmaiden",
    "name": "Xardorok Sunblight",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "25 ft.",
    "challengeRating": 6,
    "ac": 20,
    "acNote": "plate armor, shield",
    "hp": 102,
    "maxHp": 102,
    "abilityScores": {
      "strength": 16,
      "dexterity": 11,
      "constitution": 18,
      "intelligence": 15,
      "wisdom": 12,
      "charisma": 16
    },
    "savingThrows": {
      "constitution": 7,
      "wisdom": 4
    },
    "skills": {
      "Perception": 4
    },
    "damageResistances": [
      "fire"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "14"
    },
    "languages": [
      "Common",
      "Dwarvish",
      "Undercommon"
    ],
    "description": "The paranoid duergar warlord of Sunblight, architect of the chardalyn dragon.",
    "traits": [
      {
        "name": "Duergar Resilience",
        "description": "Xardorok has advantage on saving throws against poison, illusions, and being charmed, paralyzed, or stunned."
      },
      {
        "name": "Sunlight Sensitivity",
        "description": "While in sunlight, Xardorok has disadvantage on attack rolls and Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Xardorok makes two attacks with his enlarged flail."
      },
      {
        "name": "Chardalyn Flail",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "13 (2d8 + 4) bludgeoning damage plus 10 (3d6) necrotic damage."
      },
      {
        "name": "Enlarge (Recharges after a Short or Long Rest)",
        "description": "For 1 minute, Xardorok magically increases in size along with anything he is wearing or carrying. His melee attacks deal an extra 4 (1d8) damage."
      }
    ]
  },
  {
    "id": "cm-duergar-soldier-rime",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Icewind Dale: Rime of the Frostmaiden",
    "name": "Duergar Soldier",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "25 ft.",
    "challengeRating": 1,
    "ac": 16,
    "acNote": "scale mail, shield",
    "hp": 26,
    "maxHp": 26,
    "abilityScores": {
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
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Dwarvish",
      "Undercommon"
    ],
    "description": "A gray dwarf warrior of Clan Sunblight.",
    "traits": [
      {
        "name": "Duergar Resilience",
        "description": "Advantage on saves against poison, illusions, and being charmed, paralyzed, or stunned."
      }
    ],
    "actions": [
      {
        "name": "War Pick",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "6 (1d8 + 2) piercing damage."
      },
      {
        "name": "Invisibility (Recharges after a Short or Long Rest)",
        "description": "The duergar magically turns invisible for up to 1 hour or until it attacks, casts a spell, or uses Enlarge."
      }
    ]
  },
  {
    "id": "cm-frost-druid",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Icewind Dale: Rime of the Frostmaiden",
    "name": "Frost Druid of Auril",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 3,
    "ac": 13,
    "acNote": "hide armor",
    "hp": 44,
    "maxHp": 44,
    "abilityScores": {
      "strength": 10,
      "dexterity": 14,
      "constitution": 14,
      "intelligence": 12,
      "wisdom": 17,
      "charisma": 11
    },
    "skills": {
      "Nature": 3,
      "Perception": 5
    },
    "senses": {
      "passive Perception": "15"
    },
    "languages": [
      "Common",
      "Druidic"
    ],
    "description": "A hermit priest of the Frostmaiden who calls the blizzard down on trespassers.",
    "traits": [
      {
        "name": "Spellcasting",
        "description": "The druid casts spells as a 5th-level druid (save DC 13): ice knife, sleet storm, and gust of wind."
      }
    ],
    "actions": [
      {
        "name": "Icicle Staff",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "6 (1d8 + 2) bludgeoning damage plus 4 (1d8) cold damage."
      },
      {
        "name": "Ice Knife",
        "description": "Ranged Spell Attack",
        "attackBonus": 5,
        "damageDescription": "10 (3d6) piercing damage, and the target and each creature within 5 feet of it must make a DC 13 Dexterity save or take 5 (2d4) cold damage."
      }
    ]
  },
  {
    "id": "cm-crag-cat",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Icewind Dale: Rime of the Frostmaiden",
    "name": "Crag Cat",
    "size": "medium",
    "type": "monstrosity",
    "alignment": "Unaligned",
    "speed": "40 ft., climb 40 ft.",
    "challengeRating": 2,
    "ac": 12,
    "hp": 34,
    "maxHp": 34,
    "abilityScores": {
      "strength": 15,
      "dexterity": 15,
      "constitution": 12,
      "intelligence": 6,
      "wisdom": 12,
      "charisma": 8
    },
    "skills": {
      "Perception": 3,
      "Stealth": 4
    },
    "damageResistances": [
      "cold"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "13"
    },
    "languages": [],
    "description": "A pale, magic-sensing predator of the Icewind Dale tundra.",
    "traits": [
      {
        "name": "Detect Magic",
        "description": "The crag cat senses the presence of magic within 30 feet as if it had the detect magic spell."
      },
      {
        "name": "Keen Smell",
        "description": "The crag cat has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The crag cat makes one Bite attack and one Claws attack."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "7 (1d10 + 2) piercing damage."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "9 (2d6 + 2) slashing damage."
      }
    ]
  },
  {
    "id": "cm-gerti-orelsdottr",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Icewind Dale: Rime of the Frostmaiden",
    "name": "Gerti Orelsdottr",
    "size": "huge",
    "type": "giant",
    "alignment": "Neutral Evil",
    "speed": "40 ft.",
    "challengeRating": 9,
    "ac": 17,
    "acNote": "patchwork plate",
    "hp": 175,
    "maxHp": 175,
    "abilityScores": {
      "strength": 23,
      "dexterity": 9,
      "constitution": 21,
      "intelligence": 10,
      "wisdom": 12,
      "charisma": 12
    },
    "savingThrows": {
      "constitution": 8,
      "wisdom": 3,
      "charisma": 3
    },
    "skills": {
      "Athletics": 9,
      "Perception": 3
    },
    "damageImmunities": [
      "cold"
    ],
    "senses": {
      "passive Perception": "15"
    },
    "languages": [
      "Giant"
    ],
    "description": "The exiled frost giant jarl of the Reghed Glacier, seeking a white dragon ally to reclaim her throne.",
    "actions": [
      {
        "name": "Multiattack",
        "description": "Gerti makes two Greataxe attacks."
      },
      {
        "name": "Greataxe",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "23 (3d12 + 6) slashing damage."
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "28 (4d10 + 6) bludgeoning damage."
      }
    ]
  },
  {
    "id": "cm-ythryn-mind-flayer",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Icewind Dale: Rime of the Frostmaiden",
    "name": "Ythryn Mind Flayer",
    "size": "medium",
    "type": "aberration",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 7,
    "ac": 15,
    "acNote": "breastplate",
    "hp": 71,
    "maxHp": 71,
    "abilityScores": {
      "strength": 11,
      "dexterity": 12,
      "constitution": 12,
      "intelligence": 19,
      "wisdom": 17,
      "charisma": 17
    },
    "savingThrows": {
      "intelligence": 7,
      "wisdom": 6,
      "charisma": 6
    },
    "skills": {
      "Arcana": 7,
      "Deception": 6,
      "Insight": 6,
      "Perception": 6,
      "Persuasion": 6,
      "Stealth": 4
    },
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "16"
    },
    "languages": [
      "Deep Speech",
      "Undercommon",
      "telepathy 120 ft."
    ],
    "description": "An illithid survivor entombed with the necropolis for two thousand years, still scheming.",
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "The mind flayer has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Spellcasting",
        "description": "The mind flayer casts spells as an 8th-level caster (save DC 15): detect thoughts, levitate, dominate monster (1/day), plane shift (self only, 1/day)."
      }
    ],
    "actions": [
      {
        "name": "Tentacles",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "15 (2d10 + 4) psychic damage, and the target is grappled (escape DC 15). While grappled, the target is restrained and takes 10 (3d6) psychic damage at the start of each of the mind flayer's turns."
      },
      {
        "name": "Mind Blast (Recharge 5-6)",
        "description": "The mind flayer emanates psychic energy in a 60-foot cone. Each creature in that area must succeed on a DC 15 Intelligence saving throw or take 22 (4d8 + 4) psychic damage and be stunned for 1 minute (repeat save at end of each turn)."
      },
      {
        "name": "Extract Brain",
        "description": "Melee Weapon Attack against an incapacitated humanoid grappled by the mind flayer: 55 (10d10) piercing damage. If this reduces the target to 0 hit points, the mind flayer kills it by extracting and devouring its brain."
      }
    ]
  },
  {
    "id": "cm-brigid-morningglow",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "The Wild Beyond the Witchlight",
    "name": "Brigid Morningglow",
    "size": "medium",
    "type": "fey",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 7,
    "ac": 17,
    "acNote": "natural armor",
    "hp": 105,
    "maxHp": 105,
    "abilityScores": {
      "strength": 16,
      "dexterity": 14,
      "constitution": 16,
      "intelligence": 13,
      "wisdom": 14,
      "charisma": 16
    },
    "savingThrows": {
      "wisdom": 5,
      "charisma": 6
    },
    "skills": {
      "Deception": 6,
      "Insight": 5,
      "Perception": 5
    },
    "conditionImmunities": [
      "charmed"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "15"
    },
    "languages": [
      "Common",
      "Sylvan"
    ],
    "description": "The dawn-faced first sister of the Hourglass Coven, keeper of stolen mornings.",
    "traits": [
      {
        "name": "Coven Spellcasting",
        "description": "While within 30 feet of at least one coven ally, this hag can cast shared coven spells (save DC 15): counterspell, lightning bolt, phantasmal killer, polymorph."
      },
      {
        "name": "Magic Resistance",
        "description": "The hag has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Legendary Resistance (2/Day)",
        "description": "If the hag fails a saving throw, she can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Brigid makes two Claw attacks."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "12 (2d8 + 3) slashing damage plus 7 (2d6) radiant damage."
      },
      {
        "name": "Dawnsteal (Recharge 5-6)",
        "description": "Brigid targets one creature within 60 feet. It must succeed on a DC 15 Charisma saving throw or lose all benefits of its most recent long rest and gain one level of exhaustion."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Claw",
        "description": "The hag makes one Claw attack."
      },
      {
        "name": "Vanish",
        "description": "The hag magically turns invisible until the start of her next turn or until she attacks."
      },
      {
        "name": "Fey Curse (Costs 2 Actions)",
        "description": "The hag targets one creature within 30 feet. It must succeed on a DC 15 Wisdom saving throw or be cursed with disadvantage on saving throws for 1 minute.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-mungoj-reyhorn",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "The Wild Beyond the Witchlight",
    "name": "Mungoj Reyhorn",
    "size": "medium",
    "type": "fey",
    "alignment": "Chaotic Evil",
    "speed": "40 ft.",
    "challengeRating": 6,
    "ac": 16,
    "acNote": "natural armor",
    "hp": 95,
    "maxHp": 95,
    "abilityScores": {
      "strength": 18,
      "dexterity": 15,
      "constitution": 15,
      "intelligence": 12,
      "wisdom": 13,
      "charisma": 14
    },
    "savingThrows": {
      "strength": 7,
      "constitution": 5
    },
    "skills": {
      "Athletics": 7,
      "Perception": 4,
      "Stealth": 5
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "14"
    },
    "languages": [
      "Common",
      "Sylvan"
    ],
    "description": "The horned brother-consort of the Hourglass Coven, a satyr twisted by hag magic.",
    "traits": [
      {
        "name": "Coven Spellcasting",
        "description": "While within 30 feet of at least one coven ally, this hag can cast shared coven spells (save DC 15): counterspell, lightning bolt, phantasmal killer, polymorph."
      },
      {
        "name": "Magic Resistance",
        "description": "The hag has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Legendary Resistance (2/Day)",
        "description": "If the hag fails a saving throw, she can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Mungoj makes two attacks: one with his Ram and one with his Goring Horns."
      },
      {
        "name": "Ram",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "13 (2d8 + 4) bludgeoning damage, and the target must succeed on a DC 15 Strength saving throw or be pushed 10 feet and knocked prone."
      },
      {
        "name": "Goring Horns",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "11 (2d6 + 4) piercing damage."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Claw",
        "description": "The hag makes one Claw attack."
      },
      {
        "name": "Vanish",
        "description": "The hag magically turns invisible until the start of her next turn or until she attacks."
      },
      {
        "name": "Fey Curse (Costs 2 Actions)",
        "description": "The hag targets one creature within 30 feet. It must succeed on a DC 15 Wisdom saving throw or be cursed with disadvantage on saving throws for 1 minute.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-endelyn-moongrave",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "The Wild Beyond the Witchlight",
    "name": "Endelyn Moongrave",
    "size": "medium",
    "type": "fey",
    "alignment": "Neutral Evil",
    "speed": "30 ft., fly 30 ft.",
    "challengeRating": 8,
    "ac": 18,
    "acNote": "natural armor",
    "hp": 133,
    "maxHp": 133,
    "abilityScores": {
      "strength": 15,
      "dexterity": 16,
      "constitution": 17,
      "intelligence": 15,
      "wisdom": 16,
      "charisma": 18
    },
    "savingThrows": {
      "dexterity": 6,
      "wisdom": 6,
      "charisma": 7
    },
    "skills": {
      "Arcana": 5,
      "Deception": 7,
      "Perception": 6,
      "Stealth": 6
    },
    "damageResistances": [
      "necrotic"
    ],
    "conditionImmunities": [
      "charmed",
      "frightened"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "16"
    },
    "languages": [
      "Common",
      "Elvish",
      "Sylvan"
    ],
    "description": "The eldest sister of the Hourglass Coven, the Hag of the West who rules beasts and moonlight from her theater of shadows.",
    "traits": [
      {
        "name": "Coven Spellcasting",
        "description": "While within 30 feet of at least one coven ally, this hag can cast shared coven spells (save DC 16): counterspell, lightning bolt, phantasmal killer, polymorph."
      },
      {
        "name": "Magic Resistance",
        "description": "The hag has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Legendary Resistance (2/Day)",
        "description": "If the hag fails a saving throw, she can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Endelyn makes three Moonfire Bolt attacks or two Claw attacks."
      },
      {
        "name": "Moonfire Bolt",
        "description": "Ranged Spell Attack",
        "attackBonus": 7,
        "damageDescription": "14 (3d6 + 4) radiant damage, and the target sheds dim light in a 10-foot radius until the end of its next turn and can't benefit from being invisible."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "11 (2d6 + 4) slashing damage plus 7 (2d6) necrotic damage."
      },
      {
        "name": "Final Act (Recharge 6)",
        "description": "Endelyn forces each creature of her choice within 30 feet to make a DC 16 Wisdom saving throw. On a failure, a creature is stunned until the end of its next turn as it relives its worst memory."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Claw",
        "description": "Endelyn makes one Claw attack."
      },
      {
        "name": "Moonstep",
        "description": "Endelyn teleports up to 40 feet to a space in dim light or darkness that she can see."
      },
      {
        "name": "Curtain Call (Costs 2 Actions)",
        "description": "Endelyn conjures grasping shadow puppets in a 15-foot cube within 30 feet. Each creature there must succeed on a DC 16 Strength saving throw or be restrained until the end of Endelyn's next turn.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-sister-gala",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "The Wild Beyond the Witchlight",
    "name": "Sister Gala",
    "size": "medium",
    "type": "fey",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 7,
    "ac": 17,
    "acNote": "natural armor",
    "hp": 112,
    "maxHp": 112,
    "abilityScores": {
      "strength": 16,
      "dexterity": 15,
      "constitution": 16,
      "intelligence": 14,
      "wisdom": 13,
      "charisma": 15
    },
    "savingThrows": {
      "constitution": 6,
      "charisma": 5
    },
    "skills": {
      "Deception": 5,
      "Perception": 4,
      "Sleight of Hand": 5
    },
    "conditionImmunities": [
      "charmed"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "14"
    },
    "languages": [
      "Common",
      "Sylvan",
      "Infernal"
    ],
    "description": "The youngest sister of the Hourglass Coven, mistress of bargains and the sand that never runs out.",
    "traits": [
      {
        "name": "Coven Spellcasting",
        "description": "While within 30 feet of at least one coven ally, this hag can cast shared coven spells (save DC 15): counterspell, lightning bolt, phantasmal killer, polymorph."
      },
      {
        "name": "Magic Resistance",
        "description": "The hag has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Legendary Resistance (2/Day)",
        "description": "If the hag fails a saving throw, she can choose to succeed instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Sister Gala makes two Claw attacks."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "12 (2d8 + 3) slashing damage."
      },
      {
        "name": "Sands of Debt (Recharge 5-6)",
        "description": "Sister Gala targets one creature within 30 feet that has made a bargain with any hag. It must succeed on a DC 15 Wisdom saving throw or be paralyzed until the end of its next turn as the hourglass empties."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Claw",
        "description": "The hag makes one Claw attack."
      },
      {
        "name": "Vanish",
        "description": "The hag magically turns invisible until the start of her next turn or until she attacks."
      },
      {
        "name": "Fey Curse (Costs 2 Actions)",
        "description": "The hag targets one creature within 30 feet. It must succeed on a DC 15 Wisdom saving throw or be cursed with disadvantage on saving throws for 1 minute.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-wendigo",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "The Wild Beyond the Witchlight",
    "name": "Wendigo",
    "size": "large",
    "type": "fey",
    "alignment": "Chaotic Evil",
    "speed": "50 ft., climb 30 ft.",
    "challengeRating": 9,
    "ac": 15,
    "acNote": "natural armor",
    "hp": 138,
    "maxHp": 138,
    "abilityScores": {
      "strength": 20,
      "dexterity": 17,
      "constitution": 18,
      "intelligence": 8,
      "wisdom": 15,
      "charisma": 10
    },
    "savingThrows": {
      "dexterity": 7,
      "constitution": 8,
      "wisdom": 6
    },
    "skills": {
      "Perception": 6,
      "Stealth": 7,
      "Survival": 6
    },
    "damageResistances": [
      "cold"
    ],
    "conditionImmunities": [
      "exhaustion",
      "frightened"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "16"
    },
    "languages": [
      "Sylvan",
      "understands Common"
    ],
    "description": "A starving winter-spirit of the fractured Feywild, the hunger of a frozen forest given a gaunt and antlered shape.",
    "traits": [
      {
        "name": "Cold Wake",
        "description": "A creature that ends its turn within 10 feet of the wendigo takes 5 (1d10) cold damage."
      },
      {
        "name": "Unnerving Howl",
        "description": "When the wendigo howls (no action), each creature within 60 feet that can hear it must succeed on a DC 16 Wisdom saving throw or be frightened until the end of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The wendigo makes one Bite attack and two Claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "15 (2d10 + 5) piercing damage plus 7 (2d6) cold damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "12 (2d6 + 5) slashing damage."
      },
      {
        "name": "Windwalk (Recharge 5-6)",
        "description": "The wendigo becomes a howling gale and moves up to 100 feet in a straight line. Each creature in its path must make a DC 16 Dexterity saving throw, taking 21 (6d6) cold damage on a failed save, or half as much on a success."
      }
    ]
  },
  {
    "id": "cm-harengon-brigand",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "The Wild Beyond the Witchlight",
    "name": "Harengon Brigand",
    "size": "small",
    "type": "fey",
    "alignment": "Chaotic Neutral",
    "speed": "35 ft.",
    "challengeRating": 2,
    "ac": 14,
    "acNote": "studded leather",
    "hp": 33,
    "maxHp": 33,
    "abilityScores": {
      "strength": 11,
      "dexterity": 17,
      "constitution": 12,
      "intelligence": 11,
      "wisdom": 13,
      "charisma": 12
    },
    "skills": {
      "Acrobatics": 5,
      "Stealth": 5
    },
    "senses": {
      "passive Perception": "11"
    },
    "languages": [
      "Common",
      "Sylvan"
    ],
    "description": "One of Agdon Longscarf's rabbit-folk bandits working the road to the Witchlight Carnival.",
    "traits": [
      {
        "name": "Lucky Footwork",
        "description": "When the brigand fails a Dexterity saving throw, it can use its reaction to gain a +4 bonus to the roll if it isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The brigand makes two Shortsword attacks."
      },
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "6 (1d6 + 3) piercing damage."
      },
      {
        "name": "Sling",
        "description": "Ranged Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "5 (1d4 + 3) bludgeoning damage."
      }
    ]
  },
  {
    "id": "cm-agdon-longscarf",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "The Wild Beyond the Witchlight",
    "name": "Agdon Longscarf",
    "size": "small",
    "type": "fey",
    "alignment": "Chaotic Neutral",
    "speed": "35 ft.",
    "challengeRating": 3,
    "ac": 15,
    "acNote": "studded leather",
    "hp": 52,
    "maxHp": 52,
    "abilityScores": {
      "strength": 11,
      "dexterity": 18,
      "constitution": 13,
      "intelligence": 12,
      "wisdom": 13,
      "charisma": 15
    },
    "savingThrows": {
      "dexterity": 6
    },
    "skills": {
      "Acrobatics": 6,
      "Deception": 4,
      "Performance": 4,
      "Stealth": 6
    },
    "senses": {
      "passive Perception": "11"
    },
    "languages": [
      "Common",
      "Sylvan"
    ],
    "description": "The vain harengon leader of a band of toll-collecting brigands, humiliated by a lost hat.",
    "traits": [
      {
        "name": "Lucky Footwork",
        "description": "When Agdon fails a Dexterity saving throw, he can use his reaction to gain a +4 bonus if not incapacitated."
      },
      {
        "name": "Rabbit Hop",
        "description": "As a bonus action, Agdon jumps up to 15 feet without provoking opportunity attacks."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Agdon makes two Rapier attacks."
      },
      {
        "name": "Rapier",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "8 (1d8 + 4) piercing damage."
      },
      {
        "name": "Beguiling Wink (Recharge 6)",
        "description": "Agdon winks at a creature within 30 feet. It must succeed on a DC 13 Wisdom saving throw or be charmed until the end of its next turn."
      }
    ]
  },
  {
    "id": "cm-animated-toy",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "The Wild Beyond the Witchlight",
    "name": "Animated Toy",
    "size": "small",
    "type": "construct",
    "alignment": "Unaligned",
    "speed": "25 ft.",
    "challengeRating": 1,
    "ac": 13,
    "acNote": "natural armor",
    "hp": 22,
    "maxHp": 22,
    "abilityScores": {
      "strength": 12,
      "dexterity": 14,
      "constitution": 12,
      "intelligence": 3,
      "wisdom": 8,
      "charisma": 5
    },
    "damageImmunities": [
      "poison",
      "psychic"
    ],
    "conditionImmunities": [
      "blinded",
      "charmed",
      "deafened",
      "exhaustion",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "passive Perception": "9"
    },
    "languages": [],
    "description": "A clockwork doll or stuffed beast brought to malevolent life in Skabatha's toy factory.",
    "traits": [
      {
        "name": "False Appearance",
        "description": "While motionless, the toy is indistinguishable from an ordinary toy."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The toy makes two Rake attacks."
      },
      {
        "name": "Rake",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "7 (2d4 + 2) slashing damage."
      }
    ]
  },
  {
    "id": "cm-jabberwock",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "The Wild Beyond the Witchlight",
    "name": "Jabberwock",
    "size": "huge",
    "type": "dragon",
    "alignment": "Chaotic Evil",
    "speed": "40 ft., fly 60 ft.",
    "challengeRating": 13,
    "ac": 18,
    "acNote": "natural armor",
    "hp": 210,
    "maxHp": 210,
    "abilityScores": {
      "strength": 24,
      "dexterity": 14,
      "constitution": 22,
      "intelligence": 10,
      "wisdom": 14,
      "charisma": 16
    },
    "savingThrows": {
      "dexterity": 7,
      "constitution": 11,
      "wisdom": 7
    },
    "skills": {
      "Perception": 7
    },
    "damageResistances": [
      "thunder"
    ],
    "conditionImmunities": [
      "frightened"
    ],
    "senses": {
      "blindsight": "30 ft.",
      "darkvision": "120 ft.",
      "passive Perception": "17"
    },
    "languages": [
      "Draconic",
      "Sylvan"
    ],
    "description": "The burbling terror of Yon: eyes of flame, jaws that bite, claws that catch.",
    "traits": [
      {
        "name": "Frumious Presence",
        "description": "Each creature that starts its turn within 30 feet of the Jabberwock and can see it must succeed on a DC 16 Wisdom saving throw or be frightened until the start of its next turn."
      },
      {
        "name": "Vorpal Bite",
        "description": "On a critical hit with its Bite, the Jabberwock deals an extra 27 (6d8) slashing damage."
      },
      {
        "name": "Regeneration",
        "description": "The Jabberwock regains 10 hit points at the start of its turn if it has at least 1 hit point and did not take slashing damage from a vorpal or magical weapon since its last turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The Jabberwock makes one Bite attack and two Claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 12,
        "damageDescription": "19 (2d12 + 6) piercing damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 12,
        "damageDescription": "15 (2d8 + 6) slashing damage."
      },
      {
        "name": "Eyes of Flame (Recharge 5-6)",
        "description": "The Jabberwock's eyes blaze in a 60-foot cone. Each creature there must make a DC 18 Dexterity saving throw, taking 45 (13d6) fire damage on a failed save, or half as much on a success."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Claw",
        "description": "The Jabberwock makes one Claw attack."
      },
      {
        "name": "Burble",
        "description": "Each creature within 20 feet must succeed on a DC 16 Constitution saving throw or take 9 (2d8) thunder damage."
      },
      {
        "name": "Wing Buffet (Costs 2 Actions)",
        "description": "The Jabberwock beats its wings; each creature within 15 feet must succeed on a DC 18 Strength saving throw or be knocked prone. The Jabberwock then flies up to half its speed.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-bavlorna-blightstraw",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "The Wild Beyond the Witchlight",
    "name": "Bavlorna Blightstraw",
    "size": "small",
    "type": "fey",
    "alignment": "Neutral Evil",
    "speed": "30 ft., swim 30 ft.",
    "challengeRating": 6,
    "ac": 17,
    "acNote": "natural armor",
    "hp": 97,
    "maxHp": 97,
    "abilityScores": {
      "strength": 15,
      "dexterity": 13,
      "constitution": 16,
      "intelligence": 16,
      "wisdom": 14,
      "charisma": 16
    },
    "savingThrows": {
      "wisdom": 5,
      "charisma": 6
    },
    "skills": {
      "Deception": 6,
      "Perception": 5
    },
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "15"
    },
    "languages": [
      "Common",
      "Aquan",
      "Sylvan"
    ],
    "description": "The bog-dwelling Hag of the East in Hither, hoarder of sorrows and signed contracts.",
    "traits": [
      {
        "name": "Coven Magic",
        "description": "Bavlorna casts spells as a 9th-level caster (save DC 14): bane, geas (1/day), major image, phantasmal force."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Bavlorna makes two Sludge Ladle attacks."
      },
      {
        "name": "Sludge Ladle",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "9 (2d6 + 2) bludgeoning damage plus 7 (2d6) poison damage."
      },
      {
        "name": "Cauldron Draught (Recharge 6)",
        "description": "Bavlorna flings boiling brew at a creature within 30 feet. It must make a DC 14 Dexterity saving throw, taking 21 (6d6) poison damage on a failure, or half as much on a success."
      }
    ]
  },
  {
    "id": "cm-skabatha-nightshade",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "The Wild Beyond the Witchlight",
    "name": "Skabatha Nightshade",
    "size": "small",
    "type": "fey",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 7,
    "ac": 18,
    "acNote": "natural armor",
    "hp": 110,
    "maxHp": 110,
    "abilityScores": {
      "strength": 16,
      "dexterity": 14,
      "constitution": 16,
      "intelligence": 15,
      "wisdom": 14,
      "charisma": 17
    },
    "savingThrows": {
      "strength": 6,
      "wisdom": 5,
      "charisma": 6
    },
    "skills": {
      "Deception": 6,
      "Perception": 5,
      "Sleight of Hand": 5
    },
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "15"
    },
    "languages": [
      "Common",
      "Sylvan"
    ],
    "description": "The Hag of the South in Thither, who turns children into toys and toys into soldiers.",
    "traits": [
      {
        "name": "Coven Magic",
        "description": "Skabatha casts spells as a 9th-level caster (save DC 14): animate objects (1/day), fabricate, hold person, mirror image."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Skabatha makes two attacks with her Walking Stick."
      },
      {
        "name": "Walking Stick",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "13 (3d6 + 3) bludgeoning damage."
      },
      {
        "name": "Toymaker's Touch (Recharge 5-6)",
        "description": "Skabatha touches or targets a creature within 15 feet. It must succeed on a DC 14 Charisma saving throw or be polymorphed into a Tiny toy for 1 minute (repeat save at end of each turn)."
      }
    ]
  },
  {
    "id": "cm-darkling-elder",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "The Wild Beyond the Witchlight",
    "name": "Darkling Elder",
    "size": "medium",
    "type": "fey",
    "alignment": "Chaotic Neutral",
    "speed": "30 ft.",
    "challengeRating": 2,
    "ac": 15,
    "acNote": "natural armor",
    "hp": 27,
    "maxHp": 27,
    "abilityScores": {
      "strength": 11,
      "dexterity": 17,
      "constitution": 12,
      "intelligence": 12,
      "wisdom": 15,
      "charisma": 15
    },
    "skills": {
      "Acrobatics": 5,
      "Deception": 4,
      "Perception": 4,
      "Stealth": 7
    },
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "14"
    },
    "languages": [
      "Common",
      "Elvish",
      "Sylvan"
    ],
    "description": "A shadow-cloaked fey exile serving the coven for scraps of twilight.",
    "traits": [
      {
        "name": "Death Flash",
        "description": "When the darkling elder dies, nonmagical light within 10 feet is extinguished and each creature within 10 feet must succeed on a DC 12 Constitution saving throw or be blinded until the end of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The darkling makes two Dagger attacks."
      },
      {
        "name": "Dagger",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "5 (1d4 + 3) piercing damage plus 7 (2d6) necrotic damage."
      }
    ]
  },
  {
    "id": "cm-displacer-beast-pack-lord",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "The Wild Beyond the Witchlight",
    "name": "Displacer Beast Pack Lord",
    "size": "large",
    "type": "monstrosity",
    "alignment": "Lawful Evil",
    "speed": "45 ft.",
    "challengeRating": 4,
    "ac": 14,
    "hp": 91,
    "maxHp": 91,
    "abilityScores": {
      "strength": 18,
      "dexterity": 16,
      "constitution": 16,
      "intelligence": 6,
      "wisdom": 12,
      "charisma": 8
    },
    "skills": {
      "Perception": 3,
      "Stealth": 5
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "13"
    },
    "languages": [],
    "description": "The dominant matriarch of a displacer beast pack that roams Thither hunting Witchlight thieves.",
    "traits": [
      {
        "name": "Displacement",
        "description": "The creature projects a magical illusion making it appear to be near its actual location, granting attack rolls against it disadvantage. This trait is disrupted while the creature is incapacitated or has speed 0."
      },
      {
        "name": "Avoidance",
        "description": "If the pack lord is subjected to an effect that allows a saving throw for half damage, it instead takes no damage on a success and half on a failure."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The pack lord makes three Tentacle attacks."
      },
      {
        "name": "Tentacle",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "9 (1d10 + 4) bludgeoning damage plus 5 (1d10) piercing damage from spiky protrusions."
      }
    ]
  },
  {
    "id": "cm-corrupted-unicorn",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "The Wild Beyond the Witchlight",
    "name": "Corrupted Unicorn",
    "size": "large",
    "type": "celestial",
    "alignment": "Neutral",
    "speed": "50 ft.",
    "challengeRating": 5,
    "ac": 12,
    "hp": 82,
    "maxHp": 82,
    "abilityScores": {
      "strength": 18,
      "dexterity": 14,
      "constitution": 15,
      "intelligence": 11,
      "wisdom": 17,
      "charisma": 16
    },
    "damageResistances": [
      "necrotic"
    ],
    "conditionImmunities": [
      "charmed",
      "paralyzed",
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "13"
    },
    "languages": [
      "Celestial",
      "Elvish",
      "Sylvan"
    ],
    "description": "A unicorn bound and defiled by Endelyn Moongrave, its horn dripping with tainted moonlight.",
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Bound Servitude",
        "description": "While Endelyn is within 120 feet, the unicorn must obey her commands and has disadvantage on saving throws against her effects."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The unicorn makes one Hooves attack and one Horn attack."
      },
      {
        "name": "Hooves",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "11 (2d6 + 4) bludgeoning damage."
      },
      {
        "name": "Horn",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "9 (1d8 + 4) piercing damage plus 7 (2d6) necrotic damage."
      }
    ]
  },
  {
    "id": "cm-imix",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Princes of the Apocalypse",
    "name": "Imix, Prince of Evil Fire",
    "size": "huge",
    "type": "elemental",
    "alignment": "Neutral Evil",
    "speed": "50 ft., fly 60 ft. (hover)",
    "challengeRating": 18,
    "ac": 19,
    "acNote": "natural armor",
    "hp": 275,
    "maxHp": 275,
    "abilityScores": {
      "strength": 24,
      "dexterity": 20,
      "constitution": 24,
      "intelligence": 18,
      "wisdom": 18,
      "charisma": 22
    },
    "savingThrows": {
      "dexterity": 12,
      "constitution": 14,
      "wisdom": 11,
      "charisma": 13
    },
    "skills": {
      "Perception": 11
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "fire",
      "poison"
    ],
    "conditionImmunities": [
      "exhaustion",
      "grappled",
      "paralyzed",
      "petrified",
      "poisoned",
      "prone",
      "restrained",
      "unconscious"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "20"
    },
    "languages": [
      "Primordial"
    ],
    "description": "The Elemental Prince of Evil Fire, a towering column of living flame with a fanged, grinning face.",
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If Imix fails a saving throw, it can choose to succeed instead."
      },
      {
        "name": "Fire Aura",
        "description": "At the start of each of Imix's turns, each creature within 15 feet takes 16 (3d10) fire damage. A creature that touches Imix or hits it with a melee attack while within 5 feet takes 11 (2d10) fire damage."
      },
      {
        "name": "Water Susceptibility",
        "description": "For every 5 feet Imix moves in water, or for every gallon of water splashed on it, it takes 3 cold damage."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Imix makes two Slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 13,
        "damageDescription": "20 (3d8 + 7) bludgeoning damage plus 22 (4d10) fire damage."
      },
      {
        "name": "Fire Storm (Recharge 5-6)",
        "description": "Imix erupts. Each creature within 30 feet must make a DC 21 Dexterity saving throw, taking 55 (10d10) fire damage on a failed save, or half as much on a success. Flammable objects that aren't worn or carried ignite."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Attack",
        "description": "Imix makes one weapon or slam attack."
      },
      {
        "name": "Elemental Stride",
        "description": "Imix teleports up to 60 feet to an unoccupied space it can see."
      },
      {
        "name": "Elemental Surge (Costs 2 Actions)",
        "description": "Each creature within 15 feet of Imix must make a DC 21 Dexterity saving throw, taking 18 (4d8) elemental damage of Imix's type on a failed save, or half as much on a success.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-ogremoch",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Princes of the Apocalypse",
    "name": "Ogrémoch, Prince of Evil Earth",
    "size": "huge",
    "type": "elemental",
    "alignment": "Neutral Evil",
    "speed": "40 ft., burrow 40 ft.",
    "challengeRating": 18,
    "ac": 19,
    "acNote": "natural armor",
    "hp": 275,
    "maxHp": 275,
    "abilityScores": {
      "strength": 28,
      "dexterity": 12,
      "constitution": 26,
      "intelligence": 15,
      "wisdom": 18,
      "charisma": 20
    },
    "savingThrows": {
      "strength": 15,
      "constitution": 14,
      "wisdom": 11
    },
    "skills": {
      "Perception": 11
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "exhaustion",
      "grappled",
      "paralyzed",
      "petrified",
      "poisoned",
      "prone",
      "restrained",
      "unconscious"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "20"
    },
    "languages": [
      "Primordial"
    ],
    "description": "The Elemental Prince of Evil Earth, a colossal moving mountain of jagged black stone.",
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If Ogrémoch fails a saving throw, it can choose to succeed instead."
      },
      {
        "name": "Siege Monster",
        "description": "Ogrémoch deals double damage to objects and structures."
      },
      {
        "name": "Earth Glide",
        "description": "Ogrémoch can burrow through nonmagical, unworked earth and stone without disturbing it."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Ogrémoch makes two Slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 15,
        "damageDescription": "26 (4d8 + 9) bludgeoning damage, and the target must succeed on a DC 23 Strength saving throw or be knocked prone."
      },
      {
        "name": "Rock Avalanche (Recharge 5-6)",
        "description": "Ogrémoch hurls a storm of boulders in a 40-foot cube within 90 feet. Each creature there must make a DC 21 Dexterity saving throw, taking 45 (10d8) bludgeoning damage and being buried (restrained) on a failed save, or half as much on a success."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Attack",
        "description": "Ogrémoch makes one weapon or slam attack."
      },
      {
        "name": "Elemental Stride",
        "description": "Ogrémoch teleports up to 60 feet to an unoccupied space it can see."
      },
      {
        "name": "Elemental Surge (Costs 2 Actions)",
        "description": "Each creature within 15 feet of Ogrémoch must make a DC 21 Dexterity saving throw, taking 18 (4d8) elemental damage of Ogrémoch's type on a failed save, or half as much on a success.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-yuan-tin",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Princes of the Apocalypse",
    "name": "Yuan-Tin, Prince of Evil Water",
    "size": "huge",
    "type": "elemental",
    "alignment": "Neutral Evil",
    "speed": "30 ft., swim 90 ft.",
    "challengeRating": 18,
    "ac": 19,
    "acNote": "natural armor",
    "hp": 275,
    "maxHp": 275,
    "abilityScores": {
      "strength": 22,
      "dexterity": 22,
      "constitution": 24,
      "intelligence": 16,
      "wisdom": 18,
      "charisma": 20
    },
    "savingThrows": {
      "dexterity": 13,
      "constitution": 14,
      "wisdom": 11
    },
    "skills": {
      "Perception": 11
    },
    "damageResistances": [
      "cold",
      "fire",
      "lightning",
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "acid",
      "poison"
    ],
    "conditionImmunities": [
      "exhaustion",
      "grappled",
      "paralyzed",
      "petrified",
      "poisoned",
      "prone",
      "restrained",
      "unconscious"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "20"
    },
    "languages": [
      "Primordial"
    ],
    "description": "The Elemental Princess of Evil Water (Olhydra), a churning wave crowned in foam and lightning.",
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If Yuan-Tin fails a saving throw, it can choose to succeed instead."
      },
      {
        "name": "Freeze",
        "description": "If Yuan-Tin takes cold damage, its speed is reduced by 20 feet until the end of its next turn."
      },
      {
        "name": "Water Form",
        "description": "Yuan-Tin can enter a hostile creature's space and stop there, and move through a space as narrow as 1 inch wide without squeezing."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Yuan-Tin makes two Slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 12,
        "damageDescription": "18 (3d8 + 6) bludgeoning damage plus 18 (4d8) cold damage."
      },
      {
        "name": "Drowning Grasp (Recharge 5-6)",
        "description": "Yuan-Tin engulfs a 20-foot-radius area within 60 feet in a crushing waterspout. Each creature there must make a DC 21 Strength saving throw, taking 45 (10d8) bludgeoning damage and being pulled 20 feet toward Yuan-Tin and knocked prone on a failed save, or half as much on a success."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Attack",
        "description": "Yuan-Tin makes one weapon or slam attack."
      },
      {
        "name": "Elemental Stride",
        "description": "Yuan-Tin teleports up to 60 feet to an unoccupied space it can see."
      },
      {
        "name": "Elemental Surge (Costs 2 Actions)",
        "description": "Each creature within 15 feet of Yuan-Tin must make a DC 21 Dexterity saving throw, taking 18 (4d8) elemental damage of Yuan-Tin's type on a failed save, or half as much on a success.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-bane",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Princes of the Apocalypse",
    "name": "Bane, Prince of Evil Air",
    "size": "huge",
    "type": "elemental",
    "alignment": "Neutral Evil",
    "speed": "0 ft., fly 90 ft. (hover)",
    "challengeRating": 18,
    "ac": 19,
    "acNote": "natural armor",
    "hp": 275,
    "maxHp": 275,
    "abilityScores": {
      "strength": 18,
      "dexterity": 26,
      "constitution": 22,
      "intelligence": 16,
      "wisdom": 18,
      "charisma": 20
    },
    "savingThrows": {
      "dexterity": 15,
      "constitution": 13,
      "wisdom": 11
    },
    "skills": {
      "Perception": 11,
      "Stealth": 15
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "lightning",
      "poison",
      "thunder"
    ],
    "conditionImmunities": [
      "exhaustion",
      "grappled",
      "paralyzed",
      "petrified",
      "poisoned",
      "prone",
      "restrained",
      "unconscious"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "20"
    },
    "languages": [
      "Primordial"
    ],
    "description": "The Elemental Prince of Evil Air (Yan-C-Bin), a howling near-invisible storm with the face of a screaming man.",
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If Bane fails a saving throw, it can choose to succeed instead."
      },
      {
        "name": "Air Form",
        "description": "Bane can enter a hostile creature's space and stop there, and move through a space as narrow as 1 inch wide without squeezing."
      },
      {
        "name": "Whirlwind Body",
        "description": "A creature that starts its turn within 10 feet of Bane must succeed on a DC 21 Strength saving throw or be pushed 15 feet away."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Bane makes two Slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 15,
        "damageDescription": "17 (3d6 + 8) bludgeoning damage plus 18 (4d8) lightning damage."
      },
      {
        "name": "Cyclone (Recharge 5-6)",
        "description": "Bane becomes a 20-foot-radius, 60-foot-tall cyclone for 1 minute. Each creature that enters the area for the first time on a turn or starts there must make a DC 21 Strength saving throw, taking 36 (8d8) bludgeoning damage and being flung 20 feet on a failed save, or half as much on a success."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Attack",
        "description": "Bane makes one weapon or slam attack."
      },
      {
        "name": "Elemental Stride",
        "description": "Bane teleports up to 60 feet to an unoccupied space it can see."
      },
      {
        "name": "Elemental Surge (Costs 2 Actions)",
        "description": "Each creature within 15 feet of Bane must make a DC 21 Dexterity saving throw, taking 18 (4d8) elemental damage of Bane's type on a failed save, or half as much on a success.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-air-elemental",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Princes of the Apocalypse",
    "name": "Air Elemental",
    "size": "large",
    "type": "elemental",
    "alignment": "Neutral",
    "speed": "0 ft., fly 90 ft. (hover)",
    "challengeRating": 5,
    "ac": 15,
    "hp": 90,
    "maxHp": 90,
    "abilityScores": {
      "strength": 14,
      "dexterity": 20,
      "constitution": 14,
      "intelligence": 6,
      "wisdom": 10,
      "charisma": 6
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "lightning",
      "poison",
      "thunder"
    ],
    "conditionImmunities": [
      "exhaustion",
      "grappled",
      "paralyzed",
      "petrified",
      "poisoned",
      "prone",
      "restrained",
      "unconscious"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Auran"
    ],
    "description": "A whistling vortex of wind called to serve the Cult of the Howling Hate.",
    "traits": [
      {
        "name": "Air Form",
        "description": "The elemental can enter a hostile creature's space and stop there, and move through a space as narrow as 1 inch wide without squeezing."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The elemental makes two Slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "14 (2d8 + 5) bludgeoning damage."
      },
      {
        "name": "Whirlwind (Recharge 4-6)",
        "description": "Each creature in the elemental's space must make a DC 13 Strength saving throw, taking 15 (3d8 + 2) bludgeoning damage and being flung up to 20 feet and knocked prone on a failed save, or half as much on a success."
      }
    ]
  },
  {
    "id": "cm-earth-elemental",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Princes of the Apocalypse",
    "name": "Earth Elemental",
    "size": "large",
    "type": "elemental",
    "alignment": "Neutral",
    "speed": "30 ft., burrow 30 ft.",
    "challengeRating": 5,
    "ac": 17,
    "acNote": "natural armor",
    "hp": 126,
    "maxHp": 126,
    "abilityScores": {
      "strength": 20,
      "dexterity": 8,
      "constitution": 20,
      "intelligence": 5,
      "wisdom": 10,
      "charisma": 5
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "poison"
    ],
    "damageVulnerabilities": [
      "thunder"
    ],
    "conditionImmunities": [
      "exhaustion",
      "paralyzed",
      "petrified",
      "poisoned",
      "unconscious"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "tremorsense": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Terran"
    ],
    "description": "A rumbling mass of stone and soil bound by the Cult of the Black Earth.",
    "traits": [
      {
        "name": "Earth Glide",
        "description": "The elemental can burrow through nonmagical, unworked earth and stone without disturbing it."
      },
      {
        "name": "Siege Monster",
        "description": "The elemental deals double damage to objects and structures."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The elemental makes two Slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "14 (2d8 + 5) bludgeoning damage."
      }
    ]
  },
  {
    "id": "cm-fire-elemental",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Princes of the Apocalypse",
    "name": "Fire Elemental",
    "size": "large",
    "type": "elemental",
    "alignment": "Neutral",
    "speed": "50 ft.",
    "challengeRating": 5,
    "ac": 13,
    "hp": 102,
    "maxHp": 102,
    "abilityScores": {
      "strength": 10,
      "dexterity": 17,
      "constitution": 16,
      "intelligence": 6,
      "wisdom": 10,
      "charisma": 7
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "fire",
      "poison"
    ],
    "conditionImmunities": [
      "exhaustion",
      "grappled",
      "paralyzed",
      "petrified",
      "poisoned",
      "prone",
      "restrained",
      "unconscious"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Ignan"
    ],
    "description": "A roaring humanoid bonfire summoned by the Cult of the Eternal Flame.",
    "traits": [
      {
        "name": "Fire Form",
        "description": "The elemental can move through a space as narrow as 1 inch wide without squeezing. A creature that touches it or hits it with a melee attack while within 5 feet takes 5 (1d10) fire damage. It can enter a hostile creature's space and stop there."
      },
      {
        "name": "Water Susceptibility",
        "description": "For every 5 feet the elemental moves in water, or for every gallon splashed on it, it takes 1 cold damage."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The elemental makes two Touch attacks."
      },
      {
        "name": "Touch",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "10 (2d6 + 3) fire damage. If the target is a creature or flammable object, it ignites and takes 5 (1d10) fire damage at the start of each of its turns."
      }
    ]
  },
  {
    "id": "cm-water-elemental",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Princes of the Apocalypse",
    "name": "Water Elemental",
    "size": "large",
    "type": "elemental",
    "alignment": "Neutral",
    "speed": "30 ft., swim 90 ft.",
    "challengeRating": 5,
    "ac": 14,
    "hp": 114,
    "maxHp": 114,
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
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "exhaustion",
      "grappled",
      "paralyzed",
      "petrified",
      "poisoned",
      "prone",
      "restrained",
      "unconscious"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Aquan"
    ],
    "description": "A surging fist of dark water raised by the Cult of the Crushing Wave.",
    "traits": [
      {
        "name": "Water Form",
        "description": "The elemental can enter a hostile creature's space and stop there, and move through a space as narrow as 1 inch wide without squeezing."
      },
      {
        "name": "Freeze",
        "description": "If the elemental takes cold damage, its speed is reduced by 20 feet until the end of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The elemental makes two Slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "13 (2d8 + 4) bludgeoning damage."
      },
      {
        "name": "Whelm (Recharge 4-6)",
        "description": "Each creature in the elemental's space must make a DC 15 Strength saving throw. On a failure, a target takes 13 (2d8 + 4) bludgeoning damage, is grappled (escape DC 14), and is pulled into the elemental's space and begins to suffocate; on a success, a target is pushed out."
      }
    ]
  },
  {
    "id": "cm-aerisi-kalinoth",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Princes of the Apocalypse",
    "name": "Aerisi Kalinoth",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 7,
    "ac": 15,
    "hp": 66,
    "maxHp": 66,
    "abilityScores": {
      "strength": 9,
      "dexterity": 18,
      "constitution": 12,
      "intelligence": 14,
      "wisdom": 12,
      "charisma": 17
    },
    "savingThrows": {
      "dexterity": 7,
      "charisma": 6
    },
    "skills": {
      "Arcana": 5,
      "Perception": 4
    },
    "senses": {
      "passive Perception": "14"
    },
    "languages": [
      "Auran",
      "Common",
      "Elvish"
    ],
    "description": "The delusional elf prophet of the Cult of the Howling Hate, wielder of the spear Windvane.",
    "traits": [
      {
        "name": "Spellcasting",
        "description": "Aerisi casts spells as a 9th-level sorcerer (save DC 14): chain lightning (1/day), fly, gust of wind, lightning bolt, misty step, shocking grasp, thunderwave."
      }
    ],
    "actions": [
      {
        "name": "Windvane (Spear)",
        "description": "Melee or Ranged Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "7 (1d8 + 3) piercing damage plus 7 (2d6) lightning damage."
      },
      {
        "name": "Invoke the Howling Hate (Recharge 6)",
        "description": "Aerisi calls a 20-foot-radius screaming wind at a point within 120 feet. Each creature there must make a DC 14 Constitution saving throw, taking 21 (6d6) thunder damage and being deafened for 1 minute on a failed save, or half damage on a success."
      }
    ]
  },
  {
    "id": "cm-gar-shatterkeel",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Princes of the Apocalypse",
    "name": "Gar Shatterkeel",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft., swim 30 ft.",
    "challengeRating": 8,
    "ac": 16,
    "acNote": "breastplate",
    "hp": 97,
    "maxHp": 97,
    "abilityScores": {
      "strength": 16,
      "dexterity": 13,
      "constitution": 16,
      "intelligence": 11,
      "wisdom": 16,
      "charisma": 13
    },
    "savingThrows": {
      "constitution": 6,
      "wisdom": 6
    },
    "skills": {
      "Nature": 3,
      "Perception": 6
    },
    "damageResistances": [
      "cold"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "16"
    },
    "languages": [
      "Aquan",
      "Common"
    ],
    "description": "The one-handed prophet of the Cult of the Crushing Wave, his missing hand replaced by a crab claw, bonded to the water weird Drown.",
    "traits": [
      {
        "name": "Amphibious",
        "description": "Gar can breathe air and water."
      },
      {
        "name": "Spellcasting",
        "description": "Gar casts spells as a 9th-level druid (save DC 14): control water, ice storm, tidal wave, water walk, wall of water."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Gar makes two attacks: one with Pincer Staff and one with Crab Claw."
      },
      {
        "name": "Pincer Staff",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "9 (1d10 + 4) bludgeoning damage, and a Large or smaller target is grappled (escape DC 14)."
      },
      {
        "name": "Crab Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "11 (2d6 + 4) bludgeoning damage."
      }
    ]
  },
  {
    "id": "cm-marlos-urnrayle",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Princes of the Apocalypse",
    "name": "Marlos Urnrayle",
    "size": "medium",
    "type": "monstrosity",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 7,
    "ac": 16,
    "acNote": "natural armor, shield",
    "hp": 90,
    "maxHp": 90,
    "abilityScores": {
      "strength": 16,
      "dexterity": 12,
      "constitution": 16,
      "intelligence": 12,
      "wisdom": 13,
      "charisma": 16
    },
    "savingThrows": {
      "wisdom": 4
    },
    "skills": {
      "Deception": 6,
      "Stealth": 4
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Common",
      "Terran"
    ],
    "description": "A cruel male medusa, prophet of the Cult of the Black Earth, wielder of the maul Ironfang.",
    "traits": [
      {
        "name": "Petrifying Gaze",
        "description": "When a creature that can see Marlos's eyes starts its turn within 30 feet, Marlos can force it to make a DC 14 Constitution saving throw if he isn't incapacitated and can see the creature. On a failure the creature is restrained as it begins to turn to stone, then petrified on a failed save at the end of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Marlos makes two Ironfang (Maul) attacks."
      },
      {
        "name": "Ironfang (Maul)",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "11 (2d6 + 4) bludgeoning damage plus 7 (2d6) poison damage."
      },
      {
        "name": "Snake Hair",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "5 (1d4 + 3) piercing damage plus 10 (3d6) poison damage."
      }
    ]
  },
  {
    "id": "cm-vanifer",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Princes of the Apocalypse",
    "name": "Vanifer",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 7,
    "ac": 13,
    "hp": 67,
    "maxHp": 67,
    "abilityScores": {
      "strength": 9,
      "dexterity": 17,
      "constitution": 12,
      "intelligence": 14,
      "wisdom": 11,
      "charisma": 18
    },
    "savingThrows": {
      "charisma": 7
    },
    "skills": {
      "Deception": 7,
      "Persuasion": 7
    },
    "damageResistances": [
      "fire"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Common",
      "Ignan",
      "Infernal"
    ],
    "description": "The tiefling prophet of the Cult of the Eternal Flame, wielder of the dagger Tinderstrike.",
    "traits": [
      {
        "name": "Spellcasting",
        "description": "Vanifer casts spells as a 9th-level warlock (save DC 15): burning hands, fireball, hellish rebuke, immolation (1/day), scorching ray, wall of fire."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Vanifer makes two attacks with Tinderstrike."
      },
      {
        "name": "Tinderstrike (Dagger)",
        "description": "Melee or Ranged Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "5 (1d4 + 3) piercing damage plus 10 (3d6) fire damage."
      },
      {
        "name": "Fire Ray",
        "description": "Ranged Spell Attack",
        "attackBonus": 7,
        "damageDescription": "18 (4d8) fire damage."
      }
    ]
  },
  {
    "id": "cm-black-earth-cultist",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Princes of the Apocalypse",
    "name": "Black Earth Cultist",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 2,
    "ac": 15,
    "acNote": "stone-plated robes",
    "hp": 32,
    "maxHp": 32,
    "abilityScores": {
      "strength": 14,
      "dexterity": 11,
      "constitution": 14,
      "intelligence": 10,
      "wisdom": 13,
      "charisma": 11
    },
    "skills": {
      "Religion": 2
    },
    "damageResistances": [
      "bludgeoning"
    ],
    "senses": {
      "darkvision": "30 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Common",
      "Terran"
    ],
    "description": "A cultist of the Black Earth in heavy stone-scale vestments.",
    "traits": [
      {
        "name": "Stone Skin",
        "description": "While not incapacitated, the cultist has resistance to nonmagical bludgeoning damage."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The cultist makes two Warhammer attacks."
      },
      {
        "name": "Warhammer",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "7 (1d10 + 2) bludgeoning damage."
      }
    ]
  },
  {
    "id": "cm-earth-elemental-myrmidon",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Princes of the Apocalypse",
    "name": "Earth Elemental Myrmidon",
    "size": "medium",
    "type": "elemental",
    "alignment": "Neutral",
    "speed": "30 ft., burrow 20 ft.",
    "challengeRating": 7,
    "ac": 18,
    "acNote": "plate armor",
    "hp": 127,
    "maxHp": 127,
    "abilityScores": {
      "strength": 18,
      "dexterity": 10,
      "constitution": 18,
      "intelligence": 10,
      "wisdom": 12,
      "charisma": 10
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "poison"
    ],
    "damageVulnerabilities": [
      "thunder"
    ],
    "conditionImmunities": [
      "exhaustion",
      "paralyzed",
      "petrified",
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "tremorsense": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Terran"
    ],
    "description": "An elite elemental soldier of the Black Earth, armored and disciplined.",
    "traits": [
      {
        "name": "Elemental Weapons",
        "description": "The myrmidon's weapon attacks are magical. On a hit, the weapon deals an extra 2d6 bludgeoning damage (included below)."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The myrmidon makes three Maul attacks."
      },
      {
        "name": "Maul",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "11 (2d6 + 4) bludgeoning damage plus 7 (2d6) bludgeoning damage."
      }
    ]
  },
  {
    "id": "cm-vapor-elemental",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Princes of the Apocalypse",
    "name": "Vapor Elemental",
    "size": "medium",
    "type": "elemental",
    "alignment": "Neutral",
    "speed": "0 ft., fly 60 ft. (hover)",
    "challengeRating": 5,
    "ac": 14,
    "hp": 76,
    "maxHp": 76,
    "abilityScores": {
      "strength": 12,
      "dexterity": 18,
      "constitution": 14,
      "intelligence": 6,
      "wisdom": 10,
      "charisma": 6
    },
    "damageResistances": [
      "lightning",
      "thunder",
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "exhaustion",
      "grappled",
      "paralyzed",
      "petrified",
      "poisoned",
      "prone",
      "restrained",
      "unconscious"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Auran"
    ],
    "description": "A pale mist-elemental unique to the Howling Hate, choking and blinding those it engulfs.",
    "traits": [
      {
        "name": "Vapor Form",
        "description": "The elemental can occupy another creature's space. A creature that starts its turn in the elemental's space must succeed on a DC 13 Constitution saving throw or be blinded until the start of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The elemental makes two Slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "10 (2d6 + 3) bludgeoning damage plus 4 (1d8) lightning damage."
      }
    ]
  },
  {
    "id": "cm-elder-elemental-eye",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Princes of the Apocalypse",
    "name": "Elder Elemental Eye",
    "size": "gargantuan",
    "type": "aberration",
    "alignment": "Chaotic Evil",
    "speed": "40 ft., fly 40 ft. (hover)",
    "challengeRating": 21,
    "ac": 20,
    "acNote": "natural armor",
    "hp": 350,
    "maxHp": 350,
    "abilityScores": {
      "strength": 26,
      "dexterity": 16,
      "constitution": 26,
      "intelligence": 22,
      "wisdom": 20,
      "charisma": 24
    },
    "savingThrows": {
      "strength": 15,
      "dexterity": 10,
      "constitution": 15,
      "wisdom": 12
    },
    "skills": {
      "Perception": 12
    },
    "damageImmunities": [
      "acid",
      "cold",
      "fire",
      "lightning",
      "poison",
      "thunder"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned",
      "prone"
    ],
    "senses": {
      "truesight": "120 ft.",
      "passive Perception": "21"
    },
    "languages": [
      "Deep Speech",
      "Primordial",
      "telepathy 120 ft."
    ],
    "description": "The maddening god-shard behind all four elemental cults: a mountain of black flesh, ringed by burning, freezing, howling, grinding eyes.",
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If the Eye fails a saving throw, it can choose to succeed instead."
      },
      {
        "name": "Elemental Chaos",
        "description": "At the start of each of the Eye's turns, roll a d4 to determine its active element (1 fire, 2 earth, 3 water, 4 air). Its Elemental Blast and aura deal that damage type this turn."
      },
      {
        "name": "Warping Aura",
        "description": "A creature that starts its turn within 20 feet of the Eye takes 16 (3d10) damage of the Eye's active element."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The Eye makes two Tendril attacks and uses Elemental Blast."
      },
      {
        "name": "Tendril",
        "description": "Melee Weapon Attack",
        "attackBonus": 15,
        "damageDescription": "22 (3d10 + 8) bludgeoning damage, and the target is grappled (escape DC 23)."
      },
      {
        "name": "Elemental Blast",
        "description": "Ranged Spell Attack",
        "attackBonus": 13,
        "damageDescription": "45 (10d8) damage of the Eye's active element."
      },
      {
        "name": "Cataclysm (Recharge 5-6)",
        "description": "Every creature within 60 feet must make a DC 23 Constitution saving throw, taking 55 (10d10) damage of the Eye's active element on a failed save, or half as much on a success."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Tendril",
        "description": "The Eye makes one Tendril attack."
      },
      {
        "name": "Shift Element",
        "description": "The Eye changes its active element to one of its choice."
      },
      {
        "name": "Elemental Blast (Costs 2 Actions)",
        "description": "The Eye uses Elemental Blast.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-ileosa-arabasti",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Curse of the Crimson Throne",
    "name": "Queen Ileosa Arabasti",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 15,
    "ac": 19,
    "acNote": "crimson full plate",
    "hp": 217,
    "maxHp": 217,
    "abilityScores": {
      "strength": 16,
      "dexterity": 20,
      "constitution": 18,
      "intelligence": 16,
      "wisdom": 14,
      "charisma": 24
    },
    "savingThrows": {
      "dexterity": 11,
      "constitution": 10,
      "charisma": 13
    },
    "skills": {
      "Deception": 13,
      "Intimidation": 13,
      "Perception": 8
    },
    "damageResistances": [
      "necrotic"
    ],
    "conditionImmunities": [
      "charmed",
      "frightened"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "17"
    },
    "languages": [
      "Common",
      "Draconic",
      "Infernal"
    ],
    "description": "The widowed queen of Korvosa, wearing the Crown of Fangs and animated by the dragon-spirit Kazavon.",
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If Ileosa fails a saving throw, she can choose to succeed instead."
      },
      {
        "name": "Crown of Fangs",
        "description": "While she wears the crown, Ileosa regains 15 hit points at the start of her turn if she has at least 1 hit point, and any creature that hits her with a melee attack takes 7 (2d6) necrotic damage."
      },
      {
        "name": "Spellcasting",
        "description": "Ileosa casts spells as a 12th-level caster (save DC 18): blight, dominate person, fear, hold monster, vampiric touch."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Ileosa makes three Serithtial (Longsword) attacks."
      },
      {
        "name": "Serithtial (Longsword)",
        "description": "Melee Weapon Attack",
        "attackBonus": 11,
        "damageDescription": "12 (1d8 + 8) slashing damage plus 10 (3d6) necrotic damage."
      },
      {
        "name": "Kazavon's Wail (Recharge 5-6)",
        "description": "Ileosa unleashes the dragon-spirit's scream in a 30-foot cone. Each creature there must make a DC 18 Constitution saving throw, taking 42 (12d6) cold damage and being frightened for 1 minute on a failed save, or half damage on a success."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Attack",
        "description": "Ileosa makes one Serithtial attack."
      },
      {
        "name": "Command",
        "description": "Ileosa targets one creature charmed by or frightened of her within 60 feet; it must use its reaction to move up to its speed as she directs."
      },
      {
        "name": "Draining Word (Costs 2 Actions)",
        "description": "One creature within 60 feet must succeed on a DC 18 Constitution saving throw or take 18 (4d8) necrotic damage, and Ileosa regains that many hit points.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-kazavon",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Curse of the Crimson Throne",
    "name": "Kazavon, the Dragon Tyrant",
    "size": "gargantuan",
    "type": "dragon",
    "alignment": "Lawful Evil",
    "speed": "40 ft., fly 80 ft.",
    "challengeRating": 18,
    "ac": 21,
    "acNote": "natural armor",
    "hp": 296,
    "maxHp": 296,
    "abilityScores": {
      "strength": 28,
      "dexterity": 12,
      "constitution": 25,
      "intelligence": 18,
      "wisdom": 15,
      "charisma": 22
    },
    "savingThrows": {
      "dexterity": 8,
      "constitution": 14,
      "wisdom": 9,
      "charisma": 13
    },
    "skills": {
      "Perception": 16,
      "Stealth": 8
    },
    "damageImmunities": [
      "cold"
    ],
    "conditionImmunities": [
      "frightened"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "truesight": "120 ft.",
      "passive Perception": "18"
    },
    "languages": [
      "Common",
      "Draconic",
      "Infernal"
    ],
    "description": "An ancient blue-white dragon of Zon-Kuthon, slain centuries ago but persisting as a curse bound into six relics — the true evil behind the Crimson Throne.",
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If Kazavon fails a saving throw, he can choose to succeed instead."
      },
      {
        "name": "Frightful Presence Aura",
        "description": "Each creature that starts its turn within 30 feet and can see Kazavon must succeed on a DC 19 Wisdom saving throw or be frightened for 1 minute."
      },
      {
        "name": "Relic Rejuvenation",
        "description": "If Kazavon's body is destroyed while any of his six relics remains intact, he reforms in 1d10 days near the nearest relic."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Kazavon makes one Bite attack and two Claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 16,
        "damageDescription": "19 (2d10 + 8) piercing damage plus 9 (2d8) cold damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 16,
        "damageDescription": "15 (2d6 + 8) slashing damage."
      },
      {
        "name": "Frost Lightning Breath (Recharge 5-6)",
        "description": "Kazavon exhales a 90-foot line of freezing lightning. Each creature there must make a DC 22 Dexterity saving throw, taking 33 (6d10) cold damage and 33 (6d10) lightning damage on a failed save, or half as much on a success."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "Kazavon makes a Wisdom (Perception) check."
      },
      {
        "name": "Claw",
        "description": "Kazavon makes one Claw attack."
      },
      {
        "name": "Wing Attack (Costs 2 Actions)",
        "description": "Each creature within 15 feet must succeed on a DC 24 Dexterity saving throw or take 15 (2d6 + 8) bludgeoning damage and be knocked prone. Kazavon then flies up to half his speed.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-carrion-golem",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Curse of the Crimson Throne",
    "name": "Carrion Golem",
    "size": "medium",
    "type": "construct",
    "alignment": "Unaligned",
    "speed": "30 ft.",
    "challengeRating": 9,
    "ac": 12,
    "acNote": "natural armor",
    "hp": 133,
    "maxHp": 133,
    "abilityScores": {
      "strength": 20,
      "dexterity": 9,
      "constitution": 18,
      "intelligence": 3,
      "wisdom": 8,
      "charisma": 1
    },
    "damageImmunities": [
      "poison",
      "necrotic",
      "psychic"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "9"
    },
    "languages": [
      "understands its creator's commands but can't speak"
    ],
    "description": "A golem stitched from the corpses of plague victims, reeking of the grave.",
    "traits": [
      {
        "name": "Disease Cloud",
        "description": "A creature that starts its turn within 5 feet of the golem must succeed on a DC 15 Constitution saving throw or be poisoned until the start of its next turn."
      },
      {
        "name": "Immutable Form",
        "description": "The golem is immune to any spell or effect that would alter its form."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The golem makes two Slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "17 (3d8 + 4) bludgeoning damage plus 7 (2d6) necrotic damage."
      }
    ]
  },
  {
    "id": "cm-soulbound-doll",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Curse of the Crimson Throne",
    "name": "Soulbound Doll",
    "size": "tiny",
    "type": "construct",
    "alignment": "Neutral",
    "speed": "20 ft., climb 20 ft.",
    "challengeRating": 1,
    "ac": 14,
    "acNote": "natural armor",
    "hp": 18,
    "maxHp": 18,
    "abilityScores": {
      "strength": 4,
      "dexterity": 17,
      "constitution": 12,
      "intelligence": 10,
      "wisdom": 13,
      "charisma": 12
    },
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Common"
    ],
    "description": "A porcelain doll housing a fragment of a departed soul, its intent unknowable.",
    "traits": [
      {
        "name": "False Appearance",
        "description": "While motionless, the doll is indistinguishable from an ordinary doll."
      }
    ],
    "actions": [
      {
        "name": "Pin",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "6 (1d4 + 3) piercing damage plus 3 (1d6) psychic damage."
      }
    ]
  },
  {
    "id": "cm-devilfish",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Curse of the Crimson Throne",
    "name": "Devilfish",
    "size": "large",
    "type": "aberration",
    "alignment": "Chaotic Evil",
    "speed": "10 ft., swim 60 ft.",
    "challengeRating": 2,
    "ac": 13,
    "hp": 45,
    "maxHp": 45,
    "abilityScores": {
      "strength": 16,
      "dexterity": 15,
      "constitution": 14,
      "intelligence": 6,
      "wisdom": 12,
      "charisma": 8
    },
    "skills": {
      "Stealth": 4
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [],
    "description": "A malevolent squid-thing that drags sailors beneath the docks of Korvosa.",
    "traits": [
      {
        "name": "Ink Cloud (Recharge 6)",
        "description": "A 20-foot-radius cloud of ink extends underwater. The area is heavily obscured for 1 minute. The devilfish can then use the Dash action as a bonus action."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The devilfish makes one Bite attack and two Tentacle attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "9 (2d6 + 2) piercing damage."
      },
      {
        "name": "Tentacle",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "6 (1d6 + 2) bludgeoning damage, and the target is grappled (escape DC 13)."
      }
    ]
  },
  {
    "id": "cm-raktavarna",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Curse of the Crimson Throne",
    "name": "Raktavarna",
    "size": "tiny",
    "type": "fiend",
    "alignment": "Lawful Evil",
    "speed": "20 ft., climb 20 ft.",
    "challengeRating": 3,
    "ac": 14,
    "hp": 27,
    "maxHp": 27,
    "abilityScores": {
      "strength": 7,
      "dexterity": 18,
      "constitution": 12,
      "intelligence": 12,
      "wisdom": 12,
      "charisma": 10
    },
    "skills": {
      "Deception": 4,
      "Stealth": 6
    },
    "damageResistances": [
      "cold",
      "fire",
      "lightning"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Infernal",
      "telepathy 120 ft."
    ],
    "description": "A tiny serpentine devil that binds itself into a weapon or ring to spy for its master.",
    "traits": [
      {
        "name": "Weapon Bond",
        "description": "The raktavarna can transform into a nonmagical weapon or piece of jewelry and back as an action, retaining its statistics."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "6 (1d4 + 4) piercing damage plus 7 (2d6) poison damage."
      }
    ]
  },
  {
    "id": "cm-dream-spider",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Curse of the Crimson Throne",
    "name": "Dream Spider",
    "size": "small",
    "type": "beast",
    "alignment": "Unaligned",
    "speed": "30 ft., climb 30 ft.",
    "challengeRating": 3,
    "ac": 14,
    "hp": 39,
    "maxHp": 39,
    "abilityScores": {
      "strength": 12,
      "dexterity": 16,
      "constitution": 13,
      "intelligence": 3,
      "wisdom": 11,
      "charisma": 4
    },
    "skills": {
      "Perception": 2,
      "Stealth": 6
    },
    "senses": {
      "blindsight": "10 ft.",
      "darkvision": "60 ft.",
      "passive Perception": "12"
    },
    "languages": [],
    "description": "A vividly patterned spider whose venom induces hallucinations, cultivated in Old Korvosa's shiver dens.",
    "traits": [
      {
        "name": "Spider Climb",
        "description": "The spider can climb difficult surfaces, including upside down, without an ability check."
      },
      {
        "name": "Web Sense",
        "description": "While in contact with a web, the spider knows the location of any other creature in contact with the same web."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "6 (1d6 + 3) piercing damage, and the target must make a DC 13 Constitution saving throw or take 10 (3d6) psychic damage and be incapacitated by vivid hallucinations until the end of its next turn."
      }
    ]
  },
  {
    "id": "cm-reefclaw",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Curse of the Crimson Throne",
    "name": "Reefclaw",
    "size": "medium",
    "type": "aberration",
    "alignment": "Neutral Evil",
    "speed": "5 ft., swim 40 ft.",
    "challengeRating": 4,
    "ac": 15,
    "acNote": "natural armor",
    "hp": 52,
    "maxHp": 52,
    "abilityScores": {
      "strength": 15,
      "dexterity": 17,
      "constitution": 15,
      "intelligence": 3,
      "wisdom": 12,
      "charisma": 6
    },
    "skills": {
      "Stealth": 5
    },
    "damageResistances": [
      "cold"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [],
    "description": "A vicious lobster-tailed predator that thrashes even in death throes.",
    "traits": [
      {
        "name": "Death Frenzy",
        "description": "When the reefclaw drops to 0 hit points, it doesn't die until the end of its next turn, during which it can still take a turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The reefclaw makes two Claw attacks."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "8 (1d10 + 3) bludgeoning damage, and the target is grappled (escape DC 13). The reefclaw can constrict a grappled target for 8 (1d10 + 3) bludgeoning damage plus 3 (1d6) poison damage at the start of its turn."
      }
    ]
  },
  {
    "id": "cm-skeleton-knight-scarwall",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Curse of the Crimson Throne",
    "name": "Skeleton Knight of Scarwall",
    "size": "medium",
    "type": "undead",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 5,
    "ac": 18,
    "acNote": "plate armor",
    "hp": 78,
    "maxHp": 78,
    "abilityScores": {
      "strength": 16,
      "dexterity": 12,
      "constitution": 16,
      "intelligence": 8,
      "wisdom": 10,
      "charisma": 8
    },
    "damageResistances": [
      "necrotic"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "exhaustion",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "understands Common but can't speak"
    ],
    "description": "An armored dead knight bound to the walls of Castle Scarwall by Kazavon's curse.",
    "traits": [
      {
        "name": "Undying Duty",
        "description": "While within Castle Scarwall, the knight has advantage on death saving throws against being turned and reassembles in 1 hour if destroyed."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The knight makes two Greatsword attacks."
      },
      {
        "name": "Greatsword",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "10 (2d6 + 3) slashing damage plus 7 (2d6) necrotic damage."
      }
    ]
  },
  {
    "id": "cm-danse-macabre",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Curse of the Crimson Throne",
    "name": "Danse Macabre",
    "size": "large",
    "type": "undead",
    "alignment": "Neutral Evil",
    "speed": "30 ft., fly 30 ft. (hover)",
    "challengeRating": 11,
    "ac": 15,
    "hp": 149,
    "maxHp": 149,
    "abilityScores": {
      "strength": 10,
      "dexterity": 18,
      "constitution": 16,
      "intelligence": 14,
      "wisdom": 15,
      "charisma": 18
    },
    "savingThrows": {
      "dexterity": 8,
      "wisdom": 6,
      "charisma": 8
    },
    "damageResistances": [
      "cold",
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "necrotic",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "grappled",
      "paralyzed",
      "poisoned",
      "prone",
      "restrained"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "Common"
    ],
    "description": "A whirling chorus of ghostly dancers, animating the bones of Scarwall in a grim waltz.",
    "traits": [
      {
        "name": "Incorporeal Movement",
        "description": "The danse macabre can move through creatures and objects as difficult terrain, taking 5 (1d10) force damage if it ends its turn inside an object."
      },
      {
        "name": "Compelling Waltz",
        "description": "A creature that starts its turn within 20 feet must succeed on a DC 16 Wisdom saving throw or be forced to use its movement to dance toward the danse macabre."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The danse macabre makes three Grave Touch attacks."
      },
      {
        "name": "Grave Touch",
        "description": "Melee Spell Attack",
        "attackBonus": 8,
        "damageDescription": "14 (3d6 + 4) necrotic damage, and the target can't regain hit points until the start of its next turn."
      },
      {
        "name": "Final Waltz (Recharge 6)",
        "description": "Each creature within 30 feet must make a DC 16 Constitution saving throw, taking 27 (6d8) necrotic damage on a failed save, or half as much on a success. The danse macabre regains hit points equal to half the total damage dealt."
      }
    ]
  },
  {
    "id": "cm-chained-spirit",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Curse of the Crimson Throne",
    "name": "Chained Spirit",
    "size": "medium",
    "type": "undead",
    "alignment": "Chaotic Evil",
    "speed": "0 ft., fly 40 ft. (hover)",
    "challengeRating": 6,
    "ac": 13,
    "hp": 82,
    "maxHp": 82,
    "abilityScores": {
      "strength": 7,
      "dexterity": 16,
      "constitution": 14,
      "intelligence": 10,
      "wisdom": 12,
      "charisma": 15
    },
    "damageResistances": [
      "acid",
      "fire",
      "lightning",
      "thunder",
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "cold",
      "necrotic",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "grappled",
      "paralyzed",
      "petrified",
      "poisoned",
      "prone",
      "restrained"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Common"
    ],
    "description": "A soul shackled to Castle Scarwall in unbreakable spectral chains, lashing out at the living.",
    "traits": [
      {
        "name": "Incorporeal Movement",
        "description": "The spirit can move through creatures and objects as difficult terrain, taking 5 (1d10) force damage if it ends its turn inside an object."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The spirit makes two Chain Lash attacks."
      },
      {
        "name": "Chain Lash",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "13 (3d6 + 3) necrotic damage, and the target must succeed on a DC 14 Strength saving throw or be restrained by ghostly chains until the end of its next turn."
      }
    ]
  },
  {
    "id": "cm-umbral-dragon",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Curse of the Crimson Throne",
    "name": "Umbral Dragon",
    "size": "huge",
    "type": "dragon",
    "alignment": "Chaotic Evil",
    "speed": "40 ft., fly 80 ft.",
    "challengeRating": 14,
    "ac": 19,
    "acNote": "natural armor",
    "hp": 218,
    "maxHp": 218,
    "abilityScores": {
      "strength": 24,
      "dexterity": 14,
      "constitution": 22,
      "intelligence": 16,
      "wisdom": 15,
      "charisma": 19
    },
    "savingThrows": {
      "dexterity": 7,
      "constitution": 11,
      "wisdom": 7,
      "charisma": 9
    },
    "skills": {
      "Perception": 13,
      "Stealth": 7
    },
    "damageImmunities": [
      "cold",
      "necrotic",
      "poison"
    ],
    "conditionImmunities": [
      "exhaustion",
      "poisoned"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive Perception": "17"
    },
    "languages": [
      "Common",
      "Draconic",
      "Void Speech"
    ],
    "description": "A gaunt, shadow-winged dragon that haunts the deep vaults beneath Scarwall.",
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      },
      {
        "name": "Shadow Stealth",
        "description": "While in dim light or darkness, the dragon can take the Hide action as a bonus action."
      },
      {
        "name": "Light Sensitivity",
        "description": "While in bright light, the dragon has disadvantage on attack rolls and Perception checks relying on sight."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes one Bite attack and two Claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 12,
        "damageDescription": "18 (2d10 + 7) piercing damage plus 9 (2d8) necrotic damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 12,
        "damageDescription": "14 (2d6 + 7) slashing damage."
      },
      {
        "name": "Shadow Breath (Recharge 5-6)",
        "description": "The dragon exhales a 60-foot cone of freezing shadow. Each creature there must make a DC 19 Constitution saving throw, taking 27 (6d8) cold damage and 27 (6d8) necrotic damage on a failed save, or half as much on a success. A creature that fails also has its hit point maximum reduced by the necrotic damage taken."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Tail",
        "description": "The dragon makes a Tail attack: +12 to hit, 16 (2d8 + 7) bludgeoning damage."
      },
      {
        "name": "Shadow Pounce (Costs 2 Actions)",
        "description": "The dragon moves up to its fly speed through dim light or darkness and makes one Claw attack.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-prince-in-chains",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Curse of the Crimson Throne",
    "name": "The Prince in Chains",
    "size": "medium",
    "type": "undead",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 12,
    "ac": 20,
    "acNote": "blackened plate",
    "hp": 168,
    "maxHp": 168,
    "abilityScores": {
      "strength": 20,
      "dexterity": 12,
      "constitution": 18,
      "intelligence": 14,
      "wisdom": 16,
      "charisma": 18
    },
    "savingThrows": {
      "constitution": 9,
      "wisdom": 8,
      "charisma": 9
    },
    "skills": {
      "Intimidation": 9,
      "Religion": 7
    },
    "damageResistances": [
      "necrotic"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "13"
    },
    "languages": [
      "Common",
      "Infernal"
    ],
    "description": "A fallen paladin of Scarwall who broke his oath to Kazavon and was cursed to guard the castle forever, wrapped in the chains he once wore as penance.",
    "traits": [
      {
        "name": "Aura of Despair",
        "description": "Enemies within 10 feet have disadvantage on saving throws against being frightened."
      },
      {
        "name": "Oathbreaker's Vigor",
        "description": "The first time each turn the Prince reduces a creature to 0 hit points, he regains 15 hit points."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The Prince makes two Cursed Greatsword attacks and one Chain attack."
      },
      {
        "name": "Cursed Greatsword",
        "description": "Melee Weapon Attack",
        "attackBonus": 10,
        "damageDescription": "13 (2d6 + 6) slashing damage plus 10 (3d6) necrotic damage."
      },
      {
        "name": "Chain",
        "description": "Melee Weapon Attack",
        "attackBonus": 10,
        "damageDescription": "11 (2d6 + 4) bludgeoning damage, and the target is grappled (escape DC 17)."
      }
    ]
  },
  {
    "id": "cm-greater-doppelganger",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Curse of the Crimson Throne",
    "name": "Greater Doppelganger",
    "size": "medium",
    "type": "monstrosity",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 6,
    "ac": 15,
    "hp": 91,
    "maxHp": 91,
    "abilityScores": {
      "strength": 13,
      "dexterity": 18,
      "constitution": 15,
      "intelligence": 14,
      "wisdom": 12,
      "charisma": 16
    },
    "skills": {
      "Deception": 8,
      "Insight": 4
    },
    "conditionImmunities": [
      "charmed"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Common",
      "thieves' cant"
    ],
    "description": "A doppelganger of unusual power that has consumed and mastered dozens of identities.",
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The doppelganger can use its action to polymorph into a Small or Medium humanoid it has seen, or back to its true form. Its statistics are the same in each form."
      },
      {
        "name": "Ambusher",
        "description": "In the first round of combat, the doppelganger has advantage on attack rolls against any surprised creature."
      },
      {
        "name": "Perfect Mimicry",
        "description": "The doppelganger can flawlessly mimic the voice and mannerisms of a creature it has studied; other creatures have disadvantage on checks to detect the ruse."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The doppelganger makes three Slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "11 (2d6 + 4) bludgeoning damage."
      },
      {
        "name": "Read Thoughts",
        "description": "The doppelganger magically reads the surface thoughts of one creature within 60 feet (no save) and has advantage on Wisdom (Insight) and Charisma checks against it for 1 minute."
      }
    ]
  },
  {
    "id": "cm-red-mantis-assassin",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Curse of the Crimson Throne",
    "name": "Red Mantis Assassin",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 8,
    "ac": 16,
    "acNote": "studded leather",
    "hp": 97,
    "maxHp": 97,
    "abilityScores": {
      "strength": 12,
      "dexterity": 18,
      "constitution": 14,
      "intelligence": 13,
      "wisdom": 14,
      "charisma": 11
    },
    "savingThrows": {
      "dexterity": 7,
      "intelligence": 5
    },
    "skills": {
      "Acrobatics": 7,
      "Perception": 5,
      "Stealth": 10
    },
    "senses": {
      "passive Perception": "15"
    },
    "languages": [
      "Common",
      "thieves' cant"
    ],
    "description": "A sawtooth-blade killer of the Red Mantis order, sworn to see a contract through to death.",
    "traits": [
      {
        "name": "Assassinate",
        "description": "During the first round of combat, the assassin has advantage on attack rolls against creatures that haven't acted. Any hit against a surprised creature is a critical hit."
      },
      {
        "name": "Sneak Attack (1/Turn)",
        "description": "The assassin deals an extra 14 (4d6) damage when it hits with a weapon attack and has advantage, or when the target is within 5 feet of an ally of the assassin."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The assassin makes two Sawtooth Sabre attacks."
      },
      {
        "name": "Sawtooth Sabre",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "8 (1d8 + 4) slashing damage plus 7 (2d6) poison damage."
      },
      {
        "name": "Light Crossbow",
        "description": "Ranged Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "7 (1d8 + 3) piercing damage plus 7 (2d6) poison damage."
      }
    ]
  },
  {
    "id": "cm-barbaroscia-thrune",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Hell's Rebels",
    "name": "Barbaroscia Thrune",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 12,
    "ac": 18,
    "acNote": "infernal half-plate",
    "hp": 161,
    "maxHp": 161,
    "abilityScores": {
      "strength": 14,
      "dexterity": 16,
      "constitution": 16,
      "intelligence": 18,
      "wisdom": 17,
      "charisma": 20
    },
    "savingThrows": {
      "intelligence": 8,
      "wisdom": 7,
      "charisma": 9
    },
    "skills": {
      "Deception": 9,
      "Intimidation": 9,
      "Religion": 8
    },
    "damageResistances": [
      "fire"
    ],
    "conditionImmunities": [
      "charmed",
      "frightened"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "13"
    },
    "languages": [
      "Common",
      "Infernal"
    ],
    "description": "The tyrant-inquisitor of House Thrune sent to break Kintargo, wearing the paracountess's seal and Asmodeus's favor.",
    "traits": [
      {
        "name": "Legendary Resistance (2/Day)",
        "description": "If Barbaroscia fails a saving throw, she can choose to succeed instead."
      },
      {
        "name": "Infernal Writ",
        "description": "When Barbaroscia speaks a creature's true name (she knows the names of every named NPC in Kintargo), that creature has disadvantage on saving throws against her spells until the end of her next turn."
      },
      {
        "name": "Spellcasting",
        "description": "Barbaroscia casts spells as a 12th-level cleric (save DC 17): bestow curse, dominate person, flame strike, hold person, spirit guardians, wall of fire."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Barbaroscia makes two Scourge attacks."
      },
      {
        "name": "Infernal Scourge",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "10 (2d6 + 3) slashing damage plus 10 (3d6) fire damage."
      },
      {
        "name": "Word of Chains (Recharge 5-6)",
        "description": "Barbaroscia points at a creature within 60 feet; it must succeed on a DC 17 Wisdom saving throw or be restrained by infernal chains and take 22 (5d8) fire damage. It repeats the save at the end of each of its turns, taking 11 (2d10) fire damage on each failure."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Scourge",
        "description": "Barbaroscia makes one Infernal Scourge attack."
      },
      {
        "name": "Condemn",
        "description": "One creature within 60 feet must succeed on a DC 17 Charisma saving throw or be marked; the next attack against it before the start of Barbaroscia's next turn has advantage."
      },
      {
        "name": "Hellfire Nova (Costs 2 Actions)",
        "description": "Each creature within 15 feet of Barbaroscia must make a DC 17 Dexterity saving throw, taking 18 (4d8) fire damage on a failed save, or half as much on a success.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-barbaroscia-archdevil",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Hell's Rebels",
    "name": "Barbaroscia Thrune, Ascended",
    "size": "large",
    "type": "fiend",
    "alignment": "Lawful Evil",
    "speed": "40 ft., fly 60 ft.",
    "challengeRating": 17,
    "ac": 20,
    "acNote": "natural armor",
    "hp": 279,
    "maxHp": 279,
    "abilityScores": {
      "strength": 22,
      "dexterity": 18,
      "constitution": 22,
      "intelligence": 20,
      "wisdom": 18,
      "charisma": 24
    },
    "savingThrows": {
      "dexterity": 10,
      "constitution": 12,
      "wisdom": 10,
      "charisma": 13
    },
    "skills": {
      "Deception": 13,
      "Intimidation": 13,
      "Perception": 10
    },
    "damageResistances": [
      "cold",
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "fire",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "truesight": "120 ft.",
      "passive Perception": "20"
    },
    "languages": [
      "Common",
      "Infernal",
      "telepathy 120 ft."
    ],
    "description": "Barbaroscia remade by Asmodeus into a horned archdevil, wreathed in the burning chains of Kintargo's despair.",
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If Barbaroscia fails a saving throw, she can choose to succeed instead."
      },
      {
        "name": "Magic Resistance",
        "description": "Advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Chain Aura",
        "description": "A creature that starts its turn within 15 feet must succeed on a DC 20 Wisdom saving throw or take 10 (3d6) psychic damage and be unable to take reactions until the start of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Barbaroscia makes three Burning Chain attacks."
      },
      {
        "name": "Burning Chain",
        "description": "Melee Weapon Attack",
        "attackBonus": 12,
        "damageDescription": "16 (2d10 + 5) slashing damage plus 14 (4d6) fire damage, and a Large or smaller target is pulled 10 feet toward Barbaroscia."
      },
      {
        "name": "Damnation (Recharge 5-6)",
        "description": "A 30-foot-radius area within 120 feet erupts in hellfire. Each creature there must make a DC 20 Dexterity saving throw, taking 45 (10d8) fire damage on a failed save, or half as much on a success."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Chain",
        "description": "Barbaroscia makes one Burning Chain attack."
      },
      {
        "name": "Teleport",
        "description": "Barbaroscia magically teleports up to 60 feet to an unoccupied space she can see."
      },
      {
        "name": "Infernal Command (Costs 2 Actions)",
        "description": "Barbaroscia targets one devil she can see within 60 feet; it can immediately use its reaction to make one melee attack.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-hellknight",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Hell's Rebels",
    "name": "Hellknight of the Torrent",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Neutral",
    "speed": "30 ft.",
    "challengeRating": 5,
    "ac": 20,
    "acNote": "hellknight plate, shield",
    "hp": 65,
    "maxHp": 65,
    "abilityScores": {
      "strength": 17,
      "dexterity": 11,
      "constitution": 15,
      "intelligence": 12,
      "wisdom": 13,
      "charisma": 12
    },
    "savingThrows": {
      "strength": 6,
      "constitution": 4
    },
    "skills": {
      "Athletics": 6,
      "Intimidation": 4
    },
    "damageResistances": [
      "fire"
    ],
    "conditionImmunities": [
      "frightened"
    ],
    "senses": {
      "passive Perception": "11"
    },
    "languages": [
      "Common",
      "Infernal"
    ],
    "description": "A disciplined devil-binding knight of the Order of the Torrent, holding the line with brutal order.",
    "traits": [
      {
        "name": "Discipline of the Chain",
        "description": "The hellknight has advantage on saving throws against being charmed or frightened, and against illusions."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The hellknight makes two Longsword attacks."
      },
      {
        "name": "Longsword",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "8 (1d8 + 4) slashing damage, or 9 (1d10 + 4) if wielded in two hands."
      },
      {
        "name": "Heavy Crossbow",
        "description": "Ranged Weapon Attack",
        "attackBonus": 3,
        "damageDescription": "6 (1d10 + 1) piercing damage."
      }
    ]
  },
  {
    "id": "cm-impaler-shrike",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Hell's Rebels",
    "name": "Impaler Shrike",
    "size": "small",
    "type": "fey",
    "alignment": "Neutral Evil",
    "speed": "10 ft., fly 60 ft.",
    "challengeRating": 2,
    "ac": 14,
    "hp": 33,
    "maxHp": 33,
    "abilityScores": {
      "strength": 10,
      "dexterity": 17,
      "constitution": 12,
      "intelligence": 5,
      "wisdom": 13,
      "charisma": 8
    },
    "skills": {
      "Perception": 3,
      "Stealth": 5
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "13"
    },
    "languages": [],
    "description": "A shrike-fey the size of a hawk that impales prey — and warnings — on thorns and railings across Kintargo.",
    "traits": [
      {
        "name": "Larder Strike",
        "description": "If the shrike hits a Small or smaller creature with its Beak while flying, it can carry the creature up to 20 feet and impale it on a fixed spike for an extra 7 (2d6) piercing damage."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The shrike makes two Beak attacks."
      },
      {
        "name": "Beak",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "7 (1d8 + 3) piercing damage."
      }
    ]
  },
  {
    "id": "cm-gambling-devil",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Hell's Rebels",
    "name": "Gambling Devil",
    "size": "small",
    "type": "fiend",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 4,
    "ac": 15,
    "acNote": "natural armor",
    "hp": 66,
    "maxHp": 66,
    "abilityScores": {
      "strength": 11,
      "dexterity": 16,
      "constitution": 14,
      "intelligence": 15,
      "wisdom": 12,
      "charisma": 17
    },
    "savingThrows": {
      "dexterity": 5,
      "charisma": 5
    },
    "skills": {
      "Deception": 7,
      "Insight": 3,
      "Sleight of Hand": 5
    },
    "damageResistances": [
      "cold",
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "fire",
      "poison"
    ],
    "conditionImmunities": [
      "poisoned"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Common",
      "Infernal",
      "telepathy 60 ft."
    ],
    "description": "A dapper minor devil that trades in ruinous wagers, feeding on the desperation of losers.",
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Devil's Bargain",
        "description": "When a creature within 30 feet makes an attack roll or saving throw, the devil can offer a bargain (no action): the creature adds 1d6 to the roll, but takes 7 (2d6) psychic damage after the roll is resolved."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The devil makes two Bladed Card attacks."
      },
      {
        "name": "Bladed Card",
        "description": "Melee or Ranged Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "7 (1d6 + 4) slashing damage plus 3 (1d6) fire damage."
      },
      {
        "name": "Losing Streak (Recharge 6)",
        "description": "One creature within 30 feet must make a DC 13 Wisdom saving throw or be cursed for 1 minute; while cursed, whenever it rolls a d20 it must take the lower of two rolls."
      }
    ]
  },
  {
    "id": "cm-scrivenite",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Hell's Rebels",
    "name": "Scrivenite",
    "size": "medium",
    "type": "construct",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 3,
    "ac": 15,
    "acNote": "natural armor",
    "hp": 45,
    "maxHp": 45,
    "abilityScores": {
      "strength": 13,
      "dexterity": 15,
      "constitution": 14,
      "intelligence": 10,
      "wisdom": 12,
      "charisma": 8
    },
    "damageImmunities": [
      "poison",
      "psychic"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Common",
      "Infernal"
    ],
    "description": "A paper-and-ink homunculus of House Thrune's bureaucracy, animated to record confessions and enforce edicts.",
    "traits": [
      {
        "name": "Paper Body",
        "description": "The scrivenite is vulnerable to fire damage (included in its low hit points) and takes an extra 3 (1d6) fire damage whenever it takes fire damage."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The scrivenite makes two Quill attacks."
      },
      {
        "name": "Razor Quill",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "6 (1d6 + 2) piercing damage plus 3 (1d6) acid damage from ink."
      }
    ]
  },
  {
    "id": "cm-shadow-dragon-hr",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Hell's Rebels",
    "name": "Shadow Dragon",
    "size": "large",
    "type": "dragon",
    "alignment": "Chaotic Evil",
    "speed": "40 ft., fly 80 ft.",
    "challengeRating": 13,
    "ac": 18,
    "acNote": "natural armor",
    "hp": 195,
    "maxHp": 195,
    "abilityScores": {
      "strength": 19,
      "dexterity": 14,
      "constitution": 17,
      "intelligence": 16,
      "wisdom": 13,
      "charisma": 19
    },
    "savingThrows": {
      "dexterity": 8,
      "constitution": 9,
      "wisdom": 7,
      "charisma": 10
    },
    "skills": {
      "Perception": 12,
      "Stealth": 8
    },
    "damageResistances": [
      "acid",
      "cold",
      "fire",
      "lightning",
      "thunder"
    ],
    "damageImmunities": [
      "necrotic",
      "poison"
    ],
    "conditionImmunities": [
      "exhaustion",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "blindsight": "30 ft.",
      "darkvision": "120 ft.",
      "passive Perception": "16"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "description": "A dragon consumed by the Shadowfell, its scales a rippling void — the ancient predator stalking Kintargo's undercity.",
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If the dragon fails a saving throw, it can choose to succeed instead."
      },
      {
        "name": "Living Shadow",
        "description": "While in dim light or darkness, the dragon has resistance to all damage except force, psychic, and radiant."
      },
      {
        "name": "Sunlight Weakness",
        "description": "While in sunlight, the dragon has disadvantage on attack rolls, ability checks, and saving throws."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes one Bite attack and two Claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "15 (2d10 + 4) piercing damage plus 9 (2d8) necrotic damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "11 (2d6 + 4) slashing damage."
      },
      {
        "name": "Shadow Breath (Recharge 5-6)",
        "description": "The dragon exhales draining shadow in a 60-foot cone. Each creature there must make a DC 17 Constitution saving throw, taking 45 (10d8) necrotic damage on a failed save, or half as much on a success. A humanoid reduced to 0 hit points this way dies and rises as a shadow."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Detect",
        "description": "The dragon makes a Wisdom (Perception) check."
      },
      {
        "name": "Claw",
        "description": "The dragon makes one Claw attack."
      },
      {
        "name": "Shadow Meld (Costs 2 Actions)",
        "description": "In dim light or darkness, the dragon becomes invisible until it attacks or until the end of its next turn.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-shadow-golem",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Hell's Rebels",
    "name": "Shadow Golem",
    "size": "large",
    "type": "construct",
    "alignment": "Neutral Evil",
    "speed": "40 ft.",
    "challengeRating": 10,
    "ac": 16,
    "acNote": "natural armor",
    "hp": 142,
    "maxHp": 142,
    "abilityScores": {
      "strength": 20,
      "dexterity": 15,
      "constitution": 18,
      "intelligence": 6,
      "wisdom": 10,
      "charisma": 5
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "cold",
      "necrotic",
      "poison",
      "psychic"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "darkvision": "120 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "understands its creator's orders"
    ],
    "description": "A golem forged from solidified shadow and the ash of Kintargo's burned dissidents.",
    "traits": [
      {
        "name": "Immutable Form",
        "description": "The golem is immune to any spell or effect that would alter its form."
      },
      {
        "name": "Shadow Blend",
        "description": "In dim light or darkness, the golem is invisible."
      },
      {
        "name": "Chill Aura",
        "description": "A creature that starts its turn within 10 feet takes 7 (2d6) cold damage."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The golem makes two Slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "17 (3d8 + 4) bludgeoning damage plus 10 (3d6) necrotic damage, and the target's speed is reduced by 10 feet until the end of its next turn."
      }
    ]
  },
  {
    "id": "cm-nightprowler",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Hell's Rebels",
    "name": "Nightprowler",
    "size": "medium",
    "type": "aberration",
    "alignment": "Neutral Evil",
    "speed": "40 ft., climb 40 ft.",
    "challengeRating": 9,
    "ac": 16,
    "hp": 123,
    "maxHp": 123,
    "abilityScores": {
      "strength": 18,
      "dexterity": 20,
      "constitution": 16,
      "intelligence": 12,
      "wisdom": 15,
      "charisma": 14
    },
    "savingThrows": {
      "dexterity": 9,
      "wisdom": 6
    },
    "skills": {
      "Perception": 6,
      "Stealth": 13
    },
    "damageResistances": [
      "necrotic"
    ],
    "senses": {
      "blindsight": "30 ft.",
      "darkvision": "120 ft.",
      "passive Perception": "16"
    },
    "languages": [
      "Common",
      "Undercommon"
    ],
    "description": "A shadow-cloaked assassin-beast that emerged from Kintargo's own dark heart — \"the monster of its own making.\"",
    "traits": [
      {
        "name": "Shadow Cloak",
        "description": "While in dim light or darkness, the nightprowler is invisible and attacks against it have disadvantage."
      },
      {
        "name": "Sneak Attack (1/Turn)",
        "description": "The nightprowler deals an extra 21 (6d6) damage when it hits with advantage or against a creature that hasn't taken a turn yet."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The nightprowler makes two Shadow Claw attacks."
      },
      {
        "name": "Shadow Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "13 (2d8 + 4) slashing damage plus 7 (2d6) necrotic damage."
      },
      {
        "name": "Umbral Lunge (Recharge 5-6)",
        "description": "The nightprowler teleports through shadow up to 60 feet and makes one Shadow Claw attack with advantage."
      }
    ]
  },
  {
    "id": "cm-cruciarus",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Hell's Rebels",
    "name": "Cruciarus",
    "size": "large",
    "type": "fiend",
    "alignment": "Lawful Evil",
    "speed": "30 ft., fly 40 ft.",
    "challengeRating": 11,
    "ac": 18,
    "acNote": "natural armor",
    "hp": 161,
    "maxHp": 161,
    "abilityScores": {
      "strength": 20,
      "dexterity": 15,
      "constitution": 19,
      "intelligence": 14,
      "wisdom": 16,
      "charisma": 17
    },
    "savingThrows": {
      "constitution": 9,
      "wisdom": 8,
      "charisma": 8
    },
    "damageResistances": [
      "cold",
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "fire",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "13"
    },
    "languages": [
      "Infernal",
      "telepathy 120 ft."
    ],
    "description": "A greater devil of punishment, its body a rack of hooks and its many arms ending in torturer's implements.",
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Aura of Torment",
        "description": "A creature that starts its turn within 10 feet must succeed on a DC 16 Constitution saving throw or take 10 (3d6) psychic damage."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The cruciarus makes three Hook attacks."
      },
      {
        "name": "Hook",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "14 (2d8 + 5) piercing damage, and a Large or smaller target is grappled (escape DC 17) and pulled 5 feet toward the cruciarus."
      },
      {
        "name": "Rack (Recharge 5-6)",
        "description": "Each creature grappled by the cruciarus takes 33 (6d10) piercing damage, or half as much with a successful DC 17 Constitution saving throw."
      }
    ]
  },
  {
    "id": "cm-forsaken-legion",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Hell's Rebels",
    "name": "Forsaken Legion",
    "size": "large",
    "type": "undead",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 6,
    "ac": 14,
    "acNote": "tattered mail",
    "hp": 104,
    "maxHp": 104,
    "abilityScores": {
      "strength": 16,
      "dexterity": 12,
      "constitution": 17,
      "intelligence": 6,
      "wisdom": 10,
      "charisma": 8
    },
    "damageResistances": [
      "necrotic",
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "grappled",
      "poisoned",
      "prone",
      "restrained"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "understands Common but can't speak"
    ],
    "description": "A shambling composite of a dozen dead Chelish soldiers, moving and striking as one damned company.",
    "traits": [
      {
        "name": "Legion",
        "description": "The forsaken legion counts as a swarm. It can occupy another creature's space and vice versa, and it can move through any opening large enough for a Medium creature."
      },
      {
        "name": "Overwhelm",
        "description": "The legion has advantage on attack rolls against a creature if at least one other enemy of the target is within 5 feet of it."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The legion makes two Rusted Blades attacks."
      },
      {
        "name": "Rusted Blades",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "18 (4d6 + 4) slashing damage, or 10 (2d6 + 3) if the legion is at half hit points or fewer."
      }
    ]
  },
  {
    "id": "cm-thrune-agent",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Hell's Rebels",
    "name": "Thrune Agent",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 4,
    "ac": 15,
    "acNote": "studded leather",
    "hp": 58,
    "maxHp": 58,
    "abilityScores": {
      "strength": 11,
      "dexterity": 16,
      "constitution": 13,
      "intelligence": 14,
      "wisdom": 12,
      "charisma": 13
    },
    "savingThrows": {
      "dexterity": 5
    },
    "skills": {
      "Deception": 5,
      "Perception": 3,
      "Stealth": 7
    },
    "senses": {
      "passive Perception": "13"
    },
    "languages": [
      "Common",
      "Infernal"
    ],
    "description": "A dottari secret-police operative rooting out Silver Raven sympathizers.",
    "traits": [
      {
        "name": "Cunning Action",
        "description": "On each of its turns, the agent can use a bonus action to Dash, Disengage, or Hide."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The agent makes two Rapier attacks or two Hand Crossbow attacks."
      },
      {
        "name": "Rapier",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "7 (1d8 + 3) piercing damage."
      },
      {
        "name": "Hand Crossbow",
        "description": "Ranged Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "6 (1d6 + 3) piercing damage plus 7 (2d6) poison damage."
      }
    ]
  },
  {
    "id": "cm-dottari-guard",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Hell's Rebels",
    "name": "Dottari Guard",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Neutral",
    "speed": "30 ft.",
    "challengeRating": 1,
    "ac": 16,
    "acNote": "chain shirt, shield",
    "hp": 22,
    "maxHp": 22,
    "abilityScores": {
      "strength": 14,
      "dexterity": 12,
      "constitution": 13,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 10
    },
    "senses": {
      "passive Perception": "10"
    },
    "languages": [
      "Common"
    ],
    "description": "A Kintargan city watchman, now enforcing House Thrune's martial law.",
    "actions": [
      {
        "name": "Spear",
        "description": "Melee or Ranged Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "5 (1d6 + 2) piercing damage, or 6 (1d8 + 2) if used with two hands to make a melee attack."
      }
    ]
  },
  {
    "id": "cm-diabolic-chorister",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Hell's Rebels",
    "name": "Diabolic Chorister",
    "size": "medium",
    "type": "fiend",
    "alignment": "Lawful Evil",
    "speed": "30 ft., fly 30 ft.",
    "challengeRating": 3,
    "ac": 13,
    "hp": 40,
    "maxHp": 40,
    "abilityScores": {
      "strength": 8,
      "dexterity": 15,
      "constitution": 12,
      "intelligence": 11,
      "wisdom": 13,
      "charisma": 16
    },
    "damageResistances": [
      "cold",
      "poison"
    ],
    "damageImmunities": [
      "fire"
    ],
    "conditionImmunities": [
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Common",
      "Infernal"
    ],
    "description": "A lesser devil that sings the liturgy of Asmodeus, its hymn twisting the minds of the faithful.",
    "traits": [
      {
        "name": "Hymn of Submission",
        "description": "A creature that starts its turn within 20 feet and can hear the chorister must succeed on a DC 13 Wisdom saving throw or have disadvantage on attack rolls against the chorister until the start of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The chorister makes two Claw attacks."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "6 (1d6 + 2) slashing damage plus 3 (1d6) fire damage."
      },
      {
        "name": "Dissonant Verse",
        "description": "Ranged Spell Attack",
        "attackBonus": 5,
        "damageDescription": "13 (3d6 + 3) psychic damage."
      }
    ]
  },
  {
    "id": "cm-azarr-kul",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Red Hand of Doom",
    "name": "Azarr Kul, the Red Hand",
    "size": "large",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "30 ft., fly 40 ft.",
    "challengeRating": 15,
    "ac": 20,
    "acNote": "red dragonscale plate",
    "hp": 230,
    "maxHp": 230,
    "abilityScores": {
      "strength": 22,
      "dexterity": 12,
      "constitution": 20,
      "intelligence": 16,
      "wisdom": 16,
      "charisma": 20
    },
    "savingThrows": {
      "strength": 11,
      "constitution": 10,
      "wisdom": 8,
      "charisma": 10
    },
    "skills": {
      "Intimidation": 10,
      "Religion": 8
    },
    "damageImmunities": [
      "fire"
    ],
    "conditionImmunities": [
      "frightened"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "13"
    },
    "languages": [
      "Common",
      "Draconic",
      "Goblin"
    ],
    "description": "The half-red-dragon hobgoblin high cleric of Tiamat, warlord of the Red Hand horde marching on the Elsir Vale.",
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If Azarr Kul fails a saving throw, he can choose to succeed instead."
      },
      {
        "name": "Horde Commander",
        "description": "Allied creatures of the Red Hand within 30 feet of Azarr Kul have advantage on saving throws against being frightened and deal an extra 3 (1d6) damage on their weapon attacks."
      },
      {
        "name": "Spellcasting",
        "description": "Azarr Kul casts spells as a 12th-level cleric (save DC 18): command, hold person, insect plague, spirit guardians, flame strike, guardian of faith."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Azarr Kul makes two Draconic Halberd attacks and one Claw attack."
      },
      {
        "name": "Draconic Halberd",
        "description": "Melee Weapon Attack",
        "attackBonus": 11,
        "damageDescription": "17 (2d10 + 6) slashing damage plus 10 (3d6) fire damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 11,
        "damageDescription": "13 (2d6 + 6) slashing damage."
      },
      {
        "name": "Fire Breath (Recharge 5-6)",
        "description": "Azarr Kul exhales fire in a 30-foot cone. Each creature there must make a DC 18 Dexterity saving throw, taking 45 (10d8) fire damage on a failed save, or half as much on a success."
      }
    ],
    "legendaryActionCount": 3,
    "legendaryActions": [
      {
        "name": "Halberd",
        "description": "Azarr Kul makes one Draconic Halberd attack."
      },
      {
        "name": "Command the Horde",
        "description": "One allied Red Hand creature within 60 feet can use its reaction to move up to its speed or make one weapon attack."
      },
      {
        "name": "Wings of Tiamat (Costs 2 Actions)",
        "description": "Azarr Kul flies up to his fly speed. Each creature within 10 feet of his path must succeed on a DC 19 Dexterity saving throw or take 14 (4d6) fire damage.",
        "cost": 2
      }
    ]
  },
  {
    "id": "cm-wyrmlord",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Red Hand of Doom",
    "name": "Wyrmlord Koth",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 11,
    "ac": 18,
    "acNote": "half-plate",
    "hp": 138,
    "maxHp": 138,
    "abilityScores": {
      "strength": 16,
      "dexterity": 13,
      "constitution": 16,
      "intelligence": 17,
      "wisdom": 18,
      "charisma": 15
    },
    "savingThrows": {
      "wisdom": 8,
      "intelligence": 7
    },
    "skills": {
      "Arcana": 7,
      "Perception": 8,
      "Religion": 7
    },
    "damageResistances": [
      "fire"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "18"
    },
    "languages": [
      "Common",
      "Draconic",
      "Goblin"
    ],
    "description": "One of the six Wyrmlords of the Red Hand — a hobgoblin dragon-priest who speaks for Tiamat and carries a shard of the Ghostlord's power.",
    "traits": [
      {
        "name": "Dragon Speaker",
        "description": "Dragons and dragonspawn allied with the Red Hand within 60 feet of the Wyrmlord have advantage on the first attack roll they make each turn."
      },
      {
        "name": "Spellcasting",
        "description": "The Wyrmlord casts spells as a 10th-level caster (save DC 15): fireball, fly, lightning bolt, scorching ray, shield, wall of fire."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The Wyrmlord makes two Wyrmscale Staff attacks."
      },
      {
        "name": "Wyrmscale Staff",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "8 (1d8 + 3) bludgeoning damage plus 10 (3d6) fire damage."
      },
      {
        "name": "Draconic Bolt",
        "description": "Ranged Spell Attack",
        "attackBonus": 7,
        "damageDescription": "21 (6d6) fire damage."
      }
    ]
  },
  {
    "id": "cm-harnoth-bloodwatcher",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Red Hand of Doom",
    "name": "Harnoth Bloodwatcher",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 8,
    "ac": 19,
    "acNote": "splint armor, shield",
    "hp": 127,
    "maxHp": 127,
    "abilityScores": {
      "strength": 19,
      "dexterity": 13,
      "constitution": 17,
      "intelligence": 12,
      "wisdom": 14,
      "charisma": 13
    },
    "savingThrows": {
      "strength": 7,
      "constitution": 6
    },
    "skills": {
      "Athletics": 7,
      "Intimidation": 4
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "Common",
      "Goblin"
    ],
    "description": "A champion hobgoblin warlord of the Red Hand, leading the assault companies at the Battle of Brindol.",
    "traits": [
      {
        "name": "Martial Advantage (1/Turn)",
        "description": "The warlord deals an extra 14 (4d6) damage when it hits a creature that is within 5 feet of an ally of the warlord."
      },
      {
        "name": "Relentless (Recharges after a Short or Long Rest)",
        "description": "If the warlord takes 20 damage or less that would reduce it to 0 hit points, it drops to 1 hit point instead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Harnoth makes three Flail attacks."
      },
      {
        "name": "Spiked Flail",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "10 (1d10 + 5) bludgeoning damage plus 3 (1d6) piercing damage."
      },
      {
        "name": "Battle Standard (Recharge 6)",
        "description": "Harnoth plants the Red Hand standard. Allied Red Hand creatures within 30 feet gain 10 temporary hit points and can immediately move up to their speed."
      }
    ]
  },
  {
    "id": "cm-zanthrus-wyrmspeaker",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Red Hand of Doom",
    "name": "Zanthrus, Wyrm-Speaker",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 11,
    "ac": 17,
    "acNote": "breastplate",
    "hp": 133,
    "maxHp": 133,
    "abilityScores": {
      "strength": 14,
      "dexterity": 14,
      "constitution": 16,
      "intelligence": 15,
      "wisdom": 18,
      "charisma": 16
    },
    "savingThrows": {
      "constitution": 7,
      "wisdom": 8
    },
    "skills": {
      "Perception": 8,
      "Religion": 6
    },
    "damageResistances": [
      "fire"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "18"
    },
    "languages": [
      "Common",
      "Draconic",
      "Goblin"
    ],
    "description": "The senior priest of the Fane of Tiamat, keeper of the outer chambers and voice of the five-headed queen.",
    "traits": [
      {
        "name": "Spellcasting",
        "description": "Zanthrus casts spells as an 11th-level cleric (save DC 16): banishment, blindness/deafness, contagion, flame strike, guardian of faith, insect plague, mass cure wounds."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Zanthrus makes two Chromatic Mace attacks."
      },
      {
        "name": "Chromatic Mace",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "7 (1d6 + 2) bludgeoning damage plus 10 (3d6) damage of a type chosen from acid, cold, fire, lightning, or poison."
      },
      {
        "name": "Breath of Tiamat (Recharge 5-6)",
        "description": "Zanthrus channels the Dragon Queen in a 30-foot cone. Each creature there must make a DC 16 Dexterity saving throw, taking 36 (8d8) damage split evenly between fire and cold on a failed save, or half as much on a success."
      }
    ]
  },
  {
    "id": "cm-kulkzor-wyrmspeaker",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Red Hand of Doom",
    "name": "Kulk'zor the Wyrmspeaker",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 8,
    "ac": 16,
    "acNote": "scale mail",
    "hp": 104,
    "maxHp": 104,
    "abilityScores": {
      "strength": 15,
      "dexterity": 12,
      "constitution": 15,
      "intelligence": 14,
      "wisdom": 16,
      "charisma": 13
    },
    "savingThrows": {
      "wisdom": 6
    },
    "skills": {
      "Perception": 6,
      "Religion": 5
    },
    "damageResistances": [
      "fire"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "16"
    },
    "languages": [
      "Common",
      "Draconic",
      "Goblin"
    ],
    "description": "A rising dragon-priest of the Red Hand entrusted with a Wyrmlord's token in the Vale skirmishes.",
    "traits": [
      {
        "name": "Spellcasting",
        "description": "Kulk'zor casts spells as an 8th-level cleric (save DC 14): bane, hold person, spirit guardians, fireball, protection from energy."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Kulk'zor makes two Serpent Rod attacks."
      },
      {
        "name": "Serpent Rod",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "6 (1d8 + 2) bludgeoning damage plus 7 (2d6) fire damage."
      },
      {
        "name": "Scorching Ray",
        "description": "Ranged Spell Attack",
        "attackBonus": 6,
        "damageDescription": "three rays, 7 (2d6) fire damage each."
      }
    ]
  },
  {
    "id": "cm-skalmad-red-fang",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Red Hand of Doom",
    "name": "Skalmad the Red Fang",
    "size": "medium",
    "type": "undead",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 7,
    "ac": 16,
    "acNote": "natural armor",
    "hp": 97,
    "maxHp": 97,
    "abilityScores": {
      "strength": 16,
      "dexterity": 16,
      "constitution": 16,
      "intelligence": 11,
      "wisdom": 12,
      "charisma": 14
    },
    "savingThrows": {
      "dexterity": 6,
      "wisdom": 4
    },
    "skills": {
      "Perception": 4,
      "Stealth": 6
    },
    "damageResistances": [
      "necrotic",
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "14"
    },
    "languages": [
      "Common",
      "Goblin"
    ],
    "description": "A hobgoblin lieutenant of the Red Hand raised as a vampiric horror, hunting the Witchwood by night.",
    "traits": [
      {
        "name": "Regeneration",
        "description": "Skalmad regains 10 hit points at the start of its turn if it has at least 1 hit point and hasn't taken radiant damage or damage from holy water since its last turn."
      },
      {
        "name": "Spider Climb",
        "description": "Skalmad can climb difficult surfaces, including upside down, without an ability check."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Skalmad makes two attacks, only one of which can be a Bite."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "9 (2d4 + 4) slashing damage, and the target is grappled (escape DC 14)."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "7 (1d6 + 4) piercing damage plus 10 (3d6) necrotic damage. The target's hit point maximum is reduced by that amount and Skalmad regains that many hit points."
      }
    ]
  },
  {
    "id": "cm-hurog-manthex",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Red Hand of Doom",
    "name": "Hurog Manthex",
    "size": "large",
    "type": "giant",
    "alignment": "Chaotic Evil",
    "speed": "40 ft.",
    "challengeRating": 8,
    "ac": 15,
    "acNote": "hide armor, shield",
    "hp": 138,
    "maxHp": 138,
    "abilityScores": {
      "strength": 21,
      "dexterity": 10,
      "constitution": 19,
      "intelligence": 8,
      "wisdom": 10,
      "charisma": 11
    },
    "savingThrows": {
      "strength": 8,
      "constitution": 7
    },
    "skills": {
      "Athletics": 8,
      "Intimidation": 3
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Common",
      "Giant",
      "Goblin"
    ],
    "description": "A monstrous ogre-blooded champion of the Red Hand, driving the horde's siege beasts and battering rams against Brindol.",
    "traits": [
      {
        "name": "Siege Monster",
        "description": "Hurog deals double damage to objects and structures."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Hurog makes two Great Maul attacks."
      },
      {
        "name": "Great Maul",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "19 (3d8 + 6) bludgeoning damage, and a Medium or smaller target must succeed on a DC 16 Strength saving throw or be knocked prone."
      },
      {
        "name": "Hurl Debris",
        "description": "Ranged Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "22 (3d10 + 6) bludgeoning damage."
      }
    ]
  },
  {
    "id": "cm-hobgoblin-hand",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Red Hand of Doom",
    "name": "Hobgoblin of the Red Hand",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 1,
    "ac": 18,
    "acNote": "chain mail, shield",
    "hp": 22,
    "maxHp": 22,
    "abilityScores": {
      "strength": 13,
      "dexterity": 12,
      "constitution": 12,
      "intelligence": 10,
      "wisdom": 10,
      "charisma": 9
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Common",
      "Goblin"
    ],
    "description": "A disciplined infantry soldier of the Red Hand horde, marked with the bloody hand sigil.",
    "traits": [
      {
        "name": "Martial Advantage (1/Turn)",
        "description": "The hobgoblin deals an extra 7 (2d6) damage to a creature it hits with a weapon attack if that creature is within 5 feet of an ally of the hobgoblin."
      }
    ],
    "actions": [
      {
        "name": "Longsword",
        "description": "Melee Weapon Attack",
        "attackBonus": 3,
        "damageDescription": "5 (1d8 + 1) slashing damage."
      },
      {
        "name": "Longbow",
        "description": "Ranged Weapon Attack",
        "attackBonus": 3,
        "damageDescription": "5 (1d8 + 1) piercing damage."
      }
    ]
  },
  {
    "id": "cm-hobgoblin-hand-captain",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Red Hand of Doom",
    "name": "Red Hand Hobgoblin Captain",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 3,
    "ac": 17,
    "acNote": "half-plate",
    "hp": 58,
    "maxHp": 58,
    "abilityScores": {
      "strength": 15,
      "dexterity": 14,
      "constitution": 14,
      "intelligence": 12,
      "wisdom": 10,
      "charisma": 13
    },
    "skills": {
      "Intimidation": 3
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Common",
      "Goblin"
    ],
    "description": "A veteran field officer of a Red Hand company.",
    "traits": [
      {
        "name": "Martial Advantage (1/Turn)",
        "description": "The captain deals an extra 10 (3d6) damage to a creature it hits with a weapon attack if that creature is within 5 feet of an ally of the captain."
      },
      {
        "name": "Leadership (Recharges after a Short or Long Rest)",
        "description": "For 1 minute, allies within 30 feet of the captain add a d4 to their attack rolls and saving throws while the captain isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The captain makes two Greatsword attacks."
      },
      {
        "name": "Greatsword",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "10 (2d6 + 3) slashing damage."
      },
      {
        "name": "Longbow",
        "description": "Ranged Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "6 (1d8 + 2) piercing damage."
      }
    ]
  },
  {
    "id": "cm-bugbear-red-hand",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Red Hand of Doom",
    "name": "Red Hand Bugbear Raider",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 1,
    "ac": 15,
    "acNote": "hide armor, shield",
    "hp": 32,
    "maxHp": 32,
    "abilityScores": {
      "strength": 15,
      "dexterity": 14,
      "constitution": 13,
      "intelligence": 8,
      "wisdom": 11,
      "charisma": 9
    },
    "skills": {
      "Stealth": 6,
      "Survival": 2
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Common",
      "Goblin"
    ],
    "description": "A brutal bugbear irregular attached to the Red Hand for raiding and terror.",
    "traits": [
      {
        "name": "Brute",
        "description": "A melee weapon deals one extra die of its damage when the bugbear hits with it (included below)."
      },
      {
        "name": "Surprise Attack",
        "description": "If the bugbear surprises a creature and hits it with an attack during the first round of combat, the target takes an extra 7 (2d6) damage."
      }
    ],
    "actions": [
      {
        "name": "Morningstar",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "11 (2d8 + 2) piercing damage."
      },
      {
        "name": "Javelin",
        "description": "Ranged Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "9 (2d6 + 2) piercing damage."
      }
    ]
  },
  {
    "id": "cm-red-hand-veteran",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Red Hand of Doom",
    "name": "Elsir Vale Defender",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Good",
    "speed": "30 ft.",
    "challengeRating": 3,
    "ac": 17,
    "acNote": "splint armor",
    "hp": 58,
    "maxHp": 58,
    "abilityScores": {
      "strength": 16,
      "dexterity": 13,
      "constitution": 14,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 10
    },
    "skills": {
      "Athletics": 5,
      "Perception": 2
    },
    "senses": {
      "passive Perception": "12"
    },
    "languages": [
      "Common"
    ],
    "description": "A militia veteran of Brindol or Dawn Way standing against the horde.",
    "actions": [
      {
        "name": "Multiattack",
        "description": "The defender makes two Longsword attacks. If it has a shortsword drawn, it can also make a Shortsword attack."
      },
      {
        "name": "Longsword",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "7 (1d8 + 3) slashing damage."
      },
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "6 (1d6 + 3) piercing damage."
      },
      {
        "name": "Heavy Crossbow",
        "description": "Ranged Weapon Attack",
        "attackBonus": 3,
        "damageDescription": "6 (1d10 + 1) piercing damage."
      }
    ]
  },
  {
    "id": "cm-tiamat-dragonspawn",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Red Hand of Doom",
    "name": "Dragonspawn of Tiamat",
    "size": "medium",
    "type": "dragon",
    "alignment": "Chaotic Evil",
    "speed": "30 ft., fly 30 ft.",
    "challengeRating": 5,
    "ac": 16,
    "acNote": "natural armor",
    "hp": 76,
    "maxHp": 76,
    "abilityScores": {
      "strength": 17,
      "dexterity": 13,
      "constitution": 16,
      "intelligence": 8,
      "wisdom": 11,
      "charisma": 12
    },
    "skills": {
      "Perception": 3
    },
    "damageResistances": [
      "fire"
    ],
    "senses": {
      "blindsight": "10 ft.",
      "darkvision": "60 ft.",
      "passive Perception": "13"
    },
    "languages": [
      "Draconic"
    ],
    "description": "A malformed lesser dragon bred in the Fane of Tiamat to serve the Red Hand.",
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragonspawn makes one Bite attack and two Claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "10 (2d6 + 3) piercing damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "7 (1d6 + 3) slashing damage."
      },
      {
        "name": "Ember Breath (Recharge 5-6)",
        "description": "The dragonspawn exhales embers in a 15-foot cone. Each creature there must make a DC 13 Dexterity saving throw, taking 24 (7d6) fire damage on a failed save, or half as much on a success."
      }
    ]
  },
  {
    "id": "cm-hell-hound-tiamat",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Red Hand of Doom",
    "name": "Fanged Hound of Tiamat",
    "size": "medium",
    "type": "fiend",
    "alignment": "Lawful Evil",
    "speed": "50 ft.",
    "challengeRating": 3,
    "ac": 15,
    "acNote": "natural armor",
    "hp": 45,
    "maxHp": 45,
    "abilityScores": {
      "strength": 17,
      "dexterity": 12,
      "constitution": 14,
      "intelligence": 6,
      "wisdom": 13,
      "charisma": 6
    },
    "skills": {
      "Perception": 5
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "13"
    },
    "languages": [
      "understands Infernal but can't speak"
    ],
    "description": "A fire-blooded war hound loosed ahead of the Red Hand's columns.",
    "traits": [
      {
        "name": "Pack Tactics",
        "description": "The hound has advantage on an attack roll against a creature if at least one of the hound's allies is within 5 feet of the creature and isn't incapacitated."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "7 (1d8 + 3) piercing damage plus 7 (2d6) fire damage."
      },
      {
        "name": "Fire Breath (Recharge 5-6)",
        "description": "The hound exhales fire in a 15-foot cone. Each creature there must make a DC 12 Dexterity saving throw, taking 21 (6d6) fire damage on a failed save, or half as much on a success."
      }
    ]
  },
  {
    "id": "cm-abithriax",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Red Hand of Doom",
    "name": "Abithriax, Young Red Dragon",
    "size": "large",
    "type": "dragon",
    "alignment": "Chaotic Evil",
    "speed": "40 ft., climb 40 ft., fly 80 ft.",
    "challengeRating": 10,
    "ac": 18,
    "acNote": "natural armor",
    "hp": 178,
    "maxHp": 178,
    "abilityScores": {
      "strength": 23,
      "dexterity": 10,
      "constitution": 21,
      "intelligence": 14,
      "wisdom": 11,
      "charisma": 19
    },
    "savingThrows": {
      "dexterity": 4,
      "constitution": 9,
      "wisdom": 4,
      "charisma": 8
    },
    "skills": {
      "Perception": 8,
      "Stealth": 4
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "blindsight": "30 ft.",
      "darkvision": "120 ft.",
      "passive Perception": "14"
    },
    "languages": [
      "Common",
      "Draconic"
    ],
    "description": "The young red dragon bound to Azarr Kul's cause, torching villages ahead of the horde.",
    "actions": [
      {
        "name": "Multiattack",
        "description": "Abithriax makes one Bite attack and two Claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 10,
        "damageDescription": "17 (2d10 + 6) piercing damage plus 3 (1d6) fire damage."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 10,
        "damageDescription": "13 (2d6 + 6) slashing damage."
      },
      {
        "name": "Fire Breath (Recharge 5-6)",
        "description": "Abithriax exhales fire in a 30-foot cone. Each creature there must make a DC 17 Dexterity saving throw, taking 56 (16d6) fire damage on a failed save, or half as much on a success."
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // populate-campaigns-g4 — Anthologies & Adventure Paths (Candlekeep, Radiant
  // Citadel, Golden Vault, Yawning Portal, Saltmarsh, Mad Mage, Runelords,
  // Kingmaker, Wrath of the Righteous). See openspec/changes/populate-campaigns-g4.
  // ---------------------------------------------------------------------------
  {
    "id": "cm-ck-flying-book-swarm",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Candlekeep Mysteries",
    "name": "Swarm of Animated Books",
    "size": "medium",
    "type": "construct",
    "alignment": "Unaligned",
    "speed": "0 ft., fly 30 ft. (hover)",
    "challengeRating": 1,
    "ac": 13,
    "hp": 26,
    "maxHp": 26,
    "abilityScores": {
      "strength": 6,
      "dexterity": 15,
      "constitution": 12,
      "intelligence": 1,
      "wisdom": 8,
      "charisma": 1
    },
    "damageImmunities": [
      "poison",
      "psychic"
    ],
    "conditionImmunities": [
      "charmed",
      "frightened",
      "grappled",
      "paralyzed",
      "petrified",
      "prone",
      "restrained",
      "stunned"
    ],
    "senses": {
      "passive Perception": "9"
    },
    "traits": [
      {
        "name": "Swarm",
        "description": "Can occupy another creature's space. Can't regain hit points or gain temporary hit points."
      }
    ],
    "actions": [
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "2d6 bludgeoning, or 1d6 if the swarm has half its hit points or fewer"
      }
    ]
  },
  {
    "id": "cm-ck-mazfroth",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Candlekeep Mysteries",
    "name": "Mazfroth, the Mimic Tome",
    "size": "large",
    "type": "monstrosity",
    "alignment": "Neutral",
    "speed": "15 ft.",
    "challengeRating": 4,
    "ac": 12,
    "acNote": "natural armor",
    "hp": 71,
    "maxHp": 71,
    "abilityScores": {
      "strength": 17,
      "dexterity": 12,
      "constitution": 15,
      "intelligence": 5,
      "wisdom": 13,
      "charisma": 8
    },
    "skills": {
      "Stealth": 5
    },
    "conditionImmunities": [
      "prone"
    ],
    "senses": {
      "passive Perception": "11"
    },
    "traits": [
      {
        "name": "Adhesive",
        "description": "The tome adheres to anything that touches it. A creature adhered is grappled (escape DC 13)."
      },
      {
        "name": "False Appearance",
        "description": "While motionless, indistinguishable from a large book."
      }
    ],
    "actions": [
      {
        "name": "Pseudopod",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d8+3 bludgeoning plus 1d8 acid"
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d8+3 piercing plus 1d8 acid"
      }
    ]
  },
  {
    "id": "cm-ck-shadow-raven-flock",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Candlekeep Mysteries",
    "name": "Shadow-Touched Raven Flock",
    "size": "medium",
    "type": "beast",
    "alignment": "Unaligned",
    "speed": "10 ft., fly 50 ft.",
    "challengeRating": 1,
    "ac": 12,
    "hp": 24,
    "maxHp": 24,
    "abilityScores": {
      "strength": 6,
      "dexterity": 14,
      "constitution": 10,
      "intelligence": 3,
      "wisdom": 12,
      "charisma": 6
    },
    "damageResistances": [
      "cold"
    ],
    "damageImmunities": [
      "necrotic"
    ],
    "conditionImmunities": [
      "charmed",
      "frightened",
      "grappled",
      "prone",
      "restrained",
      "stunned"
    ],
    "senses": {
      "passive Perception": "11"
    },
    "traits": [
      {
        "name": "Swarm",
        "description": "Can occupy another creature's space."
      }
    ],
    "actions": [
      {
        "name": "Beaks",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "2d6 piercing plus 1d4 necrotic, or half if bloodied"
      }
    ]
  },
  {
    "id": "cm-ck-dolina-nightcaller",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Candlekeep Mysteries",
    "name": "Dolina, the Raven Queen's Herald",
    "size": "medium",
    "type": "fiend",
    "alignment": "Lawful Evil",
    "speed": "30 ft., fly 40 ft.",
    "challengeRating": 5,
    "ac": 15,
    "acNote": "natural armor",
    "hp": 82,
    "maxHp": 82,
    "abilityScores": {
      "strength": 12,
      "dexterity": 17,
      "constitution": 14,
      "intelligence": 15,
      "wisdom": 16,
      "charisma": 18
    },
    "savingThrows": {
      "wisdom": 6,
      "charisma": 7
    },
    "skills": {
      "Deception": 7,
      "Insight": 6
    },
    "damageResistances": [
      "cold",
      "necrotic"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "passive Perception": "13"
    },
    "languages": [
      "Common",
      "Abyssal",
      "Infernal"
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells and other magical effects."
      }
    ],
    "actions": [
      {
        "name": "Life Drain",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "2d8+3 necrotic; target's hit point maximum is reduced by an equal amount"
      },
      {
        "name": "Shadow Bolt (3/day)",
        "description": "Ranged spell attack, +7 to hit, 4d8 necrotic on a hit."
      }
    ]
  },
  {
    "id": "cm-ck-derro-mine-warden",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Candlekeep Mysteries",
    "name": "Derro Mine Warden",
    "size": "small",
    "type": "humanoid",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 2,
    "ac": 13,
    "hp": 45,
    "maxHp": 45,
    "abilityScores": {
      "strength": 9,
      "dexterity": 14,
      "constitution": 12,
      "intelligence": 11,
      "wisdom": 5,
      "charisma": 9
    },
    "skills": {
      "Stealth": 4
    },
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "7"
    },
    "languages": [
      "Dwarvish",
      "Undercommon"
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      }
    ],
    "actions": [
      {
        "name": "Hooked Spear",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d8+2 piercing"
      },
      {
        "name": "Light Repeating Crossbow",
        "description": "Ranged Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d8+2 piercing"
      }
    ]
  },
  {
    "id": "cm-ck-flameskull-archivist",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Candlekeep Mysteries",
    "name": "Flameskull Archivist",
    "size": "tiny",
    "type": "undead",
    "alignment": "Neutral Evil",
    "speed": "0 ft., fly 40 ft. (hover)",
    "challengeRating": 4,
    "ac": 13,
    "hp": 40,
    "maxHp": 40,
    "abilityScores": {
      "strength": 1,
      "dexterity": 17,
      "constitution": 14,
      "intelligence": 16,
      "wisdom": 10,
      "charisma": 11
    },
    "damageResistances": [
      "necrotic"
    ],
    "damageImmunities": [
      "cold",
      "fire",
      "lightning",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "frightened",
      "paralyzed",
      "poisoned",
      "prone"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Common"
    ],
    "traits": [
      {
        "name": "Illumination",
        "description": "Sheds bright light in a 15-foot radius."
      },
      {
        "name": "Rejuvenation",
        "description": "If destroyed, reforms in 1 hour unless doused with holy water."
      },
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      }
    ],
    "actions": [
      {
        "name": "Fire Ray",
        "description": "Two ranged spell attacks, +5 to hit, 3d6 fire each."
      },
      {
        "name": "Fireball (1/day)",
        "description": "20-foot radius, DC 13 Dexterity save, 5d6 fire."
      }
    ]
  },
  {
    "id": "cm-ck-lorehold-scrivener",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Candlekeep Mysteries",
    "name": "Lorehold Scrivener",
    "size": "medium",
    "type": "aberration",
    "alignment": "Lawful Neutral",
    "speed": "30 ft.",
    "challengeRating": 3,
    "ac": 14,
    "hp": 52,
    "maxHp": 52,
    "abilityScores": {
      "strength": 10,
      "dexterity": 14,
      "constitution": 13,
      "intelligence": 18,
      "wisdom": 15,
      "charisma": 12
    },
    "skills": {
      "Arcana": 6,
      "History": 6
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "Deep Speech",
      "telepathy 60 ft."
    ],
    "actions": [
      {
        "name": "Mind Sliver",
        "description": "Ranged spell attack, +6 to hit, 3d10 psychic."
      },
      {
        "name": "Erase Memory (Recharge 5-6)",
        "description": "One creature within 30 ft., DC 14 Intelligence save or be stunned until end of its next turn."
      }
    ]
  },
  {
    "id": "cm-ck-canopic-golem",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Candlekeep Mysteries",
    "name": "Canopic Golem",
    "size": "large",
    "type": "construct",
    "alignment": "Unaligned",
    "speed": "20 ft.",
    "challengeRating": 8,
    "ac": 16,
    "acNote": "natural armor",
    "hp": 133,
    "maxHp": 133,
    "abilityScores": {
      "strength": 20,
      "dexterity": 9,
      "constitution": 18,
      "intelligence": 3,
      "wisdom": 11,
      "charisma": 1
    },
    "damageImmunities": [
      "poison",
      "psychic",
      "necrotic"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      },
      {
        "name": "Organ Harvest",
        "description": "When it reduces a creature to 0 hp, it regains 10 hit points."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The golem makes two Slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "2d10+5 bludgeoning"
      },
      {
        "name": "Embalming Breath (Recharge 5-6)",
        "description": "30-foot cone, DC 16 Constitution save, 7d8 poison and poisoned for 1 minute on a failure."
      }
    ]
  },
  {
    "id": "cm-ck-wisteria-arcanaloth",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Candlekeep Mysteries",
    "name": "Vane, the Wisteria Warden",
    "size": "medium",
    "type": "fiend",
    "alignment": "Lawful Evil",
    "speed": "30 ft., fly 30 ft.",
    "challengeRating": 12,
    "ac": 17,
    "acNote": "natural armor",
    "hp": 149,
    "maxHp": 149,
    "abilityScores": {
      "strength": 17,
      "dexterity": 20,
      "constitution": 16,
      "intelligence": 20,
      "wisdom": 16,
      "charisma": 17
    },
    "savingThrows": {
      "intelligence": 10,
      "wisdom": 8,
      "charisma": 8
    },
    "skills": {
      "Arcana": 10,
      "Deception": 8,
      "Insight": 8
    },
    "damageResistances": [
      "cold",
      "fire",
      "lightning"
    ],
    "damageImmunities": [
      "acid",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "poisoned"
    ],
    "senses": {
      "passive Perception": "13"
    },
    "languages": [
      "all",
      "telepathy 60 ft."
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      },
      {
        "name": "Innate Spellcasting",
        "description": "At will: detect magic, disguise self, heat metal, mirror image; 3/day: counterspell, dimension door, hold monster."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The warden makes two Claw attacks."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "2d6+5 slashing plus 2d6 psychic"
      },
      {
        "name": "Teleport (Recharge 5-6)",
        "description": "The warden magically teleports up to 60 feet and casts hold monster (DC 16)."
      }
    ],
    "legendaryActions": [
      {
        "name": "Claw Attack",
        "description": "The warden makes one Claw attack."
      },
      {
        "name": "Teleport (Costs 2)",
        "description": "The warden teleports up to 30 feet."
      },
      {
        "name": "Cast a Spell (Costs 3)",
        "description": "The warden casts an at-will spell."
      }
    ],
    "legendaryActionCount": 3
  },
  {
    "id": "cm-ck-alchemy-devotee",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Candlekeep Mysteries",
    "name": "Devotee of Inner Alchemy",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Neutral",
    "speed": "30 ft.",
    "challengeRating": 4,
    "ac": 15,
    "acNote": "unarmored defense",
    "hp": 67,
    "maxHp": 67,
    "abilityScores": {
      "strength": 12,
      "dexterity": 16,
      "constitution": 14,
      "intelligence": 13,
      "wisdom": 17,
      "charisma": 12
    },
    "savingThrows": {
      "dexterity": 5,
      "wisdom": 5
    },
    "skills": {
      "Acrobatics": 5,
      "Insight": 5
    },
    "senses": {
      "passive Perception": "13"
    },
    "languages": [
      "Common"
    ],
    "traits": [
      {
        "name": "Ki-Empowered Strikes",
        "description": "Unarmed strikes count as magical."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Three unarmed strikes, or two if it uses Elemental Burst."
      },
      {
        "name": "Unarmed Strike",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d8+3 bludgeoning"
      },
      {
        "name": "Elemental Burst (Recharge 4-6)",
        "description": "15-foot cone, DC 13 Dexterity save, 3d8 fire or cold (choice)."
      }
    ]
  },
  {
    "id": "cm-ck-yellowcrest-poltergeist",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Candlekeep Mysteries",
    "name": "Yellowcrest Manor Poltergeist",
    "size": "medium",
    "type": "undead",
    "alignment": "Chaotic Evil",
    "speed": "0 ft., fly 40 ft. (hover)",
    "challengeRating": 3,
    "ac": 12,
    "hp": 44,
    "maxHp": 44,
    "abilityScores": {
      "strength": 1,
      "dexterity": 14,
      "constitution": 11,
      "intelligence": 10,
      "wisdom": 10,
      "charisma": 12
    },
    "damageResistances": [
      "acid",
      "cold",
      "fire",
      "lightning",
      "thunder"
    ],
    "damageImmunities": [
      "necrotic",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "grappled",
      "paralyzed",
      "petrified",
      "prone",
      "restrained"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "traits": [
      {
        "name": "Incorporeal Movement",
        "description": "Can move through creatures and objects as difficult terrain; takes 1d10 force damage if it ends its turn inside an object."
      }
    ],
    "actions": [
      {
        "name": "Telekinetic Thrust",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "3d6 bludgeoning"
      },
      {
        "name": "Forceful Slam (Recharge 4-6)",
        "description": "One creature within 30 ft., DC 12 Strength save or thrown 20 feet and knocked prone."
      }
    ]
  },
  {
    "id": "cm-ck-lurue-corrupted-unicorn",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Candlekeep Mysteries",
    "name": "Corrupted Servant of Lurue",
    "size": "large",
    "type": "celestial",
    "alignment": "Neutral",
    "speed": "50 ft.",
    "challengeRating": 5,
    "ac": 12,
    "hp": 78,
    "maxHp": 78,
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
      "charmed",
      "paralyzed",
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "13"
    },
    "languages": [
      "Celestial",
      "Elvish",
      "Sylvan",
      "telepathy 60 ft."
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Horn attack and one Hooves attack."
      },
      {
        "name": "Horn",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "1d8+4 piercing plus 2d8 radiant"
      },
      {
        "name": "Hooves",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d6+4 bludgeoning"
      }
    ]
  },
  {
    "id": "cm-ck-price-of-beauty-hag",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Candlekeep Mysteries",
    "name": "Sylvan Mirror Hag",
    "size": "medium",
    "type": "fey",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 5,
    "ac": 17,
    "acNote": "natural armor",
    "hp": 82,
    "maxHp": 82,
    "abilityScores": {
      "strength": 16,
      "dexterity": 12,
      "constitution": 16,
      "intelligence": 13,
      "wisdom": 14,
      "charisma": 16
    },
    "skills": {
      "Deception": 6,
      "Perception": 5
    },
    "senses": {
      "passive Perception": "14"
    },
    "languages": [
      "Common",
      "Elvish",
      "Sylvan"
    ],
    "traits": [
      {
        "name": "Mimicry",
        "description": "Can mimic sounds and voices; DC 14 Insight to discern the trick."
      },
      {
        "name": "Vanity Curse",
        "description": "A creature that looks into the hag's mirror must succeed on a DC 14 Wisdom save or be charmed for 24 hours."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Claw attacks."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "2d8+3 slashing"
      },
      {
        "name": "Shatter Reflection (Recharge 5-6)",
        "description": "20-foot radius centered on the hag, DC 14 Charisma save, 4d8 psychic and disadvantage on attacks until end of next turn on a failure."
      }
    ]
  },
  {
    "id": "cm-ck-shemshime",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Candlekeep Mysteries",
    "name": "Shemshime",
    "size": "tiny",
    "type": "fiend",
    "alignment": "Neutral Evil",
    "speed": "20 ft., climb 20 ft.",
    "challengeRating": 4,
    "ac": 14,
    "hp": 52,
    "maxHp": 52,
    "abilityScores": {
      "strength": 7,
      "dexterity": 18,
      "constitution": 13,
      "intelligence": 14,
      "wisdom": 13,
      "charisma": 16
    },
    "skills": {
      "Stealth": 6,
      "Performance": 5
    },
    "damageImmunities": [
      "necrotic",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Common",
      "Infernal"
    ],
    "traits": [
      {
        "name": "Cursed Humming",
        "description": "Any creature that hears Shemshime's tune must succeed on a DC 13 Wisdom save at the start of its turn or waste its action humming along."
      }
    ],
    "actions": [
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "2d4+4 slashing plus 2d6 necrotic"
      },
      {
        "name": "Maddening Refrain (Recharge 5-6)",
        "description": "All creatures within 30 ft., DC 13 Wisdom save, 3d8 psychic and frightened until end of next turn."
      }
    ]
  },
  {
    "id": "cm-ck-alkazaar-mummy-lord",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Candlekeep Mysteries",
    "name": "Alkazaar, Djinn-Bound Mummy",
    "size": "medium",
    "type": "undead",
    "alignment": "Lawful Evil",
    "speed": "20 ft.",
    "challengeRating": 9,
    "ac": 15,
    "acNote": "natural armor",
    "hp": 110,
    "maxHp": 110,
    "abilityScores": {
      "strength": 18,
      "dexterity": 10,
      "constitution": 17,
      "intelligence": 12,
      "wisdom": 18,
      "charisma": 16
    },
    "savingThrows": {
      "wisdom": 8,
      "charisma": 7
    },
    "damageImmunities": [
      "necrotic",
      "poison"
    ],
    "damageVulnerabilities": [
      "fire"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "14"
    },
    "languages": [
      "Common",
      "Auran"
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      },
      {
        "name": "Rejuvenation",
        "description": "Reforms in 24 hours unless its heart is destroyed."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Rotting Fist attack and uses Dreadful Glare."
      },
      {
        "name": "Rotting Fist",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "3d6+4 bludgeoning plus 3d6 necrotic; target can't regain hit points until the end of its next turn"
      },
      {
        "name": "Dreadful Glare",
        "description": "One creature within 60 ft., DC 15 Wisdom save or frightened until end of next turn and paralyzed while frightened this way."
      },
      {
        "name": "Whirlwind (Recharge 5-6)",
        "description": "15-foot radius, DC 15 Strength save, 4d8 bludgeoning and pushed 15 feet."
      }
    ],
    "legendaryActions": [
      {
        "name": "Rotting Fist",
        "description": "One Rotting Fist attack."
      },
      {
        "name": "Dreadful Glare (Costs 2)",
        "description": "Uses Dreadful Glare."
      },
      {
        "name": "Sandstorm (Costs 2)",
        "description": "Difficult terrain and lightly obscured in a 20-foot radius until the mummy's next turn."
      }
    ],
    "legendaryActionCount": 3
  },
  {
    "id": "cm-ck-xanthoria",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Candlekeep Mysteries",
    "name": "Xanthoria, the Lichen Horror",
    "size": "huge",
    "type": "plant",
    "alignment": "Neutral Evil",
    "speed": "20 ft.",
    "challengeRating": 11,
    "ac": 16,
    "acNote": "natural armor",
    "hp": 172,
    "maxHp": 172,
    "abilityScores": {
      "strength": 22,
      "dexterity": 8,
      "constitution": 20,
      "intelligence": 6,
      "wisdom": 13,
      "charisma": 8
    },
    "damageImmunities": [
      "poison"
    ],
    "damageVulnerabilities": [
      "fire"
    ],
    "conditionImmunities": [
      "blinded",
      "deafened",
      "exhaustion",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "passive Perception": "11"
    },
    "traits": [
      {
        "name": "Spore Regeneration",
        "description": "Regains 10 hit points at the start of its turn if it has at least 1 hit point and isn't in sunlight."
      },
      {
        "name": "Spore Cloud",
        "description": "A creature that starts its turn within 10 ft. must succeed on a DC 16 Constitution save or take 2d6 poison and be poisoned until the start of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Bludgeoning Vine attacks and one Engulf."
      },
      {
        "name": "Bludgeoning Vine",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "2d10+6 bludgeoning"
      },
      {
        "name": "Engulf",
        "description": "One Large or smaller creature grappled by Xanthoria is engulfed and restrained, taking 3d6 poison at the start of each of its turns (DC 16 Constitution half)."
      },
      {
        "name": "Choking Spores (Recharge 5-6)",
        "description": "30-foot cone, DC 16 Constitution save, 6d8 poison and blinded until end of next turn on a failure."
      }
    ]
  },
  {
    "id": "cm-ck-extradimensional-thief",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Candlekeep Mysteries",
    "name": "Extradimensional Cutpurse",
    "size": "medium",
    "type": "aberration",
    "alignment": "Chaotic Neutral",
    "speed": "30 ft.",
    "challengeRating": 2,
    "ac": 14,
    "hp": 38,
    "maxHp": 38,
    "abilityScores": {
      "strength": 10,
      "dexterity": 17,
      "constitution": 12,
      "intelligence": 13,
      "wisdom": 12,
      "charisma": 14
    },
    "skills": {
      "Stealth": 6,
      "Sleight of Hand": 6
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Common",
      "Deep Speech"
    ],
    "traits": [
      {
        "name": "Blink Step",
        "description": "As a bonus action, teleports up to 15 feet to an unoccupied space it can see."
      },
      {
        "name": "Sneak Attack",
        "description": "Deals an extra 2d6 damage once per turn against a target it has advantage against."
      }
    ],
    "actions": [
      {
        "name": "Warp Dagger",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d4+3 piercing plus 1d6 force"
      }
    ]
  },
  {
    "id": "cm-rc-night-market-thief",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Journeys Through the Radiant Citadel",
    "name": "Night Market Cutthroat",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 1,
    "ac": 13,
    "hp": 27,
    "maxHp": 27,
    "abilityScores": {
      "strength": 11,
      "dexterity": 15,
      "constitution": 12,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 12
    },
    "skills": {
      "Stealth": 4,
      "Deception": 3
    },
    "senses": {
      "passive Perception": "10"
    },
    "languages": [
      "Common"
    ],
    "traits": [
      {
        "name": "Pack Tactics",
        "description": "Advantage on an attack if an ally is within 5 ft. of the target."
      }
    ],
    "actions": [
      {
        "name": "Kris Blade",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d4+2 piercing plus 1d4 poison"
      },
      {
        "name": "Dart",
        "description": "Ranged Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d4+2 piercing"
      }
    ]
  },
  {
    "id": "cm-rc-hollow-mine-fiend",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Journeys Through the Radiant Citadel",
    "name": "Fiend of the Hollow Mine",
    "size": "large",
    "type": "fiend",
    "alignment": "Chaotic Evil",
    "speed": "40 ft., burrow 20 ft.",
    "challengeRating": 5,
    "ac": 15,
    "acNote": "natural armor",
    "hp": 84,
    "maxHp": 84,
    "abilityScores": {
      "strength": 18,
      "dexterity": 13,
      "constitution": 16,
      "intelligence": 8,
      "wisdom": 12,
      "charisma": 14
    },
    "damageResistances": [
      "cold",
      "fire",
      "lightning"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "poisoned"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Abyssal",
      "telepathy 60 ft."
    ],
    "traits": [
      {
        "name": "Sunlight Sensitivity",
        "description": "Disadvantage on attacks and Perception checks in sunlight."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and two Claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d10+4 piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d6+4 slashing"
      }
    ]
  },
  {
    "id": "cm-rc-vice-lord",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Journeys Through the Radiant Citadel",
    "name": "Vice-Lord of Zinda",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 6,
    "ac": 16,
    "acNote": "studded leather",
    "hp": 97,
    "maxHp": 97,
    "abilityScores": {
      "strength": 12,
      "dexterity": 16,
      "constitution": 15,
      "intelligence": 14,
      "wisdom": 13,
      "charisma": 18
    },
    "savingThrows": {
      "dexterity": 6,
      "charisma": 7
    },
    "skills": {
      "Deception": 7,
      "Intimidation": 7,
      "Persuasion": 7
    },
    "senses": {
      "passive Perception": "11"
    },
    "languages": [
      "Common",
      "Infernal"
    ],
    "traits": [
      {
        "name": "Cheat the Odds",
        "description": "When the vice-lord fails a saving throw, it can reroll and use the new result (1/turn)."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Three Rapier attacks."
      },
      {
        "name": "Rapier",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "1d8+3 piercing plus 1d6 poison"
      },
      {
        "name": "Command Retinue",
        "description": "Up to three allied creatures the vice-lord can see can use their reaction to make one weapon attack."
      }
    ]
  },
  {
    "id": "cm-rc-spirit-of-the-sun-trials",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Journeys Through the Radiant Citadel",
    "name": "Sun-Trial Warden",
    "size": "large",
    "type": "celestial",
    "alignment": "Lawful Neutral",
    "speed": "40 ft.",
    "challengeRating": 7,
    "ac": 17,
    "acNote": "natural armor",
    "hp": 114,
    "maxHp": 114,
    "abilityScores": {
      "strength": 19,
      "dexterity": 14,
      "constitution": 17,
      "intelligence": 12,
      "wisdom": 16,
      "charisma": 15
    },
    "savingThrows": {
      "wisdom": 6,
      "charisma": 5
    },
    "damageResistances": [
      "radiant"
    ],
    "damageImmunities": [
      "fire",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "passive Perception": "13"
    },
    "languages": [
      "Celestial",
      "Common"
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      },
      {
        "name": "Solar Weapons",
        "description": "Weapon attacks are magical and deal an extra 2d8 radiant (included below)."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Sunspear attacks."
      },
      {
        "name": "Sunspear",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "1d8+4 piercing plus 2d8 radiant"
      },
      {
        "name": "Blinding Flare (Recharge 5-6)",
        "description": "30-foot cone, DC 15 Constitution save, 6d6 radiant and blinded until end of next turn on a failure."
      }
    ]
  },
  {
    "id": "cm-rc-buried-dynasty-revenant",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Journeys Through the Radiant Citadel",
    "name": "Buried Dynasty Revenant",
    "size": "medium",
    "type": "undead",
    "alignment": "Lawful Neutral",
    "speed": "30 ft.",
    "challengeRating": 5,
    "ac": 16,
    "acNote": "ancient plate",
    "hp": 90,
    "maxHp": 90,
    "abilityScores": {
      "strength": 18,
      "dexterity": 12,
      "constitution": 18,
      "intelligence": 10,
      "wisdom": 14,
      "charisma": 16
    },
    "damageImmunities": [
      "necrotic",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "poisoned",
      "stunned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "Common"
    ],
    "traits": [
      {
        "name": "Regeneration",
        "description": "Regains 10 hit points at the start of its turn if it has at least 1 hit point."
      },
      {
        "name": "Vengeful Tracker",
        "description": "Knows the direction to the creature that killed it in life, if on the same plane."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Dynasty Blade attacks."
      },
      {
        "name": "Dynasty Blade",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d6+4 slashing plus 1d8 necrotic"
      }
    ]
  },
  {
    "id": "cm-rc-manivarsha-naga",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Journeys Through the Radiant Citadel",
    "name": "Naga of the Tangled Waters",
    "size": "large",
    "type": "monstrosity",
    "alignment": "Lawful Good",
    "speed": "30 ft., swim 40 ft.",
    "challengeRating": 8,
    "ac": 16,
    "acNote": "natural armor",
    "hp": 127,
    "maxHp": 127,
    "abilityScores": {
      "strength": 17,
      "dexterity": 16,
      "constitution": 18,
      "intelligence": 16,
      "wisdom": 15,
      "charisma": 18
    },
    "savingThrows": {
      "dexterity": 7,
      "constitution": 8,
      "wisdom": 6,
      "charisma": 8
    },
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "Celestial",
      "Common"
    ],
    "traits": [
      {
        "name": "Rejuvenation",
        "description": "Returns to life in 1d6 days if slain."
      },
      {
        "name": "Innate Spellcasting",
        "description": "At will: mage hand, minor illusion, water breathing; 3/day: lightning bolt, tongues; 1/day: geas."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "2d8+3 piercing plus 4d8 poison"
      },
      {
        "name": "Water Jet (Recharge 5-6)",
        "description": "60-foot line, DC 16 Dexterity save, 6d10 bludgeoning and pushed 20 feet on a failure."
      }
    ]
  },
  {
    "id": "cm-rc-invisible-mountain-orchid",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Journeys Through the Radiant Citadel",
    "name": "Orchid Wraith of the Invisible Mountain",
    "size": "medium",
    "type": "plant",
    "alignment": "Neutral",
    "speed": "20 ft., fly 30 ft. (hover)",
    "challengeRating": 6,
    "ac": 14,
    "hp": 85,
    "maxHp": 85,
    "abilityScores": {
      "strength": 10,
      "dexterity": 17,
      "constitution": 14,
      "intelligence": 12,
      "wisdom": 16,
      "charisma": 17
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "blinded",
      "deafened",
      "exhaustion",
      "poisoned"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "passive Perception": "13"
    },
    "languages": [
      "Sylvan"
    ],
    "traits": [
      {
        "name": "Pollen Veil",
        "description": "The wraith is invisible while it hasn't attacked this turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Thorn Lash attacks."
      },
      {
        "name": "Thorn Lash",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "2d6+3 piercing plus 2d6 poison"
      },
      {
        "name": "Rapture Spores (Recharge 5-6)",
        "description": "15-foot radius, DC 14 Wisdom save, charmed for 1 minute (repeat save at end of each turn)."
      }
    ]
  },
  {
    "id": "cm-rc-siabsungkoh-elder",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Journeys Through the Radiant Citadel",
    "name": "Elder of Siabsungkoh",
    "size": "medium",
    "type": "fey",
    "alignment": "Neutral",
    "speed": "30 ft.",
    "challengeRating": 4,
    "ac": 15,
    "hp": 71,
    "maxHp": 71,
    "abilityScores": {
      "strength": 13,
      "dexterity": 14,
      "constitution": 15,
      "intelligence": 15,
      "wisdom": 18,
      "charisma": 16
    },
    "savingThrows": {
      "wisdom": 6
    },
    "skills": {
      "Nature": 5,
      "Insight": 6
    },
    "senses": {
      "passive Perception": "16"
    },
    "languages": [
      "Common",
      "Sylvan"
    ],
    "traits": [
      {
        "name": "Ancestral Debt",
        "description": "When an ally within 30 ft. is reduced to 0 hp, the elder can spend its reaction to give it 10 temporary hit points instead."
      }
    ],
    "actions": [
      {
        "name": "Rootspear",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d8+2 piercing plus 1d8 force"
      },
      {
        "name": "Bind the Ungrateful (Recharge 4-6)",
        "description": "One creature within 60 ft., DC 14 Charisma save or restrained by grasping roots for 1 minute."
      }
    ]
  },
  {
    "id": "cm-rc-tletepec-warlock",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Journeys Through the Radiant Citadel",
    "name": "Tletepec Coil Warlock",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 4,
    "ac": 13,
    "hp": 58,
    "maxHp": 58,
    "abilityScores": {
      "strength": 10,
      "dexterity": 14,
      "constitution": 13,
      "intelligence": 12,
      "wisdom": 12,
      "charisma": 17
    },
    "savingThrows": {
      "wisdom": 3,
      "charisma": 5
    },
    "skills": {
      "Deception": 5,
      "Arcana": 3
    },
    "senses": {
      "passive Perception": "11"
    },
    "languages": [
      "Common",
      "Abyssal"
    ],
    "actions": [
      {
        "name": "Eldritch Blast",
        "description": "Two ranged spell attacks, +5 to hit, 1d10 force each."
      },
      {
        "name": "Hunger of the Mine (Recharge 5-6)",
        "description": "20-foot radius within 60 ft., DC 13 Dexterity save, 4d8 necrotic and speed halved until end of next turn."
      }
    ]
  },
  {
    "id": "cm-rc-wandering-emporium-guard",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Journeys Through the Radiant Citadel",
    "name": "Concordant Express Marshal",
    "size": "medium",
    "type": "construct",
    "alignment": "Lawful Neutral",
    "speed": "30 ft.",
    "challengeRating": 3,
    "ac": 18,
    "acNote": "plated frame",
    "hp": 60,
    "maxHp": 60,
    "abilityScores": {
      "strength": 16,
      "dexterity": 12,
      "constitution": 16,
      "intelligence": 8,
      "wisdom": 11,
      "charisma": 6
    },
    "damageImmunities": [
      "poison",
      "psychic"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "understands Common but can't speak"
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Baton attacks."
      },
      {
        "name": "Shock Baton",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d10+3 bludgeoning plus 1d6 lightning"
      },
      {
        "name": "Restraining Field (Recharge 6)",
        "description": "One creature within 15 ft., DC 13 Strength save or restrained until end of its next turn."
      }
    ]
  },
  {
    "id": "cm-rc-moonrise-lycanthrope",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Journeys Through the Radiant Citadel",
    "name": "Song of Moonrise Werebeast",
    "size": "medium",
    "type": "monstrosity",
    "alignment": "Chaotic Neutral",
    "speed": "40 ft.",
    "challengeRating": 4,
    "ac": 14,
    "hp": 66,
    "maxHp": 66,
    "abilityScores": {
      "strength": 17,
      "dexterity": 15,
      "constitution": 15,
      "intelligence": 10,
      "wisdom": 13,
      "charisma": 11
    },
    "damageImmunities": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "conditionImmunities": [
      "charmed"
    ],
    "senses": {
      "passive Perception": "11"
    },
    "traits": [
      {
        "name": "Moonlit Frenzy",
        "description": "While in moonlight, the werebeast has advantage on melee attacks."
      },
      {
        "name": "Curse of the Song",
        "description": "A humanoid reduced to 0 hp by its bite but not killed is cursed with lycanthropy."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and two Claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d10+3 piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "2d4+3 slashing"
      }
    ]
  },
  {
    "id": "cm-rc-djaynai-storm-herald",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Journeys Through the Radiant Citadel",
    "name": "Storm Herald of Djaynai",
    "size": "large",
    "type": "elemental",
    "alignment": "Neutral",
    "speed": "30 ft., fly 60 ft.",
    "challengeRating": 9,
    "ac": 15,
    "hp": 138,
    "maxHp": 138,
    "abilityScores": {
      "strength": 18,
      "dexterity": 18,
      "constitution": 17,
      "intelligence": 10,
      "wisdom": 14,
      "charisma": 13
    },
    "savingThrows": {
      "dexterity": 8,
      "constitution": 7
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "lightning",
      "thunder",
      "poison"
    ],
    "conditionImmunities": [
      "exhaustion",
      "paralyzed",
      "petrified",
      "poisoned",
      "prone",
      "unconscious"
    ],
    "senses": {
      "passive Perception": "12"
    },
    "languages": [
      "Auran"
    ],
    "traits": [
      {
        "name": "Storm Body",
        "description": "A creature that touches the herald or hits it with a melee attack while within 5 ft. takes 1d10 lightning."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Thunder Slam attacks."
      },
      {
        "name": "Thunder Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "2d8+4 bludgeoning plus 2d8 thunder"
      },
      {
        "name": "Chain Lightning (Recharge 5-6)",
        "description": "Up to four creatures within 60 ft., DC 16 Dexterity save, 8d6 lightning (half on success)."
      }
    ]
  },
  {
    "id": "cm-rc-gold-guardian",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Journeys Through the Radiant Citadel",
    "name": "Guardian of Fools and Princes",
    "size": "large",
    "type": "construct",
    "alignment": "Unaligned",
    "speed": "25 ft.",
    "challengeRating": 7,
    "ac": 17,
    "acNote": "gilded plate",
    "hp": 115,
    "maxHp": 115,
    "abilityScores": {
      "strength": 20,
      "dexterity": 9,
      "constitution": 18,
      "intelligence": 3,
      "wisdom": 11,
      "charisma": 1
    },
    "damageImmunities": [
      "poison",
      "psychic",
      "fire"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned"
    ],
    "senses": {
      "passive Perception": "10"
    },
    "traits": [
      {
        "name": "Immutable Form",
        "description": "Immune to any spell or effect that would alter its form."
      },
      {
        "name": "Molten Core",
        "description": "When it takes fire damage, its next Slam deals an extra 2d6 fire."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "2d10+5 bludgeoning"
      },
      {
        "name": "Gold Spray (Recharge 5-6)",
        "description": "30-foot cone of molten gold, DC 15 Dexterity save, 6d6 fire and restrained (AC-hardening) on a failure."
      }
    ]
  },
  {
    "id": "cm-rc-hollow-mine-cult-leader",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Journeys Through the Radiant Citadel",
    "name": "Nightmare of the Hollow Mine",
    "size": "medium",
    "type": "fiend",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 8,
    "ac": 16,
    "acNote": "natural armor",
    "hp": 120,
    "maxHp": 120,
    "abilityScores": {
      "strength": 14,
      "dexterity": 17,
      "constitution": 16,
      "intelligence": 15,
      "wisdom": 14,
      "charisma": 19
    },
    "savingThrows": {
      "charisma": 8,
      "wisdom": 6
    },
    "damageResistances": [
      "cold",
      "fire",
      "lightning",
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "Abyssal",
      "Common",
      "telepathy 60 ft."
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      },
      {
        "name": "Fear Aura",
        "description": "A creature that starts its turn within 20 ft. must succeed on a DC 16 Wisdom save or be frightened until the start of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Claw and one Draining Kiss."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "2d8+3 slashing"
      },
      {
        "name": "Draining Kiss",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "3d6+3 psychic; the target's hit point maximum is reduced by an equal amount"
      }
    ],
    "legendaryActions": [
      {
        "name": "Claw",
        "description": "One Claw attack."
      },
      {
        "name": "Teleport (Costs 2)",
        "description": "The nightmare teleports up to 60 feet."
      },
      {
        "name": "Terrify (Costs 2)",
        "description": "Each creature within 20 ft. repeats the save against its Fear Aura or is frightened for 1 minute."
      }
    ],
    "legendaryActionCount": 3
  },
  {
    "id": "cm-rc-akharin-sangar-champion",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Journeys Through the Radiant Citadel",
    "name": "Champion of Akharin Sangar",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Neutral",
    "speed": "30 ft.",
    "challengeRating": 5,
    "ac": 18,
    "acNote": "plate",
    "hp": 82,
    "maxHp": 82,
    "abilityScores": {
      "strength": 18,
      "dexterity": 13,
      "constitution": 16,
      "intelligence": 11,
      "wisdom": 13,
      "charisma": 14
    },
    "savingThrows": {
      "strength": 7,
      "constitution": 6
    },
    "senses": {
      "passive Perception": "11"
    },
    "languages": [
      "Common"
    ],
    "traits": [
      {
        "name": "Duel Focus",
        "description": "While no more than one creature is within 5 ft. of it, the champion has +2 AC (included) and advantage on Strength saves."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Three Greatsword attacks."
      },
      {
        "name": "Greatsword",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d6+4 slashing"
      },
      {
        "name": "Honor Guard (Recharge 5-6)",
        "description": "Until its next turn, attacks against allies within 10 ft. have disadvantage."
      }
    ]
  },
  {
    "id": "cm-gv-museum-guard",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Keys from the Golden Vault",
    "name": "Murkveil Museum Guard",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Neutral",
    "speed": "30 ft.",
    "challengeRating": 1,
    "ac": 16,
    "acNote": "chain shirt, shield",
    "hp": 22,
    "maxHp": 22,
    "abilityScores": {
      "strength": 15,
      "dexterity": 11,
      "constitution": 13,
      "intelligence": 10,
      "wisdom": 12,
      "charisma": 10
    },
    "senses": {
      "passive Perception": "11"
    },
    "languages": [
      "Common"
    ],
    "actions": [
      {
        "name": "Truncheon",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 bludgeoning"
      },
      {
        "name": "Light Crossbow",
        "description": "Ranged Weapon Attack",
        "attackBonus": 2,
        "damageDescription": "1d8 piercing"
      }
    ]
  },
  {
    "id": "cm-gv-clockwork-sentinel",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Keys from the Golden Vault",
    "name": "Tockworth Clockwork Sentinel",
    "size": "small",
    "type": "construct",
    "alignment": "Unaligned",
    "speed": "25 ft.",
    "challengeRating": 2,
    "ac": 15,
    "hp": 33,
    "maxHp": 33,
    "abilityScores": {
      "strength": 12,
      "dexterity": 14,
      "constitution": 12,
      "intelligence": 4,
      "wisdom": 10,
      "charisma": 4
    },
    "damageImmunities": [
      "poison",
      "psychic"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "traits": [
      {
        "name": "Whirring Alarm",
        "description": "On its first turn in combat, emits a shriek audible 300 feet away."
      }
    ],
    "actions": [
      {
        "name": "Buzzsaw Arm",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d8+2 slashing"
      },
      {
        "name": "Static Discharge (Recharge 6)",
        "description": "5-foot radius, DC 12 Dexterity save, 2d6 lightning."
      }
    ]
  },
  {
    "id": "cm-gv-stygian-imp-dealer",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Keys from the Golden Vault",
    "name": "Stygian Casino Croupier",
    "size": "small",
    "type": "fiend",
    "alignment": "Lawful Evil",
    "speed": "20 ft., fly 40 ft.",
    "challengeRating": 3,
    "ac": 13,
    "hp": 44,
    "maxHp": 44,
    "abilityScores": {
      "strength": 8,
      "dexterity": 16,
      "constitution": 12,
      "intelligence": 14,
      "wisdom": 12,
      "charisma": 15
    },
    "skills": {
      "Deception": 6,
      "Insight": 4
    },
    "damageResistances": [
      "cold"
    ],
    "damageImmunities": [
      "fire",
      "poison"
    ],
    "conditionImmunities": [
      "poisoned"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Infernal",
      "Common",
      "telepathy 60 ft."
    ],
    "traits": [
      {
        "name": "Rigged Deck",
        "description": "Once per turn, can force a creature within 30 ft. to reroll a d20 and take the lower result."
      }
    ],
    "actions": [
      {
        "name": "Stinger",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d6+3 piercing plus 2d6 poison"
      },
      {
        "name": "Marked Card (Recharge 5-6)",
        "description": "One creature within 60 ft., DC 12 Charisma save or cursed: attack rolls against it have advantage for 1 minute."
      }
    ]
  },
  {
    "id": "cm-gv-vault-golem",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Keys from the Golden Vault",
    "name": "Vidorant's Vault Golem",
    "size": "large",
    "type": "construct",
    "alignment": "Unaligned",
    "speed": "20 ft.",
    "challengeRating": 6,
    "ac": 17,
    "acNote": "reinforced plate",
    "hp": 102,
    "maxHp": 102,
    "abilityScores": {
      "strength": 19,
      "dexterity": 9,
      "constitution": 18,
      "intelligence": 3,
      "wisdom": 11,
      "charisma": 1
    },
    "damageImmunities": [
      "poison",
      "psychic",
      "necrotic"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned"
    ],
    "senses": {
      "passive Perception": "10"
    },
    "traits": [
      {
        "name": "Immutable Form",
        "description": "Immune to effects that alter its form."
      },
      {
        "name": "Antimagic Susceptibility",
        "description": "Incapacitated while in an antimagic field."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d8+4 bludgeoning"
      },
      {
        "name": "Lockdown Slam (Recharge 6)",
        "description": "One creature within 5 ft., DC 15 Strength save or restrained by clamps until it escapes (DC 15)."
      }
    ]
  },
  {
    "id": "cm-gv-astral-express-marauder",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Keys from the Golden Vault",
    "name": "Concordant Express Marauder",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Chaotic Neutral",
    "speed": "30 ft.",
    "challengeRating": 4,
    "ac": 15,
    "acNote": "studded leather",
    "hp": 60,
    "maxHp": 60,
    "abilityScores": {
      "strength": 13,
      "dexterity": 17,
      "constitution": 14,
      "intelligence": 11,
      "wisdom": 12,
      "charisma": 13
    },
    "skills": {
      "Acrobatics": 5,
      "Stealth": 5
    },
    "senses": {
      "passive Perception": "11"
    },
    "languages": [
      "Common"
    ],
    "traits": [
      {
        "name": "Train-Runner",
        "description": "Ignores difficult terrain caused by moving vehicles and has advantage on saves to avoid falling off one."
      },
      {
        "name": "Sneak Attack",
        "description": "Extra 2d6 damage once per turn with advantage."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Shortsword attacks."
      },
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d6+3 piercing"
      },
      {
        "name": "Hand Crossbow",
        "description": "Ranged Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d6+3 piercing"
      }
    ]
  },
  {
    "id": "cm-gv-accursed-shard-elemental",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Keys from the Golden Vault",
    "name": "Shard of the Accursed",
    "size": "large",
    "type": "elemental",
    "alignment": "Neutral Evil",
    "speed": "0 ft., fly 40 ft. (hover)",
    "challengeRating": 7,
    "ac": 16,
    "hp": 105,
    "maxHp": 105,
    "abilityScores": {
      "strength": 10,
      "dexterity": 18,
      "constitution": 16,
      "intelligence": 14,
      "wisdom": 13,
      "charisma": 16
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "necrotic",
      "poison"
    ],
    "conditionImmunities": [
      "exhaustion",
      "grappled",
      "paralyzed",
      "petrified",
      "poisoned",
      "prone",
      "restrained"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Deep Speech"
    ],
    "traits": [
      {
        "name": "Curse Radiance",
        "description": "A creature that starts its turn within 10 ft. must succeed on a DC 15 Charisma save or have disadvantage on its next attack roll or ability check."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Cursed Touch attacks."
      },
      {
        "name": "Cursed Touch",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d8+4 necrotic"
      },
      {
        "name": "Misfortune Burst (Recharge 5-6)",
        "description": "20-foot radius, DC 15 Wisdom save, 6d8 psychic and the creature must use the lower of two d20 rolls until end of its next turn."
      }
    ]
  },
  {
    "id": "cm-gv-efreeti-fortress-warden",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Keys from the Golden Vault",
    "name": "Efreeti Fortress Warden",
    "size": "large",
    "type": "elemental",
    "alignment": "Lawful Evil",
    "speed": "40 ft., fly 60 ft.",
    "challengeRating": 9,
    "ac": 17,
    "acNote": "brass scale",
    "hp": 150,
    "maxHp": 150,
    "abilityScores": {
      "strength": 22,
      "dexterity": 12,
      "constitution": 20,
      "intelligence": 15,
      "wisdom": 15,
      "charisma": 16
    },
    "savingThrows": {
      "intelligence": 6,
      "wisdom": 6,
      "charisma": 7
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "Ignan"
    ],
    "traits": [
      {
        "name": "Innate Spellcasting",
        "description": "At will: detect magic; 3/day: enlarge, tongues, wall of fire; 1/day: gaseous form, plane shift."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Scimitar attacks or two Hurl Flame attacks."
      },
      {
        "name": "Scimitar",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "2d6+6 slashing plus 2d6 fire"
      },
      {
        "name": "Hurl Flame",
        "description": "Ranged spell attack, +7 to hit, range 120 ft., 5d6 fire."
      }
    ]
  },
  {
    "id": "cm-gv-golden-vault-inside-agent",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Keys from the Golden Vault",
    "name": "Turncoat Vault Agent",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 5,
    "ac": 15,
    "acNote": "studded leather",
    "hp": 71,
    "maxHp": 71,
    "abilityScores": {
      "strength": 11,
      "dexterity": 16,
      "constitution": 13,
      "intelligence": 15,
      "wisdom": 13,
      "charisma": 14
    },
    "savingThrows": {
      "dexterity": 6,
      "intelligence": 5
    },
    "skills": {
      "Deception": 5,
      "Investigation": 5,
      "Stealth": 6
    },
    "senses": {
      "passive Perception": "11"
    },
    "languages": [
      "Common",
      "Thieves' Cant"
    ],
    "traits": [
      {
        "name": "Evasion",
        "description": "Takes no damage on a successful Dexterity save for half, half on a failure."
      },
      {
        "name": "Sneak Attack",
        "description": "Extra 3d6 damage once per turn with advantage."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Poisoned Dagger attacks."
      },
      {
        "name": "Poisoned Dagger",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "1d4+3 piercing plus 2d6 poison"
      },
      {
        "name": "Smoke Bomb (Recharge 5-6)",
        "description": "Creates a 15-foot-radius cloud of smoke; the agent takes the Hide action as part of this action."
      }
    ]
  },
  {
    "id": "cm-gv-heart-of-ashes-cultist",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Keys from the Golden Vault",
    "name": "Cinder Cult Zealot",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 2,
    "ac": 12,
    "hp": 39,
    "maxHp": 39,
    "abilityScores": {
      "strength": 12,
      "dexterity": 13,
      "constitution": 14,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 12
    },
    "damageResistances": [
      "fire"
    ],
    "senses": {
      "passive Perception": "10"
    },
    "languages": [
      "Common",
      "Ignan"
    ],
    "traits": [
      {
        "name": "Burning Fervor",
        "description": "When it dies, each creature within 5 ft. takes 2d6 fire (DC 12 Dexterity half)."
      }
    ],
    "actions": [
      {
        "name": "Ember Blade",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d8+1 slashing plus 1d6 fire"
      }
    ]
  },
  {
    "id": "cm-gv-observatory-star-spawn",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Keys from the Golden Vault",
    "name": "Observatory Star Spawn",
    "size": "medium",
    "type": "aberration",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 5,
    "ac": 14,
    "hp": 71,
    "maxHp": 71,
    "abilityScores": {
      "strength": 11,
      "dexterity": 14,
      "constitution": 15,
      "intelligence": 17,
      "wisdom": 13,
      "charisma": 12
    },
    "damageResistances": [
      "cold"
    ],
    "damageImmunities": [
      "psychic"
    ],
    "conditionImmunities": [
      "charmed",
      "frightened"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Deep Speech",
      "telepathy 60 ft."
    ],
    "traits": [
      {
        "name": "Whispers of Madness",
        "description": "A creature that starts its turn within 10 ft. takes 1d6 psychic."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Claw attacks and one Psychic Lance."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d8+2 slashing"
      },
      {
        "name": "Psychic Lance",
        "description": "Ranged spell attack, +5 to hit, 3d6 psychic and target can't take reactions until end of its next turn."
      }
    ]
  },
  {
    "id": "cm-gv-masterpiece-mimic",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Keys from the Golden Vault",
    "name": "Masterpiece Frame Mimic",
    "size": "medium",
    "type": "monstrosity",
    "alignment": "Neutral",
    "speed": "15 ft.",
    "challengeRating": 3,
    "ac": 12,
    "acNote": "natural armor",
    "hp": 58,
    "maxHp": 58,
    "abilityScores": {
      "strength": 16,
      "dexterity": 12,
      "constitution": 15,
      "intelligence": 5,
      "wisdom": 11,
      "charisma": 8
    },
    "skills": {
      "Stealth": 5
    },
    "damageImmunities": [
      "acid"
    ],
    "conditionImmunities": [
      "prone"
    ],
    "senses": {
      "passive Perception": "10"
    },
    "traits": [
      {
        "name": "Adhesive",
        "description": "Adheres to anything that touches it; a creature is grappled (escape DC 13)."
      },
      {
        "name": "False Appearance",
        "description": "Indistinguishable from a framed painting while motionless."
      }
    ],
    "actions": [
      {
        "name": "Pseudopod",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d8+3 bludgeoning plus 1d8 acid"
      }
    ]
  },
  {
    "id": "cm-gv-prisoner-13",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Keys from the Golden Vault",
    "name": "Prisoner 13",
    "size": "medium",
    "type": "undead",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 6,
    "ac": 15,
    "hp": 82,
    "maxHp": 82,
    "abilityScores": {
      "strength": 16,
      "dexterity": 16,
      "constitution": 15,
      "intelligence": 12,
      "wisdom": 13,
      "charisma": 15
    },
    "damageImmunities": [
      "necrotic",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Common"
    ],
    "traits": [
      {
        "name": "Vengeful Revenant",
        "description": "Regains 10 hit points at the start of its turn unless it took radiant damage or was in sunlight since its last turn."
      },
      {
        "name": "Turn Immunity",
        "description": "Immune to effects that turn undead."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Shiv attacks."
      },
      {
        "name": "Prison Shiv",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "2d6+3 piercing plus 2d6 necrotic"
      },
      {
        "name": "Chilling Wail (Recharge 5-6)",
        "description": "30-foot cone, DC 14 Constitution save, 4d8 cold and frightened until end of next turn on a failure."
      }
    ]
  },
  {
    "id": "cm-gv-golden-vault-mastermind",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Keys from the Golden Vault",
    "name": "Rival Heist Mastermind",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 8,
    "ac": 16,
    "acNote": "mithral shirt",
    "hp": 105,
    "maxHp": 105,
    "abilityScores": {
      "strength": 12,
      "dexterity": 18,
      "constitution": 14,
      "intelligence": 17,
      "wisdom": 14,
      "charisma": 16
    },
    "savingThrows": {
      "dexterity": 8,
      "intelligence": 7
    },
    "skills": {
      "Deception": 7,
      "Investigation": 8,
      "Perception": 6,
      "Stealth": 8
    },
    "senses": {
      "passive Perception": "14"
    },
    "languages": [
      "Common",
      "Thieves' Cant",
      "two others"
    ],
    "traits": [
      {
        "name": "Legendary Resistance (2/Day)",
        "description": "If it fails a save, it can choose to succeed instead."
      },
      {
        "name": "Cunning Action",
        "description": "Can Dash, Disengage, or Hide as a bonus action."
      },
      {
        "name": "Sneak Attack",
        "description": "Extra 4d6 damage once per turn with advantage."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Three Rapier attacks."
      },
      {
        "name": "Rapier",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "1d8+4 piercing"
      },
      {
        "name": "Contingency Trap (Recharge 5-6)",
        "description": "Triggers a pre-placed trap: 20-foot cube, DC 15 Dexterity save, 6d6 of a chosen type and restrained on a failure."
      }
    ],
    "legendaryActions": [
      {
        "name": "Rapier",
        "description": "One Rapier attack."
      },
      {
        "name": "Move",
        "description": "The mastermind moves up to its speed without provoking opportunity attacks."
      },
      {
        "name": "Command Ally (Costs 2)",
        "description": "One allied creature it can see makes one weapon attack as a reaction."
      }
    ],
    "legendaryActionCount": 3
  },
  {
    "id": "cm-gv-fire-and-darkness-salamander",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Keys from the Golden Vault",
    "name": "Fortress Salamander Guard",
    "size": "large",
    "type": "elemental",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 5,
    "ac": 15,
    "acNote": "natural armor",
    "hp": 90,
    "maxHp": 90,
    "abilityScores": {
      "strength": 18,
      "dexterity": 14,
      "constitution": 15,
      "intelligence": 11,
      "wisdom": 10,
      "charisma": 12
    },
    "damageImmunities": [
      "fire"
    ],
    "damageVulnerabilities": [
      "cold"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Ignan"
    ],
    "traits": [
      {
        "name": "Heated Body",
        "description": "A creature that touches it or hits it with a melee attack within 5 ft. takes 1d6 fire."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Spear attacks and one Tail attack."
      },
      {
        "name": "Spear",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d6+4 piercing plus 1d6 fire"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d6+4 bludgeoning and target is grappled (escape DC 14)"
      }
    ]
  },
  {
    "id": "cm-gv-murkmire-relic-guardian",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Keys from the Golden Vault",
    "name": "Murkmire Relic Guardian",
    "size": "medium",
    "type": "construct",
    "alignment": "Unaligned",
    "speed": "0 ft., fly 30 ft. (hover)",
    "challengeRating": 4,
    "ac": 16,
    "acNote": "obsidian shell",
    "hp": 65,
    "maxHp": 65,
    "abilityScores": {
      "strength": 10,
      "dexterity": 16,
      "constitution": 14,
      "intelligence": 12,
      "wisdom": 14,
      "charisma": 10
    },
    "damageImmunities": [
      "poison",
      "psychic"
    ],
    "conditionImmunities": [
      "blinded",
      "charmed",
      "deafened",
      "exhaustion",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned",
      "prone"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "passive Perception": "12"
    },
    "traits": [
      {
        "name": "Warding Sphere",
        "description": "Allied constructs within 20 ft. have resistance to the first instance of damage they take each round."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Force Bolt attacks."
      },
      {
        "name": "Force Bolt",
        "description": "Ranged spell attack, +6 to hit, range 60 ft., 2d8 force."
      },
      {
        "name": "Repulsion Wave (Recharge 5-6)",
        "description": "15-foot radius, DC 14 Strength save, pushed 15 feet and knocked prone."
      }
    ]
  },
  {
    "id": "cm-yp-twig-blight-swarm",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Tales from the Yawning Portal",
    "name": "Twig Blight Cluster",
    "size": "medium",
    "type": "plant",
    "alignment": "Neutral Evil",
    "speed": "20 ft.",
    "challengeRating": 1,
    "ac": 13,
    "hp": 27,
    "maxHp": 27,
    "abilityScores": {
      "strength": 6,
      "dexterity": 13,
      "constitution": 12,
      "intelligence": 4,
      "wisdom": 8,
      "charisma": 3
    },
    "damageVulnerabilities": [
      "fire"
    ],
    "conditionImmunities": [
      "blinded",
      "deafened"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "passive Perception": "9"
    },
    "traits": [
      {
        "name": "False Appearance",
        "description": "Indistinguishable from a dead shrub while motionless."
      }
    ],
    "actions": [
      {
        "name": "Claws",
        "description": "Melee Weapon Attack",
        "attackBonus": 3,
        "damageDescription": "2d6 slashing, or 1d6 if bloodied"
      }
    ]
  },
  {
    "id": "cm-yp-belak-druid",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Tales from the Yawning Portal",
    "name": "Belak the Outcast",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 4,
    "ac": 13,
    "acNote": "leather armor",
    "hp": 55,
    "maxHp": 55,
    "abilityScores": {
      "strength": 10,
      "dexterity": 14,
      "constitution": 13,
      "intelligence": 12,
      "wisdom": 17,
      "charisma": 11
    },
    "savingThrows": {
      "wisdom": 5
    },
    "skills": {
      "Nature": 4,
      "Survival": 5
    },
    "senses": {
      "passive Perception": "13"
    },
    "languages": [
      "Common",
      "Druidic",
      "Sylvan"
    ],
    "traits": [
      {
        "name": "Gulthias Tree Bond",
        "description": "While within 60 ft. of the Gulthias Tree, Belak regains 5 hit points at the start of his turn."
      }
    ],
    "actions": [
      {
        "name": "Blightwood Staff",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d8+2 bludgeoning plus 1d6 necrotic"
      },
      {
        "name": "Entangle",
        "description": "20-foot square within 90 ft., DC 13 Strength save or restrained."
      },
      {
        "name": "Insect Plague (1/day)",
        "description": "20-foot radius within 120 ft., DC 13 Constitution save, 4d10 piercing (half on success)."
      }
    ]
  },
  {
    "id": "cm-yp-duergar-forgemaster",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Tales from the Yawning Portal",
    "name": "Forge of Fury Duergar Smith",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "25 ft.",
    "challengeRating": 3,
    "ac": 18,
    "acNote": "plate",
    "hp": 49,
    "maxHp": 49,
    "abilityScores": {
      "strength": 16,
      "dexterity": 11,
      "constitution": 15,
      "intelligence": 11,
      "wisdom": 10,
      "charisma": 9
    },
    "damageResistances": [
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "paralyzed"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Dwarvish",
      "Undercommon"
    ],
    "traits": [
      {
        "name": "Sunlight Sensitivity",
        "description": "Disadvantage on attacks and Perception in sunlight."
      },
      {
        "name": "Enlarge (Recharge after Short/Long Rest)",
        "description": "For 1 minute, the smith is Large; attacks deal an extra 1d8 damage (included)."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two War Pick attacks."
      },
      {
        "name": "War Pick",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d8+3 piercing plus 1d8 (enlarged)"
      },
      {
        "name": "Invisibility (1/day)",
        "description": "The smith turns invisible until it attacks or concentration ends."
      }
    ]
  },
  {
    "id": "cm-yp-mountain-troll",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Tales from the Yawning Portal",
    "name": "Stone Tooth Mountain Troll",
    "size": "large",
    "type": "giant",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 5,
    "ac": 15,
    "acNote": "natural armor",
    "hp": 94,
    "maxHp": 94,
    "abilityScores": {
      "strength": 18,
      "dexterity": 13,
      "constitution": 20,
      "intelligence": 7,
      "wisdom": 9,
      "charisma": 7
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "9"
    },
    "languages": [
      "Giant"
    ],
    "traits": [
      {
        "name": "Regeneration",
        "description": "Regains 10 hit points at the start of its turn unless it took acid or fire damage since its last turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and two Claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "1d6+4 piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d6+4 slashing"
      }
    ]
  },
  {
    "id": "cm-yp-tamoachan-couatl-guardian",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Tales from the Yawning Portal",
    "name": "Hidden Shrine Couatl Guardian",
    "size": "medium",
    "type": "celestial",
    "alignment": "Lawful Good",
    "speed": "30 ft., fly 90 ft.",
    "challengeRating": 4,
    "ac": 19,
    "acNote": "natural armor",
    "hp": 66,
    "maxHp": 66,
    "abilityScores": {
      "strength": 16,
      "dexterity": 20,
      "constitution": 17,
      "intelligence": 18,
      "wisdom": 20,
      "charisma": 18
    },
    "savingThrows": {
      "constitution": 5,
      "wisdom": 7,
      "charisma": 6
    },
    "damageResistances": [
      "radiant"
    ],
    "damageImmunities": [
      "psychic"
    ],
    "conditionImmunities": [
      "charmed",
      "poisoned"
    ],
    "senses": {
      "truesight": "120 ft.",
      "passive Perception": "15"
    },
    "languages": [
      "all",
      "telepathy 120 ft."
    ],
    "traits": [
      {
        "name": "Magic Weapons",
        "description": "Attacks are magical."
      },
      {
        "name": "Shielded Mind",
        "description": "Warded against scrying and any effect that would sense its emotions or read its thoughts."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "1d6+5 piercing plus 3d6 poison; on a failed DC 13 Constitution save the target is also poisoned for 24 hours and unconscious while poisoned"
      },
      {
        "name": "Constrict",
        "description": "Melee attack, +8 to hit, 2d6+5 bludgeoning and grappled (escape DC 15) and restrained."
      }
    ]
  },
  {
    "id": "cm-yp-white-plume-guardian",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Tales from the Yawning Portal",
    "name": "Keraptis's Vault Golem",
    "size": "large",
    "type": "construct",
    "alignment": "Unaligned",
    "speed": "30 ft.",
    "challengeRating": 7,
    "ac": 17,
    "acNote": "natural armor",
    "hp": 114,
    "maxHp": 114,
    "abilityScores": {
      "strength": 20,
      "dexterity": 9,
      "constitution": 18,
      "intelligence": 3,
      "wisdom": 10,
      "charisma": 1
    },
    "damageImmunities": [
      "poison",
      "psychic",
      "lightning"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned"
    ],
    "senses": {
      "passive Perception": "10"
    },
    "traits": [
      {
        "name": "Lightning Absorption",
        "description": "Whenever it takes lightning damage, it regains that many hit points."
      },
      {
        "name": "Immutable Form",
        "description": "Immune to effects that alter its form."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "2d10+5 bludgeoning plus 2d6 lightning"
      }
    ]
  },
  {
    "id": "cm-yp-sir-bluto",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Tales from the Yawning Portal",
    "name": "Sir Bluto Sans Pite",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 4,
    "ac": 18,
    "acNote": "plate",
    "hp": 65,
    "maxHp": 65,
    "abilityScores": {
      "strength": 17,
      "dexterity": 12,
      "constitution": 15,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 13
    },
    "senses": {
      "passive Perception": "10"
    },
    "languages": [
      "Common"
    ],
    "traits": [
      {
        "name": "Bandit King",
        "description": "Allied bandits within 30 ft. of Sir Bluto add +1 to their attack rolls."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Three Longsword attacks."
      },
      {
        "name": "Longsword",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "1d8+3 slashing"
      },
      {
        "name": "Heavy Crossbow",
        "description": "Ranged Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d10 piercing"
      }
    ]
  },
  {
    "id": "cm-yp-dead-in-thay-thayan-apprentice",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Tales from the Yawning Portal",
    "name": "Thayan Blood Apprentice",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 4,
    "ac": 12,
    "hp": 49,
    "maxHp": 49,
    "abilityScores": {
      "strength": 9,
      "dexterity": 14,
      "constitution": 12,
      "intelligence": 16,
      "wisdom": 11,
      "charisma": 12
    },
    "savingThrows": {
      "intelligence": 5
    },
    "skills": {
      "Arcana": 5
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Common",
      "Thayan"
    ],
    "traits": [
      {
        "name": "Phylactery-Linked",
        "description": "While the Doomvault's phylacteries are intact, the apprentice regains 10 hit points when reduced to 0 hp (once)."
      }
    ],
    "actions": [
      {
        "name": "Chill Touch",
        "description": "Ranged spell attack, +5 to hit, 2d8 necrotic and target can't regain hit points until end of the apprentice's next turn."
      },
      {
        "name": "Vampiric Bolt (Recharge 5-6)",
        "description": "Ranged spell attack, +5 to hit, 4d6 necrotic and the apprentice regains half the damage dealt."
      }
    ]
  },
  {
    "id": "cm-yp-fire-giant-against-the-giants",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Tales from the Yawning Portal",
    "name": "Snurre's Hall Fire Giant",
    "size": "huge",
    "type": "giant",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 9,
    "ac": 18,
    "acNote": "plate",
    "hp": 162,
    "maxHp": 162,
    "abilityScores": {
      "strength": 25,
      "dexterity": 9,
      "constitution": 23,
      "intelligence": 10,
      "wisdom": 14,
      "charisma": 13
    },
    "savingThrows": {
      "dexterity": 3,
      "constitution": 11,
      "charisma": 5
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "passive Perception": "12"
    },
    "languages": [
      "Giant"
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Greatsword attacks."
      },
      {
        "name": "Greatsword",
        "description": "Melee Weapon Attack",
        "attackBonus": 11,
        "damageDescription": "6d6+7 slashing"
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack",
        "attackBonus": 11,
        "damageDescription": "4d10+7 bludgeoning"
      }
    ]
  },
  {
    "id": "cm-yp-hill-giant-against-the-giants",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Tales from the Yawning Portal",
    "name": "Nosnra's Steading Hill Giant",
    "size": "huge",
    "type": "giant",
    "alignment": "Chaotic Evil",
    "speed": "40 ft.",
    "challengeRating": 5,
    "ac": 13,
    "acNote": "natural armor",
    "hp": 105,
    "maxHp": 105,
    "abilityScores": {
      "strength": 21,
      "dexterity": 8,
      "constitution": 19,
      "intelligence": 5,
      "wisdom": 9,
      "charisma": 6
    },
    "senses": {
      "passive Perception": "9"
    },
    "languages": [
      "Giant"
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Greatclub attacks."
      },
      {
        "name": "Greatclub",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "3d8+5 bludgeoning"
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "3d10+5 bludgeoning"
      }
    ]
  },
  {
    "id": "cm-yp-frost-giant-against-the-giants",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Tales from the Yawning Portal",
    "name": "Glacial Rift Frost Giant",
    "size": "huge",
    "type": "giant",
    "alignment": "Neutral Evil",
    "speed": "40 ft.",
    "challengeRating": 8,
    "ac": 15,
    "acNote": "patchwork plate",
    "hp": 138,
    "maxHp": 138,
    "abilityScores": {
      "strength": 23,
      "dexterity": 9,
      "constitution": 21,
      "intelligence": 9,
      "wisdom": 10,
      "charisma": 12
    },
    "savingThrows": {
      "constitution": 8,
      "wisdom": 3,
      "charisma": 4
    },
    "damageImmunities": [
      "cold"
    ],
    "senses": {
      "passive Perception": "10"
    },
    "languages": [
      "Giant"
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Greataxe attacks."
      },
      {
        "name": "Greataxe",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "3d12+6 slashing"
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "4d10+6 bludgeoning"
      }
    ]
  },
  {
    "id": "cm-yp-juiblex-spawn",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Tales from the Yawning Portal",
    "name": "Doomvault Ooze Aberration",
    "size": "large",
    "type": "ooze",
    "alignment": "Chaotic Evil",
    "speed": "20 ft., climb 20 ft.",
    "challengeRating": 6,
    "ac": 8,
    "hp": 115,
    "maxHp": 115,
    "abilityScores": {
      "strength": 16,
      "dexterity": 6,
      "constitution": 18,
      "intelligence": 3,
      "wisdom": 8,
      "charisma": 3
    },
    "damageImmunities": [
      "acid",
      "poison"
    ],
    "conditionImmunities": [
      "blinded",
      "charmed",
      "deafened",
      "exhaustion",
      "frightened",
      "prone"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "passive Perception": "9"
    },
    "traits": [
      {
        "name": "Amorphous",
        "description": "Can move through a space as narrow as 1 inch."
      },
      {
        "name": "Corrosive Form",
        "description": "A creature that touches it or hits it with a melee attack within 5 ft. takes 1d8 acid."
      }
    ],
    "actions": [
      {
        "name": "Pseudopod",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d8+3 bludgeoning plus 2d8 acid"
      }
    ]
  },
  {
    "id": "cm-vecna-robes",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Tales from the Yawning Portal",
    "name": "Vecna, the Undying (Robes of Vecna)",
    "size": "medium",
    "type": "undead",
    "alignment": "Neutral Evil",
    "speed": "30 ft., fly 30 ft. (hover)",
    "challengeRating": 20,
    "ac": 20,
    "acNote": "natural armor, robes of Vecna",
    "hp": 272,
    "maxHp": 272,
    "abilityScores": {
      "strength": 13,
      "dexterity": 18,
      "constitution": 20,
      "intelligence": 22,
      "wisdom": 20,
      "charisma": 24
    },
    "savingThrows": {
      "constitution": 12,
      "intelligence": 13,
      "wisdom": 12,
      "charisma": 14
    },
    "damageResistances": [
      "cold",
      "lightning"
    ],
    "damageImmunities": [
      "necrotic",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "poisoned"
    ],
    "senses": {
      "truesight": "120 ft.",
      "passive Perception": "15"
    },
    "languages": [
      "all"
    ],
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If Vecna fails a save, he can choose to succeed instead."
      },
      {
        "name": "Rejuvenation",
        "description": "As long as the Hand or Eye of Vecna exists, a destroyed Vecna reforms in 1d10 days."
      },
      {
        "name": "Spellcasting",
        "description": "Vecna is an 18th-level spellcaster (spell save DC 21). He has access to any wizard spell of 8th level or lower."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Vecna uses Rotten Touch twice."
      },
      {
        "name": "Rotten Touch",
        "description": "Melee Weapon Attack",
        "attackBonus": 13,
        "damageDescription": "4d8+6 necrotic; the target's hit point maximum is reduced by an equal amount"
      },
      {
        "name": "Flight of the Damned (Recharge 5-6)",
        "description": "30-foot cone, DC 21 Constitution save, 8d6 necrotic and frightened for 1 minute on a failure."
      }
    ],
    "legendaryActions": [
      {
        "name": "Rotten Touch",
        "description": "Vecna makes one Rotten Touch attack."
      },
      {
        "name": "Frightful Presence (Costs 2)",
        "description": "Each creature within 30 ft., DC 21 Wisdom save or frightened for 1 minute."
      },
      {
        "name": "Cast a Spell (Costs 3)",
        "description": "Vecna casts a spell of 3rd level or lower."
      }
    ],
    "legendaryActionCount": 3
  },
  {
    "id": "cm-acererak-lich",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Tales from the Yawning Portal",
    "name": "Acererak the Devourer (Archlich)",
    "size": "medium",
    "type": "undead",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 23,
    "ac": 21,
    "acNote": "natural armor",
    "hp": 285,
    "maxHp": 285,
    "abilityScores": {
      "strength": 13,
      "dexterity": 16,
      "constitution": 20,
      "intelligence": 27,
      "wisdom": 21,
      "charisma": 20
    },
    "savingThrows": {
      "constitution": 13,
      "intelligence": 16,
      "wisdom": 13
    },
    "damageResistances": [
      "cold",
      "lightning"
    ],
    "damageImmunities": [
      "necrotic",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "poisoned"
    ],
    "senses": {
      "truesight": "120 ft.",
      "passive Perception": "15"
    },
    "languages": [
      "all"
    ],
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If Acererak fails a save, he can choose to succeed instead."
      },
      {
        "name": "Rejuvenation",
        "description": "If destroyed, Acererak reforms in 1d10 days while his phylactery is intact."
      },
      {
        "name": "Spellcasting",
        "description": "Acererak is a 20th-level spellcaster (spell save DC 20, +12 to hit with spell attacks)."
      },
      {
        "name": "Turn Resistance Aura",
        "description": "Undead within 30 ft. have advantage on saves against effects that turn undead."
      }
    ],
    "actions": [
      {
        "name": "Paralyzing Touch",
        "description": "Melee spell attack, +12 to hit, 3d6 cold and DC 20 Constitution save or paralyzed for 1 minute."
      },
      {
        "name": "Disrupt Life (Recharge 5-6)",
        "description": "Each non-undead creature within 20 ft., DC 20 Constitution save, 42 (12d6) necrotic (half on success)."
      }
    ],
    "legendaryActions": [
      {
        "name": "Cantrip",
        "description": "Acererak casts a cantrip."
      },
      {
        "name": "Paralyzing Touch (Costs 2)",
        "description": "Acererak uses Paralyzing Touch."
      },
      {
        "name": "Frightening Gaze (Costs 2)",
        "description": "One creature within 10 ft., DC 20 Wisdom save or frightened for 1 minute."
      },
      {
        "name": "Disrupt Life (Costs 3)",
        "description": "Acererak uses Disrupt Life."
      }
    ],
    "legendaryActionCount": 3
  },
  {
    "id": "cm-yp-tomb-of-horrors-gargoyle",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Tales from the Yawning Portal",
    "name": "Tomb of Horrors Sentinel Gargoyle",
    "size": "medium",
    "type": "elemental",
    "alignment": "Chaotic Evil",
    "speed": "30 ft., fly 60 ft.",
    "challengeRating": 3,
    "ac": 15,
    "acNote": "natural armor",
    "hp": 67,
    "maxHp": 67,
    "abilityScores": {
      "strength": 15,
      "dexterity": 11,
      "constitution": 18,
      "intelligence": 6,
      "wisdom": 11,
      "charisma": 7
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "exhaustion",
      "petrified",
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Terran"
    ],
    "traits": [
      {
        "name": "False Appearance",
        "description": "Indistinguishable from an inanimate statue while motionless."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and one Claw attack."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 slashing"
      }
    ]
  },
  {
    "id": "cm-gos-smuggler-thug",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Ghosts of Saltmarsh",
    "name": "Saltmarsh Smuggler",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 1,
    "ac": 12,
    "hp": 32,
    "maxHp": 32,
    "abilityScores": {
      "strength": 15,
      "dexterity": 11,
      "constitution": 14,
      "intelligence": 10,
      "wisdom": 10,
      "charisma": 11
    },
    "senses": {
      "passive Perception": "10"
    },
    "languages": [
      "Common"
    ],
    "traits": [
      {
        "name": "Pack Tactics",
        "description": "Advantage on an attack if an ally is within 5 ft. of the target."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Cutlass attacks."
      },
      {
        "name": "Cutlass",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 slashing"
      },
      {
        "name": "Belaying Pin",
        "description": "Ranged Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d4+2 bludgeoning"
      }
    ]
  },
  {
    "id": "cm-gos-lizardfolk-scale-shield",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Ghosts of Saltmarsh",
    "name": "Lizardfolk Scale-Shield",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral",
    "speed": "30 ft., swim 30 ft.",
    "challengeRating": 1,
    "ac": 15,
    "acNote": "natural armor, shield",
    "hp": 27,
    "maxHp": 27,
    "abilityScores": {
      "strength": 15,
      "dexterity": 10,
      "constitution": 13,
      "intelligence": 7,
      "wisdom": 12,
      "charisma": 7
    },
    "skills": {
      "Perception": 3,
      "Stealth": 4,
      "Survival": 5
    },
    "senses": {
      "passive Perception": "11"
    },
    "languages": [
      "Draconic"
    ],
    "traits": [
      {
        "name": "Hold Breath",
        "description": "Can hold its breath for 15 minutes."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two attacks: one Bite and one Spiked Shield."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 piercing"
      },
      {
        "name": "Spiked Shield",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 piercing"
      }
    ]
  },
  {
    "id": "cm-gos-sahuagin-raider",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Ghosts of Saltmarsh",
    "name": "Sahuagin Raider",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "30 ft., swim 40 ft.",
    "challengeRating": 1,
    "ac": 12,
    "hp": 27,
    "maxHp": 27,
    "abilityScores": {
      "strength": 13,
      "dexterity": 11,
      "constitution": 12,
      "intelligence": 12,
      "wisdom": 13,
      "charisma": 9
    },
    "skills": {
      "Perception": 5
    },
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "13"
    },
    "languages": [
      "Sahuagin"
    ],
    "traits": [
      {
        "name": "Blood Frenzy",
        "description": "Advantage on melee attacks against any creature that doesn't have all its hit points."
      },
      {
        "name": "Shark Telepathy",
        "description": "Can command any shark within 120 ft. telepathically."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and two Claw attacks, or one Spear."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 3,
        "damageDescription": "1d4+1 piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 3,
        "damageDescription": "1d4+1 slashing"
      }
    ]
  },
  {
    "id": "cm-gos-sahuagin-priestess",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Ghosts of Saltmarsh",
    "name": "Sahuagin Wave Priestess",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "30 ft., swim 40 ft.",
    "challengeRating": 2,
    "ac": 12,
    "hp": 44,
    "maxHp": 44,
    "abilityScores": {
      "strength": 13,
      "dexterity": 11,
      "constitution": 12,
      "intelligence": 12,
      "wisdom": 15,
      "charisma": 13
    },
    "skills": {
      "Perception": 6,
      "Religion": 3
    },
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "14"
    },
    "languages": [
      "Sahuagin"
    ],
    "traits": [
      {
        "name": "Blood Frenzy",
        "description": "Advantage on melee attacks against damaged creatures."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and two Claw attacks."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 3,
        "damageDescription": "1d4+1 slashing"
      },
      {
        "name": "Guiding Bolt (3/day)",
        "description": "Ranged spell attack, +4 to hit, 4d6 radiant and the next attack against the target has advantage."
      }
    ]
  },
  {
    "id": "cm-sahuagin-baron",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Ghosts of Saltmarsh",
    "name": "Sahuagin Baron",
    "size": "large",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "30 ft., swim 60 ft.",
    "challengeRating": 5,
    "ac": 16,
    "acNote": "natural armor",
    "hp": 76,
    "maxHp": 76,
    "abilityScores": {
      "strength": 19,
      "dexterity": 15,
      "constitution": 16,
      "intelligence": 16,
      "wisdom": 13,
      "charisma": 17
    },
    "savingThrows": {
      "dexterity": 5,
      "constitution": 6,
      "intelligence": 6,
      "wisdom": 4
    },
    "skills": {
      "Perception": 7
    },
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "13"
    },
    "languages": [
      "Sahuagin"
    ],
    "traits": [
      {
        "name": "Blood Frenzy",
        "description": "Advantage on melee attacks against any creature that doesn't have all its hit points."
      },
      {
        "name": "Shark Telepathy",
        "description": "Can command any shark within 120 ft. telepathically."
      },
      {
        "name": "Limited Amphibiousness",
        "description": "Can breathe air and water, but must be submerged at least once every 4 hours to avoid suffocating."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and two Claw attacks, or one Trident and one Bite."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d4+4 piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d6+4 slashing"
      },
      {
        "name": "Trident",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d6+4 piercing"
      }
    ]
  },
  {
    "id": "cm-gos-giant-sea-eel",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Ghosts of Saltmarsh",
    "name": "Giant Sea Eel",
    "size": "large",
    "type": "beast",
    "alignment": "Unaligned",
    "speed": "10 ft., swim 40 ft.",
    "challengeRating": 2,
    "ac": 13,
    "hp": 45,
    "maxHp": 45,
    "abilityScores": {
      "strength": 17,
      "dexterity": 14,
      "constitution": 15,
      "intelligence": 3,
      "wisdom": 10,
      "charisma": 5
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "traits": [
      {
        "name": "Water Breathing",
        "description": "Can breathe only underwater."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "2d8+3 piercing and target is grappled (escape DC 13)"
      }
    ]
  },
  {
    "id": "cm-gos-merrow-brute",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Ghosts of Saltmarsh",
    "name": "Merrow Deep Brute",
    "size": "large",
    "type": "monstrosity",
    "alignment": "Chaotic Evil",
    "speed": "10 ft., swim 40 ft.",
    "challengeRating": 3,
    "ac": 13,
    "acNote": "natural armor",
    "hp": 58,
    "maxHp": 58,
    "abilityScores": {
      "strength": 18,
      "dexterity": 10,
      "constitution": 15,
      "intelligence": 8,
      "wisdom": 10,
      "charisma": 9
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Abyssal",
      "Aquan"
    ],
    "traits": [
      {
        "name": "Amphibious",
        "description": "Can breathe air and water."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite, one Claw, and one Harpoon attack."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "1d8+4 piercing"
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "2d4+4 slashing"
      },
      {
        "name": "Harpoon",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "2d6+4 piercing and DC 14 Strength save or pulled up to 20 feet toward the merrow"
      }
    ]
  },
  {
    "id": "cm-gos-ghost-of-the-emperor",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Ghosts of Saltmarsh",
    "name": "Drowned Officer of the Emperor of the Waves",
    "size": "medium",
    "type": "undead",
    "alignment": "Neutral Evil",
    "speed": "0 ft., fly 40 ft. (hover)",
    "challengeRating": 4,
    "ac": 11,
    "hp": 45,
    "maxHp": 45,
    "abilityScores": {
      "strength": 7,
      "dexterity": 13,
      "constitution": 10,
      "intelligence": 10,
      "wisdom": 12,
      "charisma": 17
    },
    "damageResistances": [
      "acid",
      "cold",
      "fire",
      "lightning",
      "thunder",
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "necrotic",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "grappled",
      "paralyzed",
      "petrified",
      "poisoned",
      "prone",
      "restrained"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Common"
    ],
    "traits": [
      {
        "name": "Incorporeal Movement",
        "description": "Can move through creatures and objects as difficult terrain."
      }
    ],
    "actions": [
      {
        "name": "Withering Touch",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "4d6+2 necrotic"
      },
      {
        "name": "Horrifying Visage",
        "description": "Each non-undead creature within 60 ft. that can see the ghost, DC 13 Wisdom save or frightened for 1 minute (aging 1d4 x 10 years on a failure by 5+)."
      }
    ]
  },
  {
    "id": "cm-gos-abbey-lycanthrope",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Ghosts of Saltmarsh",
    "name": "Isle of the Abbey Wererat Marauder",
    "size": "medium",
    "type": "monstrosity",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 2,
    "ac": 12,
    "hp": 44,
    "maxHp": 44,
    "abilityScores": {
      "strength": 10,
      "dexterity": 15,
      "constitution": 12,
      "intelligence": 11,
      "wisdom": 10,
      "charisma": 8
    },
    "skills": {
      "Perception": 2,
      "Stealth": 4
    },
    "damageImmunities": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "senses": {
      "passive Perception": "10"
    },
    "languages": [
      "Common (can't speak in rat form)"
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two attacks, only one of which can be a Bite."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d4+2 piercing plus lycanthropy curse on a humanoid"
      },
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 piercing"
      },
      {
        "name": "Hand Crossbow",
        "description": "Ranged Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 piercing"
      }
    ]
  },
  {
    "id": "cm-gos-tammeraut-lacedon",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Ghosts of Saltmarsh",
    "name": "Tammeraut Lacedon Pack",
    "size": "medium",
    "type": "undead",
    "alignment": "Chaotic Evil",
    "speed": "30 ft., swim 30 ft.",
    "challengeRating": 1,
    "ac": 12,
    "hp": 22,
    "maxHp": 22,
    "abilityScores": {
      "strength": 13,
      "dexterity": 15,
      "constitution": 10,
      "intelligence": 7,
      "wisdom": 10,
      "charisma": 6
    },
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Common (understands but can't speak)"
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and one Claws attack."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 2,
        "damageDescription": "1d6+1 piercing"
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "2d4+2 slashing and DC 10 Constitution save or paralyzed for 1 minute"
      }
    ]
  },
  {
    "id": "cm-gos-styes-aberration",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Ghosts of Saltmarsh",
    "name": "Skum of the Styes",
    "size": "medium",
    "type": "aberration",
    "alignment": "Chaotic Evil",
    "speed": "20 ft., swim 40 ft.",
    "challengeRating": 3,
    "ac": 13,
    "acNote": "natural armor",
    "hp": 52,
    "maxHp": 52,
    "abilityScores": {
      "strength": 16,
      "dexterity": 13,
      "constitution": 15,
      "intelligence": 8,
      "wisdom": 12,
      "charisma": 6
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Undercommon"
    ],
    "traits": [
      {
        "name": "Amphibious",
        "description": "Can breathe air and water."
      },
      {
        "name": "Aberrant Resilience",
        "description": "Advantage on saves against being charmed or frightened."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and two Claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d10+3 piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d6+3 slashing plus 1d6 poison"
      }
    ]
  },
  {
    "id": "cm-gos-final-enemy-fortress-guard",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Ghosts of Saltmarsh",
    "name": "Sahuagin Fortress Shark-Warden",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "30 ft., swim 40 ft.",
    "challengeRating": 3,
    "ac": 14,
    "acNote": "coral scale",
    "hp": 58,
    "maxHp": 58,
    "abilityScores": {
      "strength": 16,
      "dexterity": 12,
      "constitution": 14,
      "intelligence": 12,
      "wisdom": 13,
      "charisma": 10
    },
    "skills": {
      "Perception": 5
    },
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "13"
    },
    "languages": [
      "Sahuagin"
    ],
    "traits": [
      {
        "name": "Blood Frenzy",
        "description": "Advantage on melee attacks against damaged creatures."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and one Trident attack, and commands a bound shark to Bite."
      },
      {
        "name": "Trident",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d8+3 piercing"
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d6+3 piercing"
      }
    ]
  },
  {
    "id": "cm-gos-bullywug-croaker",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Ghosts of Saltmarsh",
    "name": "Dunwater Bullywug Croaker",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "20 ft., swim 40 ft.",
    "challengeRating": 1,
    "ac": 13,
    "acNote": "shield, hide armor",
    "hp": 22,
    "maxHp": 22,
    "abilityScores": {
      "strength": 12,
      "dexterity": 12,
      "constitution": 13,
      "intelligence": 7,
      "wisdom": 10,
      "charisma": 7
    },
    "skills": {
      "Stealth": 3
    },
    "senses": {
      "passive Perception": "10"
    },
    "languages": [
      "Bullywug"
    ],
    "traits": [
      {
        "name": "Standing Leap",
        "description": "Long jump is up to 20 feet, high jump up to 10 feet, with or without a running start."
      },
      {
        "name": "Swamp Camouflage",
        "description": "Advantage on Stealth checks made in swampy terrain."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and one Spear attack."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 3,
        "damageDescription": "1d4+1 piercing"
      },
      {
        "name": "Spear",
        "description": "Melee Weapon Attack",
        "attackBonus": 3,
        "damageDescription": "1d6+1 piercing"
      }
    ]
  },
  {
    "id": "cm-gos-kraken-priest-styes",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Ghosts of Saltmarsh",
    "name": "Kraken Priest of the Styes",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft., swim 30 ft.",
    "challengeRating": 5,
    "ac": 10,
    "hp": 75,
    "maxHp": 75,
    "abilityScores": {
      "strength": 12,
      "dexterity": 10,
      "constitution": 14,
      "intelligence": 13,
      "wisdom": 16,
      "charisma": 15
    },
    "skills": {
      "Perception": 6,
      "Religion": 5
    },
    "senses": {
      "passive Perception": "15"
    },
    "languages": [
      "Aquan",
      "Common"
    ],
    "traits": [
      {
        "name": "Amphibious",
        "description": "Can breathe air and water."
      },
      {
        "name": "Voice of the Kraken",
        "description": "Can cast command at will without material components (Wisdom, DC 14)."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Thunderous Touch attacks."
      },
      {
        "name": "Thunderous Touch",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "2d8+1 thunder"
      },
      {
        "name": "Corrupting Water (Recharge 5-6)",
        "description": "10-foot cube within 60 ft., DC 14 Constitution save, 3d6 poison and poisoned for 1 minute on a failure."
      }
    ]
  },
  {
    "id": "cm-rotr-goblin-pyro",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Rise of the Runelords",
    "name": "Sandpoint Goblin Pyro",
    "size": "small",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 1,
    "ac": 13,
    "hp": 15,
    "maxHp": 15,
    "abilityScores": {
      "strength": 8,
      "dexterity": 15,
      "constitution": 12,
      "intelligence": 8,
      "wisdom": 8,
      "charisma": 8
    },
    "skills": {
      "Stealth": 5
    },
    "senses": {
      "passive Perception": "9"
    },
    "languages": [
      "Goblin"
    ],
    "traits": [
      {
        "name": "Nimble Escape",
        "description": "Can Disengage or Hide as a bonus action."
      }
    ],
    "actions": [
      {
        "name": "Dogslicer",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 slashing"
      },
      {
        "name": "Firework Bomb",
        "description": "Ranged Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "2d6 fire, DC 11 Dexterity save or catches fire for 1d4 fire at the start of its next turn"
      }
    ]
  },
  {
    "id": "cm-rotr-nualia",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Rise of the Runelords",
    "name": "Nualia Tobyn, the Fallen",
    "size": "medium",
    "type": "fiend",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 5,
    "ac": 17,
    "acNote": "half plate",
    "hp": 76,
    "maxHp": 76,
    "abilityScores": {
      "strength": 16,
      "dexterity": 13,
      "constitution": 15,
      "intelligence": 12,
      "wisdom": 14,
      "charisma": 16
    },
    "savingThrows": {
      "constitution": 5,
      "charisma": 6
    },
    "skills": {
      "Intimidation": 6,
      "Religion": 4
    },
    "damageResistances": [
      "fire"
    ],
    "senses": {
      "passive Perception": "12"
    },
    "languages": [
      "Abyssal",
      "Common",
      "Thassilonian"
    ],
    "traits": [
      {
        "name": "Lamashtu's Blessing",
        "description": "When Nualia is first bloodied, she gains a claw and 15 temporary hit points."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Bastard Sword attacks and one Fiendish Claw."
      },
      {
        "name": "Bastard Sword",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "1d10+3 slashing plus 1d6 fire"
      },
      {
        "name": "Fiendish Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "2d6+3 slashing"
      },
      {
        "name": "Channel the Sihedron (Recharge 5-6)",
        "description": "30-foot line, DC 14 Dexterity save, 4d8 fire (half on success)."
      }
    ]
  },
  {
    "id": "cm-rotr-sinspawn-wrath",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Rise of the Runelords",
    "name": "Wrath Sinspawn",
    "size": "medium",
    "type": "aberration",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 2,
    "ac": 14,
    "acNote": "natural armor",
    "hp": 33,
    "maxHp": 33,
    "abilityScores": {
      "strength": 15,
      "dexterity": 13,
      "constitution": 14,
      "intelligence": 6,
      "wisdom": 10,
      "charisma": 6
    },
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Thassilonian (understands but can't speak)"
    ],
    "traits": [
      {
        "name": "Sin-Fueled Frenzy",
        "description": "When a creature within 10 ft. becomes angered or attacks the sinspawn, it can move up to half its speed as a reaction."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and one Claw attack."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d8+2 piercing plus 1d6 psychic"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 slashing"
      }
    ]
  },
  {
    "id": "cm-rotr-lucrecia",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Rise of the Runelords",
    "name": "Lucrecia, Lamia Handmaiden",
    "size": "large",
    "type": "monstrosity",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 6,
    "ac": 15,
    "acNote": "natural armor",
    "hp": 97,
    "maxHp": 97,
    "abilityScores": {
      "strength": 16,
      "dexterity": 15,
      "constitution": 16,
      "intelligence": 14,
      "wisdom": 15,
      "charisma": 19
    },
    "savingThrows": {
      "charisma": 7
    },
    "skills": {
      "Deception": 7,
      "Insight": 5
    },
    "senses": {
      "passive Perception": "12"
    },
    "languages": [
      "Abyssal",
      "Common",
      "Thassilonian"
    ],
    "traits": [
      {
        "name": "Innate Spellcasting",
        "description": "At will: disguise self, minor illusion; 3/day: charm person, mirror image, suggestion; 1/day: geas, major image."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Dagger attack and one Intoxicating Touch."
      },
      {
        "name": "Dagger",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d4+2 piercing plus 2d4 psychic"
      },
      {
        "name": "Intoxicating Touch",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "3d6 psychic; the target's Wisdom score is reduced by 1d4 (recovers after a long rest)"
      }
    ]
  },
  {
    "id": "cm-rotr-stone-giant-elder",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Rise of the Runelords",
    "name": "Jorgenfist Stone Giant Elder",
    "size": "huge",
    "type": "giant",
    "alignment": "Neutral",
    "speed": "40 ft.",
    "challengeRating": 7,
    "ac": 17,
    "acNote": "natural armor",
    "hp": 126,
    "maxHp": 126,
    "abilityScores": {
      "strength": 23,
      "dexterity": 15,
      "constitution": 20,
      "intelligence": 10,
      "wisdom": 12,
      "charisma": 9
    },
    "savingThrows": {
      "dexterity": 5,
      "constitution": 8,
      "wisdom": 4
    },
    "skills": {
      "Athletics": 12,
      "Perception": 4
    },
    "senses": {
      "passive Perception": "13"
    },
    "languages": [
      "Giant",
      "Thassilonian"
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Greatclub attacks."
      },
      {
        "name": "Greatclub",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "3d8+6 bludgeoning"
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "4d10+6 bludgeoning"
      }
    ]
  },
  {
    "id": "cm-rotr-mokmurian",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Rise of the Runelords",
    "name": "Mokmurian, the Stone Lord",
    "size": "huge",
    "type": "giant",
    "alignment": "Chaotic Evil",
    "speed": "40 ft.",
    "challengeRating": 10,
    "ac": 18,
    "acNote": "runecarved plate",
    "hp": 172,
    "maxHp": 172,
    "abilityScores": {
      "strength": 25,
      "dexterity": 12,
      "constitution": 22,
      "intelligence": 17,
      "wisdom": 14,
      "charisma": 14
    },
    "savingThrows": {
      "constitution": 10,
      "intelligence": 8,
      "wisdom": 6
    },
    "skills": {
      "Arcana": 8,
      "History": 8
    },
    "damageResistances": [
      "cold"
    ],
    "senses": {
      "passive Perception": "12"
    },
    "languages": [
      "Giant",
      "Thassilonian",
      "Draconic"
    ],
    "traits": [
      {
        "name": "Runemagic",
        "description": "Mokmurian is a 9th-level spellcaster (save DC 16). Prepared: shatter, stoneskin, fireball, wall of stone, chain lightning."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Runecarved Maul attacks."
      },
      {
        "name": "Runecarved Maul",
        "description": "Melee Weapon Attack",
        "attackBonus": 11,
        "damageDescription": "3d8+7 bludgeoning plus 2d6 force"
      },
      {
        "name": "Transmute Rock (Recharge 5-6)",
        "description": "20-foot cube of stone becomes grasping mud, DC 16 Dexterity save or restrained; or mud becomes rock."
      }
    ]
  },
  {
    "id": "cm-karzoug-demon-skin",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Rise of the Runelords",
    "name": "Karzoug, the Runelord of Greed",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Evil",
    "speed": "40 ft., fly 60 ft.",
    "challengeRating": 20,
    "ac": 21,
    "acNote": "demon-skin robes, ring of protection",
    "hp": 289,
    "maxHp": 289,
    "abilityScores": {
      "strength": 17,
      "dexterity": 20,
      "constitution": 22,
      "intelligence": 26,
      "wisdom": 22,
      "charisma": 24
    },
    "savingThrows": {
      "intelligence": 15,
      "wisdom": 13,
      "charisma": 14,
      "constitution": 13
    },
    "skills": {
      "Arcana": 15,
      "History": 15
    },
    "damageResistances": [
      "fire",
      "cold",
      "lightning"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "truesight": "120 ft.",
      "passive Perception": "16"
    },
    "languages": [
      "all",
      "telepathy 120 ft."
    ],
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If Karzoug fails a save, he can choose to succeed instead."
      },
      {
        "name": "Rune of Greed",
        "description": "The first time each turn a creature within 30 ft. of Karzoug hits him, that creature takes 2d10 force."
      },
      {
        "name": "Archmage of Thassilon",
        "description": "Karzoug is a 20th-level spellcaster (spell save DC 23). He knows every wizard spell of 9th level or lower with the transmutation or evocation school."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Karzoug uses Burning Glaive twice and casts one cantrip."
      },
      {
        "name": "Burning Glaive",
        "description": "Melee Weapon Attack",
        "attackBonus": 14,
        "damageDescription": "2d10+5 slashing plus 4d6 fire"
      },
      {
        "name": "Meteoric Wrath (Recharge 5-6)",
        "description": "40-foot-radius sphere within 150 ft., DC 23 Dexterity save, 12d6 fire and 6d6 bludgeoning (half on success)."
      }
    ],
    "legendaryActions": [
      {
        "name": "Cantrip",
        "description": "Karzoug casts a cantrip."
      },
      {
        "name": "Burning Glaive (Costs 2)",
        "description": "Karzoug makes one Burning Glaive attack."
      },
      {
        "name": "Sihedron Teleport (Costs 2)",
        "description": "Karzoug teleports up to 120 feet to a space he can see."
      },
      {
        "name": "Greed's Toll (Costs 3)",
        "description": "One creature within 60 ft., DC 23 Charisma save or drop a held item and take 6d8 psychic."
      }
    ],
    "legendaryActionCount": 3
  },
  {
    "id": "cm-rotr-hill-giant-raider",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Rise of the Runelords",
    "name": "Hook Mountain Hill Giant Raider",
    "size": "huge",
    "type": "giant",
    "alignment": "Chaotic Evil",
    "speed": "40 ft.",
    "challengeRating": 5,
    "ac": 13,
    "acNote": "natural armor",
    "hp": 105,
    "maxHp": 105,
    "abilityScores": {
      "strength": 21,
      "dexterity": 8,
      "constitution": 19,
      "intelligence": 5,
      "wisdom": 9,
      "charisma": 6
    },
    "senses": {
      "passive Perception": "9"
    },
    "languages": [
      "Giant"
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Greatclub attacks."
      },
      {
        "name": "Greatclub",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "3d8+5 bludgeoning"
      },
      {
        "name": "Rock",
        "description": "Ranged Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "3d10+5 bludgeoning"
      }
    ]
  },
  {
    "id": "cm-rotr-ogrekin-hillbilly",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Rise of the Runelords",
    "name": "Foxglove Ogrekin",
    "size": "large",
    "type": "giant",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 2,
    "ac": 11,
    "hp": 45,
    "maxHp": 45,
    "abilityScores": {
      "strength": 17,
      "dexterity": 8,
      "constitution": 16,
      "intelligence": 5,
      "wisdom": 7,
      "charisma": 5
    },
    "senses": {
      "passive Perception": "8"
    },
    "languages": [
      "Common (broken)"
    ],
    "actions": [
      {
        "name": "Rusty Hook",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "2d6+3 slashing plus 1d4 poison (infection)"
      }
    ]
  },
  {
    "id": "cm-rotr-scarecrow-golem",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Rise of the Runelords",
    "name": "Foxglove Manor Scarecrow",
    "size": "medium",
    "type": "construct",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 1,
    "ac": 11,
    "hp": 36,
    "maxHp": 36,
    "abilityScores": {
      "strength": 11,
      "dexterity": 13,
      "constitution": 11,
      "intelligence": 5,
      "wisdom": 10,
      "charisma": 11
    },
    "damageImmunities": [
      "poison",
      "psychic"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "traits": [
      {
        "name": "False Appearance",
        "description": "Indistinguishable from an ordinary scarecrow while motionless."
      }
    ],
    "actions": [
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 3,
        "damageDescription": "2d4+1 slashing and DC 11 Wisdom save or frightened until end of next turn"
      }
    ]
  },
  {
    "id": "cm-rotr-clockwork-reaper",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Rise of the Runelords",
    "name": "Thassilonian Clockwork Reaper",
    "size": "large",
    "type": "construct",
    "alignment": "Unaligned",
    "speed": "30 ft.",
    "challengeRating": 6,
    "ac": 17,
    "acNote": "bronze plating",
    "hp": 95,
    "maxHp": 95,
    "abilityScores": {
      "strength": 18,
      "dexterity": 13,
      "constitution": 16,
      "intelligence": 3,
      "wisdom": 11,
      "charisma": 1
    },
    "damageImmunities": [
      "poison",
      "psychic",
      "necrotic"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "10"
    },
    "traits": [
      {
        "name": "Whirling Blades",
        "description": "A creature that starts its turn within 5 ft. takes 1d8 slashing."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Scythe-Arm attacks."
      },
      {
        "name": "Scythe-Arm",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d10+4 slashing"
      },
      {
        "name": "Overwind (Recharge 6)",
        "description": "The reaper takes the Dash and Attack actions."
      }
    ]
  },
  {
    "id": "cm-rotr-shadow-of-runeforge",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Rise of the Runelords",
    "name": "Runeforge Shadow-Wizard",
    "size": "medium",
    "type": "undead",
    "alignment": "Neutral Evil",
    "speed": "0 ft., fly 40 ft. (hover)",
    "challengeRating": 4,
    "ac": 13,
    "hp": 52,
    "maxHp": 52,
    "abilityScores": {
      "strength": 6,
      "dexterity": 16,
      "constitution": 13,
      "intelligence": 15,
      "wisdom": 10,
      "charisma": 12
    },
    "damageResistances": [
      "acid",
      "cold",
      "fire",
      "lightning",
      "thunder"
    ],
    "damageImmunities": [
      "necrotic",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "grappled",
      "paralyzed",
      "petrified",
      "prone",
      "restrained"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "traits": [
      {
        "name": "Amorphous Shadow",
        "description": "Can move through a space as narrow as 1 inch and through other creatures."
      },
      {
        "name": "Sunlight Weakness",
        "description": "Disadvantage on attacks, saves, and checks while in sunlight."
      }
    ],
    "actions": [
      {
        "name": "Strength Drain",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "3d6+3 necrotic; the target's Strength score is reduced by 1d4 until a long rest"
      },
      {
        "name": "Spectral Missiles",
        "description": "Three darts, +5 to hit, 1d4+2 force each."
      }
    ]
  },
  {
    "id": "cm-rotr-lamia-matriarch-guard",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Rise of the Runelords",
    "name": "Xin-Shalast Concubine Devil",
    "size": "medium",
    "type": "fiend",
    "alignment": "Lawful Evil",
    "speed": "30 ft., fly 40 ft.",
    "challengeRating": 5,
    "ac": 15,
    "hp": 66,
    "maxHp": 66,
    "abilityScores": {
      "strength": 14,
      "dexterity": 17,
      "constitution": 14,
      "intelligence": 14,
      "wisdom": 12,
      "charisma": 18
    },
    "skills": {
      "Deception": 6,
      "Persuasion": 6
    },
    "damageResistances": [
      "cold"
    ],
    "damageImmunities": [
      "fire",
      "poison"
    ],
    "conditionImmunities": [
      "poisoned"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Infernal",
      "telepathy 60 ft."
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Claw attacks."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "2d4+3 slashing plus 1d6 fire"
      },
      {
        "name": "Charm (Recharge 5-6)",
        "description": "One humanoid within 30 ft., DC 14 Wisdom save or charmed for 1 minute."
      }
    ]
  },
  {
    "id": "cm-rotr-denizen-of-leng",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Rise of the Runelords",
    "name": "Denizen of Leng (Xin-Shalast)",
    "size": "medium",
    "type": "aberration",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 8,
    "ac": 16,
    "acNote": "natural armor",
    "hp": 123,
    "maxHp": 123,
    "abilityScores": {
      "strength": 12,
      "dexterity": 18,
      "constitution": 15,
      "intelligence": 16,
      "wisdom": 15,
      "charisma": 15
    },
    "savingThrows": {
      "dexterity": 8,
      "wisdom": 6
    },
    "damageResistances": [
      "cold"
    ],
    "damageImmunities": [
      "psychic"
    ],
    "conditionImmunities": [
      "charmed",
      "frightened",
      "prone"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "Aklo",
      "Common"
    ],
    "traits": [
      {
        "name": "Dimensional Step",
        "description": "As a bonus action, teleports up to 30 feet."
      },
      {
        "name": "Warp Sanity",
        "description": "A creature that starts its turn within 10 ft. must succeed on a DC 15 Wisdom save or take 2d6 psychic."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and two Cutlass attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "2d6+4 piercing plus 1d6 psychic"
      },
      {
        "name": "Star-Metal Cutlass",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "2d6+4 slashing"
      }
    ]
  },
  {
    "id": "cm-km-stag-lord-bandit",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Kingmaker",
    "name": "Stag Lord's Bandit",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 1,
    "ac": 13,
    "acNote": "leather armor",
    "hp": 22,
    "maxHp": 22,
    "abilityScores": {
      "strength": 13,
      "dexterity": 14,
      "constitution": 12,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 10
    },
    "skills": {
      "Stealth": 4,
      "Survival": 3
    },
    "senses": {
      "passive Perception": "10"
    },
    "languages": [
      "Common"
    ],
    "actions": [
      {
        "name": "Scimitar",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 slashing"
      },
      {
        "name": "Longbow",
        "description": "Ranged Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d8+2 piercing"
      }
    ]
  },
  {
    "id": "cm-km-stag-lord",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Kingmaker",
    "name": "The Stag Lord",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 4,
    "ac": 16,
    "acNote": "studded leather, stag helm",
    "hp": 68,
    "maxHp": 68,
    "abilityScores": {
      "strength": 16,
      "dexterity": 16,
      "constitution": 15,
      "intelligence": 9,
      "wisdom": 13,
      "charisma": 11
    },
    "savingThrows": {
      "strength": 5,
      "dexterity": 5
    },
    "skills": {
      "Intimidation": 3,
      "Perception": 4,
      "Survival": 4
    },
    "senses": {
      "passive Perception": "13"
    },
    "languages": [
      "Common"
    ],
    "traits": [
      {
        "name": "Drunken Rage",
        "description": "While bloodied, the Stag Lord has advantage on melee attacks and resistance to bludgeoning, piercing, and slashing damage from nonmagical weapons."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Three Composite Longbow attacks or two Battleaxe attacks."
      },
      {
        "name": "Composite Longbow",
        "description": "Ranged Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d8+3 piercing"
      },
      {
        "name": "Battleaxe",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d8+3 slashing"
      }
    ]
  },
  {
    "id": "cm-km-tatzlwyrm",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Kingmaker",
    "name": "Tatzlwyrm",
    "size": "medium",
    "type": "dragon",
    "alignment": "Unaligned",
    "speed": "30 ft., climb 20 ft.",
    "challengeRating": 2,
    "ac": 14,
    "acNote": "natural armor",
    "hp": 39,
    "maxHp": 39,
    "abilityScores": {
      "strength": 15,
      "dexterity": 14,
      "constitution": 14,
      "intelligence": 4,
      "wisdom": 11,
      "charisma": 8
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "traits": [
      {
        "name": "Poison Belch",
        "description": "When it hits with a Bite, the target must succeed on a DC 12 Constitution save or be poisoned until the end of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and two Claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d10+2 piercing plus 1d4 poison"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 slashing"
      }
    ]
  },
  {
    "id": "cm-km-owlbear-alpha",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Kingmaker",
    "name": "Stolen Lands Owlbear Alpha",
    "size": "large",
    "type": "monstrosity",
    "alignment": "Unaligned",
    "speed": "40 ft.",
    "challengeRating": 4,
    "ac": 13,
    "acNote": "natural armor",
    "hp": 79,
    "maxHp": 79,
    "abilityScores": {
      "strength": 21,
      "dexterity": 12,
      "constitution": 17,
      "intelligence": 3,
      "wisdom": 12,
      "charisma": 7
    },
    "skills": {
      "Perception": 5
    },
    "senses": {
      "passive Perception": "13"
    },
    "traits": [
      {
        "name": "Keen Sight and Smell",
        "description": "Advantage on Perception checks that rely on sight or smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Beak and two Claw attacks."
      },
      {
        "name": "Beak",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "1d10+5 piercing"
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d8+5 slashing"
      }
    ]
  },
  {
    "id": "cm-km-hodag",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Kingmaker",
    "name": "Hodag of the Narlmarches",
    "size": "large",
    "type": "monstrosity",
    "alignment": "Neutral Evil",
    "speed": "40 ft.",
    "challengeRating": 5,
    "ac": 16,
    "acNote": "bony plates",
    "hp": 95,
    "maxHp": 95,
    "abilityScores": {
      "strength": 19,
      "dexterity": 13,
      "constitution": 18,
      "intelligence": 3,
      "wisdom": 12,
      "charisma": 6
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "traits": [
      {
        "name": "Bounding Charge",
        "description": "If it moves at least 20 feet straight toward a target then hits with a Bite, the target takes an extra 2d8 piercing and is knocked prone."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and two Claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d10+4 piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "1d8+4 slashing"
      }
    ]
  },
  {
    "id": "cm-km-nyrissa",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Kingmaker",
    "name": "Nyrissa, the Cruel Nymph Queen",
    "size": "medium",
    "type": "fey",
    "alignment": "Neutral Evil",
    "speed": "30 ft., swim 30 ft., fly 40 ft.",
    "challengeRating": 12,
    "ac": 18,
    "acNote": "natural armor",
    "hp": 178,
    "maxHp": 178,
    "abilityScores": {
      "strength": 14,
      "dexterity": 22,
      "constitution": 18,
      "intelligence": 20,
      "wisdom": 18,
      "charisma": 25
    },
    "savingThrows": {
      "dexterity": 12,
      "wisdom": 10,
      "charisma": 14
    },
    "skills": {
      "Deception": 14,
      "Persuasion": 14
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "truesight": "60 ft.",
      "passive Perception": "14"
    },
    "languages": [
      "Common",
      "Elvish",
      "Sylvan"
    ],
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If Nyrissa fails a save, she can choose to succeed instead."
      },
      {
        "name": "Blinding Beauty",
        "description": "A creature that starts its turn within 30 ft. and can see Nyrissa must succeed on a DC 22 Constitution save or be blinded for 1 minute."
      },
      {
        "name": "Innate Spellcasting",
        "description": "At will: charm person, dimension door, mirror image; 3/day: dominate person, greater invisibility; 1/day: feeblemind, imprisonment (Briar only)."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Nyrissa makes two Thorn Whip attacks and casts one at-will spell."
      },
      {
        "name": "Thorn Whip",
        "description": "Melee Weapon Attack",
        "attackBonus": 12,
        "damageDescription": "2d8+6 piercing plus 3d6 psychic and pulled 10 feet"
      },
      {
        "name": "Kiss of Sorrow (Recharge 5-6)",
        "description": "One creature within 5 ft., DC 22 Charisma save, 8d8 psychic and stunned until end of next turn on a failure."
      }
    ],
    "legendaryActions": [
      {
        "name": "Thorn Whip",
        "description": "Nyrissa makes one Thorn Whip attack."
      },
      {
        "name": "Fey Step (Costs 2)",
        "description": "Nyrissa teleports up to 60 feet."
      },
      {
        "name": "Weep (Costs 3)",
        "description": "Each creature within 20 ft., DC 22 Wisdom save or incapacitated with grief until end of its next turn."
      }
    ],
    "legendaryActionCount": 3
  },
  {
    "id": "cm-lantern-king",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Kingmaker",
    "name": "The Lantern King (Eldest Avatar)",
    "size": "large",
    "type": "fey",
    "alignment": "Chaotic Neutral",
    "speed": "40 ft., fly 90 ft.",
    "challengeRating": 18,
    "ac": 20,
    "acNote": "unearthly grace",
    "hp": 248,
    "maxHp": 248,
    "abilityScores": {
      "strength": 18,
      "dexterity": 24,
      "constitution": 20,
      "intelligence": 24,
      "wisdom": 22,
      "charisma": 28
    },
    "savingThrows": {
      "dexterity": 14,
      "constitution": 12,
      "wisdom": 13,
      "charisma": 16
    },
    "skills": {
      "Deception": 16,
      "Insight": 13,
      "Performance": 16
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "psychic",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "poisoned",
      "stunned"
    ],
    "senses": {
      "truesight": "120 ft.",
      "passive Perception": "16"
    },
    "languages": [
      "all",
      "telepathy 120 ft."
    ],
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If the Lantern King fails a save, it can choose to succeed instead."
      },
      {
        "name": "Prankster's Reality",
        "description": "At the start of each of its turns, the Lantern King can swap the positions of any two creatures it can see within 60 feet (Charisma DC 20 negates for unwilling)."
      },
      {
        "name": "Innate Spellcasting",
        "description": "At will: confusion, major image, mislead; 3/day: mass suggestion, polymorph, reverse gravity; 1/day: power word stun, weird."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The Lantern King uses Mocking Light three times."
      },
      {
        "name": "Mocking Light",
        "description": "Ranged spell attack, +16 to hit, range 120 ft., 4d8 radiant and the target laughs uncontrollably (no reactions) until the start of its next turn."
      },
      {
        "name": "Cruel Jest (Recharge 5-6)",
        "description": "20-foot-radius sphere within 120 ft., DC 20 Wisdom save, 10d8 psychic and confused for 1 minute (half and no confusion on success)."
      }
    ],
    "legendaryActions": [
      {
        "name": "Mocking Light",
        "description": "The Lantern King uses Mocking Light once."
      },
      {
        "name": "Teleport (Costs 2)",
        "description": "The Lantern King teleports up to 120 feet."
      },
      {
        "name": "Change Fate (Costs 3)",
        "description": "The Lantern King forces one creature within 60 ft. to reroll any d20 roll it makes before its next turn and use the worse result."
      }
    ],
    "legendaryActionCount": 3
  },
  {
    "id": "cm-km-troll-king-hargulka",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Kingmaker",
    "name": "Hargulka, the Troll King",
    "size": "large",
    "type": "giant",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 6,
    "ac": 15,
    "acNote": "hide and bone",
    "hp": 115,
    "maxHp": 115,
    "abilityScores": {
      "strength": 20,
      "dexterity": 12,
      "constitution": 20,
      "intelligence": 9,
      "wisdom": 9,
      "charisma": 11
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "9"
    },
    "languages": [
      "Giant"
    ],
    "traits": [
      {
        "name": "Regeneration",
        "description": "Regains 15 hit points at the start of its turn unless it took acid or fire damage since its last turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and two Claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "1d8+5 piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "2d6+5 slashing"
      }
    ]
  },
  {
    "id": "cm-km-spriggan-raider",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Kingmaker",
    "name": "Spriggan Kingdom-Raider",
    "size": "small",
    "type": "fey",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 2,
    "ac": 14,
    "hp": 33,
    "maxHp": 33,
    "abilityScores": {
      "strength": 12,
      "dexterity": 15,
      "constitution": 13,
      "intelligence": 11,
      "wisdom": 10,
      "charisma": 9
    },
    "skills": {
      "Stealth": 4
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Sylvan",
      "Common"
    ],
    "traits": [
      {
        "name": "Enlarge (Recharge after a Short or Long Rest)",
        "description": "For 1 minute, the spriggan is Large; its melee attacks deal an extra 1d6 damage (included)."
      }
    ],
    "actions": [
      {
        "name": "Cruel Blade",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d8+2 slashing plus 1d6 (enlarged)"
      }
    ]
  },
  {
    "id": "cm-km-boggard-swamp-priest",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Kingmaker",
    "name": "Hooktongue Boggard Priest",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "20 ft., swim 40 ft.",
    "challengeRating": 3,
    "ac": 14,
    "acNote": "hide armor, shield",
    "hp": 45,
    "maxHp": 45,
    "abilityScores": {
      "strength": 14,
      "dexterity": 12,
      "constitution": 14,
      "intelligence": 10,
      "wisdom": 15,
      "charisma": 11
    },
    "skills": {
      "Stealth": 4
    },
    "senses": {
      "passive Perception": "12"
    },
    "languages": [
      "Boggard"
    ],
    "traits": [
      {
        "name": "Swamp Camouflage",
        "description": "Advantage on Stealth checks in swampy terrain."
      },
      {
        "name": "Terrifying Croak",
        "description": "One creature within 30 ft., DC 12 Wisdom save or frightened until end of its next turn (recharge on a short rest)."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Tongue and one Club attack."
      },
      {
        "name": "Sticky Tongue",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 bludgeoning and pulled 10 feet"
      },
      {
        "name": "Ritual Club",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d8+2 bludgeoning plus 1d6 poison"
      }
    ]
  },
  {
    "id": "cm-km-first-world-scythe-tree",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Kingmaker",
    "name": "First World Scythe Tree",
    "size": "huge",
    "type": "plant",
    "alignment": "Neutral Evil",
    "speed": "20 ft.",
    "challengeRating": 7,
    "ac": 16,
    "acNote": "bark armor",
    "hp": 138,
    "maxHp": 138,
    "abilityScores": {
      "strength": 22,
      "dexterity": 8,
      "constitution": 19,
      "intelligence": 6,
      "wisdom": 12,
      "charisma": 7
    },
    "damageResistances": [
      "bludgeoning",
      "piercing"
    ],
    "damageVulnerabilities": [
      "fire"
    ],
    "conditionImmunities": [
      "blinded",
      "deafened",
      "exhaustion",
      "frightened"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "passive Perception": "11"
    },
    "traits": [
      {
        "name": "False Appearance",
        "description": "Indistinguishable from a dead tree while motionless."
      },
      {
        "name": "Whirling Limbs",
        "description": "A creature that starts its turn within 10 ft. must succeed on a DC 15 Dexterity save or take 2d6 slashing."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Scythe-Branch attacks."
      },
      {
        "name": "Scythe-Branch",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "3d8+6 slashing"
      }
    ]
  },
  {
    "id": "cm-km-will-o-wisp-swarm",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Kingmaker",
    "name": "Candlemere Wisp Cluster",
    "size": "small",
    "type": "undead",
    "alignment": "Chaotic Evil",
    "speed": "0 ft., fly 50 ft. (hover)",
    "challengeRating": 3,
    "ac": 19,
    "hp": 33,
    "maxHp": 33,
    "abilityScores": {
      "strength": 1,
      "dexterity": 28,
      "constitution": 10,
      "intelligence": 13,
      "wisdom": 14,
      "charisma": 11
    },
    "damageResistances": [
      "acid",
      "cold",
      "fire",
      "necrotic",
      "thunder"
    ],
    "damageImmunities": [
      "lightning",
      "poison"
    ],
    "conditionImmunities": [
      "exhaustion",
      "grappled",
      "paralyzed",
      "petrified",
      "poisoned",
      "prone",
      "restrained",
      "unconscious"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "12"
    },
    "traits": [
      {
        "name": "Ephemeral",
        "description": "Can't wear or carry anything."
      },
      {
        "name": "Variable Illumination",
        "description": "Sheds bright light in a 5- to 20-foot radius, dimming or brightening as a bonus action."
      }
    ],
    "actions": [
      {
        "name": "Shock",
        "description": "Melee spell attack, +4 to hit, 2d8 lightning; a creature reduced to 0 hp by this is stable but unconscious."
      }
    ]
  },
  {
    "id": "cm-km-armag-twice-born",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Kingmaker",
    "name": "Armag the Twice-Born",
    "size": "medium",
    "type": "undead",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 6,
    "ac": 17,
    "acNote": "barbarian plates",
    "hp": 104,
    "maxHp": 104,
    "abilityScores": {
      "strength": 19,
      "dexterity": 12,
      "constitution": 18,
      "intelligence": 8,
      "wisdom": 11,
      "charisma": 12
    },
    "savingThrows": {
      "strength": 8,
      "constitution": 7
    },
    "damageResistances": [
      "necrotic"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "frightened",
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Hallit"
    ],
    "traits": [
      {
        "name": "Undying Rage",
        "description": "The first time Armag drops to 0 hp, he instead drops to 1 hp and gains 20 temporary hit points (once)."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Cursed Falchion attacks."
      },
      {
        "name": "Cursed Falchion",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "2d4+5 slashing plus 1d8 necrotic"
      }
    ]
  },
  {
    "id": "cm-km-linnorm-fen",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Kingmaker",
    "name": "Fen Linnorm",
    "size": "huge",
    "type": "dragon",
    "alignment": "Chaotic Evil",
    "speed": "40 ft., swim 40 ft.",
    "challengeRating": 11,
    "ac": 18,
    "acNote": "natural armor",
    "hp": 195,
    "maxHp": 195,
    "abilityScores": {
      "strength": 24,
      "dexterity": 12,
      "constitution": 22,
      "intelligence": 15,
      "wisdom": 14,
      "charisma": 15
    },
    "savingThrows": {
      "dexterity": 6,
      "constitution": 11,
      "wisdom": 7
    },
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "poisoned"
    ],
    "senses": {
      "blindsight": "30 ft.",
      "darkvision": "120 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "Draconic"
    ],
    "traits": [
      {
        "name": "Death Curse",
        "description": "A creature that lands the killing blow on the linnorm is cursed: it can't regain hit points for 24 hours (DC 18 Charisma negates)."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and two Claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 11,
        "damageDescription": "2d12+7 piercing plus 3d6 poison"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 11,
        "damageDescription": "2d8+7 slashing"
      },
      {
        "name": "Poison Breath (Recharge 5-6)",
        "description": "40-foot cone, DC 19 Constitution save, 12d6 poison (half on success)."
      }
    ]
  },
  {
    "id": "cm-wotr-cultist-of-baphomet",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Wrath of the Righteous",
    "name": "Cultist of Baphomet",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 1,
    "ac": 13,
    "hp": 27,
    "maxHp": 27,
    "abilityScores": {
      "strength": 13,
      "dexterity": 12,
      "constitution": 13,
      "intelligence": 10,
      "wisdom": 11,
      "charisma": 12
    },
    "skills": {
      "Deception": 3,
      "Religion": 2
    },
    "senses": {
      "passive Perception": "10"
    },
    "languages": [
      "Abyssal",
      "Common"
    ],
    "traits": [
      {
        "name": "Maze Sense",
        "description": "The cultist ignores the effects of difficult terrain and being lost in the Abyss."
      }
    ],
    "actions": [
      {
        "name": "Ranseur",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d10+1 piercing"
      },
      {
        "name": "Heavy Crossbow",
        "description": "Ranged Weapon Attack",
        "attackBonus": 3,
        "damageDescription": "1d10 piercing"
      }
    ]
  },
  {
    "id": "cm-wotr-dretch-swarm",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Wrath of the Righteous",
    "name": "Dretch Rabble",
    "size": "medium",
    "type": "fiend",
    "alignment": "Chaotic Evil",
    "speed": "20 ft.",
    "challengeRating": 1,
    "ac": 11,
    "hp": 30,
    "maxHp": 30,
    "abilityScores": {
      "strength": 11,
      "dexterity": 12,
      "constitution": 12,
      "intelligence": 5,
      "wisdom": 8,
      "charisma": 3
    },
    "damageResistances": [
      "cold",
      "fire",
      "lightning"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "9"
    },
    "languages": [
      "Abyssal (understands but can't speak)"
    ],
    "traits": [
      {
        "name": "Swarm",
        "description": "Can occupy another creature's space; can't regain hit points or gain temporary hit points."
      }
    ],
    "actions": [
      {
        "name": "Claws and Bites",
        "description": "Melee Weapon Attack",
        "attackBonus": 3,
        "damageDescription": "2d8+1 slashing, or 1d8+1 if bloodied"
      },
      {
        "name": "Fetid Cloud (1/Day)",
        "description": "10-foot radius, DC 11 Constitution save, poisoned until end of next turn on a failure."
      }
    ]
  },
  {
    "id": "cm-wotr-vrock-shrieker",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Wrath of the Righteous",
    "name": "Worldwound Vrock",
    "size": "large",
    "type": "fiend",
    "alignment": "Chaotic Evil",
    "speed": "40 ft., fly 60 ft.",
    "challengeRating": 6,
    "ac": 15,
    "acNote": "natural armor",
    "hp": 104,
    "maxHp": 104,
    "abilityScores": {
      "strength": 17,
      "dexterity": 15,
      "constitution": 18,
      "intelligence": 8,
      "wisdom": 13,
      "charisma": 8
    },
    "savingThrows": {
      "dexterity": 5,
      "wisdom": 4,
      "charisma": 2
    },
    "damageResistances": [
      "cold",
      "fire",
      "lightning"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "poisoned"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Abyssal",
      "telepathy 60 ft."
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Beak and two Talons attack."
      },
      {
        "name": "Beak",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "1d6+3 piercing"
      },
      {
        "name": "Talons",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "2d10+3 slashing"
      },
      {
        "name": "Screech (Recharge after Short/Long Rest)",
        "description": "20-foot radius, DC 14 Constitution save or stunned until end of the vrock's next turn."
      }
    ]
  },
  {
    "id": "cm-wotr-babau-skirmisher",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Wrath of the Righteous",
    "name": "Babau Crusade-Slayer",
    "size": "medium",
    "type": "fiend",
    "alignment": "Chaotic Evil",
    "speed": "40 ft.",
    "challengeRating": 4,
    "ac": 16,
    "acNote": "natural armor",
    "hp": 82,
    "maxHp": 82,
    "abilityScores": {
      "strength": 16,
      "dexterity": 14,
      "constitution": 16,
      "intelligence": 11,
      "wisdom": 12,
      "charisma": 13
    },
    "damageResistances": [
      "cold",
      "fire",
      "lightning"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "poisoned"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Abyssal",
      "telepathy 120 ft."
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      },
      {
        "name": "Weakening Gaze",
        "description": "One creature within 30 ft. the babau can see, DC 13 Constitution save or its weapon damage is halved for 1 minute."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Claw and one Bite attack."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "2d6+3 slashing plus 1d10 acid"
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "1d8+3 piercing"
      }
    ]
  },
  {
    "id": "cm-wotr-ravener-hunter",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Wrath of the Righteous",
    "name": "Ravener Hunter of Deskari",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 7,
    "ac": 15,
    "acNote": "chitin armor",
    "hp": 97,
    "maxHp": 97,
    "abilityScores": {
      "strength": 12,
      "dexterity": 16,
      "constitution": 15,
      "intelligence": 12,
      "wisdom": 18,
      "charisma": 13
    },
    "savingThrows": {
      "wisdom": 7,
      "dexterity": 6
    },
    "skills": {
      "Nature": 4,
      "Survival": 7
    },
    "damageResistances": [
      "poison"
    ],
    "senses": {
      "passive Perception": "16"
    },
    "languages": [
      "Abyssal",
      "Common"
    ],
    "traits": [
      {
        "name": "Locust Swarm Form (Recharge 5-6)",
        "description": "The hunter becomes a swarm of locusts until it takes damage from a single source of 10+; while a swarm it has resistance to nonmagical bludgeoning, piercing, and slashing."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Locust Scythe attacks and one Insect Plague bolt."
      },
      {
        "name": "Locust Scythe",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "2d6+3 slashing plus 2d6 necrotic"
      },
      {
        "name": "Insect Plague Bolt",
        "description": "Ranged spell attack, +7 to hit, 4d10 piercing."
      }
    ]
  },
  {
    "id": "cm-wotr-hezrou-frontline",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Wrath of the Righteous",
    "name": "Herald's Hezrou",
    "size": "large",
    "type": "fiend",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 8,
    "ac": 16,
    "acNote": "natural armor",
    "hp": 136,
    "maxHp": 136,
    "abilityScores": {
      "strength": 19,
      "dexterity": 17,
      "constitution": 20,
      "intelligence": 5,
      "wisdom": 12,
      "charisma": 13
    },
    "savingThrows": {
      "strength": 7,
      "constitution": 8,
      "wisdom": 4
    },
    "damageResistances": [
      "cold",
      "fire",
      "lightning"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "poisoned"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Abyssal",
      "telepathy 120 ft."
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      },
      {
        "name": "Stench",
        "description": "A creature that starts its turn within 10 ft. must succeed on a DC 14 Constitution save or be poisoned until the start of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and two Claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d10+4 piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "1d10+4 slashing"
      }
    ]
  },
  {
    "id": "cm-wotr-shield-archon",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Wrath of the Righteous",
    "name": "Sword of Valor Shield Archon",
    "size": "medium",
    "type": "celestial",
    "alignment": "Lawful Good",
    "speed": "30 ft., fly 40 ft.",
    "challengeRating": 6,
    "ac": 19,
    "acNote": "sacred plate, shield",
    "hp": 90,
    "maxHp": 90,
    "abilityScores": {
      "strength": 18,
      "dexterity": 14,
      "constitution": 16,
      "intelligence": 12,
      "wisdom": 15,
      "charisma": 16
    },
    "savingThrows": {
      "wisdom": 5,
      "charisma": 6
    },
    "damageResistances": [
      "radiant"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "truesight": "60 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "Celestial",
      "Common"
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      },
      {
        "name": "Aegis",
        "description": "Allies within 10 ft. gain +2 AC (as long as the archon isn't incapacitated)."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Radiant Blade attacks."
      },
      {
        "name": "Radiant Blade",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "1d8+4 slashing plus 2d8 radiant"
      },
      {
        "name": "Consecrating Burst (Recharge 5-6)",
        "description": "20-foot radius, DC 14 Constitution save, 5d8 radiant to fiends and undead (half to others)."
      }
    ]
  },
  {
    "id": "cm-wotr-nabasu-glutton",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Wrath of the Righteous",
    "name": "Nabasu Soul-Glutton",
    "size": "medium",
    "type": "fiend",
    "alignment": "Chaotic Evil",
    "speed": "40 ft.",
    "challengeRating": 8,
    "ac": 16,
    "acNote": "natural armor",
    "hp": 118,
    "maxHp": 118,
    "abilityScores": {
      "strength": 18,
      "dexterity": 16,
      "constitution": 17,
      "intelligence": 13,
      "wisdom": 14,
      "charisma": 15
    },
    "savingThrows": {
      "constitution": 7,
      "wisdom": 6
    },
    "damageResistances": [
      "cold",
      "fire",
      "lightning"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "poisoned"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "Abyssal",
      "telepathy 120 ft."
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      },
      {
        "name": "Death-Stealing Gaze",
        "description": "One creature within 30 ft. the nabasu can see that has 100 hit points or fewer, DC 15 Constitution save or take 4d10 necrotic; if this reduces it to 0 hp, it dies and the nabasu grows more powerful."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and two Claw attacks, and uses Death-Stealing Gaze."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "1d10+4 piercing plus 2d6 necrotic"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "1d8+4 slashing"
      }
    ]
  },
  {
    "id": "cm-wotr-baphomet",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Wrath of the Righteous",
    "name": "Baphomet, the Prince of Beasts",
    "size": "huge",
    "type": "fiend",
    "alignment": "Chaotic Evil",
    "speed": "50 ft.",
    "challengeRating": 22,
    "ac": 22,
    "acNote": "natural armor, +2 heavy plate",
    "hp": 333,
    "maxHp": 333,
    "abilityScores": {
      "strength": 30,
      "dexterity": 16,
      "constitution": 26,
      "intelligence": 22,
      "wisdom": 22,
      "charisma": 24
    },
    "savingThrows": {
      "strength": 18,
      "constitution": 16,
      "wisdom": 14,
      "charisma": 15
    },
    "skills": {
      "Perception": 13,
      "Survival": 13
    },
    "damageResistances": [
      "cold",
      "lightning"
    ],
    "damageImmunities": [
      "fire",
      "poison",
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "truesight": "120 ft.",
      "passive Perception": "18"
    },
    "languages": [
      "all",
      "telepathy 120 ft."
    ],
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If Baphomet fails a save, he can choose to succeed instead."
      },
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells and other magical effects."
      },
      {
        "name": "Labyrinthine Recall",
        "description": "Baphomet can perfectly recall any path he has ever traveled and can't be lost by magical means."
      },
      {
        "name": "Inescapable Maze",
        "description": "As a bonus action, Baphomet banishes one creature within 60 ft. into a demiplane maze (DC 22 Charisma negates); it can use an action to attempt a DC 22 Intelligence check to escape."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Baphomet makes three attacks: one with his Heartcleaver and two Gore attacks."
      },
      {
        "name": "Heartcleaver (Glaive)",
        "description": "Melee Weapon Attack",
        "attackBonus": 18,
        "damageDescription": "3d10+10 slashing plus 4d6 necrotic"
      },
      {
        "name": "Gore",
        "description": "Melee Weapon Attack",
        "attackBonus": 18,
        "damageDescription": "3d8+10 piercing and DC 22 Strength save or knocked prone"
      },
      {
        "name": "Bellowing Roar (Recharge 5-6)",
        "description": "60-foot cone, DC 20 Wisdom save, 10d8 thunder and frightened for 1 minute (half and no fear on success)."
      }
    ],
    "legendaryActions": [
      {
        "name": "Gore",
        "description": "Baphomet makes one Gore attack."
      },
      {
        "name": "Maze Step (Costs 2)",
        "description": "Baphomet teleports up to 60 feet through a fold in the maze."
      },
      {
        "name": "Cast a Spell (Costs 3)",
        "description": "Baphomet casts dominate monster or wall of force (DC 20)."
      }
    ],
    "legendaryActionCount": 3
  },
  {
    "id": "cm-wotr-deskari",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Wrath of the Righteous",
    "name": "Deskari, the Usher of the Apocalypse",
    "size": "gargantuan",
    "type": "fiend",
    "alignment": "Chaotic Evil",
    "speed": "40 ft., burrow 40 ft., fly 90 ft.",
    "challengeRating": 24,
    "ac": 23,
    "acNote": "natural armor",
    "hp": 388,
    "maxHp": 388,
    "abilityScores": {
      "strength": 30,
      "dexterity": 20,
      "constitution": 28,
      "intelligence": 20,
      "wisdom": 22,
      "charisma": 25
    },
    "savingThrows": {
      "strength": 18,
      "dexterity": 13,
      "constitution": 17,
      "wisdom": 14
    },
    "damageResistances": [
      "cold",
      "lightning"
    ],
    "damageImmunities": [
      "fire",
      "poison",
      "necrotic",
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "grappled",
      "paralyzed",
      "poisoned",
      "prone",
      "restrained"
    ],
    "senses": {
      "truesight": "120 ft.",
      "blindsight": "60 ft.",
      "passive Perception": "16"
    },
    "languages": [
      "all",
      "telepathy 120 ft."
    ],
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If Deskari fails a save, he can choose to succeed instead."
      },
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells and other magical effects."
      },
      {
        "name": "Rift of Rain (Worldwound)",
        "description": "While Deskari is within his Worldwound lair, the ground within 120 ft. is difficult terrain that pulls creatures toward him (DC 22 Strength ends)."
      },
      {
        "name": "Locust Aura",
        "description": "A creature that starts its turn within 20 ft. takes 4d6 piercing (DC 22 Dexterity half) from a whirling scythe-swarm."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Deskari makes one Scythe-Blade attack, one Bite attack, and one Sting attack."
      },
      {
        "name": "Scythe-Blade Arm",
        "description": "Melee Weapon Attack",
        "attackBonus": 19,
        "damageDescription": "4d10+10 slashing"
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 19,
        "damageDescription": "4d8+10 piercing"
      },
      {
        "name": "Sting",
        "description": "Melee Weapon Attack",
        "attackBonus": 19,
        "damageDescription": "3d8+10 piercing plus 6d6 poison and DC 23 Constitution save or paralyzed for 1 minute"
      },
      {
        "name": "Apocalypse Swarm (Recharge 5-6)",
        "description": "60-foot-radius sphere within 120 ft., DC 22 Dexterity save, 14d6 piercing and blinded until end of next turn (half and no blindness on success)."
      }
    ],
    "legendaryActions": [
      {
        "name": "Scythe-Blade",
        "description": "Deskari makes one Scythe-Blade Arm attack."
      },
      {
        "name": "Burrow",
        "description": "Deskari burrows up to half his speed; opportunity attacks against him have disadvantage until his next turn."
      },
      {
        "name": "Summon the Swarm (Costs 3)",
        "description": "Deskari uses Apocalypse Swarm if available, or recharges it."
      }
    ],
    "legendaryActionCount": 3
  },
  {
    "id": "cm-wotr-nocticula",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Wrath of the Righteous",
    "name": "Nocticula, the Redeemer Queen (Demon Lord Aspect)",
    "size": "medium",
    "type": "fiend",
    "alignment": "Chaotic Neutral",
    "speed": "40 ft., fly 90 ft.",
    "challengeRating": 21,
    "ac": 21,
    "acNote": "unearthly grace",
    "hp": 310,
    "maxHp": 310,
    "abilityScores": {
      "strength": 22,
      "dexterity": 26,
      "constitution": 24,
      "intelligence": 24,
      "wisdom": 22,
      "charisma": 30
    },
    "savingThrows": {
      "dexterity": 16,
      "constitution": 15,
      "wisdom": 14,
      "charisma": 18
    },
    "skills": {
      "Deception": 18,
      "Perception": 13,
      "Stealth": 16
    },
    "damageResistances": [
      "cold",
      "lightning",
      "necrotic"
    ],
    "damageImmunities": [
      "fire",
      "poison",
      "psychic"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "truesight": "120 ft.",
      "passive Perception": "18"
    },
    "languages": [
      "all",
      "telepathy 120 ft."
    ],
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If Nocticula fails a save, she can choose to succeed instead."
      },
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells and other magical effects."
      },
      {
        "name": "Shadow Step",
        "description": "As a bonus action while in dim light or darkness, Nocticula teleports up to 120 feet to another space in dim light or darkness."
      },
      {
        "name": "Beauty of the Midnight",
        "description": "A creature that starts its turn within 30 ft. and can see Nocticula must succeed on a DC 22 Wisdom save or be charmed until the start of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Nocticula makes three Shadow-Blade attacks."
      },
      {
        "name": "Shadow-Blade",
        "description": "Melee Weapon Attack",
        "attackBonus": 17,
        "damageDescription": "3d8+8 slashing plus 4d6 necrotic"
      },
      {
        "name": "Umbral Nova (Recharge 5-6)",
        "description": "40-foot-radius sphere within 120 ft., DC 22 Dexterity save, 12d8 necrotic and blinded for 1 minute (half and no blindness on success)."
      }
    ],
    "legendaryActions": [
      {
        "name": "Shadow-Blade",
        "description": "Nocticula makes one Shadow-Blade attack."
      },
      {
        "name": "Shadow Step (Costs 2)",
        "description": "Nocticula uses Shadow Step."
      },
      {
        "name": "Command the Adored (Costs 3)",
        "description": "One creature charmed by Nocticula uses its reaction to make one weapon attack against a target of her choice."
      }
    ],
    "legendaryActionCount": 3
  },
  {
    "id": "cm-wotr-brimorak",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Wrath of the Righteous",
    "name": "Brimorak Firestarter",
    "size": "small",
    "type": "fiend",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 3,
    "ac": 14,
    "hp": 45,
    "maxHp": 45,
    "abilityScores": {
      "strength": 16,
      "dexterity": 13,
      "constitution": 15,
      "intelligence": 8,
      "wisdom": 11,
      "charisma": 10
    },
    "damageResistances": [
      "cold",
      "lightning"
    ],
    "damageImmunities": [
      "fire",
      "poison"
    ],
    "conditionImmunities": [
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Abyssal"
    ],
    "traits": [
      {
        "name": "Fire Aura",
        "description": "A creature that touches the brimorak or hits it with a melee attack within 5 ft. takes 1d6 fire."
      },
      {
        "name": "Death Burst",
        "description": "When it dies, it explodes: 10-foot radius, DC 12 Dexterity save, 3d6 fire."
      }
    ],
    "actions": [
      {
        "name": "Flaming Scimitar",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d6+3 slashing plus 1d6 fire"
      },
      {
        "name": "Fire Bolt",
        "description": "Ranged spell attack, +4 to hit, 2d10 fire."
      }
    ]
  },
  {
    "id": "cm-wotr-schir-brute",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Wrath of the Righteous",
    "name": "Schir Warband Brute",
    "size": "medium",
    "type": "fiend",
    "alignment": "Chaotic Evil",
    "speed": "40 ft.",
    "challengeRating": 4,
    "ac": 14,
    "acNote": "natural armor",
    "hp": 71,
    "maxHp": 71,
    "abilityScores": {
      "strength": 17,
      "dexterity": 13,
      "constitution": 16,
      "intelligence": 6,
      "wisdom": 12,
      "charisma": 8
    },
    "damageResistances": [
      "cold",
      "fire",
      "lightning"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Abyssal"
    ],
    "traits": [
      {
        "name": "Charge",
        "description": "If it moves at least 20 feet toward a target then hits with its Halberd, the target takes an extra 2d6 slashing."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Halberd and one Gore attack."
      },
      {
        "name": "Halberd",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d10+3 slashing"
      },
      {
        "name": "Gore",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d8+3 piercing"
      }
    ]
  },
  {
    "id": "cm-wotr-gray-garrison-cultist-lord",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Wrath of the Righteous",
    "name": "Staunton Vhane, the Fallen Warpriest",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 8,
    "ac": 18,
    "acNote": "corrupted plate, shield",
    "hp": 120,
    "maxHp": 120,
    "abilityScores": {
      "strength": 16,
      "dexterity": 12,
      "constitution": 16,
      "intelligence": 11,
      "wisdom": 16,
      "charisma": 14
    },
    "savingThrows": {
      "constitution": 7,
      "wisdom": 7
    },
    "skills": {
      "Religion": 4,
      "Intimidation": 6
    },
    "damageResistances": [
      "necrotic"
    ],
    "senses": {
      "passive Perception": "13"
    },
    "languages": [
      "Abyssal",
      "Common",
      "Dwarvish"
    ],
    "traits": [
      {
        "name": "Wardstone Corruption",
        "description": "While within the Worldwound, Staunton regains 10 hit points at the start of his turn if he has at least 1 hit point."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Three Desecrated Warhammer attacks."
      },
      {
        "name": "Desecrated Warhammer",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "1d8+3 bludgeoning plus 2d6 necrotic"
      },
      {
        "name": "Unholy Blight (Recharge 5-6)",
        "description": "20-foot-radius sphere within 90 ft., DC 15 Constitution save, 5d8 necrotic (half on success)."
      }
    ]
  },
  {
    "id": "cm-wotr-crusader-marshal-ally",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Wrath of the Righteous",
    "name": "Queen's Crusade Marshal",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Good",
    "speed": "30 ft.",
    "challengeRating": 5,
    "ac": 18,
    "acNote": "plate, shield",
    "hp": 85,
    "maxHp": 85,
    "abilityScores": {
      "strength": 17,
      "dexterity": 12,
      "constitution": 15,
      "intelligence": 12,
      "wisdom": 14,
      "charisma": 15
    },
    "savingThrows": {
      "strength": 6,
      "charisma": 5
    },
    "skills": {
      "Persuasion": 5,
      "Religion": 4
    },
    "senses": {
      "passive Perception": "12"
    },
    "languages": [
      "Common",
      "Celestial"
    ],
    "traits": [
      {
        "name": "Rallying Presence",
        "description": "Allies within 30 ft. have advantage on saves against being frightened."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Three Blessed Longsword attacks."
      },
      {
        "name": "Blessed Longsword",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "1d8+3 slashing plus 1d6 radiant"
      },
      {
        "name": "Crusader's Command (Recharge 5-6)",
        "description": "Up to three allies within 30 ft. can use their reaction to move up to their speed and make one weapon attack."
      }
    ]
  },
  {
    "id": "cm-wdmm-halaster-blackcloak",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Halaster Blackcloak, the Mad Mage",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Chaotic Neutral",
    "speed": "30 ft., fly 30 ft.",
    "challengeRating": 21,
    "ac": 20,
    "acNote": "robe of the archmagi",
    "hp": 260,
    "maxHp": 260,
    "abilityScores": {
      "strength": 11,
      "dexterity": 20,
      "constitution": 17,
      "intelligence": 24,
      "wisdom": 17,
      "charisma": 16
    },
    "savingThrows": {
      "intelligence": 15,
      "wisdom": 11,
      "charisma": 10
    },
    "skills": {
      "Arcana": 15,
      "History": 15
    },
    "damageResistances": [
      "force"
    ],
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "truesight": "120 ft.",
      "passive Perception": "13"
    },
    "languages": [
      "all"
    ],
    "traits": [
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If Halaster fails a save, he can choose to succeed instead."
      },
      {
        "name": "Blink",
        "description": "At the end of each of his turns, Halaster has a 50% chance to vanish into the Ethereal Plane until the start of his next turn."
      },
      {
        "name": "Spellcasting",
        "description": "Halaster is a 20th-level spellcaster (spell save DC 23, +15 to hit with spell attacks). He knows every wizard spell of 9th level or lower."
      },
      {
        "name": "Undermountain Master",
        "description": "While anywhere in Undermountain, Halaster knows the location of every creature and can cast scrying at will without components."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Halaster casts one cantrip and makes one Arcane Burst attack."
      },
      {
        "name": "Arcane Burst",
        "description": "Melee or ranged spell attack, +15 to hit, range 120 ft., 4d10 force."
      },
      {
        "name": "Chaos Bolt Barrage (Recharge 5-6)",
        "description": "Up to three creatures within 120 ft., DC 23 Dexterity save, 6d8 damage of a random type each (half on success)."
      }
    ],
    "legendaryActions": [
      {
        "name": "Cantrip",
        "description": "Halaster casts a cantrip."
      },
      {
        "name": "Arcane Burst (Costs 2)",
        "description": "Halaster makes one Arcane Burst attack."
      },
      {
        "name": "Teleport (Costs 2)",
        "description": "Halaster teleports up to 120 feet."
      },
      {
        "name": "Cast a Spell (Costs 3)",
        "description": "Halaster casts a spell of 5th level or lower from his list."
      }
    ],
    "legendaryActionCount": 3
  },
  {
    "id": "cm-wdmm-halaster-apprentice-arcturia",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Arcturia, Apprentice of Halaster",
    "size": "medium",
    "type": "monstrosity",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 12,
    "ac": 16,
    "acNote": "mage armor",
    "hp": 168,
    "maxHp": 168,
    "abilityScores": {
      "strength": 13,
      "dexterity": 16,
      "constitution": 18,
      "intelligence": 20,
      "wisdom": 14,
      "charisma": 15
    },
    "savingThrows": {
      "constitution": 9,
      "intelligence": 10,
      "wisdom": 7
    },
    "skills": {
      "Arcana": 10
    },
    "damageResistances": [
      "cold"
    ],
    "conditionImmunities": [
      "charmed"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "Common",
      "Deep Speech",
      "Draconic"
    ],
    "traits": [
      {
        "name": "Flesh-Warping",
        "description": "Arcturia can reshape her body as a bonus action, gaining one benefit each turn: a bite attack, a climb speed, or resistance to one damage type until her next turn."
      },
      {
        "name": "Spellcasting",
        "description": "12th-level wizard (save DC 18): fireball, polymorph, cloudkill, cone of cold, flesh to stone."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Warped Limb attacks and one cantrip."
      },
      {
        "name": "Warped Limb",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "3d8+4 bludgeoning plus 1d8 necrotic"
      },
      {
        "name": "Firebolt",
        "description": "Ranged spell attack, +10 to hit, 3d10 fire."
      }
    ],
    "legendaryActions": [
      {
        "name": "Warped Limb",
        "description": "One Warped Limb attack."
      },
      {
        "name": "Reshape (Costs 2)",
        "description": "Arcturia uses Flesh-Warping."
      },
      {
        "name": "Cast a Spell (Costs 3)",
        "description": "Arcturia casts a spell of 3rd level or lower."
      }
    ],
    "legendaryActionCount": 3
  },
  {
    "id": "cm-wdmm-halaster-apprentice-trobriand",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Trobriand, the Metal Mage (Apprentice)",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 13,
    "ac": 18,
    "acNote": "arcane wards",
    "hp": 178,
    "maxHp": 178,
    "abilityScores": {
      "strength": 12,
      "dexterity": 15,
      "constitution": 17,
      "intelligence": 21,
      "wisdom": 15,
      "charisma": 12
    },
    "savingThrows": {
      "intelligence": 11,
      "constitution": 9
    },
    "skills": {
      "Arcana": 11
    },
    "damageImmunities": [
      "poison",
      "psychic"
    ],
    "conditionImmunities": [
      "charmed",
      "frightened",
      "poisoned"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "Common",
      "Primordial"
    ],
    "traits": [
      {
        "name": "Master of Constructs",
        "description": "Allied constructs within 60 ft. of Trobriand have advantage on saving throws."
      },
      {
        "name": "Spellcasting",
        "description": "13th-level artificer-wizard (save DC 19): shield, haste, animate objects, wall of force, forcecage."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Three Lightning Lance attacks."
      },
      {
        "name": "Lightning Lance",
        "description": "Ranged spell attack, +11 to hit, range 120 ft., 3d10 lightning."
      },
      {
        "name": "Overcharge Field (Recharge 5-6)",
        "description": "30-foot cube, DC 19 Dexterity save, 8d6 lightning (half on success)."
      }
    ],
    "legendaryActions": [
      {
        "name": "Lightning Lance",
        "description": "One Lightning Lance attack."
      },
      {
        "name": "Repair Ally (Costs 2)",
        "description": "One construct within 30 ft. regains 20 hit points."
      },
      {
        "name": "Cast a Spell (Costs 3)",
        "description": "Trobriand casts a spell of 3rd level or lower."
      }
    ],
    "legendaryActionCount": 3
  },
  {
    "id": "cm-wdmm-halaster-apprentice-muiral",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Muiral the Misshapen (Apprentice)",
    "size": "large",
    "type": "monstrosity",
    "alignment": "Chaotic Evil",
    "speed": "40 ft., climb 40 ft.",
    "challengeRating": 10,
    "ac": 17,
    "acNote": "natural armor",
    "hp": 168,
    "maxHp": 168,
    "abilityScores": {
      "strength": 20,
      "dexterity": 15,
      "constitution": 19,
      "intelligence": 16,
      "wisdom": 12,
      "charisma": 13
    },
    "savingThrows": {
      "strength": 9,
      "constitution": 8
    },
    "skills": {
      "Arcana": 7
    },
    "damageResistances": [
      "poison"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Common",
      "Undercommon"
    ],
    "traits": [
      {
        "name": "Spider Nature",
        "description": "Muiral's lower half is a giant scorpion-spider; he ignores movement restrictions from webbing and can climb difficult surfaces."
      },
      {
        "name": "Spellcasting",
        "description": "8th-level wizard (save DC 15): magic missile, misty step, lightning bolt, greater invisibility."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Greatsword attacks and one Stinger attack."
      },
      {
        "name": "Greatsword",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "3d6+5 slashing"
      },
      {
        "name": "Stinger",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "2d8+5 piercing plus 4d8 poison and DC 16 Constitution save or poisoned for 1 minute"
      }
    ]
  },
  {
    "id": "cm-wdmm-flumph-scout",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Sargauth Flumph",
    "size": "small",
    "type": "aberration",
    "alignment": "Lawful Good",
    "speed": "5 ft., fly 30 ft. (hover)",
    "challengeRating": 0.125,
    "ac": 12,
    "hp": 7,
    "maxHp": 7,
    "abilityScores": {
      "strength": 6,
      "dexterity": 15,
      "constitution": 10,
      "intelligence": 14,
      "wisdom": 14,
      "charisma": 11
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "understands Undercommon but communicates by telepathy 60 ft."
    ],
    "traits": [
      {
        "name": "Telepathic Shroud",
        "description": "Immune to any effect that would sense its emotions or read its thoughts."
      }
    ],
    "actions": [
      {
        "name": "Acid Tendrils",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "2d4 acid"
      },
      {
        "name": "Stench Spray (Recharge 6)",
        "description": "The flumph releases a stinking cloud; a creature within 15 ft. that hits it must succeed on a DC 10 Constitution save or be poisoned for 1d4 turns."
      }
    ]
  },
  {
    "id": "cm-wdmm-undermountain-goblin",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Undermountain Goblin",
    "size": "small",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 0.25,
    "ac": 15,
    "acNote": "leather armor, shield",
    "hp": 7,
    "maxHp": 7,
    "abilityScores": {
      "strength": 8,
      "dexterity": 14,
      "constitution": 10,
      "intelligence": 10,
      "wisdom": 8,
      "charisma": 8
    },
    "skills": {
      "Stealth": 6
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "9"
    },
    "languages": [
      "Common",
      "Goblin"
    ],
    "traits": [
      {
        "name": "Nimble Escape",
        "description": "Can Disengage or Hide as a bonus action."
      }
    ],
    "actions": [
      {
        "name": "Scimitar",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 slashing"
      },
      {
        "name": "Shortbow",
        "description": "Ranged Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 piercing"
      }
    ]
  },
  {
    "id": "cm-wdmm-kenku-scavenger",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Kenku Scavenger",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Chaotic Neutral",
    "speed": "30 ft.",
    "challengeRating": 0.25,
    "ac": 13,
    "hp": 13,
    "maxHp": 13,
    "abilityScores": {
      "strength": 10,
      "dexterity": 16,
      "constitution": 10,
      "intelligence": 11,
      "wisdom": 10,
      "charisma": 10
    },
    "skills": {
      "Deception": 4,
      "Stealth": 5
    },
    "senses": {
      "passive Perception": "10"
    },
    "languages": [
      "Auran, Common (via mimicry)"
    ],
    "traits": [
      {
        "name": "Mimicry",
        "description": "Can mimic sounds it has heard; DC 14 Insight to discern the trick."
      },
      {
        "name": "Ambusher",
        "description": "Advantage on attacks against surprised creatures."
      }
    ],
    "actions": [
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d6+3 piercing"
      },
      {
        "name": "Shortbow",
        "description": "Ranged Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d6+3 piercing"
      }
    ]
  },
  {
    "id": "cm-wdmm-drow-house-guard",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Drow House Guard",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 1,
    "ac": 15,
    "acNote": "chain shirt",
    "hp": 27,
    "maxHp": 27,
    "abilityScores": {
      "strength": 11,
      "dexterity": 15,
      "constitution": 12,
      "intelligence": 11,
      "wisdom": 11,
      "charisma": 12
    },
    "skills": {
      "Perception": 3,
      "Stealth": 4
    },
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Elvish",
      "Undercommon"
    ],
    "traits": [
      {
        "name": "Sunlight Sensitivity",
        "description": "Disadvantage on attacks and Perception in sunlight."
      },
      {
        "name": "Fey Ancestry",
        "description": "Advantage on saves against charm; magic can't put it to sleep."
      }
    ],
    "actions": [
      {
        "name": "Rapier",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d8+2 piercing plus 2d6 poison"
      },
      {
        "name": "Hand Crossbow",
        "description": "Ranged Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 piercing plus 2d6 poison"
      }
    ]
  },
  {
    "id": "cm-wdmm-drow-mage-sargauth",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Drow Enclave Mage",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 7,
    "ac": 15,
    "hp": 45,
    "maxHp": 45,
    "abilityScores": {
      "strength": 9,
      "dexterity": 14,
      "constitution": 10,
      "intelligence": 17,
      "wisdom": 13,
      "charisma": 12
    },
    "savingThrows": {
      "intelligence": 6,
      "wisdom": 4
    },
    "skills": {
      "Arcana": 6
    },
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Elvish",
      "Undercommon"
    ],
    "traits": [
      {
        "name": "Sunlight Sensitivity",
        "description": "Disadvantage in sunlight."
      },
      {
        "name": "Spellcasting",
        "description": "10th-level wizard (save DC 14): magic missile, misty step, lightning bolt, fireball, greater invisibility, cloudkill."
      }
    ],
    "actions": [
      {
        "name": "Staff",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d8+2 bludgeoning"
      },
      {
        "name": "Summon Demon (1/Day)",
        "description": "The mage magically summons a quasit that acts on its initiative."
      }
    ]
  },
  {
    "id": "cm-wdmm-mind-flayer-arcanist",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Sargauth Mind Flayer Arcanist",
    "size": "medium",
    "type": "aberration",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 8,
    "ac": 15,
    "acNote": "breastplate",
    "hp": 71,
    "maxHp": 71,
    "abilityScores": {
      "strength": 11,
      "dexterity": 12,
      "constitution": 12,
      "intelligence": 19,
      "wisdom": 17,
      "charisma": 17
    },
    "savingThrows": {
      "intelligence": 7,
      "wisdom": 6,
      "charisma": 6
    },
    "skills": {
      "Arcana": 7,
      "Perception": 6
    },
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "15"
    },
    "languages": [
      "Deep Speech",
      "Undercommon",
      "telepathy 120 ft."
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      },
      {
        "name": "Innate Spellcasting",
        "description": "At will: detect thoughts, levitate; 1/day: dominate monster, plane shift (self only), telekinesis."
      }
    ],
    "actions": [
      {
        "name": "Tentacles",
        "description": "Melee attack, +7 to hit, 2d10+2 psychic and grappled (escape DC 15); while grappled the target is stunned."
      },
      {
        "name": "Extract Brain",
        "description": "Melee attack against an incapacitated grappled creature, +7 to hit, 10d10 piercing; kills a creature reduced to 0 hp."
      },
      {
        "name": "Mind Blast (Recharge 5-6)",
        "description": "60-foot cone, DC 15 Intelligence save, 4d8+4 psychic and stunned for 1 minute on a failure."
      }
    ]
  },
  {
    "id": "cm-wdmm-grell-hunter",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Grell Hunter",
    "size": "medium",
    "type": "aberration",
    "alignment": "Neutral Evil",
    "speed": "10 ft., fly 30 ft. (hover)",
    "challengeRating": 3,
    "ac": 12,
    "hp": 55,
    "maxHp": 55,
    "abilityScores": {
      "strength": 15,
      "dexterity": 14,
      "constitution": 16,
      "intelligence": 12,
      "wisdom": 11,
      "charisma": 9
    },
    "damageImmunities": [
      "lightning"
    ],
    "conditionImmunities": [
      "blinded",
      "prone"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Grell"
    ],
    "traits": [
      {
        "name": "Levitate",
        "description": "The grell can move up and down freely."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Tentacles and one Beak attack."
      },
      {
        "name": "Tentacles",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d10+2 piercing plus 2d6 poison and DC 13 Constitution save or paralyzed for 1 minute"
      },
      {
        "name": "Beak",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "2d4+2 piercing"
      }
    ]
  },
  {
    "id": "cm-wdmm-hook-horror-pack",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Undermountain Hook Horror",
    "size": "large",
    "type": "monstrosity",
    "alignment": "Neutral",
    "speed": "10 ft., climb 30 ft.",
    "challengeRating": 3,
    "ac": 15,
    "acNote": "natural armor",
    "hp": 75,
    "maxHp": 75,
    "abilityScores": {
      "strength": 18,
      "dexterity": 10,
      "constitution": 15,
      "intelligence": 6,
      "wisdom": 12,
      "charisma": 7
    },
    "senses": {
      "blindsight": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Hook Horror"
    ],
    "traits": [
      {
        "name": "Echolocation",
        "description": "Can't use its blindsight while deafened."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Hook attacks."
      },
      {
        "name": "Hook",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "1d6+4 piercing"
      }
    ]
  },
  {
    "id": "cm-wdmm-gray-ooze-crawler",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Gray Ooze Crawler",
    "size": "medium",
    "type": "ooze",
    "alignment": "Unaligned",
    "speed": "10 ft., climb 10 ft.",
    "challengeRating": 1,
    "ac": 8,
    "hp": 22,
    "maxHp": 22,
    "abilityScores": {
      "strength": 12,
      "dexterity": 6,
      "constitution": 16,
      "intelligence": 1,
      "wisdom": 6,
      "charisma": 2
    },
    "damageResistances": [
      "acid",
      "cold",
      "fire"
    ],
    "conditionImmunities": [
      "blinded",
      "charmed",
      "deafened",
      "exhaustion",
      "frightened",
      "prone"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "passive Perception": "8"
    },
    "traits": [
      {
        "name": "Corrode Metal",
        "description": "Nonmagical metal that hits the ooze corrodes; a weapon takes a permanent -1 penalty to damage."
      },
      {
        "name": "False Appearance",
        "description": "Indistinguishable from an oily pool while motionless."
      }
    ],
    "actions": [
      {
        "name": "Pseudopod",
        "description": "Melee Weapon Attack",
        "attackBonus": 3,
        "damageDescription": "1d6+1 bludgeoning plus 2d6 acid"
      }
    ]
  },
  {
    "id": "cm-wdmm-wererat-skulk",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Skullport Wererat",
    "size": "medium",
    "type": "monstrosity",
    "alignment": "Lawful Evil",
    "speed": "30 ft.",
    "challengeRating": 2,
    "ac": 12,
    "hp": 33,
    "maxHp": 33,
    "abilityScores": {
      "strength": 10,
      "dexterity": 15,
      "constitution": 12,
      "intelligence": 11,
      "wisdom": 10,
      "charisma": 8
    },
    "skills": {
      "Perception": 2,
      "Stealth": 4
    },
    "damageImmunities": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Common"
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two attacks, only one of which can be a Bite."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d4+2 piercing plus lycanthropy"
      },
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 piercing"
      },
      {
        "name": "Hand Crossbow",
        "description": "Ranged Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 piercing"
      }
    ]
  },
  {
    "id": "cm-wdmm-quaggoth-thonot",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Quaggoth Thonot",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Chaotic Neutral",
    "speed": "30 ft., climb 30 ft.",
    "challengeRating": 2,
    "ac": 13,
    "hp": 45,
    "maxHp": 45,
    "abilityScores": {
      "strength": 17,
      "dexterity": 12,
      "constitution": 16,
      "intelligence": 6,
      "wisdom": 12,
      "charisma": 7
    },
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "poisoned"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Undercommon"
    ],
    "traits": [
      {
        "name": "Wounded Fury",
        "description": "While it has 10 hit points or fewer, the quaggoth has advantage on attack rolls; attacks against it have advantage too."
      },
      {
        "name": "Innate Spellcasting",
        "description": "1/day each: feather fall, heat metal, spider climb."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Claw attacks."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d6+3 slashing"
      }
    ]
  },
  {
    "id": "cm-wdmm-wood-woad-wyllowwood",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Wyllowwood Wood Woad",
    "size": "medium",
    "type": "plant",
    "alignment": "Lawful Neutral",
    "speed": "30 ft.",
    "challengeRating": 5,
    "ac": 18,
    "acNote": "bark armor",
    "hp": 75,
    "maxHp": 75,
    "abilityScores": {
      "strength": 18,
      "dexterity": 12,
      "constitution": 17,
      "intelligence": 10,
      "wisdom": 13,
      "charisma": 12
    },
    "damageResistances": [
      "bludgeoning",
      "piercing"
    ],
    "damageVulnerabilities": [
      "fire"
    ],
    "conditionImmunities": [
      "blinded",
      "deafened"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Sylvan"
    ],
    "traits": [
      {
        "name": "Regeneration",
        "description": "Regains 10 hit points at the start of its turn if it is in contact with soil."
      },
      {
        "name": "Tree Stride",
        "description": "Can step into one living tree and emerge from a second within 60 feet."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Club attacks."
      },
      {
        "name": "Club",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "1d8+4 bludgeoning plus 1d8 force"
      }
    ]
  },
  {
    "id": "cm-wdmm-nimblewright-maddgoth",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Maddgoth's Nimblewright",
    "size": "medium",
    "type": "construct",
    "alignment": "Unaligned",
    "speed": "60 ft.",
    "challengeRating": 4,
    "ac": 18,
    "hp": 45,
    "maxHp": 45,
    "abilityScores": {
      "strength": 12,
      "dexterity": 18,
      "constitution": 14,
      "intelligence": 12,
      "wisdom": 10,
      "charisma": 11
    },
    "damageImmunities": [
      "poison",
      "psychic"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "understands Common but can't speak"
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      },
      {
        "name": "Repairable",
        "description": "If reduced to 0 hp but not destroyed, it reactivates in 1 minute with 5 hit points unless it took fire or acid damage."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Three Rapier attacks."
      },
      {
        "name": "Rapier Hand",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "1d8+4 piercing plus 1d8 poison"
      }
    ]
  },
  {
    "id": "cm-wdmm-flind-slaver",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Slitherswamp Flind Slaver",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 3,
    "ac": 14,
    "acNote": "hide armor, shield",
    "hp": 60,
    "maxHp": 60,
    "abilityScores": {
      "strength": 17,
      "dexterity": 12,
      "constitution": 16,
      "intelligence": 11,
      "wisdom": 13,
      "charisma": 13
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Gnoll"
    ],
    "traits": [
      {
        "name": "Flind Chain Master",
        "description": "On a hit with the chain, the flind can force a DC 13 Wisdom save; on a failure the target is frightened or disarmed (flind's choice)."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Flail attacks."
      },
      {
        "name": "Three-Headed Flail",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d10+3 bludgeoning"
      }
    ]
  },
  {
    "id": "cm-wdmm-troglodyte-slitherswamp",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Slitherswamp Troglodyte",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 0.25,
    "ac": 11,
    "acNote": "natural armor",
    "hp": 13,
    "maxHp": 13,
    "abilityScores": {
      "strength": 14,
      "dexterity": 10,
      "constitution": 14,
      "intelligence": 6,
      "wisdom": 10,
      "charisma": 6
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Troglodyte"
    ],
    "traits": [
      {
        "name": "Stench",
        "description": "A creature that starts its turn within 5 ft. must succeed on a DC 12 Constitution save or be poisoned until the start of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and two Claw attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d4+2 piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d4+2 slashing"
      }
    ]
  },
  {
    "id": "cm-wdmm-dweomercore-apprentice",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Dweomercore Student-Wizard",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Chaotic Neutral",
    "speed": "30 ft.",
    "challengeRating": 6,
    "ac": 12,
    "hp": 40,
    "maxHp": 40,
    "abilityScores": {
      "strength": 9,
      "dexterity": 14,
      "constitution": 11,
      "intelligence": 17,
      "wisdom": 12,
      "charisma": 11
    },
    "savingThrows": {
      "intelligence": 6
    },
    "skills": {
      "Arcana": 6
    },
    "senses": {
      "passive Perception": "11"
    },
    "languages": [
      "Common",
      "two others"
    ],
    "traits": [
      {
        "name": "Ambition",
        "description": "When it reduces a creature to 0 hp, it regains 10 hit points."
      },
      {
        "name": "Spellcasting",
        "description": "9th-level wizard (save DC 14): shield, scorching ray, counterspell, fireball, ice storm."
      }
    ],
    "actions": [
      {
        "name": "Arcane Focus",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d6+2 force"
      },
      {
        "name": "Ray of Frost",
        "description": "Ranged spell attack, +6 to hit, 3d8 cold and speed reduced by 10 ft."
      }
    ]
  },
  {
    "id": "cm-wdmm-death-tyrant-muiwood",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Muiwood Death Tyrant",
    "size": "large",
    "type": "undead",
    "alignment": "Lawful Evil",
    "speed": "0 ft., fly 20 ft. (hover)",
    "challengeRating": 14,
    "ac": 19,
    "acNote": "natural armor",
    "hp": 187,
    "maxHp": 187,
    "abilityScores": {
      "strength": 10,
      "dexterity": 14,
      "constitution": 20,
      "intelligence": 19,
      "wisdom": 15,
      "charisma": 19
    },
    "savingThrows": {
      "strength": 5,
      "constitution": 10,
      "intelligence": 9,
      "wisdom": 7,
      "charisma": 9
    },
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned",
      "prone"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "Deep Speech",
      "Undercommon"
    ],
    "traits": [
      {
        "name": "Negative Energy Cone",
        "description": "The area within 150 ft. of the death tyrant's front arc is a magically dead zone; creatures that die there rise as zombies."
      },
      {
        "name": "Legendary Resistance (3/Day)",
        "description": "If it fails a save, it can choose to succeed."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee attack, +5 to hit, 2d6 piercing."
      },
      {
        "name": "Eye Rays",
        "description": "The death tyrant shoots three of its eye rays at random at up to three targets within 120 ft. (DC 17): necrotic 6d8, telekinetic push, sleep, petrification, disintegration 8d8 force, fear."
      }
    ],
    "legendaryActions": [
      {
        "name": "Eye Ray",
        "description": "The death tyrant uses one random eye ray."
      }
    ],
    "legendaryActionCount": 3
  },
  {
    "id": "cm-wdmm-wraith-terminus",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Terminus Level Wraith",
    "size": "medium",
    "type": "undead",
    "alignment": "Neutral Evil",
    "speed": "0 ft., fly 60 ft. (hover)",
    "challengeRating": 5,
    "ac": 13,
    "hp": 67,
    "maxHp": 67,
    "abilityScores": {
      "strength": 6,
      "dexterity": 16,
      "constitution": 16,
      "intelligence": 12,
      "wisdom": 14,
      "charisma": 15
    },
    "damageResistances": [
      "acid",
      "cold",
      "fire",
      "lightning",
      "thunder",
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "damageImmunities": [
      "necrotic",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "grappled",
      "paralyzed",
      "petrified",
      "poisoned",
      "prone",
      "restrained"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "the languages it knew in life"
    ],
    "traits": [
      {
        "name": "Incorporeal Movement",
        "description": "Can move through creatures and objects as difficult terrain."
      },
      {
        "name": "Sunlight Sensitivity",
        "description": "Disadvantage on attacks, checks, and saves in sunlight."
      }
    ],
    "actions": [
      {
        "name": "Life Drain",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "4d8+3 necrotic; the target's hit point maximum is reduced by an equal amount and the wraith can create a specter from a humanoid killed this way"
      }
    ]
  },
  {
    "id": "cm-wdmm-shadowdusk-cultist",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Shadowdusk Hold Cultist",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 2,
    "ac": 12,
    "hp": 33,
    "maxHp": 33,
    "abilityScores": {
      "strength": 12,
      "dexterity": 13,
      "constitution": 13,
      "intelligence": 11,
      "wisdom": 12,
      "charisma": 13
    },
    "skills": {
      "Deception": 3,
      "Religion": 3
    },
    "senses": {
      "passive Perception": "11"
    },
    "languages": [
      "Common",
      "Deep Speech"
    ],
    "traits": [
      {
        "name": "Far Realm Devotion",
        "description": "Advantage on saves against being charmed or frightened."
      }
    ],
    "actions": [
      {
        "name": "Warped Dagger",
        "description": "Melee Weapon Attack",
        "attackBonus": 3,
        "damageDescription": "1d4+1 piercing plus 1d6 psychic"
      },
      {
        "name": "Maddening Word (Recharge 6)",
        "description": "One creature within 30 ft., DC 11 Wisdom save, 2d6 psychic and disadvantage on its next attack."
      }
    ]
  },
  {
    "id": "cm-wdmm-shadowdusk-aberrant-hulk",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Shadowdusk Aberrant Hulk",
    "size": "huge",
    "type": "aberration",
    "alignment": "Chaotic Evil",
    "speed": "40 ft.",
    "challengeRating": 9,
    "ac": 16,
    "acNote": "warped hide",
    "hp": 149,
    "maxHp": 149,
    "abilityScores": {
      "strength": 22,
      "dexterity": 8,
      "constitution": 20,
      "intelligence": 6,
      "wisdom": 10,
      "charisma": 8
    },
    "damageResistances": [
      "psychic"
    ],
    "conditionImmunities": [
      "charmed",
      "frightened",
      "prone"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Deep Speech"
    ],
    "traits": [
      {
        "name": "Reality Warp",
        "description": "When it is hit by an attack, roll a d6; on a 6 the attacker takes 3d6 force as space folds around it."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and two Slam attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "3d8+6 piercing plus 2d6 psychic"
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 9,
        "damageDescription": "3d6+6 bludgeoning"
      }
    ]
  },
  {
    "id": "cm-wdmm-flameskull-lost-level",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Lost Level Flameskull",
    "size": "tiny",
    "type": "undead",
    "alignment": "Neutral Evil",
    "speed": "0 ft., fly 40 ft. (hover)",
    "challengeRating": 4,
    "ac": 13,
    "hp": 40,
    "maxHp": 40,
    "abilityScores": {
      "strength": 1,
      "dexterity": 17,
      "constitution": 14,
      "intelligence": 16,
      "wisdom": 10,
      "charisma": 11
    },
    "damageImmunities": [
      "cold",
      "fire",
      "lightning",
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "frightened",
      "paralyzed",
      "poisoned",
      "prone"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Common"
    ],
    "traits": [
      {
        "name": "Rejuvenation",
        "description": "Reforms in 1 hour unless doused with holy water."
      },
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      }
    ],
    "actions": [
      {
        "name": "Fire Ray",
        "description": "Two ranged spell attacks, +5 to hit, 3d6 fire each."
      },
      {
        "name": "Fireball (1/Day)",
        "description": "20-foot radius, DC 13 Dexterity save, 5d6 fire."
      }
    ]
  },
  {
    "id": "cm-wdmm-otyugh-warren",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Undermountain Otyugh",
    "size": "large",
    "type": "aberration",
    "alignment": "Neutral",
    "speed": "30 ft.",
    "challengeRating": 5,
    "ac": 14,
    "acNote": "natural armor",
    "hp": 114,
    "maxHp": 114,
    "abilityScores": {
      "strength": 16,
      "dexterity": 11,
      "constitution": 19,
      "intelligence": 6,
      "wisdom": 13,
      "charisma": 6
    },
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Otyugh (telepathy 120 ft. with limited range)"
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and two Tentacle attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "2d8+3 piercing plus 1d8 disease (DC 15 Constitution)"
      },
      {
        "name": "Tentacle",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "1d8+3 bludgeoning and grappled (escape DC 13)"
      }
    ]
  },
  {
    "id": "cm-wdmm-neogi-slaver",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Neogi Slaver",
    "size": "small",
    "type": "aberration",
    "alignment": "Lawful Evil",
    "speed": "30 ft., climb 30 ft.",
    "challengeRating": 3,
    "ac": 15,
    "acNote": "natural armor",
    "hp": 33,
    "maxHp": 33,
    "abilityScores": {
      "strength": 6,
      "dexterity": 16,
      "constitution": 12,
      "intelligence": 15,
      "wisdom": 11,
      "charisma": 15
    },
    "skills": {
      "Intimidation": 4,
      "Perception": 2
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Common",
      "Deep Speech",
      "telepathy 30 ft."
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Bite and one Claws attack."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+3 piercing plus 2d6 poison and DC 11 Constitution save or poisoned for 1 minute"
      },
      {
        "name": "Enslave (Recharge 6)",
        "description": "One creature within 30 ft., DC 13 Wisdom save or charmed for 1 day (repeat at end of each long rest)."
      }
    ]
  },
  {
    "id": "cm-wdmm-stone-golem-arcane-chambers",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Arcane Chambers Stone Golem",
    "size": "large",
    "type": "construct",
    "alignment": "Unaligned",
    "speed": "30 ft.",
    "challengeRating": 10,
    "ac": 17,
    "acNote": "natural armor",
    "hp": 178,
    "maxHp": 178,
    "abilityScores": {
      "strength": 22,
      "dexterity": 9,
      "constitution": 20,
      "intelligence": 3,
      "wisdom": 11,
      "charisma": 1
    },
    "damageImmunities": [
      "poison",
      "psychic",
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "10"
    },
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      },
      {
        "name": "Immutable Form",
        "description": "Immune to effects that alter its form."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Slam attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack",
        "attackBonus": 10,
        "damageDescription": "3d8+6 bludgeoning"
      },
      {
        "name": "Slow (Recharge 5-6)",
        "description": "One or two creatures within 10 ft., DC 17 Wisdom save or affected by the slow spell for 1 minute."
      }
    ]
  },
  {
    "id": "cm-wdmm-intellect-devourer",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Intellect Devourer",
    "size": "tiny",
    "type": "aberration",
    "alignment": "Lawful Evil",
    "speed": "40 ft.",
    "challengeRating": 2,
    "ac": 12,
    "hp": 21,
    "maxHp": 21,
    "abilityScores": {
      "strength": 7,
      "dexterity": 13,
      "constitution": 12,
      "intelligence": 14,
      "wisdom": 11,
      "charisma": 10
    },
    "conditionImmunities": [
      "blinded"
    ],
    "senses": {
      "blindsight": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "understands Deep Speech, Undercommon but can't speak"
    ],
    "traits": [
      {
        "name": "Detect Sentience",
        "description": "Can sense the presence and location of any creature with an Intelligence of 3 or higher within 300 feet."
      }
    ],
    "actions": [
      {
        "name": "Claws",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "2d6+1 slashing"
      },
      {
        "name": "Devour Intellect",
        "description": "One creature within 10 ft., DC 12 Intelligence save, 2d10 psychic; if this reduces its Intelligence to 0 the creature is stunned until it regains at least one point."
      }
    ]
  },
  {
    "id": "cm-wdmm-vampire-spawn-wraith-haunts",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Wraith Haunts Vampire Spawn",
    "size": "medium",
    "type": "undead",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 5,
    "ac": 15,
    "hp": 82,
    "maxHp": 82,
    "abilityScores": {
      "strength": 16,
      "dexterity": 16,
      "constitution": 16,
      "intelligence": 11,
      "wisdom": 10,
      "charisma": 12
    },
    "damageResistances": [
      "necrotic",
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "the languages it knew in life"
    ],
    "traits": [
      {
        "name": "Regeneration",
        "description": "Regains 10 hit points at the start of its turn if it has at least 1 hit point and isn't in sunlight or running water."
      },
      {
        "name": "Vampire Weakness",
        "description": "Takes 20 acid/necrotic if it ends its turn in running water; disintegrates at 0 hp unless in its resting place."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two attacks, only one of which can be a Bite."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "2d4+3 slashing and grappled (escape DC 13)"
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 6,
        "damageDescription": "1d6+3 piercing plus 3d6 necrotic and the spawn regains that many hit points"
      }
    ]
  },
  {
    "id": "cm-wdmm-mimic-treasure",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Undermountain Chest Mimic",
    "size": "medium",
    "type": "monstrosity",
    "alignment": "Neutral",
    "speed": "15 ft.",
    "challengeRating": 2,
    "ac": 12,
    "acNote": "natural armor",
    "hp": 58,
    "maxHp": 58,
    "abilityScores": {
      "strength": 17,
      "dexterity": 12,
      "constitution": 15,
      "intelligence": 5,
      "wisdom": 13,
      "charisma": 8
    },
    "skills": {
      "Stealth": 5
    },
    "damageImmunities": [
      "acid"
    ],
    "conditionImmunities": [
      "prone"
    ],
    "senses": {
      "passive Perception": "11"
    },
    "traits": [
      {
        "name": "Adhesive",
        "description": "Adheres to anything that touches it; a creature is grappled (escape DC 13)."
      },
      {
        "name": "False Appearance",
        "description": "Indistinguishable from a chest while motionless."
      }
    ],
    "actions": [
      {
        "name": "Pseudopod",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d8+3 bludgeoning plus 1d8 acid"
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d8+3 piercing plus 1d8 acid"
      }
    ]
  },
  {
    "id": "cm-wdmm-cranium-rat-swarm",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Swarm of Cranium Rats",
    "size": "medium",
    "type": "aberration",
    "alignment": "Lawful Evil",
    "speed": "30 ft., climb 30 ft.",
    "challengeRating": 5,
    "ac": 12,
    "hp": 49,
    "maxHp": 49,
    "abilityScores": {
      "strength": 9,
      "dexterity": 17,
      "constitution": 11,
      "intelligence": 15,
      "wisdom": 12,
      "charisma": 8
    },
    "damageResistances": [
      "bludgeoning",
      "piercing",
      "slashing"
    ],
    "conditionImmunities": [
      "charmed",
      "frightened",
      "grappled",
      "paralyzed",
      "petrified",
      "prone",
      "restrained",
      "stunned"
    ],
    "senses": {
      "darkvision": "30 ft.",
      "passive Perception": "11"
    },
    "languages": [
      "Common",
      "Deep Speech",
      "telepathy 60 ft. (works only for the swarm)"
    ],
    "traits": [
      {
        "name": "Swarm",
        "description": "Can occupy another creature's space."
      },
      {
        "name": "Hivemind Illumination",
        "description": "Sheds dim light in a 15-foot radius."
      }
    ],
    "actions": [
      {
        "name": "Bites",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "4d6 piercing, or 2d6 if bloodied"
      },
      {
        "name": "Confounding Gnaw (Recharge 6)",
        "description": "One creature in the swarm's space, DC 13 Intelligence save or can't take reactions and rolls a d8 to determine its action."
      }
    ]
  },
  {
    "id": "cm-wdmm-sorlyn-priest",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Sorlyn Sun-Cult Priest",
    "size": "medium",
    "type": "humanoid",
    "alignment": "Lawful Neutral",
    "speed": "30 ft.",
    "challengeRating": 4,
    "ac": 16,
    "acNote": "scale mail, shield",
    "hp": 60,
    "maxHp": 60,
    "abilityScores": {
      "strength": 12,
      "dexterity": 11,
      "constitution": 14,
      "intelligence": 12,
      "wisdom": 17,
      "charisma": 14
    },
    "savingThrows": {
      "wisdom": 5
    },
    "skills": {
      "Religion": 4,
      "Persuasion": 4
    },
    "senses": {
      "passive Perception": "13"
    },
    "languages": [
      "Common"
    ],
    "traits": [
      {
        "name": "Radiant Ward",
        "description": "The priest and allies within 10 ft. have resistance to necrotic damage."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Mace attacks."
      },
      {
        "name": "Sunmetal Mace",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d6+1 bludgeoning plus 1d6 radiant"
      },
      {
        "name": "Sacred Flame Volley (Recharge 5-6)",
        "description": "Up to three creatures within 60 ft., DC 13 Dexterity save, 3d8 radiant each."
      }
    ]
  },
  {
    "id": "cm-wdmm-lava-child",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Undermountain Lava Child",
    "size": "medium",
    "type": "monstrosity",
    "alignment": "Chaotic Neutral",
    "speed": "30 ft.",
    "challengeRating": 3,
    "ac": 13,
    "hp": 52,
    "maxHp": 52,
    "abilityScores": {
      "strength": 16,
      "dexterity": 12,
      "constitution": 15,
      "intelligence": 8,
      "wisdom": 11,
      "charisma": 10
    },
    "damageImmunities": [
      "fire"
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Ignan",
      "Undercommon"
    ],
    "traits": [
      {
        "name": "Metal Immunity",
        "description": "Metal weapons and metal armor pass harmlessly through a lava child; such weapons deal no damage and such armor grants no AC against it."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Claw attacks."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 5,
        "damageDescription": "1d8+3 slashing plus 1d6 fire"
      }
    ]
  },
  {
    "id": "cm-wdmm-derro-savant-lost",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Undermountain Derro Savant",
    "size": "small",
    "type": "humanoid",
    "alignment": "Chaotic Evil",
    "speed": "30 ft.",
    "challengeRating": 3,
    "ac": 13,
    "hp": 36,
    "maxHp": 36,
    "abilityScores": {
      "strength": 8,
      "dexterity": 14,
      "constitution": 14,
      "intelligence": 11,
      "wisdom": 5,
      "charisma": 14
    },
    "skills": {
      "Stealth": 4
    },
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "7"
    },
    "languages": [
      "Dwarvish",
      "Undercommon"
    ],
    "traits": [
      {
        "name": "Magic Resistance",
        "description": "Advantage on saves against spells."
      },
      {
        "name": "Innate Spellcasting",
        "description": "At will: mage hand; 3/day: hideous laughter; 1/day: confusion, mirror image."
      }
    ],
    "actions": [
      {
        "name": "Hooked Spear",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d8+2 piercing"
      },
      {
        "name": "Sound Burst (Recharge 5-6)",
        "description": "10-foot cube within 60 ft., DC 12 Constitution save, 3d8 thunder."
      }
    ]
  },
  {
    "id": "cm-wdmm-carrion-crawler-tunnels",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Undermountain Carrion Crawler",
    "size": "large",
    "type": "monstrosity",
    "alignment": "Unaligned",
    "speed": "30 ft., climb 30 ft.",
    "challengeRating": 2,
    "ac": 13,
    "hp": 51,
    "maxHp": 51,
    "abilityScores": {
      "strength": 14,
      "dexterity": 13,
      "constitution": 16,
      "intelligence": 1,
      "wisdom": 12,
      "charisma": 5
    },
    "senses": {
      "darkvision": "60 ft.",
      "passive Perception": "11"
    },
    "traits": [
      {
        "name": "Keen Smell",
        "description": "Advantage on Perception checks that rely on smell."
      },
      {
        "name": "Spider Climb",
        "description": "Can climb difficult surfaces, including ceilings."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "One Tentacles and one Bite attack."
      },
      {
        "name": "Tentacles",
        "description": "Melee Weapon Attack",
        "attackBonus": 8,
        "damageDescription": "1d4+2 poison and DC 13 Constitution save or poisoned and paralyzed for 1 minute"
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "2d4+2 piercing"
      }
    ]
  },
  {
    "id": "cm-wdmm-nothic-hoarder",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Undermountain Nothic",
    "size": "medium",
    "type": "aberration",
    "alignment": "Neutral Evil",
    "speed": "30 ft.",
    "challengeRating": 2,
    "ac": 15,
    "hp": 45,
    "maxHp": 45,
    "abilityScores": {
      "strength": 14,
      "dexterity": 16,
      "constitution": 16,
      "intelligence": 13,
      "wisdom": 10,
      "charisma": 8
    },
    "skills": {
      "Arcana": 3,
      "Insight": 2,
      "Perception": 2,
      "Stealth": 5
    },
    "senses": {
      "truesight": "120 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "Undercommon"
    ],
    "traits": [
      {
        "name": "Keen Sight",
        "description": "Advantage on Perception checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Claw attacks."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack",
        "attackBonus": 4,
        "damageDescription": "1d6+2 slashing"
      },
      {
        "name": "Rotting Gaze",
        "description": "One creature within 30 ft., DC 12 Constitution save, 3d6 necrotic."
      }
    ]
  },
  {
    "id": "cm-wdmm-gauth-eye",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Gauth (Lesser Beholder-Kin)",
    "size": "medium",
    "type": "aberration",
    "alignment": "Lawful Evil",
    "speed": "0 ft., fly 40 ft. (hover)",
    "challengeRating": 6,
    "ac": 15,
    "acNote": "natural armor",
    "hp": 67,
    "maxHp": 67,
    "abilityScores": {
      "strength": 10,
      "dexterity": 14,
      "constitution": 16,
      "intelligence": 15,
      "wisdom": 15,
      "charisma": 13
    },
    "conditionImmunities": [
      "prone"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "Deep Speech",
      "Undercommon"
    ],
    "traits": [
      {
        "name": "Stunted Antimagic Cone",
        "description": "The 60-foot cone from its central eye suppresses magic items and spells of 3rd level or lower within it."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee attack, +4 to hit, 2d6 piercing."
      },
      {
        "name": "Eye Rays",
        "description": "The gauth fires two of the following at targets within 120 ft. (DC 13): fire ray 4d6 fire, paralyzing ray, exhaustion ray, devour magic (ends a spell), dazing ray."
      }
    ]
  },
  {
    "id": "cm-wdmm-spectator-vault",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Undermountain Spectator",
    "size": "medium",
    "type": "aberration",
    "alignment": "Lawful Neutral",
    "speed": "0 ft., fly 30 ft. (hover)",
    "challengeRating": 3,
    "ac": 14,
    "acNote": "natural armor",
    "hp": 39,
    "maxHp": 39,
    "abilityScores": {
      "strength": 8,
      "dexterity": 14,
      "constitution": 14,
      "intelligence": 13,
      "wisdom": 14,
      "charisma": 11
    },
    "conditionImmunities": [
      "prone"
    ],
    "senses": {
      "darkvision": "120 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "Deep Speech",
      "Undercommon",
      "telepathy 120 ft."
    ],
    "traits": [
      {
        "name": "Bound Guardian",
        "description": "Summoned to guard an object or location for 101 years; attacks any creature that tries to take the item."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee attack, +1 to hit, 2d4 piercing."
      },
      {
        "name": "Eye Rays",
        "description": "The spectator fires two of the following at targets within 90 ft. (DC 13): confusion ray, paralyzing ray, fear ray, wounding ray 3d10 necrotic."
      }
    ]
  },
  {
    "id": "cm-wdmm-shield-guardian-halaster",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Halaster's Shield Guardian",
    "size": "large",
    "type": "construct",
    "alignment": "Unaligned",
    "speed": "30 ft.",
    "challengeRating": 7,
    "ac": 17,
    "acNote": "natural armor",
    "hp": 142,
    "maxHp": 142,
    "abilityScores": {
      "strength": 18,
      "dexterity": 8,
      "constitution": 18,
      "intelligence": 7,
      "wisdom": 10,
      "charisma": 3
    },
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "poisoned"
    ],
    "senses": {
      "blindsight": "10 ft.",
      "darkvision": "60 ft.",
      "passive Perception": "10"
    },
    "languages": [
      "understands commands given in any language but can't speak"
    ],
    "traits": [
      {
        "name": "Bound",
        "description": "Linked to an amulet; regains 10 hit points at the start of its turn if it has at least 1 hit point."
      },
      {
        "name": "Spell Storing",
        "description": "Stores one spell of 4th level or lower that the guardian can cast when commanded."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "Two Fist attacks."
      },
      {
        "name": "Fist",
        "description": "Melee Weapon Attack",
        "attackBonus": 7,
        "damageDescription": "2d6+4 bludgeoning"
      }
    ]
  },
  {
    "id": "cm-wdmm-mad-mage-simulacrum",
    "userId": GLOBAL_USER_ID,
    "isGlobal": true,
    "source": "Waterdeep: Dungeon of the Mad Mage",
    "name": "Halaster's Chaos Simulacrum",
    "size": "medium",
    "type": "construct",
    "alignment": "Chaotic Neutral",
    "speed": "30 ft., fly 30 ft.",
    "challengeRating": 8,
    "ac": 15,
    "hp": 66,
    "maxHp": 66,
    "abilityScores": {
      "strength": 10,
      "dexterity": 16,
      "constitution": 14,
      "intelligence": 20,
      "wisdom": 14,
      "charisma": 12
    },
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "charmed",
      "exhaustion",
      "poisoned"
    ],
    "senses": {
      "truesight": "60 ft.",
      "passive Perception": "12"
    },
    "languages": [
      "all Halaster knows"
    ],
    "traits": [
      {
        "name": "Snow Body",
        "description": "If reduced to 0 hp it collapses into snow and can't be revived."
      },
      {
        "name": "Spellcasting",
        "description": "10th-level wizard (save DC 15): magic missile, misty step, fireball, wall of force, chaos bolt (as a 5th-level spell)."
      }
    ],
    "actions": [
      {
        "name": "Arcane Bolt",
        "description": "Ranged spell attack, +7 to hit, 3d10 force."
      },
      {
        "name": "Wild Surge (Recharge 5-6)",
        "description": "20-foot radius within 90 ft., DC 15 Dexterity save, 6d6 damage of a random type (half on success)."
      }
    ]
  },

  // ===========================================================================
  // populate-campaigns-g5a — Classic & modern setting campaigns (sub-group A)
  // Sources: Planescape: Turn of Fortune's Wheel, Dragonlance: Shadow of the
  // Dragon Queen, Spelljammer: Light of Xaryxis, The Temple of Elemental Evil,
  // Keep on the Borderlands, Queen of the Spiders, Return to the Tomb of
  // Horrors, Against the Cult of the Reptile God.
  // ===========================================================================

  // --- Planescape: Turn of Fortune's Wheel ---
  {
    id: "cm-totfw-tulpa-reform-rogue",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Planescape: Turn of Fortune's Wheel",
    name: "Tulpa Reform-Rogue",
    size: "medium",
    type: "aberration",
    alignment: "Chaotic Neutral",
    speed: "30 ft.",
    challengeRating: 2,
    ac: 14,
    acNote: "leather armor",
    hp: 44,
    maxHp: 44,
    abilityScores: { strength: 10, dexterity: 16, constitution: 12, intelligence: 13, wisdom: 11, charisma: 14 },
    savingThrows: { dexterity: 5 },
    skills: { Stealth: 5, Deception: 4 },
    senses: { "passive Perception": "10" },
    languages: ["Common", "Planar Trade"],
    traits: [
      { name: "Belief-Made-Flesh", description: "When the tulpa is reduced to 0 hit points it reforms with 10 hit points at the start of its next turn, unless the creature that dropped it succeeds on a DC 13 Intelligence (Investigation) check to disbelieve it as it falls." },
    ],
    actions: [
      { name: "Shortsword", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d6+3 piercing" },
      { name: "Sneak Attack (1/Turn)", description: "The tulpa deals an extra 2d6 damage when it has advantage on the attack roll or an ally of the tulpa is within 5 feet of the target." },
    ],
  },
  {
    id: "cm-totfw-modron-ordinator",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Planescape: Turn of Fortune's Wheel",
    name: "Modron Ordinator",
    size: "medium",
    type: "construct",
    alignment: "Lawful Neutral",
    speed: "30 ft.",
    challengeRating: 4,
    ac: 16,
    acNote: "natural armor",
    hp: 68,
    maxHp: 68,
    abilityScores: { strength: 14, dexterity: 12, constitution: 15, intelligence: 15, wisdom: 13, charisma: 10 },
    savingThrows: { intelligence: 4 },
    skills: { Perception: 3 },
    damageImmunities: ["poison", "psychic"],
    conditionImmunities: ["charmed", "frightened", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "13" },
    languages: ["Modron"],
    traits: [
      { name: "Axiomatic Mind", description: "The modron can't be compelled to act in a manner contrary to its nature or its instructions." },
    ],
    actions: [
      { name: "Multiattack", description: "The ordinator makes two Force Baton attacks." },
      { name: "Force Baton", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "2d6+2 force" },
      { name: "Law Bolt", description: "Ranged Spell Attack", attackBonus: 4, damageDescription: "3d8 force" },
    ],
  },
  {
    id: "cm-totfw-devil-courier",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Planescape: Turn of Fortune's Wheel",
    name: "Devil Courier",
    size: "tiny",
    type: "fiend",
    alignment: "Lawful Evil",
    speed: "20 ft., fly 40 ft.",
    challengeRating: 3,
    ac: 14,
    hp: 45,
    maxHp: 45,
    abilityScores: { strength: 6, dexterity: 17, constitution: 13, intelligence: 14, wisdom: 12, charisma: 15 },
    skills: { Deception: 4, Stealth: 5 },
    damageResistances: ["cold"],
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "11" },
    languages: ["Infernal", "Common", "telepathy 120 ft."],
    traits: [
      { name: "Magic Resistance", description: "The courier has advantage on saving throws against spells and other magical effects." },
      { name: "Contract Ward", description: "While carrying a sealed infernal contract, the courier has resistance to all damage from creatures that have not signed it." },
    ],
    actions: [
      { name: "Sting", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d6+3 piercing plus 3d6 poison" },
      { name: "Invisibility", description: "The courier magically turns invisible until it attacks or until its concentration ends." },
    ],
  },
  {
    id: "cm-totfw-beast-lord-guardian",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Planescape: Turn of Fortune's Wheel",
    name: "Beast Lord Guardian",
    size: "large",
    type: "celestial",
    alignment: "Neutral Good",
    speed: "50 ft., climb 40 ft.",
    challengeRating: 8,
    ac: 15,
    acNote: "natural armor",
    hp: 133,
    maxHp: 133,
    abilityScores: { strength: 20, dexterity: 17, constitution: 18, intelligence: 12, wisdom: 16, charisma: 14 },
    savingThrows: { strength: 8, wisdom: 6 },
    skills: { Perception: 6, Stealth: 6 },
    damageResistances: ["radiant"],
    senses: { darkvision: "120 ft.", "passive Perception": "16" },
    languages: ["Celestial", "understands all beast speech"],
    traits: [
      { name: "Keen Senses", description: "The guardian has advantage on Wisdom (Perception) checks that rely on sight, hearing, or smell." },
      { name: "Beastlands Bond", description: "The guardian can't be surprised while in a natural environment and its attacks count as magical." },
    ],
    actions: [
      { name: "Multiattack", description: "The guardian makes one Bite attack and two Claw attacks." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 8, damageDescription: "2d10+5 piercing" },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 8, damageDescription: "2d6+5 slashing" },
    ],
  },
  {
    id: "cm-totfw-balor-sergeant",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Planescape: Turn of Fortune's Wheel",
    name: "Balor Sergeant",
    size: "huge",
    type: "fiend",
    alignment: "Chaotic Evil",
    speed: "40 ft., fly 80 ft.",
    challengeRating: 12,
    ac: 17,
    acNote: "natural armor",
    hp: 187,
    maxHp: 187,
    abilityScores: { strength: 24, dexterity: 15, constitution: 20, intelligence: 14, wisdom: 16, charisma: 18 },
    savingThrows: { strength: 11, constitution: 9, charisma: 8 },
    damageResistances: ["cold", "lightning"],
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "13" },
    languages: ["Abyssal", "telepathy 120 ft."],
    traits: [
      { name: "Death Throes", description: "When the balor sergeant dies it explodes: each creature within 20 feet makes a DC 17 Dexterity save, taking 40 (9d8) fire damage on a failure, or half as much on a success." },
      { name: "Fire Aura", description: "A creature that touches the balor or hits it with a melee attack within 5 feet takes 3 (1d6) fire damage." },
      { name: "Magic Resistance", description: "The balor has advantage on saving throws against spells and other magical effects." },
    ],
    actions: [
      { name: "Multiattack", description: "The balor makes one Longsword attack and one Whip attack." },
      { name: "Longsword", description: "Melee Weapon Attack (flaming)", attackBonus: 11, damageDescription: "3d8+7 slashing plus 3d6 fire" },
      { name: "Whip", description: "Melee Weapon Attack (30 ft. reach)", attackBonus: 11, damageDescription: "2d6+7 slashing plus 3d6 fire, and the target is pulled up to 25 feet toward the balor" },
    ],
  },
  {
    id: "cm-totfw-tulpa-puppet-master",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Planescape: Turn of Fortune's Wheel",
    name: "Tulpa Puppet Master",
    size: "medium",
    type: "aberration",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 12,
    ac: 16,
    hp: 161,
    maxHp: 161,
    abilityScores: { strength: 11, dexterity: 18, constitution: 16, intelligence: 20, wisdom: 15, charisma: 19 },
    savingThrows: { intelligence: 9, wisdom: 7, charisma: 8 },
    skills: { Deception: 8, Insight: 7, Arcana: 9 },
    damageResistances: ["psychic"],
    conditionImmunities: ["charmed"],
    senses: { truesight: "60 ft.", "passive Perception": "12" },
    languages: ["Common", "Deep Speech", "telepathy 120 ft."],
    traits: [
      { name: "Reality Anchor", description: "The puppet master and any tulpa within 60 feet of it can't be forced to disbelieve or dispelled." },
      { name: "Legendary Resistance (2/Day)", description: "If the puppet master fails a saving throw, it can choose to succeed instead." },
    ],
    actions: [
      { name: "Multiattack", description: "The puppet master makes two Mind Thorn attacks and uses Seize Strings if available." },
      { name: "Mind Thorn", description: "Ranged Spell Attack", attackBonus: 9, damageDescription: "4d8 psychic" },
      { name: "Seize Strings (Recharge 5-6)", description: "One creature the puppet master can see within 60 feet makes a DC 17 Wisdom save or is dominated (as the dominate monster spell) for 1 minute." },
    ],
    legendaryActions: [
      { name: "Mind Thorn", description: "The puppet master makes one Mind Thorn attack." },
      { name: "Shift Belief (Costs 2 Actions)", description: "The puppet master teleports up to 30 feet and one creature within 30 feet makes a DC 17 Intelligence save or takes 3d8 psychic damage." },
    ],
    legendaryActionCount: 3,
  },
  {
    id: "cm-totfw-vault-sentinel",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Planescape: Turn of Fortune's Wheel",
    name: "Vault Sentinel",
    size: "huge",
    type: "construct",
    alignment: "Unaligned",
    speed: "40 ft.",
    challengeRating: 15,
    ac: 19,
    acNote: "natural armor",
    hp: 221,
    maxHp: 221,
    abilityScores: { strength: 26, dexterity: 11, constitution: 22, intelligence: 3, wisdom: 14, charisma: 1 },
    savingThrows: { constitution: 12, wisdom: 8 },
    damageResistances: ["force"],
    damageImmunities: ["poison", "psychic", "necrotic"],
    conditionImmunities: ["charmed", "frightened", "paralyzed", "petrified", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "12" },
    languages: ["understands Primordial but can't speak"],
    traits: [
      { name: "Magic Resistance", description: "The sentinel has advantage on saving throws against spells and other magical effects." },
      { name: "Planar Warding", description: "The sentinel can't be moved against its will by teleportation or planar travel and it stops any such effect that begins within 10 feet of it." },
    ],
    actions: [
      { name: "Multiattack", description: "The sentinel makes two Slam attacks." },
      { name: "Slam", description: "Melee Weapon Attack", attackBonus: 13, damageDescription: "3d10+8 bludgeoning plus 2d8 force" },
      { name: "Annihilation Beam (Recharge 5-6)", description: "The sentinel projects a 90-foot line. Each creature in the line makes a DC 18 Dexterity save, taking 12d6 force damage on a failure, or half as much on a success." },
    ],
  },
  {
    id: "cm-totfw-dispater",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Planescape: Turn of Fortune's Wheel",
    name: "Dispater, Archdevil of Dis",
    size: "medium",
    type: "fiend",
    alignment: "Lawful Evil",
    speed: "50 ft.",
    challengeRating: 21,
    ac: 22,
    acNote: "natural armor",
    hp: 313,
    maxHp: 313,
    abilityScores: { strength: 22, dexterity: 24, constitution: 25, intelligence: 24, wisdom: 22, charisma: 26 },
    savingThrows: { dexterity: 15, constitution: 15, wisdom: 14, charisma: 16 },
    skills: { Deception: 16, Insight: 14, Perception: 14 },
    damageResistances: ["cold"],
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["charmed", "frightened", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "24" },
    languages: ["all", "telepathy 120 ft."],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If Dispater fails a saving throw, he can choose to succeed instead." },
      { name: "Magic Resistance", description: "Dispater has advantage on saving throws against spells and other magical effects." },
      { name: "Iron Fortress", description: "While in the city of Dis, Dispater has advantage on all attack rolls and his Iron Rod attacks deal an extra 2d6 damage (included below)." },
    ],
    actions: [
      { name: "Multiattack", description: "Dispater makes three Iron Rod attacks." },
      { name: "Iron Rod", description: "Melee Weapon Attack", attackBonus: 15, damageDescription: "3d8+6 bludgeoning plus 2d6 fire" },
      { name: "Hurl Flame", description: "Ranged Spell Attack (150 ft.)", attackBonus: 16, damageDescription: "6d6 fire" },
    ],
    legendaryActions: [
      { name: "Iron Rod", description: "Dispater makes one Iron Rod attack." },
      { name: "Teleport", description: "Dispater magically teleports up to 120 feet to an unoccupied space he can see." },
      { name: "Tyrant's Command (Costs 2 Actions)", description: "One creature Dispater can see within 60 feet makes a DC 24 Wisdom save or is frightened until the end of its next turn and takes 4d6 psychic damage." },
    ],
    legendaryActionCount: 3,
  },

  // --- Dragonlance: Shadow of the Dragon Queen ---
  {
    id: "cm-dsotdq-draconian-baaz",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dragonlance: Shadow of the Dragon Queen",
    name: "Baaz Draconian",
    size: "medium",
    type: "dragon",
    alignment: "Lawful Evil",
    speed: "30 ft., fly 30 ft. (hover)",
    challengeRating: 0.5,
    ac: 15,
    acNote: "scale mail",
    hp: 22,
    maxHp: 22,
    abilityScores: { strength: 14, dexterity: 12, constitution: 13, intelligence: 8, wisdom: 10, charisma: 9 },
    skills: { Perception: 2 },
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["Common", "Draconic"],
    traits: [
      { name: "Death Burst (Stone)", description: "When the baaz dies its body turns to stone, trapping any weapon that struck the killing blow. A creature can free the weapon with a DC 11 Strength check." },
    ],
    actions: [
      { name: "Scimitar", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "1d6+2 slashing" },
      { name: "Javelin", description: "Ranged Weapon Attack", attackBonus: 4, damageDescription: "1d6+2 piercing" },
    ],
  },
  {
    id: "cm-dsotdq-draconian-kapak",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dragonlance: Shadow of the Dragon Queen",
    name: "Kapak Draconian",
    size: "medium",
    type: "dragon",
    alignment: "Lawful Evil",
    speed: "30 ft., fly 30 ft. (hover)",
    challengeRating: 3,
    ac: 15,
    acNote: "natural armor",
    hp: 45,
    maxHp: 45,
    abilityScores: { strength: 15, dexterity: 15, constitution: 14, intelligence: 9, wisdom: 11, charisma: 10 },
    skills: { Stealth: 4 },
    damageResistances: ["poison"],
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: ["Common", "Draconic"],
    traits: [
      { name: "Death Throes (Acid Pool)", description: "When the kapak dies its body dissolves into a 5-foot pool of acid. A creature that ends its turn in the pool takes 5 (2d4) acid damage." },
      { name: "Poison Saliva", description: "The kapak can coat a blade with venom as a bonus action; the next hit deals extra poison damage (included below)." },
    ],
    actions: [
      { name: "Multiattack", description: "The kapak makes two Dagger attacks." },
      { name: "Dagger", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "1d4+2 piercing plus 2d6 poison" },
    ],
  },
  {
    id: "cm-dsotdq-draconian-sivak",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dragonlance: Shadow of the Dragon Queen",
    name: "Sivak Draconian",
    size: "large",
    type: "dragon",
    alignment: "Lawful Evil",
    speed: "40 ft., fly 60 ft.",
    challengeRating: 4,
    ac: 16,
    acNote: "natural armor",
    hp: 76,
    maxHp: 76,
    abilityScores: { strength: 18, dexterity: 14, constitution: 16, intelligence: 12, wisdom: 12, charisma: 13 },
    skills: { Deception: 3, Perception: 3 },
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["Common", "Draconic"],
    traits: [
      { name: "Death Shadow", description: "When a sivak slays a Small or Medium humanoid it can immediately take on that creature's shape as a reaction. On its own death its body becomes a shadow-image of its killer, then crumbles to dust." },
    ],
    actions: [
      { name: "Multiattack", description: "The sivak makes two Claw attacks and one Bite attack." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "2d6+4 slashing" },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "1d10+4 piercing" },
    ],
  },
  {
    id: "cm-dsotdq-draconian-aurak",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dragonlance: Shadow of the Dragon Queen",
    name: "Aurak Draconian",
    size: "medium",
    type: "dragon",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 5,
    ac: 17,
    acNote: "natural armor",
    hp: 90,
    maxHp: 90,
    abilityScores: { strength: 13, dexterity: 16, constitution: 16, intelligence: 17, wisdom: 14, charisma: 15 },
    savingThrows: { dexterity: 6, intelligence: 6 },
    skills: { Arcana: 6, Perception: 5 },
    damageResistances: ["lightning"],
    damageImmunities: ["fire"],
    senses: { darkvision: "60 ft.", "passive Perception": "15" },
    languages: ["Common", "Draconic"],
    traits: [
      { name: "Death Throes (Fiery Explosion)", description: "When the aurak dies it explodes; each creature within 20 feet makes a DC 14 Dexterity save, taking 21 (6d6) fire damage on a failure, or half as much on a success." },
      { name: "Innate Spellcasting", description: "The aurak can innately cast (save DC 14): shocking grasp, misty step, scorching ray, and lightning bolt (1/day)." },
    ],
    actions: [
      { name: "Multiattack", description: "The aurak makes two Claw attacks or two Lightning Bolt Ray attacks." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "1d8+3 slashing plus 1d6 lightning" },
      { name: "Lightning Bolt Ray", description: "Ranged Spell Attack (60 ft.)", attackBonus: 6, damageDescription: "3d8 lightning" },
    ],
  },
  {
    id: "cm-dsotdq-dragon-army-officer",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dragonlance: Shadow of the Dragon Queen",
    name: "Dragon Army Officer",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 3,
    ac: 18,
    acNote: "plate armor",
    hp: 52,
    maxHp: 52,
    abilityScores: { strength: 16, dexterity: 12, constitution: 14, intelligence: 11, wisdom: 12, charisma: 14 },
    savingThrows: { strength: 5, constitution: 4 },
    skills: { Intimidation: 4, Athletics: 5 },
    senses: { "passive Perception": "11" },
    languages: ["Common"],
    traits: [
      { name: "Dragon Army Discipline", description: "Allied draconians and soldiers within 30 feet of the officer have advantage on saving throws against being frightened." },
    ],
    actions: [
      { name: "Multiattack", description: "The officer makes two Longsword attacks." },
      { name: "Longsword", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d8+3 slashing" },
      { name: "Rally (Recharge 5-6)", description: "Each allied creature within 30 feet that can hear the officer gains 10 temporary hit points and can immediately make one weapon attack as a reaction." },
    ],
  },
  {
    id: "cm-dsotdq-young-blue-dragon",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dragonlance: Shadow of the Dragon Queen",
    name: "Young Blue Dragon of the Dragonarmy",
    size: "large",
    type: "dragon",
    alignment: "Lawful Evil",
    speed: "40 ft., burrow 20 ft., fly 80 ft.",
    challengeRating: 9,
    ac: 18,
    acNote: "natural armor",
    hp: 152,
    maxHp: 152,
    abilityScores: { strength: 21, dexterity: 10, constitution: 19, intelligence: 14, wisdom: 13, charisma: 17 },
    savingThrows: { dexterity: 4, constitution: 8, wisdom: 5, charisma: 7 },
    skills: { Perception: 9, Stealth: 4 },
    damageImmunities: ["lightning"],
    senses: { blindsight: "30 ft.", darkvision: "120 ft.", "passive Perception": "19" },
    languages: ["Common", "Draconic"],
    actions: [
      { name: "Multiattack", description: "The dragon makes three attacks: one Bite and two Claws." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 9, damageDescription: "2d10+5 piercing plus 1d10 lightning" },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 9, damageDescription: "2d6+5 slashing" },
      { name: "Lightning Breath (Recharge 5-6)", description: "The dragon exhales lightning in an 60-foot line. Each creature makes a DC 16 Dexterity save, taking 55 (10d10) lightning damage on a failure, or half as much on a success." },
    ],
  },
  {
    id: "cm-dsotdq-dragonarmy-highlord",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dragonlance: Shadow of the Dragon Queen",
    name: "Dragonarmy Highlord",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 12,
    ac: 20,
    acNote: "plate armor + shield",
    hp: 168,
    maxHp: 168,
    abilityScores: { strength: 19, dexterity: 13, constitution: 18, intelligence: 14, wisdom: 15, charisma: 18 },
    savingThrows: { strength: 9, constitution: 9, wisdom: 7, charisma: 9 },
    skills: { Intimidation: 9, Athletics: 9, Persuasion: 9 },
    damageResistances: ["cold"],
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["Common", "Draconic"],
    traits: [
      { name: "Legendary Resistance (2/Day)", description: "If the highlord fails a saving throw, it can choose to succeed instead." },
      { name: "Dragonlance Bearer", description: "The highlord wields a dread lance; its melee attacks deal an extra 2d6 necrotic damage (included below) and ignore resistance to piercing damage." },
    ],
    actions: [
      { name: "Multiattack", description: "The highlord makes three Dread Lance attacks." },
      { name: "Dread Lance", description: "Melee Weapon Attack (10 ft. reach)", attackBonus: 9, damageDescription: "1d12+4 piercing plus 2d6 necrotic" },
      { name: "Command the Host (Recharge 6)", description: "Up to three allied creatures within 60 feet that can hear the highlord can each use their reaction to move up to their speed and make one weapon attack." },
    ],
    legendaryActions: [
      { name: "Dread Lance", description: "The highlord makes one Dread Lance attack." },
      { name: "Fearsome Presence (Costs 2 Actions)", description: "Each enemy within 30 feet makes a DC 17 Wisdom save or is frightened until the end of its next turn." },
    ],
    legendaryActionCount: 3,
  },
  {
    id: "cm-dsotdq-blue-lady",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dragonlance: Shadow of the Dragon Queen",
    name: "The Blue Lady, Aspect of Takhisis",
    size: "huge",
    type: "fiend",
    alignment: "Lawful Evil",
    speed: "40 ft., fly 80 ft.",
    challengeRating: 15,
    ac: 19,
    acNote: "natural armor",
    hp: 253,
    maxHp: 253,
    abilityScores: { strength: 25, dexterity: 12, constitution: 23, intelligence: 20, wisdom: 18, charisma: 24 },
    savingThrows: { dexterity: 7, constitution: 12, wisdom: 10, charisma: 13 },
    skills: { Deception: 13, Perception: 10 },
    damageImmunities: ["lightning", "poison"],
    conditionImmunities: ["frightened", "poisoned"],
    senses: { blindsight: "60 ft.", darkvision: "120 ft.", "passive Perception": "20" },
    languages: ["Common", "Draconic", "Infernal", "telepathy 120 ft."],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If the Blue Lady fails a saving throw, she can choose to succeed instead." },
      { name: "Queen's Dominion", description: "Draconians and dragonarmy soldiers within 60 feet of the Blue Lady can't be frightened and add 1d6 to their damage rolls." },
    ],
    actions: [
      { name: "Multiattack", description: "The Blue Lady makes one Bite attack and two Claw attacks." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 12, damageDescription: "2d12+7 piercing plus 2d10 lightning" },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 12, damageDescription: "2d8+7 slashing" },
      { name: "Storm Breath (Recharge 5-6)", description: "The Blue Lady exhales a line of lightning 90 feet long. Each creature makes a DC 20 Dexterity save, taking 66 (12d10) lightning damage on a failure, or half as much on a success." },
    ],
    legendaryActions: [
      { name: "Claw", description: "The Blue Lady makes one Claw attack." },
      { name: "Wing Buffet (Costs 2 Actions)", description: "Each creature within 15 feet makes a DC 20 Dexterity save or takes 2d6+7 bludgeoning damage and is knocked prone." },
    ],
    legendaryActionCount: 3,
  },

  // --- Spelljammer: Light of Xaryxis ---
  {
    id: "cm-lox-brallish-pirate-captain",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Spelljammer: Light of Xaryxis",
    name: "Rock of Bral Pirate Captain",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Neutral",
    speed: "30 ft.",
    challengeRating: 2,
    ac: 15,
    acNote: "studded leather",
    hp: 52,
    maxHp: 52,
    abilityScores: { strength: 12, dexterity: 16, constitution: 14, intelligence: 11, wisdom: 12, charisma: 15 },
    savingThrows: { dexterity: 5, charisma: 4 },
    skills: { Intimidation: 4, Athletics: 3 },
    senses: { "passive Perception": "11" },
    languages: ["Common"],
    traits: [
      { name: "Belaying Pin Bravado", description: "The captain has advantage on Charisma (Intimidation) checks against creatures aboard a ship it commands." },
    ],
    actions: [
      { name: "Multiattack", description: "The captain makes two Cutlass attacks and one Pistol attack." },
      { name: "Cutlass", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d6+3 slashing" },
      { name: "Pistol", description: "Ranged Weapon Attack", attackBonus: 5, damageDescription: "1d10+3 piercing" },
    ],
  },
  {
    id: "cm-lox-mind-controlled-paladin",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Spelljammer: Light of Xaryxis",
    name: "Mind-Controlled Paladin Thrall",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 5,
    ac: 18,
    acNote: "plate armor",
    hp: 71,
    maxHp: 71,
    abilityScores: { strength: 18, dexterity: 10, constitution: 15, intelligence: 9, wisdom: 12, charisma: 16 },
    savingThrows: { wisdom: 4, charisma: 6 },
    conditionImmunities: ["charmed", "frightened"],
    senses: { "passive Perception": "11" },
    languages: ["Common"],
    traits: [
      { name: "Dominated Will", description: "The thrall obeys the Xaryxian Empire without question. If the domination is ended, the paladin drops to 1 hit point and falls unconscious." },
      { name: "Aura of Corrupted Devotion", description: "Allied thralls within 10 feet add 3 to their saving throws." },
    ],
    actions: [
      { name: "Multiattack", description: "The thrall makes two Warhammer attacks." },
      { name: "Warhammer", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "1d8+4 bludgeoning plus 2d8 necrotic" },
    ],
  },
  {
    id: "cm-lox-vampirate",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Spelljammer: Light of Xaryxis",
    name: "Vampirate",
    size: "medium",
    type: "undead",
    alignment: "Chaotic Evil",
    speed: "30 ft., fly 30 ft. (hover)",
    challengeRating: 8,
    ac: 16,
    acNote: "natural armor",
    hp: 105,
    maxHp: 105,
    abilityScores: { strength: 17, dexterity: 16, constitution: 18, intelligence: 12, wisdom: 13, charisma: 14 },
    savingThrows: { dexterity: 6, constitution: 7 },
    skills: { Perception: 4, Stealth: 6 },
    damageResistances: ["necrotic"],
    conditionImmunities: ["charmed", "exhaustion", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "14" },
    languages: ["Common"],
    traits: [
      { name: "Wildspace Adaptation", description: "The vampirate doesn't need to breathe and is immune to the harmful effects of the void of wildspace." },
      { name: "Sunlight Sensitivity", description: "While in sunlight, the vampirate has disadvantage on attack rolls and Perception checks that rely on sight." },
    ],
    actions: [
      { name: "Multiattack", description: "The vampirate makes two Cutlass attacks or uses Energy Drain twice." },
      { name: "Cutlass", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "1d6+3 slashing plus 2d6 necrotic" },
      { name: "Energy Drain", description: "Ranged Spell Attack (30 ft.)", attackBonus: 6, damageDescription: "3d6 necrotic, and the target's hit point maximum is reduced by that amount until it finishes a long rest" },
    ],
  },
  {
    id: "cm-lox-xhalcaraz",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Spelljammer: Light of Xaryxis",
    name: "Xhalcaraz, Emperor of Xaryxis",
    size: "medium",
    type: "fiend",
    alignment: "Lawful Evil",
    speed: "40 ft., fly 60 ft.",
    challengeRating: 13,
    ac: 19,
    acNote: "natural armor",
    hp: 195,
    maxHp: 195,
    abilityScores: { strength: 15, dexterity: 18, constitution: 19, intelligence: 22, wisdom: 20, charisma: 21 },
    savingThrows: { dexterity: 9, intelligence: 11, wisdom: 10 },
    skills: { Arcana: 11, Perception: 10, Insight: 10 },
    damageResistances: ["cold", "fire", "lightning"],
    damageImmunities: ["poison"],
    conditionImmunities: ["charmed", "frightened", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "20" },
    languages: ["Deep Speech", "Undercommon", "telepathy 120 ft."],
    traits: [
      { name: "Magic Resistance", description: "Xhalcaraz has advantage on saving throws against spells and other magical effects." },
      { name: "Hive Command", description: "Mind flayers and thralls within 60 feet of Xhalcaraz add 1d6 psychic damage to their attacks and can't be charmed or frightened." },
    ],
    actions: [
      { name: "Multiattack", description: "Xhalcaraz makes two Void Blade attacks and uses Mind Blast if available." },
      { name: "Void Blade", description: "Melee Weapon Attack", attackBonus: 9, damageDescription: "2d8+4 slashing plus 3d6 psychic" },
      { name: "Mind Blast (Recharge 5-6)", description: "Xhalcaraz emits psychic energy in a 60-foot cone. Each creature makes a DC 19 Intelligence save, taking 35 (10d6) psychic damage and being stunned for 1 minute on a failure, or half damage and no stun on a success." },
    ],
    legendaryActions: [
      { name: "Void Blade", description: "Xhalcaraz makes one Void Blade attack." },
      { name: "Teleport", description: "Xhalcaraz teleports up to 60 feet to an unoccupied space he can see." },
      { name: "Dominate (Costs 2 Actions)", description: "One creature Xhalcaraz can see within 60 feet makes a DC 19 Wisdom save or is charmed until the end of its next turn." },
    ],
    legendaryActionCount: 3,
  },

  // --- The Temple of Elemental Evil ---
  {
    id: "cm-toee-elemental-cult-acolyte",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Temple of Elemental Evil",
    name: "Elemental Cult Acolyte",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 3,
    ac: 14,
    acNote: "chain shirt",
    hp: 44,
    maxHp: 44,
    abilityScores: { strength: 12, dexterity: 13, constitution: 14, intelligence: 11, wisdom: 16, charisma: 12 },
    savingThrows: { wisdom: 5 },
    skills: { Religion: 2 },
    senses: { "passive Perception": "13" },
    languages: ["Common", "Primordial"],
    traits: [
      { name: "Elemental Devotion", description: "The acolyte has advantage on saving throws against being charmed or frightened while within the Temple of Elemental Evil." },
      { name: "Spellcasting", description: "The acolyte casts as a 5th-level cleric (save DC 13): sacred flame, guidance, inflict wounds, spiritual weapon, and elemental-node spells such as create bonfire, gust of wind, or Melf's acid arrow." },
    ],
    actions: [
      { name: "Node Touched Mace", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "1d6+1 bludgeoning plus 1d6 damage of the node's element" },
      { name: "Elemental Bolt", description: "Ranged Spell Attack (60 ft.)", attackBonus: 5, damageDescription: "3d8 acid, cold, fire, or lightning" },
    ],
  },
  {
    id: "cm-toee-temple-priest",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Temple of Elemental Evil",
    name: "Priest of the Elder Elemental Eye",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 8,
    ac: 16,
    acNote: "half plate",
    hp: 112,
    maxHp: 112,
    abilityScores: { strength: 13, dexterity: 12, constitution: 16, intelligence: 14, wisdom: 19, charisma: 16 },
    savingThrows: { constitution: 6, wisdom: 8, charisma: 7 },
    skills: { Religion: 6, Intimidation: 7, Arcana: 6 },
    damageResistances: ["fire"],
    senses: { darkvision: "60 ft.", "passive Perception": "14" },
    languages: ["Common", "Abyssal", "Primordial"],
    traits: [
      { name: "Legendary Resistance (1/Day)", description: "If the priest fails a saving throw, it can choose to succeed instead." },
      { name: "Spellcasting", description: "The priest casts as a 12th-level cleric (save DC 16): command, hold person, blindness/deafness, dispel magic, fireball, wall of fire, flame strike, and insect plague." },
    ],
    actions: [
      { name: "Multiattack", description: "The priest makes two Runic Flail attacks." },
      { name: "Runic Flail", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d8+1 bludgeoning plus 3d6 fire" },
      { name: "Summon Elemental Servant (1/Day)", description: "The priest magically summons a Large elemental that obeys its commands for 10 minutes or until slain." },
    ],
  },
  {
    id: "cm-toee-iuz",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Temple of Elemental Evil",
    name: "Iuz the Evil, Cambion Demigod",
    size: "medium",
    type: "fiend",
    alignment: "Chaotic Evil",
    speed: "40 ft., fly 60 ft.",
    challengeRating: 20,
    ac: 21,
    acNote: "natural armor",
    hp: 297,
    maxHp: 297,
    abilityScores: { strength: 20, dexterity: 22, constitution: 24, intelligence: 22, wisdom: 20, charisma: 26 },
    savingThrows: { dexterity: 13, constitution: 14, wisdom: 12, charisma: 15 },
    skills: { Deception: 15, Intimidation: 15, Arcana: 13 },
    damageResistances: ["cold", "lightning"],
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["charmed", "frightened", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "15" },
    languages: ["all", "telepathy 120 ft."],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If Iuz fails a saving throw, he can choose to succeed instead." },
      { name: "Magic Resistance", description: "Iuz has advantage on saving throws against spells and other magical effects." },
      { name: "Undying", description: "If Iuz is reduced to 0 hit points outside his realm of Greyhawk, his body dissolves and re-forms there in 1d10 days." },
    ],
    actions: [
      { name: "Multiattack", description: "Iuz makes three Withering Touch attacks or casts a spell and makes one attack." },
      { name: "Withering Touch", description: "Melee Spell Attack", attackBonus: 15, damageDescription: "3d8+5 necrotic, and the target can't regain hit points until the start of Iuz's next turn" },
      { name: "Old Wicked's Word (Recharge 5-6)", description: "Each creature of Iuz's choice within 60 feet makes a DC 23 Wisdom save, taking 45 (10d8) psychic damage and being frightened for 1 minute on a failure, or half damage on a success." },
    ],
    legendaryActions: [
      { name: "Withering Touch", description: "Iuz makes one Withering Touch attack." },
      { name: "Teleport", description: "Iuz magically teleports up to 120 feet." },
      { name: "Cackling Curse (Costs 2 Actions)", description: "One creature Iuz can see within 60 feet makes a DC 23 Charisma save or takes 4d10 necrotic damage and has disadvantage on its next attack roll." },
    ],
    legendaryActionCount: 3,
  },

  // --- Keep on the Borderlands ---
  {
    id: "cm-b2-priest-of-chaos",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Keep on the Borderlands",
    name: "Treacherous Priest of Chaos",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 3,
    ac: 13,
    acNote: "leather armor",
    hp: 45,
    maxHp: 45,
    abilityScores: { strength: 11, dexterity: 12, constitution: 13, intelligence: 12, wisdom: 16, charisma: 13 },
    savingThrows: { wisdom: 5 },
    skills: { Deception: 3, Religion: 3 },
    senses: { "passive Perception": "13" },
    languages: ["Common", "Goblin"],
    traits: [
      { name: "Spy Among the Faithful", description: "The priest passes as a lawful cleric; a creature must succeed on a DC 15 Wisdom (Insight) check to detect its true loyalties." },
      { name: "Spellcasting", description: "The priest casts as a 5th-level cleric (save DC 13): command, inflict wounds, hold person, spiritual weapon, bestow curse." },
    ],
    actions: [
      { name: "Mace", description: "Melee Weapon Attack", attackBonus: 2, damageDescription: "1d6 bludgeoning plus 2d6 necrotic" },
      { name: "Poisoned Chalice (1/Day)", description: "The priest offers a drink; the drinker makes a DC 13 Constitution save, taking 3d6 poison damage and being poisoned for 1 hour on a failure." },
    ],
  },
  {
    id: "cm-b2-zargon",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Keep on the Borderlands",
    name: "Zargon, the One-Eyed Evil",
    size: "large",
    type: "aberration",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 8,
    ac: 16,
    acNote: "natural armor",
    hp: 149,
    maxHp: 149,
    abilityScores: { strength: 20, dexterity: 12, constitution: 19, intelligence: 13, wisdom: 15, charisma: 17 },
    savingThrows: { constitution: 7, wisdom: 5 },
    skills: { Intimidation: 6, Perception: 5 },
    damageResistances: ["cold", "necrotic"],
    conditionImmunities: ["frightened"],
    senses: { darkvision: "120 ft.", "passive Perception": "15" },
    languages: ["Common", "Undercommon"],
    traits: [
      { name: "Regeneration", description: "Zargon regains 10 hit points at the start of its turn. If it takes radiant damage, this trait doesn't function at the start of its next turn. Zargon dies only if it starts its turn with 0 hit points and doesn't regenerate." },
      { name: "Undying Horror", description: "If Zargon's body is destroyed, its single horn re-grows a new body over 1d10 years unless the horn is destroyed by holy water or radiant damage." },
    ],
    actions: [
      { name: "Multiattack", description: "Zargon makes one Bite attack and two Tentacle attacks." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 8, damageDescription: "2d10+5 piercing" },
      { name: "Tentacle", description: "Melee Weapon Attack (10 ft. reach)", attackBonus: 8, damageDescription: "2d6+5 bludgeoning, and the target is grappled (escape DC 16)" },
      { name: "Noxious Spew (Recharge 5-6)", description: "Zargon vomits filth in a 30-foot cone. Each creature makes a DC 15 Constitution save, taking 27 (6d8) poison damage and being poisoned for 1 minute on a failure, or half damage on a success." },
    ],
  },

  // --- Queen of the Spiders ---
  {
    id: "cm-qots-drow-patrol-captain",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Queen of the Spiders",
    name: "Drow Patrol Captain",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 8,
    ac: 17,
    acNote: "studded leather + shield",
    hp: 97,
    maxHp: 97,
    abilityScores: { strength: 13, dexterity: 18, constitution: 14, intelligence: 13, wisdom: 15, charisma: 14 },
    savingThrows: { dexterity: 7, wisdom: 5 },
    skills: { Perception: 5, Stealth: 10 },
    senses: { darkvision: "120 ft.", "passive Perception": "15" },
    languages: ["Elvish", "Undercommon"],
    traits: [
      { name: "Fey Ancestry", description: "The captain has advantage on saving throws against being charmed, and magic can't put it to sleep." },
      { name: "Sunlight Sensitivity", description: "While in sunlight, the captain has disadvantage on attack rolls and Perception checks that rely on sight." },
      { name: "Innate Spellcasting", description: "The captain can innately cast (save DC 13): dancing lights, darkness, faerie fire, levitate." },
    ],
    actions: [
      { name: "Multiattack", description: "The captain makes three Hand Crossbow attacks or three Rapier attacks." },
      { name: "Rapier", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "1d8+4 piercing plus 3d6 poison" },
      { name: "Hand Crossbow", description: "Ranged Weapon Attack", attackBonus: 7, damageDescription: "1d6+4 piercing, and the target makes a DC 13 Constitution save or is poisoned for 1 hour (unconscious if the save fails by 5+)" },
    ],
  },
  {
    id: "cm-qots-eclavdra",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Queen of the Spiders",
    name: "Eclavdra, Drow Priestess of Lolth",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 13,
    ac: 18,
    acNote: "elven chain",
    hp: 153,
    maxHp: 153,
    abilityScores: { strength: 12, dexterity: 17, constitution: 15, intelligence: 18, wisdom: 20, charisma: 20 },
    savingThrows: { constitution: 6, wisdom: 9, charisma: 9 },
    skills: { Deception: 9, Insight: 9, Religion: 8 },
    damageResistances: ["poison"],
    senses: { darkvision: "120 ft.", "passive Perception": "15" },
    languages: ["Elvish", "Undercommon", "Abyssal"],
    traits: [
      { name: "Legendary Resistance (2/Day)", description: "If Eclavdra fails a saving throw, she can choose to succeed instead." },
      { name: "Fey Ancestry", description: "Eclavdra has advantage on saving throws against being charmed, and magic can't put her to sleep." },
      { name: "Spellcasting", description: "Eclavdra casts as a 14th-level cleric (save DC 17): guiding bolt, hold person, silence, spirit guardians, dispel magic, insect plague, blade barrier, and true seeing." },
    ],
    actions: [
      { name: "Multiattack", description: "Eclavdra makes two Demon Whip attacks." },
      { name: "Demon Whip", description: "Melee Weapon Attack (10 ft. reach)", attackBonus: 8, damageDescription: "2d6+3 slashing plus 3d6 poison, and the target makes a DC 15 Constitution save or is poisoned for 1 minute" },
      { name: "Summon Handmaiden (1/Day)", description: "Eclavdra summons a yochlol (use marilith stats) that serves her for 10 minutes." },
    ],
    legendaryActions: [
      { name: "Demon Whip", description: "Eclavdra makes one Demon Whip attack." },
      { name: "Cast a Cantrip", description: "Eclavdra casts sacred flame (save DC 17, 3d8 radiant)." },
      { name: "Spider Step (Costs 2 Actions)", description: "Eclavdra teleports up to 40 feet and each creature within 5 feet of her destination makes a DC 17 Dexterity save or is restrained by webs until the end of its next turn." },
    ],
    legendaryActionCount: 3,
  },
  {
    id: "cm-qots-drow-priestess-of-lolth",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Queen of the Spiders",
    name: "Drow Priestess of Lolth",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 14,
    ac: 19,
    acNote: "elven plate",
    hp: 172,
    maxHp: 172,
    abilityScores: { strength: 13, dexterity: 16, constitution: 16, intelligence: 17, wisdom: 21, charisma: 18 },
    savingThrows: { constitution: 8, wisdom: 10, charisma: 9 },
    skills: { Religion: 8, Insight: 10, Arcana: 8 },
    damageResistances: ["poison"],
    conditionImmunities: ["frightened"],
    senses: { darkvision: "120 ft.", "passive Perception": "15" },
    languages: ["Elvish", "Undercommon", "Abyssal", "Deep Speech"],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If the priestess fails a saving throw, she can choose to succeed instead." },
      { name: "Lolth's Favor", description: "When the priestess is reduced to 0 hit points, she instead drops to 20 hit points and every enemy within 20 feet makes a DC 17 Constitution save or takes 3d10 poison damage." },
      { name: "Spellcasting", description: "The priestess casts as a 16th-level cleric (save DC 18): command, inflict wounds, hold person, spirit guardians, bestow curse, contagion, harm, and gate (to summon a demon)." },
    ],
    actions: [
      { name: "Multiattack", description: "The priestess makes three Serpent Scourge attacks." },
      { name: "Serpent Scourge", description: "Melee Weapon Attack (10 ft. reach)", attackBonus: 8, damageDescription: "2d6+3 piercing plus 3d6 poison" },
    ],
    legendaryActions: [
      { name: "Serpent Scourge", description: "The priestess makes one Serpent Scourge attack." },
      { name: "Divine Word (Costs 2 Actions)", description: "One creature the priestess can see within 60 feet makes a DC 18 Charisma save or takes 5d8 psychic damage and is stunned until the end of its next turn." },
    ],
    legendaryActionCount: 3,
  },
  {
    id: "cm-qots-lolth",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Queen of the Spiders",
    name: "Lolth, the Spider Queen",
    size: "huge",
    type: "fiend",
    alignment: "Chaotic Evil",
    speed: "40 ft., climb 40 ft.",
    challengeRating: 26,
    ac: 22,
    acNote: "natural armor",
    hp: 407,
    maxHp: 407,
    abilityScores: { strength: 22, dexterity: 26, constitution: 27, intelligence: 25, wisdom: 24, charisma: 26 },
    savingThrows: { dexterity: 16, constitution: 16, wisdom: 15, charisma: 16 },
    skills: { Deception: 16, Insight: 15, Perception: 15, Stealth: 16 },
    damageResistances: ["cold", "fire", "lightning"],
    damageImmunities: ["poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "25" },
    languages: ["all", "telepathy 120 ft."],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If Lolth fails a saving throw, she can choose to succeed instead." },
      { name: "Magic Resistance", description: "Lolth has advantage on saving throws against spells and other magical effects." },
      { name: "Spider Climb", description: "Lolth can climb difficult surfaces, including upside down on ceilings, without an ability check." },
      { name: "Web Walker", description: "Lolth ignores movement restrictions caused by webbing and knows the location of any creature touching the same web." },
    ],
    actions: [
      { name: "Multiattack", description: "Lolth makes one Bite attack and two Leg attacks, and uses Dominate Drow if available." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 16, damageDescription: "2d10+6 piercing plus 7d6 poison, and the target makes a DC 24 Constitution save or is poisoned for 1 minute" },
      { name: "Leg", description: "Melee Weapon Attack (15 ft. reach)", attackBonus: 16, damageDescription: "2d8+6 piercing" },
      { name: "Dominate Drow (Recharge 5-6)", description: "Each drow and demon Lolth can see within 120 feet makes a DC 24 Wisdom save or is charmed by her for 1 minute." },
    ],
    legendaryActions: [
      { name: "Leg", description: "Lolth makes one Leg attack." },
      { name: "Web Snare (Costs 2 Actions)", description: "One creature Lolth can see within 60 feet makes a DC 24 Dexterity save or is restrained by webbing (escape DC 24)." },
      { name: "Shifting Fortune (Costs 3 Actions)", description: "Lolth teleports up to 120 feet and each creature within 20 feet of her destination makes a DC 24 Constitution save or takes 6d10 poison damage." },
    ],
    legendaryActionCount: 3,
  },

  // --- Return to the Tomb of Horrors ---
  {
    id: "cm-rtoh-acolyte-of-acererak",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Return to the Tomb of Horrors",
    name: "Acolyte of Acererak",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 6,
    ac: 15,
    acNote: "half plate",
    hp: 82,
    maxHp: 82,
    abilityScores: { strength: 11, dexterity: 13, constitution: 15, intelligence: 17, wisdom: 15, charisma: 14 },
    savingThrows: { intelligence: 6, wisdom: 5 },
    skills: { Arcana: 6, Religion: 6 },
    damageResistances: ["necrotic"],
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["Common", "Abyssal"],
    traits: [
      { name: "Grim Harvest", description: "Once per turn, when the acolyte kills a creature with a spell, it regains 2d6 hit points." },
      { name: "Spellcasting", description: "The acolyte casts as a 9th-level wizard/cleric (save DC 14): chill touch, ray of enfeeblement, blindness/deafness, animate dead, vampiric touch, and fear." },
    ],
    actions: [
      { name: "Withering Staff", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "1d6+1 bludgeoning plus 3d6 necrotic" },
      { name: "Necrotic Ray", description: "Ranged Spell Attack (120 ft.)", attackBonus: 6, damageDescription: "4d8 necrotic" },
    ],
  },
  {
    id: "cm-rtoh-night-prowler",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Return to the Tomb of Horrors",
    name: "Night Prowler of Moil",
    size: "medium",
    type: "fiend",
    alignment: "Chaotic Evil",
    speed: "40 ft., fly 40 ft. (hover)",
    challengeRating: 7,
    ac: 15,
    hp: 90,
    maxHp: 90,
    abilityScores: { strength: 12, dexterity: 19, constitution: 16, intelligence: 13, wisdom: 14, charisma: 16 },
    savingThrows: { dexterity: 7, charisma: 6 },
    skills: { Stealth: 9, Perception: 5 },
    damageResistances: ["cold", "fire", "necrotic"],
    damageVulnerabilities: ["radiant"],
    conditionImmunities: ["exhaustion", "frightened", "grappled", "prone", "restrained"],
    senses: { darkvision: "120 ft.", "passive Perception": "15" },
    languages: ["Abyssal", "Common"],
    traits: [
      { name: "Shadow Stealth", description: "While in dim light or darkness, the night prowler can take the Hide action as a bonus action." },
      { name: "Sunlight Weakness", description: "While in sunlight, the night prowler has disadvantage on attack rolls, ability checks, and saving throws." },
    ],
    actions: [
      { name: "Multiattack", description: "The night prowler makes two Claw attacks." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "2d6+4 slashing plus 2d6 necrotic, and the target's Strength score is reduced by 1d4 until it finishes a long rest" },
    ],
  },
  {
    id: "cm-rtoh-cursed-moilian-wraith",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Return to the Tomb of Horrors",
    name: "Cursed Moilian Wraith",
    size: "medium",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "0 ft., fly 60 ft. (hover)",
    challengeRating: 9,
    ac: 14,
    hp: 112,
    maxHp: 112,
    abilityScores: { strength: 6, dexterity: 18, constitution: 18, intelligence: 14, wisdom: 15, charisma: 17 },
    savingThrows: { dexterity: 8, wisdom: 6, charisma: 7 },
    damageResistances: ["acid", "cold", "fire", "lightning", "thunder"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "grappled", "paralyzed", "petrified", "poisoned", "prone", "restrained"],
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["the languages it knew in life"],
    traits: [
      { name: "Incorporeal Movement", description: "The wraith can move through creatures and objects as if they were difficult terrain, taking 5 (1d10) force damage if it ends its turn inside an object." },
      { name: "Eternal Night", description: "In the eternal darkness of Moil the wraith is immune to being turned and regains 10 hit points at the start of its turn." },
    ],
    actions: [
      { name: "Life Drain", description: "Melee Spell Attack", attackBonus: 8, damageDescription: "4d8+4 necrotic, and the target's hit point maximum is reduced by an amount equal to the damage taken until it finishes a long rest" },
      { name: "Freezing Wail (Recharge 6)", description: "Each creature within 30 feet makes a DC 16 Constitution save, taking 33 (6d10) cold damage on a failure, or half as much on a success." },
    ],
  },
  {
    id: "cm-rtoh-soul-monger-construct",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Return to the Tomb of Horrors",
    name: "Soul-Monger Construct",
    size: "large",
    type: "construct",
    alignment: "Unaligned",
    speed: "20 ft.",
    challengeRating: 10,
    ac: 18,
    acNote: "natural armor",
    hp: 168,
    maxHp: 168,
    abilityScores: { strength: 22, dexterity: 8, constitution: 20, intelligence: 3, wisdom: 11, charisma: 1 },
    savingThrows: { constitution: 9 },
    damageImmunities: ["necrotic", "poison", "psychic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "petrified", "poisoned"],
    senses: { blindsight: "60 ft.", darkvision: "120 ft.", "passive Perception": "10" },
    languages: [],
    traits: [
      { name: "Soul Battery", description: "While the construct has trapped souls (starts with 6), it has advantage on saving throws and its Slam deals an extra 2d6 necrotic damage (included below). It loses one soul each time it is critically hit." },
      { name: "Immutable Form", description: "The construct is immune to any spell or effect that would alter its form." },
    ],
    actions: [
      { name: "Multiattack", description: "The construct makes two Slam attacks." },
      { name: "Slam", description: "Melee Weapon Attack", attackBonus: 10, damageDescription: "3d8+6 bludgeoning plus 2d6 necrotic" },
      { name: "Release Soul (Recharge 5-6)", description: "The construct hurls a screaming soul at a creature within 60 feet. That creature makes a DC 17 Wisdom save, taking 36 (8d8) psychic damage on a failure, or half as much on a success." },
    ],
  },
  {
    id: "cm-rtoh-acererak-decoy-demilich",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Return to the Tomb of Horrors",
    name: "Acererak, Decoy Demilich",
    size: "tiny",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "0 ft., fly 30 ft. (hover)",
    challengeRating: 18,
    ac: 20,
    hp: 160,
    maxHp: 160,
    abilityScores: { strength: 1, dexterity: 20, constitution: 20, intelligence: 20, wisdom: 17, charisma: 20 },
    savingThrows: { constitution: 12, intelligence: 12, wisdom: 10, charisma: 12 },
    damageResistances: ["bludgeoning", "piercing", "slashing"],
    damageImmunities: ["necrotic", "poison", "psychic"],
    conditionImmunities: ["charmed", "deafened", "exhaustion", "frightened", "paralyzed", "petrified", "poisoned", "prone"],
    senses: { truesight: "120 ft.", "passive Perception": "13" },
    languages: [],
    traits: [
      { name: "Avoidance", description: "If the demilich is subjected to an effect that allows a saving throw for half damage, it instead takes no damage on a success and half on a failure." },
      { name: "Legendary Resistance (3/Day)", description: "If the demilich fails a saving throw, it can choose to succeed instead." },
      { name: "Turn Resistance Aura", description: "Undead within 30 feet of the demilich have advantage on saving throws against being turned." },
    ],
    actions: [
      { name: "Howl (Recharge 5-6)", description: "The demilich emits a bloodcurdling howl. Each creature within 30 feet that can hear it makes a DC 18 Constitution save, dropping to 0 hit points on a failure, or taking 21 (6d6) psychic damage on a success." },
      { name: "Life Drain", description: "One creature within 10 feet makes a DC 18 Constitution save, taking 45 (10d8) necrotic damage on a failure, or half as much on a success. The demilich regains hit points equal to the damage dealt." },
    ],
    legendaryActions: [
      { name: "Flight", description: "The demilich flies up to half its flying speed." },
      { name: "Cloud of Dust", description: "The demilich magically swirls its dusty remains; each creature within 10 feet makes a DC 18 Constitution save or is blinded until the end of the demilich's next turn." },
      { name: "Energy Drain (Costs 2 Actions)", description: "Each creature within 30 feet makes a DC 18 Constitution save, taking 21 (6d6) necrotic damage and having its hit point maximum reduced by that amount on a failure." },
    ],
    legendaryActionCount: 3,
  },
  {
    id: "cm-rtoh-acererak-true-demilich",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Return to the Tomb of Horrors",
    name: "Acererak, True Demilich Ascendant",
    size: "medium",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "0 ft., fly 40 ft. (hover)",
    challengeRating: 22,
    ac: 21,
    hp: 285,
    maxHp: 285,
    abilityScores: { strength: 3, dexterity: 22, constitution: 24, intelligence: 26, wisdom: 21, charisma: 24 },
    savingThrows: { constitution: 14, intelligence: 15, wisdom: 12, charisma: 14 },
    skills: { Arcana: 15, History: 15, Perception: 12 },
    damageResistances: ["bludgeoning", "piercing", "slashing"],
    damageImmunities: ["cold", "necrotic", "poison", "psychic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "petrified", "poisoned", "prone", "stunned"],
    senses: { truesight: "120 ft.", "passive Perception": "22" },
    languages: ["all", "telepathy 120 ft."],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If Acererak fails a saving throw, he can choose to succeed instead." },
      { name: "Soul Font", description: "At the start of each of Acererak's turns, if he has fewer than 285 hit points and there is a trapped soul in the Fortress of Conclusion, he regains 20 hit points." },
      { name: "Rejuvenation", description: "If destroyed while his phylactery endures, Acererak re-forms in 1d10 days at the Negative Energy Plane's edge." },
    ],
    actions: [
      { name: "Multiattack", description: "Acererak makes two Withering Touch attacks and uses Devour Soul if available." },
      { name: "Withering Touch", description: "Melee Spell Attack", attackBonus: 15, damageDescription: "4d8+8 necrotic, and the target can't regain hit points until the start of Acererak's next turn" },
      { name: "Devour Soul (Recharge 5-6)", description: "One creature within 60 feet makes a DC 23 Charisma save, taking 55 (10d10) necrotic damage on a failure and, if this reduces it to 0 hit points, its soul is trapped and it can be restored only by wish. On a success the target takes half damage." },
    ],
    legendaryActions: [
      { name: "Withering Touch", description: "Acererak makes one Withering Touch attack." },
      { name: "Blink", description: "Acererak teleports up to 60 feet to an unoccupied space he can see." },
      { name: "Dread Word (Costs 2 Actions)", description: "Each creature within 30 feet makes a DC 23 Wisdom save or takes 5d8 psychic damage and is frightened until the end of its next turn." },
    ],
    legendaryActionCount: 3,
  },

  // --- Against the Cult of the Reptile God ---
  {
    id: "cm-n1-charmed-villager",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Against the Cult of the Reptile God",
    name: "Charmed Villager of Orlane",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral",
    speed: "30 ft.",
    challengeRating: 0.125,
    ac: 10,
    hp: 9,
    maxHp: 9,
    abilityScores: { strength: 10, dexterity: 10, constitution: 11, intelligence: 10, wisdom: 8, charisma: 9 },
    senses: { "passive Perception": "9" },
    languages: ["Common"],
    traits: [
      { name: "Cult Charm", description: "The villager is charmed by the Reptile God cult. It acts helpful in public but reports the party to the cult and will fight if the charm is threatened. The charm ends if Explictica Defilus dies or with a successful DC 13 caster-level check to break enchantment." },
    ],
    actions: [
      { name: "Improvised Weapon", description: "Melee Weapon Attack", attackBonus: 2, damageDescription: "1d4 bludgeoning" },
    ],
  },
  {
    id: "cm-n1-reptile-cult-scout",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Against the Cult of the Reptile God",
    name: "Reptile Cult Scout",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 2,
    ac: 13,
    acNote: "leather armor",
    hp: 32,
    maxHp: 32,
    abilityScores: { strength: 11, dexterity: 15, constitution: 12, intelligence: 11, wisdom: 13, charisma: 11 },
    skills: { Stealth: 4, Survival: 3 },
    senses: { "passive Perception": "13" },
    languages: ["Common", "Draconic"],
    traits: [
      { name: "Zealot's Nerve", description: "The scout has advantage on saving throws against being frightened while it can see a superior cultist." },
    ],
    actions: [
      { name: "Multiattack", description: "The scout makes two Scimitar attacks or two Shortbow attacks." },
      { name: "Scimitar", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "1d6+2 slashing" },
      { name: "Shortbow", description: "Ranged Weapon Attack", attackBonus: 4, damageDescription: "1d6+2 piercing plus 1d4 poison" },
    ],
  },
  {
    id: "cm-n1-yuan-ti-servitor",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Against the Cult of the Reptile God",
    name: "Yuan-ti Servitor of the Reptile God",
    size: "medium",
    type: "monstrosity",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 1,
    ac: 12,
    hp: 27,
    maxHp: 27,
    abilityScores: { strength: 11, dexterity: 14, constitution: 12, intelligence: 13, wisdom: 12, charisma: 14 },
    skills: { Deception: 4, Stealth: 4 },
    damageImmunities: ["poison"],
    conditionImmunities: ["poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: ["Abyssal", "Common", "Draconic"],
    traits: [
      { name: "Magic Resistance", description: "The yuan-ti has advantage on saving throws against spells and other magical effects." },
      { name: "Innate Spellcasting", description: "The yuan-ti can innately cast animal friendship (snakes only) at will and suggestion 1/day (save DC 12)." },
    ],
    actions: [
      { name: "Multiattack", description: "The yuan-ti makes two melee attacks, or one Scimitar and one Constrict." },
      { name: "Scimitar", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "1d6+2 slashing" },
      { name: "Constrict", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "1d6+2 bludgeoning, and the target is grappled (escape DC 12) and restrained" },
    ],
  },
  {
    id: "cm-n1-explictica-defilus",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Against the Cult of the Reptile God",
    name: "Explictica Defilus, the Reptile God",
    size: "large",
    type: "monstrosity",
    alignment: "Chaotic Evil",
    speed: "30 ft., swim 30 ft.",
    challengeRating: 9,
    ac: 16,
    acNote: "natural armor",
    hp: 138,
    maxHp: 138,
    abilityScores: { strength: 18, dexterity: 16, constitution: 18, intelligence: 16, wisdom: 17, charisma: 20 },
    savingThrows: { dexterity: 7, wisdom: 7, charisma: 9 },
    skills: { Deception: 9, Perception: 7, Persuasion: 9 },
    damageImmunities: ["poison"],
    conditionImmunities: ["charmed", "poisoned"],
    senses: { blindsight: "30 ft.", darkvision: "60 ft.", "passive Perception": "17" },
    languages: ["Abyssal", "Common", "Draconic"],
    traits: [
      { name: "Legendary Resistance (2/Day)", description: "If Explictica fails a saving throw, she can choose to succeed instead." },
      { name: "Magic Resistance", description: "Explictica has advantage on saving throws against spells and other magical effects." },
      { name: "Hypnotic Gaze", description: "As an action, Explictica targets one creature within 30 feet. The target makes a DC 17 Wisdom save or is charmed until the end of Explictica's next turn, treating her as a trusted deity." },
      { name: "Innate Spellcasting", description: "Explictica innately casts (save DC 17): charm person, hold person, suggestion, fear, and dominate person (1/day)." },
    ],
    actions: [
      { name: "Multiattack", description: "Explictica makes one Bite attack and one Constrict attack." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 8, damageDescription: "2d8+4 piercing plus 3d6 poison" },
      { name: "Constrict", description: "Melee Weapon Attack", attackBonus: 8, damageDescription: "2d6+4 bludgeoning, and the target is grappled (escape DC 16) and restrained until the grapple ends" },
    ],
  },

  // ===========================================================================
  // populate-campaigns-g5b — Classic APs & 3PP mega-dungeons (sub-group B)
  // Sources: Age of Worms, Dungeons of Drakkenheim, Scarlet Citadel, Courts of
  // the Shadow Fey, Empire of the Ghouls, The Shackled City, Vault of the Drow,
  // Return to the Temple of Elemental Evil.
  // ===========================================================================

  // --- Age of Worms ---
  {
    id: "cm-aow-faceless-one",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Age of Worms",
    name: "Faceless One of the Ebon Triad",
    size: "medium",
    type: "aberration",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 6,
    ac: 15,
    hp: 84,
    maxHp: 84,
    abilityScores: { strength: 12, dexterity: 15, constitution: 14, intelligence: 18, wisdom: 15, charisma: 16 },
    savingThrows: { intelligence: 7, wisdom: 5 },
    skills: { Arcana: 7, Deception: 6 },
    damageResistances: ["psychic"],
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["Common", "Undercommon"],
    traits: [
      { name: "Featureless Visage", description: "The faceless one has no face and can't be blinded, and it has advantage on saving throws against illusions." },
      { name: "Spellcasting", description: "The faceless one casts as a 9th-level wizard (save DC 15): ray of enfeeblement, hold person, vampiric touch, fear, and blight." },
    ],
    actions: [
      { name: "Tentacle Whip", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "2d6+1 bludgeoning plus 2d6 necrotic" },
      { name: "Mind Lash", description: "Ranged Spell Attack (60 ft.)", attackBonus: 7, damageDescription: "4d8 psychic" },
    ],
  },
  {
    id: "cm-aow-kyuss-spawn",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Age of Worms",
    name: "Spawn of Kyuss",
    size: "medium",
    type: "undead",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 5,
    ac: 13,
    acNote: "natural armor",
    hp: 76,
    maxHp: 76,
    abilityScores: { strength: 16, dexterity: 12, constitution: 17, intelligence: 6, wisdom: 11, charisma: 10 },
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["exhaustion", "frightened", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: ["understands the languages it knew in life"],
    traits: [
      { name: "Fear Aura", description: "Any creature that starts its turn within 20 feet of the spawn makes a DC 13 Wisdom save or is frightened until the start of its next turn." },
      { name: "Worm Host", description: "When the spawn takes damage, one green worm falls from it. A creature within 5 feet makes a DC 13 Dexterity save or a worm burrows into it, dealing 1d6 necrotic damage at the start of each of its turns until removed with a DC 13 Wisdom (Medicine) check or a lesser restoration." },
    ],
    actions: [
      { name: "Multiattack", description: "The spawn makes two Slam attacks." },
      { name: "Slam", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d8+3 bludgeoning plus 1d6 necrotic" },
    ],
  },
  {
    id: "cm-aow-worm-that-walks",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Age of Worms",
    name: "Worm That Walks",
    size: "medium",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "30 ft., climb 20 ft.",
    challengeRating: 10,
    ac: 16,
    hp: 152,
    maxHp: 152,
    abilityScores: { strength: 14, dexterity: 18, constitution: 20, intelligence: 19, wisdom: 16, charisma: 15 },
    savingThrows: { constitution: 9, intelligence: 8 },
    skills: { Arcana: 8, Perception: 7 },
    damageResistances: ["bludgeoning", "piercing", "slashing"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned", "prone", "stunned"],
    senses: { blindsight: "30 ft.", darkvision: "120 ft.", "passive Perception": "17" },
    languages: ["Common", "Abyssal"],
    traits: [
      { name: "Worm Body", description: "The worm that walks is a swarm of worms wearing a corpse. It can move through any opening large enough for a Tiny creature and can't regain hit points or gain temporary hit points." },
      { name: "Squirming Escape", description: "When reduced below half its hit points, the worm that walks loses its humanoid shape; its speed becomes 20 feet and its Slam is replaced by Engulf." },
      { name: "Spellcasting", description: "The worm casts as an 11th-level wizard (save DC 16): magic missile, misty step, counterspell, vampiric touch, and cloudkill." },
    ],
    actions: [
      { name: "Multiattack", description: "The worm that walks makes two Slam attacks." },
      { name: "Slam", description: "Melee Weapon Attack", attackBonus: 8, damageDescription: "2d8+2 bludgeoning plus 3d6 necrotic" },
      { name: "Engulf", description: "One Medium or smaller creature within 5 feet makes a DC 16 Dexterity save or is grappled (escape DC 16) and takes 3d6 piercing plus 3d6 necrotic damage at the start of each of its turns from burrowing worms." },
    ],
  },
  {
    id: "cm-aow-apostle-of-kyuss",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Age of Worms",
    name: "Apostle of Kyuss",
    size: "medium",
    type: "undead",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 12,
    ac: 17,
    acNote: "half plate",
    hp: 161,
    maxHp: 161,
    abilityScores: { strength: 15, dexterity: 12, constitution: 18, intelligence: 13, wisdom: 20, charisma: 16 },
    savingThrows: { constitution: 9, wisdom: 10 },
    skills: { Religion: 6, Intimidation: 8 },
    damageResistances: ["cold"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["frightened", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "15" },
    languages: ["Common", "Abyssal"],
    traits: [
      { name: "Legendary Resistance (2/Day)", description: "If the apostle fails a saving throw, it can choose to succeed instead." },
      { name: "Worm Cloud", description: "Once per turn, when the apostle is hit by a melee attack, the attacker makes a DC 17 Constitution save or takes 2d6 necrotic damage as worms erupt from the apostle's wounds." },
      { name: "Spellcasting", description: "The apostle casts as a 14th-level cleric (save DC 17): inflict wounds, blindness/deafness, animate dead, bestow curse, contagion, insect plague, and harm." },
    ],
    actions: [
      { name: "Multiattack", description: "The apostle makes two Worm Scepter attacks." },
      { name: "Worm Scepter", description: "Melee Weapon Attack", attackBonus: 8, damageDescription: "1d8+2 bludgeoning plus 3d6 necrotic" },
      { name: "Summon the Herald (Recharge 6)", description: "The apostle raises a Spawn of Kyuss in an unoccupied space within 30 feet; it acts on the apostle's initiative and obeys its commands." },
    ],
  },
  {
    id: "cm-aow-dragotha",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Age of Worms",
    name: "Dragotha, the Undead Dragon",
    size: "gargantuan",
    type: "undead",
    alignment: "Chaotic Evil",
    speed: "40 ft., fly 80 ft.",
    challengeRating: 20,
    ac: 21,
    acNote: "natural armor",
    hp: 362,
    maxHp: 362,
    abilityScores: { strength: 27, dexterity: 10, constitution: 25, intelligence: 18, wisdom: 17, charisma: 21 },
    savingThrows: { dexterity: 7, constitution: 14, wisdom: 10, charisma: 12 },
    skills: { Perception: 17, Stealth: 7 },
    damageResistances: ["cold"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { blindsight: "60 ft.", darkvision: "120 ft.", "passive Perception": "27" },
    languages: ["Common", "Draconic"],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If Dragotha fails a saving throw, it can choose to succeed instead." },
      { name: "Rejuvenation", description: "If Dragotha's body is destroyed while its phylactery — the Fanged Bauble — endures, it re-forms in 1d10 days." },
      { name: "Undead Fortitude", description: "If damage reduces Dragotha to 0 hit points, it makes a DC 20 Constitution save (unless the damage is radiant), dropping to 1 hit point on a success." },
    ],
    actions: [
      { name: "Multiattack", description: "Dragotha uses Frightful Presence, then makes one Bite and two Claw attacks." },
      { name: "Bite", description: "Melee Weapon Attack (15 ft. reach)", attackBonus: 15, damageDescription: "2d10+8 piercing plus 4d6 necrotic" },
      { name: "Claw", description: "Melee Weapon Attack (10 ft. reach)", attackBonus: 15, damageDescription: "2d6+8 slashing" },
      { name: "Necrotic Breath (Recharge 5-6)", description: "Dragotha exhales a 90-foot cone of grave-cold energy. Each creature makes a DC 22 Constitution save, taking 66 (12d10) necrotic damage on a failure, or half as much on a success. A humanoid reduced to 0 by this rises as a Spawn of Kyuss after 1 minute." },
      { name: "Frightful Presence", description: "Each creature within 120 feet makes a DC 20 Wisdom save or is frightened for 1 minute." },
    ],
    legendaryActions: [
      { name: "Claw", description: "Dragotha makes one Claw attack." },
      { name: "Wing Attack (Costs 2 Actions)", description: "Each creature within 15 feet makes a DC 23 Dexterity save or takes 2d6+8 bludgeoning and is knocked prone; Dragotha then flies up to half its speed." },
      { name: "Worm Curse (Costs 2 Actions)", description: "One creature within 60 feet makes a DC 20 Constitution save or takes 4d6 necrotic damage and can't regain hit points until the start of Dragotha's next turn." },
    ],
    legendaryActionCount: 3,
  },
  {
    id: "cm-aow-kyuss-avatar",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Age of Worms",
    name: "Kyuss, the Worm That Walks Divine",
    size: "huge",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "40 ft., climb 40 ft.",
    challengeRating: 24,
    ac: 22,
    acNote: "natural armor",
    hp: 445,
    maxHp: 445,
    abilityScores: { strength: 25, dexterity: 16, constitution: 27, intelligence: 22, wisdom: 24, charisma: 25 },
    savingThrows: { constitution: 16, wisdom: 15, charisma: 15 },
    skills: { Perception: 15, Religion: 13 },
    damageResistances: ["cold", "psychic"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "grappled", "paralyzed", "poisoned", "prone", "restrained"],
    senses: { truesight: "120 ft.", "passive Perception": "25" },
    languages: ["all", "telepathy 120 ft."],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If Kyuss fails a saving throw, it can choose to succeed instead." },
      { name: "Worm Sea Body", description: "Kyuss is composed of countless worms. It has advantage on saving throws against effects that target a single body part, and a creature that ends its turn within 10 feet takes 2d10 necrotic damage as worms strike." },
      { name: "Herald of the Age of Worms", description: "A humanoid that dies within 60 feet of Kyuss rises as a Spawn of Kyuss at the start of Kyuss's next turn." },
    ],
    actions: [
      { name: "Multiattack", description: "Kyuss makes three Worm Tendril attacks and uses Wave of Corruption if available." },
      { name: "Worm Tendril", description: "Melee Weapon Attack (20 ft. reach)", attackBonus: 15, damageDescription: "3d8+7 bludgeoning plus 4d6 necrotic, and the target is grappled (escape DC 22)" },
      { name: "Wave of Corruption (Recharge 5-6)", description: "Kyuss releases a 60-foot cone of writhing worms. Each creature makes a DC 23 Constitution save, taking 77 (14d10) necrotic damage and being poisoned for 1 minute on a failure, or half damage on a success." },
    ],
    legendaryActions: [
      { name: "Worm Tendril", description: "Kyuss makes one Worm Tendril attack." },
      { name: "Devour Soul (Costs 2 Actions)", description: "One creature Kyuss can see within 60 feet makes a DC 23 Charisma save or takes 6d10 necrotic damage and its hit point maximum is reduced by that amount until it finishes a long rest." },
      { name: "Rise, My Children (Costs 3 Actions)", description: "Kyuss raises 1d4 Spawn of Kyuss from corpses within 60 feet; they act on Kyuss's initiative." },
    ],
    legendaryActionCount: 3,
  },

  // --- Dungeons of Drakkenheim ---
  {
    id: "cm-dodrak-crimson-thug",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dungeons of Drakkenheim",
    name: "Crimson Society Thug",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 2,
    ac: 14,
    acNote: "studded leather",
    hp: 45,
    maxHp: 45,
    abilityScores: { strength: 15, dexterity: 14, constitution: 14, intelligence: 10, wisdom: 11, charisma: 12 },
    skills: { Intimidation: 3, Stealth: 4 },
    senses: { "passive Perception": "10" },
    languages: ["Common", "thieves' cant"],
    traits: [
      { name: "Pack Tactics", description: "The thug has advantage on an attack roll against a creature if at least one of the thug's allies is within 5 feet of it and not incapacitated." },
    ],
    actions: [
      { name: "Multiattack", description: "The thug makes two Cleaver attacks." },
      { name: "Cleaver", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "1d8+2 slashing" },
      { name: "Crossbow", description: "Ranged Weapon Attack", attackBonus: 4, damageDescription: "1d8+2 piercing" },
    ],
  },
  {
    id: "cm-dodrak-silver-order-knight",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dungeons of Drakkenheim",
    name: "Silver Order Knight",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Neutral",
    speed: "30 ft.",
    challengeRating: 4,
    ac: 18,
    acNote: "plate armor",
    hp: 65,
    maxHp: 65,
    abilityScores: { strength: 16, dexterity: 11, constitution: 15, intelligence: 11, wisdom: 13, charisma: 13 },
    savingThrows: { strength: 5, constitution: 4 },
    skills: { Athletics: 5, Religion: 2 },
    senses: { "passive Perception": "11" },
    languages: ["Common"],
    traits: [
      { name: "Ward Against the Haze", description: "The knight has advantage on saving throws against being poisoned and against contamination effects." },
    ],
    actions: [
      { name: "Multiattack", description: "The knight makes two Silvered Longsword attacks." },
      { name: "Silvered Longsword", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d8+3 slashing plus 1d6 radiant" },
      { name: "Shield Bash", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d4+3 bludgeoning, and the target makes a DC 13 Strength save or is knocked prone" },
    ],
  },
  {
    id: "cm-dodrak-haze-marauder",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dungeons of Drakkenheim",
    name: "Haze-Touched Marauder",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Neutral",
    speed: "30 ft.",
    challengeRating: 3,
    ac: 13,
    hp: 52,
    maxHp: 52,
    abilityScores: { strength: 16, dexterity: 13, constitution: 16, intelligence: 8, wisdom: 10, charisma: 7 },
    damageResistances: ["necrotic"],
    conditionImmunities: ["poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: ["Common"],
    traits: [
      { name: "Delerium Mutation", description: "The marauder's flesh is warped by the Haze. When it dies it bursts in a 10-foot cloud of contaminated vapor; each creature in the area makes a DC 13 Constitution save or takes 2d6 necrotic damage and gains one level of Haze contamination." },
    ],
    actions: [
      { name: "Multiattack", description: "The marauder makes two attacks: one Mutated Claw and one Jagged Blade." },
      { name: "Mutated Claw", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d8+3 slashing plus 1d6 necrotic" },
      { name: "Jagged Blade", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d10+3 slashing" },
    ],
  },
  {
    id: "cm-dodrak-haze-elemental",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dungeons of Drakkenheim",
    name: "Haze Elemental",
    size: "large",
    type: "elemental",
    alignment: "Unaligned",
    speed: "0 ft., fly 40 ft. (hover)",
    challengeRating: 5,
    ac: 14,
    hp: 90,
    maxHp: 90,
    abilityScores: { strength: 14, dexterity: 18, constitution: 16, intelligence: 6, wisdom: 10, charisma: 8 },
    damageResistances: ["bludgeoning", "piercing", "slashing"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["exhaustion", "grappled", "paralyzed", "petrified", "poisoned", "prone", "restrained", "unconscious"],
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: [],
    traits: [
      { name: "Haze Form", description: "The elemental can move through a space as narrow as 1 inch wide without squeezing. A creature that starts its turn in the elemental's space takes 2d6 necrotic damage and must succeed on a DC 14 Constitution save or gain a level of Haze contamination." },
      { name: "Contamination Aura", description: "The area within 10 feet of the elemental is lightly obscured by shimmering violet mist." },
    ],
    actions: [
      { name: "Slam", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "2d8+4 bludgeoning plus 2d6 necrotic" },
      { name: "Engulf (Recharge 5-6)", description: "The elemental moves up to its speed through hostile creatures' spaces. Each creature it passes through makes a DC 14 Dexterity save or takes 3d6 necrotic damage and is blinded until the end of its next turn." },
    ],
  },
  {
    id: "cm-dodrak-plague-otyugh",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dungeons of Drakkenheim",
    name: "Haze-Mutated Plague Otyugh",
    size: "large",
    type: "aberration",
    alignment: "Neutral",
    speed: "30 ft.",
    challengeRating: 6,
    ac: 15,
    acNote: "natural armor",
    hp: 114,
    maxHp: 114,
    abilityScores: { strength: 18, dexterity: 11, constitution: 20, intelligence: 6, wisdom: 13, charisma: 6 },
    savingThrows: { constitution: 8 },
    damageResistances: ["necrotic", "poison"],
    senses: { darkvision: "120 ft.", "passive Perception": "11" },
    languages: ["Otyugh"],
    traits: [
      { name: "Delerium Disease", description: "A creature hit by the otyugh's Bite makes a DC 15 Constitution save or contracts filth fever and gains a level of Haze contamination." },
    ],
    actions: [
      { name: "Multiattack", description: "The otyugh makes three attacks: one Bite and two Tentacle attacks." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "2d8+4 piercing plus 2d6 poison" },
      { name: "Tentacle", description: "Melee Weapon Attack (10 ft. reach)", attackBonus: 7, damageDescription: "1d8+4 bludgeoning, and the target is grappled (escape DC 14) and restrained" },
    ],
  },
  {
    id: "cm-dodrak-king-odius-vorn",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dungeons of Drakkenheim",
    name: "King Odius Vorn, the Spellweaver-Lich",
    size: "medium",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 13,
    ac: 18,
    hp: 178,
    maxHp: 178,
    abilityScores: { strength: 11, dexterity: 16, constitution: 18, intelligence: 21, wisdom: 15, charisma: 18 },
    savingThrows: { constitution: 9, intelligence: 10, wisdom: 7 },
    skills: { Arcana: 15, History: 15, Perception: 7 },
    damageResistances: ["cold", "lightning"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "17" },
    languages: ["Common", "Elvish", "Draconic"],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If Vorn fails a saving throw, he can choose to succeed instead." },
      { name: "Haze-Bound Phylactery", description: "Vorn's phylactery is a delerium crystal at the city's heart. While it exists, a destroyed Vorn re-forms in 1d10 days." },
      { name: "Spellcasting", description: "Vorn casts as an 18th-level wizard (save DC 18): magic missile, mirror image, counterspell, fireball, ice storm, wall of force, disintegrate, chain lightning, and finger of death." },
    ],
    actions: [
      { name: "Paralyzing Touch", description: "Melee Spell Attack", attackBonus: 10, damageDescription: "3d6 cold, and the target makes a DC 18 Constitution save or is paralyzed for 1 minute" },
      { name: "Delerium Barrage (Recharge 5-6)", description: "Vorn hurls warped arcane energy in a 30-foot radius within 120 feet. Each creature makes a DC 18 Dexterity save, taking 45 (10d8) force damage on a failure, or half as much on a success." },
    ],
    legendaryActions: [
      { name: "Cantrip", description: "Vorn casts a cantrip (ray of frost, +10 to hit, 3d8 cold)." },
      { name: "Paralyzing Touch (Costs 2 Actions)", description: "Vorn uses Paralyzing Touch." },
      { name: "Disrupt Life (Costs 3 Actions)", description: "Each living creature within 20 feet of Vorn makes a DC 18 Constitution save, taking 6d6 necrotic damage on a failure, or half as much on a success." },
    ],
    legendaryActionCount: 3,
  },
  {
    id: "cm-dodrak-hollow-sovereign",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Dungeons of Drakkenheim",
    name: "The Hollow Sovereign",
    size: "huge",
    type: "aberration",
    alignment: "Chaotic Evil",
    speed: "40 ft., fly 40 ft. (hover)",
    challengeRating: 18,
    ac: 20,
    acNote: "natural armor",
    hp: 279,
    maxHp: 279,
    abilityScores: { strength: 22, dexterity: 18, constitution: 24, intelligence: 23, wisdom: 20, charisma: 25 },
    savingThrows: { dexterity: 11, constitution: 14, wisdom: 12, charisma: 14 },
    skills: { Arcana: 13, Perception: 12 },
    damageResistances: ["cold", "fire", "lightning"],
    damageImmunities: ["necrotic", "poison", "psychic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "22" },
    languages: ["Deep Speech", "telepathy 120 ft."],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If the Hollow Sovereign fails a saving throw, it can choose to succeed instead." },
      { name: "Origin of the Haze", description: "The Sovereign is the will inside the fallen meteor. Contamination effects don't harm it, and creatures with Haze contamination have disadvantage on saving throws against its abilities." },
      { name: "Warping Presence", description: "At the start of each of the Sovereign's turns, each creature within 30 feet makes a DC 22 Wisdom save or takes 3d10 psychic damage and is frightened until the start of its next turn." },
    ],
    actions: [
      { name: "Multiattack", description: "The Sovereign makes three Delerium Lash attacks." },
      { name: "Delerium Lash", description: "Melee Weapon Attack (20 ft. reach)", attackBonus: 13, damageDescription: "3d8+6 bludgeoning plus 3d6 necrotic" },
      { name: "Unmaking Beam (Recharge 5-6)", description: "The Sovereign projects a 120-foot line. Each creature makes a DC 22 Constitution save, taking 66 (12d10) force damage on a failure, or half as much on a success. A creature reduced to 0 by this is disintegrated." },
    ],
    legendaryActions: [
      { name: "Delerium Lash", description: "The Sovereign makes one Delerium Lash attack." },
      { name: "Teleport", description: "The Sovereign teleports up to 60 feet." },
      { name: "Mutate (Costs 2 Actions)", description: "One creature within 60 feet makes a DC 22 Constitution save or takes 4d10 necrotic damage and gains disadvantage on attack rolls until the end of its next turn." },
    ],
    legendaryActionCount: 3,
  },

  // --- Scarlet Citadel ---
  {
    id: "cm-sc-twilight-apostle",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Scarlet Citadel",
    name: "Twilight Apostle",
    size: "large",
    type: "giant",
    alignment: "Neutral Evil",
    speed: "40 ft.",
    challengeRating: 5,
    ac: 15,
    acNote: "natural armor",
    hp: 95,
    maxHp: 95,
    abilityScores: { strength: 19, dexterity: 13, constitution: 17, intelligence: 14, wisdom: 15, charisma: 12 },
    savingThrows: { constitution: 6, intelligence: 5 },
    skills: { Arcana: 5, Perception: 5 },
    senses: { darkvision: "60 ft.", "passive Perception": "15" },
    languages: ["Giant"],
    traits: [
      { name: "Stone Camouflage", description: "The apostle has advantage on Dexterity (Stealth) checks made to hide in rocky terrain." },
      { name: "Spellcasting", description: "The apostle casts as a 7th-level sorcerer (save DC 13): fire bolt, shield, misty step, scorching ray, and fireball." },
    ],
    actions: [
      { name: "Greatclub", description: "Melee Weapon Attack (10 ft. reach)", attackBonus: 7, damageDescription: "2d8+4 bludgeoning" },
      { name: "Twilight Bolt", description: "Ranged Spell Attack (120 ft.)", attackBonus: 5, damageDescription: "3d10 force" },
    ],
  },
  {
    id: "cm-sc-stone-giant-picket",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Scarlet Citadel",
    name: "Citadel Stone Giant Picket",
    size: "huge",
    type: "giant",
    alignment: "Neutral",
    speed: "40 ft.",
    challengeRating: 7,
    ac: 17,
    acNote: "natural armor",
    hp: 126,
    maxHp: 126,
    abilityScores: { strength: 23, dexterity: 15, constitution: 20, intelligence: 10, wisdom: 12, charisma: 9 },
    savingThrows: { dexterity: 5, constitution: 8, wisdom: 4 },
    skills: { Athletics: 10, Perception: 4 },
    senses: { darkvision: "60 ft.", "passive Perception": "14" },
    languages: ["Giant"],
    traits: [
      { name: "Stone Camouflage", description: "The giant has advantage on Dexterity (Stealth) checks made to hide in rocky terrain." },
    ],
    actions: [
      { name: "Multiattack", description: "The giant makes two Greatclub attacks." },
      { name: "Greatclub", description: "Melee Weapon Attack (15 ft. reach)", attackBonus: 10, damageDescription: "3d8+6 bludgeoning" },
      { name: "Rock", description: "Ranged Weapon Attack (60/240 ft.)", attackBonus: 10, damageDescription: "4d10+6 bludgeoning, and the target makes a DC 17 Strength save or is knocked prone" },
    ],
  },
  {
    id: "cm-sc-frost-giant-champion",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Scarlet Citadel",
    name: "Frost Giant Champion",
    size: "huge",
    type: "giant",
    alignment: "Neutral Evil",
    speed: "40 ft.",
    challengeRating: 9,
    ac: 18,
    acNote: "plate scraps",
    hp: 168,
    maxHp: 168,
    abilityScores: { strength: 25, dexterity: 9, constitution: 21, intelligence: 10, wisdom: 12, charisma: 12 },
    savingThrows: { constitution: 9, wisdom: 5, charisma: 5 },
    skills: { Athletics: 11, Perception: 5 },
    damageImmunities: ["cold"],
    senses: { "passive Perception": "15" },
    languages: ["Giant"],
    traits: [
      { name: "Rime Ferocity", description: "When the champion is first bloodied it makes one Greataxe attack as a reaction and its Greataxe deals an extra 1d8 cold damage for the rest of the encounter (not included below)." },
    ],
    actions: [
      { name: "Multiattack", description: "The champion makes two Greataxe attacks." },
      { name: "Greataxe", description: "Melee Weapon Attack (10 ft. reach)", attackBonus: 11, damageDescription: "3d12+7 slashing" },
      { name: "Rock", description: "Ranged Weapon Attack (60/240 ft.)", attackBonus: 11, damageDescription: "4d10+7 bludgeoning" },
    ],
  },
  {
    id: "cm-sc-fire-giant-wrathguard",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Scarlet Citadel",
    name: "Fire Giant Wrathguard",
    size: "huge",
    type: "giant",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 11,
    ac: 20,
    acNote: "plate armor",
    hp: 195,
    maxHp: 195,
    abilityScores: { strength: 25, dexterity: 9, constitution: 23, intelligence: 12, wisdom: 14, charisma: 13 },
    savingThrows: { dexterity: 4, constitution: 11, charisma: 6 },
    skills: { Athletics: 12, Perception: 7 },
    damageImmunities: ["fire"],
    senses: { "passive Perception": "17" },
    languages: ["Giant"],
    traits: [
      { name: "Bodyguard's Vow", description: "While within 10 feet of the Twilight Princess, the wrathguard can use its reaction to impose disadvantage on an attack roll that targets her." },
    ],
    actions: [
      { name: "Multiattack", description: "The wrathguard makes two Molten Greatsword attacks." },
      { name: "Molten Greatsword", description: "Melee Weapon Attack (10 ft. reach)", attackBonus: 12, damageDescription: "4d6+7 slashing plus 2d6 fire" },
      { name: "Hurl Coals (Recharge 5-6)", description: "The wrathguard hurls burning coals in a 20-foot radius within 120 feet. Each creature makes a DC 18 Dexterity save, taking 36 (8d8) fire damage on a failure, or half as much on a success." },
    ],
  },
  {
    id: "cm-sc-twilight-princess",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Scarlet Citadel",
    name: "The Twilight Princess",
    size: "huge",
    type: "giant",
    alignment: "Neutral Evil",
    speed: "40 ft.",
    challengeRating: 14,
    ac: 19,
    acNote: "mage armor",
    hp: 225,
    maxHp: 225,
    abilityScores: { strength: 23, dexterity: 14, constitution: 21, intelligence: 20, wisdom: 17, charisma: 18 },
    savingThrows: { dexterity: 8, constitution: 11, intelligence: 11, wisdom: 9 },
    skills: { Arcana: 11, Perception: 9, Stealth: 8 },
    damageResistances: ["fire", "cold"],
    senses: { darkvision: "120 ft.", "passive Perception": "19" },
    languages: ["Common", "Giant", "Primordial"],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If the Twilight Princess fails a saving throw, she can choose to succeed instead." },
      { name: "Stone Camouflage", description: "The Princess has advantage on Dexterity (Stealth) checks made to hide in rocky terrain." },
      { name: "Spellcasting", description: "The Princess casts as a 16th-level evoker (save DC 19): magic missile, shield, misty step, counterspell, fireball, wall of force, cone of cold, chain lightning, and meteor swarm (1/day)." },
    ],
    actions: [
      { name: "Multiattack", description: "The Princess makes two Twilight Staff attacks, or casts a spell and makes one attack." },
      { name: "Twilight Staff", description: "Melee Weapon Attack (15 ft. reach)", attackBonus: 11, damageDescription: "2d8+6 bludgeoning plus 2d8 force" },
      { name: "Overchannel Blast (Recharge 5-6)", description: "The Princess unleashes raw evocation in a 60-foot cone. Each creature makes a DC 19 Dexterity save, taking 55 (10d10) force damage on a failure, or half as much on a success." },
    ],
    legendaryActions: [
      { name: "Twilight Staff", description: "The Princess makes one Twilight Staff attack." },
      { name: "Evoker's Step", description: "The Princess teleports up to 40 feet and a creature within 5 feet of her destination takes 2d6 fire damage." },
      { name: "Sculpt Spell (Costs 2 Actions)", description: "The Princess casts fireball (save DC 19, 8d6 fire) centered within 120 feet; her allies automatically succeed on the save and take no damage." },
    ],
    legendaryActionCount: 3,
  },

  // --- Courts of the Shadow Fey ---
  {
    id: "cm-cotsf-shadow-fey-courtier",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Courts of the Shadow Fey",
    name: "Shadow Fey Courtier",
    size: "medium",
    type: "fey",
    alignment: "Neutral",
    speed: "30 ft.",
    challengeRating: 5,
    ac: 15,
    hp: 71,
    maxHp: 71,
    abilityScores: { strength: 10, dexterity: 17, constitution: 13, intelligence: 15, wisdom: 14, charisma: 19 },
    savingThrows: { dexterity: 6, charisma: 7 },
    skills: { Deception: 7, Insight: 5, Persuasion: 7 },
    damageResistances: ["necrotic"],
    conditionImmunities: ["charmed"],
    senses: { darkvision: "120 ft.", "passive Perception": "12" },
    languages: ["Common", "Elvish", "Umbral"],
    traits: [
      { name: "Fey Ancestry", description: "The courtier has advantage on saving throws against being charmed, and magic can't put it to sleep." },
      { name: "Shadow Step", description: "While in dim light or darkness, the courtier can use a bonus action to teleport up to 60 feet to an unoccupied space it can see that is also in dim light or darkness." },
    ],
    actions: [
      { name: "Rapier of Whispers", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "1d8+3 piercing plus 2d6 psychic" },
      { name: "Courtly Enchantment (Recharge 5-6)", description: "One creature the courtier can see within 30 feet makes a DC 15 Wisdom save or is charmed for 1 minute, regarding the courtier as a beloved patron." },
    ],
  },
  {
    id: "cm-cotsf-shadow-fey-warrior",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Courts of the Shadow Fey",
    name: "Shadow Fey Warrior",
    size: "medium",
    type: "fey",
    alignment: "Neutral",
    speed: "35 ft.",
    challengeRating: 6,
    ac: 17,
    acNote: "shadow-woven mail",
    hp: 90,
    maxHp: 90,
    abilityScores: { strength: 14, dexterity: 19, constitution: 15, intelligence: 12, wisdom: 13, charisma: 14 },
    savingThrows: { dexterity: 7 },
    skills: { Acrobatics: 7, Stealth: 10 },
    damageResistances: ["necrotic"],
    conditionImmunities: ["charmed"],
    senses: { darkvision: "120 ft.", "passive Perception": "11" },
    languages: ["Common", "Elvish", "Umbral"],
    traits: [
      { name: "Fey Ancestry", description: "The warrior has advantage on saving throws against being charmed, and magic can't put it to sleep." },
      { name: "Shadow Step", description: "While in dim light or darkness, the warrior can use a bonus action to teleport up to 60 feet between shadows." },
    ],
    actions: [
      { name: "Multiattack", description: "The warrior makes three Umbral Blade attacks." },
      { name: "Umbral Blade", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "1d8+4 slashing plus 1d6 necrotic" },
      { name: "Shadow Bow", description: "Ranged Weapon Attack", attackBonus: 7, damageDescription: "1d8+4 piercing plus 1d6 necrotic" },
    ],
  },
  {
    id: "cm-cotsf-shadow-elemental",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Courts of the Shadow Fey",
    name: "Shadow Elemental",
    size: "large",
    type: "elemental",
    alignment: "Neutral Evil",
    speed: "40 ft., fly 40 ft. (hover)",
    challengeRating: 7,
    ac: 15,
    hp: 105,
    maxHp: 105,
    abilityScores: { strength: 16, dexterity: 20, constitution: 16, intelligence: 6, wisdom: 10, charisma: 12 },
    damageResistances: ["acid", "fire", "lightning", "thunder"],
    damageImmunities: ["cold", "necrotic", "poison"],
    conditionImmunities: ["exhaustion", "grappled", "paralyzed", "petrified", "poisoned", "prone", "restrained"],
    senses: { darkvision: "120 ft.", "passive Perception": "10" },
    languages: ["Umbral"],
    traits: [
      { name: "Shadow Form", description: "The elemental can move through a space as narrow as 1 inch without squeezing, and it has advantage on Stealth checks in dim light or darkness." },
      { name: "Light Sensitivity", description: "While in bright light, the elemental has disadvantage on attack rolls and Perception checks that rely on sight." },
    ],
    actions: [
      { name: "Multiattack", description: "The elemental makes two Chilling Touch attacks." },
      { name: "Chilling Touch", description: "Melee Spell Attack", attackBonus: 8, damageDescription: "2d8+5 cold plus 2d6 necrotic" },
      { name: "Smother (Recharge 6)", description: "One Medium or smaller creature in the elemental's space makes a DC 15 Dexterity save or is blinded, restrained, and unable to breathe while grappled (escape DC 15), taking 3d8 necrotic damage at the start of each of its turns." },
    ],
  },
  {
    id: "cm-cotsf-shadow-portal-guardian",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Courts of the Shadow Fey",
    name: "Shadow Portal Guardian",
    size: "medium",
    type: "fey",
    alignment: "Lawful Neutral",
    speed: "30 ft.",
    challengeRating: 8,
    ac: 17,
    acNote: "studded leather",
    hp: 114,
    maxHp: 114,
    abilityScores: { strength: 15, dexterity: 18, constitution: 16, intelligence: 13, wisdom: 16, charisma: 15 },
    savingThrows: { dexterity: 8, wisdom: 7 },
    skills: { Perception: 7, Stealth: 8 },
    damageResistances: ["necrotic", "psychic"],
    conditionImmunities: ["charmed", "frightened"],
    senses: { darkvision: "120 ft.", "passive Perception": "17" },
    languages: ["Common", "Elvish", "Umbral"],
    traits: [
      { name: "Shadow Step", description: "While in dim light or darkness, the guardian can use a bonus action to teleport up to 90 feet between shadows and has advantage on its next attack." },
      { name: "Warding Bond to the Gate", description: "The guardian can't be moved more than 60 feet from the portal it guards and regains 10 hit points at the start of its turn while within 30 feet of it." },
    ],
    actions: [
      { name: "Multiattack", description: "The guardian makes three Gloom Glaive attacks." },
      { name: "Gloom Glaive", description: "Melee Weapon Attack (10 ft. reach)", attackBonus: 8, damageDescription: "1d10+4 slashing plus 2d6 necrotic" },
      { name: "Banish to Shadow (Recharge 5-6)", description: "One creature within 30 feet makes a DC 16 Charisma save or is transported to a demiplane of gloom (as banishment) for 1 minute." },
    ],
  },
  {
    id: "cm-cotsf-shadow-fey-champion",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Courts of the Shadow Fey",
    name: "Shadow Fey Champion",
    size: "medium",
    type: "fey",
    alignment: "Neutral",
    speed: "40 ft.",
    challengeRating: 10,
    ac: 18,
    acNote: "shadow plate",
    hp: 138,
    maxHp: 138,
    abilityScores: { strength: 16, dexterity: 20, constitution: 17, intelligence: 14, wisdom: 18, charisma: 16 },
    savingThrows: { dexterity: 9, wisdom: 8, charisma: 7 },
    skills: { Athletics: 7, Stealth: 9, Nature: 6 },
    damageResistances: ["necrotic"],
    conditionImmunities: ["charmed"],
    senses: { darkvision: "120 ft.", "passive Perception": "14" },
    languages: ["Common", "Elvish", "Sylvan", "Umbral"],
    traits: [
      { name: "Fey Ancestry", description: "The champion has advantage on saving throws against being charmed, and magic can't put it to sleep." },
      { name: "Shadow Step", description: "While in dim light or darkness, the champion can use a bonus action to teleport up to 60 feet and gains advantage on its first melee attack that turn." },
      { name: "Innate Spellcasting", description: "The champion casts as a druid (save DC 16): entangle, moonbeam, conjure animals, and wall of thorns." },
    ],
    actions: [
      { name: "Multiattack", description: "The champion makes three Thornshadow Spear attacks." },
      { name: "Thornshadow Spear", description: "Melee Weapon Attack (10 ft. reach)", attackBonus: 9, damageDescription: "1d8+5 piercing plus 2d6 necrotic" },
    ],
  },
  {
    id: "cm-cotsf-archfey-monarch",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Courts of the Shadow Fey",
    name: "The Queen of Night and Magic",
    size: "medium",
    type: "fey",
    alignment: "Neutral Evil",
    speed: "40 ft., fly 40 ft.",
    challengeRating: 16,
    ac: 20,
    hp: 253,
    maxHp: 253,
    abilityScores: { strength: 14, dexterity: 22, constitution: 20, intelligence: 21, wisdom: 20, charisma: 26 },
    savingThrows: { dexterity: 12, constitution: 11, wisdom: 11, charisma: 14 },
    skills: { Arcana: 11, Deception: 14, Insight: 11, Perception: 11 },
    damageResistances: ["cold", "necrotic"],
    conditionImmunities: ["charmed", "frightened"],
    senses: { truesight: "120 ft.", "passive Perception": "21" },
    languages: ["all", "telepathy 120 ft."],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If the Queen fails a saving throw, she can choose to succeed instead." },
      { name: "Magic Resistance", description: "The Queen has advantage on saving throws against spells and other magical effects." },
      { name: "Court of Endless Night", description: "The Queen and her allies within 60 feet are treated as being in dim light for the purpose of their Shadow Step traits regardless of actual lighting." },
      { name: "Innate Spellcasting", description: "The Queen casts (save DC 22): misty step, dimension door, dominate person, wall of force, feeblemind, and finger of death (1/day)." },
    ],
    actions: [
      { name: "Multiattack", description: "The Queen makes three Nightthorn Scepter attacks." },
      { name: "Nightthorn Scepter", description: "Melee Weapon Attack (10 ft. reach)", attackBonus: 12, damageDescription: "2d8+6 bludgeoning plus 3d6 psychic" },
      { name: "Unmaking Word (Recharge 5-6)", description: "Each creature of the Queen's choice within 60 feet makes a DC 22 Charisma save, taking 55 (10d10) psychic damage and being stunned until the end of its next turn on a failure, or half damage on a success." },
    ],
    legendaryActions: [
      { name: "Nightthorn Scepter", description: "The Queen makes one Nightthorn Scepter attack." },
      { name: "Veil of Shadow", description: "The Queen becomes heavily obscured to all creatures until the start of her next turn and teleports up to 60 feet." },
      { name: "Command the Court (Costs 2 Actions)", description: "One ally the Queen can see within 60 feet can immediately move up to its speed and make one attack as a reaction." },
    ],
    legendaryActionCount: 3,
  },

  // --- Empire of the Ghouls ---
  {
    id: "cm-eotg-ghoul-cultist",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Empire of the Ghouls",
    name: "Ghoul Cultist",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 2,
    ac: 13,
    acNote: "leather armor",
    hp: 36,
    maxHp: 36,
    abilityScores: { strength: 13, dexterity: 14, constitution: 12, intelligence: 10, wisdom: 13, charisma: 11 },
    skills: { Religion: 2, Stealth: 4 },
    damageResistances: ["necrotic"],
    senses: { darkvision: "30 ft.", "passive Perception": "11" },
    languages: ["Common", "Darakhul"],
    traits: [
      { name: "Ghoul Fever Devotee", description: "The cultist has advantage on saving throws against disease and against being paralyzed by ghoul attacks." },
    ],
    actions: [
      { name: "Bone Dagger", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "1d4+2 piercing plus 1d6 necrotic" },
      { name: "Hurled Fetish", description: "Ranged Spell Attack (30 ft.)", attackBonus: 3, damageDescription: "2d8 necrotic" },
    ],
  },
  {
    id: "cm-eotg-radiant-citadel-guard",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Empire of the Ghouls",
    name: "Radiant Citadel Guard",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Good",
    speed: "30 ft.",
    challengeRating: 3,
    ac: 18,
    acNote: "splint armor",
    hp: 52,
    maxHp: 52,
    abilityScores: { strength: 15, dexterity: 12, constitution: 14, intelligence: 11, wisdom: 13, charisma: 12 },
    savingThrows: { constitution: 4, wisdom: 3 },
    skills: { Perception: 3 },
    senses: { "passive Perception": "13" },
    languages: ["Common"],
    traits: [
      { name: "Concord Ward", description: "While within the Radiant Citadel, the guard and allies within 10 feet have advantage on saving throws against being frightened." },
    ],
    actions: [
      { name: "Multiattack", description: "The guard makes two Radiant Halberd attacks." },
      { name: "Radiant Halberd", description: "Melee Weapon Attack (10 ft. reach)", attackBonus: 5, damageDescription: "1d10+2 slashing plus 1d6 radiant" },
    ],
  },
  {
    id: "cm-eotg-ghast-devourer",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Empire of the Ghouls",
    name: "Darakhul Ghast Devourer",
    size: "medium",
    type: "undead",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 4,
    ac: 14,
    acNote: "natural armor",
    hp: 65,
    maxHp: 65,
    abilityScores: { strength: 16, dexterity: 15, constitution: 16, intelligence: 11, wisdom: 12, charisma: 10 },
    damageResistances: ["necrotic"],
    damageImmunities: ["poison"],
    conditionImmunities: ["charmed", "exhaustion", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: ["Common", "Darakhul"],
    traits: [
      { name: "Stench", description: "Any creature that starts its turn within 5 feet of the devourer makes a DC 12 Constitution save or is poisoned until the start of its next turn." },
      { name: "Turn Defiance", description: "The devourer and any ghouls within 30 feet of it have advantage on saving throws against effects that turn undead." },
    ],
    actions: [
      { name: "Multiattack", description: "The devourer makes one Bite and one Claws attack." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "2d8+3 piercing plus 2d6 necrotic" },
      { name: "Claws", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "2d6+3 slashing, and the target makes a DC 13 Constitution save or is paralyzed for 1 minute" },
    ],
  },
  {
    id: "cm-eotg-merciful-construct",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Empire of the Ghouls",
    name: "Merciful Construct",
    size: "large",
    type: "construct",
    alignment: "Neutral Good",
    speed: "30 ft.",
    challengeRating: 5,
    ac: 17,
    acNote: "natural armor",
    hp: 95,
    maxHp: 95,
    abilityScores: { strength: 20, dexterity: 9, constitution: 18, intelligence: 6, wisdom: 14, charisma: 10 },
    damageResistances: ["necrotic"],
    damageImmunities: ["poison", "psychic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "petrified", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["understands Common but can't speak"],
    traits: [
      { name: "Healing Hands", description: "As a bonus action, the construct touches a creature and restores 2d8 hit points to it. It can do this three times per day." },
      { name: "Immutable Form", description: "The construct is immune to any spell or effect that would alter its form." },
    ],
    actions: [
      { name: "Multiattack", description: "The construct makes two Slam attacks." },
      { name: "Slam", description: "Melee Weapon Attack", attackBonus: 8, damageDescription: "2d10+5 bludgeoning plus 1d8 radiant" },
    ],
  },
  {
    id: "cm-eotg-hidden-founder-revenant",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Empire of the Ghouls",
    name: "Hidden Founder Revenant",
    size: "medium",
    type: "undead",
    alignment: "Lawful Neutral",
    speed: "30 ft.",
    challengeRating: 7,
    ac: 16,
    acNote: "breastplate",
    hp: 115,
    maxHp: 115,
    abilityScores: { strength: 18, dexterity: 14, constitution: 18, intelligence: 13, wisdom: 16, charisma: 18 },
    savingThrows: { strength: 7, constitution: 7, wisdom: 6, charisma: 7 },
    damageResistances: ["necrotic", "psychic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned", "stunned"],
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["Common"],
    traits: [
      { name: "Regeneration", description: "The revenant regains 10 hit points at the start of its turn. If it takes radiant damage, this trait doesn't function on its next turn. It dies only if it starts its turn with 0 hit points and can't regenerate." },
      { name: "Vengeful Purpose", description: "The revenant knows the direction to the creature that betrayed the Citadel's founders and has advantage on attack rolls against it." },
    ],
    actions: [
      { name: "Multiattack", description: "The revenant makes two Founder's Blade attacks." },
      { name: "Founder's Blade", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "1d8+4 slashing plus 4d6 necrotic (or 4d6 radiant against fiends and undead)" },
    ],
  },
  {
    id: "cm-eotg-doresain",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Empire of the Ghouls",
    name: "Doresain, the Ghoul King",
    size: "medium",
    type: "fiend",
    alignment: "Chaotic Evil",
    speed: "40 ft., climb 30 ft.",
    challengeRating: 15,
    ac: 19,
    acNote: "natural armor",
    hp: 230,
    maxHp: 230,
    abilityScores: { strength: 20, dexterity: 20, constitution: 21, intelligence: 18, wisdom: 19, charisma: 22 },
    savingThrows: { dexterity: 11, constitution: 11, wisdom: 10, charisma: 12 },
    skills: { Perception: 10, Stealth: 11 },
    damageResistances: ["cold", "fire", "lightning"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "20" },
    languages: ["Abyssal", "Common", "Darakhul", "telepathy 120 ft."],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If Doresain fails a saving throw, he can choose to succeed instead." },
      { name: "Magic Resistance", description: "Doresain has advantage on saving throws against spells and other magical effects." },
      { name: "Master of Ghouls", description: "Ghouls and ghasts within 60 feet of Doresain can't be turned and add 1d6 necrotic damage to their bite attacks." },
      { name: "Turn Immunity", description: "Doresain is immune to effects that turn undead." },
    ],
    actions: [
      { name: "Multiattack", description: "Doresain makes one Bite attack and two Claw attacks." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 11, damageDescription: "2d10+5 piercing plus 3d6 necrotic, and the target makes a DC 19 Constitution save or is paralyzed for 1 minute" },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 11, damageDescription: "2d6+5 slashing" },
      { name: "Feast of Souls (Recharge 5-6)", description: "Each creature of Doresain's choice within 30 feet makes a DC 19 Constitution save, taking 45 (10d8) necrotic damage on a failure, or half as much on a success. Doresain regains hit points equal to the total damage dealt." },
    ],
    legendaryActions: [
      { name: "Claw", description: "Doresain makes one Claw attack." },
      { name: "Ghoul Leap", description: "Doresain moves up to his speed without provoking opportunity attacks." },
      { name: "Command the Hunger (Costs 2 Actions)", description: "Up to three ghouls Doresain can see can each use their reaction to move up to their speed and make one bite attack." },
    ],
    legendaryActionCount: 3,
  },

  // --- The Shackled City ---
  {
    id: "cm-scap-skum-raider",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Shackled City",
    name: "Skum Raider of the Cauldron Deeps",
    size: "medium",
    type: "aberration",
    alignment: "Lawful Evil",
    speed: "20 ft., swim 40 ft.",
    challengeRating: 2,
    ac: 13,
    acNote: "natural armor",
    hp: 39,
    maxHp: 39,
    abilityScores: { strength: 16, dexterity: 13, constitution: 15, intelligence: 10, wisdom: 11, charisma: 8 },
    skills: { Stealth: 3 },
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: ["Undercommon", "Aquan"],
    traits: [
      { name: "Amphibious", description: "The skum can breathe air and water." },
      { name: "Pack Tactics", description: "The skum has advantage on an attack roll against a creature if at least one of its allies is within 5 feet of the target and not incapacitated." },
    ],
    actions: [
      { name: "Multiattack", description: "The skum makes one Bite and one Claw attack." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d8+3 piercing" },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d6+3 slashing" },
    ],
  },
  {
    id: "cm-scap-drakthar",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Shackled City",
    name: "Drakthar, the Vampire Bugbear",
    size: "medium",
    type: "undead",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 6,
    ac: 16,
    acNote: "natural armor",
    hp: 97,
    maxHp: 97,
    abilityScores: { strength: 18, dexterity: 16, constitution: 16, intelligence: 12, wisdom: 13, charisma: 14 },
    savingThrows: { dexterity: 6, wisdom: 4 },
    skills: { Stealth: 9, Perception: 4 },
    damageResistances: ["necrotic"],
    senses: { darkvision: "120 ft.", "passive Perception": "14" },
    languages: ["Common", "Goblin"],
    traits: [
      { name: "Regeneration", description: "Drakthar regains 10 hit points at the start of his turn if he has at least 1 hit point and isn't in sunlight or running water. If he takes radiant damage or fire damage, this trait doesn't function on his next turn." },
      { name: "Sunlight Hypersensitivity", description: "Drakthar takes 10 radiant damage when he starts his turn in sunlight, and while in sunlight he has disadvantage on attack rolls and ability checks." },
      { name: "Brute Ambusher", description: "A melee weapon deals one extra die of its damage when Drakthar hits with it (included below)." },
    ],
    actions: [
      { name: "Multiattack", description: "Drakthar makes two attacks, only one of which can be a Bite." },
      { name: "Morningstar", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "2d8+4 piercing" },
      { name: "Bite", description: "Melee Weapon Attack (a willing or grappled/restrained/incapacitated creature)", attackBonus: 7, damageDescription: "1d6+4 piercing plus 3d6 necrotic, and the target's hit point maximum is reduced by that necrotic amount; Drakthar regains hit points equal to it" },
    ],
  },
  {
    id: "cm-scap-cagewright-mage",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Shackled City",
    name: "Cagewright Mage",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 8,
    ac: 15,
    acNote: "mage armor",
    hp: 97,
    maxHp: 97,
    abilityScores: { strength: 9, dexterity: 16, constitution: 14, intelligence: 19, wisdom: 15, charisma: 13 },
    savingThrows: { intelligence: 8, wisdom: 6 },
    skills: { Arcana: 8, Religion: 8 },
    damageResistances: ["psychic"],
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["Common", "Infernal", "Abyssal"],
    traits: [
      { name: "Planar Binder", description: "The Cagewright has advantage on Charisma checks made to bind or command summoned fiends, and fiends it summons obey it without a check." },
      { name: "Spellcasting", description: "The Cagewright casts as an 11th-level wizard (save DC 16): magic missile, misty step, counterspell, fireball, dimension door, planar binding, and wall of force." },
    ],
    actions: [
      { name: "Shadow Chain", description: "Melee Spell Attack (15 ft. reach)", attackBonus: 8, damageDescription: "2d8 force plus 2d6 necrotic, and the target is grappled (escape DC 16)" },
      { name: "Rift Bolt", description: "Ranged Spell Attack (120 ft.)", attackBonus: 8, damageDescription: "4d8 force" },
    ],
  },
  {
    id: "cm-scap-shackled-assassin",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Shackled City",
    name: "Soul Pillar Assassin",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "40 ft.",
    challengeRating: 9,
    ac: 17,
    acNote: "studded leather",
    hp: 120,
    maxHp: 120,
    abilityScores: { strength: 12, dexterity: 20, constitution: 15, intelligence: 14, wisdom: 16, charisma: 11 },
    savingThrows: { dexterity: 9, wisdom: 7 },
    skills: { Acrobatics: 9, Stealth: 13, Perception: 7 },
    damageResistances: ["necrotic"],
    conditionImmunities: ["frightened"],
    senses: { darkvision: "60 ft.", blindsight: "10 ft.", "passive Perception": "17" },
    languages: ["Common", "thieves' cant"],
    traits: [
      { name: "Assassinate", description: "During its first turn, the assassin has advantage on attack rolls against any creature that hasn't taken a turn. Any hit against a surprised creature is a critical hit." },
      { name: "Shadow Dance", description: "In dim light or darkness, the assassin can take the Hide action as a bonus action and can teleport up to 30 feet between shadows as part of its movement." },
    ],
    actions: [
      { name: "Multiattack", description: "The assassin makes three Wee Jas Dagger attacks." },
      { name: "Wee Jas Dagger", description: "Melee Weapon Attack", attackBonus: 9, damageDescription: "1d4+5 piercing plus 3d6 necrotic, and the target makes a DC 15 Constitution save or takes 3d6 poison damage" },
    ],
  },
  {
    id: "cm-scap-adimarchus",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Shackled City",
    name: "Adimarchus, Demon Prince of Madness",
    size: "large",
    type: "fiend",
    alignment: "Chaotic Evil",
    speed: "40 ft., fly 90 ft.",
    challengeRating: 23,
    ac: 22,
    acNote: "natural armor",
    hp: 425,
    maxHp: 425,
    abilityScores: { strength: 26, dexterity: 21, constitution: 28, intelligence: 24, wisdom: 20, charisma: 27 },
    savingThrows: { strength: 16, constitution: 17, wisdom: 13, charisma: 16 },
    skills: { Insight: 13, Perception: 13 },
    damageResistances: ["cold", "lightning"],
    damageImmunities: ["fire", "poison", "psychic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "poisoned", "stunned"],
    senses: { truesight: "120 ft.", "passive Perception": "23" },
    languages: ["all", "telepathy 120 ft."],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If Adimarchus fails a saving throw, he can choose to succeed instead." },
      { name: "Magic Resistance", description: "Adimarchus has advantage on saving throws against spells and other magical effects." },
      { name: "Aura of Madness", description: "At the start of each of Adimarchus's turns, each creature within 30 feet makes a DC 24 Wisdom save or takes 4d10 psychic damage and suffers a short-term madness until the end of its next turn." },
    ],
    actions: [
      { name: "Multiattack", description: "Adimarchus makes one Soulscourge attack and two Claw attacks." },
      { name: "Soulscourge", description: "Melee Weapon Attack (15 ft. reach)", attackBonus: 16, damageDescription: "3d8+8 slashing plus 4d6 psychic, and the target makes a DC 24 Wisdom save or is frightened for 1 minute" },
      { name: "Claw", description: "Melee Weapon Attack (10 ft. reach)", attackBonus: 16, damageDescription: "2d8+8 slashing" },
      { name: "Shatter Sanity (Recharge 5-6)", description: "Each creature in a 60-foot cone makes a DC 24 Intelligence save, taking 77 (14d10) psychic damage and being incapacitated until the end of its next turn on a failure, or half damage on a success." },
    ],
    legendaryActions: [
      { name: "Claw", description: "Adimarchus makes one Claw attack." },
      { name: "Wing Storm (Costs 2 Actions)", description: "Each creature within 15 feet makes a DC 24 Dexterity save or takes 2d8+8 bludgeoning and is knocked prone; Adimarchus flies up to half its speed." },
      { name: "Maddening Word (Costs 3 Actions)", description: "One creature Adimarchus can see within 60 feet makes a DC 24 Charisma save or is dominated (as dominate monster) for 1 minute." },
    ],
    legendaryActionCount: 3,
  },

  // --- Vault of the Drow ---
  {
    id: "cm-d3-quaggoth-slave",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vault of the Drow",
    name: "Quaggoth Slave of Erelhei-Cinlu",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Neutral",
    speed: "30 ft., climb 30 ft.",
    challengeRating: 2,
    ac: 13,
    acNote: "natural armor",
    hp: 45,
    maxHp: 45,
    abilityScores: { strength: 17, dexterity: 12, constitution: 16, intelligence: 6, wisdom: 12, charisma: 7 },
    damageResistances: ["poison"],
    conditionImmunities: ["poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "11" },
    languages: ["Undercommon"],
    traits: [
      { name: "Wounded Fury", description: "While it has 10 hit points or fewer, the quaggoth has advantage on attack rolls. In addition, it deals an extra 7 (2d6) damage to any target it hits with a melee attack." },
    ],
    actions: [
      { name: "Multiattack", description: "The quaggoth makes two Claw attacks." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d6+3 slashing" },
    ],
  },
  {
    id: "cm-d3-drow-house-guard-captain",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vault of the Drow",
    name: "Drow House Guard Captain",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 6,
    ac: 18,
    acNote: "adamantine breastplate + shield",
    hp: 84,
    maxHp: 84,
    abilityScores: { strength: 14, dexterity: 17, constitution: 14, intelligence: 13, wisdom: 14, charisma: 12 },
    savingThrows: { dexterity: 6, wisdom: 5 },
    skills: { Perception: 5, Stealth: 9 },
    senses: { darkvision: "120 ft.", "passive Perception": "15" },
    languages: ["Elvish", "Undercommon"],
    traits: [
      { name: "Fey Ancestry", description: "The captain has advantage on saving throws against being charmed, and magic can't put it to sleep." },
      { name: "Sunlight Sensitivity", description: "While in sunlight, the captain has disadvantage on attack rolls and Perception checks that rely on sight." },
      { name: "Innate Spellcasting", description: "The captain can innately cast (save DC 12): dancing lights, darkness, faerie fire." },
    ],
    actions: [
      { name: "Multiattack", description: "The captain makes three Poisoned Longsword attacks." },
      { name: "Poisoned Longsword", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "1d8+3 slashing plus 2d6 poison" },
      { name: "Hand Crossbow", description: "Ranged Weapon Attack", attackBonus: 6, damageDescription: "1d6+3 piercing, and the target makes a DC 13 Constitution save or is poisoned for 1 hour" },
    ],
  },
  {
    id: "cm-d3-va-guulgh",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vault of the Drow",
    name: "Va-Guulgh, Kuo-Toa Priest-Prince",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft., swim 30 ft.",
    challengeRating: 8,
    ac: 15,
    acNote: "natural armor + shield",
    hp: 123,
    maxHp: 123,
    abilityScores: { strength: 15, dexterity: 12, constitution: 16, intelligence: 13, wisdom: 19, charisma: 14 },
    savingThrows: { constitution: 6, wisdom: 8 },
    skills: { Perception: 8, Religion: 5 },
    conditionImmunities: ["charmed"],
    senses: { darkvision: "120 ft.", "passive Perception": "18" },
    languages: ["Undercommon"],
    traits: [
      { name: "Amphibious", description: "Va-Guulgh can breathe air and water." },
      { name: "Otherworldly Perception", description: "Va-Guulgh can sense any creature within 30 feet that is invisible or on the Ethereal Plane." },
      { name: "Sunlight Sensitivity", description: "While in sunlight, Va-Guulgh has disadvantage on attack rolls and Perception checks that rely on sight." },
      { name: "Spellcasting", description: "Va-Guulgh casts as a 9th-level cleric (save DC 16): sacred flame, bane, hold person, spiritual weapon, sleet storm, and blight." },
    ],
    actions: [
      { name: "Multiattack", description: "Va-Guulgh makes two attacks: one Scepter and one Bite, or two Sacred Flame." },
      { name: "Scepter", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d6+2 bludgeoning plus 2d6 lightning" },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d4+2 piercing" },
      { name: "Pincer Staff", description: "The kuo-toa attacks with a barbed staff; on a hit the target is grappled (escape DC 14)." },
    ],
  },

  // --- Return to the Temple of Elemental Evil ---
  {
    id: "cm-rtee-cult-spy",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Return to the Temple of Elemental Evil",
    name: "Elder Eye Cult Spy",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 4,
    ac: 13,
    acNote: "leather armor",
    hp: 58,
    maxHp: 58,
    abilityScores: { strength: 11, dexterity: 16, constitution: 13, intelligence: 14, wisdom: 15, charisma: 13 },
    savingThrows: { dexterity: 5 },
    skills: { Deception: 5, Stealth: 7, Insight: 4 },
    senses: { "passive Perception": "14" },
    languages: ["Common", "Primordial"],
    traits: [
      { name: "Cover Identity", description: "The spy has a documented cover identity; a creature must succeed on a DC 15 Wisdom (Insight) check to see through it." },
      { name: "Cunning Action", description: "On each of its turns, the spy can use a bonus action to Dash, Disengage, or Hide." },
    ],
    actions: [
      { name: "Multiattack", description: "The spy makes two Shortsword attacks." },
      { name: "Shortsword", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d6+3 piercing plus 2d6 poison" },
      { name: "Hand Crossbow", description: "Ranged Weapon Attack", attackBonus: 5, damageDescription: "1d6+3 piercing" },
    ],
  },
  {
    id: "cm-rtee-earth-cult-acolyte",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Return to the Temple of Elemental Evil",
    name: "Earth Cult Acolyte of the Crater Ridge Mines",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 3,
    ac: 16,
    acNote: "scale mail + shield",
    hp: 45,
    maxHp: 45,
    abilityScores: { strength: 14, dexterity: 10, constitution: 15, intelligence: 10, wisdom: 15, charisma: 11 },
    savingThrows: { wisdom: 4 },
    skills: { Religion: 2, Athletics: 4 },
    damageResistances: ["bludgeoning"],
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["Common", "Terran"],
    traits: [
      { name: "Stone's Endurance", description: "When the acolyte takes damage, it can use its reaction to reduce that damage by 1d12 + its Constitution modifier." },
      { name: "Spellcasting", description: "The acolyte casts as a 5th-level cleric (save DC 12): mold earth, guidance, spike growth, spiritual weapon, and Maximilian's earthen grasp." },
    ],
    actions: [
      { name: "Iron Maul", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "1d10+2 bludgeoning" },
      { name: "Hurled Stone", description: "Ranged Spell Attack (60 ft.)", attackBonus: 4, damageDescription: "3d8 bludgeoning" },
    ],
  },
  {
    id: "cm-rtee-tharizdun-lieutenant",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Return to the Temple of Elemental Evil",
    name: "Tharizdun Cult Lieutenant",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 12,
    ac: 18,
    acNote: "half plate",
    hp: 161,
    maxHp: 161,
    abilityScores: { strength: 13, dexterity: 14, constitution: 17, intelligence: 15, wisdom: 20, charisma: 17 },
    savingThrows: { constitution: 8, wisdom: 10, charisma: 8 },
    skills: { Religion: 7, Arcana: 6, Intimidation: 8 },
    damageResistances: ["cold", "psychic"],
    conditionImmunities: ["frightened"],
    senses: { darkvision: "120 ft.", "passive Perception": "15" },
    languages: ["Common", "Abyssal", "Primordial"],
    traits: [
      { name: "Legendary Resistance (2/Day)", description: "If the lieutenant fails a saving throw, it can choose to succeed instead." },
      { name: "Nightmare's Favor", description: "The first time each turn the lieutenant is reduced below half its hit points, it teleports up to 30 feet and gains 15 temporary hit points." },
      { name: "Spellcasting", description: "The lieutenant casts as a 14th-level cleric (save DC 18): command, inflict wounds, hold person, spirit guardians, bestow curse, contagion, insect plague, and harm." },
    ],
    actions: [
      { name: "Multiattack", description: "The lieutenant makes two Void Flail attacks." },
      { name: "Void Flail", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "1d8+1 bludgeoning plus 4d6 necrotic" },
      { name: "Whisper of the Chained God (Recharge 5-6)", description: "Each creature within 30 feet makes a DC 18 Wisdom save, taking 39 (6d12) psychic damage and being frightened for 1 minute on a failure, or half damage on a success." },
    ],
  },
  {
    id: "cm-rtee-olhydra",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Return to the Temple of Elemental Evil",
    name: "Olhydra, Princess of Evil Water Creatures",
    size: "huge",
    type: "elemental",
    alignment: "Neutral Evil",
    speed: "30 ft., swim 90 ft.",
    challengeRating: 19,
    ac: 19,
    acNote: "natural armor",
    hp: 297,
    maxHp: 297,
    abilityScores: { strength: 24, dexterity: 20, constitution: 25, intelligence: 18, wisdom: 20, charisma: 22 },
    savingThrows: { dexterity: 12, constitution: 15, wisdom: 12, charisma: 13 },
    skills: { Perception: 12 },
    damageResistances: ["fire"],
    damageImmunities: ["acid", "cold", "poison"],
    conditionImmunities: ["exhaustion", "grappled", "paralyzed", "petrified", "poisoned", "prone", "restrained", "unconscious"],
    senses: { blindsight: "120 ft.", "passive Perception": "22" },
    languages: ["Aquan", "Common", "telepathy 120 ft."],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If Olhydra fails a saving throw, she can choose to succeed instead." },
      { name: "Water Form", description: "Olhydra can move through a space as narrow as 1 inch without squeezing and can enter a hostile creature's space. A creature that starts its turn in her space takes 3d6 cold damage." },
      { name: "Drowning Aura", description: "A creature that starts its turn within 20 feet of Olhydra makes a DC 20 Constitution save or begins suffocating until it leaves the aura." },
    ],
    actions: [
      { name: "Multiattack", description: "Olhydra makes three Crushing Wave attacks." },
      { name: "Crushing Wave", description: "Melee Weapon Attack (15 ft. reach)", attackBonus: 13, damageDescription: "3d8+7 bludgeoning plus 3d6 cold" },
      { name: "Tsunami (Recharge 5-6)", description: "A wall of water erupts in a 60-foot cone. Each creature makes a DC 21 Strength save, taking 55 (10d10) bludgeoning damage and being pushed 30 feet and knocked prone on a failure, or half damage on a success." },
    ],
    legendaryActions: [
      { name: "Crushing Wave", description: "Olhydra makes one Crushing Wave attack." },
      { name: "Whirlpool (Costs 2 Actions)", description: "One creature within 30 feet makes a DC 21 Strength save or is pulled adjacent to Olhydra, restrained, and takes 4d6 cold damage." },
    ],
    legendaryActionCount: 3,
  },
  {
    id: "cm-rtee-yan-c-bin",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Return to the Temple of Elemental Evil",
    name: "Yan-C-Bin, Prince of Evil Air Creatures",
    size: "huge",
    type: "elemental",
    alignment: "Neutral Evil",
    speed: "0 ft., fly 120 ft. (hover)",
    challengeRating: 20,
    ac: 20,
    hp: 287,
    maxHp: 287,
    abilityScores: { strength: 22, dexterity: 27, constitution: 24, intelligence: 19, wisdom: 20, charisma: 23 },
    savingThrows: { dexterity: 15, constitution: 14, wisdom: 12, charisma: 13 },
    skills: { Perception: 12, Stealth: 15 },
    damageResistances: ["lightning", "thunder"],
    damageImmunities: ["poison"],
    conditionImmunities: ["exhaustion", "grappled", "paralyzed", "petrified", "poisoned", "prone", "restrained", "unconscious"],
    senses: { blindsight: "60 ft.", darkvision: "120 ft.", "passive Perception": "22" },
    languages: ["Auran", "Common", "telepathy 120 ft."],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If Yan-C-Bin fails a saving throw, he can choose to succeed instead." },
      { name: "Air Form", description: "Yan-C-Bin can move through a space as narrow as 1 inch without squeezing and can enter a hostile creature's space." },
      { name: "Howling Presence", description: "A creature that starts its turn within 20 feet of Yan-C-Bin makes a DC 20 Constitution save or is deafened and takes 2d8 thunder damage." },
    ],
    actions: [
      { name: "Multiattack", description: "Yan-C-Bin makes three Cyclone Slam attacks." },
      { name: "Cyclone Slam", description: "Melee Weapon Attack (10 ft. reach)", attackBonus: 14, damageDescription: "3d8+6 bludgeoning plus 2d8 thunder" },
      { name: "Screaming Gale (Recharge 5-6)", description: "A 90-foot line of shrieking wind. Each creature makes a DC 21 Strength save, taking 45 (10d8) thunder damage and being pushed 40 feet and knocked prone on a failure, or half damage on a success." },
    ],
    legendaryActions: [
      { name: "Cyclone Slam", description: "Yan-C-Bin makes one Cyclone Slam attack." },
      { name: "Wind Step", description: "Yan-C-Bin moves up to 60 feet without provoking opportunity attacks." },
      { name: "Suffocating Grasp (Costs 2 Actions)", description: "One creature within 10 feet makes a DC 21 Constitution save or takes 4d8 thunder damage and can't speak or cast spells with verbal components until the end of its next turn." },
    ],
    legendaryActionCount: 3,
  },

  // ===========================================================================
  // populate-campaigns-g5c — Sandbox, classic & sci-fantasy modules (sub-group C)
  // Sources: The Dark of Hot Springs Island, Reavers of Harkenwold, The Lost
  // City, Points of Light, Night Below, Desert of Desolation, Savage Tide,
  // Expedition to the Barrier Peaks.
  // ===========================================================================

  // --- The Dark of Hot Springs Island ---
  {
    id: "cm-hsi-hex-scarred-raider",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Dark of Hot Springs Island",
    name: "Hex-Scarred Raider",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Neutral",
    speed: "30 ft.",
    challengeRating: 2,
    ac: 13,
    acNote: "hide armor",
    hp: 39,
    maxHp: 39,
    abilityScores: { strength: 15, dexterity: 14, constitution: 15, intelligence: 8, wisdom: 11, charisma: 9 },
    skills: { Survival: 2, Athletics: 4 },
    senses: { "passive Perception": "10" },
    languages: ["Common"],
    traits: [
      { name: "Color Curse", description: "When the raider is bloodied, its hex-scars flare; its melee attacks deal an extra 1d6 damage of a random type (roll: 1 acid, 2 cold, 3 fire, 4 lightning, 5 poison, 6 psychic) for the rest of the encounter (not included below)." },
    ],
    actions: [
      { name: "Multiattack", description: "The raider makes two Bone Spear attacks." },
      { name: "Bone Spear", description: "Melee or Ranged Weapon Attack (20/60 ft.)", attackBonus: 4, damageDescription: "1d8+2 piercing" },
    ],
  },
  {
    id: "cm-hsi-shark-man",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Dark of Hot Springs Island",
    name: "Shark-Man Jaguar Warrior",
    size: "medium",
    type: "monstrosity",
    alignment: "Neutral Evil",
    speed: "30 ft., swim 40 ft.",
    challengeRating: 3,
    ac: 14,
    acNote: "natural armor",
    hp: 58,
    maxHp: 58,
    abilityScores: { strength: 17, dexterity: 15, constitution: 16, intelligence: 8, wisdom: 12, charisma: 8 },
    skills: { Perception: 3, Stealth: 4 },
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["Aquan"],
    traits: [
      { name: "Blood Frenzy", description: "The shark-man has advantage on melee attack rolls against any creature that doesn't have all its hit points." },
      { name: "Amphibious", description: "The shark-man can breathe air and water." },
    ],
    actions: [
      { name: "Multiattack", description: "The shark-man makes one Bite and one Claw attack." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "2d8+3 piercing" },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d6+3 slashing" },
    ],
  },
  {
    id: "cm-hsi-volcano-troll",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Dark of Hot Springs Island",
    name: "Volcano Troll",
    size: "large",
    type: "giant",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 6,
    ac: 15,
    acNote: "natural armor",
    hp: 115,
    maxHp: 115,
    abilityScores: { strength: 19, dexterity: 13, constitution: 20, intelligence: 7, wisdom: 9, charisma: 7 },
    damageImmunities: ["fire"],
    damageVulnerabilities: ["cold"],
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: ["Giant"],
    traits: [
      { name: "Regeneration", description: "The troll regains 10 hit points at the start of its turn. If it takes cold or acid damage, this trait doesn't function on its next turn. The troll dies only if it starts its turn with 0 hit points and doesn't regenerate." },
      { name: "Magma Blood", description: "When the troll takes piercing or slashing damage, each creature within 5 feet takes 1d6 fire damage from spraying magma." },
    ],
    actions: [
      { name: "Multiattack", description: "The troll makes one Bite and two Claw attacks." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "1d10+4 piercing plus 1d6 fire" },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "2d6+4 slashing" },
    ],
  },
  {
    id: "cm-hsi-arcology-guardian-robot",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Dark of Hot Springs Island",
    name: "Arcology Guardian Robot",
    size: "large",
    type: "construct",
    alignment: "Unaligned",
    speed: "40 ft.",
    challengeRating: 7,
    ac: 18,
    acNote: "plated hull",
    hp: 126,
    maxHp: 126,
    abilityScores: { strength: 20, dexterity: 13, constitution: 18, intelligence: 10, wisdom: 12, charisma: 3 },
    damageResistances: ["bludgeoning", "piercing", "slashing"],
    damageImmunities: ["poison", "psychic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "petrified", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "11" },
    languages: ["understands Ancient but can't speak"],
    traits: [
      { name: "Immutable Form", description: "The robot is immune to any spell or effect that would alter its form." },
      { name: "Threat Assessment", description: "The robot has advantage on attack rolls against any creature that has damaged it this encounter." },
    ],
    actions: [
      { name: "Multiattack", description: "The robot makes two Servo Fist attacks and uses Arc Cannon if available." },
      { name: "Servo Fist", description: "Melee Weapon Attack", attackBonus: 8, damageDescription: "2d10+5 bludgeoning" },
      { name: "Arc Cannon (Recharge 5-6)", description: "The robot fires a 60-foot line. Each creature makes a DC 15 Dexterity save, taking 36 (8d8) lightning damage on a failure, or half as much on a success." },
    ],
  },
  {
    id: "cm-hsi-sunless-leviathan",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Dark of Hot Springs Island",
    name: "Sunless Leviathan",
    size: "gargantuan",
    type: "monstrosity",
    alignment: "Unaligned",
    speed: "20 ft., swim 60 ft.",
    challengeRating: 11,
    ac: 17,
    acNote: "natural armor",
    hp: 232,
    maxHp: 232,
    abilityScores: { strength: 26, dexterity: 10, constitution: 24, intelligence: 4, wisdom: 14, charisma: 8 },
    savingThrows: { constitution: 12, wisdom: 7 },
    skills: { Perception: 7 },
    damageResistances: ["cold"],
    senses: { blindsight: "120 ft.", darkvision: "120 ft.", "passive Perception": "17" },
    languages: [],
    traits: [
      { name: "Deep Dweller", description: "The leviathan is immune to the crushing pressure and cold of the deep sea and can't be blinded." },
      { name: "Siege Monster", description: "The leviathan deals double damage to objects and structures." },
    ],
    actions: [
      { name: "Multiattack", description: "The leviathan makes one Bite attack and two Tentacle attacks." },
      { name: "Bite", description: "Melee Weapon Attack (15 ft. reach)", attackBonus: 13, damageDescription: "3d12+8 piercing, and a Large or smaller target is swallowed (blinded, restrained, 3d6 acid at the start of each of its turns)" },
      { name: "Tentacle", description: "Melee Weapon Attack (30 ft. reach)", attackBonus: 13, damageDescription: "2d8+8 bludgeoning, and the target is grappled (escape DC 18)" },
      { name: "Sounding Wail (Recharge 6)", description: "Each creature within 60 feet makes a DC 18 Constitution save, taking 45 (10d8) thunder damage and being deafened for 1 minute on a failure, or half damage on a success." },
    ],
    legendaryActions: [
      { name: "Tentacle", description: "The leviathan makes one Tentacle attack." },
      { name: "Submerge (Costs 2 Actions)", description: "The leviathan dives; until the start of its next turn it has half cover and any creature it has grappled must hold its breath or begin suffocating." },
    ],
    legendaryActionCount: 3,
  },

  // --- Reavers of Harkenwold ---
  {
    id: "cm-roh-iron-circle-officer",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Reavers of Harkenwold",
    name: "Iron Circle Officer",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 3,
    ac: 17,
    acNote: "chain mail + shield",
    hp: 52,
    maxHp: 52,
    abilityScores: { strength: 15, dexterity: 12, constitution: 14, intelligence: 12, wisdom: 13, charisma: 12 },
    savingThrows: { strength: 4, constitution: 4 },
    skills: { Intimidation: 3, Survival: 3 },
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: ["Common", "Goblin"],
    traits: [
      { name: "Martial Advantage", description: "Once per turn the officer deals an extra 2d6 damage to a creature it hits with a weapon attack if that creature is within 5 feet of an ally of the officer." },
    ],
    actions: [
      { name: "Multiattack", description: "The officer makes two Longsword attacks." },
      { name: "Longsword", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "1d8+2 slashing" },
      { name: "Longbow", description: "Ranged Weapon Attack", attackBonus: 3, damageDescription: "1d8+1 piercing" },
      { name: "Iron Command (Recharge 5-6)", description: "Each ally within 30 feet that can hear the officer can immediately move up to its speed as a reaction." },
    ],
  },
  {
    id: "cm-roh-bogun-troll",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Reavers of Harkenwold",
    name: "Bogun Troll",
    size: "large",
    type: "giant",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 4,
    ac: 14,
    acNote: "natural armor",
    hp: 84,
    maxHp: 84,
    abilityScores: { strength: 18, dexterity: 13, constitution: 18, intelligence: 7, wisdom: 9, charisma: 7 },
    damageVulnerabilities: ["fire"],
    senses: { darkvision: "60 ft.", "passive Perception": "9" },
    languages: ["Giant"],
    traits: [
      { name: "Regeneration", description: "The bogun troll regains 8 hit points at the start of its turn. If it takes fire or acid damage, this trait doesn't function on its next turn. It dies only if it starts its turn with 0 hit points and doesn't regenerate." },
    ],
    actions: [
      { name: "Multiattack", description: "The bogun troll makes one Bite and two Claw attacks." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "1d8+4 piercing" },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "2d4+4 slashing" },
    ],
  },
  {
    id: "cm-roh-marsh-troll-chieftain",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Reavers of Harkenwold",
    name: "Marsh Troll Chieftain",
    size: "large",
    type: "giant",
    alignment: "Chaotic Evil",
    speed: "30 ft., swim 30 ft.",
    challengeRating: 6,
    ac: 15,
    acNote: "natural armor",
    hp: 126,
    maxHp: 126,
    abilityScores: { strength: 20, dexterity: 14, constitution: 20, intelligence: 8, wisdom: 11, charisma: 10 },
    savingThrows: { constitution: 7 },
    skills: { Stealth: 5, Perception: 3 },
    damageVulnerabilities: ["fire"],
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["Giant"],
    traits: [
      { name: "Regeneration", description: "The chieftain regains 12 hit points at the start of its turn. If it takes fire or acid damage, this trait doesn't function on its next turn. It dies only if it starts its turn with 0 hit points and doesn't regenerate." },
      { name: "Bog Camouflage", description: "The chieftain has advantage on Dexterity (Stealth) checks made to hide in swampy terrain." },
    ],
    actions: [
      { name: "Multiattack", description: "The chieftain makes one Bite and two Claw attacks." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 8, damageDescription: "2d6+5 piercing" },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 8, damageDescription: "2d6+5 slashing, and the target is grappled (escape DC 16)" },
    ],
  },
  {
    id: "cm-roh-twigsplitter",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Reavers of Harkenwold",
    name: "Twigsplitter, Ettin Chieftain of the Iron Circle",
    size: "large",
    type: "giant",
    alignment: "Chaotic Evil",
    speed: "40 ft.",
    challengeRating: 8,
    ac: 16,
    acNote: "scrap plate",
    hp: 150,
    maxHp: 150,
    abilityScores: { strength: 22, dexterity: 8, constitution: 19, intelligence: 6, wisdom: 12, charisma: 11 },
    savingThrows: { strength: 9, constitution: 7 },
    skills: { Perception: 8, Intimidation: 4 },
    conditionImmunities: ["charmed", "frightened", "stunned"],
    senses: { darkvision: "60 ft.", "passive Perception": "18" },
    languages: ["Giant", "Orc"],
    traits: [
      { name: "Two Heads", description: "Twigsplitter has advantage on Wisdom (Perception) checks and on saving throws against being blinded, charmed, deafened, frightened, stunned, and knocked unconscious." },
      { name: "Wakeful", description: "When one of Twigsplitter's heads is asleep, the other is awake." },
    ],
    actions: [
      { name: "Multiattack", description: "Twigsplitter makes two attacks: one Battleaxe and one Morningstar." },
      { name: "Battleaxe", description: "Melee Weapon Attack", attackBonus: 9, damageDescription: "2d8+6 slashing" },
      { name: "Morningstar", description: "Melee Weapon Attack", attackBonus: 9, damageDescription: "2d8+6 piercing, and the target makes a DC 17 Strength save or is knocked prone" },
      { name: "Bellowed Command (Recharge 6)", description: "Each Iron Circle ally within 60 feet that can hear Twigsplitter gains 10 temporary hit points and can immediately make one weapon attack as a reaction." },
    ],
  },

  // --- The Lost City ---
  {
    id: "cm-b4-cynidicean-cultist",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Lost City",
    name: "Masked Cynidicean Cultist",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Neutral",
    speed: "30 ft.",
    challengeRating: 1,
    ac: 12,
    hp: 22,
    maxHp: 22,
    abilityScores: { strength: 11, dexterity: 14, constitution: 11, intelligence: 10, wisdom: 12, charisma: 13 },
    skills: { Deception: 3, Stealth: 4 },
    senses: { "passive Perception": "11" },
    languages: ["Common"],
    traits: [
      { name: "Dreamlily Haze", description: "The cultist is immune to being frightened and has disadvantage on Wisdom (Perception) checks and initiative rolls." },
    ],
    actions: [
      { name: "Ceremonial Dagger", description: "Melee Weapon Attack", attackBonus: 4, damageDescription: "1d4+2 piercing plus 1d4 poison" },
      { name: "Sling", description: "Ranged Weapon Attack", attackBonus: 4, damageDescription: "1d4+2 bludgeoning" },
    ],
  },
  {
    id: "cm-b4-cynidicean-priestess",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Lost City",
    name: "Cynidicean Faction Priestess",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral",
    speed: "30 ft.",
    challengeRating: 5,
    ac: 15,
    acNote: "breastplate",
    hp: 78,
    maxHp: 78,
    abilityScores: { strength: 11, dexterity: 13, constitution: 14, intelligence: 13, wisdom: 18, charisma: 15 },
    savingThrows: { wisdom: 7, charisma: 5 },
    skills: { Religion: 4, Insight: 7, Persuasion: 5 },
    senses: { "passive Perception": "14" },
    languages: ["Common"],
    traits: [
      { name: "Faction Champion", description: "Allied Cynidiceans within 30 feet of the priestess have advantage on saving throws against being charmed or frightened." },
      { name: "Spellcasting", description: "The priestess casts as an 8th-level cleric of Gorm, Usamigaras, or Madarua (save DC 15): sacred flame, bless, hold person, spiritual weapon, guardian of faith, and flame strike." },
    ],
    actions: [
      { name: "Sacred Mace", description: "Melee Weapon Attack", attackBonus: 3, damageDescription: "1d6 bludgeoning plus 2d6 radiant" },
      { name: "Sacred Flame", description: "Ranged Spell Attack (60 ft.)", attackBonus: 7, damageDescription: "3d8 radiant (Dexterity save negates)" },
    ],
  },
  {
    id: "cm-b4-pyramid-mummy-lord",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Lost City",
    name: "Pyramid Mummy Lord",
    size: "medium",
    type: "undead",
    alignment: "Lawful Evil",
    speed: "20 ft.",
    challengeRating: 9,
    ac: 17,
    acNote: "natural armor",
    hp: 132,
    maxHp: 132,
    abilityScores: { strength: 18, dexterity: 10, constitution: 17, intelligence: 11, wisdom: 19, charisma: 16 },
    savingThrows: { constitution: 7, wisdom: 8, charisma: 7 },
    damageVulnerabilities: ["fire"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "14" },
    languages: ["the languages it knew in life"],
    traits: [
      { name: "Rejuvenation", description: "A destroyed mummy lord gains a new body in 24 hours if its heart is intact, regaining all its hit points." },
      { name: "Magic Resistance", description: "The mummy lord has advantage on saving throws against spells and other magical effects." },
    ],
    actions: [
      { name: "Multiattack", description: "The mummy lord uses Dreadful Glare and makes one Rotting Fist attack." },
      { name: "Rotting Fist", description: "Melee Weapon Attack", attackBonus: 9, damageDescription: "3d6+4 bludgeoning plus 3d10 necrotic, and the target must succeed on a DC 16 Constitution save or be cursed with mummy rot" },
      { name: "Dreadful Glare", description: "One creature within 60 feet makes a DC 16 Wisdom save or is frightened until the end of the mummy lord's next turn, taking 4d10 psychic damage if it was already frightened." },
    ],
    legendaryActions: [
      { name: "Rotting Fist", description: "The mummy lord makes one Rotting Fist attack." },
      { name: "Blinding Dust", description: "Blinding dust swirls around the mummy lord; each creature within 5 feet makes a DC 16 Constitution save or is blinded until the end of its next turn." },
      { name: "Channel Negative Energy (Costs 2 Actions)", description: "Each non-undead creature within 60 feet makes a DC 16 Constitution save or takes 3d6 necrotic damage and can't regain hit points until the end of the mummy lord's next turn." },
    ],
    legendaryActionCount: 3,
  },
  {
    id: "cm-b4-zargon-avatar",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Lost City",
    name: "Zargon, the One-Eyed God of Cynidicea",
    size: "huge",
    type: "aberration",
    alignment: "Chaotic Evil",
    speed: "30 ft., swim 30 ft.",
    challengeRating: 11,
    ac: 17,
    acNote: "natural armor",
    hp: 202,
    maxHp: 202,
    abilityScores: { strength: 23, dexterity: 12, constitution: 21, intelligence: 12, wisdom: 15, charisma: 18 },
    savingThrows: { constitution: 9, wisdom: 6, charisma: 8 },
    skills: { Intimidation: 8, Perception: 6 },
    damageResistances: ["cold", "necrotic"],
    conditionImmunities: ["frightened"],
    senses: { darkvision: "120 ft.", "passive Perception": "16" },
    languages: ["Common", "Deep Speech"],
    traits: [
      { name: "Immortal Horn", description: "When Zargon's body is reduced to 0 hit points, it dissolves into black ichor and a new body regrows from its severed horn over 10 years unless the horn is bathed in holy water and destroyed." },
      { name: "Regeneration", description: "Zargon regains 15 hit points at the start of its turn. If it takes radiant damage, this trait doesn't function on its next turn." },
      { name: "Tyrant's Aura", description: "A creature that starts its turn within 20 feet of Zargon makes a DC 16 Wisdom save or has disadvantage on attack rolls until the start of its next turn." },
    ],
    actions: [
      { name: "Multiattack", description: "Zargon makes one Bite attack and two Tentacle attacks." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 10, damageDescription: "3d10+6 piercing" },
      { name: "Tentacle", description: "Melee Weapon Attack (15 ft. reach)", attackBonus: 10, damageDescription: "2d8+6 bludgeoning, and the target is grappled (escape DC 18) and restrained" },
      { name: "Devouring Maw (Recharge 6)", description: "Zargon bites a Large or smaller grappled creature, swallowing it on a hit. A swallowed creature is blinded and restrained and takes 4d8 acid damage at the start of each of Zargon's turns." },
    ],
    legendaryActions: [
      { name: "Tentacle", description: "Zargon makes one Tentacle attack." },
      { name: "Bellow (Costs 2 Actions)", description: "Each creature within 30 feet makes a DC 16 Constitution save or takes 3d8 thunder damage and is deafened until the end of its next turn." },
    ],
    legendaryActionCount: 3,
  },

  // --- Points of Light ---
  {
    id: "cm-pol-bandit-warlord",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Points of Light",
    name: "Bandit Warlord of the Nentir Vale",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 4,
    ac: 16,
    acNote: "chain shirt + shield",
    hp: 71,
    maxHp: 71,
    abilityScores: { strength: 16, dexterity: 14, constitution: 15, intelligence: 12, wisdom: 12, charisma: 15 },
    savingThrows: { strength: 5, charisma: 4 },
    skills: { Intimidation: 4, Athletics: 5 },
    senses: { "passive Perception": "11" },
    languages: ["Common"],
    traits: [
      { name: "Rallying Cry", description: "Allied bandits within 30 feet of the warlord add 1d4 to their attack rolls while the warlord isn't incapacitated." },
    ],
    actions: [
      { name: "Multiattack", description: "The warlord makes two Broadsword attacks." },
      { name: "Broadsword", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d10+3 slashing" },
      { name: "Heavy Crossbow", description: "Ranged Weapon Attack", attackBonus: 4, damageDescription: "1d10+2 piercing" },
    ],
  },
  {
    id: "cm-pol-bandit-archmage",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Points of Light",
    name: "Bandit Archmage",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 5,
    ac: 14,
    acNote: "mage armor",
    hp: 66,
    maxHp: 66,
    abilityScores: { strength: 9, dexterity: 15, constitution: 13, intelligence: 18, wisdom: 12, charisma: 13 },
    savingThrows: { intelligence: 7, wisdom: 4 },
    skills: { Arcana: 7, History: 7 },
    senses: { "passive Perception": "11" },
    languages: ["Common", "Draconic"],
    traits: [
      { name: "Spellcasting", description: "The archmage casts as a 9th-level wizard (save DC 15): fire bolt, mage armor, shield, misty step, scorching ray, counterspell, fireball, and greater invisibility." },
    ],
    actions: [
      { name: "Arcane Staff", description: "Melee Weapon Attack", attackBonus: 3, damageDescription: "1d6 bludgeoning plus 2d6 force" },
      { name: "Fire Bolt", description: "Ranged Spell Attack (120 ft.)", attackBonus: 7, damageDescription: "3d10 fire" },
    ],
  },
  {
    id: "cm-pol-bandit-king",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Points of Light",
    name: "The Bandit King",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 8,
    ac: 18,
    acNote: "half plate",
    hp: 133,
    maxHp: 133,
    abilityScores: { strength: 18, dexterity: 16, constitution: 16, intelligence: 13, wisdom: 13, charisma: 17 },
    savingThrows: { strength: 8, dexterity: 7, charisma: 7 },
    skills: { Athletics: 8, Intimidation: 7, Perception: 5 },
    senses: { "passive Perception": "15" },
    languages: ["Common", "Giant"],
    traits: [
      { name: "Brutal Command", description: "When the Bandit King reduces a creature to 0 hit points, each ally within 30 feet can immediately move up to half its speed as a reaction." },
      { name: "Indomitable (2/Day)", description: "The Bandit King can reroll a failed saving throw." },
    ],
    actions: [
      { name: "Multiattack", description: "The Bandit King makes three Reaver's Axe attacks." },
      { name: "Reaver's Axe", description: "Melee Weapon Attack", attackBonus: 8, damageDescription: "1d12+4 slashing plus 1d6 necrotic" },
      { name: "Hurled Net (Recharge 5-6)", description: "A creature within 20 feet makes a DC 15 Dexterity save or is restrained until it escapes (DC 13 Strength check) or the net is destroyed (AC 10, 15 hp, immune to bludgeoning/poison/psychic)." },
    ],
  },

  // --- Night Below ---
  {
    id: "cm-nb-rockseer-elf",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Night Below",
    name: "Rockseer Elf Scout",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral",
    speed: "35 ft.",
    challengeRating: 3,
    ac: 15,
    acNote: "studded leather",
    hp: 45,
    maxHp: 45,
    abilityScores: { strength: 11, dexterity: 18, constitution: 12, intelligence: 14, wisdom: 16, charisma: 12 },
    savingThrows: { dexterity: 6, wisdom: 5 },
    skills: { Perception: 5, Stealth: 8, Survival: 5 },
    senses: { darkvision: "120 ft.", "passive Perception": "15" },
    languages: ["Elvish", "Undercommon"],
    traits: [
      { name: "Fey Ancestry", description: "The rockseer has advantage on saving throws against being charmed, and magic can't put it to sleep." },
      { name: "Stone Meld", description: "The rockseer can move through solid rock at half speed and can use a bonus action to become invisible while touching natural stone until it moves or attacks." },
    ],
    actions: [
      { name: "Multiattack", description: "The rockseer makes two Longbow attacks or two Shortsword attacks." },
      { name: "Shortsword", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "1d6+4 piercing" },
      { name: "Longbow", description: "Ranged Weapon Attack", attackBonus: 6, damageDescription: "1d8+4 piercing plus 1d6 poison" },
    ],
  },
  {
    id: "cm-nb-ixzan-ixitxachitl",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Night Below",
    name: "Ixzan Ixitxachitl",
    size: "small",
    type: "aberration",
    alignment: "Lawful Evil",
    speed: "5 ft., swim 40 ft.",
    challengeRating: 4,
    ac: 15,
    acNote: "natural armor",
    hp: 58,
    maxHp: 58,
    abilityScores: { strength: 12, dexterity: 16, constitution: 14, intelligence: 15, wisdom: 14, charisma: 13 },
    skills: { Perception: 4, Stealth: 5 },
    damageResistances: ["necrotic"],
    senses: { blindsight: "60 ft.", darkvision: "60 ft.", "passive Perception": "14" },
    languages: ["Ixitxachitl", "Undercommon"],
    traits: [
      { name: "Blood Drain", description: "When the ixzan hits with its Tail Barb, it regains hit points equal to half the damage dealt and the target's hit point maximum is reduced by the same amount until it finishes a long rest." },
      { name: "Innate Spellcasting", description: "The ixzan casts as a 5th-level cleric of Demogorgon (save DC 12): inflict wounds, hold person, and darkness." },
    ],
    actions: [
      { name: "Multiattack", description: "The ixzan makes one Bite and one Tail Barb attack." },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d6+3 piercing" },
      { name: "Tail Barb", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d8+3 piercing plus 2d6 necrotic" },
    ],
  },
  {
    id: "cm-nb-derro-slaver",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Night Below",
    name: "Derro Slaver Leader",
    size: "small",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 5,
    ac: 15,
    acNote: "studded leather + shield",
    hp: 71,
    maxHp: 71,
    abilityScores: { strength: 12, dexterity: 16, constitution: 15, intelligence: 12, wisdom: 8, charisma: 14 },
    savingThrows: { dexterity: 6 },
    skills: { Stealth: 6, Deception: 5 },
    conditionImmunities: ["charmed"],
    senses: { darkvision: "120 ft.", "passive Perception": "9" },
    languages: ["Dwarvish", "Undercommon"],
    traits: [
      { name: "Insanity", description: "The slaver has advantage on saving throws against being charmed or frightened, and psychic damage it takes is halved." },
      { name: "Sunlight Sensitivity", description: "While in sunlight, the slaver has disadvantage on attack rolls and Perception checks that rely on sight." },
    ],
    actions: [
      { name: "Multiattack", description: "The slaver makes two Hooked Spear attacks and one Aklys throw." },
      { name: "Hooked Spear", description: "Melee Weapon Attack", attackBonus: 6, damageDescription: "1d8+3 piercing, and a Medium or smaller target makes a DC 14 Strength save or is knocked prone" },
      { name: "Aklys", description: "Ranged Weapon Attack (20/60 ft.)", attackBonus: 6, damageDescription: "1d6+3 bludgeoning plus 2d6 poison" },
    ],
  },
  {
    id: "cm-nb-gnarley-druid",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Night Below",
    name: "The Druid of the Gnarley",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 6,
    ac: 14,
    acNote: "barkskin",
    hp: 97,
    maxHp: 97,
    abilityScores: { strength: 12, dexterity: 14, constitution: 15, intelligence: 13, wisdom: 19, charisma: 14 },
    savingThrows: { intelligence: 4, wisdom: 7 },
    skills: { Nature: 4, Perception: 7, Deception: 5 },
    senses: { "passive Perception": "17" },
    languages: ["Common", "Druidic", "Sylvan"],
    traits: [
      { name: "False Ally", description: "The druid passes as a helpful guide; a creature must succeed on a DC 16 Wisdom (Insight) check to detect its true intentions." },
      { name: "Spellcasting", description: "The druid casts as a 10th-level druid (save DC 15): entangle, thunderwave, spike growth, conjure animals, wind wall, insect plague, and wall of thorns." },
    ],
    actions: [
      { name: "Multiattack", description: "The druid makes two Thornwhip Staff attacks." },
      { name: "Thornwhip Staff", description: "Melee Weapon Attack (10 ft. reach)", attackBonus: 5, damageDescription: "1d8+2 bludgeoning plus 2d6 poison, and the target is pulled 10 feet toward the druid" },
      { name: "Summon Green Dragon Ally (1/Day)", description: "The druid signals its patron; a young green dragon arrives within 1d4 rounds and fights for the druid." },
    ],
  },
  {
    id: "cm-nb-shaboath-golem",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Night Below",
    name: "Shaboath Obsidian Golem",
    size: "large",
    type: "construct",
    alignment: "Unaligned",
    speed: "30 ft.",
    challengeRating: 8,
    ac: 17,
    acNote: "natural armor",
    hp: 148,
    maxHp: 148,
    abilityScores: { strength: 21, dexterity: 9, constitution: 20, intelligence: 3, wisdom: 11, charisma: 1 },
    damageImmunities: ["poison", "psychic", "necrotic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "petrified", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "10" },
    languages: ["understands Deep Speech but can't speak"],
    traits: [
      { name: "Immutable Form", description: "The golem is immune to any spell or effect that would alter its form." },
      { name: "Magic Resistance", description: "The golem has advantage on saving throws against spells and other magical effects." },
      { name: "Obsidian Shards", description: "When the golem takes bludgeoning damage, each creature within 5 feet makes a DC 15 Dexterity save or takes 2d6 slashing damage from flying obsidian." },
    ],
    actions: [
      { name: "Multiattack", description: "The golem makes two Slam attacks." },
      { name: "Slam", description: "Melee Weapon Attack", attackBonus: 8, damageDescription: "2d10+5 bludgeoning plus 1d8 slashing" },
    ],
  },
  {
    id: "cm-nb-savant-aboleth",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Night Below",
    name: "Savant Aboleth of Great Shaboath",
    size: "large",
    type: "aberration",
    alignment: "Lawful Evil",
    speed: "10 ft., swim 40 ft.",
    challengeRating: 11,
    ac: 17,
    acNote: "natural armor",
    hp: 190,
    maxHp: 190,
    abilityScores: { strength: 21, dexterity: 9, constitution: 19, intelligence: 21, wisdom: 17, charisma: 20 },
    savingThrows: { constitution: 9, intelligence: 10, wisdom: 8 },
    skills: { History: 15, Perception: 10, Arcana: 10 },
    damageResistances: ["psychic"],
    senses: { darkvision: "120 ft.", "passive Perception": "20" },
    languages: ["Deep Speech", "telepathy 120 ft."],
    traits: [
      { name: "Legendary Resistance (2/Day)", description: "If the aboleth fails a saving throw, it can choose to succeed instead." },
      { name: "Mucous Cloud", description: "While underwater, a creature that touches the aboleth or hits it with a melee attack within 5 feet makes a DC 15 Constitution save or is diseased for 1d4 hours, able to breathe only underwater while diseased." },
      { name: "Probing Telepathy", description: "If a creature communicates telepathically with the aboleth, the aboleth learns its greatest desires." },
    ],
    actions: [
      { name: "Multiattack", description: "The aboleth makes three Tentacle attacks." },
      { name: "Tentacle", description: "Melee Weapon Attack (15 ft. reach)", attackBonus: 9, damageDescription: "2d6+5 bludgeoning, and the target makes a DC 15 Constitution save or is diseased (skin transforms to membrane; takes 1d12 acid damage each round outside water)" },
      { name: "Enslave (Recharge 5-6)", description: "One creature the aboleth can see within 30 feet makes a DC 16 Wisdom save or is magically charmed until the aboleth dies or is on a different plane; the aboleth can communicate telepathically with it across any distance." },
    ],
    legendaryActions: [
      { name: "Detect", description: "The aboleth makes a Wisdom (Perception) check." },
      { name: "Tail Swipe (Costs 2 Actions)", description: "The aboleth makes one Tentacle attack." },
      { name: "Psychic Drain (Costs 2 Actions)", description: "One creature charmed by the aboleth takes 3d6 psychic damage, and the aboleth regains hit points equal to the damage dealt." },
    ],
    legendaryActionCount: 3,
  },

  // --- Desert of Desolation ---
  {
    id: "cm-i35-jackalwere-raider",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Desert of Desolation",
    name: "Jackalwere Dune Raider",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "40 ft.",
    challengeRating: 2,
    ac: 13,
    hp: 38,
    maxHp: 38,
    abilityScores: { strength: 12, dexterity: 17, constitution: 12, intelligence: 11, wisdom: 12, charisma: 13 },
    skills: { Deception: 3, Perception: 3, Stealth: 5 },
    damageImmunities: ["poison"],
    conditionImmunities: ["poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["Common (can't speak in jackal form)"],
    traits: [
      { name: "Shapechanger", description: "The jackalwere can use its action to polymorph into a jackal-humanoid hybrid or into a jackal, or back into its true form (a humanoid). Its statistics are the same in each form." },
      { name: "Sleep Gaze", description: "One humanoid within 30 feet that can see the jackalwere's eyes makes a DC 10 Wisdom save or is unconscious for 10 minutes (ends if it takes damage or someone uses an action to shake it awake)." },
    ],
    actions: [
      { name: "Multiattack", description: "The jackalwere makes two attacks: one Bite (hybrid/jackal only) and one Scimitar (humanoid/hybrid only)." },
      { name: "Scimitar", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d6+3 slashing" },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d6+3 piercing" },
    ],
  },
  {
    id: "cm-i35-tomb-mummy",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Desert of Desolation",
    name: "Bound Tomb Mummy of Amun-Re",
    size: "medium",
    type: "undead",
    alignment: "Lawful Evil",
    speed: "20 ft.",
    challengeRating: 3,
    ac: 11,
    acNote: "natural armor",
    hp: 58,
    maxHp: 58,
    abilityScores: { strength: 16, dexterity: 8, constitution: 15, intelligence: 6, wisdom: 10, charisma: 12 },
    damageVulnerabilities: ["fire"],
    damageResistances: ["bludgeoning", "piercing", "slashing"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: ["the languages it knew in life"],
    traits: [
      { name: "Curse Keeper", description: "The mummy cannot leave the pyramid it guards and has advantage on attack rolls against any creature that has taken treasure from the tomb." },
    ],
    actions: [
      { name: "Rotting Fist", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "2d6+3 bludgeoning plus 3d6 necrotic, and the target makes a DC 12 Constitution save or is cursed with mummy rot" },
      { name: "Dreadful Glare", description: "One creature within 60 feet makes a DC 11 Wisdom save or is frightened until the end of the mummy's next turn." },
    ],
  },
  {
    id: "cm-i35-set-priest",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Desert of Desolation",
    name: "High Priest of Set",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 8,
    ac: 16,
    acNote: "breastplate + shield",
    hp: 112,
    maxHp: 112,
    abilityScores: { strength: 12, dexterity: 13, constitution: 16, intelligence: 13, wisdom: 19, charisma: 16 },
    savingThrows: { constitution: 6, wisdom: 8, charisma: 7 },
    skills: { Religion: 5, Deception: 7, Intimidation: 7 },
    damageImmunities: ["poison"],
    conditionImmunities: ["poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "14" },
    languages: ["Common", "Draconic"],
    traits: [
      { name: "Serpent's Blessing", description: "The priest is immune to the poison of snakes, and snakes and yuan-ti within 30 feet of it add 1d6 poison damage to their attacks." },
      { name: "Spellcasting", description: "The priest casts as a 12th-level cleric (save DC 16): poison spray, command, hold person, blindness/deafness, contagion, insect plague, and blade barrier." },
    ],
    actions: [
      { name: "Multiattack", description: "The priest makes two Fanged Scepter attacks." },
      { name: "Fanged Scepter", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d8+1 bludgeoning plus 3d6 poison" },
      { name: "Summon Giant Snakes (1/Day)", description: "The priest summons two giant constrictor snakes that obey its commands for 10 minutes." },
    ],
  },
  {
    id: "cm-i35-amun-re",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Desert of Desolation",
    name: "Amun-Re, the Ghost Pharaoh",
    size: "medium",
    type: "undead",
    alignment: "Lawful Neutral",
    speed: "0 ft., fly 40 ft. (hover)",
    challengeRating: 11,
    ac: 15,
    hp: 168,
    maxHp: 168,
    abilityScores: { strength: 7, dexterity: 16, constitution: 18, intelligence: 17, wisdom: 20, charisma: 21 },
    savingThrows: { constitution: 8, wisdom: 9, charisma: 9 },
    skills: { History: 7, Insight: 9, Perception: 9 },
    damageResistances: ["acid", "cold", "fire", "lightning", "thunder", "bludgeoning", "piercing", "slashing"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "grappled", "paralyzed", "petrified", "poisoned", "prone", "restrained"],
    senses: { darkvision: "60 ft.", "passive Perception": "19" },
    languages: ["Common", "the languages he knew in life"],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If Amun-Re fails a saving throw, he can choose to succeed instead." },
      { name: "Incorporeal Movement", description: "Amun-Re can move through creatures and objects as difficult terrain, taking 1d10 force damage if he ends his turn inside an object." },
      { name: "Bound to the Pyramid", description: "Amun-Re cannot travel more than 300 feet from the sarcophagus at the pyramid's heart. If destroyed, he re-forms there in 24 hours unless the pyramid's curse is lifted." },
    ],
    actions: [
      { name: "Multiattack", description: "Amun-Re uses Withering Wail and makes one Regal Touch attack." },
      { name: "Regal Touch", description: "Melee Spell Attack", attackBonus: 9, damageDescription: "4d8+3 necrotic, and the target ages 1d4 years (reversible with greater restoration)" },
      { name: "Withering Wail (Recharge 5-6)", description: "Each creature within 30 feet makes a DC 17 Constitution save, taking 45 (10d8) necrotic damage and having its speed halved for 1 minute on a failure, or half damage on a success." },
    ],
    legendaryActions: [
      { name: "Regal Touch", description: "Amun-Re makes one Regal Touch attack." },
      { name: "Pharaoh's Command (Costs 2 Actions)", description: "Amun-Re commands the tomb's guardians; one undead within 60 feet can immediately move up to its speed and make one attack as a reaction." },
    ],
    legendaryActionCount: 3,
  },
  {
    id: "cm-i35-martek",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Desert of Desolation",
    name: "Martek, the Millennium-Dead Wizard",
    size: "medium",
    type: "undead",
    alignment: "Lawful Neutral",
    speed: "30 ft., fly 30 ft. (hover)",
    challengeRating: 16,
    ac: 19,
    acNote: "bladeward + robes",
    hp: 210,
    maxHp: 210,
    abilityScores: { strength: 10, dexterity: 16, constitution: 18, intelligence: 24, wisdom: 18, charisma: 18 },
    savingThrows: { constitution: 10, intelligence: 13, wisdom: 10 },
    skills: { Arcana: 19, History: 19 },
    damageResistances: ["cold", "lightning"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "14" },
    languages: ["all", "telepathy 120 ft."],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If Martek fails a saving throw, he can choose to succeed instead." },
      { name: "Time-Locked", description: "Martek has spent a thousand years in stasis awaiting a prophesied hour. He has advantage on initiative rolls and can't be surprised." },
      { name: "Spellcasting", description: "Martek casts as an 18th-level wizard (save DC 21): magic missile, mirror image, counterspell, fireball, banishment, wall of force, chain lightning, disintegrate, prismatic spray, and time stop (1/day)." },
    ],
    actions: [
      { name: "Multiattack", description: "Martek makes two Arcane Blade attacks, or casts a spell and makes one attack." },
      { name: "Arcane Blade", description: "Melee Spell Attack", attackBonus: 13, damageDescription: "3d8+5 force" },
      { name: "Chronal Rebuke (Recharge 5-6)", description: "One creature Martek can see within 60 feet makes a DC 21 Wisdom save, taking 55 (10d10) force damage and losing its next turn on a failure, or half damage on a success." },
    ],
    legendaryActions: [
      { name: "Arcane Blade", description: "Martek makes one Arcane Blade attack." },
      { name: "Blink", description: "Martek teleports up to 60 feet to an unoccupied space he can see." },
      { name: "Cast a Cantrip (Costs 2 Actions)", description: "Martek casts ray of frost (+13 to hit, 4d8 cold)." },
    ],
    legendaryActionCount: 3,
  },

  // --- Savage Tide ---
  {
    id: "cm-st-bullywug-tide-priest",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Savage Tide",
    name: "Bullywug Tide-Priest",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "20 ft., swim 40 ft.",
    challengeRating: 4,
    ac: 14,
    acNote: "natural armor + shield",
    hp: 60,
    maxHp: 60,
    abilityScores: { strength: 13, dexterity: 14, constitution: 13, intelligence: 10, wisdom: 17, charisma: 12 },
    savingThrows: { wisdom: 5 },
    skills: { Religion: 2, Stealth: 4 },
    senses: { darkvision: "30 ft.", "passive Perception": "13" },
    languages: ["Bullywug"],
    traits: [
      { name: "Amphibious", description: "The tide-priest can breathe air and water." },
      { name: "Standing Leap", description: "The tide-priest's long jump is up to 20 feet and its high jump up to 10 feet, with or without a running start." },
      { name: "Spellcasting", description: "The tide-priest casts as a 6th-level druid of the Savage Tide (save DC 13): thorn whip, fog cloud, tidal wave, and conjure animals (crocodiles only)." },
    ],
    actions: [
      { name: "Multiattack", description: "The tide-priest makes one Bite and one Coral Trident attack." },
      { name: "Coral Trident", description: "Melee or Ranged Weapon Attack (20/60 ft.)", attackBonus: 4, damageDescription: "1d6+2 piercing plus 1d6 poison" },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 3, damageDescription: "1d4+1 piercing" },
    ],
  },
  {
    id: "cm-st-pirate-zombie-captain",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Savage Tide",
    name: "Undead Pirate Captain",
    size: "medium",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 5,
    ac: 15,
    acNote: "studded leather",
    hp: 90,
    maxHp: 90,
    abilityScores: { strength: 16, dexterity: 15, constitution: 17, intelligence: 10, wisdom: 12, charisma: 14 },
    savingThrows: { constitution: 5, charisma: 4 },
    skills: { Intimidation: 4, Athletics: 5 },
    damageImmunities: ["poison"],
    conditionImmunities: ["poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: ["Common"],
    traits: [
      { name: "Undead Fortitude", description: "If damage reduces the captain to 0 hit points, it makes a DC 5 + the damage taken Constitution save (unless the damage is radiant or from a critical hit), dropping to 1 hit point on a success." },
      { name: "Rally the Damned", description: "Undead crew within 30 feet of the captain have advantage on attack rolls." },
    ],
    actions: [
      { name: "Multiattack", description: "The captain makes two Rusted Cutlass attacks and one Flintlock attack." },
      { name: "Rusted Cutlass", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d6+3 slashing plus 1d6 necrotic" },
      { name: "Flintlock", description: "Ranged Weapon Attack (30/90 ft.)", attackBonus: 4, damageDescription: "1d10+2 piercing" },
    ],
  },
  {
    id: "cm-st-shami-amourae",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Savage Tide",
    name: "Shami-Amourae, the Lady of Delights",
    size: "medium",
    type: "fiend",
    alignment: "Chaotic Evil",
    speed: "40 ft., fly 60 ft.",
    challengeRating: 20,
    ac: 21,
    acNote: "natural armor",
    hp: 297,
    maxHp: 297,
    abilityScores: { strength: 18, dexterity: 24, constitution: 24, intelligence: 22, wisdom: 21, charisma: 27 },
    savingThrows: { dexterity: 14, constitution: 14, wisdom: 12, charisma: 15 },
    skills: { Deception: 15, Insight: 12, Perception: 12, Persuasion: 15 },
    damageResistances: ["cold", "fire", "lightning"],
    damageImmunities: ["poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "22" },
    languages: ["all", "telepathy 120 ft."],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If Shami-Amourae fails a saving throw, she can choose to succeed instead." },
      { name: "Magic Resistance", description: "Shami-Amourae has advantage on saving throws against spells and other magical effects." },
      { name: "Imprisoned Power", description: "While bound in the Wells of Darkness, Shami-Amourae can't teleport more than 30 feet or leave her cell. Freed, she regains her full planar movement." },
    ],
    actions: [
      { name: "Multiattack", description: "Shami-Amourae makes three Claw attacks, or uses Charm and makes one Claw attack." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 14, damageDescription: "3d6+7 slashing plus 3d6 psychic" },
      { name: "Draining Kiss", description: "One charmed or incapacitated creature within 5 feet takes 6d10 psychic damage, and its hit point maximum is reduced by that amount until it finishes a long rest. Shami-Amourae regains hit points equal to the reduction." },
      { name: "Charm (Recharge 5-6)", description: "One humanoid Shami-Amourae can see within 30 feet makes a DC 23 Wisdom save or is magically charmed for 1 day, obeying her spoken commands." },
    ],
    legendaryActions: [
      { name: "Claw", description: "Shami-Amourae makes one Claw attack." },
      { name: "Teleport", description: "Shami-Amourae teleports up to 60 feet to an unoccupied space she can see." },
      { name: "Whispered Promise (Costs 2 Actions)", description: "One creature within 60 feet makes a DC 23 Charisma save or takes 4d10 psychic damage and has disadvantage on its next saving throw against being charmed." },
    ],
    legendaryActionCount: 3,
  },
  {
    id: "cm-st-demogorgon",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Savage Tide",
    name: "Demogorgon, Prince of Demons",
    size: "gargantuan",
    type: "fiend",
    alignment: "Chaotic Evil",
    speed: "50 ft., swim 50 ft.",
    challengeRating: 26,
    ac: 22,
    acNote: "natural armor",
    hp: 496,
    maxHp: 496,
    abilityScores: { strength: 29, dexterity: 14, constitution: 29, intelligence: 20, wisdom: 17, charisma: 25 },
    savingThrows: { dexterity: 10, constitution: 18, wisdom: 12, charisma: 16 },
    skills: { Insight: 12, Perception: 12 },
    damageResistances: ["cold", "fire", "lightning"],
    damageImmunities: ["poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "22" },
    languages: ["all", "telepathy 120 ft."],
    traits: [
      { name: "Legendary Resistance (3/Day)", description: "If Demogorgon fails a saving throw, he can choose to succeed instead." },
      { name: "Magic Resistance", description: "Demogorgon has advantage on saving throws against spells and other magical effects." },
      { name: "Two Heads", description: "Demogorgon has advantage on saving throws against being blinded, charmed, deafened, frightened, stunned, and knocked unconscious." },
      { name: "Savage Tide", description: "A humanoid reduced to 0 hit points within 60 feet of Demogorgon that isn't killed outright is instead driven into a permanent murderous frenzy (as the confusion spell, no save) until restored by greater restoration." },
    ],
    actions: [
      { name: "Multiattack", description: "Demogorgon makes two Tentacle attacks and uses Gaze from each head." },
      { name: "Tentacle", description: "Melee Weapon Attack (15 ft. reach)", attackBonus: 17, damageDescription: "4d6+9 bludgeoning, and the target makes a DC 24 Constitution save or takes 5d6 poison damage and is stunned until the end of its next turn" },
      { name: "Aameul's Gaze (Beguiling)", description: "One creature within 120 feet makes a DC 24 Charisma save or is charmed for 1 minute." },
      { name: "Hethradiah's Gaze (Hypnotic)", description: "One creature within 120 feet makes a DC 24 Wisdom save or takes 6d10 psychic damage and is incapacitated until the end of its next turn." },
    ],
    legendaryActions: [
      { name: "Tentacle", description: "Demogorgon makes one Tentacle attack." },
      { name: "Gaze (Costs 2 Actions)", description: "Demogorgon uses one of his Gaze options." },
      { name: "Madness (Costs 3 Actions)", description: "Each creature within 30 feet makes a DC 24 Wisdom save or takes 6d6 psychic damage and suffers a short-term madness for 1 minute." },
    ],
    legendaryActionCount: 3,
  },

  // --- Expedition to the Barrier Peaks ---
  {
    id: "cm-s3-vegepygmy-chief",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Expedition to the Barrier Peaks",
    name: "Vegepygmy Chief",
    size: "small",
    type: "plant",
    alignment: "Neutral",
    speed: "30 ft.",
    challengeRating: 2,
    ac: 14,
    acNote: "natural armor",
    hp: 33,
    maxHp: 33,
    abilityScores: { strength: 11, dexterity: 16, constitution: 13, intelligence: 8, wisdom: 12, charisma: 10 },
    skills: { Perception: 3, Stealth: 6 },
    damageVulnerabilities: ["fire"],
    damageResistances: ["lightning", "piercing"],
    conditionImmunities: ["blinded", "deafened"],
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["Vegepygmy"],
    traits: [
      { name: "Plant Camouflage", description: "The chief has advantage on Dexterity (Stealth) checks made to hide in terrain with ample obscuring plant life." },
      { name: "Regeneration", description: "The chief regains 5 hit points at the start of its turn if it has at least 1 hit point and has taken no fire damage since its last turn." },
    ],
    actions: [
      { name: "Multiattack", description: "The chief makes two Claw attacks or two Spear attacks." },
      { name: "Claw", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d6+3 slashing plus 1d4 poison" },
      { name: "Spear", description: "Melee or Ranged Weapon Attack (20/60 ft.)", attackBonus: 5, damageDescription: "1d6+3 piercing" },
    ],
  },
  {
    id: "cm-s3-dining-servo-robot",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Expedition to the Barrier Peaks",
    name: "Dining Servo Robot",
    size: "medium",
    type: "construct",
    alignment: "Unaligned",
    speed: "30 ft.",
    challengeRating: 3,
    ac: 16,
    acNote: "steel casing",
    hp: 52,
    maxHp: 52,
    abilityScores: { strength: 15, dexterity: 13, constitution: 15, intelligence: 6, wisdom: 10, charisma: 5 },
    damageImmunities: ["poison", "psychic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "petrified", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: ["understands Ancient Common but can't speak"],
    traits: [
      { name: "Malfunctioning Service Protocol", description: "The robot insists on serving spoiled, toxic food. A creature that eats what it serves makes a DC 13 Constitution save or takes 3d6 poison damage and is poisoned for 1 hour." },
      { name: "Immutable Form", description: "The robot is immune to any spell or effect that would alter its form." },
    ],
    actions: [
      { name: "Multiattack", description: "The robot makes two Carving Blade attacks." },
      { name: "Carving Blade", description: "Melee Weapon Attack", attackBonus: 5, damageDescription: "1d8+2 slashing" },
      { name: "Scalding Spray", description: "Ranged Weapon Attack (15 ft.)", attackBonus: 4, damageDescription: "2d6 fire" },
    ],
  },
  {
    id: "cm-s3-boxing-robot",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Expedition to the Barrier Peaks",
    name: "Boxing Robot",
    size: "medium",
    type: "construct",
    alignment: "Unaligned",
    speed: "30 ft.",
    challengeRating: 4,
    ac: 15,
    acNote: "padded plating",
    hp: 76,
    maxHp: 76,
    abilityScores: { strength: 18, dexterity: 14, constitution: 16, intelligence: 4, wisdom: 10, charisma: 3 },
    damageResistances: ["bludgeoning"],
    damageImmunities: ["poison", "psychic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "petrified", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: [],
    traits: [
      { name: "Sparring Protocol", description: "The robot targets the nearest moving creature. If two combatants attack each other in its view, it has a 50% chance each turn to attack the other robot instead." },
    ],
    actions: [
      { name: "Multiattack", description: "The robot makes two Piston Jab attacks." },
      { name: "Piston Jab", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "2d6+4 bludgeoning, and the target makes a DC 14 Strength save or is pushed 10 feet" },
      { name: "Haymaker (Recharge 6)", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "4d8+4 bludgeoning, and the target makes a DC 15 Constitution save or is stunned until the end of its next turn" },
    ],
  },
  {
    id: "cm-s3-karate-robot",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Expedition to the Barrier Peaks",
    name: "Karate Robot Master",
    size: "medium",
    type: "construct",
    alignment: "Unaligned",
    speed: "40 ft.",
    challengeRating: 5,
    ac: 17,
    hp: 82,
    maxHp: 82,
    abilityScores: { strength: 16, dexterity: 19, constitution: 15, intelligence: 4, wisdom: 12, charisma: 3 },
    savingThrows: { dexterity: 7 },
    damageImmunities: ["poison", "psychic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "petrified", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: [],
    traits: [
      { name: "Deflect Missiles", description: "The robot can use its reaction to reduce the damage of a ranged weapon attack against it by 1d10 + 4. If this reduces the damage to 0, it can redirect the attack at a creature within 30 feet (+7 to hit)." },
      { name: "Evasion", description: "When the robot is subjected to an effect that allows a Dexterity save for half damage, it instead takes no damage on a success and half on a failure." },
    ],
    actions: [
      { name: "Multiattack", description: "The robot makes three Servo Strike attacks." },
      { name: "Servo Strike", description: "Melee Weapon Attack", attackBonus: 7, damageDescription: "1d10+4 bludgeoning" },
      { name: "Sweeping Kick (Recharge 5-6)", description: "Each creature within 5 feet makes a DC 15 Dexterity save or takes 2d10+4 bludgeoning damage and is knocked prone." },
    ],
  },
  {
    id: "cm-s3-fighter-interceptor-droid",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Expedition to the Barrier Peaks",
    name: "Fighter-Interceptor Droid",
    size: "large",
    type: "construct",
    alignment: "Unaligned",
    speed: "20 ft., fly 60 ft. (hover)",
    challengeRating: 6,
    ac: 18,
    acNote: "armored fuselage",
    hp: 105,
    maxHp: 105,
    abilityScores: { strength: 17, dexterity: 17, constitution: 16, intelligence: 8, wisdom: 12, charisma: 3 },
    savingThrows: { dexterity: 6 },
    damageResistances: ["bludgeoning", "piercing", "slashing"],
    damageImmunities: ["poison", "psychic"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "petrified", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "11" },
    languages: ["understands Ancient Common but can't speak"],
    traits: [
      { name: "Threat Lock", description: "The droid has advantage on attack rolls against a creature it hit on its previous turn." },
      { name: "Immutable Form", description: "The droid is immune to any spell or effect that would alter its form." },
    ],
    actions: [
      { name: "Multiattack", description: "The droid makes two Blaster Cannon attacks." },
      { name: "Blaster Cannon", description: "Ranged Weapon Attack (120 ft.)", attackBonus: 6, damageDescription: "2d10+3 radiant" },
      { name: "Strafing Run (Recharge 5-6)", description: "The droid flies up to its speed in a straight line without provoking opportunity attacks. Each creature in the path makes a DC 15 Dexterity save, taking 33 (6d10) radiant damage on a failure, or half as much on a success." },
    ],
  },
  {
    id: "cm-s3-froghemoth",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Expedition to the Barrier Peaks",
    name: "Froghemoth",
    size: "huge",
    type: "monstrosity",
    alignment: "Unaligned",
    speed: "20 ft., swim 30 ft.",
    challengeRating: 10,
    ac: 15,
    acNote: "natural armor",
    hp: 184,
    maxHp: 184,
    abilityScores: { strength: 23, dexterity: 13, constitution: 20, intelligence: 3, wisdom: 10, charisma: 6 },
    savingThrows: { constitution: 9 },
    skills: { Perception: 4, Stealth: 5 },
    damageResistances: ["fire"],
    damageVulnerabilities: ["lightning"],
    conditionImmunities: ["prone"],
    senses: { darkvision: "120 ft.", "passive Perception": "14" },
    languages: [],
    traits: [
      { name: "Amphibious", description: "The froghemoth can breathe air and water." },
      { name: "Shock Susceptibility", description: "If the froghemoth takes lightning damage, it has disadvantage on attack rolls and ability checks until the end of its next turn, and its speed is halved." },
    ],
    actions: [
      { name: "Multiattack", description: "The froghemoth makes one Tentacle attack, uses Tongue, and makes one Bite attack." },
      { name: "Tentacle", description: "Melee Weapon Attack (20 ft. reach)", attackBonus: 10, damageDescription: "3d6+6 bludgeoning, and the target is grappled (escape DC 16)" },
      { name: "Tongue", description: "Melee Weapon Attack (20 ft. reach)", attackBonus: 10, damageDescription: "the target is grappled (escape DC 16) and pulled up to 20 feet toward the froghemoth" },
      { name: "Bite", description: "Melee Weapon Attack", attackBonus: 10, damageDescription: "4d8+6 piercing; a Medium or smaller grappled creature is swallowed (blinded, restrained, 3d6 acid at the start of each of its turns)" },
    ],
  },

];

/**
 * Look up a custom monster by id. Returns `undefined` if not found.
 * Used by `seedCampaignTemplates.ts` to embed monster stat blocks into
 * campaign encounters when constructing `EncounterTemplate.monsters`.
 */
export function findCustomMonsterById(id: string): Omit<MonsterTemplate, 'createdAt' | 'updatedAt'> | undefined {
  return CUSTOM_MONSTERS.find((m) => m.id === id);
}

/**
 * Like `findCustomMonsterById`, but throws immediately if the id is unknown so a
 * mistyped or renamed `cm-` reference in a campaign encounter helper fails fast
 * (at module load / `npm run test:unit`) instead of silently producing a thinner
 * encounter.
 */
export function requireCustomMonsterById(id: string): Omit<MonsterTemplate, 'createdAt' | 'updatedAt'> {
  const template = findCustomMonsterById(id);
  if (!template) {
    throw new Error(`requireCustomMonsterById: unknown custom monster id "${id}"`);
  }
  return template;
}

/**
 * Convert a custom `MonsterTemplate`-shaped object into an `Encounter` monster
 * instance. Strips template-only fields (`isGlobal`, `userId` made optional,
 * `source`) and assigns a fresh per-instance `id` so multiple instances of the
 * same stat block in one encounter get distinct `id`s (independent HP, etc.).
 *
 * Accepts an optional `instanceId` for callers that need a deterministic id
 * (e.g. tests). When omitted a fresh UUID is generated.
 *
 * Returns `undefined` when the template itself is undefined, so callers can
 * chain through optional lookups: `toEncounterMonster(findCustomMonsterById(id))`.
 */
export function toEncounterMonster(
  template: Omit<MonsterTemplate, 'createdAt' | 'updatedAt'> | undefined,
  instanceId: string = randomUUID()
): Monster | undefined {
  if (!template) return undefined;
  const {
    isGlobal: _isGlobal,
    userId: _userId,
    source: _source,
    legendaryActionCount: _legendaryActionCount,
    ...rest
  } = template;
  return {
    ...rest,
    _id: undefined,
    id: instanceId,
    hp: rest.maxHp,
    templateId: template.id,
  };
}

/**
 * Build N encounter-ready monster instances from a single template stat block.
 * Each instance has a unique `id` and full HP. Useful for encounters like
 * "Deathwolf Vanguard" where several identical monsters appear together.
 * Returns an empty array when the template is undefined.
 */
export function toEncounterMonsters(
  template: Omit<MonsterTemplate, 'createdAt' | 'updatedAt'> | undefined,
  count: number
): Monster[] {
  if (!template) return [];
  return Array.from({ length: count }, () => toEncounterMonster(template)!);
}

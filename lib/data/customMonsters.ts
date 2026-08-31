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
      passivePerception: "13"
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
    id: "cm-relentless-impaler",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Vecna: Eve of Ruin - Chapter 5: Death House",
    name: "Relentless Impaler",
    size: "large",
    type: "fiend",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 15,
    experiencePoints: 11500,
    ac: 16,
    acNote: "natural armor",
    hp: 184,
    maxHp: 184,
    abilityScores: {
      strength: 23,
      dexterity: 16,
      constitution: 22,
      intelligence: 12,
      wisdom: 15,
      charisma: 18
    },
    savingThrows: {
      strength: 11,
      dexterity: 8,
      charisma: 9
    },
    skills: {
      Athletics: 11,
      Perception: 7,
      Survival: 7
    },
    conditionImmunities: [
      "charmed",
      "exhaustion",
      "frightened"
    ],
    senses: {
      darkvision: "120 ft.",
      passivePerception: "17"
    },
    languages: ["understands all languages but can't speak"],
    traits: [
      {
        name: "Bloodheart Stake",
        description: "Magically bound to ceremonial stake & corpse. If reduced to 0 HP, disappears and re-forms 1d8 hours later near the stake at full HP. Dies permanently only if reduced to 0 HP while stake is removed from corpse or impaler is on a different plane."
      },
      {
        name: "Legendary Resistance (3/Day)",
        description: "If the impaler fails a saving throw, it can choose to succeed instead."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The impaler makes one Spike attack and two Wicked Spear attacks."
      },
      {
        name: "Spike",
        description: "Melee Weapon Attack: +11 to hit, reach 5 ft., one target. Hit: 15 (2d8 + 6) piercing damage. The target's speed is halved until the start of the impaler's next turn.",
        attackBonus: 11,
        damageDescription: "15 (2d8 + 6) piercing damage"
      },
      {
        name: "Wicked Spear",
        description: "Melee or Ranged Weapon Attack: +11 to hit, reach 10 ft. or range 20/40 ft., one target. Hit: 13 (2d6 + 6) piercing damage plus 13 (3d8) necrotic damage.",
        attackBonus: 11,
        damageDescription: "13 (2d6 + 6) piercing + 13 (3d8) necrotic"
      },
      {
        name: "Spike Burst",
        recharge: "Recharge 5-6",
        description: "Twisted spectral spikes shoot out. Each creature within 30 feet must make a DC 19 Dexterity saving throw, taking 40 (9d8) force damage on a failed save or half as much on a successful one."
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Speed Spike",
        cost: 1,
        description: "The impaler teleports up to 30 feet to an unoccupied space it can see, then makes a Spike attack."
      },
      {
        name: "Deepen Wounds",
        cost: 2,
        description: "Each creature whose speed is currently reduced by the impaler's Spike attack takes 18 (4d8) necrotic damage."
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
      passivePerception: "13"
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
      passivePerception: "7"
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
      passivePerception: "22"
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
      passivePerception: "12"
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
      passivePerception: "14"
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
  }
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

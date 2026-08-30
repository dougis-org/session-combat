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

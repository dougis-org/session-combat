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
  },
  // ===== G3 — Planar & Crossover Campaigns =====
  // --- Icewind Dale: Rime of the Frostmaiden ---
  {
    id: "cm-coldlight-walker",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Icewind Dale: Rime of the Frostmaiden",
    name: "Coldlight Walker",
    description: "An undead wanderer frozen in Auril's everlasting rime, drifting the blizzards of Icewind Dale.",
    size: "medium",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "40 ft., fly 40 ft. (hover)",
    challengeRating: 5,
    experiencePoints: 1800,
    ac: 13,
    hp: 67,
    maxHp: 67,
    abilityScores: {
      strength: 6,
      dexterity: 16,
      constitution: 16,
      intelligence: 11,
      wisdom: 12,
      charisma: 15
    },
    savingThrows: { dexterity: 6 },
    damageResistances: ["acid", "cold", "fire", "lightning", "thunder"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: [
      "charmed",
      "exhaustion",
      "frightened",
      "grappled",
      "paralyzed",
      "poisoned",
      "prone",
      "restrained"
    ],
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: ["Common", "Sylvan"],
    traits: [
      {
        name: "Cold Aura",
        description: "At the start of each of the walker's turns, each creature within 5 feet of it takes 5 (1d10) cold damage, and any creature in that area can't restore hit points until the start of the walker's next turn. Creatures with resistance or immunity to cold damage are unaffected by this aura and any failed saving throw against it."
      },
      {
        name: "Incorporeal Movement",
        description: "The walker can move through other creatures and objects as if they were difficult terrain. It takes 5 (1d10) force damage if it ends its turn inside an object."
      },
      {
        name: "Sunlight Sensitivity",
        description: "While in sunlight, the walker has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
      }
    ],
    actions: [
      {
        name: "Frosty Touch",
        description: "Melee Spell Attack: +6 to hit, reach 5 ft., one target. Hit: 12 (3d6 + 3) cold damage.",
        attackBonus: 6,
        damageDescription: "12 (3d6 + 3) cold"
      },
      {
        name: "Chilling Wail",
        recharge: "Recharge 4-6",
        description: "The walker emits a mournful wail. Each creature within 30 feet that can hear the wail must succeed on a DC 13 Wisdom saving throw or be frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns."
      }
    ]
  },
  {
    id: "cm-chardalyn-dragon",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Icewind Dale: Rime of the Frostmaiden",
    name: "Chardalyn Dragon",
    description: "A massive construct of corrupted chardalyn crystal built by Xardorok Sunblight to sack Ten-Towns.",
    size: "huge",
    type: "construct",
    alignment: "Unaligned",
    speed: "40 ft., fly 80 ft.",
    challengeRating: 14,
    experiencePoints: 11500,
    ac: 19,
    acNote: "natural armor",
    hp: 256,
    maxHp: 256,
    abilityScores: {
      strength: 23,
      dexterity: 10,
      constitution: 22,
      intelligence: 6,
      wisdom: 10,
      charisma: 5
    },
    savingThrows: { dexterity: 5, constitution: 9 },
    damageImmunities: ["poison", "psychic"],
    damageVulnerabilities: ["radiant"],
    conditionImmunities: [
      "blinded",
      "charmed",
      "deafened",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned"
    ],
    senses: { blindsight: "60 ft.", "passive Perception": "10" },
    languages: ["understands Dwarvish but can't speak"],
    traits: [
      {
        name: "Chardalyn Hardened",
        description: "The dragon has advantage on saving throws against spells and other magical effects, and it is immune to bludgeoning, piercing, and slashing damage from nonmagical attacks."
      },
      {
        name: "False Appearance",
        description: "While the dragon remains motionless and isn't flying, it is indistinguishable from an ordinary vein of chardalyn."
      },
      {
        name: "Siege Monster",
        description: "The dragon deals double damage to objects and structures."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The dragon makes two attacks: one with its bite and one with its tail. It can use its Breath Weapon in place of one of these attacks."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack: +11 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage plus 7 (2d6) force damage (corrupting the wound).",
        attackBonus: 11,
        damageDescription: "17 (2d10 + 6) piercing + 7 (2d6) force"
      },
      {
        name: "Tail",
        description: "Melee Weapon Attack: +11 to hit, reach 15 ft., one target. Hit: 15 (2d8 + 6) bludgeoning damage.",
        attackBonus: 11,
        damageDescription: "15 (2d8 + 6) bludgeoning"
      },
      {
        name: "Chardalyn Breath",
        recharge: "Recharge 5-6",
        description: "The dragon exhales a 60-foot cone of corruptive crystal shards. Each creature in that area must make a DC 18 Dexterity saving throw, taking 56 (16d6) slashing damage on a failed save, or half as much damage on a successful one."
      }
    ]
  },
  {
    id: "cm-aunaut-aurilblight",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Icewind Dale: Rime of the Frostmaiden",
    name: "Aunaut Aurilblight",
    description: "The frost giant priest-king of Ythryn, surviving the Netherese city's fall through Auril's grace.",
    size: "large",
    type: "giant",
    alignment: "Neutral Evil",
    speed: "40 ft.",
    challengeRating: 11,
    experiencePoints: 7200,
    ac: 17,
    acNote: "natural armor",
    hp: 180,
    maxHp: 180,
    abilityScores: {
      strength: 23,
      dexterity: 10,
      constitution: 20,
      intelligence: 12,
      wisdom: 18,
      charisma: 14
    },
    savingThrows: { strength: 10, constitution: 9, wisdom: 8 },
    skills: { Athletics: 10, Perception: 8, Religion: 5 },
    damageResistances: ["cold"],
    damageImmunities: ["fire"],
    senses: { "passive Perception": "18" },
    languages: ["Common", "Dwarvish", "Giant"],
    traits: [
      {
        name: "Frost Aura",
        description: "Creatures within 10 feet of Aunaut Aurilblight at the start of its turn take 7 (2d6) cold damage. Creatures that are immune to cold damage are unaffected."
      },
      {
        name: "Spellcasting",
        description: "Aunaut is a 9th-level spellcaster (Wisdom-based, spell save DC 16, +8 to hit with spell attacks).\nCantrips (at will): guidance, sacred flame\n1st level (4 slots): cure wounds, detect magic, shield of faith\n2nd level (3 slots): hold person, spiritual weapon (greatspear)\n3rd level (3 slots): dispel magic, spirit guardians\n4th level (3 slots): ice storm, wall of fire\n5th level (1 slot): cone of cold"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Aunaut makes two greatsword attacks."
      },
      {
        name: "Greatsword",
        description: "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 21 (3d6 + 10) slashing damage plus 7 (2d6) cold damage.",
        attackBonus: 10,
        damageDescription: "21 (3d6 + 10) slashing + 7 (2d6) cold"
      },
      {
        name: "Frostwave",
        recharge: "Recharge 5-6",
        description: "Aunaut drives his greatsword into the ground, releasing a 30-foot-radius burst of cold. Each creature in that area must make a DC 16 Constitution saving throw, taking 28 (8d6) cold damage on a failed save, or half as much on a successful one. The ground in the area becomes difficult terrain until the end of Aunaut's next turn."
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Frost Step",
        cost: 1,
        description: "Aunaut teleports up to 60 feet to an unoccupied space he can see."
      },
      {
        name: "Rime's Blessing",
        cost: 1,
        description: "Aunaut regains 14 (2d12 + 1) hit points."
      },
      {
        name: "Greatsword",
        cost: 2,
        description: "Aunaut makes one greatsword attack."
      }
    ]
  },
  {
    id: "cm-iriolarthas",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Icewind Dale: Rime of the Frostmaiden",
    name: "Iriolarthas, the Netherese Necromancer",
    description: "A lich from the fallen Netherese city of Ythryn, holding the mythallar's power in check.",
    size: "medium",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 12,
    experiencePoints: 8400,
    ac: 17,
    acNote: "Mage Armor",
    hp: 135,
    maxHp: 135,
    abilityScores: {
      strength: 11,
      dexterity: 16,
      constitution: 16,
      intelligence: 20,
      wisdom: 14,
      charisma: 16
    },
    savingThrows: { intelligence: 9, wisdom: 6 },
    skills: { Arcana: 13, History: 13, Perception: 6 },
    damageResistances: ["cold", "lightning", "necrotic"],
    damageImmunities: ["poison", "psychic"],
    conditionImmunities: [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "poisoned"
    ],
    senses: { truesight: "60 ft.", "passive Perception": "16" },
    languages: ["Common", "Draconic", "Dwarvish", "Elvish", "Netherese"],
    traits: [
      {
        name: "Legendary Resistance",
        description: "If Iriolarthas fails a saving throw, he can choose to succeed instead (3/day)."
      },
      {
        name: "Mythallar Channeling",
        description: "While in Ythryn, Iriolarthas can cast spells of 6th level or lower without expending spell slots, once per turn. Spells cast this way ignore the need for material components."
      },
      {
        name: "Rejuvenation",
        description: "When Iriolarthas is destroyed, his spirit reforms in his phylactery in 1d10 days. If the phylactery is destroyed, he is destroyed permanently."
      },
      {
        name: "Spellcasting",
        description: "Iriolarthas is a 17th-level spellcaster (Intelligence-based, spell save DC 17, +9 to hit with spell attacks).\nCantrips (at will): fire bolt, mage hand, prestidigitation, ray of frost\n1st level (4 slots): detect magic, mage armor, magic missile, shield\n2nd level (3 slots): detect thoughts, misty step, suggestion\n3rd level (3 slots): animate dead, counterspell, fireball\n4th level (3 slots): blight, ice storm, polymorph\n5th level (3 slots): cloudkill, cone of cold, dominate person\n6th level (2 slots): disintegrate, globe of invulnerability\n7th level (2 slots): finger of death, teleport\n8th level (1 slot): mind blank, power word stun"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Iriolarthas makes two spells attacks or two Bone Staff attacks."
      },
      {
        name: "Bone Staff",
        description: "Melee Weapon Attack: +9 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) bludgeoning damage plus 21 (6d6) necrotic damage. The target must succeed on a DC 17 Constitution saving throw or have its hit point maximum reduced by an amount equal to the necrotic damage taken.",
        attackBonus: 9,
        damageDescription: "8 (1d8 + 4) bludgeoning + 21 (6d6) necrotic"
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Cantrip",
        cost: 1,
        description: "Iriolarthas casts a cantrip."
      },
      {
        name: "Phylacteric Surge",
        cost: 2,
        description: "Iriolarthas regains 14 (2d8 + 6) hit points and ends one condition currently affecting him."
      },
      {
        name: "Spell",
        cost: 3,
        description: "Iriolarthas casts a spell of 4th level or lower that doesn't require a material component, using an available spell slot of that level."
      }
    ]
  },
  {
    id: "cm-leviathan",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Icewind Dale: Rime of the Frostmaiden",
    name: "Leviathan (Netherese)",
    description: "An apocalyptic sea-monster of Torilian legend, slumbering beneath the Sea of Moving Ice.",
    size: "gargantuan",
    type: "monstrosity",
    alignment: "Chaotic Evil",
    speed: "20 ft., swim 80 ft.",
    challengeRating: 20,
    experiencePoints: 25000,
    ac: 20,
    acNote: "natural armor",
    hp: 481,
    maxHp: 481,
    abilityScores: {
      strength: 27,
      dexterity: 9,
      constitution: 25,
      intelligence: 5,
      wisdom: 12,
      charisma: 8
    },
    savingThrows: { strength: 14, constitution: 12, wisdom: 6 },
    skills: { Perception: 6 },
    damageResistances: ["bludgeoning", "piercing", "slashing"],
    damageImmunities: ["cold", "fire"],
    conditionImmunities: [
      "charmed",
      "frightened",
      "paralyzed",
      "poisoned"
    ],
    senses: { truesight: "60 ft.", "passive Perception": "16" },
    languages: ["understands Abyssal but can't speak"],
    traits: [
      {
        name: "Amphibious",
        description: "The leviathan can breathe air and water."
      },
      {
        name: "Blessing of the Abyss",
        description: "The leviathan has advantage on saving throws against spells and other magical effects."
      },
      {
        name: "Massive Wake",
        description: "When the leviathan moves through water, it leaves a 30-foot-wide path of rough water behind it until the start of its next turn. Each creature in that area when the path is created must succeed on a DC 20 Strength saving throw or be knocked prone."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The leviathan makes three attacks: one with its bite and two with its tentacles. It can use Devour in place of one tentacle attack."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack: +14 to hit, reach 15 ft., one target. Hit: 33 (4d10 + 9) piercing damage.",
        attackBonus: 14,
        damageDescription: "33 (4d10 + 9) piercing"
      },
      {
        name: "Tentacle",
        description: "Melee Weapon Attack: +14 to hit, reach 30 ft., one target. Hit: 20 (3d6 + 9) bludgeoning damage, and the target is grappled (escape DC 22). Until this grapple ends, the target is restrained and takes 13 (2d8 + 4) bludgeoning damage at the start of each of its turns.",
        attackBonus: 14,
        damageDescription: "20 (3d6 + 9) bludgeoning + grapple"
      },
      {
        name: "Devour",
        description: "The leviathan moves one creature grappled by it into its mouth and bites the creature, dealing 33 (4d10 + 9) piercing damage. If this kills the creature, the leviathan regains 30 hit points."
      },
      {
        name: "Tsunami",
        recharge: "Recharge 5-6",
        description: "The leviathan summons a wall of seawater 60 feet long, 30 feet high, and 10 feet thick centered on a point it can see within 120 feet. Each creature in the wall's area must make a DC 20 Strength saving throw, taking 35 (10d6) bludgeoning damage on a failed save, or half on a success. The wall lasts until the start of the leviathan's next turn, then collapses."
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Move",
        cost: 1,
        description: "The leviathan moves up to half its swim speed without provoking opportunity attacks."
      },
      {
        name: "Tentacle",
        cost: 2,
        description: "The leviathan makes one tentacle attack."
      },
      {
        name: "Roiling Wake",
        cost: 2,
        description: "The leviathan creates a 30-foot-radius area of rough water centered on a point it can see within 120 feet. Each creature in that area must succeed on a DC 20 Strength saving throw or be knocked prone."
      }
    ]
  },
  // --- The Wild Beyond the Witchlight ---
  {
    id: "cm-harengon-brigand",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Wild Beyond the Witchlight",
    name: "Harengon Brigand (Agdon Longscarf)",
    description: "A self-proclaimed rabbit-folk pirate king demanding tolls at the Witchlight Carnival gates.",
    size: "small",
    type: "humanoid",
    alignment: "Chaotic Neutral",
    speed: "40 ft.",
    challengeRating: 2,
    experiencePoints: 450,
    ac: 13,
    acNote: "leather armor",
    hp: 38,
    maxHp: 38,
    abilityScores: {
      strength: 12,
      dexterity: 16,
      constitution: 12,
      intelligence: 11,
      wisdom: 13,
      charisma: 14
    },
    savingThrows: { dexterity: 5 },
    skills: { Acrobatics: 5, Deception: 4, Perception: 3 },
    senses: { "passive Perception": "13" },
    languages: ["Common", "Sylvan"],
    traits: [
      {
        name: "Bunny Hop",
        description: "As a bonus action, Agdon can jump up to 15 feet horizontally and 5 feet vertically without provoking opportunity attacks."
      },
      {
        name: "Hare-Triggered",
        description: "Agdon has advantage on initiative rolls."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Agdon makes two attacks: one with his rapier and one with his dagger. He can also use his longscarf in place of either attack."
      },
      {
        name: "Rapier",
        description: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) piercing damage.",
        attackBonus: 5,
        damageDescription: "7 (1d8 + 3) piercing"
      },
      {
        name: "Dagger",
        description: "Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 20/60, one target. Hit: 5 (1d4 + 3) piercing damage.",
        attackBonus: 5,
        damageDescription: "5 (1d4 + 3) piercing"
      },
      {
        name: "Longscarf",
        description: "Ranged Weapon Attack: +5 to hit, range 30/120, one target. Hit: 7 (2d4 + 2) bludgeoning damage, and the target is grappled (escape DC 12). Agdon can pull a grappled creature up to 30 feet toward him as a bonus action.",
        attackBonus: 5,
        damageDescription: "7 (2d4 + 2) bludgeoning + grapple"
      }
    ]
  },
  {
    id: "cm-harengon",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Wild Beyond the Witchlight",
    name: "Harengon",
    description: "A rabbit-folk commoner of the Feywild, fleet-footed and good-natured.",
    size: "small",
    type: "humanoid",
    alignment: "Chaotic Good",
    speed: "40 ft.",
    challengeRating: 0.125,
    ac: 10,
    hp: 5,
    maxHp: 5,
    abilityScores: {
      strength: 8,
      dexterity: 14,
      constitution: 11,
      intelligence: 10,
      wisdom: 12,
      charisma: 11
    },
    skills: { Perception: 3 },
    senses: { "passive Perception": "13" },
    languages: ["Common", "Sylvan"],
    traits: [
      {
        name: "Rabbit Hop",
        description: "The harengon can jump up to 15 feet horizontally and 5 feet vertically as a bonus action, without provoking opportunity attacks."
      }
    ],
    actions: [
      {
        name: "Sling",
        description: "Ranged Weapon Attack: +4 to hit, range 30/120, one target. Hit: 4 (1d4 + 2) bludgeoning damage.",
        attackBonus: 4,
        damageDescription: "4 (1d4 + 2) bludgeoning"
      }
    ]
  },
  {
    id: "cm-animated-toy",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Wild Beyond the Witchlight",
    name: "Animated Toy",
    description: "A porcelain doll or wooden toy brought to murderous life by Skabatha Nightshade's magic.",
    size: "small",
    type: "construct",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 1,
    experiencePoints: 200,
    ac: 13,
    acNote: "natural armor",
    hp: 22,
    maxHp: 22,
    abilityScores: {
      strength: 14,
      dexterity: 10,
      constitution: 12,
      intelligence: 3,
      wisdom: 10,
      charisma: 4
    },
    damageImmunities: ["poison", "psychic"],
    conditionImmunities: [
      "blinded",
      "charmed",
      "deafened",
      "frightened",
      "paralyzed",
      "petrified",
      "poisoned"
    ],
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: ["understands the languages of its creator but can't speak"],
    traits: [
      {
        name: "False Appearance",
        description: "While motionless, the toy is indistinguishable from an ordinary, inanimate object."
      },
      {
        name: "Unusual Nature",
        description: "The toy doesn't require air, food, drink, or sleep."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The toy makes two attacks."
      },
      {
        name: "Hammer",
        description: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) bludgeoning damage. If the target is a Medium or smaller creature, it must succeed on a DC 12 Strength saving throw or be knocked prone.",
        attackBonus: 4,
        damageDescription: "7 (1d8 + 3) bludgeoning"
      }
    ]
  },
  {
    id: "cm-jabberwock",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Wild Beyond the Witchlight",
    name: "Jabberwock",
    description: "A burbling, fearsome dragon-like fey terrorizing the hearts of children in Yon.",
    size: "huge",
    type: "dragon",
    alignment: "Chaotic Evil",
    speed: "40 ft., fly 80 ft.",
    challengeRating: 13,
    experiencePoints: 10000,
    ac: 18,
    acNote: "natural armor",
    hp: 200,
    maxHp: 200,
    abilityScores: {
      strength: 22,
      dexterity: 12,
      constitution: 21,
      intelligence: 6,
      wisdom: 13,
      charisma: 10
    },
    savingThrows: { dexterity: 5, wisdom: 5 },
    skills: { Perception: 5 },
    damageImmunities: ["thunder"],
    senses: { blindsight: "30 ft.", darkvision: "120 ft.", "passive Perception": "15" },
    languages: ["understands Sylvan but can't speak"],
    traits: [
      {
        name: "Vorpal Bite",
        description: "When the jabberwock scores a critical hit with its bite, the target must succeed on a DC 17 Constitution saving throw or lose a body part (subject to DM discretion) and be stunned until the end of its next turn."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The jabberwock makes two attacks: one with its bite and one with its claws."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 21 (3d8 + 6) piercing damage plus 7 (2d6) thunder damage.",
        attackBonus: 10,
        damageDescription: "21 (3d8 + 6) piercing + 7 (2d6) thunder"
      },
      {
        name: "Claws",
        description: "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 14 (2d8 + 6) slashing damage.",
        attackBonus: 10,
        damageDescription: "14 (2d8 + 6) slashing"
      },
      {
        name: "Jabber Breath",
        recharge: "Recharge 5-6",
        description: "The jabberwock exhales a 60-foot cone of crackling thunder. Each creature in that area must make a DC 17 Dexterity saving throw, taking 49 (11d8) thunder damage on a failed save, or half as much damage on a successful one."
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Skewer",
        cost: 2,
        description: "The jabberwock moves up to its speed in a straight line and can make one bite attack against any creature in that line. On a hit, the target is grappled (escape DC 17)."
      },
      {
        name: "Burble",
        cost: 1,
        description: "Each creature within 30 feet that can hear the jabberwock must succeed on a DC 15 Wisdom saving throw or be frightened until the end of its next turn."
      }
    ]
  },
  {
    id: "cm-tasha-other-self",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Wild Beyond the Witchlight",
    name: "Tasha's Other Self",
    description: "Thearch Tasha/Iggwilv in her final-act archfey-lich form, ruling the Palace of Heart's Desire.",
    size: "medium",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "30 ft., fly 60 ft. (hover)",
    challengeRating: 15,
    experiencePoints: 13000,
    ac: 19,
    acNote: "natural armor",
    hp: 230,
    maxHp: 230,
    abilityScores: {
      strength: 12,
      dexterity: 18,
      constitution: 18,
      intelligence: 22,
      wisdom: 18,
      charisma: 20
    },
    savingThrows: { dexterity: 9, constitution: 9, wisdom: 9, charisma: 10 },
    skills: { Arcana: 16, Deception: 10, Persuasion: 10, Perception: 9 },
    damageResistances: ["cold", "fire", "lightning"],
    damageImmunities: ["necrotic", "poison", "psychic"],
    conditionImmunities: [
      "charmed",
      "exhaustion",
      "frightened",
      "paralyzed",
      "poisoned"
    ],
    senses: { truesight: "60 ft.", "passive Perception": "19" },
    languages: ["all"],
    traits: [
      {
        name: "Legendary Resistance",
        description: "If Tasha fails a saving throw, she can choose to succeed instead (3/day)."
      },
      {
        name: "Lair Actions",
        description: "While in the Palace of Heart's Desire, Tasha can use lair actions. On initiative count 20 (losing initiative ties), she can take one of the following: cause all nonmagical flames within the palace to extinguish; teleport any creature within the palace to another room (DC 19 Wisdom save); or conjure an illusory duplicate of any creature she's observed (no mechanical effect)."
      },
      {
        name: "Spellcasting",
        description: "Tasha is an 18th-level spellcaster (Intelligence-based, spell save DC 20, +11 to hit with spell attacks).\nCantrips (at will): eldritch blast, mage hand, minor illusion, prestidigitation\n1st level (4 slots): detect magic, magic missile, shield, Tasha's hideous laughter\n2nd level (3 slots): detect thoughts, mirror image, misty step\n3rd level (3 slots): counterspell, fireball, lightning bolt\n4th level (3 slots): banishment, polymorph\n5th level (3 slots): cone of cold, hold monster\n6th level (2 slots): disintegrate, globe of invulnerability\n7th level (2 slots): finger of death, teleport\n8th level (1 slot): power word stun\n9th level (1 slot): prismatic wall"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Tasha makes two spell attacks or casts two spells."
      },
      {
        name: "Staff of the Magi",
        description: "Melee Weapon Attack: +11 to hit, reach 5 ft., one target. Hit: 8 (1d6 + 4) bludgeoning damage plus 28 (8d6) force damage. The target must succeed on a DC 19 Constitution saving throw or have its hit point maximum reduced by an amount equal to the force damage.",
        attackBonus: 11,
        damageDescription: "8 (1d6 + 4) bludgeoning + 28 (8d6) force"
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Cantrip",
        cost: 1,
        description: "Tasha casts eldritch blast."
      },
      {
        name: "Vanish",
        cost: 2,
        description: "Tasha casts greater invisibility on herself."
      },
      {
        name: "Wished-for Ruin",
        cost: 2,
        description: "Tasha makes one Staff of the Magi attack."
      }
    ]
  },
  {
    id: "cm-sword-wraith-commander",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "The Wild Beyond the Witchlight",
    name: "Sword Wraith Commander",
    description: "A once-heroic knight twisted by Zybilna's mirror magic, leading palace guards in the final battle.",
    size: "medium",
    type: "undead",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 8,
    experiencePoints: 3900,
    ac: 16,
    acNote: "chain shirt",
    hp: 117,
    maxHp: 117,
    abilityScores: {
      strength: 18,
      dexterity: 14,
      constitution: 16,
      intelligence: 10,
      wisdom: 14,
      charisma: 16
    },
    savingThrows: { wisdom: 5, charisma: 6 },
    damageResistances: ["bludgeoning", "piercing", "slashing"],
    damageImmunities: ["necrotic"],
    conditionImmunities: ["exhaustion", "frightened", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["Common", "Elvish"],
    traits: [
      {
        name: "Incorporeal Movement",
        description: "The wraith can move through other creatures and objects as if they were difficult terrain. It takes 5 (1d10) force damage if it ends its turn inside an object."
      },
      {
        name: "Martial Command",
        description: "Undead allies within 30 feet of the wraith commander add 2 to attack rolls and deal an extra 5 (1d10) damage on hits."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The commander makes two Long Sword attacks."
      },
      {
        name: "Long Sword",
        description: "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) slashing damage plus 18 (4d8) necrotic damage. The target's hit point maximum is reduced by an amount equal to the necrotic damage taken.",
        attackBonus: 7,
        damageDescription: "8 (1d8 + 4) slashing + 18 (4d8) necrotic"
      },
      {
        name: "Create Specter",
        description: "The wraith targets a humanoid corpse within 10 feet. The corpse rises as a specter under the wraith's control. The specter remains until destroyed."
      }
    ]
  },
  // --- Princes of the Apocalypse ---
  {
    id: "cm-black-earth-cultist",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Princes of the Apocalypse",
    name: "Black Earth Cultist",
    description: "An earth cultist in stone robes, devoted to Marlos Urnrayle and the Elder Elemental Eye.",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 2,
    experiencePoints: 450,
    ac: 13,
    acNote: "leather armor",
    hp: 38,
    maxHp: 38,
    abilityScores: {
      strength: 13,
      dexterity: 14,
      constitution: 12,
      intelligence: 10,
      wisdom: 14,
      charisma: 11
    },
    savingThrows: { wisdom: 4 },
    skills: { Religion: 2, Stealth: 4 },
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["Common", "Dwarvish"],
    traits: [
      {
        name: "Earthen Resilience",
        description: "The cultist has resistance to nonmagical bludgeoning damage while standing on natural stone or earth."
      },
      {
        name: "Spellcasting",
        description: "Black Earth Cultist is a 1st-level spellcaster (Wisdom-based, spell save DC 12, +4 to hit).\nCantrips (at will): guidance, sacred flame\n1st level (2 slots): cure wounds, shield of faith"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The cultist makes two melee attacks."
      },
      {
        name: "War Pick",
        description: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) piercing damage.",
        attackBonus: 4,
        damageDescription: "6 (1d8 + 2) piercing"
      },
      {
        name: "Stone Shard",
        description: "Ranged Spell Attack: +4 to hit, range 60 ft., one target. Hit: 7 (2d6) bludgeoning damage.",
        attackBonus: 4,
        damageDescription: "7 (2d6) bludgeoning"
      }
    ]
  },
  {
    id: "cm-earth-elemental-myrmidon",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Princes of the Apocalypse",
    name: "Earth Elemental Myrmidon",
    description: "An elite earth elemental soldier, bound into humanoid form to serve the Black Earth cult.",
    size: "large",
    type: "elemental",
    alignment: "Neutral",
    speed: "40 ft., burrow 30 ft.",
    challengeRating: 7,
    experiencePoints: 2900,
    ac: 17,
    acNote: "natural armor",
    hp: 119,
    maxHp: 119,
    abilityScores: {
      strength: 19,
      dexterity: 8,
      constitution: 17,
      intelligence: 8,
      wisdom: 11,
      charisma: 11
    },
    savingThrows: { strength: 7, constitution: 6 },
    skills: { Athletics: 7, Perception: 3 },
    damageResistances: ["acid", "fire", "thunder"],
    damageImmunities: ["poison"],
    conditionImmunities: ["exhaustion", "paralyzed", "petrified", "poisoned", "prone", "unconscious"],
    senses: { darkvision: "60 ft.", tremorsense: "60 ft.", "passive Perception": "13" },
    languages: ["Common", "Terran"],
    traits: [
      {
        name: "Commander's Aura",
        description: "Allied earth elemental myrmidons within 60 feet deal an extra 7 (2d6) damage on melee attacks."
      },
      {
        name: "Earth Glide",
        description: "The myrmidon can burrow through nonmagical, unworked earth and stone. While doing so, it doesn't disturb the material it moves through."
      },
      {
        name: "Siege Monster",
        description: "The myrmidon deals double damage to objects and structures."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The myrmidon makes two slam attacks."
      },
      {
        name: "Slam",
        description: "Melee Weapon Attack: +7 to hit, reach 10 ft., one target. Hit: 14 (2d10 + 4) bludgeoning damage. If the target is a Large or smaller creature, it must succeed on a DC 15 Strength saving throw or be knocked prone.",
        attackBonus: 7,
        damageDescription: "14 (2d10 + 4) bludgeoning"
      },
      {
        name: "Earthen Embrace",
        recharge: "Recharge 4-6",
        description: "A column of stone erupts in a 10-foot radius centered on a point the myrmidon can see within 60 feet. Each creature in that area must make a DC 14 Dexterity saving throw, taking 21 (6d6) bludgeoning damage on a failed save, or half on a success. The area becomes difficult terrain until the start of the myrmidon's next turn."
      }
    ]
  },
  {
    id: "cm-champion-of-lolth",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Princes of the Apocalypse",
    name: "Champion of Lolth",
    description: "An elite drow fighter-cleric of the Spider Queen, leading the Black Earth's enforcer squads.",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 10,
    experiencePoints: 5900,
    ac: 18,
    acNote: "chain shirt, shield",
    hp: 150,
    maxHp: 150,
    abilityScores: {
      strength: 16,
      dexterity: 18,
      constitution: 16,
      intelligence: 13,
      wisdom: 16,
      charisma: 15
    },
    savingThrows: { strength: 6, dexterity: 7, wisdom: 6 },
    skills: { Athletics: 6, Perception: 6, Religion: 5, Stealth: 7 },
    senses: { darkvision: "120 ft.", "passive Perception": "16" },
    languages: ["Common", "Elvish", "Undercommon"],
    traits: [
      {
        name: "Fey Ancestry",
        description: "The champion has advantage on saving throws against being charmed, and magic can't put it to sleep."
      },
      {
        name: "Innate Spellcasting",
        description: "Innate spellcasting ability is Charisma (spell save DC 13).\nAt will: dancing lights, faerie fire\n1/day each: darkness, web"
      },
      {
        name: "Lolth's Blessing",
        description: "When the champion reduces a creature to 0 hit points, it deals an extra 9 (2d8) necrotic damage to one other creature within 30 feet as Lolth smiles upon it."
      },
      {
        name: "Spellcasting",
        description: "The champion is an 8th-level spellcaster (Wisdom-based, spell save DC 14, +6 to hit).\nCantrips (at will): guidance, sacred flame, thaumaturgy\n1st level (4 slots): cure wounds, detect magic, shield of faith\n2nd level (3 slots): hold person, spiritual weapon (warhammer)\n3rd level (2 slots): bestow curse, dispel magic\n4th level (1 slot): guardian of faith"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The champion makes three attacks: one with its warhammer and two with its hand crossbow."
      },
      {
        name: "Warhammer",
        description: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) bludgeoning damage, or 8 (1d10 + 3) bludgeoning damage if used with two hands. On a hit, the target must succeed on a DC 13 Wisdom saving throw or be paralyzed until the end of its next turn.",
        attackBonus: 6,
        damageDescription: "7 (1d8 + 3) bludgeoning"
      },
      {
        name: "Hand Crossbow",
        description: "Ranged Weapon Attack: +7 to hit, range 30/120, one target. Hit: 6 (1d6 + 3) piercing damage, and the target must make a DC 13 Constitution saving throw or take an extra 9 (2d8) poison damage.",
        attackBonus: 7,
        damageDescription: "6 (1d6 + 3) piercing + 9 (2d8) poison"
      }
    ]
  },
  {
    id: "cm-storm-giant-quintessence",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Princes of the Apocalypse",
    name: "Storm Giant Quintessence",
    description: "A semi-transparent humanoid made of condensed air — Howling Hate's airborne enforcer.",
    size: "huge",
    type: "elemental",
    alignment: "Chaotic Neutral",
    speed: "50 ft., fly 100 ft. (hover)",
    challengeRating: 9,
    experiencePoints: 5000,
    ac: 16,
    acNote: "natural armor",
    hp: 161,
    maxHp: 161,
    abilityScores: {
      strength: 20,
      dexterity: 18,
      constitution: 20,
      intelligence: 12,
      wisdom: 16,
      charisma: 14
    },
    savingThrows: { strength: 9, dexterity: 8, constitution: 9, wisdom: 7 },
    skills: { Athletics: 9, Perception: 7 },
    damageResistances: ["lightning", "thunder"],
    damageImmunities: ["poison"],
    conditionImmunities: ["exhaustion", "grappled", "paralyzed", "petrified", "poisoned", "prone", "restrained"],
    senses: { "passive Perception": "17" },
    languages: ["Common", "Auran"],
    traits: [
      {
        name: "Air Form",
        description: "The quintessence can enter another creature's space and stop there. It can move through a space as narrow as 1 inch wide without squeezing."
      },
      {
        name: "Electricity Aura",
        description: "Creatures within 10 feet of the quintessence at the start of its turn take 7 (2d6) lightning damage. Creatures with resistance or immunity to lightning are unaffected."
      },
      {
        name: "Spellcasting",
        description: "The quintessence is a 7th-level spellcaster (Intelligence-based, spell save DC 14, +6 to hit).\nCantrips (at will): gust, mage hand, minor illusion\n1st level (4 slots): detect magic, feather fall, thunderwave\n2nd level (3 slots): gust of wind, misty step\n3rd level (2 slots): call lightning, wind wall\n4th level (1 slot): control water"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The quintessence makes two slam attacks. It can use Lightning Breath in place of either attack."
      },
      {
        name: "Slam",
        description: "Melee Weapon Attack: +9 to hit, reach 15 ft., one target. Hit: 14 (2d8 + 5) bludgeoning damage plus 7 (2d6) lightning damage. On a hit, the target must succeed on a DC 16 Strength saving throw or be pushed up to 20 feet away and knocked prone.",
        attackBonus: 9,
        damageDescription: "14 (2d8 + 5) bludgeoning + 7 (2d6) lightning"
      },
      {
        name: "Lightning Breath",
        recharge: "Recharge 5-6",
        description: "The quintessence exhales a 90-foot line, 5 feet wide. Each creature in the line must make a DC 16 Dexterity saving throw, taking 42 (12d6) lightning damage on a failed save, or half on a success."
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Gust",
        cost: 1,
        description: "The quintessence casts gust of wind centered on itself."
      },
      {
        name: "Slam",
        cost: 2,
        description: "The quintessence makes one slam attack."
      }
    ]
  },
  {
    id: "cm-vapor-elemental",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Princes of the Apocalypse",
    name: "Vapor Elemental",
    description: "A wispy air elemental variant native to the Howling Hate's sky-realm.",
    size: "large",
    type: "elemental",
    alignment: "Neutral",
    speed: "0 ft., fly 60 ft. (hover)",
    challengeRating: 5,
    experiencePoints: 1800,
    ac: 14,
    hp: 90,
    maxHp: 90,
    abilityScores: {
      strength: 12,
      dexterity: 20,
      constitution: 14,
      intelligence: 6,
      wisdom: 10,
      charisma: 8
    },
    savingThrows: { dexterity: 7, constitution: 4 },
    skills: { Stealth: 7 },
    damageResistances: ["lightning", "thunder"],
    damageImmunities: ["poison"],
    conditionImmunities: ["exhaustion", "grappled", "paralyzed", "petrified", "poisoned", "prone", "restrained", "unconscious"],
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: ["Auran"],
    traits: [
      {
        name: "Cloud Form",
        description: "The vapor elemental can occupy another creature's space and vice versa. It can move through a space as narrow as 1 inch wide without squeezing."
      },
      {
        name: "Insubstantial",
        description: "The vapor elemental has resistance to bludgeoning, piercing, and slashing damage from nonmagical attacks. It can pass through objects as if they were difficult terrain."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The vapor elemental makes two slam attacks."
      },
      {
        name: "Slam",
        description: "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 4) bludgeoning damage plus 3 (1d6) cold damage.",
        attackBonus: 7,
        damageDescription: "10 (2d6 + 4) bludgeoning + 3 (1d6) cold"
      },
      {
        name: "Whispering Fog",
        recharge: "Recharge 4-6",
        description: "The vapor elemental exhales a 30-foot-radius sphere of fog centered on a point within 60 feet. The fog spreads around corners, heavily obscures the area, and lasts until the end of the elemental's next turn. Each creature that enters the fog for the first time on a turn or starts its turn there must succeed on a DC 13 Wisdom saving throw or be frightened until the fog ends."
      }
    ]
  },
  {
    id: "cm-elder-elemental-eye",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Princes of the Apocalypse",
    name: "Elder Elemental Eye",
    description: "The avatar of the Elder Elemental Eye itself, fused from elemental prince essence in the final sanctum.",
    size: "huge",
    type: "monstrosity",
    alignment: "Neutral Evil",
    speed: "60 ft., burrow 40 ft., fly 80 ft., swim 60 ft.",
    challengeRating: 20,
    experiencePoints: 25000,
    ac: 20,
    acNote: "natural armor",
    hp: 350,
    maxHp: 350,
    abilityScores: {
      strength: 26,
      dexterity: 18,
      constitution: 24,
      intelligence: 18,
      wisdom: 18,
      charisma: 18
    },
    savingThrows: { strength: 14, dexterity: 11, constitution: 13, wisdom: 11, charisma: 11 },
    skills: { Arcana: 11, Perception: 11 },
    damageResistances: ["acid", "cold", "fire", "lightning", "thunder"],
    damageImmunities: ["poison"],
    conditionImmunities: ["exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { truesight: "60 ft.", "passive Perception": "21" },
    languages: ["all elemental tongues", "Common"],
    traits: [
      {
        name: "Elemental Convergence",
        description: "The Eye is treated as an air, earth, fire, and water creature for the purposes of spells and effects that target a specific creature type. When it suffers damage of one of those types, it gains resistance to that damage until the end of its next turn."
      },
      {
        name: "Legendary Resistance",
        description: "If the Eye fails a saving throw, it can choose to succeed instead (3/day)."
      },
      {
        name: "Elemental Spellcasting",
        description: "The Eye is a 20th-level spellcaster (Intelligence-based, spell save DC 19, +11 to hit with spell attacks).\nAt will: control flames, gust, mold earth, shape water (each at will)\n1/day each: cone of cold, fireball, lightning bolt, wall of stone"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The Eye makes three attacks with its Elemental Beam and can use Elemental Convergence in place of one attack."
      },
      {
        name: "Elemental Beam",
        description: "Ranged Spell Attack: +11 to hit, range 120 ft., one target. Hit: 21 (3d8 + 8) of one of the following damage types (chosen at the start of each turn): acid, cold, fire, lightning, or thunder.",
        attackBonus: 11,
        damageDescription: "21 (3d8 + 8) elemental"
      },
      {
        name: "Elemental Convergence",
        recharge: "Recharge 5-6",
        description: "The Eye releases a wave of elemental energy in a 60-foot cone. Each creature in the area must make a DC 20 Dexterity saving throw. On a failure, a creature takes 28 (8d6) acid damage, 28 (8d6) cold damage, 28 (8d6) fire damage, 28 (8d6) lightning damage, and 28 (8d6) thunder damage. On a success, it takes half of each."
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Elemental Beam",
        cost: 2,
        description: "The Eye makes one Elemental Beam attack."
      },
      {
        name: "Warp",
        cost: 1,
        description: "The Eye teleports up to 60 feet to an unoccupied space it can see."
      }
    ]
  },
  // --- Curse of the Crimson Throne ---
  {
    id: "cm-carrion-golem",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of the Crimson Throne",
    name: "Carrion Golem",
    description: "A patchwork horror of stolen corpses animated by the whispers of Kazavon.",
    size: "large",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 9,
    experiencePoints: 5000,
    ac: 16,
    acNote: "natural armor",
    hp: 165,
    maxHp: 165,
    abilityScores: {
      strength: 19,
      dexterity: 9,
      constitution: 20,
      intelligence: 6,
      wisdom: 11,
      charisma: 6
    },
    savingThrows: { constitution: 8 },
    skills: { Perception: 3 },
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["understands the languages of its creator but can't speak"],
    traits: [
      {
        name: "Berserk",
        description: "Whenever the golem starts its turn below half its hit points or has no creature within 30 feet, it goes berserk. While berserk, it attacks the nearest creature it can see."
      },
      {
        name: "Plague-Bearing",
        description: "Any creature that takes necrotic damage from the golem must succeed on a DC 16 Constitution saving throw or be infected with the Blood Veil plague (incubation 1 day; afflicted creatures take 14 (4d6) necrotic damage at the end of each long rest and can't regain hit points)."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The golem makes two slam attacks."
      },
      {
        name: "Slam",
        description: "Melee Weapon Attack: +8 to hit, reach 10 ft., one target. Hit: 16 (2d10 + 5) bludgeoning damage plus 10 (3d6) necrotic damage.",
        attackBonus: 8,
        damageDescription: "16 (2d10 + 5) bludgeoning + 10 (3d6) necrotic"
      },
      {
        name: "Swallow",
        description: "The golem targets a Medium or smaller creature grappled by it. The target must succeed on a DC 16 Dexterity saving throw or be swallowed. While swallowed, the target is blinded and restrained, takes 21 (6d6) necrotic damage at the start of each of its turns, and the golem has advantage on attack rolls against it. The golem can have only one creature swallowed at a time."
      }
    ]
  },
  {
    id: "cm-soulbound-doll",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of the Crimson Throne",
    name: "Soulbound Doll",
    description: "A porcelain doll housing the trapped soul of an Arcadian child, used by Korvosan nobles as a spy.",
    size: "tiny",
    type: "construct",
    alignment: "Neutral Evil",
    speed: "20 ft., fly 30 ft. (hover)",
    challengeRating: 1,
    experiencePoints: 200,
    ac: 14,
    acNote: "natural armor",
    hp: 18,
    maxHp: 18,
    abilityScores: {
      strength: 4,
      dexterity: 18,
      constitution: 12,
      intelligence: 11,
      wisdom: 12,
      charisma: 6
    },
    skills: { Stealth: 6 },
    damageResistances: ["acid", "cold", "fire", "lightning"],
    damageImmunities: ["poison", "psychic"],
    conditionImmunities: ["blinded", "charmed", "deafened", "frightened", "paralyzed", "petrified", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: ["Common"],
    traits: [
      {
        name: "False Appearance",
        description: "While motionless, the doll is indistinguishable from an ordinary, inanimate object."
      },
      {
        name: "Heartbound",
        description: "The doll can move and act only while within 1 mile of its master. If its master dies, the doll crumbles to dust."
      }
    ],
    actions: [
      {
        name: "Needle",
        description: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) piercing damage plus 7 (2d6) psychic damage (the soul's torment).",
        attackBonus: 6,
        damageDescription: "4 (1d4 + 2) piercing + 7 (2d6) psychic"
      }
    ]
  },
  {
    id: "cm-devilfish",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of the Crimson Throne",
    name: "Devilfish",
    description: "An electrified ray of the Acadamae sinks, shocking intruders with bioelectric pulses.",
    size: "medium",
    type: "monstrosity",
    alignment: "Unaligned",
    speed: "0 ft., swim 40 ft.",
    challengeRating: 2,
    experiencePoints: 450,
    ac: 13,
    acNote: "natural armor",
    hp: 45,
    maxHp: 45,
    abilityScores: {
      strength: 12,
      dexterity: 16,
      constitution: 14,
      intelligence: 2,
      wisdom: 10,
      charisma: 4
    },
    skills: { Stealth: 5 },
    senses: { blindsight: "30 ft.", "passive Perception": "10" },
    languages: ["—"],
    traits: [
      {
        name: "Electricity Sense",
        description: "The devilfish can detect creatures using electricity or magic within 60 feet."
      },
      {
        name: "Water Breathing",
        description: "The devilfish can breathe only underwater."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The devilfish makes two sting attacks."
      },
      {
        name: "Sting",
        description: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) piercing damage plus 7 (2d6) lightning damage. The target must succeed on a DC 12 Constitution saving throw or be stunned until the end of its next turn.",
        attackBonus: 5,
        damageDescription: "7 (1d8 + 3) piercing + 7 (2d6) lightning"
      }
    ]
  },
  {
    id: "cm-raktavarna",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of the Crimson Throne",
    name: "Raktavarna",
    description: "A demon-spider from the Abyssal depths, hunting the Acadamae's brave scholars.",
    size: "large",
    type: "fiend",
    alignment: "Chaotic Evil",
    speed: "40 ft., climb 40 ft.",
    challengeRating: 7,
    experiencePoints: 2900,
    ac: 16,
    acNote: "natural armor",
    hp: 123,
    maxHp: 123,
    abilityScores: {
      strength: 16,
      dexterity: 18,
      constitution: 16,
      intelligence: 12,
      wisdom: 13,
      charisma: 12
    },
    skills: { Stealth: 8, Religion: 5 },
    damageResistances: ["acid", "cold", "fire"],
    damageImmunities: ["poison"],
    conditionImmunities: ["frightened", "poisoned"],
    senses: { darkvision: "120 ft.", "passive Perception": "13" },
    languages: ["Abyssal", "Common", "Undercommon"],
    traits: [
      {
        name: "Demon Web",
        description: "The raktavarna can spin webbing that creates a 20-foot cube of sticky web in a location it can see within 60 feet. The web has AC 10, HP 30, is vulnerable to fire, and is immune to bludgeoning damage from nonmagical attacks. A creature in the web is restrained. As an action, a restrained creature can make a DC 14 Strength check, escaping on a success."
      },
      {
        name: "Spider Climb",
        description: "The raktavarna can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      }
    ],
    actions: [
      {
        name: "Bite",
        description: "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) piercing damage plus 14 (4d6) poison damage.",
        attackBonus: 8,
        damageDescription: "7 (1d8 + 3) piercing + 14 (4d6) poison"
      },
      {
        name: "Web",
        description: "Ranged Weapon Attack: +8 to hit, range 30/60, one target. Hit: the target is restrained by webbing. As an action, the restrained target can make a DC 14 Strength check, escaping on a success."
      }
    ]
  },
  {
    id: "cm-dream-spider",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of the Crimson Throne",
    name: "Dream Spider",
    description: "A tiny psionic spider that burrows into the mind, leaving the victim a blank-eyed husk.",
    size: "tiny",
    type: "aberration",
    alignment: "Neutral Evil",
    speed: "20 ft., climb 20 ft.",
    challengeRating: 3,
    experiencePoints: 700,
    ac: 14,
    acNote: "natural armor",
    hp: 45,
    maxHp: 45,
    abilityScores: {
      strength: 6,
      dexterity: 18,
      constitution: 12,
      intelligence: 13,
      wisdom: 13,
      charisma: 10
    },
    skills: { Stealth: 8, Perception: 5 },
    senses: { darkvision: "60 ft.", tremorsense: "30 ft.", "passive Perception": "15" },
    languages: ["understands Aklo but can't speak"],
    traits: [
      {
        name: "Spider Climb",
        description: "The dream spider can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      }
    ],
    actions: [
      {
        name: "Bite",
        description: "Melee Weapon Attack: +6 to hit, reach 5 ft., one creature. Hit: 4 (1d4 + 2) piercing damage plus 18 (4d8) psychic damage, and the target must succeed on a DC 13 Wisdom saving throw or be incapacitated until the end of its next turn (nightmare visions).",
        attackBonus: 6,
        damageDescription: "4 (1d4 + 2) piercing + 18 (4d8) psychic"
      }
    ]
  },
  {
    id: "cm-reefclaw",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of the Crimson Throne",
    name: "Reefclaw",
    description: "An amphibious predator lurking in the harbor shallows around Old Korvosa.",
    size: "medium",
    type: "monstrosity",
    alignment: "Unaligned",
    speed: "30 ft., swim 40 ft.",
    challengeRating: 4,
    experiencePoints: 1100,
    ac: 14,
    acNote: "natural armor",
    hp: 75,
    maxHp: 75,
    abilityScores: {
      strength: 17,
      dexterity: 13,
      constitution: 16,
      intelligence: 2,
      wisdom: 12,
      charisma: 6
    },
    skills: { Athletics: 6, Perception: 4, Stealth: 4 },
    senses: { "passive Perception": "14" },
    languages: ["—"],
    traits: [
      {
        name: "Amphibious",
        description: "The reefclaw can breathe air and water."
      },
      {
        name: "Pack Tactics",
        description: "The reefclaw has advantage on an attack roll against a creature if at least one of the reefclaw's allies is within 5 feet of the creature and the ally isn't incapacitated."
      },
      {
        name: "Pounce",
        description: "If the reefclaw moves at least 20 feet straight toward a creature and then hits it with a claw attack on the same turn, that target must succeed on a DC 13 Strength saving throw or be knocked prone. If the target is prone, the reefclaw can make one bite attack against it as a bonus action."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The reefclaw makes one bite attack and one claw attack."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) piercing damage.",
        attackBonus: 6,
        damageDescription: "8 (1d8 + 4) piercing"
      },
      {
        name: "Claw",
        description: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 9 (2d6 + 3) slashing damage.",
        attackBonus: 6,
        damageDescription: "9 (2d6 + 3) slashing"
      }
    ]
  },
  {
    id: "cm-skeleton-knight",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of the Crimson Throne",
    name: "Skeleton Knight",
    description: "An armored undead warrior of Castle Scarwall, given unnatural vigor by Kazavon's curse.",
    size: "medium",
    type: "undead",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 5,
    experiencePoints: 1800,
    ac: 18,
    acNote: "plate armor",
    hp: 102,
    maxHp: 102,
    abilityScores: {
      strength: 18,
      dexterity: 14,
      constitution: 18,
      intelligence: 9,
      wisdom: 12,
      charisma: 12
    },
    savingThrows: { strength: 7 },
    skills: { Athletics: 7, Intimidation: 4 },
    damageImmunities: ["poison"],
    conditionImmunities: ["exhaustion", "frightened", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: ["Common"],
    traits: [
      {
        name: "Death's Embrace",
        description: "When a creature the knight can see drops to 0 hit points within 30 feet, the knight can move up to its speed toward that creature as a reaction."
      },
      {
        name: "Vulnerable to Bludgeoning",
        description: "The skeleton suffers double damage from bludgeoning attacks. Bludgeoning critical hits against it shatter bones, reducing its hit point maximum by an amount equal to the damage taken."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The knight makes two longsword attacks or two longbow attacks."
      },
      {
        name: "Longsword",
        description: "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) slashing damage, or 9 (1d10 + 4) slashing damage if used with two hands.",
        attackBonus: 7,
        damageDescription: "8 (1d8 + 4) slashing"
      },
      {
        name: "Heavy Crossbow",
        description: "Ranged Weapon Attack: +5 to hit, range 100/400, one target. Hit: 7 (1d10 + 2) piercing damage.",
        attackBonus: 5,
        damageDescription: "7 (1d10 + 2) piercing"
      }
    ]
  },
  {
    id: "cm-danse-macabre",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of the Crimson Throne",
    name: "Danse Macabre",
    description: "An undead swarm-overseer haunting Castle Scarwall, conducting the dead in midnight dances.",
    size: "large",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "0 ft., fly 50 ft. (hover)",
    challengeRating: 11,
    experiencePoints: 7200,
    ac: 16,
    acNote: "natural armor",
    hp: 178,
    maxHp: 178,
    abilityScores: {
      strength: 12,
      dexterity: 18,
      constitution: 18,
      intelligence: 16,
      wisdom: 14,
      charisma: 18
    },
    savingThrows: { wisdom: 6, charisma: 8 },
    skills: { Performance: 8, Persuasion: 8 },
    damageResistances: ["acid", "cold", "fire", "lightning"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: [
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
    senses: { truesight: "60 ft.", "passive Perception": "12" },
    languages: ["Common", "Necril"],
    traits: [
      {
        name: "Incorporeal Movement",
        description: "The danse macabre can move through other creatures and objects as if they were difficult terrain. It takes 5 (1d10) force damage if it ends its turn inside an object."
      },
      {
        name: "Swarm Commander",
        description: "Undead within 60 feet of the danse macabre add 2 to their attack rolls and deal an extra 7 (2d6) damage on a hit."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The danse macabre makes two Withering Touch attacks."
      },
      {
        name: "Withering Touch",
        description: "Melee Spell Attack: +8 to hit, reach 5 ft., one target. Hit: 14 (3d6 + 4) necrotic damage.",
        attackBonus: 8,
        damageDescription: "14 (3d6 + 4) necrotic"
      },
      {
        name: "Animate Dance",
        recharge: "Recharge 5-6",
        description: "The danse macabre targets up to four corpses of Medium humanoids within 60 feet. Each rises as a zombie or skeleton (DM's choice) under its control. These undead serve the danse macabre until destroyed."
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Withering Touch",
        cost: 2,
        description: "The danse macabre makes one Withering Touch attack."
      },
      {
        name: "Dance of Dread",
        cost: 1,
        description: "Each creature within 30 feet that can see the danse macabre must succeed on a DC 16 Wisdom saving throw or be frightened until the end of its next turn."
      }
    ]
  },
  {
    id: "cm-chained-spirit",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of the Crimson Throne",
    name: "Chained Spirit",
    description: "A tormented spectral prisoner of Castle Scarwall, chained to its post for eternity.",
    size: "medium",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "0 ft., fly 40 ft. (hover)",
    challengeRating: 6,
    experiencePoints: 2300,
    ac: 13,
    hp: 84,
    maxHp: 84,
    abilityScores: {
      strength: 6,
      dexterity: 16,
      constitution: 14,
      intelligence: 10,
      wisdom: 14,
      charisma: 16
    },
    savingThrows: { charisma: 6 },
    damageResistances: ["acid", "cold", "fire", "lightning", "thunder"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: [
      "charmed",
      "exhaustion",
      "frightened",
      "grappled",
      "paralyzed",
      "poisoned",
      "prone",
      "restrained"
    ],
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["Common", "Necril"],
    traits: [
      {
        name: "Chained Vigil",
        description: "The chained spirit cannot move more than 30 feet from the object that anchors its chains. While anchored, it has resistance to all damage."
      },
      {
        name: "Incorporeal Movement",
        description: "The spirit can move through other creatures and objects as if they were difficult terrain. It takes 5 (1d10) force damage if it ends its turn inside an object."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The spirit makes two Spectral Touch attacks."
      },
      {
        name: "Spectral Touch",
        description: "Melee Spell Attack: +6 to hit, reach 5 ft., one target. Hit: 12 (2d8 + 3) cold damage.",
        attackBonus: 6,
        damageDescription: "12 (2d8 + 3) cold"
      },
      {
        name: "Terrifying Wail",
        recharge: "Recharge 5-6",
        description: "The spirit emits a wail. Each creature within 30 feet that can hear it must succeed on a DC 14 Wisdom saving throw or drop to 0 hit points. On a successful save, the creature is frightened for 1 minute."
      }
    ]
  },
  {
    id: "cm-umbral-dragon",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of the Crimson Throne",
    name: "Umbral Dragon",
    description: "A shadow-aligned evil dragon, laired deep beneath Castle Scarwall.",
    size: "huge",
    type: "dragon",
    alignment: "Chaotic Evil",
    speed: "40 ft., climb 40 ft., fly 80 ft.",
    challengeRating: 14,
    experiencePoints: 11500,
    ac: 18,
    acNote: "natural armor",
    hp: 256,
    maxHp: 256,
    abilityScores: {
      strength: 23,
      dexterity: 14,
      constitution: 21,
      intelligence: 16,
      wisdom: 13,
      charisma: 16
    },
    savingThrows: { dexterity: 7, constitution: 9, wisdom: 6, charisma: 7 },
    skills: { Perception: 10, Stealth: 7 },
    damageImmunities: ["necrotic"],
    senses: { blindsight: "30 ft.", darkvision: "120 ft.", "passive Perception": "20" },
    languages: ["Common", "Draconic", "Undercommon"],
    traits: [
      {
        name: "Shadow Stealth",
        description: "While in dim light or darkness, the dragon has advantage on Stealth checks and can use a bonus action to become invisible until it attacks or until bright light strikes it."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack: +11 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage plus 7 (2d6) necrotic damage.",
        attackBonus: 11,
        damageDescription: "17 (2d10 + 6) piercing + 7 (2d6) necrotic"
      },
      {
        name: "Claw",
        description: "Melee Weapon Attack: +11 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage.",
        attackBonus: 11,
        damageDescription: "13 (2d6 + 6) slashing"
      },
      {
        name: "Umbral Breath",
        recharge: "Recharge 5-6",
        description: "The dragon exhales a 60-foot cone of shadowy essence. Each creature in that area must make a DC 17 Dexterity saving throw, taking 49 (11d8) necrotic damage on a failed save, or half on a success. A creature that fails the save has its hit point maximum reduced by an amount equal to the necrotic damage taken."
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Shadowstep",
        cost: 1,
        description: "The dragon teleports up to 60 feet to an unoccupied space it can see. The destination must be in dim light or darkness."
      },
      {
        name: "Claw",
        cost: 2,
        description: "The dragon makes one claw attack."
      }
    ]
  },
  {
    id: "cm-prince-in-chains",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of the Crimson Throne",
    name: "The Prince in Chains",
    description: "A fallen paladin-king of Castle Scarwall, kept eternally bound by Kazavon's curse.",
    size: "medium",
    type: "undead",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 12,
    experiencePoints: 8400,
    ac: 19,
    acNote: "splint armor, shield",
    hp: 195,
    maxHp: 195,
    abilityScores: {
      strength: 18,
      dexterity: 14,
      constitution: 18,
      intelligence: 13,
      wisdom: 16,
      charisma: 18
    },
    savingThrows: { wisdom: 7, charisma: 8 },
    skills: { Athletics: 8, Intimidation: 8, Religion: 7 },
    damageResistances: ["bludgeoning", "piercing", "slashing"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["exhaustion", "frightened", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["Common", "Infernal"],
    traits: [
      {
        name: "Bound by the Curse",
        description: "While his chains remain intact, the Prince can't be banished or teleported and has advantage on saving throws against being knocked prone or moved against his will."
      },
      {
        name: "Legendary Resistance",
        description: "If the Prince fails a saving throw, he can choose to succeed instead (2/day)."
      },
      {
        name: "Spellcasting",
        description: "The Prince is a 10th-level spellcaster (Charisma-based, spell save DC 16, +8 to hit).\nCantrips (at will): guidance, sacred flame, thaumaturgy\n1st level (4 slots): cure wounds, shield of faith\n2nd level (3 slots): hold person, spiritual weapon\n3rd level (2 slots): dispel magic, spirit guardians\n4th level (1 slot): banishment"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The Prince makes two attacks with his warhammer or two attacks with his chains."
      },
      {
        name: "Warhammer",
        description: "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 9 (1d8 + 5) bludgeoning damage, or 10 (1d10 + 5) if used two-handed, plus 14 (4d6) necrotic damage.",
        attackBonus: 8,
        damageDescription: "9 (1d8 + 5) bludgeoning + 14 (4d6) necrotic"
      },
      {
        name: "Chains of Scarwall",
        description: "Melee Weapon Attack: +8 to hit, reach 15 ft., one target. Hit: 10 (2d6 + 4) slashing damage. The target is grappled (escape DC 16) and, on a critical hit, also restrained until the end of its next turn.",
        attackBonus: 8,
        damageDescription: "10 (2d6 + 4) slashing + grapple"
      }
    ],
    legendaryActionCount: 2,
    legendaryActions: [
      {
        name: "Chains",
        cost: 1,
        description: "The Prince makes one Chains of Scarwall attack."
      },
      {
        name: "Curse of Kazavon",
        cost: 2,
        description: "The Prince targets one creature within 30 feet. That creature must succeed on a DC 16 Wisdom saving throw or be cursed for 1 minute. While cursed, the creature has disadvantage on attack rolls and ability checks, and Kazavon's whisper deals 7 (2d6) psychic damage at the start of each of its turns."
      }
    ]
  },
  {
    id: "cm-greater-doppelganger",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of the Crimson Throne",
    name: "Greater Doppelganger",
    description: "A master shapeshifter engineered by Kazavon, capable of copying even class features and spells.",
    size: "medium",
    type: "monstrosity",
    alignment: "Neutral",
    speed: "30 ft.",
    challengeRating: 6,
    experiencePoints: 2300,
    ac: 14,
    acNote: "natural armor",
    hp: 92,
    maxHp: 92,
    abilityScores: {
      strength: 12,
      dexterity: 18,
      constitution: 14,
      intelligence: 14,
      wisdom: 13,
      charisma: 16
    },
    skills: { Deception: 10, Insight: 4, Perception: 4 },
    conditionImmunities: ["charmed"],
    senses: { truesight: "60 ft.", "passive Perception": "14" },
    languages: ["Common", "any two others"],
    traits: [
      {
        name: "Shapechanger",
        description: "The greater doppelganger can use its action to polymorph into a Medium humanoid it has seen, or back into its true form. Its statistics, other than its size, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        name: "Read Thoughts",
        description: "The greater doppelganger can magically read the surface thoughts of a creature within 60 feet as an action. It can mimic the creature's abilities and spellcasting for 1 minute by succeeding on a DC 15 Charisma (Deception) check (creature has advantage on the check if it knows the doppelganger well)."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The greater doppelganger makes two slam attacks."
      },
      {
        name: "Slam",
        description: "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) bludgeoning damage. If the target is a creature, it must succeed on a DC 14 Wisdom saving throw or be charmed by the greater doppelganger until the start of its next turn.",
        attackBonus: 7,
        damageDescription: "7 (1d8 + 3) bludgeoning"
      }
    ]
  },
  {
    id: "cm-kazavon",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of the Crimson Throne",
    name: "Kazavon, the Dragon Tyrant",
    description: "The ancient evil dragon whose curse drives the Crimson Throne AP, final boss of Castle Korvosa.",
    size: "huge",
    type: "dragon",
    alignment: "Neutral Evil",
    speed: "40 ft., fly 80 ft., swim 40 ft.",
    challengeRating: 18,
    experiencePoints: 20000,
    ac: 20,
    acNote: "natural armor",
    hp: 333,
    maxHp: 333,
    abilityScores: {
      strength: 27,
      dexterity: 14,
      constitution: 25,
      intelligence: 18,
      wisdom: 16,
      charisma: 19
    },
    savingThrows: { dexterity: 8, constitution: 12, wisdom: 9, charisma: 10 },
    skills: { Intimidation: 10, Perception: 9, Religion: 10 },
    damageImmunities: ["fire", "poison"],
    senses: { truesight: "60 ft.", "passive Perception": "19" },
    languages: ["Common", "Draconic", "Infernal"],
    traits: [
      {
        name: "Legendary Resistance",
        description: "If Kazavon fails a saving throw, he can choose to succeed instead (3/day)."
      },
      {
        name: "Scarab Curse",
        description: "Any creature struck by Kazavon's bite or that ends its turn within 10 feet of Kazavon must succeed on a DC 18 Wisdom saving throw or be infected with the Scarab curse. While cursed, the creature is telepathically linked to Kazavon and serves him while the curse persists. A creature can repeat the save at the end of each of its turns."
      },
      {
        name: "Spellcasting",
        description: "Kazavon is a 15th-level spellcaster (Charisma-based, spell save DC 18, +10 to hit).\nCantrips (at will): eldritch blast, mage hand, prestidigitation\n1st level (4 slots): command, detect magic\n2nd level (3 slots): detect thoughts, suggestion\n3rd level (3 slots): dispel magic, fear\n4th level (3 slots): banishment, polymorph\n5th level (2 slots): dominate person, hold monster\n6th level (1 slot): true seeing"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Kazavon makes three attacks: one with his bite, one with his claw, and one with his tail."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 19 (2d10 + 8) piercing damage plus 7 (2d6) fire damage.",
        attackBonus: 14,
        damageDescription: "19 (2d10 + 8) piercing + 7 (2d6) fire"
      },
      {
        name: "Claw",
        description: "Melee Weapon Attack: +14 to hit, reach 5 ft., one target. Hit: 15 (2d6 + 8) slashing damage.",
        attackBonus: 14,
        damageDescription: "15 (2d6 + 8) slashing"
      },
      {
        name: "Tail",
        description: "Melee Weapon Attack: +14 to hit, reach 15 ft., one target. Hit: 13 (2d8 + 4) bludgeoning damage.",
        attackBonus: 14,
        damageDescription: "13 (2d8 + 4) bludgeoning"
      },
      {
        name: "Breath Weapon",
        recharge: "Recharge 5-6",
        description: "Kazavon exhales a 90-foot line of flame. Each creature in the line must make a DC 20 Dexterity saving throw, taking 56 (16d6) fire damage on a failed save, or half on a success."
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Scarab Hex",
        cost: 2,
        description: "Kazavon targets one creature he can see within 60 feet. The target must succeed on a DC 18 Wisdom saving throw or be charmed by Kazavon for 1 minute."
      },
      {
        name: "Claw",
        cost: 2,
        description: "Kazavon makes one claw attack."
      }
    ]
  },
  {
    id: "cm-queen-ileosa",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of the Crimson Throne",
    name: "Queen Ileosa Arabasti (Possessed)",
    description: "The possessed Queen of Korvosa, transformed by Kazavon's curse into a tyrant at the campaign's climax.",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 15,
    experiencePoints: 13000,
    ac: 17,
    acNote: "breastplate, shield",
    hp: 195,
    maxHp: 195,
    abilityScores: {
      strength: 16,
      dexterity: 18,
      constitution: 18,
      intelligence: 18,
      wisdom: 16,
      charisma: 18
    },
    savingThrows: { dexterity: 9, intelligence: 9, charisma: 9 },
    skills: { Deception: 9, Intimidation: 9, Perception: 7, Persuasion: 9 },
    senses: { "passive Perception": "17" },
    languages: ["Common", "Draconic", "Infernal"],
    traits: [
      {
        name: "Cursed Shift",
        description: "On initiative count 20 (losing ties), Queen Ileosa transforms: she gains a fly speed of 60 feet for 1 minute, or her weapon damage becomes force damage for 1 minute, or she regains 21 (6d6) hit points."
      },
      {
        name: "Legendary Resistance",
        description: "If Ileosa fails a saving throw, she can choose to succeed instead (2/day)."
      },
      {
        name: "Spellcasting",
        description: "Ileosa is a 12th-level spellcaster (Charisma-based, spell save DC 17, +9 to hit).\nCantrips (at will): eldritch blast, minor illusion, sacred flame\n1st level (4 slots): charm person, command, shield\n2nd level (3 slots): detect thoughts, hold person\n3rd level (3 slots): counterspell, fear\n4th level (2 slots): banishment, polymorph\n5th level (1 slot): dominate person"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Ileosa makes two rapier attacks or two spell attacks."
      },
      {
        name: "Rapier",
        description: "Melee Weapon Attack: +9 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) piercing damage plus 14 (4d6) necrotic damage.",
        attackBonus: 9,
        damageDescription: "8 (1d8 + 4) piercing + 14 (4d6) necrotic"
      },
      {
        name: "Scarab's Whisper",
        description: "Ileosa whispers Kazavon's name at one creature within 30 feet. The target must succeed on a DC 17 Wisdom saving throw or take 21 (6d6) psychic damage and be frightened until the end of its next turn.",
        attackBonus: 9,
        damageDescription: "21 (6d6) psychic"
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Scarab Whisper",
        cost: 2,
        description: "Ileosa uses Scarab's Whisper."
      },
      {
        name: "Rapier",
        cost: 2,
        description: "Ileosa makes one rapier attack."
      }
    ]
  },
  {
    id: "cm-mummy-lord-plague",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Curse of the Crimson Throne",
    name: "Mummy Lord (Plague Bearer)",
    description: "A mummy lord spreading the Blood Veil plague through the Acadamae crypts of Korvosa.",
    size: "medium",
    type: "undead",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 15,
    experiencePoints: 13000,
    ac: 17,
    acNote: "natural armor",
    hp: 210,
    maxHp: 210,
    abilityScores: {
      strength: 18,
      dexterity: 12,
      constitution: 18,
      intelligence: 11,
      wisdom: 18,
      charisma: 16
    },
    savingThrows: { constitution: 8, wisdom: 8 },
    skills: { History: 4, Religion: 6 },
    damageImmunities: ["necrotic", "poison"],
    damageVulnerabilities: ["fire"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "paralyzed", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "14" },
    languages: ["Common", "Necril"],
    traits: [
      {
        name: "Legendary Resistance",
        description: "If the mummy lord fails a saving throw, it can choose to succeed instead (3/day)."
      },
      {
        name: "Plague Bearer",
        description: "Any creature that takes necrotic damage from the mummy lord must succeed on a DC 16 Constitution saving throw or be infected with the Blood Veil plague (incubation 1 day; afflicted creatures take 21 (6d6) necrotic damage at the end of each long rest and can't regain hit points)."
      },
      {
        name: "Rejuvenation",
        description: "If destroyed, the mummy lord regains all its hit points in 24 hours unless its remains are burned or sprinkled with holy water."
      },
      {
        name: "Spellcasting",
        description: "The mummy lord is a 12th-level spellcaster (Wisdom-based, spell save DC 16, +8 to hit).\nCantrips (at will): sacred flame, thaumaturgy\n1st level (4 slots): command, detect magic, shield of faith\n2nd level (3 slots): hold person, spiritual weapon\n3rd level (3 slots): animate dead, dispel magic\n4th level (2 slots): banishment, blight\n5th level (1 slot): contagion\n6th level (1 slot): harm"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The mummy lord makes two withering touch attacks or one attack with its staff."
      },
      {
        name: "Withering Touch",
        description: "Melee Spell Attack: +8 to hit, reach 5 ft., one target. Hit: 12 (2d8 + 3) necrotic damage plus 14 (4d6) necrotic damage from the Blood Veil plague (constitution save DC 16 or contracted).",
        attackBonus: 8,
        damageDescription: "12 (2d8 + 3) necrotic + 14 (4d6) necrotic"
      },
      {
        name: "Staff of the Forgotten Pharaoh",
        description: "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 10 (1d8 + 6) bludgeoning damage plus 14 (4d6) necrotic damage, or 11 (1d10 + 6) if used two-handed.",
        attackBonus: 8,
        damageDescription: "10 (1d8 + 6) bludgeoning + 14 (4d6) necrotic"
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Withering Touch",
        cost: 2,
        description: "The mummy lord makes one Withering Touch attack."
      },
      {
        name: "Plague Word",
        cost: 1,
        description: "The mummy lord targets one creature within 30 feet. That creature must succeed on a DC 16 Constitution saving throw or be infected with the Blood Veil plague."
      }
    ]
  },
  // --- Hell's Rebels ---
  {
    id: "cm-hellknight",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Hell's Rebels",
    name: "Hellknight (Order of the Torrent)",
    description: "An armored Chelish warrior of the Hellknight orders, binding devils to enforce diabolic law.",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 5,
    experiencePoints: 1800,
    ac: 18,
    acNote: "plate armor",
    hp: 117,
    maxHp: 117,
    abilityScores: {
      strength: 18,
      dexterity: 14,
      constitution: 16,
      intelligence: 12,
      wisdom: 14,
      charisma: 12
    },
    savingThrows: { strength: 7, constitution: 6, wisdom: 5 },
    skills: { Athletics: 7, Intimidation: 4, Perception: 5 },
    senses: { "passive Perception": "15" },
    languages: ["Common", "Infernal"],
    traits: [
      {
        name: "Devil Binding",
        description: "The hellknight can cast detect magic at will and has advantage on Charisma (Intimidation) checks against devils."
      },
      {
        name: "Hellknight Discipline",
        description: "The hellknight has advantage on saving throws against being charmed, frightened, or magically compelled."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The hellknight makes three attacks: one with its longsword, one with its dagger, and one with its infernal pistol."
      },
      {
        name: "Longsword",
        description: "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) slashing damage, or 9 (1d10 + 4) if used two-handed, plus 7 (2d6) fire damage (infernal pact).",
        attackBonus: 7,
        damageDescription: "8 (1d8 + 4) slashing + 7 (2d6) fire"
      },
      {
        name: "Dagger",
        description: "Melee or Ranged Weapon Attack: +7 to hit, reach 5 ft. or range 20/60. Hit: 5 (1d4 + 3) piercing damage.",
        attackBonus: 7,
        damageDescription: "5 (1d4 + 3) piercing"
      },
      {
        name: "Infernal Pistol",
        description: "Ranged Weapon Attack: +5 to hit, range 30/90. Hit: 7 (1d10 + 2) piercing damage plus 7 (2d6) fire damage.",
        attackBonus: 5,
        damageDescription: "7 (1d10 + 2) piercing + 7 (2d6) fire"
      }
    ]
  },
  {
    id: "cm-impaler-shrike",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Hell's Rebels",
    name: "Impaler Shrike",
    description: "A bloodthirsty fey bird with a barbed beak, hunting Kintargo's rooftops for fresh meat.",
    size: "small",
    type: "fey",
    alignment: "Chaotic Evil",
    speed: "10 ft., fly 60 ft.",
    challengeRating: 2,
    experiencePoints: 450,
    ac: 13,
    acNote: "natural armor",
    hp: 38,
    maxHp: 38,
    abilityScores: {
      strength: 6,
      dexterity: 17,
      constitution: 13,
      intelligence: 6,
      wisdom: 12,
      charisma: 6
    },
    skills: { Perception: 3, Stealth: 5 },
    senses: { "passive Perception": "13" },
    languages: ["Sylvan"],
    traits: [
      {
        name: "Pack Tactics",
        description: "The shrike has advantage on an attack roll against a creature if at least one of the shrike's allies is within 5 feet of the creature and the ally isn't incapacitated."
      },
      {
        name: "Dive Attack",
        description: "If the shrike is flying and dives at least 30 feet straight toward a target and then hits with a beak attack, the attack deals an extra 7 (2d6) piercing damage."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The shrike makes two beak attacks."
      },
      {
        name: "Beak",
        description: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) piercing damage.",
        attackBonus: 5,
        damageDescription: "6 (1d6 + 3) piercing"
      }
    ]
  },
  {
    id: "cm-gambling-devil",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Hell's Rebels",
    name: "Gambling Devil",
    description: "A small Chelish devil — the Belaphos or 'Lascivitriarch' — that deals in fortunes and bargains.",
    size: "small",
    type: "fiend",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 4,
    experiencePoints: 1100,
    ac: 15,
    acNote: "natural armor",
    hp: 84,
    maxHp: 84,
    abilityScores: {
      strength: 12,
      dexterity: 18,
      constitution: 16,
      intelligence: 16,
      wisdom: 14,
      charisma: 18
    },
    savingThrows: { dexterity: 7, constitution: 6, charisma: 7 },
    skills: { Deception: 10, Insight: 5, Persuasion: 7 },
    damageResistances: ["cold", "fire"],
    damageImmunities: ["poison"],
    conditionImmunities: ["frightened", "poisoned"],
    senses: { truesight: "60 ft.", "passive Perception": "12" },
    languages: ["Common", "Infernal"],
    traits: [
      {
        name: "Devil's Sight",
        description: "Magical darkness doesn't impede the devil's vision."
      },
      {
        name: "Lucky",
        description: "If the devil rolls a 1 on an attack roll, ability check, or saving throw, it can reroll the die and must use the new roll."
      },
      {
        name: "Magic Resistance",
        description: "The devil has advantage on saving throws against spells and other magical effects."
      },
      {
        name: "Spellcasting",
        description: "Innate spellcasting ability is Charisma (spell save DC 15). It can innately cast the following spells:\nAt will: charm person, detect magic, disguise self\n3/day each: counterspell, suggestion\n1/day each: confusion, hold monster"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The devil makes two attacks: one with its barbed fork and one with its dice."
      },
      {
        name: "Barbed Fork",
        description: "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) piercing damage. If the target is a creature, it must succeed on a DC 14 Wisdom saving throw or be cursed for 1 minute (gambler's curse: disadvantage on attack rolls and ability checks).",
        attackBonus: 7,
        damageDescription: "7 (1d8 + 3) piercing"
      },
      {
        name: "Loaded Dice",
        description: "Ranged Spell Attack: +7 to hit, range 30/120, one target. Hit: 14 (2d8 + 4) force damage.",
        attackBonus: 7,
        damageDescription: "14 (2d8 + 4) force"
      }
    ]
  },
  {
    id: "cm-scrivenite",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Hell's Rebels",
    name: "Scrivenite",
    description: "An animated ink-and-paper horror, bound into existence by Asmodean scriveners in Kintargo.",
    size: "small",
    type: "construct",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 3,
    experiencePoints: 700,
    ac: 14,
    acNote: "natural armor",
    hp: 60,
    maxHp: 60,
    abilityScores: {
      strength: 14,
      dexterity: 16,
      constitution: 14,
      intelligence: 12,
      wisdom: 10,
      charisma: 6
    },
    skills: { Stealth: 6 },
    damageResistances: ["acid", "cold", "fire", "lightning"],
    damageImmunities: ["poison", "psychic"],
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
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: ["Common", "Infernal"],
    traits: [
      {
        name: "False Appearance",
        description: "While motionless, the scrivenite is indistinguishable from an ordinary pile of manuscripts and ink."
      },
      {
        name: "Ink Cloud",
        description: "As a bonus action, the scrivenite can release a 10-foot-radius cloud of ink. The cloud spreads around corners, lasts for 1 minute, and heavily obscures the area. A wind of moderate or greater speed disperses the cloud."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The scrivenite makes two quill attacks."
      },
      {
        name: "Quill",
        description: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 7 (1d6 + 4) piercing damage, and the target's vision is blurred for 1 minute (disadvantage on attack rolls and Wisdom (Perception) checks that rely on sight).",
        attackBonus: 6,
        damageDescription: "7 (1d6 + 4) piercing"
      }
    ]
  },
  {
    id: "cm-barzillai-thrune",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Hell's Rebels",
    name: "Barzillai Thrune (Mortal)",
    description: "The mortal form of Barzillai Thrune, Chelish inquisitor who seizes Kintargo in martial law.",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 12,
    experiencePoints: 8400,
    ac: 18,
    acNote: "breastplate",
    hp: 180,
    maxHp: 180,
    abilityScores: {
      strength: 18,
      dexterity: 14,
      constitution: 18,
      intelligence: 18,
      wisdom: 16,
      charisma: 18
    },
    savingThrows: { strength: 8, dexterity: 6, wisdom: 7, charisma: 8 },
    skills: { Deception: 8, Intimidation: 8, Persuasion: 8, Religion: 8 },
    senses: { "passive Perception": "13" },
    languages: ["Common", "Infernal"],
    traits: [
      {
        name: "Diabolical Strategist",
        description: "Barzillai adds his proficiency bonus to initiative and has advantage on Intelligence (Investigation) checks."
      },
      {
        name: "Legendary Resistance",
        description: "If Barzillai fails a saving throw, he can choose to succeed instead (2/day)."
      },
      {
        name: "Spellcasting",
        description: "Barzillai is a 12th-level spellcaster (Intelligence-based, spell save DC 16, +8 to hit).\nCantrips (at will): fire bolt, minor illusion, sacred flame\n1st level (4 slots): command, detect magic, shield\n2nd level (3 slots): hold person, suggestion\n3rd level (3 slots): counterspell, fireball\n4th level (2 slots): banishment, wall of fire\n5th level (1 slot): dominate person\n6th level (1 slot): true seeing"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Barzillai makes two spell attacks or two weapon attacks."
      },
      {
        name: "Hellforged Saber",
        description: "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) slashing damage plus 14 (4d6) fire damage.",
        attackBonus: 8,
        damageDescription: "8 (1d8 + 4) slashing + 14 (4d6) fire"
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Cantrip",
        cost: 1,
        description: "Barzillai casts fire bolt."
      },
      {
        name: "Hellforged Saber",
        cost: 2,
        description: "Barzillai makes one Hellforged Saber attack."
      }
    ]
  },
  {
    id: "cm-barzillai-archdevil",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Hell's Rebels",
    name: "Barzillai Thrune (Archdevil)",
    description: "Barzillai's true form, having ascended to archdevil status in Caina during the Breaking the Bones of Hell finale.",
    size: "large",
    type: "fiend",
    alignment: "Lawful Evil",
    speed: "40 ft., fly 80 ft.",
    challengeRating: 17,
    experiencePoints: 18000,
    ac: 19,
    acNote: "natural armor",
    hp: 297,
    maxHp: 297,
    abilityScores: {
      strength: 26,
      dexterity: 18,
      constitution: 24,
      intelligence: 22,
      wisdom: 20,
      charisma: 22
    },
    savingThrows: { strength: 13, dexterity: 10, wisdom: 10, charisma: 11 },
    skills: { Deception: 11, Intimidation: 11, Persuasion: 11, Religion: 11 },
    damageResistances: ["cold", "lightning"],
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["frightened", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "15" },
    languages: ["all", "telepathy 120 ft."],
    traits: [
      {
        name: "Archdevil Resistances",
        description: "Barzillai has advantage on saving throws against spells and other magical effects."
      },
      {
        name: "Legendary Resistance",
        description: "If Barzillai fails a saving throw, he can choose to succeed instead (3/day)."
      },
      {
        name: "Spellcasting",
        description: "Barzillai is a 20th-level spellcaster (Intelligence-based, spell save DC 20, +12 to hit).\nCantrips (at will): fire bolt, minor illusion, prestidigitation\n1st level (4 slots): command, shield, detect magic\n2nd level (3 slots): hold person, suggestion, mirror image\n3rd level (3 slots): counterspell, fireball, lightning bolt\n4th level (3 slots): banishment, wall of fire\n5th level (3 slots): dominate person, hold monster\n6th level (2 slots): disintegrate, true seeing\n7th level (2 slots): finger of death, teleport"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Barzillai makes two Hellforged Saber attacks and one Infernal Bolt attack."
      },
      {
        name: "Hellforged Saber",
        description: "Melee Weapon Attack: +13 to hit, reach 10 ft., one target. Hit: 14 (2d6 + 8) slashing damage plus 14 (4d6) fire damage.",
        attackBonus: 13,
        damageDescription: "14 (2d6 + 8) slashing + 14 (4d6) fire"
      },
      {
        name: "Infernal Bolt",
        description: "Ranged Spell Attack: +12 to hit, range 120 ft., one target. Hit: 21 (3d8 + 8) fire damage plus 14 (4d6) force damage.",
        attackBonus: 12,
        damageDescription: "21 (3d8 + 8) fire + 14 (4d6) force"
      },
      {
        name: "Hellfire",
        recharge: "Recharge 5-6",
        description: "Barzillai breathes hellfire in a 60-foot cone. Each creature in that area must make a DC 20 Dexterity saving throw, taking 42 (12d6) fire damage and 42 (12d6) necrotic damage on a failed save, or half of each on a success."
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Hellforged Saber",
        cost: 2,
        description: "Barzillai makes one Hellforged Saber attack."
      },
      {
        name: "Charm",
        cost: 1,
        description: "Barzillai targets one humanoid within 30 feet. The target must succeed on a DC 20 Wisdom saving throw or be charmed for 1 minute."
      }
    ]
  },
  {
    id: "cm-shadow-dragon",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Hell's Rebels",
    name: "Shadow Dragon",
    description: "A black dragon twisted by shadow magic — the monster beneath Kintargo's surface in Chapter 5.",
    size: "huge",
    type: "dragon",
    alignment: "Chaotic Evil",
    speed: "40 ft., fly 80 ft., swim 40 ft.",
    challengeRating: 13,
    experiencePoints: 10000,
    ac: 19,
    acNote: "natural armor",
    hp: 195,
    maxHp: 195,
    abilityScores: {
      strength: 21,
      dexterity: 14,
      constitution: 21,
      intelligence: 14,
      wisdom: 13,
      charisma: 15
    },
    savingThrows: { dexterity: 7, constitution: 9, wisdom: 6, charisma: 7 },
    skills: { Perception: 9, Stealth: 7 },
    damageImmunities: ["acid", "necrotic"],
    senses: { blindsight: "30 ft.", darkvision: "120 ft.", "passive Perception": "19" },
    languages: ["Common", "Draconic", "Undercommon"],
    traits: [
      {
        name: "Shadow Stealth",
        description: "While in dim light or darkness, the dragon has advantage on Stealth checks and can use a bonus action to become invisible until it attacks or until bright light strikes it."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage plus 7 (2d6) acid damage.",
        attackBonus: 10,
        damageDescription: "17 (2d10 + 6) piercing + 7 (2d6) acid"
      },
      {
        name: "Claw",
        description: "Melee Weapon Attack: +10 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage.",
        attackBonus: 10,
        damageDescription: "13 (2d6 + 6) slashing"
      },
      {
        name: "Shadow Breath",
        recharge: "Recharge 5-6",
        description: "The dragon exhales a 60-foot line, 5 feet wide. Each creature in the line must make a DC 17 Dexterity saving throw, taking 49 (11d8) necrotic damage on a failed save, or half on a success."
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Shadowstep",
        cost: 1,
        description: "The dragon teleports up to 60 feet to an unoccupied space it can see, in dim light or darkness."
      },
      {
        name: "Claw",
        cost: 2,
        description: "The dragon makes one claw attack."
      }
    ]
  },
  {
    id: "cm-shadow-golem",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Hell's Rebels",
    name: "Shadow Golem",
    description: "A golem of pure shadow, animated by Hellknight diabolism in Caina.",
    size: "large",
    type: "construct",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 10,
    experiencePoints: 5900,
    ac: 17,
    acNote: "natural armor",
    hp: 178,
    maxHp: 178,
    abilityScores: {
      strength: 20,
      dexterity: 9,
      constitution: 20,
      intelligence: 6,
      wisdom: 11,
      charisma: 1
    },
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: [
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
    senses: { blindsight: "60 ft.", "passive Perception": "10" },
    languages: ["understands Infernal but can't speak"],
    traits: [
      {
        name: "Incorporeal Form",
        description: "The golem can move through other creatures and objects as if they were difficult terrain. It takes 10 (3d6) force damage if it ends its turn inside an object."
      },
      {
        name: "Magic Resistance",
        description: "The golem has advantage on saving throws against spells and other magical effects."
      },
      {
        name: "Shadow Resilience",
        description: "The golem has resistance to nonmagical bludgeoning, piercing, and slashing damage."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The golem makes two slam attacks."
      },
      {
        name: "Slam",
        description: "Melee Weapon Attack: +9 to hit, reach 5 ft., one target. Hit: 16 (2d10 + 5) bludgeoning damage plus 14 (4d6) necrotic damage.",
        attackBonus: 9,
        damageDescription: "16 (2d10 + 5) bludgeoning + 14 (4d6) necrotic"
      }
    ]
  },
  {
    id: "cm-nightprowler",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Hell's Rebels",
    name: "Nightprowler",
    description: "A devil-stalked evil creature of shadow, hunting Kintargo's noble houses for Hellknight pay.",
    size: "medium",
    type: "fiend",
    alignment: "Neutral Evil",
    speed: "40 ft., climb 40 ft.",
    challengeRating: 9,
    experiencePoints: 5000,
    ac: 16,
    acNote: "natural armor",
    hp: 161,
    maxHp: 161,
    abilityScores: {
      strength: 19,
      dexterity: 18,
      constitution: 17,
      intelligence: 13,
      wisdom: 14,
      charisma: 14
    },
    skills: { Acrobatics: 8, Perception: 6, Stealth: 8 },
    damageResistances: ["bludgeoning", "piercing", "slashing"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "grappled", "paralyzed", "poisoned", "prone", "restrained"],
    senses: { darkvision: "120 ft.", "passive Perception": "16" },
    languages: ["Common", "Infernal"],
    traits: [
      {
        name: "Shadow Stealth",
        description: "While in dim light or darkness, the nightprowler has advantage on Stealth checks."
      },
      {
        name: "Spider Climb",
        description: "The nightprowler can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The nightprowler makes two Claw attacks."
      },
      {
        name: "Claw",
        description: "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 12 (2d6 + 5) slashing damage. If the target is a creature, it must succeed on a DC 15 Constitution saving throw or take an extra 14 (4d6) necrotic damage and have its hit point maximum reduced by the same amount.",
        attackBonus: 8,
        damageDescription: "12 (2d6 + 5) slashing + 14 (4d6) necrotic"
      }
    ]
  },
  {
    id: "cm-cruciarus",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Hell's Rebels",
    name: "Cruciarus",
    description: "A greater devil introduced in Breaking the Bones of Hell — Asmodeus's inquisitor of pain.",
    size: "large",
    type: "fiend",
    alignment: "Lawful Evil",
    speed: "30 ft., fly 50 ft.",
    challengeRating: 11,
    experiencePoints: 7200,
    ac: 18,
    acNote: "natural armor",
    hp: 195,
    maxHp: 195,
    abilityScores: {
      strength: 22,
      dexterity: 14,
      constitution: 20,
      intelligence: 17,
      wisdom: 14,
      charisma: 18
    },
    savingThrows: { dexterity: 6, wisdom: 6, charisma: 8 },
    skills: { Deception: 8, Intimidation: 8, Perception: 6 },
    damageResistances: ["cold", "lightning"],
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["frightened", "poisoned"],
    senses: { truesight: "60 ft.", "passive Perception": "16" },
    languages: ["Common", "Infernal"],
    traits: [
      {
        name: "Devil's Sight",
        description: "Magical darkness doesn't impede the cruciarus's vision."
      },
      {
        name: "Innate Spellcasting",
        description: "Innate spellcasting ability is Charisma (spell save DC 16, +8 to hit).\nAt will: detect magic, fire bolt\n1/day each: hold monster, wall of fire\n1/week each: geas, symbol (pain)"
      },
      {
        name: "Magic Resistance",
        description: "The cruciarus has advantage on saving throws against spells and other magical effects."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The cruciarus makes two Whip of Pain attacks and one Bite attack."
      },
      {
        name: "Whip of Pain",
        description: "Melee Weapon Attack: +10 to hit, reach 20 ft., one target. Hit: 13 (2d6 + 6) slashing damage. The target must succeed on a DC 16 Constitution saving throw or take 7 (2d6) psychic damage (excruciating pain).",
        attackBonus: 10,
        damageDescription: "13 (2d6 + 6) slashing + 7 (2d6) psychic"
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack: +10 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 6) piercing damage plus 7 (2d6) fire damage.",
        attackBonus: 10,
        damageDescription: "14 (2d8 + 6) piercing + 7 (2d6) fire"
      }
    ]
  },
  {
    id: "cm-forsaken-legion",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Hell's Rebels",
    name: "Forsaken Legion",
    description: "The unquiet dead of Kintargo's fallen rebels, twisted by Asmodeus into an unwilling fiendish army.",
    size: "medium",
    type: "fiend",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 6,
    experiencePoints: 2300,
    ac: 16,
    acNote: "chain shirt",
    hp: 117,
    maxHp: 117,
    abilityScores: {
      strength: 18,
      dexterity: 14,
      constitution: 16,
      intelligence: 10,
      wisdom: 12,
      charisma: 14
    },
    savingThrows: { strength: 7, constitution: 6 },
    skills: { Athletics: 7, Intimidation: 4 },
    damageResistances: ["cold", "fire"],
    damageImmunities: ["poison"],
    conditionImmunities: ["frightened", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: ["Common", "Infernal"],
    traits: [
      {
        name: "Hellbound",
        description: "If the legion is destroyed, it reforms in Asmodeus's realm within 24 hours unless its remains are sanctified."
      },
      {
        name: "Pack Tactics",
        description: "The legion has advantage on an attack roll against a creature if at least one of the legion's allies is within 5 feet of the creature and the ally isn't incapacitated."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The legion makes two Hellforged Sword attacks."
      },
      {
        name: "Hellforged Sword",
        description: "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) slashing damage plus 7 (2d6) fire damage.",
        attackBonus: 7,
        damageDescription: "8 (1d8 + 4) slashing + 7 (2d6) fire"
      }
    ]
  },
  // --- Red Hand of Doom ---
  {
    id: "cm-azarr-kul",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Red Hand of Doom",
    name: "Azarr Kul, the Red Hand",
    description: "A half-red-dragon hobgoblin warlord who leads the Tiamat-worshipping Red Hand horde.",
    size: "large",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "40 ft.",
    challengeRating: 15,
    experiencePoints: 13000,
    ac: 19,
    acNote: "half-plate",
    hp: 270,
    maxHp: 270,
    abilityScores: {
      strength: 22,
      dexterity: 16,
      constitution: 22,
      intelligence: 16,
      wisdom: 14,
      charisma: 18
    },
    savingThrows: { strength: 11, dexterity: 8, wisdom: 7, charisma: 9 },
    skills: { Athletics: 11, Intimidation: 9, Perception: 7 },
    damageImmunities: ["fire"],
    senses: { darkvision: "60 ft.", "passive Perception": "17" },
    languages: ["Common", "Draconic", "Goblin"],
    traits: [
      {
        name: "Dragon Ancestry",
        description: "Azarr Kul has the Draconic Bloodline of a red dragon. He has advantage on saving throws against being frightened."
      },
      {
        name: "Legendary Resistance",
        description: "If Azarr Kul fails a saving throw, he can choose to succeed instead (3/day)."
      },
      {
        name: "Martial Advantage",
        description: "Once per turn, Azarr Kul can deal an extra 14 (4d6) damage to a creature he hits with a weapon attack if that creature is within 5 feet of one of his allies."
      },
      {
        name: "Tiamat's Blessing",
        description: "Azarr Kul has advantage on attack rolls against creatures that are surprised or unaware of his approach."
      },
      {
        name: "Spellcasting",
        description: "Azarr Kul is an 8th-level spellcaster (Charisma-based, spell save DC 16, +9 to hit).\nCantrips (at will): fire bolt, sacred flame, thaumaturgy\n1st level (4 slots): command, detect magic\n2nd level (3 slots): hold person, spiritual weapon\n3rd level (2 slots): dispel magic, fireball\n4th level (1 slot): wall of fire"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Azarr Kul makes three attacks: one with his bite and two with his claw, or three with his halberd."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack: +11 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) piercing damage plus 7 (2d6) fire damage.",
        attackBonus: 11,
        damageDescription: "14 (2d8 + 5) piercing + 7 (2d6) fire"
      },
      {
        name: "Claw",
        description: "Melee Weapon Attack: +11 to hit, reach 5 ft., one target. Hit: 11 (1d10 + 5) slashing damage.",
        attackBonus: 11,
        damageDescription: "11 (1d10 + 5) slashing"
      },
      {
        name: "Halberd",
        description: "Melee Weapon Attack: +11 to hit, reach 10 ft., one target. Hit: 13 (1d10 + 5) slashing damage, or 14 (1d12 + 5) if used two-handed, plus 7 (2d6) fire damage.",
        attackBonus: 11,
        damageDescription: "13 (1d10 + 5) slashing + 7 (2d6) fire"
      },
      {
        name: "Breath Weapon",
        recharge: "Recharge 5-6",
        description: "Azarr Kul exhales a 30-foot cone of flame. Each creature in that area must make a DC 18 Dexterity saving throw, taking 56 (16d6) fire damage on a failed save, or half on a success."
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Claw",
        cost: 2,
        description: "Azarr Kul makes one claw attack."
      },
      {
        name: "Horde Call",
        cost: 1,
        description: "Azarr Kul targets one hobgoblin, bugbear, or goblin he can see within 60 feet. That creature can use its reaction to make one weapon attack."
      }
    ]
  },
  {
    id: "cm-harnoth-bloodwatcher",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Red Hand of Doom",
    name: "Harnoth Bloodwatcher",
    description: "Hobgoblin warlord champion of the Red Hand, bodyguard to Azarr Kul himself.",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 8,
    experiencePoints: 3900,
    ac: 18,
    acNote: "plate armor",
    hp: 161,
    maxHp: 161,
    abilityScores: {
      strength: 19,
      dexterity: 14,
      constitution: 18,
      intelligence: 14,
      wisdom: 12,
      charisma: 16
    },
    savingThrows: { strength: 8, constitution: 7, charisma: 6 },
    skills: { Athletics: 8, Intimidation: 6, Perception: 4 },
    senses: { darkvision: "60 ft.", "passive Perception": "14" },
    languages: ["Common", "Draconic", "Goblin"],
    traits: [
      {
        name: "Martial Advantage",
        description: "Once per turn, Harnoth can deal an extra 7 (2d6) damage to a creature he hits with a weapon attack if that creature is within 5 feet of one of his allies."
      },
      {
        name: "Tiamat's Champion",
        description: "Harnoth has advantage on saving throws against being charmed or frightened."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Harnoth makes three attacks: one with his greatsword, one with his dagger, and one with his shortbow."
      },
      {
        name: "Greatsword",
        description: "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage, or 14 (2d8 + 6) slashing damage if used two-handed.",
        attackBonus: 8,
        damageDescription: "13 (2d6 + 6) slashing"
      },
      {
        name: "Dagger",
        description: "Melee or Ranged Weapon Attack: +8 to hit, reach 5 ft. or range 20/60. Hit: 6 (1d4 + 5) piercing damage.",
        attackBonus: 8,
        damageDescription: "6 (1d4 + 5) piercing"
      },
      {
        name: "Shortbow",
        description: "Ranged Weapon Attack: +6 to hit, range 80/320. Hit: 6 (1d6 + 3) piercing damage.",
        attackBonus: 6,
        damageDescription: "6 (1d6 + 3) piercing"
      }
    ]
  },
  {
    id: "cm-zanthrus-wyrmspeaker",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Red Hand of Doom",
    name: "Zanthrus, Wyrm-Speaker",
    description: "The high priest of Tiamat in the Fane, second-in-command of the Red Hand horde.",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 11,
    experiencePoints: 7200,
    ac: 18,
    acNote: "half plate, shield",
    hp: 195,
    maxHp: 195,
    abilityScores: {
      strength: 14,
      dexterity: 16,
      constitution: 18,
      intelligence: 14,
      wisdom: 18,
      charisma: 18
    },
    savingThrows: { constitution: 8, wisdom: 9 },
    skills: { Intimidation: 8, Religion: 6 },
    damageImmunities: ["fire"],
    senses: { darkvision: "60 ft.", "passive Perception": "14" },
    languages: ["Common", "Draconic", "Goblin"],
    traits: [
      {
        name: "Tiamat's Voice",
        description: "Zanthrus can speak with draconic authority; any dragon or dragon-blooded creature of CR 10 or lower within 60 feet that fails a DC 16 Wisdom saving throw obeys his commands for 1 minute."
      },
      {
        name: "Legendary Resistance",
        description: "If Zanthrus fails a saving throw, he can choose to succeed instead (1/day)."
      },
      {
        name: "Spellcasting",
        description: "Zanthrus is a 12th-level spellcaster (Wisdom-based, spell save DC 17, +9 to hit).\nCantrips (at will): guidance, sacred flame, thaumaturgy\n1st level (4 slots): command, detect magic, shield of faith\n2nd level (3 slots): hold person, spiritual weapon\n3rd level (3 slots): dispel magic, fireball\n4th level (3 slots): banishment, wall of fire\n5th level (2 slots): dominate person, flame strike\n7th level (1 slot): fire storm"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Zanthrus makes two Warhammer attacks or two spell attacks."
      },
      {
        name: "Warhammer",
        description: "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) bludgeoning damage, or 9 (1d10 + 4) if used two-handed, plus 14 (4d6) fire damage.",
        attackBonus: 7,
        damageDescription: "8 (1d8 + 4) bludgeoning + 14 (4d6) fire"
      },
      {
        name: "Tiamat's Rebuke",
        recharge: "Recharge 5-6",
        description: "Zanthrus roars Tiamat's name. Each non-dragon creature within 30 feet must succeed on a DC 17 Wisdom saving throw or take 21 (6d6) psychic damage and be frightened until the end of its next turn."
      }
    ],
    legendaryActionCount: 2,
    legendaryActions: [
      {
        name: "Cantrip",
        cost: 1,
        description: "Zanthrus casts a cantrip."
      },
      {
        name: "Warhammer",
        cost: 2,
        description: "Zanthrus makes one warhammer attack."
      }
    ]
  },
  {
    id: "cm-kulkzor-wyrmspeaker",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Red Hand of Doom",
    name: "Kulk'zor the Wyrmspeaker",
    description: "An early-AP hobgoblin dragon-priest commanding the Witchwood wyrm-riders.",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 8,
    experiencePoints: 3900,
    ac: 17,
    acNote: "scale mail, shield",
    hp: 135,
    maxHp: 135,
    abilityScores: {
      strength: 14,
      dexterity: 16,
      constitution: 16,
      intelligence: 14,
      wisdom: 17,
      charisma: 16
    },
    savingThrows: { wisdom: 7 },
    skills: { Religion: 6, Perception: 5 },
    damageImmunities: ["fire"],
    senses: { darkvision: "60 ft.", "passive Perception": "15" },
    languages: ["Common", "Draconic", "Goblin"],
    traits: [
      {
        name: "Draconic Cohort",
        description: "Kulk'zor commands a wyvern companion (treat as a wyvern with no rider) that follows his spoken commands."
      },
      {
        name: "Spellcasting",
        description: "Kulk'zor is an 8th-level spellcaster (Wisdom-based, spell save DC 15, +7 to hit).\nCantrips (at will): guidance, sacred flame, thaumaturgy\n1st level (4 slots): command, detect magic, shield of faith\n2nd level (3 slots): hold person, spiritual weapon\n3rd level (2 slots): dispel magic, fireball\n4th level (1 slot): wall of fire"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Kulk'zor makes two Warhammer attacks or two spell attacks."
      },
      {
        name: "Warhammer",
        description: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) bludgeoning damage, or 8 (1d10 + 3) if used two-handed, plus 7 (2d6) fire damage.",
        attackBonus: 6,
        damageDescription: "7 (1d8 + 3) bludgeoning + 7 (2d6) fire"
      },
      {
        name: "Bolt of Tiamat",
        description: "Ranged Spell Attack: +7 to hit, range 120 ft., one target. Hit: 21 (6d6) fire damage.",
        attackBonus: 7,
        damageDescription: "21 (6d6) fire"
      }
    ]
  },
  {
    id: "cm-skalmad-red-fang",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "Red Hand of Doom",
    name: "Skalmad the Red Fang",
    description: "A vampire lieutenant of the Red Hand horde, lurking in the Witchwood.",
    size: "medium",
    type: "undead",
    alignment: "Lawful Evil",
    speed: "30 ft., climb 30 ft.",
    challengeRating: 7,
    experiencePoints: 2900,
    ac: 16,
    acNote: "natural armor",
    hp: 135,
    maxHp: 135,
    abilityScores: {
      strength: 17,
      dexterity: 16,
      constitution: 16,
      intelligence: 11,
      wisdom: 14,
      charisma: 16
    },
    savingThrows: { dexterity: 7, wisdom: 6, charisma: 7 },
    skills: { Perception: 6, Stealth: 7 },
    damageResistances: ["necrotic"],
    damageImmunities: ["poison"],
    conditionImmunities: ["frightened"],
    senses: { darkvision: "60 ft.", "passive Perception": "16" },
    languages: ["Common", "Goblin"],
    traits: [
      {
        name: "Spider Climb",
        description: "Skalmad can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      },
      {
        name: "Vampire Weaknesses",
        description: "Skalmad has the following flaws: harmed by running water; repelled by garlic; cannot enter a residence without an invitation; must rest in a coffin filled with earth from his homeland."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "Skalmad makes two attacks: one with his bite and one with his longsword."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 7 (1d6 + 3) piercing damage plus 7 (2d6) necrotic damage. The target must succeed on a DC 14 Constitution saving throw or have its hit point maximum reduced by an amount equal to the necrotic damage taken.",
        attackBonus: 7,
        damageDescription: "7 (1d6 + 3) piercing + 7 (2d6) necrotic"
      },
      {
        name: "Longsword",
        description: "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 3) slashing damage, or 9 (1d10 + 3) if used two-handed.",
        attackBonus: 7,
        damageDescription: "8 (1d8 + 3) slashing"
      },
      {
        name: "Charm",
        description: "Skalmad targets one humanoid within 30 feet. The target must succeed on a DC 14 Wisdom saving throw or be charmed by Skalmad for 24 hours."
      }
    ]
  },
  // ===== G3 SRD monster embed (per plan: SRD monsters embedded as cm- entries so encounters are self-contained) =====
  {
    id: "cm-srd-hobgoblin",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
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
      strength: 13,
      dexterity: 12,
      constitution: 12,
      intelligence: 10,
      wisdom: 10,
      charisma: 9
    },
    skills: { Athletics: 3 },
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: ["Common", "Goblin"],
    traits: [
      {
        name: "Martial Advantage",
        description: "Once per turn, the hobgoblin can deal an extra 7 (2d6) damage to a creature it hits with a weapon attack if that creature is within 5 feet of one of the hobgoblin's allies."
      }
    ],
    actions: [
      {
        name: "Longsword",
        description: "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 5 (1d8 + 1) slashing damage, or 6 (1d10 + 1) if used two-handed.",
        attackBonus: 3,
        damageDescription: "5 (1d8 + 1) slashing"
      },
      {
        name: "Longbow",
        description: "Ranged Weapon Attack: +3 to hit, range 150/600, one target. Hit: 5 (1d8 + 1) piercing damage.",
        attackBonus: 3,
        damageDescription: "5 (1d8 + 1) piercing"
      }
    ]
  },
  {
    id: "cm-srd-bugbear",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
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
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 8,
      wisdom: 11,
      charisma: 9
    },
    skills: { Stealth: 6, Survival: 4 },
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: ["Common", "Goblin"],
    traits: [
      {
        name: "Brute",
        description: "A melee weapon deals one extra die of its damage when the bugbear hits with it (included in the attack)."
      },
      {
        name: "Surprise Attack",
        description: "If the bugbear surprises a creature, it deals an extra 7 (2d6) damage to that creature on its first turn."
      }
    ],
    actions: [
      {
        name: "Morningstar",
        description: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 11 (2d8 + 2) piercing damage.",
        attackBonus: 4,
        damageDescription: "11 (2d8 + 2) piercing"
      }
    ]
  },
  {
    id: "cm-srd-bugbear-chief",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Bugbear Chief",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 3,
    experiencePoints: 700,
    ac: 17,
    acNote: "hide armor, shield",
    hp: 65,
    maxHp: 65,
    abilityScores: {
      strength: 17,
      dexterity: 14,
      constitution: 14,
      intelligence: 11,
      wisdom: 12,
      charisma: 11
    },
    skills: { Intimidation: 3, Stealth: 7 },
    senses: { darkvision: "60 ft.", "passive Perception": "11" },
    languages: ["Common", "Goblin"],
    traits: [
      {
        name: "Brute",
        description: "A melee weapon deals one extra die of its damage when the bugbear chief hits with it (included in the attack)."
      },
      {
        name: "Surprise Attack",
        description: "If the bugbear chief surprises a creature, it deals an extra 14 (4d6) damage to that creature on its first turn."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The chief makes two morningstar attacks."
      },
      {
        name: "Morningstar",
        description: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 14 (2d10 + 3) piercing damage.",
        attackBonus: 5,
        damageDescription: "14 (2d10 + 3) piercing"
      },
      {
        name: "Javelin",
        description: "Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 30/120, one target. Hit: 6 (1d6 + 3) piercing damage in melee or 8 (2d6 + 3) at range.",
        attackBonus: 5,
        damageDescription: "6 (1d6 + 3) piercing"
      }
    ]
  },
  {
    id: "cm-srd-hobgoblin-captain",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
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
      strength: 15,
      dexterity: 14,
      constitution: 14,
      intelligence: 12,
      wisdom: 10,
      charisma: 13
    },
    savingThrows: { strength: 5, dexterity: 5, constitution: 5, wisdom: 3 },
    skills: { Athletics: 5, Perception: 3 },
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["Common", "Goblin"],
    traits: [
      {
        name: "Martial Advantage",
        description: "Once per turn, the captain can deal an extra 7 (2d6) damage to a creature it hits with a weapon attack if that creature is within 5 feet of one of its allies."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The captain makes two melee attacks: one with its longsword and one with its dagger. Or it makes two ranged attacks with its javelin."
      },
      {
        name: "Longsword",
        description: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) slashing damage, or 7 (1d10 + 2) if used two-handed, plus 7 (2d6) damage from martial advantage if applicable.",
        attackBonus: 5,
        damageDescription: "6 (1d8 + 2) slashing"
      },
      {
        name: "Javelin",
        description: "Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 30/120, one target. Hit: 6 (1d6 + 2) piercing damage in melee or 8 (2d6 + 2) at range.",
        attackBonus: 5,
        damageDescription: "6 (1d6 + 2) piercing"
      }
    ]
  },
  {
    id: "cm-srd-ogre",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
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
      strength: 19,
      dexterity: 8,
      constitution: 16,
      intelligence: 5,
      wisdom: 7,
      charisma: 7
    },
    skills: { Athletics: 6 },
    senses: { darkvision: "60 ft.", "passive Perception": "8" },
    languages: ["Common", "Giant"],
    actions: [
      {
        name: "Greatclub",
        description: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) bludgeoning damage.",
        attackBonus: 6,
        damageDescription: "13 (2d8 + 4) bludgeoning"
      },
      {
        name: "Javelin",
        description: "Melee or Ranged Weapon Attack: +6 to hit, reach 5 ft. or range 30/120, one target. Hit: 11 (2d6 + 4) piercing damage in melee or 10 (1d10 + 4) at range.",
        attackBonus: 6,
        damageDescription: "11 (2d6 + 4) piercing"
      }
    ]
  },
  {
    id: "cm-srd-duergar",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Duergar",
    size: "medium",
    type: "humanoid",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 1,
    experiencePoints: 200,
    ac: 16,
    acNote: "chain shirt, shield",
    hp: 26,
    maxHp: 26,
    abilityScores: {
      strength: 14,
      dexterity: 11,
      constitution: 14,
      intelligence: 11,
      wisdom: 12,
      charisma: 9
    },
    skills: { Athletics: 4 },
    damageResistances: ["acid", "poison"],
    senses: { darkvision: "120 ft.", "passive Perception": "11" },
    languages: ["Common", "Dwarvish", "Undercommon"],
    traits: [
      {
        name: "Duergar Resilience",
        description: "The duergar has advantage on saving throws against poison, illusions, and being charmed or paralyzed."
      },
      {
        name: "Sunlight Sensitivity",
        description: "While in sunlight, the duergar has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
      }
    ],
    actions: [
      {
        name: "War Pick",
        description: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) piercing damage, or 9 (2d8 + 2) if used two-handed.",
        attackBonus: 4,
        damageDescription: "6 (1d8 + 2) piercing"
      },
      {
        name: "Javelin",
        description: "Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 30/120, one target. Hit: 5 (1d6 + 2) piercing damage in melee or 7 (1d10 + 2) at range.",
        attackBonus: 4,
        damageDescription: "5 (1d6 + 2) piercing"
      }
    ]
  },
  {
    id: "cm-srd-worg",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Worg",
    size: "large",
    type: "monstrosity",
    alignment: "Neutral Evil",
    speed: "40 ft.",
    challengeRating: 0.5,
    experiencePoints: 100,
    ac: 13,
    acNote: "natural armor",
    hp: 26,
    maxHp: 26,
    abilityScores: {
      strength: 16,
      dexterity: 13,
      constitution: 13,
      intelligence: 7,
      wisdom: 11,
      charisma: 8
    },
    skills: { Perception: 3, Stealth: 4 },
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["Goblin", "Worg"],
    traits: [
      {
        name: "Keen Hearing and Smell",
        description: "The worg has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      }
    ],
    actions: [
      {
        name: "Bite",
        description: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) piercing damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or be knocked prone.",
        attackBonus: 5,
        damageDescription: "10 (2d6 + 3) piercing"
      }
    ]
  },
  {
    id: "cm-srd-gnoll",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Gnoll",
    size: "medium",
    type: "humanoid",
    alignment: "Chaotic Evil",
    speed: "30 ft.",
    challengeRating: 0.5,
    experiencePoints: 100,
    ac: 15,
    acNote: "hide armor, shield",
    hp: 22,
    maxHp: 22,
    abilityScores: {
      strength: 14,
      dexterity: 12,
      constitution: 11,
      intelligence: 6,
      wisdom: 10,
      charisma: 7
    },
    senses: { darkvision: "60 ft.", "passive Perception": "10" },
    languages: ["Gnoll"],
    traits: [
      {
        name: "Rampage",
        description: "When the gnoll reduces a creature to 0 hit points with a melee attack on its turn, the gnoll can take a bonus action to move up to half its speed and make a bite attack."
      }
    ],
    actions: [
      {
        name: "Bite",
        description: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) piercing damage.",
        attackBonus: 4,
        damageDescription: "4 (1d4 + 2) piercing"
      },
      {
        name: "Spear",
        description: "Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 20/60, one creature. Hit: 5 (1d6 + 2) piercing damage, or 6 (1d8 + 2) if used two-handed in melee.",
        attackBonus: 4,
        damageDescription: "5 (1d6 + 2) piercing"
      }
    ]
  },
  {
    id: "cm-srd-night-hag",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Night Hag",
    size: "medium",
    type: "fiend",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 5,
    experiencePoints: 1800,
    ac: 17,
    acNote: "natural armor",
    hp: 85,
    maxHp: 85,
    abilityScores: {
      strength: 16,
      dexterity: 16,
      constitution: 16,
      intelligence: 16,
      wisdom: 14,
      charisma: 16
    },
    skills: { Deception: 5, Insight: 4, Perception: 4, Stealth: 5 },
    damageResistances: ["cold", "fire"],
    damageImmunities: ["poison"],
    conditionImmunities: ["frightened", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "14" },
    languages: ["Abyssal", "Common", "Infernal", "Primordial"],
    traits: [
      {
        name: "Innate Spellcasting",
        description: "Innate spellcasting ability is Charisma (spell save DC 14, +6 to hit).\nAt will: detect magic, disguise self, magic missile\n1/day each: plane shift (self only), ray of enfeeblement, sleep"
      },
      {
        name: "Heart Sight",
        description: "The hag targets one creature she can see within 30 feet. If the target is a humanoid and its heart is made of flesh, the hag knows its alignment and deepest fears."
      },
      {
        name: "Magic Resistance",
        description: "The hag has advantage on saving throws against spells and other magical effects."
      }
    ],
    actions: [
      {
        name: "Claws",
        description: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) slashing damage.",
        attackBonus: 6,
        damageDescription: "13 (2d8 + 4) slashing"
      },
      {
        name: "Etherealness",
        description: "The hag magically enters the Ethereal Plane from the Material Plane, or vice versa. As part of the same action, she can target one creature she can see within 10 feet. The target must succeed on a DC 14 Wisdom saving throw or be cursed with nightmare haunts (DC 14 Wisdom save each long rest or take 21 (6d6) psychic damage and no benefit from rest)."
      }
    ]
  },
  {
    id: "cm-srd-displacer-beast",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Displacer Beast",
    size: "large",
    type: "monstrosity",
    alignment: "Lawful Evil",
    speed: "40 ft.",
    challengeRating: 3,
    experiencePoints: 700,
    ac: 13,
    acNote: "natural armor",
    hp: 85,
    maxHp: 85,
    abilityScores: {
      strength: 18,
      dexterity: 15,
      constitution: 16,
      intelligence: 6,
      wisdom: 12,
      charisma: 8
    },
    skills: { Perception: 3, Stealth: 5 },
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["—"],
    traits: [
      {
        name: "Avoidance",
        description: "If the displacer beast is subjected to an attack that would deal bludgeoning, piercing, or slashing damage, it can choose to have the attack miss, and it uses its reaction to teleport up to 30 feet to an unoccupied space it can see."
      },
      {
        name: "Displacement",
        description: "The displacer beast projects a magical illusion that makes it appear to be standing near its actual location, causing attack rolls against it to have disadvantage. It can end this effect as a bonus action."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The displacer beast makes two attacks: one with its bite and one with its tentacles."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 7 (1d6 + 4) piercing damage.",
        attackBonus: 6,
        damageDescription: "7 (1d6 + 4) piercing"
      },
      {
        name: "Tentacles",
        description: "Melee Weapon Attack: +6 to hit, reach 10 ft., one creature. Hit: 7 (1d6 + 4) slashing damage.",
        attackBonus: 6,
        damageDescription: "7 (1d6 + 4) slashing"
      }
    ]
  },
  {
    id: "cm-srd-pit-fiend",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Pit Fiend",
    size: "large",
    type: "fiend",
    alignment: "Lawful Evil",
    speed: "30 ft., fly 60 ft.",
    challengeRating: 16,
    experiencePoints: 18000,
    ac: 19,
    acNote: "natural armor",
    hp: 300,
    maxHp: 300,
    abilityScores: {
      strength: 26,
      dexterity: 16,
      constitution: 24,
      intelligence: 22,
      wisdom: 18,
      charisma: 24
    },
    savingThrows: { strength: 14, dexterity: 9, constitution: 12, wisdom: 9, charisma: 13 },
    skills: { Deception: 13, Intimidation: 13, Perception: 13, Persuasion: 13 },
    damageResistances: ["acid", "cold"],
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["frightened", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "23" },
    languages: ["Common", "Infernal", "telepathy 120 ft."],
    traits: [
      {
        name: "Aura of Fear",
        description: "Creatures within 30 feet that aren't devils have disadvantage on saving throws against being frightened and take 10 (3d6) psychic damage at the start of each of the pit fiend's turns (DC 18 Wisdom save for half)."
      },
      {
        name: "Legendary Resistance",
        description: "If the pit fiend fails a saving throw, it can choose to succeed instead (3/day)."
      },
      {
        name: "Magic Resistance",
        description: "The pit fiend has advantage on saving throws against spells and other magical effects."
      },
      {
        name: "Innate Spellcasting",
        description: "Innate spellcasting ability is Charisma (spell save DC 21, +11 to hit).\nAt will: detect magic, fireball\n3/day each: hold monster, wall of fire\n1/day each: dominate monster, power word stun"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The pit fiend makes three attacks: one with its bite, one with its claw, and one with its tail. It can use its Hurl Flame in place of any of these attacks."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack: +14 to hit, reach 5 ft., one target. Hit: 21 (3d8 + 8) piercing damage plus 21 (6d6) fire damage. The target must succeed on a DC 21 Constitution saving throw or have its hit point maximum reduced by an amount equal to the fire damage taken.",
        attackBonus: 14,
        damageDescription: "21 (3d8 + 8) piercing + 21 (6d6) fire"
      },
      {
        name: "Claw",
        description: "Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 17 (2d8 + 8) slashing damage.",
        attackBonus: 14,
        damageDescription: "17 (2d8 + 8) slashing"
      },
      {
        name: "Tail",
        description: "Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 16 (2d6 + 8) bludgeoning damage plus 7 (2d6) fire damage.",
        attackBonus: 14,
        damageDescription: "16 (2d6 + 8) bludgeoning + 7 (2d6) fire"
      },
      {
        name: "Hurl Flame",
        description: "Ranged Spell Attack: +11 to hit, range 150 ft., one target. Hit: 14 (3d6 + 4) fire damage. If the target is a flammable object that isn't being worn or carried, it catches fire."
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Bite",
        cost: 2,
        description: "The pit fiend makes one bite attack."
      },
      {
        name: "Hurl Flame",
        cost: 1,
        description: "The pit fiend uses Hurl Flame."
      }
    ]
  },
  {
    id: "cm-srd-erinyes",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
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
      strength: 18,
      dexterity: 16,
      constitution: 18,
      intelligence: 14,
      wisdom: 14,
      charisma: 18
    },
    savingThrows: { strength: 8, constitution: 8 },
    skills: { Deception: 8, Insight: 6, Perception: 6, Persuasion: 8 },
    damageResistances: ["cold"],
    damageImmunities: ["fire", "poison"],
    conditionImmunities: ["frightened", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "16" },
    languages: ["Common", "Infernal"],
    traits: [
      {
        name: "Innate Spellcasting",
        description: "Innate spellcasting ability is Charisma (spell save DC 14, +6 to hit).\nAt will: detect magic, fireball\n1/day each: hold monster, wall of fire"
      },
      {
        name: "Magic Resistance",
        description: "The erinyes has advantage on saving throws against spells and other magical effects."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The erinyes makes three attacks: one with its longsword, one with its spear, and one with its rope."
      },
      {
        name: "Longsword",
        description: "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 4) slashing damage plus 14 (4d6) fire damage.",
        attackBonus: 8,
        damageDescription: "10 (2d6 + 4) slashing + 14 (4d6) fire"
      },
      {
        name: "Spear",
        description: "Melee or Ranged Weapon Attack: +8 to hit, reach 5 ft. or range 20/60, one target. Hit: 9 (1d6 + 4) piercing damage, or 10 (1d8 + 4) if used two-handed in melee.",
        attackBonus: 8,
        damageDescription: "9 (1d6 + 4) piercing"
      },
      {
        name: "Rope of Binding",
        description: "Ranged Weapon Attack: +6 to hit, range 250 ft., one Large or smaller creature. Hit: the target is grappled (escape DC 14) and pulled 30 feet toward the erinyes."
      }
    ]
  },
  {
    id: "cm-srd-medusa",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Medusa",
    size: "medium",
    type: "monstrosity",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 6,
    experiencePoints: 2300,
    ac: 15,
    acNote: "natural armor",
    hp: 127,
    maxHp: 127,
    abilityScores: {
      strength: 10,
      dexterity: 15,
      constitution: 16,
      intelligence: 12,
      wisdom: 13,
      charisma: 15
    },
    skills: { Deception: 5, Perception: 4, Stealth: 5 },
    senses: { darkvision: "60 ft.", "passive Perception": "14" },
    languages: ["Common", "Elvish"],
    traits: [
      {
        name: "Petrifying Gaze",
        description: "When a creature starts its turn within 30 feet of the medusa and can see its eyes, the medusa can force it to make a DC 14 Constitution saving throw if it isn't surprised. On a failure, the creature begins to turn to stone and is restrained. The creature must repeat the save at the end of its turn; on a success, the effect ends; on a failure, the creature is petrified until freed by greater restoration or similar magic."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The medusa makes three attacks: one with its snake hair, one with its shortsword, and one with its longbow."
      },
      {
        name: "Snake Hair",
        description: "Melee Weapon Attack: +5 to hit, reach 5 ft., one creature. Hit: 4 (1d4 + 2) piercing damage plus 14 (4d6) poison damage.",
        attackBonus: 5,
        damageDescription: "4 (1d4 + 2) piercing + 14 (4d6) poison"
      },
      {
        name: "Shortsword",
        description: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        attackBonus: 5,
        damageDescription: "5 (1d6 + 2) piercing"
      },
      {
        name: "Longbow",
        description: "Ranged Weapon Attack: +5 to hit, range 150/600, one target. Hit: 6 (1d8 + 2) piercing damage.",
        attackBonus: 5,
        damageDescription: "6 (1d8 + 2) piercing"
      }
    ]
  },
  {
    id: "cm-srd-frost-giant",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Frost Giant",
    size: "huge",
    type: "giant",
    alignment: "Neutral Evil",
    speed: "40 ft.",
    challengeRating: 8,
    experiencePoints: 3900,
    ac: 15,
    acNote: "patchwork armor",
    hp: 138,
    maxHp: 138,
    abilityScores: {
      strength: 23,
      dexterity: 9,
      constitution: 21,
      intelligence: 9,
      wisdom: 10,
      charisma: 12
    },
    savingThrows: { constitution: 7 },
    skills: { Athletics: 9, Perception: 3 },
    damageImmunities: ["cold"],
    senses: { "passive Perception": "13" },
    languages: ["Common", "Giant"],
    traits: [
      {
        name: "Keen Smell",
        description: "The frost giant has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The frost giant makes two greataxe attacks."
      },
      {
        name: "Greataxe",
        description: "Melee Weapon Attack: +9 to hit, reach 10 ft., one target. Hit: 25 (3d12 + 6) slashing damage.",
        attackBonus: 9,
        damageDescription: "25 (3d12 + 6) slashing"
      },
      {
        name: "Rock",
        description: "Ranged Weapon Attack: +9 to hit, range 60/240, one target. Hit: 28 (3d10 + 9) bludgeoning damage."
      }
    ]
  },
  {
    id: "cm-srd-young-red-dragon",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
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
      strength: 23,
      dexterity: 10,
      constitution: 21,
      intelligence: 14,
      wisdom: 11,
      charisma: 19
    },
    savingThrows: { dexterity: 5, constitution: 8, wisdom: 5, charisma: 7 },
    skills: { Perception: 8, Stealth: 5 },
    damageImmunities: ["fire"],
    senses: { blindsight: "30 ft.", darkvision: "120 ft.", "passive Perception": "18" },
    languages: ["Common", "Draconic"],
    traits: [
      {
        name: "Keen Smell",
        description: "The dragon has advantage on Wisdom (Perception) checks that rely on smell."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage plus 3 (1d6) fire damage.",
        attackBonus: 10,
        damageDescription: "17 (2d10 + 6) piercing + 3 (1d6) fire"
      },
      {
        name: "Claw",
        description: "Melee Weapon Attack: +10 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage.",
        attackBonus: 10,
        damageDescription: "13 (2d6 + 6) slashing"
      },
      {
        name: "Fire Breath",
        recharge: "Recharge 5-6",
        description: "The dragon exhales fire in a 30-foot cone. Each creature in that area must make a DC 17 Dexterity saving throw, taking 56 (16d6) fire damage on a failed save, or half on a success."
      }
    ]
  },
  {
    id: "cm-srd-kraken",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Kraken",
    size: "gargantuan",
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
      strength: 30,
      dexterity: 11,
      constitution: 25,
      intelligence: 22,
      wisdom: 18,
      charisma: 20
    },
    savingThrows: { strength: 17, dexterity: 7, constitution: 14, intelligence: 13, wisdom: 11 },
    skills: { Athletics: 17, Perception: 11 },
    damageImmunities: ["lightning", "poison"],
    conditionImmunities: ["frightened", "paralyzed", "poisoned"],
    senses: { truesight: "120 ft.", "passive Perception": "21" },
    languages: ["Abyssal", "Common", "Primordial", "telepathy 120 ft."],
    traits: [
      {
        name: "Amphibious",
        description: "The kraken can breathe air and water."
      },
      {
        name: "Innate Spellcasting",
        description: "Innate spellcasting ability is Intelligence (spell save DC 20, +11 to hit). It can innately cast the following spells:\nAt will: detect magic, fog cloud\n3/day each: control water, dispel magic, telekinesis\n1/day each: storm of vengeance, water breathing"
      },
      {
        name: "Legendary Resistance",
        description: "If the kraken fails a saving throw, it can choose to succeed instead (3/day)."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The kraken makes three tentacle attacks, one bite attack, and uses Fling if it can."
      },
      {
        name: "Bite",
        description: "Melee Weapon Attack: +17 to hit, reach 5 ft., one target. Hit: 32 (3d12 + 10) piercing damage.",
        attackBonus: 17,
        damageDescription: "32 (3d12 + 10) piercing"
      },
      {
        name: "Tentacle",
        description: "Melee Weapon Attack: +17 to hit, reach 30 ft., one target. Hit: 20 (3d6 + 10) bludgeoning damage, and the target is grappled (escape DC 20). Until the grapple ends, the target is restrained and takes 10 (3d6) bludgeoning damage at the start of each of its turns.",
        attackBonus: 17,
        damageDescription: "20 (3d6 + 10) bludgeoning + grapple"
      },
      {
        name: "Fling",
        description: "The kraken targets one creature grappled by it. The kraken throws the target up to 60 feet in a random direction. The target takes 14 (2d8 + 5) bludgeoning damage and lands prone."
      },
      {
        name: "Lightning Storm",
        recharge: "Recharge 5-6",
        description: "The kraken magically creates three bolts of lightning. Each bolt targets a creature the kraken can see within 120 feet. Each target must make a DC 20 Dexterity saving throw, taking 22 (4d10) lightning damage on a failed save, or half on a success."
      }
    ],
    legendaryActionCount: 3,
    legendaryActions: [
      {
        name: "Tentacle",
        cost: 1,
        description: "The kraken makes one tentacle attack."
      },
      {
        name: "Lightning Storm",
        cost: 2,
        description: "The kraken uses Lightning Storm."
      }
    ]
  },
  {
    id: "cm-srd-cultist",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Cultist",
    size: "medium",
    type: "humanoid",
    alignment: "Any Alignment",
    speed: "30 ft.",
    challengeRating: 0.125,
    experiencePoints: 25,
    ac: 12,
    acNote: "leather armor",
    hp: 9,
    maxHp: 9,
    abilityScores: {
      strength: 10,
      dexterity: 13,
      constitution: 10,
      intelligence: 10,
      wisdom: 11,
      charisma: 10
    },
    skills: { Deception: 2, Religion: 2 },
    senses: { "passive Perception": "10" },
    languages: ["any one language (usually Common)"],
    traits: [
      {
        name: "Dark Devotion",
        description: "The cultist has advantage on saving throws against being charmed or frightened."
      }
    ],
    actions: [
      {
        name: "Scimitar",
        description: "Melee Weapon Attack: +3 to hit, reach 5 ft., one creature. Hit: 4 (1d6 + 1) slashing damage.",
        attackBonus: 3,
        damageDescription: "4 (1d6 + 1) slashing"
      }
    ]
  },
  {
    id: "cm-srd-guard",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Guard",
    size: "medium",
    type: "humanoid",
    alignment: "Any Alignment",
    speed: "30 ft.",
    challengeRating: 0.125,
    experiencePoints: 25,
    ac: 16,
    acNote: "chain shirt, shield",
    hp: 11,
    maxHp: 11,
    abilityScores: {
      strength: 13,
      dexterity: 12,
      constitution: 12,
      intelligence: 10,
      wisdom: 11,
      charisma: 10
    },
    skills: { Perception: 2 },
    senses: { "passive Perception": "12" },
    languages: ["any one language (usually Common)"],
    actions: [
      {
        name: "Spear",
        description: "Melee or Ranged Weapon Attack: +3 to hit, reach 5 ft. or range 20/60, one target. Hit: 4 (1d6 + 1) piercing damage, or 5 (1d8 + 1) if used two-handed in melee.",
        attackBonus: 3,
        damageDescription: "4 (1d6 + 1) piercing"
      }
    ]
  },
  {
    id: "cm-srd-veteran",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Veteran",
    size: "medium",
    type: "humanoid",
    alignment: "Any Alignment",
    speed: "30 ft.",
    challengeRating: 3,
    experiencePoints: 700,
    ac: 17,
    acNote: "splint armor, shield",
    hp: 58,
    maxHp: 58,
    abilityScores: {
      strength: 16,
      dexterity: 13,
      constitution: 14,
      intelligence: 10,
      wisdom: 11,
      charisma: 10
    },
    savingThrows: { strength: 5, constitution: 4 },
    skills: { Athletics: 5, Perception: 2 },
    senses: { "passive Perception": "12" },
    languages: ["any one language (usually Common)"],
    actions: [
      {
        name: "Multiattack",
        description: "The veteran makes two longsword attacks."
      },
      {
        name: "Longsword",
        description: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) slashing damage, or 8 (1d10 + 3) if used two-handed.",
        attackBonus: 5,
        damageDescription: "7 (1d8 + 3) slashing"
      },
      {
        name: "Heavy Crossbow",
        description: "Ranged Weapon Attack: +3 to hit, range 100/400, one target. Hit: 6 (1d10 + 1) piercing damage.",
        attackBonus: 3,
        damageDescription: "6 (1d10 + 1) piercing"
      }
    ]
  },
  {
    id: "cm-srd-knight",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Knight",
    size: "medium",
    type: "humanoid",
    alignment: "Any Alignment",
    speed: "30 ft.",
    challengeRating: 3,
    experiencePoints: 700,
    ac: 18,
    acNote: "plate armor",
    hp: 52,
    maxHp: 52,
    abilityScores: {
      strength: 16,
      dexterity: 11,
      constitution: 14,
      intelligence: 11,
      wisdom: 11,
      charisma: 15
    },
    savingThrows: { constitution: 4, wisdom: 3 },
    skills: { Athletics: 5, Intimidation: 3, Perception: 3 },
    senses: { "passive Perception": "13" },
    languages: ["any one language (usually Common)"],
    traits: [
      {
        name: "Brave",
        description: "The knight has advantage on saving throws against being frightened."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The knight makes three melee attacks: one with its greatsword, one with its lance, and one with its heavy crossbow."
      },
      {
        name: "Greatsword",
        description: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) slashing damage.",
        attackBonus: 5,
        damageDescription: "10 (2d6 + 3) slashing"
      },
      {
        name: "Lance",
        description: "Melee Weapon Attack: +5 to hit, reach 10 ft., one target. Hit: 9 (1d10 + 3) piercing damage.",
        attackBonus: 5,
        damageDescription: "9 (1d10 + 3) piercing"
      },
      {
        name: "Heavy Crossbow",
        description: "Ranged Weapon Attack: +3 to hit, range 100/400, one target. Hit: 6 (1d10 + 1) piercing damage.",
        attackBonus: 3,
        damageDescription: "6 (1d10 + 1) piercing"
      },
      {
        name: "Leadership",
        description: "For 1 minute, the knight can utter a special command or warning whenever a friendly creature makes an attack roll or saving throw. The creature adds 1d4 to its attack roll or saving throw."
      }
    ]
  },
  {
    id: "cm-srd-drow",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Drow",
    size: "medium",
    type: "humanoid",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 0.25,
    experiencePoints: 50,
    ac: 15,
    acNote: "chain shirt",
    hp: 13,
    maxHp: 13,
    abilityScores: {
      strength: 10,
      dexterity: 14,
      constitution: 10,
      intelligence: 11,
      wisdom: 11,
      charisma: 12
    },
    skills: { Perception: 2, Stealth: 4 },
    senses: { darkvision: "120 ft.", "passive Perception": "12" },
    languages: ["Common", "Elvish", "Undercommon"],
    traits: [
      {
        name: "Fey Ancestry",
        description: "The drow has advantage on saving throws against being charmed, and magic can't put it to sleep."
      },
      {
        name: "Innate Spellcasting",
        description: "Innate spellcasting ability is Charisma (spell save DC 11). It can innately cast the following spells:\nAt will: dancing lights\n1/day each: darkness, faerie fire"
      },
      {
        name: "Sunlight Sensitivity",
        description: "While in sunlight, the drow has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
      }
    ],
    actions: [
      {
        name: "Shortsword",
        description: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        attackBonus: 4,
        damageDescription: "5 (1d6 + 2) piercing"
      },
      {
        name: "Hand Crossbow",
        description: "Ranged Weapon Attack: +4 to hit, range 30/120, one target. Hit: 5 (1d6 + 2) piercing damage, and the target must succeed on a DC 13 Constitution saving throw or be poisoned.",
        attackBonus: 4,
        damageDescription: "5 (1d6 + 2) piercing"
      }
    ]
  },
  {
    id: "cm-srd-zombie",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
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
      strength: 13,
      dexterity: 6,
      constitution: 16,
      intelligence: 3,
      wisdom: 6,
      charisma: 5
    },
    savingThrows: { wisdom: 0 },
    damageImmunities: ["poison"],
    conditionImmunities: ["frightened", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "8" },
    languages: ["understands the languages it knew in life but can't speak"],
    traits: [
      {
        name: "Undead Fortitude",
        description: "If damage reduces the zombie to 0 hit points, it must make a Constitution saving throw with a DC of 5 + the damage taken, unless the damage is radiant or from a critical hit. On a success, the zombie drops to 1 hit point instead."
      }
    ],
    actions: [
      {
        name: "Slam",
        description: "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) bludgeoning damage.",
        attackBonus: 3,
        damageDescription: "4 (1d6 + 1) bludgeoning"
      }
    ]
  },
  {
    id: "cm-srd-skeleton",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Skeleton",
    size: "medium",
    type: "undead",
    alignment: "Lawful Evil",
    speed: "30 ft.",
    challengeRating: 0.25,
    experiencePoints: 50,
    ac: 13,
    acNote: "armor scraps",
    hp: 13,
    maxHp: 13,
    abilityScores: {
      strength: 10,
      dexterity: 14,
      constitution: 15,
      intelligence: 6,
      wisdom: 8,
      charisma: 5
    },
    damageImmunities: ["poison"],
    conditionImmunities: ["exhaustion", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "9" },
    languages: ["understands all languages it knew in life but can't speak"],
    actions: [
      {
        name: "Shortsword",
        description: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        attackBonus: 4,
        damageDescription: "5 (1d6 + 2) piercing"
      },
      {
        name: "Shortbow",
        description: "Ranged Weapon Attack: +4 to hit, range 80/320, one target. Hit: 5 (1d6 + 2) piercing damage.",
        attackBonus: 4,
        damageDescription: "5 (1d6 + 2) piercing"
      }
    ]
  },
  {
    id: "cm-srd-wight",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Wight",
    size: "medium",
    type: "undead",
    alignment: "Neutral Evil",
    speed: "30 ft.",
    challengeRating: 3,
    experiencePoints: 700,
    ac: 14,
    acNote: "chain shirt",
    hp: 45,
    maxHp: 45,
    abilityScores: {
      strength: 16,
      dexterity: 14,
      constitution: 16,
      intelligence: 10,
      wisdom: 13,
      charisma: 15
    },
    skills: { Perception: 3, Stealth: 4 },
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["frightened", "poisoned"],
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["the languages it knew in life"],
    traits: [
      {
        name: "Sunlight Sensitivity",
        description: "While in sunlight, the wight has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The wight makes two attacks: one with its longsword and one with its longbow. It can use its Life Drain in place of either attack."
      },
      {
        name: "Longsword",
        description: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 3) slashing damage, or 9 (1d10 + 3) if used two-handed.",
        attackBonus: 5,
        damageDescription: "8 (1d8 + 3) slashing"
      },
      {
        name: "Longbow",
        description: "Ranged Weapon Attack: +4 to hit, range 150/600, one target. Hit: 6 (1d8 + 2) piercing damage.",
        attackBonus: 4,
        damageDescription: "6 (1d8 + 2) piercing"
      },
      {
        name: "Life Drain",
        description: "Melee Spell Attack: +4 to hit, reach 5 ft., one creature. Hit: 7 (2d6) necrotic damage. The target must succeed on a DC 14 Constitution saving throw or its hit point maximum is reduced by an amount equal to the damage taken. This reduction lasts until the target finishes a long rest. The target dies if this effect reduces its hit point maximum to 0."
      }
    ]
  },
  {
    id: "cm-srd-wraith",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
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
      strength: 6,
      dexterity: 16,
      constitution: 16,
      intelligence: 12,
      wisdom: 14,
      charisma: 15
    },
    damageResistances: ["acid", "cold", "fire", "lightning", "thunder"],
    damageImmunities: ["necrotic", "poison"],
    conditionImmunities: ["charmed", "exhaustion", "frightened", "grappled", "paralyzed", "poisoned", "prone", "restrained"],
    senses: { darkvision: "60 ft.", "passive Perception": "12" },
    languages: ["the languages it knew in life"],
    traits: [
      {
        name: "Incorporeal Movement",
        description: "The wraith can move through other creatures and objects as if they were difficult terrain. It takes 5 (1d10) force damage if it ends its turn inside an object."
      },
      {
        name: "Sunlight Sensitivity",
        description: "While in sunlight, the wraith has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
      }
    ],
    actions: [
      {
        name: "Life Drain",
        description: "Melee Spell Attack: +6 to hit, reach 5 ft., one creature. Hit: 21 (4d8 + 3) necrotic damage. The target must succeed on a DC 14 Constitution saving throw or its hit point maximum is reduced by an amount equal to the damage taken. This reduction lasts until the target finishes a long rest. The target dies if this effect reduces its hit point maximum to 0."
      },
      {
        name: "Create Specter",
        description: "The wraith targets a humanoid corpse within 10 feet. The corpse rises as a specter under the wraith's control."
      }
    ]
  },
  {
    id: "cm-srd-rakshasa",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Rakshasa",
    size: "medium",
    type: "fiend",
    alignment: "Lawful Evil",
    speed: "40 ft.",
    challengeRating: 13,
    experiencePoints: 10000,
    ac: 17,
    acNote: "natural armor",
    hp: 110,
    maxHp: 110,
    abilityScores: {
      strength: 14,
      dexterity: 17,
      constitution: 18,
      intelligence: 13,
      wisdom: 16,
      charisma: 20
    },
    savingThrows: { dexterity: 7, constitution: 8, wisdom: 7, charisma: 9 },
    skills: { Deception: 9, Insight: 7, Persuasion: 9 },
    damageImmunities: ["bludgeoning", "piercing", "slashing"],
    conditionImmunities: ["charmed", "frightened"],
    senses: { truesight: "60 ft.", "passive Perception": "13" },
    languages: ["Common", "Infernal"],
    traits: [
      {
        name: "Limited Magic Immunity",
        description: "The rakshasa can't be affected or detected by spells of 6th level or lower unless it wishes to be. It has advantage on saving throws against all other spells and magical effects."
      },
      {
        name: "Innate Spellcasting",
        description: "Innate spellcasting ability is Charisma (spell save DC 18, +9 to hit). It can innately cast the following spells:\nAt will: detect magic, disguise self, minor illusion\n3/day each: charm person, detect thoughts, suggestion\n1/day each: dominate person, fly, true seeing"
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The rakshasa makes two claw attacks."
      },
      {
        name: "Claw",
        description: "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 9 (2d6 + 3) slashing damage, and the target is cursed with rakshasa's curse for 1 minute (DC 17 Wisdom save ends; curse causes vulnerability to bludgeoning, piercing, and slashing damage from rakshasa's attacks).",
        attackBonus: 7,
        damageDescription: "9 (2d6 + 3) slashing"
      }
    ]
  },
  {
    id: "cm-srd-doppelganger",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Doppelganger",
    size: "medium",
    type: "monstrosity",
    alignment: "Neutral",
    speed: "30 ft.",
    challengeRating: 3,
    experiencePoints: 700,
    ac: 14,
    acNote: "natural armor",
    hp: 52,
    maxHp: 52,
    abilityScores: {
      strength: 11,
      dexterity: 18,
      constitution: 14,
      intelligence: 11,
      wisdom: 12,
      charisma: 14
    },
    skills: { Deception: 6, Insight: 3, Perception: 3 },
    conditionImmunities: ["charmed"],
    senses: { darkvision: "60 ft.", "passive Perception": "13" },
    languages: ["Common"],
    traits: [
      {
        name: "Shapechanger",
        description: "The doppelganger can use its action to polymorph into a Small or Medium humanoid it has seen, or back into its true form. Its statistics, other than its size, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        name: "Ambusher",
        description: "The doppelganger has advantage on attack rolls against any creature it has surprised."
      }
    ],
    actions: [
      {
        name: "Multiattack",
        description: "The doppelganger makes two attacks."
      },
      {
        name: "Slam",
        description: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 7 (1d6 + 4) bludgeoning damage.",
        attackBonus: 6,
        damageDescription: "7 (1d6 + 4) bludgeoning"
      }
    ]
  },
  {
    id: "cm-srd-mage",
    userId: GLOBAL_USER_ID,
    isGlobal: true,
    source: "G3 SRD Embed",
    name: "Mage",
    size: "medium",
    type: "humanoid",
    alignment: "Any Alignment",
    speed: "30 ft.",
    challengeRating: 6,
    experiencePoints: 2300,
    ac: 12,
    acNote: "15 with mage armor",
    hp: 40,
    maxHp: 40,
    abilityScores: {
      strength: 9,
      dexterity: 14,
      constitution: 11,
      intelligence: 17,
      wisdom: 12,
      charisma: 11
    },
    savingThrows: { intelligence: 6, wisdom: 4 },
    skills: { Arcana: 6, History: 6 },
    senses: { "passive Perception": "11" },
    languages: ["any four languages"],
    traits: [
      {
        name: "Spellcasting",
        description: "The mage is a 9th-level spellcaster (Intelligence-based, spell save DC 14, +6 to hit).\nCantrips (at will): fire bolt, light, mage hand, prestidigitation\n1st level (4 slots): detect magic, mage armor, magic missile, shield\n2nd level (3 slots): misty step, suggestion\n3rd level (3 slots): counterspell, fireball, fly\n4th level (3 slots): greater invisibility, ice storm\n5th level (1 slot): cone of cold"
      }
    ],
    actions: [
      {
        name: "Dagger",
        description: "Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 20/60, one target. Hit: 4 (1d4 + 2) piercing damage.",
        attackBonus: 5,
        damageDescription: "4 (1d4 + 2) piercing"
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

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

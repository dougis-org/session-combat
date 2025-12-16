/**
 * Monstrosity-type monsters from D&D 5e SRD
 * Auto-generated from D&D 5e API
 */

import { MonsterTemplate } from "../../types";

export const MONSTROSITIES: Omit<
  MonsterTemplate,
  "id" | "userId" | "createdAt" | "updatedAt" | "_id"
>[] = [
  {
    "name": "Androsphinx",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "lawful neutral",
    "ac": 17,
    "armorType": "natural",
    "hp": 199,
    "hitDice": "19d10",
    "speed": {
      "walk": "40 ft.",
      "fly": "60 ft."
    },
    "abilities": {
      "strength": 22,
      "dexterity": 10,
      "constitution": 20,
      "intelligence": 16,
      "wisdom": 18,
      "charisma": 23
    },
    "savingThrows": {
      "dex": 6,
      "con": 11,
      "int": 9,
      "wis": 10
    },
    "skills": {
      "arcana": 9,
      "perception": 10,
      "religion": 15
    },
    "damageImmunities": [
      "psychic",
      "bludgeoning, piercing, and slashing from nonmagical weapons"
    ],
    "conditionImmunities": [
      "Charmed",
      "Frightened"
    ],
    "senses": "truesight 120 ft., passive_perception 20",
    "languages": [
      "Common",
      "Sphinx"
    ],
    "challengeRating": 17,
    "experiencePoints": 18000,
    "source": "SRD",
    "traits": [
      {
        "name": "Inscrutable",
        "description": "The sphinx is immune to any effect that would sense its emotions or read its thoughts, as well as any divination spell that it refuses. Wisdom (Insight) checks made to ascertain the sphinx's intentions or sincerity have disadvantage."
      },
      {
        "name": "Magic Weapons",
        "description": "The sphinx's weapon attacks are magical."
      },
      {
        "name": "Spellcasting",
        "description": "The sphinx is a 12th-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 18, +10 to hit with spell attacks). It requires no material components to cast its spells. The sphinx has the following cleric spells prepared:\n\n- Cantrips (at will): sacred flame, spare the dying, thaumaturgy\n- 1st level (4 slots): command, detect evil and good, detect magic\n- 2nd level (3 slots): lesser restoration, zone of truth\n- 3rd level (3 slots): dispel magic, tongues\n- 4th level (3 slots): banishment, freedom of movement\n- 5th level (2 slots): flame strike, greater restoration\n- 6th level (1 slot): heroes' feast"
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The sphinx makes two claw attacks."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +12 to hit, reach 5 ft., one target. Hit: 17 (2d10 + 6) slashing damage.",
        "attackBonus": 12,
        "damageDescription": "2d10+6 Slashing"
      },
      {
        "name": "Roar",
        "description": "The sphinx emits a magical roar. Each time it roars before finishing a long rest, the roar is louder and the effect is different, as detailed below. Each creature within 500 feet of the sphinx and able to hear the roar must make a saving throw.\n\nFirst Roar. Each creature that fails a DC 18 Wisdom saving throw is frightened for 1 minute. A frightened creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.\n\nSecond Roar. Each creature that fails a DC 18 Wisdom saving throw is deafened and frightened for 1 minute. A frightened creature is paralyzed and can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.\n\nThird Roar. Each creature makes a DC 18 Constitution saving throw. On a failed save, a creature takes 44 (8d10) thunder damage and is knocked prone. On a successful save, the creature takes half as much damage and isn't knocked prone."
      }
    ],
    "legendaryActions": [
      {
        "name": "Claw Attack",
        "description": "The sphinx makes one claw attack."
      },
      {
        "name": "Teleport (Costs 2 Actions)",
        "description": "The sphinx magically teleports, along with any equipment it is wearing or carrying, up to 120 feet to an unoccupied space it can see."
      },
      {
        "name": "Cast a Spell (Costs 3 Actions)",
        "description": "The sphinx casts a spell from its list of prepared spells, using a spell slot as normal."
      }
    ]
  },
  {
    "name": "Ankheg",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 14,
    "armorType": "natural",
    "hp": 39,
    "hitDice": "6d10",
    "speed": {
      "walk": "30 ft.",
      "burrow": "10 ft."
    },
    "abilities": {
      "strength": 17,
      "dexterity": 11,
      "constitution": 13,
      "intelligence": 1,
      "wisdom": 13,
      "charisma": 6
    },
    "senses": "darkvision 60 ft., tremorsense 60 ft., passive_perception 11",
    "challengeRating": 2,
    "experiencePoints": 250,
    "source": "SRD",
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) slashing damage plus 3 (1d6) acid damage. If the target is a Large or smaller creature, it is grappled (escape DC 13). Until this grapple ends, the ankheg can bite only the grappled creature and has advantage on attack rolls to do so.",
        "attackBonus": 5,
        "damageDescription": "2d6+3 Slashing"
      },
      {
        "name": "Acid Spray",
        "description": "The ankheg spits acid in a line that is 30 ft. long and 5 ft. wide, provided that it has no creature grappled. Each creature in that line must make a DC 13 Dexterity saving throw, taking 10 (3d6) acid damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "3d6 Acid",
        "saveDC": 13,
        "saveType": "DEX"
      }
    ]
  },
  {
    "name": "Basilisk",
    "type": "monstrosity",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "natural",
    "hp": 52,
    "hitDice": "8d8",
    "speed": {
      "walk": "20 ft."
    },
    "abilities": {
      "strength": 16,
      "dexterity": 8,
      "constitution": 15,
      "intelligence": 2,
      "wisdom": 8,
      "charisma": 7
    },
    "senses": "darkvision 60 ft., passive_perception 9",
    "challengeRating": 3,
    "experiencePoints": 700,
    "source": "SRD",
    "traits": [
      {
        "name": "Petrifying Gaze",
        "description": "If a creature starts its turn within 30 ft. of the basilisk and the two of them can see each other, the basilisk can force the creature to make a DC 12 Constitution saving throw if the basilisk isn't incapacitated. On a failed save, the creature magically begins to turn to stone and is restrained. It must repeat the saving throw at the end of its next turn. On a success, the effect ends. On a failure, the creature is petrified until freed by the greater restoration spell or other magic.\nA creature that isn't surprised can avert its eyes to avoid the saving throw at the start of its turn. If it does so, it can't see the basilisk until the start of its next turn, when it can avert its eyes again. If it looks at the basilisk in the meantime, it must immediately make the save.\nIf the basilisk sees its reflection within 30 ft. of it in bright light, it mistakes itself for a rival and targets itself with its gaze.",
        "saveDC": 12,
        "saveType": "CON"
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) piercing damage plus 7 (2d6) poison damage.",
        "attackBonus": 5,
        "damageDescription": "2d6+3 Piercing"
      }
    ]
  },
  {
    "name": "Behir",
    "type": "monstrosity",
    "size": "Huge",
    "alignment": "neutral evil",
    "ac": 17,
    "armorType": "natural",
    "hp": 168,
    "hitDice": "16d12",
    "speed": {
      "walk": "50 ft.",
      "climb": "40 ft."
    },
    "abilities": {
      "strength": 23,
      "dexterity": 16,
      "constitution": 18,
      "intelligence": 7,
      "wisdom": 14,
      "charisma": 12
    },
    "skills": {
      "perception": 6,
      "stealth": 7
    },
    "damageImmunities": [
      "lightning"
    ],
    "senses": "darkvision 90 ft., passive_perception 16",
    "languages": [
      "Draconic"
    ],
    "challengeRating": 11,
    "experiencePoints": 7200,
    "source": "SRD",
    "actions": [
      {
        "name": "Multiattack",
        "description": "The behir makes two attacks: one with its bite and one to constrict."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 22 (3d10 + 6) piercing damage.",
        "attackBonus": 10,
        "damageDescription": "3d10+6 Piercing"
      },
      {
        "name": "Constrict",
        "description": "Melee Weapon Attack: +10 to hit, reach 5 ft., one Large or smaller creature. Hit: 17 (2d10 + 6) bludgeoning damage plus 17 (2d10 + 6) slashing damage. The target is grappled (escape DC 16) if the behir isn't already constricting a creature, and the target is restrained until this grapple ends.",
        "attackBonus": 10,
        "damageDescription": "2d10+6 Bludgeoning"
      },
      {
        "name": "Lightning Breath",
        "description": "The behir exhales a line of lightning that is 20 ft. long and 5 ft. wide. Each creature in that line must make a DC 16 Dexterity saving throw, taking 66 (12d10) lightning damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "12d10 Lightning",
        "saveDC": 16,
        "saveType": "DEX"
      },
      {
        "name": "Swallow",
        "description": "The behir makes one bite attack against a Medium or smaller target it is grappling. If the attack hits, the target is also swallowed, and the grapple ends. While swallowed, the target is blinded and restrained, it has total cover against attacks and other effects outside the behir, and it takes 21 (6d6) acid damage at the start of each of the behir's turns. A behir can have only one creature swallowed at a time.\nIf the behir takes 30 damage or more on a single turn from the swallowed creature, the behir must succeed on a DC 14 Constitution saving throw at the end of that turn or regurgitate the creature, which falls prone in a space within 10 ft. of the behir. If the behir dies, a swallowed creature is no longer restrained by it and can escape from the corpse by using 15 ft. of movement, exiting prone.",
        "damageDescription": "6d6 Acid"
      }
    ]
  },
  {
    "name": "Bulette",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 17,
    "armorType": "natural",
    "hp": 94,
    "hitDice": "9d10",
    "speed": {
      "walk": "40 ft.",
      "burrow": "40 ft."
    },
    "abilities": {
      "strength": 19,
      "dexterity": 11,
      "constitution": 21,
      "intelligence": 2,
      "wisdom": 10,
      "charisma": 5
    },
    "skills": {
      "perception": 6
    },
    "senses": "darkvision 60 ft., tremorsense 60 ft., passive_perception 16",
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "traits": [
      {
        "name": "Standing Leap",
        "description": "The bulette's long jump is up to 30 ft. and its high jump is up to 15 ft., with or without a running start."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 30 (4d12 + 4) piercing damage.",
        "attackBonus": 7,
        "damageDescription": "4d12+4 Piercing"
      },
      {
        "name": "Deadly Leap",
        "description": "If the bulette jumps at least 15 ft. as part of its movement, it can then use this action to land on its feet in a space that contains one or more other creatures. Each of those creatures must succeed on a DC 16 Strength or Dexterity saving throw (target's choice) or be knocked prone and take 14 (3d6 + 4) bludgeoning damage plus 14 (3d6 + 4) slashing damage. On a successful save, the creature takes only half the damage, isn't knocked prone, and is pushed 5 ft. out of the bulette's space into an unoccupied space of the creature's choice. If no unoccupied space is within range, the creature instead falls prone in the bulette's space."
      }
    ]
  },
  {
    "name": "Centaur",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "neutral good",
    "ac": 12,
    "armorType": "dex",
    "hp": 45,
    "hitDice": "6d10",
    "speed": {
      "walk": "50 ft."
    },
    "abilities": {
      "strength": 18,
      "dexterity": 14,
      "constitution": 14,
      "intelligence": 9,
      "wisdom": 13,
      "charisma": 11
    },
    "skills": {
      "athletics": 6,
      "perception": 3,
      "survival": 3
    },
    "senses": "passive_perception 13",
    "languages": [
      "Elvish",
      "Sylvan"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Charge",
        "description": "If the centaur moves at least 30 ft. straight toward a target and then hits it with a pike attack on the same turn, the target takes an extra 10 (3d6) piercing damage."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The centaur makes two attacks: one with its pike and one with its hooves or two with its longbow."
      },
      {
        "name": "Pike",
        "description": "Melee Weapon Attack: +6 to hit, reach 10 ft., one target. Hit: 9 (1d10 + 4) piercing damage.",
        "attackBonus": 6,
        "damageDescription": "1d10+4 Piercing"
      },
      {
        "name": "Hooves",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) bludgeoning damage.",
        "attackBonus": 6,
        "damageDescription": "2d6+4 Bludgeoning"
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
    "name": "Chimera",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "chaotic evil",
    "ac": 14,
    "armorType": "natural",
    "hp": 114,
    "hitDice": "12d10",
    "speed": {
      "walk": "30 ft.",
      "fly": "60 ft."
    },
    "abilities": {
      "strength": 19,
      "dexterity": 11,
      "constitution": 19,
      "intelligence": 3,
      "wisdom": 14,
      "charisma": 10
    },
    "skills": {
      "perception": 8
    },
    "senses": "darkvision 60 ft., passive_perception 18",
    "languages": [
      "understands Draconic but can't speak"
    ],
    "challengeRating": 6,
    "experiencePoints": 2300,
    "source": "SRD",
    "actions": [
      {
        "name": "Multiattack",
        "description": "The chimera makes three attacks: one with its bite, one with its horns, and one with its claws. When its fire breath is available, it can use the breath in place of its bite or horns."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) piercing damage.",
        "attackBonus": 7,
        "damageDescription": "2d6+4 Piercing"
      },
      {
        "name": "Horns",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 10 (1d12 + 4) bludgeoning damage.",
        "attackBonus": 7,
        "damageDescription": "1d12+4 Bludgeoning"
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage.",
        "attackBonus": 7,
        "damageDescription": "2d6+4 Slashing"
      },
      {
        "name": "Fire Breath",
        "description": "The dragon head exhales fire in a 15-foot cone. Each creature in that area must make a DC 15 Dexterity saving throw, taking 31 (7d8) fire damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "7d8 Fire",
        "saveDC": 15,
        "saveType": "DEX"
      }
    ]
  },
  {
    "name": "Cockatrice",
    "type": "monstrosity",
    "size": "Small",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "dex",
    "hp": 27,
    "hitDice": "6d6",
    "speed": {
      "walk": "20 ft.",
      "fly": "40 ft."
    },
    "abilities": {
      "strength": 6,
      "dexterity": 12,
      "constitution": 12,
      "intelligence": 2,
      "wisdom": 13,
      "charisma": 5
    },
    "senses": "darkvision 60 ft., passive_perception 11",
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one creature. Hit: 3 (1d4 + 1) piercing damage, and the target must succeed on a DC 11 Constitution saving throw against being magically petrified. On a failed save, the creature begins to turn to stone and is restrained. It must repeat the saving throw at the end of its next turn. On a success, the effect ends. On a failure, the creature is petrified for 24 hours.",
        "attackBonus": 3,
        "damageDescription": "1d4+1 Piercing"
      }
    ]
  },
  {
    "name": "Darkmantle",
    "type": "monstrosity",
    "size": "Small",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "dex",
    "hp": 22,
    "hitDice": "5d6",
    "speed": {
      "walk": "10 ft.",
      "fly": "30 ft."
    },
    "abilities": {
      "strength": 16,
      "dexterity": 12,
      "constitution": 13,
      "intelligence": 2,
      "wisdom": 10,
      "charisma": 5
    },
    "skills": {
      "stealth": 3
    },
    "senses": "blindsight 60 ft., passive_perception 10",
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Echolocation",
        "description": "The darkmantle can't use its blindsight while deafened."
      },
      {
        "name": "False Appearance",
        "description": "While the darkmantle remains motionless, it is indistinguishable from a cave formation such as a stalactite or stalagmite."
      }
    ],
    "actions": [
      {
        "name": "Crush",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one creature. Hit: 6 (1d6 + 3) bludgeoning damage, and the darkmantle attaches to the target. If the target is Medium or smaller and the darkmantle has advantage on the attack roll, it attaches by engulfing the target's head, and the target is also blinded and unable to breathe while the darkmantle is attached in this way.\nWhile attached to the target, the darkmantle can attack no other creature except the target but has advantage on its attack rolls. The darkmantle's speed also becomes 0, it can't benefit from any bonus to its speed, and it moves with the target.\nA creature can detach the darkmantle by making a successful DC 13 Strength check as an action. On its turn, the darkmantle can detach itself from the target by using 5 feet of movement.",
        "attackBonus": 5,
        "damageDescription": "1d6+3 Bludgeoning"
      },
      {
        "name": "Darkness Aura",
        "description": "A 15-foot radius of magical darkness extends out from the darkmantle, moves with it, and spreads around corners. The darkness lasts as long as the darkmantle maintains concentration, up to 10 minutes (as if concentrating on a spell). Darkvision can't penetrate this darkness, and no natural light can illuminate it. If any of the darkness overlaps with an area of light created by a spell of 2nd level or lower, the spell creating the light is dispelled."
      }
    ]
  },
  {
    "name": "Death Dog",
    "type": "monstrosity",
    "size": "Medium",
    "alignment": "neutral evil",
    "ac": 12,
    "armorType": "dex",
    "hp": 39,
    "hitDice": "6d8",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 14,
      "constitution": 14,
      "intelligence": 3,
      "wisdom": 13,
      "charisma": 6
    },
    "skills": {
      "perception": 5,
      "stealth": 4
    },
    "senses": "darkvision 120 ft., passive_perception 15",
    "challengeRating": 1,
    "experiencePoints": 200,
    "source": "SRD",
    "traits": [
      {
        "name": "Two-Headed",
        "description": "The dog has advantage on Wisdom (Perception) checks and on saving throws against being blinded, charmed, deafened, frightened, stunned, or knocked unconscious."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dog makes two bite attacks."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage. If the target is a creature, it must succeed on a DC 12 Constitution saving throw against disease or become poisoned until the disease is cured. Every 24 hours that elapse, the creature must repeat the saving throw, reducing its hit point maximum by 5 (1d10) on a failure. This reduction lasts until the disease is cured. The creature dies if the disease reduces its hit point maximum to 0.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Bludgeoning"
      }
    ]
  },
  {
    "name": "Doppelganger",
    "type": "monstrosity",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 14,
    "armorType": "dex",
    "hp": 52,
    "hitDice": "8d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 11,
      "dexterity": 18,
      "constitution": 14,
      "intelligence": 11,
      "wisdom": 12,
      "charisma": 14
    },
    "skills": {
      "deception": 6,
      "insight": 3
    },
    "conditionImmunities": [
      "Charmed"
    ],
    "senses": "darkvision 60 ft., passive_perception 11",
    "languages": [
      "Common"
    ],
    "challengeRating": 3,
    "experiencePoints": 700,
    "source": "SRD",
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The doppelganger can use its action to polymorph into a Small or Medium humanoid it has seen, or back into its true form. Its statistics, other than its size, are the same in each form. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Ambusher",
        "description": "In the first round of combat, the doppelganger has advantage on attack rolls against any creature it has surprised."
      },
      {
        "name": "Surprise Attack",
        "description": "If the doppelganger surprises a creature and hits it with an attack during the first round of combat, the target takes an extra 10 (3d6) damage from the attack."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The doppelganger makes two melee attacks."
      },
      {
        "name": "Slam",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 7 (1d6 + 4) bludgeoning damage.",
        "attackBonus": 6,
        "damageDescription": "1d6+4 Bludgeoning"
      },
      {
        "name": "Read Thoughts",
        "description": "The doppelganger magically reads the surface thoughts of one creature within 60 ft. of it. The effect can penetrate barriers, but 3 ft. of wood or dirt, 2 ft. of stone, 2 inches of metal, or a thin sheet of lead blocks it. While the target is in range, the doppelganger can continue reading its thoughts, as long as the doppelganger's concentration isn't broken (as if concentrating on a spell). While reading the target's mind, the doppelganger has advantage on Wisdom (Insight) and Charisma (Deception, Intimidation, and Persuasion) checks against the target."
      }
    ]
  },
  {
    "name": "Drider",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "chaotic evil",
    "ac": 19,
    "armorType": "natural",
    "hp": 123,
    "hitDice": "13d10",
    "speed": {
      "walk": "30 ft.",
      "climb": "30 ft."
    },
    "abilities": {
      "strength": 16,
      "dexterity": 16,
      "constitution": 18,
      "intelligence": 13,
      "wisdom": 14,
      "charisma": 12
    },
    "skills": {
      "perception": 5,
      "stealth": 9
    },
    "senses": "darkvision 120 ft., passive_perception 15",
    "languages": [
      "Elvish",
      "Undercommon"
    ],
    "challengeRating": 6,
    "experiencePoints": 2300,
    "source": "SRD",
    "traits": [
      {
        "name": "Fey Ancestry",
        "description": "The drider has advantage on saving throws against being charmed, and magic can't put the drider to sleep."
      },
      {
        "name": "Innate Spellcasting",
        "description": "The drider's innate spellcasting ability is Wisdom (spell save DC 13). The drider can innately cast the following spells, requiring no material components:\nAt will: dancing lights\n1/day each: darkness, faerie fire"
      },
      {
        "name": "Spider Climb",
        "description": "The drider can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      },
      {
        "name": "Sunlight Sensitivity",
        "description": "While in sunlight, the drider has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
      },
      {
        "name": "Web Walker",
        "description": "The drider ignores movement restrictions caused by webbing."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The drider makes three attacks, either with its longsword or its longbow. It can replace one of those attacks with a bite attack."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one creature. Hit: 2 (1d4) piercing damage plus 9 (2d8) poison damage.",
        "attackBonus": 6,
        "damageDescription": "1d4 Piercing"
      },
      {
        "name": "Longsword",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) slashing damage, or 8 (1d10 + 3) slashing damage if used with two hands.",
        "attackBonus": 6,
        "damageDescription": "undefined"
      },
      {
        "name": "Longbow",
        "description": "Ranged Weapon Attack: +6 to hit, range 150/600 ft., one target. Hit: 7 (1d8 + 3) piercing damage plus 4 (1d8) poison damage.",
        "attackBonus": 6,
        "damageDescription": "1d8+3 Piercing"
      }
    ]
  },
  {
    "name": "Ettercap",
    "type": "monstrosity",
    "size": "Medium",
    "alignment": "neutral evil",
    "ac": 13,
    "armorType": "natural",
    "hp": 44,
    "hitDice": "8d8",
    "speed": {
      "walk": "30 ft.",
      "climb": "30 ft."
    },
    "abilities": {
      "strength": 14,
      "dexterity": 15,
      "constitution": 13,
      "intelligence": 7,
      "wisdom": 12,
      "charisma": 8
    },
    "skills": {
      "perception": 3,
      "stealth": 4,
      "survival": 3
    },
    "senses": "darkvision 60 ft., passive_perception 13",
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Spider Climb",
        "description": "The ettercap can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      },
      {
        "name": "Web Sense",
        "description": "While in contact with a web, the ettercap knows the exact location of any other creature in contact with the same web."
      },
      {
        "name": "Web Walker",
        "description": "The ettercap ignores movement restrictions caused by webbing."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The ettercap makes two attacks: one with its bite and one with its claws."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 6 (1d8 + 2) piercing damage plus 4 (1d8) poison damage. The target must succeed on a DC 11 Constitution saving throw or be poisoned for 1 minute. The creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.",
        "attackBonus": 4,
        "damageDescription": "2d6+2 Piercing"
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) slashing damage.",
        "attackBonus": 4,
        "damageDescription": "2d4+2 Bludgeoning"
      },
      {
        "name": "Web",
        "description": "Ranged Weapon Attack: +4 to hit, range 30/60 ft., one Large or smaller creature. Hit: The creature is restrained by webbing. As an action, the restrained creature can make a DC 11 Strength check, escaping from the webbing on a success. The effect ends if the webbing is destroyed. The webbing has AC 10, 5 hit points, is vulnerable to fire damage and immune to bludgeoning damage.",
        "attackBonus": 4
      }
    ]
  },
  {
    "name": "Gorgon",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 19,
    "armorType": "natural",
    "hp": 114,
    "hitDice": "12d10",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 20,
      "dexterity": 11,
      "constitution": 18,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 7
    },
    "skills": {
      "perception": 4
    },
    "conditionImmunities": [
      "Petrified"
    ],
    "senses": "darkvision 60 ft., passive_perception 14",
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "traits": [
      {
        "name": "Trampling Charge",
        "description": "If the gorgon moves at least 20 feet straight toward a creature and then hits it with a gore attack on the same turn, that target must succeed on a DC 16 Strength saving throw or be knocked prone. If the target is prone, the gorgon can make one attack with its hooves against it as a bonus action."
      }
    ],
    "actions": [
      {
        "name": "Gore",
        "description": "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 18 (2d12 + 5) piercing damage.",
        "attackBonus": 8,
        "damageDescription": "2d12+5 Piercing"
      },
      {
        "name": "Hooves",
        "description": "Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 16 (2d10 + 5) bludgeoning damage.",
        "attackBonus": 8,
        "damageDescription": "2d10+5 Bludgeoning"
      },
      {
        "name": "Petrifying Breath",
        "description": "The gorgon exhales petrifying gas in a 30-foot cone. Each creature in that area must succeed on a DC 13 Constitution saving throw. On a failed save, a target begins to turn to stone and is restrained. The restrained target must repeat the saving throw at the end of its next turn. On a success, the effect ends on the target. On a failure, the target is petrified until freed by the greater restoration spell or other magic.",
        "saveDC": 13,
        "saveType": "CON"
      }
    ]
  },
  {
    "name": "Grick",
    "type": "monstrosity",
    "size": "Medium",
    "alignment": "neutral",
    "ac": 14,
    "armorType": "natural",
    "hp": 27,
    "hitDice": "6d8",
    "speed": {
      "walk": "30 ft.",
      "climb": "30 ft."
    },
    "abilities": {
      "strength": 14,
      "dexterity": 14,
      "constitution": 11,
      "intelligence": 3,
      "wisdom": 14,
      "charisma": 5
    },
    "damageResistances": [
      "bludgeoning, piercing, and slashing from nonmagical weapons"
    ],
    "senses": "darkvision 60 ft., passive_perception 12",
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Stone Camouflage",
        "description": "The grick has advantage on Dexterity (Stealth) checks made to hide in rocky terrain."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The grick makes one attack with its tentacles. If that attack hits, the grick can make one beak attack against the same target."
      },
      {
        "name": "Tentacles",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 9 (2d6 + 2) slashing damage.",
        "attackBonus": 4,
        "damageDescription": "2d6+2 Slashing"
      },
      {
        "name": "Beak",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 4,
        "damageDescription": "1d6+2 Piercing"
      }
    ]
  },
  {
    "name": "Griffon",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 12,
    "armorType": "dex",
    "hp": 59,
    "hitDice": "7d10",
    "speed": {
      "walk": "30 ft.",
      "fly": "80 ft."
    },
    "abilities": {
      "strength": 18,
      "dexterity": 15,
      "constitution": 16,
      "intelligence": 2,
      "wisdom": 13,
      "charisma": 8
    },
    "skills": {
      "perception": 5
    },
    "senses": "darkvision 60 ft., passive_perception 15",
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Sight",
        "description": "The griffon has advantage on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The griffon makes two attacks: one with its beak and one with its claws."
      },
      {
        "name": "Beak",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) piercing damage.",
        "attackBonus": 6,
        "damageDescription": "1d8+4 Piercing"
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage.",
        "attackBonus": 6,
        "damageDescription": "2d6+4 Slashing"
      }
    ]
  },
  {
    "name": "Guardian Naga",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "lawful good",
    "ac": 18,
    "armorType": "natural",
    "hp": 127,
    "hitDice": "15d10",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 19,
      "dexterity": 18,
      "constitution": 16,
      "intelligence": 16,
      "wisdom": 19,
      "charisma": 18
    },
    "savingThrows": {
      "dex": 8,
      "con": 7,
      "int": 7,
      "wis": 8,
      "cha": 8
    },
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "Charmed",
      "Poisoned"
    ],
    "senses": "darkvision 60 ft., passive_perception 14",
    "languages": [
      "Celestial",
      "Common"
    ],
    "challengeRating": 10,
    "experiencePoints": 5900,
    "source": "SRD",
    "traits": [
      {
        "name": "Rejuvenation",
        "description": "If it dies, the naga returns to life in 1d6 days and regains all its hit points. Only a wish spell can prevent this trait from functioning."
      },
      {
        "name": "Spellcasting",
        "description": "The naga is an 11th-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 16, +8 to hit with spell attacks), and it needs only verbal components to cast its spells. It has the following cleric spells prepared:\n\n- Cantrips (at will): mending, sacred flame, thaumaturgy\n- 1st level (4 slots): command, cure wounds, shield of faith\n- 2nd level (3 slots): calm emotions, hold person\n- 3rd level (3 slots): bestow curse, clairvoyance\n- 4th level (3 slots): banishment, freedom of movement\n- 5th level (2 slots): flame strike, geas\n- 6th level (1 slot): true seeing"
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +8 to hit, reach 10 ft., one creature. Hit: 8 (1d8 + 4) piercing damage, and the target must make a DC 15 Constitution saving throw, taking 45 (10d8) poison damage on a failed save, or half as much damage on a successful one.",
        "attackBonus": 8,
        "damageDescription": "1d8+4 Piercing"
      },
      {
        "name": "Spit Poison",
        "description": "Ranged Weapon Attack: +8 to hit, range 15/30 ft., one creature. Hit: The target must make a DC 15 Constitution saving throw, taking 45 (10d8) poison damage on a failed save, or half as much damage on a successful one.",
        "attackBonus": 8
      }
    ]
  },
  {
    "name": "Gynosphinx",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "lawful neutral",
    "ac": 17,
    "armorType": "natural",
    "hp": 136,
    "hitDice": "16d10",
    "speed": {
      "walk": "40 ft.",
      "fly": "60 ft."
    },
    "abilities": {
      "strength": 18,
      "dexterity": 15,
      "constitution": 16,
      "intelligence": 18,
      "wisdom": 18,
      "charisma": 18
    },
    "skills": {
      "arcana": 12,
      "history": 12,
      "perception": 8,
      "religion": 8
    },
    "damageResistances": [
      "bludgeoning, piercing, and slashing from nonmagical weapons"
    ],
    "damageImmunities": [
      "psychic"
    ],
    "conditionImmunities": [
      "Charmed",
      "Frightened"
    ],
    "senses": "truesight 120 ft., passive_perception 18",
    "languages": [
      "Common",
      "Sphinx"
    ],
    "challengeRating": 11,
    "experiencePoints": 7200,
    "source": "SRD",
    "traits": [
      {
        "name": "Inscrutable",
        "description": "The sphinx is immune to any effect that would sense its emotions or read its thoughts, as well as any divination spell that it refuses. Wisdom (Insight) checks made to ascertain the sphinx's intentions or sincerity have disadvantage."
      },
      {
        "name": "Magic Weapons",
        "description": "The sphinx's weapon attacks are magical."
      },
      {
        "name": "Spellcasting",
        "description": "The sphinx is a 9th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 16, +8 to hit with spell attacks). It requires no material components to cast its spells. The sphinx has the following wizard spells prepared:\n\n- Cantrips (at will): mage hand, minor illusion, prestidigitation\n- 1st level (4 slots): detect magic, identify, shield\n- 2nd level (3 slots): darkness, locate object, suggestion\n- 3rd level (3 slots): dispel magic, remove curse, tongues\n- 4th level (3 slots): banishment, greater invisibility\n- 5th level (1 slot): legend lore"
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The sphinx makes two claw attacks."
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +9 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) slashing damage.",
        "attackBonus": 9,
        "damageDescription": "2d8+4 Slashing"
      }
    ],
    "legendaryActions": [
      {
        "name": "Claw Attack",
        "description": "The sphinx makes one claw attack."
      },
      {
        "name": "Teleport (Costs 2 Actions)",
        "description": "The sphinx magically teleports, along with any equipment it is wearing or carrying, up to 120 feet to an unoccupied space it can see."
      },
      {
        "name": "Cast a Spell (Costs 3 Actions)",
        "description": "The sphinx casts a spell from its list of prepared spells, using a spell slot as normal."
      }
    ]
  },
  {
    "name": "Harpy",
    "type": "monstrosity",
    "size": "Medium",
    "alignment": "chaotic evil",
    "ac": 11,
    "armorType": "dex",
    "hp": 38,
    "hitDice": "7d8",
    "speed": {
      "walk": "20 ft.",
      "fly": "40 ft."
    },
    "abilities": {
      "strength": 12,
      "dexterity": 13,
      "constitution": 12,
      "intelligence": 7,
      "wisdom": 10,
      "charisma": 13
    },
    "senses": "passive_perception 10",
    "languages": [
      "Common"
    ],
    "challengeRating": 1,
    "experiencePoints": 200,
    "source": "SRD",
    "actions": [
      {
        "name": "Multiattack",
        "description": "The harpy makes two attacks: one with its claws and one with its club."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 6 (2d4 + 1) slashing damage.",
        "attackBonus": 3,
        "damageDescription": "2d4+1 Slashing"
      },
      {
        "name": "Club",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 3 (1d4 + 1) bludgeoning damage.",
        "attackBonus": 3,
        "damageDescription": "1d4+1 Bludgeoning"
      },
      {
        "name": "Luring Song",
        "description": "The harpy sings a magical melody. Every humanoid and giant within 300 ft. of the harpy that can hear the song must succeed on a DC 11 Wisdom saving throw or be charmed until the song ends. The harpy must take a bonus action on its subsequent turns to continue singing. It can stop singing at any time. The song ends if the harpy is incapacitated.\nWhile charmed by the harpy, a target is incapacitated and ignores the songs of other harpies. If the charmed target is more than 5 ft. away from the harpy, the must move on its turn toward the harpy by the most direct route. It doesn't avoid opportunity attacks, but before moving into damaging terrain, such as lava or a pit, and whenever it takes damage from a source other than the harpy, a target can repeat the saving throw. A creature can also repeat the saving throw at the end of each of its turns. If a creature's saving throw is successful, the effect ends on it.\nA target that successfully saves is immune to this harpy's song for the next 24 hours."
      }
    ]
  },
  {
    "name": "Hippogriff",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 11,
    "armorType": "dex",
    "hp": 19,
    "hitDice": "3d10",
    "speed": {
      "walk": "40 ft.",
      "fly": "60 ft."
    },
    "abilities": {
      "strength": 17,
      "dexterity": 13,
      "constitution": 13,
      "intelligence": 2,
      "wisdom": 12,
      "charisma": 8
    },
    "skills": {
      "perception": 5
    },
    "senses": "passive_perception 15",
    "challengeRating": 1,
    "experiencePoints": 200,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Sight",
        "description": "The hippogriff has advantage on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The hippogriff makes two attacks: one with its beak and one with its claws."
      },
      {
        "name": "Beak",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (1d10 + 3) piercing damage.",
        "attackBonus": 5,
        "damageDescription": "1d10+3 Piercing"
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) slashing damage.",
        "attackBonus": 5,
        "damageDescription": "2d6+3 Slashing"
      }
    ]
  },
  {
    "name": "Hydra",
    "type": "monstrosity",
    "size": "Huge",
    "alignment": "unaligned",
    "ac": 15,
    "armorType": "natural",
    "hp": 172,
    "hitDice": "15d12",
    "speed": {
      "walk": "30 ft.",
      "swim": "30 ft."
    },
    "abilities": {
      "strength": 20,
      "dexterity": 12,
      "constitution": 20,
      "intelligence": 2,
      "wisdom": 10,
      "charisma": 7
    },
    "skills": {
      "perception": 6
    },
    "senses": "darkvision 60 ft., passive_perception 16",
    "challengeRating": 8,
    "experiencePoints": 3900,
    "source": "SRD",
    "traits": [
      {
        "name": "Hold Breath",
        "description": "The hydra can hold its breath for 1 hour."
      },
      {
        "name": "Multiple Heads",
        "description": "The hydra has five heads. While it has more than one head, the hydra has advantage on saving throws against being blinded, charmed, deafened, frightened, stunned, and knocked unconscious.\nWhenever the hydra takes 25 or more damage in a single turn, one of its heads dies. If all its heads die, the hydra dies.\nAt the end of its turn, it grows two heads for each of its heads that died since its last turn, unless it has taken fire damage since its last turn. The hydra regains 10 hit points for each head regrown in this way."
      },
      {
        "name": "Reactive Heads",
        "description": "For each head the hydra has beyond one, it gets an extra reaction that can be used only for opportunity attacks."
      },
      {
        "name": "Wakeful",
        "description": "While the hydra sleeps, at least one of its heads is awake."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The hydra makes as many bite attacks as it has heads."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +8 to hit, reach 10 ft., one target. Hit: 10 (1d10 + 5) piercing damage.",
        "attackBonus": 8,
        "damageDescription": "1d10+5 Piercing"
      }
    ]
  },
  {
    "name": "Kraken",
    "type": "monstrosity",
    "size": "Gargantuan",
    "alignment": "chaotic evil",
    "ac": 18,
    "armorType": "natural",
    "hp": 472,
    "hitDice": "27d20",
    "speed": {
      "walk": "20 ft.",
      "swim": "60 ft."
    },
    "abilities": {
      "strength": 30,
      "dexterity": 11,
      "constitution": 25,
      "intelligence": 22,
      "wisdom": 18,
      "charisma": 20
    },
    "savingThrows": {
      "str": 17,
      "dex": 7,
      "con": 14,
      "int": 13,
      "wis": 11
    },
    "damageImmunities": [
      "lightning",
      "bludgeoning, piercing, and slashing from nonmagical weapons"
    ],
    "conditionImmunities": [
      "Frightened",
      "Paralyzed"
    ],
    "senses": "truesight 120 ft., passive_perception 14",
    "languages": [
      "understands Abyssal",
      "Celestial",
      "Infernal",
      "and Primordial but can't speak",
      "telepathy 120 ft."
    ],
    "challengeRating": 23,
    "experiencePoints": 50000,
    "source": "SRD",
    "traits": [
      {
        "name": "Amphibious",
        "description": "The kraken can breathe air and water."
      },
      {
        "name": "Freedom of Movement",
        "description": "The kraken ignores difficult terrain, and magical effects can't reduce its speed or cause it to be restrained. It can spend 5 feet of movement to escape from nonmagical restraints or being grappled."
      },
      {
        "name": "Siege Monster",
        "description": "The kraken deals double damage to objects and structures."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The kraken makes three tentacle attacks, each of which it can replace with one use of Fling."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 23 (3d8 + 10) piercing damage. If the target is a Large or smaller creature grappled by the kraken, that creature is swallowed, and the grapple ends. While swallowed, the creature is blinded and restrained, it has total cover against attacks and other effects outside the kraken, and it takes 42 (12d6) acid damage at the start of each of the kraken's turns. If the kraken takes 50 damage or more on a single turn from a creature inside it, the kraken must succeed on a DC 25 Constitution saving throw at the end of that turn or regurgitate all swallowed creatures, which fall prone in a space within 10 feet of the kraken. If the kraken dies, a swallowed creature is no longer restrained by it and can escape from the corpse using 15 feet of movement, exiting prone.",
        "attackBonus": 7,
        "damageDescription": "3d8+10 Piercing"
      },
      {
        "name": "Tentacle",
        "description": "Melee Weapon Attack: +7 to hit, reach 30 ft., one target. Hit: 20 (3d6 + 10) bludgeoning damage, and the target is grappled (escape DC 18). Until this grapple ends, the target is restrained. The kraken has ten tentacles, each of which can grapple one target.",
        "attackBonus": 7,
        "damageDescription": "3d6+10 Bludgeoning"
      },
      {
        "name": "Fling",
        "description": "One Large or smaller object held or creature grappled by the kraken is thrown up to 60 feet in a random direction and knocked prone. If a thrown target strikes a solid surface, the target takes 3 (1d6) bludgeoning damage for every 10 feet it was thrown. If the target is thrown at another creature, that creature must succeed on a DC 18 Dexterity saving throw or take the same damage and be knocked prone."
      },
      {
        "name": "Lightning Storm",
        "description": "The kraken magically creates three bolts of lightning, each of which can strike a target the kraken can see within 120 feet of it. A target must make a DC 23 Dexterity saving throw, taking 22 (4d10) lightning damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "4d10 Lightning",
        "saveDC": 23,
        "saveType": "DEX"
      }
    ],
    "legendaryActions": [
      {
        "name": "Tentacle Attack or Fling",
        "description": "The kraken makes one tentacle attack or uses its Fling."
      },
      {
        "name": "Lightning Storm (Costs 2 Actions)",
        "description": "The kraken uses Lightning Storm."
      },
      {
        "name": "Ink Cloud (Costs 3 Actions)",
        "description": "While underwater, the kraken expels an ink cloud in a 60-foot radius. The cloud spreads around corners, and that area is heavily obscured to creatures other than the kraken. Each creature other than the kraken that ends its turn there must succeed on a DC 23 Constitution saving throw, taking 16 (3d10) poison damage on a failed save, or half as much damage on a successful one. A strong current disperses the cloud, which otherwise disappears at the end of the kraken's next turn."
      }
    ]
  },
  {
    "name": "Lamia",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "chaotic evil",
    "ac": 13,
    "armorType": "natural",
    "hp": 97,
    "hitDice": "13d10",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 16,
      "dexterity": 13,
      "constitution": 15,
      "intelligence": 14,
      "wisdom": 15,
      "charisma": 16
    },
    "skills": {
      "deception": 7,
      "insight": 4,
      "stealth": 3
    },
    "senses": "darkvision 60 ft., passive_perception 12",
    "languages": [
      "Abyssal",
      "Common"
    ],
    "challengeRating": 4,
    "experiencePoints": 1100,
    "source": "SRD",
    "traits": [
      {
        "name": "Innate Spellcasting",
        "description": "The lamia's innate spellcasting ability is Charisma (spell save DC 13). It can innately cast the following spells, requiring no material components. At will: disguise self (any humanoid form), major image 3/day each: charm person, mirror image, scrying, suggestion 1/day: geas"
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The lamia makes two attacks: one with its claws and one with its dagger or Intoxicating Touch."
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 14 (2d10 + 3) slashing damage.",
        "attackBonus": 5,
        "damageDescription": "2d10+3 Slashing"
      },
      {
        "name": "Dagger",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 5 (1d4 + 3) piercing damage.",
        "attackBonus": 5,
        "damageDescription": "1d4+3 Piercing"
      },
      {
        "name": "Intoxicating Touch",
        "description": "Melee Spell Attack: +5 to hit, reach 5 ft., one creature. Hit: The target is magically cursed for 1 hour. Until the curse ends, the target has disadvantage on Wisdom saving throws and all ability checks.",
        "attackBonus": 5
      }
    ]
  },
  {
    "name": "Manticore",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "lawful evil",
    "ac": 14,
    "armorType": "natural",
    "hp": 68,
    "hitDice": "8d10",
    "speed": {
      "walk": "30 ft.",
      "fly": "50 ft."
    },
    "abilities": {
      "strength": 17,
      "dexterity": 16,
      "constitution": 17,
      "intelligence": 7,
      "wisdom": 12,
      "charisma": 8
    },
    "senses": "darkvision 60 ft., passive_perception 11",
    "challengeRating": 3,
    "experiencePoints": 700,
    "source": "SRD",
    "traits": [
      {
        "name": "Tail Spike Regrowth",
        "description": "The manticore has twenty-four tail spikes. Used spikes regrow when the manticore finishes a long rest."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The manticore makes three attacks: one with its bite and two with its claws or three with its tail spikes."
      },
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
      },
      {
        "name": "Tail Spike",
        "description": "Ranged Weapon Attack: +5 to hit, range 100/200 ft., one target. Hit: 7 (1d8 + 3) piercing damage.",
        "attackBonus": 5,
        "damageDescription": "1d8+3 Piercing"
      }
    ]
  },
  {
    "name": "Medusa",
    "type": "monstrosity",
    "size": "Medium",
    "alignment": "lawful evil",
    "ac": 15,
    "armorType": "natural",
    "hp": 127,
    "hitDice": "17d8",
    "speed": {
      "walk": "30 ft."
    },
    "abilities": {
      "strength": 10,
      "dexterity": 15,
      "constitution": 16,
      "intelligence": 12,
      "wisdom": 13,
      "charisma": 15
    },
    "skills": {
      "deception": 5,
      "insight": 4,
      "perception": 4,
      "stealth": 5
    },
    "senses": "darkvision 60 ft., passive_perception 14",
    "languages": [
      "Common"
    ],
    "challengeRating": 6,
    "experiencePoints": 2300,
    "source": "SRD",
    "traits": [
      {
        "name": "Petrifying Gaze",
        "description": "When a creature that can see the medusa's eyes starts its turn within 30 ft. of the medusa, the medusa can force it to make a DC 14 Constitution saving throw if the medusa isn't incapacitated and can see the creature. If the saving throw fails by 5 or more, the creature is instantly petrified. Otherwise, a creature that fails the save begins to turn to stone and is restrained. The restrained creature must repeat the saving throw at the end of its next turn, becoming petrified on a failure or ending the effect on a success. The petrification lasts until the creature is freed by the greater restoration spell or other magic.\nUnless surprised, a creature can avert its eyes to avoid the saving throw at the start of its turn. If the creature does so, it can't see the medusa until the start of its next turn, when it can avert its eyes again. If the creature looks at the medusa in the meantime, it must immediately make the save.\nIf the medusa sees itself reflected on a polished surface within 30 ft. of it and in an area of bright light, the medusa is, due to its curse, affected by its own gaze.",
        "saveDC": 14,
        "saveType": "CON"
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The medusa makes either three melee attacks--one with its snake hair and two with its shortsword--or two ranged attacks with its longbow."
      },
      {
        "name": "Snake Hair",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one creature. Hit: 4 (1d4 + 2) piercing damage plus 14 (4d6) poison damage.",
        "attackBonus": 5,
        "damageDescription": "1d4+2 Piercing"
      },
      {
        "name": "Shortsword",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.",
        "attackBonus": 5,
        "damageDescription": "1d6+2 Piercing"
      },
      {
        "name": "Longbow",
        "description": "Ranged Weapon Attack: +5 to hit, range 150/600 ft., one target. Hit: 6 (1d8 + 2) piercing damage plus 7 (2d6) poison damage.",
        "attackBonus": 5,
        "damageDescription": "1d8+2 Piercing"
      }
    ]
  },
  {
    "name": "Merrow",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "chaotic evil",
    "ac": 13,
    "armorType": "natural",
    "hp": 45,
    "hitDice": "6d10",
    "speed": {
      "walk": "10 ft.",
      "swim": "40 ft."
    },
    "abilities": {
      "strength": 18,
      "dexterity": 10,
      "constitution": 15,
      "intelligence": 8,
      "wisdom": 10,
      "charisma": 9
    },
    "senses": "darkvision 60 ft., passive_perception 10",
    "languages": [
      "Abyssal",
      "Aquan"
    ],
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Amphibious",
        "description": "The merrow can breathe air and water."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The merrow makes two attacks: one with its bite and one with its claws or harpoon."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) piercing damage.",
        "attackBonus": 6,
        "damageDescription": "1d8+4 Piercing"
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 9 (2d4 + 4) slashing damage.",
        "attackBonus": 6,
        "damageDescription": "2d4+4 Slashing"
      },
      {
        "name": "Harpoon",
        "description": "Melee or Ranged Weapon Attack: +6 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 11 (2d6 + 4) piercing damage. If the target is a Huge or smaller creature, it must succeed on a Strength contest against the merrow or be pulled up to 20 feet toward the merrow.",
        "attackBonus": 6,
        "damageDescription": "2d6+4 Piercing"
      }
    ]
  },
  {
    "name": "Mimic",
    "type": "monstrosity",
    "size": "Medium",
    "alignment": "neutral",
    "ac": 12,
    "armorType": "natural",
    "hp": 58,
    "hitDice": "9d8",
    "speed": {
      "walk": "15 ft."
    },
    "abilities": {
      "strength": 17,
      "dexterity": 12,
      "constitution": 15,
      "intelligence": 5,
      "wisdom": 13,
      "charisma": 8
    },
    "skills": {
      "stealth": 5
    },
    "damageImmunities": [
      "acid"
    ],
    "conditionImmunities": [
      "Prone"
    ],
    "senses": "darkvision 60 ft., passive_perception 11",
    "challengeRating": 2,
    "experiencePoints": 450,
    "source": "SRD",
    "traits": [
      {
        "name": "Shapechanger",
        "description": "The mimic can use its action to polymorph into an object or back into its true, amorphous form. Its statistics are the same in each form. Any equipment it is wearing or carrying isn 't transformed. It reverts to its true form if it dies."
      },
      {
        "name": "Adhesive (Object Form Only)",
        "description": "The mimic adheres to anything that touches it. A Huge or smaller creature adhered to the mimic is also grappled by it (escape DC 13). Ability checks made to escape this grapple have disadvantage."
      },
      {
        "name": "False Appearance (Object Form Only)",
        "description": "While the mimic remains motionless, it is indistinguishable from an ordinary object."
      },
      {
        "name": "Grappler",
        "description": "The mimic has advantage on attack rolls against any creature grappled by it."
      }
    ],
    "actions": [
      {
        "name": "Pseudopod",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) bludgeoning damage. If the mimic is in object form, the target is subjected to its Adhesive trait.",
        "attackBonus": 5,
        "damageDescription": "1d8+3 Bludgeoning"
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) piercing damage plus 4 (1d8) acid damage.",
        "attackBonus": 5,
        "damageDescription": "1d8+3 Piercing"
      }
    ]
  },
  {
    "name": "Minotaur",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "chaotic evil",
    "ac": 14,
    "armorType": "natural",
    "hp": 76,
    "hitDice": "9d10",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 18,
      "dexterity": 11,
      "constitution": 16,
      "intelligence": 6,
      "wisdom": 16,
      "charisma": 9
    },
    "skills": {
      "perception": 7
    },
    "senses": "darkvision 60 ft., passive_perception 17",
    "languages": [
      "Abyssal"
    ],
    "challengeRating": 3,
    "experiencePoints": 700,
    "source": "SRD",
    "traits": [
      {
        "name": "Charge",
        "description": "If the minotaur moves at least 10 ft. straight toward a target and then hits it with a gore attack on the same turn, the target takes an extra 9 (2d8) piercing damage. If the target is a creature, it must succeed on a DC 14 Strength saving throw or be pushed up to 10 ft. away and knocked prone."
      },
      {
        "name": "Labyrinthine Recall",
        "description": "The minotaur can perfectly recall any path it has traveled."
      },
      {
        "name": "Reckless",
        "description": "At the start of its turn, the minotaur can gain advantage on all melee weapon attack rolls it makes during that turn, but attack rolls against it have advantage until the start of its next turn."
      }
    ],
    "actions": [
      {
        "name": "Greataxe",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 17 (2d12 + 4) slashing damage.",
        "attackBonus": 6,
        "damageDescription": "2d12+4 Slashing"
      },
      {
        "name": "Gore",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) piercing damage.",
        "attackBonus": 6,
        "damageDescription": "2d8+4 Piercing"
      }
    ]
  },
  {
    "name": "Owlbear",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "natural",
    "hp": 59,
    "hitDice": "7d10",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 20,
      "dexterity": 12,
      "constitution": 17,
      "intelligence": 3,
      "wisdom": 12,
      "charisma": 7
    },
    "skills": {
      "perception": 3
    },
    "senses": "darkvision 60 ft., passive_perception 13",
    "challengeRating": 3,
    "experiencePoints": 700,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Sight and Smell",
        "description": "The owlbear has advantage on Wisdom (Perception) checks that rely on sight or smell."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The owlbear makes two attacks: one with its beak and one with its claws."
      },
      {
        "name": "Beak",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one creature. Hit: 10 (1d10 + 5) piercing damage.",
        "attackBonus": 7,
        "damageDescription": "1d10+5 Piercing"
      },
      {
        "name": "Claws",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) slashing damage.",
        "attackBonus": 7,
        "damageDescription": "2d8+5 Slashing"
      }
    ]
  },
  {
    "name": "Phase Spider",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "unaligned",
    "ac": 13,
    "armorType": "natural",
    "hp": 32,
    "hitDice": "5d10",
    "speed": {
      "walk": "30 ft.",
      "climb": "30 ft."
    },
    "abilities": {
      "strength": 15,
      "dexterity": 15,
      "constitution": 12,
      "intelligence": 6,
      "wisdom": 10,
      "charisma": 6
    },
    "skills": {
      "stealth": 6
    },
    "senses": "darkvision 60 ft., passive_perception 10",
    "challengeRating": 3,
    "experiencePoints": 700,
    "source": "SRD",
    "traits": [
      {
        "name": "Ethereal Jaunt",
        "description": "As a bonus action, the spider can magically shift from the Material Plane to the Ethereal Plane, or vice versa."
      },
      {
        "name": "Spider Climb",
        "description": "The spider can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      },
      {
        "name": "Web Walker",
        "description": "The spider ignores movement restrictions caused by webbing."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 7 (1d10 + 2) piercing damage, and the target must make a DC 11 Constitution saving throw, taking 18 (4d8) poison damage on a failed save, or half as much damage on a successful one. If the poison damage reduces the target to 0 hit points, the target is stable but poisoned for 1 hour, even after regaining hit points, and is paralyzed while poisoned in this way.",
        "attackBonus": 4,
        "damageDescription": "1d10+2 Piercing"
      }
    ]
  },
  {
    "name": "Purple Worm",
    "type": "monstrosity",
    "size": "Gargantuan",
    "alignment": "unaligned",
    "ac": 18,
    "armorType": "natural",
    "hp": 247,
    "hitDice": "15d20",
    "speed": {
      "walk": "50 ft.",
      "burrow": "30 ft."
    },
    "abilities": {
      "strength": 28,
      "dexterity": 7,
      "constitution": 22,
      "intelligence": 1,
      "wisdom": 8,
      "charisma": 4
    },
    "savingThrows": {
      "con": 11,
      "wis": 4
    },
    "senses": "blindsight 30 ft., tremorsense 60 ft., passive_perception 9",
    "challengeRating": 15,
    "experiencePoints": 13000,
    "source": "SRD",
    "traits": [
      {
        "name": "Tunneler",
        "description": "The worm can burrow through solid rock at half its burrow speed and leaves a 10-foot-diameter tunnel in its wake."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The worm makes two attacks: one with its bite and one with its stinger."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +9 to hit, reach 10 ft., one target. Hit: 22 (3d8 + 9) piercing damage. If the target is a Large or smaller creature, it must succeed on a DC 19 Dexterity saving throw or be swallowed by the worm. A swallowed creature is blinded and restrained, it has total cover against attacks and other effects outside the worm, and it takes 21 (6d6) acid damage at the start of each of the worm's turns.\nIf the worm takes 30 damage or more on a single turn from a creature inside it, the worm must succeed on a DC 21 Constitution saving throw at the end of that turn or regurgitate all swallowed creatures, which fall prone in a space within 10 feet of the worm. If the worm dies, a swallowed creature is no longer restrained by it and can escape from the corpse by using 20 feet of movement, exiting prone.",
        "attackBonus": 9,
        "damageDescription": "3d8+9 Piercing"
      },
      {
        "name": "Tail Stinger",
        "description": "Melee Weapon Attack: +9 to hit, reach 10 ft., one creature. Hit: 19 (3d6 + 9) piercing damage, and the target must make a DC 19 Constitution saving throw, taking 42 (12d6) poison damage on a failed save, or half as much damage on a successful one.",
        "attackBonus": 9,
        "damageDescription": "3d6+9 Piercing"
      }
    ]
  },
  {
    "name": "Remorhaz",
    "type": "monstrosity",
    "size": "Huge",
    "alignment": "unaligned",
    "ac": 17,
    "armorType": "natural",
    "hp": 195,
    "hitDice": "17d12",
    "speed": {
      "walk": "30 ft.",
      "burrow": "20 ft."
    },
    "abilities": {
      "strength": 24,
      "dexterity": 13,
      "constitution": 21,
      "intelligence": 4,
      "wisdom": 10,
      "charisma": 5
    },
    "damageImmunities": [
      "cold",
      "fire"
    ],
    "senses": "darkvision 60 ft., tremorsense 60 ft., passive_perception 10",
    "challengeRating": 11,
    "experiencePoints": 7200,
    "source": "SRD",
    "traits": [
      {
        "name": "Heated Body",
        "description": "A creature that touches the remorhaz or hits it with a melee attack while within 5 feet of it takes 10 (3d6) fire damage."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +11 to hit, reach 10 ft., one target. Hit: 40 (6d10 + 7) piercing damage plus 10 (3d6) fire damage. If the target is a creature, it is grappled (escape DC 17). Until this grapple ends, the target is restrained, and the remorhaz can't bite another target.",
        "attackBonus": 11,
        "damageDescription": "6d10+7 Piercing"
      },
      {
        "name": "Swallow",
        "description": "The remorhaz makes one bite attack against a Medium or smaller creature it is grappling. If the attack hits, that creature takes the bite's damage and is swallowed, and the grapple ends. While swallowed, the creature is blinded and restrained, it has total cover against attacks and other effects outside the remorhaz, and it takes 21 (6d6) acid damage at the start of each of the remorhaz's turns.\nIf the remorhaz takes 30 damage or more on a single turn from a creature inside it, the remorhaz must succeed on a DC 15 Constitution saving throw at the end of that turn or regurgitate all swallowed creatures, which fall prone in a space within 10 feet of the remorhaz. If the remorhaz dies, a swallowed creature is no longer restrained by it and can escape from the corpse using 15 feet of movement, exiting prone."
      }
    ]
  },
  {
    "name": "Roc",
    "type": "monstrosity",
    "size": "Gargantuan",
    "alignment": "unaligned",
    "ac": 15,
    "armorType": "natural",
    "hp": 248,
    "hitDice": "16d20",
    "speed": {
      "walk": "20 ft.",
      "fly": "120 ft."
    },
    "abilities": {
      "strength": 28,
      "dexterity": 10,
      "constitution": 20,
      "intelligence": 3,
      "wisdom": 10,
      "charisma": 9
    },
    "savingThrows": {
      "dex": 4,
      "con": 9,
      "wis": 4,
      "cha": 3
    },
    "skills": {
      "perception": 4
    },
    "senses": "passive_perception 14",
    "challengeRating": 11,
    "experiencePoints": 7200,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Sight",
        "description": "The roc has advantage on Wisdom (Perception) checks that rely on sight."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The roc makes two attacks: one with its beak and one with its talons."
      },
      {
        "name": "Beak",
        "description": "Melee Weapon Attack: +13 to hit, reach 10 ft., one target. Hit: 27 (4d8 + 9) piercing damage.",
        "attackBonus": 13,
        "damageDescription": "4d8+9 Piercing"
      },
      {
        "name": "Talons",
        "description": "Melee Weapon Attack: +13 to hit, reach 5 ft., one target. Hit: 23 (4d6 + 9) slashing damage, and the target is grappled (escape DC 19). Until this grapple ends, the target is restrained, and the roc can't use its talons on another target.",
        "attackBonus": 13,
        "damageDescription": "4d6+9 Slashing"
      }
    ]
  },
  {
    "name": "Roper",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "neutral evil",
    "ac": 20,
    "armorType": "natural",
    "hp": 93,
    "hitDice": "11d10",
    "speed": {
      "walk": "10 ft.",
      "climb": "10 ft."
    },
    "abilities": {
      "strength": 18,
      "dexterity": 8,
      "constitution": 17,
      "intelligence": 7,
      "wisdom": 16,
      "charisma": 6
    },
    "skills": {
      "perception": 6,
      "stealth": 5
    },
    "senses": "darkvision 60 ft., passive_perception 16",
    "challengeRating": 5,
    "experiencePoints": 1800,
    "source": "SRD",
    "traits": [
      {
        "name": "False Appearance",
        "description": "While the roper remains motionless, it is indistinguishable from a normal cave formation, such as a stalagmite."
      },
      {
        "name": "Grasping Tendrils",
        "description": "The roper can have up to six tendrils at a time. Each tendril can be attacked (AC 20; 10 hit points; immunity to poison and psychic damage). Destroying a tendril deals no damage to the roper, which can extrude a replacement tendril on its next turn. A tendril can also be broken if a creature takes an action and succeeds on a DC 15 Strength check against it."
      },
      {
        "name": "Spider Climb",
        "description": "The roper can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The roper makes four attacks with its tendrils, uses Reel, and makes one attack with its bite."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 22 (4d8 + 4) piercing damage.",
        "attackBonus": 7,
        "damageDescription": "4d8+4 Piercing"
      },
      {
        "name": "Tendril",
        "description": "Melee Weapon Attack: +7 to hit, reach 50 ft., one creature. Hit: The target is grappled (escape DC 15). Until the grapple ends, the target is restrained and has disadvantage on Strength checks and Strength saving throws, and the roper can't use the same tendril on another target.",
        "attackBonus": 7
      },
      {
        "name": "Reel",
        "description": "The roper pulls each creature grappled by it up to 25 ft. straight toward it."
      }
    ]
  },
  {
    "name": "Rust Monster",
    "type": "monstrosity",
    "size": "Medium",
    "alignment": "unaligned",
    "ac": 14,
    "armorType": "natural",
    "hp": 27,
    "hitDice": "5d8",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 13,
      "dexterity": 12,
      "constitution": 13,
      "intelligence": 2,
      "wisdom": 13,
      "charisma": 6
    },
    "senses": "darkvision 60 ft., passive_perception 11",
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Iron Scent",
        "description": "The rust monster can pinpoint, by scent, the location of ferrous metal within 30 feet of it."
      },
      {
        "name": "Rust Metal",
        "description": "Any nonmagical weapon made of metal that hits the rust monster corrodes. After dealing damage, the weapon takes a permanent and cumulative -1 penalty to damage rolls. If its penalty drops to -5, the weapon is destroyed. Nonmagical ammunition made of metal that hits the rust monster is destroyed after dealing damage."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 5 (1d8 + 1) piercing damage.",
        "attackBonus": 3,
        "damageDescription": "1d8+1 Piercing"
      },
      {
        "name": "Antennae",
        "description": "The rust monster corrodes a nonmagical ferrous metal object it can see within 5 feet of it. If the object isn't being worn or carried, the touch destroys a 1-foot cube of it. If the object is being worn or carried by a creature, the creature can make a DC 11 Dexterity saving throw to avoid the rust monster's touch.\nIf the object touched is either metal armor or a metal shield being worn or carried, its takes a permanent and cumulative -1 penalty to the AC it offers. Armor reduced to an AC of 10 or a shield that drops to a +0 bonus is destroyed. If the object touched is a held metal weapon, it rusts as described in the Rust Metal trait."
      }
    ]
  },
  {
    "name": "Spirit Naga",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "chaotic evil",
    "ac": 15,
    "armorType": "natural",
    "hp": 75,
    "hitDice": "10d10",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 18,
      "dexterity": 17,
      "constitution": 14,
      "intelligence": 16,
      "wisdom": 15,
      "charisma": 16
    },
    "savingThrows": {
      "dex": 6,
      "con": 5,
      "wis": 5,
      "cha": 6
    },
    "damageImmunities": [
      "poison"
    ],
    "conditionImmunities": [
      "Charmed",
      "Poisoned"
    ],
    "senses": "darkvision 60 ft., passive_perception 12",
    "languages": [
      "Abyssal",
      "Common"
    ],
    "challengeRating": 8,
    "experiencePoints": 3900,
    "source": "SRD",
    "traits": [
      {
        "name": "Rejuvenation",
        "description": "If it dies, the naga returns to life in 1d6 days and regains all its hit points. Only a wish spell can prevent this trait from functioning."
      },
      {
        "name": "Spellcasting",
        "description": "The naga is a 10th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 14, +6 to hit with spell attacks), and it needs only verbal components to cast its spells. It has the following wizard spells prepared:\n\n- Cantrips (at will): mage hand, minor illusion, ray of frost\n- 1st level (4 slots): charm person, detect magic, sleep\n- 2nd level (3 slots): detect thoughts, hold person\n- 3rd level (3 slots): lightning bolt, water breathing\n- 4th level (3 slots): blight, dimension door\n- 5th level (2 slots): dominate person"
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +7 to hit, reach 10 ft., one creature. Hit: 7 (1d6 + 4) piercing damage, and the target must make a DC 13 Constitution saving throw, taking 31 (7d8) poison damage on a failed save, or half as much damage on a successful one.",
        "attackBonus": 7,
        "damageDescription": "1d6+4 Piercing"
      }
    ]
  },
  {
    "name": "Tarrasque",
    "type": "monstrosity",
    "size": "Gargantuan",
    "alignment": "unaligned",
    "ac": 25,
    "armorType": "natural",
    "hp": 676,
    "hitDice": "33d20",
    "speed": {
      "walk": "40 ft."
    },
    "abilities": {
      "strength": 30,
      "dexterity": 11,
      "constitution": 30,
      "intelligence": 3,
      "wisdom": 11,
      "charisma": 11
    },
    "savingThrows": {
      "int": 5,
      "wis": 9,
      "cha": 9
    },
    "damageImmunities": [
      "fire",
      "poison",
      "bludgeoning, piercing, and slashing from nonmagical weapons"
    ],
    "conditionImmunities": [
      "Charmed",
      "Frightened",
      "Paralyzed",
      "Poisoned"
    ],
    "senses": "blindsight 120 ft., passive_perception 10",
    "challengeRating": 30,
    "experiencePoints": 155000,
    "source": "SRD",
    "traits": [
      {
        "name": "Legendary Resistance",
        "description": "If the tarrasque fails a saving throw, it can choose to succeed instead."
      },
      {
        "name": "Magic Resistance",
        "description": "The tarrasque has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Reflective Carapace",
        "description": "Any time the tarrasque is targeted by a magic missile spell, a line spell, or a spell that requires a ranged attack roll, roll a d6. On a 1 to 5, the tarrasque is unaffected. On a 6, the tarrasque is unaffected, and the effect is reflected back at the caster as though it originated from the tarrasque, turning the caster into the target."
      },
      {
        "name": "Siege Monster",
        "description": "The tarrasque deals double damage to objects and structures."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The tarrasque can use its Frightful Presence. It then makes five attacks: one with its bite, two with its claws, one with its horns, and one with its tail. It can use its Swallow instead of its bite."
      },
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +19 to hit, reach 10 ft., one target. Hit: 36 (4d12 + 10) piercing damage. If the target is a creature, it is grappled (escape DC 20). Until this grapple ends, the target is restrained, and the tarrasque can't bite another target.",
        "attackBonus": 19,
        "damageDescription": "4d12+10 Piercing"
      },
      {
        "name": "Claw",
        "description": "Melee Weapon Attack: +19 to hit, reach 15 ft., one target. Hit: 28 (4d8 + 10) slashing damage.",
        "attackBonus": 19,
        "damageDescription": "4d8+10 Slashing"
      },
      {
        "name": "Horns",
        "description": "Melee Weapon Attack: +19 to hit, reach 10 ft., one target. Hit: 32 (4d10 + 10) piercing damage.",
        "attackBonus": 19,
        "damageDescription": "4d10+10 Piercing"
      },
      {
        "name": "Tail",
        "description": "Melee Weapon Attack: +19 to hit, reach 20 ft., one target. Hit: 24 (4d6 + 10) bludgeoning damage. If the target is a creature, it must succeed on a DC 20 Strength saving throw or be knocked prone.",
        "attackBonus": 19,
        "damageDescription": "4d6+10 Bludgeoning"
      },
      {
        "name": "Frightful Presence",
        "description": "Each creature of the tarrasque's choice within 120 feet of it and aware of it must succeed on a DC 17 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, with disadvantage if the tarrasque is within line of sight, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the tarrasque's Frightful Presence for the next 24 hours.",
        "saveDC": 17,
        "saveType": "WIS"
      },
      {
        "name": "Swallow",
        "description": "The tarrasque makes one bite attack against a Large or smaller creature it is grappling. If the attack hits, the target takes the bite's damage, the target is swallowed, and the grapple ends. While swallowed, the creature is blinded and restrained, it has total cover against attacks and other effects outside the tarrasque, and it takes 56 (16d6) acid damage at the start of each of the tarrasque's turns.\nIf the tarrasque takes 60 damage or more on a single turn from a creature inside it, the tarrasque must succeed on a DC 20 Constitution saving throw at the end of that turn or regurgitate all swallowed creatures, which fall prone in a space within 10 feet of the tarrasque. If the tarrasque dies, a swallowed creature is no longer restrained by it and can escape from the corpse by using 30 feet of movement, exiting prone."
      }
    ],
    "legendaryActions": [
      {
        "name": "Attack",
        "description": "The tarrasque makes one claw attack or tail attack."
      },
      {
        "name": "Move",
        "description": "The tarrasque moves up to half its speed."
      },
      {
        "name": "Chomp (Costs 2 Actions)",
        "description": "The tarrasque makes one bite attack or uses its Swallow."
      }
    ]
  },
  {
    "name": "Winter Wolf",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "neutral evil",
    "ac": 13,
    "armorType": "natural",
    "hp": 75,
    "hitDice": "10d10",
    "speed": {
      "walk": "50 ft."
    },
    "abilities": {
      "strength": 18,
      "dexterity": 13,
      "constitution": 14,
      "intelligence": 7,
      "wisdom": 12,
      "charisma": 8
    },
    "skills": {
      "perception": 5,
      "stealth": 3
    },
    "damageImmunities": [
      "cold"
    ],
    "senses": "passive_perception 15",
    "languages": [
      "Common",
      "Giant",
      "Winter Wolf"
    ],
    "challengeRating": 3,
    "experiencePoints": 700,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Hearing and Smell",
        "description": "The wolf has advantage on Wisdom (Perception) checks that rely on hearing or smell."
      },
      {
        "name": "Pack Tactics",
        "description": "The wolf has advantage on an attack roll against a creature if at least one of the wolf's allies is within 5 ft. of the creature and the ally isn't incapacitated."
      },
      {
        "name": "Snow Camouflage",
        "description": "The wolf has advantage on Dexterity (Stealth) checks made to hide in snowy terrain."
      }
    ],
    "actions": [
      {
        "name": "Bite",
        "description": "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) piercing damage. If the target is a creature, it must succeed on a DC 14 Strength saving throw or be knocked prone.",
        "attackBonus": 6,
        "damageDescription": "2d6+4 Piercing"
      },
      {
        "name": "Cold Breath",
        "description": "The wolf exhales a blast of freezing wind in a 15-foot cone. Each creature in that area must make a DC 12 Dexterity saving throw, taking 18 (4d8) cold damage on a failed save, or half as much damage on a successful one.",
        "damageDescription": "4d8 Cold",
        "saveDC": 12,
        "saveType": "DEX"
      }
    ]
  },
  {
    "name": "Worg",
    "type": "monstrosity",
    "size": "Large",
    "alignment": "neutral evil",
    "ac": 13,
    "armorType": "natural",
    "hp": 26,
    "hitDice": "4d10",
    "speed": {
      "walk": "50 ft."
    },
    "abilities": {
      "strength": 16,
      "dexterity": 13,
      "constitution": 13,
      "intelligence": 7,
      "wisdom": 11,
      "charisma": 8
    },
    "skills": {
      "perception": 4
    },
    "senses": "darkvision 60 ft., passive_perception 14",
    "languages": [
      "Goblin",
      "Worg"
    ],
    "challengeRating": 0.5,
    "experiencePoints": 100,
    "source": "SRD",
    "traits": [
      {
        "name": "Keen Hearing and Smell",
        "description": "The worg has advantage on Wisdom (Perception) checks that rely on hearing or smell."
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
  }
];

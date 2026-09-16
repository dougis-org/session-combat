import { StatusConditionCatalogEntry } from "@/lib/types";

/**
 * The 15 standard D&D 5e conditions plus Slowed, Confused, and Turned —
 * commonly-needed spell/feature-inflicted status effects — with their
 * SRD-style rules-text descriptions.
 */
export const CONDITION_CATALOG: StatusConditionCatalogEntry[] = [
  {
    name: "Blinded",
    description:
      "A blinded creature can't see and automatically fails any ability check that requires sight. Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage.",
  },
  {
    name: "Charmed",
    description:
      "A charmed creature can't attack the charmer or target the charmer with harmful abilities or magical effects. The charmer has advantage on any ability check to interact socially with the creature.",
  },
  {
    name: "Confused",
    description:
      "A confused creature can't willingly move or take actions except on its own initiative, and it must roll to determine its unpredictable behavior each turn: wandering in a random direction, remaining in place, attacking the nearest creature, or babbling incoherently and taking no action.",
  },
  {
    name: "Deafened",
    description:
      "A deafened creature can't hear and automatically fails any ability check that requires hearing.",
  },
  {
    name: "Exhaustion",
    description:
      "Exhaustion is measured in six levels, each with cumulative effects ranging from disadvantage on ability checks to death, gained from taking special actions (like forced marches) or environmental effects (like starvation).",
  },
  {
    name: "Frightened",
    description:
      "A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight. The creature can't willingly move closer to the source of its fear.",
  },
  {
    name: "Grappled",
    description:
      "A grappled creature's speed becomes 0, and it can't benefit from any bonus to its speed. The condition ends if the grappler is incapacitated, or if an effect removes the grappled creature from the reach of the grappler.",
  },
  {
    name: "Incapacitated",
    description: "An incapacitated creature can't take actions or reactions.",
  },
  {
    name: "Invisible",
    description:
      "An invisible creature is impossible to see without special sense or magic. Attack rolls against the creature have disadvantage, and the creature's attack rolls have advantage.",
  },
  {
    name: "Paralyzed",
    description:
      "A paralyzed creature is incapacitated and can't move or speak. It automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage, and any attack that hits the creature is a critical hit if the attacker is within 5 feet.",
  },
  {
    name: "Petrified",
    description:
      "A petrified creature is transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance. It is incapacitated, can't move or speak, and is unaware of its surroundings. Attack rolls against it have advantage, it automatically fails Strength and Dexterity saving throws, it has resistance to all damage, and it is immune to poison and disease.",
  },
  {
    name: "Poisoned",
    description: "A poisoned creature has disadvantage on attack rolls and ability checks.",
  },
  {
    name: "Prone",
    description:
      "A prone creature's only movement option is to crawl, unless it stands up. The creature has disadvantage on attack rolls. An attack roll against the creature has advantage if the attacker is within 5 feet, otherwise disadvantage.",
  },
  {
    name: "Restrained",
    description:
      "A restrained creature's speed becomes 0, and it can't benefit from any bonus to its speed. Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage. The creature has disadvantage on Dexterity saving throws.",
  },
  {
    name: "Slowed",
    description:
      "A slowed creature's speed is halved, it takes a -2 penalty to AC and Dexterity saving throws, and it can't use reactions. On its turn, it can use either an action or a bonus action, not both, and it can't make more than one melee or ranged attack.",
  },
  {
    name: "Stunned",
    description:
      "A stunned creature is incapacitated, can't move, and can speak only falteringly. It automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage.",
  },
  {
    name: "Turned",
    description:
      "A turned creature must spend its turns trying to move as far away from the source of the effect as it can, and it can't willingly move to a space within 30 feet of that source. It also can't take reactions and can use its action only to Dash or try to escape from an effect that prevents it from moving.",
  },
  {
    name: "Unconscious",
    description:
      "An unconscious creature is incapacitated, can't move or speak, and is unaware of its surroundings. It drops whatever it's holding and falls prone. It automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage, and any attack that hits the creature is a critical hit if the attacker is within 5 feet.",
  },
];

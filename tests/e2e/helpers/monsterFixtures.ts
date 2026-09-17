/**
 * Shared monster fixture used by both the legendary-action tests
 * (`combat-legendary.spec.ts`) and the lair-action tests
 * (`combat-lair.spec.ts`, which spreads it into `LAIR_MONSTER`). Kept in one
 * place so the two spec files — split from the same original
 * `combat.spec.ts` section — don't drift out of sync.
 */
export const LEGENDARY_MONSTER = {
  id: "aboleth-test-id",
  _id: "aboleth-test-id",
  userId: "GLOBAL",
  name: "Aboleth",
  size: "large" as const,
  type: "aberration",
  alignment: "lawful evil",
  ac: 17,
  hp: 135,
  maxHp: 135,
  speed: "10 ft., swim 40 ft.",
  abilityScores: { strength: 21, dexterity: 9, constitution: 15, intelligence: 18, wisdom: 15, charisma: 18 },
  savingThrows: {},
  skills: { history: 12, perception: 10 },
  senses: { passive_perception: "20" },
  languages: ["Deep Speech", "telepathy 120 ft."],
  challengeRating: 10,
  experiencePoints: 5900,
  source: "SRD",
  traits: [],
  actions: [],
  bonusActions: [],
  reactions: [],
  lairActions: [],
  legendaryActionCount: 3,
  legendaryActions: [
    { name: "Detect", description: "The aboleth makes a Wisdom (Perception) check.", cost: 1 },
    { name: "Tail Swipe", description: "The aboleth makes one tail attack.", cost: 1 },
    { name: "Tentacle Attack", description: "The aboleth makes one tentacle attack.", cost: 1 },
  ],
  isGlobal: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

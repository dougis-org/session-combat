import type { DndBeyondCharacterData } from "@/lib/dndBeyondCharacterImport";

type DndBeyondFixtureResponse = {
  id: number;
  success: boolean;
  message: string;
  data: DndBeyondCharacterData;
  pagination: null;
};

export const sampleDndBeyondCharacterResponse = {
  id: 91913267,
  success: true,
  message: "OK",
  data: {
    id: 91913267,
    readonlyUrl: "https://www.dndbeyond.com/characters/91913267/BRdgB3",
    name: "Dolor Vagarpie",
    alignmentId: 3,
    baseHitPoints: 68,
    bonusHitPoints: null,
    overrideHitPoints: null,
    removedHitPoints: 0,
    temporaryHitPoints: 0,
    stats: [
      { id: 1, value: 10 },
      { id: 2, value: 16 },
      { id: 3, value: 14 },
      { id: 4, value: 15 },
      { id: 5, value: 10 },
      { id: 6, value: 16 },
    ],
    bonusStats: [
      { id: 1, value: null },
      { id: 2, value: null },
      { id: 3, value: null },
      { id: 4, value: null },
      { id: 5, value: null },
      { id: 6, value: null },
    ],
    overrideStats: [
      { id: 1, value: null },
      { id: 2, value: null },
      { id: 3, value: null },
      { id: 4, value: null },
      { id: 5, value: null },
      { id: 6, value: null },
    ],
    race: {
      fullName: "Tiefling",
      weightSpeeds: {
        normal: {
          walk: 30,
        },
      },
    },
    classes: [
      {
        level: 5,
        definition: {
          name: "Rogue",
        },
      },
      {
        level: 7,
        definition: {
          name: "Warlock",
        },
      },
    ],
    modifiers: {
      race: [
        {
          type: "set-base",
          subType: "darkvision",
          fixedValue: 60,
          value: 60,
          friendlySubtypeName: "Darkvision",
        },
        {
          type: "resistance",
          subType: "fire",
          fixedValue: null,
          value: null,
          friendlySubtypeName: "Fire",
        },
        {
          type: "bonus",
          subType: "intelligence-score",
          fixedValue: 1,
          value: 1,
          friendlySubtypeName: "Intelligence Score",
        },
        {
          type: "bonus",
          subType: "charisma-score",
          fixedValue: 2,
          value: 2,
          friendlySubtypeName: "Charisma Score",
        },
        {
          type: "language",
          subType: "common",
          fixedValue: null,
          value: null,
          friendlySubtypeName: "Common",
        },
        {
          type: "language",
          subType: "infernal",
          fixedValue: null,
          value: null,
          friendlySubtypeName: "Infernal",
        },
      ],
      class: [
        {
          type: "bonus",
          subType: "dexterity-score",
          fixedValue: 1,
          value: 1,
          friendlySubtypeName: "Dexterity Score",
        },
        {
          type: "bonus",
          subType: "charisma-score",
          fixedValue: 1,
          value: 1,
          friendlySubtypeName: "Charisma Score",
        },
        {
          type: "proficiency",
          subType: "dexterity-saving-throws",
          fixedValue: null,
          value: null,
          friendlySubtypeName: "Dexterity Saving Throws",
        },
        {
          type: "proficiency",
          subType: "intelligence-saving-throws",
          fixedValue: null,
          value: null,
          friendlySubtypeName: "Intelligence Saving Throws",
        },
        {
          type: "proficiency",
          subType: "wisdom-saving-throws",
          fixedValue: null,
          value: null,
          friendlySubtypeName: "Wisdom Saving Throws",
        },
        {
          type: "proficiency",
          subType: "charisma-saving-throws",
          fixedValue: null,
          value: null,
          friendlySubtypeName: "Charisma Saving Throws",
        },
        {
          type: "proficiency",
          subType: "perception",
          fixedValue: null,
          value: null,
          friendlySubtypeName: "Perception",
        },
        {
          type: "expertise",
          subType: "perception",
          fixedValue: null,
          value: null,
          friendlySubtypeName: "Perception",
        },
        {
          type: "proficiency",
          subType: "investigation",
          fixedValue: null,
          value: null,
          friendlySubtypeName: "Investigation",
        },
        {
          type: "expertise",
          subType: "investigation",
          fixedValue: null,
          value: null,
          friendlySubtypeName: "Investigation",
        },
        {
          type: "proficiency",
          subType: "sleight-of-hand",
          fixedValue: null,
          value: null,
          friendlySubtypeName: "Sleight of Hand",
        },
      ],
      background: [
        {
          type: "proficiency",
          subType: "deception",
          fixedValue: null,
          value: null,
          friendlySubtypeName: "Deception",
        },
        {
          type: "proficiency",
          subType: "stealth",
          fixedValue: null,
          value: null,
          friendlySubtypeName: "Stealth",
        },
      ],
      item: [
        {
          type: "bonus",
          subType: "armor-class",
          fixedValue: 1,
          value: 1,
          friendlySubtypeName: "Armor Class",
        },
        {
          type: "bonus",
          subType: "armor-class",
          fixedValue: 1,
          value: 1,
          friendlySubtypeName: "Armor Class",
        },
        {
          type: "bonus",
          subType: "charisma-score",
          fixedValue: 2,
          value: 2,
          friendlySubtypeName: "Charisma Score",
        },
      ],
      feat: [],
      condition: [],
    },
    actions: {
      race: [],
      class: [
        {
          name: "Genie's Vessel: Bottled Respite",
          snippet: "You can magically vanish and enter your vessel.",
          activation: { activationType: 1 },
        },
        {
          name: "Elemental Gift - Flight",
          snippet: "As a bonus action, you can give yourself a flying speed.",
          activation: { activationType: 3 },
        },
        {
          name: "Uncanny Dodge",
          snippet: "Use your reaction to halve the attack's damage.",
          activation: { activationType: 4 },
        },
      ],
      background: null,
      item: null,
      feat: [],
    },
    inventory: [
      {
        equipped: true,
        definition: {
          armorClass: 12,
          armorTypeId: 1,
          baseArmorName: "Studded Leather",
        },
      },
    ],
    traits: {
      personalityTraits: "I would rather make a new friend than a new enemy.",
      ideals: "Charity.",
      bonds: "",
      flaws: "I turn tail and run when things look bad.",
      appearance: null,
    },
    notes: {
      backstory: "A scoundrel touched by strange power.",
    },
  },
  pagination: null,
} satisfies DndBeyondFixtureResponse;

export const unsupportedDndBeyondCharacterResponse = {
  ...sampleDndBeyondCharacterResponse,
  data: {
    ...sampleDndBeyondCharacterResponse.data,
    alignmentId: 999,
    race: {
      ...sampleDndBeyondCharacterResponse.data.race,
      fullName: "Warforged",
    },
  },
} satisfies DndBeyondFixtureResponse;

export const mountainDwarfCharacterResponse = {
  ...sampleDndBeyondCharacterResponse,
  data: {
    ...sampleDndBeyondCharacterResponse.data,
    race: {
      ...sampleDndBeyondCharacterResponse.data.race,
      fullName: "Mountain Dwarf",
    },
  },
} satisfies DndBeyondFixtureResponse;

export const aasimarArtificerCharacterResponse = {
  ...sampleDndBeyondCharacterResponse,
  data: {
    ...sampleDndBeyondCharacterResponse.data,
    race: {
      ...sampleDndBeyondCharacterResponse.data.race,
      fullName: "Aasimar",
    },
    classes: [
      {
        level: 3,
        definition: {
          name: "Artificer",
        },
      },
    ],
  },
} satisfies DndBeyondFixtureResponse;

import { VALID_SIZES } from './monsterUploadSchema';

/**
 * A plain-data description of one field the importer accepts, used to render
 * the modal's field table and generate the downloadable example.
 */
export interface FieldDescriptor {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

/**
 * Describes every field the upload schema accepts. Calculated fields
 * (e.g. experience points) are intentionally excluded.
 */
export function describeMonsterUploadSchema(): FieldDescriptor[] {
  return [
    { name: 'name', type: 'string', required: true, description: 'Monster name (1–200 characters).' },
    { name: 'size', type: `enum (${VALID_SIZES.join(' | ')})`, required: true, description: 'Creature size category.' },
    { name: 'type', type: 'string', required: true, description: 'Creature type, e.g. "humanoid", "dragon".' },
    { name: 'alignment', type: 'string', required: false, description: 'Alignment, e.g. "Chaotic Evil". Unrecognized values are dropped.' },
    { name: 'ac', type: 'integer (0–30)', required: true, description: 'Armor class.' },
    { name: 'acNote', type: 'string', required: false, description: 'Note about the AC source, e.g. "natural armor".' },
    { name: 'hp', type: 'integer (≥ 1)', required: false, description: 'Current hit points. Defaults to maxHp; must be ≤ maxHp.' },
    { name: 'maxHp', type: 'integer (≥ 1)', required: true, description: 'Maximum hit points.' },
    { name: 'speed', type: 'string', required: true, description: 'Speed description, e.g. "30 ft., fly 60 ft.".' },
    { name: 'abilityScores', type: 'object (strength, dexterity, constitution, intelligence, wisdom, charisma; each integer 1–30)', required: true, description: 'All six ability scores.' },
    { name: 'savingThrows', type: 'object (string → number)', required: false, description: 'Saving throw bonuses keyed by ability.' },
    { name: 'skills', type: 'object (string → number)', required: false, description: 'Skill bonuses keyed by skill name.' },
    { name: 'damageResistances', type: 'string[]', required: false, description: 'Damage types resisted; unknown types are filtered out.' },
    { name: 'damageImmunities', type: 'string[]', required: false, description: 'Damage types the monster is immune to.' },
    { name: 'damageVulnerabilities', type: 'string[]', required: false, description: 'Damage types the monster is vulnerable to.' },
    { name: 'conditionImmunities', type: 'string[]', required: false, description: 'Conditions the monster is immune to.' },
    { name: 'senses', type: 'object (string → string)', required: false, description: 'Senses, e.g. { "darkvision": "60 ft." }.' },
    { name: 'languages', type: 'string[]', required: false, description: 'Languages the monster knows.' },
    { name: 'challengeRating', type: 'number (≥ 0)', required: true, description: 'Challenge rating.' },
    { name: 'description', type: 'string', required: false, description: 'Freeform lore or notes.' },
    { name: 'source', type: 'string', required: false, description: 'Sourcebook name; used with name for duplicate detection.' },
    { name: 'traits', type: 'CreatureAbility[]', required: false, description: 'Passive traits ({ name, description, ... }).' },
    { name: 'actions', type: 'CreatureAbility[]', required: false, description: 'Actions the monster can take.' },
    { name: 'bonusActions', type: 'CreatureAbility[]', required: false, description: 'Bonus actions.' },
    { name: 'reactions', type: 'CreatureAbility[]', required: false, description: 'Reactions.' },
    { name: 'lairActions', type: 'CreatureAbility[]', required: false, description: 'Lair actions.' },
    { name: 'legendaryActions', type: 'CreatureAbility[]', required: false, description: 'Legendary actions.' },
    { name: 'legendaryActionCount', type: 'integer (≥ 0)', required: false, description: 'Legendary action pool size.' },
  ];
}

/**
 * A one-monster array populated with every field, used as the downloadable
 * template. Passes `validateMonsterUploadDocument` unchanged.
 */
export function buildMonsterImportExample(): unknown[] {
  return [
    {
      name: 'Example Dire Wolf',
      size: 'large',
      type: 'beast',
      alignment: 'Unaligned',
      ac: 14,
      acNote: 'natural armor',
      hp: 37,
      maxHp: 37,
      speed: '50 ft.',
      abilityScores: {
        strength: 17,
        dexterity: 15,
        constitution: 15,
        intelligence: 3,
        wisdom: 12,
        charisma: 7,
      },
      savingThrows: { wisdom: 1 },
      skills: { perception: 3, stealth: 4 },
      damageResistances: ['cold'],
      damageImmunities: [],
      damageVulnerabilities: ['fire'],
      conditionImmunities: ['frightened'],
      senses: { 'passive Perception': '13' },
      languages: [],
      challengeRating: 1,
      description: 'A representative example monster with every field populated.',
      source: 'Import Template',
      traits: [
        {
          name: 'Pack Tactics',
          description:
            'The wolf has advantage on attack rolls against a creature if at least one of the wolf’s allies is within 5 feet of the creature and the ally isn’t incapacitated.',
        },
      ],
      actions: [
        {
          name: 'Bite',
          description: 'Melee Weapon Attack: 2d6 + 3 piercing damage.',
          attackBonus: 5,
          damageDescription: '2d6 + 3 piercing',
        },
      ],
      bonusActions: [],
      reactions: [],
      lairActions: [],
      legendaryActions: [],
      legendaryActionCount: 0,
    },
  ];
}

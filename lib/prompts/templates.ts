import { BuiltPrompt, CampaignContext, Character, SavedContent, SessionLog, calculateTotalLevel } from '@/lib/types';

export interface PromptField {
  key: string;
  label: string;
  placeholder?: string;
  optional?: boolean;
  multiline?: boolean;
}

export interface PromptTemplate {
  id: SavedContent['type'];
  label: string;
  fields: PromptField[];
  build(fields: Record<string, string>, context: CampaignContext): BuiltPrompt;
}

function formatCharacter(c: Character): string {
  const level = calculateTotalLevel(c.classes);
  const classNames = c.classes.map(cl => cl.class).join('/');
  return `${c.name} (Level ${level} ${classNames})`;
}

function formatSessionEntry(session: SessionLog): string {
  const date = new Date(session.datePlayed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const title = session.title || 'Untitled Session';
  let suffix = '';
  if (session.milestone) {
    suffix = session.newLevel != null ? ` — party reached Level ${session.newLevel}.` : ' — milestone reached.';
  }
  return `- Session ${session.sessionNumber} (${date}): ${title}${suffix}`;
}

export function buildSystemPrompt(context: CampaignContext): string {
  const { campaign, chapter, characters, recentSessions } = context;

  const chapterLine = chapter ? `Current Chapter: ${chapter.title}` : '';
  const partySection = characters.length > 0
    ? `Party Members:\n${characters.map(c => `- ${formatCharacter(c)}`).join('\n')}`
    : 'Party Members: None currently linked.';
  const sessionSection = recentSessions?.length
    ? `Recent sessions:\n${recentSessions.map(formatSessionEntry).join('\n')}`
    : '';

  return [
    `You are a creative assistant helping a Dungeon Master run a D&D 5e campaign.`,
    `Campaign: ${campaign.name} (${campaign.moduleName})`,
    chapterLine,
    partySection,
    sessionSection,
  ].filter(Boolean).join('\n');
}

function makePrompt(systemPrompt: string, userMessage: string): BuiltPrompt {
  return { systemPrompt, userMessage, fullText: `${systemPrompt}\n\n${userMessage}` };
}

export const npcTemplate: PromptTemplate = {
  id: 'npc',
  label: 'NPC',
  fields: [
    { key: 'role', label: 'Role / Occupation', placeholder: 'e.g. innkeeper, guard, merchant' },
    { key: 'location', label: 'Location', placeholder: 'e.g. Barovia, the keep gates' },
    { key: 'requirements', label: 'Special Requirements', placeholder: 'e.g. hostile, knows a secret', optional: true },
  ],
  build(fields, context) {
    const req = fields.requirements ? `\nSpecial requirements: ${fields.requirements}` : '';
    const userMessage = `Create an NPC with the role of ${fields.role || 'unnamed role'} located at ${fields.location || 'an unspecified location'}.${req}\n\nInclude: name, appearance, personality, a secret or motivation, and 2-3 conversation hooks.`;
    return makePrompt(buildSystemPrompt(context), userMessage);
  },
};

export const locationTemplate: PromptTemplate = {
  id: 'location',
  label: 'Location Description',
  fields: [
    { key: 'type', label: 'Location Type', placeholder: 'e.g. tavern, dungeon, forest clearing' },
    { key: 'atmosphere', label: 'Atmosphere', placeholder: 'e.g. cozy, foreboding, bustling' },
    { key: 'details', label: 'Additional Details', placeholder: 'e.g. recently ransacked, hidden cellar', optional: true },
  ],
  build(fields, context) {
    const details = fields.details ? `\nAdditional details: ${fields.details}` : '';
    const userMessage = `Describe a ${fields.type || 'location'} with a ${fields.atmosphere || 'neutral'} atmosphere.${details}\n\nInclude: sensory details (sight, sound, smell), notable features, and 2-3 interactive elements the party could investigate.`;
    return makePrompt(buildSystemPrompt(context), userMessage);
  },
};

export const shopTemplate: PromptTemplate = {
  id: 'shop',
  label: 'Shop / Establishment',
  fields: [
    { key: 'shopType', label: 'Shop Type', placeholder: 'e.g. blacksmith, apothecary, general store' },
    { key: 'setting', label: 'Setting / District', placeholder: 'e.g. busy market, seedy docks, noble quarter' },
    { key: 'inventory', label: 'Notable Inventory', placeholder: 'e.g. rare components, military surplus', optional: true },
  ],
  build(fields, context) {
    const inv = fields.inventory ? `\nNotable inventory focus: ${fields.inventory}` : '';
    const userMessage = `Create a ${fields.shopType || 'shop'} located in the ${fields.setting || 'town'}.${inv}\n\nInclude: proprietor name and personality, shop description, 3-5 items for sale with prices, and a rumour the proprietor knows.`;
    return makePrompt(buildSystemPrompt(context), userMessage);
  },
};

export const magicItemTemplate: PromptTemplate = {
  id: 'magic-item',
  label: 'Magic Item',
  fields: [
    { key: 'itemType', label: 'Item Type', placeholder: 'e.g. sword, ring, cloak, amulet' },
    { key: 'rarity', label: 'Rarity', placeholder: 'e.g. common, uncommon, rare, very rare, legendary' },
    { key: 'theme', label: 'Thematic Theme', placeholder: 'e.g. shadow, fire, nature, undeath', optional: true },
  ],
  build(fields, context) {
    const theme = fields.theme ? ` with a ${fields.theme} theme` : '';
    const userMessage = `Create a ${fields.rarity || 'uncommon'} magic ${fields.itemType || 'item'}${theme}.\n\nInclude: evocative name, physical description, magical properties (as D&D 5e stat block), lore or history, and any attunement requirements.`;
    return makePrompt(buildSystemPrompt(context), userMessage);
  },
};

export const roomTemplate: PromptTemplate = {
  id: 'room',
  label: 'Room Description',
  fields: [
    { key: 'roomName', label: 'Room Name', placeholder: 'e.g. Throne Room, Crypt, Library' },
    { key: 'purpose', label: 'Purpose / Function', placeholder: 'e.g. seat of power, burial chamber, arcane study' },
    { key: 'features', label: 'Special Features', placeholder: 'e.g. trapped floor, hidden door, magical lighting', optional: true },
  ],
  build(fields, context) {
    const features = fields.features ? `\nSpecial features: ${fields.features}` : '';
    const userMessage = `Describe a room called "${fields.roomName || 'the room'}" that serves as a ${fields.purpose || 'general purpose space'}.${features}\n\nInclude: read-aloud description (2-3 sentences), notable contents, any hazards or traps, and a secret element for observant players.`;
    return makePrompt(buildSystemPrompt(context), userMessage);
  },
};

export const TEMPLATES: PromptTemplate[] = [
  npcTemplate,
  locationTemplate,
  shopTemplate,
  magicItemTemplate,
  roomTemplate,
];

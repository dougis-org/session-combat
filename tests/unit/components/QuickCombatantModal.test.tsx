import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickCombatantModal } from '@/lib/components/QuickCombatantModal';
import { MonsterTemplate, Character } from '@/lib/types';
import { GLOBAL_USER_ID } from '@/lib/constants';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const USER_ID = 'user-123';
const OTHER_USER_ID = 'other-user-456';

const makeMonsterTemplate = (overrides: Partial<MonsterTemplate> = {}): MonsterTemplate => ({
  id: 'g1',
  userId: GLOBAL_USER_ID,
  name: 'Goblin',
  size: 'small',
  type: 'humanoid',
  speed: '30 ft.',
  challengeRating: 0.25,
  hp: 7,
  maxHp: 7,
  ac: 15,
  abilityScores: {
    strength: 8,
    dexterity: 14,
    constitution: 10,
    intelligence: 10,
    wisdom: 8,
    charisma: 8,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const GOBLIN = makeMonsterTemplate({ id: 'g1', userId: GLOBAL_USER_ID, name: 'Goblin' });
const ORC = makeMonsterTemplate({ id: 'o1', userId: USER_ID, name: 'Orc' });
const TROLL = makeMonsterTemplate({ id: 't1', userId: OTHER_USER_ID, name: 'Troll' });

const MONSTER_TEMPLATES = [GOBLIN, ORC, TROLL];

const makeCharacter = (overrides: Partial<Character> = {}): Character => ({
  id: 'c1',
  userId: USER_ID,
  name: 'Aria',
  classes: [{ class: 'Rogue', level: 3 }],
  hp: 20,
  maxHp: 20,
  ac: 14,
  abilityScores: {
    strength: 10,
    dexterity: 16,
    constitution: 12,
    intelligence: 12,
    wisdom: 10,
    charisma: 12,
  },
  ...overrides,
});

const ARIA = makeCharacter({ id: 'c1', name: 'Aria' });
const BRON = makeCharacter({ id: 'c2', name: 'Bron' });
const CHARACTER_TEMPLATES = [ARIA, BRON];

beforeEach(() => {
  jest.spyOn(crypto, 'randomUUID').mockReturnValue('test-uuid' as `${string}-${string}-${string}-${string}-${string}`);
});

afterEach(() => {
  jest.restoreAllMocks();
});

function renderModal(overrides: Partial<React.ComponentProps<typeof QuickCombatantModal>> = {}) {
  const onAddMonster = jest.fn();
  const onAddCharacter = jest.fn();
  const onClose = jest.fn();
  render(
    <QuickCombatantModal
      onAddMonster={onAddMonster}
      onAddCharacter={onAddCharacter}
      onClose={onClose}
      monsterTemplates={MONSTER_TEMPLATES}
      characterTemplates={CHARACTER_TEMPLATES}
      userId={USER_ID}
      showToast={true}
      {...overrides}
    />
  );
  return { onAddMonster, onAddCharacter, onClose };
}

describe('render and navigation', () => {
  test('modal renders with monsters tab active by default', () => {
    renderModal();
    expect(screen.getByRole('heading', { name: 'Add Combatant' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Monsters' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Party Members' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Create New' })).toHaveAttribute('aria-selected', 'false');
  });

  test('close button calls onClose', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    await user.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('backdrop click calls onClose', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    await user.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('clicking inside the modal does NOT call onClose', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    // Click on the heading — inside the modal card
    await user.click(screen.getByRole('heading', { name: 'Add Combatant' }));
    expect(onClose).not.toHaveBeenCalled();
  });

  test('switching to Party Members tab updates aria-selected', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('tab', { name: 'Party Members' }));
    expect(screen.getByRole('tab', { name: 'Party Members' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Monsters' })).toHaveAttribute('aria-selected', 'false');
  });

  test('switching to Create New tab makes custom form visible', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('tab', { name: 'Create New' }));
    expect(screen.getByRole('button', { name: 'Add Combatant' })).toBeInTheDocument();
  });

  test('tab switch resets search query and creator filter to defaults', async () => {
    const user = userEvent.setup();
    renderModal();
    // Type in search and click a filter
    await user.type(screen.getByLabelText('Search monsters'), 'Goblin');
    await user.click(screen.getByRole('button', { name: 'My' }));
    // Switch to Party Members then back to Monsters
    await user.click(screen.getByRole('tab', { name: 'Party Members' }));
    await user.click(screen.getByRole('tab', { name: 'Monsters' }));
    expect(screen.getByLabelText('Search monsters')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('monster tab states', () => {
  test('loadingTemplates=true shows "Loading templates..." and hides search input', () => {
    renderModal({ loadingTemplates: true });
    expect(screen.getByText('Loading templates...')).toBeInTheDocument();
    expect(screen.queryByLabelText('Search monsters')).not.toBeInTheDocument();
  });

  test('monsterTemplates=[] shows "No monster templates available" with link', () => {
    renderModal({ monsterTemplates: [] });
    expect(screen.getByText(/No monster templates available/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create one' })).toBeInTheDocument();
  });
});

describe('monster search and filter', () => {
  test('all monsters visible initially', () => {
    renderModal();
    expect(screen.getByText('Goblin')).toBeInTheDocument();
    expect(screen.getByText('Orc')).toBeInTheDocument();
    expect(screen.getByText('Troll')).toBeInTheDocument();
  });

  test('typing "Goblin" filters list to Goblin only', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText('Search monsters'), 'Goblin');
    expect(screen.getByText('Goblin')).toBeInTheDocument();
    expect(screen.queryByText('Orc')).not.toBeInTheDocument();
    expect(screen.queryByText('Troll')).not.toBeInTheDocument();
  });

  test('clearing search restores all monsters', async () => {
    const user = userEvent.setup();
    renderModal();
    const input = screen.getByLabelText('Search monsters');
    await user.type(input, 'Goblin');
    await user.clear(input);
    expect(screen.getByText('Goblin')).toBeInTheDocument();
    expect(screen.getByText('Orc')).toBeInTheDocument();
    expect(screen.getByText('Troll')).toBeInTheDocument();
  });

  test('no-match search shows empty state message', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText('Search monsters'), 'zzznomatch');
    expect(screen.getByText(/No monsters match your search and filter criteria/)).toBeInTheDocument();
  });

  test('"My" filter shows only user\'s monster', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: 'My' }));
    expect(screen.getByText('Orc')).toBeInTheDocument();
    expect(screen.queryByText('Goblin')).not.toBeInTheDocument();
    expect(screen.queryByText('Troll')).not.toBeInTheDocument();
  });

  test('"Global" filter shows only global monster', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: 'Global' }));
    expect(screen.getByText('Goblin')).toBeInTheDocument();
    expect(screen.queryByText('Orc')).not.toBeInTheDocument();
    expect(screen.queryByText('Troll')).not.toBeInTheDocument();
  });

  test('"Other" filter shows only shared monster', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: 'Other' }));
    expect(screen.getByText('Troll')).toBeInTheDocument();
    expect(screen.queryByText('Goblin')).not.toBeInTheDocument();
    expect(screen.queryByText('Orc')).not.toBeInTheDocument();
  });

  test('"All" filter after "Global" shows all monsters', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: 'Global' }));
    await user.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByText('Goblin')).toBeInTheDocument();
    expect(screen.getByText('Orc')).toBeInTheDocument();
    expect(screen.getByText('Troll')).toBeInTheDocument();
  });
});

describe('monster selection', () => {
  test('clicking Add calls onAddMonster with correct payload', async () => {
    const user = userEvent.setup();
    const { onAddMonster } = renderModal();
    await user.click(screen.getByRole('button', { name: 'Add Goblin to encounter' }));
    expect(onAddMonster).toHaveBeenCalledTimes(1);
    expect(onAddMonster).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'test-uuid', templateId: 'g1', name: 'Goblin', hp: 7, ac: 15 })
    );
  });

  test('adding monster shows success toast', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: 'Add Goblin to encounter' }));
    expect(screen.getByText('Goblin added successfully')).toBeInTheDocument();
  });

  test('adding monster with showToast=false shows no toast', async () => {
    const user = userEvent.setup();
    renderModal({ showToast: false });
    await user.click(screen.getByRole('button', { name: 'Add Goblin to encounter' }));
    expect(screen.queryByText('Goblin added successfully')).not.toBeInTheDocument();
  });

  test('modal stays open after adding', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    await user.click(screen.getByRole('button', { name: 'Add Goblin to encounter' }));
    expect(screen.getByRole('heading', { name: 'Add Combatant' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('(Global) badge rendered for global monster', () => {
    renderModal();
    expect(screen.getAllByText('(Global)').length).toBeGreaterThanOrEqual(1);
  });

  test('(Mine) badge rendered for user\'s own monster', () => {
    renderModal();
    expect(screen.getAllByText('(Mine)').length).toBeGreaterThanOrEqual(1);
  });

  test('(Shared) badge rendered for other user\'s monster', () => {
    renderModal();
    expect(screen.getAllByText('(Shared)').length).toBeGreaterThanOrEqual(1);
  });
});

describe('character tab', () => {
  test('loadingTemplates=true on characters tab shows "Loading characters..."', async () => {
    const user = userEvent.setup();
    renderModal({ loadingTemplates: true });
    await user.click(screen.getByRole('tab', { name: 'Party Members' }));
    expect(screen.getByText('Loading characters...')).toBeInTheDocument();
  });

  test('characterTemplates=[] shows "No party members available" with link', async () => {
    const user = userEvent.setup();
    renderModal({ characterTemplates: [] });
    await user.click(screen.getByRole('tab', { name: 'Party Members' }));
    expect(screen.getByText(/No party members available/)).toBeInTheDocument();
  });

  test('characters render when present', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('tab', { name: 'Party Members' }));
    expect(screen.getByText('Aria')).toBeInTheDocument();
    expect(screen.getByText('Bron')).toBeInTheDocument();
  });

  test('typing "Aria" filters to Aria only', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('tab', { name: 'Party Members' }));
    await user.type(screen.getByLabelText('Search characters'), 'Aria');
    expect(screen.getByText('Aria')).toBeInTheDocument();
    expect(screen.queryByText('Bron')).not.toBeInTheDocument();
  });

  test('clicking Add calls onAddCharacter with the character object', async () => {
    const user = userEvent.setup();
    const { onAddCharacter } = renderModal();
    await user.click(screen.getByRole('tab', { name: 'Party Members' }));
    await user.click(screen.getByRole('button', { name: 'Add Aria to combat' }));
    expect(onAddCharacter).toHaveBeenCalledTimes(1);
    expect(onAddCharacter).toHaveBeenCalledWith(ARIA);
  });

  test('adding character shows toast', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('tab', { name: 'Party Members' }));
    await user.click(screen.getByRole('button', { name: 'Add Aria to combat' }));
    expect(screen.getByText('Aria added successfully')).toBeInTheDocument();
  });
});

describe('custom form', () => {
  async function openCustomTab() {
    const user = userEvent.setup();
    const mocks = renderModal();
    await user.click(screen.getByRole('tab', { name: 'Create New' }));
    return { user, ...mocks };
  }

  test('form fields render', async () => {
    await openCustomTab();
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dexterity/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^AC/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Max HP/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Current HP/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Initiative/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Combatant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('happy path — valid inputs → onAddMonster called with correct payload, onClose called', async () => {
    const { user, onAddMonster, onClose } = await openCustomTab();
    await user.type(screen.getByLabelText(/Name/), 'Dragon');
    // Clear dexterity default and set to 14
    await user.clear(screen.getByLabelText(/Dexterity/));
    await user.type(screen.getByLabelText(/Dexterity/), '14');
    await user.clear(screen.getByLabelText(/^AC/));
    await user.type(screen.getByLabelText(/^AC/), '15');
    await user.clear(screen.getByLabelText(/Max HP/));
    await user.type(screen.getByLabelText(/Max HP/), '50');
    await user.clear(screen.getByLabelText(/Current HP/));
    await user.type(screen.getByLabelText(/Current HP/), '50');
    // Leave Initiative blank
    await user.click(screen.getByRole('button', { name: 'Add Combatant' }));
    expect(onAddMonster).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Dragon', ac: 15, maxHp: 50, hp: 50, abilityScores: expect.objectContaining({ dexterity: 14 }) })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('initiative filled → payload includes initiative: 18', async () => {
    const { user, onAddMonster } = await openCustomTab();
    await user.type(screen.getByLabelText(/Name/), 'Dragon');
    await user.type(screen.getByLabelText(/Initiative/), '18');
    await user.click(screen.getByRole('button', { name: 'Add Combatant' }));
    expect(onAddMonster).toHaveBeenCalledWith(
      expect.objectContaining({ initiative: 18 })
    );
  });

  test('initiative blank → payload does NOT include initiative key', async () => {
    const { user, onAddMonster } = await openCustomTab();
    await user.type(screen.getByLabelText(/Name/), 'Dragon');
    await user.click(screen.getByRole('button', { name: 'Add Combatant' }));
    const call = onAddMonster.mock.calls[0][0];
    expect(call).not.toHaveProperty('initiative');
  });

  test('dexterity 14 → modifier displays "+2"', async () => {
    const { user } = await openCustomTab();
    await user.clear(screen.getByLabelText(/Dexterity/));
    await user.type(screen.getByLabelText(/Dexterity/), '14');
    expect(screen.getByText(/\+2/)).toBeInTheDocument();
  });

  test('empty name → "Name is required" error, onAddMonster not called', async () => {
    const { user, onAddMonster } = await openCustomTab();
    await user.click(screen.getByRole('button', { name: 'Add Combatant' }));
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(onAddMonster).not.toHaveBeenCalled();
  });

  test('dexterity=0 → dexterity range error, onAddMonster not called', async () => {
    const { onAddMonster } = await openCustomTab();
    fireEvent.input(screen.getByLabelText(/Name/), { target: { value: 'Dragon' } });
    // fireEvent.input bypasses jsdom's number input constraint validation;
    // fireEvent.submit bypasses browser constraint validation that would block onSubmit
    fireEvent.input(screen.getByLabelText(/Dexterity/), { target: { value: '0' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Add Combatant' }).closest('form')!);
    expect(screen.getByText(/Dexterity must be between 1 and 30/)).toBeInTheDocument();
    expect(onAddMonster).not.toHaveBeenCalled();
  });

  test('dexterity=31 → dexterity range error, onAddMonster not called', async () => {
    const { onAddMonster } = await openCustomTab();
    fireEvent.input(screen.getByLabelText(/Name/), { target: { value: 'Dragon' } });
    fireEvent.input(screen.getByLabelText(/Dexterity/), { target: { value: '31' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Add Combatant' }).closest('form')!);
    expect(screen.getByText(/Dexterity must be between 1 and 30/)).toBeInTheDocument();
    expect(onAddMonster).not.toHaveBeenCalled();
  });

  test('AC=0 → "AC must be at least 1", onAddMonster not called', async () => {
    const { onAddMonster } = await openCustomTab();
    fireEvent.input(screen.getByLabelText(/Name/), { target: { value: 'Dragon' } });
    fireEvent.input(screen.getByLabelText(/^AC/), { target: { value: '0' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Add Combatant' }).closest('form')!);
    expect(screen.getByText('AC must be at least 1')).toBeInTheDocument();
    expect(onAddMonster).not.toHaveBeenCalled();
  });

  test('maxHp=0 → "Max HP must be at least 1", onAddMonster not called', async () => {
    const { onAddMonster } = await openCustomTab();
    fireEvent.input(screen.getByLabelText(/Name/), { target: { value: 'Dragon' } });
    fireEvent.input(screen.getByLabelText(/Max HP/), { target: { value: '0' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Add Combatant' }).closest('form')!);
    expect(screen.getByText('Max HP must be at least 1')).toBeInTheDocument();
    expect(onAddMonster).not.toHaveBeenCalled();
  });

  test('hp > maxHp → "Current HP must be between 0 and Max HP", onAddMonster not called', async () => {
    const { user, onAddMonster } = await openCustomTab();
    await user.type(screen.getByLabelText(/Name/), 'Dragon');
    await user.clear(screen.getByLabelText(/Max HP/));
    await user.type(screen.getByLabelText(/Max HP/), '10');
    await user.clear(screen.getByLabelText(/Current HP/));
    await user.type(screen.getByLabelText(/Current HP/), '11');
    await user.click(screen.getByRole('button', { name: 'Add Combatant' }));
    expect(screen.getByText('Current HP must be between 0 and Max HP')).toBeInTheDocument();
    expect(onAddMonster).not.toHaveBeenCalled();
  });

  test('validation error clears when switching tabs', async () => {
    const { user } = await openCustomTab();
    // Trigger error
    await user.click(screen.getByRole('button', { name: 'Add Combatant' }));
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    // Switch to monsters and back
    await user.click(screen.getByRole('tab', { name: 'Monsters' }));
    await user.click(screen.getByRole('tab', { name: 'Create New' }));
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
  });

  test('Cancel button calls onClose', async () => {
    const { user, onClose } = await openCustomTab();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

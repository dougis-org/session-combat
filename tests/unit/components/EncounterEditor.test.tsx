jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { userId: 'user-1' },
    isAuthenticated: true,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    error: null,
  })),
}));

jest.mock('@/lib/components/QuickCombatantModal', () => ({
  QuickCombatantModal: () => null,
}));

jest.mock('@/lib/components/Modal', () => ({
  Modal: () => null,
}));

jest.mock('@/app/encounters/MonsterEditor', () => ({
  MonsterEditor: () => null,
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EncounterEditor } from '@/app/encounters/EncounterEditor';
import type { Encounter, Monster } from '@/lib/types';

const BASE_MONSTER: Monster = {
  id: 'mon-1',
  name: 'Goblin',
  hp: 7,
  maxHp: 7,
  ac: 15,
  size: 'small',
  type: 'humanoid',
  speed: '30 ft.',
  challengeRating: 0.25,
  templateId: undefined,
  abilityScores: {
    strength: 8,
    dexterity: 14,
    constitution: 10,
    intelligence: 10,
    wisdom: 8,
    charisma: 8,
  },
};

const BASE_ENCOUNTER: Encounter = {
  id: 'enc-1',
  userId: 'user-1',
  name: 'Goblin Ambush',
  description: 'Roadside attack',
  monsters: [],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

function renderEditor(props: Partial<Parameters<typeof EncounterEditor>[0]> = {}) {
  return render(
    <EncounterEditor
      encounter={BASE_ENCOUNTER}
      onSave={jest.fn()}
      onCancel={jest.fn()}
      isNew={false}
      {...props}
    />
  );
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('EncounterEditor — title rendering', () => {
  it('shows "Create Encounter" heading when isNew is true', () => {
    renderEditor({ isNew: true });
    expect(screen.getByRole('heading', { name: /create encounter/i })).toBeInTheDocument();
  });

  it('shows "Edit Encounter" heading when isNew is false', () => {
    renderEditor({ isNew: false });
    expect(screen.getByRole('heading', { name: /edit encounter/i })).toBeInTheDocument();
  });
});

describe('EncounterEditor — field pre-population', () => {
  it('name input has value matching encounter.name', () => {
    renderEditor();
    expect(screen.getByLabelText(/^name$/i)).toHaveValue('Goblin Ambush');
  });

  it('description textarea has value matching encounter.description', () => {
    renderEditor();
    expect(screen.getByLabelText(/^description$/i)).toHaveValue('Roadside attack');
  });
});

describe('EncounterEditor — save button state', () => {
  it('Save Encounter button is disabled when name is empty', () => {
    renderEditor({ encounter: { ...BASE_ENCOUNTER, name: '' } });
    expect(screen.getByRole('button', { name: /save encounter/i })).toBeDisabled();
  });

  it('Save Encounter button is enabled when name is non-empty', () => {
    renderEditor();
    expect(screen.getByRole('button', { name: /save encounter/i })).not.toBeDisabled();
  });
});

describe('EncounterEditor — save callback', () => {
  it('clicking Save calls onSave with merged encounter shape', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    renderEditor({ onSave });
    await user.click(screen.getByRole('button', { name: /save encounter/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Goblin Ambush',
        description: 'Roadside attack',
        monsters: [],
      })
    );
  });
});

describe('EncounterEditor — cancel callback', () => {
  it('clicking Cancel calls onCancel once', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    renderEditor({ onCancel });
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('EncounterEditor — monster list', () => {
  it('shows "No monsters added yet." when monsters is empty', () => {
    renderEditor({ encounter: { ...BASE_ENCOUNTER, monsters: [] } });
    expect(screen.getByText('No monsters added yet.')).toBeInTheDocument();
  });

  it('shows monster name and Edit/Delete buttons when monsters are present', () => {
    renderEditor({ encounter: { ...BASE_ENCOUNTER, monsters: [BASE_MONSTER] } });
    expect(screen.getByText('Goblin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^edit$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
  });

  it('renders "Add Combatant" button', () => {
    renderEditor();
    expect(screen.getByRole('button', { name: /add combatant/i })).toBeInTheDocument();
  });
});

describe('EncounterEditor — monster interactions', () => {
  it('removes monster from list when Delete is clicked', async () => {
    const user = userEvent.setup();
    renderEditor({ encounter: { ...BASE_ENCOUNTER, monsters: [BASE_MONSTER] } });
    expect(screen.getByText('Goblin')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(screen.queryByText('Goblin')).not.toBeInTheDocument();
    expect(screen.getByText('No monsters added yet.')).toBeInTheDocument();
  });

  it('does not crash when Edit is clicked on a monster', async () => {
    const user = userEvent.setup();
    renderEditor({ encounter: { ...BASE_ENCOUNTER, monsters: [BASE_MONSTER] } });
    await user.click(screen.getByRole('button', { name: /^edit$/i }));
    expect(screen.getByRole('button', { name: /add combatant/i })).toBeInTheDocument();
  });

  it('fetches monster templates when Add Combatant is clicked', async () => {
    const user = userEvent.setup();
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as unknown as Response);

    try {
      renderEditor();
      await user.click(screen.getByRole('button', { name: /add combatant/i }));
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/monsters');
      });
    } finally {
      global.fetch = originalFetch;
    }
  });
});

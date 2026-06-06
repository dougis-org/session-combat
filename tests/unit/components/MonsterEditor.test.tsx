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

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonsterEditor } from '@/app/encounters/MonsterEditor';
import type { Monster } from '@/lib/types';

const BASE_MONSTER: Monster = {
  id: 'mon-1',
  name: 'Goblin',
  hp: 7,
  maxHp: 10,
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

function renderEditor(props: Partial<Parameters<typeof MonsterEditor>[0]> = {}) {
  return render(
    <MonsterEditor
      monster={BASE_MONSTER}
      onSave={jest.fn()}
      onCancel={jest.fn()}
      {...props}
    />
  );
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('MonsterEditor — field rendering', () => {
  it('renders name input pre-populated from monster prop', () => {
    renderEditor();
    expect(screen.getByLabelText(/^name$/i)).toHaveValue('Goblin');
  });

  it('renders AC input pre-populated from monster prop', () => {
    renderEditor();
    expect(screen.getByLabelText(/^ac$/i)).toHaveValue(15);
  });

  it('renders HP input pre-populated from monster prop', () => {
    renderEditor();
    expect(screen.getByLabelText(/^hp$/i)).toHaveValue(7);
  });

  it('renders Max HP input pre-populated from monster prop', () => {
    renderEditor();
    expect(screen.getByLabelText(/^max hp$/i)).toHaveValue(10);
  });

  it('renders Dexterity input pre-populated from monster prop', () => {
    renderEditor();
    expect(screen.getByLabelText(/dexterity/i)).toHaveValue(14);
  });
});

describe('MonsterEditor — save callback', () => {
  it('calls onSave with updated name on Save Monster click', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    renderEditor({ onSave });
    const nameInput = screen.getByLabelText(/^name$/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Hobgoblin');
    await user.click(screen.getByRole('button', { name: /save monster/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Hobgoblin' }));
  });

  it('calls onSave with updated AC', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    renderEditor({ onSave });
    const acInput = screen.getByLabelText(/^ac$/i);
    fireEvent.change(acInput, { target: { value: '18' } });
    await user.click(screen.getByRole('button', { name: /save monster/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ ac: 18 }));
  });

  it('clamps HP to maxHp when HP input exceeds maxHp', () => {
    renderEditor();
    const hpInput = screen.getByLabelText(/^hp$/i);
    fireEvent.change(hpInput, { target: { value: '999' } });
    expect(hpInput).toHaveValue(10);
  });

  it('clamps HP to new maxHp when maxHp is reduced below current HP', () => {
    const monster = { ...BASE_MONSTER, hp: 8, maxHp: 10 };
    renderEditor({ monster });
    const maxHpInput = screen.getByLabelText(/^max hp$/i);
    fireEvent.change(maxHpInput, { target: { value: '5' } });
    expect(screen.getByLabelText(/^hp$/i)).toHaveValue(5);
  });

  it('calls onSave preserving unchanged ability scores', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    renderEditor({ onSave });
    await user.click(screen.getByRole('button', { name: /save monster/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        abilityScores: expect.objectContaining({ strength: 8 }),
      })
    );
  });
});

describe('MonsterEditor — cancel callback', () => {
  it('calls onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    renderEditor({ onCancel });
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('hides Cancel button when hideCancel is true', () => {
    renderEditor({ hideCancel: true });
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('shows Cancel button when hideCancel is false', () => {
    renderEditor({ hideCancel: false });
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });
});

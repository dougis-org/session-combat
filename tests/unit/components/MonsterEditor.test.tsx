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

jest.mock('@/lib/components/MonsterStatEditor', () => ({
  MonsterStatEditor: jest.fn(({ value, onChange }: { value: any; onChange: (v: any) => void }) => (
    <div data-testid="monster-stat-editor" data-name={value.name}>
      <button
        data-testid="mse-trigger-change"
        onClick={() => onChange({ ...value, name: 'Hobgoblin' })}
      >
        Change Name
      </button>
    </div>
  )),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonsterEditor } from '@/app/encounters/MonsterEditor';
import { MonsterStatEditor } from '@/lib/components/MonsterStatEditor';
import type { Monster, MonsterEditableFields } from '@/lib/types';

const MockMonsterStatEditor = MonsterStatEditor as jest.MockedFunction<typeof MonsterStatEditor>;

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

describe('MonsterEditor — full stat block rendering', () => {
  it('renders MonsterStatEditor', () => {
    renderEditor();
    expect(screen.getByTestId('monster-stat-editor')).toBeInTheDocument();
  });

  it('passes the monster editable fields to MonsterStatEditor as value', () => {
    renderEditor();
    const lastProps = MockMonsterStatEditor.mock.calls[0][0];
    expect(lastProps.value).toMatchObject({
      name: 'Goblin',
      ac: 15,
      hp: 7,
      maxHp: 10,
      abilityScores: expect.objectContaining({ dexterity: 14 }),
    });
  });
});

describe('MonsterEditor — save callback', () => {
  it('calls onSave with merged Monster after field change', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    renderEditor({ onSave });
    await user.click(screen.getByTestId('mse-trigger-change'));
    await user.click(screen.getByRole('button', { name: /save monster/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'mon-1', name: 'Hobgoblin' }),
    );
  });

  it('calls onSave preserving original monster metadata (id, templateId)', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    const monster = { ...BASE_MONSTER, templateId: 'tmpl-42' };
    render(
      <MonsterEditor monster={monster} onSave={onSave} onCancel={jest.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: /save monster/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'mon-1', templateId: 'tmpl-42' }),
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

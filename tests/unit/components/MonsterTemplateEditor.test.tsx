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
  MonsterStatEditor: jest.fn(() => <div data-testid="monster-stat-editor" />),
  formatSpeedValue: (v: unknown) => (typeof v === 'string' ? v :
    typeof v === 'object' && v !== null && !Array.isArray(v)
      ? Object.entries(v as Record<string, string>).map(([k, val]) => `${k} ${val}`).join(', ')
      : '30 ft.'),
}));

import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonsterTemplateEditor } from '@/app/monsters/MonsterTemplateEditor';
import { MonsterStatEditor } from '@/lib/components/MonsterStatEditor';
import type { MonsterTemplate, MonsterEditableFields } from '@/lib/types';

const MockMonsterStatEditor = MonsterStatEditor as jest.MockedFunction<typeof MonsterStatEditor>;

const BASE_TEMPLATE: MonsterTemplate = {
  id: 'tmpl-1',
  userId: 'user-1',
  name: 'Goblin',
  size: 'small',
  type: 'humanoid',
  alignment: 'Neutral Evil',
  speed: '30 ft.',
  ac: 15,
  hp: 7,
  maxHp: 10,
  challengeRating: 0.25,
  source: 'Monster Manual',
  description: 'A sneaky goblin.',
  abilityScores: {
    strength: 8,
    dexterity: 14,
    constitution: 10,
    intelligence: 10,
    wisdom: 8,
    charisma: 8,
  },
  isGlobal: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function renderEditor(props: Partial<Parameters<typeof MonsterTemplateEditor>[0]> = {}) {
  return render(
    <MonsterTemplateEditor
      template={BASE_TEMPLATE}
      onSave={jest.fn()}
      onCancel={jest.fn()}
      isNew={false}
      isGlobal={false}
      {...props}
    />
  );
}

function simulateMseChange(fields: Partial<MonsterEditableFields>) {
  const lastCall = MockMonsterStatEditor.mock.calls[MockMonsterStatEditor.mock.calls.length - 1][0] as any;
  act(() => {
    lastCall.onChange({ ...lastCall.value, ...fields });
  });
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('MonsterTemplateEditor — MonsterStatEditor delegation', () => {
  it('renders MonsterStatEditor', () => {
    renderEditor();
    expect(screen.getByTestId('monster-stat-editor')).toBeInTheDocument();
  });

  it('passes editable fields of the template as value to MonsterStatEditor', () => {
    renderEditor();
    const lastProps = MockMonsterStatEditor.mock.calls[0][0];
    expect(lastProps.value).toMatchObject({
      name: 'Goblin',
      size: 'small',
      type: 'humanoid',
      alignment: 'Neutral Evil',
      speed: '30 ft.',
      challengeRating: 0.25,
      source: 'Monster Manual',
      description: 'A sneaky goblin.',
      ac: 15,
      hp: 7,
      maxHp: 10,
    });
  });

  it('converts legacy speed object to string when passing to MonsterStatEditor', () => {
    renderEditor({
      template: { ...BASE_TEMPLATE, speed: { walk: '30 ft.', fly: '60 ft.' } as unknown as string },
    });
    const lastProps = MockMonsterStatEditor.mock.calls[0][0];
    expect(lastProps.value.speed).toBe('walk 30 ft., fly 60 ft.');
  });
});

describe('MonsterTemplateEditor — save callback', () => {
  it('calls onSave with current editable fields on Save click', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    renderEditor({ onSave });
    await user.click(screen.getByRole('button', { name: /save personal monster/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Goblin' }));
  });

  it('calls onSave with merged MonsterTemplate preserving non-editable fields', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    renderEditor({ onSave });
    await user.click(screen.getByRole('button', { name: /save personal monster/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'tmpl-1', userId: 'user-1' }),
    );
  });
});

describe('MonsterTemplateEditor — validation', () => {
  it('disables save button when name is cleared via MonsterStatEditor', () => {
    renderEditor();
    simulateMseChange({ name: '' });
    expect(screen.getByRole('button', { name: /save personal monster/i })).toBeDisabled();
  });

  it('shows validation error when form is submitted with empty name', () => {
    const onSave = jest.fn();
    const { container } = renderEditor({ onSave });
    simulateMseChange({ name: '' });
    fireEvent.submit(container.querySelector('form')!);
    expect(screen.getByText(/monster name is required/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows validation error and does not call onSave when HP exceeds Max HP', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    renderEditor({ template: { ...BASE_TEMPLATE, hp: 20, maxHp: 10 }, onSave });
    await user.click(screen.getByRole('button', { name: /save personal monster/i }));
    expect(screen.getByText(/current hp cannot be greater than max hp/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('MonsterTemplateEditor — cancel callback', () => {
  it('calls onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    renderEditor({ onCancel });
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onSave when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    renderEditor({ onSave });
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('MonsterTemplateEditor — isGlobal styling', () => {
  it('applies purple border class when isGlobal is true', () => {
    const { container } = renderEditor({ isGlobal: true });
    expect(container.firstChild).toHaveClass('border-purple-500');
  });

  it('applies blue border class when isGlobal is false', () => {
    const { container } = renderEditor({ isGlobal: false });
    expect(container.firstChild).toHaveClass('border-blue-500');
  });

  it('shows "Create Global Monster" heading when isGlobal is true and isNew is true', () => {
    renderEditor({ isGlobal: true, isNew: true });
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Create Global Monster');
  });

  it('shows "Create Personal Monster" heading when isGlobal is false and isNew is true', () => {
    renderEditor({ isGlobal: false, isNew: true });
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Create Personal Monster');
  });

  it('shows global save button label when isGlobal is true and isNew is false', () => {
    renderEditor({ isGlobal: true, isNew: false });
    expect(screen.getByRole('button', { name: /save global monster/i })).toBeInTheDocument();
  });
});

describe('MonsterTemplateEditor — isNew button label', () => {
  it('shows "Create" save button label when isNew is true', () => {
    renderEditor({ isNew: true });
    expect(screen.getByRole('button', { name: /^create$/i })).toBeInTheDocument();
  });

  it('shows "Save Personal Monster" save button label when isNew is false', () => {
    renderEditor({ isNew: false });
    expect(screen.getByRole('button', { name: /save personal monster/i })).toBeInTheDocument();
  });
});

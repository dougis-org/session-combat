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

jest.mock('@/lib/components/CreatureStatsForm', () => ({
  CreatureStatsForm: () => null,
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonsterTemplateEditor } from '@/app/monsters/MonsterTemplateEditor';
import type { MonsterTemplate } from '@/lib/types';

const BASE_TEMPLATE: MonsterTemplate = {
  id: 'tmpl-1',
  userId: 'user-1',
  name: 'Goblin',
  size: 'small',
  type: 'humanoid',
  alignment: 'neutral evil',
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

afterEach(() => {
  jest.clearAllMocks();
});

describe('MonsterTemplateEditor — field rendering', () => {
  it('renders name input pre-populated from template prop', () => {
    renderEditor();
    expect(screen.getByLabelText(/^name$/i)).toHaveValue('Goblin');
  });

  it('renders size select pre-populated from template prop', () => {
    renderEditor();
    expect(screen.getByLabelText(/^size$/i)).toHaveValue('small');
  });

  it('renders type input pre-populated from template prop', () => {
    renderEditor();
    expect(screen.getByLabelText(/^type$/i)).toHaveValue('humanoid');
  });

  it('renders speed input pre-populated from template prop (string passthrough)', () => {
    renderEditor();
    expect(screen.getByLabelText(/^speed$/i)).toHaveValue('30 ft.');
  });

  it('converts legacy speed object to string on render', () => {
    renderEditor({
      template: { ...BASE_TEMPLATE, speed: { walk: '30 ft.', fly: '60 ft.' } as unknown as string },
    });
    expect(screen.getByLabelText(/^speed$/i)).toHaveValue('walk 30 ft., fly 60 ft.');
  });

  it('renders challenge rating input pre-populated from template prop', () => {
    renderEditor();
    expect(screen.getByLabelText(/challenge rating/i)).toHaveValue(0.25);
  });

  it('renders source input pre-populated from template prop', () => {
    renderEditor();
    expect(screen.getByLabelText(/^source$/i)).toHaveValue('Monster Manual');
  });

  it('renders description textarea pre-populated from template prop', () => {
    renderEditor();
    expect(screen.getByLabelText(/description \/ notes/i)).toHaveValue('A sneaky goblin.');
  });
});

describe('MonsterTemplateEditor — save callback', () => {
  it('calls onSave with updated name on Save click', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    renderEditor({ onSave });
    const nameInput = screen.getByLabelText(/^name$/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Hobgoblin');
    await user.click(screen.getByRole('button', { name: /save personal monster/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Hobgoblin' }));
  });

  it('disables Save and does not call onSave when name is empty', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    renderEditor({ onSave });
    const nameInput = screen.getByLabelText(/^name$/i);
    await user.clear(nameInput);
    expect(screen.getByRole('button', { name: /save personal monster/i })).toBeDisabled();
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

  it('shows "Global Monster" title when isGlobal is true and isNew is true', () => {
    renderEditor({ isGlobal: true, isNew: true });
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Create Global Monster');
  });

  it('shows "Personal Monster" title when isGlobal is false and isNew is true', () => {
    renderEditor({ isGlobal: false, isNew: true });
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Create Personal Monster');
  });

  it('shows global save button label when isGlobal is true', () => {
    renderEditor({ isGlobal: true });
    expect(screen.getByRole('button', { name: /save global monster/i })).toBeInTheDocument();
  });
});

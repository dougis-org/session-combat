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
  CreatureStatsForm: jest.fn(({ stats, onChange }: { stats: any; onChange: (s: any) => void }) => (
    <button
      data-testid="creature-stats-form"
      data-ac={stats.ac}
      onClick={() => onChange({ ...stats, ac: 99 })}
    >
      Trigger Stats Change
    </button>
  )),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonsterStatEditor } from '@/lib/components/MonsterStatEditor';
import { CreatureStatsForm } from '@/lib/components/CreatureStatsForm';
import type { MonsterEditableFields } from '@/lib/types';

const MockCreatureStatsForm = CreatureStatsForm as jest.MockedFunction<typeof CreatureStatsForm>;

const BASE_VALUE: MonsterEditableFields = {
  name: 'Goblin',
  size: 'small',
  type: 'humanoid',
  alignment: 'Neutral Evil',
  speed: '30 ft.',
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
  ac: 15,
  hp: 7,
  maxHp: 10,
};

function renderEditor(
  value: MonsterEditableFields = BASE_VALUE,
  onChange: jest.Mock = jest.fn(),
) {
  return render(<MonsterStatEditor value={value} onChange={onChange} />);
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('MonsterStatEditor — header field rendering', () => {
  it('renders name input pre-populated from value prop', () => {
    renderEditor();
    expect(screen.getByLabelText(/^name$/i)).toHaveValue('Goblin');
  });

  it('renders size select pre-populated from value prop', () => {
    renderEditor();
    expect(screen.getByLabelText(/^size$/i)).toHaveValue('small');
  });

  it('renders type input pre-populated from value prop', () => {
    renderEditor();
    expect(screen.getByLabelText(/^type$/i)).toHaveValue('humanoid');
  });

  it('renders alignment selector with current alignment', () => {
    renderEditor();
    expect(screen.getByRole('combobox', { name: /alignment/i })).toHaveValue('Neutral Evil');
  });

  it('renders speed input pre-populated from value prop', () => {
    renderEditor();
    expect(screen.getByLabelText(/^speed$/i)).toHaveValue('30 ft.');
  });

  it('renders challenge rating input pre-populated from value prop', () => {
    renderEditor();
    expect(screen.getByLabelText(/challenge rating/i)).toHaveValue(0.25);
  });

  it('renders source input pre-populated from value prop', () => {
    renderEditor();
    expect(screen.getByLabelText(/^source$/i)).toHaveValue('Monster Manual');
  });

  it('renders description textarea pre-populated from value prop', () => {
    renderEditor();
    expect(screen.getByLabelText(/description \/ notes/i)).toHaveValue('A sneaky goblin.');
  });
});

describe('MonsterStatEditor — CreatureStatsForm delegation', () => {
  it('renders CreatureStatsForm', () => {
    renderEditor();
    expect(screen.getByTestId('creature-stats-form')).toBeInTheDocument();
  });

  it('passes the CreatureStats portion of value to CreatureStatsForm', () => {
    renderEditor();
    const lastProps = MockCreatureStatsForm.mock.calls[0][0];
    expect(lastProps.stats).toMatchObject({ ac: 15, hp: 7, maxHp: 10 });
  });
});

describe('MonsterStatEditor — header field onChange', () => {
  it('calls onChange with updated name when name field changes', () => {
    const onChange = jest.fn();
    renderEditor(BASE_VALUE, onChange);
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Hobgoblin' } });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'Hobgoblin' }),
    );
  });

  it('calls onChange with updated size when size select changes', () => {
    const onChange = jest.fn();
    renderEditor(BASE_VALUE, onChange);
    fireEvent.change(screen.getByLabelText(/^size$/i), { target: { value: 'large' } });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ size: 'large' }),
    );
  });

  it('calls onChange with updated type when type field changes', () => {
    const onChange = jest.fn();
    renderEditor(BASE_VALUE, onChange);
    fireEvent.change(screen.getByLabelText(/^type$/i), { target: { value: 'beast' } });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'beast' }),
    );
  });

  it('calls onChange with updated speed when speed field changes', () => {
    const onChange = jest.fn();
    renderEditor(BASE_VALUE, onChange);
    fireEvent.change(screen.getByLabelText(/^speed$/i), { target: { value: '40 ft.' } });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ speed: '40 ft.' }),
    );
  });

  it('calls onChange with updated challengeRating when CR field changes', () => {
    const onChange = jest.fn();
    renderEditor(BASE_VALUE, onChange);
    fireEvent.change(screen.getByLabelText(/challenge rating/i), { target: { value: '1' } });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ challengeRating: 1 }),
    );
  });

  it('calls onChange with updated source when source field changes', () => {
    const onChange = jest.fn();
    renderEditor(BASE_VALUE, onChange);
    fireEvent.change(screen.getByLabelText(/^source$/i), { target: { value: 'Volo\'s Guide' } });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ source: "Volo's Guide" }),
    );
  });

  it('calls onChange with undefined source when source is cleared', () => {
    const onChange = jest.fn();
    renderEditor(BASE_VALUE, onChange);
    fireEvent.change(screen.getByLabelText(/^source$/i), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ source: undefined }),
    );
  });
});

describe('MonsterStatEditor — CreatureStatsForm onChange', () => {
  it('calls onChange with merged MonsterEditableFields when CreatureStatsForm fires onChange', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderEditor(BASE_VALUE, onChange);
    await user.click(screen.getByTestId('creature-stats-form'));
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).toMatchObject({ ac: 99, name: 'Goblin' });
  });
});

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/preferences/usePreferences', () => ({
  usePreferences: jest.fn(),
}));

// We must mock ProtectedRoute if it does complex things, but usually it just returns children when authenticated.
jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => {
    const { useAuth } = require('@/lib/hooks/useAuth');
    const { isAuthenticated, loading } = useAuth();
    if (loading || !isAuthenticated) return null;
    return <>{children}</>;
  }
}));

jest.mock('@/lib/components/NavBar', () => ({
  NavBar: () => <div data-testid="navbar">Mock NavBar</div>
}));

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from '@/app/profile/page';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePreferences } from '@/lib/preferences/usePreferences';
import { DEFAULT_PREFERENCES, PreferenceValues } from '@/lib/preferences/schema';

const mockedUseAuth = jest.mocked(useAuth);
const mockedUsePreferences = jest.mocked(usePreferences);

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>>) {
  mockedUseAuth.mockReturnValue({
    isAuthenticated: true,
    loading: false,
    logout: jest.fn() as never,
    user: { userId: 'u1', email: 'u@test.com', username: 'douglas' },
    login: jest.fn() as never,
    register: jest.fn() as never,
    error: null,
    ...overrides,
  });
}

type DeepPartialPrefs = {
  dice?: Partial<PreferenceValues['dice']>;
  chat?: Partial<PreferenceValues['chat']>;
  combat?: Partial<PreferenceValues['combat']>;
};

/** Seed usePreferences() with defaults + overrides and return the setPreference spy. */
function mockPreferences(prefOverrides: DeepPartialPrefs = {}): jest.Mock {
  const setPreference = jest.fn();
  mockedUsePreferences.mockReturnValue({
    preferences: {
      dice: { ...DEFAULT_PREFERENCES.dice, ...prefOverrides.dice },
      chat: { ...DEFAULT_PREFERENCES.chat, ...prefOverrides.chat },
      combat: { ...DEFAULT_PREFERENCES.combat, ...prefOverrides.combat },
    },
    setPreference,
    ready: true,
  });
  return setPreference;
}

describe('ProfilePage', () => {
  beforeEach(() => {
    mockAuth({});
    mockPreferences();
  });

  it('renders without crashing for authenticated user', () => {
    render(<ProfilePage />);
    expect(screen.getByRole('heading', { name: 'Profile & Settings' })).toBeInTheDocument();
  });

  it('redirects unauthenticated user via ProtectedRoute', () => {
    mockAuth({ isAuthenticated: false, loading: false });
    render(<ProfilePage />);
    expect(screen.queryByRole('heading', { name: 'Profile & Settings' })).not.toBeInTheDocument();
  });

  it('renders every preference control with an accessible name', () => {
    render(<ProfilePage />);
    expect(screen.getByLabelText(/Auto-send rolls to session chat/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Dice Animation')).toBeInTheDocument();
    expect(screen.getByLabelText(/Dice Color — Foreground/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dice Color — Background/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Dice Surface')).toBeInTheDocument();
    expect(screen.getByLabelText('Dice Material')).toBeInTheDocument();
    expect(screen.getByLabelText(/Pin chat by default/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Auto-scroll to next combatant/i)).toBeInTheDocument();
  });

  it('no longer renders a single "Dice Color (Hex)" field', () => {
    render(<ProfilePage />);
    expect(screen.queryByLabelText('Dice Color (Hex)')).not.toBeInTheDocument();
  });

  describe('dice.sendToChat', () => {
    it('binds the checkbox to setPreference', async () => {
      const user = userEvent.setup();
      const setPreference = mockPreferences();
      render(<ProfilePage />);
      await user.click(screen.getByLabelText(/Auto-send rolls to session chat/i));
      expect(setPreference).toHaveBeenCalledWith('dice.sendToChat', true);
    });

    it('reflects a stored true value as checked', () => {
      mockPreferences({ dice: { sendToChat: true } });
      render(<ProfilePage />);
      expect(screen.getByLabelText(/Auto-send rolls to session chat/i)).toBeChecked();
    });
  });

  describe('dice.disableAnimation select', () => {
    it.each([
      ['System Default (Prefers Reduced Motion)', null],
      ['Enabled', false],
      ['Disabled', true],
    ] as const)('maps "%s" to setPreference', async (optionLabel, expected) => {
      const user = userEvent.setup();
      // start from a value other than the target so selectOptions fires onChange
      const setPreference = mockPreferences({ dice: { disableAnimation: expected === null ? true : null } });
      render(<ProfilePage />);
      await user.selectOptions(screen.getByLabelText('Dice Animation'), optionLabel);
      expect(setPreference).toHaveBeenCalledWith('dice.disableAnimation', expected);
    });

    it.each([
      [null, 'system'],
      [false, 'enabled'],
      [true, 'disabled'],
    ] as const)('renders stored value as the matching option', (stored, expectedValue) => {
      mockPreferences({ dice: { disableAnimation: stored } });
      render(<ProfilePage />);
      expect(screen.getByLabelText<HTMLSelectElement>('Dice Animation').value).toBe(expectedValue);
    });
  });

  describe('dice.surface select', () => {
    it('calls setPreference with the chosen surface value', async () => {
      const user = userEvent.setup();
      const setPreference = mockPreferences();
      render(<ProfilePage />);
      await user.selectOptions(screen.getByLabelText('Dice Surface'), 'Wood Table');
      expect(setPreference).toHaveBeenCalledWith('dice.surface', 'wood-table');
    });

    it('maps the "Default" option back to null', async () => {
      const user = userEvent.setup();
      const setPreference = mockPreferences({ dice: { surface: 'metal' } });
      render(<ProfilePage />);
      await user.selectOptions(screen.getByLabelText('Dice Surface'), 'Default');
      expect(setPreference).toHaveBeenCalledWith('dice.surface', null);
    });

    it('renders a stored surface as the selected option', () => {
      mockPreferences({ dice: { surface: 'wood-tray' } });
      render(<ProfilePage />);
      expect(screen.getByLabelText<HTMLSelectElement>('Dice Surface').value).toBe('wood-tray');
    });

    it('renders a null surface as "Default"', () => {
      render(<ProfilePage />);
      expect(screen.getByLabelText<HTMLSelectElement>('Dice Surface').value).toBe('default');
    });

    it('offers exactly the supported surfaces', () => {
      render(<ProfilePage />);
      const options = Array.from(
        screen.getByLabelText<HTMLSelectElement>('Dice Surface').options,
      ).map((o) => o.value);
      expect(options).toEqual(['default', 'green-felt', 'wood-table', 'wood-tray', 'metal']);
    });
  });

  describe('dice.material select', () => {
    it('calls setPreference with the chosen material value', async () => {
      const user = userEvent.setup();
      const setPreference = mockPreferences();
      render(<ProfilePage />);
      await user.selectOptions(screen.getByLabelText('Dice Material'), 'Wood');
      expect(setPreference).toHaveBeenCalledWith('dice.material', 'wood');
    });

    it('maps the "Default" option back to null', async () => {
      const user = userEvent.setup();
      const setPreference = mockPreferences({ dice: { material: 'metal' } });
      render(<ProfilePage />);
      await user.selectOptions(screen.getByLabelText('Dice Material'), 'Default');
      expect(setPreference).toHaveBeenCalledWith('dice.material', null);
    });

    it('renders a stored material as the selected option', () => {
      mockPreferences({ dice: { material: 'glass' } });
      render(<ProfilePage />);
      expect(screen.getByLabelText<HTMLSelectElement>('Dice Material').value).toBe('glass');
    });

    it('offers exactly the supported materials', () => {
      render(<ProfilePage />);
      const options = Array.from(
        screen.getByLabelText<HTMLSelectElement>('Dice Material').options,
      ).map((o) => o.value);
      expect(options).toEqual(['default', 'glass', 'none', 'metal', 'wood']);
    });
  });

  describe('dice.color foreground/background inputs', () => {
    it('filling both hex fields commits a { foreground, background } object', () => {
      const setPreference = mockPreferences();
      render(<ProfilePage />);
      fireEvent.change(screen.getByLabelText(/Dice Color — Foreground/i), { target: { value: '#000' } });
      fireEvent.change(screen.getByLabelText(/Dice Color — Background/i), { target: { value: '#f00' } });
      expect(setPreference).toHaveBeenLastCalledWith('dice.color', { foreground: '#000', background: '#f00' });
    });

    it('clearing both fields commits null', () => {
      const setPreference = mockPreferences({ dice: { color: { foreground: '#000', background: '#f00' } } });
      render(<ProfilePage />);
      fireEvent.change(screen.getByLabelText(/Dice Color — Foreground/i), { target: { value: '' } });
      fireEvent.change(screen.getByLabelText(/Dice Color — Background/i), { target: { value: '' } });
      expect(setPreference).toHaveBeenLastCalledWith('dice.color', null);
    });

    it('renders the stored colour as the field values', () => {
      mockPreferences({ dice: { color: { foreground: '#123456', background: '#abcdef' } } });
      render(<ProfilePage />);
      expect(screen.getByLabelText<HTMLInputElement>(/Dice Color — Foreground/i).value).toBe('#123456');
      expect(screen.getByLabelText<HTMLInputElement>(/Dice Color — Background/i).value).toBe('#abcdef');
    });

    it('does not persist an invalid foreground entry and shows a visible error', () => {
      const setPreference = mockPreferences();
      render(<ProfilePage />);
      const field = screen.getByLabelText(/Dice Color — Foreground/i);
      fireEvent.change(field, { target: { value: '#zz' } });
      expect(setPreference).not.toHaveBeenCalled();
      expect(field).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('alert')).toHaveTextContent(/short hex colour/i);
      expect((field as HTMLInputElement).value).toBe('#zz');
    });

    it('does not persist while only one field is filled in', () => {
      const setPreference = mockPreferences();
      render(<ProfilePage />);
      fireEvent.change(screen.getByLabelText(/Dice Color — Foreground/i), { target: { value: '#000' } });
      expect(setPreference).not.toHaveBeenCalled();
    });
  });

  describe('chat.pinned', () => {
    it('binds the checkbox to setPreference', async () => {
      const user = userEvent.setup();
      const setPreference = mockPreferences();
      render(<ProfilePage />);
      await user.click(screen.getByLabelText(/Pin chat by default/i));
      expect(setPreference).toHaveBeenCalledWith('chat.pinned', true);
    });

    it('reflects a stored true value as checked', () => {
      mockPreferences({ chat: { pinned: true } });
      render(<ProfilePage />);
      expect(screen.getByLabelText(/Pin chat by default/i)).toBeChecked();
    });
  });

  describe('combat.autoScrollToNextCombatant', () => {
    it('binds the checkbox to setPreference', async () => {
      const user = userEvent.setup();
      const setPreference = mockPreferences({ combat: { autoScrollToNextCombatant: false } });
      render(<ProfilePage />);
      await user.click(screen.getByLabelText(/Auto-scroll to next combatant/i));
      expect(setPreference).toHaveBeenCalledWith('combat.autoScrollToNextCombatant', true);
    });

    it('reflects the default true value as checked', () => {
      mockPreferences();
      render(<ProfilePage />);
      expect(screen.getByLabelText(/Auto-scroll to next combatant/i)).toBeChecked();
    });

    it('reflects a stored false value as unchecked', () => {
      mockPreferences({ combat: { autoScrollToNextCombatant: false } });
      render(<ProfilePage />);
      expect(screen.getByLabelText(/Auto-scroll to next combatant/i)).not.toBeChecked();
    });
  });
});

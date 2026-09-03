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
};

/** Seed usePreferences() with defaults + overrides and return the setPreference spy. */
function mockPreferences(prefOverrides: DeepPartialPrefs = {}): jest.Mock {
  const setPreference = jest.fn();
  mockedUsePreferences.mockReturnValue({
    preferences: {
      dice: { ...DEFAULT_PREFERENCES.dice, ...prefOverrides.dice },
      chat: { ...DEFAULT_PREFERENCES.chat, ...prefOverrides.chat },
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
    expect(screen.getByLabelText('Dice Color (Hex)')).toBeInTheDocument();
    expect(screen.getByLabelText('Dice Surface')).toBeInTheDocument();
    expect(screen.getByLabelText(/Pin chat by default/i)).toBeInTheDocument();
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
    it('calls setPreference with the chosen surface string', async () => {
      const user = userEvent.setup();
      const setPreference = mockPreferences();
      render(<ProfilePage />);
      await user.selectOptions(screen.getByLabelText('Dice Surface'), 'Wood');
      expect(setPreference).toHaveBeenCalledWith('dice.surface', 'wood');
    });

    it('maps the "Default" option back to null', async () => {
      const user = userEvent.setup();
      const setPreference = mockPreferences({ dice: { surface: 'metal' } });
      render(<ProfilePage />);
      await user.selectOptions(screen.getByLabelText('Dice Surface'), 'Default');
      expect(setPreference).toHaveBeenCalledWith('dice.surface', null);
    });

    it('renders a stored surface as the selected option', () => {
      mockPreferences({ dice: { surface: 'stone' } });
      render(<ProfilePage />);
      expect(screen.getByLabelText<HTMLSelectElement>('Dice Surface').value).toBe('stone');
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
      expect(options).toEqual(['default', 'wood', 'metal', 'stone', 'felt']);
    });
  });

  describe('dice.color input', () => {
    it('pushes a valid hex value to setPreference', () => {
      const setPreference = mockPreferences();
      render(<ProfilePage />);
      fireEvent.change(screen.getByLabelText('Dice Color (Hex)'), { target: { value: '#f00' } });
      expect(setPreference).toHaveBeenCalledWith('dice.color', '#f00');
    });

    it('maps a cleared field back to null', () => {
      const setPreference = mockPreferences({ dice: { color: '#aabbcc' } });
      render(<ProfilePage />);
      fireEvent.change(screen.getByLabelText('Dice Color (Hex)'), { target: { value: '' } });
      expect(setPreference).toHaveBeenCalledWith('dice.color', null);
    });

    it('renders the stored colour as the field value', () => {
      mockPreferences({ dice: { color: '#123456' } });
      render(<ProfilePage />);
      expect(screen.getByLabelText<HTMLInputElement>('Dice Color (Hex)').value).toBe('#123456');
    });

    it('does not persist an invalid entry and shows a visible error', () => {
      const setPreference = mockPreferences();
      render(<ProfilePage />);
      const field = screen.getByLabelText('Dice Color (Hex)');
      fireEvent.change(field, { target: { value: '#zz' } });
      expect(setPreference).not.toHaveBeenCalled();
      expect(field).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('alert')).toHaveTextContent(/short hex colour/i);
      // the typed (invalid) text stays visible for the user to correct
      expect((field as HTMLInputElement).value).toBe('#zz');
    });

    it('persists once a previously-invalid entry becomes valid', () => {
      const setPreference = mockPreferences();
      render(<ProfilePage />);
      const field = screen.getByLabelText('Dice Color (Hex)');
      fireEvent.change(field, { target: { value: '#f0' } });
      expect(setPreference).not.toHaveBeenCalled();
      fireEvent.change(field, { target: { value: '#f0f' } });
      expect(setPreference).toHaveBeenCalledWith('dice.color', '#f0f');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
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
});

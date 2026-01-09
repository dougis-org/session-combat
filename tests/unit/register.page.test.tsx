import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '@/app/register/page';
import * as useAuthModule from '@/lib/hooks/useAuth';
import * as nextRouterModule from 'next/navigation';

// Mock dependencies
jest.mock('@/lib/hooks/useAuth');
jest.mock('next/navigation');
jest.mock('next/link', () => {
  return function MockedLink(props: any) {
    return React.createElement('a', { href: props.href }, props.children);
  };
});

describe('RegisterPage Component', () => {
  const mockPush = jest.fn();
  const mockRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (nextRouterModule.useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useAuthModule.useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      loading: false,
      error: '',
      isAuthenticated: false,
    });
  });

  describe('Submit Button Disabled State', () => {
    it('should disable submit button when password is empty', () => {
      render(React.createElement(RegisterPage));
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when password is too short', async () => {
      render(React.createElement(RegisterPage));
      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;

      await userEvent.type(passwordInput, 'Short1A');

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when password missing uppercase', async () => {
      render(React.createElement(RegisterPage));
      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;

      await userEvent.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when password missing lowercase', async () => {
      render(React.createElement(RegisterPage));
      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;

      await userEvent.type(passwordInput, 'PASSWORD123');

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when password missing digit', async () => {
      render(React.createElement(RegisterPage));
      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;

      await userEvent.type(passwordInput, 'PasswordNoNum');

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when password meets all requirements', async () => {
      render(React.createElement(RegisterPage));
      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;

      await userEvent.type(passwordInput, 'SecurePassword123');

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });
      expect(submitButton).toBeEnabled();
    });

    it('should disable submit button when loading', async () => {
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        register: mockRegister,
        loading: true,
        error: '',
        isAuthenticated: false,
      });

      render(React.createElement(RegisterPage));
      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;

      await userEvent.type(passwordInput, 'SecurePassword123');

      const submitButton = screen.getByRole('button');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Password Requirement Hints', () => {
    it('should display password requirements section', () => {
      render(React.createElement(RegisterPage));
      expect(screen.getByText(/password requirements/i)).toBeInTheDocument();
    });

    it('should display all requirement checks', () => {
      render(React.createElement(RegisterPage));
      expect(
        screen.getByText(/at least 8 characters/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/lowercase letter/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/uppercase letter/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/number/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show client validation error for invalid email', async () => {
      render(React.createElement(RegisterPage));

      const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      const confirmPasswordInput = passwordInputs[1] as HTMLInputElement;
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.type(passwordInput, 'SecurePassword123');
      await userEvent.type(confirmPasswordInput, 'SecurePassword123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });

    it('should show error when passwords do not match', async () => {
      render(React.createElement(RegisterPage));

      const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      const passwordInput = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordInput = passwordInputs[1] as HTMLInputElement;
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'SecurePassword123');
      await userEvent.type(confirmPasswordInput, 'DifferentPassword123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/passwords do not match/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Double-Submit Prevention', () => {
    it('should disable submit button while loading', async () => {
      const { rerender } = render(React.createElement(RegisterPage));
      let submitButton = screen.getByRole('button', {
        name: /create account/i,
      });
      expect(submitButton).toHaveTextContent(/create account/i);

      // Update to loading state
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        register: mockRegister,
        loading: true,
        error: '',
        isAuthenticated: false,
      });

      rerender(React.createElement(RegisterPage));

      submitButton = screen.getByRole('button');
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(/creating account/i);
    });
  });

  describe('Successful Registration', () => {
    it('should redirect to home on successful registration', async () => {
      mockRegister.mockResolvedValue(true);

      render(React.createElement(RegisterPage));

      const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      const passwordInput = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordInput = passwordInputs[1] as HTMLInputElement;
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'SecurePassword123');
      await userEvent.type(confirmPasswordInput, 'SecurePassword123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Redirect on Already Authenticated', () => {
    it('should redirect to home if already authenticated', () => {
      (useAuthModule.useAuth as jest.Mock).mockReturnValue({
        register: mockRegister,
        loading: false,
        error: '',
        isAuthenticated: true,
      });

      render(React.createElement(RegisterPage));

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});

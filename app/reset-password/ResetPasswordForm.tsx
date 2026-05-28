'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

type State = 'idle' | 'loading' | 'success' | 'invalid-token' | 'error';

interface Props {
  token: string;
}

export default function ResetPasswordForm({ token }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [state, setState] = useState<State>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setState('loading');

    try {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setState('success');
        return;
      }

      if (res.status === 429) {
        setErrorMessage('Too many requests. Please wait before trying again.');
        setState('error');
        return;
      }

      const body = await res.json().catch(() => ({}));

      if (res.status === 400) {
        if (body.details) {
          setErrorMessage(
            Array.isArray(body.details) ? body.details.join('. ') : String(body.details)
          );
          setState('error');
          return;
        }
        setState('invalid-token');
        return;
      }

      setErrorMessage(body.error || 'Something went wrong. Please try again.');
      setState('error');
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
      setState('error');
    }
  };

  if (state === 'success') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Password reset</h1>
          <p className="text-gray-300 mb-6">
            Password reset successfully. You can now log in.
          </p>
          <Link
            href="/login"
            className="inline-block py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (state === 'invalid-token') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Link expired</h1>
          <p className="text-gray-300 mb-6">
            This link is invalid or has expired.
          </p>
          <Link
            href="/forgot-password"
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  const isLoading = state === 'loading';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Set new password</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              disabled={isLoading}
              required
              aria-describedby={errorMessage ? 'reset-error' : undefined}
            />
          </div>

          {errorMessage && (
            <div
              id="reset-error"
              role="alert"
              className="p-4 bg-red-900 border border-red-700 rounded text-red-200 text-sm"
            >
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            aria-disabled={isLoading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded transition-colors"
          >
            {isLoading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

type State = 'idle' | 'loading' | 'success' | 'error';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
          <h1 className="text-3xl font-bold text-white mb-4">Check your email</h1>
          <p className="text-gray-300">
            If an account exists for that address, a password reset link has been sent.
          </p>
          <p className="text-gray-400 text-sm mt-4">
            Didn&apos;t receive it? Check your spam folder or{' '}
            <button
              onClick={() => {
                setState('idle');
                setEmail('');
              }}
              className="text-blue-400 hover:text-blue-300 font-semibold underline"
            >
              try again
            </button>
            .
          </p>
        </div>
      </div>
    );
  }

  const isLoading = state === 'loading';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Forgot password?</h1>
        <p className="text-gray-400 text-sm text-center mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              disabled={isLoading}
              required
              aria-describedby={errorMessage ? 'forgot-error' : undefined}
            />
          </div>

          {errorMessage && (
            <div
              id="forgot-error"
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
            {isLoading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Remembered it?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

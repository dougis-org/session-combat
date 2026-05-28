'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { AuthCard } from '@/lib/components/AuthCard';
import { FormError } from '@/lib/components/ui';
import { safeJson } from '@/lib/utils/http';

type Phase =
  | { tag: 'idle' | 'loading' | 'success' }
  | { tag: 'error'; message: string };

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<Phase>({ tag: 'idle' });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPhase({ tag: 'loading' });

    try {
      const res = await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) { setPhase({ tag: 'success' }); return; }

      if (res.status === 429) {
        setPhase({ tag: 'error', message: 'Too many requests. Please wait before trying again.' });
        return;
      }

      const body = await safeJson(res);
      setPhase({ tag: 'error', message: String(body.error || 'Something went wrong. Please try again.') });
    } catch {
      setPhase({ tag: 'error', message: 'Something went wrong. Please try again.' });
    }
  };

  if (phase.tag === 'success') {
    return (
      <AuthCard center>
        <h1 className="text-3xl font-bold text-white mb-4">Check your email</h1>
        <p className="text-gray-300">
          If an account exists for that address, a password reset link has been sent.
        </p>
        <p className="text-gray-400 text-sm mt-4">
          Didn&apos;t receive it? Check your spam folder or{' '}
          <button
            onClick={() => { setPhase({ tag: 'idle' }); setEmail(''); }}
            className="text-blue-400 hover:text-blue-300 font-semibold underline"
          >
            try again
          </button>
          .
        </p>
      </AuthCard>
    );
  }

  const isLoading = phase.tag === 'loading';

  return (
    <AuthCard>
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
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            disabled={isLoading}
            required
            aria-describedby={phase.tag === 'error' ? 'forgot-error' : undefined}
          />
        </div>

        {phase.tag === 'error' && (
          <FormError id="forgot-error" message={phase.message} />
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
    </AuthCard>
  );
}

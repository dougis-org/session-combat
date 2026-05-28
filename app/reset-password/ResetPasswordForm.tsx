'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { AuthCard } from '@/lib/components/AuthCard';
import { FormError, SubmitButton } from '@/lib/components/ui';
import { safeJson } from '@/lib/utils/http';

type Phase =
  | { tag: 'idle' | 'loading' | 'success' | 'invalid-token' }
  | { tag: 'error'; message: string };

interface Props {
  token: string;
}

export default function ResetPasswordForm({ token }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phase, setPhase] = useState<Phase>({ tag: 'idle' });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setPhase({ tag: 'error', message: 'Passwords do not match' });
      return;
    }

    setPhase({ tag: 'loading' });

    try {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) { setPhase({ tag: 'success' }); return; }

      if (res.status === 429) {
        setPhase({ tag: 'error', message: 'Too many requests. Please wait before trying again.' });
        return;
      }

      const body = await safeJson(res);

      if (res.status === 400) {
        if (body.details) {
          const msg = Array.isArray(body.details) ? body.details.join('. ') : String(body.details);
          setPhase({ tag: 'error', message: msg });
          return;
        }
        setPhase({ tag: 'invalid-token' });
        return;
      }

      setPhase({ tag: 'error', message: String(body.error || 'Something went wrong. Please try again.') });
    } catch {
      setPhase({ tag: 'error', message: 'Something went wrong. Please try again.' });
    }
  };

  if (phase.tag === 'success') {
    return (
      <AuthCard center>
        <h1 className="text-3xl font-bold text-white mb-4">Password reset</h1>
        <p className="text-gray-300 mb-6">Password reset successfully. You can now log in.</p>
        <Link href="/login" className="inline-block py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors">
          Go to login
        </Link>
      </AuthCard>
    );
  }

  if (phase.tag === 'invalid-token') {
    return (
      <AuthCard center>
        <h1 className="text-3xl font-bold text-white mb-4">Link expired</h1>
        <p className="text-gray-300 mb-6">This link is invalid or has expired.</p>
        <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300 font-semibold">
          Request a new reset link
        </Link>
      </AuthCard>
    );
  }

  const isLoading = phase.tag === 'loading';

  return (
    <AuthCard>
      <h1 className="text-3xl font-bold text-white mb-6 text-center">Set new password</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
            New Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            disabled={isLoading}
            required
            aria-describedby={phase.tag === 'error' ? 'reset-error' : undefined}
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            disabled={isLoading}
            required
          />
        </div>

        {phase.tag === 'error' && (
          <FormError id="reset-error" message={phase.message} />
        )}

        <SubmitButton isLoading={isLoading} label="Reset password" loadingLabel="Resetting…" />
      </form>
    </AuthCard>
  );
}

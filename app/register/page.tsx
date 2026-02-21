'use client';

import { FormEvent, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { validatePasswordForClient } from '@/lib/validation/password';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, error, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'No password', color: 'text-gray-400' };
    
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score < 2) return { score: 1, label: 'Weak', color: 'text-red-400' };
    if (score < 4) return { score: 2, label: 'Fair', color: 'text-yellow-400' };
    if (score < 6) return { score: 3, label: 'Good', color: 'text-green-400' };
    return { score: 4, label: 'Strong', color: 'text-green-500' };
  };

  const strength = getPasswordStrength(password);

  // Memoize password validation to avoid recalculating on every render
  const passwordValidation = useMemo(
    () => validatePasswordForClient(password),
    [password]
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');

    // Client-side validation
    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setFormError('Password is required');
      return;
    }

    if (!passwordValidation.valid) {
      setFormError(passwordValidation.errors[0] || 'Password does not meet requirements');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    const success = await register(email, password);
    if (success) {
      router.push('/');
      return; // Exit early after successful registration and redirect
    } else {
      setFormError(error || 'Registration failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Create Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
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
              disabled={loading}
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              disabled={loading}
            />
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1 rounded ${
                      i < strength.score ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs font-medium ${strength.color}`}>
                Password Strength: {strength.label}
              </p>
            </div>
          )}

          {/* Password Requirements */}
          <div className="bg-gray-700 rounded p-3 text-xs text-gray-300 space-y-1">
            <p className="font-semibold text-gray-200 mb-2">Password requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li className={password.length >= 8 ? 'text-green-400' : 'text-gray-400'}>
                At least 8 characters
              </li>
              <li className={/[a-z]/.test(password) ? 'text-green-400' : 'text-gray-400'}>
                Lowercase letter (a-z)
              </li>
              <li className={/[A-Z]/.test(password) ? 'text-green-400' : 'text-gray-400'}>
                Uppercase letter (A-Z)
              </li>
              <li className={/[0-9]/.test(password) ? 'text-green-400' : 'text-gray-400'}>
                Number (0-9)
              </li>
            </ul>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              disabled={loading}
            />
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Error Message */}
          {(formError || error) && (
            <div className="p-4 bg-red-900 border border-red-700 rounded text-red-200 text-sm">
              {formError || error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !passwordValidation.valid}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded transition-colors"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

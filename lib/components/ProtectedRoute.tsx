'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center p-8 bg-gray-800 rounded-lg max-w-md">
          <h2 className="text-red-400 text-xl font-bold mb-4">Authentication Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

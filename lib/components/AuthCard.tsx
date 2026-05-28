import React from 'react';

interface Props {
  children: React.ReactNode;
  center?: boolean;
}

export function AuthCard({ children, center = false }: Props) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className={`w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg${center ? ' text-center' : ''}`}>
        {children}
      </div>
    </div>
  );
}

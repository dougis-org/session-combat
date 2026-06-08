'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

type ToastType = 'success' | 'error';

interface ToastState {
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3000);
    timerRef.current = timer;
    (timer as unknown as { unref?: () => void }).unref?.();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { toast, showToast };
}

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;

  const bgClass = toast.type === 'success' ? 'bg-green-700' : 'bg-red-700';

  return (
    <div
      role="status"
      className={`fixed bottom-6 right-6 px-5 py-3 rounded-full text-white text-sm font-medium shadow-lg ${bgClass}`}
    >
      {toast.message}
    </div>
  );
}

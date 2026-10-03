'use client';

import React, { ReactNode, useEffect, useRef } from 'react';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

// Open modals, oldest first. Only the topmost handles Escape.
const openModalStack: symbol[] = [];

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  size?: 'small' | 'medium' | 'large';
  titleId?: string;
  /** When false, the header "×" is removed from tab order (still clickable). */
  closeButtonTabbable?: boolean;
  /** Opt in to focus containment: focuses the first tabbable, wraps Tab, restores focus on close. */
  trapFocus?: boolean;
}

export function Modal({ isOpen, title, children, onClose, size = 'medium', titleId = 'modal-title', closeButtonTabbable = true, trapFocus = false }: ModalProps) {

  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, isOpen && trapFocus);

  useEffect(() => {
    if (!isOpen) return;

    const modalId = Symbol('modal');
    openModalStack.push(modalId);

    // Prevent body scrolling when modal is open
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Handle Escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && openModalStack[openModalStack.length - 1] === modalId) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      const index = openModalStack.indexOf(modalId);
      if (index !== -1) openModalStack.splice(index, 1);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-sm',
    medium: 'max-w-md',
    large: 'max-w-2xl',
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking on the overlay itself, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div
        ref={dialogRef}
        className={`${sizeClasses[size]} w-full mx-4 bg-gray-800 rounded-lg shadow-lg`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 id={titleId} className="text-xl font-semibold text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close modal"
            tabIndex={closeButtonTabbable ? undefined : -1}
          >
            ×
          </button>
        </div>
        <div className="p-6 max-h-96 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

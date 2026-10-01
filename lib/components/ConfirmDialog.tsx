'use client';

import React, { ReactNode } from 'react';
import { Modal } from '@/lib/components/Modal';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  /** Unique per mounted dialog so aria-labelledby never collides. */
  titleId: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  /** Also invoked by the header "×", Escape, and overlay click. */
  onCancel: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  isOpen,
  title,
  titleId,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} title={title} titleId={titleId} onClose={onCancel} size="small">
      <div className="text-gray-300 mb-6">{children}</div>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          data-testid="confirm-dialog-cancel"
          onClick={onCancel}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          data-testid="confirm-dialog-confirm"
          onClick={onConfirm}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

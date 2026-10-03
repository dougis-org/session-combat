'use client';

import React, { ReactNode } from 'react';
import { Modal } from '@/lib/components/Modal';

export type ConfirmDialogVariant = 'default' | 'danger';

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
  /** `danger` renders a red confirm and gray cancel; `default` green confirm, red cancel. */
  variant?: ConfirmDialogVariant;
  children?: ReactNode;
}

const BUTTON_CLASSES: Record<ConfirmDialogVariant, { confirm: string; cancel: string }> = {
  default: {
    confirm: 'bg-green-600 hover:bg-green-700',
    cancel: 'bg-red-600 hover:bg-red-700',
  },
  danger: {
    confirm: 'bg-red-600 hover:bg-red-700',
    cancel: 'bg-gray-600 hover:bg-gray-700',
  },
};

export function ConfirmDialog({
  isOpen,
  title,
  titleId,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = 'default',
  children,
}: ConfirmDialogProps) {
  const classes = BUTTON_CLASSES[variant];
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      titleId={titleId}
      onClose={onCancel}
      size="small"
      closeButtonTabbable={false}
      trapFocus
    >
      <div className="text-gray-300 mb-6">{children}</div>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          data-testid="confirm-dialog-confirm"
          onClick={onConfirm}
          className={`${classes.confirm} px-4 py-2 rounded`}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          data-testid="confirm-dialog-cancel"
          onClick={onCancel}
          className={`${classes.cancel} px-4 py-2 rounded`}
        >
          {cancelLabel}
        </button>
      </div>
    </Modal>
  );
}

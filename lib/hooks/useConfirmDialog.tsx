'use client';

import React, { ReactNode, useCallback, useId, useState } from 'react';
import { ConfirmDialog, ConfirmDialogVariant } from '@/lib/components/ConfirmDialog';

export interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  variant?: ConfirmDialogVariant;
  onConfirm: () => void;
}

/**
 * Owns open/close state and a unique titleId for a user-initiated confirmation.
 * Render `dialog` once; call `confirm(options)` to open it.
 */
export function useConfirmDialog() {
  const titleId = useId();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => setOptions(next), []);
  const close = useCallback(() => setOptions(null), []);

  const dialog = options ? (
    <ConfirmDialog
      isOpen
      title={options.title}
      titleId={titleId}
      confirmLabel={options.confirmLabel}
      cancelLabel={options.cancelLabel}
      variant={options.variant}
      onConfirm={() => {
        close();
        options.onConfirm();
      }}
      onCancel={close}
    >
      {options.message}
    </ConfirmDialog>
  ) : null;

  return { confirm, dialog };
}

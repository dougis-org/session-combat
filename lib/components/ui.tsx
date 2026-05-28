'use client';

import { ReactNode } from 'react';

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="p-4 bg-red-900 border border-red-700 rounded text-red-200 mb-6">
      {message}
    </div>
  );
}

export function ValidationError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="p-3 bg-red-900 border border-red-700 rounded text-red-200 mb-4">
      {message}
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-gray-400">{label}</p>
    </div>
  );
}

export function FormField({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block mb-1 text-sm font-semibold">{label}</label>
      {children}
    </div>
  );
}

export function EditorShell({
  title,
  validationError,
  onSave,
  onCancel,
  saving,
  canSave,
  saveLabel,
  children,
}: {
  title: string;
  validationError: string | null;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  canSave: boolean;
  saveLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6 border-2 border-blue-500">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <ValidationError message={validationError} />
      {children}
      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={saving || !canSave}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded"
        >
          {saving ? 'Saving...' : saveLabel}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function FormError({ id, message }: { id: string; message: string }) {
  return (
    <div id={id} role="alert" className="p-4 bg-red-900 border border-red-700 rounded text-red-200 text-sm">
      {message}
    </div>
  );
}

export function textInputClass() {
  return 'w-full bg-gray-700 rounded px-3 py-2 text-white';
}

export function TextInputField({
  id,
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <FormField label={label} htmlFor={id}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={textInputClass()}
        disabled={disabled}
        placeholder={placeholder}
      />
    </FormField>
  );
}

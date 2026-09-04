'use client';

import {
  buildMonsterImportExample,
  describeMonsterUploadSchema,
  type ValidationError,
} from '@/lib/validation/monsterUpload';

export type ImportScope = 'personal' | 'global';

export interface ImportResult {
  inserted: string[];
  skippedDuplicates: string[];
  reverted: boolean;
}

export function toErrorLines(errors: ValidationError[]): string[] {
  return errors.map((e) => (e.field ? `${e.field}: ${e.message}` : e.message));
}

/** Trigger a client-side download of the fully-populated example file. */
export function downloadMonsterExample(): void {
  const blob = new Blob(
    [JSON.stringify(buildMonsterImportExample(), null, 2)],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'monster-import-template.json';
  a.click();
  // Defer revocation — some browsers (notably Firefox) start the download
  // asynchronously and can fail if the object URL is revoked immediately.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function ImportError({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <div
      role="alert"
      data-testid="import-modal-error"
      className="p-3 bg-red-900 border border-red-700 rounded text-red-200 mb-4"
    >
      <ul className="list-disc list-inside space-y-1">
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}

export function IdleStage({
  validating,
  onFileSelected,
}: {
  validating: boolean;
  onFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const fields = describeMonsterUploadSchema();
  return (
    <>
      <p className="text-gray-300 text-sm mb-3">
        Upload a JSON file whose top level is an array of one or more monsters.{' '}
        <button
          type="button"
          onClick={downloadMonsterExample}
          className="text-purple-400 underline"
        >
          Download the required JSON structure
        </button>
        .
      </p>

      <details className="mb-4 bg-gray-900 rounded p-3 text-sm">
        <summary className="cursor-pointer text-gray-200">Accepted fields</summary>
        <table className="mt-3 w-full text-left">
          <thead>
            <tr className="text-gray-400">
              <th className="pr-3">Field</th>
              <th className="pr-3">Type</th>
              <th className="pr-3">Required</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.name} className="border-t border-gray-800">
                <td className="pr-3 font-mono">{f.name}</td>
                <td className="pr-3 text-gray-400">{f.type}</td>
                <td className="pr-3">{f.required ? 'required' : 'optional'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <label htmlFor="import-monster-file" className="block text-sm font-medium mb-2">
        Select JSON file
      </label>
      <input
        id="import-monster-file"
        type="file"
        accept=".json,application/json"
        disabled={validating}
        onChange={onFileSelected}
        className="w-full bg-gray-700 rounded px-3 py-2"
      />
      {validating && <p className="text-gray-400 text-sm mt-2">Validating…</p>}
    </>
  );
}

export function PreviewStage({
  names,
  isAdmin,
  scope,
  onScopeChange,
  onConfirm,
  onCancel,
}: {
  names: string[];
  isAdmin: boolean;
  scope: ImportScope;
  onScopeChange: (scope: ImportScope) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <p className="mb-3">
        <strong>{names.length}</strong>{' '}
        {names.length === 1 ? 'monster' : 'monsters'} to import:
      </p>
      <ul className="mb-4 max-h-48 overflow-y-auto list-disc list-inside text-gray-200">
        {names.map((n, i) => (
          <li key={`${n}-${i}`}>{n}</li>
        ))}
      </ul>

      {isAdmin && (
        <fieldset className="mb-4 border border-gray-700 rounded p-3">
          <legend className="text-sm text-gray-300 px-1">Import to</legend>
          <label className="mr-4">
            <input
              type="radio"
              name="import-scope"
              checked={scope === 'personal'}
              onChange={() => onScopeChange('personal')}
            />{' '}
            Personal
          </label>
          <label>
            <input
              type="radio"
              name="import-scope"
              checked={scope === 'global'}
              onChange={() => onScopeChange('global')}
            />{' '}
            Global
          </label>
        </fieldset>
      )}

      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold"
        >
          Confirm
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </>
  );
}

export function DoneStage({
  result,
  onClose,
}: {
  result: ImportResult;
  onClose: () => void;
}) {
  return (
    <>
      <p className="mb-2">
        Imported <strong>{result.inserted.length}</strong>{' '}
        {result.inserted.length === 1 ? 'monster' : 'monsters'}.
      </p>
      {result.skippedDuplicates.length > 0 && (
        <p className="text-gray-300 text-sm mb-4">
          Skipped {result.skippedDuplicates.length} duplicate
          {result.skippedDuplicates.length === 1 ? '' : 's'}:{' '}
          {result.skippedDuplicates.join(', ')}
        </p>
      )}
      <button
        onClick={onClose}
        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold"
      >
        Close
      </button>
    </>
  );
}

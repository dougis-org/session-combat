'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DoneStage,
  IdleStage,
  ImportError,
  PreviewStage,
  toErrorLines,
  type ImportResult,
  type ImportScope,
} from './importModalStages';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

type Stage = 'idle' | 'validating' | 'preview' | 'confirming' | 'done' | 'error';

export interface ImportMonstersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

function normalizeMonsterList(parsed: unknown): unknown[] | null {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    const maybe = (parsed as { monsters?: unknown }).monsters;
    if (Array.isArray(maybe)) return maybe;
  }
  return null;
}

export function ImportMonstersModal({
  isOpen,
  onClose,
  onImported,
}: ImportMonstersModalProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [errors, setErrors] = useState<string[]>([]);
  const [monsters, setMonsters] = useState<unknown[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scope, setScope] = useState<ImportScope>('personal');
  const [result, setResult] = useState<ImportResult | null>(null);
  const insertedRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    if (insertedRef.current) onImported();
    onClose();
  }, [onClose, onImported]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const fail = (messages: string[]) => {
    setErrors(messages);
    setStage('error');
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      fail(['File is too large. The maximum import size is 5 MB.']);
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      fail(['That file is not valid JSON.']);
      return;
    }

    const list = normalizeMonsterList(parsed);
    if (!list) {
      fail(['The file must be a JSON array of monsters, or a { "monsters": [...] } object.']);
      return;
    }

    setStage('validating');
    setErrors([]);
    try {
      const res = await fetch('/api/monsters/upload/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monsters: list }),
      });
      const data = await res.json();
      setIsAdmin(data.isAdmin === true);
      if (!res.ok || data.valid !== true) {
        fail(
          Array.isArray(data.errors) && data.errors.length > 0
            ? toErrorLines(data.errors)
            : [data.error ?? 'Validation failed.'],
        );
        return;
      }
      setMonsters(list);
      setNames(data.names ?? []);
      setStage('preview');
    } catch {
      fail(['Could not reach the server to validate the file.']);
    }
  };

  const confirmImport = async () => {
    setStage('confirming');
    setErrors([]);
    try {
      const res = await fetch('/api/monsters/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monsters, scope }),
      });
      const data = await res.json();
      if (res.ok) {
        const imported: ImportResult = {
          inserted: data.inserted ?? [],
          skippedDuplicates: data.skippedDuplicates ?? [],
          reverted: false,
        };
        setResult(imported);
        if (imported.inserted.length > 0) insertedRef.current = true;
        setStage('done');
        return;
      }
      if (data.reverted) {
        fail([
          'The import failed and was rolled back. No monsters were added. If the failure happened mid-write, a few monsters may need manual cleanup.',
        ]);
      } else {
        fail(
          Array.isArray(data.errors) && data.errors.length > 0
            ? toErrorLines(data.errors)
            : [data.error ?? 'The import failed.'],
        );
      }
    } catch {
      fail(['Could not reach the server to complete the import.']);
    }
  };

  const showIdle = stage === 'idle' || stage === 'validating' || stage === 'error';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8"
      onClick={handleClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Import monsters"
        className="max-w-2xl w-full mx-4 bg-gray-800 text-white rounded-lg p-6 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Import Monster(s)</h2>
          <button
            onClick={handleClose}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-white text-xl px-2"
          >
            ×
          </button>
        </div>

        <ImportError messages={errors} />

        {showIdle && (
          <IdleStage
            validating={stage === 'validating'}
            onFileSelected={onFileSelected}
          />
        )}

        {stage === 'preview' && (
          <PreviewStage
            names={names}
            isAdmin={isAdmin}
            scope={scope}
            onScopeChange={setScope}
            onConfirm={confirmImport}
            onCancel={handleClose}
          />
        )}

        {stage === 'confirming' && <p className="text-gray-300">Importing…</p>}

        {stage === 'done' && result && (
          <DoneStage result={result} onClose={handleClose} />
        )}
      </div>
    </div>
  );
}

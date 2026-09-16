'use client';

import { useEffect, useState } from 'react';
import type { StatusCondition, StatusConditionCatalogEntry } from '@/lib/types';

const MAX_CONDITION_NAME_LENGTH = 100;
const MAX_CONDITION_DURATION = 10_000;
const CUSTOM_OPTION = 'custom';

/**
 * Parse the free-text condition form, applying the same limits the old
 * `window.prompt` flow enforced: trimmed name 1..100 chars, optional
 * digits-only duration in `[1, 10_000]`. Returns `null` when invalid.
 */
export function parseConditionForm(
  nameInput: string,
  durationInput: string
): { name: string; duration: number | undefined } | null {
  const name = nameInput.trim();
  if (!name || name.length > MAX_CONDITION_NAME_LENGTH) return null;

  const durationStr = durationInput.trim();
  let duration: number | undefined;
  if (durationStr) {
    if (!/^\d+$/.test(durationStr)) return null;
    duration = Number(durationStr);
    if (!Number.isSafeInteger(duration) || duration < 1 || duration > MAX_CONDITION_DURATION) {
      return null;
    }
  }
  return { name, duration };
}

interface ConditionFormModalProps {
  /** Combatant name shown in the modal heading. */
  combatantName: string;
  onSubmit: (condition: StatusCondition) => void;
  onClose: () => void;
}

export function ConditionFormModal({ combatantName, onSubmit, onClose }: ConditionFormModalProps) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [selection, setSelection] = useState(CUSTOM_OPTION);
  const [catalog, setCatalog] = useState<StatusConditionCatalogEntry[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/conditions/catalog')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('catalog fetch failed'))))
      .then((entries: StatusConditionCatalogEntry[]) => {
        if (!cancelled) setCatalog(Array.isArray(entries) ? entries : []);
      })
      .catch((err) => {
        console.error('condition catalog fetch failed, falling back to custom entry', err);
        if (!cancelled) setCatalog([]);
      })
      .finally(() => {
        if (!cancelled) setCatalogLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const showDropdown = catalog.length > 0;
  const showEmptyNote = catalogLoaded && catalog.length === 0;
  const selectedEntry = catalog.find((c) => c.name === selection);
  const usingCustom = !selectedEntry;

  const handleAdd = () => {
    const parsed = parseConditionForm(selectedEntry ? selectedEntry.name : name, duration);
    if (!parsed) return;
    onSubmit({
      id: crypto.randomUUID(),
      name: parsed.name,
      description: selectedEntry ? selectedEntry.description : '',
      duration: parsed.duration,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      data-testid="condition-form-modal"
    >
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-sm mx-auto w-full">
        <h3 className="text-lg font-semibold mb-4 text-white">Add condition — {combatantName}</h3>
        <div className="space-y-3">
          {showDropdown && (
            <select
              value={selection}
              onChange={(e) => setSelection(e.target.value)}
              aria-label="Condition"
              data-testid="condition-catalog-select"
              className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {catalog.map((entry) => (
                <option key={entry.name} value={entry.name}>
                  {entry.name}
                </option>
              ))}
              <option value={CUSTOM_OPTION}>Custom…</option>
            </select>
          )}
          {showEmptyNote && (
            <p className="text-xs text-gray-400" data-testid="condition-catalog-empty-note">
              No default conditions loaded — enter a custom one.
            </p>
          )}
          {usingCustom ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Condition name"
              aria-label="Condition name"
              data-testid="condition-name-input"
              className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
          ) : (
            <p className="text-xs text-gray-300" data-testid="condition-catalog-description">
              {selectedEntry.description}
            </p>
          )}
          <input
            type="text"
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Duration in rounds (optional)"
            aria-label="Duration in rounds"
            data-testid="condition-duration-input"
            className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              data-testid="condition-form-add"
              className="flex-1 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-white font-semibold transition-colors"
            >
              Add
            </button>
            <button
              onClick={onClose}
              data-testid="condition-form-cancel"
              className="flex-1 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-white font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

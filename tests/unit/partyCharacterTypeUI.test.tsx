/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { act } from 'react';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

jest.mock('@/lib/components/ui', () => ({
  ErrorBanner: () => null,
  LoadingState: () => React.createElement('div', null, 'Loading...'),
  FormField: ({ label, children }: { label: string; children: React.ReactNode }) =>
    React.createElement('div', null, React.createElement('label', null, label), children),
  EditorShell: ({ children, onSave, onCancel }: {
    children: React.ReactNode;
    onSave: () => void;
    onCancel: () => void;
    title?: string;
    validationError?: string | null;
    saving?: boolean;
    canSave?: boolean;
    saveLabel?: string;
  }) =>
    React.createElement('div', null,
      children,
      React.createElement('button', { onClick: onSave }, 'Save'),
      React.createElement('button', { onClick: onCancel }, 'Cancel'),
    ),
  textInputClass: () => '',
}));

const PC = { id: 'c1', name: 'Thorin', characterType: 'character', userId: 'u1', classes: [{ class: 'Fighter', level: 5 }], hp: 40, maxHp: 40, ac: 16, abilityScores: { strength: 16, dexterity: 10, constitution: 14, intelligence: 10, wisdom: 10, charisma: 10 } };
const NPC = { id: 'c2', name: 'Barliman', characterType: 'npc', userId: 'u1', classes: [{ class: 'Fighter', level: 1 }], hp: 10, maxHp: 10, ac: 10, abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 } };
const COMPANION = { id: 'c3', name: 'Bill', characterType: 'companion', userId: 'u1', classes: [{ class: 'Fighter', level: 1 }], hp: 5, maxHp: 5, ac: 10, abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 } };

const PARTY = { id: 'p1', name: 'Fellowship', characterIds: ['c1', 'c2', 'c3'], userId: 'u1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

let container: HTMLDivElement;
let root: Root;
let originalFetch: typeof global.fetch;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  originalFetch = global.fetch;
});

afterEach(() => {
  act(() => { root?.unmount(); });
  container.remove();
  global.fetch = originalFetch;
});

async function renderWithData(characters: object[], parties: object[] = []) {
  global.fetch = jest.fn(async (url: RequestInfo | URL) => {
    const urlStr = String(url);
    if (urlStr.includes('/api/parties')) return { ok: true, json: async () => parties } as unknown as Response;
    if (urlStr.includes('/api/characters')) return { ok: true, json: async () => characters } as unknown as Response;
    if (urlStr.includes('/api/campaigns')) return { ok: true, json: async () => [] } as unknown as Response;
    return { ok: true, json: async () => [] } as unknown as Response;
  }) as typeof fetch;

  const { default: PartiesPage } = await import('@/app/parties/page');
  await act(async () => {
    root = createRoot(container);
    root.render(React.createElement(PartiesPage));
  });
}

async function openNewPartyEditor() {
  const addBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Add New Party'));
  if (addBtn) await act(async () => { addBtn.click(); });
}

async function openExistingPartyEditor() {
  const editBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Edit');
  if (editBtn) await act(async () => { editBtn.click(); });
}

describe('PartyEditor — character type sections', () => {
  test('renders three sections when party has all three character types', async () => {
    await renderWithData([PC, NPC, COMPANION], [PARTY]);
    await openExistingPartyEditor();

    const sections = container.querySelectorAll('[aria-label^="Party section:"]');
    expect(sections).toHaveLength(3);
    const labels = Array.from(sections).map(s => s.getAttribute('aria-label'));
    expect(labels).toContain('Party section: Player Characters');
    expect(labels).toContain('Party section: Travelling NPCs');
    expect(labels).toContain('Party section: Companions');
  });

  test('renders only Player Characters section when all characters are PCs', async () => {
    const PC2 = { ...NPC, id: 'c2b', name: 'Gandalf', characterType: 'character' };
    await renderWithData([PC, PC2]);
    await openNewPartyEditor();

    const sections = container.querySelectorAll('[aria-label^="Party section:"]');
    expect(sections).toHaveLength(1);
    expect(sections[0].getAttribute('aria-label')).toBe('Party section: Player Characters');
  });

  test('does not render NPC or Companion sections when only PCs present', async () => {
    await renderWithData([PC]);
    await openNewPartyEditor();

    const labels = Array.from(container.querySelectorAll('[aria-label^="Party section:"]'))
      .map(s => s.getAttribute('aria-label'));
    expect(labels).not.toContain('Party section: Travelling NPCs');
    expect(labels).not.toContain('Party section: Companions');
  });
});

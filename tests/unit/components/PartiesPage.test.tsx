/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { act } from 'react';
import { describe, test, expect, jest } from '@jest/globals';
import { createRoot } from 'react-dom/client';
import { setupUiTest } from '@/tests/unit/helpers/uiTestSetup';

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

const PC = {
  id: 'c1', name: 'Thorin', characterType: 'character', userId: 'u1',
  classes: [{ class: 'Fighter', level: 5 }], race: 'Dwarf',
  hp: 40, maxHp: 40, ac: 16,
  abilityScores: { strength: 16, dexterity: 10, constitution: 14, intelligence: 10, wisdom: 10, charisma: 10 },
};
const NPC = {
  id: 'c2', name: 'Barliman', characterType: 'npc', userId: 'u1',
  classes: [{ class: 'Fighter', level: 1 }],
  hp: 10, maxHp: 10, ac: 10,
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
};
const COMPANION = {
  id: 'c3', name: 'Bill', characterType: 'companion', userId: 'u1',
  classes: [{ class: 'Fighter', level: 1 }],
  hp: 5, maxHp: 5, ac: 10,
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
};
const PARTY_ALL = {
  id: 'p1', name: 'Fellowship', characterIds: ['c1', 'c2', 'c3'],
  userId: 'u1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};
const PARTY_PC_ONLY = {
  id: 'p2', name: 'PC Party', characterIds: ['c1'],
  userId: 'u1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};
const PARTY_EMPTY = {
  id: 'p3', name: 'Empty Party', characterIds: [],
  userId: 'u1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};
const PC_NO_TYPE = {
  id: 'c4', name: 'Unknown', characterType: undefined, userId: 'u1',
  classes: [{ class: 'Rogue', level: 3 }],
  hp: 20, maxHp: 20, ac: 14,
  abilityScores: { strength: 10, dexterity: 16, constitution: 12, intelligence: 12, wisdom: 10, charisma: 10 },
};

const ctx = setupUiTest();

async function renderWithData(characters: object[], parties: object[]) {
  global.fetch = jest.fn(async (url: RequestInfo | URL) => {
    const urlStr = String(url);
    if (urlStr.includes('/api/parties')) return { ok: true, json: async () => parties } as unknown as Response;
    if (urlStr.includes('/api/characters')) return { ok: true, json: async () => characters } as unknown as Response;
    if (urlStr.includes('/api/campaigns')) return { ok: true, json: async () => [] } as unknown as Response;
    return { ok: true, json: async () => [] } as unknown as Response;
  }) as typeof fetch;

  const { default: PartiesPage } = await import('@/app/parties/page');
  await act(async () => {
    ctx.root = createRoot(ctx.container);
    ctx.root.render(React.createElement(PartiesPage));
  });
}

function getMemberSections() {
  return ctx.container.querySelectorAll('[aria-label^="Member section:"]');
}

function getMemberSectionLabels() {
  return Array.from(getMemberSections()).map(s => s.getAttribute('aria-label'));
}

describe('PartiesPage — party card member display', () => {
  test('party with all three types renders three member sections', async () => {
    await renderWithData([PC, NPC, COMPANION], [PARTY_ALL]);

    const labels = getMemberSectionLabels();
    expect(labels).toContain('Member section: Player Characters');
    expect(labels).toContain('Member section: Travelling NPCs');
    expect(labels).toContain('Member section: Companions');
  });

  test('PC-only party hides NPC and Companion sections', async () => {
    await renderWithData([PC], [PARTY_PC_ONLY]);

    const labels = getMemberSectionLabels();
    expect(labels).toContain('Member section: Player Characters');
    expect(labels).not.toContain('Member section: Travelling NPCs');
    expect(labels).not.toContain('Member section: Companions');
  });

  test('zero-member party shows no member sections', async () => {
    await renderWithData([PC], [PARTY_EMPTY]);

    expect(getMemberSections()).toHaveLength(0);
  });

  test('member with undefined characterType defaults to Player Characters section', async () => {
    const party = { ...PARTY_PC_ONLY, characterIds: ['c4'] };
    await renderWithData([PC_NO_TYPE], [party]);

    const labels = getMemberSectionLabels();
    expect(labels).toContain('Member section: Player Characters');
    expect(labels).not.toContain('Member section: Travelling NPCs');
    expect(labels).not.toContain('Member section: Companions');
  });

  test('comma-separated name list is no longer rendered', async () => {
    await renderWithData([PC, NPC], [PARTY_ALL]);

    const text = ctx.container.textContent ?? '';
    expect(text).not.toMatch(/Thorin,\s*Barliman/);
    expect(text).not.toMatch(/Barliman,\s*Thorin/);
  });

  test('member names appear in the card', async () => {
    await renderWithData([PC, NPC, COMPANION], [PARTY_ALL]);

    expect(ctx.container.textContent).toContain('Thorin');
    expect(ctx.container.textContent).toContain('Barliman');
    expect(ctx.container.textContent).toContain('Bill');
  });
});

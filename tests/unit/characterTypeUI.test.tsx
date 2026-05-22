/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { act } from 'react';
import { describe, test, expect, jest } from '@jest/globals';
import { createRoot } from 'react-dom/client';
import { CharactersContent } from '@/app/characters/page';
import { setupUiTest, clickButton } from '@/tests/unit/helpers/uiTestSetup';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

jest.mock('@/lib/components/CreatureStatBlock', () => ({
  CreatureStatBlock: () => null,
}));

jest.mock('@/lib/components/CreatureStatsForm', () => ({
  CreatureStatsForm: () => React.createElement('div', { 'data-testid': 'creature-stats-form' }),
}));

const PC = {
  id: 'char-pc', name: 'Aragorn', characterType: 'character',
  classes: [{ class: 'Fighter', level: 5 }], userId: 'u1',
  hp: 40, maxHp: 40, ac: 16,
  abilityScores: { strength: 16, dexterity: 14, constitution: 14, intelligence: 12, wisdom: 14, charisma: 15 },
};

const NPC = {
  id: 'char-npc', name: 'Innkeeper', characterType: 'npc',
  classes: [{ class: 'Fighter', level: 1 }], userId: 'u1',
  hp: 10, maxHp: 10, ac: 10,
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
};

const COMPANION = {
  id: 'char-comp', name: 'Wolf', characterType: 'companion',
  classes: [{ class: 'Fighter', level: 1 }], userId: 'u1',
  hp: 11, maxHp: 11, ac: 13,
  abilityScores: { strength: 12, dexterity: 15, constitution: 12, intelligence: 3, wisdom: 12, charisma: 6 },
};

const ctx = setupUiTest();

function mockFetchWithCharacters(characters: object[]) {
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => characters,
  }) as unknown as Response) as typeof fetch;
}

async function render() {
  await act(async () => {
    ctx.root = createRoot(ctx.container);
    ctx.root.render(<CharactersContent />);
  });
}

function getSections() {
  return ctx.container.querySelectorAll('[aria-label^="Section:"]');
}

function getSectionLabels() {
  return Array.from(getSections()).map(s => s.getAttribute('aria-label'));
}

function getTypeSelect() {
  return ctx.container.querySelector('select[aria-label="Character type"]') as HTMLSelectElement | null;
}

async function renderAndOpenEditor() {
  await render();
  await clickButton(ctx.container, b => !!b.textContent?.includes('Add New Character'));
}

describe('CharactersContent — character type grouping', () => {
  test('renders three sections when all three types are present', async () => {
    mockFetchWithCharacters([PC, NPC, COMPANION]);
    await render();

    expect(getSections()).toHaveLength(3);
    const labels = getSectionLabels();
    expect(labels).toContain('Section: Player Characters');
    expect(labels).toContain('Section: Travelling NPCs');
    expect(labels).toContain('Section: Companions');
  });

  test('empty section is not rendered', async () => {
    mockFetchWithCharacters([PC, COMPANION]);
    await render();

    expect(getSections()).toHaveLength(2);
    const labels = getSectionLabels();
    expect(labels).not.toContain('Section: Travelling NPCs');
    expect(labels).toContain('Section: Player Characters');
    expect(labels).toContain('Section: Companions');
  });

  test('filter control narrows visible sections', async () => {
    mockFetchWithCharacters([PC, NPC, COMPANION]);
    await render();

    const npcFilterBtn = ctx.container.querySelector('[aria-label="Filter: Travelling NPCs"]') as HTMLButtonElement | null;
    expect(npcFilterBtn).not.toBeNull();

    await act(async () => { npcFilterBtn!.click(); });

    expect(getSections()).toHaveLength(1);
    expect(getSections()[0].getAttribute('aria-label')).toBe('Section: Travelling NPCs');
  });
});

describe('CharactersContent — CharacterEditor type selector', () => {
  test('Type selector defaults to Player Character for new characters', async () => {
    mockFetchWithCharacters([]);
    await renderAndOpenEditor();

    const typeSelect = getTypeSelect();
    expect(typeSelect).not.toBeNull();
    expect(typeSelect!.value).toBe('character');
  });

  test('changing Type selector updates state and is sent in save payload', async () => {
    let capturedBody: Record<string, unknown> | undefined;
    global.fetch = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = String(url);
      if (urlStr === '/api/characters' && init?.method === 'POST') {
        capturedBody = JSON.parse(init?.body as string) as Record<string, unknown>;
        return { ok: true, json: async () => ({ id: 'new-id', ...capturedBody, classes: [{ class: 'Fighter', level: 1 }] }) } as unknown as Response;
      }
      return { ok: true, json: async () => [] } as unknown as Response;
    }) as typeof fetch;

    await renderAndOpenEditor();

    const typeSelect = getTypeSelect();
    expect(typeSelect).not.toBeNull();

    await act(async () => {
      typeSelect!.value = 'npc';
      typeSelect!.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(typeSelect!.value).toBe('npc');

    const saveBtn = Array.from(ctx.container.querySelectorAll('button')).find(b => b.textContent?.includes('Save Character'));
    expect(saveBtn).not.toBeUndefined();
    await act(async () => { saveBtn!.click(); });

    expect(capturedBody).toBeDefined();
    expect(capturedBody!.characterType).toBe('npc');
  });

  test('Type selector shows current value when editing existing NPC', async () => {
    mockFetchWithCharacters([NPC]);
    await render();

    await clickButton(ctx.container, b => b.textContent === 'Edit');

    const typeSelect = getTypeSelect();
    expect(typeSelect).not.toBeNull();
    expect(typeSelect!.value).toBe('npc');
  });
});

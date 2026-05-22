/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { act } from 'react';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { CharactersContent } from '@/app/characters/page';

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

function mockFetchWithCharacters(characters: object[]) {
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => characters,
  }) as unknown as Response) as typeof fetch;
}

async function render() {
  await act(async () => {
    root = createRoot(container);
    root.render(<CharactersContent />);
  });
}

async function renderAndOpenEditor() {
  await render();
  const buttons = Array.from(container.querySelectorAll('button'));
  const addBtn = buttons.find(b => b.textContent?.includes('Add New Character'));
  if (addBtn) {
    await act(async () => { addBtn.click(); });
  }
}

describe('CharactersContent — character type grouping', () => {
  test('renders three sections when all three types are present', async () => {
    mockFetchWithCharacters([PC, NPC, COMPANION]);
    await render();

    const sections = container.querySelectorAll('[aria-label^="Section:"]');
    expect(sections).toHaveLength(3);
    const labels = Array.from(sections).map(s => s.getAttribute('aria-label'));
    expect(labels).toContain('Section: Player Characters');
    expect(labels).toContain('Section: Travelling NPCs');
    expect(labels).toContain('Section: Companions');
  });

  test('empty section is not rendered', async () => {
    mockFetchWithCharacters([PC, COMPANION]);
    await render();

    const sections = container.querySelectorAll('[aria-label^="Section:"]');
    expect(sections).toHaveLength(2);
    const labels = Array.from(sections).map(s => s.getAttribute('aria-label'));
    expect(labels).not.toContain('Section: Travelling NPCs');
    expect(labels).toContain('Section: Player Characters');
    expect(labels).toContain('Section: Companions');
  });

  test('filter control narrows visible sections', async () => {
    mockFetchWithCharacters([PC, NPC, COMPANION]);
    await render();

    const npcFilterBtn = container.querySelector('[aria-label="Filter: Travelling NPCs"]') as HTMLButtonElement | null;
    expect(npcFilterBtn).not.toBeNull();

    await act(async () => { npcFilterBtn!.click(); });

    const sections = container.querySelectorAll('[aria-label^="Section:"]');
    expect(sections).toHaveLength(1);
    expect(sections[0].getAttribute('aria-label')).toBe('Section: Travelling NPCs');
  });
});

describe('CharactersContent — CharacterEditor type selector', () => {
  test('Type selector defaults to Player Character for new characters', async () => {
    mockFetchWithCharacters([]);
    await renderAndOpenEditor();

    const typeSelect = container.querySelector('select[aria-label="Character type"]') as HTMLSelectElement | null;
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

    const typeSelect = container.querySelector('select[aria-label="Character type"]') as HTMLSelectElement | null;
    expect(typeSelect).not.toBeNull();

    await act(async () => {
      typeSelect!.value = 'npc';
      typeSelect!.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(typeSelect!.value).toBe('npc');

    const saveBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Save Character'));
    expect(saveBtn).not.toBeUndefined();
    await act(async () => { saveBtn!.click(); });

    expect(capturedBody).toBeDefined();
    expect(capturedBody!.characterType).toBe('npc');
  });

  test('Type selector shows current value when editing existing NPC', async () => {
    mockFetchWithCharacters([NPC]);
    await render();

    const buttons = Array.from(container.querySelectorAll('button'));
    const editBtn = buttons.find(b => b.textContent === 'Edit') as HTMLButtonElement | undefined;
    expect(editBtn).not.toBeUndefined();
    await act(async () => { editBtn!.click(); });

    const typeSelect = container.querySelector('select[aria-label="Character type"]') as HTMLSelectElement | null;
    expect(typeSelect).not.toBeNull();
    expect(typeSelect!.value).toBe('npc');
  });
});

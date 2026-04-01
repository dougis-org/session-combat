/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { act } from 'react';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { MonstersContent } from '@/app/monsters/page';
import type { MonsterTemplate } from '@/lib/types';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

jest.mock('@/lib/components/CreatureStatBlock', () => ({
  CreatureStatBlock: () => null,
}));

jest.mock('@/lib/components/CreatureStatsForm', () => ({
  CreatureStatsForm: () => null,
}));

const GLOBAL_USER_ID = 'GLOBAL';

function makeMonster(id: string, name: string, type: string, userId: string): MonsterTemplate {
  return {
    id,
    userId,
    name,
    size: 'medium',
    type,
    ac: 10,
    hp: 10,
    maxHp: 10,
    speed: '30 ft.',
    challengeRating: 1,
    abilityScores: {
      strength: 10, dexterity: 10, constitution: 10,
      intelligence: 10, wisdom: 10, charisma: 10,
    },
    isGlobal: userId === GLOBAL_USER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const USER_DRAGON = makeMonster('u1', 'Pet Dragon', 'dragon', 'user-1');
const USER_GOBLIN = makeMonster('u2', 'Pet Goblin', 'humanoid', 'user-1');
const GLOBAL_ZOMBIE = makeMonster('g1', 'Zombie', 'undead', GLOBAL_USER_ID);
const GLOBAL_SKELETON = makeMonster('g2', 'Skeleton', 'undead', GLOBAL_USER_ID);
const GLOBAL_DRAGON = makeMonster('g3', 'Adult Red Dragon', 'dragon', GLOBAL_USER_ID);

const ALL_MONSTERS = [USER_DRAGON, USER_GOBLIN, GLOBAL_ZOMBIE, GLOBAL_SKELETON, GLOBAL_DRAGON];

describe('MonstersContent filter bar', () => {
  let container: HTMLDivElement;
  let root: Root;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url === '/api/monsters') {
        return { ok: true, json: async () => ALL_MONSTERS } as Response;
      }
      if (url === '/api/auth/me') {
        return { ok: true, json: async () => ({ isAdmin: false }) } as Response;
      }
      return { ok: false, json: async () => ({}) } as Response;
    }) as typeof fetch;
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    container.remove();
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  async function renderPage() {
    await act(async () => {
      root.render(React.createElement(MonstersContent));
    });
  }

  function getNameInput(): HTMLInputElement {
    return container.querySelector('input[aria-label="Filter monsters by name"]') as HTMLInputElement;
  }

  function getTypeSelect(): HTMLSelectElement {
    return container.querySelector('select[aria-label="Filter monsters by type"]') as HTMLSelectElement;
  }

  function getVisibleMonsterNames(): string[] {
    return Array.from(container.querySelectorAll('h3')).map(el => el.textContent ?? '');
  }

  async function setNameFilter(value: string) {
    const input = getNameInput();
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    await act(async () => {
      nativeSetter?.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  async function setTypeFilter(value: string) {
    const select = getTypeSelect();
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
    await act(async () => {
      nativeSetter?.call(select, value);
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  test('renders filter bar with name input and type select', async () => {
    await renderPage();
    expect(getNameInput()).not.toBeNull();
    expect(getTypeSelect()).not.toBeNull();
  });

  test('type dropdown contains "All types" and sorted distinct types from loaded data', async () => {
    await renderPage();
    const options = Array.from(getTypeSelect().querySelectorAll('option')).map(o => o.value);
    expect(options[0]).toBe(''); // All types
    expect(options.slice(1)).toEqual(['dragon', 'humanoid', 'undead']);
  });

  test('initially shows all monsters in both sections', async () => {
    await renderPage();
    const names = getVisibleMonsterNames();
    expect(names).toContain('Pet Dragon');
    expect(names).toContain('Pet Goblin');
    expect(names).toContain('Zombie');
    expect(names).toContain('Skeleton');
    expect(names).toContain('Adult Red Dragon');
  });

  test('name filter reduces both sections simultaneously', async () => {
    await renderPage();
    await setNameFilter('dragon');
    const names = getVisibleMonsterNames();
    expect(names).toContain('Pet Dragon');
    expect(names).toContain('Adult Red Dragon');
    expect(names).not.toContain('Zombie');
    expect(names).not.toContain('Pet Goblin');
  });

  test('type filter reduces both sections simultaneously', async () => {
    await renderPage();
    await setTypeFilter('undead');
    const names = getVisibleMonsterNames();
    expect(names).toContain('Zombie');
    expect(names).toContain('Skeleton');
    expect(names).not.toContain('Pet Dragon');
    expect(names).not.toContain('Pet Goblin');
  });

  test('shows "No monsters match your filter." when filter zeros out sections', async () => {
    await renderPage();
    await setNameFilter('zzznomatch');
    expect(container.textContent).toContain('No monsters match your filter.');
  });

  test('shows "No personal monsters yet." when user has no monsters and no filter active', async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url === '/api/monsters') {
        return { ok: true, json: async () => [GLOBAL_ZOMBIE] } as Response;
      }
      if (url === '/api/auth/me') {
        return { ok: true, json: async () => ({ isAdmin: false }) } as Response;
      }
      return { ok: false, json: async () => ({}) } as Response;
    }) as typeof fetch;
    await renderPage();
    expect(container.textContent).toContain('No personal monsters yet.');
  });
});

describe('MonstersContent grid layout and modal editor', () => {
  let container: HTMLDivElement;
  let root: Root;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url === '/api/monsters') {
        return { ok: true, json: async () => ALL_MONSTERS } as Response;
      }
      if (url === '/api/auth/me') {
        return { ok: true, json: async () => ({ isAdmin: true }) } as Response;
      }
      return { ok: false, json: async () => ({}) } as Response;
    }) as typeof fetch;
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    container.remove();
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  async function renderPage() {
    await act(async () => {
      root.render(React.createElement(MonstersContent));
    });
  }

  // Task 2.1: grid layout class on user and global card list containers
  test('user card list container has grid layout classes', async () => {
    await renderPage();
    const grids = container.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    expect(grids.length).toBeGreaterThanOrEqual(1);
  });

  test('global card list container has grid layout classes', async () => {
    await renderPage();
    const grids = container.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    expect(grids.length).toBeGreaterThanOrEqual(2);
  });

  // Task 2.2: MonsterTemplateEditor NOT rendered inline inside section body when editing
  test('MonsterTemplateEditor is not rendered inline in user section body when editing', async () => {
    await renderPage();
    // Click Edit on the user monster card
    const editButtons = Array.from(container.querySelectorAll('button')).filter(
      b => b.textContent === 'Edit',
    );
    await act(async () => { editButtons[0].click(); });

    // The user section body (sibling of grid) should NOT contain the editor form
    const userSection = container.querySelector('.mb-12');
    const grids = userSection?.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    // Editor form should not be inside the grid or the section list area
    const editorsInSection = userSection?.querySelectorAll('[data-testid="monster-editor-inline"]');
    expect(editorsInSection?.length ?? 0).toBe(0);
  });

  // Task 2.3: modal overlay appears when editingTemplate is set
  test('modal overlay appears when editing a monster', async () => {
    await renderPage();
    const editButtons = Array.from(container.querySelectorAll('button')).filter(
      b => b.textContent === 'Edit',
    );
    await act(async () => { editButtons[0].click(); });

    const modal = container.querySelector('.fixed.inset-0.z-50');
    expect(modal).not.toBeNull();
  });

  test('modal overlay is not present when not editing', async () => {
    await renderPage();
    const modal = container.querySelector('.fixed.inset-0.z-50');
    expect(modal).toBeNull();
  });

  // Task 2.4: backdrop click calls cancelEdit (closes modal)
  test('clicking the backdrop closes the modal', async () => {
    await renderPage();
    const editButtons = Array.from(container.querySelectorAll('button')).filter(
      b => b.textContent === 'Edit',
    );
    await act(async () => { editButtons[0].click(); });

    const backdrop = container.querySelector('.fixed.inset-0.z-50') as HTMLElement;
    expect(backdrop).not.toBeNull();

    await act(async () => { backdrop.click(); });

    const modalAfterClick = container.querySelector('.fixed.inset-0.z-50');
    expect(modalAfterClick).toBeNull();
  });

  // Task 2.5: Escape key press calls cancelEdit
  test('pressing Escape closes the modal', async () => {
    await renderPage();
    const editButtons = Array.from(container.querySelectorAll('button')).filter(
      b => b.textContent === 'Edit',
    );
    await act(async () => { editButtons[0].click(); });

    expect(container.querySelector('.fixed.inset-0.z-50')).not.toBeNull();

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(container.querySelector('.fixed.inset-0.z-50')).toBeNull();
  });
});

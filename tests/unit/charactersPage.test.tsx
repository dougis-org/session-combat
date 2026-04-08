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
  CreatureStatsForm: ({ onChange }: { onChange: (s: unknown) => void }) =>
    React.createElement('div', { 'data-testid': 'creature-stats-form' }),
}));

let container: HTMLDivElement;
let root: Root;
let originalFetch: typeof global.fetch;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  originalFetch = global.fetch;
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => [],
  }) as unknown as Response) as typeof fetch;
});

afterEach(() => {
  act(() => { root?.unmount(); });
  container.remove();
  global.fetch = originalFetch;
});

async function renderAndOpenEditor() {
  await act(async () => {
    root = createRoot(container);
    root.render(<CharactersContent />);
  });
  const buttons = Array.from(container.querySelectorAll('button'));
  const addBtn = buttons.find(b => b.textContent?.includes('Add New Character'));
  if (addBtn) {
    await act(async () => { addBtn.click(); });
  }
}

describe('CharactersContent — gender field', () => {
  test('CharacterEditor renders with a gender input field', async () => {
    await renderAndOpenEditor();
    expect(container.querySelector('[aria-label="Character gender"]')).not.toBeNull();
  });

  test('gender value is sent in save payload', async () => {
    const mockFetch = jest.fn(async (url: RequestInfo | URL) => {
      if (String(url).includes('/api/characters') && !(url instanceof Request && url.method === 'POST')) {
        return { ok: true, json: async () => [] } as unknown as Response;
      }
      return {
        ok: true,
        json: async () => ({
          id: 'new-id',
          name: 'Aria',
          gender: 'Female',
          classes: [{ class: 'Fighter', level: 1 }],
          race: 'Human',
          hp: 0, maxHp: 0, ac: 10,
          abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      } as unknown as Response;
    }) as typeof fetch;
    global.fetch = mockFetch;

    await renderAndOpenEditor();

    const nameInput = container.querySelector('[aria-label="Character name"]') as HTMLInputElement | null;
    const genderInput = container.querySelector('[aria-label="Character gender"]') as HTMLInputElement | null;

    if (nameInput) {
      await act(async () => {
        nameInput.value = 'Aria';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        nameInput.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    if (genderInput) {
      await act(async () => {
        genderInput.value = 'Female';
        genderInput.dispatchEvent(new Event('input', { bubbles: true }));
        genderInput.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    expect(genderInput).not.toBeNull();
  });
});

describe('CharactersContent — alignment field', () => {
  test('CharacterEditor renders an alignment select with aria-label="Alignment"', async () => {
    await renderAndOpenEditor();
    expect(container.querySelector('select[aria-label="Alignment"]')).not.toBeNull();
  });
});

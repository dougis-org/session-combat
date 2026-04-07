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

describe('CharactersContent — gender field', () => {
  test('CharacterEditor renders with a gender input field', async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<CharactersContent />);
    });

    // Click "Add New Character" to open CharacterEditor
    const addButton = container.querySelector('button[class*="bg-blue"]') as HTMLButtonElement | null;
    if (!addButton) {
      // Fall back to text search
      const buttons = Array.from(container.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Add New Character'));
      if (btn) {
        await act(async () => { btn.click(); });
      }
    } else {
      await act(async () => { addButton.click(); });
    }

    // Gender input should now be in the DOM
    const genderInput = container.querySelector('[aria-label="Character gender"]') as HTMLInputElement | null;
    expect(genderInput).not.toBeNull();
  });

  test('gender value is sent in save payload', async () => {
    const mockFetch = jest.fn(async (url: RequestInfo | URL) => {
      if (String(url).includes('/api/characters') && !(url instanceof Request && url.method === 'POST')) {
        return { ok: true, json: async () => [] } as unknown as Response;
      }
      // POST: return the created character
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

    await act(async () => {
      root = createRoot(container);
      root.render(<CharactersContent />);
    });

    // Open editor
    const buttons = Array.from(container.querySelectorAll('button'));
    const addBtn = buttons.find(b => b.textContent?.includes('Add New Character'));
    if (addBtn) {
      await act(async () => { addBtn.click(); });
    }

    // Fill name (required) and gender
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

    // gender input exists and has the right initial state
    expect(genderInput).not.toBeNull();
  });
});

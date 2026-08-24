import React from 'react';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import type { Encounter } from '@/lib/types';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

let mockParamsId: string | string[] = 'campaign-123';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: mockParamsId }),
}));

jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({ user: { userId: 'user-1' } }),
}));

// Import after mocks
import CampaignEncountersPage from '@/app/campaigns/[id]/encounters/page';

let nextFixtureId = 0;
function makeFixtureId(): string {
  // Deterministic fallback in case global.crypto.randomUUID isn't available in
  // the test environment; also keeps failures reproducible.
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `fixture-${++nextFixtureId}`;
}

function makeEncounter(overrides: Partial<Encounter> = {}): Encounter {
  return {
    id: makeFixtureId(),
    userId: 'user-1',
    name: 'Test Encounter',
    description: '',
    monsters: [],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

let container: HTMLDivElement;
let root: Root;
let originalFetch: typeof global.fetch;
let originalConfirm: typeof window.confirm;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  originalFetch = global.fetch;
  originalConfirm = window.confirm;
});

afterEach(() => {
  act(() => { root?.unmount(); });
  container.remove();
  global.fetch = originalFetch;
  window.confirm = originalConfirm;
});

async function render() {
  await act(async () => {
    root = createRoot(container);
    root.render(React.createElement(CampaignEncountersPage));
  });
  await act(async () => { await new Promise(r => setTimeout(r, 0)); });
}

async function flush() {
  await act(async () => { await new Promise(r => setTimeout(r, 0)); });
}

function buttons() {
  return Array.from(container.querySelectorAll('button'));
}

function findButton(label: string) {
  return buttons().find(b => b.textContent?.trim() === label) as HTMLButtonElement | undefined;
}

describe('Campaign Encounters Page', () => {
  describe('Task C — linked-encounters list', () => {
    it('fetches GET /api/campaigns/[id]/encounters once on mount and renders names', async () => {
      const calls: string[] = [];
      const linked = [makeEncounter({ id: 'e1', name: 'Goblin Ambush' }), makeEncounter({ id: 'e2', name: "Dragon's Lair" })];
      global.fetch = jest.fn(async (input: unknown) => {
        calls.push(String(input));
        return { ok: true, json: async () => linked } as unknown as Response;
      }) as typeof fetch;

      await render();

      expect(calls.filter(u => u === '/api/campaigns/campaign-123/encounters')).toHaveLength(1);
      expect(container.textContent).toContain('Goblin Ambush');
      expect(container.textContent).toContain("Dragon's Lair");
    });

    it('renders empty-state with actions and no error when GET returns []', async () => {
      global.fetch = jest.fn(async () => ({ ok: true, json: async () => [] }) as unknown as Response) as typeof fetch;
      await render();

      expect(findButton('Link Existing Encounter')).toBeTruthy();
      expect(findButton('Create New Encounter')).toBeTruthy();
      expect(container.querySelector('.bg-red-900')).toBeFalsy();
    });

    it('renders an error banner and does not crash when fetch fails', async () => {
      global.fetch = jest.fn(async () => ({ ok: false, json: async () => ({ error: 'boom' }) }) as unknown as Response) as typeof fetch;
      await render();

      expect(container.querySelector('.bg-red-900')).toBeTruthy();
      expect(container.textContent).toMatch(/boom/);
    });
  });

  describe('campaignId from an array param (catch-all route defensiveness)', () => {
    afterEach(() => { mockParamsId = 'campaign-123'; });

    it('renders nothing when useParams().id is an empty array', async () => {
      mockParamsId = [];
      global.fetch = jest.fn(async () => ({ ok: true, json: async () => [] }) as unknown as Response) as typeof fetch;

      await render();

      expect(container.textContent).toBe('');
    });

    it('uses the first element when useParams().id is a populated array', async () => {
      mockParamsId = ['campaign-arr', 'extra'];
      const calls: string[] = [];
      global.fetch = jest.fn(async (input: unknown) => {
        calls.push(String(input));
        return { ok: true, json: async () => [] } as unknown as Response;
      }) as typeof fetch;

      await render();

      expect(calls).toContain('/api/campaigns/campaign-arr/encounters');
    });
  });

  describe('Task D — Link Existing Encounter picker', () => {
    function mockLinkedThenOwned(linked: Encounter[], owned: Encounter[]) {
      const calls: string[] = [];
      global.fetch = jest.fn(async (input: unknown) => {
        const url = String(input);
        calls.push(url);
        if (url === '/api/campaigns/campaign-123/encounters') {
          return { ok: true, json: async () => linked } as unknown as Response;
        }
        if (url === '/api/encounters') {
          return { ok: true, json: async () => owned } as unknown as Response;
        }
        return { ok: true, json: async () => ({}) } as unknown as Response;
      }) as typeof fetch;
      return calls;
    }

    it('opening the picker triggers exactly one GET /api/encounters call', async () => {
      const owned = [makeEncounter({ id: 'e1', name: 'A' })];
      const calls = mockLinkedThenOwned([], owned);
      await render();

      await act(async () => { findButton('Link Existing Encounter')!.click(); });
      await flush();

      expect(calls.filter(u => u === '/api/encounters')).toHaveLength(1);
    });

    it('shows a picker error banner when GET /api/encounters fails, without crashing', async () => {
      global.fetch = jest.fn(async (input: unknown) => {
        const url = String(input);
        if (url === '/api/campaigns/campaign-123/encounters') {
          return { ok: true, json: async () => [] } as unknown as Response;
        }
        if (url === '/api/encounters') {
          return { ok: false, json: async () => ({ error: 'Could not load your encounters' }) } as unknown as Response;
        }
        return { ok: true, json: async () => ({}) } as unknown as Response;
      }) as typeof fetch;

      await render();
      await act(async () => { findButton('Link Existing Encounter')!.click(); });
      await flush();

      expect(container.textContent).toMatch(/Could not load your encounters/i);
      expect(findButton('Link')).toBeFalsy();
      // owned ends up empty after a failed fetch too, but the empty-state copy
      // must not contradict the error banner by claiming the user has no encounters.
      expect(container.textContent).not.toMatch(/don't have any encounters yet/i);
    });

    it('resets the owned list when reopening the picker after a failed fetch', async () => {
      let ownedShouldFail = false;
      const owned = [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })];
      global.fetch = jest.fn(async (input: unknown) => {
        const url = String(input);
        if (url === '/api/campaigns/campaign-123/encounters') {
          return { ok: true, json: async () => [] } as unknown as Response;
        }
        if (url === '/api/encounters') {
          if (ownedShouldFail) {
            return { ok: false, json: async () => ({ error: 'Temporary failure' }) } as unknown as Response;
          }
          return { ok: true, json: async () => owned } as unknown as Response;
        }
        return { ok: true, json: async () => ({}) } as unknown as Response;
      }) as typeof fetch;

      await render();
      await act(async () => { findButton('Link Existing Encounter')!.click(); });
      await flush();
      expect(container.textContent).toContain('Goblin Ambush');

      await act(async () => { findButton('Cancel')!.click(); });
      ownedShouldFail = true;
      await act(async () => { findButton('Link Existing Encounter')!.click(); });
      await flush();

      expect(container.textContent).toMatch(/Temporary failure/i);
      expect(container.textContent).not.toContain('Goblin Ambush');
    });

    it('shows an empty-owned message when the user has no encounters at all', async () => {
      mockLinkedThenOwned([], []);
      await render();

      await act(async () => { findButton('Link Existing Encounter')!.click(); });
      await flush();

      expect(container.textContent).toMatch(/don't have any encounters yet/i);
    });

    it('shows a no-matches message when a search term matches nothing', async () => {
      const owned = [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })];
      mockLinkedThenOwned([], owned);
      await render();

      await act(async () => { findButton('Link Existing Encounter')!.click(); });
      await flush();

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
        setter.call(searchInput, 'zzz-no-match');
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      });

      expect(container.textContent).toMatch(/no encounters match your search/i);
    });

    it('excludes already-linked encounters from the picker', async () => {
      const owned = [
        makeEncounter({ id: 'e1', name: 'One' }),
        makeEncounter({ id: 'e2', name: 'Two' }),
        makeEncounter({ id: 'e3', name: 'Three' }),
      ];
      const linked = [makeEncounter({ id: 'e1', name: 'One' })];
      mockLinkedThenOwned(linked, owned);
      await render();

      await act(async () => { findButton('Link Existing Encounter')!.click(); });
      await flush();

      const pickerText = container.textContent ?? '';
      expect(pickerText).toContain('Two');
      expect(pickerText).toContain('Three');
      // "One" is already linked, so it must not appear as a pickable row's Link button.
      expect(findButton('Link')).toBeTruthy();
      const linkButtons = buttons().filter(b => b.textContent?.trim() === 'Link');
      expect(linkButtons).toHaveLength(2);
    });

    it('filters picker results by case-insensitive name search without extra fetch calls', async () => {
      const owned = [
        makeEncounter({ id: 'e1', name: 'Goblin Ambush' }),
        makeEncounter({ id: 'e2', name: 'Owlbear Den' }),
      ];
      const calls = mockLinkedThenOwned([], owned);
      await render();

      await act(async () => { findButton('Link Existing Encounter')!.click(); });
      await flush();

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      expect(searchInput).toBeTruthy();
      expect(searchInput.getAttribute('aria-label')).toBe('Search encounters');
      await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
        setter.call(searchInput, 'gob');
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      });

      expect(container.textContent).toContain('Goblin Ambush');
      expect(container.textContent).not.toContain('Owlbear Den');
      expect(calls.filter(u => u === '/api/encounters')).toHaveLength(1);
    });

    it('shows an "all already linked" message when every owned encounter is linked', async () => {
      const owned = [makeEncounter({ id: 'e1', name: 'One' })];
      const linked = [makeEncounter({ id: 'e1', name: 'One' })];
      mockLinkedThenOwned(linked, owned);
      await render();

      await act(async () => { findButton('Link Existing Encounter')!.click(); });
      await flush();

      expect(container.textContent).toMatch(/already linked/i);
      expect(buttons().filter(b => b.textContent?.trim() === 'Link')).toHaveLength(0);
    });

    it('links an unlinked encounter: POSTs {encounterId}, then refetches linked list', async () => {
      const owned = [makeEncounter({ id: 'e9', name: 'Owlbear Den' })];
      let linkedState: Encounter[] = [];
      let postBody: unknown = null;
      global.fetch = jest.fn(async (input: unknown, init?: unknown) => {
        const url = String(input);
        const method = (init as RequestInit | undefined)?.method;
        if (url === '/api/campaigns/campaign-123/encounters' && method === 'POST') {
          postBody = JSON.parse((init as RequestInit).body as string);
          linkedState = owned;
          return { ok: true, json: async () => ({ message: 'linked' }) } as unknown as Response;
        }
        if (url === '/api/campaigns/campaign-123/encounters') {
          return { ok: true, json: async () => linkedState } as unknown as Response;
        }
        if (url === '/api/encounters') {
          return { ok: true, json: async () => owned } as unknown as Response;
        }
        return { ok: true, json: async () => ({}) } as unknown as Response;
      }) as typeof fetch;

      await render();
      await act(async () => { findButton('Link Existing Encounter')!.click(); });
      await flush();

      await act(async () => { findButton('Link')!.click(); });
      await flush();

      expect(postBody).toEqual({ encounterId: 'e9' });
      expect(container.textContent).toContain('Owlbear Den');
    });

    it('shows an inline error and keeps the picker open when linking returns 404', async () => {
      const owned = [makeEncounter({ id: 'e9', name: 'Owlbear Den' })];
      const linkedCalls: string[] = [];
      global.fetch = jest.fn(async (input: unknown, init?: unknown) => {
        const url = String(input);
        const method = (init as RequestInit | undefined)?.method;
        if (url === '/api/campaigns/campaign-123/encounters' && method === 'POST') {
          return { ok: false, status: 404, json: async () => ({ error: 'Encounter not found' }) } as unknown as Response;
        }
        if (url === '/api/campaigns/campaign-123/encounters') {
          linkedCalls.push(url);
          return { ok: true, json: async () => [] } as unknown as Response;
        }
        if (url === '/api/encounters') {
          return { ok: true, json: async () => owned } as unknown as Response;
        }
        return { ok: true, json: async () => ({}) } as unknown as Response;
      }) as typeof fetch;

      await render();
      await act(async () => { findButton('Link Existing Encounter')!.click(); });
      await flush();
      const initialLinkedCalls = linkedCalls.length;

      await act(async () => { findButton('Link')!.click(); });
      await flush();

      expect(container.textContent).toMatch(/Encounter not found/i);
      expect(linkedCalls.length).toBe(initialLinkedCalls);
      expect(findButton('Link')).toBeTruthy();
    });

    it('double-clicking the link control results in exactly one POST call', async () => {
      const owned = [makeEncounter({ id: 'e9', name: 'Owlbear Den' })];
      let postCount = 0;
      let resolvePost: (() => void) | null = null;
      global.fetch = jest.fn(async (input: unknown, init?: unknown) => {
        const url = String(input);
        const method = (init as RequestInit | undefined)?.method;
        if (url === '/api/campaigns/campaign-123/encounters' && method === 'POST') {
          postCount += 1;
          await new Promise<void>(resolve => { resolvePost = resolve; });
          return { ok: true, json: async () => ({ message: 'linked' }) } as unknown as Response;
        }
        if (url === '/api/campaigns/campaign-123/encounters') {
          return { ok: true, json: async () => [] } as unknown as Response;
        }
        if (url === '/api/encounters') {
          return { ok: true, json: async () => owned } as unknown as Response;
        }
        return { ok: true, json: async () => ({}) } as unknown as Response;
      }) as typeof fetch;

      await render();
      await act(async () => { findButton('Link Existing Encounter')!.click(); });
      await flush();

      const linkBtn = findButton('Link')!;
      await act(async () => {
        linkBtn.click();
        linkBtn.click();
      });
      expect(linkBtn.disabled).toBe(true);

      await act(async () => { resolvePost?.(); await new Promise(r => setTimeout(r, 0)); });

      expect(postCount).toBe(1);
    });

    it('disables every Link button, not just the row being linked, while a link is in flight', async () => {
      const owned = [
        makeEncounter({ id: 'e1', name: 'Owlbear Den' }),
        makeEncounter({ id: 'e2', name: 'Goblin Ambush' }),
      ];
      let resolvePost: (() => void) | null = null;
      global.fetch = jest.fn(async (input: unknown, init?: unknown) => {
        const url = String(input);
        const method = (init as RequestInit | undefined)?.method;
        if (url === '/api/campaigns/campaign-123/encounters' && method === 'POST') {
          await new Promise<void>(resolve => { resolvePost = resolve; });
          return { ok: true, json: async () => ({ message: 'linked' }) } as unknown as Response;
        }
        if (url === '/api/campaigns/campaign-123/encounters') {
          return { ok: true, json: async () => [] } as unknown as Response;
        }
        if (url === '/api/encounters') {
          return { ok: true, json: async () => owned } as unknown as Response;
        }
        return { ok: true, json: async () => ({}) } as unknown as Response;
      }) as typeof fetch;

      await render();
      await act(async () => { findButton('Link Existing Encounter')!.click(); });
      await flush();

      const linkButtons = buttons().filter(b => b.textContent?.trim() === 'Link');
      expect(linkButtons).toHaveLength(2);

      await act(async () => { linkButtons[0].click(); });

      const stillLabeledLink = buttons().filter(b => b.textContent?.trim() === 'Link');
      expect(stillLabeledLink).toHaveLength(1);
      expect(stillLabeledLink[0].disabled).toBe(true);

      await act(async () => { resolvePost?.(); await new Promise(r => setTimeout(r, 0)); });
    });
  });

  describe('Task E — Create New Encounter', () => {
    it('opening "Create New Encounter" renders EncounterEditor', async () => {
      global.fetch = jest.fn(async () => ({ ok: true, json: async () => [] }) as unknown as Response) as typeof fetch;
      await render();

      await act(async () => { findButton('Create New Encounter')!.click(); });
      await flush();

      expect(container.textContent).toContain('Create Encounter');
    });

    it('saving posts to /api/encounters with campaignId, closes panel, and refetches on plain 201', async () => {
      let postBody: Record<string, unknown> | null = null;
      let getLinkedCalls = 0;
      global.fetch = jest.fn(async (input: unknown, init?: unknown) => {
        const url = String(input);
        const method = (init as RequestInit | undefined)?.method;
        if (url === '/api/encounters' && method === 'POST') {
          postBody = JSON.parse((init as RequestInit).body as string);
          return { ok: true, status: 201, json: async () => makeEncounter({ id: 'new-1', name: 'New One' }) } as unknown as Response;
        }
        if (url === '/api/campaigns/campaign-123/encounters') {
          getLinkedCalls += 1;
          return { ok: true, json: async () => [] } as unknown as Response;
        }
        return { ok: true, json: async () => ({}) } as unknown as Response;
      }) as typeof fetch;

      await render();
      const initialCalls = getLinkedCalls;

      await act(async () => { findButton('Create New Encounter')!.click(); });
      await flush();

      const nameInput = container.querySelector('#encounter-name') as HTMLInputElement;
      await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
        setter.call(nameInput, 'New One');
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      });

      await act(async () => { findButton('Save Encounter')!.click(); });
      await flush();

      expect(postBody).toMatchObject({ name: 'New One', campaignId: 'campaign-123' });
      expect(findButton('Save Encounter')).toBeFalsy();
      expect(getLinkedCalls).toBeGreaterThan(initialCalls);
    });

    it('shows a non-blocking warning, closes panel, and refetches when the response includes linkWarning', async () => {
      global.fetch = jest.fn(async (input: unknown, init?: unknown) => {
        const url = String(input);
        const method = (init as RequestInit | undefined)?.method;
        if (url === '/api/encounters' && method === 'POST') {
          return {
            ok: true,
            status: 201,
            json: async () => ({ ...makeEncounter({ id: 'new-1', name: 'New One' }), linkWarning: 'Encounter created but could not be linked to campaign; link it manually.' }),
          } as unknown as Response;
        }
        return { ok: true, json: async () => [] } as unknown as Response;
      }) as typeof fetch;

      await render();
      await act(async () => { findButton('Create New Encounter')!.click(); });
      await flush();

      const nameInput = container.querySelector('#encounter-name') as HTMLInputElement;
      await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
        setter.call(nameInput, 'New One');
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await act(async () => { findButton('Save Encounter')!.click(); });
      await flush();

      expect(container.textContent).toMatch(/could not be linked/i);
      expect(findButton('Save Encounter')).toBeFalsy();
    });

    it('shows an error banner and keeps the editor open when creation fails', async () => {
      global.fetch = jest.fn(async (input: unknown, init?: unknown) => {
        const url = String(input);
        const method = (init as RequestInit | undefined)?.method;
        if (url === '/api/encounters' && method === 'POST') {
          return { ok: false, json: async () => ({ error: 'Name is required' }) } as unknown as Response;
        }
        return { ok: true, json: async () => [] } as unknown as Response;
      }) as typeof fetch;

      await render();
      await act(async () => { findButton('Create New Encounter')!.click(); });
      await flush();

      const nameInput = container.querySelector('#encounter-name') as HTMLInputElement;
      await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
        setter.call(nameInput, 'New One');
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await act(async () => { findButton('Save Encounter')!.click(); });
      await flush();

      expect(container.textContent).toMatch(/Name is required/i);
      expect(findButton('Save Encounter')).toBeTruthy();
    });

    it('cancelling the editor returns to the action buttons without posting', async () => {
      let postCalled = false;
      global.fetch = jest.fn(async (input: unknown, init?: unknown) => {
        const url = String(input);
        const method = (init as RequestInit | undefined)?.method;
        if (url === '/api/encounters' && method === 'POST') { postCalled = true; }
        return { ok: true, json: async () => [] } as unknown as Response;
      }) as typeof fetch;

      await render();
      await act(async () => { findButton('Create New Encounter')!.click(); });
      await flush();

      expect(findButton('Save Encounter')).toBeTruthy();
      await act(async () => { findButton('Cancel')!.click(); });
      await flush();

      expect(postCalled).toBe(false);
      expect(findButton('Save Encounter')).toBeFalsy();
      expect(findButton('Create New Encounter')).toBeTruthy();
    });
  });

  describe('Task F — Unlink per row', () => {
    it('confirms with encounter name and "not deleted" text, then DELETEs and refetches', async () => {
      let deletedUrl: string | null = null;
      let linkedState = [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })];
      let confirmText = '';
      window.confirm = jest.fn((msg?: string) => { confirmText = msg ?? ''; return true; });

      global.fetch = jest.fn(async (input: unknown, init?: unknown) => {
        const url = String(input);
        const method = (init as RequestInit | undefined)?.method;
        if (method === 'DELETE') {
          deletedUrl = url;
          linkedState = [];
          return { ok: true } as unknown as Response;
        }
        return { ok: true, json: async () => linkedState } as unknown as Response;
      }) as typeof fetch;

      await render();
      expect(container.textContent).toContain('Goblin Ambush');

      await act(async () => { findButton('Unlink')!.click(); });
      await flush();

      expect(confirmText).toContain('Goblin Ambush');
      expect(confirmText.toLowerCase()).toContain('not be deleted');
      expect(deletedUrl).toBe('/api/campaigns/campaign-123/encounters/e1');
      expect(container.textContent).not.toContain('Goblin Ambush');
    });

    it('shows an error banner and keeps the row when the DELETE fails', async () => {
      window.confirm = jest.fn(() => true);
      const linked = [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })];

      global.fetch = jest.fn(async (input: unknown, init?: unknown) => {
        const method = (init as RequestInit | undefined)?.method;
        if (method === 'DELETE') {
          return { ok: false, json: async () => ({ error: 'Cannot unlink right now' }) } as unknown as Response;
        }
        return { ok: true, json: async () => linked } as unknown as Response;
      }) as typeof fetch;

      await render();
      await act(async () => { findButton('Unlink')!.click(); });
      await flush();

      expect(container.textContent).toMatch(/Cannot unlink right now/i);
      expect(container.textContent).toContain('Goblin Ambush');
    });

    it('does not DELETE and keeps the row when confirm is cancelled', async () => {
      let deleteCalled = false;
      window.confirm = jest.fn(() => false);
      const linked = [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })];

      global.fetch = jest.fn(async (input: unknown, init?: unknown) => {
        const method = (init as RequestInit | undefined)?.method;
        if (method === 'DELETE') { deleteCalled = true; return { ok: true } as unknown as Response; }
        return { ok: true, json: async () => linked } as unknown as Response;
      }) as typeof fetch;

      await render();
      await act(async () => { findButton('Unlink')!.click(); });
      await flush();

      expect(deleteCalled).toBe(false);
      expect(container.textContent).toContain('Goblin Ambush');
    });
  });
});

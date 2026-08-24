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

const LINKED_URL = '/api/campaigns/campaign-123/encounters';
const OWNED_URL = '/api/encounters';

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
  mockParamsId = 'campaign-123';
});

// --- Fetch mocking: declare routes once, reuse everywhere ---
//
// A route value is either static response data (wrapped as a 200 JSON response),
// a prebuilt Response via res(), or a handler function for dynamic/stateful
// behavior. Keys may be a bare URL (matches any method) or "METHOD url" to
// target one method specifically; an exact "METHOD url" match wins over the
// bare-URL fallback.
type FetchCall = { url: string; method: string; body: unknown };
type RouteHandler = (init: RequestInit | undefined, calls: FetchCall[]) => unknown | Promise<unknown>;
type RouteValue = unknown | RouteHandler;

function isResponseLike(v: unknown): v is Response {
  return typeof v === 'object' && v !== null && typeof (v as Response).json === 'function' && 'ok' in v;
}

function res(body: unknown, opts: { ok?: boolean; status?: number } = {}): Response {
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? (opts.ok === false ? 400 : 200),
    json: async () => body,
  } as unknown as Response;
}

function mockRoutes(routes: Record<string, RouteValue>): FetchCall[] {
  const calls: FetchCall[] = [];
  global.fetch = jest.fn(async (input: unknown, init?: unknown) => {
    const url = String(input);
    const method = ((init as RequestInit | undefined)?.method ?? 'GET').toUpperCase();
    const rawBody = (init as RequestInit | undefined)?.body;
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : undefined;
    calls.push({ url, method, body });

    const handler = routes[`${method} ${url}`] ?? routes[url];
    const value = typeof handler === 'function' ? await (handler as RouteHandler)(init as RequestInit, calls) : handler;
    if (value === undefined) return res({});
    return isResponseLike(value) ? value : res(value);
  }) as typeof fetch;
  return calls;
}

// --- Render + interaction helpers ---

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

async function clickAndFlush(label: string) {
  await act(async () => { findButton(label)!.click(); });
  await flush();
}

function setValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

async function setValueAndFlush(el: HTMLInputElement, value: string) {
  await act(async () => { setValue(el, value); });
  await flush();
}

function searchInput(): HTMLInputElement {
  return container.querySelector('input[type="text"]') as HTMLInputElement;
}

function nameInput(): HTMLInputElement {
  return container.querySelector('#encounter-name') as HTMLInputElement;
}

async function openPicker() {
  await clickAndFlush('Link Existing Encounter');
}

async function openCreatePanel() {
  await clickAndFlush('Create New Encounter');
}

async function createEncounter(name: string) {
  await openCreatePanel();
  await setValueAndFlush(nameInput(), name);
  await clickAndFlush('Save Encounter');
}

describe('Campaign Encounters Page', () => {
  describe('Task C — linked-encounters list', () => {
    it('fetches GET /api/campaigns/[id]/encounters once on mount and renders names', async () => {
      const linked = [makeEncounter({ id: 'e1', name: 'Goblin Ambush' }), makeEncounter({ id: 'e2', name: "Dragon's Lair" })];
      const calls = mockRoutes({ [LINKED_URL]: linked });

      await render();

      expect(calls.filter(c => c.url === LINKED_URL)).toHaveLength(1);
      expect(container.textContent).toContain('Goblin Ambush');
      expect(container.textContent).toContain("Dragon's Lair");
    });

    it('renders empty-state with actions and no error when GET returns []', async () => {
      mockRoutes({ [LINKED_URL]: [] });
      await render();

      expect(findButton('Link Existing Encounter')).toBeTruthy();
      expect(findButton('Create New Encounter')).toBeTruthy();
      expect(container.querySelector('.bg-red-900')).toBeFalsy();
    });

    it('renders an error banner and does not crash when fetch fails', async () => {
      mockRoutes({ [LINKED_URL]: res({ error: 'boom' }, { ok: false }) });
      await render();

      expect(container.querySelector('.bg-red-900')).toBeTruthy();
      expect(container.textContent).toMatch(/boom/);
    });
  });

  describe('campaignId from an array param (catch-all route defensiveness)', () => {
    it('renders nothing when useParams().id is an empty array', async () => {
      mockParamsId = [];
      mockRoutes({ [LINKED_URL]: [] });

      await render();

      expect(container.textContent).toBe('');
    });

    it('uses the first element when useParams().id is a populated array', async () => {
      mockParamsId = ['campaign-arr', 'extra'];
      const calls = mockRoutes({ '/api/campaigns/campaign-arr/encounters': [] });

      await render();

      expect(calls.some(c => c.url === '/api/campaigns/campaign-arr/encounters')).toBe(true);
    });
  });

  describe('Task D — Link Existing Encounter picker', () => {
    it('opening the picker triggers exactly one GET /api/encounters call', async () => {
      const owned = [makeEncounter({ id: 'e1', name: 'A' })];
      const calls = mockRoutes({ [LINKED_URL]: [], [OWNED_URL]: owned });
      await render();

      await openPicker();

      expect(calls.filter(c => c.url === OWNED_URL)).toHaveLength(1);
    });

    it('shows a picker error banner when GET /api/encounters fails, without crashing', async () => {
      mockRoutes({
        [LINKED_URL]: [],
        [OWNED_URL]: res({ error: 'Could not load your encounters' }, { ok: false }),
      });

      await render();
      await openPicker();

      expect(container.textContent).toMatch(/Could not load your encounters/i);
      expect(findButton('Link')).toBeFalsy();
      // owned ends up empty after a failed fetch too, but the empty-state copy
      // must not contradict the error banner by claiming the user has no encounters.
      expect(container.textContent).not.toMatch(/don't have any encounters yet/i);
    });

    it('resets the owned list when reopening the picker after a failed fetch', async () => {
      let ownedShouldFail = false;
      const owned = [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })];
      mockRoutes({
        [LINKED_URL]: [],
        [OWNED_URL]: () => (ownedShouldFail ? res({ error: 'Temporary failure' }, { ok: false }) : owned),
      });

      await render();
      await openPicker();
      expect(container.textContent).toContain('Goblin Ambush');

      await clickAndFlush('Cancel');
      ownedShouldFail = true;
      await openPicker();

      expect(container.textContent).toMatch(/Temporary failure/i);
      expect(container.textContent).not.toContain('Goblin Ambush');
    });

    it.each([
      {
        when: 'the user owns no encounters at all',
        owned: [] as Encounter[],
        linked: [] as Encounter[],
        search: undefined as string | undefined,
        expectedMessage: /don't have any encounters yet/i,
      },
      {
        when: 'a search term matches nothing',
        owned: [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })],
        linked: [] as Encounter[],
        search: 'zzz-no-match',
        expectedMessage: /no encounters match your search/i,
      },
      {
        when: 'every owned encounter is already linked',
        owned: [makeEncounter({ id: 'e1', name: 'One' })],
        linked: [makeEncounter({ id: 'e1', name: 'One' })],
        search: undefined as string | undefined,
        expectedMessage: /already linked/i,
      },
    ])('shows the matching empty-picker message when $when', async ({ owned, linked, search, expectedMessage }) => {
      mockRoutes({ [LINKED_URL]: linked, [OWNED_URL]: owned });
      await render();
      await openPicker();
      if (search) await setValueAndFlush(searchInput(), search);

      expect(container.textContent).toMatch(expectedMessage);
      expect(buttons().filter(b => b.textContent?.trim() === 'Link')).toHaveLength(0);
    });

    it('excludes already-linked encounters from the picker', async () => {
      const owned = [
        makeEncounter({ id: 'e1', name: 'One' }),
        makeEncounter({ id: 'e2', name: 'Two' }),
        makeEncounter({ id: 'e3', name: 'Three' }),
      ];
      const linked = [makeEncounter({ id: 'e1', name: 'One' })];
      mockRoutes({ [LINKED_URL]: linked, [OWNED_URL]: owned });
      await render();

      await openPicker();

      const pickerText = container.textContent ?? '';
      expect(pickerText).toContain('Two');
      expect(pickerText).toContain('Three');
      // "One" is already linked, so it must not appear as a pickable row.
      const linkButtons = buttons().filter(b => b.textContent?.trim() === 'Link');
      expect(linkButtons).toHaveLength(2);
    });

    it('filters picker results by case-insensitive name search without extra fetch calls', async () => {
      const owned = [
        makeEncounter({ id: 'e1', name: 'Goblin Ambush' }),
        makeEncounter({ id: 'e2', name: 'Owlbear Den' }),
      ];
      const calls = mockRoutes({ [LINKED_URL]: [], [OWNED_URL]: owned });
      await render();

      await openPicker();

      const input = searchInput();
      expect(input).toBeTruthy();
      expect(input.getAttribute('aria-label')).toBe('Search encounters');
      await setValueAndFlush(input, 'gob');

      expect(container.textContent).toContain('Goblin Ambush');
      expect(container.textContent).not.toContain('Owlbear Den');
      expect(calls.filter(c => c.url === OWNED_URL)).toHaveLength(1);
    });

    it('links an unlinked encounter: POSTs {encounterId}, then refetches linked list', async () => {
      const owned = [makeEncounter({ id: 'e9', name: 'Owlbear Den' })];
      let linkedState: Encounter[] = [];
      const calls = mockRoutes({
        [OWNED_URL]: owned,
        [LINKED_URL]: () => linkedState,
        [`POST ${LINKED_URL}`]: () => { linkedState = owned; return { message: 'linked' }; },
      });

      await render();
      await openPicker();
      await clickAndFlush('Link');

      expect(calls.find(c => c.method === 'POST')?.body).toEqual({ encounterId: 'e9' });
      expect(container.textContent).toContain('Owlbear Den');
    });

    it('shows an inline error and keeps the picker open when linking returns 404', async () => {
      const owned = [makeEncounter({ id: 'e9', name: 'Owlbear Den' })];
      const calls = mockRoutes({
        [OWNED_URL]: owned,
        [LINKED_URL]: [],
        [`POST ${LINKED_URL}`]: () => res({ error: 'Encounter not found' }, { ok: false, status: 404 }),
      });

      await render();
      await openPicker();
      const linkedGetsBefore = calls.filter(c => c.url === LINKED_URL && c.method === 'GET').length;

      await clickAndFlush('Link');

      expect(container.textContent).toMatch(/Encounter not found/i);
      expect(calls.filter(c => c.url === LINKED_URL && c.method === 'GET')).toHaveLength(linkedGetsBefore);
      expect(findButton('Link')).toBeTruthy();
    });

    it('double-clicking the link control results in exactly one POST call', async () => {
      const owned = [makeEncounter({ id: 'e9', name: 'Owlbear Den' })];
      let postCount = 0;
      let resolvePost: (() => void) | null = null;
      mockRoutes({
        [OWNED_URL]: owned,
        [LINKED_URL]: [],
        [`POST ${LINKED_URL}`]: async () => {
          postCount += 1;
          await new Promise<void>(resolve => { resolvePost = resolve; });
          return { message: 'linked' };
        },
      });

      await render();
      await openPicker();

      const linkBtn = findButton('Link')!;
      await act(async () => { linkBtn.click(); linkBtn.click(); });
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
      mockRoutes({
        [OWNED_URL]: owned,
        [LINKED_URL]: [],
        [`POST ${LINKED_URL}`]: async () => {
          await new Promise<void>(resolve => { resolvePost = resolve; });
          return { message: 'linked' };
        },
      });

      await render();
      await openPicker();

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
      mockRoutes({ [LINKED_URL]: [] });
      await render();

      await openCreatePanel();

      expect(container.textContent).toContain('Create Encounter');
    });

    it('saving posts to /api/encounters with campaignId, closes panel, and refetches on plain 201', async () => {
      const calls = mockRoutes({
        [LINKED_URL]: [],
        [`POST ${OWNED_URL}`]: () => res(makeEncounter({ id: 'new-1', name: 'New One' }), { status: 201 }),
      });

      await render();
      const initialLinkedGets = calls.filter(c => c.url === LINKED_URL).length;

      await createEncounter('New One');

      const postCall = calls.find(c => c.method === 'POST');
      expect(postCall?.body).toMatchObject({ name: 'New One', campaignId: 'campaign-123' });
      expect(findButton('Save Encounter')).toBeFalsy();
      expect(calls.filter(c => c.url === LINKED_URL).length).toBeGreaterThan(initialLinkedGets);
    });

    it('shows a non-blocking warning, closes panel, and refetches when the response includes linkWarning', async () => {
      mockRoutes({
        [LINKED_URL]: [],
        [`POST ${OWNED_URL}`]: () => res(
          { ...makeEncounter({ id: 'new-1', name: 'New One' }), linkWarning: 'Encounter created but could not be linked to campaign; link it manually.' },
          { status: 201 },
        ),
      });

      await render();
      await createEncounter('New One');

      expect(container.textContent).toMatch(/could not be linked/i);
      expect(findButton('Save Encounter')).toBeFalsy();
    });

    it('shows an error banner and keeps the editor open when creation fails', async () => {
      mockRoutes({
        [LINKED_URL]: [],
        [`POST ${OWNED_URL}`]: () => res({ error: 'Name is required' }, { ok: false }),
      });

      await render();
      await createEncounter('New One');

      expect(container.textContent).toMatch(/Name is required/i);
      expect(findButton('Save Encounter')).toBeTruthy();
    });

    it('cancelling the editor returns to the action buttons without posting', async () => {
      const calls = mockRoutes({ [LINKED_URL]: [] });

      await render();
      await openCreatePanel();
      expect(findButton('Save Encounter')).toBeTruthy();

      await clickAndFlush('Cancel');

      expect(calls.some(c => c.method === 'POST')).toBe(false);
      expect(findButton('Save Encounter')).toBeFalsy();
      expect(findButton('Create New Encounter')).toBeTruthy();
    });
  });

  describe('Task F — Unlink per row', () => {
    it('confirms with encounter name and "not deleted" text, then DELETEs and refetches', async () => {
      let linkedState = [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })];
      let confirmText = '';
      window.confirm = jest.fn((msg?: string) => { confirmText = msg ?? ''; return true; });
      const calls = mockRoutes({
        [LINKED_URL]: () => linkedState,
        [`DELETE ${LINKED_URL}/e1`]: () => { linkedState = []; return {}; },
      });

      await render();
      expect(container.textContent).toContain('Goblin Ambush');

      await clickAndFlush('Unlink');

      expect(confirmText).toContain('Goblin Ambush');
      expect(confirmText.toLowerCase()).toContain('not be deleted');
      expect(calls.some(c => c.method === 'DELETE' && c.url === `${LINKED_URL}/e1`)).toBe(true);
      expect(container.textContent).not.toContain('Goblin Ambush');
    });

    it('shows an error banner and keeps the row when the DELETE fails', async () => {
      window.confirm = jest.fn(() => true);
      const linked = [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })];
      mockRoutes({
        [LINKED_URL]: linked,
        [`DELETE ${LINKED_URL}/e1`]: () => res({ error: 'Cannot unlink right now' }, { ok: false }),
      });

      await render();
      await clickAndFlush('Unlink');

      expect(container.textContent).toMatch(/Cannot unlink right now/i);
      expect(container.textContent).toContain('Goblin Ambush');
    });

    it('does not DELETE and keeps the row when confirm is cancelled', async () => {
      window.confirm = jest.fn(() => false);
      const linked = [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })];
      const calls = mockRoutes({ [LINKED_URL]: linked });

      await render();
      await clickAndFlush('Unlink');

      expect(calls.some(c => c.method === 'DELETE')).toBe(false);
      expect(container.textContent).toContain('Goblin Ambush');
    });
  });
});

import React from 'react';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import type { Encounter, Monster } from '@/lib/types';

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

let mockIsDM: { isDM: boolean; loading: boolean } = { isDM: true, loading: false };
jest.mock('@/lib/hooks/useIsDM', () => ({
  useIsDM: () => mockIsDM,
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
  mockIsDM = { isDM: true, loading: false };
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

const MOCK_RESPONSE_TAG = Symbol('mockResponse');

function isResponseLike(v: unknown): v is Response {
  return typeof v === 'object' && v !== null && MOCK_RESPONSE_TAG in v;
}

function res(body: unknown, opts: { ok?: boolean; status?: number } = {}): Response {
  return {
    [MOCK_RESPONSE_TAG]: true,
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

  // These three failure paths (link/create/unlink) share one shape: a single
  // mutation endpoint fails, the page must surface the server's error text
  // inline, and it must not silently discard the in-progress state (the
  // picker/editor stays open, or the row stays put).
  describe('Failing mutations surface an inline error and change nothing else', () => {
    it.each([
      {
        name: 'linking an encounter the DM no longer owns (404)',
        routes: {
          [OWNED_URL]: [makeEncounter({ id: 'e9', name: 'Owlbear Den' })],
          [LINKED_URL]: [],
          [`POST ${LINKED_URL}`]: res({ error: 'Encounter not found' }, { ok: false, status: 404 }),
        },
        perform: async () => { await openPicker(); await clickAndFlush('Link'); },
        errorMessage: /Encounter not found/i,
        unchanged: () => expect(findButton('Link')).toBeTruthy(),
      },
      {
        name: 'creating an encounter that fails validation',
        routes: {
          [LINKED_URL]: [],
          [`POST ${OWNED_URL}`]: res({ error: 'Name is required' }, { ok: false }),
        },
        perform: async () => { await createEncounter('New One'); },
        errorMessage: /Name is required/i,
        unchanged: () => expect(findButton('Save Encounter')).toBeTruthy(),
      },
      {
        name: 'unlinking an encounter that the server rejects',
        routes: {
          [LINKED_URL]: [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })],
          [`DELETE ${LINKED_URL}/e1`]: res({ error: 'Cannot unlink right now' }, { ok: false }),
        },
        perform: async () => { window.confirm = jest.fn(() => true); await clickAndFlush('Unlink'); },
        errorMessage: /Cannot unlink right now/i,
        unchanged: () => expect(container.textContent).toContain('Goblin Ambush'),
      },
    ])('$name', async ({ routes, perform, errorMessage, unchanged }) => {
      mockRoutes(routes);
      await render();

      await perform();

      expect(container.textContent).toMatch(errorMessage);
      unchanged();
    });
  });

  // --- monster fixture for roster assertions ---
  function makeMonster(overrides: Partial<Monster> = {}): Monster {
    return {
      id: `m-${++nextFixtureId}`,
      name: 'Goblin',
      size: 'small',
      type: 'humanoid',
      speed: '30 ft.',
      challengeRating: 0.25,
      ac: 15,
      hp: 7,
      maxHp: 7,
      abilityScores: { strength: 8, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 8, charisma: 8 },
      ...overrides,
    };
  }

  describe('Task B — DM-awareness / read-only path', () => {
    it('B1 — DM sees Link/Create bar plus per-card Edit and Unlink', async () => {
      mockIsDM = { isDM: true, loading: false };
      mockRoutes({ [LINKED_URL]: [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })] });
      await render();

      expect(findButton('Link Existing Encounter')).toBeTruthy();
      expect(findButton('Create New Encounter')).toBeTruthy();
      expect(findButton('Edit')).toBeTruthy();
      expect(findButton('Unlink')).toBeTruthy();
    });

    it('B2 — non-DM sees name/description/roster and none of Link/Create/Edit/Unlink, no error', async () => {
      mockIsDM = { isDM: false, loading: false };
      const linked = [
        makeEncounter({
          id: 'e1',
          name: 'Goblin Ambush',
          description: 'Roadside attack',
          monsters: [makeMonster({ name: 'Goblin A' }), makeMonster({ name: 'Goblin B' })],
        }),
      ];
      mockRoutes({ [LINKED_URL]: linked });
      await render();

      expect(container.textContent).toContain('Goblin Ambush');
      expect(container.textContent).toContain('Roadside attack');
      expect(container.textContent).toContain('Monsters (2)');
      expect(container.textContent).toContain('Goblin A');
      for (const label of ['Link Existing Encounter', 'Create New Encounter', 'Edit', 'Unlink']) {
        expect(findButton(label)).toBeFalsy();
      }
      expect(container.querySelector('.bg-red-900')).toBeFalsy();
    });

    it('B3 — while the role is still resolving, no management controls render', async () => {
      mockIsDM = { isDM: false, loading: true };
      mockRoutes({ [LINKED_URL]: [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })] });
      await render();

      expect(container.textContent).toContain('Goblin Ambush');
      for (const label of ['Link Existing Encounter', 'Create New Encounter', 'Edit', 'Unlink']) {
        expect(findButton(label)).toBeFalsy();
      }
    });
  });

  describe('Task C — inline edit', () => {
    const EDIT_URL = '/api/encounters/e1';

    async function openEditor() {
      await clickAndFlush('Edit');
    }

    it('C1 — clicking Edit mounts EncounterEditor with the encounter data (isNew=false)', async () => {
      mockRoutes({ [LINKED_URL]: [makeEncounter({ id: 'e1', name: 'Goblin Ambush', description: 'Roadside' })] });
      await render();

      await openEditor();

      expect(container.textContent).toContain('Edit Encounter');
      expect(nameInput().value).toBe('Goblin Ambush');
    });

    it('C2 — saving PUTs the edit, closes the editor, refetches, and shows the new name', async () => {
      let linkedState = [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })];
      const calls = mockRoutes({
        [LINKED_URL]: () => linkedState,
        [`PUT ${EDIT_URL}`]: (init: RequestInit | undefined) => {
          const body = JSON.parse((init as RequestInit).body as string);
          linkedState = [makeEncounter({ id: 'e1', name: body.name })];
          return res(makeEncounter({ id: 'e1', name: body.name }));
        },
      });

      await render();
      await openEditor();
      await setValueAndFlush(nameInput(), 'Goblin Ambush (Hard)');
      const getsBeforeSave = calls.filter(c => c.method === 'GET' && c.url === LINKED_URL).length;
      await clickAndFlush('Save Encounter');

      const putCall = calls.find(c => c.method === 'PUT' && c.url === EDIT_URL);
      expect(putCall?.body).toMatchObject({ name: 'Goblin Ambush (Hard)' });
      expect(findButton('Save Encounter')).toBeFalsy();
      expect(calls.filter(c => c.method === 'GET' && c.url === LINKED_URL).length).toBeGreaterThan(getsBeforeSave);
      expect(container.textContent).toContain('Goblin Ambush (Hard)');
    });

    it('C3 — a failed save shows the server error, keeps the editor open, and does not refetch', async () => {
      const calls = mockRoutes({
        [LINKED_URL]: [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })],
        [`PUT ${EDIT_URL}`]: res({ error: 'Encounter name is required' }, { ok: false, status: 400 }),
      });

      await render();
      await openEditor();
      const getsBeforeSave = calls.filter(c => c.method === 'GET' && c.url === LINKED_URL).length;
      await clickAndFlush('Save Encounter');

      expect(container.textContent).toMatch(/Encounter name is required/);
      expect(findButton('Save Encounter')).toBeTruthy();
      expect(calls.filter(c => c.method === 'GET' && c.url === LINKED_URL).length).toBe(getsBeforeSave);
    });

    it('C4 — opening Edit on a second card replaces the first editor (one at a time)', async () => {
      mockRoutes({
        [LINKED_URL]: [
          makeEncounter({ id: 'e1', name: 'Goblin Ambush' }),
          makeEncounter({ id: 'e2', name: "Dragon's Lair" }),
        ],
      });
      await render();

      const editButtons = buttons().filter(b => b.textContent?.trim() === 'Edit');
      await act(async () => { editButtons[0].click(); });
      await flush();
      expect(nameInput().value).toBe('Goblin Ambush');

      // The editor for e1 replaces the card for e1. The only "Edit" button left
      // is for e2.
      const editButtons2 = buttons().filter(b => b.textContent?.trim() === 'Edit');
      await act(async () => { editButtons2[0].click(); });
      await flush();

      expect(container.querySelectorAll('#encounter-name')).toHaveLength(1);
      expect(nameInput().value).toBe("Dragon's Lair");
    });

    it('C5 — no Edit control renders for a non-DM member', async () => {
      mockIsDM = { isDM: false, loading: false };
      mockRoutes({ [LINKED_URL]: [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })] });
      await render();

      expect(findButton('Edit')).toBeFalsy();
    });

    it('C6 — no Delete control renders on any linked-encounter card', async () => {
      mockRoutes({ [LINKED_URL]: [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })] });
      await render();

      expect(buttons().some(b => /delete/i.test(b.textContent ?? ''))).toBe(false);
    });

    it('C7 — opening Edit closes an open create panel', async () => {
      mockRoutes({ [LINKED_URL]: [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })] });
      await render();

      await openCreatePanel();
      expect(container.textContent).toContain('Create Encounter');

      await clickAndFlush('Edit');
      expect(container.textContent).not.toContain('Create Encounter');
      expect(container.textContent).toContain('Edit Encounter');
    });

    it('E2 — a network error on save shows an error, does not refetch, list unchanged', async () => {
      const calls = mockRoutes({
        [LINKED_URL]: [makeEncounter({ id: 'e1', name: 'Goblin Ambush' })],
        [`PUT ${EDIT_URL}`]: () => { throw new Error('Network down'); },
      });

      await render();
      await openEditor();
      const getsBeforeSave = calls.filter(c => c.method === 'GET' && c.url === LINKED_URL).length;
      await clickAndFlush('Save Encounter');

      expect(container.querySelector('.bg-red-900')).toBeTruthy();
      expect(calls.filter(c => c.method === 'GET' && c.url === LINKED_URL).length).toBe(getsBeforeSave);
      expect(nameInput().value).toBe('Goblin Ambush');
    });
  });
});

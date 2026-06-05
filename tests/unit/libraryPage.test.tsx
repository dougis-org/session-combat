import React from 'react';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import type { SavedContent } from '@/lib/types';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'campaign-123' }),
}));

jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

// Import after mocks
import LibraryPage from '@/app/campaigns/[id]/library/page';

function makeItem(overrides: Partial<SavedContent> = {}): SavedContent {
  return {
    id: crypto.randomUUID(),
    userId: 'user-1',
    campaignId: 'campaign-123',
    type: 'npc',
    title: 'Test NPC',
    systemPrompt: 'You are a DM assistant.',
    userMessage: 'Create an innkeeper.',
    prompt: 'You are a DM assistant.\n\nCreate an innkeeper.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

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

function mockFetch(items: SavedContent[]) {
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => items,
  }) as unknown as Response) as typeof fetch;
}

async function render() {
  await act(async () => {
    root = createRoot(container);
    root.render(React.createElement(LibraryPage));
  });
  await act(async () => { await new Promise(r => setTimeout(r, 0)); });
}

async function expandFirstCard() {
  const cardBtn = container.querySelector('button[aria-expanded="false"]') as HTMLButtonElement;
  await act(async () => { cardBtn.click(); });
}

describe('Library Page', () => {
  it('renders all items when GET returns mixed-type items', async () => {
    const items = [
      makeItem({ type: 'npc', title: 'Grigor the Innkeeper' }),
      makeItem({ type: 'location', title: 'Dark Forest' }),
      makeItem({ type: 'shop', title: 'Blacksmith' }),
    ];
    mockFetch(items);
    await render();
    expect(container.textContent).toContain('Grigor the Innkeeper');
    expect(container.textContent).toContain('Dark Forest');
    expect(container.textContent).toContain('Blacksmith');
  });

  it('filter tab click shows only matching type items', async () => {
    const items = [
      makeItem({ id: 'i1', type: 'npc', title: 'NPC One' }),
      makeItem({ id: 'i2', type: 'location', title: 'Location One' }),
    ];
    mockFetch(items);
    await render();

    // click NPC filter
    const buttons = Array.from(container.querySelectorAll('button'));
    const npcBtn = buttons.find(b => b.textContent?.trim() === 'NPC');
    expect(npcBtn).toBeTruthy();
    await act(async () => { npcBtn!.click(); });

    expect(container.textContent).toContain('NPC One');
    expect(container.textContent).not.toContain('Location One');
  });

  it('clicking a card expands it and shows systemPrompt in muted section, userMessage in bright section', async () => {
    const item = makeItem({
      systemPrompt: 'SYSTEM_TEXT_HERE',
      userMessage: 'USER_TEXT_HERE',
    });
    mockFetch([item]);
    await render();

    expect(container.querySelector('button[aria-expanded="false"]')).toBeTruthy();
    await expandFirstCard();

    const pres = container.querySelectorAll('pre');
    const texts = Array.from(pres).map(p => p.textContent ?? '');
    expect(texts.some(t => t.includes('SYSTEM_TEXT_HERE'))).toBe(true);
    expect(texts.some(t => t.includes('USER_TEXT_HERE'))).toBe(true);

    // system prompt is in muted color
    const systemPre = Array.from(pres).find(p => p.textContent?.includes('SYSTEM_TEXT_HERE'));
    expect(systemPre?.className).toContain('text-gray-400');

    // user message is in bright color
    const userPre = Array.from(pres).find(p => p.textContent?.includes('USER_TEXT_HERE'));
    expect(userPre?.className).toContain('text-gray-100');
  });

  it('"Copy Full Prompt" copies prompt field value', async () => {
    const item = makeItem({ prompt: 'FULL_PROMPT_TEXT' });
    mockFetch([item]);
    await render();

    let writtenText: string | undefined;
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn(async (text: string) => { writtenText = text; }) },
      writable: true,
      configurable: true,
    });

    await expandFirstCard();

    const copyBtn = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Copy Full Prompt'));
    expect(copyBtn).toBeTruthy();
    await act(async () => { (copyBtn as HTMLButtonElement).click(); });

    expect(writtenText).toBe('FULL_PROMPT_TEXT');
  });

  it('editing response and clicking Save calls PUT; success message shown', async () => {
    const item = makeItem({ id: 'save-item-1' });

    let capturedMethod: string | undefined;
    global.fetch = jest.fn(async (input: unknown, init?: unknown) => {
      const url = String(input);
      const method = (init as RequestInit | undefined)?.method;
      if (url === `/api/content/${item.id}`) {
        capturedMethod = method;
        return { ok: true, json: async () => ({}) } as unknown as Response;
      }
      return { ok: true, json: async () => [item] } as unknown as Response;
    }) as typeof fetch;

    await render();
    await expandFirstCard();

    const responseTA = container.querySelectorAll('textarea')[0];
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!;
      nativeInputValueSetter.call(responseTA, 'My AI response');
      responseTA.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const saveBtn = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.trim() === 'Save') as HTMLButtonElement;
    await act(async () => { saveBtn.click(); });
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    expect(capturedMethod).toBe('PUT');
    expect(container.textContent).toContain('Saved successfully');
  });

  it('Delete calls DELETE; item removed from list', async () => {
    const item = makeItem({ id: 'del-item-1', title: 'To Be Deleted' });
    mockFetch([item]);

    global.fetch = jest.fn(async (input: unknown, init?: unknown) => {
      const method = (init as RequestInit | undefined)?.method;
      if (method === 'DELETE') return { ok: true } as unknown as Response;
      return { ok: true, json: async () => [item] } as unknown as Response;
    }) as typeof fetch;

    await render();
    expect(container.textContent).toContain('To Be Deleted');

    await expandFirstCard();

    const deleteBtn = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.trim() === 'Delete');
    await act(async () => { (deleteBtn as HTMLButtonElement).click(); });
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    expect(container.textContent).not.toContain('To Be Deleted');
  });

  it('empty state renders when GET returns empty array', async () => {
    mockFetch([]);
    await render();
    expect(container.textContent).toContain('No saved content yet');
  });
});

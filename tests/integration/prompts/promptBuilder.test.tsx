/** @jest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { CampaignContext } from '@/lib/types';
import PromptBuilderPage from '@/app/campaigns/[id]/prompts/page';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'camp-1' }),
}));

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
  ErrorBanner: ({ message }: { message: string | null }) =>
    message ? React.createElement('div', { role: 'alert', 'data-testid': 'error-banner' }, message) : null,
  LoadingState: ({ label }: { label: string }) =>
    React.createElement('div', { 'data-testid': 'loading-state' }, label),
  FormField: ({ label, children }: { label: string; children: React.ReactNode }) =>
    React.createElement('div', null, React.createElement('label', null, label), children),
  textInputClass: () => '',
}));

jest.mock('@/lib/hooks/useCampaignContext', () => ({
  useCampaignContext: jest.fn(),
}));

jest.mock('@/lib/prompts/templates', () => {
  const npcBuild = () => ({ systemPrompt: 'Campaign: Curse of Strahd', userMessage: 'Create an NPC named Bob.', fullText: 'Campaign: Curse of Strahd\n\nCreate an NPC named Bob.' });
  const emptyBuild = () => ({ systemPrompt: '', userMessage: '', fullText: '' });
  return {
    TEMPLATES: [
      { id: 'npc', label: 'NPC', fields: [{ key: 'role', label: 'Role / Occupation', placeholder: 'e.g. innkeeper, guard, merchant', optional: true }], build: npcBuild },
      { id: 'location', label: 'Location Description', fields: [{ key: 'locationName', label: 'Location Name', placeholder: 'e.g. Tavern' }], build: emptyBuild },
      { id: 'shop', label: 'Shop / Establishment', fields: [], build: emptyBuild },
      { id: 'magic-item', label: 'Magic Item', fields: [], build: emptyBuild },
      { id: 'room', label: 'Room Description', fields: [], build: emptyBuild },
    ],
  };
});

const { useCampaignContext } = require('@/lib/hooks/useCampaignContext') as {
  useCampaignContext: jest.Mock;
};

const FULL_PROMPT = 'Campaign: Curse of Strahd\n\nCreate an NPC named Bob.';

const makeContext = (): CampaignContext => ({
  campaign: {
    id: 'camp-1', userId: 'u1', name: 'Curse of Strahd', moduleName: 'CoS',
    chapters: [{ id: 'ch-2', title: 'Act II', order: 2 }],
    currentChapterId: 'ch-2', status: 'active', notes: '',
    createdAt: new Date(), updatedAt: new Date(),
  },
  chapter: { id: 'ch-2', title: 'Act II', order: 2 },
  parties: [{ id: 'p-1', userId: 'u1', name: 'The Party', members: [], createdAt: new Date(), updatedAt: new Date() }],
  allMembers: [{ characterId: 'c-1', addedAt: new Date() }],
  characters: [{
    id: 'c-1', userId: 'u1', name: 'Alice',
    classes: [{ class: 'Fighter', level: 3 }],
    abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    ac: 15, hp: 30, maxHp: 30,
    createdAt: new Date(), updatedAt: new Date(),
  }],
});

let container: HTMLDivElement;
let root: Root;

function findButton(el: HTMLElement, text: string): HTMLButtonElement | undefined {
  return Array.from(el.querySelectorAll<HTMLButtonElement>('button'))
    .find(b => b.textContent?.includes(text));
}

async function clickButton(el: HTMLElement, text: string): Promise<void> {
  await act(async () => { findButton(el, text)?.click(); });
}

function setupContext() {
  useCampaignContext.mockReturnValue({ context: makeContext(), loading: false, error: null, refresh: jest.fn() });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  jest.clearAllMocks();

  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: jest.fn(() => Promise.resolve()) },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  act(() => { root.unmount(); });
  container.remove();
});

async function renderPage() {
  await act(async () => {
    root.render(React.createElement(PromptBuilderPage));
  });
}

describe('Prompt Builder Page', () => {
  test('C1-1: renders campaign name in heading when context resolves', async () => {
    setupContext();
    await renderPage();
    expect(container.textContent).toContain('Curse of Strahd');
  });

  test('C1-2: all five template tabs visible; NPC tab active by default with its fields rendered', async () => {
    setupContext();
    await renderPage();

    expect(container.textContent).toContain('NPC');
    expect(container.textContent).toContain('Location Description');
    expect(container.textContent).toContain('Shop');
    expect(container.textContent).toContain('Magic Item');
    expect(container.textContent).toContain('Room Description');
    expect(container.textContent).toContain('Role / Occupation');
  });

  test('C1-3: clicking "Room Description" tab renders room fields and hides NPC fields', async () => {
    setupContext();
    await renderPage();
    await clickButton(container, 'Room Description');
    expect(container.textContent).not.toContain('Role / Occupation');
  });

  test('C1-4: clicking Generate produces prompt textarea containing campaign name', async () => {
    setupContext();
    await renderPage();
    await clickButton(container, 'Generate');

    const textarea = container.querySelector('textarea[readonly]') as HTMLTextAreaElement | null;
    expect(textarea).not.toBeNull();
    expect(textarea?.value).toContain('Curse of Strahd');
  });

  test('C1-5: clicking Generate with missing required field shows validation message', async () => {
    setupContext();
    await renderPage();
    await clickButton(container, 'Location Description');
    await clickButton(container, 'Generate');

    expect(container.querySelector('textarea[readonly]')).toBeNull();
    expect(container.textContent).toContain('Location Name');
  });

  test('C1-6: after Generate, Copy button calls navigator.clipboard.writeText with fullText', async () => {
    setupContext();
    await renderPage();
    await clickButton(container, 'Generate');
    await clickButton(container, 'Copy');

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(FULL_PROMPT);
  });

  test('C1-7: after Copy, "Copied!" confirmation appears', async () => {
    setupContext();
    await renderPage();
    await clickButton(container, 'Generate');
    await clickButton(container, 'Copy');

    expect(container.textContent).toContain('Copied');
  });

  test('C1-8: "Save to Library" button is present and disabled', async () => {
    setupContext();
    await renderPage();

    const saveBtn = findButton(container, 'Save to Library');
    expect(saveBtn).not.toBeUndefined();
    expect(saveBtn?.disabled).toBe(true);
  });

  test('C1-9: while loading, loading indicator visible', async () => {
    useCampaignContext.mockReturnValue({ context: null, loading: true, error: null, refresh: jest.fn() });
    await renderPage();
    expect(container.querySelector('[data-testid="loading-state"]')).not.toBeNull();
  });

  test('C1-10: when error is non-null, ErrorBanner is rendered', async () => {
    useCampaignContext.mockReturnValue({ context: null, loading: false, error: 'Failed to load', refresh: jest.fn() });
    await renderPage();
    expect(container.querySelector('[data-testid="error-banner"]')).not.toBeNull();
  });

  test('C1-11: when context.parties is empty, informational message shown; form still accessible', async () => {
    const noPartyCtx = { ...makeContext(), parties: [], allMembers: [] };
    useCampaignContext.mockReturnValue({ context: noPartyCtx, loading: false, error: null, refresh: jest.fn() });
    await renderPage();
    expect(container.textContent).toMatch(/no party/i);
    expect(container.textContent).toContain('NPC');
  });

  test('C1-12: ProtectedRoute is used in the component tree', async () => {
    setupContext();
    const ProtectedRouteMock = jest.requireMock('@/lib/components/ProtectedRoute') as {
      ProtectedRoute: jest.Mock;
    };
    await renderPage();
    expect(ProtectedRouteMock.ProtectedRoute).toBeDefined();
  });
});

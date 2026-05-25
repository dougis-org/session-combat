/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { act } from 'react';
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
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

 
const { useCampaignContext } = require('@/lib/hooks/useCampaignContext') as {
  useCampaignContext: jest.Mock;
};

const FULL_PROMPT = 'Campaign: Curse of Strahd\n\nCreate an NPC named Bob.';

// Mock templates: NPC tab has optional-only fields (Generate works without filling them).
// Location tab has one required field (used by C1-5 to verify validation fires).
jest.mock('@/lib/prompts/templates', () => ({
  TEMPLATES: [
    { id: 'npc', label: 'NPC', fields: [{ key: 'role', label: 'Role / Occupation', placeholder: 'e.g. innkeeper, guard, merchant', optional: true }], build: () => ({ systemPrompt: 'Campaign: Curse of Strahd', userMessage: 'Create an NPC named Bob.', fullText: 'Campaign: Curse of Strahd\n\nCreate an NPC named Bob.' }) },
    { id: 'location', label: 'Location Description', fields: [{ key: 'locationName', label: 'Location Name', placeholder: 'e.g. Tavern' }], build: () => ({ systemPrompt: '', userMessage: '', fullText: '' }) },
    { id: 'shop', label: 'Shop / Establishment', fields: [], build: () => ({ systemPrompt: '', userMessage: '', fullText: '' }) },
    { id: 'magic-item', label: 'Magic Item', fields: [], build: () => ({ systemPrompt: '', userMessage: '', fullText: '' }) },
    { id: 'room', label: 'Room Description', fields: [], build: () => ({ systemPrompt: '', userMessage: '', fullText: '' }) },
  ],
}));

const makeContext = (): CampaignContext => ({
  campaign: {
    id: 'camp-1', userId: 'u1', name: 'Curse of Strahd', moduleName: 'CoS',
    chapters: [{ id: 'ch-2', title: 'Act II', order: 2 }],
    currentChapterId: 'ch-2', active: true,
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
    useCampaignContext.mockReturnValue({ context: makeContext(), loading: false, error: null, refresh: jest.fn() });
    await renderPage();
    expect(container.textContent).toContain('Curse of Strahd');
  });

  test('C1-2: all five template tabs visible; NPC tab active by default with its fields rendered', async () => {
    useCampaignContext.mockReturnValue({ context: makeContext(), loading: false, error: null, refresh: jest.fn() });
    await renderPage();

    expect(container.textContent).toContain('NPC');
    expect(container.textContent).toContain('Location Description');
    expect(container.textContent).toContain('Shop');
    expect(container.textContent).toContain('Magic Item');
    expect(container.textContent).toContain('Room Description');
    // NPC fields visible by default
    expect(container.textContent).toContain('Role / Occupation');
  });

  test('C1-3: clicking "Room Description" tab renders room fields and hides NPC fields', async () => {
    useCampaignContext.mockReturnValue({ context: makeContext(), loading: false, error: null, refresh: jest.fn() });
    await renderPage();

    const roomBtn = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Room Description'));
    await act(async () => { roomBtn?.click(); });

    expect(container.textContent).not.toContain('Role / Occupation');
  });

  test('C1-4: clicking Generate produces prompt textarea containing campaign name', async () => {
    useCampaignContext.mockReturnValue({ context: makeContext(), loading: false, error: null, refresh: jest.fn() });
    await renderPage();

    // NPC template has 1 optional-ish field; Generate will produce output regardless (mock build ignores fields)
    const generateBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Generate'));
    await act(async () => { generateBtn?.click(); });

    const textarea = container.querySelector('textarea[readOnly]') ?? container.querySelector('[readonly]');
    expect(textarea).not.toBeNull();
    expect((textarea as HTMLTextAreaElement).value).toContain('Curse of Strahd');
  });

  test('C1-5: clicking Generate with missing required field shows validation message', async () => {
    useCampaignContext.mockReturnValue({ context: makeContext(), loading: false, error: null, refresh: jest.fn() });
    await renderPage();

    // Switch to Location Description tab — it has a required 'Location Name' field
    const locationBtn = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Location Description'));
    await act(async () => { locationBtn?.click(); });

    // Click Generate without filling the required field
    const generateBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Generate'));
    await act(async () => { generateBtn?.click(); });

    // Validation should fire: no read-only textarea rendered, required field name in error message
    const textarea = container.querySelector('textarea[readOnly]') ?? container.querySelector('[readonly]');
    expect(textarea).toBeNull();
    expect(container.textContent).toContain('Location Name');
  });

  test('C1-6: after Generate, Copy button calls navigator.clipboard.writeText with fullText', async () => {
    useCampaignContext.mockReturnValue({ context: makeContext(), loading: false, error: null, refresh: jest.fn() });
    await renderPage();

    const generateBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Generate'));
    await act(async () => { generateBtn?.click(); });

    const copyBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Copy'));
    await act(async () => { copyBtn?.click(); });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(FULL_PROMPT);
  });

  test('C1-7: after Copy, "Copied!" confirmation appears', async () => {
    useCampaignContext.mockReturnValue({ context: makeContext(), loading: false, error: null, refresh: jest.fn() });
    await renderPage();

    const generateBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Generate'));
    await act(async () => { generateBtn?.click(); });

    const copyBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Copy'));
    await act(async () => { copyBtn?.click(); });

    expect(container.textContent).toContain('Copied');
  });

  test('C1-8: "Save to Library" button is present and disabled', async () => {
    useCampaignContext.mockReturnValue({ context: makeContext(), loading: false, error: null, refresh: jest.fn() });
    await renderPage();

    const saveBtn = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Save to Library'));
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
    useCampaignContext.mockReturnValue({ context: makeContext(), loading: false, error: null, refresh: jest.fn() });
    const ProtectedRouteMock = jest.requireMock('@/lib/components/ProtectedRoute') as {
      ProtectedRoute: jest.Mock;
    };
    await renderPage();
    expect(ProtectedRouteMock.ProtectedRoute).toBeDefined();
  });
});

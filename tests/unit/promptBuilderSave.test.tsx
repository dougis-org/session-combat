/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createRoot, Root } from 'react-dom/client';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'campaign-abc' }),
}));

jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

const mockContext = {
  campaign: {
    id: 'campaign-abc',
    name: 'Test Campaign',
    moduleName: 'CoS',
    chapters: [],
    active: true,
    userId: 'u1',
    currentChapterId: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  chapter: { id: 'ch1', title: 'Chapter One', order: 0 },
  parties: [],
  allMembers: [],
  characters: [],
};

jest.mock('@/lib/hooks/useCampaignContext', () => ({
  useCampaignContext: () => ({ context: mockContext, loading: false, error: null }),
}));

import PromptBuilderPage from '@/app/campaigns/[id]/prompts/page';

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

async function renderPage() {
  await act(async () => {
    root = createRoot(container);
    root.render(React.createElement(PromptBuilderPage));
  });
  await act(async () => { await new Promise(r => setTimeout(r, 0)); });
}

async function fillFirstFieldAndGenerate() {
  const inputs = container.querySelectorAll('input[type="text"]');
  const roleInput = inputs[0] as HTMLInputElement;
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    setter.call(roleInput, 'innkeeper');
    roleInput.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const inputs2 = container.querySelectorAll('input[type="text"]');
  if (inputs2.length > 1) {
    const locInput = inputs2[1] as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
      setter.call(locInput, 'Barovia');
      locInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  const generateBtn = Array.from(container.querySelectorAll('button'))
    .find(b => b.textContent?.includes('Generate Prompt'));
  await act(async () => { (generateBtn as HTMLButtonElement).click(); });
  await act(async () => { await new Promise(r => setTimeout(r, 0)); });
}

function findSaveToLibraryButton() {
  return Array.from(container.querySelectorAll('button'))
    .find(b => b.textContent?.includes('Save to Library')) as HTMLButtonElement;
}

async function openSavePanel() {
  await renderPage();
  await fillFirstFieldAndGenerate();
  await act(async () => { findSaveToLibraryButton().click(); });
}

async function submitPanelSave() {
  const panelSaveBtn = Array.from(container.querySelectorAll('button'))
    .find(b => b.textContent?.trim() === 'Save') as HTMLButtonElement;
  await act(async () => { panelSaveBtn.click(); });
  await act(async () => { await new Promise(r => setTimeout(r, 50)); });
}

describe('Prompt Builder — Save to Library', () => {
  it('"Save to Library" button is disabled before generate', async () => {
    await renderPage();
    const saveBtn = findSaveToLibraryButton();
    expect(saveBtn).toBeTruthy();
    expect(saveBtn.disabled).toBe(true);
  });

  it('after generate, clicking "Save to Library" opens save panel with pre-filled title', async () => {
    await renderPage();
    await fillFirstFieldAndGenerate();

    expect(findSaveToLibraryButton().disabled).toBe(false);
    await act(async () => { findSaveToLibraryButton().click(); });

    const titleInput = container.querySelector('#save-title') as HTMLInputElement;
    expect(titleInput).toBeTruthy();
    expect(titleInput.value).toBe('innkeeper');
  });

  it('editing title then saving calls POST with the edited title', async () => {
    let capturedBody: unknown;
    global.fetch = jest.fn(async (_input: unknown, init?: unknown) => {
      capturedBody = JSON.parse((init as RequestInit).body as string);
      return { ok: true, json: async () => ({ id: 'new-id', ...(capturedBody as Record<string, unknown>) }) } as unknown as Response;
    }) as typeof fetch;

    await openSavePanel();

    const titleInput = container.querySelector('#save-title') as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
      setter.call(titleInput, 'Custom Title');
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await submitPanelSave();
    expect((capturedBody as { title: string }).title).toBe('Custom Title');
  });

  it('successful save shows confirmation with library link', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ id: 'saved-id' }),
    }) as unknown as Response) as typeof fetch;

    await openSavePanel();
    await submitPanelSave();

    expect(container.textContent).toContain('Saved to library');
    expect(container.querySelector('a[href*="/library"]')).toBeTruthy();
  });

  it('API failure shows error banner and panel stays open', async () => {
    global.fetch = jest.fn(async () => ({ ok: false }) as unknown as Response) as typeof fetch;

    await openSavePanel();
    await submitPanelSave();

    expect(container.textContent).toContain('Failed to save');
    const cancelBtn = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.trim() === 'Cancel');
    expect(cancelBtn).toBeTruthy();
  });

  it('Cancel closes panel without API call', async () => {
    const fetchSpy = jest.fn(async () => ({
      ok: true,
      json: async () => ({ id: 'x' }),
    }) as unknown as Response);
    global.fetch = fetchSpy as unknown as typeof fetch;

    await openSavePanel();
    expect(container.querySelector('#save-title')).toBeTruthy();

    const cancelBtn = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.trim() === 'Cancel') as HTMLButtonElement;
    await act(async () => { cancelBtn.click(); });

    expect(container.querySelector('#save-title')).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

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
  campaign: { id: 'campaign-abc', name: 'Test Campaign', moduleName: 'CoS', chapters: [], active: true, userId: 'u1', currentChapterId: undefined, createdAt: new Date(), updatedAt: new Date() },
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
  // Fill in the first required field (NPC template's 'role' field)
  const inputs = container.querySelectorAll('input[type="text"]');
  const roleInput = inputs[0] as HTMLInputElement;
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    setter.call(roleInput, 'innkeeper');
    roleInput.dispatchEvent(new Event('input', { bubbles: true }));
  });

  // Fill location field
  const inputs2 = container.querySelectorAll('input[type="text"]');
  if (inputs2.length > 1) {
    const locInput = inputs2[1] as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
      setter.call(locInput, 'Barovia');
      locInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  // Click Generate
  const generateBtn = Array.from(container.querySelectorAll('button'))
    .find(b => b.textContent?.includes('Generate Prompt'));
  await act(async () => { (generateBtn as HTMLButtonElement).click(); });
  await act(async () => { await new Promise(r => setTimeout(r, 0)); });
}

describe('Prompt Builder — Save to Library', () => {
  it('"Save to Library" button is disabled before generate', async () => {
    await renderPage();
    const saveBtn = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Save to Library'));
    expect(saveBtn).toBeTruthy();
    expect((saveBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('after generate, clicking "Save to Library" opens save panel with pre-filled title', async () => {
    await renderPage();
    await fillFirstFieldAndGenerate();

    const saveBtn = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Save to Library'));
    expect((saveBtn as HTMLButtonElement).disabled).toBe(false);

    await act(async () => { (saveBtn as HTMLButtonElement).click(); });

    // Save panel should appear with title pre-filled
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

    await renderPage();
    await fillFirstFieldAndGenerate();

    const saveBtn = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Save to Library'));
    await act(async () => { (saveBtn as HTMLButtonElement).click(); });

    // Edit title
    const titleInput = container.querySelector('#save-title') as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
      setter.call(titleInput, 'Custom Title');
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Click Save
    const panelSaveBtn = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.trim() === 'Save');
    await act(async () => { (panelSaveBtn as HTMLButtonElement).click(); });
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    expect((capturedBody as { title: string }).title).toBe('Custom Title');
  });

  it('successful save shows confirmation with library link', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ id: 'saved-id' }),
    }) as unknown as Response) as typeof fetch;

    await renderPage();
    await fillFirstFieldAndGenerate();

    const saveBtn = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Save to Library'));
    await act(async () => { (saveBtn as HTMLButtonElement).click(); });

    const panelSaveBtn = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.trim() === 'Save');
    await act(async () => { (panelSaveBtn as HTMLButtonElement).click(); });
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    expect(container.textContent).toContain('Saved to library');
    const libraryLink = container.querySelector('a[href*="/library"]');
    expect(libraryLink).toBeTruthy();
  });

  it('API failure shows error banner and panel stays open', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
    }) as unknown as Response) as typeof fetch;

    await renderPage();
    await fillFirstFieldAndGenerate();

    const saveBtn = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Save to Library'));
    await act(async () => { (saveBtn as HTMLButtonElement).click(); });

    const panelSaveBtn = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.trim() === 'Save');
    await act(async () => { (panelSaveBtn as HTMLButtonElement).click(); });
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    expect(container.textContent).toContain('Failed to save');
    // Panel is still open (Cancel button visible)
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

    await renderPage();
    await fillFirstFieldAndGenerate();

    const saveBtn = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Save to Library'));
    await act(async () => { (saveBtn as HTMLButtonElement).click(); });

    // Panel should be visible
    expect(container.querySelector('#save-title')).toBeTruthy();

    // Click Cancel
    const cancelBtn = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent?.trim() === 'Cancel');
    await act(async () => { (cancelBtn as HTMLButtonElement).click(); });

    // Panel gone
    expect(container.querySelector('#save-title')).toBeNull();
    // No API call to /api/content
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

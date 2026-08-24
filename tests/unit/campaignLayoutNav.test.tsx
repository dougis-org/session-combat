import React from 'react';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';

let mockPathname = '/campaigns/campaign-123';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'campaign-123' }),
  usePathname: () => mockPathname,
}));

jest.mock('@/lib/components/CampaignChat', () => ({
  CampaignChat: () => null,
}));

jest.mock('@/lib/components/SessionControl', () => ({
  SessionControl: () => null,
}));

// Import after mocks
import CampaignLayout from '@/app/campaigns/[id]/layout';

let container: HTMLDivElement;
let root: Root;
let originalFetch: typeof global.fetch;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  originalFetch = global.fetch;
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ activeSessionId: null, name: 'Test Campaign' }),
  }) as unknown as Response) as typeof fetch;
});

afterEach(() => {
  act(() => { root?.unmount(); });
  container.remove();
  global.fetch = originalFetch;
});

async function render() {
  await act(async () => {
    root = createRoot(container);
    root.render(React.createElement(CampaignLayout, null, React.createElement('div', null, 'child')));
  });
  await act(async () => { await new Promise(r => setTimeout(r, 0)); });
}

describe('CampaignLayout nav', () => {
  it('renders Encounters and Combat tabs alongside the existing four tabs', async () => {
    mockPathname = '/campaigns/campaign-123';
    await render();

    const links = Array.from(container.querySelectorAll('a'));
    const byLabel = (label: string) => links.find(a => a.textContent?.trim() === label);

    expect(byLabel('Members')).toBeTruthy();
    expect(byLabel('Sessions')).toBeTruthy();
    expect(byLabel('Prompts')).toBeTruthy();
    expect(byLabel('Library')).toBeTruthy();

    const encountersLink = byLabel('Encounters');
    const combatLink = byLabel('Combat');
    expect(encountersLink).toBeTruthy();
    expect(encountersLink?.getAttribute('href')).toBe('/campaigns/campaign-123/encounters');
    expect(combatLink).toBeTruthy();
    expect(combatLink?.getAttribute('href')).toBe('/campaigns/campaign-123/combat');
  });

  it('marks the Encounters tab active when on /campaigns/[id]/encounters', async () => {
    mockPathname = '/campaigns/campaign-123/encounters';
    await render();

    const links = Array.from(container.querySelectorAll('a'));
    const encountersLink = links.find(a => a.textContent?.trim() === 'Encounters');
    const membersLink = links.find(a => a.textContent?.trim() === 'Members');

    expect(encountersLink?.getAttribute('aria-current')).toBe('page');
    expect(membersLink?.getAttribute('aria-current')).toBeFalsy();
  });
});

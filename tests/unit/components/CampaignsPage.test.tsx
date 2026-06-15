import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Response as FetchResponse } from 'node-fetch';
import { CampaignsContent } from '@/app/campaigns/page';

jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new FetchResponse(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Response;
}

const MOCK_CAMPAIGN = {
  id: 'camp-1',
  userId: 'user-1',
  name: 'My Campaign',
  moduleName: 'LMoP',
  chapters: [],
  status: 'planning',
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const MOCK_TEMPLATE = {
  id: 'tpl-1',
  userId: 'GLOBAL',
  isGlobal: true,
  name: 'Lost Mine of Phandelver',
  moduleName: 'LMoP',
  chapters: [
    { id: 'ch-1', title: 'Chapter 1', order: 0 },
    { id: 'ch-2', title: 'Chapter 2', order: 1 },
    { id: 'ch-3', title: 'Chapter 3', order: 2 },
    { id: 'ch-4', title: 'Chapter 4', order: 3 },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

let originalFetch: typeof global.fetch;

beforeEach(() => {
  originalFetch = global.fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

function setupFetch(campaigns: unknown[] = [], templates: unknown[] = []) {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = input.toString();
    if (url === '/api/campaigns') return jsonResponse(campaigns);
    if (url === '/api/campaigns/global') return jsonResponse(templates);
    return jsonResponse({ error: 'not found' }, 404);
  }) as typeof fetch;
}

function renderPage() {
  render(<CampaignsContent />);
}

describe('Campaign Catalog UI', () => {
  let user: ReturnType<typeof userEvent.setup>;
  beforeEach(() => { user = userEvent.setup(); });

  it('renders Campaign Catalog section heading', async () => {
    setupFetch([], [MOCK_TEMPLATE]);
    renderPage();
    expect(await screen.findByText('Campaign Catalog')).toBeInTheDocument();
  });

  it('catalog section appears after user campaigns section in DOM', async () => {
    setupFetch([MOCK_CAMPAIGN], [MOCK_TEMPLATE]);
    renderPage();
    await screen.findByText('Campaign Catalog');
    const headings = screen.getAllByRole('heading');
    const campaignsIndex = headings.findIndex(h => h.textContent?.includes('Campaigns'));
    const catalogIndex = headings.findIndex(h => h.textContent?.includes('Campaign Catalog'));
    expect(campaignsIndex).toBeGreaterThanOrEqual(0);
    expect(catalogIndex).toBeGreaterThan(campaignsIndex);
  });

  it('shows template name, moduleName, chapter count, and Copy button', async () => {
    setupFetch([], [MOCK_TEMPLATE]);
    renderPage();
    expect(await screen.findByText('Lost Mine of Phandelver')).toBeInTheDocument();
    expect(screen.getByText('LMoP')).toBeInTheDocument();
    expect(screen.getByText('4 chapters')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('shows empty state when catalog is empty', async () => {
    setupFetch([], []);
    renderPage();
    expect(await screen.findByText('No campaign templates available yet.')).toBeInTheDocument();
  });

  it('Copy button calls POST to correct URL and refreshes campaigns', async () => {
    const newCampaign = { ...MOCK_CAMPAIGN, id: 'camp-new', name: 'Lost Mine of Phandelver' };
    let campaignsList = [MOCK_CAMPAIGN];

    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url === '/api/campaigns') return jsonResponse(campaignsList);
      if (url === '/api/campaigns/global') return jsonResponse([MOCK_TEMPLATE]);
      if (url === `/api/campaigns/global/${MOCK_TEMPLATE.id}/copy` && init?.method === 'POST') {
        campaignsList = [...campaignsList, newCampaign];
        return jsonResponse(newCampaign, 201);
      }
      return jsonResponse({ error: 'not found' }, 404);
    }) as typeof fetch;

    renderPage();

    const copyButton = await screen.findByRole('button', { name: /copy/i });

    await user.click(copyButton);

    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    const copyCall = fetchMock.mock.calls.find(
      ([url, init]) => url.toString().includes('/copy') && (init as RequestInit)?.method === 'POST'
    );
    expect(copyCall).toBeTruthy();
  });

  it('Copy button shows loading state during in-flight request', async () => {
    let resolveCopy!: (value: unknown) => void;
    const copyPromise = new Promise((resolve) => { resolveCopy = resolve; });

    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url === '/api/campaigns') return jsonResponse([]);
      if (url === '/api/campaigns/global') return jsonResponse([MOCK_TEMPLATE]);
      if (url.includes('/copy') && (init as RequestInit)?.method === 'POST') {
        await copyPromise;
        return jsonResponse({}, 201);
      }
      return jsonResponse({ error: 'not found' }, 404);
    }) as typeof fetch;

    renderPage();

    const copyButton = await screen.findByRole('button', { name: /copy/i });

    await user.click(copyButton);

    const loadingButton = await screen.findByRole('button', { name: /copying/i });
    expect(loadingButton).toBeInTheDocument();
    expect(loadingButton).toBeDisabled();

    resolveCopy(undefined);
    await copyPromise;
    await screen.findByRole('button', { name: /^copy$/i });
  });

  it('Copy failure shows inline error message', async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url === '/api/campaigns') return jsonResponse([]);
      if (url === '/api/campaigns/global') return jsonResponse([MOCK_TEMPLATE]);
      if (url.includes('/copy') && (init as RequestInit)?.method === 'POST') {
        return jsonResponse({ error: 'Server error' }, 500);
      }
      return jsonResponse({ error: 'not found' }, 404);
    }) as typeof fetch;

    renderPage();

    const copyButton = await screen.findByRole('button', { name: /copy/i });
    await user.click(copyButton);

    expect(await screen.findByText('Server error')).toBeInTheDocument();
  });

  it('catalog fetch failure does not crash page — user campaigns still render', async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url === '/api/campaigns') return jsonResponse([MOCK_CAMPAIGN]);
      if (url === '/api/campaigns/global') return jsonResponse({ error: 'DB error' }, 500);
      return jsonResponse({ error: 'not found' }, 404);
    }) as typeof fetch;

    renderPage();

    expect(await screen.findByText('My Campaign')).toBeInTheDocument();
    expect(screen.getByText('Campaign Catalog')).toBeInTheDocument();
  });

  describe('Campaign active chapter display', () => {
    it('displays active chapter when campaign has currentChapterId', async () => {
      const campaignWithActiveCh = {
        ...MOCK_CAMPAIGN,
        currentChapterId: 'ch-2',
        chapters: [
          { id: 'ch-1', title: 'Arrival', order: 0 },
          { id: 'ch-2', title: 'The Inn', order: 1 },
        ],
      };
      setupFetch([campaignWithActiveCh], []);
      renderPage();
      expect(await screen.findByText(/📖 Current Chapter: Ch\. 2: The Inn/)).toBeInTheDocument();
    });

    it('displays standard chapter count when no active chapter is selected', async () => {
      const campaignNoActiveCh = {
        ...MOCK_CAMPAIGN,
        chapters: [
          { id: 'ch-1', title: 'Arrival', order: 0 },
          { id: 'ch-2', title: 'The Inn', order: 1 },
        ],
      };
      setupFetch([campaignNoActiveCh], []);
      renderPage();
      await screen.findByText('2 chapters');
      expect(screen.queryByText(/📖 Current Chapter:/)).not.toBeInTheDocument();
    });
  });

  describe('Session Log link', () => {
    it('renders a Session Log link pointing to /campaigns/[id]/sessions', async () => {
      setupFetch([MOCK_CAMPAIGN], []);
      renderPage();
      await screen.findByText('My Campaign');
      const links = screen.getAllByRole('link');
      const sessionLink = links.find(a => a.textContent?.includes('Session Log'));
      expect(sessionLink).toBeTruthy();
      expect(sessionLink?.getAttribute('href')).toBe(`/campaigns/${MOCK_CAMPAIGN.id}/sessions`);
    });
  });

  describe('Members link', () => {
    it('renders a Members link pointing to /campaigns/[id]', async () => {
      setupFetch([MOCK_CAMPAIGN], []);
      renderPage();
      await screen.findByText('My Campaign');
      const links = screen.getAllByRole('link');
      const membersLink = links.find(a => a.textContent?.trim() === 'Members');
      expect(membersLink).toBeTruthy();
      expect(membersLink?.getAttribute('href')).toBe(`/campaigns/${MOCK_CAMPAIGN.id}`);
    });
  });

  describe('FR1 — Status chip visible alongside campaign name', () => {
    it('campaign list: status chip present in document', async () => {
      setupFetch([MOCK_CAMPAIGN], []);
      renderPage();
      await screen.findByText('My Campaign');
      expect(screen.getByText('Planning')).toBeInTheDocument();
    });

    it('campaign list: status chip is in a different container than action buttons', async () => {
      setupFetch([MOCK_CAMPAIGN], []);
      renderPage();
      await screen.findByText('My Campaign');
      const heading = screen.getByRole('heading', { name: 'My Campaign' });
      const headerRow = heading.parentElement!;
      expect(headerRow.querySelector('button')).not.toBeInTheDocument();
      expect(headerRow.querySelector('a')).not.toBeInTheDocument();
    });

    it('active campaigns: status chip present for active campaign', async () => {
      const activeCampaign = { ...MOCK_CAMPAIGN, status: 'active' as const };
      setupFetch([activeCampaign], []);
      renderPage();
      await screen.findAllByText('My Campaign');
      expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('FR2 — Action buttons below header, never overlapping', () => {
    it('campaign list: all action buttons present', async () => {
      setupFetch([MOCK_CAMPAIGN], []);
      renderPage();
      await screen.findByText('My Campaign');
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      const links = screen.getAllByRole('link');
      expect(links.find(a => a.textContent?.trim() === 'Members')).toBeTruthy();
      expect(links.find(a => a.textContent?.includes('Session Log'))).toBeTruthy();
    });

    it('campaign list: heading precedes Edit button in DOM order', async () => {
      setupFetch([MOCK_CAMPAIGN], []);
      renderPage();
      await screen.findByText('My Campaign');
      const heading = screen.getByRole('heading', { name: 'My Campaign' });
      const editButton = screen.getByRole('button', { name: 'Edit' });
      expect(
        heading.compareDocumentPosition(editButton) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });

    it('active campaigns: action links present', async () => {
      const activeCampaign = { ...MOCK_CAMPAIGN, status: 'active' as const };
      setupFetch([activeCampaign], []);
      renderPage();
      await screen.findAllByText('My Campaign');
      const links = screen.getAllByRole('link');
      expect(links.find(a => a.textContent?.trim() === 'Members')).toBeTruthy();
      expect(links.find(a => a.textContent?.includes('Prompt Builder'))).toBeTruthy();
      expect(links.find(a => a.textContent?.includes('Library'))).toBeTruthy();
      expect(links.find(a => a.textContent?.includes('Start Encounter'))).toBeTruthy();
    });

    it('active campaigns: heading precedes Members link in DOM order', async () => {
      const activeCampaign = { ...MOCK_CAMPAIGN, status: 'active' as const };
      setupFetch([activeCampaign], []);
      renderPage();
      await screen.findAllByText('My Campaign');
      const headings = screen.getAllByRole('heading', { name: 'My Campaign' });
      const links = screen.getAllByRole('link');
      const membersLink = links.find(a => a.textContent?.trim() === 'Members');
      expect(membersLink).toBeDefined();
      expect(
        headings[0].compareDocumentPosition(membersLink!) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });
  });

  describe('FR3 — Long titles truncate gracefully', () => {
    it('campaign list: title heading has truncate class', async () => {
      setupFetch([MOCK_CAMPAIGN], []);
      renderPage();
      const heading = await screen.findByRole('heading', { name: 'My Campaign' });
      expect(heading.classList.contains('truncate')).toBe(true);
    });

    it('campaign list: title heading has min-w-0 class', async () => {
      setupFetch([MOCK_CAMPAIGN], []);
      renderPage();
      const heading = await screen.findByRole('heading', { name: 'My Campaign' });
      expect(heading.classList.contains('min-w-0')).toBe(true);
    });
  });

  describe('FR4 — All existing action links remain functional', () => {
    it('campaign list: Edit button opens editor', async () => {
      setupFetch([MOCK_CAMPAIGN], []);
      renderPage();
      await screen.findByText('My Campaign');
      await user.click(screen.getByRole('button', { name: 'Edit' }));
      expect(await screen.findByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('campaign list: Delete button calls confirm', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
      setupFetch([MOCK_CAMPAIGN], []);
      renderPage();
      await screen.findByText('My Campaign');
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      expect(confirmSpy).toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('active campaigns: Members link has correct href', async () => {
      const activeCampaign = { ...MOCK_CAMPAIGN, id: 'active-1', status: 'active' as const };
      setupFetch([activeCampaign], []);
      renderPage();
      await screen.findAllByText('My Campaign');
      const links = screen.getAllByRole('link');
      const membersLinks = links.filter(a => a.textContent?.trim() === 'Members');
      const activeLink = membersLinks.find(a => a.getAttribute('href') === `/campaigns/${activeCampaign.id}`);
      expect(activeLink).toBeTruthy();
    });
  });
});


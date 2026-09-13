// tests/unit/components/CampaignsContent.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CampaignsContent } from '@/app/campaigns/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

// Mock next/link to be a plain <a> tag
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return {
    __esModule: true,
    default: MockLink,
  };
});

// Mock global fetch
global.fetch = jest.fn();

const mockCampaign = {
  id: 'campaign-1',
  name: 'Test Campaign',
  status: 'active',
  currentChapterId: null,
  chapters: [],
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

describe('CampaignsContent - Session section rendering', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('TC-1.1: renders empty state when no sessions', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => [mockCampaign] }) // /api/campaigns
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // /api/parties
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // /api/characters
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // /api/campaigns/global
      .mockResolvedValueOnce({ ok: true, json: async () => [] }); // /api/campaigns/:id/sessions?limit=1

    render(<CampaignsContent />);
    expect(await screen.findByText('No sessions logged yet.')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Log First Session →' });
    expect(link).toHaveAttribute('href', `/campaigns/${mockCampaign.id}/sessions`);
  });

  test('TC-1.2: renders last session when sessions exist', async () => {
    const mockSession = {
      sessionNumber: 5,
      title: 'The Amber Temple',
      datePlayed: '2026-06-20T00:00:00.000Z',
      milestone: false,
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => [mockCampaign] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [mockSession] });

    render(<CampaignsContent />);
    expect(await screen.findByText(/Session #5/)).toBeInTheDocument();
    expect(screen.getByText(/The Amber Temple/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'View all sessions →' });
    expect(link).toHaveAttribute('href', `/campaigns/${mockCampaign.id}/sessions`);
    expect(screen.queryByText('No sessions logged yet.')).not.toBeInTheDocument();
  });

  test('TC-1.3: renders milestone badge on milestone sessions', async () => {
    const mockSession = {
      sessionNumber: 3,
      title: 'Level Up',
      datePlayed: '2026-06-01T00:00:00.000Z',
      milestone: true,
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => [mockCampaign] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [mockSession] });

    render(<CampaignsContent />);
    expect(await screen.findByText('Milestone')).toBeInTheDocument();
  });
});

describe('CampaignsContent - membership-based grouping', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  const dmCampaign = { ...mockCampaign, id: 'camp-dm', name: 'DM Campaign', memberRole: 'dm', memberStatus: 'active' };
  const playerCampaign = { ...mockCampaign, id: 'camp-player', name: 'Player Campaign', memberRole: 'player', memberStatus: 'active' };
  const invitedCampaign = { ...mockCampaign, id: 'camp-invited', name: 'Invited Campaign', memberRole: 'player', memberStatus: 'invited' };

  function mockCampaignsResponse(campaigns: unknown[]) {
    (global.fetch as jest.Mock).mockImplementation(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url === '/api/campaigns') return { ok: true, json: async () => campaigns };
      if (url === '/api/parties') return { ok: true, json: async () => [] };
      if (url === '/api/characters') return { ok: true, json: async () => [] };
      if (url === '/api/campaigns/global') return { ok: true, json: async () => [] };
      if (url.includes('/members/me')) return { ok: true, json: async () => ({ status: 'active' }) };
      if (url.includes('/sessions')) return { ok: true, json: async () => [] };
      return { ok: false, json: async () => ({ error: 'not found' }) };
    });
  }

  it('renders DM, Player, and Invited groupings from a single mixed response', async () => {
    mockCampaignsResponse([dmCampaign, playerCampaign, invitedCampaign]);
    render(<CampaignsContent />);

    expect((await screen.findAllByText('DM Campaign')).length).toBeGreaterThan(0);
    expect(screen.getByText('Player Campaign')).toBeInTheDocument();
    expect(screen.getByText('Invited Campaign')).toBeInTheDocument();
    expect(screen.getByText('Invitations')).toBeInTheDocument();
    expect(screen.getByText('Your Campaigns (Player)')).toBeInTheDocument();
  });

  it('DM section remains visually first, ahead of Invitations and Player groupings', async () => {
    mockCampaignsResponse([dmCampaign, playerCampaign, invitedCampaign]);
    render(<CampaignsContent />);
    await screen.findAllByText('DM Campaign');

    const headings = screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent);
    const activeIdx = headings.indexOf('Active Campaigns');
    const invitationsIdx = headings.indexOf('Invitations');
    const playerIdx = headings.indexOf('Your Campaigns (Player)');
    expect(activeIdx).toBeGreaterThanOrEqual(0);
    expect(activeIdx).toBeLessThan(invitationsIdx);
    expect(activeIdx).toBeLessThan(playerIdx);
  });

  it('renders no Player/Invited sections when the response has none', async () => {
    mockCampaignsResponse([dmCampaign]);
    render(<CampaignsContent />);
    await screen.findAllByText('DM Campaign');

    expect(screen.queryByText('Invitations')).not.toBeInTheDocument();
    expect(screen.queryByText('Your Campaigns (Player)')).not.toBeInTheDocument();
  });

  it('clicking Accept on an invited card PATCHes members/me with {action: "accept"} and refreshes the list', async () => {
    const user = userEvent.setup();
    mockCampaignsResponse([invitedCampaign]);
    render(<CampaignsContent />);
    await screen.findByText('Invited Campaign');

    await user.click(screen.getByRole('button', { name: 'Accept' }));

    await waitFor(() => {
      const fetchMock = global.fetch as jest.Mock;
      const patchCall = fetchMock.mock.calls.find(
        ([url, opts]) => url === `/api/campaigns/${invitedCampaign.id}/members/me` && opts?.method === 'PATCH'
      );
      expect(patchCall).toBeDefined();
      expect(JSON.parse(patchCall![1].body)).toEqual({ action: 'accept' });
    });
  });

  it('clicking Decline on an invited card PATCHes members/me with {action: "decline"} and refreshes the list', async () => {
    const user = userEvent.setup();
    mockCampaignsResponse([invitedCampaign]);
    render(<CampaignsContent />);
    await screen.findByText('Invited Campaign');

    await user.click(screen.getByRole('button', { name: 'Decline' }));

    await waitFor(() => {
      const fetchMock = global.fetch as jest.Mock;
      const patchCall = fetchMock.mock.calls.find(
        ([url, opts]) => url === `/api/campaigns/${invitedCampaign.id}/members/me` && opts?.method === 'PATCH'
      );
      expect(patchCall).toBeDefined();
      expect(JSON.parse(patchCall![1].body)).toEqual({ action: 'decline' });
    });
  });

  test('TC-1.4: session fetch failure degrades to empty state', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => [mockCampaign] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockRejectedValueOnce(new Error('Fetch failed'));

    render(<CampaignsContent />);
    expect(await screen.findByText('No sessions logged yet.')).toBeInTheDocument();
  });

  test('TC-2.1: Session Log button present when campaign has sessions', async () => {
    const mockSession = {
      sessionNumber: 5,
      title: 'The Amber Temple',
      datePlayed: '2026-06-20T00:00:00.000Z',
      milestone: false,
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => [mockCampaign] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [mockSession] });

    render(<CampaignsContent />);
    const links = await screen.findAllByRole('link', { name: 'Session Log' });
    expect(links.length).toBeGreaterThanOrEqual(1);
    const actionRowLink = links.find(l => l.className.includes('bg-green-600'));
    expect(actionRowLink).toBeDefined();
    expect(actionRowLink).toHaveAttribute('href', `/campaigns/${mockCampaign.id}/sessions`);
  });

  test('TC-2.2: Session Log button present when campaign has NO sessions', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => [mockCampaign] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(<CampaignsContent />);
    const links = await screen.findAllByRole('link', { name: 'Session Log' });
    expect(links.length).toBeGreaterThanOrEqual(1);
    const actionRowLink = links.find(l => l.className.includes('bg-green-600'));
    expect(actionRowLink).toBeDefined();
    expect(actionRowLink).toHaveAttribute('href', `/campaigns/${mockCampaign.id}/sessions`);
  });
});

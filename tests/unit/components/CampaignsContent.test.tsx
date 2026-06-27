// tests/unit/components/CampaignsContent.test.tsx
import { render, screen } from '@testing-library/react';
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

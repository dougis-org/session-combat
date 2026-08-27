import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActiveCampaignBanner } from '@/lib/components/ActiveCampaignBanner';

// Mock Next.js Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, onClick }: any) =>
    React.createElement('a', { href, onClick }, children),
}));

// Mock Modal since we need it for multiple campaigns
jest.mock('@/lib/components/Modal', () => ({
  Modal: ({ isOpen, onClose, title, children }: any) =>
    isOpen ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        <button onClick={onClose}>Close modal</button>
        {children}
      </div>
    ) : null,
}));

describe('ActiveCampaignBanner', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    sessionStorage.clear();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders nothing if no campaigns are returned', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ campaigns: [] }),
    });

    render(<ActiveCampaignBanner />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/campaigns');
    });

    expect(screen.queryByText(/in-progress/i)).not.toBeInTheDocument();
  });

  it('renders a banner linking to the combat page if exactly one active campaign is returned', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        campaigns: [
          { id: 'camp1', name: 'Campaign 1', status: 'active' },
          { id: 'camp2', name: 'Campaign 2', status: 'archived' }
        ],
      }),
    });

    render(<ActiveCampaignBanner />);

    await waitFor(() => {
      expect(screen.getByText('Campaign 1')).toBeInTheDocument();
      expect(screen.getByText(/is in-progress/i)).toBeInTheDocument();
    });

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/campaigns/camp1/combat');
  });

  it('opens a modal with links if multiple active campaigns are returned', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        campaigns: [
          { id: 'camp1', name: 'Campaign 1', status: 'active' },
          { id: 'camp2', name: 'Campaign 2', status: 'active' }
        ],
      }),
    });

    render(<ActiveCampaignBanner />);

    await waitFor(() => {
      expect(screen.getByText(/You have 2 in-progress campaigns/i)).toBeInTheDocument();
    });

    // Click the banner to open the modal
    const button = screen.getByRole('button', { name: /View campaigns/i });
    await userEvent.click(button);

    const link1 = screen.getByRole('link', { name: /Campaign 1/i });
    expect(link1).toHaveAttribute('href', '/campaigns/camp1/combat');
    const link2 = screen.getByRole('link', { name: /Campaign 2/i });
    expect(link2).toHaveAttribute('href', '/campaigns/camp2/combat');
  });

  it('hides the banner and sets sessionStorage when dismiss is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        campaigns: [{ id: 'camp1', name: 'Campaign 1', status: 'active' }],
      }),
    });

    render(<ActiveCampaignBanner />);

    await waitFor(() => {
      expect(screen.getByText('Campaign 1')).toBeInTheDocument();
      expect(screen.getByText(/is in-progress/i)).toBeInTheDocument();
    });

    const dismissButton = screen.getByRole('button', { name: /Dismiss/i });
    await userEvent.click(dismissButton);

    expect(screen.queryByText('Campaign 1')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('dismissed-campaign-banner')).toBe('true');
  });

  it('does not fetch and renders nothing if already dismissed in sessionStorage', async () => {
    sessionStorage.setItem('dismissed-campaign-banner', 'true');

    render(<ActiveCampaignBanner />);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.queryByText(/in-progress/i)).not.toBeInTheDocument();
  });

  it('handles fetch failures gracefully without crashing', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ActiveCampaignBanner />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    expect(screen.queryByText(/in-progress/i)).not.toBeInTheDocument();
  });
});

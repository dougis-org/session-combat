// tests/unit/components/CampaignLayout.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CampaignLayout from '@/app/campaigns/[id]/layout';

// Dynamic mock for next/navigation
let mockPathname = '/campaigns/test-id';
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-id' }),
  usePathname: () => mockPathname,
}));

// Mock CampaignChat to isolate layout and avoid extra fetch calls
jest.mock('@/lib/components/CampaignChat', () => ({
  CampaignChat: () => <div data-testid="campaign-chat" />
}));

describe('CampaignLayout', () => {
  beforeEach(() => {
    mockPathname = '/campaigns/test-id';
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ name: 'Test Campaign', activeSessionId: 'session-123' }),
      } as Response)
    ) as jest.Mock;
  });

  test('TC-3.1: All four tabs render', async () => {
    render(
      <CampaignLayout>
        <div>Children content</div>
      </CampaignLayout>
    );

    await waitFor(() => screen.getByRole('heading'));
    expect(screen.getByRole('link', { name: 'Members' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sessions' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prompts' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Library' })).toBeInTheDocument();
  });

  test('TC-3.2: Members tab active on exact Members path', async () => {
    mockPathname = '/campaigns/test-id';
    render(
      <CampaignLayout>
        <div>Children content</div>
      </CampaignLayout>
    );

    await waitFor(() => screen.getByRole('heading'));
    const tab = screen.getByRole('link', { name: 'Members' });
    expect(tab).toHaveClass('border-b-2');
    expect(screen.getByRole('link', { name: 'Sessions' })).not.toHaveClass('border-b-2');
  });

  test('TC-3.3: Sessions tab active on Sessions path', async () => {
    mockPathname = '/campaigns/test-id/sessions';
    render(
      <CampaignLayout>
        <div>Children content</div>
      </CampaignLayout>
    );

    await waitFor(() => screen.getByRole('heading'));
    const tab = screen.getByRole('link', { name: 'Sessions' });
    expect(tab).toHaveClass('border-b-2');
    expect(screen.getByRole('link', { name: 'Members' })).not.toHaveClass('border-b-2');
  });

  test('TC-3.4: Prompts tab active on Prompts path', async () => {
    mockPathname = '/campaigns/test-id/prompts';
    render(
      <CampaignLayout>
        <div>Children content</div>
      </CampaignLayout>
    );

    await waitFor(() => screen.getByRole('heading'));
    const tab = screen.getByRole('link', { name: 'Prompts' });
    expect(tab).toHaveClass('border-b-2');
    expect(screen.getByRole('link', { name: 'Members' })).not.toHaveClass('border-b-2');
  });

  test('TC-3.5: Library tab active on Library path', async () => {
    mockPathname = '/campaigns/test-id/library';
    render(
      <CampaignLayout>
        <div>Children content</div>
      </CampaignLayout>
    );

    await waitFor(() => screen.getByRole('heading'));
    const tab = screen.getByRole('link', { name: 'Library' });
    expect(tab).toHaveClass('border-b-2');
    expect(screen.getByRole('link', { name: 'Members' })).not.toHaveClass('border-b-2');
  });

  test('TC-3.6: Sessions tab active on nested sessions sub-route', async () => {
    mockPathname = '/campaigns/test-id/sessions/some-session-id';
    render(
      <CampaignLayout>
        <div>Children content</div>
      </CampaignLayout>
    );

    await waitFor(() => screen.getByRole('heading'));
    const tab = screen.getByRole('link', { name: 'Sessions' });
    expect(tab).toHaveClass('border-b-2');
  });

  test('TC-3.7: Campaign name visible in header when fetch succeeds', async () => {
    render(
      <CampaignLayout>
        <div>Children content</div>
      </CampaignLayout>
    );

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Campaign'));
  });

  test('TC-3.8: Tab bar renders when fetch fails (graceful degradation)', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('API failed'))) as jest.Mock;

    render(
      <CampaignLayout>
        <div>Children content</div>
      </CampaignLayout>
    );

    // Wait a bit to ensure it finished trying to fetch
    await waitFor(() => expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Members' })).toBeInTheDocument();
    expect(screen.getByText('Children content')).toBeInTheDocument();
  });

  test('TC-3.9: Children render below tab bar', async () => {
    render(
      <CampaignLayout>
        <div data-testid="child-content">Children content</div>
      </CampaignLayout>
    );

    await waitFor(() => screen.getByRole('heading'));
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  test('TC-3.10: Single fetch call (no extra network requests)', async () => {
    render(
      <CampaignLayout>
        <div>Children content</div>
      </CampaignLayout>
    );

    await waitFor(() => screen.getByRole('heading'));
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/campaigns/test-id');
  });
});

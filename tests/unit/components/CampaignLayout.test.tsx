// tests/unit/components/CampaignLayout.test.tsx
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CampaignLayout from '@/app/campaigns/[id]/layout';

// Dynamic mock for next/navigation
let mockPathname = '/campaigns/test-id';
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-id' }),
  usePathname: () => mockPathname,
}));

// Mock CampaignChat to capture the onSessionChange and onSizeChange props
let capturedOnSessionChange: ((id: string | null) => void) | undefined
let capturedOnSizeChange: ((isLarge: boolean) => void) | undefined
jest.mock('@/lib/components/CampaignChat', () => ({
  CampaignChat: ({ activeSessionId, onSessionChange, onSizeChange }: { activeSessionId?: string | null; onSessionChange?: (id: string | null) => void; onSizeChange?: (isLarge: boolean) => void }) => {
    capturedOnSessionChange = onSessionChange
    capturedOnSizeChange = onSizeChange
    return <div data-testid="campaign-chat" data-active-session={activeSessionId ?? ''} />
  },
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

describe('CampaignLayout', () => {
  beforeEach(() => {
    capturedOnSessionChange = undefined;
    capturedOnSizeChange = undefined;
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

  test('TC-1.1 (was TC-3.2): Members tab active on exact Members path', async () => {
    mockPathname = '/campaigns/test-id';
    render(
      <CampaignLayout>
        <div>Children content</div>
      </CampaignLayout>
    );

    await waitFor(() => screen.getByRole('heading'));
    const tab = screen.getByRole('link', { name: 'Members' });
    expect(tab).toHaveClass('bg-blue-600');
    expect(tab).not.toHaveClass('border-b-2');
    expect(screen.getByRole('link', { name: 'Sessions' })).not.toHaveClass('bg-blue-600');
    expect(screen.getByRole('link', { name: 'Sessions' })).not.toHaveClass('border-b-2');
  });

  test('TC-1.2 (was TC-3.3): Sessions tab active on Sessions path', async () => {
    mockPathname = '/campaigns/test-id/sessions';
    render(
      <CampaignLayout>
        <div>Children content</div>
      </CampaignLayout>
    );

    await waitFor(() => screen.getByRole('heading'));
    const tab = screen.getByRole('link', { name: 'Sessions' });
    expect(tab).toHaveClass('bg-blue-600');
    expect(screen.getByRole('link', { name: 'Members' })).not.toHaveClass('bg-blue-600');
  });

  test('TC-1.3 (was TC-3.4): Prompts tab active on Prompts path', async () => {
    mockPathname = '/campaigns/test-id/prompts';
    render(
      <CampaignLayout>
        <div>Children content</div>
      </CampaignLayout>
    );

    await waitFor(() => screen.getByRole('heading'));
    const tab = screen.getByRole('link', { name: 'Prompts' });
    expect(tab).toHaveClass('bg-blue-600');
    expect(screen.getByRole('link', { name: 'Members' })).not.toHaveClass('bg-blue-600');
  });

  test('TC-1.4 (was TC-3.5): Library tab active on Library path', async () => {
    mockPathname = '/campaigns/test-id/library';
    render(
      <CampaignLayout>
        <div>Children content</div>
      </CampaignLayout>
    );

    await waitFor(() => screen.getByRole('heading'));
    const tab = screen.getByRole('link', { name: 'Library' });
    expect(tab).toHaveClass('bg-blue-600');
    expect(screen.getByRole('link', { name: 'Members' })).not.toHaveClass('bg-blue-600');
  });

  test('TC-1.5 (was TC-3.6): Sessions tab active on nested sessions sub-route', async () => {
    mockPathname = '/campaigns/test-id/sessions/some-session-id';
    render(
      <CampaignLayout>
        <div>Children content</div>
      </CampaignLayout>
    );

    await waitFor(() => screen.getByRole('heading'));
    const tab = screen.getByRole('link', { name: 'Sessions' });
    expect(tab).toHaveClass('bg-blue-600');
  });

  test('TC-1.6: Default (non-isChatLarge) branch renders a bg-gray-900 min-h-screen wrapper around header/nav/children', async () => {
    mockPathname = '/campaigns/test-id';
    render(
      <CampaignLayout>
        <div data-testid="child-content">Children content</div>
      </CampaignLayout>
    );

    await waitFor(() => screen.getByRole('heading'));
    const child = screen.getByTestId('child-content');
    const wrapper = child.closest('.bg-gray-900');
    expect(wrapper).not.toBeNull();
    expect(wrapper).toHaveClass('min-h-screen');
  });

  test('TC-1.7: isChatLarge branch renders header/nav/children inside a bg-gray-900 <main>', async () => {
    mockPathname = '/campaigns/test-id';
    render(
      <CampaignLayout>
        <div data-testid="child-content">Children content</div>
      </CampaignLayout>
    );

    await waitFor(() => screen.getByRole('heading'));
    act(() => {
      capturedOnSizeChange?.(true);
    });

    await waitFor(() => {
      const main = screen.getByTestId('child-content').closest('main');
      expect(main).not.toBeNull();
      expect(main).toHaveClass('bg-gray-900');
    });
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

    // Wait for the async fetch to finish executing
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
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
    expect(screen.getByTestId('campaign-chat')).toBeInTheDocument();
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

  test('TC-3.11: onSessionChange updates activeSessionId passed to CampaignChat', async () => {
    render(
      <CampaignLayout>
        <div>Children content</div>
      </CampaignLayout>
    );
    await waitFor(() => screen.getByRole('heading'));
    const chat = screen.getByTestId('campaign-chat');
    expect(chat).toHaveAttribute('data-active-session', 'session-123');

    act(() => {
      capturedOnSessionChange?.('new-session-456');
    });
    await waitFor(() => expect(screen.getByTestId('campaign-chat')).toHaveAttribute('data-active-session', 'new-session-456'));
  });

  test('TC-3.12: onSessionChange with null clears activeSessionId in CampaignChat', async () => {
    render(
      <CampaignLayout>
        <div>Children content</div>
      </CampaignLayout>
    );
    await waitFor(() => screen.getByRole('heading'));

    act(() => {
      capturedOnSessionChange?.(null);
    });
    await waitFor(() => expect(screen.getByTestId('campaign-chat')).toHaveAttribute('data-active-session', ''));
  });
});

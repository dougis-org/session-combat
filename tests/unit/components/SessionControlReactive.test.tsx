// tests/unit/components/SessionControlReactive.test.tsx
//
// Regression/characterization coverage for spec scenario "Control updates
// reactively on session SSE event": proves the existing session-SSE plumbing
// (CampaignChat's onSessionChange callback, already wired through
// CampaignLayout) drives the *real* SessionControl's displayed state, with no
// additional fetch issued by SessionControl itself.
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CampaignLayout from '@/app/campaigns/[id]/layout';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-id' }),
  usePathname: () => '/campaigns/test-id',
}));

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return { __esModule: true, default: MockLink };
});

// Real SessionControl is used (not mocked); gate it open via useIsDM.
jest.mock('@/lib/hooks/useIsDM', () => ({
  useIsDM: () => ({ isDM: true, loading: false }),
}));

// Mock CampaignChat but capture onSessionChange, exactly mirroring how the
// existing `session` SSE event already reaches CampaignLayout in production
// (CampaignChat.tsx:438, tested independently in CampaignChat.sse.test.tsx).
let capturedOnSessionChange: ((id: string | null) => void) | undefined;
jest.mock('@/lib/components/CampaignChat', () => ({
  CampaignChat: ({ activeSessionId, onSessionChange }: { activeSessionId?: string | null; onSessionChange?: (id: string | null) => void }) => {
    capturedOnSessionChange = onSessionChange;
    return (
      <div data-testid="roll-entry-strip-proxy">
        {activeSessionId === null ? 'No active session' : 'Roll strip enabled'}
      </div>
    );
  },
}));

describe('SessionControl — reactive SSE integration', () => {
  beforeEach(() => {
    capturedOnSessionChange = undefined;
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ name: 'Test Campaign', activeSessionId: null }),
      } as Response)
    ) as jest.Mock;
  });

  test('T4-1: session SSE event flips SessionControl to End Session and enables the roll strip, no extra fetch', async () => {
    render(<CampaignLayout><div>children</div></CampaignLayout>);
    await waitFor(() => screen.getByRole('heading'));

    expect(screen.getByText('Start Session')).toBeInTheDocument();
    expect(screen.getByText('No active session')).toBeInTheDocument();

    const fetchCallsBefore = (global.fetch as jest.Mock).mock.calls.length;

    act(() => {
      capturedOnSessionChange?.('log-sse-1');
    });

    await waitFor(() => {
      expect(screen.getByText('End Session')).toBeInTheDocument();
      expect(screen.getByText('Roll strip enabled')).toBeInTheDocument();
    });
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(fetchCallsBefore);
  });

  test('T4-2: session SSE event clearing activeSessionId flips back to Start Session and disables the roll strip', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ name: 'Test Campaign', activeSessionId: 'log-initial' }),
      } as Response)
    ) as jest.Mock;

    render(<CampaignLayout><div>children</div></CampaignLayout>);
    await waitFor(() => screen.getByRole('heading'));

    expect(screen.getByText('End Session')).toBeInTheDocument();
    expect(screen.getByText('Roll strip enabled')).toBeInTheDocument();

    const fetchCallsBefore = (global.fetch as jest.Mock).mock.calls.length;

    act(() => {
      capturedOnSessionChange?.(null);
    });

    await waitFor(() => {
      expect(screen.getByText('Start Session')).toBeInTheDocument();
      expect(screen.getByText('No active session')).toBeInTheDocument();
    });
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(fetchCallsBefore);
  });
});

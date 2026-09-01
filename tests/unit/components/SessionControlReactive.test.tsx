// tests/unit/components/SessionControlReactive.test.tsx
//
// Regression/characterization coverage for spec scenario "Control updates
// reactively on session SSE event": proves the existing session-SSE plumbing
// (SessionControl's internal useCampaignStream subscription) drives the *real* SessionControl's displayed state, with no
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

// Mock useCampaignStream to capture the onEvent handler passed by SessionControl

jest.mock('@/lib/components/CampaignChat', () => ({
  CampaignChat: () => <div data-testid="campaign-chat-mock" />
}));

let capturedStreamHandler: ((e: any) => void) | undefined;
jest.mock('@/lib/hooks/useCampaignStream', () => ({
  useCampaignStream: (campaignId: string, onEvent: (e: any) => void) => {
    capturedStreamHandler = onEvent;
    return { status: 'open' };
  }
}));

describe('SessionControl — reactive SSE integration', () => {
  beforeEach(() => {
    capturedStreamHandler = undefined;
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ name: 'Test Campaign', activeSessionId: null }),
      } as Response)
    ) as jest.Mock;
  });

  test('T4-1: session SSE event flips SessionControl to End Session, no extra fetch', async () => {
    render(<CampaignLayout><div>children</div></CampaignLayout>);
    await waitFor(() => screen.getByRole('heading'));

    expect(screen.getByText('Start Session')).toBeInTheDocument();

    const fetchCallsBefore = (global.fetch as jest.Mock).mock.calls.length;

    act(() => {
      capturedStreamHandler?.({ type: 'session', campaignId: 'test-id', data: { activeSessionId: 'log-sse-1' } });
    });

    await waitFor(() => {
      expect(screen.getByText('End Session')).toBeInTheDocument();
    });
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(fetchCallsBefore);
  });

  test('T4-2: session SSE event clearing activeSessionId flips back to Start Session', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ name: 'Test Campaign', activeSessionId: 'log-initial' }),
      } as Response)
    ) as jest.Mock;

    render(<CampaignLayout><div>children</div></CampaignLayout>);
    await waitFor(() => screen.getByRole('heading'));

    expect(screen.getByText('End Session')).toBeInTheDocument();

    const fetchCallsBefore = (global.fetch as jest.Mock).mock.calls.length;

    act(() => {
      capturedStreamHandler?.({ type: 'session', campaignId: 'test-id', data: { activeSessionId: null } });
    });

    await waitFor(() => {
      expect(screen.getByText('Start Session')).toBeInTheDocument();
    });
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(fetchCallsBefore);
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'camp-1' }),
}));

jest.mock('@/lib/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

jest.mock('@/lib/components/ui', () => ({
  ErrorBanner: ({ message }: { message: string | null }) =>
    message ? React.createElement('div', { role: 'alert' }, message) : null,
  LoadingState: ({ label }: { label: string }) =>
    React.createElement('div', null, label),
  FormField: ({ label, children }: { label: string; children: React.ReactNode }) =>
    React.createElement('div', null, React.createElement('label', null, label), children),
  textInputClass: () => '',
  Chevron: ({ expanded }: { expanded: boolean }) =>
    React.createElement('svg', { 'data-testid': 'chevron', className: expanded ? 'rotate-90' : '' }),
}));

jest.mock('@/lib/utils/sessionEvents', () => ({
  buildNpcEventsFromMemberChanges: jest.fn(() => []),
}));

jest.mock('@/lib/hooks/useCampaignContext', () => ({
  useCampaignContext: jest.fn(() => ({
    context: null,
    loading: false,
    error: null,
    refresh: jest.fn(),
  })),
}));

jest.mock('@/lib/hooks/useIsDM', () => ({
  useIsDM: jest.fn(() => ({
    isDM: true,
    loading: false,
  })),
}));

const MOCK_LOG = {
  id: 'log-1',
  userId: 'u1',
  campaignId: 'camp-1',
  sessionNumber: 3,
  title: 'Into the Mines',
  datePlayed: new Date('2026-04-15').toISOString(),
  summary: 'The party explored the mines.',
  events: [],
  milestone: false,
  createdAt: new Date('2026-04-15').toISOString(),
  updatedAt: new Date('2026-04-15').toISOString(),
};

const MILESTONE_LOG = {
  ...MOCK_LOG,
  id: 'log-2',
  sessionNumber: 2,
  title: 'Level Up!',
  milestone: true,
  newLevel: 5,
};

async function renderWithData(logs: object[], parties: object[] = []) {
  global.fetch = jest.fn(async (url: RequestInfo | URL) => {
    const s = String(url);
    if (s.includes('/sessions')) return { ok: true, json: async () => logs } as unknown as Response;
    if (s.includes('/parties')) return { ok: true, json: async () => parties } as unknown as Response;
    return { ok: true, json: async () => [] } as unknown as Response;
  }) as typeof fetch;

  const { default: SessionsPage } = await import('@/app/campaigns/[id]/sessions/page');
  render(React.createElement(SessionsPage));
}

describe('SessionsPage — session log display', () => {
  let user: ReturnType<typeof userEvent.setup>;
  beforeEach(() => { user = userEvent.setup(); });

  test('renders session title and number', async () => {
    await renderWithData([MOCK_LOG]);
    expect(await screen.findByText('Into the Mines')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  test('renders milestone badge with level', async () => {
    await renderWithData([MILESTONE_LOG]);
    expect(await screen.findByText(/Level 5/)).toBeInTheDocument();
  });

  test('renders milestone badge as "Level Up" when newLevel is 0', async () => {
    const log = { ...MILESTONE_LOG, newLevel: 0 };
    await renderWithData([log]);
    expect(await screen.findByText('Level Up')).toBeInTheDocument();
  });

  test('shows empty state when no logs', async () => {
    await renderWithData([]);
    expect(await screen.findByText('No sessions logged yet.')).toBeInTheDocument();
  });

  test('shows "+ New Session" button', async () => {
    await renderWithData([]);
    expect(await screen.findByRole('button', { name: /new session/i })).toBeInTheDocument();
  });

  test('renders session form when button clicked and can cancel', async () => {
    await renderWithData([]);
    const btn = await screen.findByRole('button', { name: /new session/i });
    await user.click(btn);
    expect(await screen.findByText(/Session #/)).toBeInTheDocument();
    
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelBtn);
    expect(screen.queryByText(/Session #/)).not.toBeInTheDocument();
  });

  test('clicking edit button sets the editing log, shows form, and can cancel', async () => {
    await renderWithData([MOCK_LOG]);
    const editBtn = await screen.findByRole('button', { name: 'Edit' });
    await user.click(editBtn);
    // When editing, form appears and "New Session" changes to "Edit Session"
    expect(await screen.findByText(/Edit Session/)).toBeInTheDocument();
    
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelBtn);
    expect(screen.queryByText(/Edit Session/)).not.toBeInTheDocument();
  });

  test('clicking delete button triggers delete API', async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    await renderWithData([MOCK_LOG]);
    const delBtn = await screen.findByRole('button', { name: 'Delete' });
    await user.click(delBtn);
    expect(window.confirm).toHaveBeenCalledWith('Delete this session log?');
    expect(global.fetch).toHaveBeenCalledWith(`/api/campaigns/camp-1/sessions/${MOCK_LOG.id}`, { method: 'DELETE' });
  });

  test('shows no-linked-party notice when no party found', async () => {
    // useCampaignContext mock returns no parties by default (context: null)
    await renderWithData([]);
    const btn = await screen.findByRole('button', { name: /new session/i });
    await user.click(btn);
    expect(await screen.findByText(/No linked party found/)).toBeInTheDocument();
  });

  test('fetches sessions on load', async () => {
    await renderWithData([MOCK_LOG]);
    await screen.findByText('Into the Mines');
    // useCampaignContext is mocked, so only the sessions fetch is real
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('collapsed session entry shows a closed chevron and aria-expanded false', async () => {
    await renderWithData([MOCK_LOG]);
    await screen.findByText('Into the Mines');
    const titleButton = screen.getByText('Into the Mines').closest('button')!;
    expect(titleButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('chevron')).not.toHaveClass('rotate-90');
  });

  test('clicking the title expands the entry and rotates the chevron', async () => {
    await renderWithData([MOCK_LOG]);
    await screen.findByText('Into the Mines');
    const titleButton = screen.getByText('Into the Mines').closest('button')!;
    await user.click(titleButton);
    expect(titleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('chevron')).toHaveClass('rotate-90');
    expect(await screen.findByText('The party explored the mines.')).toBeInTheDocument();
  });

  test('clicking an expanded entry title collapses it and rotates the chevron back', async () => {
    await renderWithData([MOCK_LOG]);
    await screen.findByText('Into the Mines');
    const titleButton = screen.getByText('Into the Mines').closest('button')!;
    await user.click(titleButton);
    await user.click(titleButton);
    expect(titleButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('chevron')).not.toHaveClass('rotate-90');
    expect(screen.queryByText('The party explored the mines.')).not.toBeInTheDocument();
  });
});

describe('SessionsPage — non-DM behavior', () => {
  let user: ReturnType<typeof userEvent.setup>;
  beforeEach(() => { 
    user = userEvent.setup();
    const { useIsDM } = require('@/lib/hooks/useIsDM');
    useIsDM.mockReturnValue({ isDM: false, loading: false, error: null });
  });
  afterEach(() => {
    const { useIsDM } = require('@/lib/hooks/useIsDM');
    useIsDM.mockReturnValue({ isDM: true, loading: false, error: null });
  });

  test('does not render edit/delete controls or new session button', async () => {
    await renderWithData([MOCK_LOG]);
    expect(await screen.findByText('Into the Mines')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new session/i })).not.toBeInTheDocument();
  });

  test('does not render controls while loading', async () => {
    const { useIsDM } = require('@/lib/hooks/useIsDM');
    useIsDM.mockReturnValue({ isDM: false, loading: true });
    await renderWithData([MOCK_LOG]);
    expect(await screen.findByText('Into the Mines')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /\+ New Session/i })).toBeDisabled();
  });

  test('calls useIsDM with the correct campaignId', async () => {
    const { useIsDM } = require('@/lib/hooks/useIsDM');
    await renderWithData([MOCK_LOG]);
    expect(useIsDM).toHaveBeenCalledWith('camp-1');
  });

  test('dynamically renders controls when loading completes and user is DM', async () => {
    const { useIsDM } = require('@/lib/hooks/useIsDM');
    let triggerRerender: () => void = () => {};
    // Start as loading/false
    useIsDM.mockImplementation(() => {
      const [state, setState] = require('react').useState({ isDM: false, loading: true });
      triggerRerender = () => setState({ isDM: true, loading: false });
      return state;
    });

    await renderWithData([MOCK_LOG]);
    expect(await screen.findByText('Into the Mines')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\+ New Session/i })).toBeDisabled();
    
    // Complete loading as DM
    require('react').act(() => triggerRerender());
    
    expect(screen.getByRole('button', { name: /\+ New Session/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Edit' })).not.toBeDisabled();
  });
});

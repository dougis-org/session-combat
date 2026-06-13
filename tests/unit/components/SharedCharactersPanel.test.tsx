import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Response as FetchResponse } from 'node-fetch';
import { SharedCharactersPanel } from '@/lib/components/SharedCharactersPanel';
import { Character, CampaignCharacterShare, CampaignMember } from '@/lib/types';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new FetchResponse(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Response;
}

const CAMPAIGN_ID = 'camp-1';

const ACTIVE_PLAYER: CampaignMember = {
  id: 'mem-1',
  campaignId: CAMPAIGN_ID,
  userId: 'user-1',
  role: 'player',
  status: 'active',
  history: [],
};

const ACTIVE_DM: CampaignMember = {
  id: 'mem-2',
  campaignId: CAMPAIGN_ID,
  userId: 'user-2',
  role: 'dm',
  status: 'active',
  history: [],
};

const CHAR_X: Character = {
  id: 'char-x',
  userId: 'user-1',
  name: 'Aragorn',
  classes: [],
  abilityScores: {
    strength: 10, dexterity: 10, constitution: 10,
    intelligence: 10, wisdom: 10, charisma: 10,
  },
} as unknown as Character;

const CHAR_Y: Character = {
  id: 'char-y',
  userId: 'user-1',
  name: 'Legolas',
  classes: [],
  abilityScores: {
    strength: 10, dexterity: 10, constitution: 10,
    intelligence: 10, wisdom: 10, charisma: 10,
  },
} as unknown as Character;

const SHARE_X: CampaignCharacterShare = {
  id: 'share-x',
  campaignId: CAMPAIGN_ID,
  characterId: 'char-x',
  userId: 'user-1',
  sharedAt: new Date(),
};

let originalFetch: typeof global.fetch;

beforeEach(() => {
  originalFetch = global.fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

function setupFetch(member: CampaignMember | null, shares: CampaignCharacterShare[] = []) {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = input.toString();
    if (url === `/api/campaigns/${CAMPAIGN_ID}/members/me`) {
      return member ? jsonResponse(member) : jsonResponse({ error: 'Not a member' }, 404);
    }
    if (url === `/api/campaigns/${CAMPAIGN_ID}/characters`) return jsonResponse(shares);
    return jsonResponse({ error: 'Not found' }, 404);
  });
}

describe('SharedCharactersPanel', () => {
  it('T6-1: panel is NOT rendered when member fetch returns 404 (non-member)', async () => {
    setupFetch(null);
    render(<SharedCharactersPanel campaignId={CAMPAIGN_ID} characters={[CHAR_X]} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.queryByText(/Shared Characters/i)).not.toBeInTheDocument();
  });

  it('T6-2: panel is NOT rendered when member is active dm', async () => {
    setupFetch(ACTIVE_DM);
    render(<SharedCharactersPanel campaignId={CAMPAIGN_ID} characters={[CHAR_X]} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.queryByText(/Shared Characters/i)).not.toBeInTheDocument();
  });

  it('T6-3: panel IS rendered when member is active player', async () => {
    setupFetch(ACTIVE_PLAYER);
    render(<SharedCharactersPanel campaignId={CAMPAIGN_ID} characters={[]} />);
    await waitFor(() => {
      expect(screen.getByText(/Shared Characters/i)).toBeInTheDocument();
    });
  });

  it('T6-4: panel lists characters with correct toggle states', async () => {
    setupFetch(ACTIVE_PLAYER, [SHARE_X]);
    render(<SharedCharactersPanel campaignId={CAMPAIGN_ID} characters={[CHAR_X, CHAR_Y]} />);

    await waitFor(() => {
      expect(screen.getByText('Aragorn')).toBeInTheDocument();
      expect(screen.getByText('Legolas')).toBeInTheDocument();
    });

    const aragornToggle = screen.getByRole('checkbox', { name: /Aragorn/i });
    const legolasToggle = screen.getByRole('checkbox', { name: /Legolas/i });
    expect(aragornToggle).toBeChecked();
    expect(legolasToggle).not.toBeChecked();
  });

  it('T6-5: clicking unchecked toggle calls POST', async () => {
    const user = userEvent.setup();
    const mockFetch = jest.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
      const url = input.toString();
      if (url === `/api/campaigns/${CAMPAIGN_ID}/members/me`) return jsonResponse(ACTIVE_PLAYER);
      if (url === `/api/campaigns/${CAMPAIGN_ID}/characters` && !options?.method) return jsonResponse([SHARE_X]);
      if (url === `/api/campaigns/${CAMPAIGN_ID}/characters` && options?.method === 'POST') {
        return jsonResponse({ id: 'share-y', characterId: 'char-y' }, 201);
      }
      return jsonResponse({ error: 'Not found' }, 404);
    });
    global.fetch = mockFetch;

    render(<SharedCharactersPanel campaignId={CAMPAIGN_ID} characters={[CHAR_X, CHAR_Y]} />);

    await waitFor(() => expect(screen.getByText('Legolas')).toBeInTheDocument());

    await user.click(screen.getByRole('checkbox', { name: /Legolas/i }));

    await waitFor(() => {
      const postCall = mockFetch.mock.calls.find(
        ([url, opts]) =>
          url.toString() === `/api/campaigns/${CAMPAIGN_ID}/characters` &&
          opts?.method === 'POST'
      );
      expect(postCall).toBeDefined();
      expect(JSON.parse(postCall![1]!.body as string).characterId).toBe('char-y');
    });
  });

  it('T6-6: clicking checked toggle calls DELETE', async () => {
    const user = userEvent.setup();
    const mockFetch = jest.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
      const url = input.toString();
      if (url === `/api/campaigns/${CAMPAIGN_ID}/members/me`) return jsonResponse(ACTIVE_PLAYER);
      if (url === `/api/campaigns/${CAMPAIGN_ID}/characters` && !options?.method) return jsonResponse([SHARE_X]);
      if (url === `/api/campaigns/${CAMPAIGN_ID}/characters/char-x` && options?.method === 'DELETE') {
        return new FetchResponse(null as any, { status: 204 }) as unknown as Response;
      }
      return jsonResponse({ error: 'Not found' }, 404);
    });
    global.fetch = mockFetch;

    render(<SharedCharactersPanel campaignId={CAMPAIGN_ID} characters={[CHAR_X, CHAR_Y]} />);

    await waitFor(() => expect(screen.getByText('Aragorn')).toBeInTheDocument());

    await user.click(screen.getByRole('checkbox', { name: /Aragorn/i }));

    await waitFor(() => {
      expect(mockFetch.mock.calls.find(
        ([url, opts]) =>
          url.toString() === `/api/campaigns/${CAMPAIGN_ID}/characters/char-x` &&
          opts?.method === 'DELETE'
      )).toBeDefined();
    });
  });

  it('reverts optimistic update when POST fails', async () => {
    const user = userEvent.setup();
    const mockFetch = jest.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
      const url = input.toString();
      if (url === `/api/campaigns/${CAMPAIGN_ID}/members/me`) return jsonResponse(ACTIVE_PLAYER);
      if (url === `/api/campaigns/${CAMPAIGN_ID}/characters` && !options?.method) return jsonResponse([]);
      if (url === `/api/campaigns/${CAMPAIGN_ID}/characters` && options?.method === 'POST') {
        return jsonResponse({ error: 'Conflict' }, 409);
      }
      return jsonResponse({ error: 'Not found' }, 404);
    });
    global.fetch = mockFetch;

    render(<SharedCharactersPanel campaignId={CAMPAIGN_ID} characters={[CHAR_Y]} />);

    await waitFor(() => expect(screen.getByText('Legolas')).toBeInTheDocument());

    const toggle = screen.getByRole('checkbox', { name: /Legolas/i });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /Legolas/i })).not.toBeChecked();
    });
  });

  it('panel collapses and expands on button click', async () => {
    const user = userEvent.setup();
    setupFetch(ACTIVE_PLAYER);

    render(<SharedCharactersPanel campaignId={CAMPAIGN_ID} characters={[CHAR_X]} />);

    await waitFor(() => expect(screen.getByText(/Shared Characters/i)).toBeInTheDocument());

    const toggleBtn = screen.getByRole('button', { name: /Shared Characters/i });
    expect(screen.getByText('Aragorn')).toBeInTheDocument();

    await user.click(toggleBtn);
    expect(screen.queryByText('Aragorn')).not.toBeInTheDocument();

    await user.click(toggleBtn);
    expect(screen.getByText('Aragorn')).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockFetchResponse } from '@/tests/unit/helpers/mockFetchResponse';
import { PartyMembershipPanel } from '@/lib/components/PartyMembershipPanel';
import type { Character, Party } from '@/lib/types';

function jsonResponse(body: unknown, status = 200): Response {
  return new MockFetchResponse(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Response;
}

const CAMPAIGN_ID = 'camp-1';
const USER_ID = 'user-1';

const CHAR_X: Character = {
  id: 'char-x',
  userId: USER_ID,
  name: 'Aragorn',
  classes: [],
  abilityScores: {
    strength: 10, dexterity: 10, constitution: 10,
    intelligence: 10, wisdom: 10, charisma: 10,
  },
} as unknown as Character;

const CHAR_Y: Character = {
  id: 'char-y',
  userId: USER_ID,
  name: 'Legolas',
  classes: [],
  abilityScores: {
    strength: 10, dexterity: 10, constitution: 10,
    intelligence: 10, wisdom: 10, charisma: 10,
  },
} as unknown as Character;

function makeParty(id: string, members: Party['members'] = []): Party {
  return {
    id,
    userId: 'gm-1',
    name: `Party ${id}`,
    members,
    campaignId: CAMPAIGN_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

let originalFetch: typeof global.fetch;

beforeEach(() => {
  originalFetch = global.fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

describe('PartyMembershipPanel', () => {
  it('renders a checkbox for each of the player\'s own characters', () => {
    const party = makeParty('party-1');
    render(<PartyMembershipPanel campaignId={CAMPAIGN_ID} userId={USER_ID} party={party} characters={[CHAR_X, CHAR_Y]} />);

    expect(screen.getByRole('checkbox', { name: /Aragorn/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Legolas/i })).toBeInTheDocument();
  });

  it('renders a character who previously left the party as unchecked', () => {
    const party = makeParty('party-1', [
      { characterId: 'char-x', addedAt: new Date('2026-01-01'), leftAt: new Date('2026-01-02') },
    ]);
    render(<PartyMembershipPanel campaignId={CAMPAIGN_ID} userId={USER_ID} party={party} characters={[CHAR_X]} />);

    expect(screen.getByRole('checkbox', { name: /Aragorn/i })).not.toBeChecked();
  });

  it('reflects active membership as checked and inactive as unchecked', () => {
    const party = makeParty('party-1', [
      { characterId: 'char-x', addedAt: new Date() },
    ]);
    render(<PartyMembershipPanel campaignId={CAMPAIGN_ID} userId={USER_ID} party={party} characters={[CHAR_X, CHAR_Y]} />);

    expect(screen.getByRole('checkbox', { name: /Aragorn/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Legolas/i })).not.toBeChecked();
  });

  it('checking an unchecked character sends PUT with full active characterIds', async () => {
    const user = userEvent.setup();
    const party = makeParty('party-1', [
      { characterId: 'char-x', addedAt: new Date() },
    ]);
    const mockFetch = jest.fn(async (_input: RequestInfo | URL, _options?: RequestInit) => jsonResponse({}, 200)) as unknown as typeof global.fetch;
    global.fetch = mockFetch;

    render(<PartyMembershipPanel campaignId={CAMPAIGN_ID} userId={USER_ID} party={party} characters={[CHAR_X, CHAR_Y]} />);

    await user.click(screen.getByRole('checkbox', { name: /Legolas/i }));

    await waitFor(() => {
      const call = (mockFetch as jest.Mock).mock.calls[0];
      expect(call[0]).toBe(`/api/campaigns/${CAMPAIGN_ID}/members/${USER_ID}/parties/party-1`);
      expect(call[1].method).toBe('PUT');
      const body = JSON.parse(call[1].body);
      expect(body.characterIds.sort()).toEqual(['char-x', 'char-y']);
    });
  });

  it('unchecking a checked character sends PUT excluding that character', async () => {
    const user = userEvent.setup();
    const party = makeParty('party-1', [
      { characterId: 'char-x', addedAt: new Date() },
      { characterId: 'char-y', addedAt: new Date() },
    ]);
    const mockFetch = jest.fn(async () => jsonResponse({}, 200)) as unknown as typeof global.fetch;
    global.fetch = mockFetch;

    render(<PartyMembershipPanel campaignId={CAMPAIGN_ID} userId={USER_ID} party={party} characters={[CHAR_X, CHAR_Y]} />);

    await user.click(screen.getByRole('checkbox', { name: /Legolas/i }));

    await waitFor(() => {
      const call = (mockFetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.characterIds).toEqual(['char-x']);
    });
  });

  it('disables the toggled checkbox while its PUT is in flight, others remain interactive', async () => {
    const user = userEvent.setup();
    const party = makeParty('party-1');
    let resolveFetch: (value: Response) => void;
    const pending = new Promise<Response>((resolve) => { resolveFetch = resolve; });
    const mockFetch = jest.fn(() => pending) as unknown as typeof global.fetch;
    global.fetch = mockFetch;

    render(<PartyMembershipPanel campaignId={CAMPAIGN_ID} userId={USER_ID} party={party} characters={[CHAR_X, CHAR_Y]} />);

    await user.click(screen.getByRole('checkbox', { name: /Aragorn/i }));

    expect(screen.getByRole('checkbox', { name: /Aragorn/i })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: /Legolas/i })).not.toBeDisabled();

    resolveFetch!(jsonResponse({}, 200));
    await waitFor(() => expect(screen.getByRole('checkbox', { name: /Aragorn/i })).not.toBeDisabled());
  });

  it('reverts the checkbox to its previous state when the PUT fails', async () => {
    const user = userEvent.setup();
    const party = makeParty('party-1');
    const mockFetch = jest.fn(async () => jsonResponse({ error: 'fail' }, 500)) as unknown as typeof global.fetch;
    global.fetch = mockFetch;

    render(<PartyMembershipPanel campaignId={CAMPAIGN_ID} userId={USER_ID} party={party} characters={[CHAR_X]} />);

    const toggle = screen.getByRole('checkbox', { name: /Aragorn/i });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /Aragorn/i })).not.toBeChecked();
    });
  });

  it('shows an inline error message when a toggle fails', async () => {
    const user = userEvent.setup();
    const party = makeParty('party-1');
    const mockFetch = jest.fn(async () => jsonResponse({ error: 'fail' }, 500)) as unknown as typeof global.fetch;
    global.fetch = mockFetch;

    render(<PartyMembershipPanel campaignId={CAMPAIGN_ID} userId={USER_ID} party={party} characters={[CHAR_X]} />);

    await user.click(screen.getByRole('checkbox', { name: /Aragorn/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not update party membership/i)).toBeInTheDocument();
    });
  });

  it('a failed toggle for one character does not clobber a concurrent successful toggle for another', async () => {
    const user = userEvent.setup();
    const party = makeParty('party-1');
    let resolveA: (value: Response) => void;
    const pendingA = new Promise<Response>((resolve) => { resolveA = resolve; });
    const mockFetch = jest.fn((url: RequestInfo | URL, options?: RequestInit) => {
      const body = JSON.parse(options!.body as string);
      // The request adding char-x (Aragorn only) is the one that will fail.
      if (body.characterIds.length === 1 && body.characterIds[0] === 'char-x') {
        return pendingA;
      }
      return Promise.resolve(jsonResponse({}, 200));
    }) as unknown as typeof global.fetch;
    global.fetch = mockFetch;

    render(<PartyMembershipPanel campaignId={CAMPAIGN_ID} userId={USER_ID} party={party} characters={[CHAR_X, CHAR_Y]} />);

    // Start toggling Aragorn (char-x); its PUT stays pending.
    await user.click(screen.getByRole('checkbox', { name: /Aragorn/i }));
    // While that's in flight, toggle Legolas (char-y); its PUT resolves immediately.
    await user.click(screen.getByRole('checkbox', { name: /Legolas/i }));

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /Legolas/i })).toBeChecked();
    });

    // Now fail Aragorn's request.
    resolveA!(jsonResponse({ error: 'fail' }, 500));

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /Aragorn/i })).not.toBeChecked();
    });
    // Legolas's committed toggle must survive Aragorn's revert.
    expect(screen.getByRole('checkbox', { name: /Legolas/i })).toBeChecked();
  });

  it('two independent panel instances do not affect each other\'s state', async () => {
    const user = userEvent.setup();
    const partyA = makeParty('party-a', [{ characterId: 'char-x', addedAt: new Date() }]);
    const partyB = makeParty('party-b');
    const mockFetch = jest.fn(async () => jsonResponse({}, 200)) as unknown as typeof global.fetch;
    global.fetch = mockFetch;

    render(
      <>
        <PartyMembershipPanel campaignId={CAMPAIGN_ID} userId={USER_ID} party={partyA} characters={[CHAR_X]} />
        <PartyMembershipPanel campaignId={CAMPAIGN_ID} userId={USER_ID} party={partyB} characters={[CHAR_X]} />
      </>
    );

    const checkboxes = screen.getAllByRole('checkbox', { name: /Aragorn/i });
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();

    await user.click(checkboxes[1]);

    await waitFor(() => {
      expect((mockFetch as jest.Mock).mock.calls).toHaveLength(1);
      const call = (mockFetch as jest.Mock).mock.calls[0];
      expect(call[0]).toBe(`/api/campaigns/${CAMPAIGN_ID}/members/${USER_ID}/parties/party-b`);
    });

    expect(checkboxes[0]).toBeChecked();
  });

  it('renders a message and no checkboxes when the player has zero characters', () => {
    const party = makeParty('party-1');
    render(<PartyMembershipPanel campaignId={CAMPAIGN_ID} userId={USER_ID} party={party} characters={[]} />);

    expect(screen.getByText(/no characters/i)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('renders a load-failure message instead of the empty-state message when characters failed to load', () => {
    const party = makeParty('party-1');
    render(
      <PartyMembershipPanel
        campaignId={CAMPAIGN_ID}
        userId={USER_ID}
        party={party}
        characters={[]}
        charactersUnavailable
      />
    );

    expect(screen.getByText(/could not load your characters/i)).toBeInTheDocument();
    expect(screen.queryByText(/no characters to add/i)).not.toBeInTheDocument();
  });

  it('resyncs checkbox state when the party prop updates after a refetch', () => {
    const party = makeParty('party-1');
    const { rerender } = render(
      <PartyMembershipPanel campaignId={CAMPAIGN_ID} userId={USER_ID} party={party} characters={[CHAR_X]} />
    );
    expect(screen.getByRole('checkbox', { name: /Aragorn/i })).not.toBeChecked();

    const updatedParty = makeParty('party-1', [{ characterId: 'char-x', addedAt: new Date() }]);
    rerender(
      <PartyMembershipPanel campaignId={CAMPAIGN_ID} userId={USER_ID} party={updatedParty} characters={[CHAR_X]} />
    );

    expect(screen.getByRole('checkbox', { name: /Aragorn/i })).toBeChecked();
  });
});

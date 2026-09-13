import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PlayerCampaignCard } from '@/lib/components/PlayerCampaignCard';
import type { Campaign } from '@/lib/types';

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return { __esModule: true, default: MockLink };
});

const CAMPAIGN: Campaign = {
  id: 'camp-1',
  userId: 'user-dm',
  name: 'Lost Mine of Phandelver',
  moduleName: 'LMoP',
  chapters: [],
  partyIds: [],
  status: 'active',
  notes: '',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('PlayerCampaignCard', () => {
  it('active player: renders a "Player" badge and a Session Log link only', () => {
    render(<PlayerCampaignCard campaign={CAMPAIGN} memberStatus="active" />);

    expect(screen.getByText('Player')).toBeInTheDocument();
    const sessionLogLink = screen.getByRole('link', { name: 'Session Log' });
    expect(sessionLogLink).toHaveAttribute('href', `/campaigns/${CAMPAIGN.id}/sessions`);

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    expect(screen.queryByText('Members')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Accept invitation/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Decline invitation/ })).not.toBeInTheDocument();
  });

  it('invited: renders an "Invited" badge and Accept/Decline buttons, no navigation links', () => {
    render(
      <PlayerCampaignCard
        campaign={CAMPAIGN}
        memberStatus="invited"
        onAccept={jest.fn()}
        onDecline={jest.fn()}
      />
    );

    expect(screen.getByText('Invited')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Accept invitation/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Decline invitation/ })).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('invited: clicking Accept/Decline invokes the corresponding callback with the campaign id', async () => {
    const user = userEvent.setup();
    const onAccept = jest.fn();
    const onDecline = jest.fn();
    render(
      <PlayerCampaignCard
        campaign={CAMPAIGN}
        memberStatus="invited"
        onAccept={onAccept}
        onDecline={onDecline}
      />
    );

    await user.click(screen.getByRole('button', { name: /^Accept invitation/ }));
    expect(onAccept).toHaveBeenCalledWith('camp-1');

    await user.click(screen.getByRole('button', { name: /^Decline invitation/ }));
    expect(onDecline).toHaveBeenCalledWith('camp-1');
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CampaignCardHeader } from '@/lib/components/CampaignCardHeader';
import type { Campaign } from '@/lib/types';

const CAMPAIGN: Campaign = {
  id: 'camp-1',
  userId: 'user-dm',
  name: 'Lost Mine of Phandelver',
  moduleName: 'LMoP',
  chapters: [{ id: 'ch1', title: 'Goblin Ambush', order: 0 }],
  currentChapterId: 'ch1',
  partyIds: [],
  status: 'planning',
  notes: '',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CampaignCardHeader', () => {
  it('renders title, status badge, module name, and current chapter', () => {
    render(<CampaignCardHeader campaign={CAMPAIGN} />);

    expect(screen.getByText('Lost Mine of Phandelver')).toBeInTheDocument();
    expect(screen.getByText('Planning')).toBeInTheDocument();
    expect(screen.getByText('LMoP')).toBeInTheDocument();
    expect(screen.getByText('Goblin Ambush')).toBeInTheDocument();
  });

  it('omits the module name line when moduleName is empty', () => {
    render(<CampaignCardHeader campaign={{ ...CAMPAIGN, moduleName: '' }} />);
    expect(screen.queryByText('LMoP')).not.toBeInTheDocument();
  });
});

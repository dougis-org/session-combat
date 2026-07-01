import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CampaignEditor } from '@/app/campaigns/CampaignEditor';
import { Campaign } from '@/lib/types';

const CH_A = { id: 'ch-a', title: 'Into the Dungeon', order: 0 };
const CH_B = { id: 'ch-b', title: 'The Catacombs', order: 1 };

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'camp-1',
    userId: 'user-1',
    name: 'Test Campaign',
    moduleName: 'Test Module',
    chapters: [],
    status: 'active',
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function renderEditor(campaign: Campaign) {
  const user = userEvent.setup();
  render(
    <CampaignEditor
      campaign={campaign}
      onSave={jest.fn()}
      onCancel={jest.fn()}
      isNew={false}
    />
  );
  return { user };
}

describe('CampaignEditor — display block (task 1a)', () => {
  it('shows active chapter name in display block', () => {
    renderEditor(makeCampaign({ chapters: [CH_A, CH_B], currentChapterId: CH_A.id }));
    const display = screen.getByTestId('current-chapter-display');
    expect(display).toBeInTheDocument();
    expect(display).toHaveTextContent('Ch. 1:');
    expect(display).toHaveTextContent(CH_A.title);
  });

  it('shows placeholder when no active chapter is set', () => {
    renderEditor(makeCampaign({ chapters: [CH_A, CH_B], currentChapterId: undefined }));
    const display = screen.getByTestId('current-chapter-display');
    expect(display).toHaveTextContent('-- No active chapter --');
  });

  it('display block is absent when no chapters exist', () => {
    renderEditor(makeCampaign({ chapters: [] }));
    expect(screen.queryByTestId('current-chapter-display')).not.toBeInTheDocument();
  });

  it('does not render the old select element', () => {
    renderEditor(makeCampaign({ chapters: [CH_A] }));
    expect(screen.queryByTestId('current-chapter-select')).not.toBeInTheDocument();
  });
});

describe('CampaignEditor — ACTIVE pill (task 1b)', () => {
  it('shows ACTIVE pill on the active chapter row', () => {
    renderEditor(makeCampaign({ chapters: [CH_A, CH_B], currentChapterId: CH_A.id }));
    expect(screen.getByTestId(`active-chapter-indicator-${CH_A.id}`)).toBeInTheDocument();
  });

  it('does not show ACTIVE pill on inactive chapter rows', () => {
    renderEditor(makeCampaign({ chapters: [CH_A, CH_B], currentChapterId: CH_A.id }));
    expect(screen.queryByTestId(`active-chapter-indicator-${CH_B.id}`)).not.toBeInTheDocument();
  });

  it('shows no ACTIVE pill when currentChapterId is unset', () => {
    renderEditor(makeCampaign({ chapters: [CH_A, CH_B], currentChapterId: undefined }));
    expect(screen.queryByTestId(`active-chapter-indicator-${CH_A.id}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`active-chapter-indicator-${CH_B.id}`)).not.toBeInTheDocument();
  });
});

describe('CampaignEditor — activate button (task 1c)', () => {
  it('shows activate button on inactive rows', () => {
    renderEditor(makeCampaign({ chapters: [CH_A, CH_B], currentChapterId: CH_A.id }));
    expect(screen.getByTestId(`activate-chapter-${CH_B.id}`)).toBeInTheDocument();
  });

  it('does not show activate button on the active row', () => {
    renderEditor(makeCampaign({ chapters: [CH_A, CH_B], currentChapterId: CH_A.id }));
    expect(screen.queryByTestId(`activate-chapter-${CH_A.id}`)).not.toBeInTheDocument();
  });

  it('activate button has correct tooltip', () => {
    renderEditor(makeCampaign({ chapters: [CH_A, CH_B], currentChapterId: CH_A.id }));
    expect(screen.getByTestId(`activate-chapter-${CH_B.id}`)).toHaveAttribute(
      'title',
      'Mark as current chapter'
    );
  });

  it('clicking activate button transfers active state to that chapter', async () => {
    const { user } = renderEditor(
      makeCampaign({ chapters: [CH_A, CH_B], currentChapterId: CH_A.id })
    );

    await user.click(screen.getByTestId(`activate-chapter-${CH_B.id}`));

    const display = screen.getByTestId('current-chapter-display');
    expect(display).toHaveTextContent(CH_B.title);
    expect(screen.getByTestId(`active-chapter-indicator-${CH_B.id}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`active-chapter-indicator-${CH_A.id}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`activate-chapter-${CH_A.id}`)).toBeInTheDocument();
  });

  it('activate button is not disabled in default (non-saving) state', () => {
    renderEditor(makeCampaign({ chapters: [CH_A, CH_B], currentChapterId: CH_A.id }));
    expect(screen.getByTestId(`activate-chapter-${CH_B.id}`)).not.toBeDisabled();
  });
});

describe('CampaignEditor — existing functionality (regression)', () => {
  it('move up/down buttons are still present', () => {
    renderEditor(makeCampaign({ chapters: [CH_A, CH_B] }));
    expect(screen.getByTestId('move-up-1')).toBeInTheDocument();
    expect(screen.getByTestId('move-down-0')).toBeInTheDocument();
  });

  it('removing the active chapter clears the display to placeholder', async () => {
    const { user } = renderEditor(
      makeCampaign({ chapters: [CH_A, CH_B], currentChapterId: CH_A.id })
    );

    await user.click(screen.getByTestId('remove-chapter-0'));

    const display = screen.getByTestId('current-chapter-display');
    expect(display).toHaveTextContent('-- No active chapter --');
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { CampaignEditor } from '@/app/campaigns/CampaignEditor';
import type { Campaign } from '@/lib/types';

let mockIsDragging = false;

jest.mock('@dnd-kit/core', () => {
  const original = jest.requireActual('@dnd-kit/core');
  return {
    ...original,
    DndContext: ({ children, onDragEnd }: any) => (
      <div
        data-testid="mock-dnd-context"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onDragEnd?.({ active: { id: 'ch-1' }, over: { id: 'ch-3' } });
          }
        }}
      >
        {children}
      </div>
    ),
  };
});

jest.mock('@dnd-kit/sortable', () => {
  const original = jest.requireActual('@dnd-kit/sortable');
  return {
    ...original,
    SortableContext: ({ children }: any) => <>{children}</>,
    useSortable: ({ id }: any) => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => {},
      transform: null,
      transition: null,
      isDragging: mockIsDragging && id === 'ch-1',
    }),
  };
});

const BASE_CAMPAIGN: Campaign = {
  id: 'camp-1',
  userId: 'user-1',
  name: 'Test Campaign',
  moduleName: 'LMoP',
  chapters: [],
  status: 'planning',
  notes: '',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

function renderEditor(props: Partial<Parameters<typeof CampaignEditor>[0]> = {}) {
  const user = userEvent.setup();
  render(
    <CampaignEditor
      campaign={BASE_CAMPAIGN}
      onSave={jest.fn()}
      onCancel={jest.fn()}
      isNew={false}
      {...props}
    />
  );
  return { user };
}

async function openChapters(user: UserEvent) {
  if (!screen.queryByText('+ Add Chapter')) {
    await user.click(screen.getByRole('button', { name: /chapters/i }));
  }
}

const CHAPTER_PAIR = [
  { id: 'ch-1', title: 'Arrival', order: 0 },
  { id: 'ch-2', title: 'The Inn', order: 1 },
];

const CHAPTER_TRIO = [
  { id: 'ch-1', title: 'Arrival', order: 0 },
  { id: 'ch-2', title: 'The Inn', order: 1 },
  { id: 'ch-3', title: 'The Dungeon', order: 2 },
];

// ---------------------------------------------------------------------------

describe('CampaignEditor', () => {
  describe('rendering', () => {
    it('shows "Create Campaign" title when isNew', () => {
      renderEditor({ isNew: true });
      expect(screen.getByRole('heading', { level: 2, name: 'Create Campaign' })).toBeInTheDocument();
    });

    it('shows "Edit Campaign" title when not isNew', () => {
      renderEditor({ isNew: false });
      expect(screen.getByRole('heading', { level: 2, name: 'Edit Campaign' })).toBeInTheDocument();
    });

    it('populates name input from campaign', () => {
      renderEditor();
      expect(screen.getByLabelText('Campaign Name *')).toHaveValue('Test Campaign');
    });

    it('populates moduleName input from campaign', () => {
      renderEditor();
      expect(screen.getByLabelText('Module / Adventure')).toHaveValue('LMoP');
    });

    it('renders status dropdown with current value selected', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, status: 'on-hold' } });
      expect(screen.getByTestId('status-select')).toHaveValue('on-hold');
    });

    it('renders notes textarea with current value', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, notes: 'Party at level 5' } });
      expect(screen.getByTestId('notes-textarea')).toHaveValue('Party at level 5');
    });

    it('notes textarea has maxLength of 10000', () => {
      renderEditor();
      expect((screen.getByTestId('notes-textarea') as HTMLTextAreaElement).maxLength).toBe(10000);
    });

    it('renders character counter showing length/10000', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, notes: 'Hello' } });
      expect(screen.getByText('5/10000')).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('save button is disabled when name is empty', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, name: '' } });
      expect(screen.getByRole('button', { name: 'Save Campaign' })).toBeDisabled();
    });

    it('save button is enabled when name has content', () => {
      renderEditor();
      expect(screen.getByRole('button', { name: 'Save Campaign' })).not.toBeDisabled();
    });
  });

  describe('saving', () => {
    it('calls onSave with trimmed name', async () => {
      const onSave = jest.fn();
      const { user } = renderEditor({ onSave });
      await user.click(screen.getByRole('button', { name: 'Save Campaign' }));
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Campaign' }));
    });

    it('calls onSave with trimmed moduleName', async () => {
      const onSave = jest.fn();
      const { user } = renderEditor({ campaign: { ...BASE_CAMPAIGN, moduleName: '  DH  ' }, onSave });
      await user.click(screen.getByRole('button', { name: 'Save Campaign' }));
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ moduleName: 'DH' }));
    });

    it.each(['completed', 'on-hold'] as const)(
      'calls onSave with status %s when dropdown changes',
      async (status) => {
        const onSave = jest.fn();
        const { user } = renderEditor({ onSave });
        await user.selectOptions(screen.getByTestId('status-select'), status);
        await user.click(screen.getByRole('button', { name: 'Save Campaign' }));
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ status }));
      },
    );
  });

  describe('cancel', () => {
    it('calls onCancel when Cancel button clicked', async () => {
      const onCancel = jest.fn();
      const { user } = renderEditor({ onCancel });
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('legacy fields removed', () => {
    it('does not render currentChapter input', () => {
      renderEditor();
      expect(screen.queryByText(/Current Chapter/)).not.toBeInTheDocument();
    });

    it('does not render currentChapterOrder input', () => {
      renderEditor();
      expect(screen.queryByText(/Chapter Order/)).not.toBeInTheDocument();
    });
  });

  describe('chapters display', () => {
    it('renders chapter list when chapters present', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_TRIO } });
      expect(screen.getByDisplayValue('Arrival')).toBeInTheDocument();
      expect(screen.getByDisplayValue('The Inn')).toBeInTheDocument();
      expect(screen.getByDisplayValue('The Dungeon')).toBeInTheDocument();
    });

    it('renders drag handles and does not render move up/down buttons', async () => {
      const { user } = renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_TRIO } });
      await openChapters(user);

      // Verify drag handles are present
      expect(screen.getByTestId('drag-handle-0')).toBeInTheDocument();
      expect(screen.getByTestId('drag-handle-1')).toBeInTheDocument();
      expect(screen.getByTestId('drag-handle-2')).toBeInTheDocument();

      // Verify move buttons are absent
      expect(screen.queryByTestId('move-up-0')).not.toBeInTheDocument();
      expect(screen.queryByTestId('move-up-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('move-up-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('move-down-0')).not.toBeInTheDocument();
      expect(screen.queryByTestId('move-down-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('move-down-2')).not.toBeInTheDocument();
    });

    it('save with no chapters calls onSave with chapters: []', async () => {
      const onSave = jest.fn();
      const { user } = renderEditor({ onSave });
      await user.click(screen.getByRole('button', { name: 'Save Campaign' }));
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ chapters: [] }));
    });
  });

  describe('chapters editing', () => {
    it('toggles chapters editing section when accordion button is clicked', async () => {
      const { user } = renderEditor();
      expect(screen.queryByText('+ Add Chapter')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /chapters/i }));
      expect(screen.getByText('+ Add Chapter')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /chapters/i }));
      expect(screen.queryByText('+ Add Chapter')).not.toBeInTheDocument();
    });

    it('adds a new chapter row when "+ Add Chapter" is clicked', async () => {
      const { user } = renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: [] } });

      await openChapters(user);

      expect(screen.getByText('No chapters defined')).toBeInTheDocument();

      await user.click(screen.getByText('+ Add Chapter'));

      const inputs = screen.getAllByTestId('chapter-title-input');
      expect(inputs.length).toBe(1);
      expect(inputs[0]).toHaveValue('');
      expect(screen.queryByText('No chapters defined')).not.toBeInTheDocument();
      expect(screen.getByTestId('current-chapter-display')).toBeInTheDocument();
    });

    it('removes a chapter, shifts subsequent ones, and clears active chapter if deleted', async () => {
      const onSave = jest.fn();
      const { user } = renderEditor({
        campaign: { ...BASE_CAMPAIGN, currentChapterId: 'ch-2', chapters: CHAPTER_TRIO },
        onSave,
      });

      await openChapters(user);

      await user.click(screen.getByTestId('remove-chapter-1'));

      const inputs = screen.getAllByTestId('chapter-title-input');
      expect(inputs.length).toBe(2);
      expect(inputs[0]).toHaveValue('Arrival');
      expect(inputs[1]).toHaveValue('The Dungeon');

      await user.click(screen.getByRole('button', { name: 'Save Campaign' }));
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          chapters: [
            { id: 'ch-1', title: 'Arrival', order: 0 },
            { id: 'ch-3', title: 'The Dungeon', order: 1 },
          ],
          currentChapterId: undefined,
        })
      );
    });    it('handles drag end to reorder chapters', async () => {
      mockIsDragging = true;
      try {
        const onSave = jest.fn();
        const { user } = renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_TRIO }, onSave });
        await openChapters(user);

        // Trigger the mock DndContext's onClick which calls onDragEnd
        await user.click(screen.getByTestId('mock-dnd-context'));

        // Save to verify order is updated: 'ch-1' (Arrival) is moved after 'ch-3' (The Dungeon)
        // Original order: 'ch-1' (0), 'ch-2' (1), 'ch-3' (2)
        // After moving 'ch-1' over 'ch-3': 'ch-2' (0), 'ch-3' (1), 'ch-1' (2)
        await user.click(screen.getByRole('button', { name: 'Save Campaign' }));
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            chapters: [
              { id: 'ch-2', title: 'The Inn', order: 0 },
              { id: 'ch-3', title: 'The Dungeon', order: 1 },
              { id: 'ch-1', title: 'Arrival', order: 2 },
            ],
          })
        );
      } finally {
        mockIsDragging = false;
      }
    });

    it('updates chapter title correctly when typing in the input field', async () => {
      const { user } = renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: [{ id: 'ch-1', title: 'Arrival', order: 0 }] } });

      await openChapters(user);

      const input = screen.getByTestId('chapter-title-input');
      expect(input).toHaveValue('Arrival');

      await user.clear(input);
      await user.type(input, 'New Arrival');
      expect(input).toHaveValue('New Arrival');
    });

    it('sets currentChapterId to undefined when active chapter is removed', async () => {
      const onSave = jest.fn();
      const { user } = renderEditor({
        campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_PAIR, currentChapterId: 'ch-2' },
        onSave,
      });

      await openChapters(user);

      const removeBtn = screen.getByTestId('remove-chapter-1');
      expect(removeBtn).toBeInTheDocument();

      await user.click(removeBtn);

      await user.click(screen.getByRole('button', { name: 'Save Campaign' }));
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ currentChapterId: undefined }));
    });
  });

  // ---------------------------------------------------------------------------
  // Chapter active indicator tests (campaign-chapter-active-indicator)
  // ---------------------------------------------------------------------------

  describe('current chapter display block', () => {
    it('shows active chapter name in display block', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_PAIR, currentChapterId: 'ch-1' } });
      const display = screen.getByTestId('current-chapter-display');
      expect(display).toHaveTextContent('Ch. 1:');
      expect(display).toHaveTextContent('Arrival');
    });

    it('shows placeholder when no active chapter is set', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_PAIR, currentChapterId: undefined } });
      expect(screen.getByTestId('current-chapter-display')).toHaveTextContent('-- No active chapter --');
    });

    it('display block is absent when no chapters exist (accordion open)', async () => {
      const { user } = renderEditor();
      // Open accordion first to test the zero-chapters branch, not the collapsed state.
      await user.click(screen.getByRole('button', { name: /chapters/i }));
      expect(screen.queryByTestId('current-chapter-display')).not.toBeInTheDocument();
      expect(screen.getByText('No chapters defined')).toBeInTheDocument();
    });

    it('does not render the old select element', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_PAIR } });
      expect(screen.queryByTestId('current-chapter-select')).not.toBeInTheDocument();
    });
  });

  describe('ACTIVE pill', () => {
    it('shows ACTIVE pill on the active chapter row', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_PAIR, currentChapterId: 'ch-1' } });
      expect(screen.getByTestId('active-chapter-indicator-ch-1')).toBeInTheDocument();
    });

    it('does not show ACTIVE pill on inactive chapter rows', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_PAIR, currentChapterId: 'ch-1' } });
      expect(screen.queryByTestId('active-chapter-indicator-ch-2')).not.toBeInTheDocument();
    });

    it('shows no ACTIVE pill when currentChapterId is unset', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_PAIR, currentChapterId: undefined } });
      expect(screen.queryByTestId('active-chapter-indicator-ch-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('active-chapter-indicator-ch-2')).not.toBeInTheDocument();
    });
  });

  describe('activate button', () => {
    it('shows activate button on inactive rows', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_PAIR, currentChapterId: 'ch-1' } });
      expect(screen.getByTestId('activate-chapter-ch-2')).toBeInTheDocument();
    });

    it('does not show activate button on the active row', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_PAIR, currentChapterId: 'ch-1' } });
      expect(screen.queryByTestId('activate-chapter-ch-1')).not.toBeInTheDocument();
    });

    it('activate button has correct tooltip and aria-label', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_PAIR, currentChapterId: 'ch-1' } });
      const btn = screen.getByTestId('activate-chapter-ch-2');
      expect(btn).toHaveAttribute('title', 'Mark as current chapter');
      expect(btn).toHaveAttribute('aria-label', 'Mark as current chapter');
    });

    it('clicking activate button transfers active state to that chapter', async () => {
      const { user } = renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_PAIR, currentChapterId: 'ch-1' } });

      await user.click(screen.getByTestId('activate-chapter-ch-2'));

      expect(screen.getByTestId('current-chapter-display')).toHaveTextContent('The Inn');
      expect(screen.getByTestId('active-chapter-indicator-ch-2')).toBeInTheDocument();
      expect(screen.queryByTestId('active-chapter-indicator-ch-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('activate-chapter-ch-1')).toBeInTheDocument();
    });

    it('clicking activate button and saving sends updated currentChapterId', async () => {
      const onSave = jest.fn();
      const { user } = renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_PAIR, currentChapterId: 'ch-1' }, onSave });

      await user.click(screen.getByTestId('activate-chapter-ch-2'));
      await user.click(screen.getByRole('button', { name: 'Save Campaign' }));

      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ currentChapterId: 'ch-2' }));
    });

    it('activate button is not disabled in default (non-saving) state', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_PAIR, currentChapterId: 'ch-1' } });
      expect(screen.getByTestId('activate-chapter-ch-2')).not.toBeDisabled();
    });

    it('ACTIVE indicator is a button with clear-active-chapter aria-label', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_PAIR, currentChapterId: 'ch-1' } });
      const btn = screen.getByTestId('active-chapter-indicator-ch-1');
      expect(btn.tagName).toBe('BUTTON');
      expect(btn).toHaveAttribute('aria-label', 'Clear active chapter');
    });

    it('clicking ACTIVE indicator clears the active chapter', async () => {
      const { user } = renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_PAIR, currentChapterId: 'ch-1' } });

      await user.click(screen.getByTestId('active-chapter-indicator-ch-1'));

      expect(screen.getByTestId('current-chapter-display')).toHaveTextContent('-- No active chapter --');
      expect(screen.queryByTestId('active-chapter-indicator-ch-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('activate-chapter-ch-1')).toBeInTheDocument();
    });

    it('clicking ACTIVE indicator and saving sends currentChapterId: undefined', async () => {
      const onSave = jest.fn();
      const { user } = renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_PAIR, currentChapterId: 'ch-1' }, onSave });

      await user.click(screen.getByTestId('active-chapter-indicator-ch-1'));
      await user.click(screen.getByRole('button', { name: 'Save Campaign' }));

      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ currentChapterId: undefined }));
    });
  });
});

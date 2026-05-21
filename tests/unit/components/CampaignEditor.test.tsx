/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';
import { CampaignEditor } from '@/app/campaigns/CampaignEditor';
import type { Campaign } from '@/lib/types';

let container: HTMLDivElement;
let root: Root;

const BASE_CAMPAIGN: Campaign = {
  id: 'camp-1',
  userId: 'user-1',
  name: 'Test Campaign',
  moduleName: 'LMoP',
  currentChapter: 'Chapter 1',
  currentChapterOrder: 1,
  active: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => { root?.unmount(); });
  container.remove();
  jest.clearAllMocks();
});

function render(props: { campaign: Campaign; onSave: (...args: any[]) => any; onCancel: (...args: any[]) => any; isNew: boolean }) {
  act(() => {
    root = createRoot(container);
    root.render(<CampaignEditor {...props} />);
  });
}

function findButton(text: string): HTMLButtonElement {
  return Array.from(container.querySelectorAll('button')).find(
    b => b.textContent?.trim().includes(text),
  ) as HTMLButtonElement;
}

function getInput(type: string, index = 0): HTMLInputElement {
  return container.querySelectorAll<HTMLInputElement>(`input[type="${type}"]`)[index];
}

// ---------------------------------------------------------------------------

describe('CampaignEditor', () => {
  describe('rendering', () => {
    it('shows "Create Campaign" title when isNew', () => {
      render({ campaign: BASE_CAMPAIGN, onSave: jest.fn(), onCancel: jest.fn(), isNew: true });
      expect(container.querySelector('h2')?.textContent).toBe('Create Campaign');
    });

    it('shows "Edit Campaign" title when not isNew', () => {
      render({ campaign: BASE_CAMPAIGN, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      expect(container.querySelector('h2')?.textContent).toBe('Edit Campaign');
    });

    it('populates name input from campaign', () => {
      render({ campaign: BASE_CAMPAIGN, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      const inputs = container.querySelectorAll<HTMLInputElement>('input[type="text"]');
      expect(inputs[0].value).toBe('Test Campaign');
    });

    it('populates moduleName input from campaign', () => {
      render({ campaign: BASE_CAMPAIGN, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      const inputs = container.querySelectorAll<HTMLInputElement>('input[type="text"]');
      expect(inputs[1].value).toBe('LMoP');
    });

    it('renders active checkbox unchecked when campaign.active is false', () => {
      render({ campaign: BASE_CAMPAIGN, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      expect(getInput('checkbox').checked).toBe(false);
    });

    it('renders active checkbox checked when campaign.active is true', () => {
      render({ campaign: { ...BASE_CAMPAIGN, active: true }, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      expect(getInput('checkbox').checked).toBe(true);
    });
  });

  describe('validation', () => {
    it('save button is disabled when name is empty', () => {
      render({ campaign: { ...BASE_CAMPAIGN, name: '' }, onSave: jest.fn(), onCancel: jest.fn(), isNew: true });
      expect(findButton('Save Campaign').disabled).toBe(true);
    });

    it('save button is enabled when name has content', () => {
      render({ campaign: BASE_CAMPAIGN, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      expect(findButton('Save Campaign').disabled).toBe(false);
    });
  });

  describe('saving', () => {
    it('calls onSave with trimmed name', async () => {
      const onSave = jest.fn() as any;
      render({ campaign: BASE_CAMPAIGN, onSave, onCancel: jest.fn(), isNew: false });
      await act(async () => { findButton('Save Campaign').click(); });
      expect(onSave).toHaveBeenCalledTimes(1);
      expect((onSave.mock.calls[0][0] as Campaign).name).toBe('Test Campaign');
    });

    it('calls onSave with trimmed moduleName', async () => {
      const onSave = jest.fn() as any;
      render({ campaign: { ...BASE_CAMPAIGN, moduleName: '  DH  ' }, onSave, onCancel: jest.fn(), isNew: false });
      await act(async () => { findButton('Save Campaign').click(); });
      expect((onSave.mock.calls[0][0] as Campaign).moduleName).toBe('DH');
    });

    it('calls onSave with active value from checkbox', async () => {
      const onSave = jest.fn() as any;
      render({ campaign: BASE_CAMPAIGN, onSave, onCancel: jest.fn(), isNew: false });
      act(() => {
        getInput('checkbox').click();
      });
      await act(async () => { findButton('Save Campaign').click(); });
      expect((onSave.mock.calls[0][0] as Campaign).active).toBe(true);
    });
  });

  describe('cancel', () => {
    it('calls onCancel when Cancel button clicked', () => {
      const onCancel = jest.fn();
      render({ campaign: BASE_CAMPAIGN, onSave: jest.fn(), onCancel, isNew: false });
      act(() => { findButton('Cancel').click(); });
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});

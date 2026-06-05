jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) =>
    React.createElement('a', { href, ...rest }, children),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/lib/components/Modal';

beforeEach(() => localStorage.clear());

describe('Modal', () => {
  it('children rendered when isOpen: true', () => {
    render(
      <Modal isOpen={true} title="Test" onClose={jest.fn()}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('title visible when title prop provided and isOpen: true', () => {
    render(
      <Modal isOpen={true} title="My Modal Title" onClose={jest.fn()}>
        <p>content</p>
      </Modal>
    );
    expect(screen.getByText('My Modal Title')).toBeInTheDocument();
  });

  it('close button click calls onClose once', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} title="Test" onClose={onClose}>
        <p>content</p>
      </Modal>
    );
    await user.click(screen.getByRole('button', { name: /close modal/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('content NOT in DOM when isOpen: false', () => {
    render(
      <Modal isOpen={false} title="Test" onClose={jest.fn()}>
        <p>Hidden content</p>
      </Modal>
    );
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });
});

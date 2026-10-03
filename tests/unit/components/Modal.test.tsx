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

  it('defaults title id and aria-labelledby to modal-title', () => {
    render(
      <Modal isOpen={true} title="Test" onClose={jest.fn()}>
        <p>content</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(screen.getByText('Test')).toHaveAttribute('id', 'modal-title');
  });

  it('applies a custom titleId to the title and aria-labelledby', () => {
    render(
      <Modal isOpen={true} title="Test" titleId="custom-title" onClose={jest.fn()}>
        <p>content</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'custom-title');
    expect(screen.getByText('Test')).toHaveAttribute('id', 'custom-title');
  });

  it('close button is tabbable by default', () => {
    render(
      <Modal isOpen={true} title="Test" onClose={jest.fn()}>
        <p>content</p>
      </Modal>
    );
    expect(screen.getByRole('button', { name: /close modal/i })).not.toHaveAttribute('tabindex', '-1');
  });

  it('closeButtonTabbable={false} sets tabindex -1 and click still calls onClose once', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} title="Test" onClose={onClose} closeButtonTabbable={false}>
        <p>content</p>
      </Modal>
    );
    const close = screen.getByRole('button', { name: /close modal/i });
    expect(close).toHaveAttribute('tabindex', '-1');
    await user.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape closes only the topmost of stacked modals', async () => {
    const outer = jest.fn();
    const inner = jest.fn();
    render(
      <>
        <Modal isOpen title="Outer" titleId="outer" onClose={outer}><p>o</p></Modal>
        <Modal isOpen title="Inner" titleId="inner" onClose={inner}><p>i</p></Modal>
      </>
    );
    await userEvent.keyboard('{Escape}');
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  it('trapFocus wraps Tab and restores focus to the opener on close', async () => {
    function Harness() {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>opener</button>
          <Modal isOpen={open} title="T" onClose={() => setOpen(false)} trapFocus closeButtonTabbable={false}>
            <button>first</button>
            <button>last</button>
          </Modal>
        </>
      );
    }
    render(<Harness />);
    const opener = screen.getByText('opener');
    await userEvent.click(opener);
    expect(screen.getByText('first')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByText('last')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByText('first')).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(screen.getByText('last')).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(opener).toHaveFocus();
  });
});

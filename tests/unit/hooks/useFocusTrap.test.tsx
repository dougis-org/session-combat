import React, { useRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

function Trap({
  active = true,
  focusKey,
  children,
}: {
  active?: boolean;
  focusKey?: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, active, focusKey);
  return (
    <div ref={ref} data-testid="trap">
      {children}
    </div>
  );
}

const Controls = () => (
  <>
    <button disabled>disabled</button>
    <button tabIndex={-1}>skipped</button>
    <button>first</button>
    <input aria-label="middle" />
    <button>last</button>
  </>
);

describe('useFocusTrap', () => {
  it('focuses the first tabbable descendant, skipping disabled and tabindex=-1', () => {
    render(<Trap><Controls /></Trap>);
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
  });

  it('falls back to the container when there are no tabbable descendants', () => {
    render(<Trap><span>text</span></Trap>);
    const trap = screen.getByTestId('trap');
    expect(trap).toHaveFocus();
    expect(trap).toHaveAttribute('tabindex', '-1');
  });

  it('wraps Tab from last to first and Shift+Tab from first to last', async () => {
    const user = userEvent.setup();
    render(<><button>outside</button><Trap><Controls /></Trap></>);
    const first = screen.getByRole('button', { name: 'first' });
    const last = screen.getByRole('button', { name: 'last' });

    last.focus();
    await user.tab();
    expect(first).toHaveFocus();

    await user.tab({ shift: true });
    expect(last).toHaveFocus();
  });

  it('restores focus to the previously focused element on deactivation', () => {
    function Host({ active }: { active: boolean }) {
      return (
        <>
          <button>opener</button>
          <Trap active={active}><Controls /></Trap>
        </>
      );
    }
    const { rerender } = render(<Host active={false} />);
    const opener = screen.getByRole('button', { name: 'opener' });
    opener.focus();

    rerender(<Host active />);
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();

    rerender(<Host active={false} />);
    expect(opener).toHaveFocus();
  });

  it('does not throw when the previously focused element was removed', () => {
    function Host({ active, showOpener }: { active: boolean; showOpener: boolean }) {
      return (
        <>
          {showOpener && <button>opener</button>}
          <Trap active={active}><Controls /></Trap>
        </>
      );
    }
    const { rerender } = render(<Host active={false} showOpener />);
    screen.getByRole('button', { name: 'opener' }).focus();
    rerender(<Host active showOpener />);
    rerender(<Host active showOpener={false} />);
    expect(() => rerender(<Host active={false} showOpener={false} />)).not.toThrow();
  });

  it('re-focuses the first control when the key changes without restoring focus in between', () => {
    const restoreSpy = jest.fn();
    function Host({ k }: { k: string }) {
      return (
        <>
          <button onFocus={restoreSpy}>opener</button>
          <Trap focusKey={k}><Controls /></Trap>
        </>
      );
    }
    const { rerender } = render(<Host k="a" />);
    screen.getByRole('button', { name: 'last' }).focus();

    rerender(<Host k="b" />);
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
    expect(restoreSpy).not.toHaveBeenCalled();
  });

  it('does nothing while inactive', async () => {
    const user = userEvent.setup();
    render(<><button>outside</button><Trap active={false}><Controls /></Trap></>);
    expect(document.body).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'outside' })).toHaveFocus();
  });

  it('does not intercept Escape', async () => {
    const user = userEvent.setup();
    const onKeyDown = jest.fn((e: KeyboardEvent) => e.defaultPrevented);
    document.addEventListener('keydown', onKeyDown);
    render(<Trap><Controls /></Trap>);
    await user.keyboard('{Escape}');
    document.removeEventListener('keydown', onKeyDown);
    expect(onKeyDown).toHaveBeenCalled();
    expect(onKeyDown.mock.results[0].value).toBe(false);
  });
});

import React, { useLayoutEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';
import {
  useInitiativeModal,
  type UseInitiativeModalResult,
} from '@/lib/hooks/useInitiativeModal';

let container: HTMLDivElement;
let root: Root;
let result: UseInitiativeModalResult;

function Harness({ onResult }: { onResult: (r: UseInitiativeModalResult) => void }) {
  const hook = useInitiativeModal({ combatState: null, setInitiativeRoll: jest.fn() });
  useLayoutEffect(() => { onResult(hook); });
  // eslint-disable-next-line react-hooks/refs -- test harness attaches the hook-owned ref to a real node
  return <div ref={hook.initiativeModalRef} data-testid="modal" />;
}

const renderHarness = () =>
  act(() => { root = createRoot(container); root.render(<Harness onResult={(r) => { result = r; }} />); });

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
  Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
});

afterEach(() => {
  act(() => { root?.unmount(); });
  container.remove();
});

function mockModalHeight(el: HTMLElement, height: { current: number }) {
  el.getBoundingClientRect = () =>
    ({ width: 400, height: height.current, top: 0, left: 0, right: 400, bottom: height.current }) as DOMRect;
}

describe('useInitiativeModal — remeasureInitiativeModal (#802)', () => {
  test('moves the modal up when it grows past the viewport bottom', () => {
    renderHarness();
    const el = container.querySelector('[data-testid="modal"]') as HTMLElement;
    const height = { current: 200 };
    mockModalHeight(el, height);

    act(() => { result.openInitiativeModal('c1', { top: 500, left: 100, width: 400 }); });
    expect(el.style.top).toBe('500px'); // 500 + 200 <= 800 - 16

    height.current = 400; // taller mode: bottom would be 900
    act(() => { result.remeasureInitiativeModal(); });
    expect(el.style.top).toBe('384px'); // 800 - 16 - 400
  });

  test('is a no-op with no modal mounted', () => {
    renderHarness();
    expect(() => act(() => { result.remeasureInitiativeModal(); })).not.toThrow();
  });
});

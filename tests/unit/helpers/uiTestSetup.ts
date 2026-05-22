import { act } from 'react';
import type { Root } from 'react-dom/client';

export interface UiTestContext {
  container: HTMLDivElement;
  root: Root | undefined;
}

export function setupUiTest(): UiTestContext {
  const ctx: UiTestContext = {
    container: null!,
    root: undefined,
  };
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    ctx.container = document.createElement('div');
    document.body.appendChild(ctx.container);
    originalFetch = global.fetch;
  });

  afterEach(() => {
    act(() => { ctx.root?.unmount(); });
    ctx.container.remove();
    global.fetch = originalFetch;
    ctx.root = undefined;
  });

  return ctx;
}

export async function clickButton(
  container: HTMLDivElement,
  predicate: (b: HTMLButtonElement) => boolean,
): Promise<void> {
  const btn = Array.from(container.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(predicate);
  if (btn) await act(async () => { btn.click(); });
}

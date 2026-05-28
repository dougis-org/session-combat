import { act } from 'react';
import type { Root } from 'react-dom/client';
import { Response as FetchResponse } from 'node-fetch';

export function jsonResponse(body: unknown, status = 200): Response {
  return new FetchResponse(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Response;
}

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

export function mockFetch(body: unknown, status = 200): void {
  global.fetch = jest.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(jsonResponse(body, status))
  ) as jest.MockedFunction<typeof fetch>;
}

export async function clickButton(
  container: HTMLDivElement,
  predicate: (b: HTMLButtonElement) => boolean,
): Promise<void> {
  const btn = Array.from(container.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(predicate);
  if (btn) await act(async () => { btn.click(); });
}

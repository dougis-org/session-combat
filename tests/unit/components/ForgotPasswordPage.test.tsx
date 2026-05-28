/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { act } from 'react';
import { Root, createRoot } from 'react-dom/client';
import { Response as FetchResponse } from 'node-fetch';
import ForgotPasswordPage from '@/app/forgot-password/page';

function jsonResponse(body: unknown, status = 200): Response {
  return new FetchResponse(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Response;
}

let container: HTMLDivElement;
let root: Root;
let originalFetch: typeof global.fetch;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  originalFetch = global.fetch;
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  document.body.removeChild(container);
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

function render(ui: React.ReactElement) {
  act(() => {
    root.render(ui);
  });
}

function getInput(): HTMLInputElement {
  return container.querySelector('input[type="email"]') as HTMLInputElement;
}

function getButton(): HTMLButtonElement {
  return container.querySelector('button[type="submit"]') as HTMLButtonElement;
}

describe('ForgotPasswordPage', () => {
  it('renders email form with input and submit button', () => {
    render(React.createElement(ForgotPasswordPage));
    expect(container.querySelector('input[type="email"]')).toBeTruthy();
    expect(container.querySelector('button[type="submit"]')).toBeTruthy();
  });

  it('shows confirmation message after successful submission', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ message: 'ok' }, 200))
    ) as jest.MockedFunction<typeof fetch>;

    render(React.createElement(ForgotPasswordPage));

    const input = getInput();
    act(() => {
      Object.defineProperty(input, 'value', { writable: true, value: 'user@example.com' });
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await act(async () => {
      const form = container.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(container.textContent).toContain('Check your email');
    expect(container.querySelector('form')).toBeNull();
  });

  it('shows rate-limit message when API returns 429', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ error: 'rate limited' }, 429))
    ) as jest.MockedFunction<typeof fetch>;

    render(React.createElement(ForgotPasswordPage));

    await act(async () => {
      const form = container.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(container.textContent).toContain('Too many requests');
    expect(container.querySelector('form')).toBeTruthy();
  });

  it('shows inline error when API returns 400', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ error: 'Invalid email format' }, 400))
    ) as jest.MockedFunction<typeof fetch>;

    render(React.createElement(ForgotPasswordPage));

    await act(async () => {
      const form = container.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(container.textContent).toContain('Invalid email format');
    expect(container.querySelector('form')).toBeTruthy();
  });

  it('shows generic error banner when API returns 500', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(new FetchResponse('', { status: 500 }) as unknown as Response)
    ) as jest.MockedFunction<typeof fetch>;

    render(React.createElement(ForgotPasswordPage));

    await act(async () => {
      const form = container.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(container.textContent).toContain('Something went wrong');
    expect(container.querySelector('form')).toBeTruthy();
  });

  it('disables submit button while request is in-flight', async () => {
    let resolveFetch!: (value: Response) => void;
    global.fetch = jest.fn(
      () => new Promise<Response>((resolve) => { resolveFetch = resolve; })
    ) as jest.MockedFunction<typeof fetch>;

    render(React.createElement(ForgotPasswordPage));

    act(() => {
      const form = container.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(getButton().disabled).toBe(true);

    await act(async () => {
      resolveFetch(jsonResponse({ message: 'ok' }));
    });
  });
});

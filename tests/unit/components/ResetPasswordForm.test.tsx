/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { act } from 'react';
import { Root, createRoot } from 'react-dom/client';
import { Response as FetchResponse } from 'node-fetch';
import ResetPasswordForm from '@/app/reset-password/ResetPasswordForm';

function jsonResponse(body: unknown, status = 200): Response {
  return new FetchResponse(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Response;
}

const TOKEN = 'test-token-abc123';

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

function render(token = TOKEN) {
  act(() => {
    root.render(React.createElement(ResetPasswordForm, { token }));
  });
}

function getPasswordInput(): HTMLInputElement {
  return container.querySelector('#password') as HTMLInputElement;
}

function getConfirmInput(): HTMLInputElement {
  return container.querySelector('#confirm-password') as HTMLInputElement;
}

function getButton(): HTMLButtonElement {
  return container.querySelector('button[type="submit"]') as HTMLButtonElement;
}

function setInputValue(input: HTMLInputElement, value: string) {
  Object.defineProperty(input, 'value', { writable: true, value });
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

async function submitWithPasswords(password: string, confirm: string) {
  act(() => {
    setInputValue(getPasswordInput(), password);
    setInputValue(getConfirmInput(), confirm);
  });
  await act(async () => {
    const form = container.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
}

describe('ResetPasswordForm', () => {
  it('renders new-password form with password and confirm fields', () => {
    render();
    expect(getPasswordInput()).toBeTruthy();
    expect(getConfirmInput()).toBeTruthy();
    expect(getButton()).toBeTruthy();
  });

  it('shows "Passwords do not match" error before submit when passwords differ', async () => {
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    render();

    await submitWithPasswords('StrongPass1!', 'DifferentPass1!');

    expect(container.textContent).toContain('Passwords do not match');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(container.querySelector('form')).toBeTruthy();
  });

  it('shows success state with login link on 200 response', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ message: 'ok' }, 200))
    ) as jest.MockedFunction<typeof fetch>;

    render();
    await submitWithPasswords('StrongPass1!', 'StrongPass1!');

    expect(container.textContent).toContain('Password reset successfully');
    expect(container.textContent).toContain('log in');
    expect(container.querySelector('form')).toBeNull();
    const loginLink = container.querySelector('a[href="/login"]');
    expect(loginLink).toBeTruthy();
  });

  it('shows invalid/expired token message with link to forgot-password on 400 without details', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ error: 'Token invalid or expired' }, 400))
    ) as jest.MockedFunction<typeof fetch>;

    render();
    await submitWithPasswords('StrongPass1!', 'StrongPass1!');

    expect(container.textContent).toContain('invalid or has expired');
    const link = container.querySelector('a[href="/forgot-password"]');
    expect(link).toBeTruthy();
    expect(container.querySelector('form')).toBeNull();
  });

  it('shows inline validation details on 400 with details array (weak password)', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(
        jsonResponse({ error: 'Weak password', details: ['Too short', 'Needs uppercase'] }, 400)
      )
    ) as jest.MockedFunction<typeof fetch>;

    render();
    await submitWithPasswords('weak', 'weak');

    expect(container.textContent).toContain('Too short');
    expect(container.textContent).toContain('Needs uppercase');
    expect(container.querySelector('form')).toBeTruthy();
  });

  it('shows rate-limit message when API returns 429', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ error: 'rate limited' }, 429))
    ) as jest.MockedFunction<typeof fetch>;

    render();
    await submitWithPasswords('StrongPass1!', 'StrongPass1!');

    expect(container.textContent).toContain('Too many requests');
    expect(container.querySelector('form')).toBeTruthy();
  });

  it('disables submit button while request is in-flight', async () => {
    let resolveFetch!: (value: Response) => void;
    global.fetch = jest.fn(
      () => new Promise<Response>((resolve) => { resolveFetch = resolve; })
    ) as jest.MockedFunction<typeof fetch>;

    render();

    act(() => {
      setInputValue(getPasswordInput(), 'StrongPass1!');
      setInputValue(getConfirmInput(), 'StrongPass1!');
    });

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

/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { act } from 'react';
import { setupUiTest, renderComponent, mockFetch, mockPendingFetch, dispatchFormSubmit, jsonResponse } from '../helpers/uiTestSetup';
import ResetPasswordForm from '@/app/reset-password/ResetPasswordForm';

const TOKEN = 'test-token-abc123';
const ctx = setupUiTest();

function render(token = TOKEN) {
  renderComponent(ctx, React.createElement(ResetPasswordForm, { token }));
}

function setInputValue(input: HTMLInputElement, value: string) {
  Object.defineProperty(input, 'value', { writable: true, value });
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

async function submitWithPasswords(password: string, confirm: string) {
  act(() => {
    setInputValue(ctx.container.querySelector('#password') as HTMLInputElement, password);
    setInputValue(ctx.container.querySelector('#confirm-password') as HTMLInputElement, confirm);
  });
  await act(async () => { dispatchFormSubmit(ctx.container); });
}

describe('ResetPasswordForm', () => {
  it('renders new-password form with password and confirm fields', () => {
    render();
    expect(ctx.container.querySelector('#password')).toBeTruthy();
    expect(ctx.container.querySelector('#confirm-password')).toBeTruthy();
    expect(ctx.container.querySelector('button[type="submit"]')).toBeTruthy();
  });

  it('shows "Passwords do not match" error before submit when passwords differ', async () => {
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    render();

    await submitWithPasswords('StrongPass1!', 'DifferentPass1!');

    expect(ctx.container.textContent).toContain('Passwords do not match');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(ctx.container.querySelector('form')).toBeTruthy();
  });

  it('shows success state with login link on 200 response', async () => {
    mockFetch({ message: 'ok' });
    render();
    await submitWithPasswords('StrongPass1!', 'StrongPass1!');

    expect(ctx.container.textContent).toContain('Password reset successfully');
    expect(ctx.container.querySelector('a[href="/login"]')).toBeTruthy();
    expect(ctx.container.querySelector('form')).toBeNull();
  });

  it('shows invalid/expired token message with link to forgot-password on 400 without details', async () => {
    mockFetch({ error: 'Token invalid or expired' }, 400);
    render();
    await submitWithPasswords('StrongPass1!', 'StrongPass1!');

    expect(ctx.container.textContent).toContain('invalid or has expired');
    expect(ctx.container.querySelector('a[href="/forgot-password"]')).toBeTruthy();
    expect(ctx.container.querySelector('form')).toBeNull();
  });

  it('shows inline validation details on 400 with details array (weak password)', async () => {
    mockFetch({ error: 'Weak password', details: ['Too short', 'Needs uppercase'] }, 400);
    render();
    await submitWithPasswords('weak', 'weak');

    expect(ctx.container.textContent).toContain('Too short');
    expect(ctx.container.textContent).toContain('Needs uppercase');
    expect(ctx.container.querySelector('form')).toBeTruthy();
  });

  it('shows rate-limit message when API returns 429', async () => {
    mockFetch({ error: 'rate limited' }, 429);
    render();
    await submitWithPasswords('StrongPass1!', 'StrongPass1!');

    expect(ctx.container.textContent).toContain('Too many requests');
    expect(ctx.container.querySelector('form')).toBeTruthy();
  });

  it('disables submit button while request is in-flight', async () => {
    const resolveFetch = mockPendingFetch();
    render();

    act(() => {
      setInputValue(ctx.container.querySelector('#password') as HTMLInputElement, 'StrongPass1!');
      setInputValue(ctx.container.querySelector('#confirm-password') as HTMLInputElement, 'StrongPass1!');
    });
    act(() => { dispatchFormSubmit(ctx.container); });

    const btn = ctx.container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);

    await act(async () => { resolveFetch(jsonResponse({ message: 'ok' })); });
  });
});

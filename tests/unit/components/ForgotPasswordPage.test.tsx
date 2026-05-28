/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { jest, describe, it, expect } from '@jest/globals';
import React from 'react';
import { act } from 'react';
import { setupUiTest, renderComponent, mockFetch, mockPendingFetch, jsonResponse } from '../helpers/uiTestSetup';
import ForgotPasswordPage from '@/app/forgot-password/page';

const ctx = setupUiTest();

function render() {
  renderComponent(ctx, React.createElement(ForgotPasswordPage));
}

async function submitForm() {
  await act(async () => {
    const form = ctx.container.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
}

describe('ForgotPasswordPage', () => {
  it('renders email form with input and submit button', () => {
    render();
    expect(ctx.container.querySelector('input[type="email"]')).toBeTruthy();
    expect(ctx.container.querySelector('button[type="submit"]')).toBeTruthy();
  });

  it('shows confirmation message after successful submission', async () => {
    mockFetch({ message: 'ok' });
    render();
    await submitForm();
    expect(ctx.container.textContent).toContain('Check your email');
    expect(ctx.container.querySelector('form')).toBeNull();
  });

  it('shows inline error when API returns 400', async () => {
    mockFetch({ error: 'Invalid email format' }, 400);
    render();
    await submitForm();
    expect(ctx.container.textContent).toContain('Invalid email format');
    expect(ctx.container.querySelector('form')).toBeTruthy();
  });

  it('shows rate-limit message when API returns 429', async () => {
    mockFetch({ error: 'rate limited' }, 429);
    render();
    await submitForm();
    expect(ctx.container.textContent).toContain('Too many requests');
    expect(ctx.container.querySelector('form')).toBeTruthy();
  });

  it('shows generic error banner when API returns 500', async () => {
    mockFetch({}, 500);
    render();
    await submitForm();
    expect(ctx.container.textContent).toContain('Something went wrong');
    expect(ctx.container.querySelector('form')).toBeTruthy();
  });

  it('disables submit button while request is in-flight', async () => {
    const resolveFetch = mockPendingFetch();
    render();
    act(() => {
      const form = ctx.container.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    const btn = ctx.container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);

    await act(async () => { resolveFetch(jsonResponse({ message: 'ok' })); });
  });
});

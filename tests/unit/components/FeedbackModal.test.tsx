import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackModal } from '@/lib/components/FeedbackModal';
import { Response as FetchResponse } from 'node-fetch';

function jsonResponse(body: unknown, status = 200): Response {
  return new FetchResponse(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as Response;
}

describe('FeedbackModal', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders FeedbackForm when open', () => {
    render(<FeedbackModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByRole('button', { name: /bug report/i })).toBeInTheDocument();
  });

  it('does not render form content when closed', () => {
    render(<FeedbackModal isOpen={false} onClose={jest.fn()} />);
    expect(screen.queryByRole('button', { name: /bug report/i })).not.toBeInTheDocument();
  });

  it('shows success state after successful submission', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ issueUrl: 'https://github.com/issues/1' }, 201))
    ) as unknown as jest.MockedFunction<typeof fetch>;

    render(<FeedbackModal isOpen={true} onClose={jest.fn()} />);
    await user.type(screen.getByLabelText(/title/i), 'Test bug');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/thank you for your feedback/i)).toBeInTheDocument();
    });
    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ error: 'GitHub unavailable' }, 502))
    ) as unknown as jest.MockedFunction<typeof fetch>;

    render(<FeedbackModal isOpen={true} onClose={jest.fn()} />);
    await user.type(screen.getByLabelText(/title/i), 'Test bug');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/github unavailable/i)).toBeInTheDocument();
    });
  });

  it('calls onClose when Close clicked from success state', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    global.fetch = jest.fn(() =>
      Promise.resolve(jsonResponse({ issueUrl: 'https://github.com/issues/1' }, 201))
    ) as unknown as jest.MockedFunction<typeof fetch>;

    render(<FeedbackModal isOpen={true} onClose={onClose} />);
    await user.type(screen.getByLabelText(/title/i), 'Test bug');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => screen.getByText(/thank you for your feedback/i));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Cancel from form state', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<FeedbackModal isOpen={true} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { useToast, Toast } from '@/lib/components/Toast';

function ToastHarness() {
  const { toast, showToast } = useToast();
  return (
    <>
      <button onClick={() => showToast('Joined "Campaign"!', 'success')}>show-success</button>
      <button onClick={() => showToast('Something went wrong', 'error')}>show-error</button>
      <Toast toast={toast} />
    </>
  );
}

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders no toast initially', () => {
    render(<ToastHarness />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders success toast with correct message and styling', () => {
    render(<ToastHarness />);
    act(() => {
      screen.getByText('show-success').click();
    });
    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent('Joined "Campaign"!');
    expect(toast.className).toContain('bg-green-700');
  });

  it('renders error toast with error styling', () => {
    render(<ToastHarness />);
    act(() => {
      screen.getByText('show-error').click();
    });
    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent('Something went wrong');
    expect(toast.className).toContain('bg-red-700');
  });

  it('auto-dismisses after 3000ms', () => {
    render(<ToastHarness />);
    act(() => {
      screen.getByText('show-success').click();
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

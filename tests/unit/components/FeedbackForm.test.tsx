import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackForm } from '@/lib/components/FeedbackForm';

function renderForm(props: Partial<React.ComponentProps<typeof FeedbackForm>> = {}) {
  const onSubmit = jest.fn();
  const onCancel = jest.fn();
  render(<FeedbackForm onSubmit={onSubmit} onCancel={onCancel} {...props} />);
  return { onSubmit, onCancel };
}

describe('FeedbackForm', () => {
  it('renders with Bug Report selected by default', () => {
    renderForm();
    const bugBtn = screen.getByRole('button', { name: /bug report/i });
    const featureBtn = screen.getByRole('button', { name: /feature request/i });
    expect(bugBtn.className).toContain('bg-red-600');
    expect(featureBtn.className).not.toContain('bg-blue-600');
  });

  it('toggle switches to Feature Request', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: /feature request/i }));
    expect(screen.getByRole('button', { name: /feature request/i }).className).toContain('bg-blue-600');
    expect(screen.getByRole('button', { name: /bug report/i }).className).not.toContain('bg-red-600');
  });

  it('submit button is disabled when title is empty', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
  });

  it('submit button enabled when title is non-empty', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/title/i), 'Something broke');
    expect(screen.getByRole('button', { name: /submit/i })).not.toBeDisabled();
  });

  it('description enforces 2000 character limit', () => {
    renderForm();
    expect(screen.getByLabelText(/description/i)).toHaveAttribute('maxLength', '2000');
  });

  it('onSubmit called with correct data on submit', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();
    await user.click(screen.getByRole('button', { name: /feature request/i }));
    await user.type(screen.getByLabelText(/title/i), 'Add dark mode');
    await user.type(screen.getByLabelText(/description/i), 'Details here');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      type: 'feature',
      title: 'Add dark mode',
      description: 'Details here',
      pageUrl: expect.any(String),
    });
  });

  it('onCancel called when Cancel clicked', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('submit button disabled when isSubmitting is true', async () => {
    const user = userEvent.setup();
    renderForm({ isSubmitting: true });
    await user.type(screen.getByLabelText(/title/i), 'Something');
    expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();
  });
});

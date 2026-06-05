import React from 'react';
import { render as rtlRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ErrorBanner,
  ValidationError,
  LoadingState,
  FormField,
  EditorShell,
  textInputClass,
  TextInputField,
} from '@/lib/components/ui';

// ---------------------------------------------------------------------------

describe('ErrorBanner', () => {
  it('renders nothing when message is null', () => {
    const { container } = rtlRender(<ErrorBanner message={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders message text when provided', () => {
    rtlRender(<ErrorBanner message="Something went wrong" />);
    screen.getByText('Something went wrong');
  });
});

describe('ValidationError', () => {
  it('renders nothing when message is null', () => {
    const { container } = rtlRender(<ValidationError message={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders message text when provided', () => {
    rtlRender(<ValidationError message="Name is required" />);
    screen.getByText('Name is required');
  });
});

describe('LoadingState', () => {
  it('renders the label text', () => {
    rtlRender(<LoadingState label="Loading data..." />);
    screen.getByText('Loading data...');
  });
});

describe('FormField', () => {
  it('renders label text', () => {
    rtlRender(<FormField label="My Field"><input /></FormField>);
    screen.getByText('My Field');
  });

  it('sets htmlFor on label when provided', () => {
    rtlRender(<FormField label="Email" htmlFor="email-input"><input id="email-input" /></FormField>);
    screen.getByLabelText('Email');
  });

  it('renders children', () => {
    rtlRender(<FormField label="Name"><input data-testid="child-input" /></FormField>);
    screen.getByTestId('child-input');
  });
});

describe('EditorShell', () => {
  const defaultProps = {
    title: 'Test Editor',
    validationError: null,
    onSave: jest.fn(),
    onCancel: jest.fn(),
    saving: false,
    canSave: true,
    saveLabel: 'Save',
  };

  it('renders title', () => {
    rtlRender(<EditorShell {...defaultProps}><div /></EditorShell>);
    screen.getByRole('heading', { name: 'Test Editor' });
  });

  it('renders save button with saveLabel', () => {
    rtlRender(<EditorShell {...defaultProps}><div /></EditorShell>);
    screen.getByRole('button', { name: /save/i });
  });

  it('shows Saving... text when saving is true', () => {
    rtlRender(<EditorShell {...defaultProps} saving={true}><div /></EditorShell>);
    screen.getByRole('button', { name: /saving/i });
  });

  it('disables save button when saving', () => {
    rtlRender(<EditorShell {...defaultProps} saving={true}><div /></EditorShell>);
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('disables save button when canSave is false', () => {
    rtlRender(<EditorShell {...defaultProps} canSave={false}><div /></EditorShell>);
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('disables cancel button when saving', () => {
    rtlRender(<EditorShell {...defaultProps} saving={true}><div /></EditorShell>);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('renders validation error when provided', () => {
    rtlRender(<EditorShell {...defaultProps} validationError="Fix errors"><div /></EditorShell>);
    screen.getByText('Fix errors');
  });

  it('calls onSave when save button clicked', async () => {
    const onSave = jest.fn();
    const user = userEvent.setup();
    rtlRender(<EditorShell {...defaultProps} onSave={onSave}><div /></EditorShell>);
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();
    rtlRender(<EditorShell {...defaultProps} onCancel={onCancel}><div /></EditorShell>);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders children', () => {
    rtlRender(<EditorShell {...defaultProps}><span data-testid="child">content</span></EditorShell>);
    screen.getByTestId('child');
  });
});

describe('textInputClass', () => {
  it('returns expected CSS class string', () => {
    expect(textInputClass()).toBe('w-full bg-gray-700 rounded px-3 py-2 text-white');
  });
});

describe('TextInputField', () => {
  it('renders label text', () => {
    rtlRender(<TextInputField label="Username" value="" onChange={jest.fn()} />);
    screen.getByText('Username');
  });

  it('renders input with provided value', () => {
    rtlRender(<TextInputField label="Username" value="alice" onChange={jest.fn()} />);
    screen.getByDisplayValue('alice');
  });

  it('calls onChange when input changes', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    rtlRender(<TextInputField label="Username" value="" onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'bob');
    expect(onChange).toHaveBeenCalled();
  });

  it('disables input when disabled is true', () => {
    rtlRender(<TextInputField label="Username" value="" onChange={jest.fn()} disabled={true} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders placeholder text', () => {
    rtlRender(<TextInputField label="Username" value="" onChange={jest.fn()} placeholder="Enter username" />);
    screen.getByPlaceholderText('Enter username');
  });

  it('wires id to input and label htmlFor when provided', () => {
    rtlRender(<TextInputField id="my-field" label="My Field" value="" onChange={jest.fn()} />);
    screen.getByLabelText('My Field');
  });
});

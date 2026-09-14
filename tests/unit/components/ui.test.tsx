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
  Chevron,
  Disclosure,
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

describe('Chevron', () => {
  it('renders with no rotation class when expanded is false', () => {
    const { container } = rtlRender(<Chevron expanded={false} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).not.toHaveClass('rotate-90');
  });

  it('renders with a 90-degree rotation class when expanded is true', () => {
    const { container } = rtlRender(<Chevron expanded={true} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('rotate-90');
  });

  it('imports only ChevronRight from lucide-react', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.join(process.cwd(), 'lib/components/ui.tsx'), 'utf8');
    const lucideImportLines = source
      .split('\n')
      .filter((line: string) => line.includes("from 'lucide-react'"));
    expect(lucideImportLines).toHaveLength(1);
    expect(lucideImportLines[0]).toMatch(/^import\s*\{\s*ChevronRight\s*\}\s*from 'lucide-react';?$/);
  });
});

describe('Disclosure', () => {
  it('reflects open=true with aria-expanded="true" and a rotated chevron', () => {
    const { container } = rtlRender(
      <Disclosure label="Section" open={true} onToggle={jest.fn()} />
    );
    const button = screen.getByRole('button', { name: /section/i });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('svg')).toHaveClass('rotate-90');
  });

  it('reflects open=false with aria-expanded="false" and no rotation', () => {
    const { container } = rtlRender(
      <Disclosure label="Section" open={false} onToggle={jest.fn()} />
    );
    const button = screen.getByRole('button', { name: /section/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('svg')).not.toHaveClass('rotate-90');
  });

  it('calls onToggle exactly once on click without managing its own state', async () => {
    const onToggle = jest.fn();
    const user = userEvent.setup();
    rtlRender(<Disclosure label="Section" open={false} onToggle={onToggle} />);
    const button = screen.getByRole('button', { name: /section/i });
    await user.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});

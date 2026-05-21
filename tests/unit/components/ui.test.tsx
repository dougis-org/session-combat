/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

import React from 'react';
import { Root } from 'react-dom/client';
import { act } from 'react';
import { createReactRoot, unmountReactRoot } from '@/tests/unit/helpers/reactRoot';
import {
  ErrorBanner,
  ValidationError,
  LoadingState,
  FormField,
  EditorShell,
  textInputClass,
  TextInputField,
} from '@/lib/components/ui';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  ({ container, root } = createReactRoot());
});

afterEach(() => {
  unmountReactRoot(container, root);
});

function render(element: React.ReactElement) {
  act(() => { root.render(element); });
}

// ---------------------------------------------------------------------------

describe('ErrorBanner', () => {
  it('renders nothing when message is null', () => {
    render(<ErrorBanner message={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders message text when provided', () => {
    render(<ErrorBanner message="Something went wrong" />);
    expect(container.textContent).toContain('Something went wrong');
  });
});

describe('ValidationError', () => {
  it('renders nothing when message is null', () => {
    render(<ValidationError message={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders message text when provided', () => {
    render(<ValidationError message="Name is required" />);
    expect(container.textContent).toContain('Name is required');
  });
});

describe('LoadingState', () => {
  it('renders the label text', () => {
    render(<LoadingState label="Loading data..." />);
    expect(container.textContent).toContain('Loading data...');
  });
});

describe('FormField', () => {
  it('renders label text', () => {
    render(<FormField label="My Field"><input /></FormField>);
    expect(container.querySelector('label')?.textContent).toBe('My Field');
  });

  it('sets htmlFor on label when provided', () => {
    render(<FormField label="Email" htmlFor="email-input"><input id="email-input" /></FormField>);
    expect(container.querySelector('label')?.htmlFor).toBe('email-input');
  });

  it('renders children', () => {
    render(<FormField label="Name"><input data-testid="child-input" /></FormField>);
    expect(container.querySelector('[data-testid="child-input"]')).not.toBeNull();
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
    render(<EditorShell {...defaultProps}><div /></EditorShell>);
    expect(container.querySelector('h2')?.textContent).toBe('Test Editor');
  });

  it('renders save button with saveLabel', () => {
    render(<EditorShell {...defaultProps}><div /></EditorShell>);
    expect(container.querySelectorAll('button')[0].textContent).toBe('Save');
  });

  it('shows Saving... text when saving is true', () => {
    render(<EditorShell {...defaultProps} saving={true}><div /></EditorShell>);
    expect(container.querySelectorAll('button')[0].textContent).toBe('Saving...');
  });

  it('disables save button when saving', () => {
    render(<EditorShell {...defaultProps} saving={true}><div /></EditorShell>);
    expect((container.querySelectorAll('button')[0] as HTMLButtonElement).disabled).toBe(true);
  });

  it('disables save button when canSave is false', () => {
    render(<EditorShell {...defaultProps} canSave={false}><div /></EditorShell>);
    expect((container.querySelectorAll('button')[0] as HTMLButtonElement).disabled).toBe(true);
  });

  it('disables cancel button when saving', () => {
    render(<EditorShell {...defaultProps} saving={true}><div /></EditorShell>);
    expect((container.querySelectorAll('button')[1] as HTMLButtonElement).disabled).toBe(true);
  });

  it('renders validation error when provided', () => {
    render(<EditorShell {...defaultProps} validationError="Fix errors"><div /></EditorShell>);
    expect(container.textContent).toContain('Fix errors');
  });

  it('calls onSave when save button clicked', () => {
    const onSave = jest.fn();
    render(<EditorShell {...defaultProps} onSave={onSave}><div /></EditorShell>);
    act(() => { (container.querySelectorAll('button')[0] as HTMLButtonElement).click(); });
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = jest.fn();
    render(<EditorShell {...defaultProps} onCancel={onCancel}><div /></EditorShell>);
    act(() => { (container.querySelectorAll('button')[1] as HTMLButtonElement).click(); });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders children', () => {
    render(<EditorShell {...defaultProps}><span data-testid="child">content</span></EditorShell>);
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});

describe('textInputClass', () => {
  it('returns expected CSS class string', () => {
    expect(textInputClass()).toBe('w-full bg-gray-700 rounded px-3 py-2 text-white');
  });
});

describe('TextInputField', () => {
  it('renders label text', () => {
    render(<TextInputField label="Username" value="" onChange={jest.fn()} />);
    expect(container.querySelector('label')?.textContent).toBe('Username');
  });

  it('renders input with provided value', () => {
    render(<TextInputField label="Username" value="alice" onChange={jest.fn()} />);
    expect((container.querySelector('input') as HTMLInputElement)?.value).toBe('alice');
  });

  it('calls onChange when input changes', () => {
    const onChange = jest.fn();
    render(<TextInputField label="Username" value="" onChange={onChange} />);
    const input = container.querySelector('input') as HTMLInputElement;
    act(() => {
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      nativeSetter.call(input, 'bob');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalled();
  });

  it('disables input when disabled is true', () => {
    render(<TextInputField label="Username" value="" onChange={jest.fn()} disabled={true} />);
    expect((container.querySelector('input') as HTMLInputElement)?.disabled).toBe(true);
  });

  it('renders placeholder text', () => {
    render(<TextInputField label="Username" value="" onChange={jest.fn()} placeholder="Enter username" />);
    expect((container.querySelector('input') as HTMLInputElement)?.placeholder).toBe('Enter username');
  });

  it('wires id to input and label htmlFor when provided', () => {
    render(<TextInputField id="my-field" label="My Field" value="" onChange={jest.fn()} />);
    expect((container.querySelector('input') as HTMLInputElement)?.id).toBe('my-field');
    expect(container.querySelector('label')?.htmlFor).toBe('my-field');
  });
});

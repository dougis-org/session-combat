import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConditionFormModal } from '@/lib/components/combatant-card/ConditionFormModal';

const CATALOG = [
  { name: 'Poisoned', description: 'Disadvantage on attacks and ability checks.' },
  { name: 'Prone', description: 'Prone description' },
];

function mockFetchOnce(response: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: jest.fn().mockResolvedValue(response),
  }) as never;
}

function mockFetchReject() {
  global.fetch = jest.fn().mockRejectedValue(new Error('network error')) as never;
}

function setup() {
  const onSubmit = jest.fn();
  const onClose = jest.fn();
  render(<ConditionFormModal combatantName="Aria" onSubmit={onSubmit} onClose={onClose} />);
  return { onSubmit, onClose, user: userEvent.setup() };
}

beforeEach(() => {
  jest.restoreAllMocks();
  mockFetchOnce([]);
});

describe('ConditionFormModal', () => {
  test('submitting a name with empty duration adds a validated condition and closes', async () => {
    const { onSubmit, onClose, user } = setup();
    await user.type(screen.getByTestId('condition-name-input'), 'Prone');
    await user.click(screen.getByTestId('condition-form-add'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Prone', duration: undefined, id: expect.any(String) })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('empty name is rejected', async () => {
    const { onSubmit, onClose, user } = setup();
    await user.click(screen.getByTestId('condition-form-add'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('a name longer than 100 characters is rejected', async () => {
    const { onSubmit, user } = setup();
    await user.type(screen.getByTestId('condition-name-input'), 'x'.repeat(101));
    await user.click(screen.getByTestId('condition-form-add'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test.each(['abc', '0', '20000'])('duration %s is rejected', async (bad) => {
    const { onSubmit, user } = setup();
    await user.type(screen.getByTestId('condition-name-input'), 'Prone');
    await user.type(screen.getByTestId('condition-duration-input'), bad);
    await user.click(screen.getByTestId('condition-form-add'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('a valid duration is passed through', async () => {
    const { onSubmit, user } = setup();
    await user.type(screen.getByTestId('condition-name-input'), 'Blessed');
    await user.type(screen.getByTestId('condition-duration-input'), '3');
    await user.click(screen.getByTestId('condition-form-add'));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Blessed', duration: 3 }));
  });

  test('cancelling with a typed name adds nothing and closes', async () => {
    const { onSubmit, onClose, user } = setup();
    await user.type(screen.getByTestId('condition-name-input'), 'Prone');
    await user.click(screen.getByTestId('condition-form-cancel'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('before the catalog fetch resolves, the free-text/Custom path is already usable', async () => {
    let resolveFetch: (v: unknown) => void = () => {};
    global.fetch = jest.fn().mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; })) as never;
    setup();
    expect(screen.getByTestId('condition-name-input')).toBeInTheDocument();
    expect(screen.queryByTestId('condition-catalog-select')).not.toBeInTheDocument();
    await act(async () => {
      resolveFetch({ ok: true, json: async () => [] });
    });
  });

  test('catalog fetch failure falls back to Custom with a muted note', async () => {
    mockFetchReject();
    setup();
    await waitFor(() => expect(screen.getByTestId('condition-catalog-empty-note')).toBeInTheDocument());
    expect(screen.queryByTestId('condition-catalog-select')).not.toBeInTheDocument();
    expect(screen.getByTestId('condition-name-input')).toBeInTheDocument();
  });

  test('empty catalog falls back to Custom with a muted note', async () => {
    mockFetchOnce([]);
    setup();
    await waitFor(() => expect(screen.getByTestId('condition-catalog-empty-note')).toBeInTheDocument());
    expect(screen.queryByTestId('condition-catalog-select')).not.toBeInTheDocument();
  });

  test('when the catalog loads, the dropdown lists each condition plus a trailing Custom… option', async () => {
    mockFetchOnce(CATALOG);
    setup();
    await waitFor(() => expect(screen.getByTestId('condition-catalog-select')).toBeInTheDocument());
    const select = screen.getByTestId('condition-catalog-select') as HTMLSelectElement;
    const optionLabels = Array.from(select.options).map((o) => o.value);
    expect(optionLabels).toEqual(['Poisoned', 'Prone', 'custom']);
  });

  test('selecting a catalog condition and clicking Add submits its name + description', async () => {
    mockFetchOnce(CATALOG);
    const { onSubmit, user } = setup();
    await waitFor(() => expect(screen.getByTestId('condition-catalog-select')).toBeInTheDocument());
    await user.selectOptions(screen.getByTestId('condition-catalog-select'), 'Poisoned');
    expect(screen.getByTestId('condition-catalog-description')).toHaveTextContent('Disadvantage on attacks and ability checks.');
    await user.type(screen.getByTestId('condition-duration-input'), '3');
    await user.click(screen.getByTestId('condition-form-add'));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Poisoned',
        description: 'Disadvantage on attacks and ability checks.',
        duration: 3,
      })
    );
  });

  test('a catalog description containing HTML-like text renders literally, not as markup', async () => {
    mockFetchOnce([{ name: 'Weird', description: '<b>bold</b>' }]);
    const { user } = setup();
    await waitFor(() => expect(screen.getByTestId('condition-catalog-select')).toBeInTheDocument());
    await user.selectOptions(screen.getByTestId('condition-catalog-select'), 'Weird');
    const desc = screen.getByTestId('condition-catalog-description');
    expect(desc.textContent).toBe('<b>bold</b>');
    expect(desc.querySelector('b')).toBeNull();
  });

  test('selecting Custom… after the catalog loads reveals the free-text path unchanged', async () => {
    mockFetchOnce(CATALOG);
    const { onSubmit, user } = setup();
    await waitFor(() => expect(screen.getByTestId('condition-catalog-select')).toBeInTheDocument());
    await user.selectOptions(screen.getByTestId('condition-catalog-select'), 'Poisoned');
    await user.selectOptions(screen.getByTestId('condition-catalog-select'), 'custom');
    expect(screen.getByTestId('condition-name-input')).toBeInTheDocument();
    await user.type(screen.getByTestId('condition-name-input'), 'Homebrew');
    await user.click(screen.getByTestId('condition-form-add'));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Homebrew', description: '' }));
  });
});

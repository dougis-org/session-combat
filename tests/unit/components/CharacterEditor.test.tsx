import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CharacterEditor } from '@/lib/components/CharacterEditor';
import { Character } from '@/lib/types';

describe('CharacterEditor', () => {
  const getBaseMock = (): Character => ({
    id: 'char-1',
    userId: 'user-1',
    name: 'Test Character',
    classes: [{ class: 'Fighter', level: 1 }],
    hp: 10,
    maxHp: 10,
    ac: 10,
    abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
  });

  it('renders correctly for editing an existing character', () => {
    const mock = getBaseMock();
    render(<CharacterEditor character={mock} onSave={jest.fn()} onCancel={jest.fn()} isNew={false} />);
    expect(screen.getByText('Edit Character')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Character')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Fighter')).toBeInTheDocument();
  });

  it('disables save button when name is empty', async () => {
    const mock = getBaseMock();
    const onSave = jest.fn();
    render(<CharacterEditor character={mock} onSave={onSave} onCancel={jest.fn()} isNew={true} />);
    
    const nameInput = screen.getByLabelText('Character name');
    fireEvent.change(nameInput, { target: { value: '   ' } });
    
    const saveBtn = screen.getByText('Save Character');
    expect(saveBtn).toBeDisabled();
  });

  it('calls onSave with updated values', async () => {
    const mock = getBaseMock();
    const onSave = jest.fn().mockResolvedValue(true);
    render(<CharacterEditor character={mock} onSave={onSave} onCancel={jest.fn()} isNew={false} />);
    
    const nameInput = screen.getByLabelText('Character name');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    fireEvent.click(screen.getByText('Save Character'));
    
    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
    const callArgs = onSave.mock.calls[0][0];
    expect(callArgs.name).toBe('New Name');
  });

  it('handles add and remove classes', async () => {
    const mock = getBaseMock();
    render(<CharacterEditor character={mock} onSave={jest.fn()} onCancel={jest.fn()} isNew={false} />);
    
    fireEvent.click(screen.getByText('Add Class'));
    
    const classSelects = screen.getAllByLabelText('Character class');
    expect(classSelects.length).toBe(2);
    
    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[1]);
    
    expect(screen.getAllByLabelText('Character class').length).toBe(1);
  });
});

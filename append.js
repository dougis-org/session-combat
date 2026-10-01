const fs = require('fs');
const content = fs.readFileSync('tests/unit/components/InitiativeEntry.test.tsx', 'utf-8');

const target = "describe('layout structure', () => {";
const index = content.indexOf(target);

const newTests = `
  describe('batch roll button', () => {
    it('appears when the combatant is a monster and there are multiple unrolled monsters', () => {
      renderEntry({ type: 'monster' }, undefined, undefined, 3);
      expect(screen.getByRole('button', { name: 'Roll d20 for all 3 unrolled Monsters' })).toBeInTheDocument();
    });

    it('does not appear if there is only 1 unrolled monster', () => {
      renderEntry({ type: 'monster' }, undefined, undefined, 1);
      expect(screen.queryByRole('button', { name: /Roll d20 for all/ })).not.toBeInTheDocument();
    });

    it('does not appear if the combatant is a player, even if there are multiple unrolled monsters', () => {
      renderEntry({ type: 'player' }, undefined, undefined, 3);
      expect(screen.queryByRole('button', { name: /Roll d20 for all/ })).not.toBeInTheDocument();
    });

    it('calls onRollAllMonsters with advantage and flat bonus when clicked', async () => {
      const user = userEvent.setup();
      const { onRollAllMonsters } = renderEntry({ type: 'monster' }, undefined, undefined, 3);
      
      // Set advantage
      await user.click(screen.getByLabelText('Advantage'));
      
      // Set flat bonus
      const input = screen.getByLabelText('Flat initiative bonus');
      await user.clear(input);
      await user.type(input, '2');
      await user.keyboard('{Enter}');
      
      // Click batch roll
      await user.click(screen.getByRole('button', { name: 'Roll d20 for all 3 unrolled Monsters' }));
      
      expect(onRollAllMonsters).toHaveBeenCalledWith(true, 2);
    });
  });

`;

const newContent = content.substring(0, index) + newTests + content.substring(index);
fs.writeFileSync('tests/unit/components/InitiativeEntry.test.tsx', newContent);
console.log('done');

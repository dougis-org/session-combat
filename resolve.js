const fs = require('fs');
const content = fs.readFileSync('lib/components/InitiativeEntry.tsx', 'utf-8');

const headRegex = /<<<<<<< HEAD\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> 6df4d83f \(feat: Add batch roll monsters initiative button\)\n/;

const newContent = content.replace(headRegex, (match, headBlock, featureBlock) => {
  // We want to keep HEAD's layout but add the batch roll button from featureBlock.
  // The batch roll button code is:
  const batchRollBtn = `
            {combatant.type === 'monster' && unrolledMonsterCount !== undefined && unrolledMonsterCount > 1 && (
              <button
                onClick={() => onRollAllMonsters?.(advantage, flatBonus)}
                className="w-full bg-blue-700 hover:bg-blue-600 px-2 py-2 rounded text-sm flex-none font-semibold text-blue-100"
              >
                Roll d20 for all {unrolledMonsterCount} unrolled Monsters
              </button>
            )}`;

  // Head block ends with the Enter Total button and closes the inner div.
  // Wait, I need to check where the inner div closes.
  return headBlock + batchRollBtn + '\n';
});

fs.writeFileSync('lib/components/InitiativeEntry.tsx', newContent);
console.log('done');

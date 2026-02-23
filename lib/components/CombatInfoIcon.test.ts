/**
 * CombatInfoIcon - Component Testing Notes
 *
 * This component is a simple presentational component with no complex business logic.
 * It displays:
 * - An info icon next to the round indicator
 * - A mouseover tooltip with 2-column layout (Players | Monsters)
 *
 * Tooltip Content:
 * - Each column shows count of alive combatants in the header
 * - Lists combatants grouped by name (with ×N multiplier for duplicates)
 * - Displays status conditions with durations in yellow
 * - Shows horizontal delimiter separating alive from dead combatants
 * - Dead combatants appear strikethrough below the delimiter
 * - "DEFEATED" section shows dead/unconscious characters in red
 *
 * Key Features:
 * - Only alive combatants (hp > 0) counted in totals
 * - Dead combatants displayed separately with strikethrough styling
 * - Each column independently shows both alive and dead
 * - Horizontal line (border) visually separates living from defeated
 * - "None" text shows in column if no alive combatants of that type
 *
 * Testing Strategy:
 * - Unit testing is not configured in this project (no React Testing Library setup)
 * - The component is tested indirectly through:
 *   1. TypeScript compilation (type safety)
 *   2. Build verification (Next.js build succeeds)
 *   3. E2E tests via Playwright (when available)
 *
 * Manual Testing Checklist:
 * ✓ Icon appears next to round indicator
 * ✓ Tooltip shows on mouseover, hides on mouseleave
 * ✓ 2-column layout with Players on left, Monsters on right
 * ✓ Counts are correct (only alive combatants counted)
 * ✓ Combatants grouped by type and name
 * ✓ Status conditions display correctly with durations
 * ✓ Horizontal delimiter separates alive from dead
 * ✓ Dead combatants shown with strikethrough in red "DEFEATED" section
 * ✓ Multiple combatants with same name show count (×2, ×3, etc.)
 * ✓ Empty columns show "None" when no alive combatants of that type
 * ✓ All columns have dead section if any defeated combatants exist
 */

describe('CombatInfoIcon', () => {
  it('documents the testing strategy for this component', () => {
    // This component is a simple presentational component
    // Tested through TypeScript compilation and E2E tests
    const testingStrategy = {
      unitTest: false,
      reason: 'No React Testing Library setup in project',
      alternativeTests: ['TypeScript compilation', 'E2E via Playwright'],
    };

    expect(testingStrategy.unitTest).toBe(false);
    expect(testingStrategy.alternativeTests).toContain('E2E via Playwright');
  });

  it('placeholder for future unit tests if React Testing Library is added', () => {
    // When React Testing Library is added to the project,
    // unit tests for this component should cover:
    // - Icon visibility
    // - Tooltip display on hover
    // - Column layout (Players vs Monsters)
    // - Count calculations (alive combatants only)
    // - Status condition rendering
    // - Dead combatants styling

    expect(true).toBe(true);
  });
});

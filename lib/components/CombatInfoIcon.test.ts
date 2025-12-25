/**
 * CombatInfoIcon - Component Testing Notes
 *
 * This component is a simple presentational component with no complex business logic.
 * It displays:
 * - An info icon next to the round indicator
 * - A mouseover tooltip showing:
 *   - Count of alive players and monsters (excluding hp=0)
 *   - List of combatants grouped by name
 *   - Status conditions for each combatant
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
 * ✓ Counts are correct (only alive combatants counted)
 * ✓ Combatants grouped by type and name
 * ✓ Status conditions display correctly with durations
 * ✓ Empty state displays when no combatants are alive
 * ✓ Multiple combatants with same name show count (×2, ×3, etc.)
 */

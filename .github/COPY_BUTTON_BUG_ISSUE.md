# Bug: Copy button missing on global monster cards in Monster Library

## Problem Description

The copy button is not visible or functional on global monster template cards in the Monster Library page. Users cannot duplicate global monsters to their personal library due to this missing UI element.

## Affected User Flow

On the `/monsters` page (Monster Library), users with admin access should be able to:
1. Browse the global monster template collection
2. Click a "Copy" button on each global monster card
3. Duplicate the monster to their personal library
4. Use that copy in their combat encounters

**Current behavior:** The copy button doesn't exist, blocking users from copying global monsters.

## Locations Where Copy Button Should Appear

### 1. **Primary Location: Monster Template Cards**
- **File:** `app/monsters/page.tsx`
- **Component:** `MonsterTemplateCard` (lines 265-295)
- **Current state:** Component receives `onEdit` and `onDelete` props but NO `onCopy` prop
- **Issue:** Button UI element completely missing from JSX

### 2. **Secondary Location: Quick Combat Modal (if applicable)**
- **File:** `app/components/combat/QuickCombatantModal.tsx`
- **Potential impact:** May also need copy functionality for quick-add workflow
- **Status:** Needs investigation

## Technical Details

### Missing Implementation Components

1. **UI Element (Missing)**
   - Button text: "Copy"
   - Expected styling: Green button (similar to edit/delete buttons)
   - ARIA label: "Copy {monsterName} to your library"
   - Location: MonsterTemplateCard component

2. **Handler Function (Missing)**
   - Parent component: MonstersContent component
   - Expected function: onCopy(monsterId: string) handler
   - Current handlers: onEdit, onDelete only

3. **API Endpoint (Missing)**
   - Route: POST /api/monsters/copy/{id}
   - Functionality: Duplicate global monster to user's library
   - Response: { success: boolean, newMonsterId?: string, error?: string }

4. **Duplicate Logic (Missing)**
   - Copy all monster stats (name, AC, HP, abilities, etc.)
   - Assign new copy to current user
   - Generate unique ID for duplicate
   - Preserve all stat values

5. **UX Feedback (Missing)**
   - Loading state during copy operation
   - Success toast notification
   - Error handling with user-friendly message
   - Refresh monster list after successful copy

## Acceptance Criteria

### Visibility & Interaction
- [ ] Copy button is visible on all global monster template cards
- [ ] Copy button has consistent styling with edit/delete buttons
- [ ] Copy button shows loading state during operation
- [ ] Copy button is disabled during copy operation
- [ ] Copy button is disabled for user's own monsters (only on global templates)

### Functionality
- [ ] Clicking copy button sends POST request to /api/monsters/copy/{id}
- [ ] API endpoint duplicates all monster attributes (name, AC, HP, abilities, etc.)
- [ ] Duplicated monster is assigned to current user
- [ ] Duplicated monster gets unique ID
- [ ] All stat values are preserved in duplicate

### UX/Feedback
- [ ] Success toast notification appears after copying
- [ ] Toast message includes new monster name
- [ ] Error toast appears if copy fails
- [ ] Monster list refreshes automatically after successful copy
- [ ] User can immediately see new copied monster in their list
- [ ] Loading indicator shows during async operation

### Edge Cases
- [ ] Copy button not shown for monsters already owned by user
- [ ] Copy button disabled if monster has invalid/missing data
- [ ] Copy operation handles network errors gracefully
- [ ] Multiple concurrent copy requests don't create duplicates
- [ ] Copying monster with complex abilities works correctly
- [ ] Copied monster stats exactly match original template

### Testing
- [ ] E2E test confirms copy button visibility on global monsters
- [ ] E2E test confirms copy button hidden on user's own monsters
- [ ] E2E test confirms successful copy creates new monster
- [ ] E2E test confirms copied monster has correct attributes
- [ ] E2E test confirms error handling on network failure
- [ ] Unit test confirms onCopy handler called with correct ID
- [ ] Unit test confirms loading state toggles correctly

## Definition of Done

- [ ] Copy button UI implemented in MonsterTemplateCard
- [ ] onCopy handler implemented in MonstersContent
- [ ] API endpoint POST /api/monsters/copy/{id} created
- [ ] Monster duplication logic implemented server-side
- [ ] Toast notifications configured for success/error
- [ ] All acceptance criteria tests passing
- [ ] Manual testing confirms full user flow works
- [ ] No console errors or warnings
- [ ] Codacy analysis passes (if applicable)
- [ ] Ready for code review

## Reproduction Steps

1. Navigate to /monsters page (logged in as admin)
2. Scroll through global monster templates
3. Expected: See "Copy" button on each monster card
4. Actual: No copy button visible
5. Impact: Cannot complete the workflow of copying global monsters to personal library

## Related Code References

- Monster page component: app/monsters/page.tsx (561 lines)
- MonsterTemplateCard: Lines 265-295 in monsters/page.tsx
- Expected API location: app/api/monsters/copy/[id]/route.ts (needs to be created)
- Toast component: Check existing implementations for consistency
- User context for auth: Should use current user ID for assignment

## Notes for Next Developer

- This is a blocking feature for the Monster Library admin interface
- Implementation should follow existing edit/delete button patterns for consistency
- Consider paginating/filtering when monsters list gets large
- May want to add bulk copy functionality in future
- Verify monster stat copying handles all edge cases (nested abilities, complex rules, etc.)

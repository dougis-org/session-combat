## Why

Currently, the "Sync from D&D Beyond" button is only available on the Character View screen. Users frequently update their characters in D&D Beyond while in the Character Editor screen in our app, and they want to be able to sync those changes without having to navigate back to the view screen.

## What Changes

- Add the "Sync from D&D Beyond" button to the Character Editor screen.
- Ensure the button functions exactly as it does on the Character View screen (fetching the latest data and updating the character).

## Capabilities

### New Capabilities

### Modified Capabilities

- `dnd-beyond-character-import`: The capability to sync from D&D Beyond needs to explicitly include the Character Editor screen as a location where the sync action can be triggered.

## Impact

- Character Editor UI component
- D&D Beyond sync UI logic (might need to be extracted or shared if not already)

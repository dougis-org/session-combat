## ADDED Requirements

### Requirement: Monster cards display in a responsive multi-column grid
The monster library page SHALL display monster cards in a CSS grid layout that adapts to viewport width: 1 column on mobile, 2 columns on tablet, and 3 columns on desktop.

#### Scenario: Single column on mobile
- **WHEN** the viewport width is less than 768px
- **THEN** monster cards in both "Your Monster Library" and "Global Monster Library" sections SHALL be arranged in a single column

#### Scenario: Two columns on tablet
- **WHEN** the viewport width is 768px or wider but less than 1024px
- **THEN** monster cards in both sections SHALL be arranged in two columns

#### Scenario: Three columns on desktop
- **WHEN** the viewport width is 1024px or wider
- **THEN** monster cards in both sections SHALL be arranged in three columns

#### Scenario: Card content is unchanged
- **WHEN** monster cards are displayed in the multi-column grid
- **THEN** each card SHALL display the same content as before: name, size/type/CR, AC, HP, and action buttons

### Requirement: Monster editor opens as a modal overlay
When a user initiates adding or editing a monster, the editor form SHALL appear as a fixed full-screen modal overlay above the grid, rather than inline within the list.

#### Scenario: Editor opens on "Add New Monster"
- **WHEN** the user clicks "Add New Monster" or "Add Global Monster"
- **THEN** a modal overlay with a dark backdrop SHALL appear containing the `MonsterTemplateEditor` form
- **AND** the monster grid SHALL remain visible behind the backdrop

#### Scenario: Editor opens on "Edit"
- **WHEN** the user clicks the "Edit" button on a monster card
- **THEN** a modal overlay SHALL appear containing the editor pre-populated with that monster's data

#### Scenario: Modal closes on Cancel button
- **WHEN** the user clicks the "Cancel" button inside the editor modal
- **THEN** the modal SHALL close and the grid SHALL be fully visible again

#### Scenario: Modal closes on backdrop click
- **WHEN** the user clicks outside the editor form (on the dark backdrop)
- **THEN** the modal SHALL close without saving

#### Scenario: Modal closes on Escape key
- **WHEN** the modal is open and the user presses the Escape key
- **THEN** the modal SHALL close without saving

#### Scenario: Clicking inside the form does not close the modal
- **WHEN** the user clicks anywhere inside the editor form panel
- **THEN** the modal SHALL remain open

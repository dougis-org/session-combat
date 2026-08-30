## ADDED Requirements

### Requirement: Campaign templates skip on exist
By default, the seed script MUST skip updating campaign templates if they already exist in the database.

#### Scenario: Seed without force flag
- **WHEN** the seed script is run without the `--force` flag
- **THEN** it finds existing templates by `_id` and does not modify them
- **THEN** new templates that do not exist are inserted

### Requirement: Campaign templates force update
The seed script MUST support a `--force` flag that overrides the default skipping behavior.

#### Scenario: Seed with force flag
- **WHEN** the seed script is run with the `--force` flag
- **THEN** it finds existing templates by `_id` and updates them with the latest data using an upsert operation (`updateOne` with `$set` and `{upsert: true}`)
- **THEN** it prints a warning or confirmation that existing templates were forcefully updated

### Requirement: Seed documentation
The process for updating seed data MUST be documented so developers know how to sync new campaigns or encounters.

#### Scenario: Developer references seed commands
- **WHEN** a developer views `README.md` or the script's documentation
- **THEN** they find instructions on how to use `npm run seed -- --force` to update existing templates

# lint-config Specification

## Purpose
Define the ESLint 9 flat-config requirements so local lint runs work
reliably and ignore generated artifacts.

## Requirements

### Requirement: Lint script runs cleanly with ESLint 9 flat config
The system SHALL execute `npm run lint` from the repo root without error when
no lint violations exist in the codebase.

#### Scenario: Clean run on a violation-free codebase
- **Given** `npm ci` has been run and `eslint.config.mjs` is the sole ESLint
  config file
- **When** a developer runs `npm run lint`
- **Then** ESLint exits 0 with no configuration errors or deprecation warnings
  about unsupported flags

#### Scenario: ESLint flat config is loaded instead of legacy config
- **Given** `.eslintrc.json` has been deleted and `eslint.config.mjs` is present
- **When** `npm run lint` is executed
- **Then** ESLint uses the flat config and does not emit a warning about legacy
  config files being ignored

### Requirement: Lint covers source and test files and excludes generated output
The system SHALL lint all `.js`, `.jsx`, `.ts`, and `.tsx` files in the
project source and test directories, and SHALL NOT lint files in
`node_modules/`, `.next/`, `coverage/`, `coverage-e2e/`, or
`playwright-report/`.

#### Scenario: Test files are included in lint scope
- **Given** a lint violation is introduced into a file under `tests/`
- **When** `npm run lint` is executed
- **Then** ESLint reports the violation in that test file

#### Scenario: Build output is excluded from lint scope
- **Given** the `.next/` directory exists from a prior build
- **When** `npm run lint` is executed
- **Then** ESLint does not report errors for files under `.next/`
- **And** it does not attempt to parse generated output

### Requirement: Lint completes in a reasonable time
The system SHALL complete a full lint run in under 60 seconds on a standard
developer machine.

#### Scenario: Lint performance on clean checkout
- **Given** `npm ci` has been run and all source files are present
- **When** `npm run lint` is executed
- **Then** the process exits within 60 seconds

### Requirement: The lint script does not pass deprecated flags
The `lint` npm script SHALL invoke `eslint .` without the `--ext` flag.

#### Scenario: Lint script does not pass deprecated flags
- **Given** the `package.json` lint script reads `eslint .`
- **When** `npm run lint` is executed
- **Then** ESLint does not emit an error or warning about an unrecognized
  `--ext` option

### Requirement: No legacy eslint config file remains
The `.eslintrc.json` file SHALL NOT exist in the repository.

#### Scenario: Legacy config file is absent
- **Given** the repository root is inspected
- **When** `.eslintrc.json` is checked
- **Then** the file does not exist

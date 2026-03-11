# offline-persistence Specification

## Purpose
TBD - created by archiving change restore-offline-persistence. Update Purpose after archive.
## Requirements
### Requirement: LocalStore stores data under versioned namespaced keys
LocalStore SHALL store all values under keys prefixed with `sessionCombat:v1:` and wrap each value with a version envelope `{ v: 1, data: T, updatedAt: ISO }`.

#### Scenario: Set and get an entity
- **WHEN** `LocalStore.set('encounters', encounterArray)` is called
- **THEN** `LocalStore.get('encounters')` returns the same array

#### Scenario: Get a missing entity
- **WHEN** `LocalStore.get('encounters')` is called and no value exists
- **THEN** it returns `null`

#### Scenario: Remove an entity
- **WHEN** `LocalStore.remove('encounters')` is called after a value was set
- **THEN** `LocalStore.get('encounters')` returns `null`

### Requirement: LocalStore.clear() removes all sessionCombat:v1: keys
LocalStore SHALL expose a `clear()` method that removes every localStorage key beginning with `sessionCombat:v1:`.

#### Scenario: Clear removes all owned keys
- **WHEN** multiple entities have been stored and `LocalStore.clear()` is called
- **THEN** `LocalStore.get()` returns `null` for every previously stored entity

#### Scenario: Clear does not remove unrelated keys
- **WHEN** a key not prefixed with `sessionCombat:v1:` exists in localStorage and `LocalStore.clear()` is called
- **THEN** that unrelated key remains in localStorage

#### Scenario: Clear is safe when no keys exist
- **WHEN** localStorage contains no `sessionCombat:v1:` keys and `LocalStore.clear()` is called
- **THEN** no error is thrown

### Requirement: LocalStore handles storage quota exceeded
LocalStore SHALL throw a `StorageQuotaError` if `localStorage.setItem` fails due to quota.

#### Scenario: Quota exceeded propagates as typed error
- **WHEN** localStorage throws a quota error during `set()`
- **THEN** a `StorageQuotaError` is thrown by `LocalStore.set()`

### Requirement: LocalStore is a no-op in non-browser environments
LocalStore SHALL silently no-op all operations when `typeof window === 'undefined'` (SSR context).

#### Scenario: Server-side set does not throw
- **WHEN** `LocalStore.set()` is called in an environment without `window`
- **THEN** no error is thrown and no state is written

#### Scenario: Server-side get returns null
- **WHEN** `LocalStore.get()` is called in an environment without `window`
- **THEN** it returns `null`


## ADDED Requirements

### Requirement: SyncQueue enqueues outbound operations
SyncQueue SHALL persist pending sync operations to `sessionCombat:v1:syncQueue` in localStorage. Each entry SHALL include: `id`, `entity`, `action`, `payload`, `createdAt`, `attempts`, `nextRetryAt`.

#### Scenario: Enqueue an operation
- **WHEN** `SyncQueue.enqueue({ entity: 'encounters', action: 'upsert', payload: data })` is called
- **THEN** the operation appears in `SyncQueue.getAll()` with `attempts: 0`

#### Scenario: Queue persists across page reloads
- **WHEN** an operation is enqueued and localStorage is read directly
- **THEN** the `sessionCombat:v1:syncQueue` key contains the serialised operation

### Requirement: SyncQueue applies exponential backoff on retry
SyncQueue SHALL compute retry delay as `Math.min(1000 * 2^attempts, 30000)` ms.

#### Scenario: First retry delay is 1 second
- **WHEN** an operation with `attempts: 0` is marked as failed
- **THEN** `nextRetryAt` is set approximately 1000 ms in the future

#### Scenario: Backoff caps at 30 seconds
- **WHEN** an operation with `attempts: 5` is marked as failed
- **THEN** `nextRetryAt` is set no more than 30000 ms in the future

### Requirement: SyncQueue.clear() removes the queue
SyncQueue SHALL expose a `clear()` method that removes the `sessionCombat:v1:syncQueue` key from localStorage.

#### Scenario: Clear empties the queue
- **WHEN** operations exist in the queue and `SyncQueue.clear()` is called
- **THEN** `SyncQueue.getAll()` returns an empty array

#### Scenario: Clear is safe when queue is empty
- **WHEN** the queue is empty and `SyncQueue.clear()` is called
- **THEN** no error is thrown

### Requirement: SyncQueue is a no-op in non-browser environments
SyncQueue SHALL silently no-op all operations when `typeof window === 'undefined'`.

#### Scenario: Server-side enqueue does not throw
- **WHEN** `SyncQueue.enqueue()` is called in an environment without `window`
- **THEN** no error is thrown

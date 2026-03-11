## ADDED Requirements

### Requirement: NetworkDetector reports current online status
NetworkDetector SHALL expose a `isOnline()` function that returns the current browser online status.

#### Scenario: Reports online when navigator.onLine is true
- **WHEN** `navigator.onLine` is `true`
- **THEN** `NetworkDetector.isOnline()` returns `true`

#### Scenario: Reports offline when navigator.onLine is false
- **WHEN** `navigator.onLine` is `false`
- **THEN** `NetworkDetector.isOnline()` returns `false`

#### Scenario: Returns true in non-browser environments (SSR)
- **WHEN** `NetworkDetector.isOnline()` is called in an environment without `window`
- **THEN** it returns `true` (assume online for SSR)

### Requirement: NetworkDetector notifies listeners on status change
NetworkDetector SHALL allow registering change listeners and call them with the new status when `online` or `offline` events fire.

#### Scenario: Listener called on going offline
- **WHEN** a listener is registered and the browser fires an `offline` event
- **THEN** the listener is called with `false`

#### Scenario: Listener called on coming online
- **WHEN** a listener is registered and the browser fires an `online` event
- **THEN** the listener is called with `true`

#### Scenario: Listener removed via returned unsubscribe function
- **WHEN** the unsubscribe function returned by `subscribe()` is called
- **THEN** subsequent online/offline events do not invoke the listener

### Requirement: useNetworkStatus hook reflects live online status
The `useNetworkStatus` React hook SHALL return the current network status and update on change.

#### Scenario: Hook initialises with current status
- **WHEN** `useNetworkStatus()` is rendered
- **THEN** it returns the current `navigator.onLine` value

#### Scenario: Hook updates when status changes
- **WHEN** an `offline` browser event fires after the hook is mounted
- **THEN** the hook value updates to `false`

#### Scenario: Hook cleans up listeners on unmount
- **WHEN** the component using `useNetworkStatus()` unmounts
- **THEN** no memory leaks or dangling event listeners remain

import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '../../../lib/sync/NetworkDetector';

describe('useNetworkStatus', () => {
  beforeEach(() => {
    // Reset navigator.onLine to true
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with navigator.onLine value', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
  });

  it('should update state when online event fires', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('should update state when offline event fires', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('should subscribe to events on mount', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    renderHook(() => useNetworkStatus());
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  it('should unsubscribe from events on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useNetworkStatus());
    
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('should handle multiple online/offline transitions', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOnline).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);
  });
});

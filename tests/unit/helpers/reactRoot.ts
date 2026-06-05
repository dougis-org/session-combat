import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';

export function createReactRoot(): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

export function unmountReactRoot(container: HTMLDivElement, root: Root): void {
  act(() => { root.unmount(); });
  container.remove();
}

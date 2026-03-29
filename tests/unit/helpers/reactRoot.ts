/**
 * @jest-environment jsdom
 */
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';

export function createReactRoot(): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

export async function unmountReactRoot(container: HTMLDivElement, root: Root): Promise<void> {
  await act(async () => { root.unmount(); });
  document.body.removeChild(container);
}

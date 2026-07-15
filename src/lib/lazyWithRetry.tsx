import { lazy, type ComponentType } from 'react';

/**
 * React.lazy with a one-time hard reload when a dynamic import fails.
 *
 * On static hosts (GitHub Pages) a new deploy replaces hashed chunks. A browser
 * still running the previous page then references a chunk hash that no longer
 * exists, so the dynamic import 404s ("Failed to fetch dynamically imported
 * module"). Reloading once fetches the fresh index.html and its current chunks.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    const KEY = 'trip.chunkReloaded';
    try {
      const mod = await factory();
      sessionStorage.removeItem(KEY);
      return mod;
    } catch (err) {
      // Only reload once per session to avoid an infinite reload loop.
      if (typeof window !== 'undefined' && !sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, '1');
        window.location.reload();
        // Keep the boundary suspended while the page reloads.
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}

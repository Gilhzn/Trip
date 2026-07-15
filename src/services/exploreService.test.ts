import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exploreAround } from './exploreService';

const store = new Map<string, string>();
function stubLocalStorage() {
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  });
}

function decodeQuery(body: string): string {
  return decodeURIComponent(body.replace(/^data=/, ''));
}

describe('exploreAround query building', () => {
  beforeEach(() => {
    store.clear();
    stubLocalStorage();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('caps radius per category and requires Wikidata for attractions', async () => {
    const queries: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        queries.push(decodeQuery(String(init.body)));
        return {
          ok: true,
          json: async () => ({
            elements: [
              { type: 'node', id: 1, lat: 47.9, lon: 13.1, tags: { name: 'Test', wikidata: 'Q1' } },
            ],
          }),
        };
      }),
    );

    // Request a huge radius (500 km straight-line) — each category must be capped.
    const pois = await exploreAround({ lat: 47.8095, lon: 13.055 }, 500, ['attraction', 'restaurant']);

    const attractionQuery = queries.find((q) => q.includes('tourism'))!;
    const restaurantQuery = queries.find((q) => q.includes('amenity~"^(restaurant'))!;

    // Attractions: notability filter present, radius capped at 150 km
    expect(attractionQuery).toContain('[wikidata]');
    expect(attractionQuery).toContain('around:150000');
    // Restaurants: capped at 25 km
    expect(restaurantQuery).toContain('around:25000');

    expect(pois.length).toBeGreaterThan(0);
    expect(pois[0].source).toBe('overpass');
  });

  it('throws only when every category query fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 504, json: async () => ({}) })),
    );
    await expect(exploreAround({ lat: 47.8, lon: 13.05 }, 50, ['attraction'])).rejects.toThrow();
  });
});

export class HttpError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(status: number, url: string) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'HttpError';
    this.status = status;
    this.url = url;
  }
}

interface FetchOptions {
  timeoutMs?: number;
  retries?: number;
  init?: RequestInit;
}

/** fetch → JSON with timeout and exponential-backoff retries (network/5xx/429 only). */
export async function fetchJson<T>(url: string, { timeoutMs = 12000, retries = 2, init }: FetchOptions = {}): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      if (!res.ok) {
        const err = new HttpError(res.status, url);
        // Retry only transient statuses
        if (res.status === 429 || res.status >= 500) {
          lastError = err;
          continue;
        }
        throw err;
      }
      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof HttpError) throw err;
      lastError = err; // network error / abort → retry
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

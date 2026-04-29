/**
 * Browser-only fetch helpers: absolute URL + long timeout + retry for dev / LAN cold starts.
 */

function timeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

function resolveUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (typeof window === 'undefined') {
    return path;
  }
  return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export type FetchWithTimeoutOptions = RequestInit & {
  timeoutMs?: number;
  retries?: number;
};

/**
 * Fetch with abort timeout and optional retries (for transient 5xx / connection resets after first compile).
 */
export async function fetchWithTimeout(
  path: string,
  init: FetchWithTimeoutOptions = {},
): Promise<Response> {
  const { timeoutMs = 120000, retries = 1, ...rest } = init;
  const url = resolveUrl(path);
  const attempts = retries + 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, {
        ...rest,
        signal: timeoutSignal(timeoutMs),
      });
      if (response.ok) {
        return response;
      }
      const shouldRetry =
        attempt < attempts - 1 && (response.status >= 500 || response.status === 408);
      if (!shouldRetry) {
        return response;
      }
    } catch (err) {
      lastError = err;
      if (attempt === attempts - 1) {
        throw err;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

const MAX_BACKOFF_MS = 10_000;

export function calculateBackoffMs(
  attempt: number,
  retryAfterHeader?: string | null
): number {
  if (retryAfterHeader) {
    const parsed = parseInt(retryAfterHeader, 10);
    if (!isNaN(parsed)) {
      return Math.max(0, Math.min(parsed * 1000, MAX_BACKOFF_MS));
    }
  }
  return Math.min(1000 * Math.pow(2, attempt), MAX_BACKOFF_MS);
}

export async function handleRateLimitResponse(
  response: Response,
  attempt: number,
  retries: number
): Promise<boolean> {
  if (attempt >= retries) {
    return false;
  }
  const retryAfter = response.headers.get("Retry-After");
  const backoffMs = calculateBackoffMs(attempt, retryAfter);
  await new Promise((resolve) => setTimeout(resolve, backoffMs));
  return true;
}

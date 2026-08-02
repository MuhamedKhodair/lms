/**
 * In-memory sliding-window rate limiter.
 * Suitable for single-instance dev/small deployments.
 * For multi-instance production, swap with a Redis-backed store.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

// Periodically prune expired buckets to avoid memory leaks
const PRUNE_INTERVAL = 60_000;
let pruneTimer: ReturnType<typeof setInterval> | null = null;
function ensurePrune() {
  if (pruneTimer) return;
  pruneTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store) if (v.resetAt <= now) store.delete(k);
  }, PRUNE_INTERVAL);
  if (pruneTimer.unref) pruneTimer.unref();
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  options: { limit?: number; windowMs?: number } = {}
): RateLimitResult {
  const limit = options.limit ?? 10;
  const windowMs = options.windowMs ?? 60_000;
  ensurePrune();

  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, limit, resetAt };
  }

  bucket.count += 1;
  const success = bucket.count <= limit;
  return { success, remaining: Math.max(0, limit - bucket.count), limit, resetAt: bucket.resetAt };
}

/** Derive a client key from the request (IP + optional user id). */
export function clientKey(request: Request, scope: string, userId?: string): string {
  const headers = request.headers;
  const fwd = headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : headers.get("x-real-ip") || "unknown";
  return `${scope}:${userId || ip}`;
}

/** Standard 429 response. */
export function rateLimitResponse(res: RateLimitResult): Response {
  return Response.json(
    { error: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((res.resetAt - Date.now()) / 1000)),
        "X-RateLimit-Limit": String(res.limit),
        "X-RateLimit-Remaining": String(res.remaining),
      },
    }
  );
}

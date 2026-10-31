interface RateLimitBucket {
  tokens: number
  lastRefill: number
}

// In-memory sliding window bucket store
const buckets = new Map<string, RateLimitBucket>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetInSeconds: number
}

export function checkRateLimit(
  identifier: string,
  options = { maxTokens: 10, refillRatePerMinute: 10 }
): RateLimitResult {
  const now = Date.now()
  const windowMs = 60 * 1000

  let bucket = buckets.get(identifier)

  if (!bucket) {
    bucket = { tokens: options.maxTokens, lastRefill: now }
    buckets.set(identifier, bucket)
  }

  // Calculate tokens to refill
  const timePassed = now - bucket.lastRefill
  const tokensToAdd = (timePassed / windowMs) * options.refillRatePerMinute

  bucket.tokens = Math.min(options.maxTokens, bucket.tokens + tokensToAdd)
  bucket.lastRefill = now

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    const resetInSeconds = Math.ceil((1 - (bucket.tokens % 1)) * (windowMs / options.refillRatePerMinute) / 1000)
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      resetInSeconds: Math.max(1, resetInSeconds),
    }
  }

  const waitTimeMs = ((1 - bucket.tokens) / options.refillRatePerMinute) * windowMs
  return {
    allowed: false,
    remaining: 0,
    resetInSeconds: Math.ceil(waitTimeMs / 1000),
  }
}


import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"

// Different rate limits for different Twitter API endpoints
export const TWITTER_RATE_LIMITS = {
  SPACES_LOOKUP: {
    requests: 25,
    window: '15 m', // 25 requests per 15 minutes for GET /2/spaces
  },
  USER_LOOKUP: {
    requests: 100,
    window: '24 h', // 100 requests per 24 hours for GET /2/users
  },
  SPACES_SEARCH: {
    requests: 25,
    window: '15 m', // 25 requests per 15 minutes for GET /2/spaces/search
  }
} as const

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export function createTwitterRateLimit(endpoint: keyof typeof TWITTER_RATE_LIMITS) {
  const limit = TWITTER_RATE_LIMITS[endpoint]
  
  return new Ratelimit({
    redis,
    prefix: `twitter_${endpoint.toLowerCase()}`,
    limiter: Ratelimit.slidingWindow(limit.requests, limit.window),
    analytics: true,
    timeout: 1000,
  })
}

// Helper to handle rate limit errors
export async function handleTwitterRateLimit<T>(
  endpoint: keyof typeof TWITTER_RATE_LIMITS,
  identifier: string,
  operation: () => Promise<T>
): Promise<T> {
  const limiter = createTwitterRateLimit(endpoint)
  const { success, reset, remaining } = await limiter.limit(identifier)
  
  if (!success) {
    throw new Error(`Rate limit exceeded for ${endpoint}. Resets at ${new Date(reset).toISOString()}`)
  }

  try {
    const result = await operation()
    return result
  } catch (error: any) {
    if (error?.code === 429) {
      console.error(`Twitter API rate limit hit for ${endpoint}`)
      // Add exponential backoff retry logic here if needed
    }
    throw error
  }
} 
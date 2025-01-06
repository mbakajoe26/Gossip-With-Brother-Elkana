import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Missing Redis configuration')
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

interface RateLimitConfig {
  interval: number;
  uniqueTokenPerInterval: number;
  prefix?: string;
}

export function rateLimit({ 
  interval, 
  uniqueTokenPerInterval, 
  prefix = 'rate_limit'
}: RateLimitConfig) {
  return new Ratelimit({
    redis,
    prefix,
    limiter: Ratelimit.slidingWindow(uniqueTokenPerInterval, `${interval} ms`),
    analytics: true,
    timeout: 1000,
  })
} 
import { Redis } from '@upstash/redis'

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache keys
export const CACHE_KEYS = {
  SPACE: (spaceId: string) => `scheduled_space:${spaceId}`,
  SPACES_LIST: 'scheduled_spaces_list',
}

// Cache durations (in seconds)
export const CACHE_TTL = {
  SPACE: 5 * 60, // 5 minutes
  SPACES_LIST: 15 * 60, // 15 minutes
} 
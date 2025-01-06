import { TwitterApi, type SpaceV2 } from 'twitter-api-v2';
import { redis, CACHE_KEYS, CACHE_TTL } from './redis';
import { handleTwitterRateLimit } from './twitter-rate-limit';
import { supabase } from './supabase';

// Interface for our component
export interface TwitterSpace {
  id: string;
  title: string;
  hostUsername: string;
  isLive: boolean;
  participantCount: number;
  scheduledStart?: string;
  lastUpdated: number;
}

const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN!);

async function getUserIdByUsername(username: string): Promise<string | null> {
  try {
    return await handleTwitterRateLimit(
      'USER_LOOKUP',
      `user_${username}`,
      async () => {
        const user = await client.v2.userByUsername(username);
        return user.data?.id || null;
      }
    );
  } catch (error) {
    console.error('Error fetching user ID:', error);
    return null;
  }
}

export async function getLiveSpacesByUsername(username: string): Promise<TwitterSpace[]> {
  try {
    // Increase cache duration to reduce API calls
    const CACHE_DURATION = 5 * 60; // 5 minutes
    const cacheKey = `spaces_${username}`;
    
    // Check cache first
    const cached = await redis.get<string>(cacheKey);
    if (cached) {
      console.log('Returning cached data');
      return JSON.parse(cached);
    }

    // Get user ID first
    const userId = await getUserIdByUsername(username);
    if (!userId) {
      throw new Error('User not found');
    }

    // Only call Twitter API if cache miss
    const spacesData = await handleTwitterRateLimit(
      'SPACES_LOOKUP',
      `spaces_${username}`,
      async () => {
        const response = await client.v2.spacesByCreators([userId]);
        return response.data || [];
      }
    );

    // Transform the spaces data to match our interface
    const spaces: TwitterSpace[] = spacesData.map((space: SpaceV2) => ({
      id: space.id,
      title: space.title || 'Untitled Space',
      hostUsername: username,
      isLive: space.state === 'live',
      participantCount: space.participant_count || 0,
      scheduledStart: space.scheduled_start,
      lastUpdated: Date.now()
    }));

    // Cache the result
    await redis.set(cacheKey, JSON.stringify(spaces), {
      ex: CACHE_DURATION
    });

    return spaces;
  } catch (error: unknown) {
    // On rate limit, return cached data even if expired
    if (error instanceof Error && 'code' in error && error.code === 429) {
      const staleData = await redis.get<string>(`spaces_${username}`);
      if (staleData) return JSON.parse(staleData);
    }
    throw error;
  }
}

// Function to get a specific space by ID
export async function getSpaceById(spaceId: string): Promise<TwitterSpace | null> {
  try {
    // Try to get from cache first
    const cacheKey = CACHE_KEYS.SPACE(spaceId);
    const cachedSpace = await redis.get<TwitterSpace>(cacheKey);

    if (cachedSpace) {
      console.log('Returning cached space data from Redis');
      return cachedSpace;
    }

    console.log('Fetching fresh space data...');
    const space = await client.v2.space(spaceId, {
      'space.fields': ['title', 'created_at', 'state', 'participant_count', 'host_ids'],
      'expansions': ['host_ids'],
      'user.fields': ['username']
    });
    
    if (!space.data) {
      return null;
    }

    const spaceData: TwitterSpace = {
      id: space.data.id,
      title: space.data.title || 'Untitled Space',
      participantCount: space.data.participant_count || 0,
      isLive: space.data.state === 'live',
      hostUsername: space.includes?.users?.[0]?.username || 'Unknown Host',
      scheduledStart: space.data.created_at,
      lastUpdated: Date.now()
    };

    // Cache the space data
    await redis.set(
      cacheKey,
      spaceData,
      { ex: CACHE_TTL.SPACE }
    );

    return spaceData;
  } catch (error) {
    if (error instanceof Error && error.message.includes('429')) {
      console.log('Rate limit hit, checking cache...');
      const cacheKey = CACHE_KEYS.SPACE(spaceId);
      return await redis.get<TwitterSpace>(cacheKey);
    }

    console.error('Error fetching Twitter Space:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      spaceId,
      timestamp: new Date().toISOString()
    });

    return null;
  }
}

// Keep the original function but modify it to use the new getSpaceById
export async function getLiveSpaces(username: string): Promise<TwitterSpace[]> {
  const space = await getSpaceById('1ypJdpEkNeqJW');
  return space ? [space] : [];
}

// Instead of checking one user at a time, batch them
export async function getLiveSpacesForUsers(usernames: string[]): Promise<Record<string, TwitterSpace[]>> {
  const results: Record<string, TwitterSpace[]> = {};
  
  // Process in batches of 25 to respect rate limits
  const BATCH_SIZE = 25;
  for (let i = 0; i < usernames.length; i += BATCH_SIZE) {
    const batch = usernames.slice(i, i + BATCH_SIZE);
    
    // Wait between batches to respect rate limits
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 15 * 60 * 1000)); // 15 minutes
    }

    // Process batch
    await Promise.all(
      batch.map(async username => {
        results[username] = await getLiveSpacesByUsername(username);
      })
    );
  }

  return results;
}

export async function getSpaceWithFallback(spaceId: string): Promise<TwitterSpace | null> {
  try {
    return await getSpaceById(spaceId);
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 429) {
      // Return basic info from database if available
      const { data } = await supabase
        .from('scheduled_spaces')
        .select('*')
        .eq('id', spaceId)
        .single();
        
      if (data) {
        return {
          id: data.id,
          title: data.title,
          hostUsername: data.host_username,
          isLive: false, // Can't know for sure without API
          participantCount: 0, // Can't know without API
          scheduledStart: data.scheduled_for,
          lastUpdated: Date.now()
        };
      }
    }
    return null;
  }
} 
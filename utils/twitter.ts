import { TwitterApi } from 'twitter-api-v2';
import { redis, CACHE_KEYS, CACHE_TTL } from './redis';

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
    const user = await client.v2.userByUsername(username);
    return user.data?.id || null;
  } catch (error) {
    console.error('Error fetching user ID:', error);
    return null;
  }
}

export async function getLiveSpacesByUsername(username: string): Promise<TwitterSpace[]> {
  try {
    // Check cache first
    const cacheKey = CACHE_KEYS.SPACES_LIST + `:${username}`;
    const cachedSpaces = await redis.get<TwitterSpace[]>(cacheKey);

    if (cachedSpaces) {
      console.log('Returning cached spaces data');
      return cachedSpaces;
    }

    // Get user ID
    const userId = await getUserIdByUsername(username);
    if (!userId) {
      throw new Error('User not found');
    }

    // Fetch spaces by creator
    const spaces = await client.v2.spacesByCreators([userId], {
      'space.fields': ['title', 'created_at', 'state', 'participant_count', 'host_ids'],
      'expansions': ['host_ids'],
      'user.fields': ['username']
    });

    // Filter only live spaces and format them
    const liveSpaces = spaces.data
      .filter(space => space.state === 'live')
      .map(space => ({
        id: space.id,
        title: space.title || 'Untitled Space',
        participantCount: space.participant_count || 0,
        isLive: true,
        hostUsername: username,
        scheduledStart: space.created_at,
        lastUpdated: Date.now()
      }));

    // Cache the result
    await redis.set(cacheKey, liveSpaces, { ex: CACHE_TTL.SPACE });

    return liveSpaces;
  } catch (error) {
    if (error instanceof Error && error.message.includes('429')) {
      console.log('Rate limit hit, checking cache...');
      const cacheKey = CACHE_KEYS.SPACES_LIST + `:${username}`;
      return await redis.get<TwitterSpace[]>(cacheKey) || [];
    }

    console.error('Error fetching live spaces:', error);
    return [];
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
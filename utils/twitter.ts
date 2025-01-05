import { TwitterApi } from 'twitter-api-v2';

// Interface for our component
export interface TwitterSpace {
  id: string;
  title: string;
  hostUsername: string;
  isLive: boolean;
  participantCount: number;
  scheduledStart?: string;
}

// Simple in-memory cache
let spaceCache: {
  data: TwitterSpace | null;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN!);

// Function to get a specific space by ID
export async function getSpaceById(spaceId: string): Promise<TwitterSpace | null> {
  try {
    // Check cache first
    if (spaceCache && (Date.now() - spaceCache.timestamp < CACHE_DURATION)) {
      console.log('Returning cached space data');
      return spaceCache.data;
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

    const spaceData = {
      id: space.data.id,
      title: space.data.title || 'Untitled Space',
      participantCount: space.data.participant_count || 0,
      isLive: space.data.state === 'live',
      hostUsername: space.includes?.users?.[0]?.username || 'Unknown Host',
      scheduledStart: space.data.created_at
    };

    // Update cache
    spaceCache = {
      data: spaceData,
      timestamp: Date.now()
    };

    return spaceData;
  } catch (error) {
    if (error instanceof Error && error.message.includes('429')) {
      console.log('Rate limit hit, returning cached data if available');
      return spaceCache?.data || null;
    }

    console.error('Error fetching Twitter Space:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      spaceId,
      timestamp: new Date().toISOString()
    });

    // Return cached data if available, null otherwise
    return spaceCache?.data || null;
  }
}

// Keep the original function but modify it to use the new getSpaceById
export async function getLiveSpaces(username: string): Promise<TwitterSpace[]> {
  // For testing, let's try to fetch the specific space
  const space = await getSpaceById('1kvKpbAmbnDJE');
  return space ? [space] : [];
} 
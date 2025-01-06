import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redis, CACHE_KEYS } from '@/utils/redis';

interface ScheduledSpace {
  id: string;
  title: string;
  scheduledFor: string;
  guestSpeaker: string;
  description: string;
  createdAt: string;
  createdBy: string;
}

export async function POST(request: Request) {
  try {
    // Check if user is admin
    const { userId } = await auth();
    if (userId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get form data
    const data = await request.json();
    
    // Generate unique ID for the space
    const spaceId = `space_${Date.now()}`;
    
    const scheduledSpace: ScheduledSpace = {
      id: spaceId,
      ...data,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    // Store in Redis
    // Key format: scheduled_space:{spaceId}
    await redis.set(
      CACHE_KEYS.SPACE(spaceId),
      scheduledSpace,
      { ex: 60 * 60 * 24 * 7 } // Expire after 7 days
    );

    // Add to list of scheduled spaces
    await redis.sadd(CACHE_KEYS.SPACES_LIST, spaceId);

    return NextResponse.json({
      success: true,
      space: scheduledSpace
    });
  } catch (error) {
    console.error('Error scheduling space:', error);
    return NextResponse.json(
      { error: 'Failed to schedule space' },
      { status: 500 }
    );
  }
}

// Get all scheduled spaces
export async function GET() {
  try {
    const { userId } = await auth();
    if (userId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all space IDs
    const spaceIds = await redis.smembers(CACHE_KEYS.SPACES_LIST);
    console.log('Space IDs found:', spaceIds); // Debug log
    
    // Get all spaces with error handling
    const spaces = await Promise.all(
      spaceIds.map(async (id) => {
        try {
          const space = await redis.get<ScheduledSpace>(CACHE_KEYS.SPACE(id));
          console.log(`Space ${id}:`, space); // Debug log
          return space;
        } catch (error) {
          console.error(`Error fetching space ${id}:`, error);
          return null;
        }
      })
    );

    // Filter out null values and sort by scheduledFor date
    const validSpaces = spaces
      .filter((space): space is ScheduledSpace => space !== null)
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());

    return NextResponse.json({
      success: true,
      spaces: validSpaces
    });
  } catch (error) {
    console.error('Detailed error fetching scheduled spaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled spaces', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
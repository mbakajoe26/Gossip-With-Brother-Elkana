import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redis, CACHE_KEYS } from '@/utils/redis';
import { supabase, type ScheduledSpace } from '@/utils/supabase';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId || userId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const spaceId = `space_${Date.now()}`;
    
    const scheduledSpace: ScheduledSpace = {
      id: spaceId,
      title: data.title,
      scheduledfor: data.scheduledFor,
      guestspeaker: data.guestSpeaker,
      description: data.description,
      createdat: new Date().toISOString(),
      createdby: userId,
    };

    console.log('Inserting space:', scheduledSpace);

    // Store in Supabase
    const { error: supabaseError } = await supabase
      .from('scheduled_spaces')
      .insert([scheduledSpace]);

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
      throw supabaseError;
    }

    // Cache in Redis
    await redis.set(
      CACHE_KEYS.SPACE(spaceId),
      scheduledSpace,
      { ex: 60 * 60 } // 1 hour cache
    );

    // Invalidate the list cache to ensure fresh data
    await redis.del(CACHE_KEYS.SPACES_LIST);

    return NextResponse.json({ success: true, space: scheduledSpace });
  } catch (error) {
    console.error('Detailed error scheduling space:', error);
    return NextResponse.json(
      { error: 'Failed to schedule space', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId || userId !== process.env.ADMIN_USER_ID) {
      console.log('Unauthorized access attempt:', { userId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try cache first
    const cachedSpaces = await redis.get<ScheduledSpace[]>(CACHE_KEYS.SPACES_LIST);
    if (cachedSpaces) {
      console.log('Returning cached spaces');
      return NextResponse.json({ success: true, spaces: cachedSpaces });
    }

    console.log('Fetching from Supabase...');
    // Fetch from Supabase
    const { data: spaces, error: supabaseError } = await supabase
      .from('scheduled_spaces')
      .select('*')
      .order('scheduledFor', { ascending: true });

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
      throw supabaseError;
    }

    if (!spaces) {
      return NextResponse.json({ success: true, spaces: [] });
    }

    // Cache the result
    await redis.set(
      CACHE_KEYS.SPACES_LIST,
      spaces,
      { ex: 60 * 5 } // 5 minutes cache
    );

    return NextResponse.json({ success: true, spaces });
  } catch (error) {
    console.error('Detailed error fetching spaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spaces', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
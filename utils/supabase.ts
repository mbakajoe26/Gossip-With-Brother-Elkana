import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
  }
)

// Helper function for error handling
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  throw new Error(error.message || 'An unexpected error occurred')
}

export interface ScheduledSpace {
  id: string
  title: string
  scheduledfor: string
  guestspeaker: string
  description: string
  createdat: string
  createdby: string
}

// SQL for creating the table:
/*
create table scheduled_spaces (
  id text primary key,
  title text not null,
  scheduledfor timestamp with time zone not null,
  guestspeaker text,
  description text,
  createdat timestamp with time zone default now(),
  createdby text not null
);
*/ 
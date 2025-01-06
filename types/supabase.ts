export interface Database {
  public: {
    Tables: {
      scheduled_spaces: {
        Row: {
          id: string
          title: string
          scheduledfor: string
          guestspeaker: string | null
          description: string | null
          createdat: string
          createdby: string
        }
        Insert: {
          id: string
          title: string
          scheduledfor: string
          guestspeaker?: string | null
          description?: string | null
          createdat?: string
          createdby: string
        }
        Update: {
          id?: string
          title?: string
          scheduledfor?: string
          guestspeaker?: string | null
          description?: string | null
          createdat?: string
          createdby?: string
        }
      }
      // Add other tables here as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      equipment_catalog: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          item_key: string
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_key: string
          name: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_key?: string
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      event_plans: {
        Row: {
          additional_notes: string | null
          bouquet_toss_artist: string | null
          bouquet_toss_song: string | null
          cake_cutting_artist: string | null
          cake_cutting_song: string | null
          client_id: string
          client_name: string
          created_at: string
          created_by: string | null
          dietary_notes: string | null
          do_not_play_songs: string | null
          email: string
          entrance_artist: string | null
          entrance_song: string | null
          event_date: string | null
          event_style: string | null
          event_type: string | null
          first_dance_artist: string | null
          first_dance_song: string | null
          guest_count: number | null
          id: string
          last_song: string | null
          last_song_artist: string | null
          mc_notes: string | null
          must_play_songs: string | null
          quote_id: string | null
          schedule_items: Json | null
          special_announcements: string | null
          timeline_notes: string | null
          updated_at: string
          uplighting_color: string | null
          venue: string | null
        }
        Insert: {
          additional_notes?: string | null
          bouquet_toss_artist?: string | null
          bouquet_toss_song?: string | null
          cake_cutting_artist?: string | null
          cake_cutting_song?: string | null
          client_id: string
          client_name: string
          created_at?: string
          created_by?: string | null
          dietary_notes?: string | null
          do_not_play_songs?: string | null
          email: string
          entrance_artist?: string | null
          entrance_song?: string | null
          event_date?: string | null
          event_style?: string | null
          event_type?: string | null
          first_dance_artist?: string | null
          first_dance_song?: string | null
          guest_count?: number | null
          id?: string
          last_song?: string | null
          last_song_artist?: string | null
          mc_notes?: string | null
          must_play_songs?: string | null
          quote_id?: string | null
          schedule_items?: Json | null
          special_announcements?: string | null
          timeline_notes?: string | null
          updated_at?: string
          uplighting_color?: string | null
          venue?: string | null
        }
        Update: {
          additional_notes?: string | null
          bouquet_toss_artist?: string | null
          bouquet_toss_song?: string | null
          cake_cutting_artist?: string | null
          cake_cutting_song?: string | null
          client_id?: string
          client_name?: string
          created_at?: string
          created_by?: string | null
          dietary_notes?: string | null
          do_not_play_songs?: string | null
          email?: string
          entrance_artist?: string | null
          entrance_song?: string | null
          event_date?: string | null
          event_style?: string | null
          event_type?: string | null
          first_dance_artist?: string | null
          first_dance_song?: string | null
          guest_count?: number | null
          id?: string
          last_song?: string | null
          last_song_artist?: string | null
          mc_notes?: string | null
          must_play_songs?: string | null
          quote_id?: string | null
          schedule_items?: Json | null
          special_announcements?: string | null
          timeline_notes?: string | null
          updated_at?: string
          uplighting_color?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_plans_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          dj_name: string | null
          event_date: string | null
          google_review_url: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dj_name?: string | null
          event_date?: string | null
          google_review_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dj_name?: string | null
          event_date?: string | null
          google_review_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      packages: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          includes: Json
          is_active: boolean
          name: string
          popular: boolean
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string
          id?: string
          includes?: Json
          is_active?: boolean
          name: string
          popular?: boolean
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          includes?: Json
          is_active?: boolean
          name?: string
          popular?: boolean
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          balance: number | null
          balance_paid: boolean
          balance_paid_at: string | null
          client_id: string
          client_name: string
          contact_no: string | null
          created_at: string
          created_by: string | null
          custom_items: Json | null
          custom_items_cost: number | null
          deposit: number | null
          deposit_paid: boolean
          deposit_paid_at: string | null
          discount_amount: number | null
          discount_percent: number | null
          dj_cost: number | null
          dj_name: string | null
          email: string
          end_time: string | null
          equipment: Json | null
          equipment_cost: number | null
          event_date: string | null
          event_type: string | null
          hours: number | null
          id: string
          kids_corner: boolean | null
          kids_cost: number | null
          kids_hours: number | null
          start_time: string | null
          status: string | null
          subtotal: number | null
          total: number | null
          travel_cost: number | null
          travel_distance: number | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          balance?: number | null
          balance_paid?: boolean
          balance_paid_at?: string | null
          client_id: string
          client_name: string
          contact_no?: string | null
          created_at?: string
          created_by?: string | null
          custom_items?: Json | null
          custom_items_cost?: number | null
          deposit?: number | null
          deposit_paid?: boolean
          deposit_paid_at?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          dj_cost?: number | null
          dj_name?: string | null
          email: string
          end_time?: string | null
          equipment?: Json | null
          equipment_cost?: number | null
          event_date?: string | null
          event_type?: string | null
          hours?: number | null
          id?: string
          kids_corner?: boolean | null
          kids_cost?: number | null
          kids_hours?: number | null
          start_time?: string | null
          status?: string | null
          subtotal?: number | null
          total?: number | null
          travel_cost?: number | null
          travel_distance?: number | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          balance?: number | null
          balance_paid?: boolean
          balance_paid_at?: string | null
          client_id?: string
          client_name?: string
          contact_no?: string | null
          created_at?: string
          created_by?: string | null
          custom_items?: Json | null
          custom_items_cost?: number | null
          deposit?: number | null
          deposit_paid?: boolean
          deposit_paid_at?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          dj_cost?: number | null
          dj_name?: string | null
          email?: string
          end_time?: string | null
          equipment?: Json | null
          equipment_cost?: number | null
          event_date?: string | null
          event_type?: string | null
          hours?: number | null
          id?: string
          kids_corner?: boolean | null
          kids_cost?: number | null
          kids_hours?: number | null
          start_time?: string | null
          status?: string | null
          subtotal?: number | null
          total?: number | null
          travel_cost?: number | null
          travel_distance?: number | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_settings: {
        Row: {
          created_at: string
          description: string
          id: string
          label: string
          setting_key: string
          setting_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          label?: string
          setting_key: string
          setting_value?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          label?: string
          setting_key?: string
          setting_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      song_requests: {
        Row: {
          artist: string
          created_at: string
          event_id: string
          guest_name: string | null
          id: string
          message: string | null
          song_title: string
          status: string
        }
        Insert: {
          artist: string
          created_at?: string
          event_id: string
          guest_name?: string | null
          id?: string
          message?: string | null
          song_title: string
          status?: string
        }
        Update: {
          artist?: string
          created_at?: string
          event_id?: string
          guest_name?: string | null
          id?: string
          message?: string | null
          song_title?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_profile_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "client"],
    },
  },
} as const

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
      admin_notifications: {
        Row: {
          client_code: string | null
          created_at: string
          email: string | null
          id: string
          is_read: boolean
          message: string
          quote_id: string | null
          title: string
          type: string
        }
        Insert: {
          client_code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_read?: boolean
          message: string
          quote_id?: string | null
          title: string
          type?: string
        }
        Update: {
          client_code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_read?: boolean
          message?: string
          quote_id?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      alarms: {
        Row: {
          ai_reasoning: string | null
          category: string
          client_email: string | null
          client_name: string | null
          created_at: string
          description: string
          done_at: string | null
          due_at: string
          id: string
          is_done: boolean
          quote_id: string | null
          quote_request_id: string | null
          stage: number
          title: string
          updated_at: string
        }
        Insert: {
          ai_reasoning?: string | null
          category: string
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          description?: string
          done_at?: string | null
          due_at: string
          id?: string
          is_done?: boolean
          quote_id?: string | null
          quote_request_id?: string | null
          stage?: number
          title: string
          updated_at?: string
        }
        Update: {
          ai_reasoning?: string | null
          category?: string
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          description?: string
          done_at?: string | null
          due_at?: string
          id?: string
          is_done?: boolean
          quote_id?: string | null
          quote_request_id?: string | null
          stage?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      client_access_logs: {
        Row: {
          client_code: string
          created_at: string
          email: string
          id: string
          ip_address: string | null
          quote_id: string
          user_agent: string | null
        }
        Insert: {
          client_code: string
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          quote_id: string
          user_agent?: string | null
        }
        Update: {
          client_code?: string
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          quote_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      client_reviews: {
        Row: {
          created_at: string
          event_id: string | null
          guest_email: string | null
          guest_name: string | null
          id: string
          message: string | null
          posted_to_bark: boolean
          posted_to_facebook: boolean
          rating: number
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          message?: string | null
          posted_to_bark?: boolean
          posted_to_facebook?: boolean
          rating: number
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          message?: string | null
          posted_to_bark?: boolean
          posted_to_facebook?: boolean
          rating?: number
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_entries: {
        Row: {
          competition_id: string
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          user_id: string | null
        }
        Insert: {
          competition_id: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          competition_id?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_entries_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          created_at: string
          description: string
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          prize: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          prize?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          prize?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      event_photos: {
        Row: {
          caption: string | null
          client_code: string
          created_at: string
          id: string
          photo_url: string
          quote_id: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          client_code: string
          created_at?: string
          id?: string
          photo_url: string
          quote_id: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          client_code?: string
          created_at?: string
          id?: string
          photo_url?: string
          quote_id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      event_plans: {
        Row: {
          additional_notes: string | null
          artists_to_avoid: string | null
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
          father_daughter_artist: string | null
          father_daughter_song: string | null
          first_dance_artist: string | null
          first_dance_song: string | null
          guest_count: number | null
          id: string
          last_song: string | null
          last_song_artist: string | null
          mc_notes: string | null
          mother_son_artist: string | null
          mother_son_song: string | null
          must_play_songs: string | null
          preferred_genres: string | null
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
          artists_to_avoid?: string | null
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
          father_daughter_artist?: string | null
          father_daughter_song?: string | null
          first_dance_artist?: string | null
          first_dance_song?: string | null
          guest_count?: number | null
          id?: string
          last_song?: string | null
          last_song_artist?: string | null
          mc_notes?: string | null
          mother_son_artist?: string | null
          mother_son_song?: string | null
          must_play_songs?: string | null
          preferred_genres?: string | null
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
          artists_to_avoid?: string | null
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
          father_daughter_artist?: string | null
          father_daughter_song?: string | null
          first_dance_artist?: string | null
          first_dance_song?: string | null
          guest_count?: number | null
          id?: string
          last_song?: string | null
          last_song_artist?: string | null
          mc_notes?: string | null
          mother_son_artist?: string | null
          mother_son_song?: string | null
          must_play_songs?: string | null
          preferred_genres?: string | null
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
      event_playlist_items: {
        Row: {
          artist: string | null
          created_at: string
          cue_time_seconds: number | null
          id: string
          moment: string
          notes: string | null
          playlist_id: string
          song_title: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          artist?: string | null
          created_at?: string
          cue_time_seconds?: number | null
          id?: string
          moment?: string
          notes?: string | null
          playlist_id: string
          song_title: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          artist?: string | null
          created_at?: string
          cue_time_seconds?: number | null
          id?: string
          moment?: string
          notes?: string | null
          playlist_id?: string
          song_title?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "event_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      event_playlists: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          quote_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          quote_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          quote_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_playlists_quote_id_fkey"
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
      music_tracks: {
        Row: {
          active: boolean
          artist: string | null
          created_at: string
          duration_seconds: number | null
          file_url: string
          id: string
          mime_type: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          artist?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          artist?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
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
          image_url?: string | null
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
          image_url?: string | null
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
      quote_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          quote_id: string
          sender_id: string | null
          sender_name: string
          sender_role: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          quote_id: string
          sender_id?: string | null
          sender_name: string
          sender_role: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          quote_id?: string
          sender_id?: string | null
          sender_name?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_messages_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          client_id: string
          client_name: string
          contact_no: string | null
          created_at: string
          email: string
          end_time: string | null
          event_date: string | null
          event_type: string
          guest_count: number | null
          id: string
          is_outdoor: boolean
          needs_lighting: boolean
          needs_mic: boolean
          needs_sound: boolean
          needs_special_effects: boolean
          notes: string | null
          package_id: string | null
          package_name: string | null
          quote_id: string | null
          start_time: string | null
          status: string
          updated_at: string
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          client_id: string
          client_name: string
          contact_no?: string | null
          created_at?: string
          email: string
          end_time?: string | null
          event_date?: string | null
          event_type: string
          guest_count?: number | null
          id?: string
          is_outdoor?: boolean
          needs_lighting?: boolean
          needs_mic?: boolean
          needs_sound?: boolean
          needs_special_effects?: boolean
          notes?: string | null
          package_id?: string | null
          package_name?: string | null
          quote_id?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          client_id?: string
          client_name?: string
          contact_no?: string | null
          created_at?: string
          email?: string
          end_time?: string | null
          event_date?: string | null
          event_type?: string
          guest_count?: number | null
          id?: string
          is_outdoor?: boolean
          needs_lighting?: boolean
          needs_mic?: boolean
          needs_sound?: boolean
          needs_special_effects?: boolean
          notes?: string | null
          package_id?: string | null
          package_name?: string | null
          quote_id?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          balance: number | null
          balance_paid: boolean
          balance_paid_at: string | null
          client_code: string | null
          client_id: string
          client_name: string
          contact_no: string | null
          created_at: string
          created_by: string | null
          custom_items: Json | null
          custom_items_cost: number | null
          decline_reason: string | null
          declined_at: string | null
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
          extras: Json
          extras_cost: number
          hours: number | null
          human_jukebox: boolean
          human_jukebox_hours: number
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
          client_code?: string | null
          client_id: string
          client_name: string
          contact_no?: string | null
          created_at?: string
          created_by?: string | null
          custom_items?: Json | null
          custom_items_cost?: number | null
          decline_reason?: string | null
          declined_at?: string | null
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
          extras?: Json
          extras_cost?: number
          hours?: number | null
          human_jukebox?: boolean
          human_jukebox_hours?: number
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
          client_code?: string | null
          client_id?: string
          client_name?: string
          contact_no?: string | null
          created_at?: string
          created_by?: string | null
          custom_items?: Json | null
          custom_items_cost?: number | null
          decline_reason?: string | null
          declined_at?: string | null
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
          extras?: Json
          extras_cost?: number
          hours?: number | null
          human_jukebox?: boolean
          human_jukebox_hours?: number
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
      specials: {
        Row: {
          created_at: string
          discount_percent: number | null
          id: string
          image_url: string
          is_active: boolean
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          image_url: string
          is_active?: boolean
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          image_url?: string
          is_active?: boolean
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          client_name: string
          created_at: string
          event_type: string | null
          id: string
          is_live: boolean
          message: string
          photo_url: string | null
          rating: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          client_name: string
          created_at?: string
          event_type?: string | null
          id?: string
          is_live?: boolean
          message: string
          photo_url?: string | null
          rating?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          client_name?: string
          created_at?: string
          event_type?: string | null
          id?: string
          is_live?: boolean
          message?: string
          photo_url?: string | null
          rating?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
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
      youtube_videos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
          youtube_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
          youtube_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
          youtube_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_banking_details: {
        Args: never
        Returns: {
          key: string
          value: string
        }[]
      }
      get_my_profile_id: { Args: never; Returns: string }
      get_public_business_settings: {
        Args: never
        Returns: {
          key: string
          value: string
        }[]
      }
      get_service_settings: {
        Args: never
        Returns: {
          setting_key: string
          setting_value: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      log_client_portal_visit: {
        Args: {
          _client_code: string
          _email: string
          _quote_id: string
          _user_agent?: string
        }
        Returns: string
      }
      lookup_quote_by_code: {
        Args: { _code: string; _email: string }
        Returns: {
          balance: number | null
          balance_paid: boolean
          balance_paid_at: string | null
          client_code: string | null
          client_id: string
          client_name: string
          contact_no: string | null
          created_at: string
          created_by: string | null
          custom_items: Json | null
          custom_items_cost: number | null
          decline_reason: string | null
          declined_at: string | null
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
          extras: Json
          extras_cost: number
          hours: number | null
          human_jukebox: boolean
          human_jukebox_hours: number
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
        }[]
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
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

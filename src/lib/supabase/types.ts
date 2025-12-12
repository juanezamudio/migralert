export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      reports: {
        Row: {
          id: string
          location: unknown // PostGIS geography point
          city: string
          region: string
          activity_type: "checkpoint" | "raid" | "patrol" | "detention" | "other"
          description: string | null
          image_url: string
          status: "pending" | "verified" | "removed"
          confidence_score: number
          reporter_id: string | null
          verified_by: string | null
          created_at: string
          expires_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          location: unknown
          city: string
          region: string
          activity_type: "checkpoint" | "raid" | "patrol" | "detention" | "other"
          description?: string | null
          image_url: string
          status?: "pending" | "verified" | "removed"
          confidence_score?: number
          reporter_id?: string | null
          verified_by?: string | null
          created_at?: string
          expires_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          location?: unknown
          city?: string
          region?: string
          activity_type?: "checkpoint" | "raid" | "patrol" | "detention" | "other"
          description?: string | null
          image_url?: string
          status?: "pending" | "verified" | "removed"
          confidence_score?: number
          reporter_id?: string | null
          verified_by?: string | null
          created_at?: string
          expires_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          preferred_language: "en" | "es"
          role: "user" | "moderator" | "admin"
          moderator_regions: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          preferred_language?: "en" | "es"
          role?: "user" | "moderator" | "admin"
          moderator_regions?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          preferred_language?: "en" | "es"
          role?: "user" | "moderator" | "admin"
          moderator_regions?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      emergency_contacts: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string
          relationship: string | null
          contact_order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone: string
          relationship?: string | null
          contact_order: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone?: string
          relationship?: string | null
          contact_order?: number
          created_at?: string
        }
      }
      alert_config: {
        Row: {
          user_id: string
          message: string
          share_location: boolean
          updated_at: string
        }
        Insert: {
          user_id: string
          message: string
          share_location?: boolean
          updated_at?: string
        }
        Update: {
          user_id?: string
          message?: string
          share_location?: boolean
          updated_at?: string
        }
      }
      report_interactions: {
        Row: {
          id: string
          report_id: string
          user_id: string | null
          interaction_type: "confirm" | "no_longer_active" | "false"
          ip_hash: string | null
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          user_id?: string | null
          interaction_type: "confirm" | "no_longer_active" | "false"
          ip_hash?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          user_id?: string | null
          interaction_type?: "confirm" | "no_longer_active" | "false"
          ip_hash?: string | null
          created_at?: string
        }
      }
      user_connections: {
        Row: {
          id: string
          user_id: string
          connected_user_id: string
          status: "pending" | "accepted"
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          connected_user_id: string
          status?: "pending" | "accepted"
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          connected_user_id?: string
          status?: "pending" | "accepted"
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reports_within_radius: {
        Args: {
          lat: number
          lng: number
          radius_miles: number
        }
        Returns: {
          id: string
          latitude: number
          longitude: number
          city: string
          region: string
          activity_type: string
          description: string | null
          image_url: string
          status: string
          confidence_score: number
          created_at: string
          expires_at: string
          distance_miles: number
        }[]
      }
    }
    Enums: {
      activity_type: "checkpoint" | "raid" | "patrol" | "detention" | "other"
      report_status: "pending" | "verified" | "removed"
      user_role: "user" | "moderator" | "admin"
      language: "en" | "es"
      interaction_type: "confirm" | "no_longer_active" | "false"
      connection_status: "pending" | "accepted"
    }
  }
}

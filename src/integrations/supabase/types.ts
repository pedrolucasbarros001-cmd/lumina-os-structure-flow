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
      appointments: {
        Row: {
          address: string | null
          amount_received: number | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          datetime: string
          displacement_fee: number
          distance_km: number | null
          duration: number
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_status: string
          service_ids: string[]
          status: Database["public"]["Enums"]["appointment_status"]
          team_member_id: string | null
          type: Database["public"]["Enums"]["appointment_type"]
          unit_id: string
          updated_at: string
          value: number
        }
        Insert: {
          address?: string | null
          amount_received?: number | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          datetime: string
          displacement_fee?: number
          distance_km?: number | null
          duration?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          service_ids?: string[]
          status?: Database["public"]["Enums"]["appointment_status"]
          team_member_id?: string | null
          type?: Database["public"]["Enums"]["appointment_type"]
          unit_id: string
          updated_at?: string
          value?: number
        }
        Update: {
          address?: string | null
          amount_received?: number | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          datetime?: string
          displacement_fee?: number
          distance_km?: number | null
          duration?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          service_ids?: string[]
          status?: Database["public"]["Enums"]["appointment_status"]
          team_member_id?: string | null
          type?: Database["public"]["Enums"]["appointment_type"]
          unit_id?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      join_requests: {
        Row: {
          created_at: string
          id: string
          requester_id: string
          status: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      mobility_settings: {
        Row: {
          base_fee: number
          created_at: string
          id: string
          price_per_km: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          base_fee?: number
          created_at?: string
          id?: string
          price_per_km?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          base_fee?: number
          created_at?: string
          id?: string
          price_per_km?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobility_settings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: true
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agenda_tutorial_completed: boolean
          avatar_url: string | null
          business_type: string | null
          created_at: string
          full_name: string | null
          id: string
          language: string
          onboarding_completed: boolean
          service_model: string | null
          setup_completed: boolean
          team_size: string | null
          updated_at: string
        }
        Insert: {
          agenda_tutorial_completed?: boolean
          avatar_url?: string | null
          business_type?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          language?: string
          onboarding_completed?: boolean
          service_model?: string | null
          setup_completed?: boolean
          team_size?: string | null
          updated_at?: string
        }
        Update: {
          agenda_tutorial_completed?: boolean
          avatar_url?: string | null
          business_type?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string
          onboarding_completed?: boolean
          service_model?: string | null
          setup_completed?: boolean
          team_size?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          duration: number
          id: string
          image_url: string | null
          is_active: boolean
          is_home_service: boolean
          is_presential: boolean
          name: string
          price: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_home_service?: boolean
          is_presential?: boolean
          name: string
          price?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_home_service?: boolean
          is_presential?: boolean
          name?: string
          price?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member_services: {
        Row: {
          id: string
          service_id: string
          team_member_id: string
        }
        Insert: {
          id?: string
          service_id: string
          team_member_id: string
        }
        Update: {
          id?: string
          service_id?: string
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_member_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_services_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          accepts_home_visits: boolean
          bio: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          photo_url: string | null
          role: string
          unit_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accepts_home_visits?: boolean
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          photo_url?: string | null
          role?: string
          unit_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accepts_home_visits?: boolean
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          photo_url?: string | null
          role?: string
          unit_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          accepts_home_visits: boolean
          address: string | null
          bio: string | null
          business_hours: Json
          business_type: string | null
          cover_url: string | null
          coverage_radius_km: number
          created_at: string
          id: string
          is_published: boolean
          latitude: number | null
          logistics_type: string | null
          logo_url: string | null
          longitude: number | null
          name: string
          owner_id: string
          phone: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          accepts_home_visits?: boolean
          address?: string | null
          bio?: string | null
          business_hours?: Json
          business_type?: string | null
          cover_url?: string | null
          coverage_radius_km?: number
          created_at?: string
          id?: string
          is_published?: boolean
          latitude?: number | null
          logistics_type?: string | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          owner_id: string
          phone?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          accepts_home_visits?: boolean
          address?: string | null
          bio?: string | null
          business_hours?: Json
          business_type?: string | null
          cover_url?: string | null
          coverage_radius_km?: number
          created_at?: string
          id?: string
          is_published?: boolean
          latitude?: number | null
          logistics_type?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string
          phone?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "team_member"
      appointment_status:
        | "pending_approval"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      appointment_type: "unit" | "home"
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
      app_role: ["owner", "team_member"],
      appointment_status: [
        "pending_approval",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      appointment_type: ["unit", "home"],
    },
  },
} as const

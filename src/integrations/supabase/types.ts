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
      appointment_confirmations: {
        Row: {
          appointment_id: string
          confirmation_token: string
          confirmed_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          reminder_sent_at: string | null
          status: string | null
        }
        Insert: {
          appointment_id: string
          confirmation_token: string
          confirmed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          reminder_sent_at?: string | null
          status?: string | null
        }
        Update: {
          appointment_id?: string
          confirmation_token?: string
          confirmed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          reminder_sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_confirmations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          address: string | null
          amount_received: number | null
          assistant_last_update: string | null
          assistant_lat: number | null
          assistant_lng: number | null
          assistant_status: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          datetime: string
          deleted_at: string | null
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
          assistant_last_update?: string | null
          assistant_lat?: number | null
          assistant_lng?: number | null
          assistant_status?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          datetime: string
          deleted_at?: string | null
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
          assistant_last_update?: string | null
          assistant_lat?: number | null
          assistant_lng?: number | null
          assistant_status?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          datetime?: string
          deleted_at?: string | null
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
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
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
      company_members: {
        Row: {
          commission_rate: number
          company_id: string
          created_at: string
          deleted_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          commission_rate?: number
          company_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          commission_rate?: number
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_logs: {
        Row: {
          confirmed_at: string | null
          created_at: string | null
          id: string
          reason: string | null
          recovered_at: string | null
          scheduled_for: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          recovered_at?: string | null
          scheduled_for: string
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          recovered_at?: string | null
          scheduled_for?: string
          user_id?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          customer_lat: number | null
          customer_lng: number | null
          customer_name: string
          customer_phone: string | null
          driver_lat: number | null
          driver_lng: number | null
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          customer_lat?: number | null
          customer_lng?: number | null
          customer_name: string
          customer_phone?: string | null
          driver_lat?: number | null
          driver_lng?: number | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          customer_lat?: number | null
          customer_lng?: number | null
          customer_name?: string
          customer_phone?: string | null
          driver_lat?: number | null
          driver_lng?: number | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
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
          active_staff_in_unit_id: string | null
          agenda_tutorial_completed: boolean
          avatar_url: string | null
          business_type: string | null
          created_at: string
          currency: string | null
          deleted_at: string | null
          deletion_period_days: number | null
          deletion_requested_at: string | null
          full_name: string | null
          id: string
          invited_via: string | null
          is_active_as_staff: boolean | null
          language: string
          linked_unit_id: string | null
          notifications_enabled: boolean | null
          onboarding_completed: boolean
          recovery_token: string | null
          service_model: string | null
          setup_completed: boolean
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          team_size: string | null
          trial_ends_at: string | null
          updated_at: string
          user_type: string | null
        }
        Insert: {
          active_staff_in_unit_id?: string | null
          agenda_tutorial_completed?: boolean
          avatar_url?: string | null
          business_type?: string | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          deletion_period_days?: number | null
          deletion_requested_at?: string | null
          full_name?: string | null
          id: string
          invited_via?: string | null
          is_active_as_staff?: boolean | null
          language?: string
          linked_unit_id?: string | null
          notifications_enabled?: boolean | null
          onboarding_completed?: boolean
          recovery_token?: string | null
          service_model?: string | null
          setup_completed?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          team_size?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_type?: string | null
        }
        Update: {
          active_staff_in_unit_id?: string | null
          agenda_tutorial_completed?: boolean
          avatar_url?: string | null
          business_type?: string | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          deletion_period_days?: number | null
          deletion_requested_at?: string | null
          full_name?: string | null
          id?: string
          invited_via?: string | null
          is_active_as_staff?: boolean | null
          language?: string
          linked_unit_id?: string | null
          notifications_enabled?: boolean | null
          onboarding_completed?: boolean
          recovery_token?: string | null
          service_model?: string | null
          setup_completed?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          team_size?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_staff_in_unit_id_fkey"
            columns: ["active_staff_in_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_linked_unit_id_fkey"
            columns: ["linked_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      staff_blocked_time: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string
          id: string
          reason: string | null
          start_time: string
          team_member_id: string
          title: string
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
          team_member_id: string
          title: string
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
          team_member_id?: string
          title?: string
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_blocked_time_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_blocked_time_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invitations: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          name: string | null
          role: string | null
          status: string | null
          token: string
          unit_id: string
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          name?: string | null
          role?: string | null
          status?: string | null
          token: string
          unit_id: string
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          name?: string | null
          role?: string | null
          status?: string | null
          token?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_invitations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          max_team_per_unit: number | null
          max_units: number | null
          owner_id: string
          plan_type: string
          started_at: string
          status: string
          updated_at: string
          will_delete_at: string | null
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          max_team_per_unit?: number | null
          max_units?: number | null
          owner_id: string
          plan_type?: string
          started_at?: string
          status?: string
          updated_at?: string
          will_delete_at?: string | null
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          max_team_per_unit?: number | null
          max_units?: number | null
          owner_id?: string
          plan_type?: string
          started_at?: string
          status?: string
          updated_at?: string
          will_delete_at?: string | null
        }
        Relationships: []
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
          categories: string[] | null
          cover_url: string | null
          coverage_radius_km: number
          created_at: string
          deleted_at: string | null
          deletion_type: string | null
          id: string
          is_public_visible: boolean | null
          is_published: boolean
          latitude: number | null
          logistics_type: string | null
          logo_url: string | null
          longitude: number | null
          name: string
          nif: string | null
          owner_id: string
          phone: string | null
          public_booking_slug: string | null
          settings_json: Json
          slug: string | null
          updated_at: string
        }
        Insert: {
          accepts_home_visits?: boolean
          address?: string | null
          bio?: string | null
          business_hours?: Json
          business_type?: string | null
          categories?: string[] | null
          cover_url?: string | null
          coverage_radius_km?: number
          created_at?: string
          deleted_at?: string | null
          deletion_type?: string | null
          id?: string
          is_public_visible?: boolean | null
          is_published?: boolean
          latitude?: number | null
          logistics_type?: string | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          nif?: string | null
          owner_id: string
          phone?: string | null
          public_booking_slug?: string | null
          settings_json?: Json
          slug?: string | null
          updated_at?: string
        }
        Update: {
          accepts_home_visits?: boolean
          address?: string | null
          bio?: string | null
          business_hours?: Json
          business_type?: string | null
          categories?: string[] | null
          cover_url?: string | null
          coverage_radius_km?: number
          created_at?: string
          deleted_at?: string | null
          deletion_type?: string | null
          id?: string
          is_public_visible?: boolean | null
          is_published?: boolean
          latitude?: number | null
          logistics_type?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          nif?: string | null
          owner_id?: string
          phone?: string | null
          public_booking_slug?: string | null
          settings_json?: Json
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
      accept_staff_invitation: {
        Args: { _token: string; _user_id: string; _user_name: string }
        Returns: Json
      }
      check_plan_limit: {
        Args: { _owner_id: string; _resource: string }
        Returns: boolean
      }
      confirm_appointment_by_token: {
        Args: { p_confirmed: boolean; p_token: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      delete_expired_accounts: {
        Args: never
        Returns: {
          deleted_count: number
        }[]
      }
      get_user_plan_limits: {
        Args: { user_id: string }
        Returns: {
          current_units: number
          max_team_per_unit: number
          max_units: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_member: { Args: { _company_id: string }; Returns: boolean }
      is_company_owner: { Args: { _company_id: string }; Returns: boolean }
      mark_expired_appointments_as_no_show: {
        Args: never
        Returns: {
          updated_count: number
        }[]
      }
      send_appointment_reminders: {
        Args: never
        Returns: {
          sent_count: number
        }[]
      }
      validate_delivery_location: {
        Args: {
          p_appointment_type: string
          p_customer_lat: number
          p_customer_lon: number
          p_unit_id: string
        }
        Returns: {
          distance_km: number
          is_valid: boolean
          reason: string
        }[]
      }
    }
    Enums: {
      app_role: "owner" | "team_member"
      appointment_status:
        | "pending_approval"
        | "confirmed"
        | "en_route"
        | "arrived"
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
        "en_route",
        "arrived",
        "completed",
        "cancelled",
        "no_show",
      ],
      appointment_type: ["unit", "home"],
    },
  },
} as const

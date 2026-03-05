export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    language: string
                    onboarding_completed: boolean
                    onboarding_step: number
                    setup_completed: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    language?: string
                    onboarding_completed?: boolean
                    onboarding_step?: number
                    setup_completed?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    language?: string
                    onboarding_completed?: boolean
                    onboarding_step?: number
                    setup_completed?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            units: {
                Row: {
                    id: string
                    owner_id: string
                    name: string
                    logo_url: string | null
                    cover_image_url: string | null
                    address: string | null
                    phone: string | null
                    business_hours: Json
                    accepts_home_visits: boolean
                    is_published: boolean
                    slug: string | null
                    business_type: string | null
                    logistics_type: string | null
                    setup_completed: boolean
                    lat: number | null
                    lng: number | null
                    created_at: string
                    updated_at: string
                    description: string | null
                    instagram_url: string | null
                    whatsapp: string | null
                }
                Insert: {
                    id?: string
                    owner_id: string
                    name: string
                    logo_url?: string | null
                    cover_image_url?: string | null
                    address?: string | null
                    phone?: string | null
                    business_hours?: Json
                    accepts_home_visits?: boolean
                    is_published?: boolean
                    slug?: string | null
                    business_type?: string | null
                    logistics_type?: string | null
                    setup_completed?: boolean
                    lat?: number | null
                    lng?: number | null
                    created_at?: string
                    updated_at?: string
                    description?: string | null
                    instagram_url?: string | null
                    whatsapp?: string | null
                }
                Update: {
                    id?: string
                    owner_id?: string
                    name?: string
                    logo_url?: string | null
                    cover_image_url?: string | null
                    address?: string | null
                    phone?: string | null
                    business_hours?: Json
                    accepts_home_visits?: boolean
                    is_published?: boolean
                    slug?: string | null
                    business_type?: string | null
                    logistics_type?: string | null
                    setup_completed?: boolean
                    lat?: number | null
                    lng?: number | null
                    created_at?: string
                    updated_at?: string
                    description?: string | null
                    instagram_url?: string | null
                    whatsapp?: string | null
                }
            }
            services: {
                Row: {
                    id: string
                    unit_id: string
                    name: string
                    duration: number
                    duration_minutes: number
                    price: number
                    description: string | null
                    image_url: string | null
                    is_active: boolean
                    allows_home: boolean
                    allows_unit: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    unit_id: string
                    name: string
                    duration?: number
                    duration_minutes?: number
                    price?: number
                    description?: string | null
                    image_url?: string | null
                    is_active?: boolean
                    allows_home?: boolean
                    allows_unit?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    unit_id?: string
                    name?: string
                    duration?: number
                    duration_minutes?: number
                    price?: number
                    description?: string | null
                    image_url?: string | null
                    is_active?: boolean
                    allows_home?: boolean
                    allows_unit?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            team_members: {
                Row: {
                    id: string
                    user_id: string | null
                    unit_id: string
                    name: string
                    photo_url: string | null
                    role: string
                    bio: string | null
                    accepts_home_visits: boolean
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    unit_id: string
                    name: string
                    photo_url?: string | null
                    role?: string
                    bio?: string | null
                    accepts_home_visits?: boolean
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    unit_id?: string
                    name?: string
                    photo_url?: string | null
                    role?: string
                    bio?: string | null
                    accepts_home_visits?: boolean
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            clients: {
                Row: {
                    id: string
                    unit_id: string
                    name: string
                    phone: string | null
                    email: string | null
                    notes: string | null
                    preferences: string | null
                    addresses: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    unit_id: string
                    name: string
                    phone?: string | null
                    email?: string | null
                    notes?: string | null
                    preferences?: string | null
                    addresses?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    unit_id?: string
                    name?: string
                    phone?: string | null
                    email?: string | null
                    notes?: string | null
                    preferences?: string | null
                    addresses?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
            appointments: {
                Row: {
                    id: string
                    unit_id: string
                    client_id: string | null
                    team_member_id: string | null
                    service_ids: string[]
                    datetime: string
                    duration: number
                    duration_minutes: number
                    type: string
                    status: string
                    value: number
                    address: string | null
                    notes: string | null
                    client_name: string | null
                    client_phone: string | null
                    client_email: string | null
                    delivery_fee: number
                    discount: number
                    tip_amount: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    unit_id: string
                    client_id?: string | null
                    team_member_id?: string | null
                    service_ids?: string[]
                    datetime: string
                    duration?: number
                    duration_minutes?: number
                    type?: string
                    status?: string
                    value?: number
                    address?: string | null
                    notes?: string | null
                    client_name?: string | null
                    client_phone?: string | null
                    client_email?: string | null
                    delivery_fee?: number
                    discount?: number
                    tip_amount?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    unit_id?: string
                    client_id?: string | null
                    team_member_id?: string | null
                    service_ids?: string[]
                    datetime?: string
                    duration?: number
                    duration_minutes?: number
                    type?: string
                    status?: string
                    value?: number
                    address?: string | null
                    notes?: string | null
                    client_name?: string | null
                    client_phone?: string | null
                    client_email?: string | null
                    delivery_fee?: number
                    discount?: number
                    tip_amount?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    unit_id: string
                    name: string
                    price: number
                    stock_quantity: number
                    low_stock_threshold: number
                    image_url: string | null
                    brand: string | null
                    category: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    unit_id: string
                    name: string
                    price?: number
                    stock_quantity?: number
                    low_stock_threshold?: number
                    image_url?: string | null
                    brand?: string | null
                    category?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    unit_id?: string
                    name?: string
                    price?: number
                    stock_quantity?: number
                    low_stock_threshold?: number
                    image_url?: string | null
                    brand?: string | null
                    category?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            client_photos: {
                Row: {
                    id: string
                    client_id: string
                    url: string
                    description: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    client_id: string
                    url: string
                    description?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    client_id?: string
                    url?: string
                    description?: string | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            appointment_status: "pending_approval" | "confirmed" | "completed" | "cancelled" | "no_show" | "in_transit" | "arrived"
            appointment_type: "unit" | "home"
            app_role: "owner" | "team_member"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

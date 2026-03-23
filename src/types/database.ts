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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      app_notifications: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          customer_id: string
          data: Json | null
          id: string
          job_id: string | null
          message: string
          read: boolean | null
          title: string
          type: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          customer_id: string
          data?: Json | null
          id?: string
          job_id?: string | null
          message: string
          read?: boolean | null
          title: string
          type: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          customer_id?: string
          data?: Json | null
          id?: string
          job_id?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_notifications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          ai_generated: boolean | null
          audience_params: Json | null
          audience_type: string
          channels: Json
          created_at: string | null
          created_by: string | null
          discount_type: string
          discount_value: number | null
          end_date: string
          id: string
          max_redemptions: number | null
          members_only: boolean | null
          mock_clicks: number | null
          mock_opens: number | null
          mock_reach: number | null
          mock_sent: Json | null
          offer_body: string
          offer_code: string | null
          offer_cta: string
          offer_headline: string
          published_at: string | null
          redemption_count: number | null
          scheduled_at: string | null
          start_date: string
          status: string
          target_id: string | null
          target_label: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          audience_params?: Json | null
          audience_type?: string
          channels?: Json
          created_at?: string | null
          created_by?: string | null
          discount_type?: string
          discount_value?: number | null
          end_date: string
          id?: string
          max_redemptions?: number | null
          members_only?: boolean | null
          mock_clicks?: number | null
          mock_opens?: number | null
          mock_reach?: number | null
          mock_sent?: Json | null
          offer_body?: string
          offer_code?: string | null
          offer_cta?: string
          offer_headline?: string
          published_at?: string | null
          redemption_count?: number | null
          scheduled_at?: string | null
          start_date: string
          status?: string
          target_id?: string | null
          target_label?: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          audience_params?: Json | null
          audience_type?: string
          channels?: Json
          created_at?: string | null
          created_by?: string | null
          discount_type?: string
          discount_value?: number | null
          end_date?: string
          id?: string
          max_redemptions?: number | null
          members_only?: boolean | null
          mock_clicks?: number | null
          mock_opens?: number | null
          mock_reach?: number | null
          mock_sent?: Json | null
          offer_body?: string
          offer_code?: string | null
          offer_cta?: string
          offer_headline?: string
          published_at?: string | null
          redemption_count?: number | null
          scheduled_at?: string | null
          start_date?: string
          status?: string
          target_id?: string | null
          target_label?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          body: string
          created_at: string | null
          id: string
          read_by: string[] | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          read_by?: string[] | null
          sender_id: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          read_by?: string[] | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          job_id: string | null
          title: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          job_id?: string | null
          title?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          job_id?: string | null
          title?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_threads_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          membership_status: string | null
          notes: string | null
          phone: string | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          membership_status?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          membership_status?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string
          due_date: string | null
          id: string
          invoice_number: string
          job_id: string
          notes: string | null
          paid_at: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          due_date?: string | null
          id?: string
          invoice_number: string
          job_id: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          job_id?: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_media: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          job_id: string
          storage_path: string | null
          type: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          storage_path?: string | null
          type: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          storage_path?: string | null
          type?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_media_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string
          deposit_paid: number | null
          end_date: string | null
          id: string
          internal_notes: string | null
          notes: string | null
          price: number | null
          quote_request_id: string | null
          services: string[] | null
          start_date: string | null
          status: string
          technician_id: string | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          deposit_paid?: number | null
          end_date?: string | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          price?: number | null
          quote_request_id?: string | null
          services?: string[] | null
          start_date?: string | null
          status?: string
          technician_id?: string | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          deposit_paid?: number | null
          end_date?: string | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          price?: number | null
          quote_request_id?: string | null
          services?: string[] | null
          start_date?: string | null
          status?: string
          technician_id?: string | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          end_date: string | null
          id: string
          notes: string | null
          plan: string
          price: number | null
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          end_date?: string | null
          id?: string
          notes?: string | null
          plan?: string
          price?: number | null
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          plan?: string
          price?: number | null
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_items: {
        Row: {
          created_at: string | null
          id: string
          job_id: string | null
          position: number
          quote_request_id: string | null
          stage_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          position?: number
          quote_request_id?: string | null
          stage_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          position?: number
          quote_request_id?: string | null
          stage_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_items_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_items_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          position: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          position?: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          position?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          inventory_count: number | null
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          inventory_count?: number | null
          is_active?: boolean | null
          name: string
          price?: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          inventory_count?: number | null
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          member_since: string | null
          membership_tier: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          member_since?: string | null
          membership_tier?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          member_since?: string | null
          membership_tier?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          converted_job_id: string | null
          created_at: string | null
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          estimated_value: number | null
          id: string
          notes: string | null
          services_requested: string[] | null
          source: string
          status: string
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          converted_job_id?: string | null
          created_at?: string | null
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          estimated_value?: number | null
          id?: string
          notes?: string | null
          services_requested?: string[] | null
          source?: string
          status?: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          converted_job_id?: string | null
          created_at?: string | null
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          estimated_value?: number | null
          id?: string
          notes?: string | null
          services_requested?: string[] | null
          source?: string
          status?: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string | null
          customer_id: string
          id: string
          is_public: boolean | null
          job_id: string
          rating: number
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          is_public?: boolean | null
          job_id: string
          rating: number
        }
        Update: {
          body?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          is_public?: boolean | null
          job_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number
          category: string
          created_at: string | null
          description: string | null
          duration_hours: number | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          base_price?: number
          category: string
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          base_price?: number
          category?: string
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      shop_settings: {
        Row: {
          booking_lead_days: number | null
          currency: string | null
          id: string
          shop_address: string | null
          shop_city: string | null
          shop_country: string | null
          shop_email: string | null
          shop_hours: Json | null
          shop_logo_url: string | null
          shop_name: string
          shop_phone: string | null
          shop_postal_code: string | null
          shop_province: string | null
          tax_rate: number | null
          updated_at: string | null
        }
        Insert: {
          booking_lead_days?: number | null
          currency?: string | null
          id?: string
          shop_address?: string | null
          shop_city?: string | null
          shop_country?: string | null
          shop_email?: string | null
          shop_hours?: Json | null
          shop_logo_url?: string | null
          shop_name?: string
          shop_phone?: string | null
          shop_postal_code?: string | null
          shop_province?: string | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          booking_lead_days?: number | null
          currency?: string | null
          id?: string
          shop_address?: string | null
          shop_city?: string | null
          shop_country?: string | null
          shop_email?: string | null
          shop_hours?: Json | null
          shop_logo_url?: string | null
          shop_name?: string
          shop_phone?: string | null
          shop_postal_code?: string | null
          shop_province?: string | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          role: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicle_catalog: {
        Row: {
          body_type: string
          created_at: string
          id: number
          make: string
          model: string
          status: string
          trim: string
          updated_at: string
          year_end: number
          year_start: number
        }
        Insert: {
          body_type: string
          created_at?: string
          id: number
          make: string
          model: string
          status: string
          trim: string
          updated_at?: string
          year_end: number
          year_start: number
        }
        Update: {
          body_type?: string
          created_at?: string
          id?: number
          make?: string
          model?: string
          status?: string
          trim?: string
          updated_at?: string
          year_end?: number
          year_start?: number
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          license_plate: string | null
          make: string
          model: string
          notes: string | null
          updated_at: string | null
          vin: string | null
          year: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          license_plate?: string | null
          make: string
          model: string
          notes?: string | null
          updated_at?: string | null
          vin?: string | null
          year: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          license_plate?: string | null
          make?: string
          model?: string
          notes?: string | null
          updated_at?: string | null
          vin?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
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
    Enums: {},
  },
} as const

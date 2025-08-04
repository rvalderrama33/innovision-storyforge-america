export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_lockouts: {
        Row: {
          created_at: string | null
          email: string
          failed_attempts: number | null
          id: string
          last_attempt: string | null
          locked_until: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          failed_attempts?: number | null
          id?: string
          last_attempt?: string | null
          locked_until?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          failed_attempts?: number | null
          id?: string
          last_attempt?: string | null
          locked_until?: string | null
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          description: string
          id: string
          ip_address: string | null
          target_resource: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          description: string
          id?: string
          ip_address?: string | null
          target_resource?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          description?: string
          id?: string
          ip_address?: string | null
          target_resource?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      email_analytics: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          newsletter_id: string | null
          subscriber_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          newsletter_id?: string | null
          subscriber_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          newsletter_id?: string | null
          subscriber_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_analytics_newsletter_id_fkey"
            columns: ["newsletter_id"]
            isOneToOne: false
            referencedRelation: "newsletters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_analytics_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_customizations: {
        Row: {
          accent_color: string
          company_name: string
          created_at: string
          footer_text: string
          id: string
          logo_url: string | null
          primary_color: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          company_name?: string
          created_at?: string
          footer_text?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          company_name?: string
          created_at?: string
          footer_text?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      featured_story_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          featured_end_date: string | null
          featured_start_date: string | null
          id: string
          payer_email: string | null
          payer_name: string | null
          paypal_order_id: string | null
          paypal_payment_id: string | null
          status: string
          stripe_payment_id: string | null
          stripe_session_id: string | null
          submission_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          featured_end_date?: string | null
          featured_start_date?: string | null
          id?: string
          payer_email?: string | null
          payer_name?: string | null
          paypal_order_id?: string | null
          paypal_payment_id?: string | null
          status?: string
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          submission_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          featured_end_date?: string | null
          featured_start_date?: string | null
          id?: string
          payer_email?: string | null
          payer_name?: string | null
          paypal_order_id?: string | null
          paypal_payment_id?: string | null
          status?: string
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_story_payments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_orders: {
        Row: {
          buyer_id: string
          created_at: string
          currency: string
          id: string
          notes: string | null
          payment_intent_id: string | null
          product_id: string
          quantity: number
          shipping_address: Json | null
          status: string
          total_amount: number
          tracking_number: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_intent_id?: string | null
          product_id: string
          quantity?: number
          shipping_address?: Json | null
          status?: string
          total_amount: number
          tracking_number?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_intent_id?: string | null
          product_id?: string
          quantity?: number
          shipping_address?: Json | null
          status?: string
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_products: {
        Row: {
          category: string | null
          created_at: string
          currency: string
          description: string | null
          featured: boolean | null
          id: string
          images: string[] | null
          name: string
          price: number
          primary_image_index: number | null
          sales_links: string[] | null
          shipping_info: Json | null
          slug: string | null
          specifications: Json | null
          status: string
          stock_quantity: number | null
          tags: string[] | null
          updated_at: string
          vendor_id: string
          video_urls: string[] | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: string[] | null
          name: string
          price: number
          primary_image_index?: number | null
          sales_links?: string[] | null
          shipping_info?: Json | null
          slug?: string | null
          specifications?: Json | null
          status?: string
          stock_quantity?: number | null
          tags?: string[] | null
          updated_at?: string
          vendor_id: string
          video_urls?: string[] | null
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: string[] | null
          name?: string
          price?: number
          primary_image_index?: number | null
          sales_links?: string[] | null
          shipping_info?: Json | null
          slug?: string | null
          specifications?: Json | null
          status?: string
          stock_quantity?: number | null
          tags?: string[] | null
          updated_at?: string
          vendor_id?: string
          video_urls?: string[] | null
        }
        Relationships: []
      }
      marketplace_reviews: {
        Row: {
          content: string | null
          created_at: string
          id: string
          images: string[] | null
          order_id: string | null
          product_id: string
          rating: number
          reviewer_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          order_id?: string | null
          product_id: string
          rating: number
          reviewer_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          order_id?: string | null
          product_id?: string
          rating?: number
          reviewer_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_links: {
        Row: {
          click_count: number | null
          created_at: string
          id: string
          newsletter_id: string | null
          original_url: string
          tracking_token: string
        }
        Insert: {
          click_count?: number | null
          created_at?: string
          id?: string
          newsletter_id?: string | null
          original_url: string
          tracking_token: string
        }
        Update: {
          click_count?: number | null
          created_at?: string
          id?: string
          newsletter_id?: string | null
          original_url?: string
          tracking_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_links_newsletter_id_fkey"
            columns: ["newsletter_id"]
            isOneToOne: false
            referencedRelation: "newsletters"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          subscribed_at: string
          subscription_source: string | null
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          subscribed_at?: string
          subscription_source?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          subscribed_at?: string
          subscription_source?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletters: {
        Row: {
          click_count: number | null
          content: string
          created_at: string
          created_by: string | null
          html_content: string | null
          id: string
          open_count: number | null
          recipient_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          subject: string
          title: string
          updated_at: string
        }
        Insert: {
          click_count?: number | null
          content: string
          created_at?: string
          created_by?: string | null
          html_content?: string | null
          id?: string
          open_count?: number | null
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          title: string
          updated_at?: string
        }
        Update: {
          click_count?: number | null
          content?: string
          created_at?: string
          created_by?: string | null
          html_content?: string | null
          id?: string
          open_count?: number | null
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          created_at: string
          email: string
          email_sent_at: string | null
          id: string
          name: string
          reason: string | null
          recommender_email: string | null
          recommender_name: string | null
          submission_id: string | null
          submission_id_created: string | null
          submitted_story_at: string | null
          subscribed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          email_sent_at?: string | null
          id?: string
          name: string
          reason?: string | null
          recommender_email?: string | null
          recommender_name?: string | null
          submission_id?: string | null
          submission_id_created?: string | null
          submitted_story_at?: string | null
          subscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          email_sent_at?: string | null
          id?: string
          name?: string
          reason?: string | null
          recommender_email?: string | null
          recommender_name?: string | null
          submission_id?: string | null
          submission_id_created?: string | null
          submitted_story_at?: string | null
          subscribed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_submission_id_created_fkey"
            columns: ["submission_id_created"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          background: string | null
          banner_image: string | null
          biggest_challenge: string | null
          category: string | null
          city: string | null
          created_at: string
          description: string | null
          email: string | null
          featured: boolean | null
          full_name: string | null
          generated_article: string | null
          headshot_image: string | null
          id: string
          idea_origin: string | null
          image_urls: string[] | null
          inspiration: string | null
          is_manual_submission: boolean | null
          logo_image: string | null
          motivation: string | null
          phone_number: string | null
          pinned: boolean | null
          problem_solved: string | null
          product_name: string | null
          proudest_moment: string | null
          recommendations: Json | null
          selected_vendors: string[] | null
          slug: string | null
          social_media: string | null
          source_links: string[] | null
          stage: string | null
          state: string | null
          status: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          background?: string | null
          banner_image?: string | null
          biggest_challenge?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          featured?: boolean | null
          full_name?: string | null
          generated_article?: string | null
          headshot_image?: string | null
          id?: string
          idea_origin?: string | null
          image_urls?: string[] | null
          inspiration?: string | null
          is_manual_submission?: boolean | null
          logo_image?: string | null
          motivation?: string | null
          phone_number?: string | null
          pinned?: boolean | null
          problem_solved?: string | null
          product_name?: string | null
          proudest_moment?: string | null
          recommendations?: Json | null
          selected_vendors?: string[] | null
          slug?: string | null
          social_media?: string | null
          source_links?: string[] | null
          stage?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          background?: string | null
          banner_image?: string | null
          biggest_challenge?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          featured?: boolean | null
          full_name?: string | null
          generated_article?: string | null
          headshot_image?: string | null
          id?: string
          idea_origin?: string | null
          image_urls?: string[] | null
          inspiration?: string | null
          is_manual_submission?: boolean | null
          logo_image?: string | null
          motivation?: string | null
          phone_number?: string | null
          pinned?: boolean | null
          problem_solved?: string | null
          product_name?: string | null
          proudest_moment?: string | null
          recommendations?: Json | null
          selected_vendors?: string[] | null
          slug?: string | null
          social_media?: string | null
          source_links?: string[] | null
          stage?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
          website?: string | null
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
          role: Database["public"]["Enums"]["app_role"]
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
      assign_admin_role: {
        Args: { _target_user_id: string }
        Returns: boolean
      }
      expire_featured_stories: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      handle_failed_login: {
        Args: { _email: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      increment_newsletter_clicks: {
        Args: { newsletter_id: string }
        Returns: undefined
      }
      increment_newsletter_opens: {
        Args: { newsletter_id: string }
        Returns: undefined
      }
      log_admin_action: {
        Args:
          | {
              _action_type: string
              _target_user_id?: string
              _target_resource?: string
              _description?: string
            }
          | {
              _action_type: string
              _target_user_id?: string
              _target_resource?: string
              _description?: string
              _ip_address?: string
              _user_agent?: string
            }
        Returns: undefined
      }
      reset_login_attempts: {
        Args: { _email: string }
        Returns: undefined
      }
      revoke_admin_role: {
        Args: { _target_user_id: string }
        Returns: boolean
      }
      sync_admin_newsletter_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      trigger_featured_story_promotion: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      trigger_weekly_newsletter: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "subscriber" | "super_admin"
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
      app_role: ["admin", "subscriber", "super_admin"],
    },
  },
} as const

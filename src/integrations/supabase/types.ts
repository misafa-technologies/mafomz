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
      ai_signals: {
        Row: {
          asset: string
          confidence: number | null
          created_at: string
          entry_price: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          signal_type: string
          site_id: string | null
          stop_loss: number | null
          target_price: number | null
          timeframe: string | null
        }
        Insert: {
          asset: string
          confidence?: number | null
          created_at?: string
          entry_price?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          signal_type: string
          site_id?: string | null
          stop_loss?: number | null
          target_price?: number | null
          timeframe?: string | null
        }
        Update: {
          asset?: string
          confidence?: number | null
          created_at?: string
          entry_price?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          signal_type?: string
          site_id?: string | null
          stop_loss?: number | null
          target_price?: number | null
          timeframe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_signals_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          starts_at: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          starts_at?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          starts_at?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      bot_configs: {
        Row: {
          asset: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          max_daily_trades: number | null
          name: string
          schedule_cron: string | null
          schedule_enabled: boolean | null
          site_id: string | null
          stake_amount: number | null
          stop_loss_percentage: number | null
          take_profit_percentage: number | null
          trade_type: string | null
          updated_at: string
          user_id: string
          xml_content: string
        }
        Insert: {
          asset?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_daily_trades?: number | null
          name: string
          schedule_cron?: string | null
          schedule_enabled?: boolean | null
          site_id?: string | null
          stake_amount?: number | null
          stop_loss_percentage?: number | null
          take_profit_percentage?: number | null
          trade_type?: string | null
          updated_at?: string
          user_id: string
          xml_content: string
        }
        Update: {
          asset?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_daily_trades?: number | null
          name?: string
          schedule_cron?: string | null
          schedule_enabled?: boolean | null
          site_id?: string | null
          stake_amount?: number | null
          stop_loss_percentage?: number | null
          take_profit_percentage?: number | null
          trade_type?: string | null
          updated_at?: string
          user_id?: string
          xml_content?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_configs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_executions: {
        Row: {
          bot_id: string
          created_at: string
          ended_at: string | null
          error_message: string | null
          id: string
          loss_count: number | null
          metadata: Json | null
          profit_loss: number | null
          started_at: string | null
          status: string
          trades_count: number | null
          user_id: string
          win_count: number | null
        }
        Insert: {
          bot_id: string
          created_at?: string
          ended_at?: string | null
          error_message?: string | null
          id?: string
          loss_count?: number | null
          metadata?: Json | null
          profit_loss?: number | null
          started_at?: string | null
          status?: string
          trades_count?: number | null
          user_id: string
          win_count?: number | null
        }
        Update: {
          bot_id?: string
          created_at?: string
          ended_at?: string | null
          error_message?: string | null
          id?: string
          loss_count?: number | null
          metadata?: Json | null
          profit_loss?: number | null
          started_at?: string | null
          status?: string
          trades_count?: number | null
          user_id?: string
          win_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_executions_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bot_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_splits: {
        Row: {
          amount: number
          commission_id: string
          created_at: string
          id: string
          paid_at: string | null
          percentage: number
          recipient_id: string | null
          recipient_type: string
          status: string
        }
        Insert: {
          amount?: number
          commission_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          percentage?: number
          recipient_id?: string | null
          recipient_type: string
          status?: string
        }
        Update: {
          amount?: number
          commission_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          percentage?: number
          recipient_id?: string | null
          recipient_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_splits_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          deriv_loginid: string
          id: string
          metadata: Json | null
          period_end: string | null
          period_start: string | null
          site_id: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          deriv_loginid: string
          id?: string
          metadata?: Json | null
          period_end?: string | null
          period_start?: string | null
          site_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          deriv_loginid?: string
          id?: string
          metadata?: Json | null
          period_end?: string | null
          period_start?: string | null
          site_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_configs: {
        Row: {
          callback_url: string | null
          config_name: string
          consumer_key: string | null
          consumer_secret: string | null
          created_at: string
          environment: string | null
          id: string
          is_active: boolean | null
          passkey: string | null
          provider: string
          shortcode: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          callback_url?: string | null
          config_name: string
          consumer_key?: string | null
          consumer_secret?: string | null
          created_at?: string
          environment?: string | null
          id?: string
          is_active?: boolean | null
          passkey?: string | null
          provider?: string
          shortcode?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          callback_url?: string | null
          config_name?: string
          consumer_key?: string | null
          consumer_secret?: string | null
          created_at?: string
          environment?: string | null
          id?: string
          is_active?: boolean | null
          passkey?: string | null
          provider?: string
          shortcode?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_bot_store: {
        Row: {
          bot_id: string
          created_at: string
          downloads_count: number | null
          id: string
          is_public: boolean | null
          price: number | null
          site_id: string
        }
        Insert: {
          bot_id: string
          created_at?: string
          downloads_count?: number | null
          id?: string
          is_public?: boolean | null
          price?: number | null
          site_id: string
        }
        Update: {
          bot_id?: string
          created_at?: string
          downloads_count?: number | null
          id?: string
          is_public?: boolean | null
          price?: number | null
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_bot_store_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bot_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_bot_store_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_users: {
        Row: {
          created_at: string
          deriv_accounts: Json | null
          deriv_balance: number | null
          deriv_currency: string | null
          deriv_email: string | null
          deriv_fullname: string | null
          deriv_loginid: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          site_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deriv_accounts?: Json | null
          deriv_balance?: number | null
          deriv_currency?: string | null
          deriv_email?: string | null
          deriv_fullname?: string | null
          deriv_loginid: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          site_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deriv_accounts?: Json | null
          deriv_balance?: number | null
          deriv_currency?: string | null
          deriv_email?: string | null
          deriv_fullname?: string | null
          deriv_loginid?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_users_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          apps: Json | null
          created_at: string
          custom_domain: string | null
          dark_mode: boolean | null
          deriv_account_id: string | null
          deriv_token_hash: string | null
          description: string | null
          favicon_url: string | null
          footer_text: string | null
          id: string
          language: string | null
          logo_url: string | null
          name: string
          primary_color: string | null
          region: string | null
          secondary_color: string | null
          status: string | null
          subdomain: string
          updated_at: string
          user_id: string
        }
        Insert: {
          apps?: Json | null
          created_at?: string
          custom_domain?: string | null
          dark_mode?: boolean | null
          deriv_account_id?: string | null
          deriv_token_hash?: string | null
          description?: string | null
          favicon_url?: string | null
          footer_text?: string | null
          id?: string
          language?: string | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          region?: string | null
          secondary_color?: string | null
          status?: string | null
          subdomain: string
          updated_at?: string
          user_id: string
        }
        Update: {
          apps?: Json | null
          created_at?: string
          custom_domain?: string | null
          dark_mode?: boolean | null
          deriv_account_id?: string | null
          deriv_token_hash?: string | null
          description?: string | null
          favicon_url?: string | null
          footer_text?: string | null
          id?: string
          language?: string | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          region?: string | null
          secondary_color?: string | null
          status?: string | null
          subdomain?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          id: string
          priority: string
          site_id: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: string
          site_id?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: string
          site_id?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_staff: boolean | null
          message: string
          ticket_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_staff?: boolean | null
          message: string
          ticket_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_staff?: boolean | null
          message?: string
          ticket_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          approved_at: string | null
          checkout_request_id: string | null
          created_at: string
          currency: string
          id: string
          merchant_request_id: string | null
          metadata: Json | null
          moderator_id: string | null
          mpesa_receipt: string | null
          notes: string | null
          payment_method: string | null
          phone_number: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          checkout_request_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          merchant_request_id?: string | null
          metadata?: Json | null
          moderator_id?: string | null
          mpesa_receipt?: string | null
          notes?: string | null
          payment_method?: string | null
          phone_number?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          checkout_request_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          merchant_request_id?: string | null
          metadata?: Json | null
          moderator_id?: string | null
          mpesa_receipt?: string | null
          notes?: string | null
          payment_method?: string | null
          phone_number?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_balances: {
        Row: {
          balance: number
          currency: string
          id: string
          total_commissions: number | null
          total_deposits: number | null
          total_withdrawals: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          currency?: string
          id?: string
          total_commissions?: number | null
          total_deposits?: number | null
          total_withdrawals?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          currency?: string
          id?: string
          total_commissions?: number | null
          total_deposits?: number | null
          total_withdrawals?: number | null
          updated_at?: string
          user_id?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

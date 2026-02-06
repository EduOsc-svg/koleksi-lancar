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
      activity_logs: {
        Row: {
          action: string
          contract_id: string | null
          created_at: string
          customer_id: string | null
          description: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          sales_agent_id: string | null
          user_agent: string | null
          user_id: string | null
          user_name: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          contract_id?: string | null
          created_at?: string
          customer_id?: string | null
          description: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          sales_agent_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          contract_id?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          sales_agent_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "credit_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "invoice_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_sales_agent_id_fkey"
            columns: ["sales_agent_id"]
            isOneToOne: false
            referencedRelation: "sales_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      collectors: {
        Row: {
          collector_code: string
          created_at: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          collector_code: string
          created_at?: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          collector_code?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      commission_payments: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          sales_agent_id: string
        }
        Insert: {
          amount?: number
          contract_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          sales_agent_id: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          sales_agent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "credit_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "invoice_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payments_sales_agent_id_fkey"
            columns: ["sales_agent_id"]
            isOneToOne: false
            referencedRelation: "sales_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_contracts: {
        Row: {
          contract_ref: string
          created_at: string
          current_installment_index: number
          customer_id: string
          daily_installment_amount: number
          id: string
          omset: number | null
          product_type: string | null
          sales_agent_id: string | null
          start_date: string
          status: string
          tenor_days: number
          total_loan_amount: number
        }
        Insert: {
          contract_ref: string
          created_at?: string
          current_installment_index?: number
          customer_id: string
          daily_installment_amount?: number
          id?: string
          omset?: number | null
          product_type?: string | null
          sales_agent_id?: string | null
          start_date?: string
          status?: string
          tenor_days?: number
          total_loan_amount?: number
        }
        Update: {
          contract_ref?: string
          created_at?: string
          current_installment_index?: number
          customer_id?: string
          daily_installment_amount?: number
          id?: string
          omset?: number | null
          product_type?: string | null
          sales_agent_id?: string | null
          start_date?: string
          status?: string
          tenor_days?: number
          total_loan_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "credit_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_contracts_sales_agent_id_fkey"
            columns: ["sales_agent_id"]
            isOneToOne: false
            referencedRelation: "sales_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          business_address: string | null
          created_at: string
          id: string
          name: string
          nik: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          business_address?: string | null
          created_at?: string
          id?: string
          name: string
          nik?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          business_address?: string | null
          created_at?: string
          id?: string
          name?: string
          nik?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      holidays: {
        Row: {
          created_at: string
          day_of_week: number | null
          description: string | null
          holiday_date: string | null
          holiday_type: string
          id: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          description?: string | null
          holiday_date?: string | null
          holiday_type?: string
          id?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          description?: string | null
          holiday_date?: string | null
          holiday_type?: string
          id?: string
        }
        Relationships: []
      }
      installment_coupons: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          due_date: string
          id: string
          installment_index: number
          status: string
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          installment_index: number
          status?: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          installment_index?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_coupons_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "credit_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_coupons_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "invoice_details"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string
          expense_date: string
          id: string
          notes: string | null
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          notes?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          amount_paid: number
          collector_id: string | null
          contract_id: string
          coupon_id: string | null
          created_at: string
          id: string
          installment_index: number
          notes: string | null
          payment_date: string
        }
        Insert: {
          amount_paid: number
          collector_id?: string | null
          contract_id: string
          coupon_id?: string | null
          created_at?: string
          id?: string
          installment_index: number
          notes?: string | null
          payment_date?: string
        }
        Update: {
          amount_paid?: number
          collector_id?: string | null
          contract_id?: string
          coupon_id?: string | null
          created_at?: string
          id?: string
          installment_index?: number
          notes?: string | null
          payment_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "collectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "credit_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "invoice_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_logs_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "installment_coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_agents: {
        Row: {
          agent_code: string
          commission_percentage: number | null
          created_at: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          agent_code: string
          commission_percentage?: number | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          agent_code?: string
          commission_percentage?: number | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
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
    }
    Views: {
      invoice_details: {
        Row: {
          agent_code: string | null
          contract_ref: string | null
          created_at: string | null
          current_installment_index: number | null
          customer_address: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          daily_installment_amount: number | null
          id: string | null
          no_faktur: string | null
          product_type: string | null
          sales_agent_id: string | null
          sales_agent_name: string | null
          status: string | null
          tenor_days: number | null
          total_loan_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_contracts_sales_agent_id_fkey"
            columns: ["sales_agent_id"]
            isOneToOne: false
            referencedRelation: "sales_agents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_installment_coupons: {
        Args: {
          p_contract_id: string
          p_daily_amount: number
          p_start_date: string
          p_tenor_days: number
        }
        Returns: undefined
      }
      get_next_coupon: { Args: { contract_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authenticated: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const

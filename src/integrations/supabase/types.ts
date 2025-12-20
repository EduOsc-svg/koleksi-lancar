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
      credit_contracts: {
        Row: {
          contract_ref: string
          created_at: string
          current_installment_index: number
          customer_id: string
          daily_installment_amount: number
          id: string
          product_type: string | null
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
          product_type?: string | null
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
          product_type?: string | null
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
        ]
      }
      customers: {
        Row: {
          address: string | null
          assigned_sales_id: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          route_id: string
        }
        Insert: {
          address?: string | null
          assigned_sales_id?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          route_id: string
        }
        Update: {
          address?: string | null
          assigned_sales_id?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          route_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_assigned_sales_id_fkey"
            columns: ["assigned_sales_id"]
            isOneToOne: false
            referencedRelation: "invoice_details"
            referencedColumns: ["sales_agent_id"]
          },
          {
            foreignKeyName: "customers_assigned_sales_id_fkey"
            columns: ["assigned_sales_id"]
            isOneToOne: false
            referencedRelation: "sales_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "invoice_details"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "customers_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_logs: {
        Row: {
          amount_paid: number
          collector_id: string | null
          contract_id: string
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
            referencedRelation: "invoice_details"
            referencedColumns: ["sales_agent_id"]
          },
          {
            foreignKeyName: "payment_logs_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "sales_agents"
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
        ]
      }
      routes: {
        Row: {
          code: string
          created_at: string
          default_collector_id: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          default_collector_id?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          default_collector_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_default_collector_id_fkey"
            columns: ["default_collector_id"]
            isOneToOne: false
            referencedRelation: "invoice_details"
            referencedColumns: ["sales_agent_id"]
          },
          {
            foreignKeyName: "routes_default_collector_id_fkey"
            columns: ["default_collector_id"]
            isOneToOne: false
            referencedRelation: "sales_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_agents: {
        Row: {
          agent_code: string
          created_at: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          agent_code: string
          created_at?: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          agent_code?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
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
          route_code: string | null
          route_id: string | null
          route_name: string | null
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
        ]
      }
    }
    Functions: {
      get_next_coupon: { Args: { contract_id: string }; Returns: number }
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

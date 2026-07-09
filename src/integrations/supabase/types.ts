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
      account_members: {
        Row: {
          created_at: string
          id: string
          member_email: string
          member_user_id: string | null
          owner_id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_email: string
          member_user_id?: string | null
          owner_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_email?: string
          member_user_id?: string | null
          owner_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string
          id: string
          message: string
          source: string | null
          stack: string | null
          type: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          source?: string | null
          stack?: string | null
          type: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          source?: string | null
          stack?: string | null
          type?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          height: number | null
          id: string
          invoice_id: string
          mrp: number | null
          pieces: number | null
          price: number
          quantity: number
          tax_rate: number
          unit: string
          width: number | null
        }
        Insert: {
          created_at?: string
          description: string
          height?: number | null
          id?: string
          invoice_id: string
          mrp?: number | null
          pieces?: number | null
          price: number
          quantity?: number
          tax_rate?: number
          unit?: string
          width?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          height?: number | null
          id?: string
          invoice_id?: string
          mrp?: number | null
          pieces?: number | null
          price?: number
          quantity?: number
          tax_rate?: number
          unit?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          advance: number
          created_at: string
          customer_address: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          delivery_charges: number | null
          designing_charges: number | null
          discount: number
          expenses: number | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          terms_conditions: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          advance?: number
          created_at?: string
          customer_address?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_charges?: number | null
          designing_charges?: number | null
          discount?: number
          expenses?: number | null
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          terms_conditions?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          advance?: number
          created_at?: string
          customer_address?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_charges?: number | null
          designing_charges?: number | null
          discount?: number
          expenses?: number | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          terms_conditions?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string
          director_name: string | null
          id: string
          logo_url: string | null
          phone: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          director_name?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          director_name?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          created_at: string
          description: string
          height: number | null
          id: string
          mrp: number | null
          pieces: number | null
          price: number
          tax_rate: number
          unit: string
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          description: string
          height?: number | null
          id?: string
          mrp?: number | null
          pieces?: number | null
          price?: number
          tax_rate?: number
          unit?: string
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          height?: number | null
          id?: string
          mrp?: number | null
          pieces?: number | null
          price?: number
          tax_rate?: number
          unit?: string
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      user_account_status: {
        Row: {
          expires_at: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string | null
          updated_at?: string
          updated_by?: string | null
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
      admin_delete_user: { Args: { _user_id: string }; Returns: undefined }
      admin_get_stats: { Args: never; Returns: Json }
      admin_grant_admin_by_email: {
        Args: { _email: string }
        Returns: undefined
      }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          expires_at: string
          invoice_count: number
          is_admin: boolean
          last_sign_in_at: string
          user_id: string
        }[]
      }
      admin_revoke_admin: { Args: { _user_id: string }; Returns: undefined }
      admin_set_expiry: {
        Args: { _expires_at: string; _user_id: string }
        Returns: undefined
      }
      can_access_account: { Args: { _owner: string }; Returns: boolean }
      current_user_email: { Args: never; Returns: string }
      get_my_account_status: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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

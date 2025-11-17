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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          arrival_latitude: number | null
          arrival_longitude: number | null
          arrival_time: string | null
          created_at: string
          date: string
          departure_latitude: number | null
          departure_longitude: number | null
          departure_time: string | null
          id: string
          project_id: string | null
          total_hours: number | null
          user_id: string
        }
        Insert: {
          arrival_latitude?: number | null
          arrival_longitude?: number | null
          arrival_time?: string | null
          created_at?: string
          date: string
          departure_latitude?: number | null
          departure_longitude?: number | null
          departure_time?: string | null
          id?: string
          project_id?: string | null
          total_hours?: number | null
          user_id: string
        }
        Update: {
          arrival_latitude?: number | null
          arrival_longitude?: number | null
          arrival_time?: string | null
          created_at?: string
          date?: string
          departure_latitude?: number | null
          departure_longitude?: number | null
          departure_time?: string | null
          id?: string
          project_id?: string | null
          total_hours?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finance_records: {
        Row: {
          actual_scope: string | null
          by_employee: string | null
          cell_colors: Json | null
          completion_date: string | null
          completion_deadline: string | null
          created_at: string
          created_by: string | null
          id: string
          invoice_number: string | null
          location: string | null
          notes: string | null
          order_number: string
          paid_employees: number | null
          profit: number | null
          row_color: string | null
          scope_by_invoice: string | null
          scope_by_order: string | null
          sheet_id: string
          total_vsd: number | null
          worker: string | null
        }
        Insert: {
          actual_scope?: string | null
          by_employee?: string | null
          cell_colors?: Json | null
          completion_date?: string | null
          completion_deadline?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_number?: string | null
          location?: string | null
          notes?: string | null
          order_number: string
          paid_employees?: number | null
          profit?: number | null
          row_color?: string | null
          scope_by_invoice?: string | null
          scope_by_order?: string | null
          sheet_id: string
          total_vsd?: number | null
          worker?: string | null
        }
        Update: {
          actual_scope?: string | null
          by_employee?: string | null
          cell_colors?: Json | null
          completion_date?: string | null
          completion_deadline?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_number?: string | null
          location?: string | null
          notes?: string | null
          order_number?: string
          paid_employees?: number | null
          profit?: number | null
          row_color?: string | null
          scope_by_invoice?: string | null
          scope_by_order?: string | null
          sheet_id?: string
          total_vsd?: number | null
          worker?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_records_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "finance_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_sheets: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          name?: string
        }
        Relationships: []
      }
      fuel_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          liters: number
          note: string | null
          photo_receipt: string | null
          price: number | null
          project_id: string | null
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          liters: number
          note?: string | null
          photo_receipt?: string | null
          price?: number | null
          project_id?: string | null
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          liters?: number
          note?: string | null
          photo_receipt?: string | null
          price?: number | null
          project_id?: string | null
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          current_project_id: string | null
          email: string | null
          employment_type:
            | Database["public"]["Enums"]["employment_type_new"]
            | null
          full_name: string
          hourly_rate: number | null
          id: string
          job_position: Database["public"]["Enums"]["job_position"] | null
          last_used_vehicle_id: string | null
          phone: string | null
          project_selected_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          current_project_id?: string | null
          email?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type_new"]
            | null
          full_name: string
          hourly_rate?: number | null
          id?: string
          job_position?: Database["public"]["Enums"]["job_position"] | null
          last_used_vehicle_id?: string | null
          phone?: string | null
          project_selected_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          current_project_id?: string | null
          email?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type_new"]
            | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          job_position?: Database["public"]["Enums"]["job_position"] | null
          last_used_vehicle_id?: string | null
          phone?: string | null
          project_selected_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_project_id_fkey"
            columns: ["current_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_last_used_vehicle_id_fkey"
            columns: ["last_used_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["project_status"] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["project_status"] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["project_status"] | null
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vehicle_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          date: string
          end_latitude: number | null
          end_longitude: number | null
          id: string
          is_completed: boolean | null
          km_driven: number | null
          km_end: number | null
          km_start: number
          photo_km_end: string | null
          photo_km_start: string | null
          project_id: string
          start_latitude: number | null
          start_longitude: number | null
          user_id: string
          vehicle_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          date: string
          end_latitude?: number | null
          end_longitude?: number | null
          id?: string
          is_completed?: boolean | null
          km_driven?: number | null
          km_end?: number | null
          km_start: number
          photo_km_end?: string | null
          photo_km_start?: string | null
          project_id: string
          start_latitude?: number | null
          start_longitude?: number | null
          user_id: string
          vehicle_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          date?: string
          end_latitude?: number | null
          end_longitude?: number | null
          id?: string
          is_completed?: boolean | null
          km_driven?: number | null
          km_end?: number | null
          km_start?: number
          photo_km_end?: string | null
          photo_km_start?: string | null
          project_id?: string
          start_latitude?: number | null
          start_longitude?: number | null
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vehicle_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          created_at: string
          current_km: number
          emission_date: string | null
          emission_note: string | null
          highway_sticker_expiry: string | null
          id: string
          insurance_date: string | null
          insurance_note: string | null
          is_active: boolean
          service_date: string | null
          service_note: string | null
          spz: string
          stk_date: string | null
          stk_note: string | null
          type: string
          vin: string | null
        }
        Insert: {
          brand: string
          created_at?: string
          current_km?: number
          emission_date?: string | null
          emission_note?: string | null
          highway_sticker_expiry?: string | null
          id?: string
          insurance_date?: string | null
          insurance_note?: string | null
          is_active?: boolean
          service_date?: string | null
          service_note?: string | null
          spz: string
          stk_date?: string | null
          stk_note?: string | null
          type: string
          vin?: string | null
        }
        Update: {
          brand?: string
          created_at?: string
          current_km?: number
          emission_date?: string | null
          emission_note?: string | null
          highway_sticker_expiry?: string | null
          id?: string
          insurance_date?: string | null
          insurance_note?: string | null
          is_active?: boolean
          service_date?: string | null
          service_note?: string | null
          spz?: string
          stk_date?: string | null
          stk_note?: string | null
          type?: string
          vin?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user_account: { Args: never; Returns: undefined }
      get_monthly_vehicle_summary: {
        Args: {
          _include_inactive?: boolean
          _month: number
          _project_id?: string
          _vehicle_id?: string
          _year: number
        }
        Returns: {
          avg_consumption: number
          drive_count: number
          fueling_count: number
          is_active: boolean
          total_fuel_cost: number
          total_fuel_liters: number
          total_km: number
          vehicle_brand: string
          vehicle_id: string
          vehicle_spz: string
          vehicle_type: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "employee"
      employment_type: "zivnost" | "dohoda"
      employment_type_new:
        | "zivnost"
        | "dohoda_25"
        | "dohoda_50"
        | "tpp"
        | "administrativa"
      job_position:
        | "pilcik"
        | "strojnik"
        | "elektrikar"
        | "sofer"
        | "administrativa"
      project_status: "planned" | "active" | "completed"
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
      app_role: ["admin", "employee"],
      employment_type: ["zivnost", "dohoda"],
      employment_type_new: [
        "zivnost",
        "dohoda_25",
        "dohoda_50",
        "tpp",
        "administrativa",
      ],
      job_position: [
        "pilcik",
        "strojnik",
        "elektrikar",
        "sofer",
        "administrativa",
      ],
      project_status: ["planned", "active", "completed"],
    },
  },
} as const

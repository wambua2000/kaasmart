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
      agent_properties: {
        Row: {
          agent_id: string
          assigned_at: string | null
          assigned_by: string | null
          can_manage_all: boolean | null
          id: string
          property_id: string | null
        }
        Insert: {
          agent_id: string
          assigned_at?: string | null
          assigned_by?: string | null
          can_manage_all?: boolean | null
          id?: string
          property_id?: string | null
        }
        Update: {
          agent_id?: string
          assigned_at?: string | null
          assigned_by?: string | null
          can_manage_all?: boolean | null
          id?: string
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          is_used: boolean | null
          password_hash: string | null
          property_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          room_id: string | null
          temporary_password: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          is_used?: boolean | null
          password_hash?: string | null
          property_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          room_id?: string | null
          temporary_password?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          is_used?: boolean | null
          password_hash?: string | null
          property_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          room_id?: string | null
          temporary_password?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          notes: string | null
          property_id: string | null
          room_id: string | null
          status: string | null
          tenant_id: string
          updated_at: string
          upload_date: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          notes?: string | null
          property_id?: string | null
          room_id?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string
          upload_date?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          notes?: string | null
          property_id?: string | null
          room_id?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string
          upload_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lease_documents_property_id"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lease_documents_room_id"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_properties: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          can_manage_all: boolean | null
          id: string
          manager_id: string
          property_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          can_manage_all?: boolean | null
          id?: string
          manager_id: string
          property_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          can_manage_all?: boolean | null
          id?: string
          manager_id?: string
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manager_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: string | null
          property_id: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type?: string | null
          property_id?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: string | null
          property_id?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          email: string
          id: string
          new_password: string | null
          notes: string | null
          status: string
          user_role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          email: string
          id?: string
          new_password?: string | null
          notes?: string | null
          status?: string
          user_role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          new_password?: string | null
          notes?: string | null
          status?: string
          user_role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      payment_reminders: {
        Row: {
          amount_due: number
          created_at: string | null
          due_date: string
          id: string
          message: string | null
          property_id: string
          reminder_date: string
          room_id: string
          sent_by: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount_due: number
          created_at?: string | null
          due_date: string
          id?: string
          message?: string | null
          property_id: string
          reminder_date: string
          room_id: string
          sent_by?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount_due?: number
          created_at?: string | null
          due_date?: string
          id?: string
          message?: string | null
          property_id?: string
          reminder_date?: string
          room_id?: string
          sent_by?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          property_id: string
          receipt_url: string | null
          recorded_by: string | null
          reference_number: string | null
          room_id: string
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          property_id: string
          receipt_url?: string | null
          recorded_by?: string | null
          reference_number?: string | null
          room_id: string
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          property_id?: string
          receipt_url?: string | null
          recorded_by?: string | null
          reference_number?: string | null
          room_id?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          location: string
          manager_id: string | null
          name: string
          owner_id: string | null
          rent_per_room: number
          total_rooms: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          location: string
          manager_id?: string | null
          name: string
          owner_id?: string | null
          rent_per_room: number
          total_rooms: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          location?: string
          manager_id?: string | null
          name?: string
          owner_id?: string | null
          rent_per_room?: number
          total_rooms?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string | null
          id: string
          is_occupied: boolean | null
          property_id: string | null
          rent_amount: number
          rent_status: string | null
          room_number: string
          tenant_accessories: string[] | null
          tenant_date_of_entry: string | null
          tenant_email: string | null
          tenant_id: string | null
          tenant_name: string | null
          tenant_notes: string | null
          tenant_phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_occupied?: boolean | null
          property_id?: string | null
          rent_amount: number
          rent_status?: string | null
          room_number: string
          tenant_accessories?: string[] | null
          tenant_date_of_entry?: string | null
          tenant_email?: string | null
          tenant_id?: string | null
          tenant_name?: string | null
          tenant_notes?: string | null
          tenant_phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_occupied?: boolean | null
          property_id?: string | null
          rent_amount?: number
          rent_status?: string | null
          room_number?: string
          tenant_accessories?: string[] | null
          tenant_date_of_entry?: string | null
          tenant_email?: string | null
          tenant_id?: string | null
          tenant_name?: string | null
          tenant_notes?: string | null
          tenant_phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      can_manage_property: {
        Args: { _property_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_property_as_agent: {
        Args: { _property_id: string; _user_id: string }
        Returns: boolean
      }
      generate_invitation_credentials: {
        Args: {
          invitation_email: string
          invitation_role: Database["public"]["Enums"]["app_role"]
          invite_property_id?: string
          invite_room_id?: string
          invited_by_user?: string
        }
        Returns: {
          email: string
          expires_at: string
          invitation_id: string
          temporary_password: string
        }[]
      }
      generate_rooms_for_property: {
        Args: {
          property_id_param: string
          property_name_param: string
          rent_amount_param: number
          total_rooms_param: number
        }
        Returns: undefined
      }
      get_agent_properties_with_stats: {
        Args: { agent_user_id: string }
        Returns: {
          id: string
          image_url: string
          location: string
          name: string
          occupied_rooms: number
          pending_amount: number
          rent_per_room: number
          total_collected: number
          total_rooms: number
        }[]
      }
      get_invitation_credentials: {
        Args: { invitation_email: string }
        Returns: {
          email: string
          property_id: string
          role: Database["public"]["Enums"]["app_role"]
          room_id: string
          temporary_password: string
        }[]
      }
      get_invitation_status: {
        Args: { user_email: string }
        Returns: {
          created_at: string
          expires_at: string
          id: string
          is_used: boolean
          property_id: string
          role: Database["public"]["Enums"]["app_role"]
          room_id: string
        }[]
      }
      get_manager_properties_with_stats: {
        Args: { manager_user_id: string }
        Returns: {
          id: string
          image_url: string
          location: string
          name: string
          occupied_rooms: number
          rent_per_room: number
          total_rooms: number
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_password: { Args: { password: string }; Returns: string }
      is_tenant_of_property: {
        Args: { _property_id: string; _user_id: string }
        Returns: boolean
      }
      use_invitation: { Args: { invitation_id: string }; Returns: boolean }
      verify_invitation_login: {
        Args: { login_email: string; login_password: string }
        Returns: {
          invitation_id: string
          property_id: string
          room_id: string
          user_role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      verify_password: {
        Args: { hash: string; password: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "manager" | "tenant" | "developer" | "agent"
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
      app_role: ["owner", "manager", "tenant", "developer", "agent"],
    },
  },
} as const

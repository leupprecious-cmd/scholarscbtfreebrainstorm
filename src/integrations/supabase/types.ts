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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: number
          lesson_name: string
          show_rankings: boolean
        }
        Insert: {
          id?: number
          lesson_name?: string
          show_rankings?: boolean
        }
        Update: {
          id?: number
          lesson_name?: string
          show_rankings?: boolean
        }
        Relationships: []
      }
      attempts: {
        Row: {
          answers: Json
          correct_count: number
          deadline: string
          id: string
          manual_marks: Json
          pending_grading: boolean
          score: number
          started_at: string
          status: string
          student_id: string
          submitted_at: string | null
          test_id: string
          total: number
          unanswered_count: number
          wrong_count: number
        }
        Insert: {
          answers?: Json
          correct_count?: number
          deadline: string
          id?: string
          manual_marks?: Json
          pending_grading?: boolean
          score?: number
          started_at?: string
          status?: string
          student_id: string
          submitted_at?: string | null
          test_id: string
          total?: number
          unanswered_count?: number
          wrong_count?: number
        }
        Update: {
          answers?: Json
          correct_count?: number
          deadline?: string
          id?: string
          manual_marks?: Json
          pending_grading?: boolean
          score?: number
          started_at?: string
          status?: string
          student_id?: string
          submitted_at?: string | null
          test_id?: string
          total?: number
          unanswered_count?: number
          wrong_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          class: string
          created_at: string
          email: string
          full_name: string
          id: string
          student_id: string
        }
        Insert: {
          class?: string
          created_at?: string
          email?: string
          full_name?: string
          id: string
          student_id?: string
        }
        Update: {
          class?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          student_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string
          id: string
          marks: number
          options: Json
          position: number
          test_id: string
          text: string
          type: string
        }
        Insert: {
          correct_answer?: string
          created_at?: string
          id?: string
          marks?: number
          options?: Json
          position?: number
          test_id: string
          text: string
          type: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          id?: string
          marks?: number
          options?: Json
          position?: number
          test_id?: string
          text?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          class: string
          created_at: string
          duration_minutes: number
          end_at: string | null
          id: string
          instructions: string
          pass_percentage: number
          show_results: boolean
          start_at: string | null
          status: string
          subject: string
          title: string
        }
        Insert: {
          class?: string
          created_at?: string
          duration_minutes?: number
          end_at?: string | null
          id?: string
          instructions?: string
          pass_percentage?: number
          show_results?: boolean
          start_at?: string | null
          status?: string
          subject?: string
          title: string
        }
        Update: {
          class?: string
          created_at?: string
          duration_minutes?: number
          end_at?: string | null
          id?: string
          instructions?: string
          pass_percentage?: number
          show_results?: boolean
          start_at?: string | null
          status?: string
          subject?: string
          title?: string
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
      admin_exists: { Args: never; Returns: boolean }
      admin_reset_attempt: { Args: { _attempt_id: string }; Returns: undefined }
      claim_admin: { Args: never; Returns: boolean }
      finalize_if_expired: { Args: { _attempt_id: string }; Returns: undefined }
      get_attempt: { Args: { _attempt_id: string }; Returns: Json }
      grade_written: {
        Args: { _attempt_id: string; _marks: number; _question_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_results: {
        Args: never
        Returns: {
          attempt_id: string
          correct_count: number
          pass_percentage: number
          pending_grading: boolean
          score: number
          show_results: boolean
          status: string
          subject: string
          submitted_at: string
          test_title: string
          total: number
          unanswered_count: number
          wrong_count: number
        }[]
      }
      recalc_attempt: { Args: { _attempt_id: string }; Returns: undefined }
      save_answers: {
        Args: { _answers: Json; _attempt_id: string }
        Returns: boolean
      }
      start_attempt: { Args: { _test_id: string }; Returns: string }
      student_tests: {
        Args: never
        Returns: {
          class: string
          duration_minutes: number
          end_at: string
          id: string
          instructions: string
          pass_percentage: number
          question_count: number
          start_at: string
          subject: string
          title: string
          total_marks: number
        }[]
      }
      submit_attempt: {
        Args: { _answers: Json; _attempt_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "student"],
    },
  },
} as const

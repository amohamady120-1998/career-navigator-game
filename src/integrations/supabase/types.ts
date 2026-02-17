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
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_name: string
          event_props: Json
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_name: string
          event_props?: Json
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_name?: string
          event_props?: Json
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      answers: {
        Row: {
          answer_value: string
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          answer_value: string
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          answer_value?: string
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      app_error_logs: {
        Row: {
          created_at: string | null
          error_message: string
          id: string
          meta: Json
          route: string | null
          stack: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message: string
          id?: string
          meta?: Json
          route?: string | null
          stack?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string
          id?: string
          meta?: Json
          route?: string | null
          stack?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_code: string
          full_name: string | null
          id: string
          issued_at: string | null
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          certificate_code: string
          full_name?: string | null
          id?: string
          issued_at?: string | null
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          certificate_code?: string
          full_name?: string | null
          id?: string
          issued_at?: string | null
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      consultation_requests: {
        Row: {
          consultation_type: string
          created_at: string | null
          id: string
          notes: string | null
          report_link: string | null
          status: string | null
          user_id: string
          user_name: string | null
          whatsapp: string
        }
        Insert: {
          consultation_type: string
          created_at?: string | null
          id?: string
          notes?: string | null
          report_link?: string | null
          status?: string | null
          user_id: string
          user_name?: string | null
          whatsapp: string
        }
        Update: {
          consultation_type?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          report_link?: string | null
          status?: string | null
          user_id?: string
          user_name?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      final_reports: {
        Row: {
          created_at: string | null
          id: string
          payload: Json
          pdf_url: string | null
          share_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload?: Json
          pdf_url?: string | null
          share_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payload?: Json
          pdf_url?: string | null
          share_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      holland_codes: {
        Row: {
          career_paths: Json | null
          code: string
          description: string | null
          recommended_majors: Json | null
          strengths: Json | null
          weaknesses: Json | null
        }
        Insert: {
          career_paths?: Json | null
          code: string
          description?: string | null
          recommended_majors?: Json | null
          strengths?: Json | null
          weaknesses?: Json | null
        }
        Update: {
          career_paths?: Json | null
          code?: string
          description?: string | null
          recommended_majors?: Json | null
          strengths?: Json | null
          weaknesses?: Json | null
        }
        Relationships: []
      }
      holland_major_map: {
        Row: {
          created_at: string | null
          holland_code: string
          id: string
          major_id: string | null
          rank_order: number
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          holland_code: string
          id?: string
          major_id?: string | null
          rank_order: number
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          holland_code?: string
          id?: string
          major_id?: string | null
          rank_order?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "holland_major_map_major_id_fkey"
            columns: ["major_id"]
            isOneToOne: false
            referencedRelation: "majors"
            referencedColumns: ["id"]
          },
        ]
      }
      holland_results: {
        Row: {
          created_at: string
          id: string
          scores: Json
          top_code: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          scores?: Json
          top_code?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          scores?: Json
          top_code?: string
          user_id?: string
        }
        Relationships: []
      }
      impact_assessments: {
        Row: {
          answers: Json
          assessment_type: string
          created_at: string | null
          id: string
          score_json: Json | null
          user_id: string
        }
        Insert: {
          answers?: Json
          assessment_type: string
          created_at?: string | null
          id?: string
          score_json?: Json | null
          user_id: string
        }
        Update: {
          answers?: Json
          assessment_type?: string
          created_at?: string | null
          id?: string
          score_json?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      institution_student_links: {
        Row: {
          created_at: string
          id: string
          institution_user_id: string
          student_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_user_id: string
          student_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_user_id?: string
          student_user_id?: string
        }
        Relationships: []
      }
      journey_steps: {
        Row: {
          id: string
          is_locked: boolean
          name_ar: string
          order_index: number
          slug: string
        }
        Insert: {
          id?: string
          is_locked?: boolean
          name_ar: string
          order_index: number
          slug: string
        }
        Update: {
          id?: string
          is_locked?: boolean
          name_ar?: string
          order_index?: number
          slug?: string
        }
        Relationships: []
      }
      major_explore_responses: {
        Row: {
          comfort_level: string
          created_at: string | null
          id: string
          major_id: string | null
          scenario_choice_index: number
          stage_key: string
          time_spent_sec: number
          user_id: string
        }
        Insert: {
          comfort_level: string
          created_at?: string | null
          id?: string
          major_id?: string | null
          scenario_choice_index: number
          stage_key: string
          time_spent_sec: number
          user_id: string
        }
        Update: {
          comfort_level?: string
          created_at?: string | null
          id?: string
          major_id?: string | null
          scenario_choice_index?: number
          stage_key?: string
          time_spent_sec?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "major_explore_responses_major_id_fkey"
            columns: ["major_id"]
            isOneToOne: false
            referencedRelation: "majors"
            referencedColumns: ["id"]
          },
        ]
      }
      major_explore_sections: {
        Row: {
          challenges_ar: Json
          created_at: string | null
          id: string
          major_id: string | null
          reality_snapshot_ar: string
          scenario_options_ar: Json
          scenario_prompt_ar: string
          stage_key: string
          stage_title_ar: string
          updated_at: string | null
        }
        Insert: {
          challenges_ar?: Json
          created_at?: string | null
          id?: string
          major_id?: string | null
          reality_snapshot_ar: string
          scenario_options_ar?: Json
          scenario_prompt_ar: string
          stage_key: string
          stage_title_ar: string
          updated_at?: string | null
        }
        Update: {
          challenges_ar?: Json
          created_at?: string | null
          id?: string
          major_id?: string | null
          reality_snapshot_ar?: string
          scenario_options_ar?: Json
          scenario_prompt_ar?: string
          stage_key?: string
          stage_title_ar?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "major_explore_sections_major_id_fkey"
            columns: ["major_id"]
            isOneToOne: false
            referencedRelation: "majors"
            referencedColumns: ["id"]
          },
        ]
      }
      majors: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string | null
          email_to: string | null
          id: string
          is_enabled: boolean | null
          key: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string | null
          email_to?: string | null
          id?: string
          is_enabled?: boolean | null
          key: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string | null
          email_to?: string | null
          id?: string
          is_enabled?: boolean | null
          key?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      notifications_log: {
        Row: {
          created_at: string | null
          error: string | null
          event_key: string
          id: string
          payload: Json
          sent_email: boolean | null
          sent_webhook: boolean | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          event_key: string
          id?: string
          payload?: Json
          sent_email?: boolean | null
          sent_webhook?: boolean | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          event_key?: string
          id?: string
          payload?: Json
          sent_email?: boolean | null
          sent_webhook?: boolean | null
        }
        Relationships: []
      }
      parent_activation_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          parent_user_id: string
          status: string
          token: string
          used_at: string | null
          used_by_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          parent_user_id: string
          status?: string
          token: string
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          parent_user_id?: string
          status?: string
          token?: string
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Relationships: []
      }
      parent_child_links: {
        Row: {
          child_user_id: string
          created_at: string
          id: string
          parent_user_id: string
        }
        Insert: {
          child_user_id: string
          created_at?: string
          id?: string
          parent_user_id: string
        }
        Update: {
          child_user_id?: string
          created_at?: string
          id?: string
          parent_user_id?: string
        }
        Relationships: []
      }
      parent_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          parent_user_id: string
          payload: Json
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          parent_user_id: string
          payload?: Json
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          parent_user_id?: string
          payload?: Json
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          grade_level: string | null
          has_paid: boolean
          id: string
          phone: string | null
          school_name: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          grade_level?: string | null
          has_paid?: boolean
          id?: string
          phone?: string | null
          school_name?: string | null
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          created_at?: string
          full_name?: string | null
          grade_level?: string | null
          has_paid?: boolean
          id?: string
          phone?: string | null
          school_name?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          discount_percentage: number
          id: string
          is_active: boolean
        }
        Insert: {
          code: string
          created_at?: string
          discount_percentage: number
          id?: string
          is_active?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          discount_percentage?: number
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string
          id: string
          options_json: Json
          order_index: number
          riasec_code: string | null
          text_ar: string
        }
        Insert: {
          category: string
          id?: string
          options_json?: Json
          order_index?: number
          riasec_code?: string | null
          text_ar: string
        }
        Update: {
          category?: string
          id?: string
          options_json?: Json
          order_index?: number
          riasec_code?: string | null
          text_ar?: string
        }
        Relationships: []
      }
      rate_limit_entries: {
        Row: {
          count: number
          created_at: string | null
          id: string
          key: string
          user_id: string | null
          window_start: string
        }
        Insert: {
          count?: number
          created_at?: string | null
          id?: string
          key: string
          user_id?: string | null
          window_start: string
        }
        Update: {
          count?: number
          created_at?: string | null
          id?: string
          key?: string
          user_id?: string | null
          window_start?: string
        }
        Relationships: []
      }
      report_shares: {
        Row: {
          created_at: string | null
          id: string
          report_id: string | null
          share_token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          report_id?: string | null
          share_token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          report_id?: string | null
          share_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_shares_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "final_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      school_admins: {
        Row: {
          created_at: string | null
          id: string
          role: string
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_admins_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_used: boolean
          school_order_id: string
          used_at: string | null
          used_by_user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_used?: boolean
          school_order_id: string
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_used?: boolean
          school_order_id?: string
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_codes_school_order_id_fkey"
            columns: ["school_order_id"]
            isOneToOne: false
            referencedRelation: "school_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      school_orders: {
        Row: {
          created_at: string | null
          id: string
          school_id: string
          seats_total: number
          seats_used: number
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          school_id: string
          seats_total: number
          seats_used?: number
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          school_id?: string
          seats_total?: number
          seats_used?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_orders_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_whatsapp: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      simulation_responses: {
        Row: {
          created_at: string
          id: string
          rationale_text: string | null
          scenario_id: string
          selected_option_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rationale_text?: string | null
          scenario_id: string
          selected_option_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rationale_text?: string | null
          scenario_id?: string
          selected_option_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_responses_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "simulation_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_scenarios: {
        Row: {
          created_at: string
          id: string
          level: string
          major_id: string
          options_json: Json
          text_ar: string
          timer_seconds: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          level: string
          major_id: string
          options_json?: Json
          text_ar: string
          timer_seconds?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          major_id?: string
          options_json?: Json
          text_ar?: string
          timer_seconds?: number | null
        }
        Relationships: []
      }
      student_shortlist: {
        Row: {
          id: string
          major_ids: Json
          ranking_ids: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          major_ids?: Json
          ranking_ids?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          major_ids?: Json
          ranking_ids?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          is_enabled: boolean
          setting_key: string
        }
        Insert: {
          is_enabled?: boolean
          setting_key: string
        }
        Update: {
          is_enabled?: boolean
          setting_key?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          consent_version: string
          consented_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          consent_version?: string
          consented_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          consent_version?: string
          consented_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed_at: string | null
          id: string
          meta_data: Json | null
          status: string
          step_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          meta_data?: Json | null
          status?: string
          step_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          meta_data?: Json | null
          status?: string
          step_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
        ]
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
      user_school_membership: {
        Row: {
          activated_at: string | null
          activated_by_code: string | null
          id: string
          school_id: string
          school_order_id: string | null
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          activated_by_code?: string | null
          id?: string
          school_id: string
          school_order_id?: string | null
          user_id: string
        }
        Update: {
          activated_at?: string | null
          activated_by_code?: string | null
          id?: string
          school_id?: string
          school_order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_school_membership_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_school_membership_school_order_id_fkey"
            columns: ["school_order_id"]
            isOneToOne: false
            referencedRelation: "school_orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      certificate_verification: {
        Row: {
          certificate_code: string | null
          full_name: string | null
          issued_at: string | null
        }
        Insert: {
          certificate_code?: string | null
          full_name?: string | null
          issued_at?: string | null
        }
        Update: {
          certificate_code?: string | null
          full_name?: string | null
          issued_at?: string | null
        }
        Relationships: []
      }
      view_school_impact_summary: {
        Row: {
          avg_post_score: number | null
          avg_pre_score: number | null
          count_post_completed: number | null
          count_pre_completed: number | null
          school_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_school_membership_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      view_school_progress_counts: {
        Row: {
          completed_count: number | null
          in_progress_count: number | null
          order_index: number | null
          school_id: string | null
          step_name: string | null
          step_slug: string | null
          total_students: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_school_membership_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      view_school_students: {
        Row: {
          activated_at: string | null
          activated_by_code: string | null
          school_id: string | null
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          activated_by_code?: string | null
          school_id?: string | null
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          activated_by_code?: string | null
          school_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_school_membership_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      activate_school_code: { Args: { p_code: string }; Returns: Json }
      calculate_holland_scores: { Args: { _user_id: string }; Returns: Json }
      consume_parent_activation_token: {
        Args: { p_token: string }
        Returns: Json
      }
      get_holland_code: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_student_by_email: {
        Args: { student_email: string }
        Returns: boolean
      }
      link_students_by_school: {
        Args: { school_name: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      user_type: "student" | "parent" | "institution"
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
      user_type: ["student", "parent", "institution"],
    },
  },
} as const

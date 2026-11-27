export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      badges: {
        Row: {
          description: string
          family: Database['public']['Enums']['badge_family']
          key: string
          rarity: Database['public']['Enums']['badge_rarity']
          sort_order: number
          title: string
        }
        ComputedFields: never
        Insert: {
          description: string
          family: Database['public']['Enums']['badge_family']
          key: string
          rarity: Database['public']['Enums']['badge_rarity']
          sort_order?: number
          title: string
        }
        Update: {
          description?: string
          family?: Database['public']['Enums']['badge_family']
          key?: string
          rarity?: Database['public']['Enums']['badge_rarity']
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          slug: string
          sort_order: number
          status: Database['public']['Enums']['content_status']
          universe_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          description?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          status?: Database['public']['Enums']['content_status']
          universe_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          status?: Database['public']['Enums']['content_status']
          universe_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'categories_universe_id_fkey'
            columns: ['universe_id']
            isOneToOne: false
            referencedRelation: 'universes'
            referencedColumns: ['id']
          },
        ]
      }
      chapters: {
        Row: {
          course_id: string
          created_at: string
          description: string
          id: string
          position: number
          status: Database['public']['Enums']['content_status']
          title: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          course_id: string
          created_at?: string
          description?: string
          id?: string
          position: number
          status?: Database['public']['Enums']['content_status']
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string
          id?: string
          position?: number
          status?: Database['public']['Enums']['content_status']
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'chapters_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      courses: {
        Row: {
          category_id: string
          created_at: string
          description: string
          id: string
          level: Database['public']['Enums']['course_level']
          slug: string
          sort_order: number
          status: Database['public']['Enums']['content_status']
          title: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          category_id: string
          created_at?: string
          description?: string
          id?: string
          level?: Database['public']['Enums']['course_level']
          slug: string
          sort_order?: number
          status?: Database['public']['Enums']['content_status']
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string
          id?: string
          level?: Database['public']['Enums']['course_level']
          slug?: string
          sort_order?: number
          status?: Database['public']['Enums']['content_status']
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'courses_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      daily_activity: {
        Row: {
          day: string
          frozen: boolean
          goal_met: boolean
          goal_xp: number
          lessons_completed: number
          practice_completed: number
          updated_at: string
          user_id: string
          xp: number
        }
        ComputedFields: never
        Insert: {
          day: string
          frozen?: boolean
          goal_met?: boolean
          goal_xp?: number
          lessons_completed?: number
          practice_completed?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          day?: string
          frozen?: boolean
          goal_met?: boolean
          goal_xp?: number
          lessons_completed?: number
          practice_completed?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          created_at: string
          day: string
          id: string
          question_ids: string[]
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          day: string
          id?: string
          question_ids: string[]
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          question_ids?: string[]
        }
        Relationships: []
      }
      game_config: {
        Row: {
          description: string
          key: string
          updated_at: string
          value: NonNullable<Json>
        }
        ComputedFields: never
        Insert: {
          description?: string
          key: string
          updated_at?: string
          value: NonNullable<Json>
        }
        Update: {
          description?: string
          key?: string
          updated_at?: string
          value?: NonNullable<Json>
        }
        Relationships: []
      }
      knowledge_items: {
        Row: {
          created_at: string
          id: string
          is_evolving: boolean
          key: string
          source_url: string | null
          summary: string
          title: string
          universe_id: string
          updated_at: string
          valid_as_of: string | null
          verified_at: string | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          is_evolving?: boolean
          key: string
          source_url?: string | null
          summary?: string
          title: string
          universe_id: string
          updated_at?: string
          valid_as_of?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_evolving?: boolean
          key?: string
          source_url?: string | null
          summary?: string
          title?: string
          universe_id?: string
          updated_at?: string
          valid_as_of?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'knowledge_items_universe_id_fkey'
            columns: ['universe_id']
            isOneToOne: false
            referencedRelation: 'universes'
            referencedColumns: ['id']
          },
        ]
      }
      learning_cards: {
        Row: {
          blocks: NonNullable<Json>
          created_at: string
          id: string
          lesson_id: string
          position: number
          title: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          blocks: NonNullable<Json>
          created_at?: string
          id?: string
          lesson_id: string
          position: number
          title: string
          updated_at?: string
        }
        Update: {
          blocks?: NonNullable<Json>
          created_at?: string
          id?: string
          lesson_id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'learning_cards_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
        ]
      }
      lesson_items: {
        Row: {
          lesson_id: string
          position: number
          question_id: string
        }
        ComputedFields: never
        Insert: {
          lesson_id: string
          position: number
          question_id: string
        }
        Update: {
          lesson_id?: string
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lesson_items_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lesson_items_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'questions'
            referencedColumns: ['id']
          },
        ]
      }
      lesson_sessions: {
        Row: {
          completed_at: string | null
          correct_count: number | null
          id: string
          lesson_id: string
          question_ids: string[]
          rewards: Json | null
          score: number | null
          started_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          completed_at?: string | null
          correct_count?: number | null
          id?: string
          lesson_id: string
          question_ids: string[]
          rewards?: Json | null
          score?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          correct_count?: number | null
          id?: string
          lesson_id?: string
          question_ids?: string[]
          rewards?: Json | null
          score?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lesson_sessions_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
        ]
      }
      lessons: {
        Row: {
          chapter_id: string
          created_at: string
          estimated_minutes: number
          id: string
          kind: Database['public']['Enums']['lesson_kind']
          objective: string
          position: number
          slug: string
          status: Database['public']['Enums']['content_status']
          title: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          chapter_id: string
          created_at?: string
          estimated_minutes?: number
          id?: string
          kind?: Database['public']['Enums']['lesson_kind']
          objective?: string
          position: number
          slug: string
          status?: Database['public']['Enums']['content_status']
          title: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          estimated_minutes?: number
          id?: string
          kind?: Database['public']['Enums']['lesson_kind']
          objective?: string
          position?: number
          slug?: string
          status?: Database['public']['Enums']['content_status']
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lessons_chapter_id_fkey'
            columns: ['chapter_id']
            isOneToOne: false
            referencedRelation: 'chapters'
            referencedColumns: ['id']
          },
        ]
      }
      practice_attempts: {
        Row: {
          answer: NonNullable<Json>
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          score: number
          session_id: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          answer: NonNullable<Json>
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          score: number
          session_id: string
          user_id: string
        }
        Update: {
          answer?: NonNullable<Json>
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          score?: number
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'practice_attempts_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'questions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'practice_attempts_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'practice_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      practice_sessions: {
        Row: {
          completed_at: string | null
          correct_count: number | null
          daily_challenge_id: string | null
          day: string
          id: string
          kind: Database['public']['Enums']['practice_kind']
          knowledge_item_ids: string[] | null
          question_ids: string[]
          rewards: Json | null
          score: number | null
          started_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          completed_at?: string | null
          correct_count?: number | null
          daily_challenge_id?: string | null
          day: string
          id?: string
          kind: Database['public']['Enums']['practice_kind']
          knowledge_item_ids?: string[] | null
          question_ids: string[]
          rewards?: Json | null
          score?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          correct_count?: number | null
          daily_challenge_id?: string | null
          day?: string
          id?: string
          kind?: Database['public']['Enums']['practice_kind']
          knowledge_item_ids?: string[] | null
          question_ids?: string[]
          rewards?: Json | null
          score?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'practice_sessions_daily_challenge_id_fkey'
            columns: ['daily_challenge_id']
            isOneToOne: false
            referencedRelation: 'daily_challenges'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_key: string
          created_at: string
          id: string
          updated_at: string
          username: string | null
          visibility: Database['public']['Enums']['profile_visibility']
        }
        ComputedFields: never
        Insert: {
          avatar_key?: string
          created_at?: string
          id: string
          updated_at?: string
          username?: string | null
          visibility?: Database['public']['Enums']['profile_visibility']
        }
        Update: {
          avatar_key?: string
          created_at?: string
          id?: string
          updated_at?: string
          username?: string | null
          visibility?: Database['public']['Enums']['profile_visibility']
        }
        Relationships: []
      }
      question_attempts: {
        Row: {
          answer: NonNullable<Json>
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          score: number
          session_id: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          answer: NonNullable<Json>
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          score: number
          session_id: string
          user_id: string
        }
        Update: {
          answer?: NonNullable<Json>
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          score?: number
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'question_attempts_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'questions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'question_attempts_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'lesson_sessions'
            referencedColumns: ['id']
          },
        ]
      }
      question_knowledge_items: {
        Row: {
          knowledge_item_id: string
          question_id: string
        }
        ComputedFields: never
        Insert: {
          knowledge_item_id: string
          question_id: string
        }
        Update: {
          knowledge_item_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'question_knowledge_items_knowledge_item_id_fkey'
            columns: ['knowledge_item_id']
            isOneToOne: false
            referencedRelation: 'knowledge_items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'question_knowledge_items_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'questions'
            referencedColumns: ['id']
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          difficulty: number
          format: Database['public']['Enums']['question_format']
          id: string
          is_evolving: boolean
          key: string
          payload: NonNullable<Json>
          prompt: string
          status: Database['public']['Enums']['content_status']
          universe_id: string
          updated_at: string
          valid_as_of: string | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          difficulty?: number
          format: Database['public']['Enums']['question_format']
          id?: string
          is_evolving?: boolean
          key: string
          payload?: NonNullable<Json>
          prompt: string
          status?: Database['public']['Enums']['content_status']
          universe_id: string
          updated_at?: string
          valid_as_of?: string | null
        }
        Update: {
          created_at?: string
          difficulty?: number
          format?: Database['public']['Enums']['question_format']
          id?: string
          is_evolving?: boolean
          key?: string
          payload?: NonNullable<Json>
          prompt?: string
          status?: Database['public']['Enums']['content_status']
          universe_id?: string
          updated_at?: string
          valid_as_of?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'questions_universe_id_fkey'
            columns: ['universe_id']
            isOneToOne: false
            referencedRelation: 'universes'
            referencedColumns: ['id']
          },
        ]
      }
      universes: {
        Row: {
          color_dark: string
          color_light: string
          created_at: string
          description: string
          icon_key: string
          id: string
          name: string
          slug: string
          sort_order: number
          status: Database['public']['Enums']['content_status']
          tagline: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          color_dark: string
          color_light: string
          created_at?: string
          description?: string
          icon_key?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          status?: Database['public']['Enums']['content_status']
          tagline?: string
          updated_at?: string
        }
        Update: {
          color_dark?: string
          color_light?: string
          created_at?: string
          description?: string
          icon_key?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          status?: Database['public']['Enums']['content_status']
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_key: string
          earned_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          badge_key: string
          earned_at?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_badges_badge_key_fkey'
            columns: ['badge_key']
            isOneToOne: false
            referencedRelation: 'badges'
            referencedColumns: ['key']
          },
        ]
      }
      user_course_progress: {
        Row: {
          completed_at: string | null
          completed_lessons: number
          course_id: string
          last_lesson_id: string | null
          started_at: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          completed_at?: string | null
          completed_lessons?: number
          course_id: string
          last_lesson_id?: string | null
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_lessons?: number
          course_id?: string
          last_lesson_id?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_course_progress_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_course_progress_last_lesson_id_fkey'
            columns: ['last_lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
        ]
      }
      user_knowledge_state: {
        Row: {
          box: number
          correct_count: number
          created_at: string
          due_on: string
          knowledge_item_id: string
          last_question_id: string | null
          last_reviewed_at: string | null
          updated_at: string
          user_id: string
          wrong_count: number
        }
        ComputedFields: never
        Insert: {
          box?: number
          correct_count?: number
          created_at?: string
          due_on: string
          knowledge_item_id: string
          last_question_id?: string | null
          last_reviewed_at?: string | null
          updated_at?: string
          user_id: string
          wrong_count?: number
        }
        Update: {
          box?: number
          correct_count?: number
          created_at?: string
          due_on?: string
          knowledge_item_id?: string
          last_question_id?: string | null
          last_reviewed_at?: string | null
          updated_at?: string
          user_id?: string
          wrong_count?: number
        }
        Relationships: [
          {
            foreignKeyName: 'user_knowledge_state_knowledge_item_id_fkey'
            columns: ['knowledge_item_id']
            isOneToOne: false
            referencedRelation: 'knowledge_items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_knowledge_state_last_question_id_fkey'
            columns: ['last_question_id']
            isOneToOne: false
            referencedRelation: 'questions'
            referencedColumns: ['id']
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          attempts: number
          best_score: number | null
          first_completed_at: string | null
          last_completed_at: string | null
          lesson_id: string
          status: Database['public']['Enums']['lesson_progress_status']
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          attempts?: number
          best_score?: number | null
          first_completed_at?: string | null
          last_completed_at?: string | null
          lesson_id: string
          status?: Database['public']['Enums']['lesson_progress_status']
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          best_score?: number | null
          first_completed_at?: string | null
          last_completed_at?: string | null
          lesson_id?: string
          status?: Database['public']['Enums']['lesson_progress_status']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_lesson_progress_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
        ]
      }
      user_onboarding: {
        Row: {
          completed_at: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database['public']['Enums']['app_role']
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          role: Database['public']['Enums']['app_role']
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database['public']['Enums']['app_role']
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          age_confirmed_at: string | null
          created_at: string
          daily_goal_minutes: number
          haptics_enabled: boolean
          reduced_motion: boolean
          show_in_leaderboards: boolean
          sound_enabled: boolean
          terms_accepted_at: string | null
          terms_version: string | null
          theme: Database['public']['Enums']['theme_preference']
          timezone: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          age_confirmed_at?: string | null
          created_at?: string
          daily_goal_minutes?: number
          haptics_enabled?: boolean
          reduced_motion?: boolean
          show_in_leaderboards?: boolean
          sound_enabled?: boolean
          terms_accepted_at?: string | null
          terms_version?: string | null
          theme?: Database['public']['Enums']['theme_preference']
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age_confirmed_at?: string | null
          created_at?: string
          daily_goal_minutes?: number
          haptics_enabled?: boolean
          reduced_motion?: boolean
          show_in_leaderboards?: boolean
          sound_enabled?: boolean
          terms_accepted_at?: string | null
          terms_version?: string | null
          theme?: Database['public']['Enums']['theme_preference']
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          lessons_completed: number
          level: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          lessons_completed?: number
          level?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          lessons_completed?: number
          level?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          current: number
          freezes: number
          last_active_day: string | null
          longest: number
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          current?: number
          freezes?: number
          last_active_day?: string | null
          longest?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current?: number
          freezes?: number
          last_active_day?: string | null
          longest?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_universe_preferences: {
        Row: {
          created_at: string
          is_favorite: boolean
          self_level: Database['public']['Enums']['self_level'] | null
          universe_id: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          is_favorite?: boolean
          self_level?: Database['public']['Enums']['self_level'] | null
          universe_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_favorite?: boolean
          self_level?: Database['public']['Enums']['self_level'] | null
          universe_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_universe_preferences_universe_id_fkey'
            columns: ['universe_id']
            isOneToOne: false
            referencedRelation: 'universes'
            referencedColumns: ['id']
          },
        ]
      }
      user_universe_stats: {
        Row: {
          level: number
          universe_id: string
          updated_at: string
          user_id: string
          xp: number
        }
        ComputedFields: never
        Insert: {
          level?: number
          universe_id: string
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          level?: number
          universe_id?: string
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: 'user_universe_stats_universe_id_fkey'
            columns: ['universe_id']
            isOneToOne: false
            referencedRelation: 'universes'
            referencedColumns: ['id']
          },
        ]
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: Database['public']['Enums']['xp_reason']
          session_id: string | null
          source_id: string
          source_type: Database['public']['Enums']['xp_source']
          universe_id: string | null
          user_id: string
        }
        ComputedFields: never
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: Database['public']['Enums']['xp_reason']
          session_id?: string | null
          source_id: string
          source_type: Database['public']['Enums']['xp_source']
          universe_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: Database['public']['Enums']['xp_reason']
          session_id?: string | null
          source_id?: string
          source_type?: Database['public']['Enums']['xp_source']
          universe_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'xp_transactions_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'lesson_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'xp_transactions_universe_id_fkey'
            columns: ['universe_id']
            isOneToOne: false
            referencedRelation: 'universes'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_lesson: { Args: { p_session: string }; Returns: Json }
      complete_onboarding: {
        Args: { p_avatar_key: string; p_daily_goal: number; p_universes: Json; p_username: string }
        Returns: undefined
      }
      complete_practice: { Args: { p_session: string }; Returns: Json }
      get_my_dna: { Args: Record<PropertyKey, never>; Returns: Json }
      get_my_progress: { Args: Record<PropertyKey, never>; Returns: Json }
      has_role: { Args: { p_role: Database['public']['Enums']['app_role'] }; Returns: boolean }
      set_universe_preferences: { Args: { p_universes: Json }; Returns: undefined }
      start_daily_challenge: { Args: Record<PropertyKey, never>; Returns: Json }
      start_lesson: { Args: { p_lesson: string }; Returns: Json }
      start_review: { Args: Record<PropertyKey, never>; Returns: Json }
      submit_answer: {
        Args: { p_answer: Json; p_question: string; p_session: string }
        Returns: Json
      }
      submit_practice_answer: {
        Args: { p_answer: Json; p_question: string; p_session: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: 'admin' | 'editor' | 'moderator'
      badge_family: 'progress' | 'streak' | 'level' | 'review' | 'daily'
      badge_rarity: 'common' | 'rare' | 'epic' | 'legendary'
      content_status: 'draft' | 'in_review' | 'published' | 'archived'
      course_level: 'decouverte' | 'debutant' | 'intermediaire' | 'avance' | 'expert' | 'maitre'
      lesson_kind: 'standard' | 'exam'
      lesson_progress_status: 'in_progress' | 'completed'
      practice_kind: 'review' | 'daily'
      profile_visibility: 'public' | 'friends' | 'private'
      question_format: 'quiz' | 'true_false' | 'match' | 'timeline' | 'guess_year'
      self_level: 'debutant' | 'intermediaire' | 'expert'
      theme_preference: 'system' | 'light' | 'dark'
      xp_reason:
        | 'correct_answer'
        | 'lesson_completed'
        | 'lesson_perfect'
        | 'chapter_completed'
        | 'exam_passed'
        | 'review_answer'
        | 'review_completed'
        | 'daily_challenge'
      xp_source: 'question' | 'lesson' | 'chapter' | 'practice_session' | 'daily_challenge'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ['admin', 'editor', 'moderator'],
      badge_family: ['progress', 'streak', 'level', 'review', 'daily'],
      badge_rarity: ['common', 'rare', 'epic', 'legendary'],
      content_status: ['draft', 'in_review', 'published', 'archived'],
      course_level: ['decouverte', 'debutant', 'intermediaire', 'avance', 'expert', 'maitre'],
      lesson_kind: ['standard', 'exam'],
      lesson_progress_status: ['in_progress', 'completed'],
      practice_kind: ['review', 'daily'],
      profile_visibility: ['public', 'friends', 'private'],
      question_format: ['quiz', 'true_false', 'match', 'timeline', 'guess_year'],
      self_level: ['debutant', 'intermediaire', 'expert'],
      theme_preference: ['system', 'light', 'dark'],
      xp_reason: [
        'correct_answer',
        'lesson_completed',
        'lesson_perfect',
        'chapter_completed',
        'exam_passed',
        'review_answer',
        'review_completed',
        'daily_challenge',
      ],
      xp_source: ['question', 'lesson', 'chapter', 'practice_session', 'daily_challenge'],
    },
  },
} as const

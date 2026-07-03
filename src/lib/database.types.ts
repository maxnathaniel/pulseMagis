import type { JSONContent } from '@tiptap/core'

// Hand-written to match schema.sql — regenerate by hand if the schema changes.
export type SlideTypeDb = 'choice' | 'wordcloud' | 'open' | 'qa' | 'plain'
export type LayoutDb = 'left' | 'right'
export type ResponseModeDb = 'instant' | 'onclick' | 'private'
export type VerticalAlignDb = 'top' | 'middle' | 'bottom'
export type QuestionStatusDb = 'pending' | 'visible'

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          code: string
          title: string
          owner_id: string | null
          current_slide_index: number
          qna_enabled: boolean
          qna_moderation: boolean
          pin_hash: string | null
          is_live: boolean
          has_presented: boolean
          created_at: string
        }
        Insert: {
          code: string
          title?: string
          owner_id?: string | null
          current_slide_index?: number
          qna_enabled?: boolean
          qna_moderation?: boolean
          pin_hash?: string | null
          is_live?: boolean
          has_presented?: boolean
          created_at?: string
        }
        Update: {
          code?: string
          title?: string
          owner_id?: string | null
          current_slide_index?: number
          qna_enabled?: boolean
          qna_moderation?: boolean
          pin_hash?: string | null
          is_live?: boolean
          has_presented?: boolean
          created_at?: string
        }
        Relationships: []
      }
      slides: {
        Row: {
          id: string
          session_code: string
          type: SlideTypeDb
          question: string
          options: string[] | null
          option_images: (string | null)[] | null
          layout: LayoutDb
          content_image: string | null
          response_mode: ResponseModeDb
          content: JSONContent | null
          vertical_align: VerticalAlignDb
          position: number
          created_at: string
        }
        Insert: {
          id: string
          session_code: string
          type: SlideTypeDb
          question?: string
          options?: string[] | null
          option_images?: (string | null)[] | null
          layout?: LayoutDb
          content_image?: string | null
          response_mode?: ResponseModeDb
          content?: JSONContent | null
          vertical_align?: VerticalAlignDb
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          session_code?: string
          type?: SlideTypeDb
          question?: string
          options?: string[] | null
          option_images?: (string | null)[] | null
          layout?: LayoutDb
          content_image?: string | null
          response_mode?: ResponseModeDb
          content?: JSONContent | null
          vertical_align?: VerticalAlignDb
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      responses: {
        Row: {
          id: string
          session_code: string
          slide_id: string
          value: number | string
          created_at: string
        }
        Insert: {
          id?: string
          session_code: string
          slide_id: string
          value: number | string
          created_at?: string
        }
        Update: {
          id?: string
          session_code?: string
          slide_id?: string
          value?: number | string
          created_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          session_code: string
          text: string
          votes: number
          voter_ids: string[]
          status: QuestionStatusDb
          author_id: string
          answered: boolean
          created_at: string
        }
        Insert: {
          id: string
          session_code: string
          text: string
          votes?: number
          voter_ids?: string[]
          status?: QuestionStatusDb
          author_id: string
          answered?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          session_code?: string
          text?: string
          votes?: number
          voter_ids?: string[]
          status?: QuestionStatusDb
          author_id?: string
          answered?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

import type { JSONContent } from '@tiptap/core'

export type SlideType = 'choice' | 'wordcloud' | 'open' | 'qa' | 'plain'
export type Layout = 'left' | 'right'
export type ResponseMode = 'instant' | 'onclick' | 'private'
export type VerticalAlign = 'top' | 'middle' | 'bottom'
export type QuestionStatus = 'pending' | 'visible'
export type ModerateAction = 'approve' | 'reject' | 'delete' | 'answered'

interface SlideBase {
  id: string
  question: string
  layout: Layout
  contentImage: string | null
  responseMode: ResponseMode
  position?: number
}

export interface ChoiceSlide extends SlideBase {
  type: 'choice'
  options: string[]
  optionImages: (string | null)[]
}

export interface PlainSlide extends SlideBase {
  type: 'plain'
  content: JSONContent | null
  verticalAlign: VerticalAlign
}

export interface SimpleSlide extends SlideBase {
  type: 'wordcloud' | 'open' | 'qa'
}

export type Slide = ChoiceSlide | PlainSlide | SimpleSlide

// Loosest shape a slide preview renderer needs — satisfied structurally by
// both a full Slide and the trimmed-down firstSlide summary fetchPulses
// builds for the Home tile grid (see PulseSummary below).
export interface SlidePreviewData {
  type: SlideType
  question: string
  options?: string[] | null
  optionImages?: (string | null)[] | null
  layout?: Layout
  contentImage?: string | null
  content?: JSONContent | null
  verticalAlign?: VerticalAlign
}

export interface Draft {
  code?: string
  title: string
  qnaModeration: boolean
  moderatorPin: string
  slides: Slide[]
}

export interface Session {
  code: string
  title: string
  slides: Slide[]
  currentSlideIndex: number
  qnaEnabled: boolean
  qnaModeration: boolean
  pinHash: string | null
  isLive: boolean
  hasPresented: boolean
}

export interface Question {
  id: string
  text: string
  votes: number
  voterIds: string[]
  status: QuestionStatus
  authorId: string
  answered: boolean
  createdAt: number
}

export interface PulseSummary {
  code: string
  title: string
  created_at: string
  firstSlide: SlidePreviewData | null
}

// Response values collected per-slide, keyed by slide id.
export type ResponsesBySlide = Record<string, (string | number)[]>

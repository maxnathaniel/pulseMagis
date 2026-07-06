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
  // The uncropped source contentImage was cropped from (capped at 1600px,
  // never itself cropped) — kept so "Edit crop" can re-crop from the full
  // framing instead of re-cropping an already-cropped image. Null for
  // slides created before this field existed, in which case "Edit crop"
  // falls back to re-cropping contentImage itself.
  contentImageOriginal: string | null
  responseMode: ResponseMode
  position?: number
}

export type ResultsFormat = 'bar' | 'donut' | 'pie' | 'dots'

export interface ChoiceSlide extends SlideBase {
  type: 'choice'
  options: string[]
  optionImages: (string | null)[]
  resultsFormat?: ResultsFormat
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

// Patch object accepted by updateSlide/onChange callbacks. Slide is a union,
// and TS computes keyof a union as the intersection of each member's keys —
// so Partial<Slide> can't express type-specific fields like `options` or
// `resultsFormat`. Intersecting the members instead makes keyof their union.
// `type` is omitted from each member first — each member's `type` is a
// different literal, so intersecting them directly collapses the whole type
// to `never`. Patching `type` isn't meaningful here anyway (that goes through
// the dedicated changeSlideType/onChangeType, not this generic patch).
export type SlidePatch = Partial<Omit<ChoiceSlide,'type'> & Omit<PlainSlide,'type'> & Omit<SimpleSlide,'type'>>

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
  resultsFormat?: ResultsFormat
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
  firstSlideResponses?: (string | number)[]
}

// Response values collected per-slide, keyed by slide id.
export type ResponsesBySlide = Record<string, (string | number)[]>

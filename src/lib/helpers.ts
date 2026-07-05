import type { Database } from './database.types.ts'
import type { Slide, Question, Layout, ResponseMode, VerticalAlign, ResultsFormat } from '../types.ts'

type SlideRow = Database['public']['Tables']['slides']['Row']
type QuestionRow = Database['public']['Tables']['questions']['Row']

// ─── helpers ────────────────────────────────────────────────────────────────
export const uid = (p = 's') => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
export const genCode = () => String(Math.floor(100000 + Math.random() * 900000))

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin + ':pulsemagis')
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function compressImage(file: File, maxPx = 220): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(maxPx / img.width, maxPx / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.78))
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

// ─── DB → JS mappers ────────────────────────────────────────────────────────
export const mapSlide = (s: SlideRow): Slide => {
  const base = {
    id: s.id, question: s.question,
    layout: (s.layout || 'right') as Layout,
    contentImage: s.content_image || null,
    responseMode: (s.response_mode || 'instant') as ResponseMode,
    position: s.position,
  }
  if (s.type === 'choice') {
    return { ...base, type: 'choice', options: s.options || [], optionImages: s.option_images || [],
      resultsFormat: (s.results_format || 'bar') as ResultsFormat }
  }
  if (s.type === 'plain') {
    return { ...base, type: 'plain', content: s.content || null, verticalAlign: (s.vertical_align || 'middle') as VerticalAlign }
  }
  return { ...base, type: s.type }
}
// Companion to mapSlide, used only when resuming a Pulse into the Builder's
// editable draft.slides shape (see createSlide in App.jsx). Unlike mapSlide,
// this pads/truncates optionImages to match options.length — startPresenting
// filters empty option strings before insert but does not correspondingly
// filter optionImages, so the two arrays can already be misaligned in the DB.
export const mapSlideForBuilder = (s: SlideRow): Slide => {
  const base = {
    id: s.id, question: s.question,
    layout: (s.layout || 'right') as Layout,
    contentImage: s.content_image || null,
    responseMode: (s.response_mode || 'instant') as ResponseMode,
  }
  if (s.type === 'plain') {
    return { ...base, type: 'plain', content: s.content || null, verticalAlign: (s.vertical_align || 'middle') as VerticalAlign }
  }
  if (s.type !== 'choice') {
    return { ...base, type: s.type }
  }
  const options = s.options && s.options.length ? s.options : ['', '']
  const rawImages = s.option_images || []
  const optionImages = options.map((_, i) => rawImages[i] ?? null)
  return { ...base, type: 'choice', options, optionImages, resultsFormat: (s.results_format || 'bar') as ResultsFormat }
}

export const mapQuestion = (q: QuestionRow): Question => ({
  id: q.id, text: q.text, votes: q.votes, voterIds: q.voter_ids || [],
  status: q.status, authorId: q.author_id, answered: q.answered,
  createdAt: new Date(q.created_at).getTime(),
})

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

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// Downscales (never upscales) a data-URL image so its longer side is at
// most maxPx, re-encoding as JPEG — the shared scale/compress step behind
// both compressImage and the "preserve an uncropped original" flow in
// ImageCropModal.
export function compressDataUrl(dataUrl: string, maxPx: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.78))
    }
    img.src = dataUrl
  })
}

export async function compressImage(file: File, maxPx = 220): Promise<string> {
  return compressDataUrl(await readFileAsDataUrl(file), maxPx)
}

// Crops `img` to the given rect (in the units of the img's own *displayed*
// size, e.g. straight from a react-image-crop PixelCrop against an onscreen
// <img>) then scales/compresses the result exactly like compressImage above,
// so cropped content images stay consistent with every other image this app
// stores (same JPEG quality, same maxPx cap semantics).
export function cropAndCompress(img: HTMLImageElement, crop: { x: number; y: number; width: number; height: number }, maxPx = 640): string {
  const scaleX = img.naturalWidth / img.width
  const scaleY = img.naturalHeight / img.height
  const cropW = crop.width * scaleX
  const cropH = crop.height * scaleY
  const scale = Math.min(maxPx / cropW, maxPx / cropH, 1)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(cropW * scale)
  canvas.height = Math.round(cropH * scale)
  canvas.getContext('2d')!.drawImage(img, crop.x * scaleX, crop.y * scaleY, cropW, cropH, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.78)
}

// ─── DB → JS mappers ────────────────────────────────────────────────────────
export const mapSlide = (s: SlideRow): Slide => {
  const base = {
    id: s.id, question: s.question,
    layout: (s.layout || 'right') as Layout,
    contentImage: s.content_image || null,
    contentImageOriginal: s.content_image_original || null,
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
// Companion to mapSlide, used when resuming a Pulse into the Builder's
// editable draft.slides shape (see createSlide in App.jsx) — from either a
// freshly-fetched DB row (mapSlideForBuilder) or an already-in-memory Slide
// (e.g. a live Session's slides, reused directly on presenter-exit instead of
// re-fetching). Unlike mapSlide, this pads/truncates optionImages to match
// options.length — startPresenting filters empty option strings before
// insert but does not correspondingly filter optionImages, so the two arrays
// can already be misaligned — and strips `position`, which Draft slides
// don't carry.
export function toBuilderSlide(s: Slide): Slide {
  const { position: _position, ...rest } = s
  if (rest.type !== 'choice') return rest
  const options = rest.options.length ? rest.options : ['', '']
  const optionImages = options.map((_, i) => rest.optionImages[i] ?? null)
  return { ...rest, options, optionImages }
}

export const mapSlideForBuilder = (s: SlideRow): Slide => toBuilderSlide(mapSlide(s))

export const mapQuestion = (q: QuestionRow): Question => ({
  id: q.id, text: q.text, votes: q.votes, voterIds: q.voter_ids || [],
  status: q.status, authorId: q.author_id, answered: q.answered,
  createdAt: new Date(q.created_at).getTime(),
})

// Shared ordering for approved questions: unanswered first (by votes desc),
// answered pushed to the end — used by both the moderator's full list and
// the presenter's single-question spotlight, which must never disagree on order.
export const sortVisibleQuestions = (qnaList: Question[]): Question[] =>
  qnaList.filter(q => q.status === 'visible')
    .sort((a, b) => a.answered === b.answered ? b.votes - a.votes : a.answered ? 1 : -1)

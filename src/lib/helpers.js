// ─── helpers ────────────────────────────────────────────────────────────────
export const uid = (p = 's') => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
export const genCode = () => String(Math.floor(100000 + Math.random() * 900000))

export async function hashPin(pin) {
  const data = new TextEncoder().encode(pin + ':pulsemagis')
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function compressImage(file, maxPx = 220) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(maxPx / img.width, maxPx / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.78))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// ─── DB → JS mappers ────────────────────────────────────────────────────────
export const mapSlide = (s) => ({
  id: s.id, type: s.type, question: s.question,
  options: s.options || [], optionImages: s.option_images || [], position: s.position,
  layout: s.layout || 'right', contentImage: s.content_image || null, responseMode: s.response_mode || 'instant',
  content: s.content || null, verticalAlign: s.vertical_align || 'middle',
})
// Companion to mapSlide, used only when resuming a Pulse into the Builder's
// editable draft.slides shape (see createSlide in App.jsx). Unlike mapSlide,
// this pads/truncates optionImages to match options.length — startPresenting
// filters empty option strings before insert but does not correspondingly
// filter optionImages, so the two arrays can already be misaligned in the DB.
export const mapSlideForBuilder = (s) => {
  const base = {
    id: s.id, type: s.type, question: s.question,
    layout: s.layout || 'right', contentImage: s.content_image || null,
    responseMode: s.response_mode || 'instant',
    content: s.content || null, verticalAlign: s.vertical_align || 'middle',
  }
  if (s.type !== 'choice') return base
  const options = s.options && s.options.length ? s.options : ['', '']
  const rawImages = s.option_images || []
  const optionImages = options.map((_, i) => rawImages[i] ?? null)
  return { ...base, options, optionImages }
}

export const mapQuestion = (q) => ({
  id: q.id, text: q.text, votes: q.votes, voterIds: q.voter_ids || [],
  status: q.status, authorId: q.author_id, answered: q.answered,
  createdAt: new Date(q.created_at).getTime(),
})

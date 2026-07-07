import { useEffect, type ComponentType } from 'react'
import { BarChart3, Cloud, MessageSquare, MessageCircle, Type, Donut, PieChart, type LucideIcon } from 'lucide-react'
import { HoneycombIcon } from './components/ui/HoneycombIcon.tsx'
import type { SlideType, ResponseMode, ResultsFormat, VerticalAlign } from './types.ts'

// ─── design tokens ───────────────────────────────────────────────────────────
export const SLIDE_TYPES: { key: SlideType; label: string; icon: LucideIcon }[] = [
  { key: 'choice',    label: 'Multiple choice', icon: BarChart3 },
  { key: 'wordcloud', label: 'Word cloud',       icon: Cloud },
  { key: 'open',      label: 'Open ended',       icon: MessageSquare },
  { key: 'qa',        label: 'Q&A',              icon: MessageCircle },
  { key: 'plain',     label: 'Text',             icon: Type },
]

export const RESULTS_FORMATS: { key: ResultsFormat; label: string; icon: ComponentType<{ size?: number | string }> }[] = [
  { key: 'bar',   label: 'Bar chart',   icon: BarChart3 },
  { key: 'donut', label: 'Donut chart', icon: Donut },
  { key: 'pie',   label: 'Pie chart',   icon: PieChart },
  { key: 'dots',  label: 'Dot matrix',  icon: HoneycombIcon },
]

// justifyContent values for a slide's vertical-align setting (plain slides only)
export const VERTICAL_ALIGN_CSS: Record<VerticalAlign, string> = { top: 'flex-start', middle: 'center', bottom: 'flex-end' }

// Empty TipTap document, used as the initial/fallback content for new plain slides
export const EMPTY_RICH_DOC = { type: 'doc', content: [{ type: 'paragraph' }] }

export const RESPONSE_MODES: { key: ResponseMode; label: string; description: string }[] = [
  { key: 'instant', label: 'Instant',  description: 'Results update live as people respond.' },
  { key: 'onclick', label: 'On click', description: 'Results stay hidden until you click Reveal.' },
  { key: 'private', label: 'Private',  description: 'Only a response count is shown — results stay hidden.' },
]

// Vibrant bars that pop on a light background
export const PALETTE_BARS = ['#FF6B35', '#6366F1', '#10B981', '#F59E0B', '#EC4899', '#0EA5E9']

export const FONT_DISPLAY = "'Inter', ui-sans-serif, system-ui, sans-serif"
export const FONT_BODY    = "'Inter', ui-sans-serif, system-ui, sans-serif"

// Light theme colour palette
export const C = {
  pageBg:      '#F1F2F4',
  surface:     '#FFFFFF',
  surfaceAlt:  '#F8F4FF',
  surfaceHov:  '#F2ECFE',
  border:      'rgba(110,60,200,0.14)',
  borderLight: 'rgba(110,60,200,0.09)',
  borderStrong:'rgba(110,60,200,0.28)',
  inputBg:     'rgba(110,60,200,0.05)',
  inputBgDark: 'rgba(110,60,200,0.09)',
  selectBg:    '#EDE6FF',
  txt1:        '#1A0B3C',   // primary text
  txt2:        '#4A3A6A',   // secondary text
  txt3:        '#7A6A9A',   // muted text
  txt4:        '#A090C0',   // very muted
  txtDis:      '#C8BAE0',   // disabled
  amber:       '#FF8C00',
  amberBg:     'rgba(255,140,0,0.10)',
  amberBorder: 'rgba(255,140,0,0.35)',
  teal:        '#059669',
  tealBg:      'rgba(5,150,105,0.10)',
  tealBorder:  'rgba(5,150,105,0.35)',
  red:         '#E11D48',
  redBg:       'rgba(225,29,72,0.10)',
  purple:      '#5769E7',
  purpleBg:    'rgba(87,105,231,0.10)',
  disabledBtn: 'rgba(110,60,200,0.08)',
  shadow:      '0 2px 16px rgba(110,60,200,0.10)',
  shadowHov:   '0 4px 24px rgba(110,60,200,0.16)',
  stickyFade:  'linear-gradient(to top,#EDE8FF 60%,transparent)',
}

// ─── font loader ─────────────────────────────────────────────────────────────
export function useFonts() {
  useEffect(() => {
    if (document.getElementById('pm-fonts')) return
    const link = document.createElement('link')
    link.id = 'pm-fonts'; link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
    document.head.appendChild(link)
  }, [])
}

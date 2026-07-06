#!/usr/bin/env node
// Seeds random test responses into an existing Pulse, so chart formats
// (bar/donut/pie/dots, word cloud, open-ended) can be previewed with real
// data without manually voting through the audience UI many times over.
//
// Usage:
//   node scripts/seed-responses.mjs <pulse-code> [responses-per-slide]
//
// <pulse-code> is the 6-digit join code shown on the presenter's screen /
// join panel. Responses are inserted for every choice/wordcloud/open slide
// in that Pulse (qa slides are skipped — those live in a separate table).

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

function loadDotEnv() {
  let raw
  try {
    raw = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  } catch {
    return // no .env file — fall back to whatever's already in process.env
  }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!(key in process.env)) process.env[key] = value
  }
}

const WORDS = ['great', 'awesome', 'helpful', 'confusing', 'fun', 'clear', 'slow', 'fast', 'love it', 'needs work', 'excellent', 'okay']
const SENTENCES = [
  'This was really helpful, thanks!',
  'Could use more examples.',
  'Loved the pacing of this session.',
  'A bit confusing in the middle.',
  'Great job overall!',
  'Would like a follow-up on this topic.',
]
const pick = list => list[Math.floor(Math.random() * list.length)]

// Wrapped in an async main() that returns normally (setting process.exitCode
// instead of calling process.exit()) — supabase-js keeps an internal network
// handle open, and forcing an abrupt process.exit() while it's still around
// crashes with a libuv assertion on Windows. Letting main() return and the
// event loop drain naturally avoids that.
async function main() {
  loadDotEnv()

  const [, , code, countArg] = process.argv
  if (!code) {
    console.error('Usage: node scripts/seed-responses.mjs <pulse-code> [responses-per-slide=20]')
    process.exitCode = 1
    return
  }
  const countPerSlide = Number(countArg) || 20

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — checked .env and the current environment.')
    process.exitCode = 1
    return
  }
  const supabase = createClient(supabaseUrl, supabaseKey)

  const {data: slides, error: slidesError} = await supabase
    .from('slides').select('id,type,options').eq('session_code', code)
  if (slidesError) { console.error(slidesError.message); process.exitCode = 1; return }
  if (!slides || !slides.length) { console.error(`No slides found for Pulse code "${code}".`); process.exitCode = 1; return }

  // Clean up any responses from previous seed runs so re-seeding doesn't pile up on top of stale data.
  const {error: cleanupError, count} = await supabase
    .from('responses').delete({count: 'exact'}).eq('session_code', code)
  if (cleanupError) { console.error(cleanupError.message); process.exitCode = 1; return }
  console.log(`Cleaned up ${count ?? 0} existing responses for Pulse ${code}.`)

  let totalInserted = 0
  for (const slide of slides) {
    let rows
    if (slide.type === 'choice') {
      const numOptions = (slide.options || []).length
      if (!numOptions) { console.log(`Skipping choice slide ${slide.id} — no options.`); continue }
      rows = Array.from({length: countPerSlide}, () => ({
        session_code: code, slide_id: slide.id, value: Math.floor(Math.random() * numOptions),
      }))
    } else if (slide.type === 'wordcloud') {
      rows = Array.from({length: countPerSlide}, () => ({session_code: code, slide_id: slide.id, value: pick(WORDS)}))
    } else if (slide.type === 'open') {
      rows = Array.from({length: countPerSlide}, () => ({session_code: code, slide_id: slide.id, value: pick(SENTENCES)}))
    } else {
      continue // qa slides use the separate `questions` table, not `responses`
    }

    const {error: insertError} = await supabase.from('responses').insert(rows)
    if (insertError) { console.error(`Slide ${slide.id} (${slide.type}): ${insertError.message}`); continue }
    totalInserted += rows.length
    console.log(`Inserted ${rows.length} responses for ${slide.type} slide ${slide.id}`)
  }
  console.log(`Done — ${totalInserted} total responses inserted for Pulse ${code}.`)
}

await main()

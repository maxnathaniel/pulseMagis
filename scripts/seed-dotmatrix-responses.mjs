#!/usr/bin/env node
// Seeds random test responses into a dot-matrix choice slide (a choice slide
// with results_format = 'dots' and exactly 2 options), so the dot matrix
// results chart can be previewed with real data without manually voting
// through the audience UI many times over.
//
// Usage:
//   node scripts/seed-dotmatrix-responses.mjs <pulse-code> [total-responses] [--slide=<number|id>]
//
// <pulse-code> is the 6-digit join code shown on the presenter's screen /
// join panel. [total-responses] is the total number of responses to insert
// across the slide's 2 options (default 100), split randomly between them.
// If the Pulse has more than one dot-matrix slide, pass --slide=<n> (its
// 1-based number from the printed list) or --slide=<id> to pick which one
// to seed — otherwise the script lists them and exits without writing.

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

// Wrapped in an async main() that returns normally (setting process.exitCode
// instead of calling process.exit()) — supabase-js keeps an internal network
// handle open, and forcing an abrupt process.exit() while it's still around
// crashes with a libuv assertion on Windows. Letting main() return and the
// event loop drain naturally avoids that.
async function main() {
  loadDotEnv()

  const args = process.argv.slice(2)
  const code = args[0]
  if (!code) {
    console.error('Usage: node scripts/seed-dotmatrix-responses.mjs <pulse-code> [total-responses=100] [--slide=<number|id>]')
    process.exitCode = 1
    return
  }
  const slideFlag = args.find(a => a.startsWith('--slide='))
  const slideSelector = slideFlag ? slideFlag.slice('--slide='.length) : undefined
  const totalArg = args.slice(1).find(a => !a.startsWith('--'))
  const total = Number(totalArg) || 100

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — checked .env and the current environment.')
    process.exitCode = 1
    return
  }
  const supabase = createClient(supabaseUrl, supabaseKey)

  const {data: slides, error: slidesError} = await supabase
    .from('slides').select('id,type,options,results_format,question,position').eq('session_code', code)
  if (slidesError) { console.error(slidesError.message); process.exitCode = 1; return }
  if (!slides || !slides.length) { console.error(`No slides found for Pulse code "${code}".`); process.exitCode = 1; return }

  const eligible = slides
    .filter(s => s.type === 'choice' && s.results_format === 'dots' && (s.options || []).length === 2)
    .sort((a, b) => a.position - b.position)
  if (!eligible.length) {
    console.error(`No dot-matrix choice slides with 2 options (type "choice", results format "dots") found for Pulse code "${code}".`)
    process.exitCode = 1
    return
  }

  let slide
  if (eligible.length === 1) {
    slide = eligible[0]
  } else if (!slideSelector) {
    console.error(`Pulse ${code} has ${eligible.length} dot-matrix slides — pick one with --slide=<number|id>:`)
    eligible.forEach((s, i) => console.error(`  ${i + 1}. ${s.id}  "${s.question}"`))
    process.exitCode = 1
    return
  } else {
    const asIndex = Number(slideSelector)
    slide = Number.isInteger(asIndex) && asIndex >= 1 && asIndex <= eligible.length
      ? eligible[asIndex - 1]
      : eligible.find(s => s.id === slideSelector)
    if (!slide) {
      console.error(`--slide=${slideSelector} doesn't match any dot-matrix slide. Options:`)
      eligible.forEach((s, i) => console.error(`  ${i + 1}. ${s.id}  "${s.question}"`))
      process.exitCode = 1
      return
    }
  }

  // Clean up any responses from previous seed runs so re-seeding doesn't pile up on top of stale data.
  const {error: cleanupError, count} = await supabase
    .from('responses').delete({count: 'exact'}).eq('slide_id', slide.id)
  if (cleanupError) { console.error(cleanupError.message); process.exitCode = 1; return }
  console.log(`Cleaned up ${count ?? 0} existing responses for dot-matrix slide ${slide.id}.`)

  const rows = Array.from({length: total}, () => ({
    session_code: code, slide_id: slide.id, value: Math.floor(Math.random() * 2),
  }))

  const {error: insertError} = await supabase.from('responses').insert(rows)
  if (insertError) { console.error(`Slide ${slide.id}: ${insertError.message}`); process.exitCode = 1; return }
  console.log(`Inserted ${rows.length} responses for dot-matrix slide ${slide.id} ("${slide.question}")`)
}

await main()

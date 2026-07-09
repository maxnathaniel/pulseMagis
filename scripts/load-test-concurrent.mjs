#!/usr/bin/env node
// Load-tests the audience join+vote path against the live Supabase project:
// spins up N concurrent "participants", each opening a presence channel
// (mirrors the real join flow's `presence-{code}` tracking) and inserting
// one response (mirrors the real vote flow's `responses` insert), then
// reports latency/success stats. Runs against a disposable session created
// and torn down by this script — no real Pulse is touched.
//
// Usage:
//   node scripts/load-test-concurrent.mjs [concurrency=100]

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

const genCode = () => String(Math.floor(100000 + Math.random() * 900000))
const uid = (p = 's') => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

function stats(samples) {
  const ok = samples.filter(s => s.ok)
  const failed = samples.length - ok.length
  if (!ok.length) return { ok: 0, failed, min: null, avg: null, p95: null, max: null }
  const ms = ok.map(s => s.ms).sort((a, b) => a - b)
  const sum = ms.reduce((a, b) => a + b, 0)
  const p95 = ms[Math.min(ms.length - 1, Math.ceil(ms.length * 0.95) - 1)]
  return { ok: ok.length, failed, min: ms[0], avg: Math.round(sum / ms.length), p95, max: ms[ms.length - 1] }
}

function fmt(s) {
  if (!s.ok) return `${s.ok} ok, ${s.failed} failed — no successful samples`
  return `${s.ok} ok, ${s.failed} failed — min ${s.min}ms, avg ${s.avg}ms, p95 ${s.p95}ms, max ${s.max}ms`
}

// Wrapped in an async main() that returns normally (setting process.exitCode
// instead of calling process.exit()) — supabase-js keeps an internal network
// handle open, and forcing an abrupt process.exit() while it's still around
// crashes with a libuv assertion on Windows. Letting main() return and the
// event loop drain naturally avoids that.
async function main() {
  loadDotEnv()

  const concurrency = Number(process.argv[2]) || 100

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — checked .env and the current environment.')
    process.exitCode = 1
    return
  }
  const supabase = createClient(supabaseUrl, supabaseKey)

  const code = genCode()
  const slideId = uid('slide')

  console.log(`Creating disposable session ${code}…`)
  const { error: sessError } = await supabase.from('sessions').insert({
    code, title: 'Load test (disposable)', owner_id: null, current_slide_index: 0,
    qna_enabled: false, qna_moderation: false, pin_hash: null, is_live: true, has_presented: true,
  })
  if (sessError) { console.error('Failed to create session:', sessError.message); process.exitCode = 1; return }

  const { error: slideError } = await supabase.from('slides').insert({
    id: slideId, session_code: code, type: 'choice', question: 'Load test slide', options: ['A', 'B', 'C', 'D'],
  })
  if (slideError) {
    console.error('Failed to create slide:', slideError.message)
    await supabase.from('sessions').delete().eq('code', code)
    process.exitCode = 1
    return
  }

  console.log(`Firing ${concurrency} concurrent participants (presence join + vote)…`)
  // Each participant gets its own Supabase client — a real browser tab has
  // its own realtime socket, and channels sharing one client multiplex over
  // a single underlying WebSocket, which both undercounts "connections" and
  // causes topic collisions when every participant joins the same
  // `presence-{code}` topic. A dedicated client per participant is what
  // actually exercises N concurrent connections.
  const participantClients = []
  const runParticipant = async (i) => {
    const participantId = uid('p') + '_' + i
    const client = createClient(supabaseUrl, supabaseKey)
    participantClients.push(client)
    const ch = client.channel(`presence-${code}`, { config: { presence: { key: participantId } } })

    const presenceStart = Date.now()
    const presenceJoin = new Promise(resolve => {
      ch.subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          try {
            await ch.track({ joinedAt: Date.now() })
            resolve({ ok: true, ms: Date.now() - presenceStart })
          } catch (e) {
            resolve({ ok: false, ms: Date.now() - presenceStart, error: e?.message })
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          resolve({ ok: false, ms: Date.now() - presenceStart, error: status })
        }
      })
    })
    // The realtime client can stall silently (e.g. a WebSocket upgrade that
    // never completes) without ever invoking the status callback again, so a
    // hard timeout is needed — otherwise one stuck connection hangs the
    // entire Promise.all batch forever.
    const presenceTimeout = new Promise(resolve =>
      setTimeout(() => resolve({ ok: false, ms: Date.now() - presenceStart, error: 'timed out after 15s' }), 15000))
    const presenceResult = await Promise.race([presenceJoin, presenceTimeout])

    const insertStart = Date.now()
    const { error: insertError } = await client.from('responses').insert({
      session_code: code, slide_id: slideId, value: Math.floor(Math.random() * 4), participant_id: participantId,
    })
    const insertResult = { ok: !insertError, ms: Date.now() - insertStart, error: insertError?.message }

    return { participantId, presenceResult, insertResult }
  }

  const wallStart = Date.now()
  const results = await Promise.all(Array.from({ length: concurrency }, (_, i) => runParticipant(i)))
  const wallMs = Date.now() - wallStart

  await Promise.all(participantClients.map(c => c.removeAllChannels()))

  const presenceStats = stats(results.map(r => r.presenceResult))
  const insertStats = stats(results.map(r => r.insertResult))

  console.log('')
  console.log(`── Results (${concurrency} concurrent participants, ${wallMs}ms wall clock) ──`)
  console.log(`Presence join : ${fmt(presenceStats)}`)
  console.log(`Vote insert   : ${fmt(insertStats)}`)

  const failures = results.filter(r => !r.presenceResult.ok || !r.insertResult.ok)
  if (failures.length) {
    console.log('')
    console.log(`${failures.length} participant(s) had a failure:`)
    for (const f of failures.slice(0, 10)) {
      if (!f.presenceResult.ok) console.log(`  ${f.participantId}: presence join failed — ${f.presenceResult.error}`)
      if (!f.insertResult.ok) console.log(`  ${f.participantId}: vote insert failed — ${f.insertResult.error}`)
    }
    if (failures.length > 10) console.log(`  …and ${failures.length - 10} more`)
  }

  console.log('')
  console.log(`Cleaning up disposable session ${code}…`)
  const { error: cleanupError } = await supabase.from('sessions').delete().eq('code', code)
  if (cleanupError) console.error('Cleanup failed — you may need to manually delete session', code, ':', cleanupError.message)
  else console.log(`Done — session ${code} and its slide/responses were deleted.`)
}

await main()

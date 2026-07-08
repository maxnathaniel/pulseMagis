#!/usr/bin/env node
// Adds an email to the signup allow-list (see allowed_emails in schema.sql).
//
// Usage:
//   node scripts/add-allowed-email.mjs someone@example.com
//
// Requires SUPABASE_SERVICE_ROLE_KEY in .env (Supabase Dashboard → Project
// Settings → API Keys → Secret keys). Never expose this key client-side or
// commit it — it bypasses Row Level Security entirely.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

function loadDotEnv() {
  let raw
  try {
    raw = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  } catch {
    return
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

loadDotEnv()

const email = process.argv[2]
if (!email) {
  console.error('Usage: node scripts/add-allowed-email.mjs <email>')
  process.exit(1)
}

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { error } = await supabase
  .from('allowed_emails')
  .upsert({ email: email.toLowerCase() }, { onConflict: 'email' })

if (error) {
  console.error('Failed to add email:', error.message)
  process.exit(1)
}

console.log(`Added ${email.toLowerCase()} to the allow-list.`)

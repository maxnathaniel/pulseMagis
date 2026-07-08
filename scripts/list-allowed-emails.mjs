#!/usr/bin/env node
// Lists the emails on the signup allow-list (see allowed_emails in schema.sql).
// That table has RLS enabled with zero policies, so it's only readable with
// the Supabase service_role key (which bypasses RLS) — the anon key used
// elsewhere in this project cannot read it.
//
// Usage:
//   node scripts/list-allowed-emails.mjs
//
// Requires SUPABASE_SERVICE_ROLE_KEY in .env (Supabase Dashboard → Project
// Settings → API → service_role secret). Never expose this key client-side
// or commit it — it bypasses Row Level Security entirely.

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

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  console.error('Add SUPABASE_SERVICE_ROLE_KEY from Supabase Dashboard -> Project Settings -> API (service_role secret).')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data, error } = await supabase
  .from('allowed_emails')
  .select('email, created_at')
  .order('created_at', { ascending: true })

if (error) {
  console.error('Failed to read allowed_emails:', error.message)
  process.exit(1)
}

if (!data.length) {
  console.log('No emails on the allow-list.')
} else {
  console.log(`${data.length} email(s) on the allow-list:\n`)
  for (const row of data) {
    console.log(`  ${row.email}  (added ${row.created_at})`)
  }
}

# PulseMagis
**Heartbeat of the community — live polling, Q&A and candidate voting for the Church of St. Ignatius.**

Built with React + Vite + Supabase. Deploy in ~15 minutes, completely free.

---

## Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Database + Realtime | Supabase (PostgreSQL + WebSockets) |
| Hosting | Any static host |

---

## Prerequisites
- [Node.js 18+](https://nodejs.org/)
- A free [Supabase](https://supabase.com) account
- A static host of your choice (Vercel, Cloudflare Pages, GitHub Pages, etc.)

---

## 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name (e.g. `pulsemagis`), set a database password, pick the closest region
3. Wait ~2 minutes for the project to spin up

---

## 2 — Run the database schema

1. In your Supabase project, go to **SQL Editor** → **New query**
2. Paste the entire contents of `schema.sql`
3. Click **Run**

This creates 4 tables (`sessions`, `slides`, `responses`, `questions`), sets up Row Level Security, enables Realtime, and creates the atomic vote function.

---

## 3 — Get your API keys

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** → this is your `VITE_SUPABASE_URL`
   - **anon / public key** → this is your `VITE_SUPABASE_ANON_KEY`

---

## 4 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the two values:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 5 — Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — the app is running.

To test the full flow, open two browser windows:
- Window 1 → **New Pulse** → build slides → **Present** (note the 4-digit code)
- Window 2 → **Join a Pulse** → enter the code → vote and ask questions

---

## 6 — Deploy

```bash
npm run build
```

This produces a static `dist/` folder. Upload it to any static host (Vercel, Cloudflare Pages, GitHub Pages, S3, etc.), making sure to set the two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in that host's build/environment settings before deploying.

---

## How to run a session

1. **Presenter** opens the app → **New Pulse** → builds slides → optionally sets a Co-moderator PIN → clicks **Present**
2. A 4-digit join code appears — display it on screen or share it
3. **Audience** opens the app on their phones → **Join a Pulse** → enters the code → votes and asks questions
4. **Co-moderators** (if PIN was set) join as audience → tap the **Moderate** tab → enter the PIN → approve/reject questions
5. Presenter navigates slides with the ← → arrows; results update in real-time for everyone

---

## Features
- Multiple choice, word cloud, and open-ended slides
- Candidate voting with headshot photo upload
- Live results (WebSocket push, no polling lag)
- Q&A with upvoting
- Question moderation (approve / reject before public)
- Co-moderator PIN authentication (SHA-256 hashed)
- Auto-authenticated presenter (no PIN needed on the presenter device)

---

## Support
60 simultaneous users is well within Supabase's free tier (200 concurrent realtime connections).
The free tier pauses after 1 week of inactivity — for a one-off event this is fine.

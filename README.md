# PulseMagis
**Heartbeat of the community — live polling, Q&A and candidate voting for the Church of St. Ignatius.**

Built with React + Vite + Supabase. Presenters sign in with Google (email allow-listed); audiences join anonymously with a 6-digit code.

---

## Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Database + Realtime + Auth | Supabase (PostgreSQL + WebSockets + Auth) |
| Hosting | Docker container behind Caddy (see [DEPLOY.md](DEPLOY.md)), or any static host |

---

## Prerequisites
- [Node.js 18+](https://nodejs.org/)
- A free [Supabase](https://supabase.com) account
- Docker Desktop (for the production deploy path, see [DEPLOY.md](DEPLOY.md)) — or a static host of your choice (Vercel, Cloudflare Pages, GitHub Pages, etc.) if deploying the built `dist/` folder yourself

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

This creates the `sessions`, `slides`, `responses`, and `questions` tables, sets up Row Level Security, enables Realtime, and creates the atomic vote function.

It also creates an `allowed_emails` table and a `check_email_allowlist` function that restricts signup to specific email addresses (edit the `INSERT INTO allowed_emails` list near the bottom of `schema.sql` before running). After running the schema, wire the function up manually: **Authentication → Hooks → "Before User Created"** in the Supabase dashboard, and select `check_email_allowlist`. Without this step, anyone with a Google account can sign up. This hook applies no matter which sign-in provider is used.

---

## 3 — Set up Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com/), create an **OAuth 2.0 Client ID** (Web application). Set the Authorized redirect URI to `https://<your-project-ref>.supabase.co/auth/v1/callback` (find your project ref in the Supabase Project URL).
2. In the Supabase dashboard, go to **Authentication → Providers → Google**, enable it, and paste in the Client ID and Client Secret from step 1.
3. In **Authentication → URL Configuration**, make sure the Site URL / Redirect URLs list includes `http://localhost:5173` (for local dev) and your production domain.

---

## 4 — Get your API keys

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** → this is your `VITE_SUPABASE_URL`
   - **anon / public key** → this is your `VITE_SUPABASE_ANON_KEY`

---

## 5 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase values:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

`DEPLOY_SERVER` (also in `.env`) is only used by `deploy.ps1` for the Docker deploy path below — not needed for local dev.

---

## 6 — Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — click **Sign in with Google** (with a Google account on the allow-list) to reach the Home screen.

To test the full flow, open two browser windows:
- Window 1 (signed in) → **New Pulse** → build slides → **Present** (note the 6-digit code)
- Window 2 → **Join a Pulse** → enter the code → vote and ask questions (no login needed)

---

## 7 — Deploy

The production deployment is a Docker container (`./deploy.ps1`) shipped to a Linode server that shares an existing host-level Caddy instance — see [DEPLOY.md](DEPLOY.md) for the full one-time setup and redeploy steps.

If you'd rather host it yourself on a static host instead:

```bash
npm run build
```

This produces a static `dist/` folder. Upload it to any static host (Vercel, Cloudflare Pages, GitHub Pages, S3, etc.), making sure to set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in that host's build/environment settings before deploying (Vite inlines them at build time, so they must be present at build, not just at runtime).

---

## How to run a session

1. **Presenter** signs in → **New Pulse** → builds slides (choice, word cloud, open-ended, Q&A, or plain rich-text) → optionally sets a Co-moderator PIN → clicks **Present**
2. A 6-digit join code appears — display it on screen or share it
3. **Audience** opens the app on their phones → **Join a Pulse** → enters the code → votes and asks questions (no account needed)
4. **Co-moderators** (if PIN was set) join as audience → tap the **Moderate** tab → enter the PIN → approve/reject questions
5. Presenter navigates slides with the ← → arrows; results update in real-time for everyone
6. Presenter can end the presentation (audience joining afterward sees "this Pulse has ended" rather than "hasn't started yet")

---

## Features
- Presenter accounts (Supabase Auth, Google OAuth) with signup restricted to an allow-list; each presenter only sees their own Pulses
- Slide types: multiple choice, word cloud, open-ended, Q&A, and plain rich-text (with per-slide layout, content image, and vertical alignment)
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

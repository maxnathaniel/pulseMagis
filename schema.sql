-- ============================================================
-- PulseMagis — Supabase Schema
-- Run this in your Supabase project: SQL Editor → New query → Run
--
-- NOTE: if you already ran an earlier version of this file against a live
-- project, `CREATE TABLE IF NOT EXISTS` below is a no-op on the existing
-- `slides` table and will NOT pick up the 'qa' slide type. Run this once,
-- manually, in the Supabase SQL editor (replace the constraint name if
-- yours differs — check via the table editor's constraints tab or `\d slides`):
--
--   ALTER TABLE slides DROP CONSTRAINT slides_type_check;
--   ALTER TABLE slides ADD CONSTRAINT slides_type_check
--     CHECK (type IN ('choice','wordcloud','open','qa'));
--
-- Without this, presenting a deck containing a Q&A slide will fail with a
-- CHECK constraint violation.
--
-- Additionally, if your live `slides` table predates the "Edit panel" feature
-- (per-slide layout / content image / response mode), it will be missing
-- these columns. Run this once, manually, in the Supabase SQL editor:
--
--   ALTER TABLE slides ADD COLUMN IF NOT EXISTS layout TEXT NOT NULL DEFAULT 'right'
--     CHECK (layout IN ('left','right'));
--   ALTER TABLE slides ADD COLUMN IF NOT EXISTS content_image TEXT;
--   ALTER TABLE slides ADD COLUMN IF NOT EXISTS response_mode TEXT NOT NULL DEFAULT 'instant'
--     CHECK (response_mode IN ('instant','onclick','private'));
--
-- Without this, presenting a deck will fail on the slides insert (unknown
-- columns) once the app starts sending layout/content_image/response_mode.
--
-- Similarly, if your live `slides` table predates the choice-slide "Results
-- format" picker, add the column manually:
--
--   ALTER TABLE slides ADD COLUMN IF NOT EXISTS results_format TEXT NOT NULL DEFAULT 'bar'
--     CHECK (results_format IN ('bar','donut','pie','dots'));
--   NOTIFY pgrst, 'reload schema';
--
-- The NOTIFY is required — without it, PostgREST's cached schema doesn't
-- know about the new column yet, and every slides insert/upsert that
-- includes it (i.e. all of them, from now on) fails outright with a
-- PGRST204 "column not found in schema cache" error, silently rejecting
-- the WHOLE write as one unit. Concretely: since startPresenting deletes a
-- Pulse's existing slides before reinserting the new set, hitting this on
-- an already-presented Pulse deletes all its slides and then fails to put
-- any back — same failure mode already documented above for
-- is_live/has_presented/plain-slide-type, repeated here because this one
-- shipped without the NOTIFY the first time and cost a real user's slides.
--
-- Additionally, if your live `sessions` table predates login, it will be
-- missing the owner_id column used to scope Pulses to their creator. Run
-- this once, manually, in the Supabase SQL editor:
--
--   ALTER TABLE sessions ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
--   CREATE INDEX IF NOT EXISTS idx_sessions_owner ON sessions(owner_id);
--
-- Without this, startPresenting's insert (which now sends owner_id) will
-- fail, and any pre-login sessions rows will have owner_id NULL — see the
-- RLS policy note below for what that means.
--
-- Additionally, if your live `sessions` table predates the "end
-- presentation" live-status feature, it will be missing the is_live
-- column. Run this once, manually, in the Supabase SQL editor:
--
--   ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_live BOOLEAN NOT NULL DEFAULT false;
--   NOTIFY pgrst, 'reload schema';
--
-- Without this, every sessions update that includes is_live (starting a
-- presentation, ending one) fails outright with a PGRST204 "column not
-- found in schema cache" error — silently, since the whole update is
-- rejected as one unit, so current_slide_index/qna_enabled/etc. in that
-- same call don't get applied either even though they're valid columns.
-- The NOTIFY is required too — PostgREST caches the schema and won't pick
-- up a newly added column until it's told to reload (or the API restarts).
--
-- Additionally, if your live `sessions` table predates the "not started
-- yet" vs "ended" distinction for audience joins, it will be missing the
-- has_presented column. Run this once, manually, in the Supabase SQL editor:
--
--   ALTER TABLE sessions ADD COLUMN IF NOT EXISTS has_presented BOOLEAN NOT NULL DEFAULT false;
--   NOTIFY pgrst, 'reload schema';
--
-- Without this, someone joining a Pulse via a shared link/QR code before
-- it's ever been presented sees "This Pulse has ended" instead of "hasn't
-- started yet" — both states otherwise look identical (is_live: false)
-- with no way to tell them apart.
--
-- Additionally, if your live `slides` table predates the "plain" (rich-text
-- content) slide type, its type CHECK constraint will reject inserts of
-- that type, and it will be missing the content/vertical_align columns.
-- Run this once, manually, in the Supabase SQL editor:
--
--   ALTER TABLE slides DROP CONSTRAINT slides_type_check;
--   ALTER TABLE slides ADD CONSTRAINT slides_type_check
--     CHECK (type IN ('choice','wordcloud','open','qa','plain'));
--   ALTER TABLE slides ADD COLUMN IF NOT EXISTS content JSONB;
--   ALTER TABLE slides ADD COLUMN IF NOT EXISTS vertical_align TEXT NOT NULL DEFAULT 'middle'
--     CHECK (vertical_align IN ('top','middle','bottom'));
--   NOTIFY pgrst, 'reload schema';
--
-- Without this, presenting a deck containing a plain slide will fail with a
-- CHECK constraint violation, and even after fixing the constraint, every
-- slides insert/upsert that includes the new columns will fail outright
-- with a PGRST204 "column not found in schema cache" error until the
-- NOTIFY runs — silently rejecting the WHOLE multi-column write as one
-- unit, same failure mode already documented above for is_live/has_presented.
-- ============================================================

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  code              TEXT PRIMARY KEY,
  title             TEXT NOT NULL DEFAULT 'Untitled',
  owner_id          UUID REFERENCES auth.users(id),
  current_slide_index INTEGER NOT NULL DEFAULT 0,
  qna_enabled       BOOLEAN NOT NULL DEFAULT true,
  qna_moderation    BOOLEAN NOT NULL DEFAULT true,
  pin_hash          TEXT,
  is_live           BOOLEAN NOT NULL DEFAULT false,
  has_presented     BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_owner ON sessions(owner_id);

-- Slides
CREATE TABLE IF NOT EXISTS slides (
  id            TEXT PRIMARY KEY,
  session_code  TEXT NOT NULL REFERENCES sessions(code) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('choice', 'wordcloud', 'open', 'qa', 'plain')),
  question      TEXT NOT NULL DEFAULT '',
  options       JSONB,          -- array of strings (choice slides only)
  option_images JSONB,          -- array of base64 strings or nulls
  layout        TEXT NOT NULL DEFAULT 'right' CHECK (layout IN ('left','right')),
  content_image TEXT,           -- base64 data URL or null
  response_mode TEXT NOT NULL DEFAULT 'instant' CHECK (response_mode IN ('instant','onclick','private')),
  content       JSONB,          -- TipTap rich-text document (plain slides only; null otherwise)
  vertical_align TEXT NOT NULL DEFAULT 'middle' CHECK (vertical_align IN ('top','middle','bottom')),
  results_format TEXT NOT NULL DEFAULT 'bar' CHECK (results_format IN ('bar','donut','pie','dots')),
  position      INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Responses (one row per audience submission)
CREATE TABLE IF NOT EXISTS responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code  TEXT NOT NULL REFERENCES sessions(code) ON DELETE CASCADE,
  slide_id      TEXT NOT NULL REFERENCES slides(id) ON DELETE CASCADE,
  value         JSONB NOT NULL, -- integer (choice index) or string (text)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Q&A Questions
CREATE TABLE IF NOT EXISTS questions (
  id            TEXT PRIMARY KEY,
  session_code  TEXT NOT NULL REFERENCES sessions(code) ON DELETE CASCADE,
  text          TEXT NOT NULL,
  votes         INTEGER NOT NULL DEFAULT 0,
  voter_ids     JSONB NOT NULL DEFAULT '[]'::jsonb,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'visible')),
  author_id     TEXT NOT NULL,
  answered      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure DELETE events carry the full old row (needed for the
-- session_code=eq.X realtime filter to match on reject/delete)
ALTER TABLE questions REPLICA IDENTITY FULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_slides_session      ON slides(session_code);
CREATE INDEX IF NOT EXISTS idx_responses_slide     ON responses(slide_id);
CREATE INDEX IF NOT EXISTS idx_responses_session   ON responses(session_code);
CREATE INDEX IF NOT EXISTS idx_questions_session   ON questions(session_code);

-- ============================================================
-- Row Level Security
--
-- sessions/slides: split into an owner policy (authenticated, scoped to
-- owner_id — used by the Home tile list, Builder resume, and presenting)
-- and a public policy (anon, unscoped by owner — used by the audience-
-- facing Join/Vote flows, which must stay fully anonymous). `TO anon` and
-- `TO authenticated` policies are independent in Postgres RLS, so both are
-- required for the respective callers to be covered at all.
--
-- responses/questions: left as a single public/anon policy, unchanged —
-- nothing reads/writes these through an owner-scoped path. Presenter-side
-- moderation (goToSlide/toggleModeration/moderateQuestion) intentionally
-- keeps using the anon policy too, since isModerator is a client-side-only
-- flag with no relation to Supabase Auth, and the audience Vote screen's
-- separate PIN-based moderator flow is never logged in at all.
-- ============================================================
ALTER TABLE sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides    ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_access" ON sessions;
DROP POLICY IF EXISTS "public_access" ON slides;
DROP POLICY IF EXISTS "public_access" ON responses;
DROP POLICY IF EXISTS "public_access" ON questions;
DROP POLICY IF EXISTS "owner_access" ON sessions;
DROP POLICY IF EXISTS "owner_access" ON slides;
DROP POLICY IF EXISTS "owner_access" ON responses;
DROP POLICY IF EXISTS "owner_access" ON questions;

CREATE POLICY "owner_access"  ON sessions FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "public_access" ON sessions FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "owner_access"  ON slides FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.code = slides.session_code AND sessions.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM sessions WHERE sessions.code = slides.session_code AND sessions.owner_id = auth.uid()));
CREATE POLICY "public_access" ON slides FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- responses: owner-facing read/reset access for the Builder's Results tab
-- (the presenter's client sends requests as `authenticated`, which the
-- anon-only public_access policy below does not cover at all). FOR ALL
-- (not just SELECT) so the owner can also clear responses via "Reset results".
CREATE POLICY "owner_access" ON responses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.code = responses.session_code AND sessions.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM sessions WHERE sessions.code = responses.session_code AND sessions.owner_id = auth.uid()));
CREATE POLICY "public_access" ON responses FOR ALL TO anon USING (true) WITH CHECK (true);

-- questions: owner-facing access for the Presenter's Q&A moderation panel
-- (approve/reject/delete/mark-answered, plus just reading the list) — same
-- gap as responses above: the presenter's client is `authenticated`, and
-- the anon-only public_access policy below never covered that role at all.
CREATE POLICY "owner_access" ON questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.code = questions.session_code AND sessions.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM sessions WHERE sessions.code = questions.session_code AND sessions.owner_id = auth.uid()));
CREATE POLICY "public_access" ON questions FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- Realtime — enable change events for these tables
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='sessions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='responses') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE responses;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='questions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE questions;
  END IF;
END $$;

-- ============================================================
-- Atomic vote function (prevents double-vote race conditions)
-- ============================================================
CREATE OR REPLACE FUNCTION vote_for_question(q_id TEXT, voter TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE questions
  SET
    votes     = votes + 1,
    voter_ids = voter_ids || jsonb_build_array(voter)
  WHERE id = q_id
    AND NOT (voter_ids @> jsonb_build_array(voter));
END;
$$;

GRANT EXECUTE ON FUNCTION vote_for_question TO anon;

-- ============================================================
-- Signup allow-list — restrict account creation to specific emails
-- ============================================================
CREATE TABLE IF NOT EXISTS allowed_emails (
  email      TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;
-- Zero policies denies all access from anon/authenticated clients.
-- supabase_auth_admin also needs an explicit policy below — the
-- GRANT SELECT further down is not sufficient on its own, since RLS
-- still applies to any role without BYPASSRLS or table ownership.
-- Manage entries directly via the Supabase SQL editor.
CREATE POLICY "Allow auth admin to read allowed emails"
ON allowed_emails
AS PERMISSIVE FOR SELECT
TO supabase_auth_admin
USING (true);

INSERT INTO allowed_emails (email) VALUES
  ('amandathianwl@gmail.com'),
  ('maxhowl86@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- "Before User Created" Auth Hook: rejects signup unless the email is
-- present in allowed_emails. Must be wired up manually in the Supabase
-- Dashboard: Authentication → Hooks → enable "Before User Created" →
-- select this function.
--
-- Not SECURITY DEFINER: Supabase's dashboard hook picker only lists
-- SECURITY INVOKER functions (their docs recommend explicit grants to
-- supabase_auth_admin instead), so the invoking role needs its own
-- read access to allowed_emails — granted below.
CREATE OR REPLACE FUNCTION public.check_email_allowlist(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  new_email TEXT;
BEGIN
  new_email := lower(event->'user'->>'email');
  IF EXISTS (SELECT 1 FROM public.allowed_emails WHERE lower(email) = new_email) THEN
    RETURN '{}'::jsonb;
  END IF;
  RETURN jsonb_build_object(
    'error', jsonb_build_object(
      'message', 'This email is not authorized to sign up. Contact the site owner for access.',
      'http_code', 403
    )
  );
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON allowed_emails TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.check_email_allowlist TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.check_email_allowlist FROM authenticated, anon, public;

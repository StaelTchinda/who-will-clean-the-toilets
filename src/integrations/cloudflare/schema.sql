-- Cloudflare D1 (SQLite) schema for the Cloudflare backend.
-- Mirrors supabase/migrations/ so the in-app SessionRow / AnswerRow / ProgressRow
-- shapes are identical. Apply with:
--   wrangler d1 execute <db-name> --file=./src/integrations/cloudflare/schema.sql
-- (or with --remote for the production D1 instance).

CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE,
  partner_a_name  TEXT,
  partner_b_name  TEXT,
  has_children_a  TEXT CHECK (has_children_a IN ('yes','maybe','no')),
  has_children_b  TEXT CHECK (has_children_b IN ('yes','maybe','no')),
  started_at      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS answers (
  session_id   TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  partner      TEXT NOT NULL CHECK (partner IN ('a','b')),
  question_id  TEXT NOT NULL,
  answer_id    TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (session_id, partner, question_id)
);

CREATE TABLE IF NOT EXISTS progress (
  session_id     TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  partner        TEXT NOT NULL CHECK (partner IN ('a','b')),
  current_index  INTEGER NOT NULL DEFAULT 0,
  total          INTEGER NOT NULL DEFAULT 0,
  completed      INTEGER NOT NULL DEFAULT 0,
  updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (session_id, partner)
);

CREATE INDEX IF NOT EXISTS answers_session_idx  ON answers(session_id);
CREATE INDEX IF NOT EXISTS progress_session_idx ON progress(session_id);

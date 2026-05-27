
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  partner_a_name text,
  partner_b_name text,
  has_children_a text CHECK (has_children_a IN ('yes','maybe','no')),
  has_children_b text CHECK (has_children_b IN ('yes','maybe','no')),
  started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.sessions TO anon, authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open read sessions" ON public.sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "open insert sessions" ON public.sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "open update sessions" ON public.sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.answers (
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  partner text NOT NULL CHECK (partner IN ('a','b')),
  question_id text NOT NULL,
  answer_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, partner, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.answers TO anon, authenticated;
GRANT ALL ON public.answers TO service_role;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open all answers" ON public.answers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.progress (
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  partner text NOT NULL CHECK (partner IN ('a','b')),
  current_index int NOT NULL DEFAULT 0,
  total int NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, partner)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.progress TO anon, authenticated;
GRANT ALL ON public.progress TO service_role;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open all progress" ON public.progress FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.answers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.progress;
ALTER TABLE public.sessions REPLICA IDENTITY FULL;
ALTER TABLE public.progress REPLICA IDENTITY FULL;
ALTER TABLE public.answers REPLICA IDENTITY FULL;

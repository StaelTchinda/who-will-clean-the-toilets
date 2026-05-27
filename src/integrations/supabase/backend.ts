// Supabase implementation of the Backend interface. Logic lifted from the
// pre-abstraction src/lib/session.ts — semantics intentionally identical so
// that switching to VITE_BACKEND=cloudflare is the only change required.
import { supabase } from "./client";
import type {
  AnswerRow,
  Backend,
  ChildrenAnswer,
  Partner,
  ProgressRow,
  SessionRow,
  SessionSubscribeCallbacks,
} from "../backend";

// No easily confused chars — same alphabet as the previous session.ts.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateCode(): string {
  let s = "";
  for (let i = 0; i < 4; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

async function createSession(input: {
  name: string;
  hasChildren: ChildrenAnswer;
}): Promise<{ code: string; id: string }> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        code,
        partner_a_name: input.name.trim(),
        has_children_a: input.hasChildren,
      })
      .select()
      .single();
    if (!error && data) return { code: data.code, id: data.id };
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      throw error;
    }
  }
  throw new Error("Impossible de générer un code de session");
}

async function joinSession(input: {
  code: string;
  name: string;
  hasChildren: ChildrenAnswer;
}): Promise<SessionRow> {
  const code = input.code.trim().toUpperCase();
  const { data: existing, error: fetchErr } = await supabase
    .from("sessions")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!existing) throw new Error("Code de session introuvable");
  if (existing.partner_b_name) return existing as SessionRow; // rejoin

  const { data, error } = await supabase
    .from("sessions")
    .update({
      partner_b_name: input.name.trim(),
      has_children_b: input.hasChildren,
    })
    .eq("id", existing.id)
    .select()
    .single();
  if (error) throw error;
  return data as SessionRow;
}

async function fetchSession(code: string): Promise<SessionRow | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data as SessionRow | null;
}

async function markStarted(sessionId: string): Promise<void> {
  await supabase
    .from("sessions")
    .update({ started_at: new Date().toISOString() })
    .eq("id", sessionId)
    .is("started_at", null);
}

async function fetchAnswers(sessionId: string): Promise<AnswerRow[]> {
  const { data, error } = await supabase.from("answers").select("*").eq("session_id", sessionId);
  if (error) throw error;
  return (data || []) as AnswerRow[];
}

async function fetchProgress(sessionId: string): Promise<ProgressRow[]> {
  const { data, error } = await supabase.from("progress").select("*").eq("session_id", sessionId);
  if (error) throw error;
  return (data || []) as ProgressRow[];
}

async function upsertAnswer(row: AnswerRow): Promise<void> {
  const { error } = await supabase
    .from("answers")
    .upsert(row, { onConflict: "session_id,partner,question_id" });
  if (error) throw error;
}

async function upsertProgress(row: {
  session_id: string;
  partner: Partner;
  current_index: number;
  total: number;
  completed: boolean;
}): Promise<void> {
  const { error } = await supabase
    .from("progress")
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "session_id,partner" });
  if (error) throw error;
}

// Mirrors the previous direct subscription wiring in src/routes/$locale/s.$code.tsx:
// session row changes fire onSession with the new payload; answers/progress
// trigger a full refetch (same behavior as before).
function subscribeToSession(sessionId: string, cb: SessionSubscribeCallbacks): () => void {
  const ch = supabase
    .channel(`session:${sessionId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` },
      (payload) => {
        if (payload.new && cb.onSession) cb.onSession(payload.new as SessionRow);
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "progress", filter: `session_id=eq.${sessionId}` },
      () => {
        if (cb.onProgress) fetchProgress(sessionId).then(cb.onProgress);
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "answers", filter: `session_id=eq.${sessionId}` },
      () => {
        if (cb.onAnswers) fetchAnswers(sessionId).then(cb.onAnswers);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(ch);
  };
}

export const supabaseBackend: Backend = {
  createSession,
  joinSession,
  fetchSession,
  markStarted,
  fetchAnswers,
  fetchProgress,
  upsertAnswer,
  upsertProgress,
  subscribeToSession,
};

import { supabase } from "@/integrations/supabase/client";

export type Partner = "a" | "b";
export type ChildrenAnswer = "yes" | "maybe" | "no";

export interface SessionRow {
  id: string;
  code: string;
  partner_a_name: string | null;
  partner_b_name: string | null;
  has_children_a: ChildrenAnswer | null;
  has_children_b: ChildrenAnswer | null;
  started_at: string | null;
  created_at: string;
}

export interface AnswerRow {
  session_id: string;
  partner: Partner;
  question_id: string;
  answer_id: string;
}

export interface ProgressRow {
  session_id: string;
  partner: Partner;
  current_index: number;
  total: number;
  completed: boolean;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no easily confused chars
function generateCode(): string {
  let s = "";
  for (let i = 0; i < 4; i++)
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

export async function createSession(input: {
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

export async function joinSession(input: {
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
  if (existing.partner_b_name) {
    // Already joined — allow rejoin
    return existing as SessionRow;
  }
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

export async function fetchSession(code: string): Promise<SessionRow | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data as SessionRow | null;
}

export async function markStarted(sessionId: string) {
  await supabase
    .from("sessions")
    .update({ started_at: new Date().toISOString() })
    .eq("id", sessionId)
    .is("started_at", null);
}

export async function fetchAnswers(sessionId: string): Promise<AnswerRow[]> {
  const { data, error } = await supabase
    .from("answers")
    .select("*")
    .eq("session_id", sessionId);
  if (error) throw error;
  return (data || []) as AnswerRow[];
}

export async function fetchProgress(
  sessionId: string,
): Promise<ProgressRow[]> {
  const { data, error } = await supabase
    .from("progress")
    .select("*")
    .eq("session_id", sessionId);
  if (error) throw error;
  return (data || []) as ProgressRow[];
}

export async function upsertAnswer(row: AnswerRow) {
  const { error } = await supabase
    .from("answers")
    .upsert(row, { onConflict: "session_id,partner,question_id" });
  if (error) throw error;
}

export async function upsertProgress(row: {
  session_id: string;
  partner: Partner;
  current_index: number;
  total: number;
  completed: boolean;
}) {
  const { error } = await supabase
    .from("progress")
    .upsert(
      { ...row, updated_at: new Date().toISOString() },
      { onConflict: "session_id,partner" },
    );
  if (error) throw error;
}

const PARTNER_KEY = (code: string) => `nosroles:partner:${code}`;
export function rememberPartner(code: string, partner: Partner) {
  if (typeof window !== "undefined")
    localStorage.setItem(PARTNER_KEY(code), partner);
}
export function recallPartner(code: string): Partner | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(PARTNER_KEY(code));
  return v === "a" || v === "b" ? v : null;
}
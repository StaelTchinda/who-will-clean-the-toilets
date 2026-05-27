// Backend abstraction layer. Selected by the `VITE_BACKEND` env var:
//   - "supabase" (default) — Postgres + Realtime via @supabase/supabase-js
//   - "cloudflare"         — Cloudflare D1 via /api/cf/* fetch + 1.5 s polling
//
// All app code goes through `backend` from this module — no direct supabase
// imports in routes/components/lib (except inside ./supabase/* itself).

import { supabaseBackend } from "./supabase/backend";
import { cloudflareBackend } from "./cloudflare/backend";

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

export interface SessionSubscribeCallbacks {
  onSession?: (session: SessionRow) => void;
  onAnswers?: (answers: AnswerRow[]) => void;
  onProgress?: (progress: ProgressRow[]) => void;
}

export interface Backend {
  createSession(input: {
    name: string;
    hasChildren: ChildrenAnswer;
  }): Promise<{ code: string; id: string }>;
  joinSession(input: {
    code: string;
    name: string;
    hasChildren: ChildrenAnswer;
  }): Promise<SessionRow>;
  fetchSession(code: string): Promise<SessionRow | null>;
  markStarted(sessionId: string): Promise<void>;
  fetchAnswers(sessionId: string): Promise<AnswerRow[]>;
  fetchProgress(sessionId: string): Promise<ProgressRow[]>;
  upsertAnswer(row: AnswerRow): Promise<void>;
  upsertProgress(row: {
    session_id: string;
    partner: Partner;
    current_index: number;
    total: number;
    completed: boolean;
  }): Promise<void>;
  /** Subscribe to live updates for one session. Returns an unsubscribe fn. */
  subscribeToSession(sessionId: string, cb: SessionSubscribeCallbacks): () => void;
}

export type BackendKind = "supabase" | "cloudflare";

// `VITE_BACKEND` is inlined at build time (client) and read from env at runtime
// (server). Vite's static replacement means tree-shaking can drop the unused
// implementation when only one branch is reachable.
function selectedBackend(): BackendKind {
  const raw =
    (import.meta.env.VITE_BACKEND as string | undefined) ??
    (typeof process !== "undefined" ? process.env.BACKEND : undefined) ??
    "supabase";
  return raw === "cloudflare" ? "cloudflare" : "supabase";
}

export const BACKEND_KIND: BackendKind = selectedBackend();

export const backend: Backend = BACKEND_KIND === "cloudflare" ? cloudflareBackend : supabaseBackend;

// Thin pass-through to the configured backend (Supabase or Cloudflare D1).
// Selection is driven by VITE_BACKEND — see src/integrations/backend.ts.
//
// Types are re-exported from here so existing imports
// (`@/lib/session`) keep working without touching call sites.
import { backend } from "@/integrations/backend";
import type {
  AnswerRow,
  ChildrenAnswer,
  Partner,
  ProgressRow,
  SessionRow,
} from "@/integrations/backend";

export type { AnswerRow, ChildrenAnswer, Partner, ProgressRow, SessionRow };

export function createSession(input: { name: string; hasChildren: ChildrenAnswer }) {
  return backend.createSession(input);
}

export function joinSession(input: {
  code: string;
  name: string;
  hasChildren: ChildrenAnswer;
}): Promise<SessionRow> {
  return backend.joinSession(input);
}

export function fetchSession(code: string): Promise<SessionRow | null> {
  return backend.fetchSession(code);
}

export function markStarted(sessionId: string): Promise<void> {
  return backend.markStarted(sessionId);
}

export function fetchAnswers(sessionId: string): Promise<AnswerRow[]> {
  return backend.fetchAnswers(sessionId);
}

export function fetchProgress(sessionId: string): Promise<ProgressRow[]> {
  return backend.fetchProgress(sessionId);
}

export function upsertAnswer(row: AnswerRow): Promise<void> {
  return backend.upsertAnswer(row);
}

export function upsertProgress(row: {
  session_id: string;
  partner: Partner;
  current_index: number;
  total: number;
  completed: boolean;
}): Promise<void> {
  return backend.upsertProgress(row);
}

const PARTNER_KEY = (code: string) => `nosroles:partner:${code}`;
export function rememberPartner(code: string, partner: Partner) {
  if (typeof window !== "undefined") localStorage.setItem(PARTNER_KEY(code), partner);
}
export function recallPartner(code: string): Partner | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(PARTNER_KEY(code));
  return v === "a" || v === "b" ? v : null;
}

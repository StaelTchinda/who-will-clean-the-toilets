// Cloudflare D1 implementation of the Backend interface. The browser hits
// HTTP routes mounted at /api/cf/* by src/server.ts (handled by ./api.ts).
//
// Realtime: Supabase's postgres_changes channel is replaced with polling.
// Two partners + 53 questions means write rate is tiny, so polling every
// 1.5 s is well within Cloudflare's free-tier budget and avoids needing
// Durable Objects for WebSockets.
import type {
  AnswerRow,
  Backend,
  ChildrenAnswer,
  Partner,
  ProgressRow,
  SessionRow,
  SessionSubscribeCallbacks,
} from "../backend";

// Configurable so tests/dev can point at a different host if needed; falls
// back to same-origin (production worker + dev vite proxy both work).
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_CF_API_BASE) || "/api/cf";

const POLL_INTERVAL_MS = 1500;

async function cfFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error) message = parsed.error;
    } catch {
      /* keep raw text */
    }
    throw new Error(message || `Cloudflare API ${res.status}`);
  }
  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

async function createSession(input: {
  name: string;
  hasChildren: ChildrenAnswer;
}): Promise<{ code: string; id: string }> {
  return cfFetch<{ code: string; id: string }>("/sessions", {
    method: "POST",
    body: JSON.stringify({ name: input.name, has_children: input.hasChildren }),
  });
}

async function joinSession(input: {
  code: string;
  name: string;
  hasChildren: ChildrenAnswer;
}): Promise<SessionRow> {
  return cfFetch<SessionRow>("/sessions/join", {
    method: "POST",
    body: JSON.stringify({
      code: input.code,
      name: input.name,
      has_children: input.hasChildren,
    }),
  });
}

async function fetchSession(code: string): Promise<SessionRow | null> {
  return cfFetch<SessionRow | null>(`/sessions/${encodeURIComponent(code.toUpperCase())}`);
}

async function markStarted(sessionId: string): Promise<void> {
  await cfFetch<void>(`/sessions/${encodeURIComponent(sessionId)}/started`, {
    method: "POST",
  });
}

async function fetchAnswers(sessionId: string): Promise<AnswerRow[]> {
  return cfFetch<AnswerRow[]>(`/sessions/${encodeURIComponent(sessionId)}/answers`);
}

async function fetchProgress(sessionId: string): Promise<ProgressRow[]> {
  return cfFetch<ProgressRow[]>(`/sessions/${encodeURIComponent(sessionId)}/progress`);
}

async function upsertAnswer(row: AnswerRow): Promise<void> {
  await cfFetch<void>("/answers", { method: "PUT", body: JSON.stringify(row) });
}

async function upsertProgress(row: {
  session_id: string;
  partner: Partner;
  current_index: number;
  total: number;
  completed: boolean;
}): Promise<void> {
  await cfFetch<void>("/progress", { method: "PUT", body: JSON.stringify(row) });
}

// Polling-based "realtime". Fires immediately so callers don't see a 1.5s
// stale window before the first update, then polls each table on the same
// interval. Differs from Supabase's per-table events but the s.$code.tsx
// consumer treats them as full refetches anyway.
function subscribeToSession(sessionId: string, cb: SessionSubscribeCallbacks): () => void {
  let cancelled = false;

  // Track last-seen JSON to skip redundant state updates and let React bail
  // out of re-renders when nothing actually changed.
  let lastSession = "";
  let lastAnswers = "";
  let lastProgress = "";

  async function tick() {
    if (cancelled) return;
    try {
      const [s, a, p] = await Promise.all([
        cfFetch<SessionRow | null>(`/sessions-by-id/${encodeURIComponent(sessionId)}`).catch(
          () => null,
        ),
        fetchAnswers(sessionId).catch(() => null),
        fetchProgress(sessionId).catch(() => null),
      ]);
      if (cancelled) return;
      if (s) {
        const j = JSON.stringify(s);
        if (j !== lastSession) {
          lastSession = j;
          cb.onSession?.(s);
        }
      }
      if (a) {
        const j = JSON.stringify(a);
        if (j !== lastAnswers) {
          lastAnswers = j;
          cb.onAnswers?.(a);
        }
      }
      if (p) {
        const j = JSON.stringify(p);
        if (j !== lastProgress) {
          lastProgress = j;
          cb.onProgress?.(p);
        }
      }
    } catch {
      // Network blips are expected; the next tick will retry.
    }
  }

  // Fire once immediately, then on interval.
  void tick();
  const handle = setInterval(tick, POLL_INTERVAL_MS);

  return () => {
    cancelled = true;
    clearInterval(handle);
  };
}

export const cloudflareBackend: Backend = {
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

// HTTP handler for /api/cf/* routes, backed by a Cloudflare D1 binding.
// Mounted from src/server.ts BEFORE the TanStack handler so D1 calls never
// hit the SSR pipeline.
//
// The schema (./schema.sql) mirrors supabase/migrations/ closely enough that
// the in-app shape (SessionRow, AnswerRow, ProgressRow) is identical.

type D1Result<T = unknown> = { results: T[]; meta: unknown };
type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  first: <T = unknown>() => Promise<T | null>;
  all: <T = unknown>() => Promise<D1Result<T>>;
  run: () => Promise<unknown>;
};
type D1Database = {
  prepare: (sql: string) => D1PreparedStatement;
};

// The D1 binding name is whatever was chosen in wrangler.jsonc — we resolve
// it at runtime rather than hardcoding (the repo started with `DB`, current
// config uses `nos_roles`). Any property exposing a `.prepare()` function is
// treated as the D1 database.
export type CloudflareEnv = Record<string, unknown>;

function resolveD1(env: CloudflareEnv): D1Database | null {
  if (!env || typeof env !== "object") return null;
  for (const value of Object.values(env)) {
    if (
      value &&
      typeof value === "object" &&
      typeof (value as { prepare?: unknown }).prepare === "function"
    ) {
      return value as D1Database;
    }
  }
  return null;
}

// Cheap UUID v4 — Cloudflare Workers expose crypto.randomUUID(), but we
// fall back for tests/SSR environments that don't.
function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateCode(): string {
  let s = "";
  for (let i = 0; i < 4; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

// Crude path matcher: we don't need a full router for ~8 routes. `pat` is a
// "METHOD /path/with/:params" string; returns the captured groups when
// matched (empty array when no params), or null when not.
function match(request: Request, pat: string): string[] | null {
  const url = new URL(request.url);
  const path = url.pathname;
  const want = pat.split(" ");
  if (request.method !== want[0]) return null;
  const patParts = want[1].split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patParts.length !== pathParts.length) return null;
  const groups: string[] = [];
  for (let i = 0; i < patParts.length; i++) {
    if (patParts[i].startsWith(":")) {
      groups.push(decodeURIComponent(pathParts[i]));
    } else if (patParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return groups;
}

interface SessionRecord {
  id: string;
  code: string;
  partner_a_name: string | null;
  partner_b_name: string | null;
  has_children_a: string | null;
  has_children_b: string | null;
  started_at: string | null;
  created_at: string;
}

// Returns true when a SQLite error indicates a UNIQUE constraint violation
// (sessions.code collision).
function isUniqueViolation(err: unknown): boolean {
  const m = (err as { message?: string })?.message ?? String(err);
  return /UNIQUE|unique/.test(m);
}

export async function handleCloudflareApi(
  request: Request,
  env: CloudflareEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/cf/")) return null;

  // Rewrite to strip the prefix once so route patterns stay readable.
  const stripped = new Request(
    new URL(url.pathname.replace(/^\/api\/cf/, ""), url.origin).toString() + url.search,
    request,
  );

  const db = resolveD1(env);
  if (!db) {
    return errorResponse(
      "No Cloudflare D1 binding found on env. Add a d1_databases entry to wrangler.jsonc.",
      500,
    );
  }

  try {
    let m: string[] | null;

    // POST /sessions  — create
    if ((m = match(stripped, "POST /sessions"))) {
      const body = (await request.json().catch(() => ({}))) as {
        name?: string;
        has_children?: string;
      };
      if (!body.name || !body.has_children) return errorResponse("name and has_children required");
      const name = body.name.trim();
      for (let attempt = 0; attempt < 6; attempt++) {
        const code = generateCode();
        const id = uuid();
        try {
          await db
            .prepare(
              "INSERT INTO sessions (id, code, partner_a_name, has_children_a) VALUES (?, ?, ?, ?)",
            )
            .bind(id, code, name, body.has_children)
            .run();
          return jsonResponse({ id, code });
        } catch (err) {
          if (!isUniqueViolation(err)) throw err;
          // try another code
        }
      }
      return errorResponse("Impossible de générer un code de session", 500);
    }

    // POST /sessions/join
    if ((m = match(stripped, "POST /sessions/join"))) {
      const body = (await request.json().catch(() => ({}))) as {
        code?: string;
        name?: string;
        has_children?: string;
      };
      if (!body.code || !body.name || !body.has_children) {
        return errorResponse("code, name, has_children required");
      }
      const code = body.code.trim().toUpperCase();
      const existing = await db
        .prepare("SELECT * FROM sessions WHERE code = ?")
        .bind(code)
        .first<SessionRecord>();
      if (!existing) return errorResponse("Code de session introuvable", 404);
      if (existing.partner_b_name) return jsonResponse(existing); // rejoin

      await db
        .prepare("UPDATE sessions SET partner_b_name = ?, has_children_b = ? WHERE id = ?")
        .bind(body.name.trim(), body.has_children, existing.id)
        .run();
      const updated = await db
        .prepare("SELECT * FROM sessions WHERE id = ?")
        .bind(existing.id)
        .first<SessionRecord>();
      return jsonResponse(updated);
    }

    // GET /sessions/:code  — fetch by code
    if ((m = match(stripped, "GET /sessions/:code"))) {
      const code = m[0].toUpperCase();
      const row = await db
        .prepare("SELECT * FROM sessions WHERE code = ?")
        .bind(code)
        .first<SessionRecord>();
      return jsonResponse(row ?? null);
    }

    // GET /sessions-by-id/:id  — used by polling subscription
    if ((m = match(stripped, "GET /sessions-by-id/:id"))) {
      const row = await db
        .prepare("SELECT * FROM sessions WHERE id = ?")
        .bind(m[0])
        .first<SessionRecord>();
      return jsonResponse(row ?? null);
    }

    // POST /sessions/:id/started — markStarted (only if null)
    if ((m = match(stripped, "POST /sessions/:id/started"))) {
      await db
        .prepare("UPDATE sessions SET started_at = ? WHERE id = ? AND started_at IS NULL")
        .bind(new Date().toISOString(), m[0])
        .run();
      return new Response(null, { status: 204 });
    }

    // GET /sessions/:id/answers
    if ((m = match(stripped, "GET /sessions/:id/answers"))) {
      const res = await db
        .prepare(
          "SELECT session_id, partner, question_id, answer_id FROM answers WHERE session_id = ?",
        )
        .bind(m[0])
        .all();
      return jsonResponse(res.results ?? []);
    }

    // GET /sessions/:id/progress
    if ((m = match(stripped, "GET /sessions/:id/progress"))) {
      const res = await db
        .prepare(
          "SELECT session_id, partner, current_index, total, completed FROM progress WHERE session_id = ?",
        )
        .bind(m[0])
        .all<{
          session_id: string;
          partner: string;
          current_index: number;
          total: number;
          completed: number; // SQLite stores BOOL as 0/1
        }>();
      const rows = (res.results ?? []).map((r) => ({ ...r, completed: !!r.completed }));
      return jsonResponse(rows);
    }

    // PUT /answers  — upsert
    if ((m = match(stripped, "PUT /answers"))) {
      const body = (await request.json()) as {
        session_id: string;
        partner: string;
        question_id: string;
        answer_id: string;
      };
      await db
        .prepare(
          `INSERT INTO answers (session_id, partner, question_id, answer_id)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(session_id, partner, question_id)
             DO UPDATE SET answer_id = excluded.answer_id`,
        )
        .bind(body.session_id, body.partner, body.question_id, body.answer_id)
        .run();
      return new Response(null, { status: 204 });
    }

    // PUT /progress  — upsert
    if ((m = match(stripped, "PUT /progress"))) {
      const body = (await request.json()) as {
        session_id: string;
        partner: string;
        current_index: number;
        total: number;
        completed: boolean;
      };
      await db
        .prepare(
          `INSERT INTO progress (session_id, partner, current_index, total, completed, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(session_id, partner) DO UPDATE SET
             current_index = excluded.current_index,
             total         = excluded.total,
             completed     = excluded.completed,
             updated_at    = excluded.updated_at`,
        )
        .bind(
          body.session_id,
          body.partner,
          body.current_index,
          body.total,
          body.completed ? 1 : 0,
          new Date().toISOString(),
        )
        .run();
      return new Response(null, { status: 204 });
    }

    return errorResponse("Not found", 404);
  } catch (err) {
    console.error("[cf-api] error", err);
    return errorResponse(err instanceof Error ? err.message : "Internal error", 500);
  }
}

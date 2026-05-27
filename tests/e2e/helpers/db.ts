import { Client } from "pg";

// Local Supabase Postgres. Fixed across machines because `supabase start`
// always binds Postgres on 54322 with postgres/postgres.
export const DB_URL =
  process.env.E2E_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

// One client per test (cheap — local socket, ~1ms connect). We keep this
// synchronous-feeling to avoid leaking a long-lived connection across tests
// where Playwright workers could be torn down mid-flight.
export async function withDb<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/**
 * Truncate the three session tables. Called from beforeEach so each test
 * starts on an empty DB without paying the ~5s cost of `supabase db reset`.
 * RESTART IDENTITY isn't strictly needed (uuid PKs) but keeps any future
 * serial columns sane. CASCADE handles the FK from answers/progress.
 */
export async function truncateAll(): Promise<void> {
  await withDb((c) => c.query(`TRUNCATE sessions, answers, progress RESTART IDENTITY CASCADE`));
}

export interface DbSession {
  id: string;
  code: string;
  partner_a_name: string | null;
  partner_b_name: string | null;
  has_children_a: "yes" | "maybe" | "no" | null;
  has_children_b: "yes" | "maybe" | "no" | null;
  started_at: string | null;
}

export async function getSession(code: string): Promise<DbSession | null> {
  return withDb(async (c) => {
    const { rows } = await c.query<DbSession>(
      "SELECT id, code, partner_a_name, partner_b_name, has_children_a, has_children_b, started_at FROM sessions WHERE code = $1",
      [code.toUpperCase()],
    );
    return rows[0] ?? null;
  });
}

export async function countAnswers(sessionId: string, partner: "a" | "b"): Promise<number> {
  return withDb(async (c) => {
    const { rows } = await c.query<{ n: string }>(
      "SELECT COUNT(*)::text AS n FROM answers WHERE session_id = $1 AND partner = $2",
      [sessionId, partner],
    );
    return Number(rows[0]?.n ?? 0);
  });
}

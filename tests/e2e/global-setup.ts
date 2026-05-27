import { Client } from "pg";
import { DB_URL } from "./helpers/db";

// Fail fast with a helpful message if the local Supabase stack isn't up.
// We intentionally do NOT auto-start it: `supabase start` takes 30s cold,
// which would punish every Playwright invocation. The README documents the
// one-off `bun run e2e:supabase:start` instead.
export default async function globalSetup() {
  const client = new Client({ connectionString: DB_URL });
  try {
    await client.connect();
    const { rows } = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('sessions', 'answers', 'progress')`,
    );
    const found = new Set(rows.map((r) => r.table_name));
    const missing = ["sessions", "answers", "progress"].filter((t) => !found.has(t));
    if (missing.length) {
      throw new Error(
        `Local Supabase reached but tables are missing: ${missing.join(", ")}. ` +
          `Run \`bun run e2e:supabase:reset\` to apply migrations.`,
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Could not reach local Supabase at ${DB_URL}: ${msg}\n` +
        `Start it with: bun run e2e:supabase:start`,
    );
  } finally {
    await client.end();
  }
}

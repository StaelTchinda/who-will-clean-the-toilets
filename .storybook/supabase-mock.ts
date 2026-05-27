// Storybook-only fake of @/integrations/supabase/client. Wired in via a
// resolve.alias in .storybook/main.ts so any module that imports the supabase
// client (lib/session.ts writes, s.$code.tsx realtime channels, …) gets this
// instead — no VITE_SUPABASE_URL needed, no network access.
//
// Surface chosen by inspection of the real call sites:
//   • src/lib/session.ts — from(table).select/insert/update/upsert chained with
//     .eq/.is, terminated by .maybeSingle()/.single()/.upsert() returning
//     { data, error }.
//   • src/routes/s.$code.tsx — channel(name).on(...).on(...).on(...).subscribe()
//     followed by removeChannel(ch) on cleanup.
//
// All terminals resolve to { data: null, error: null }. That is enough for the
// stories: components hit their pending state then unwind cleanly. The
// RouterDecorator stubs navigate(), so the would-be navigation on submit is
// also a silent no-op.

type Terminal = Promise<{ data: unknown; error: unknown }>;

function buildChain() {
  // Intermediates return the chain synchronously; terminals are awaitable.
  // Matches @supabase/postgrest-js's PromiseLike-on-terminal semantics enough
  // for the call shapes used in this codebase.
  const chain = {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    upsert: (): Terminal => Promise.resolve({ data: null, error: null }),
    eq: () => chain,
    is: () => chain,
    maybeSingle: (): Terminal => Promise.resolve({ data: null, error: null }),
    single: (): Terminal => Promise.resolve({ data: null, error: null }),
  };
  return chain;
}

function buildChannel() {
  const ch = {
    on: () => ch,
    subscribe: () => ch,
  };
  return ch;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = {
  from: () => buildChain(),
  channel: () => buildChannel(),
  removeChannel: () => {},
};

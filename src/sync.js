// sync.js — opt-in cloud sync via Supabase.
// no-op until both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
// AND `npm i @supabase/supabase-js` has been run.
//
// schema (run this in supabase sql editor):
//   create table fret_state (
//     user_id text primary key,
//     state jsonb not null,
//     updated_at timestamptz default now()
//   );
//   alter table fret_state enable row level security;
//   create policy "owner" on fret_state for all using (auth.uid()::text = user_id);
//
// for v1 we use the local clientId as user_id (no auth). add a real
// supabase.auth flow when you're ready to attach devices to accounts.

import { Store } from "./store.js";

let client = null;
let pushTimer = null;

export async function initSync() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    // @vite-ignore — the SDK is genuinely optional. install it with
    // `npm i @supabase/supabase-js` only when you want to enable sync.
    const sdk = "@supabase/supabase-js";
    const mod = await import(/* @vite-ignore */ sdk);
    client = mod.createClient(url, key);
  } catch {
    return null;
  }

  const userId = Store.get().clientId;

  // initial pull — overwrite local with remote if remote is newer
  try {
    const { data } = await client
      .from("fret_state")
      .select("state, updated_at")
      .eq("user_id", userId)
      .single();
    if (data?.state) Store.mergeRemote(data.state);
  } catch {
    /* first run, no remote row yet */
  }

  // debounced push on local changes
  Store.subscribe(schedulePush);
  return client;
}

function schedulePush() {
  if (!client) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(push, 2000);
}

async function push() {
  if (!client) return;
  const userId = Store.get().clientId;
  try {
    await client.from("fret_state").upsert({
      user_id: userId,
      state: Store.get(),
      updated_at: new Date().toISOString(),
    });
  } catch {
    /* try again next time */
  }
}

export function isSyncEnabled() {
  return !!client;
}

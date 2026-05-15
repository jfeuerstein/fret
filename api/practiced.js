// /api/practiced — client pings this when a session is completed.
// the daily cron skips subs whose lastPracticed === today.

import { kv } from "@vercel/kv";
import { readJson, subKey, todayUtcKey } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }
  try {
    const { endpoint } = await readJson(req);
    if (!endpoint) return res.status(400).json({ error: "missing endpoint" });
    const key = subKey(endpoint);
    await kv.hset(key, { lastPracticed: todayUtcKey() });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

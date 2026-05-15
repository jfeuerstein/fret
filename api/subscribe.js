// /api/subscribe — store/remove a push subscription.
// vercel serverless function. uses @vercel/kv for persistence.

import { kv } from "@vercel/kv";

const KEY_PREFIX = "sub:";

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function subKey(endpoint) {
  // hash the endpoint into a stable id so two devices = two records
  let h = 5381;
  for (let i = 0; i < endpoint.length; i++) {
    h = ((h << 5) + h) ^ endpoint.charCodeAt(i);
  }
  return `${KEY_PREFIX}${(h >>> 0).toString(36)}`;
}

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { subscription } = await readJson(req);
      if (!subscription?.endpoint) {
        return res.status(400).json({ error: "missing subscription" });
      }
      const key = subKey(subscription.endpoint);
      await kv.hset(key, {
        endpoint: subscription.endpoint,
        data: JSON.stringify(subscription),
        lastSeen: Date.now(),
      });
      await kv.sadd("subs:all", key);
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      const { endpoint } = await readJson(req);
      if (!endpoint) return res.status(400).json({ error: "missing endpoint" });
      const key = subKey(endpoint);
      await kv.del(key);
      await kv.srem("subs:all", key);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// /api/subscribe — store/remove a push subscription.

import { kv } from "@vercel/kv";
import { readJson, subKey } from "./_lib.js";

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { subscription, clientId } = await readJson(req);
      if (!subscription?.endpoint) {
        return res.status(400).json({ error: "missing subscription" });
      }
      const key = subKey(subscription.endpoint);
      await kv.hset(key, {
        endpoint: subscription.endpoint,
        clientId: clientId || "",
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

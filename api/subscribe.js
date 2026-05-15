// /api/subscribe — store/remove a push subscription.
// vercel serverless function. uses @vercel/kv for persistence.

import { kv } from '@vercel/kv';

const KEY_PREFIX = 'sub:';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { subscription, userId = 'anonymous' } = req.body || {};
    if (!subscription?.endpoint) return res.status(400).json({ error: 'missing subscription' });
    await kv.hset(`${KEY_PREFIX}${userId}`, {
      endpoint: subscription.endpoint,
      data: JSON.stringify(subscription),
      lastSeen: Date.now(),
    });
    await kv.sadd('subs:all', `${KEY_PREFIX}${userId}`);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { endpoint, userId = 'anonymous' } = req.body || {};
    await kv.del(`${KEY_PREFIX}${userId}`);
    await kv.srem('subs:all', `${KEY_PREFIX}${userId}`);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method not allowed' });
}

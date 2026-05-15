// /api/cron-remind — daily nudge to practice.
// triggered by vercel cron (see vercel.json).
// vercel sends `Authorization: Bearer ${CRON_SECRET}` for cron-protected paths.
// skips subs whose lastPracticed === today.

import { kv } from "@vercel/kv";
import webpush from "web-push";
import { todayUtcKey } from "./_lib.js";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:dev@fret.app",
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

const NUDGES = [
  { title: "fret", body: "today's tape is ready. lock in." },
  { title: "fret", body: "streak's on the line. you've got this." },
  { title: "fret", body: "em pent. boxes don't memorize themselves." },
  { title: "fret", body: "short session > no session. open it up." },
  { title: "fret", body: "10 min on barre chords beats nothing." },
];

export default async function handler(req, res) {
  if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET) {
    const auth = req.headers.authorization || "";
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: "unauthorized" });
    }
  }

  const today = todayUtcKey();
  const keys = await kv.smembers("subs:all");
  const nudge = NUDGES[Math.floor(Math.random() * NUDGES.length)];

  let sent = 0, dead = 0, skipped = 0;
  for (const k of keys) {
    const rec = await kv.hgetall(k);
    if (!rec?.data) continue;
    if (rec.lastPracticed === today) { skipped++; continue; }

    try {
      const sub = JSON.parse(rec.data);
      await webpush.sendNotification(sub, JSON.stringify({ ...nudge, url: "/" }));
      sent++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        await kv.del(k);
        await kv.srem("subs:all", k);
        dead++;
      }
    }
  }

  return res.status(200).json({ sent, dead, skipped, total: keys.length });
}

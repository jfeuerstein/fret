// /api/cron-remind — daily nudge to practice.
// triggered by vercel cron (see vercel.json). guard with the system header.

import webpush from "web-push";
import { kv } from "@vercel/kv";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:dev@fret.app",
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

const NUDGES = [
  {
    title: "fret",
    body: "today's tape is ready. 45 mins to lock in.",
  },
  {
    title: "fret",
    body: "streak's on the line. you've got this.",
  },
  {
    title: "fret",
    body: "em pent. boxes don't memorize themselves.",
  },
  {
    title: "fret",
    body: "short session > no session. open it up.",
  },
];

export default async function handler(req, res) {
  // vercel cron sends this header; reject everything else
  if (
    req.headers["x-vercel-cron"] !== "1" &&
    process.env.NODE_ENV === "production"
  ) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const keys = await kv.smembers("subs:all");
  const nudge =
    NUDGES[Math.floor(Math.random() * NUDGES.length)];

  let sent = 0,
    dead = 0;
  for (const k of keys) {
    const rec = await kv.hgetall(k);
    if (!rec?.data) continue;
    try {
      const sub = JSON.parse(rec.data);
      await webpush.sendNotification(
        sub,
        JSON.stringify({ ...nudge, url: "/" }),
      );
      sent++;
    } catch (e) {
      // 404/410 → subscription is gone, prune it
      if (e.statusCode === 404 || e.statusCode === 410) {
        await kv.del(k);
        await kv.srem("subs:all", k);
        dead++;
      }
    }
  }

  return res
    .status(200)
    .json({ sent, dead, total: keys.length });
}

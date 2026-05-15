// shared helpers for /api routes.

export async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

const KEY_PREFIX = "sub:";

// stable id from the push endpoint string
export function subKey(endpoint) {
  let h = 5381;
  for (let i = 0; i < endpoint.length; i++) {
    h = ((h << 5) + h) ^ endpoint.charCodeAt(i);
  }
  return `${KEY_PREFIX}${(h >>> 0).toString(36)}`;
}

export function todayUtcKey() {
  return new Date().toISOString().slice(0, 10);
}

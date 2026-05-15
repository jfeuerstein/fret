// theme.js — color tokens, font, date helpers. one place to edit.

export const c = {
  bg: "#0a0a0a",
  panel: "#111",
  panel2: "#161616",
  fg: "#e0e0e0",
  dim: "#999",
  muted: "#666",
  faint: "#3a3a3a",
  border: "#333",
  green: "#44ff44",
  amber: "#ff8844",
  red: "#ff6b6b",
  blue: "#4a9eff",
  magenta: "#ff5cf2",
};

export const baseFont = '"Courier New", ui-monospace, monospace';

export const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
export const MONTH_NAMES = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayDayKey(d = new Date()) {
  return DAY_NAMES[d.getDay()];
}

export function todayLabel(d = new Date()) {
  return `${DAY_NAMES[d.getDay()].toUpperCase()} · ${MONTH_NAMES[d.getMonth()].toUpperCase()} ${String(d.getDate()).padStart(2, "0")}`;
}

// monday-anchored ISO-ish week id, e.g. "2026-05-11"
export function weekKey(d = new Date()) {
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  return todayKey(dt);
}

// shared screen padding that respects iPhone dynamic-island safe area.
// env() returns 0 in non-PWA / non-iOS contexts, so the fallback (28px)
// becomes the total top pad. on iPhone PWA standalone, the island-area
// inset is added on top.
export const screenStyle = {
  paddingTop: "calc(env(safe-area-inset-top, 0px) + 28px)",
  paddingLeft: 16,
  paddingRight: 16,
  paddingBottom: 110,
  minHeight: "100%",
  boxSizing: "border-box",
  background: c.bg,
  color: c.fg,
  fontFamily: baseFont,
  fontSize: 13,
};

export const onboardingStyle = {
  paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)",
  paddingLeft: 22,
  paddingRight: 22,
  paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)",
  minHeight: "100%",
  boxSizing: "border-box",
  background: c.bg,
  color: c.fg,
  fontFamily: baseFont,
  display: "flex",
  flexDirection: "column",
};

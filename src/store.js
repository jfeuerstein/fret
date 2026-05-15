// store.js — localStorage-backed state with a tiny pub/sub.
// import { useStore } from './store.js' for the React hook.
//
// Selectors should return primitives or stable refs — the snapshot
// comparison is reference-equality. Use useStoreShallow if you need
// to select multiple fields at once.

import { useRef, useSyncExternalStore } from "react";
import { todayKey, weekKey } from "./theme.js";

const KEY = "fret.v2";

const DEFAULTS = {
  profile: null,
  history: {
    sessions: [],
    bpmByDrill: {}, // { [drillId]: { bpm, cleanStreak } }
    lastDrillIds: [],
  },
  journal: [],
  // week is { weekKey: "2026-05-11", days: [{day, focus, status, ...}, ...] }
  week: null,
  streak: {
    count: 0,
    lastDate: null,
    totalMinutes: 0,
    totalAllTime: 0,
    songsLearned: 0,
  },
  quiz: {},                // { [cardId]: { ease, interval, reps, dueAt, lapses } }
  lastPracticed: null,     // YYYY-MM-DD string
  pushSubscription: null,
  clientId: null,          // stable random id for cloud sync
};

function load() {
  try {
    const raw = typeof localStorage !== "undefined"
      ? localStorage.getItem(KEY)
      : null;
    if (!raw) return seed(structuredClone(DEFAULTS));
    return seed({ ...structuredClone(DEFAULTS), ...JSON.parse(raw) });
  } catch {
    return seed(structuredClone(DEFAULTS));
  }
}

function seed(s) {
  if (!s.clientId) {
    s.clientId =
      (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : "c_" + Math.random().toString(36).slice(2);
  }
  return s;
}

let state = load();
const subs = new Set();

function emit() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(KEY, JSON.stringify(state));
    }
  } catch {}
  subs.forEach((fn) => fn());
}

function set(updater) {
  state = typeof updater === "function" ? updater(state) : updater;
  emit();
}

export const Store = {
  get: () => state,

  subscribe(fn) {
    subs.add(fn);
    return () => subs.delete(fn);
  },

  setProfile(p) {
    set((s) => ({ ...s, profile: p }));
  },

  setWeek(days) {
    set((s) => ({ ...s, week: { weekKey: weekKey(), days } }));
  },

  // call from screens; rebuilds the week if we've crossed a Monday.
  ensureCurrentWeek(generator) {
    if (!state.profile) return;
    const wk = weekKey();
    if (state.week?.weekKey === wk && state.week.days?.length) return;
    const days = generator(state.profile);
    set((s) => ({ ...s, week: { weekKey: wk, days } }));
  },

  setPushSubscription(sub) {
    set((s) => ({ ...s, pushSubscription: sub }));
  },

  completeSession(session, durationMin) {
    const today = todayKey();
    const yest = todayKey(new Date(Date.now() - 86_400_000));
    const last = state.streak.lastDate;
    const streak = { ...state.streak };
    if (last !== today) {
      if (last === yest || !last) streak.count += 1;
      else streak.count = 1;
      streak.lastDate = today;
    }
    streak.totalMinutes += durationMin || 0;
    streak.totalAllTime += durationMin || 0;

    const sessions = [
      {
        date: today,
        focus: session.focus,
        minutes: durationMin,
      },
      ...state.history.sessions,
    ].slice(0, 60);

    // mark today's plan as done if it exists
    const todayDay = ["sun","mon","tue","wed","thu","fri","sat"][new Date().getDay()];
    let week = state.week;
    if (week?.days?.length) {
      week = {
        ...week,
        days: week.days.map((d) =>
          d.day === todayDay && d.status !== "rest"
            ? { ...d, status: "done" }
            : d,
        ),
      };
    }

    set((s) => ({
      ...s,
      streak,
      week,
      lastPracticed: today,
      history: {
        ...s.history,
        sessions,
        lastDrillIds: (session.blocks || [])
          .map((b) => b.drillId)
          .filter(Boolean),
      },
    }));
  },

  recordBpm(drillId, bpm, clean) {
    if (!drillId || !bpm) return;
    const cur = state.history.bpmByDrill[drillId] || { bpm: 0, cleanStreak: 0 };
    const next = {
      bpm: clean ? Math.max(cur.bpm, bpm) : cur.bpm,
      cleanStreak: clean ? cur.cleanStreak + 1 : 0,
    };
    set((s) => ({
      ...s,
      history: {
        ...s.history,
        bpmByDrill: { ...s.history.bpmByDrill, [drillId]: next },
      },
    }));
  },

  addJournal(entry) {
    set((s) => ({
      ...s,
      journal: [{ date: todayKey(), ...entry }, ...s.journal].slice(0, 200),
    }));
  },

  updateQuizCard(id, card) {
    set((s) => ({
      ...s,
      quiz: { ...s.quiz, [id]: card },
    }));
  },

  resetQuiz() {
    set((s) => ({ ...s, quiz: {} }));
  },

  // overwrite local state from a remote sync pull.
  // only merges keys that exist in DEFAULTS so we never inherit garbage.
  mergeRemote(remote) {
    if (!remote) return;
    const merged = { ...state };
    for (const k of Object.keys(DEFAULTS)) {
      if (k in remote) merged[k] = remote[k];
    }
    set(merged);
  },

  reset() {
    set(seed(structuredClone(DEFAULTS)));
  },
};

// ─── react hook ──────────────────────────────────────────────
export function useStore(selector = (s) => s) {
  return useSyncExternalStore(
    Store.subscribe,
    () => selector(Store.get()),
    () => selector(Store.get()),
  );
}

// shallow-equal selector wrapper — use when you need to pull multiple
// fields at once and want to avoid a render every time *anything* in
// the store changes.
function shallowEq(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (!Object.is(a[k], b[k])) return false;
  return true;
}

export function useStoreShallow(selector) {
  const lastRef = useRef(undefined);
  const snap = () => {
    const next = selector(Store.get());
    if (lastRef.current && shallowEq(lastRef.current, next)) return lastRef.current;
    lastRef.current = next;
    return next;
  };
  return useSyncExternalStore(Store.subscribe, snap, snap);
}

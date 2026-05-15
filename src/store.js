// store.js — localStorage-backed state with a tiny pub/sub.
// import { useStore } from './store.js' for the React hook.

import { useSyncExternalStore } from "react";

const KEY = "gp.v1";
const DEFAULTS = {
  profile: null,
  history: {
    sessions: [],
    bpmByDrill: {},
    lastDrillIds: [],
  },
  journal: [],
  week: null,
  streak: {
    count: 0,
    lastDate: null,
    totalMinutes: 0,
    totalAllTime: 0,
    songsLearned: 0,
  },
  pushSubscription: null,
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    return {
      ...structuredClone(DEFAULTS),
      ...JSON.parse(raw),
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

let state = load();
const subs = new Set();

function emit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  subs.forEach((fn) => fn());
}

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const Store = {
  get: () => state,
  subscribe(fn) {
    subs.add(fn);
    return () => subs.delete(fn);
  },
  setProfile(p) {
    state = { ...state, profile: p };
    emit();
  },
  setWeek(w) {
    state = { ...state, week: w };
    emit();
  },
  setPushSubscription(sub) {
    state = { ...state, pushSubscription: sub };
    emit();
  },

  completeSession(session, durationMin) {
    const today = todayKey();
    const yest = todayKey(
      new Date(Date.now() - 86_400_000),
    );
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

    state = {
      ...state,
      streak,
      history: {
        ...state.history,
        sessions,
        lastDrillIds: (session.blocks || [])
          .map((b) => b.drillId)
          .filter(Boolean),
      },
    };
    emit();
  },

  recordBpm(drillId, bpm, clean) {
    const cur = state.history.bpmByDrill[drillId] || {
      bpm: 0,
      cleanStreak: 0,
    };
    const next = {
      bpm: Math.max(cur.bpm, bpm),
      cleanStreak: clean ? cur.cleanStreak + 1 : 0,
    };
    state = {
      ...state,
      history: {
        ...state.history,
        bpmByDrill: {
          ...state.history.bpmByDrill,
          [drillId]: next,
        },
      },
    };
    emit();
  },

  addJournal(entry) {
    state = {
      ...state,
      journal: [
        { date: todayKey(), ...entry },
        ...state.journal,
      ].slice(0, 200),
    };
    emit();
  },

  reset() {
    state = structuredClone(DEFAULTS);
    emit();
  },
};

// react hook — components useStore() to subscribe and re-render
export function useStore(selector = (s) => s) {
  return useSyncExternalStore(
    Store.subscribe,
    () => selector(Store.get()),
    () => selector(Store.get()),
  );
}

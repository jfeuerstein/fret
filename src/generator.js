// generator.js — rules-based daily routine generator.
// pure functions. no side effects, no globals.
// session contents are seeded by (date, focus) so reloading doesn't
// reroll your tape. drill data lives in ./content/drills.json.

import { DRILLS } from "./content.js";
import { todayKey } from "./theme.js";

const TEMPLATES = {
  technique:   ["warmup", "dexterity", "technique", "scales", "rhythm", "improv", "theory", "review"],
  lead:        ["warmup", "scales", "technique", "bends_vibrato", "improv", "improv", "theory", "review"],
  fingerstyle: ["warmup", "dexterity", "technique", "rhythm", "scales", "improv", "theory", "review"],
  theory:      ["warmup", "theory", "theory", "scales", "improv", "review"],
  rest:        [],
};

const WEIGHTS = {
  warmup: 0.08,
  dexterity: 0.10,
  technique: 0.14,
  scales: 0.20,
  rhythm: 0.10,
  bends_vibrato: 0.10,
  improv: 0.18,
  theory: 0.07,
  review: 0.04,
};

// deterministic RNG seeded by a string. so (today + focus) → same tape.
function seededRng(seed) {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h) ^ seed.charCodeAt(i);
  return () => {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) | 0;
    return ((h >>> 0) % 100000) / 100000;
  };
}

function pickDrill(focus, history, rng) {
  const pool = DRILLS[focus] || [];
  if (!pool.length) return null;
  const yesterday = history.lastDrillIds || [];
  const fresh = pool.filter((d) => !yesterday.includes(d.id));
  const arr = fresh.length ? fresh : pool;
  return arr[Math.floor(rng() * arr.length)];
}

function adaptiveBpm(drill, history) {
  if (!drill.baseBpm) return 0;
  const last = (history.bpmByDrill || {})[drill.id];
  if (!last || !last.bpm) return drill.baseBpm;
  // if you've cleared 3 clean reps at this BPM, push +5
  return last.cleanStreak >= 3 ? last.bpm + 5 : last.bpm;
}

export function generateSession({
  focus = "technique",
  sessionLength = 45,
  history = {},
  seed = todayKey(),
} = {}) {
  const template = TEMPLATES[focus] || TEMPLATES.technique;
  if (!template.length) return null;

  const rng = seededRng(`${seed}|${focus}|${sessionLength}`);

  const blocks = template
    .map((kind) => {
      const drill = pickDrill(kind, history, rng);
      if (!drill) return null;
      const minutes = Math.max(
        2,
        Math.round(sessionLength * (WEIGHTS[kind] || 0.1)),
      );
      // stable id by (seed + kind + drill) — same id across reloads
      return {
        id: `${seed}_${kind}_${drill.id}`,
        kindId: kind,
        drillId: drill.id,
        kind,
        label: drill.label,
        drill: drill.drill,
        detail: drill.detail,
        tab: drill.tab || null,
        backing: drill.backing || null,
        // a "kind" of 'quiz' tells the session screen to swap in
        // the inline quiz card flow rather than the metronome ui.
        cardKind: drill.kind || "metronome",
        duration: minutes,
        bpm: adaptiveBpm(drill, history),
      };
    })
    .filter(Boolean);

  const total = blocks.reduce((s, b) => s + b.duration, 0);
  if (total !== sessionLength && blocks.length) {
    blocks[0].duration += sessionLength - total;
  }

  return {
    focus,
    title: `${focus} day`,
    subtitle: blocks.slice(0, 3).map((b) => b.label).join(" · "),
    duration: sessionLength,
    blocks,
    seed,
  };
}

const SHORT_FOR = {
  technique: "fingers + scales",
  lead: "pent. solo work",
  fingerstyle: "travis picking",
  theory: "intervals + ear",
};

export function generateWeek({
  daysPerWeek = 5,
  sessionLength = 45,
  focuses = ["technique", "lead", "fingerstyle", "theory"],
} = {}) {
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const restCount = 7 - daysPerWeek;
  const restIdx = new Set();
  if (restCount === 1) restIdx.add(2);
  if (restCount === 2) { restIdx.add(2); restIdx.add(6); }
  if (restCount === 3) { restIdx.add(1); restIdx.add(3); restIdx.add(6); }
  if (restCount === 4) { restIdx.add(1); restIdx.add(2); restIdx.add(4); restIdx.add(6); }

  let fIdx = 0;
  return days.map((d, i) => {
    if (restIdx.has(i)) {
      return {
        day: d,
        focus: "rest",
        short: "rest day",
        minutes: 0,
        status: "rest",
        bpm: 0,
      };
    }
    const focus = focuses[fIdx % focuses.length];
    fIdx++;
    return {
      day: d,
      focus,
      short: SHORT_FOR[focus] || "practice",
      minutes: sessionLength,
      status: "queued",
      bpm: 0,
    };
  });
}

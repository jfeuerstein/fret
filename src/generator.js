// generator.js — rules-based daily routine generator.
// pure functions. no side effects, no globals.

const DRILLS = {
  warmup: [
    { id: 'chromatic_1234', label: 'warm-up', drill: 'chromatic 1-2-3-4 ladder', tab: 'chromatic',
      detail: 'all 6 strings, alternate picking. clean transitions, no buzz.', baseBpm: 60 },
    { id: 'spider_1324', label: 'warm-up', drill: 'spider 1-3-2-4', tab: 'spider',
      detail: 'each finger lifts only when needed.', baseBpm: 65 },
    { id: 'string_skip', label: 'warm-up', drill: 'string-skip chromatic', tab: 'chromatic',
      detail: 'skip a string between every note. clean muting.', baseBpm: 55 },
  ],
  dexterity: [
    { id: 'spider_1234', label: 'finger independence', drill: 'spider walks · 1234', tab: 'spider',
      detail: '1234 / 1324 / 1423 / 1432 patterns.', baseBpm: 70 },
    { id: 'trill_pairs', label: 'finger independence', drill: 'trill pairs (1-2, 2-3, 3-4)', tab: null,
      detail: '20s on each pair. even volume, not speed.', baseBpm: 0 },
    { id: 'legato_groups', label: 'finger independence', drill: 'legato groups of 4', tab: null,
      detail: 'pull-offs only after the first attack.', baseBpm: 80 },
  ],
  technique: [
    { id: 'altpick_single', label: 'alt picking', drill: 'single-string · 16ths', tab: 'altpick',
      detail: 'metronome on quarters. 3 clean reps → +5 bpm.', baseBpm: 80 },
    { id: 'altpick_string_change', label: 'alt picking', drill: 'string change · outside', tab: null,
      detail: 'two notes per string, outside picking only.', baseBpm: 75 },
    { id: 'economy_3nps', label: 'economy picking', drill: '3 notes per string', tab: null,
      detail: 'down-down-up across strings ascending.', baseBpm: 70 },
  ],
  scales: [
    { id: 'em_pent_box1', label: 'scales', drill: 'em pent. box 1', tab: 'em_pent_box1',
      detail: 'asc + desc. say the root each time you hit it.', baseBpm: 90 },
    { id: 'em_pent_box2', label: 'scales', drill: 'em pent. box 2', tab: 'em_pent_box1',
      detail: 'box 2 only. clean position shifts.', baseBpm: 85 },
    { id: 'em_pent_connect', label: 'scales', drill: 'connect boxes 1 + 2', tab: 'em_pent_box1',
      detail: 'string by string. find every shared note.', baseBpm: 80 },
    { id: 'em_pent_full', label: 'scales', drill: 'all 5 boxes, slow', tab: 'em_pent_box1',
      detail: 'one minute per box.', baseBpm: 70 },
  ],
  improv: [
    { id: 'improv_em_groove', label: 'improv', drill: 'noodle · em groove', tab: null, backing: 'em_groove',
      detail: 'boxes 1+2 only. 1 bend + 1 slide / minute.', baseBpm: 100 },
    { id: 'improv_am_slow', label: 'improv', drill: 'noodle · am slow burn', tab: null, backing: 'am_slow',
      detail: 'long phrases. leave space.', baseBpm: 80 },
    { id: 'improv_blues', label: 'improv', drill: 'e blues shuffle', tab: null, backing: 'e_blues',
      detail: 'minor pent over major chords. lean on b3 → 3.', baseBpm: 90 },
  ],
  theory: [
    { id: 'th_pent', label: 'theory micro', drill: 'why is the pentatonic 5 notes?',
      detail: 'major scale minus the 4 + 7. the pent. is the safe subset.', baseBpm: 0 },
    { id: 'th_intervals', label: 'theory micro', drill: 'name the intervals',
      detail: 'minor 3rd = 3 semitones. perfect 5th = 7. octave = 12.', baseBpm: 0 },
    { id: 'th_circle', label: 'theory micro', drill: 'circle of fifths',
      detail: 'C → G → D → A → E → B. each adds one sharp.', baseBpm: 0 },
    { id: 'th_caged', label: 'theory micro', drill: 'CAGED system, intro',
      detail: 'every chord shape lives in 5 places.', baseBpm: 0 },
  ],
  review: [
    { id: 'rv_log', label: 'review + log', drill: 'one thing clicked, one didn\'t',
      detail: 'two sentences in the journal.', baseBpm: 0 },
  ],
};

const TEMPLATES = {
  technique:   ['warmup', 'dexterity', 'technique', 'scales', 'improv', 'theory', 'review'],
  lead:        ['warmup', 'scales', 'technique', 'improv', 'improv', 'theory', 'review'],
  fingerstyle: ['warmup', 'dexterity', 'technique', 'scales', 'improv', 'theory', 'review'],
  theory:      ['warmup', 'theory', 'theory', 'scales', 'improv', 'review'],
  rest:        [],
};

const WEIGHTS = {
  warmup: 0.10, dexterity: 0.13, technique: 0.18,
  scales: 0.27, improv: 0.18, theory: 0.09, review: 0.05,
};

function pickDrill(focus, history) {
  const pool = DRILLS[focus] || [];
  if (!pool.length) return null;
  const yesterday = history.lastDrillIds || [];
  const fresh = pool.filter(d => !yesterday.includes(d.id));
  const arr = fresh.length ? fresh : pool;
  return arr[Math.floor(Math.random() * arr.length)];
}

function adaptiveBpm(drill, history) {
  if (!drill.baseBpm) return 0;
  const last = (history.bpmByDrill || {})[drill.id];
  if (!last) return drill.baseBpm;
  return last.cleanStreak >= 3 ? last.bpm + 5 : last.bpm;
}

export function generateSession({ focus = 'technique', sessionLength = 45, history = {} } = {}) {
  const template = TEMPLATES[focus] || TEMPLATES.technique;
  if (!template.length) return null;

  const blocks = template.map(kind => {
    const drill = pickDrill(kind, history);
    if (!drill) return null;
    const minutes = Math.max(2, Math.round(sessionLength * (WEIGHTS[kind] || 0.1)));
    return {
      id: `${kind}_${drill.id}_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
      kindId: kind, drillId: drill.id, kind,
      label: drill.label, drill: drill.drill, detail: drill.detail,
      tab: drill.tab || null, backing: drill.backing || null,
      duration: minutes, bpm: adaptiveBpm(drill, history),
    };
  }).filter(Boolean);

  const total = blocks.reduce((s, b) => s + b.duration, 0);
  if (total !== sessionLength && blocks.length) {
    blocks[0].duration += (sessionLength - total);
  }

  return {
    focus,
    title: `${focus} day`,
    subtitle: blocks.slice(0, 3).map(b => b.label).join(' · '),
    duration: sessionLength,
    blocks,
  };
}

const SHORT_FOR = {
  technique: 'fingers + scales',
  lead: 'pent. solo work',
  fingerstyle: 'travis picking',
  theory: 'intervals + ear',
};

export function generateWeek({ daysPerWeek = 5, sessionLength = 45, focuses = ['technique','lead','fingerstyle','theory'] } = {}) {
  const days = ['mon','tue','wed','thu','fri','sat','sun'];
  const restCount = 7 - daysPerWeek;
  const restIdx = new Set();
  if (restCount === 1) restIdx.add(2);
  if (restCount === 2) { restIdx.add(2); restIdx.add(6); }
  if (restCount === 3) { restIdx.add(1); restIdx.add(3); restIdx.add(6); }

  let fIdx = 0;
  return days.map((d, i) => {
    if (restIdx.has(i)) return { day: d, focus: 'rest', short: 'rest day', minutes: 0, status: 'rest', bpm: 0 };
    const focus = focuses[fIdx % focuses.length]; fIdx++;
    return { day: d, focus, short: SHORT_FOR[focus] || 'practice', minutes: sessionLength, status: 'queued', bpm: 0 };
  });
}

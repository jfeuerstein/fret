// cards.js — generates the quiz deck programmatically.
// covers the things you have to know cold to jam:
//   barre chord shapes (E/A · maj/min/7) — forward and inverse
//   notes on the fretboard (any string × frets 1..12)
//   intervals from a root
//   diatonic chord function (in key X, what's the V/IV/vi/etc.)
//   relative minors
//   pentatonic box roots
//   modes over chord types
//   key signatures (sharp count)

const CHROMATIC = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];

// fret of the named root on each open string
const ROOT_FRET_ON_STRING = {
  // 6th string (low E)
  E_string: { E: 0, F: 1, "F#": 2, G: 3, "G#": 4, A: 5, "A#": 6, B: 7, C: 8, "C#": 9, D: 10, "D#": 11 },
  // 5th string (A)
  A_string: { A: 0, "A#": 1, B: 2, C: 3, "C#": 4, D: 5, "D#": 6, E: 7, F: 8, "F#": 9, G: 10, "G#": 11 },
};

const STRING_LABELS = [
  { idx: 6, label: "low E (6th)", openNote: "E" },
  { idx: 5, label: "A (5th)",     openNote: "A" },
  { idx: 4, label: "D (4th)",     openNote: "D" },
  { idx: 3, label: "G (3rd)",     openNote: "G" },
  { idx: 2, label: "B (2nd)",     openNote: "B" },
  { idx: 1, label: "high E (1st)", openNote: "E" },
];

const INTERVALS = [
  { name: "minor 3rd",   semis: 3 },
  { name: "major 3rd",   semis: 4 },
  { name: "perfect 4th", semis: 5 },
  { name: "tritone",     semis: 6 },
  { name: "perfect 5th", semis: 7 },
  { name: "minor 7th",   semis: 10 },
  { name: "major 7th",   semis: 11 },
];

const DIATONIC = [
  { roman: "I",   semis: 0,  qual: "maj" },
  { roman: "ii",  semis: 2,  qual: "m" },
  { roman: "iii", semis: 4,  qual: "m" },
  { roman: "IV",  semis: 5,  qual: "maj" },
  { roman: "V",   semis: 7,  qual: "maj" },
  { roman: "vi",  semis: 9,  qual: "m" },
];

const COMMON_KEYS = ["C", "G", "D", "A", "E", "F"];
const FRET_CHOICES = ["0","1","2","3","4","5","6","7","8","9","10","11","12"];

// stable per-card RNG so multiple-choice options don't reshuffle every render
function seededRng(seed) {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h) ^ seed.charCodeAt(i);
  return () => {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) | 0;
    return ((h >>> 0) % 100000) / 100000;
  };
}

function shuffleStable(arr, seed) {
  const r = seededRng(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildChoices(correct, pool, seed, n = 4) {
  const wrongs = pool.filter((x) => x !== correct);
  const sampled = shuffleStable(wrongs, seed + ":w").slice(0, n - 1);
  return shuffleStable([correct, ...sampled], seed + ":c");
}

function chordName(root, qual) {
  if (qual === "maj") return root;
  if (qual === "m")   return root + "m";
  if (qual === "7")   return root + "7";
  return root;
}

function shapeLabel(shape, qual) {
  if (qual === "maj") return `${shape}-shape`;
  if (qual === "m")   return `${shape}m-shape`;
  if (qual === "7")   return `${shape}7-shape`;
  return `${shape}-shape`;
}

function rootFretFor(shape, root) {
  return shape === "E"
    ? ROOT_FRET_ON_STRING.E_string[root]
    : ROOT_FRET_ON_STRING.A_string[root];
}

const QUALS = ["maj", "m", "7"];

export function generateDeck() {
  const cards = [];

  // ─── BARRE: forward (chord → fret, you derive the shape yourself) ──
  for (const root of CHROMATIC) {
    for (const shape of ["E", "A"]) {
      for (const qual of QUALS) {
        const fret = rootFretFor(shape, root);
        if (fret === 0) continue; // open shape, no barre needed
        cards.push({
          id: `barre_fwd_${shape}_${root}_${qual}`,
          tag: "barre",
          kind: "reveal",
          prompt: `Play ${shapeLabel(shape, qual)} ${chordName(root, qual)}`,
          answer: `Fret ${fret}`,
          meta: { shape, root, qual, fret },
        });
      }
    }
  }

  // ─── BARRE: inverse · what fret? (chord + shape → fret) ────────────
  for (const root of CHROMATIC) {
    for (const shape of ["E", "A"]) {
      for (const qual of QUALS) {
        const fret = rootFretFor(shape, root);
        if (fret === 0) continue;
        const id = `barre_inv_fret_${shape}_${root}_${qual}`;
        cards.push({
          id,
          tag: "barre",
          kind: "mc",
          prompt: `What fret for ${shapeLabel(shape, qual)} → ${chordName(root, qual)}?`,
          answer: String(fret),
          choices: buildChoices(String(fret), FRET_CHOICES, id),
          meta: { shape, root, qual, fret },
        });
      }
    }
  }

  // ─── BARRE: inverse · what shape? (chord + fret → shape) ───────────
  for (const root of CHROMATIC) {
    for (const qual of QUALS) {
      for (const shape of ["E", "A"]) {
        const fret = rootFretFor(shape, root);
        if (fret === 0) continue;
        const id = `barre_inv_shape_${shape}_${root}_${qual}`;
        cards.push({
          id,
          tag: "barre",
          kind: "mc",
          prompt: `Played at fret ${fret}, what shape gives you ${chordName(root, qual)}?`,
          answer: shapeLabel(shape, qual),
          choices: [shapeLabel("E", qual), shapeLabel("A", qual)],
          meta: { shape, root, qual, fret },
        });
      }
    }
  }

  // ─── BARRE: inverse · what chord? (shape + fret → chord) ───────────
  for (const root of CHROMATIC) {
    for (const shape of ["E", "A"]) {
      for (const qual of QUALS) {
        const fret = rootFretFor(shape, root);
        if (fret === 0) continue;
        const id = `barre_inv_chord_${shape}_${root}_${qual}`;
        const chord = chordName(root, qual);
        const allChordsOfQual = CHROMATIC.map((r) => chordName(r, qual));
        cards.push({
          id,
          tag: "barre",
          kind: "mc",
          prompt: `${shapeLabel(shape, qual)} at fret ${fret} — what chord?`,
          answer: chord,
          choices: buildChoices(chord, allChordsOfQual, id),
          meta: { shape, root, qual, fret },
        });
      }
    }
  }

  // ─── notes on the fretboard (12 frets × 6 strings) ───────────
  for (const s of STRING_LABELS) {
    const openIdx = CHROMATIC.indexOf(s.openNote);
    for (let f = 1; f <= 12; f++) {
      const note = CHROMATIC[(openIdx + f) % 12];
      const id = `note_s${s.idx}_f${f}`;
      cards.push({
        id,
        tag: "fretboard",
        kind: "mc",
        prompt: `Fret ${f} on the ${s.label} string. What note?`,
        answer: note,
        choices: buildChoices(note, CHROMATIC, id),
        meta: { string: s.idx, fret: f, note },
      });
    }
  }

  // ─── intervals above a root ──────────────────────────────────
  for (const root of CHROMATIC) {
    for (const i of INTERVALS) {
      const note = CHROMATIC[(CHROMATIC.indexOf(root) + i.semis) % 12];
      const id = `intv_${root}_${i.name.replace(/\s+/g, "_")}`;
      cards.push({
        id,
        tag: "intervals",
        kind: "mc",
        prompt: `${i.name} above ${root}?`,
        answer: note,
        choices: buildChoices(note, CHROMATIC, id),
        meta: { root, interval: i.name, semis: i.semis },
      });
    }
  }

  // ─── diatonic chord function ─────────────────────────────────
  for (const key of COMMON_KEYS) {
    const allChordsInKey = DIATONIC.map((f) => {
      const note = CHROMATIC[(CHROMATIC.indexOf(key) + f.semis) % 12];
      return chordName(note, f.qual);
    });
    for (const f of DIATONIC) {
      const note = CHROMATIC[(CHROMATIC.indexOf(key) + f.semis) % 12];
      const chord = chordName(note, f.qual);
      const id = `func_${key}_${f.roman}`;
      cards.push({
        id,
        tag: "function",
        kind: "mc",
        prompt: `In the key of ${key} major, what's the ${f.roman} chord?`,
        answer: chord,
        choices: buildChoices(chord, allChordsInKey, id),
        meta: { key, function: f.roman, chord },
      });
    }
  }

  // ─── relative minors ─────────────────────────────────────────
  for (const key of COMMON_KEYS) {
    const rel = CHROMATIC[(CHROMATIC.indexOf(key) + 9) % 12] + "m";
    const id = `relmin_${key}`;
    cards.push({
      id,
      tag: "function",
      kind: "mc",
      prompt: `Relative minor of ${key} major?`,
      answer: rel,
      choices: buildChoices(rel, CHROMATIC.map((n) => n + "m"), id),
      meta: { key },
    });
  }

  // ─── pentatonic box roots (Em pent., first-octave positions) ─
  // for each box, list every E note (root) that falls within the box.
  const pentBoxes = [
    { box: 1, range: "0–3 (open position)", roots: "6th-0 (open low E), 4th-2, 1st-0 (open high E)" },
    { box: 2, range: "2–5",                 roots: "4th-2, 2nd-5" },
    { box: 3, range: "5–7",                 roots: "2nd-5, 5th-7" },
    { box: 4, range: "7–9",                 roots: "5th-7, 3rd-9" },
    { box: 5, range: "9–12",                roots: "3rd-9, 6th-12, 1st-12" },
  ];
  for (const b of pentBoxes) {
    cards.push({
      id: `pent_em_box${b.box}_roots`,
      tag: "scales",
      kind: "reveal",
      prompt: `Em pentatonic, box ${b.box} (frets ${b.range}): list every root.`,
      answer: b.roots,
      meta: b,
    });
  }

  // ─── modes over chord types ──────────────────────────────────
  const modeOver = [
    { chord: "major 7",    modes: ["Ionian", "Lydian"], best: "Ionian" },
    { chord: "minor 7",    modes: ["Dorian", "Aeolian", "Phrygian"], best: "Dorian" },
    { chord: "dominant 7", modes: ["Mixolydian"], best: "Mixolydian" },
    { chord: "half-dim",   modes: ["Locrian"], best: "Locrian" },
  ];
  const allModes = ["Ionian", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Aeolian", "Locrian"];
  for (const m of modeOver) {
    const id = `mode_${m.chord.replace(/\s+/g, "_")}`;
    cards.push({
      id,
      tag: "modes",
      kind: "mc",
      prompt: `Over a ${m.chord} chord, the most "inside" mode?`,
      answer: m.best,
      choices: buildChoices(m.best, allModes, id),
      meta: m,
    });
  }

  // ─── key signatures (sharp count) ────────────────────────────
  const sharpKeys = [
    { key: "G",  sharps: 1 },
    { key: "D",  sharps: 2 },
    { key: "A",  sharps: 3 },
    { key: "E",  sharps: 4 },
    { key: "B",  sharps: 5 },
    { key: "F#", sharps: 6 },
    { key: "C",  sharps: 0 },
  ];
  for (const k of sharpKeys) {
    const id = `keysig_${k.key}`;
    cards.push({
      id,
      tag: "keys",
      kind: "mc",
      prompt: `How many sharps in ${k.key} major?`,
      answer: String(k.sharps),
      choices: buildChoices(String(k.sharps), ["0", "1", "2", "3", "4", "5", "6"], id),
      meta: k,
    });
  }

  return cards;
}

export const TAG_LABELS = {
  barre:      "Barre chords",
  fretboard:  "Notes on the fretboard",
  intervals:  "Intervals",
  function:   "Chord functions",
  scales:     "Scale shapes",
  modes:      "Modes",
  keys:       "Key signatures",
};

// which categories want a guitar in your hands vs. fit in your head
// while you're walking the dog. used by the quiz screen's mode toggle.
export const TAG_PRACTICE = {
  barre:      "guitar",
  fretboard:  "guitar",
  scales:     "guitar",
  intervals:  "mental",
  function:   "mental",
  modes:      "mental",
  keys:       "mental",
};

export const PRACTICE_LABELS = {
  guitar: "with guitar",
  mental: "no guitar needed",
};

// content.js — index of static content + small helpers.
// the actual data lives in ./content/*.json so it can be edited without
// touching code (and later swapped for a fetched bundle).

import chords from "./content/chords.json";
import tabs from "./content/tabs.json";
import backing from "./content/backing.json";
import drills from "./content/drills.json";

export const CHORDS = chords;
export const TABS = tabs;
export const BACKING = backing;
export const DRILLS = drills;

export const SCALES = {
  em_pent_box1: { name: "Em pent · box 1", rootFret: 12 },
  em_pent_box2: { name: "Em pent · box 2", rootFret: 14 },
  em_pent_box3: { name: "Em pent · box 3", rootFret: 17 },
  em_pent_box4: { name: "Em pent · box 4", rootFret: 19 },
  em_pent_box5: { name: "Em pent · box 5", rootFret: 22 },
};

export const GUITAR_STRINGS = [
  { name: "E", octave: 2, freq: 82.41 },
  { name: "A", octave: 2, freq: 110.0 },
  { name: "D", octave: 3, freq: 146.83 },
  { name: "G", octave: 3, freq: 196.0 },
  { name: "B", octave: 3, freq: 246.94 },
  { name: "E", octave: 4, freq: 329.63 },
];

export const fmtTime = (mins) => {
  const m = Math.floor(mins);
  const s = Math.round((mins - m) * 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const NAMES = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];

export const freqToNote = (freq) => {
  if (!freq || freq < 30 || freq > 2000) return null;
  const semitones = 12 * Math.log2(freq / 440);
  const n = Math.round(semitones);
  const cents = Math.round((semitones - n) * 100);
  const name = NAMES[((n % 12) + 12) % 12];
  const octave = Math.floor((n + 9) / 12) + 4;
  return { name, octave, cents, freq };
};

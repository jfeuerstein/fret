// content.js — chord/scale/tab/backing library + helpers.

export const CHORDS = {
  C:    { name: 'C',    frets: [-1,3,2,0,1,0],   fingers: [0,3,2,0,1,0] },
  G:    { name: 'G',    frets: [3,2,0,0,3,3],    fingers: [3,2,0,0,4,4] },
  D:    { name: 'D',    frets: [-1,-1,0,2,3,2],  fingers: [0,0,0,1,3,2] },
  A:    { name: 'A',    frets: [-1,0,2,2,2,0],   fingers: [0,0,1,2,3,0] },
  E:    { name: 'E',    frets: [0,2,2,1,0,0],    fingers: [0,2,3,1,0,0] },
  F:    { name: 'F',    frets: [1,3,3,2,1,1],    fingers: [1,3,4,2,1,1] },
  Am:   { name: 'Am',   frets: [-1,0,2,2,1,0],   fingers: [0,0,2,3,1,0] },
  Dm:   { name: 'Dm',   frets: [-1,-1,0,2,3,1],  fingers: [0,0,0,2,3,1] },
  Em:   { name: 'Em',   frets: [0,2,2,0,0,0],    fingers: [0,2,3,0,0,0] },
  G7:   { name: 'G7',   frets: [3,2,0,0,0,1],    fingers: [3,2,0,0,0,1] },
  Em7:  { name: 'Em7',  frets: [0,2,0,0,0,0],    fingers: [0,2,0,0,0,0] },
  Cmaj7:{ name: 'Cmaj7',frets: [-1,3,2,0,0,0],   fingers: [0,3,2,0,0,0] },
  E5:   { name: 'E5',   frets: [0,2,2,-1,-1,-1], fingers: [0,1,2,0,0,0] },
  A5:   { name: 'A5',   frets: [-1,0,2,2,-1,-1], fingers: [0,0,1,2,0,0] },
  Bm:   { name: 'Bm',   frets: [-1,2,4,4,3,2],   fingers: [0,1,3,4,2,1] },
};

export const SCALES = {
  em_pent_box1: { name: 'Em pent · box 1', rootFret: 12 },
  em_pent_box2: { name: 'Em pent · box 2', rootFret: 14 },
  em_pent_box3: { name: 'Em pent · box 3', rootFret: 17 },
  em_pent_box4: { name: 'Em pent · box 4', rootFret: 19 },
  em_pent_box5: { name: 'Em pent · box 5', rootFret: 22 },
};

export const TABS = {
  chromatic: { name: 'chromatic 1234 ladder', bpm: 60, lines: [
    'e|---------------------|--1-2-3-4-|',
    'B|---------------------|1-2-3-4---|',
    'G|-----------1-2-3-4---|----------|',
    'D|---------1-2-3-4-----|----------|',
    'A|-1-2-3-4-------------|----------|',
    'E|1-2-3-4--------------|----------|',
  ]},
  spider: { name: 'spider walk · 1-3-2-4', bpm: 70, lines: [
    'D|-----------1-3-2-4---|',
    'A|---1-3-2-4-----------|',
    'E|1-3-2-4--------------|',
  ]},
  altpick: { name: 'alt pick · 16ths on a', bpm: 80, lines: [
    'A|-0-0-0-0-0-0-0-0-----|',
    '   ↓ ↑ ↓ ↑ ↓ ↑ ↓ ↑    ',
  ]},
  em_pent_box1: { name: 'em pent · box 1 (asc)', bpm: 90, lines: [
    'e|----------------------0-3-|',
    'B|----------------0-3-------|',
    'G|----------0-2-------------|',
    'D|------0-2-----------------|',
    'A|--0-2---------------------|',
    'E|0-3-----------------------|',
  ]},
};

export const BACKING = {
  em_groove: { name: 'em groove · 100bpm', key: 'em', bpm: 100, chords: ['Em', 'G', 'D', 'Am'],
    description: 'looping i-bIII-bVII-iv. classic minor pent. playground.' },
  am_slow:   { name: 'am slow burn · 80bpm', key: 'am', bpm: 80, chords: ['Am', 'F', 'C', 'G'],
    description: 'sad-boy progression. perfect for bends.' },
  e_blues:   { name: 'e blues shuffle · 90bpm', key: 'e', bpm: 90, chords: ['E', 'A', 'B'],
    description: 'standard 12-bar feel. swing the 8ths.' },
};

export const GUITAR_STRINGS = [
  { name: 'E', octave: 2, freq: 82.41 },
  { name: 'A', octave: 2, freq: 110.00 },
  { name: 'D', octave: 3, freq: 146.83 },
  { name: 'G', octave: 3, freq: 196.00 },
  { name: 'B', octave: 3, freq: 246.94 },
  { name: 'E', octave: 4, freq: 329.63 },
];

export const fmtTime = (mins) => {
  const m = Math.floor(mins);
  const s = Math.round((mins - m) * 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const freqToNote = (freq) => {
  if (!freq || freq < 30 || freq > 2000) return null;
  const semitones = 12 * Math.log2(freq / 440);
  const n = Math.round(semitones);
  const cents = Math.round((semitones - n) * 100);
  const names = ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#'];
  const name = names[((n % 12) + 12) % 12];
  const octave = Math.floor((n + 9) / 12) + 4;
  return { name, octave, cents, freq };
};

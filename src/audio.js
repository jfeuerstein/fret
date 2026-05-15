// audio.js — web audio engine. metronome / tuner / drone.
// each is its own singleton-ish module export.

let ctx = null;
function getCtx() {
  if (!ctx)
    ctx = new (
      window.AudioContext || window.webkitAudioContext
    )();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// ─── metronome ────────────────────────────────────────────────
export const metronome = (() => {
  let bpm = 90,
    beatsPerBar = 4,
    nextNoteTime = 0,
    beat = 0,
    timer = null;
  let running = false,
    onBeat = null,
    volume = 0.4;

  function click(time, accent) {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain).connect(c.destination);
    osc.type = "square";
    osc.frequency.value = accent ? 1500 : 1000;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(
      volume * (accent ? 1.0 : 0.7),
      time + 0.001,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      time + 0.05,
    );
    osc.start(time);
    osc.stop(time + 0.06);
  }

  function schedule() {
    const c = getCtx();
    while (nextNoteTime < c.currentTime + 0.12) {
      click(nextNoteTime, beat === 0);
      const fireAt = nextNoteTime;
      const delay = Math.max(
        0,
        (fireAt - c.currentTime) * 1000,
      );
      const b = beat;
      setTimeout(() => onBeat && onBeat(b), delay);
      nextNoteTime += 60 / bpm;
      beat = (beat + 1) % beatsPerBar;
    }
  }

  return {
    start(b, cb) {
      if (b) bpm = b;
      if (cb) onBeat = cb;
      if (running) return;
      running = true;
      const c = getCtx();
      nextNoteTime = c.currentTime + 0.05;
      beat = 0;
      timer = setInterval(schedule, 25);
    },
    stop() {
      running = false;
      if (timer) clearInterval(timer);
      timer = null;
    },
    setBpm(b) {
      bpm = b;
    },
    setOnBeat(cb) {
      onBeat = cb;
    },
    get running() {
      return running;
    },
    get bpm() {
      return bpm;
    },
  };
})();

// ─── tuner ────────────────────────────────────────────────────
export const tuner = (() => {
  let stream = null,
    analyser = null,
    raf = null,
    onPitch = null,
    buffer = null;

  function detect(buf, sampleRate) {
    const SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;
    let r1 = 0,
      r2 = SIZE - 1,
      thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++)
      if (Math.abs(buf[i]) < thres) {
        r1 = i;
        break;
      }
    for (let i = 1; i < SIZE / 2; i++)
      if (Math.abs(buf[SIZE - i]) < thres) {
        r2 = SIZE - i;
        break;
      }
    const trimmed = buf.slice(r1, r2);
    const T = trimmed.length;
    const c = new Array(T).fill(0);
    for (let i = 0; i < T; i++)
      for (let j = 0; j < T - i; j++)
        c[i] += trimmed[j] * trimmed[j + i];
    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1,
      maxpos = -1;
    for (let i = d; i < T; i++)
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    let T0 = maxpos;
    const x1 = c[T0 - 1] || 0,
      x2 = c[T0],
      x3 = c[T0 + 1] || 0;
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 -= b / (2 * a);
    return sampleRate / T0;
  }

  return {
    async start(cb) {
      onPitch = cb;
      if (raf) return;
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const c = getCtx();
      const src = c.createMediaStreamSource(stream);
      analyser = c.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      buffer = new Float32Array(analyser.fftSize);
      const tick = () => {
        analyser.getFloatTimeDomainData(buffer);
        const f = detect(buffer, c.sampleRate);
        if (f > 0 && onPitch) onPitch(f);
        raf = requestAnimationFrame(tick);
      };
      tick();
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      if (stream)
        stream.getTracks().forEach((t) => t.stop());
      stream = null;
      analyser = null;
      onPitch = null;
    },
    get running() {
      return !!raf;
    },
  };
})();

// ─── drone / backing track ────────────────────────────────────
export const drone = (() => {
  const noteFreqs = {
    C: 261.63,
    "C#": 277.18,
    D: 293.66,
    "D#": 311.13,
    E: 329.63,
    F: 349.23,
    "F#": 369.99,
    G: 392.0,
    "G#": 415.3,
    A: 440.0,
    "A#": 466.16,
    B: 493.88,
  };
  const chordIntervals = {
    maj: [0, 4, 7],
    min: [0, 3, 7],
    5: [0, 7],
    7: [0, 4, 7, 10],
    m7: [0, 3, 7, 10],
  };

  function parseChord(name) {
    const m = name.match(/^([A-G][#b]?)(.*)$/);
    if (!m) return null;
    const root = m[1].replace("b", "#");
    const tail = m[2];
    let qual = "maj";
    if (tail === "m") qual = "min";
    else if (tail === "7") qual = "7";
    else if (tail === "m7") qual = "m7";
    else if (tail === "5") qual = "5";
    const f = noteFreqs[root];
    if (!f) return null;
    return {
      root,
      freq: f,
      intervals: chordIntervals[qual] || chordIntervals.maj,
    };
  }

  let stopFn = null,
    running = false;
  return {
    start(track) {
      if (running) return;
      running = true;
      const c = getCtx();
      const master = c.createGain();
      master.gain.value = 0.18;
      master.connect(c.destination);
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1800;
      lp.connect(master);

      let t = c.currentTime + 0.1;
      const beatLen = 60 / track.bpm;
      const barLen = beatLen * 4;

      function playChord(name, startT, dur) {
        const chord = parseChord(name);
        if (!chord) return;
        chord.intervals.forEach((semis) => {
          const f =
            (chord.freq * Math.pow(2, semis / 12)) / 2;
          const o = c.createOscillator();
          const g = c.createGain();
          o.type = "triangle";
          o.frequency.value = f;
          const peak = 0.4 / chord.intervals.length;
          g.gain.setValueAtTime(0, startT);
          g.gain.linearRampToValueAtTime(
            peak,
            startT + 0.05,
          );
          g.gain.linearRampToValueAtTime(
            peak * 0.7,
            startT + dur * 0.6,
          );
          g.gain.linearRampToValueAtTime(0, startT + dur);
          o.connect(g).connect(lp);
          o.start(startT);
          o.stop(startT + dur + 0.05);
        });
        for (let beat = 0; beat < 4; beat++) {
          const bt = startT + beat * beatLen;
          if (beat === 0 || beat === 2) {
            const k = c.createOscillator();
            const kg = c.createGain();
            k.frequency.setValueAtTime(120, bt);
            k.frequency.exponentialRampToValueAtTime(
              40,
              bt + 0.12,
            );
            kg.gain.setValueAtTime(0.5, bt);
            kg.gain.exponentialRampToValueAtTime(
              0.001,
              bt + 0.18,
            );
            k.connect(kg).connect(master);
            k.start(bt);
            k.stop(bt + 0.2);
          }
        }
      }

      let cancelled = false,
        idx = 0;
      function scheduleNext() {
        if (cancelled) return;
        const c2 = getCtx();
        while (t < c2.currentTime + 0.3) {
          playChord(
            track.chords[idx % track.chords.length],
            t,
            barLen,
          );
          t += barLen;
          idx++;
        }
        setTimeout(scheduleNext, 100);
      }
      scheduleNext();

      stopFn = () => {
        cancelled = true;
        master.gain.linearRampToValueAtTime(
          0,
          c.currentTime + 0.3,
        );
        running = false;
      };
    },
    stop() {
      if (stopFn) stopFn();
      stopFn = null;
      running = false;
    },
    get running() {
      return running;
    },
  };
})();

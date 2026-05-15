// wireframe.jsx — small svg wireframe accents
// pure svg, stroke-only, with optional psx-style jitter via css.
// designed to slot into the tape design as quiet decorative elements.

import { useState, useEffect } from 'react';

const wireStyle = `
  @keyframes wfRotate {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes wfRotateY {
    from { transform: rotateY(0deg); }
    to   { transform: rotateY(360deg); }
  }
  @keyframes wfJitter {
    0%   { transform: translate(0, 0); }
    25%  { transform: translate(0.5px, -0.5px); }
    50%  { transform: translate(-0.5px, 0.5px); }
    75%  { transform: translate(0.5px, 0.5px); }
    100% { transform: translate(0, 0); }
  }
  .wf-jitter { animation: wfJitter 0.18s steps(1) infinite; }
  .wf-spin { animation: wfRotate 8s linear infinite; transform-origin: center; }
  .wf-spin-fast { animation: wfRotate 3s linear infinite; transform-origin: center; }
  .wf-3d { transform-style: preserve-3d; perspective: 400px; }
  .wf-y { animation: wfRotateY 8s linear infinite; transform-style: preserve-3d; }
  .wf-pixel { image-rendering: pixelated; image-rendering: crisp-edges; }
`;
if (!document.getElementById('wf-style')) {
  const s = document.createElement('style');
  s.id = 'wf-style';
  s.textContent = wireStyle;
  document.head.appendChild(s);
}

// ── icosahedron-ish wireframe orb. lo-poly look. ─────────────
function WfOrb({ size = 80, color = '#999', spin = true, jitter = true, accent = null }) {
  // 12-vertex icosahedron projected to 2d. precomputed.
  const phi = 1.618;
  const verts3d = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
  ];
  const edges = [
    [0,1],[0,5],[0,7],[0,10],[0,11],
    [1,5],[1,7],[1,8],[1,9],
    [2,3],[2,4],[2,6],[2,10],[2,11],
    [3,4],[3,6],[3,8],[3,9],
    [4,5],[4,9],[4,11],
    [5,9],[5,11],
    [6,7],[6,8],[6,10],
    [7,8],[7,10],
    [8,9],
    [10,11],
  ];
  const proj = verts3d.map(([x, y, z]) => [x, y]); // ortho projection
  const r = size * 0.35;
  return (
    <svg width={size} height={size} viewBox={`-${size/2} -${size/2} ${size} ${size}`}
      className={`${spin ? 'wf-spin' : ''} ${jitter ? 'wf-jitter' : ''}`}
      style={{ display: 'block' }}
    >
      {edges.map(([a, b], i) => (
        <line key={i}
          x1={proj[a][0] * r / phi} y1={proj[a][1] * r / phi}
          x2={proj[b][0] * r / phi} y2={proj[b][1] * r / phi}
          stroke={color} strokeWidth="1"
        />
      ))}
      {accent && <circle r={size * 0.04} fill={accent}/>}
    </svg>
  );
}

// ── wireframe cassette · iso view ─────────────────────────────
function WfCassette({ width = 180, height = 110, color = '#555', accent = '#999' }) {
  // simple iso cassette w/ two reels visible
  return (
    <svg width={width} height={height} viewBox="0 0 180 110" style={{ display: 'block' }}>
      {/* outer body */}
      <path d="M 12 20 L 168 20 L 172 30 L 172 95 L 168 100 L 12 100 L 8 95 L 8 30 Z"
        fill="none" stroke={color} strokeWidth="1.2"/>
      {/* label window */}
      <path d="M 22 30 L 158 30 L 158 55 L 22 55 Z" fill="none" stroke={color} strokeWidth="1"/>
      {/* hub windows */}
      <circle cx="55" cy="78" r="14" fill="none" stroke={color} strokeWidth="1"/>
      <circle cx="125" cy="78" r="14" fill="none" stroke={color} strokeWidth="1"/>
      {/* reels (animated) */}
      <g style={{ transformOrigin: '55px 78px', animation: 'wfRotate 4s linear infinite' }}>
        <circle cx="55" cy="78" r="6" fill="none" stroke={accent} strokeWidth="1"/>
        <line x1="49" y1="78" x2="61" y2="78" stroke={accent} strokeWidth="1"/>
        <line x1="55" y1="72" x2="55" y2="84" stroke={accent} strokeWidth="1"/>
      </g>
      <g style={{ transformOrigin: '125px 78px', animation: 'wfRotate 4s linear infinite' }}>
        <circle cx="125" cy="78" r="6" fill="none" stroke={accent} strokeWidth="1"/>
        <line x1="119" y1="78" x2="131" y2="78" stroke={accent} strokeWidth="1"/>
        <line x1="125" y1="72" x2="125" y2="84" stroke={accent} strokeWidth="1"/>
      </g>
      {/* tape line between hubs */}
      <line x1="69" y1="68" x2="111" y2="68" stroke={color} strokeWidth="0.8" strokeDasharray="2,2"/>
      {/* screw dots */}
      <circle cx="14" cy="26" r="0.8" fill={color}/>
      <circle cx="166" cy="26" r="0.8" fill={color}/>
      <circle cx="14" cy="94" r="0.8" fill={color}/>
      <circle cx="166" cy="94" r="0.8" fill={color}/>
    </svg>
  );
}

// ── wireframe headstock (electric, 6-in-line strat-style) ─────
function WfHeadstock({ width = 80, height = 140, color = '#666' }) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 140" style={{ display: 'block' }}>
      {/* neck stub */}
      <path d="M 30 130 L 50 130 L 50 110 L 30 110 Z" fill="none" stroke={color} strokeWidth="1"/>
      {/* nut */}
      <line x1="28" y1="110" x2="52" y2="110" stroke={color} strokeWidth="1.5"/>
      {/* headstock outline */}
      <path d="M 30 110 L 24 100 L 18 92 L 14 80 L 12 65 L 14 48 L 20 32 L 30 20 L 44 12 L 56 14 L 60 22 L 58 30 L 50 36 L 44 44 L 42 58 L 44 72 L 48 88 L 50 100 L 50 110 Z"
        fill="none" stroke={color} strokeWidth="1.2"/>
      {/* tuning pegs (6 in-line) */}
      {[28, 48, 68, 88].map(y => (
        <g key={y}>
          <circle cx="22" cy={y} r="3" fill="none" stroke={color} strokeWidth="0.8"/>
          <line x1="14" y1={y} x2="22" y2={y} stroke={color} strokeWidth="0.8"/>
        </g>
      ))}
      <circle cx="40" cy="32" r="3" fill="none" stroke={color} strokeWidth="0.8"/>
      <circle cx="50" cy="50" r="3" fill="none" stroke={color} strokeWidth="0.8"/>
      {/* strings */}
      {[33, 37, 40, 43, 46, 49].map((x, i) => (
        <line key={i} x1={x} y1="110" x2={x + (i - 2.5) * 0.5} y2="138" stroke={color} strokeWidth="0.5" opacity="0.7"/>
      ))}
    </svg>
  );
}

// ── wireframe fretboard slice (used as decoration in tracklists) ──
function WfFretSlice({ width = 200, height = 50, frets = 5, color = '#555', dots = [] }) {
  const stringCount = 6;
  const fretW = width / frets;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {/* strings */}
      {Array.from({ length: stringCount }).map((_, i) => (
        <line key={i}
          x1="0" y1={(i + 0.5) * (height / stringCount)}
          x2={width} y2={(i + 0.5) * (height / stringCount)}
          stroke={color} strokeWidth={i < 3 ? 1 : 0.6} opacity="0.7"
        />
      ))}
      {/* frets */}
      {Array.from({ length: frets + 1 }).map((_, i) => (
        <line key={i}
          x1={i * fretW} y1="0" x2={i * fretW} y2={height}
          stroke={color} strokeWidth={i === 0 ? 2 : 0.8}
        />
      ))}
      {/* dots */}
      {dots.map(([s, f], i) => (
        <circle key={i}
          cx={(f - 0.5) * fretW}
          cy={(s + 0.5) * (height / stringCount)}
          r="3" fill={color}
        />
      ))}
    </svg>
  );
}

// ── wireframe waveform · animated; used during tuner/idle states ──
function WfWave({ width = 200, height = 40, color = '#666', active = true }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf;
    const loop = () => { setT(x => x + 1); raf = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [active]);
  const points = [];
  for (let x = 0; x <= width; x += 4) {
    const a = active ? Math.sin((x + t) / 8) * 0.3 + Math.sin((x + t * 1.7) / 14) * 0.5 : 0;
    points.push(`${x},${height/2 + a * height/2.5}`);
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="1"/>
    </svg>
  );
}

// ── chord diagram · 6-string vertical, 4-fret window ──────────
function ChordDiagram({ chord, size = 'md', color = '#e0e0e0', muted = '#444' }) {
  const w = size === 'sm' ? 60 : size === 'lg' ? 110 : 84;
  const h = w * 1.2;
  if (!chord) return null;
  const frets = chord.frets;
  const stringCount = 6;
  // determine starting fret: if any fret > 4, shift window
  const playedFrets = frets.filter(f => f > 0);
  const minFret = playedFrets.length ? Math.min(...playedFrets) : 1;
  const startFret = minFret > 4 ? minFret : 1;
  const visibleFrets = 4;

  const padX = w * 0.12;
  const padTop = h * 0.18;
  const padBot = h * 0.06;
  const usableW = w - padX * 2;
  const usableH = h - padTop - padBot;
  const stringSpacing = usableW / (stringCount - 1);
  const fretSpacing = usableH / visibleFrets;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {/* mute / open markers on top */}
      {frets.map((f, i) => {
        const x = padX + i * stringSpacing;
        const y = padTop - 8;
        if (f === -1) return <text key={i} x={x} y={y} fontSize={w*0.13} fill={muted} textAnchor="middle" fontFamily="Courier New, monospace">x</text>;
        if (f === 0) return <circle key={i} cx={x} cy={y} r={w*0.05} fill="none" stroke={color} strokeWidth="1"/>;
        return null;
      })}

      {/* nut (bold line at top if startFret === 1) */}
      {startFret === 1 && (
        <line x1={padX - 2} y1={padTop} x2={padX + usableW + 2} y2={padTop} stroke={color} strokeWidth="2"/>
      )}
      {/* fret indicator label */}
      {startFret > 1 && (
        <text x={padX - 6} y={padTop + fretSpacing * 0.7} fontSize={w*0.14} fill={muted} textAnchor="end" fontFamily="Courier New, monospace">{startFret}fr</text>
      )}

      {/* fret lines */}
      {Array.from({ length: visibleFrets + 1 }).map((_, i) => (
        <line key={`f${i}`}
          x1={padX} y1={padTop + i * fretSpacing}
          x2={padX + usableW} y2={padTop + i * fretSpacing}
          stroke={color} strokeWidth={i === 0 && startFret === 1 ? 0 : 0.8} opacity="0.6"
        />
      ))}
      {/* strings */}
      {Array.from({ length: stringCount }).map((_, i) => (
        <line key={`s${i}`}
          x1={padX + i * stringSpacing} y1={padTop}
          x2={padX + i * stringSpacing} y2={padTop + usableH}
          stroke={color} strokeWidth="0.8" opacity="0.7"
        />
      ))}

      {/* dots */}
      {frets.map((f, i) => {
        if (f <= 0) return null;
        const offset = f - startFret + 1;
        if (offset < 1 || offset > visibleFrets) return null;
        const x = padX + i * stringSpacing;
        const y = padTop + (offset - 0.5) * fretSpacing;
        return (
          <g key={`d${i}`}>
            <circle cx={x} cy={y} r={w*0.075} fill={color}/>
            {chord.fingers && chord.fingers[i] > 0 && (
              <text x={x} y={y + w*0.03} fontSize={w*0.11} fill="#0a0a0a" textAnchor="middle" fontFamily="Courier New, monospace" fontWeight="bold">
                {chord.fingers[i]}
              </text>
            )}
          </g>
        );
      })}

      {/* chord name */}
      <text x={w/2} y={h - 2} fontSize={w*0.16} fill={color} textAnchor="middle" fontFamily="Courier New, monospace">
        {chord.name}
      </text>
    </svg>
  );
}

window.WfOrb = WfOrb;
window.WfCassette = WfCassette;
window.WfHeadstock = WfHeadstock;
window.WfFretSlice = WfFretSlice;
window.WfWave = WfWave;
window.ChordDiagram = ChordDiagram;

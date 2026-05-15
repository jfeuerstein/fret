// tuner.jsx — pitch detector. medians 8 frames before display.

import { useEffect, useRef, useState } from "react";
import { GUITAR_STRINGS, freqToNote } from "../content.js";
import { tuner } from "../audio.js";
import { Btn, Header, Section } from "../components/atoms.jsx";
import { WfOrb, WfWave } from "../components/wireframe.jsx";
import { c, screenStyle } from "../theme.js";

export function TunerScreen() {
  const [permission, setPermission] = useState("idle");
  const [smoothPitch, setSmoothPitch] = useState(null);
  const pitchHistory = useRef([]);

  const start = async () => {
    try {
      await tuner.start((freq) => {
        const h = pitchHistory.current;
        h.push(freq);
        if (h.length > 8) h.shift();
        const sorted = [...h].sort((a, b) => a - b);
        setSmoothPitch(sorted[Math.floor(sorted.length / 2)]);
      });
      setPermission("granted");
    } catch {
      setPermission("denied");
    }
  };

  useEffect(() => () => tuner.stop(), []);

  const note = smoothPitch ? freqToNote(smoothPitch) : null;
  const closest = note && smoothPitch
    ? GUITAR_STRINGS.reduce(
        (best, s) => {
          const cents = Math.abs(1200 * Math.log2(smoothPitch / s.freq));
          return cents < best.cents ? { s, cents } : best;
        },
        { s: null, cents: Infinity },
      )
    : null;

  return (
    <div style={screenStyle}>
      <Header left="TOOLS · TUNER" right="A=440Hz" />
      <div style={{ fontSize: 22, marginBottom: 6 }}>tuner</div>
      <div style={{ color: c.dim, fontSize: 12, marginBottom: 18 }}>
        play one string at a time. give it a sec.
      </div>

      {permission === "idle" && (
        <div style={{ border: `1px solid ${c.border}`, padding: "24px 16px", textAlign: "center", marginBottom: 16 }}>
          <div style={{ marginBottom: 14, display: "flex", justifyContent: "center" }}>
            <WfOrb size={70} color={c.muted} accent={c.amber} />
          </div>
          <div style={{ color: c.dim, fontSize: 12, marginBottom: 14, lineHeight: 1.5 }}>
            this'll need your mic for a sec.<br />we don't keep the audio.
          </div>
          <Btn variant="solid" onClick={start}>▷ enable mic</Btn>
        </div>
      )}

      {permission === "denied" && (
        <div style={{ border: `1px solid ${c.red}`, padding: "14px 16px", color: c.red, fontSize: 12, marginBottom: 16 }}>
          mic blocked. check browser settings, then refresh.
        </div>
      )}

      {permission === "granted" && (
        <>
          <div style={{ border: `1px solid ${c.border}`, padding: "24px 16px", textAlign: "center", marginBottom: 16 }}>
            <div style={{ color: c.muted, fontSize: 10, letterSpacing: 3, marginBottom: 8 }}>
              {closest ? `TARGET · ${closest.s.name}${closest.s.octave}` : "LISTENING"}
            </div>
            <div style={{
              fontSize: 80, lineHeight: 1, letterSpacing: 2,
              color: note
                ? Math.abs(note.cents) < 5 ? c.green
                : Math.abs(note.cents) < 15 ? c.amber
                : c.fg
                : c.faint,
              transition: "color 0.15s",
            }}>
              {note ? `${note.name}${note.octave}` : "— —"}
            </div>
            <div style={{ color: c.muted, fontSize: 11, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
              {smoothPitch ? `${smoothPitch.toFixed(1)} Hz` : "no signal"}
            </div>

            <div style={{ marginTop: 18, position: "relative" }}>
              <div style={{ height: 4, background: c.faint, position: "relative" }}>
                <div style={{ position: "absolute", left: "50%", top: -4, bottom: -4, width: 1, background: c.fg }} />
                {note && (
                  <div style={{
                    position: "absolute",
                    top: -6,
                    height: 16,
                    width: 3,
                    left: `calc(50% + ${Math.max(-50, Math.min(50, note.cents)) * 0.9}%)`,
                    background: Math.abs(note.cents) < 5 ? c.green : c.amber,
                    transform: "translateX(-50%)",
                    transition: "left 0.1s, background 0.1s",
                  }} />
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: c.muted, fontSize: 10, marginTop: 6, letterSpacing: 1 }}>
                <span>−50¢</span><span>0</span><span>+50¢</span>
              </div>
            </div>

            {note && (
              <div style={{ marginTop: 12, color: Math.abs(note.cents) < 5 ? c.green : c.muted, fontSize: 11, letterSpacing: 2 }}>
                {Math.abs(note.cents) < 5 ? "✓ in tune"
                  : note.cents > 0 ? `↓ flatten ${note.cents}¢`
                  : `↑ tighten ${-note.cents}¢`}
              </div>
            )}
          </div>

          <div style={{ border: `1px solid ${c.border}`, padding: "10px 12px", marginBottom: 16, background: c.panel }}>
            <div style={{ color: c.muted, fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>SIGNAL</div>
            <WfWave width={320} height={36} color={c.amber} active />
          </div>

          <Section title="STRINGS · LOW → HIGH">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }}>
              {GUITAR_STRINGS.map((s, i) => {
                const isClosest = closest && closest.s === s;
                return (
                  <div key={i} style={{
                    border: `1px solid ${isClosest ? c.amber : c.border}`,
                    padding: "8px 0",
                    textAlign: "center",
                    background: isClosest ? c.panel : "transparent",
                  }}>
                    <div style={{ fontSize: 14, color: isClosest ? c.amber : c.fg }}>
                      {s.name}{s.octave}
                    </div>
                    <div style={{ color: c.muted, fontSize: 9, fontVariantNumeric: "tabular-nums" }}>
                      {s.freq.toFixed(0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          <div style={{ marginTop: 16 }}>
            <Btn size="sm" onClick={() => {
              tuner.stop();
              setPermission("idle");
              setSmoothPitch(null);
            }}>
              ⏸ stop tuner
            </Btn>
          </div>
        </>
      )}
    </div>
  );
}

// settings.jsx — push opt-in, sync status, profile reset.

import { useEffect, useState } from "react";
import { Store, useStore } from "../store.js";
import { generateWeek } from "../generator.js";
import { usePush } from "../usePush.js";
import { isSyncEnabled } from "../sync.js";
import { Btn, Header, Section } from "../components/atoms.jsx";
import { c, screenStyle } from "../theme.js";

export function SettingsScreen() {
  const profile = useStore((s) => s.profile);
  const clientId = useStore((s) => s.clientId);
  const lastPracticed = useStore((s) => s.lastPracticed);
  const push = usePush();
  const [pushErr, setPushErr] = useState(null);
  const [syncOn, setSyncOn] = useState(false);

  useEffect(() => { setSyncOn(isSyncEnabled()); }, []);

  const subscribe = async () => {
    setPushErr(null);
    try { await push.subscribe(); }
    catch (e) { setPushErr(e.message); }
  };

  return (
    <div style={screenStyle}>
      <Header left="SETTINGS" right={profile?.experience?.toUpperCase() || ""} />
      <div style={{ fontSize: 22, marginBottom: 18 }}>settings</div>

      <Section title="REMINDERS">
        {!push.supported ? (
          <Info>push notifications aren't supported in this browser.</Info>
        ) : push.subscription ? (
          <>
            <Info color={c.green}>✓ subscribed. cron skips you on days you practice.</Info>
            <Btn size="sm" onClick={push.unsubscribe}>🔕 disable reminders</Btn>
          </>
        ) : (
          <>
            <Info>get a daily nudge if you haven't practiced yet.</Info>
            {pushErr && <Info color={c.red}>error: {pushErr}</Info>}
            <Btn variant="accent" onClick={subscribe}>🔔 enable reminders</Btn>
          </>
        )}
      </Section>

      <Section title="ROUTINE">
        <Field label="session length"  value={`${profile?.sessionLength}m`} />
        <Field label="days per week"   value={`${profile?.daysPerWeek}`} />
        <Field label="focuses"         value={(profile?.focuses || []).join(", ")} />
        <Field label="last practiced"  value={lastPracticed || "—"} />
        <div style={{ marginTop: 10 }}>
          <Btn size="sm" onClick={() => {
            if (!profile) return;
            Store.setWeek(generateWeek({
              daysPerWeek: profile.daysPerWeek,
              sessionLength: profile.sessionLength,
              focuses: profile.focuses,
            }));
          }}>
            ↺ regenerate this week
          </Btn>
        </div>
      </Section>

      <Section title="SYNC">
        {syncOn ? (
          <Info color={c.green}>✓ cloud sync enabled (supabase).</Info>
        ) : (
          <Info>
            local only. set <Code>VITE_SUPABASE_URL</Code> + <Code>VITE_SUPABASE_ANON_KEY</Code>{" "}
            and <Code>npm i @supabase/supabase-js</Code> to sync across devices.
          </Info>
        )}
        <Field label="device id" value={clientId?.slice(0, 8) + "…"} />
      </Section>

      <Section title="DANGER ZONE" mt={22}>
        <Btn size="sm" variant="danger" onClick={() => {
          if (confirm("wipe everything? local data gone.")) {
            Store.reset();
            location.reload();
          }
        }}>
          ↺ reset everything
        </Btn>
      </Section>
    </div>
  );
}

function Info({ children, color = c.dim }) {
  return (
    <div style={{ color, fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>
      {children}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      borderBottom: `1px dashed ${c.border}`,
      padding: "8px 0",
      fontSize: 12,
    }}>
      <span style={{ color: c.muted, letterSpacing: 1 }}>{label}</span>
      <span style={{ color: c.fg, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

function Code({ children }) {
  return (
    <code style={{
      background: c.panel2,
      padding: "1px 5px",
      border: `1px solid ${c.border}`,
      fontSize: 11,
    }}>{children}</code>
  );
}

// atoms.jsx — shared UI primitives. theme tokens come from ../theme.js.

import { useState } from "react";
import { baseFont, c } from "../theme.js";

export function Btn({
  children, onClick, variant = "ghost", full = true, size = "md",
  disabled = false, style,
}) {
  const [hover, setHover] = useState(false);
  const variants = {
    ghost:   { bg: "transparent", fg: c.fg,    br: c.border, hbg: c.fg,    hfg: c.bg },
    solid:   { bg: c.fg,          fg: c.bg,    br: c.fg,     hbg: c.dim,   hfg: c.bg },
    accent:  { bg: "transparent", fg: c.amber, br: c.amber,  hbg: c.amber, hfg: c.bg },
    success: { bg: c.green,       fg: c.bg,    br: c.green,  hbg: c.fg,    hfg: c.bg },
    danger:  { bg: "transparent", fg: c.red,   br: c.red,    hbg: c.red,   hfg: c.bg },
  };
  const v = variants[variant];
  const pad = size === "lg" ? "16px 18px" : size === "sm" ? "8px 10px" : "12px 14px";
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={disabled}
      style={{
        background: hover && !disabled ? v.hbg : v.bg,
        color: hover && !disabled ? v.hfg : v.fg,
        border: `1px solid ${hover && !disabled ? v.hbg : v.br}`,
        padding: pad,
        font: "inherit",
        fontFamily: baseFont,
        fontSize: size === "lg" ? 14 : size === "sm" ? 11 : 13,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        width: full ? "100%" : "auto",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        borderRadius: 0,
        transition: "all 0.12s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Header({ left, right, mb = 14 }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: mb }}>
      <div style={{ color: c.muted, fontSize: 10, letterSpacing: 3 }}>{left}</div>
      <div style={{ color: c.muted, fontSize: 10, letterSpacing: 2 }}>{right}</div>
    </div>
  );
}

export function Section({ title, right, children, mt = 18 }) {
  return (
    <div style={{ marginTop: mt }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        color: c.muted, fontSize: 10, letterSpacing: 2, marginBottom: 8,
      }}>
        <span>{title}</span>
        {right && <span>{right}</span>}
      </div>
      {children}
    </div>
  );
}

export function Mini({ label, value, accent }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ color: c.muted, fontSize: 9, letterSpacing: 1.5, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{
        fontSize: 16,
        color: accent ? c.amber : c.fg,
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>
    </div>
  );
}

export function Reels({ size = 50, spinning = true }) {
  const Reel = ({ delay = 0 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      style={{
        animation: spinning ? `cSpin 3s linear infinite` : "none",
        animationDelay: `${delay}s`,
      }}
    >
      <circle cx="25" cy="25" r="22" fill="none" stroke={c.faint} strokeWidth="1.5" />
      <circle cx="25" cy="25" r="6" fill={c.faint} />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line
          key={deg}
          x1="25" y1="25"
          x2={25 + Math.cos((deg * Math.PI) / 180) * 18}
          y2={25 + Math.sin((deg * Math.PI) / 180) * 18}
          stroke={c.faint} strokeWidth="1.5"
        />
      ))}
      <circle cx="25" cy="8" r="2" fill={c.muted} />
    </svg>
  );
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Reel />
      <Reel delay={-1.5} />
      <style>{`@keyframes cSpin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export const knobBtn = {
  flex: 1,
  background: "transparent",
  color: c.fg,
  border: `1px solid ${c.border}`,
  padding: "8px 0",
  font: "inherit",
  fontFamily: baseFont,
  fontSize: 13,
  letterSpacing: 1,
  cursor: "pointer",
};

export const transport = {
  background: "transparent",
  color: c.fg,
  border: `1px solid ${c.border}`,
  padding: "14px 0",
  font: "inherit",
  fontFamily: baseFont,
  fontSize: 16,
  cursor: "pointer",
  letterSpacing: 2,
};

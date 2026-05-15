// modal.jsx — bottom-sheet style modal + a Confirm built on top.
// replaces window.confirm() / window.alert() so we get themed,
// touch-friendly dialogs that respect iPhone safe areas.

import { useEffect } from "react";
import { Btn } from "./atoms.jsx";
import { baseFont, c } from "../theme.js";

export function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        animation: "fretFadeIn 0.18s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: c.panel,
          border: `1px solid ${c.border}`,
          borderBottom: "none",
          padding: 22,
          maxWidth: 460,
          width: "100%",
          boxSizing: "border-box",
          color: c.fg,
          fontFamily: baseFont,
          fontSize: 13,
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 22px)",
          animation: "fretSlideUp 0.22s ease-out",
        }}
      >
        {children}
      </div>
      <style>{`
        @keyframes fretFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fretSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

export function Confirm({
  open,
  title,
  body,
  confirmLabel = "yes",
  cancelLabel = "cancel",
  destructive = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div style={{ fontSize: 18, marginBottom: 8 }}>{title}</div>
      {body && <div style={{ color: c.dim, fontSize: 13, marginBottom: 18, lineHeight: 1.5 }}>{body}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Btn onClick={onCancel}>{cancelLabel}</Btn>
        </div>
        <div style={{ flex: 1 }}>
          <Btn variant={destructive ? "danger" : "solid"} onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </div>
    </Modal>
  );
}

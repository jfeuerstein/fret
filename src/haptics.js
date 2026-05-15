// haptics.js — thin wrapper over navigator.vibrate.
// android: works in chrome. ios: no support (apple still won't ship it
// for PWAs as of 2026). degrades to a no-op everywhere else.

function v(pattern) {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  try { navigator.vibrate(pattern); } catch {}
}

export const haptics = {
  tap:     () => v(8),
  bump:    () => v(15),
  success: () => v([10, 40, 20]),
  fail:    () => v(80),
  done:    () => v([20, 60, 20, 60, 30]),
};

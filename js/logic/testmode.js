// The owner's hidden test mode: a sandbox. Entering copies the real save into
// a separate test save and the game plays on the copy; the real save (garden,
// streak, flowers, sculptures, stats) is never written while test mode is on.
// Leaving drops the copy and the game reads the real save again, exactly as
// it was. The stats page reads only the real save, so test play is never
// counted. Test mode also lets the owner pretend it is a later day (an offset
// added to "today", only inside test mode).
//
// Storage is passed in (the browser's localStorage and sessionStorage, or
// plain objects in the tests). The test save and the mode live in session
// storage, so closing the tab also leaves test mode.

import { newRound, tap, exposedTiles } from "./engine.js";

export const MODE_KEY = "petal-patch.test-mode";
export const TEST_SAVE_KEY = "petal-patch.test-save";

export function readMode(session) {
  try {
    const m = JSON.parse(session.getItem(MODE_KEY));
    return m && m.on ? { on: true, offset: Number(m.offset) || 0 } : null;
  } catch (e) {
    return null;
  }
}

// Start test mode with a copy of the real save (or nothing, if there is none).
export function enter(local, session, realKey) {
  const raw = local.getItem(realKey);
  session.setItem(TEST_SAVE_KEY, raw == null ? "null" : raw);
  session.setItem(MODE_KEY, JSON.stringify({ on: true, offset: 0 }));
  return readMode(session);
}

// Leave test mode: the copy goes, the real save was never touched.
export function exit(session) {
  session.removeItem(TEST_SAVE_KEY);
  session.removeItem(MODE_KEY);
}

export function setOffset(session, offset) {
  const m = readMode(session);
  if (!m) return null;
  session.setItem(MODE_KEY, JSON.stringify({ on: true, offset: Math.max(0, Math.round(offset)) }));
  return readMode(session);
}

// The saved text the game should read now, and where a save goes.
export function loadRaw(local, session, realKey) {
  return readMode(session) ? session.getItem(TEST_SAVE_KEY) : local.getItem(realKey);
}

export function saveRaw(local, session, realKey, text) {
  if (readMode(session)) session.setItem(TEST_SAVE_KEY, text);
  else local.setItem(realKey, text);
}

// "Today" for the game: the real day, plus the pretend offset in test mode.
export function gameDay(realDay, mode) {
  return realDay + (mode ? mode.offset : 0);
}

// Five taps within two seconds opens it. times: earlier tap times (ms).
export function titleTap(times, now, { count = 5, within = 2000 } = {}) {
  const recent = times.filter((t) => now - t < within).concat(now);
  if (recent.length >= count) return { times: [], open: true };
  return { times: recent, open: false };
}

// A way to lose a board: fill the tray without ever making three alike
// (a short search, so it works on every board).
export function losingTaps(deal, { nodeLimit = 50000 } = {}) {
  let nodes = 0;
  const taps = [];
  function go(s) {
    if (s.status === "lost") return true;
    if (s.status !== "playing" || ++nodes > nodeLimit) return false;
    const held = {};
    for (const t of s.tray) held[deal.cells[t].sym] = (held[deal.cells[t].sym] || 0) + 1;
    const ex = exposedTiles(deal, s.taken).filter((t) => (held[deal.cells[t].sym] || 0) < 2);
    ex.sort((a, b) => (held[deal.cells[a].sym] || 0) - (held[deal.cells[b].sym] || 0));
    for (const t of ex) {
      taps.push(t);
      if (go(tap(deal, s, t).state)) return true;
      taps.pop();
    }
    return false;
  }
  return go(newRound(deal)) ? taps.slice() : null;
}

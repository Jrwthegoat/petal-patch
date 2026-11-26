// Everything the game remembers, in this phone's browser storage only.

import { emptyStreak } from "./logic/streak.js";
import { emptyGarden } from "./logic/garden.js";
import { emptySphinx, migrateSphinx } from "./logic/sphinx.js";
import { emptySculpture, migrateSculpture } from "./logic/sculpture.js";
import { emptyStats } from "./logic/stats.js";
import { loadRaw, saveRaw } from "./logic/testmode.js";

// The key stays the same across versions so saved gardens are never lost;
// fromSaved() moves older shapes forward.
export const KEY = "petal-patch.v1";

export function defaults() {
  return {
    v: 2,
    muted: false,
    streak: emptyStreak(),
    garden: emptyGarden(),
    sphinx: emptySphinx(),
    sculpture: emptySculpture(),
    stats: emptyStats(),
    lastWinDay: null,
    chestDay: null, // the day the daily chest was last opened
    wins: 0,
    dailyWonDay: null,
    pathNext: 0,
    codes: {}, // week -> { redeemed: true, won: bool }
    current: null, // { ref, taps, undoUsed }
    seenPlanted: 0,
    seenVisitors: 0,
    seenPieces: 0,
  };
}

// Build the current state from whatever was saved, old shapes included.
export function fromSaved(saved) {
  const base = defaults();
  if (!saved || typeof saved !== "object") return base;
  const out = { ...base, ...saved };
  for (const k of ["streak", "garden", "stats"]) out[k] = { ...base[k], ...(saved[k] || {}) };
  out.stats.sphinx = { ...base.stats.sphinx, ...(out.stats.sphinx || {}) };
  // Version 1 kept the daily chest inside the sphinx.
  if (out.chestDay == null && saved.sphinx && saved.sphinx.chestDay != null) out.chestDay = saved.sphinx.chestDay;
  out.sphinx = migrateSphinx(saved.sphinx);
  // Sculptures had six pieces each before; finished ones stay finished.
  out.sculpture = migrateSculpture(saved.sculpture);
  out.v = 2;
  return out;
}

// The browser's storage, if there is any (none under Node).
function stores() {
  try {
    return { local: window.localStorage, session: window.sessionStorage };
  } catch (e) {
    return null;
  }
}

// In the owner's test mode the game reads and writes a separate copy (see
// js/logic/testmode.js); otherwise the real save.
export function load() {
  try {
    const st = stores();
    const raw = loadRaw(st.local, st.session, KEY);
    if (!raw || raw === "null") return defaults();
    return fromSaved(JSON.parse(raw));
  } catch (e) {
    return defaults();
  }
}

// The real save only, whatever mode the game is in (the stats page).
export function loadReal() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? fromSaved(JSON.parse(raw)) : defaults();
  } catch (e) {
    return defaults();
  }
}

export function save(state) {
  try {
    const st = stores();
    saveRaw(st.local, st.session, KEY, JSON.stringify(state));
  } catch (e) {
    // Private mode or storage full: the game still plays, it just won't remember.
  }
}

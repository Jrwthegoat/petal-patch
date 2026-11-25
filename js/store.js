// Everything the game remembers, in this phone's browser storage only.

import { emptyStreak } from "./logic/streak.js";
import { emptyGarden } from "./logic/garden.js";
import { emptySphinx, migrateSphinx } from "./logic/sphinx.js";
import { emptySculpture } from "./logic/sculpture.js";
import { emptyStats } from "./logic/stats.js";

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
  for (const k of ["streak", "garden", "sculpture", "stats"]) out[k] = { ...base[k], ...(saved[k] || {}) };
  out.stats.sphinx = { ...base.stats.sphinx, ...(out.stats.sphinx || {}) };
  // Version 1 kept the daily chest inside the sphinx.
  if (out.chestDay == null && saved.sphinx && saved.sphinx.chestDay != null) out.chestDay = saved.sphinx.chestDay;
  out.sphinx = migrateSphinx(saved.sphinx);
  out.v = 2;
  return out;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    return fromSaved(JSON.parse(raw));
  } catch (e) {
    return defaults();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // Private mode or storage full: the game still plays, it just won't remember.
  }
}

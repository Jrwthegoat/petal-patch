// Everything the game remembers, in this phone's browser storage only.

import { emptyStreak } from "./logic/streak.js";
import { emptyGarden } from "./logic/garden.js";
import { emptySphinx } from "./logic/sphinx.js";
import { emptyStats } from "./logic/stats.js";

export const KEY = "petal-patch.v1";

export function defaults() {
  return {
    v: 1,
    muted: false,
    streak: emptyStreak(),
    garden: emptyGarden(),
    sphinx: emptySphinx(),
    stats: emptyStats(),
    lastWinDay: null,
    wins: 0,
    dailyWonDay: null,
    pathNext: 0,
    codes: {}, // week -> { redeemed: true, won: bool }
    current: null, // { ref, taps, undoUsed }
    seenPlanted: 0,
    seenVisitors: 0,
  };
}

export function load() {
  const base = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw);
    const out = { ...base, ...saved };
    for (const k of ["streak", "garden", "sphinx", "stats"]) out[k] = { ...base[k], ...(saved[k] || {}) };
    return out;
  } catch (e) {
    return base;
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // Private mode or storage full: the game still plays, it just won't remember.
  }
}

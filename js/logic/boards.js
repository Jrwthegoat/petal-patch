// Which board to play: the garden path (a dozen hand-tuned boards in order),
// today's daily board (same for everyone, picked by date), and the weekly
// bonus board (unlocked by the code).
//
// Tuning knobs per board: kinds = how many different symbols; cap = how many
// kinds the intended clearing order ever holds half-finished at once (1..3);
// pOpen = how eagerly that order starts a new kind. Seeds were chosen with
// `npm run tune`, which plays each board with a simple simulated player.

import { LAYOUTS, BONUS_LAYOUT, layoutById } from "./layouts.js";
import { makeDeal } from "./deal.js";
import { hashString } from "./rng.js";
import { winRate } from "./playtest.js";

export const PATH = [
  { layout: "seedling", seed: 11, kinds: 3, cap: 1, pOpen: 0.3 },
  { layout: "two-beds", seed: 22, kinds: 4, cap: 2, pOpen: 0.3 },
  { layout: "diamond", seed: 33, kinds: 4, cap: 2, pOpen: 0.4 },
  { layout: "heart", seed: 44, kinds: 5, cap: 2, pOpen: 0.4 },
  { layout: "cross", seed: 55, kinds: 5, cap: 2, pOpen: 0.5 },
  { layout: "butterfly", seed: 66, kinds: 6, cap: 2, pOpen: 0.5 },
  { layout: "cottage", seed: 77, kinds: 6, cap: 3, pOpen: 0.4 },
  { layout: "tree", seed: 88, kinds: 6, cap: 3, pOpen: 0.5 },
  { layout: "mushroom", seed: 37, kinds: 7, cap: 3, pOpen: 0.5 },
  { layout: "sunflower", seed: 47, kinds: 7, cap: 3, pOpen: 0.5 },
  { layout: "watering-can", seed: 8, kinds: 8, cap: 3, pOpen: 0.5 },
  { layout: "great-garden", seed: 39, kinds: 8, cap: 3, pOpen: 0.6 },
];

// The daily board draws from the middle of the path: big enough to be a real
// round, small enough for two minutes. Consecutive days never share a shape.
export const DAILY_POOL = [2, 3, 4, 5, 6, 7, 8, 9, 10];
export const DAILY_TUNING = { cap: 2, pOpen: 0.5 };

export const BONUS_TUNING = { kinds: 6, cap: 2, pOpen: 0.5 };

function dealFor(layoutId, opts) {
  return makeDeal(layoutById(layoutId), opts);
}

// Path boards loop after the twelfth with fresh symbols.
export function pathBoard(index) {
  const b = PATH[index % PATH.length];
  const loop = Math.floor(index / PATH.length);
  const seed = loop === 0 ? b.seed : hashString(`path-${index}`);
  const deal = dealFor(b.layout, { ...b, seed });
  return { kind: "path", index, title: `Garden path ${(index % PATH.length) + 1} of ${PATH.length}`, deal };
}

export function dailyLayoutIndex(day) {
  // Stepping by 4 through a pool of 9 (no shared factor) visits every shape
  // and never repeats yesterday's.
  return DAILY_POOL[(((day * 4) % DAILY_POOL.length) + DAILY_POOL.length) % DAILY_POOL.length];
}

// Daily and bonus boards are dealt fresh, so each candidate deal is played by
// the simulated casual player and the first one inside a friendly band is
// kept (same result on every phone: everything here is deterministic).
export const FRIENDLY_BAND = [0.75, 0.98];
const BAND_GAMES = 60;
const BAND_TRIES = 12;

function friendlyDeal(layout, tuning, seedBase) {
  let fallback = null;
  for (let t = 0; t < BAND_TRIES; t++) {
    const deal = makeDeal(layout, { ...tuning, seed: hashString(`${seedBase}-${t}`) });
    const rate = winRate(deal, BAND_GAMES, 777);
    if (rate >= FRIENDLY_BAND[0] && rate <= FRIENDLY_BAND[1]) return deal;
    if (!fallback || Math.abs(rate - 0.86) < fallback.gap) fallback = { deal, gap: Math.abs(rate - 0.86) };
  }
  return fallback.deal;
}

export function dailyBoard(day) {
  const b = PATH[dailyLayoutIndex(day)];
  const deal = friendlyDeal(layoutById(b.layout), { kinds: b.kinds, ...DAILY_TUNING }, `daily-${day}`);
  return { kind: "daily", day, title: "Today's board", deal };
}

export function bonusBoard(week) {
  const deal = friendlyDeal(BONUS_LAYOUT, BONUS_TUNING, `bonus-${week}`);
  return { kind: "bonus", week, title: "Bonus board", deal };
}

export function boardFor(ref) {
  if (ref.kind === "path") return pathBoard(ref.index);
  if (ref.kind === "daily") return dailyBoard(ref.day);
  if (ref.kind === "bonus") return bonusBoard(ref.week);
  throw new Error(`unknown board ${ref.kind}`);
}

export { LAYOUTS };

// Which board to play: the garden path (a dozen hand-tuned boards in order),
// today's daily board (same for everyone, picked by date), and the weekly
// bonus board (unlocked by the code).
//
// Tuning knobs per board: kinds = how many different symbols; cap = how many
// sets of three the intended clearing order ever holds half-finished at once
// (1..3); pOpen = how eagerly that order starts a new set; together = how
// often a set's three tiles are all in view at once (gentler). Seeds were
// chosen with `npm run tune`, which plays each board with a simple simulated
// player: win rates kept where they were before the variety change, with
// no more than 3 tappable tiles of one kind at the start and no more than 4
// in any simulated game.

import { LAYOUTS, BONUS_LAYOUT, layoutById } from "./layouts.js";
import { makeDeal } from "./deal.js";
import { hashString } from "./rng.js";
import { casualStats } from "./playtest.js";

export const PATH = [
  { layout: "seedling", seed: 3, kinds: 5, cap: 2, pOpen: 0.3, together: 0.3 },
  { layout: "two-beds", seed: 8, kinds: 6, cap: 2, pOpen: 0.3, together: 0.3 },
  { layout: "diamond", seed: 5, kinds: 6, cap: 2, pOpen: 0.3, together: 0.3 },
  { layout: "heart", seed: 14, kinds: 7, cap: 2, pOpen: 0.3, together: 0.9 },
  { layout: "cross", seed: 3, kinds: 7, cap: 2, pOpen: 0.3, together: 0.3 },
  { layout: "butterfly", seed: 23, kinds: 10, cap: 2, pOpen: 0.3, together: 0.9 },
  { layout: "cottage", seed: 17, kinds: 10, cap: 2, pOpen: 0.3, together: 0.6 },
  { layout: "tree", seed: 22, kinds: 9, cap: 2, pOpen: 0.3, together: 0.9 },
  { layout: "mushroom", seed: 12, kinds: 9, cap: 2, pOpen: 0.3, together: 0.6 },
  { layout: "sunflower", seed: 23, kinds: 11, cap: 2, pOpen: 0.3, together: 0.9 },
  { layout: "watering-can", seed: 33, kinds: 11, cap: 1, pOpen: 0.5, together: 0.3 },
  { layout: "great-garden", seed: 25, kinds: 12, cap: 2, pOpen: 0.3, together: 0.9 },
];

// The daily board draws from the middle of the path: big enough to be a real
// round, small enough for two minutes. Consecutive days never share a shape.
export const DAILY_POOL = [2, 3, 4, 5, 6, 7, 8, 9, 10];
// Daily boards use their path board's tuning, with these changes (by path
// index) so fresh deals land in the friendly band with the variety limits.
export const DAILY_TUNING = {
  5: { together: 0.6 },
  10: { cap: 2, pOpen: 0.3, together: 0.9 },
};

export const BONUS_TUNING = { kinds: 8, cap: 2, pOpen: 0.3, together: 0.9 };

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
// the simulated casual player and the first one inside a friendly band, where
// few games ever show more than 4 tappable tiles of one kind, is kept (same
// result on every phone: everything here is deterministic). Every deal opens
// with no more than 3 of one kind (makeDeal sees to that).
export const FRIENDLY_BAND = [0.75, 0.98];
export const MOSTLY_VARIED = 0.15; // most games showing more than 4 of a kind
const BAND_GAMES = 60;
const BAND_TRIES = 40;

function friendlyDeal(layout, tuning, seedBase) {
  let fallback = null;
  for (let t = 0; t < BAND_TRIES; t++) {
    const deal = makeDeal(layout, { ...tuning, seed: hashString(`${seedBase}-${t}`) });
    const { win, over4 } = casualStats(deal, BAND_GAMES, 777);
    if (win >= FRIENDLY_BAND[0] && win <= FRIENDLY_BAND[1] && over4 <= MOSTLY_VARIED) return deal;
    const gap = Math.abs(win - 0.86) + over4;
    if (!fallback || gap < fallback.gap) fallback = { deal, gap };
  }
  return fallback.deal;
}

export function dailyTuning(index) {
  const { layout, seed, ...t } = PATH[index];
  return { ...t, ...(DAILY_TUNING[index] || {}) };
}

// Dealing a daily or bonus board plays it many times, so each is kept once made.
const made = new Map();
function once(key, make) {
  if (!made.has(key)) made.set(key, make());
  return made.get(key);
}

export function dailyBoard(day) {
  return once(`daily-${day}`, () => dealDaily(day));
}

function dealDaily(day) {
  const i = dailyLayoutIndex(day);
  const deal = friendlyDeal(layoutById(PATH[i].layout), dailyTuning(i), `daily-${day}`);
  return { kind: "daily", day, title: "Today's board", deal };
}

export function bonusBoard(week) {
  return once(`bonus-${week}`, () => dealBonus(week));
}

function dealBonus(week) {
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

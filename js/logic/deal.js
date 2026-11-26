// Turns a layout into a playable board by choosing which symbol goes on each tile.
//
// Solvable by construction: we first pick a legal clearing order (always taking
// a tile that is exposed at that moment), then group the tiles along that
// order into sets of three so that at most `cap` sets are ever half-collected
// at once. Following that order the tray never holds more than 2 * cap tiles,
// and cap <= 3 keeps that under the 7-slot tray. The test suite also proves
// each board solvable with an independent search.
//
// Variety: each set then gets its kind, chosen so two sets of one kind are
// rarely in view at the same time (they sit in different layers and areas
// and are uncovered at different times). Any choice of kinds keeps the order
// above winnable: sets of one kind that overlap only ever shorten the tray.
// A deal that opens with more than OPEN_LIMIT tappable tiles of one kind, or
// shows more than PLAY_LIMIT of one kind along its own clearing order, is
// dealt again from the next seed (same result on every phone).

import { mulberry32, shuffle, pick, hashString } from "./rng.js";
import { computeCover, isExposed } from "./engine.js";

export const SYMBOL_COUNT = 12;
export const OPEN_LIMIT = 3;
export const PLAY_LIMIT = 4;
const REDEALS = 400;

// Most tappable tiles of one kind before each tap of `taps` (and at the start).
export function kindPeak(deal, taps = []) {
  const n = deal.cells.length;
  const taken = new Array(n).fill(false);
  const probe = { cells: deal.cells, coveredBy: deal.coveredBy };
  let peak = 0;
  const look = () => {
    const c = new Map();
    for (let i = 0; i < n; i++) {
      if (!isExposed(probe, taken, i)) continue;
      const s = deal.cells[i].sym;
      const k = (c.get(s) || 0) + 1;
      c.set(s, k);
      if (k > peak) peak = k;
    }
  };
  look();
  for (const t of taps) {
    taken[t] = true;
    look();
  }
  return peak;
}

export const openingPeak = (deal) => kindPeak(deal, []);

function dealOnce(layout, base, coveredBy, { seed, kinds, cap, pOpen, together }) {
  const n = base.length;
  const rng = mulberry32(seed);
  const probe = { cells: base, coveredBy };

  // 1 and 2. A legal clearing order (always a tile exposed at that moment),
  // grouped into sets of three as it goes, at most `cap` half-collected at
  // once. together: how often a set's later tiles are ones that were already
  // in view when the set began (all three visible at once makes it gentler).
  const triples = n / 3;
  const taken = new Array(n).fill(false);
  const order = [];
  const setOf = [];
  const open = new Map(); // set number -> tiles so far (1 or 2)
  const inView = new Map(); // set number -> tiles exposed when it began
  let started = 0;
  for (let step = 0; step < n; step++) {
    const exposed = [];
    for (let i = 0; i < n; i++) if (isExposed(probe, taken, i)) exposed.push(i);
    const cont = [...open.keys()];
    const mayOpen = started < triples && open.size < cap;
    let t;
    let id;
    if (cont.length === 0 || (mayOpen && rng() < pOpen)) {
      t = started++;
      open.set(t, 1);
      id = pick(rng, exposed);
      inView.set(t, new Set(exposed));
    } else {
      t = pick(rng, cont);
      const c = open.get(t) + 1;
      if (c === 3) open.delete(t);
      else open.set(t, c);
      const near = exposed.filter((i) => inView.get(t).has(i));
      id = near.length && rng() < together ? pick(rng, near) : pick(rng, exposed);
    }
    taken[id] = true;
    order.push(id);
    setOf.push(t);
  }

  // 3. Kinds. Each set is "in view" from when its first tile is uncovered
  // (following the order) until its last tile is taken. Sets go in the order
  // they come into view, each taking the kind that has been out of view the
  // longest, so two sets of one kind are rarely in view together.
  const k = Math.min(kinds, triples, SYMBOL_COUNT);
  const syms = shuffle(rng, [...Array(SYMBOL_COUNT).keys()]).slice(0, k);
  const seen = new Array(n).fill(-1); // step at which each tile is first uncovered
  const gone = new Array(n).fill(false);
  const mark = (step) => {
    for (let i = 0; i < n; i++) if (seen[i] < 0 && isExposed(probe, gone, i)) seen[i] = step;
  };
  mark(0);
  order.forEach((id, step) => {
    gone[id] = true;
    mark(step + 1);
  });
  const from = new Array(triples).fill(Infinity);
  const to = new Array(triples).fill(-1);
  order.forEach((id, step) => {
    const t = setOf[step];
    from[t] = Math.min(from[t], seen[id]);
    to[t] = Math.max(to[t], step);
  });
  const sets = [...Array(triples).keys()].sort((a, b) => from[a] - from[b] || a - b);
  const freeAt = new Array(k).fill(-1); // step after which each kind is out of view
  const used = new Array(k).fill(0);
  const kindOf = new Array(triples);
  for (const t of sets) {
    const ks = [...Array(k).keys()];
    const free = ks.filter((c) => freeAt[c] < from[t]);
    const best = free.length
      ? free.reduce((a, c) => (used[c] < used[a] || (used[c] === used[a] && freeAt[c] < freeAt[a]) ? c : a))
      : ks.reduce((a, c) => (freeAt[c] < freeAt[a] ? c : a));
    kindOf[t] = best;
    used[best] += 1;
    freeAt[best] = Math.max(freeAt[best], to[t]);
  }
  const cells = base.map((c) => ({ ...c, sym: -1 }));
  order.forEach((id, i) => {
    cells[id].sym = syms[kindOf[setOf[i]]];
  });
  return { layoutId: layout.id, name: layout.name, seed, cells, coveredBy, solution: order };
}

export function makeDeal(layout, { seed, kinds, cap = 2, pOpen = 0.5, together = 0, openLimit = OPEN_LIMIT, playLimit = PLAY_LIMIT }) {
  if (cap < 1 || cap > 3) throw new Error("cap must be 1..3");
  const base = layout.cells;
  const n = base.length;
  if (n % 3 !== 0) throw new Error(`${layout.id}: tile count ${n} is not a multiple of 3`);
  const coveredBy = computeCover(base);
  let best = null;
  for (let t = 0; t < REDEALS; t++) {
    const s = t === 0 ? seed : hashString(`${seed}-redeal-${t}`);
    const deal = dealOnce(layout, base, coveredBy, { seed: s, kinds, cap, pOpen, together });
    const open = openingPeak(deal);
    const play = kindPeak(deal, deal.solution);
    if (open <= openLimit && play <= playLimit) return deal;
    const score = (open > openLimit ? 100 * (open - openLimit) : 0) + Math.max(0, play - playLimit);
    if (!best || score < best.score) best = { deal, score };
  }
  return best.deal;
}

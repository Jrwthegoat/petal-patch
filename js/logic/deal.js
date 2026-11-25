// Turns a layout into a playable board by choosing which symbol goes on each tile.
//
// Solvable by construction: we first pick a legal clearing order (always taking
// a tile that is exposed at that moment), then hand out symbols along that
// order so that at most `cap` different kinds are ever half-collected at once.
// Following that order the tray never holds more than 2 * cap tiles, and
// cap <= 3 keeps that under the 7-slot tray. The test suite also proves each
// board solvable with an independent search.

import { mulberry32, shuffle, pick } from "./rng.js";
import { computeCover, isExposed } from "./engine.js";

export const SYMBOL_COUNT = 9;

export function makeDeal(layout, { seed, kinds, cap = 2, pOpen = 0.5 }) {
  if (cap < 1 || cap > 3) throw new Error("cap must be 1..3");
  const base = layout.cells;
  const n = base.length;
  if (n % 3 !== 0) throw new Error(`${layout.id}: tile count ${n} is not a multiple of 3`);
  const coveredBy = computeCover(base);
  const rng = mulberry32(seed);
  const probe = { cells: base, coveredBy };

  // 1. A legal clearing order.
  const taken = new Array(n).fill(false);
  const order = [];
  for (let step = 0; step < n; step++) {
    const exposed = [];
    for (let i = 0; i < n; i++) if (isExposed(probe, taken, i)) exposed.push(i);
    const id = pick(rng, exposed);
    taken[id] = true;
    order.push(id);
  }

  // 2. Symbols along that order.
  const triples = n / 3;
  const k = Math.min(kinds, triples, SYMBOL_COUNT);
  const syms = shuffle(rng, [...Array(SYMBOL_COUNT).keys()]).slice(0, k);
  const budget = new Map(syms.map((s, i) => [s, Math.floor(triples / k) + (i < triples % k ? 1 : 0)]));
  const open = new Map(); // sym -> 1 or 2 tiles held
  const seq = [];
  for (let step = 0; step < n; step++) {
    const cont = [...open.keys()];
    const canOpen = syms.filter((s) => budget.get(s) > 0 && !open.has(s));
    const mayOpen = canOpen.length > 0 && open.size < cap;
    let s;
    if (cont.length === 0 || (mayOpen && rng() < pOpen)) {
      s = pick(rng, canOpen);
      budget.set(s, budget.get(s) - 1);
      open.set(s, 1);
    } else {
      s = pick(rng, cont);
      const c = open.get(s) + 1;
      if (c === 3) open.delete(s);
      else open.set(s, c);
    }
    seq.push(s);
  }

  const cells = base.map((c) => ({ ...c, sym: -1 }));
  order.forEach((id, i) => {
    cells[id].sym = seq[i];
  });
  return { layoutId: layout.id, name: layout.name, seed, cells, coveredBy, solution: order };
}

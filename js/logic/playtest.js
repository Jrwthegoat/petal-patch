// A simulated casual player. It sees only the tray and the tiles it can tap
// (no peeking under the stack), roughly how a first-time player plays.
// Used to keep daily and bonus boards inside a friendly difficulty band, and
// by tools/tune.js to hand-tune the garden path.

import { newRound, tap, exposedTiles } from "./engine.js";
import { mulberry32 } from "./rng.js";

export function casualPlay(deal, rng) {
  let s = newRound(deal);
  const sym = (t) => deal.cells[t].sym;
  while (s.status === "playing") {
    const ex = exposedTiles(deal, s.taken);
    const held = {};
    for (const t of s.tray) held[sym(t)] = (held[sym(t)] || 0) + 1;
    const visible = {};
    for (const t of ex) visible[sym(t)] = (visible[sym(t)] || 0) + 1;
    // 1. finish a set in the tray; 2. a kind with 3 within reach; 3. match the tray; 4. anything
    let choice = ex.filter((t) => held[sym(t)] === 2);
    if (!choice.length) choice = ex.filter((t) => (held[sym(t)] || 0) + visible[sym(t)] >= 3);
    if (!choice.length) choice = ex.filter((t) => held[sym(t)]);
    if (!choice.length) choice = ex;
    const best = Math.max(...choice.map((t) => held[sym(t)] || 0));
    const top = choice.filter((t) => (held[sym(t)] || 0) === best);
    s = tap(deal, s, top[Math.floor(rng() * top.length)]).state;
  }
  return s.status === "won";
}

export function winRate(deal, games = 300, seed = 12345) {
  const rng = mulberry32(seed);
  let w = 0;
  for (let g = 0; g < games; g++) if (casualPlay(deal, rng)) w++;
  return w / games;
}

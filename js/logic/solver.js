// Independent proof that a board can be cleared: depth-first search over
// which tiles have been taken. The tray is fully determined by the taken set
// (per kind, taken count mod 3), so the taken set is the whole state.

import { TRAY_SIZE } from "./engine.js";

export function solve(deal, { nodeLimit = 500000 } = {}) {
  const { cells, coveredBy } = deal;
  const n = cells.length;
  const covers = cells.map(() => []); // tiles that i sits on top of
  coveredBy.forEach((over, i) => over.forEach((j) => covers[j].push(i)));
  const taken = new Uint8Array(n);
  const words = new Uint32Array(Math.ceil(n / 32));
  const inTray = new Map();
  let trayLen = 0;
  let nodes = 0;
  const dead = new Set();
  const path = [];

  const exposed = (i) => {
    if (taken[i]) return false;
    const over = coveredBy[i];
    for (let k = 0; k < over.length; k++) if (!taken[over[k]]) return false;
    return true;
  };

  function dfs(count) {
    if (count === n) return true;
    if (++nodes > nodeLimit) throw new Error("node limit");
    const key = words.join(",");
    if (dead.has(key)) return false;
    const moves = [];
    for (let i = 0; i < n; i++) {
      if (!exposed(i)) continue;
      const held = inTray.get(cells[i].sym) || 0;
      if (held < 2 && trayLen + 1 >= TRAY_SIZE) continue; // would fill the tray
      moves.push({ i, held, frees: covers[i].length });
    }
    moves.sort((a, b) => b.held - a.held || b.frees - a.frees);
    for (const { i, held } of moves) {
      const s = cells[i].sym;
      taken[i] = 1;
      words[i >> 5] |= 1 << (i & 31);
      if (held === 2) {
        inTray.set(s, 0);
        trayLen -= 2;
      } else {
        inTray.set(s, held + 1);
        trayLen += 1;
      }
      path.push(i);
      if (dfs(count + 1)) return true;
      path.pop();
      if (held === 2) {
        inTray.set(s, 2);
        trayLen += 2;
      } else {
        inTray.set(s, held);
        trayLen -= 1;
      }
      taken[i] = 0;
      words[i >> 5] &= ~(1 << (i & 31));
    }
    dead.add(key);
    return false;
  }

  try {
    const ok = dfs(0);
    return { solvable: ok, proven: true, nodes, path: ok ? path.slice() : null };
  } catch (e) {
    if (e.message === "node limit") return { solvable: false, proven: false, nodes, path: null };
    throw e;
  }
}

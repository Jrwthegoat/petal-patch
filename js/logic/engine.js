// The puzzle rules, with no DOM. A round is a deal plus the list of taps so far.
//
// Rules: tap an exposed tile to move it into the tray. The tray keeps
// matching tiles together. Three alike vanish. Clear every tile to win.
// If the tray holds 7 tiles after a tap (and nothing matched) the round is lost.
// One free undo per attempt.

export const TRAY_SIZE = 7;

export function computeCover(cells) {
  const coveredBy = cells.map(() => []);
  for (let i = 0; i < cells.length; i++) {
    for (let j = 0; j < cells.length; j++) {
      const a = cells[i];
      const b = cells[j];
      if (b.z > a.z && Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2) coveredBy[i].push(j);
    }
  }
  return coveredBy;
}

export function isExposed(deal, taken, i) {
  if (taken[i]) return false;
  const over = deal.coveredBy[i];
  for (let k = 0; k < over.length; k++) if (!taken[over[k]]) return false;
  return true;
}

export function exposedTiles(deal, taken) {
  const out = [];
  for (let i = 0; i < deal.cells.length; i++) if (isExposed(deal, taken, i)) out.push(i);
  return out;
}

export function newRound(deal) {
  return {
    taken: new Array(deal.cells.length).fill(false),
    tray: [],
    taps: [],
    left: deal.cells.length,
    status: "playing",
    undoUsed: false,
  };
}

// Insert a tile next to others of its kind, else at the end.
function insertIntoTray(deal, tray, id) {
  const sym = deal.cells[id].sym;
  let at = -1;
  for (let k = 0; k < tray.length; k++) if (deal.cells[tray[k]].sym === sym) at = k;
  const next = tray.slice();
  if (at === -1) next.push(id);
  else next.splice(at + 1, 0, id);
  return next;
}

// Returns { state, placed, trayWithPlaced, matched } or null if the tap is not allowed.
export function tap(deal, state, id) {
  if (state.status !== "playing") return null;
  if (!isExposed(deal, state.taken, id)) return null;
  const taken = state.taken.slice();
  taken[id] = true;
  const trayWithPlaced = insertIntoTray(deal, state.tray, id);
  const sym = deal.cells[id].sym;
  const same = trayWithPlaced.filter((t) => deal.cells[t].sym === sym);
  let tray = trayWithPlaced;
  let matched = null;
  if (same.length >= 3) {
    matched = same.slice(0, 3);
    tray = trayWithPlaced.filter((t) => !matched.includes(t));
  }
  const left = state.left - 1;
  let status = "playing";
  if (left === 0 && tray.length === 0) status = "won";
  else if (tray.length >= TRAY_SIZE) status = "lost";
  return {
    state: { taken, tray, taps: state.taps.concat(id), left, status, undoUsed: state.undoUsed },
    placed: id,
    trayWithPlaced,
    matched,
  };
}

export function replay(deal, taps, undoUsed = false) {
  let s = newRound(deal);
  for (const id of taps) {
    const r = tap(deal, s, id);
    if (!r) break;
    s = r.state;
  }
  s.undoUsed = undoUsed;
  return s;
}

export function canUndo(state) {
  return !state.undoUsed && state.taps.length > 0 && state.status !== "won";
}

export function undo(deal, state) {
  if (!canUndo(state)) return null;
  return replay(deal, state.taps.slice(0, -1), true);
}

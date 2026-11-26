// Garden sculptures: the question-asker's own reward. Each right answer adds to the
// sculpture being built, from the base up: right at the first try is a whole
// piece, right on a later try is half a piece (two halves make a piece).
// A finished sculpture stays in the garden for good and the next one starts.
// After the last one the set comes round again in gold, without end.
//
// The saved state is one number, the half pieces ever earned; everything
// else is worked out from it, so it can never fall out of step.

export const PIECES = 6;

// parts: what each piece adds, base first. Drawn in art.js.
export const SCULPTURES = [
  { id: "sundial", name: "Sundial", parts: ["base", "pedestal", "column", "dial", "pointer", "sunburst"] },
  { id: "birdbath", name: "Birdbath", parts: ["base", "pedestal", "stem", "bowl", "water", "bluebird"] },
  { id: "owl", name: "Stone Owl", parts: ["base", "pedestal", "body", "wings", "head", "bright eyes"] },
  { id: "fountain", name: "Fountain", parts: ["basin", "pedestal", "lower bowl", "top bowl", "finial", "water"] },
  { id: "arch", name: "Garden Arch", parts: ["footings", "pillars", "left half", "right half", "keystone", "climbing roses"] },
  { id: "rabbit", name: "Stone Rabbit", parts: ["base", "plinth", "body", "head", "ears", "flower crown"] },
];

// "4 of 6", "4½ of 6", "½ of 6".
export function piecesText(built, half) {
  const n = built === 0 && half ? "½" : `${built}${half ? "½" : ""}`;
  return `${n} of ${PIECES}`;
}

export function emptySculpture() {
  return { halves: 0 };
}

function item(index) {
  const n = SCULPTURES.length;
  const round = Math.floor(index / n);
  const sc = SCULPTURES[index % n];
  return { index, sculpture: sc, gold: round > 0, round, name: round > 0 ? `Gold ${sc.name}` : sc.name };
}

export function sculptureView(state) {
  const halves = Math.max(0, Math.floor((state && state.halves) || 0));
  const pieces = Math.floor(halves / 2);
  const index = Math.floor(pieces / PIECES);
  const finished = [];
  for (let i = 0; i < index; i++) finished.push(item(i));
  return { current: { ...item(index), built: pieces % PIECES, half: halves % 2 === 1 }, finished, pieces, halves };
}

// Add a visit's reward (in half pieces). Returns the new state and what it did:
// placed: the piece completed by this reward ({ name, part, partIndex }) or null;
// finished: the sculpture this reward finished, or null; half: a half piece is now waiting.
export function addHalves(state, halves) {
  const before = sculptureView(state);
  const next = { ...emptySculpture(), ...state, halves: before.halves + Math.max(0, halves) };
  const after = sculptureView(next);
  let placed = null;
  let finished = null;
  if (after.pieces > before.pieces) {
    const p = after.pieces - 1;
    const it = item(Math.floor(p / PIECES));
    const partIndex = p % PIECES;
    placed = { ...it, partIndex, part: it.sculpture.parts[partIndex] };
    if (partIndex === PIECES - 1) finished = it;
  }
  return { sculpture: next, before, after, placed, finished, half: after.current.half };
}

// For the collection: each sculpture with how far it has got. shownName is
// null while it is still a surprise (never finished), so the screen cannot
// give it away.
export function collectionRows(state) {
  const v = sculptureView(state);
  const n = SCULPTURES.length;
  return SCULPTURES.map((sc, i) => {
    const done = v.finished.filter((f) => f.index % n === i).length;
    const building = v.current.index % n === i ? v.current : null;
    // finished counts every time it was completed; the first is stone, later ones gold.
    return { sculpture: sc, finished: done, goldFinished: Math.max(0, done - 1), building, shownName: done > 0 ? sc.name : null };
  });
}

// ---- What the player is told -------------------------------------------
// A sculpture is a surprise until its last piece lands: nothing the player
// reads names it (or its parts) before then. The gold round repeats ones
// already finished, so those may be named.

export const SURPRISE_NAME = "New sculpture";

export function isRevealed(item) {
  return !!(item && item.gold);
}

export function displayName(item) {
  return isRevealed(item) ? item.name : SURPRISE_NAME;
}

// "New sculpture: 2 of 6", "Gold Sundial: 3½ of 6".
export function progressLabel(current) {
  return `${displayName(current)}: ${piecesText(current.built, current.half)}`;
}

const article = (name) => (/^[AEIOU]/i.test(name) ? "an" : "a");

// The words after a right answer, from addHalves()'s result.
// { title, line, note, reveal } — reveal is set only when a sculpture is finished.
export function rewardText(add, { firstTry }) {
  const cur = add.after.current;
  const progress = piecesText(cur.built, cur.half);
  if (add.finished) {
    const f = add.finished;
    const next = cur.gold && !f.gold ? "Next, the whole set again, in gold." : `Next: ${isRevealed(cur) ? cur.name : "a new sculpture"}.`;
    return { title: `It's ${article(f.name)} ${f.name}!`, line: "It stays in your garden for good.", note: next, reveal: f.name };
  }
  if (add.placed) {
    const piece = `Piece ${add.placed.partIndex + 1} of ${PIECES} is in place.`;
    if (firstTry) return { title: "A whole piece!", line: piece, note: `${displayName(cur)}: ${progress}`, reveal: null };
    return { title: "Two halves make a whole!", line: piece, note: "Get it first try for a whole one.", reveal: null };
  }
  return { title: "Half a stone.", line: "Get it first try for a whole one.", note: `${displayName(cur)}: ${progress}`, reveal: null };
}

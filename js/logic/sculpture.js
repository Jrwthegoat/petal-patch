// Garden sculptures: the question-asker's own reward. Each right answer adds to the
// sculpture being built, from the ground up: right at the first try is a whole
// piece, right on a later try is half a piece (two halves make a piece).
// A finished sculpture stays in the garden for good and the next one starts.
// After the last one the set comes round again in gold, without end.
//
// The saved state is the half pieces ever earned; everything else is worked
// out from it, so it can never fall out of step.
//
// Common sense and gravity. Every piece says what kind it is and what it
// rests on, and pieces go on in an order where everything rests on something
// already finished:
//   stone    built from the ground up; a half piece is the lower half of it
//            (a shorter course, a rough block at the bottom), never a left or
//            right half. A column is stacked in drums from the bottom.
//   water    only once every bowl or basin it fills is finished.
//   plant    grows from the ground (or a finished planter): sprout, then
//            leaves or buds, then the bloom. A half piece is a smaller sprout
//            or a closed bud.
//   creature a bird, an owl, a rabbit, alive or a statue of one: it arrives
//            whole in one piece, last, onto something finished that holds it.
//            A half piece shows nothing of it (something else small instead:
//            seeds set out, a shape under a cloth).
// Piece counts differ per sculpture; the player never sees a count.

const piece = (id, kind, on = [], extra = {}) => ({ id, kind, on, ...extra });

export const SCULPTURES = [
  {
    id: "sundial",
    name: "Sundial",
    pieces: [
      piece("base", "stone"),
      piece("pedestal", "stone", ["base"]),
      piece("drum-1", "stone", ["pedestal"]),
      piece("drum-2", "stone", ["drum-1"]),
      piece("drum-3", "stone", ["drum-2"]),
      piece("capital", "stone", ["drum-3"]),
      piece("dial", "stone", ["capital"]),
      piece("pointer", "stone", ["dial"]),
    ],
  },
  {
    id: "birdbath",
    name: "Birdbath",
    pieces: [
      piece("base", "stone"),
      piece("drum-1", "stone", ["base"]),
      piece("drum-2", "stone", ["drum-1"]),
      piece("drum-3", "stone", ["drum-2"]),
      piece("bowl", "stone", ["drum-3"]),
      piece("water", "water", ["bowl"]),
      piece("bells-sprout", "plant", [], { stage: "sprout" }),
      piece("bells-bloom", "plant", ["bells-sprout"], { stage: "bloom" }),
      piece("bluebird", "creature", ["bowl", "water"]),
    ],
  },
  {
    id: "owl",
    name: "Stone Owl",
    pieces: [
      piece("base", "stone"),
      piece("plinth", "stone", ["base"]),
      piece("drum-1", "stone", ["plinth"]),
      piece("drum-2", "stone", ["drum-1"]),
      piece("drum-3", "stone", ["drum-2"]),
      piece("daisies-sprout", "plant", [], { stage: "sprout" }),
      piece("daisies-bloom", "plant", ["daisies-sprout"], { stage: "bloom" }),
      piece("owl", "creature", ["drum-3"]),
    ],
  },
  {
    id: "fountain",
    name: "Fountain",
    pieces: [
      piece("basin", "stone"),
      piece("drum-1", "stone", ["basin"]),
      piece("drum-2", "stone", ["drum-1"]),
      piece("drum-3", "stone", ["drum-2"]),
      piece("lower-bowl", "stone", ["drum-3"]),
      piece("top-bowl", "stone", ["lower-bowl"]),
      piece("finial", "stone", ["top-bowl"]),
      piece("water", "water", ["basin", "lower-bowl", "top-bowl", "finial"]),
    ],
  },
  {
    id: "arch",
    name: "Garden Arch",
    pieces: [
      piece("footings", "stone"),
      piece("pillars-1", "stone", ["footings"]),
      piece("pillars-2", "stone", ["pillars-1"]),
      piece("pillars-3", "stone", ["pillars-2"]),
      piece("springers", "stone", ["pillars-3"]),
      piece("keystone", "stone", ["springers"], { halfKey: "frame" }),
      piece("roses-sprout", "plant", [], { stage: "sprout" }),
      piece("roses-climb", "plant", ["roses-sprout", "keystone"], { stage: "leaves" }),
      piece("roses-bloom", "plant", ["roses-climb"], { stage: "bloom" }),
    ],
  },
  {
    id: "rabbit",
    name: "Stone Rabbit",
    pieces: [
      piece("base", "stone"),
      piece("step-1", "stone", ["base"]),
      piece("step-2", "stone", ["step-1"]),
      piece("clover-sprout", "plant", [], { stage: "sprout" }),
      piece("clover-bloom", "plant", ["clover-sprout"], { stage: "bloom" }),
      piece("rabbit", "creature", ["step-2"]),
    ],
  },
];

export const KINDS = ["stone", "water", "plant", "creature"];

// Pieces in a sculpture (or a sculpture item from sculptureView).
export function piecesOf(sc) {
  return (sc.sculpture || sc).pieces.length;
}

// Pieces in one whole round of the set.
export const ROUND_PIECES = SCULPTURES.reduce((n, sc) => n + sc.pieces.length, 0);

export function emptySculpture() {
  return { v: 2, halves: 0 };
}

function item(index) {
  const n = SCULPTURES.length;
  const round = Math.floor(index / n);
  const sc = SCULPTURES[index % n];
  return { index, sculpture: sc, gold: round > 0, round, name: round > 0 ? `Gold ${sc.name}` : sc.name, total: sc.pieces.length };
}

// Whole pieces before sculpture number `index` (counting every round).
function piecesBefore(index) {
  const n = SCULPTURES.length;
  const rounds = Math.floor(index / n);
  let p = rounds * ROUND_PIECES;
  for (let i = 0; i < index % n; i++) p += SCULPTURES[i].pieces.length;
  return p;
}

// Which sculpture the p-th whole piece (0-based) belongs to, and where in it.
function locate(p) {
  const n = SCULPTURES.length;
  const rounds = Math.floor(p / ROUND_PIECES);
  let rest = p - rounds * ROUND_PIECES;
  let i = 0;
  while (rest >= SCULPTURES[i].pieces.length) {
    rest -= SCULPTURES[i].pieces.length;
    i++;
  }
  return { index: rounds * n + i, at: rest };
}

export function sculptureView(state) {
  const halves = Math.max(0, Math.floor((state && state.halves) || 0));
  const pieces = Math.floor(halves / 2);
  const { index, at } = locate(pieces);
  const finished = [];
  for (let i = 0; i < index; i++) finished.push(item(i));
  return { current: { ...item(index), built: at, half: halves % 2 === 1 }, finished, pieces, halves };
}

// Add a visit's reward (in half pieces). Returns the new state and what it did:
// placed: the piece completed by this reward ({ ...item, partIndex, part }) or null;
// finished: the sculpture this reward finished, or null; half: a half piece is now waiting.
export function addHalves(state, halves) {
  const before = sculptureView(state);
  const next = { ...emptySculpture(), ...state, halves: before.halves + Math.max(0, halves) };
  const after = sculptureView(next);
  let placed = null;
  let finished = null;
  if (after.pieces > before.pieces) {
    const { index, at } = locate(after.pieces - 1);
    const it = item(index);
    placed = { ...it, partIndex: at, part: it.sculpture.pieces[at] };
    if (at === it.total - 1) finished = it;
  }
  return { sculpture: next, before, after, placed, finished, half: after.current.half };
}

// Halves that finish the sculpture being built (for the owner's test tools).
export function halvesToFinish(state) {
  const v = sculptureView(state);
  return 2 * (piecesBefore(v.current.index) + v.current.total) - v.halves;
}

// Halves that start the gold round (every sculpture finished once).
export const GOLD_START = 2 * ROUND_PIECES;

// The first version had six pieces to every sculpture. Keep what was
// finished finished, and the pieces of the one being built (always fewer
// than the new count), and a waiting half.
export function migrateSculpture(old) {
  if (!old || typeof old !== "object") return emptySculpture();
  if (old.v === 2) return { ...emptySculpture(), ...old };
  const halves = Math.max(0, Math.floor(old.halves || 0));
  const pieces = Math.floor(halves / 2);
  const done = Math.floor(pieces / 6);
  const within = pieces % 6;
  return { v: 2, halves: 2 * (piecesBefore(done) + within) + (halves % 2) };
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
// reads names it before then. The gold round repeats ones already finished,
// so those may be named. No numbers either: progress is the thing itself,
// standing in the garden, and a few plain words.

export const SURPRISE_NAME = "New sculpture";

export function isRevealed(item) {
  return !!(item && item.gold);
}

export function displayName(item) {
  return isRevealed(item) ? item.name : SURPRISE_NAME;
}

// What the sculpture being built looks like right now, as a key the skin
// turns into words:
//   start     nothing carved yet
//   rough     half of a stone or water piece is in
//   frame     the wooden frame that holds up an arch while its top goes on
//   sprouting half of a plant's first piece: a small sprout
//   bud       half of a later plant piece: a closed bud or a few leaves
//   waiting   half of a creature's piece: something set out for it
//   base      the first piece is in
//   stone     a stone piece was the last one in
//   water     water was the last one in
//   sprout    a plant has come up
//   leaves    a plant has grown leaves
//   bloom     a plant has bloomed
//   oneMore   just one more piece to go
export function stageKey(current) {
  const pieces = current.sculpture.pieces;
  if (current.half) {
    const next = pieces[current.built];
    if (next.halfKey) return next.halfKey;
    if (next.kind === "creature") return "waiting";
    if (next.kind === "plant") return next.stage === "sprout" ? "sprouting" : "bud";
    return "rough";
  }
  if (current.built === 0) return "start";
  if (current.built === pieces.length - 1) return "oneMore";
  const last = pieces[current.built - 1];
  if (current.built === 1) return "base";
  if (last.kind === "plant") return last.stage === "sprout" ? "sprout" : last.stage === "leaves" ? "leaves" : "bloom";
  if (last.kind === "water") return "water";
  return "stone";
}

// The plain line for the sculpture being built, in the skin's words.
export function progressWords(current, asker) {
  const line = asker.progress[stageKey(current)];
  return isRevealed(current) ? `${current.name}: ${line}` : line;
}

const article = (name) => (/^[AEIOU]/i.test(name) ? "an" : "a");

// The words after a right answer, from addHalves()'s result, in the skin's
// words. { title, line, note, reveal }: reveal is set only when a sculpture
// is finished.
export function rewardText(add, { firstTry, asker }) {
  const cur = add.after.current;
  if (add.finished) {
    const f = add.finished;
    const next = cur.gold && !f.gold ? asker.nextGold : isRevealed(cur) ? asker.nextNamed(cur.name) : asker.nextSurprise;
    return { title: `It's ${article(f.name)} ${f.name}!`, line: asker.staysForGood, note: next, reveal: f.name };
  }
  const now = progressWords(cur, asker);
  if (add.placed) {
    if (firstTry) return { title: asker.wholeTitle, line: now, note: "", reveal: null };
    return { title: asker.pairedTitle, line: now, note: asker.firstTryNote, reveal: null };
  }
  return { title: asker.halfTitle, line: now, note: "", reveal: null };
}

// The garden sphinx: it wakes after every few cleared boards and asks one
// myth-or-fact question per visit. Each right answer adds to a garden
// sculpture (see sculpture.js). It never blocks play: once awake it waits,
// however many boards are played, until the player chooses to visit.
//
// Which question, counted in questions asked (not days):
//   1. a question missed at the first try, once at least MISSED_GAP other
//      questions have been asked since; it keeps coming back until it is
//      answered right at the first try;
//   2. otherwise the next question never asked, in file order;
//   3. once all have been asked, the one asked longest ago, never one asked
//      within the last SPACING questions (if the pool is too small for that,
//      simply the one asked longest ago).
// The chosen question stays pinned until that visit is answered right.

export const WAKE_EVERY = 3; // cleared boards (any kind) per visit
export const MISSED_GAP = 3; // other questions before a missed one returns
export const SPACING = 6; // other questions before any other one returns

export function emptySphinx() {
  // recs: id -> { asked, missed, lastAt } where lastAt is the question number
  // (0, 1, 2, ...) when it was last asked. asked: questions asked so far.
  return { v: 2, recs: {}, asked: 0, boards: 0, awake: false, current: null };
}

const norm = (s) => ({ ...emptySphinx(), ...s });

// A cleared board. Returns the new state; woke is true when this board woke it.
export function recordBoard(sphinx) {
  const s = norm(sphinx);
  if (s.awake) return { sphinx: s, woke: false };
  const boards = s.boards + 1;
  if (boards >= WAKE_EVERY) return { sphinx: { ...s, boards: 0, awake: true }, woke: true };
  return { sphinx: { ...s, boards }, woke: false };
}

export function boardsUntilAwake(sphinx) {
  const s = norm(sphinx);
  return s.awake ? 0 : Math.max(1, WAKE_EVERY - s.boards);
}

// Other questions asked since this record's last asking.
const since = (s, r) => s.asked - 1 - r.lastAt;

export function chooseQuestion(sphinx, questions) {
  const s = norm(sphinx);
  if (s.current) {
    const pinned = questions.find((q) => q.id === s.current.id);
    if (pinned) return pinned;
  }
  const rec = (q) => s.recs[q.id];
  const oldest = (list) => list.slice().sort((a, b) => rec(a).lastAt - rec(b).lastAt)[0];
  const due = questions.filter((q) => rec(q) && rec(q).missed && since(s, rec(q)) >= MISSED_GAP);
  if (due.length) return oldest(due);
  const fresh = questions.find((q) => !rec(q));
  if (fresh) return fresh;
  const spaced = questions.filter((q) => !rec(q).missed && since(s, rec(q)) >= SPACING);
  if (spaced.length) return oldest(spaced);
  return oldest(questions);
}

// Opening the sphinx while awake pins its question. started is true when
// this opened a new visit (not a reopen of one already pinned).
export function startVisit(sphinx, questions) {
  const s = norm(sphinx);
  if (!s.awake) return { sphinx: s, question: null, started: false };
  const q = chooseQuestion(s, questions);
  if (s.current && s.current.id === q.id) return { sphinx: s, question: q, started: false };
  return { sphinx: { ...s, current: { id: q.id, tries: 0 } }, question: q, started: true };
}

// choice is "myth" or "fact". Returns { correct, firstTry, halves, sphinx, question }.
// halves: sculpture reward in half pieces (2 = a whole piece at the first try,
// 1 = half a piece on a later try, 0 = wrong).
export function answer(sphinx, questions, choice) {
  let s = norm(sphinx);
  if (!s.awake) return { correct: false, firstTry: false, halves: 0, sphinx: s, question: null, asleep: true };
  s = startVisit(s, questions).sphinx;
  const q = chooseQuestion(s, questions);
  const cur = { ...s.current };
  const recs = { ...s.recs };
  const correct = choice === q.answer;
  let asked = s.asked;
  if (cur.tries === 0) {
    const prev = recs[q.id] || { asked: 0, missed: false, lastAt: null };
    recs[q.id] = { asked: prev.asked + 1, missed: !correct, lastAt: asked };
    asked += 1;
  }
  cur.tries += 1;
  const firstTry = cur.tries === 1;
  if (!correct) return { correct, firstTry, halves: 0, question: q, sphinx: { ...s, recs, asked, current: cur } };
  return {
    correct,
    firstTry,
    halves: firstTry ? 2 : 1,
    question: q,
    sphinx: { ...s, recs, asked, current: null, awake: false, boards: 0 },
  };
}

// Saves from the first version kept { recs: { id: { asked, missed, due,
// lastAsked(day) } }, today, chestDay } and one question a day. Keep what
// was asked and missed, in the order it was asked; the sphinx starts asleep.
export function migrateSphinx(old) {
  if (!old || typeof old !== "object") return emptySphinx();
  if (old.v === 2) return norm(old);
  const recs = old.recs || {};
  const ids = Object.keys(recs).sort((a, b) => (recs[a].lastAsked ?? 0) - (recs[b].lastAsked ?? 0));
  const out = emptySphinx();
  ids.forEach((id, i) => {
    out.recs[id] = { asked: recs[id].asked || 1, missed: !!recs[id].missed, lastAt: i };
  });
  out.asked = ids.length;
  return out;
}
